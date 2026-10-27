#!/usr/bin/env python3
"""
FloodWay Bench IoT Serial Bridge
Reads telemetry from Nadi's ESP32 over USB Serial or Bluetooth COM port
and forwards to FloodWay backend (/api/v1/ingest).

Usage:
  python scripts/bench_bridge.py --port COM3 --baud 115200
"""

import argparse
import sys
import time
import requests

try:
    import serial
except ImportError:
    print("pyserial is required: pip install pyserial requests")
    sys.exit(1)


def parse_args():
    parser = argparse.ArgumentParser(description="FloodWay ESP32 Serial Bridge")
    parser.add_argument("--port", default="COM3", help="Serial port (e.g. COM3 or /dev/ttyUSB0)")
    parser.add_argument("--baud", type=int, default=115200, help="Baud rate (default 115200)")
    parser.add_argument("--api", default="http://127.0.0.1:8080/api/v1/ingest", help="Ingest URL")
    parser.add_argument("--device", default="fw-bench-01", help="Device ID")
    parser.add_argument("--mount-height", type=float, default=8.0, help="Mount height in cm (default 8.0)")
    return parser.parse_args()


def main():
    args = parse_args()
    print(f"Opening {args.port} at {args.baud} baud...")
    try:
        ser = serial.Serial(args.port, args.baud, timeout=1)
    except Exception as e:
        print(f"Error opening serial port {args.port}: {e}")
        sys.exit(1)

    print(f"Connected! Forwarding ESP32 readings to {args.api} for device '{args.device}'")
    print("Format supported: '72,DANGER' or 'dist: 3.5' or raw float")

    while True:
        try:
            raw = ser.readline().decode("utf-8", errors="ignore").strip()
            if not raw:
                continue

            print(f"[ESP32] {raw}")
            dist_cm = None

            if "," in raw:
                pct_str = raw.split(",")[0].strip()
                try:
                    pct = float(pct_str)
                    # Reverse map percentage (0% = mount height, 100% = 1cm)
                    dist_cm = args.mount_height - (pct / 100.0 * (args.mount_height - 1.0))
                except ValueError:
                    pass
            elif "dist" in raw.lower():
                parts = raw.split(":")
                if len(parts) > 1:
                    try:
                        dist_cm = float(parts[1].replace("cm", "").strip())
                    except ValueError:
                        pass
            else:
                try:
                    val = float(raw)
                    if val <= 8.0:
                        dist_cm = val
                except ValueError:
                    pass

            if dist_cm is None:
                continue

            dist_cm = max(1.0, min(8.0, round(dist_cm, 1)))
            payload = {
                "device_id": args.device,
                "ts": int(time.time()),
                "distance_cm": dist_cm
            }

            resp = requests.post(args.api, json=payload, timeout=2)
            if resp.status_code == 200:
                data = resp.json()
                print(f" -> [ACCEPTED] level={data.get('level_m')}m, phase={data.get('phase')}")
            else:
                print(f" -> [ERROR {resp.status_code}] {resp.text}")

        except KeyboardInterrupt:
            print("\nBridge stopped by user.")
            break
        except Exception as e:
            print(f"Bridge loop error: {e}")
            time.sleep(1)


if __name__ == "__main__":
    main()
