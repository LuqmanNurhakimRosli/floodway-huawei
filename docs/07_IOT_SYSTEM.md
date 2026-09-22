# FloodWay — IoT System

## Overview

FloodWay integrates an ESP32-based water level sensor via the **Web Serial API**. The sensor monitors river water levels and triggers automated alerts and reports when danger thresholds are exceeded.

## Hardware

- **Microcontroller**: ESP32
- **Connection**: USB Serial (COM port)
- **Baud Rate**: 115200
- **Data Format**: `level,status\n` (e.g., `75,WARNING\n`)
- **Status Values**: `SAFE`, `WARNING`, `DANGER`

## Software Architecture

```
ESP32 (USB) ──► Web Serial API ──► useBluetooth hook ──► AppContext
                                                            │
                                    ┌───────────────────────┼───────────────┐
                                    │                       │               │
                                    ▼                       ▼               ▼
                              IoTWidget              EmergencyAlert    Auto Report
                           (water tank UI)        (fullscreen modal)   (Firestore)
```

### Key Files

| File | Responsibility |
|---|---|
| `src/hooks/useBluetooth.ts` | Serial connection, data parsing, state management |
| `src/components/IoTWidget.tsx` | Water tank visualization + minimize/expand |
| `src/components/EmergencyAlert.tsx` | Full-screen alert with siren + vibration |
| `src/store/AppContext.tsx` | Automated report generation on DANGER |
| `src/data/locations.ts` | `IOT_SENSOR_LOCATION` constant |

## Data Parsing (`useBluetooth.ts`)

```typescript
// Primary format: "level,status"
const parts = text.split(',');
const level = parseInt(parts[0], 10);    // 0-100
const status = parts[1].toUpperCase();   // SAFE | WARNING | DANGER

// Fallback: just a number
const level = parseInt(text, 10);
if (level >= 80) status = 'DANGER';
else if (level >= 50) status = 'WARNING';
else status = 'SAFE';
```

## Sensor Location

```typescript
export const IOT_SENSOR_LOCATION = {
  name: 'Klang River',
  position: { lat: 3.149, lng: 101.696 }  // Near Masjid Jamek, KL
};
```

## Status Thresholds

| Level | Status | Color | Action |
|---|---|---|---|
| 0-49% | SAFE | Blue | Normal monitoring |
| 50-79% | WARNING | Yellow | Alert banner |
| 80-100% | DANGER | Red | Emergency alert + auto-report |

## Automated Report Generation

When IoT status transitions to `DANGER`, the system automatically:

1. Checks if a sensor report already exists for today (daily limit)
2. If no report today, creates a `FloodReport` with:
   - Category: `RISING_WATER`
   - Description: `"Water reach dangerous zone at location"`
   - AI result: 100% confidence, VERIFIED, Critical depth
   - Human review: PENDING
   - Location: IoT sensor coordinates
3. Saves to local state and Firestore
4. If moderator deletes the report, a new one can be generated on next DANGER event

## Emergency Alert (`EmergencyAlert.tsx`)

**Trigger conditions** (ALL must be true):
- IoT status is `DANGER`
- User has NOT dismissed the alert
- User is within **3.0 km** of the sensor

**Alert features**:
- Full-screen red overlay with blur
- Haptic vibration pattern: `[200, 100, 200]`
- Web Audio API siren: alternating 800Hz/1000Hz square wave for 5 seconds
- "Find Shelter Now" button → navigates to `/shelters`
- "Dismiss Warning" button → hides until status returns to SAFE

## Browser Compatibility

| Feature | Chrome | Edge | Firefox | Safari |
|---|---|---|---|---|
| Web Serial API | ✅ 89+ | ✅ 89+ | ❌ | ❌ |
| Web Audio API | ✅ | ✅ | ✅ | ✅ |
| Vibration API | ✅ | ✅ | ✅ | ❌ |

> **Important**: IoT features are Chrome/Edge only. The widget shows "Offline (Unsupported)" in other browsers.

## IoT Widget States

1. **Disconnected**: Shows "Connect USB/COM" button (or "Offline" if unsupported)
2. **Connected + Expanded**: Full water tank with level%, status label, distance
3. **Connected + Minimized**: Compact pill with status and level%

The widget is positioned at `fixed bottom-24 right-4 z-50` to sit above the bottom navigation.
