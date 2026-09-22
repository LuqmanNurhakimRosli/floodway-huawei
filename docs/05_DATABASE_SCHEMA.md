# FloodWay — Database Schema

## Firebase Services Used

- **Firebase Auth**: User authentication
- **Cloud Firestore**: Document database for flood reports

## Firestore Collections

### `floodReports`

Main collection for community-submitted and IoT-generated flood reports.

```typescript
// Document structure (FloodReport)
{
  id: string;                    // Firestore document ID
  photoDataURLs: string[];       // Array of image paths (e.g., ["/banjir2.jpg"])
  category: ReportCategory;      // "RISING_WATER" | "BLOCKED_ROAD" | "TRAPPED_VICTIM" | "LANDSLIDE"
  description: string;           // User-written or auto-generated description
  autoTags: {
    lat: number;                 // Latitude
    lng: number;                 // Longitude
    accuracy: number;            // GPS accuracy in meters
    timestamp: string;           // ISO-8601
    compassHeading: number|null; // Device compass heading (0-360)
  };
  aiResult: {                    // Gemini verification result (nullable)
    confidence: number;          // 0-100
    status: string;              // "PENDING" | "VERIFIED" | "UNVERIFIED" | "REJECTED"
    waterDetected: boolean;
    depthEstimate: string|null;  // e.g., "~0.5m"
    anomalies: string[];
    crossRefStatus: string;      // "CONSISTENT" | "MISMATCH" | "UNKNOWN"
    summary: string;
    rawAiResponse?: object;      // Raw Gemini JSON (debug)
    apiDurationMs?: number;
  } | null;
  humanReview: {
    status: string;              // "PENDING" | "APPROVED" | "OVERRIDDEN" | "REJECTED"
    reviewedAt: string|null;     // ISO-8601
    moderatorNote: string|null;
  };
  createdAt: string;             // ISO-8601 (Firestore may store as Timestamp)
}
```

### Fixed Seed Document IDs

Two demo reports are auto-seeded with stable IDs to prevent duplication:

| Seed ID | Description |
|---|---|
| `demo-masjid-india-2026` | Flash flood at Dataran Merdeka / Masjid India |
| `demo-jln-ampang-2026` | Submerged road at Jalan Ampang near LRT Ampang Park |

Seed documents are created via `setDoc` (idempotent) — calling `ensureSeedDocs()` multiple times creates exactly 2 documents.

### Deduplication Strategy

1. Seed reports use **fixed document IDs** (`setDoc`, not `addDoc`)
2. `fetchReports()` auto-purges stale duplicates (old addDoc docs with seed descriptions)
3. Client-side dedup by first 120 chars of description

## Firestore Security Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /floodReports/{reportId} {
      allow read:   if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
      allow delete: if request.auth != null;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

> **Note**: Current rules allow any authenticated user to perform CRUD. This is acceptable for FYP but should be tightened for production (owner-only updates, admin-only deletes).

## Firebase Auth Configuration

- **Providers**: Email/Password, Google (popup)
- **Google Provider**: `prompt: 'select_account'`
- **No Firestore user profiles**: User data comes from Firebase Auth user object only

## Report Visibility Logic

A report is shown on the map only if `isFullyVerified()` returns `true`:

```
OVERRIDDEN (human) → always show (moderator override)
REJECTED (human)   → never show
APPROVED (human) + VERIFIED (AI) → show
PENDING (human)    → don't show yet
```

## Local State vs Firestore

| Operation | Local | Firestore |
|---|---|---|
| Add report | Optimistic update | `addDoc` (fire-and-forget) |
| Delete report | Session-only hide | NOT deleted (preserves data) |
| Human review | Optimistic update | `updateDoc` |
| Seed reports | Pre-loaded `INITIAL_REPORTS` | `setDoc` on fetch |
