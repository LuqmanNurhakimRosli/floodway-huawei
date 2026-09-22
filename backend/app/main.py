from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import telemetry, twin, sos, shelters, predict, reports

app = FastAPI(
    title="FloodWay 2.0 Backend - Huawei ICT Competition",
    description="Enterprise life-safety intelligence platform powered by Huawei Cloud ModelArts, IoTDA & Ascend AI.",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all domain routers
app.include_router(telemetry.router)
app.include_router(twin.router)
app.include_router(sos.router)
app.include_router(shelters.router)
app.include_router(predict.router)
app.include_router(reports.router)

@app.get("/healthz")
def health_check():
    return {
        "status": "HEALTHY",
        "service": "FloodWay 2.0 Core Backend",
        "engine": "Huawei Cloud ModelArts + Ascend AI",
        "version": "2.0.0"
    }
