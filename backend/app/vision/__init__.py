"""FloodWay Live Vision: CCTV frames -> AI water level -> alert.

Public surface:
    router            FastAPI router (mount with app.include_router(router))
    vision_lifespan   lifespan context manager that starts/stops the engine
"""
from .bootstrap import build_default_engine, vision_lifespan
from .routes import router

__all__ = ["router", "vision_lifespan", "build_default_engine"]
