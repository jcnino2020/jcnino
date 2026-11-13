"""Telethon user-account integration with encrypted StringSession, browser onboarding, and single listener."""

from __future__ import annotations

import asyncio
import logging
import random
from typing import Any, Awaitable, Callable

from telethon import TelegramClient, events
from telethon.errors import (
    FloodWaitError,
    PhoneCodeExpiredError,
    PhoneCodeInvalidError,
    SessionPasswordNeededError,
)
from telethon.sessions import StringSession
from telethon.tl.types import User

from app.config import Settings
from app.database import Database
from app.events import EventBus
from app.security import SecretBox

logger = logging.getLogger(__name__)

IncomingCallback = Callable[[int, str, int | None], Awaitable[None]]


class TelegramService:
    """Manages the single Telethon user client, browser onboarding, and reconnection."""

    def __init__(
        self,
        settings: Settings,
        db: Database,
        secret_box: SecretBox,
        events_bus: EventBus,
    ) -> None:
        self.settings = settings
        self.db = db
        self.secret_box = secret_box
        self.events = events_bus

        self._client: TelegramClient | None = None
        self._runner_task: asyncio.Task[None] | None = None
        self._on_approved_message: IncomingCallback | None = None
        self._lock = asyncio.Lock()

        # Ephemeral onboarding state (in memory only, never persisted or sent to AI)
        self._onboarding_phone: str = ""
        self._onboarding_phone_code_hash: str = ""
        self._awaiting_2fa: bool = False
        self._connected: bool = False
        self._authorized: bool = False
        self._me_info: dict[str, Any] | None = None
        self._last_error: str = ""

    def set_incoming_callback(self, callback: IncomingCallback) -> None:
        self._on_approved_message = callback

    def status(self) -> dict[str, Any]:
        return {
            "configured": bool(self.settings.telegram_api_id and self.settings.telegram_api_hash),
            "connected": self._connected,
            "authorized": self._authorized,
            "awaiting_code": bool(self._onboarding_phone_code_hash and not self._authorized),
            "awaiting_2fa": self._awaiting_2fa,
            "me": self._me_info,
            "last_error": self._last_error,
        }

    async def start(self) -> None:
        """Start the single Telegram listener if credentials and a saved session exist."""
        if not self.settings.telegram_api_id or not self.settings.telegram_api_hash:
            self._last_error = "TELEGRAM_API_ID / TELEGRAM_API_HASH not configured."
            logger.warning(self._last_error)
            return

        encrypted = await self.db.get_config("telegram_session_encrypted", "")
        if not encrypted:
            logger.info("No saved Telegram session yet. Waiting for browser onboarding.")
            return

        try:
            session_str = self.secret_box.decrypt(encrypted)
        except Exception as exc:
            self._last_error = f"Cannot decrypt saved Telegram session: {exc}"
            logger.error(self._last_error)
            return

        await self._launch_client(session_str)

    async def stop(self) -> None:
        if self._runner_task and not self._runner_task.done():
            self._runner_task.cancel()
            try:
                await self._runner_task
            except asyncio.CancelledError:
                pass
        if self._client:
            try:
                await self._client.disconnect()
            except Exception:
                pass
        self._connected = False

    async def _launch_client(self, session_str: str) -> None:
        async with self._lock:
            await self.stop()
            client = TelegramClient(
                StringSession(session_str),
                self.settings.telegram_api_id,
                self.settings.telegram_api_hash,
                connection_retries=5,
                retry_delay=3,
                auto_reconnect=True,
            )
            self._register_handlers(client)
            self._client = client
            self._runner_task = asyncio.create_task(
                self._run_supervised(client), name="telethon-listener"
            )

    def _register_handlers(self, client: TelegramClient) -> None:
        @client.on(events.NewMessage(incoming=True))
        async def handle_incoming(event: events.NewMessage.Event) -> None:
            try:
                if not event.is_private:
                    return
                sender = await event.get_sender()
                if not isinstance(sender, User) or sender.bot or sender.is_self:
                    return

                text = (event.raw_text or "").strip()
                if not text:
                    # Non-text media placeholder so contact is still tracked
                    text = "[Non-text message]"

                user_id = int(sender.id)
                username = sender.username or ""
                first_name = sender.first_name or ""
                last_name = sender.last_name or ""
                display_name = (
                    f"{first_name} {last_name}".strip()
                    or (f"@{username}" if username else f"User {user_id}")
                )

                contact = await self.db.upsert_contact_on_incoming(
                    telegram_user_id=user_id,
                    username=username,
                    first_name=first_name,
                    last_name=last_name,
                    display_name=display_name,
                    preview=text,
                )

                msg_id = int(event.message.id) if event.message else None
                inserted = await self.db.add_message(
                    telegram_user_id=user_id,
                    direction="incoming",
                    content=text,
                    telegram_message_id=msg_id,
                    is_ai_generated=False,
                    dry_run=False,
                )
                if inserted is None:
                    # Duplicate delivery guard
                    return

                await self.events.publish(
                    "incoming_message",
                    {
                        "telegram_user_id": user_id,
                        "display_name": display_name,
                        "approval_status": contact["approval_status"],
                        "preview": text[:100],
                    },
                )

                if (
                    contact["approval_status"] == "approved"
                    and not contact["is_paused"]
                    and self._on_approved_message is not None
                ):
                    await self._on_approved_message(user_id, text, msg_id)

            except Exception as exc:
                logger.exception("Error handling incoming Telegram message: %s", exc)

    async def _run_supervised(self, client: TelegramClient) -> None:
        backoff = 3.0
        while True:
            try:
                await client.connect()
                self._connected = client.is_connected()
                self._authorized = await client.is_user_authorized()
                if self._authorized:
                    me = await client.get_me()
                    self._me_info = {
                        "id": int(me.id),
                        "username": me.username or "",
                        "first_name": me.first_name or "",
                    }
                    self._last_error = ""
                    await self.events.publish("telegram_status", self.status())
                    backoff = 3.0
                    await client.run_until_disconnected()
                else:
                    self._last_error = "Telegram session is not authorized."
                    await self.events.publish("telegram_status", self.status())
                    return
            except asyncio.CancelledError:
                raise
            except FloodWaitError as exc:
                wait_sec = min(300, int(exc.seconds) + 2)
                self._last_error = f"Telegram FloodWait: pausing reconnect for {wait_sec}s"
                logger.warning(self._last_error)
                self._connected = False
                await self.events.publish("telegram_status", self.status())
                await asyncio.sleep(wait_sec)
            except Exception as exc:
                self._connected = False
                self._last_error = str(exc)
                logger.warning("Telegram connection dropped (%s). Retrying in %.1fs", exc, backoff)
                await self.events.publish("telegram_status", self.status())
                await asyncio.sleep(backoff)
                backoff = min(60.0, backoff * 2)

    # ------------------------------------------------------------------
    # Browser-based One-Time Onboarding
    # ------------------------------------------------------------------
    async def request_login_code(self, phone: str) -> dict[str, Any]:
        if not self.settings.telegram_api_id or not self.settings.telegram_api_hash:
            raise RuntimeError("TELEGRAM_API_ID and TELEGRAM_API_HASH must be set on the server.")
        cleaned_phone = phone.strip()
        if not cleaned_phone.startswith("+"):
            raise ValueError("Phone number must include country code (e.g. +639171234567).")

        await self.stop()
        client = TelegramClient(
            StringSession(),
            self.settings.telegram_api_id,
            self.settings.telegram_api_hash,
        )
        await client.connect()
        sent = await client.send_code_request(cleaned_phone)
        self._client = client
        self._connected = True
        self._authorized = False
        self._awaiting_2fa = False
        self._onboarding_phone = cleaned_phone
        self._onboarding_phone_code_hash = sent.phone_code_hash
        self._last_error = ""
        await self.db.add_audit_log("admin", "telegram_code_requested", "telegram", "Login code sent")
        return self.status()

    async def verify_login_code(self, code: str, password_2fa: str = "") -> dict[str, Any]:
        if not self._client or not self._onboarding_phone:
            raise RuntimeError("No active onboarding session. Request a login code first.")

        cleaned_code = code.strip().replace("-", "").replace(" ", "")
        try:
            if not self._awaiting_2fa:
                await self._client.sign_in(
                    phone=self._onboarding_phone,
                    code=cleaned_code,
                    phone_code_hash=self._onboarding_phone_code_hash,
                )
            else:
                if not password_2fa:
                    raise ValueError("Two-step verification password is required.")
                await self._client.sign_in(password=password_2fa)
        except SessionPasswordNeededError:
            self._awaiting_2fa = True
            if password_2fa:
                await self._client.sign_in(password=password_2fa)
            else:
                return self.status()
        except (PhoneCodeInvalidError, PhoneCodeExpiredError) as exc:
            raise ValueError(f"Telegram code error: {exc}") from exc

        # Persist encrypted StringSession and start supervised listener
        raw_session = self._client.session.save()
        encrypted = self.secret_box.encrypt(raw_session)
        await self.db.set_config("telegram_session_encrypted", encrypted)

        self._onboarding_phone = ""
        self._onboarding_phone_code_hash = ""
        self._awaiting_2fa = False

        await self.db.add_audit_log("admin", "telegram_authenticated", "telegram", "Session saved encrypted")
        await self._launch_client(raw_session)
        return self.status()

    async def submit_2fa_password(self, password_2fa: str) -> dict[str, Any]:
        if not self._client or not self._awaiting_2fa:
            raise RuntimeError("Two-step verification is not currently pending.")
        await self._client.sign_in(password=password_2fa)
        raw_session = self._client.session.save()
        encrypted = self.secret_box.encrypt(raw_session)
        await self.db.set_config("telegram_session_encrypted", encrypted)
        self._onboarding_phone = ""
        self._onboarding_phone_code_hash = ""
        self._awaiting_2fa = False
        await self.db.add_audit_log("admin", "telegram_2fa_authenticated", "telegram", "Session saved encrypted")
        await self._launch_client(raw_session)
        return self.status()

    async def revoke_session(self) -> dict[str, Any]:
        if self._client:
            try:
                if await self._client.is_user_authorized():
                    await self._client.log_out()
            except Exception as exc:
                logger.warning("Telegram log_out warning: %s", exc)
        await self.stop()
        await self.db.set_config("telegram_session_encrypted", "")
        self._authorized = False
        self._me_info = None
        self._onboarding_phone = ""
        self._onboarding_phone_code_hash = ""
        self._awaiting_2fa = False
        await self.db.add_audit_log("admin", "telegram_session_revoked", "telegram", "Session cleared")
        await self.events.publish("telegram_status", self.status())
        return self.status()

    # ------------------------------------------------------------------
    # Sending Replies (with optional typing indicator & FloodWait handling)
    # ------------------------------------------------------------------
    async def send_private_message(
        self, telegram_user_id: int, text: str, use_typing: bool = True
    ) -> int | None:
        if not self._client or not self._authorized:
            raise RuntimeError("Telegram client is not connected/authorized.")

        try:
            if use_typing:
                typing_secs = min(4.5, max(1.2, len(text) * 0.04 + random.uniform(0.3, 1.0)))
                async with self._client.action(telegram_user_id, "typing"):
                    await asyncio.sleep(typing_secs)

            sent = await self._client.send_message(telegram_user_id, text)
            return int(sent.id) if sent else None
        except FloodWaitError as exc:
            logger.warning("FloodWait when sending to %s: %ss", telegram_user_id, exc.seconds)
            raise RuntimeError(f"Telegram rate limit (FloodWait {exc.seconds}s).") from exc
