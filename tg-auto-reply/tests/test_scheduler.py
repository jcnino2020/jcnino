from __future__ import annotations

import asyncio
from pathlib import Path

import pytest

from app.ai_engine import AIEngine, GenerationResult
from app.config import load_settings
from app.database import Database
from app.events import EventBus
from app.scheduler import ReplyScheduler


class FakeAI(AIEngine):
    def __init__(self, settings, db):
        super().__init__(settings, db)
        self.calls = 0

    async def generate_reply(self, contact, history, config):
        self.calls += 1
        return GenerationResult(
            text=f"Oh really? Tell me more ({self.calls}).",
            prompt_tokens=20,
            completion_tokens=10,
            model="fake-gemini",
        )


@pytest.mark.asyncio
async def test_unapproved_and_approved_contacts_and_debounce(tmp_path: Path) -> None:
    db = Database(tmp_path / "sched.db")
    db.initialize(defaults={"dry_run": False, "emergency_stop": False})
    settings = load_settings()
    ai = FakeAI(settings, db)
    events = EventBus()
    sent: list[tuple[int, str]] = []

    async def fake_send(user_id: int, text: str, _typing: bool) -> int:
        sent.append((user_id, text))
        return len(sent)

    scheduler = ReplyScheduler(db, ai, events, fake_send)
    try:
        # Unapproved contact must NEVER be scheduled
        await db.upsert_contact_on_incoming(101, "stranger", "S", "", "S", "Hi")
        await db.add_message(101, "incoming", "Hi", telegram_message_id=1)
        res_unapproved = await scheduler.schedule_reply(101, "Hi", 1, delay_override=0.05)
        assert res_unapproved is None

        # Approved contact gets debounced when two messages arrive rapidly
        await db.upsert_contact_on_incoming(202, "scam", "Scam", "", "Scam", "First")
        await db.update_contact(202, {"approval_status": "approved"})
        await db.add_message(202, "incoming", "First", telegram_message_id=10)
        await scheduler.schedule_reply(202, "First", 10, delay_override=0.25)

        await asyncio.sleep(0.05)
        await db.add_message(202, "incoming", "Second", telegram_message_id=11)
        await scheduler.schedule_reply(202, "Second", 11, delay_override=0.1)

        await asyncio.sleep(0.35)
        assert len(sent) == 1
        assert sent[0][0] == 202
        assert ai.calls == 1
    finally:
        await scheduler.cancel_all()
        db.close()
