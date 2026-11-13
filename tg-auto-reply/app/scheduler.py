"""Per-contact asynchronous reply scheduler with human-like randomized delays and debouncing."""

from __future__ import annotations

import asyncio
import logging
import random
from datetime import datetime, timedelta, timezone
from typing import Any, Awaitable, Callable

from app.ai_engine import AIEngine, QuotaExceededError
from app.database import Database
from app.events import EventBus

logger = logging.getLogger(__name__)

SendCallback = Callable[[int, str, bool], Awaitable[int | None]]


class ReplyScheduler:
    """Schedules independent, debounced, human-timed AI replies per Telegram user."""

    def __init__(
        self,
        db: Database,
        ai: AIEngine,
        events: EventBus,
        send_callback: SendCallback,
    ) -> None:
        self.db = db
        self.ai = ai
        self.events = events
        self.send_callback = send_callback
        self._tasks: dict[int, asyncio.Task[None]] = {}
        self._contact_locks: dict[int, asyncio.Lock] = {}
        self._registry_lock = asyncio.Lock()

    def _lock_for(self, user_id: int) -> asyncio.Lock:
        lock = self._contact_locks.get(user_id)
        if lock is None:
            lock = asyncio.Lock()
            self._contact_locks[user_id] = lock
        return lock

    @staticmethod
    def compute_delay_seconds(
        min_delay: int, max_delay: int, message_text: str
    ) -> float:
        low = max(1, int(min_delay))
        high = max(low, int(max_delay))
        base = random.uniform(low, high)
        # Additional reading/thinking time proportional to incoming message length (up to +20s)
        length_bonus = min(20.0, len(message_text.strip()) * 0.08)
        return round(base + length_bonus, 2)

    async def schedule_reply(
        self,
        telegram_user_id: int,
        incoming_text: str,
        trigger_message_id: int | None = None,
        delay_override: float | None = None,
    ) -> float | None:
        """Schedule (or reschedule/debounce) a pending reply for one approved contact."""
        contact = await self.db.get_contact(telegram_user_id)
        if not contact:
            return None
        if contact["approval_status"] != "approved" or contact["is_paused"]:
            return None

        config = await self.db.get_all_config()
        if config.get("emergency_stop", False):
            return None

        if int(contact["reply_count"]) >= int(contact["max_replies"]):
            logger.info("Contact %s reached max_replies (%s).", telegram_user_id, contact["max_replies"])
            return None

        delay = (
            float(delay_override)
            if delay_override is not None
            else self.compute_delay_seconds(
                contact["min_delay_sec"], contact["max_delay_sec"], incoming_text
            )
        )
        scheduled_for = (datetime.now(timezone.utc) + timedelta(seconds=delay)).isoformat()

        async with self._registry_lock:
            existing = self._tasks.pop(telegram_user_id, None)
            if existing and not existing.done():
                existing.cancel()

            await self.db.set_pending_reply(
                telegram_user_id=telegram_user_id,
                scheduled_for=scheduled_for,
                trigger_message_id=trigger_message_id,
                status="scheduled",
            )

            task = asyncio.create_task(
                self._run_delayed_reply(telegram_user_id, delay, trigger_message_id),
                name=f"reply-{telegram_user_id}",
            )
            self._tasks[telegram_user_id] = task

        await self.events.publish(
            "pending_updated",
            {"telegram_user_id": telegram_user_id, "scheduled_for": scheduled_for},
        )
        return delay

    async def cancel_contact(self, telegram_user_id: int) -> None:
        async with self._registry_lock:
            task = self._tasks.pop(telegram_user_id, None)
            if task and not task.done():
                task.cancel()
        await self.db.clear_pending_reply(telegram_user_id)
        await self.events.publish("pending_updated", {"telegram_user_id": telegram_user_id})

    async def cancel_all(self) -> None:
        async with self._registry_lock:
            tasks = list(self._tasks.values())
            self._tasks.clear()
        for task in tasks:
            if not task.done():
                task.cancel()
        for task in tasks:
            try:
                await task
            except asyncio.CancelledError:
                pass

    async def _run_delayed_reply(
        self,
        telegram_user_id: int,
        delay: float,
        trigger_message_id: int | None,
    ) -> None:
        try:
            await asyncio.sleep(delay)
            async with self._lock_for(telegram_user_id):
                contact = await self.db.get_contact(telegram_user_id)
                config = await self.db.get_all_config()

                if (
                    not contact
                    or contact["approval_status"] != "approved"
                    or contact["is_paused"]
                    or config.get("emergency_stop", False)
                    or int(contact["reply_count"]) >= int(contact["max_replies"])
                ):
                    await self.db.clear_pending_reply(telegram_user_id)
                    return

                await self.db.set_pending_reply(
                    telegram_user_id=telegram_user_id,
                    scheduled_for=datetime.now(timezone.utc).isoformat(),
                    trigger_message_id=trigger_message_id,
                    status="processing",
                )

                mem_limit = max(4, min(40, int(config.get("default_memory_limit", 16))))
                history = await self.db.get_conversation_messages(telegram_user_id, limit=mem_limit)
                if not history:
                    await self.db.clear_pending_reply(telegram_user_id)
                    return

                result = await self.ai.generate_reply(contact, history, config)
                is_dry_run = bool(config.get("dry_run", True))

                # Re-check emergency stop / pause right before sending
                latest_cfg = await self.db.get_all_config()
                latest_contact = await self.db.get_contact(telegram_user_id)
                if (
                    latest_cfg.get("emergency_stop", False)
                    or not latest_contact
                    or latest_contact["approval_status"] != "approved"
                    or latest_contact["is_paused"]
                ):
                    await self.db.clear_pending_reply(telegram_user_id)
                    return

                tg_msg_id: int | None = None
                if not is_dry_run:
                    use_typing = bool(latest_contact.get("typing_indicator", 1))
                    tg_msg_id = await self.send_callback(
                        telegram_user_id, result.text, use_typing
                    )

                await self.db.add_message(
                    telegram_user_id=telegram_user_id,
                    direction="outgoing",
                    content=result.text,
                    telegram_message_id=tg_msg_id,
                    is_ai_generated=True,
                    dry_run=is_dry_run,
                )
                await self.db.increment_contact_reply_count(telegram_user_id)
                await self.db.clear_pending_reply(telegram_user_id)

                await self.events.publish(
                    "message_sent",
                    {
                        "telegram_user_id": telegram_user_id,
                        "dry_run": is_dry_run,
                        "preview": result.text[:100],
                    },
                )
        except asyncio.CancelledError:
            logger.debug("Pending reply cancelled for contact %s", telegram_user_id)
            raise
        except QuotaExceededError as exc:
            logger.warning("Reply skipped due to quota for %s: %s", telegram_user_id, exc)
            await self.db.add_audit_log("system", "quota_blocked", str(telegram_user_id), str(exc))
            await self.db.clear_pending_reply(telegram_user_id)
            await self.events.publish("quota_warning", {"message": str(exc)})
        except Exception as exc:
            logger.exception("Error executing delayed reply for %s: %s", telegram_user_id, exc)
            await self.db.add_audit_log("system", "reply_error", str(telegram_user_id), str(exc))
            await self.db.clear_pending_reply(telegram_user_id)
        finally:
            async with self._registry_lock:
                current = self._tasks.get(telegram_user_id)
                if current is asyncio.current_task():
                    self._tasks.pop(telegram_user_id, None)
