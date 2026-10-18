"""Wires settings + analyser + alert channels + seed data into a ready engine, plus a FastAPI lifespan."""
from __future__ import annotations

from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI

from .alerts import AlertDispatcher, LogChannel, TelegramChannel
from .analysis import get_analyzer
from .config import VisionSettings
from .engine import VisionEngine
from .seed import seed_barriers, seed_samples


def build_default_engine(settings: Optional[VisionSettings] = None) -> VisionEngine:
    settings = settings or VisionSettings()
    channels = [LogChannel()]
    if settings.telegram_token and settings.telegram_chat_id:
        channels.append(TelegramChannel(settings.telegram_token, settings.telegram_chat_id))
    engine = VisionEngine(settings, get_analyzer(settings), AlertDispatcher(channels, settings.alert_cooldown_s))
    if settings.seed_samples:
        seed_samples(engine)
        seed_barriers(engine)
    return engine


@asynccontextmanager
async def vision_lifespan(app: FastAPI):
    """Compose into your app:  app = FastAPI(lifespan=vision_lifespan)"""
    engine = getattr(app.state, "vision_engine", None) or build_default_engine()
    app.state.vision_engine = engine
    await engine.start()
    try:
        yield
    finally:
        await engine.stop()
