"""Runs the backend for the public demo: read-only for visitors, no Telegram, its own data folder.

Started by scripts/public-demo.ps1, which sets FW_PORT, FW_ORIGIN and FW_TOKEN. Everything is set before app.config runs
load_dotenv(), which never overrides a variable that already exists, even an empty one. So the Telegram token in
backend/.env is not loaded here."""
import os
import sys
from pathlib import Path

backend = Path(__file__).resolve().parents[1] / "backend"
os.chdir(backend)
sys.path.insert(0, str(backend))
os.environ.update(
    CORS_ORIGINS=os.environ["FW_ORIGIN"],
    VISION_WRITE_TOKEN=os.environ["FW_TOKEN"],   # writes need the token; visitors are read-only
    VISION_DATA_DIR="data-public",               # never exposes cameras saved by the local dev backend
    TELEGRAM_BOT_TOKEN="",
    TELEGRAM_DEFAULT_CHAT_ID="",
)

import uvicorn  # noqa: E402  (after the environment is set)

uvicorn.run("app.main:app", host="127.0.0.1", port=int(os.environ["FW_PORT"]))
