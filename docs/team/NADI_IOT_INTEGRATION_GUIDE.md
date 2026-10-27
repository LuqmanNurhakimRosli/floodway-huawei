# Master Implementation Guide for Nadi: Physical IoT Node Integration

**Target Submission / Milestone:** Huawei ICT Competition Semi-Final (3 Nov 2026) · Hardware Live Trial  
**Author:** RESQ4ACE AI Engineering Team (FloodWay)  
**Target Hardware:** ESP32 + HC-SR04 (Ultrasonic) + I2C 20x4 LCD + 3 LEDs + Buzzer  

---

## 1. Objective & Current Status

Nadi has successfully built and verified the physical bench-scale IoT sensor node:
* **Functioning locally:** Measures water height / distance inside a demo container (1–8 cm).
* **Local outputs:** Updates the 20x4 LCD, toggles LEDs (Green/Yellow/Red), and sounds the piezo buzzer on DANGER (>66% capacity).
* **Current communication:** Broadcasts `percentage,STATUS` over Bluetooth Classic (`BluetoothSerial`).

### The Goal:
Connect Nadi's physical node to FloodWay so that **pouring water into the demo cup directly drives the live Four-Factor Fusion ring on the web app (`/live`) in real time**.

---

## 2. Two Testing Tracks (Choose One)

We provide two pathways:
* **Track 1 (Direct WiFi - Recommended for competition day):** ESP32 connects to WiFi / phone hotspot and sends JSON HTTP POST directly to `/api/v1/ingest`. Standalone, no cables to the laptop.
* **Track 2 (USB Serial Bridge - Fastest "Try It Now" with Zero ESP32 Code Changes):** Keep Nadi's existing Arduino code untouched. Plug the ESP32 into the laptop via USB cable (or BT COM port). A 30-line Python bridge forwards readings into FloodWay.

---

## Track 1: Direct WiFi HTTP POST (Cleanest / Standalone)

### A. ESP32 Firmware Snippet
Add WiFi and HTTP POST to Nadi's existing Arduino sketch:

```cpp
#include <WiFi.h>
#include <HTTPClient.h>

// --- WiFi Configuration ---
const char* WIFI_SSID = "YOUR_HOTSPOT_NAME";
const char* WIFI_PASS = "YOUR_PASSWORD";

// Target endpoint: use laptop's local IP (e.g. 192.168.43.50:8080) or Cloudflare Tunnel
const char* API_URL = "http://192.168.43.50:8080/api/v1/ingest";
const char* DEVICE_ID = "fw-bench-01";

unsigned long lastSend = 0;
const unsigned long SEND_INTERVAL_MS = 2000; // Send every 2 seconds

void setupWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected! IP: " + WiFi.localIP().toString());
}

void sendReadingToFloodWay(float distanceCm) {
  if (WiFi.status() != WL_CONNECTED) return;
  if (millis() - lastSend < SEND_INTERVAL_MS) return;
  lastSend = millis();

  HTTPClient http;
  http.begin(API_URL);
  http.addHeader("Content-Type", "application/json");

  long ts = (long)(millis() / 1000); // Or use NTP time
  // JSON payload format expected by FloodWay backend
  String payload = "{\"device_id\":\"" + String(DEVICE_ID) + "\","
                 + "\"ts\":" + String(ts) + ","
                 + "\"distance_cm\":" + String(distanceCm, 1) + "}";

  int httpCode = http.POST(payload);
  Serial.printf("FloodWay Ingest: dist=%.1f cm -> HTTP %d\n", distanceCm, httpCode);
  http.end();
}
```

### B. Important Hardware Guard: `pulseIn` Timeout Fix
In the existing sketch, if the sensor misses an echo (or a wire loosens), `pulseIn` returns `0`, which clamps to 1 cm (100% water height) and falsely triggers the siren!
**Fix:**
```cpp
// Add 30ms timeout (prevents hanging & false 0 echo readings)
unsigned long duration = pulseIn(ECHO_PIN, HIGH, 30000UL); 
if (duration == 0) {
  return; // Skip invalid ping; do NOT send or alarm
}
float distanceCm = duration * 0.0343 / 2.0;
```

---

## Track 2: Serial USB / Bluetooth Bridge (Fastest "Try It Now")

If Nadi wants to test **immediately** without modifying or reflashing the ESP32:

1. Connect the ESP32 to the laptop via USB cable (e.g. `COM3` or `COM4`).
2. Run this bridge script on the laptop (`scripts/bench_bridge.py`):

```python
"""
FloodWay Bench IoT Bridge:
Reads Nadi's ESP32 Serial output and forwards to FloodWay backend.
"""
import time
import serial
import requests

SERIAL_PORT = "COM3"   # Check Device Manager / Arduino IDE port
BAUD_RATE = 115200
API_URL = "http://127.0.0.1:8080/api/v1/ingest"
DEVICE_ID = "fw-bench-01"
MOUNT_HEIGHT_CM = 8.0  # Container height

ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
print(f"Connected to {SERIAL_PORT}. Forwarding telemetry to {API_URL}...")

while True:
    line = ser.readline().decode('utf-8', errors='ignore').strip()
    if not line:
        continue
    print(f"ESP32: {line}")
    
    # Parses format: "72,DANGER" or "dist: 3.5" or percentage
    try:
        if "," in line:
            pct_str, status = line.split(",", 1)
            pct = float(pct_str)
            # Reverse calculate distance from percentage:
            # 0% = 8 cm distance (empty), 100% = 1 cm distance (full)
            dist_cm = round(MOUNT_HEIGHT_CM - (pct / 100.0 * (MOUNT_HEIGHT_CM - 1.0)), 1)
        else:
            continue

        payload = {
            "device_id": DEVICE_ID,
            "ts": int(time.time()),
            "distance_cm": max(1.0, min(dist_cm, 8.0))
        }
        res = requests.post(API_URL, json=payload, timeout=2)
        print(f" -> FloodWay Response: {res.status_code} ({res.json().get('status')})")
    except Exception as e:
        print(f"Error parsing/forwarding: {e}")
```

---

## 3. FloodWay System Updates Needed (Luqman's Side)

To make sure Nadi's bench node works seamlessly without validation errors:

1. **Update `backend/app/routes/telemetry.py`**:
   - Current constraint: `distance_cm: float = Field(ge=10, le=800)`.
   - Update to: `distance_cm: float = Field(ge=1.0, le=800)` so that 1–8 cm bench measurements are accepted.
2. **Register Bench Device in `backend/app/config.py`**:
   ```python
   "fw-bench-01": {
       "id": "fw-bench-01",
       "name": "Bench River Depth Node (Demo)",
       "secret": "fw-secret-bench",
       "mount_height_cm": 8.0,
       "warning_threshold_m": 0.03,  # 3 cm water
       "danger_threshold_m": 0.05,   # 5 cm water
   }
   ```
3. **Wire Live Telemetry to `/live` Fusion UI**:
   - In `FusionHero.tsx`, feed the real device reading from `AppContext` / `/api/v1/devices` into the `iot` tile, replacing the static demo number when connected.

---

## 4. End-to-End Test Protocol (The Demo Rehearsal)

Once connected, run this 4-step verification:

1. **Empty Container (Calm/Normal):**
   - Distance: ~7–8 cm.
   - ESP32: Green LED ON, LCD: `Level: 15% SAFE`.
   - Web (`/live`): IoT tile displays `15% NORMAL`. Risk ring shows `NORMAL`.
2. **Pour Water to 50% (Warning):**
   - Distance: ~4–5 cm.
   - ESP32: Yellow LED ON, LCD: `Level: 50% WARNING`.
   - Web (`/live`): IoT tile pulses yellow and updates to `50% WARNING`.
3. **Pour Water to 80% (Danger):**
   - Distance: ~2 cm.
   - ESP32: Red LED ON, Piezo buzzer sirens, LCD: `Level: 80% DANGER`.
   - Web (`/live`): IoT tile turns red (`DANGER`). Four-Factor risk ring escalates to `DANGER (2 of 4 agree)`.
4. **Drain Water:**
   - Distance recovers to 7–8 cm. Buzzer silences, web interface smoothly returns to green.
