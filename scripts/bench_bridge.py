#!/usr/bin/env python3
"""
FloodWay Bench IoT Serial Bridge
Reads telemetry from Nadi's ESP32 over a Bluetooth COM port (or USB Serial)
and forwards it, HMAC-signed, to FloodWay backend (/api/v1/ingest).

Bluetooth on Windows: pair "FloodWay-IoT-Node" in Settings > Bluetooth, then use the
"Outgoing" COM port shown under More Bluetooth settings > COM Ports (or run --list).

Usage:
  python scripts/bench_bridge.py --list
  python scripts/bench_bridge.py --port COM5
"""

import argparse
import hashlib
import hmac
import sys
import time
import requests

try:
    import serial
    from serial.tools import list_ports
except ImportError:
    print("pyserial is required: pip install pyserial requests")
    sys.exit(1)


def parse_args():
    parser = argparse.ArgumentParser(description="FloodWay ESP32 Serial Bridge")
    parser.add_argument("--port", default="COM3", help="Serial port (e.g. COM5 or /dev/rfcomm0)")
    parser.add_argument("--baud", type=int, default=115200, help="Baud rate (default 115200; ignored by Bluetooth)")
    parser.add_argument("--api", default="http://127.0.0.1:8080/api/v1/ingest", help="Ingest URL")
    parser.add_argument("--device", default="fw-bench-01", help="Device ID")
    parser.add_argument("--secret", default="fw-secret-bench", help="Device signing secret (backend DEVICES); '' sends unsigned")
    parser.add_argument("--mount-height", type=float, default=8.0, help="Mount height in cm (default 8.0)")
    parser.add_argument("--list", action="store_true", help="List serial ports and exit")
    return parser.parse_args()


def parse_line(raw, mount_height):
    """Distance in cm from one ESP32 line, or None. Accepts "57,WARNING,4.0", "57,WARNING", "dist: 3.5" or "3.5"."""
    if not raw or raw.startswith("#"):
        return None
    try:
        if "," in raw:
            parts = [p.strip() for p in raw.split(",")]
            if len(parts) >= 3:
                return float(parts[2])
            # Older firmware sends only the percentage: reverse map it (0% = mount height, 100% = 1 cm)
            return mount_height - (float(parts[0]) / 100.0 * (mount_height - 1.0))
        if "dist" in raw.lower():
            return float(raw.split(":", 1)[1].replace("cm", "").strip())
        val = float(raw)
        return val if val <= mount_height else None
    except (ValueError, IndexError):
        return None


def build_payload(device, secret, dist_cm, ts):
    ds = f"{dist_cm:.1f}"  # the server signs over f"{distance_cm:.1f}", so send exactly this value
    payload = {"device_id": device, "ts": ts, "distance_cm": float(ds)}
    if secret:
        payload["sig"] = hmac.new(secret.encode(), f"{device}.{ts}.{ds}".encode(), hashlib.sha256).hexdigest()
    return payload


def open_port(args):
    """Open the port, retrying forever: Bluetooth COM ports drop when the ESP32 resets or walks out of range."""
    while True:
        try:
            ser = serial.Serial(args.port, args.baud, timeout=1)
            print(f"Connected to {args.port}. Forwarding to {args.api} as '{args.device}'")
            return ser
        except Exception as e:
            print(f"Cannot open {args.port} ({e}); retrying in 3 s...")
            time.sleep(3)


def main():
    args = parse_args()
    if args.list:
        for p in list_ports.comports():
            print(f"{p.device:8} {p.description}")
        return

    ser = open_port(args)
    while True:
        try:
            raw = ser.readline().decode("utf-8", errors="ignore").strip()
            if not raw:
                continue

            print(f"[ESP32] {raw}")
            dist_cm = parse_line(raw, args.mount_height)
            if dist_cm is None:
                continue

            dist_cm = max(1.0, min(args.mount_height, dist_cm))
            payload = build_payload(args.device, args.secret, dist_cm, int(time.time()))
            resp = requests.post(args.api, json=payload, timeout=2)
            if resp.status_code == 200:
                data = resp.json()
                print(f" -> [{data.get('status')}] level={data.get('level_m')}m, phase={data.get('phase')}")
            else:
                print(f" -> [ERROR {resp.status_code}] {resp.text}")

        except KeyboardInterrupt:
            print("\nBridge stopped by user.")
            break
        except serial.SerialException as e:
            print(f"Serial link lost ({e}); reconnecting...")
            try:
                ser.close()
            except Exception:
                pass
            ser = open_port(args)
        except Exception as e:
            print(f"Bridge loop error: {e}")
            time.sleep(1)


if __name__ == "__main__":
    main()
