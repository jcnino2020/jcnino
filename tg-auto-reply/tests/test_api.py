from __future__ import annotations

from pathlib import Path

from cryptography.fernet import Fernet
from fastapi.testclient import TestClient

from app.config import Settings
from app.main import create_app
from app.security import hash_password


def _make_settings(tmp_path: Path) -> Settings:
    return Settings(
        base_path="/tg",
        app_host="127.0.0.1",
        app_port=8080,
        trusted_proxy_ips=("127.0.0.1", "::1"),
        session_secret="test-session-secret-key-at-least-32-chars",
        session_encryption_key=Fernet.generate_key().decode("ascii"),
        admin_username="admin",
        admin_password_hash=hash_password("TestPassword123!"),
        admin_totp_secret="",
        cookie_secure=False,
        session_ttl_seconds=3600,
        require_cloudflare_access=False,
        cf_access_team_domain="",
        cf_access_aud="",
        telegram_api_id=0,
        telegram_api_hash="",
        gemini_api_key="",
        gemini_model="gemini-2.5-flash",
        custom_ai_base_url="",
        custom_ai_api_key="",
        custom_ai_model="",
        daily_request_limit=100,
        daily_token_limit=50000,
        rpm_limit=10,
        quota_warn_percent=80,
        db_path=tmp_path / "api_test.db",
        backup_dir=tmp_path / "backups",
        log_level="WARNING",
        dry_run=True,
    )


def test_auth_csrf_and_dashboard_endpoints(tmp_path: Path) -> None:
    app = create_app(settings=_make_settings(tmp_path), enable_telegram=False)
    with TestClient(app) as client:
        # Health endpoint works
        assert client.get("/tg/health").status_code == 200

        # Protected endpoints reject unauthenticated callers
        assert client.get("/tg/api/overview").status_code == 401
        assert client.get("/tg/api/contacts").status_code == 401

        # Login succeeds and returns CSRF token
        login_res = client.post(
            "/tg/api/auth/login",
            json={"username": "admin", "password": "TestPassword123!", "totp_code": ""},
        )
        assert login_res.status_code == 200
        csrf = login_res.json()["csrf_token"]

        # Mutating call without CSRF fails
        no_csrf = client.post("/tg/api/system/emergency-stop", json={"active": True})
        assert no_csrf.status_code == 403

        # Mutating call with CSRF succeeds
        headers = {"X-CSRF-Token": csrf}
        stop_res = client.post(
            "/tg/api/system/emergency-stop", json={"active": True}, headers=headers
        )
        assert stop_res.status_code == 200
        assert stop_res.json()["emergency_stop"] is True

        # Overview reflects emergency stop
        ov = client.get("/tg/api/overview").json()
        assert ov["system"]["emergency_stop"] is True

        # Backup creation works
        bk = client.post("/tg/api/system/backup", headers=headers)
        assert bk.status_code == 200
        assert len(bk.json()["backups"]) == 1
