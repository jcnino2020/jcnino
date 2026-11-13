# Cloud-Hosted Telegram AI Auto-Reply System

A 24/7, zero-cost (`₱0`) Telegram user-account AI auto-reply platform built with **Python + FastAPI + Telethon + Google Gemini Free Tier + SQLite**, designed to run continuously on **Oracle Cloud Always Free** behind **Cloudflare Tunnel + Cloudflare Access** at `https://jcnino.dev/tg` (or `https://tg.jcnino.dev`).

## Key Features

- **Personal Telegram Account (Telethon)**: Connects to your real Telegram account via an encrypted `StringSession`, supports two-step verification (2FA), browser-based one-time onboarding, automatic reconnects, typing indicators, and `FloodWait` handling.
- **Contact Detection & Strict Approval**: Automatically logs unfamiliar private senders by stable integer `telegram_user_id` (resilient to `@username` and profile changes). Unapproved contacts **never** receive AI replies.
- **Concurrent Scammer Conversations**: Independent per-contact conversation history, persona, language (`English`, `Filipino`, `Taglish`, `Hiligaynon`, or `auto`), reply limits, pause/resume controls, and debounced human-like reply timers (`15–90s` + message-length reading time).
- **Prompt-Injection & Safety Hardening**: Untrusted incoming messages are isolated inside strict delimiters; the AI never asks for passwords, OTPs, or banking details, never sends URLs, and never impersonates authorities.
- **Permanent Free-Tier Protection**: Enforces daily request caps, daily token caps, and rolling RPM limits in SQLite before calling Gemini, with zero paid fallback.
- **Private Mobile-First Dashboard**: Light/dark mode, real-time Server-Sent Events (SSE), Emergency Stop, Dry-Run/Live mode, SQLite backups, and audit logs.

## Quick Local Test

```bash
cd tg-auto-reply
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python -m pytest -v
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for the complete step-by-step **Oracle Cloud Always Free**, **Cloudflare Access**, **domain routing (`jcnino.dev/tg`)**, and **troubleshooting** guide.
