"""FastAPI backend for the Cloud-Hosted Telegram AI Auto-Reply System."""

from __future__ import annotations

import logging
import os
import shutil
import time
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, FastAPI, HTTPException, Request, Response, status
from fastapi.responses import HTMLResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from app.ai_engine import AIEngine
from app.config import Settings, load_settings
from app.database import Database
from app.events import EventBus
from app.scheduler import ReplyScheduler
from app.security import (
    LoginRateLimiter,
    SecretBox,
    SessionManager,
    get_client_ip,
    verify_cloudflare_access_headers,
    verify_password,
    verify_totp,
)
from app.telegram_service import TelegramService

START_MONOTONIC = time.monotonic()


# ----------------------------------------------------------------------
# Request Schemas
# ----------------------------------------------------------------------
class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=64)
    password: str = Field(min_length=1, max_length=256)
    totp_code: str = Field(default="", max_length=12)


class ContactUpdateRequest(BaseModel):
    approval_status: str | None = Field(default=None, pattern="^(pending|approved|rejected|blocked)$")
    is_paused: bool | None = None
    persona: str | None = Field(default=None, max_length=2000)
    language_pref: str | None = Field(default=None, pattern="^(auto|english|filipino|taglish|hiligaynon)$")
    response_length: str | None = Field(default=None, pattern="^(short|medium)$")
    min_delay_sec: int | None = Field(default=None, ge=5, le=600)
    max_delay_sec: int | None = Field(default=None, ge=5, le=900)
    max_replies: int | None = Field(default=None, ge=1, le=500)
    typing_indicator: bool | None = None
    notes: str | None = Field(default=None, max_length=1000)


class SettingsUpdateRequest(BaseModel):
    emergency_stop: bool | None = None
    dry_run: bool | None = None
    ai_provider: str | None = Field(default=None, pattern="^(gemini|custom)$")
    ai_model: str | None = Field(default=None, min_length=2, max_length=120)
    default_persona: str | None = Field(default=None, min_length=5, max_length=2000)
    default_language: str | None = Field(default=None, pattern="^(auto|english|filipino|taglish|hiligaynon)$")
    default_response_length: str | None = Field(default=None, pattern="^(short|medium)$")
    default_memory_limit: int | None = Field(default=None, ge=4, le=40)
    daily_request_limit: int | None = Field(default=None, ge=1, le=5000)
    daily_token_limit: int | None = Field(default=None, ge=1000, le=2000000)
    rpm_limit: int | None = Field(default=None, ge=1, le=60)
    quota_warn_percent: int | None = Field(default=None, ge=10, le=99)


class EmergencyStopRequest(BaseModel):
    active: bool


class TelegramPhoneRequest(BaseModel):
    phone: str = Field(min_length=6, max_length=24)


class TelegramCodeRequest(BaseModel):
    code: str = Field(min_length=3, max_length=12)
    password_2fa: str = Field(default="", max_length=256)


class Telegram2FARequest(BaseModel):
    password_2fa: str = Field(min_length=1, max_length=256)


# ----------------------------------------------------------------------
# Application Factory
# ----------------------------------------------------------------------
def create_app(
    settings: Settings | None = None,
    enable_telegram: bool = True,
) -> FastAPI:
    cfg = settings or load_settings()
    logging.basicConfig(
        level=getattr(logging, cfg.log_level, logging.INFO),
        format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
    )

    db = Database(cfg.db_path)
    secret_box = SecretBox(cfg.session_encryption_key)
    events = EventBus()
    ai_engine = AIEngine(cfg, db)
    telegram_service = TelegramService(cfg, db, secret_box, events)
    scheduler = ReplyScheduler(
        db=db,
        ai=ai_engine,
        events=events,
        send_callback=telegram_service.send_private_message,
    )
    session_mgr = SessionManager(
        secret=cfg.session_secret or "dev-insecure-change-me-immediately-please",
        ttl_seconds=cfg.session_ttl_seconds,
    )
    rate_limiter = LoginRateLimiter(max_attempts=6, window_seconds=300)

    async def _on_incoming_approved(user_id: int, text: str, msg_id: int | None) -> None:
        await scheduler.schedule_reply(user_id, text, trigger_message_id=msg_id)

    telegram_service.set_incoming_callback(_on_incoming_approved)

    @asynccontextmanager
    async def lifespan(_app: FastAPI):
        db.initialize(
            defaults={
                "dry_run": cfg.dry_run,
                "ai_model": cfg.gemini_model,
                "daily_request_limit": cfg.daily_request_limit,
                "daily_token_limit": cfg.daily_token_limit,
                "rpm_limit": cfg.rpm_limit,
                "quota_warn_percent": cfg.quota_warn_percent,
            }
        )
        if enable_telegram:
            await telegram_service.start()
        try:
            yield
        finally:
            await scheduler.cancel_all()
            if enable_telegram:
                await telegram_service.stop()
            db.close()

    app = FastAPI(
        title="Telegram AI Auto-Reply Dashboard",
        docs_url=None,
        redoc_url=None,
        openapi_url=None,
        lifespan=lifespan,
    )

    app.state.settings = cfg
    app.state.db = db
    app.state.ai = ai_engine
    app.state.telegram = telegram_service
    app.state.scheduler = scheduler
    app.state.events = events

    # ------------------------------------------------------------------
    # Security Headers Middleware
    # ------------------------------------------------------------------
    @app.middleware("http")
    async def security_headers_middleware(request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data:; "
            "connect-src 'self'; "
            "frame-ancestors 'none'; "
            "base-uri 'self';"
        )
        if "/api/" in request.url.path:
            response.headers["Cache-Control"] = "no-store"
        return response

    # ------------------------------------------------------------------
    # Auth Dependencies
    # ------------------------------------------------------------------
    def require_auth(request: Request) -> dict[str, Any]:
        verify_cloudflare_access_headers(
            request, cfg.require_cloudflare_access, cfg.cf_access_aud
        )
        token = request.cookies.get(SessionManager.COOKIE_NAME)
        session = session_mgr.verify_session(token)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required.",
            )
        if request.method in {"POST", "PUT", "PATCH", "DELETE"}:
            csrf_header = request.headers.get("X-CSRF-Token", "")
            if not csrf_header or csrf_header != session.get("csrf"):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Invalid or missing CSRF token.",
                )
        return session

    # ------------------------------------------------------------------
    # Router (mounted at BASE_PATH, e.g. /tg or "")
    # ------------------------------------------------------------------
    router = APIRouter(prefix=cfg.base_path)
    static_dir = Path(__file__).resolve().parent / "static"

    @router.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    @router.get("/", response_class=HTMLResponse)
    @router.get("", response_class=HTMLResponse)
    async def index_page() -> HTMLResponse:
        html_path = static_dir / "index.html"
        content = html_path.read_text(encoding="utf-8")
        # Inject base path meta so frontend works seamlessly at /tg or /
        base_tag = f'<meta name="app-base-path" content="{cfg.base_path}" />'
        content = content.replace("<!-- APP_BASE_META -->", base_tag, 1)
        return HTMLResponse(content=content)

    # ---- Auth Endpoints ----
    @router.get("/api/auth/status")
    async def auth_status(request: Request) -> dict[str, Any]:
        verify_cloudflare_access_headers(
            request, cfg.require_cloudflare_access, cfg.cf_access_aud
        )
        token = request.cookies.get(SessionManager.COOKIE_NAME)
        session = session_mgr.verify_session(token)
        return {
            "authenticated": bool(session),
            "username": session["u"] if session else None,
            "csrf_token": session["csrf"] if session else None,
            "totp_required": bool(cfg.admin_totp_secret),
            "password_configured": bool(cfg.admin_password_hash),
        }

    @router.post("/api/auth/login")
    async def auth_login(
        body: LoginRequest, request: Request, response: Response
    ) -> dict[str, Any]:
        verify_cloudflare_access_headers(
            request, cfg.require_cloudflare_access, cfg.cf_access_aud
        )
        client_ip = get_client_ip(request, cfg.trusted_proxy_ips)
        rate_limiter.check_allowed(client_ip)

        if not cfg.admin_password_hash:
            raise HTTPException(
                status_code=503,
                detail="Admin password is not configured on the server. Run scripts/init_db.py.",
            )

        user_ok = body.username == cfg.admin_username
        pass_ok = verify_password(body.password, cfg.admin_password_hash)
        totp_ok = verify_totp(cfg.admin_totp_secret, body.totp_code)

        if not (user_ok and pass_ok and totp_ok):
            rate_limiter.record_failure(client_ip)
            await db.add_audit_log("anonymous", "login_failed", client_ip, "Invalid credentials")
            raise HTTPException(status_code=401, detail="Invalid username, password, or 2FA code.")

        rate_limiter.reset(client_ip)
        token, csrf_token = session_mgr.create_session(cfg.admin_username)
        cookie_path = cfg.base_path or "/"
        response.set_cookie(
            key=SessionManager.COOKIE_NAME,
            value=token,
            max_age=cfg.session_ttl_seconds,
            httponly=True,
            secure=cfg.cookie_secure,
            samesite="lax",
            path=cookie_path,
        )
        await db.add_audit_log(cfg.admin_username, "login_success", client_ip, "Dashboard login")
        return {"authenticated": True, "username": cfg.admin_username, "csrf_token": csrf_token}

    @router.post("/api/auth/logout")
    async def auth_logout(
        response: Response, _session: dict[str, Any] = Depends(require_auth)
    ) -> dict[str, bool]:
        cookie_path = cfg.base_path or "/"
        response.delete_cookie(key=SessionManager.COOKIE_NAME, path=cookie_path)
        return {"ok": True}

    # ---- Overview & SSE ----
    @router.get("/api/overview")
    async def get_overview(_session: dict[str, Any] = Depends(require_auth)) -> dict[str, Any]:
        sys_cfg = await db.get_all_config()
        stats = await db.get_overview_stats()
        quota = await ai_engine.get_quota_status(sys_cfg)
        pending = await db.list_pending_replies()
        disk = shutil.disk_usage(cfg.db_path.parent)
        load_avg = os.getloadavg()[0] if hasattr(os, "getloadavg") else 0.0

        return {
            "telegram": telegram_service.status(),
            "ai": ai_engine.provider_status(sys_cfg),
            "quota": quota,
            "stats": stats,
            "pending_replies": pending,
            "system": {
                "emergency_stop": bool(sys_cfg.get("emergency_stop", False)),
                "dry_run": bool(sys_cfg.get("dry_run", True)),
                "uptime_seconds": int(time.monotonic() - START_MONOTONIC),
                "load_1m": round(load_avg, 2),
                "disk_free_mb": round(disk.free / (1024 * 1024), 1),
                "db_size_kb": round(cfg.db_path.stat().st_size / 1024, 1)
                if cfg.db_path.exists()
                else 0,
            },
        }

    @router.get("/api/events")
    async def sse_events(_session: dict[str, Any] = Depends(require_auth)) -> StreamingResponse:
        return StreamingResponse(
            events.subscribe(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
                "Connection": "keep-alive",
            },
        )

    # ---- Contacts & Conversations ----
    @router.get("/api/contacts")
    async def list_contacts(
        status_filter: str | None = None,
        _session: dict[str, Any] = Depends(require_auth),
    ) -> dict[str, Any]:
        contacts = await db.list_contacts(status_filter)
        return {"contacts": contacts}

    @router.patch("/api/contacts/{user_id}")
    async def update_contact(
        user_id: int,
        body: ContactUpdateRequest,
        session: dict[str, Any] = Depends(require_auth),
    ) -> dict[str, Any]:
        existing = await db.get_contact(user_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Contact not found.")

        updates = body.model_dump(exclude_none=True)
        if "is_paused" in updates:
            updates["is_paused"] = 1 if updates["is_paused"] else 0
        if "typing_indicator" in updates:
            updates["typing_indicator"] = 1 if updates["typing_indicator"] else 0

        min_d = updates.get("min_delay_sec", existing["min_delay_sec"])
        max_d = updates.get("max_delay_sec", existing["max_delay_sec"])
        if min_d > max_d:
            raise HTTPException(
                status_code=400, detail="min_delay_sec cannot exceed max_delay_sec."
            )

        updated = await db.update_contact(user_id, updates)
        if (
            updates.get("approval_status") in {"rejected", "blocked", "pending"}
            or updates.get("is_paused") == 1
        ):
            await scheduler.cancel_contact(user_id)

        await db.add_audit_log(
            session["u"],
            "contact_updated",
            str(user_id),
            ", ".join(f"{k}={v}" for k, v in updates.items()),
        )
        await events.publish("contact_updated", {"telegram_user_id": user_id})
        return {"contact": updated}

    @router.get("/api/contacts/{user_id}/messages")
    async def get_messages(
        user_id: int,
        limit: int = 80,
        _session: dict[str, Any] = Depends(require_auth),
    ) -> dict[str, Any]:
        contact = await db.get_contact(user_id)
        if not contact:
            raise HTTPException(status_code=404, detail="Contact not found.")
        msgs = await db.get_conversation_messages(user_id, limit=min(200, max(1, limit)))
        return {"contact": contact, "messages": msgs}

    @router.post("/api/contacts/{user_id}/cancel-pending")
    async def cancel_pending_reply(
        user_id: int,
        session: dict[str, Any] = Depends(require_auth),
    ) -> dict[str, bool]:
        await scheduler.cancel_contact(user_id)
        await db.add_audit_log(session["u"], "pending_cancelled", str(user_id), "")
        return {"ok": True}

    # ---- AI & System Settings ----
    @router.get("/api/settings")
    async def get_settings(_session: dict[str, Any] = Depends(require_auth)) -> dict[str, Any]:
        sys_cfg = await db.get_all_config()
        # Never expose encrypted session string or secrets
        safe_cfg = {k: v for k, v in sys_cfg.items() if k != "telegram_session_encrypted"}
        safe_cfg["gemini_key_configured"] = bool(cfg.gemini_api_key)
        safe_cfg["custom_ai_configured"] = bool(cfg.custom_ai_base_url and cfg.custom_ai_model)
        safe_cfg["cloudflare_access_required"] = cfg.require_cloudflare_access
        return {"settings": safe_cfg}

    @router.patch("/api/settings")
    async def update_settings(
        body: SettingsUpdateRequest,
        session: dict[str, Any] = Depends(require_auth),
    ) -> dict[str, Any]:
        updates = body.model_dump(exclude_none=True)
        if updates:
            await db.set_many_config(updates)
            if updates.get("emergency_stop") is True:
                await scheduler.cancel_all()
            await db.add_audit_log(
                session["u"],
                "settings_updated",
                "system",
                ", ".join(updates.keys()),
            )
            await events.publish("settings_updated", {"keys": list(updates.keys())})
        return await get_settings(session)

    @router.post("/api/system/emergency-stop")
    async def emergency_stop(
        body: EmergencyStopRequest,
        session: dict[str, Any] = Depends(require_auth),
    ) -> dict[str, bool]:
        await db.set_config("emergency_stop", body.active)
        if body.active:
            await scheduler.cancel_all()
        await db.add_audit_log(
            session["u"],
            "emergency_stop_on" if body.active else "emergency_stop_off",
            "system",
            "",
        )
        await events.publish("emergency_stop", {"active": body.active})
        return {"emergency_stop": body.active}

    @router.post("/api/system/backup")
    async def create_backup(session: dict[str, Any] = Depends(require_auth)) -> dict[str, Any]:
        dest = await db.create_backup(cfg.backup_dir)
        backups = sorted(
            [p.name for p in cfg.backup_dir.glob("*.db")],
            reverse=True,
        )[:20]
        await db.add_audit_log(session["u"], "backup_created", dest.name, "")
        return {"created": dest.name, "backups": backups}

    @router.get("/api/system/backups")
    async def list_backups(_session: dict[str, Any] = Depends(require_auth)) -> dict[str, Any]:
        if not cfg.backup_dir.exists():
            return {"backups": []}
        backups = sorted(
            [
                {"name": p.name, "size_kb": round(p.stat().st_size / 1024, 1)}
                for p in cfg.backup_dir.glob("*.db")
            ],
            key=lambda x: x["name"],
            reverse=True,
        )[:20]
        return {"backups": backups}

    @router.get("/api/system/logs")
    async def get_logs(_session: dict[str, Any] = Depends(require_auth)) -> dict[str, Any]:
        logs = await db.get_audit_logs(limit=80)
        return {"logs": logs}

    # ---- Telegram Browser Onboarding & Session Management ----
    @router.post("/api/telegram/send-code")
    async def tg_send_code(
        body: TelegramPhoneRequest,
        session: dict[str, Any] = Depends(require_auth),
    ) -> dict[str, Any]:
        try:
            tg_status = await telegram_service.request_login_code(body.phone)
            return {"telegram": tg_status}
        except Exception as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    @router.post("/api/telegram/verify-code")
    async def tg_verify_code(
        body: TelegramCodeRequest,
        session: dict[str, Any] = Depends(require_auth),
    ) -> dict[str, Any]:
        try:
            tg_status = await telegram_service.verify_login_code(body.code, body.password_2fa)
            return {"telegram": tg_status}
        except Exception as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    @router.post("/api/telegram/verify-2fa")
    async def tg_verify_2fa(
        body: Telegram2FARequest,
        session: dict[str, Any] = Depends(require_auth),
    ) -> dict[str, Any]:
        try:
            tg_status = await telegram_service.submit_2fa_password(body.password_2fa)
            return {"telegram": tg_status}
        except Exception as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    @router.post("/api/telegram/revoke")
    async def tg_revoke(session: dict[str, Any] = Depends(require_auth)) -> dict[str, Any]:
        tg_status = await telegram_service.revoke_session()
        return {"telegram": tg_status}

    app.include_router(router)
    app.mount(
        f"{cfg.base_path}/static",
        StaticFiles(directory=str(static_dir)),
        name="static",
    )
    return app


app = create_app()
