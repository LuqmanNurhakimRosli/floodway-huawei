import os
import json
from dotenv import load_dotenv

load_dotenv()

HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8080"))
DEV_AUTH = os.getenv("DEV_AUTH", "1") == "1"

HUAWEI_CLOUD_PROJECT_ID = os.getenv("HUAWEI_CLOUD_PROJECT_ID", "")
HUAWEI_MODELARTS_ENDPOINT = os.getenv("HUAWEI_MODELARTS_ENDPOINT", "")
HUAWEI_MODELARTS_APP_KEY = os.getenv("HUAWEI_MODELARTS_APP_KEY", "")
HUAWEI_MODELARTS_APP_SECRET = os.getenv("HUAWEI_MODELARTS_APP_SECRET", "")
HUAWEI_SMN_TOPIC_URN = os.getenv("HUAWEI_SMN_TOPIC_URN", "")

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_DEFAULT_CHAT_ID = os.getenv("TELEGRAM_DEFAULT_CHAT_ID", "")

# Default IoT station configuration
DEFAULT_DEVICES = {
    "fw-node-01": {
        "id": "fw-node-01",
        "name": "Kampung Baru Station (Klang River)",
        "secret": "fw-secret-2026",
        "mount_height_cm": 400.0,
        "lat": 3.1610,
        "lon": 101.7010,
        "warning_threshold_m": 1.20,
        "danger_threshold_m": 1.50
    },
    "fw-node-02": {
        "id": "fw-node-02",
        "name": "Taman Sri Muda Station (Klang River South)",
        "secret": "fw-secret-srimuda",
        "mount_height_cm": 450.0,
        "lat": 3.0335,
        "lon": 101.5372,
        "warning_threshold_m": 1.30,
        "danger_threshold_m": 1.65
    },
    # Street-level depth node for the demo underpass barrier B-02. Mounted on a pole 3 m above the road, so the
    # level is road water depth. 0.15 m and 0.30 m are working thresholds for cars, not an official standard.
    "fw-node-03": {
        "id": "fw-node-03",
        "name": "Jalan Kuching underpass depth node (demo)",
        "secret": "fw-secret-underpass",
        "mount_height_cm": 300.0,
        "lat": 3.1832,
        "lon": 101.6798,
        "warning_threshold_m": 0.15,
        "danger_threshold_m": 0.30,
        "initial_level_m": 0.0
    }
}

try:
    DEVICES = json.loads(os.getenv("DEVICES", "")) if os.getenv("DEVICES") else DEFAULT_DEVICES
except Exception:
    DEVICES = DEFAULT_DEVICES

try:
    FAMILY = json.loads(os.getenv("FAMILY", "{}"))
except Exception:
    FAMILY = {"default": ["+60123456789"]}

STALE_AFTER_SECONDS = 600
MAX_SKEW_SECONDS = 120
SOS_MIN_GAP_SECONDS = 30
