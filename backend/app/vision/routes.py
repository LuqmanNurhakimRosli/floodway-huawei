"""HTTP + WebSocket API. Mounted at /api/v1/vision.

    GET    /cameras                      list cameras with latest reading
    POST   /cameras                      add a camera (SSRF-guarded)
    DELETE /cameras/{id}                 remove a user camera
    POST   /cameras/upload               store an uploaded photo (raw JPEG/PNG body), returns its source reference
    POST   /cameras/preview              one frame from a draft source (wizard step 2)
    POST   /cameras/test                 one analysis for an unsaved camera (wizard step 3)
    POST   /cameras/{id}/analyze         run a cycle now
    GET    /cameras/{id}/readings        recent readings
    GET    /cameras/{id}/frame.jpg       latest captured frame
    GET    /alerts                       recent alerts
    WS     /ws                           push: snapshot, reading, alert, status, camera, camera_removed
"""
from __future__ import annotations

import asyncio

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, WebSocket, WebSocketDisconnect

from app.security import require_write_token

from .engine import VisionEngine
from .schemas import AlertEvent, CameraCreate, CameraPublic, Reading, SourceDraft
from .sources import SourceError
from .url_guard import UnsafeURL

router = APIRouter(prefix="/api/v1/vision", tags=["Live Vision"])


def _engine(request: Request) -> VisionEngine:
    engine = getattr(request.app.state, "vision_engine", None)
    if engine is None:
        raise HTTPException(503, "vision engine is not running")
    return engine


def _guard(call):
    """Translate domain errors to HTTP errors."""
    try:
        return call()
    except UnsafeURL as exc:
        raise HTTPException(422, str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(403, str(exc)) from exc
    except KeyError as exc:
        raise HTTPException(404, "camera not found") from exc
    except SourceError as exc:
        raise HTTPException(502, str(exc)) from exc


@router.get("/cameras", response_model=list[CameraPublic])
def list_cameras(request: Request):
    return _engine(request).list_public()


@router.post("/cameras", response_model=CameraPublic, status_code=201, dependencies=[Depends(require_write_token)])
def create_camera(draft: CameraCreate, request: Request):
    return _guard(lambda: _engine(request).add_camera(draft))


MAX_UPLOAD_BYTES = 5 * 1024 * 1024


@router.post("/cameras/upload", status_code=201, dependencies=[Depends(require_write_token)])
async def upload_photo(request: Request):
    engine = _engine(request)
    declared = request.headers.get("content-length")
    if declared and declared.isdigit() and int(declared) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, "photo is larger than 5 MB")
    chunks: list[bytes] = []
    size = 0
    async for chunk in request.stream():  # count as it arrives: Content-Length can be missing or wrong
        size += len(chunk)
        if size > MAX_UPLOAD_BYTES:
            raise HTTPException(413, "photo is larger than 5 MB")
        chunks.append(chunk)
    source_url = await asyncio.to_thread(_guard, lambda: engine.store_upload(b"".join(chunks)))
    return {"source_url": source_url}


@router.post("/cameras/preview", dependencies=[Depends(require_write_token)])
async def preview_frame(draft: SourceDraft, request: Request):
    engine = _engine(request)
    jpeg = await asyncio.to_thread(_guard, lambda: engine.preview_draft(draft))
    return Response(jpeg, media_type="image/jpeg", headers={"Cache-Control": "no-store"})


@router.post("/cameras/test", response_model=Reading, dependencies=[Depends(require_write_token)])
async def test_camera(draft: CameraCreate, request: Request):
    engine = _engine(request)
    return await asyncio.to_thread(_guard, lambda: engine.test_draft(draft))


@router.delete("/cameras/{camera_id}", status_code=204, dependencies=[Depends(require_write_token)])
def delete_camera(camera_id: str, request: Request):
    _guard(lambda: _engine(request).remove_camera(camera_id))
    return Response(status_code=204)


@router.post("/cameras/{camera_id}/analyze", response_model=Reading, dependencies=[Depends(require_write_token)])
async def analyze_now(camera_id: str, request: Request):
    engine = _engine(request)
    _guard(lambda: engine.get(camera_id))
    try:
        return await engine.analyze_once_async(camera_id)
    except SourceError as exc:
        raise HTTPException(502, str(exc)) from exc


@router.get("/cameras/{camera_id}/readings", response_model=list[Reading])
def get_readings(camera_id: str, request: Request, limit: int = Query(20, ge=1, le=200)):
    return _guard(lambda: _engine(request).readings(camera_id, limit))


@router.get("/cameras/{camera_id}/frame.jpg")
async def latest_frame(camera_id: str, request: Request):
    engine = _engine(request)
    rec = _guard(lambda: engine.get(camera_id))
    jpeg = rec.last_jpeg
    if jpeg is None:  # first request before the first cycle finished: capture once on demand
        try:
            await engine.analyze_once_async(camera_id)
        except SourceError as exc:
            raise HTTPException(502, str(exc)) from exc
        jpeg = rec.last_jpeg
    if jpeg is None:
        raise HTTPException(404, "no frame yet")
    return Response(jpeg, media_type="image/jpeg", headers={"Cache-Control": "no-store"})


@router.get("/alerts", response_model=list[AlertEvent])
def list_alerts(request: Request, limit: int = Query(20, ge=1, le=100)):
    return list(_engine(request).alerts)[:limit]


@router.websocket("/ws")
async def vision_socket(ws: WebSocket):
    engine: VisionEngine | None = getattr(ws.app.state, "vision_engine", None)
    if engine is None:
        await ws.close(code=1013)
        return
    await ws.accept()
    queue = engine.subscribe()
    try:
        await ws.send_json({"type": "snapshot", "cameras": [c.model_dump(mode="json") for c in engine.list_public()]})
        while True:
            try:
                message = await asyncio.wait_for(queue.get(), timeout=20)
            except asyncio.TimeoutError:
                message = {"type": "ping"}
            await ws.send_json(message)
    except (WebSocketDisconnect, RuntimeError):
        pass
    finally:
        engine.unsubscribe(queue)
