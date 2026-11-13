from __future__ import annotations

import hashlib
import hmac
import struct
import time

import pytest
from cryptography.fernet import Fernet
from fastapi import HTTPException

from app.security import (
    LoginRateLimiter,
    SecretBox,
    SessionManager,
    generate_totp_secret,
    hash_password,
    verify_password,
    verify_totp,
)


def _current_totp(secret_b32: str) -> str:
    import base64

    padded = secret_b32 + "=" * ((8 - len(secret_b32) % 8) % 8)
    key = base64.b32decode(padded, casefold=True)
    counter = int(time.time() // 30)
    digest = hmac.new(key, struct.pack(">Q", counter), hashlib.sha1).digest()
    pos = digest[-1] & 0x0F
    truncated = struct.unpack(">I", digest[pos : pos + 4])[0] & 0x7FFFFFFF
    return f"{truncated % 1000000:06d}"


def test_password_hash_and_verify() -> None:
    hashed = hash_password("CorrectHorseBatteryStaple!")
    assert verify_password("CorrectHorseBatteryStaple!", hashed) is True
    assert verify_password("wrong-password", hashed) is False


def test_totp_roundtrip() -> None:
    secret = generate_totp_secret()
    code = _current_totp(secret)
    assert verify_totp(secret, code) is True
    assert verify_totp(secret, "000000") is False


def test_secret_box_encryption() -> None:
    key = Fernet.generate_key().decode("ascii")
    box = SecretBox(key)
    enc = box.encrypt("my-telethon-session-string")
    assert enc != "my-telethon-session-string"
    assert box.decrypt(enc) == "my-telethon-session-string"


def test_session_manager_and_rate_limiter() -> None:
    mgr = SessionManager("super-secret-signing-key-123456", ttl_seconds=60)
    token, csrf = mgr.create_session("admin")
    payload = mgr.verify_session(token)
    assert payload is not None
    assert payload["u"] == "admin"
    assert payload["csrf"] == csrf
    assert mgr.verify_session(token + "tamper") is None

    limiter = LoginRateLimiter(max_attempts=2, window_seconds=60)
    limiter.check_allowed("1.2.3.4")
    limiter.record_failure("1.2.3.4")
    limiter.record_failure("1.2.3.4")
    with pytest.raises(HTTPException) as exc:
        limiter.check_allowed("1.2.3.4")
    assert exc.value.status_code == 429
