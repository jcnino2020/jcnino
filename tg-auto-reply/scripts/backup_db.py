#!/usr/bin/env python3
"""Create a safe online SQLite backup and prune old backups."""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from app.config import load_settings  # noqa: E402
from app.database import Database  # noqa: E402


async def run_backup(keep: int = 14) -> None:
    settings = load_settings()
    db = Database(settings.db_path)
    db.initialize()
    try:
        dest = await db.create_backup(settings.backup_dir)
        print(f"Backup created: {dest}")
    finally:
        db.close()

    backups = sorted(settings.backup_dir.glob("*.db"), reverse=True)
    for old in backups[keep:]:
        old.unlink(missing_ok=True)


if __name__ == "__main__":
    asyncio.run(run_backup())
