"""SQLite persistent storage with WAL mode, migrations, async locking, and safe backups."""

from __future__ import annotations

import asyncio
import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo

PACIFIC_TZ = ZoneInfo("America/Los_Angeles")

DEFAULT_PERSONA = (
    "You are a friendly, slightly forgetful, curious everyday person who enjoys chatting "
    "but gets easily confused by technical or financial jargon. Ask short, innocent, "
    "conversational follow-up questions. Never share passwords, OTPs, bank details, or IDs."
)

MIGRATIONS: list[tuple[int, str]] = [
    (
        1,
        """
        CREATE TABLE IF NOT EXISTS schema_version (
            version INTEGER PRIMARY KEY
        );

        CREATE TABLE IF NOT EXISTS system_config (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS contacts (
            telegram_user_id INTEGER PRIMARY KEY,
            username TEXT DEFAULT '',
            first_name TEXT DEFAULT '',
            last_name TEXT DEFAULT '',
            display_name TEXT NOT NULL,
            approval_status TEXT NOT NULL DEFAULT 'pending'
                CHECK (approval_status IN ('pending', 'approved', 'rejected', 'blocked')),
            is_paused INTEGER NOT NULL DEFAULT 0,
            persona TEXT NOT NULL DEFAULT '',
            language_pref TEXT NOT NULL DEFAULT 'auto',
            response_length TEXT NOT NULL DEFAULT 'short',
            min_delay_sec INTEGER NOT NULL DEFAULT 15,
            max_delay_sec INTEGER NOT NULL DEFAULT 90,
            max_replies INTEGER NOT NULL DEFAULT 50,
            reply_count INTEGER NOT NULL DEFAULT 0,
            typing_indicator INTEGER NOT NULL DEFAULT 1,
            first_seen_at TEXT NOT NULL,
            last_seen_at TEXT NOT NULL,
            last_activity_at TEXT NOT NULL,
            latest_message_preview TEXT NOT NULL DEFAULT '',
            notes TEXT NOT NULL DEFAULT ''
        );

        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            telegram_user_id INTEGER NOT NULL,
            telegram_message_id INTEGER,
            direction TEXT NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
            content TEXT NOT NULL,
            is_ai_generated INTEGER NOT NULL DEFAULT 0,
            dry_run INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            FOREIGN KEY (telegram_user_id) REFERENCES contacts(telegram_user_id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_messages_contact_created
            ON messages(telegram_user_id, created_at DESC, id DESC);

        CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_unique_tg_id
            ON messages(telegram_user_id, direction, telegram_message_id)
            WHERE telegram_message_id IS NOT NULL;

        CREATE TABLE IF NOT EXISTS pending_replies (
            telegram_user_id INTEGER PRIMARY KEY,
            scheduled_for TEXT NOT NULL,
            trigger_message_id INTEGER,
            status TEXT NOT NULL DEFAULT 'scheduled'
                CHECK (status IN ('scheduled', 'processing', 'cancelled')),
            updated_at TEXT NOT NULL,
            FOREIGN KEY (telegram_user_id) REFERENCES contacts(telegram_user_id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS api_usage_daily (
            usage_date TEXT PRIMARY KEY,
            requests_count INTEGER NOT NULL DEFAULT 0,
            prompt_tokens INTEGER NOT NULL DEFAULT 0,
            completion_tokens INTEGER NOT NULL DEFAULT 0,
            total_tokens INTEGER NOT NULL DEFAULT 0,
            errors_count INTEGER NOT NULL DEFAULT 0,
            rate_limit_hits INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            actor TEXT NOT NULL,
            action TEXT NOT NULL,
            target TEXT NOT NULL DEFAULT '',
            details TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_audit_logs_created
            ON audit_logs(created_at DESC, id DESC);
        """,
    ),
]


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def pacific_today_str() -> str:
    return datetime.now(PACIFIC_TZ).strftime("%Y-%m-%d")


class Database:
    """Thread-safe / asyncio-safe SQLite repository."""

    def __init__(self, db_path: Path) -> None:
        self.db_path = db_path
        self._lock = asyncio.Lock()
        self._conn: sqlite3.Connection | None = None

    def _connect(self) -> sqlite3.Connection:
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        conn = sqlite3.connect(str(self.db_path), check_same_thread=False, timeout=15.0)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA synchronous=NORMAL;")
        conn.execute("PRAGMA foreign_keys=ON;")
        conn.execute("PRAGMA busy_timeout=5000;")
        return conn

    def initialize(self, defaults: dict[str, Any] | None = None) -> None:
        """Initialize database schema, run pending migrations, and seed defaults."""
        if self._conn is None:
            self._conn = self._connect()
        conn = self._conn

        conn.execute(
            "CREATE TABLE IF NOT EXISTS schema_version (version INTEGER PRIMARY KEY)"
        )
        row = conn.execute("SELECT COALESCE(MAX(version), 0) AS v FROM schema_version").fetchone()
        current_version = int(row["v"]) if row else 0

        for version, sql in MIGRATIONS:
            if version > current_version:
                conn.executescript(sql)
                conn.execute(
                    "INSERT OR REPLACE INTO schema_version(version) VALUES (?)",
                    (version,),
                )
        conn.commit()

        seed = {
            "emergency_stop": False,
            "dry_run": True,
            "ai_provider": "gemini",
            "ai_model": "gemini-2.5-flash",
            "default_persona": DEFAULT_PERSONA,
            "default_language": "auto",
            "default_response_length": "short",
            "default_memory_limit": 16,
            "daily_request_limit": 200,
            "daily_token_limit": 150000,
            "rpm_limit": 10,
            "quota_warn_percent": 80,
            "telegram_session_encrypted": "",
        }
        if defaults:
            seed.update(defaults)

        now = utc_now_iso()
        for key, value in seed.items():
            existing = conn.execute(
                "SELECT 1 FROM system_config WHERE key = ?", (key,)
            ).fetchone()
            if not existing:
                conn.execute(
                    "INSERT INTO system_config(key, value, updated_at) VALUES (?, ?, ?)",
                    (key, json.dumps(value), now),
                )
        conn.commit()

    def close(self) -> None:
        if self._conn is not None:
            self._conn.close()
            self._conn = None

    @property
    def conn(self) -> sqlite3.Connection:
        if self._conn is None:
            raise RuntimeError("Database is not initialized")
        return self._conn

    # ------------------------------------------------------------------
    # System Configuration
    # ------------------------------------------------------------------
    async def get_all_config(self) -> dict[str, Any]:
        async with self._lock:
            rows = self.conn.execute("SELECT key, value FROM system_config").fetchall()
            result: dict[str, Any] = {}
            for row in rows:
                try:
                    result[row["key"]] = json.loads(row["value"])
                except json.JSONDecodeError:
                    result[row["key"]] = row["value"]
            return result

    async def get_config(self, key: str, default: Any = None) -> Any:
        async with self._lock:
            row = self.conn.execute(
                "SELECT value FROM system_config WHERE key = ?", (key,)
            ).fetchone()
            if not row:
                return default
            try:
                return json.loads(row["value"])
            except json.JSONDecodeError:
                return row["value"]

    async def set_config(self, key: str, value: Any) -> None:
        now = utc_now_iso()
        async with self._lock:
            self.conn.execute(
                """
                INSERT INTO system_config(key, value, updated_at)
                VALUES (?, ?, ?)
                ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
                """,
                (key, json.dumps(value), now),
            )
            self.conn.commit()

    async def set_many_config(self, updates: dict[str, Any]) -> None:
        now = utc_now_iso()
        async with self._lock:
            for key, value in updates.items():
                self.conn.execute(
                    """
                    INSERT INTO system_config(key, value, updated_at)
                    VALUES (?, ?, ?)
                    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
                    """,
                    (key, json.dumps(value), now),
                )
            self.conn.commit()

    # ------------------------------------------------------------------
    # Contacts
    # ------------------------------------------------------------------
    async def upsert_contact_on_incoming(
        self,
        telegram_user_id: int,
        username: str,
        first_name: str,
        last_name: str,
        display_name: str,
        preview: str,
    ) -> dict[str, Any]:
        now = utc_now_iso()
        safe_preview = preview[:200]
        async with self._lock:
            existing = self.conn.execute(
                "SELECT * FROM contacts WHERE telegram_user_id = ?",
                (telegram_user_id,),
            ).fetchone()
            if existing:
                self.conn.execute(
                    """
                    UPDATE contacts
                    SET username = ?,
                        first_name = ?,
                        last_name = ?,
                        display_name = ?,
                        last_seen_at = ?,
                        last_activity_at = ?,
                        latest_message_preview = ?
                    WHERE telegram_user_id = ?
                    """,
                    (
                        username,
                        first_name,
                        last_name,
                        display_name,
                        now,
                        now,
                        safe_preview,
                        telegram_user_id,
                    ),
                )
            else:
                self.conn.execute(
                    """
                    INSERT INTO contacts (
                        telegram_user_id, username, first_name, last_name, display_name,
                        approval_status, first_seen_at, last_seen_at, last_activity_at,
                        latest_message_preview
                    ) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)
                    """,
                    (
                        telegram_user_id,
                        username,
                        first_name,
                        last_name,
                        display_name,
                        now,
                        now,
                        now,
                        safe_preview,
                    ),
                )
            self.conn.commit()
            row = self.conn.execute(
                "SELECT * FROM contacts WHERE telegram_user_id = ?",
                (telegram_user_id,),
            ).fetchone()
            return dict(row)

    async def get_contact(self, telegram_user_id: int) -> dict[str, Any] | None:
        async with self._lock:
            row = self.conn.execute(
                """
                SELECT c.*, p.scheduled_for AS pending_reply_at, p.status AS pending_status
                FROM contacts c
                LEFT JOIN pending_replies p ON c.telegram_user_id = p.telegram_user_id
                WHERE c.telegram_user_id = ?
                """,
                (telegram_user_id,),
            ).fetchone()
            return dict(row) if row else None

    async def list_contacts(self, status_filter: str | None = None) -> list[dict[str, Any]]:
        async with self._lock:
            query = """
                SELECT c.*, p.scheduled_for AS pending_reply_at, p.status AS pending_status
                FROM contacts c
                LEFT JOIN pending_replies p ON c.telegram_user_id = p.telegram_user_id
            """
            params: tuple[Any, ...] = ()
            if status_filter:
                query += " WHERE c.approval_status = ?"
                params = (status_filter,)
            query += " ORDER BY c.last_activity_at DESC"
            rows = self.conn.execute(query, params).fetchall()
            return [dict(r) for r in rows]

    async def update_contact(self, telegram_user_id: int, fields: dict[str, Any]) -> dict[str, Any] | None:
        allowed = {
            "approval_status",
            "is_paused",
            "persona",
            "language_pref",
            "response_length",
            "min_delay_sec",
            "max_delay_sec",
            "max_replies",
            "typing_indicator",
            "notes",
        }
        clean = {k: v for k, v in fields.items() if k in allowed}
        if not clean:
            return await self.get_contact(telegram_user_id)

        set_clause = ", ".join(f"{k} = ?" for k in clean)
        values = list(clean.values()) + [telegram_user_id]
        async with self._lock:
            self.conn.execute(
                f"UPDATE contacts SET {set_clause} WHERE telegram_user_id = ?",
                values,
            )
            self.conn.commit()
        return await self.get_contact(telegram_user_id)

    async def increment_contact_reply_count(self, telegram_user_id: int) -> None:
        now = utc_now_iso()
        async with self._lock:
            self.conn.execute(
                """
                UPDATE contacts
                SET reply_count = reply_count + 1,
                    last_activity_at = ?
                WHERE telegram_user_id = ?
                """,
                (now, telegram_user_id),
            )
            self.conn.commit()

    # ------------------------------------------------------------------
    # Messages
    # ------------------------------------------------------------------
    async def add_message(
        self,
        telegram_user_id: int,
        direction: str,
        content: str,
        telegram_message_id: int | None = None,
        is_ai_generated: bool = False,
        dry_run: bool = False,
    ) -> int | None:
        now = utc_now_iso()
        async with self._lock:
            try:
                cur = self.conn.execute(
                    """
                    INSERT INTO messages (
                        telegram_user_id, telegram_message_id, direction, content,
                        is_ai_generated, dry_run, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        telegram_user_id,
                        telegram_message_id,
                        direction,
                        content,
                        1 if is_ai_generated else 0,
                        1 if dry_run else 0,
                        now,
                    ),
                )
                self.conn.execute(
                    """
                    UPDATE contacts
                    SET last_activity_at = ?, latest_message_preview = ?
                    WHERE telegram_user_id = ?
                    """,
                    (now, content[:200], telegram_user_id),
                )
                self.conn.commit()
                return cur.lastrowid
            except sqlite3.IntegrityError:
                self.conn.rollback()
                # Duplicate telegram_message_id for same user/direction
                return None

    async def get_conversation_messages(
        self, telegram_user_id: int, limit: int = 50
    ) -> list[dict[str, Any]]:
        async with self._lock:
            rows = self.conn.execute(
                """
                SELECT * FROM (
                    SELECT * FROM messages
                    WHERE telegram_user_id = ?
                    ORDER BY created_at DESC, id DESC
                    LIMIT ?
                ) ORDER BY created_at ASC, id ASC
                """,
                (telegram_user_id, limit),
            ).fetchall()
            return [dict(r) for r in rows]

    # ------------------------------------------------------------------
    # Pending Replies
    # ------------------------------------------------------------------
    async def set_pending_reply(
        self,
        telegram_user_id: int,
        scheduled_for: str,
        trigger_message_id: int | None = None,
        status: str = "scheduled",
    ) -> None:
        now = utc_now_iso()
        async with self._lock:
            self.conn.execute(
                """
                INSERT INTO pending_replies(telegram_user_id, scheduled_for, trigger_message_id, status, updated_at)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(telegram_user_id) DO UPDATE SET
                    scheduled_for = excluded.scheduled_for,
                    trigger_message_id = excluded.trigger_message_id,
                    status = excluded.status,
                    updated_at = excluded.updated_at
                """,
                (telegram_user_id, scheduled_for, trigger_message_id, status, now),
            )
            self.conn.commit()

    async def clear_pending_reply(self, telegram_user_id: int) -> None:
        async with self._lock:
            self.conn.execute(
                "DELETE FROM pending_replies WHERE telegram_user_id = ?",
                (telegram_user_id,),
            )
            self.conn.commit()

    async def list_pending_replies(self) -> list[dict[str, Any]]:
        async with self._lock:
            rows = self.conn.execute(
                """
                SELECT p.*, c.display_name, c.username
                FROM pending_replies p
                JOIN contacts c ON p.telegram_user_id = c.telegram_user_id
                ORDER BY p.scheduled_for ASC
                """
            ).fetchall()
            return [dict(r) for r in rows]

    # ------------------------------------------------------------------
    # API Usage & Quotas
    # ------------------------------------------------------------------
    async def get_daily_usage(self, usage_date: str | None = None) -> dict[str, Any]:
        target_date = usage_date or pacific_today_str()
        async with self._lock:
            row = self.conn.execute(
                "SELECT * FROM api_usage_daily WHERE usage_date = ?",
                (target_date,),
            ).fetchone()
            if not row:
                return {
                    "usage_date": target_date,
                    "requests_count": 0,
                    "prompt_tokens": 0,
                    "completion_tokens": 0,
                    "total_tokens": 0,
                    "errors_count": 0,
                    "rate_limit_hits": 0,
                }
            return dict(row)

    async def record_api_usage(
        self,
        requests: int = 1,
        prompt_tokens: int = 0,
        completion_tokens: int = 0,
        errors: int = 0,
        rate_limit_hits: int = 0,
        usage_date: str | None = None,
    ) -> dict[str, Any]:
        target_date = usage_date or pacific_today_str()
        total_tokens = prompt_tokens + completion_tokens
        async with self._lock:
            self.conn.execute(
                """
                INSERT INTO api_usage_daily (
                    usage_date, requests_count, prompt_tokens, completion_tokens,
                    total_tokens, errors_count, rate_limit_hits
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(usage_date) DO UPDATE SET
                    requests_count = requests_count + excluded.requests_count,
                    prompt_tokens = prompt_tokens + excluded.prompt_tokens,
                    completion_tokens = completion_tokens + excluded.completion_tokens,
                    total_tokens = total_tokens + excluded.total_tokens,
                    errors_count = errors_count + excluded.errors_count,
                    rate_limit_hits = rate_limit_hits + excluded.rate_limit_hits
                """,
                (
                    target_date,
                    requests,
                    prompt_tokens,
                    completion_tokens,
                    total_tokens,
                    errors,
                    rate_limit_hits,
                ),
            )
            self.conn.commit()
            row = self.conn.execute(
                "SELECT * FROM api_usage_daily WHERE usage_date = ?",
                (target_date,),
            ).fetchone()
            return dict(row)

    # ------------------------------------------------------------------
    # Overview Stats & Audit Logs
    # ------------------------------------------------------------------
    async def get_overview_stats(self) -> dict[str, Any]:
        today_utc = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        async with self._lock:
            counts = self.conn.execute(
                """
                SELECT
                    SUM(CASE WHEN approval_status = 'approved' AND is_paused = 0 THEN 1 ELSE 0 END) AS active_conversations,
                    SUM(CASE WHEN approval_status = 'approved' AND is_paused = 1 THEN 1 ELSE 0 END) AS paused_conversations,
                    SUM(CASE WHEN approval_status = 'pending' THEN 1 ELSE 0 END) AS pending_approvals,
                    SUM(CASE WHEN approval_status = 'blocked' THEN 1 ELSE 0 END) AS blocked_contacts
                FROM contacts
                """
            ).fetchone()
            sent_today_row = self.conn.execute(
                """
                SELECT COUNT(*) AS cnt
                FROM messages
                WHERE direction = 'outgoing'
                  AND dry_run = 0
                  AND substr(created_at, 1, 10) = ?
                """,
                (today_utc,),
            ).fetchone()
            return {
                "active_conversations": int(counts["active_conversations"] or 0),
                "paused_conversations": int(counts["paused_conversations"] or 0),
                "pending_approvals": int(counts["pending_approvals"] or 0),
                "blocked_contacts": int(counts["blocked_contacts"] or 0),
                "messages_sent_today": int(sent_today_row["cnt"] or 0),
            }

    async def add_audit_log(
        self, actor: str, action: str, target: str = "", details: str = ""
    ) -> None:
        now = utc_now_iso()
        async with self._lock:
            self.conn.execute(
                """
                INSERT INTO audit_logs(actor, action, target, details, created_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                (actor, action, target, details[:500], now),
            )
            self.conn.commit()

    async def get_audit_logs(self, limit: int = 80) -> list[dict[str, Any]]:
        async with self._lock:
            rows = self.conn.execute(
                "SELECT * FROM audit_logs ORDER BY created_at DESC, id DESC LIMIT ?",
                (limit,),
            ).fetchall()
            return [dict(r) for r in rows]

    # ------------------------------------------------------------------
    # Safe Online Backup
    # ------------------------------------------------------------------
    async def create_backup(self, backup_dir: Path) -> Path:
        backup_dir.mkdir(parents=True, exist_ok=True)
        stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        dest = backup_dir / f"tg_autoreply_{stamp}.db"
        async with self._lock:
            self.conn.commit()
            dest_conn = sqlite3.connect(str(dest))
            try:
                self.conn.backup(dest_conn)
            finally:
                dest_conn.close()
        return dest
