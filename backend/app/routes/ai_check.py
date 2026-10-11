"""AI assessment of a citizen flood photo, done server-side so the OpenRouter key never reaches the browser.

HONESTY: this is a multimodal model's opinion of one photo. It is not verification by any agency, and the result
names the model that actually ran. If no key is configured, or the call fails, the endpoint says so
(`available: false`). It never invents a result.
"""
from __future__ import annotations

import json
import logging
import os
import re

import httpx
from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, Field

from app.security import RateLimiter, require_write_token

logger = logging.getLogger("FloodWayAiCheck")
router = APIRouter(prefix="/api/v1/ai", tags=["AI assessment"])

_limiter = RateLimiter(limit=6, window_s=60.0)
MAX_IMAGE_CHARS = 8_000_000  # a data URL of roughly 6 MB


class ImageCheckRequest(BaseModel):
    image_data_url: str = Field(min_length=32, max_length=MAX_IMAGE_CHARS, pattern=r"^data:image/(png|jpeg|jpg|webp);base64,")
    description: str = Field(default="", max_length=300)
    reported_depth_cm: float | None = Field(default=None, ge=0, le=1000)


class ImageCheckResult(BaseModel):
    available: bool
    engine: str
    looks_like_flooding: bool | None = None
    appears_authentic: bool | None = None
    estimated_depth_cm: float | None = None
    confidence: float | None = Field(default=None, ge=0, le=1)
    hazards: list[str] = []
    notes: str


PROMPT = (
    "You assess one photo for a flood-reporting app. Be cautious and say when you are unsure.\n"
    'User description: "{description}". User-reported depth: {depth}.\n'
    "Answer ONLY with JSON, no markdown, with these keys:\n"
    '{{"looks_like_flooding": true|false, "appears_authentic": true|false|null, "estimated_depth_cm": number|null, '
    '"confidence": number between 0 and 1 (your honest certainty, low is fine), '
    '"hazards": [up to 4 short tags], "notes": "one or two sentences on what is visible and what is uncertain"}}\n'
    "Use null when you cannot tell. Do not claim certainty you do not have."
)


async def _call_openrouter(key: str, model: str, body: ImageCheckRequest) -> dict:
    payload = {
        "model": model,
        "messages": [{
            "role": "user",
            "content": [
                {"type": "text", "text": PROMPT.format(description=body.description or "none", depth=body.reported_depth_cm if body.reported_depth_cm is not None else "not given")},
                {"type": "image_url", "image_url": {"url": body.image_data_url}},
            ],
        }],
    }
    async with httpx.AsyncClient(timeout=40.0) as client:
        res = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json", "X-Title": "FloodWay demo"},
            json=payload,
        )
    res.raise_for_status()
    content = res.json()["choices"][0]["message"]["content"]
    match = re.search(r"\{.*\}", content, re.S)
    if not match:
        raise ValueError("the model did not return JSON")
    return json.loads(match.group(0))


def _num(v, lo=None, hi=None):
    try:
        n = float(v)
    except (TypeError, ValueError):
        return None
    if n != n or n in (float("inf"), float("-inf")):
        return None
    if lo is not None:
        n = max(lo, n)
    if hi is not None:
        n = min(hi, n)
    return n


def normalise(raw: dict, engine: str) -> ImageCheckResult:
    """Coerce model output to the schema. Bad or missing fields become None, never made-up defaults."""
    hazards = [str(h)[:40] for h in raw.get("hazards", []) if isinstance(h, str)][:4] if isinstance(raw.get("hazards"), list) else []
    flag = lambda v: v if isinstance(v, bool) else None
    return ImageCheckResult(
        available=True,
        engine=engine,
        looks_like_flooding=flag(raw.get("looks_like_flooding")),
        appears_authentic=flag(raw.get("appears_authentic")),
        estimated_depth_cm=_num(raw.get("estimated_depth_cm"), 0, 1000),
        confidence=_num(raw.get("confidence"), 0, 1),
        hazards=hazards,
        notes=str(raw.get("notes", ""))[:400] or "The model gave no notes.",
    )


@router.post("/flood-image-check", response_model=ImageCheckResult, dependencies=[Depends(require_write_token)])
async def flood_image_check(body: ImageCheckRequest, request: Request):
    _limiter.check(request.client.host if request.client else "unknown")
    key = os.getenv("OPENROUTER_API_KEY", "")
    model = os.getenv("OPENROUTER_MODEL", "google/gemini-2.5-flash")
    engine = f"{model} via OpenRouter (AI assessment, not an official verification)"
    if not key:
        return ImageCheckResult(available=False, engine="none", notes="The AI check is not configured on this server, so it was not run.")
    try:
        return normalise(await _call_openrouter(key, model, body), engine)
    except Exception as exc:  # network, quota, bad JSON: say so, never fabricate
        logger.warning("AI image check failed: %s", exc)
        return ImageCheckResult(available=False, engine=engine, notes="The AI check could not be completed. This report has not been checked by AI.")
