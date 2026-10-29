# Deploy FloodWay on Huawei Cloud ECS

This runs the full app on one server: the backend (FastAPI, live analyser, models, AI photo check, Telegram) and the web app. Caddy adds HTTPS for free. You don't need to buy a domain: `<EIP>.sslip.io` points at your server's public IP.

## 1. Create the ECS (Huawei Cloud console, about 10 min)

1. **ECS → Buy ECS**, with these settings:
   - **Region:** AP-Singapore (closest to Malaysia).
   - **Billing:** pay-per-use.
   - **Flavor:** 2 vCPUs | 4 GiB, general computing (s6 or s7).
   - **Image:** public image, **Ubuntu 22.04 server 64bit**.
   - **System disk:** 40 GB.
2. **Network:**
   - The default VPC is fine.
   - Choose **Auto assign EIP**, with bandwidth billed by traffic at 5 Mbit/s.
3. **Security group.** Allow these inbound ports:

   | Port | Source | Purpose |
   |---|---|---|
   | 22 | your IP only | SSH |
   | 80 | 0.0.0.0/0 | HTTP |
   | 443 | 0.0.0.0/0 | HTTPS |

4. **Login:** set a password or a key pair, then buy it. Note the **EIP** (the public IP).

## 2. Put FloodWay on it

```bash
ssh root@<EIP>
git clone https://github.com/LuqmanNurhakimRosli/floodway-huawei.git
cd floodway-huawei/deploy/ecs
bash setup.sh
```

The first run installs Docker, writes `.env` with `DOMAIN=<EIP>.sslip.io`, then stops so you can fill in the keys.

Fill in `backend/.env` on the server with `nano ../../backend/.env`. Use the same values as your laptop's `backend/.env`:

- `VISION_WRITE_TOKEN`: any long random string.
- `OPENROUTER_API_KEY` or `GEMINI_API_KEY`: needed for the AI photo check.
- `TELEGRAM_BOT_TOKEN` and `TELEGRAM_DEFAULT_CHAT_ID`: needed for the family Telegram messages.

Then run `bash setup.sh` again. The first build takes about 5–8 minutes.

## 3. Open it

- **App:** `https://<EIP>.sslip.io`
- **API docs:** `https://api.<EIP>.sslip.io/docs`

## Everyday commands (run in `deploy/ecs`)

| What | Command |
|---|---|
| Update after a `git push` | `git pull && docker compose up -d --build` |
| Logs | `docker compose logs -f api` (or `web`) |
| Stop | `docker compose down` |

## If something fails

- **The site doesn't load.** Check the security group allows ports 80 and 443. Also check that `docker compose ps` shows both services running.
- **HTTPS errors in the first minute.** Caddy is still getting the certificate. Wait, then reload.
- **The app loads but shows no data.** Open `https://api.<EIP>.sslip.io/docs`. If that page fails, read `docker compose logs api`.
- **Never put keys in `frontend/.env`.** Every `VITE_*` value is public in the browser.
