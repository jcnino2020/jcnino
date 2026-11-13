from __future__ import annotations

from pathlib import Path

import pytest

from app.database import Database


@pytest.mark.asyncio
async def test_contact_upsert_preserves_stable_id_on_username_change(tmp_path: Path) -> None:
    db = Database(tmp_path / "test.db")
    db.initialize()
    try:
        c1 = await db.upsert_contact_on_incoming(
            telegram_user_id=99887766,
            username="old_handle",
            first_name="Juan",
            last_name="Dela Cruz",
            display_name="Juan Dela Cruz",
            preview="Hello sir",
        )
        assert c1["approval_status"] == "pending"
        await db.update_contact(99887766, {"approval_status": "approved"})

        # Contact changes username and display name
        c2 = await db.upsert_contact_on_incoming(
            telegram_user_id=99887766,
            username="new_handle",
            first_name="J",
            last_name="Cruz",
            display_name="J Cruz",
            preview="Checking in",
        )
        assert c2["telegram_user_id"] == 99887766
        assert c2["username"] == "new_handle"
        assert c2["display_name"] == "J Cruz"
        assert c2["approval_status"] == "approved"
    finally:
        db.close()


@pytest.mark.asyncio
async def test_message_dedup_and_backup(tmp_path: Path) -> None:
    db = Database(tmp_path / "test.db")
    db.initialize()
    try:
        await db.upsert_contact_on_incoming(123, "u", "A", "B", "A B", "hi")
        m1 = await db.add_message(123, "incoming", "hi", telegram_message_id=501)
        m2 = await db.add_message(123, "incoming", "hi", telegram_message_id=501)
        assert m1 is not None
        assert m2 is None

        backup_path = await db.create_backup(tmp_path / "backups")
        assert backup_path.exists()
        assert backup_path.stat().st_size > 0
    finally:
        db.close()
