"""clients.py - ModelArts, rainfall feed, SMN notifier. Every external call has a timeout and a degraded fallback."""
from __future__ import annotations

import logging
import os
from typing import Protocol

import httpx

from flood_core import WINDOW

log = logging.getLogger("floodway")


# ---------- ModelArts ----------
class Forecaster:
    """Calls the ModelArts real-time service; falls back to a local model only in dev (MODELARTS_URL unset)."""

    def __init__(self):
        self.url = os.getenv("MODELARTS_URL", "")
        self.app_code = os.getenv("MODELARTS_APP_CODE", "")          # APP-auth (X-Apig-AppCode)
        self.token = os.getenv("MODELARTS_IAM_TOKEN", "")            # or a short-lived IAM token
        self._local = None

    @property
    def source(self) -> str:
        return "modelarts" if self.url else "local"

    async def predict(self, rain_mm: list[float], level_m: list[float]) -> dict:
        if not self.url:
            if self._local is None:
                from flood_core import FloodPredictor
                self._local = FloodPredictor(os.getenv("LOCAL_MODEL_DIR", "model_out"))
            return self._local.predict(rain_mm, level_m)
        headers = {"Content-Type": "application/json"}
        if self.app_code:
            headers["X-Apig-AppCode"] = self.app_code
        elif self.token:
            headers["X-Auth-Token"] = self.token
        async with httpx.AsyncClient(timeout=4.0) as c:
            for attempt in (1, 2):
                try:
                    r = await c.post(self.url, json={"rain_mm": rain_mm, "level_m": level_m}, headers=headers)
                    r.raise_for_status()
                    return r.json()
                except httpx.HTTPError as e:
                    log.warning("modelarts attempt %s failed: %s", attempt, e)
        raise RuntimeError("modelarts unavailable")


# ---------- Rainfall feed ----------
async def fetch_rain_window(lat: float, lon: float) -> list[float] | None:
    """Last 24 x 15 min of precipitation. Returns None if unavailable -> caller MUST mark forecast degraded."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as c:
            r = await c.get("https://api.open-meteo.com/v1/forecast", params={
                "latitude": lat, "longitude": lon, "minutely_15": "precipitation",
                "past_minutely_15": WINDOW, "forecast_minutely_15": 0, "timezone": "Asia/Kuala_Lumpur"})
            r.raise_for_status()
            vals = [v if v is not None else 0.0 for v in r.json()["minutely_15"]["precipitation"]]
        return vals[-WINDOW:] if len(vals) >= WINDOW else None
    except Exception as e:                                             # noqa: BLE001
        log.warning("rain feed failed: %s", e)
        return None


# ---------- Notifications ----------
class Notifier(Protocol):
    def send(self, recipients: list[str], subject: str, body: str) -> str: ...


class ConsoleNotifier:
    def send(self, recipients, subject, body):
        log.warning("[SOS-DEMO] to=%s | %s | %s", recipients, subject, body)
        return "console"


class SmnNotifier:
    """Huawei SMN publish. NOTE: publish goes to ALL subscribers of the topic -> one topic per family group in production.
    SMS subscribers must confirm their subscription BEFORE the flood (do this in family onboarding)."""

    def __init__(self):
        from huaweicloudsdkcore.auth.credentials import BasicCredentials
        from huaweicloudsdksmn.v2 import SmnClient
        from huaweicloudsdksmn.v2.region.smn_region import SmnRegion
        creds = BasicCredentials(os.environ["HW_AK"], os.environ["HW_SK"], os.environ["HW_PROJECT_ID"])
        self.client = SmnClient.new_builder().with_credentials(creds) \
            .with_region(SmnRegion.value_of(os.getenv("HW_REGION", "ap-southeast-3"))).build()
        self.topic_urn = os.environ["SMN_TOPIC_URN"]

    def send(self, recipients, subject, body):
        from huaweicloudsdksmn.v2 import PublishMessageRequest, PublishMessageRequestBody
        req = PublishMessageRequest(topic_urn=self.topic_urn,
                                    body=PublishMessageRequestBody(subject=subject[:64], message=body))
        self.client.publish_message(req)
        return "smn"


def make_notifier() -> Notifier:
    if os.getenv("NOTIFIER", "console") == "smn":
        return SmnNotifier()
    return ConsoleNotifier()
