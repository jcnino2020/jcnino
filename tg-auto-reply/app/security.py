"""Authentication, session cookies, CSRF protection, TOTP 2FA, rate limiting, and encryption."""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import secrets
import struct
import time
from collections import defaultdict, deque
from typing import Any

from cryptography.fernet import Fernet, InvalidToken
from fastapi import HTTPException, Request, status


# ----------------------------------------------------------------------
# Password Hashing (scrypt - built into Python stdlib hashlib)
# ----------------------------------------------------------------------
def hash_password(password: str) -> str:
    """Return a salted scrypt hash formatted as scrypt$N$r$p$salt_b64$hash_b64."""
    if len(password) < 10:
        raise ValueError("Password must be at least 10 characters long.")
    salt = secrets.token_bytes(16)
    n, r, p = 16384, 8, 1
    derived = hashlib.scrypt(password.encode("utf-8"), salt=salt, n=n, r=r, p=p, dklen=32)
    return (
        f"scrypt${n}${r}${p}$"
        f"{base64.urlsafe_b64encode(salt).decode('ascii')}$"
        f"{base64.urlsafe_b64encode(derived).decode('ascii')}"
    )


def verify_password(password: str, stored_hash: str) -> bool:
    """Constant-time verification of a scrypt password hash."""
    if not stored_hash or not stored_hash.startswith("scrypt$"):
        return False
    parts = stored_hash.split("$")
    if len(parts) != 6:
        return False
    try:
        _, n_s, r_s, p_s, salt_b64, digest_b64 = parts
        n, r, p = int(n_s), int(r_s), int(p_s)
        salt = base64.urlsafe_b64decode(salt_b64.encode("ascii"))
        expected = base64.urlsafe_b64decode(digest_b64.encode("ascii"))
        actual = hashlib.scrypt(password.encode("utf-8"), salt=salt, n=n, r=r, p=p, dklen=len(expected))
        return hmac.compare_digest(actual, expected)
    except Exception:
        return False


# ----------------------------------------------------------------------
# RFC 6238 TOTP 2FA (Pure Python, no extra dependencies)
# ----------------------------------------------------------------------
def generate_totp_secret() -> str:
    return base64.b32encode(secrets.token_bytes(20)).decode("ascii").rstrip("=")


def verify_totp(secret_b32: str, code: str, window: int = 1) -> bool:
    if not secret_b32:
        return True
    cleaned = code.strip().replace(" ", "")
    if not cleaned.isdigit() or len(cleaned) != 6:
        return False
    padded = secret_b32.strip().upper()
    padded += "=" * ((8 - len(padded) % 8) % 8)
    try:
        key = base64.b32decode(padded, casefold=True)
    except Exception:
        return False

    counter = int(time.time() // 30)
    for offset in range(-window, window + 1):
        msg = struct.pack(">Q", counter + offset)
        digest = hmac.new(key, msg, hashlib.sha1).digest()
        pos = digest[-1] & 0x0F
        truncated = struct.unpack(">I", digest[pos : pos + 4])[0] & 0x7FFFFFFF
        otp = f"{truncated % 1000000:06d}"
        if hmac.compare_digest(otp, cleaned):
            return True
    return False


# ----------------------------------------------------------------------
# Fernet Session Encryption at Rest (for Telethon StringSession)
# ----------------------------------------------------------------------
class SecretBox:
    """Encrypts/decrypts sensitive strings (e.g., Telethon StringSession) at rest."""

    def __init__(self, key: str) -> None:
        self._fernet = Fernet(key.encode("ascii")) if key else None

    @property
    def is_configured(self) -> bool:
        return self._fernet is not None

    def encrypt(self, plaintext: str) -> str:
        if not plaintext:
            return ""
        if not self._fernet:
            raise RuntimeError("SESSION_ENCRYPTION_KEY is not configured.")
        return self._fernet.encrypt(plaintext.encode("utf-8")).decode("ascii")

    def decrypt(self, ciphertext: str) -> str:
        if not ciphertext:
            return ""
        if not self._fernet:
            raise RuntimeError("SESSION_ENCRYPTION_KEY is not configured.")
        try:
            return self._fernet.decrypt(ciphertext.encode("ascii")).decode("utf-8")
        except InvalidToken as exc:
            raise RuntimeError("Failed to decrypt stored Telegram session.") from exc


# ----------------------------------------------------------------------
# Signed HTTP-Only Session Tokens + CSRF
# ----------------------------------------------------------------------
class SessionManager:
    """HMAC-SHA256 signed session tokens with embedded CSRF token."""

    COOKIE_NAME = "tg_dash_session"

    def __init__(self, secret: str, ttl_seconds: int = 43200) -> None:
        if not secret or len(secret) < 16:
            raise ValueError("SESSION_SECRET must be at least 16 characters.")
        self._secret = secret.encode("utf-8")
        self.ttl_seconds = ttl_seconds

    def create_session(self, username: str) -> tuple[str, str]:
        now = int(time.time())
        csrf_token = secrets.token_urlsafe(24)
        payload = {
            "u": username,
            "iat": now,
            "exp": now + self.ttl_seconds,
            "csrf": csrf_token,
            "jti": secrets.token_urlsafe(12),
        }
        body = base64.urlsafe_b64encode(
            json.dumps(payload, separators=(",", ":")).encode("utf-8")
        ).decode("ascii")
        sig = hmac.new(self._secret, body.encode("ascii"), hashlib.sha256).hexdigest()
        return f"{body}.{sig}", csrf_token

    def verify_session(self, token: str | None) -> dict[str, Any] | None:
        if not token or "." not in token:
            return None
        body, _, sig = token.partition(".")
        expected_sig = hmac.new(
            self._secret, body.encode("ascii"), hashlib.sha256
        ).hexdigest()
        if not hmac.compare_digest(sig, expected_sig):
            return None
        try:
            payload = json.loads(base64.urlsafe_b64decode(body.encode("ascii")))
        except Exception:
            return None
        if int(payload.get("exp", 0)) < int(time.time()):
            return None
        return payload


# ----------------------------------------------------------------------
# Login Rate Limiter (Sliding Window per IP)
# ----------------------------------------------------------------------
class LoginRateLimiter:
    """Blocks brute-force login attempts per client IP."""

    def __init__(self, max_attempts: int = 6, window_seconds: int = 300) -> None:
        self.max_attempts = max_attempts
        self.window_seconds = window_seconds
        self._attempts: dict[str, deque[float]] = defaultdict(deque)

    def _prune(self, key: str, now: float) -> deque[float]:
        q = self._attempts[key]
        cutoff = now - self.window_seconds
        while q and q[0] < cutoff:
            q.popleft()
        return q

    def check_allowed(self, client_ip: str) -> None:
        now = time.monotonic()
        q = self._prune(client_ip, now)
        if len(q) >= self.max_attempts:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many login attempts. Please wait 5 minutes and try again.",
            )

    def record_failure(self, client_ip: str) -> None:
        now = time.monotonic()
        q = self._prune(client_ip, now)
        q.append(now)

    def reset(self, client_ip: str) -> None:
        self._attempts.pop(client_ip, None)


# ----------------------------------------------------------------------
# Request Auth & Cloudflare Access Helpers
# ----------------------------------------------------------------------
def get_client_ip(request: Request, trusted_proxies: tuple[str, ...]) -> str:
    peer = request.client.host if request.client else "unknown"
    if peer in trusted_proxies:
        cf_ip = request.headers.get("CF-Connecting-IP")
        if cf_ip:
            return cf_ip.strip()
        xff = request.headers.get("X-Forwarded-For")
        if xff:
            return xff.split(",")[0].strip()
    return peer


def verify_cloudflare_access_headers(
    request: Request, require_cf: bool, expected_aud: str = ""
) -> str | None:
    """
    Defense-in-depth check for Cloudflare Access.
    When REQUIRE_CLOUDFLARE_ACCESS=true, requires Cf-Access-Jwt-Assertion header
    (and optionally verifies the `aud` claim). In production, traffic must only
    reach the app through Cloudflare Tunnel / Cloudflare proxy so headers cannot be spoofed.
    """
    if not require_cf:
        return None
    jwt_token = request.headers.get("Cf-Access-Jwt-Assertion", "").strip()
    if not jwt_token:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cloudflare Access authentication required.",
        )
    if expected_aud:
        parts = jwt_token.split(".")
        if len(parts) != 3:
            raise HTTPException(status_code=403, detail="Invalid Cloudflare Access token.")
        try:
            padded = parts[1] + "=" * ((4 - len(parts[1]) % 4) % 4)
            claims = json.loads(base64.urlsafe_b64decode(padded))
            aud_list = claims.get("aud", [])
            if isinstance(aud_list, str):
                aud_list = [aud_list]
            if expected_aud not in aud_list:
                raise HTTPException(status_code=403, detail="Cloudflare Access AUD mismatch.")
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(status_code=403, detail="Malformed Cloudflare Access token.") from exc
    return request.headers.get("Cf-Access-Authenticated-User-Email", "cf-user")
