#!/usr/bin/env python3
"""Initialize SQLite database and generate secure credentials for .env."""

from __future__ import annotations

import argparse
import getpass
import secrets
import sys
from pathlib import Path

from cryptography.fernet import Fernet

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from app.config import load_settings  # noqa: E402
from app.database import Database  # noqa: E402
from app.security import generate_totp_secret, hash_password  # noqa: E402


def main() -> None:
    parser = argparse.ArgumentParser(description="Initialize TG Auto-Reply DB and secrets.")
    parser.add_argument("--generate-secrets", action="store_true", help="Print fresh secrets for .env")
    parser.add_argument("--with-totp", action="store_true", help="Also generate a 2FA TOTP secret")
    args = parser.parse_args()

    settings = load_settings()
    db = Database(settings.db_path)
    db.initialize()
    db.close()
    print(f"Database initialized at: {settings.db_path}")

    if args.generate_secrets:
        pw = getpass.getpass("Enter dashboard admin password (min 10 chars): ")
        pw_confirm = getpass.getpass("Confirm password: ")
        if pw != pw_confirm:
            print("Passwords do not match.", file=sys.stderr)
            sys.exit(1)

        pw_hash = hash_password(pw)
        session_secret = secrets.token_urlsafe(32)
        fernet_key = Fernet.generate_key().decode("ascii")

        print("\n--- Add these lines to your .env file ---")
        print(f"SESSION_SECRET={session_secret}")
        print(f"SESSION_ENCRYPTION_KEY={fernet_key}")
        print(f"ADMIN_PASSWORD_HASH={pw_hash}")
        if args.with_totp:
            totp = generate_totp_secret()
            print(f"ADMIN_TOTP_SECRET={totp}")
            print(
                f"# Authenticator URI: otpauth://totp/TG-AutoReply:admin?secret={totp}&issuer=TG-AutoReply"
            )
        print("-----------------------------------------\n")


if __name__ == "__main__":
    main()
