"""Environment and application configuration loader."""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


def _load_dotenv(env_path: Path) -> None:
    """Load simple KEY=VALUE pairs from .env without overriding existing env vars."""
    if not env_path.is_file():
        return
    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


def _env_bool(name: str, default: bool) -> bool:
    val = os.getenv(name)
    if val is None:
        return default
    return val.strip().lower() in {"1", "true", "yes", "on"}


def _env_int(name: str, default: int) -> int:
    val = os.getenv(name)
    if val is None or not val.strip():
        return default
    return int(val.strip())


def _normalize_base_path(raw: str) -> str:
    cleaned = raw.strip()
    if not cleaned or cleaned == "/":
        return ""
    if not cleaned.startswith("/"):
        cleaned = "/" + cleaned
    return cleaned.rstrip("/")


@dataclass(frozen=True)
class Settings:
    base_path: str
    app_host: str
    app_port: int
    trusted_proxy_ips: tuple[str, ...]

    session_secret: str
    session_encryption_key: str
    admin_username: str
    admin_password_hash: str
    admin_totp_secret: str
    cookie_secure: bool
    session_ttl_seconds: int

    require_cloudflare_access: bool
    cf_access_team_domain: str
    cf_access_aud: str

    telegram_api_id: int
    telegram_api_hash: str

    gemini_api_key: str
    gemini_model: str
    custom_ai_base_url: str
    custom_ai_api_key: str
    custom_ai_model: str

    daily_request_limit: int
    daily_token_limit: int
    rpm_limit: int
    quota_warn_percent: int

    db_path: Path
    backup_dir: Path
    log_level: str
    dry_run: bool


def load_settings(env_file: Path | None = None) -> Settings:
    """Load settings from environment variables and optional .env file."""
    project_root = Path(__file__).resolve().parent.parent
    _load_dotenv(env_file or (project_root / ".env"))

    db_raw = os.getenv("DB_PATH", "./data/tg_autoreply.db")
    db_path = Path(db_raw)
    if not db_path.is_absolute():
        db_path = (project_root / db_path).resolve()

    backup_raw = os.getenv("BACKUP_DIR", "./data/backups")
    backup_dir = Path(backup_raw)
    if not backup_dir.is_absolute():
        backup_dir = (project_root / backup_dir).resolve()

    proxies = tuple(
        ip.strip()
        for ip in os.getenv("TRUSTED_PROXY_IPS", "127.0.0.1,::1").split(",")
        if ip.strip()
    )

    return Settings(
        base_path=_normalize_base_path(os.getenv("BASE_PATH", "/tg")),
        app_host=os.getenv("APP_HOST", "127.0.0.1"),
        app_port=_env_int("APP_PORT", 8080),
        trusted_proxy_ips=proxies,
        session_secret=os.getenv("SESSION_SECRET", ""),
        session_encryption_key=os.getenv("SESSION_ENCRYPTION_KEY", ""),
        admin_username=os.getenv("ADMIN_USERNAME", "admin"),
        admin_password_hash=os.getenv("ADMIN_PASSWORD_HASH", ""),
        admin_totp_secret=os.getenv("ADMIN_TOTP_SECRET", "").strip(),
        cookie_secure=_env_bool("COOKIE_SECURE", True),
        session_ttl_seconds=_env_int("SESSION_TTL_SECONDS", 43200),
        require_cloudflare_access=_env_bool("REQUIRE_CLOUDFLARE_ACCESS", False),
        cf_access_team_domain=os.getenv("CF_ACCESS_TEAM_DOMAIN", "").strip(),
        cf_access_aud=os.getenv("CF_ACCESS_AUD", "").strip(),
        telegram_api_id=_env_int("TELEGRAM_API_ID", 0),
        telegram_api_hash=os.getenv("TELEGRAM_API_HASH", "").strip(),
        gemini_api_key=os.getenv("GEMINI_API_KEY", "").strip(),
        gemini_model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip(),
        custom_ai_base_url=os.getenv("CUSTOM_AI_BASE_URL", "").strip(),
        custom_ai_api_key=os.getenv("CUSTOM_AI_API_KEY", "").strip(),
        custom_ai_model=os.getenv("CUSTOM_AI_MODEL", "").strip(),
        daily_request_limit=_env_int("DAILY_REQUEST_LIMIT", 200),
        daily_token_limit=_env_int("DAILY_TOKEN_LIMIT", 150000),
        rpm_limit=_env_int("RPM_LIMIT", 10),
        quota_warn_percent=_env_int("QUOTA_WARN_PERCENT", 80),
        db_path=db_path,
        backup_dir=backup_dir,
        log_level=os.getenv("LOG_LEVEL", "INFO").upper(),
        dry_run=_env_bool("DRY_RUN", True),
    )
