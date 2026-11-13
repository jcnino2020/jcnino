# Oracle Cloud Always Free & Cloudflare Deployment Guide

This guide deploys the Telegram AI Auto-Reply System at **₱0 operating cost** using only permanent free tiers.

---

## 1. Verified Permanent Free-Tier Limits (Important)

| Service | Permanent Free Allowance | Hard / Billing Notes |
|---|---|---|
| **Oracle Cloud Always Free** | `VM.Standard.E2.1.Micro` (up to 2 VMs, 1/8 OCPU, 1 GB RAM each) **or** `VM.Standard.A1.Flex` (Ampere ARM: 3,000 OCPU hrs + 18,000 GB hrs/month, up to 2 OCPUs / 12 GB RAM); 200 GB total block/boot storage; 10 TB/month outbound data | Identity/card verification may place a temporary ₱0/$1 authorization hold. **Stay strictly on Always Free shapes** and set an OCI Budget Alert for `$1` just in case. |
| **Google Gemini API Free Tier** | `$0` for eligible models (`gemini-2.5-flash`, `gemini-2.5-flash-lite`) via Google AI Studio | **Do NOT link a Google Cloud Billing account** to the AI Studio project. Without a billing account, Google cannot charge overages; exceeding RPM/TPM/RPD returns HTTP `429` (`RESOURCE_EXHAUSTED`). |
| **Cloudflare Zero Trust / Access** | Up to **50 users** on the Free plan | No automatic paid upgrade; blocks logins above 50 users. |
| **Cloudflare Tunnel + Workers** | Tunnel: free; Workers Free: 100,000 requests/day | Used to route `jcnino.dev/tg*` to your OCI VM without exposing public ports. |

> **Important Billing Disclaimer:** Software-level quotas in this app (`DAILY_REQUEST_LIMIT`, `DAILY_TOKEN_LIMIT`, `RPM_LIMIT`) stop the application from making excessive AI calls, **but software limits cannot prevent cloud-provider billing mistakes** (such as accidentally selecting a paid OCI compute shape or attaching a billing account to Gemini). Always verify "Always Free-eligible" badges in OCI and keep Gemini unbilled.

---

## 2. Domain Architecture: `jcnino.dev/tg` vs `tg.jcnino.dev`

`jcnino.dev` is currently hosted on **Vercel** with DNS managed at `name.com`. **DNS records alone cannot route `/tg` to Oracle Cloud while `/` stays on Vercel.**

You have two clean ways to keep `jcnino.dev` completely unchanged:

1. **Recommended (`https://jcnino.dev/tg` with Cloudflare Access):**
   - Move `jcnino.dev` nameservers from `name.com` to **Cloudflare Free DNS** (keeping the existing DNS records pointing to Vercel).
   - Run `cloudflared` (Cloudflare Tunnel) on the Oracle Cloud VM pointing `tg-origin.jcnino.dev` -> `http://127.0.0.1:8080`.
   - Deploy `deploy/cloudflare-worker.js` on route `jcnino.dev/tg*` and `www.jcnino.dev/tg*`.
   - Enable **Cloudflare Access** on `jcnino.dev/tg*` (and `tg-origin.jcnino.dev/*`).
2. **Fallback (`https://tg.jcnino.dev` — zero changes to `jcnino.dev` or root DNS):**
   - Add a single `CNAME` or `A` record for `tg.jcnino.dev` pointing to your OCI VM IP (or Cloudflare Tunnel).
   - Set `BASE_PATH=` (empty) in `.env` and use `deploy/Caddyfile`.

---

## 3. Step-by-Step Oracle Cloud Deployment

1. **Create an Oracle Cloud Free Tier account** at `cloud.oracle.com`. Select your nearest Home Region (e.g., Singapore).
2. **Create an Always Free Compute Instance:**
   - Image: **Ubuntu 24.04 LTS** (Minimal or Standard).
   - Shape: `VM.Standard.A1.Flex` (1 OCPU, 6 GB RAM) or `VM.Standard.E2.1.Micro` (1/8 OCPU, 1 GB RAM). Ensure the **Always Free-eligible** label is shown.
   - Boot volume: default **50 GB** (well within the 200 GB free pool).
   - Upload your SSH public key.
3. **Configure Networking & Firewall:**
   - In OCI VCN Security List: allow **TCP 22** (SSH) **only from your home IP**; if using Cloudflare Tunnel, you do **not** need to open ports `80`, `443`, or `8080` publicly at all (prevents origin bypass!).
   - If using `tg.jcnino.dev` directly with Caddy instead of Cloudflare Tunnel, allow TCP `80` and `443` in OCI Security List and `ufw`.
4. **Install Dependencies on the VM:**
   ```bash
   sudo apt-get update && sudo apt-get install -y python3 python3-venv python3-pip git sqlite3
   ```
5. **Deploy the Application:**
   ```bash
   sudo mkdir -p /opt/tg-auto-reply && sudo chown $USER:$USER /opt/tg-auto-reply
   # Copy tg-auto-reply/ contents to /opt/tg-auto-reply
   cd /opt/tg-auto-reply
   python3 -m venv .venv
   .venv/bin/pip install --upgrade pip
   .venv/bin/pip install -r requirements.txt
   cp .env.example .env
   ```
6. **Generate Secrets & Initialize SQLite:**
   ```bash
   .venv/bin/python scripts/init_db.py --generate-secrets --with-totp
   ```
   Paste the printed `SESSION_SECRET`, `SESSION_ENCRYPTION_KEY`, `ADMIN_PASSWORD_HASH`, and `ADMIN_TOTP_SECRET` into `.env`, along with:
   - `TELEGRAM_API_ID` & `TELEGRAM_API_HASH` (from `my.telegram.org`)
   - `GEMINI_API_KEY` (from `aistudio.google.com`, unbilled project)
   - `REQUIRE_CLOUDFLARE_ACCESS=true` (when using Cloudflare Access)
7. **Start systemd Service (Single Worker):**
   ```bash
   sudo cp deploy/tg-autoreply.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable --now tg-autoreply
   sudo systemctl status tg-autoreply
   ```
8. **Configure Automated Daily SQLite Backups (systemd/cron):**
   ```bash
   (crontab -l 2>/dev/null; echo "0 3 * * * /opt/tg-auto-reply/.venv/bin/python /opt/tg-auto-reply/scripts/backup_db.py") | crontab -
   ```
9. **Set Up Cloudflare Tunnel (`cloudflared`) & Access:**
   - Install `cloudflared` on the Ubuntu VM and create a tunnel mapping `tg-origin.jcnino.dev` -> `http://127.0.0.1:8080`.
   - In Cloudflare Zero Trust -> Access -> Applications: create a Self-Hosted application for `jcnino.dev/tg*` (and `tg-origin.jcnino.dev`) allowing only your email.
   - Set `CF_ACCESS_AUD` in `.env` and restart `sudo systemctl restart tg-autoreply`.
10. **Browser-Based Telegram Onboarding:**
    - Open `https://jcnino.dev/tg` on your phone or laptop.
    - Sign in through Cloudflare Access, then sign in with your dashboard password + 2FA code.
    - Go to **System -> Telegram Account Session**, enter your phone number (`+63...`), enter the Telegram login code, and enter your Telegram 2FA password if prompted.
    - Keep **Dry-Run Mode** enabled while testing with a test account, then uncheck **Dry-Run Mode** to go live.

---

## 4. Troubleshooting

- **Duplicate replies:** Never run `--workers > 1` in Uvicorn. `deploy/tg-autoreply.service` enforces `--workers 1`.
- **Telegram `FloodWaitError`:** The service automatically pauses reconnects/sends for the requested cooldown. Increase `min_delay_sec` / `max_delay_sec` per contact.
- **AI stops replying:** Check **Overview -> Free-Tier API Quota**. If `100%` is reached, replies resume automatically at midnight Pacific Time.
- **Database recovery:** Stop the service (`sudo systemctl stop tg-autoreply`), copy the latest `.db` from `/opt/tg-auto-reply/data/backups/` over `tg_autoreply.db`, and start the service again.
