"""Run the module on its own, without touching main.py:
    uvicorn app.vision.standalone:app --port 8080 --reload"""
from __future__ import annotations

from typing import Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .bootstrap import vision_lifespan
from .engine import VisionEngine
from .routes import router


def create_app(engine: Optional[VisionEngine] = None) -> FastAPI:
    app = FastAPI(title="FloodWay Live Vision", lifespan=vision_lifespan)
    if engine is not None:
        app.state.vision_engine = engine
    app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
    app.include_router(router)

    @app.get("/healthz")
    def healthz():
        return {"status": "HEALTHY", "service": "FloodWay Live Vision"}

    return app


app = create_app()
