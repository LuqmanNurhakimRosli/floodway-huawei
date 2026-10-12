# FloodWay backend container. Build from the backend/ folder: docker build -t floodway-backend .
# Secrets are NOT baked in: set TELEGRAM_BOT_TOKEN, VISION_WRITE_TOKEN etc. in the host's environment settings.
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 HOST=0.0.0.0 VISION_DATA_DIR=/app/data
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# The host sets PORT (Render, Fly and Cloud Run all do). Default 8080 matches the frontend's local default.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
