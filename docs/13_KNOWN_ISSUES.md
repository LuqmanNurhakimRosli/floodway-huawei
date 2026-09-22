# FloodWay — Known Issues

## Active Issues

### 1. Demo Mode Hardcoded (Severity: Medium)
**File**: `src/pages/HomePage.tsx` line ~39
```typescript
const hasDanger = true;  // HARDCODED for FYP demo
const hasWarning = false;
```
**Impact**: Dashboard always shows "Evacuate Now" regardless of real prediction data.
**Fix**: Replace with actual prediction state from AppContext.

### 2. Hook Name Mismatch (Severity: Low)
**File**: `src/hooks/useBluetooth.ts`
**Issue**: File is named `useBluetooth` but actually implements **Web Serial API**, not Bluetooth.
**Impact**: Confusing for developers. No functional issue.
**Fix**: Rename to `useSerialPort.ts` and update all imports.

### 3. Session-Only Report Deletion (Severity: Medium)
**File**: `src/store/AppContext.tsx` lines 167-178
**Issue**: Moderator "delete" only removes report from local state. Firestore data is preserved. Report reappears on page refresh.
**Impact**: Moderators cannot permanently remove reports from the panel.
**Fix**: Add Firestore `deleteDoc` call (function exists in `reportsService.ts` but is not called).

### 4. Duplicate city.glb (Severity: Low)
**Files**: `city.glb` (root) and `public/city.glb`
**Issue**: Same file exists in two locations. Only `public/city.glb` is used.
**Fix**: Delete root-level `city.glb`.

### 5. Firestore Rules Too Permissive (Severity: Medium)
**File**: `firestore.rules`
**Issue**: Any authenticated user can update/delete ANY report. No owner checks.
**Impact**: Acceptable for FYP demo but insecure for production.
**Fix**: Add `resource.data.userId == request.auth.uid` checks for update/delete.

### 6. No Error Boundary for 3D Canvas (Severity: Medium)
**File**: `src/pages/SimulationPage.tsx`
**Issue**: If WebGL crashes (unsupported GPU, context lost), the entire page breaks.
**Fix**: Wrap Canvas in React Error Boundary with fallback UI.

### 7. Photos Stored as Base64 (Severity: Medium)
**Issue**: Report photos are stored as base64 data URLs in Firestore documents.
**Impact**: Large document sizes. Firestore 1MB document limit could be hit.
**Fix**: Upload photos to Firebase Storage and store URLs instead.

### 8. Missing API Key Handling
**File**: `src/utils/openai.ts`
**Issue**: If `VITE_GEMINI_API_KEY` is not set, falls back to mock analysis silently.
**Impact**: Users may not realize AI verification is using mock data.
**Fix**: Show a warning badge or indicator when using mock mode.

## Resolved Issues

### ✅ Duplicate Seed Reports (Fixed 2026-05-02)
**Was**: `addDoc` created new seed docs on every page load.
**Fix**: Switched to `setDoc` with fixed document IDs (`demo-masjid-india-2026`, `demo-jln-ampang-2026`).

### ✅ IoT Report Spam (Fixed 2026-05-09)
**Was**: DANGER status continuously generated new reports.
**Fix**: Added daily limit check and `lastTriggeredStatus` ref to prevent loops.

### ✅ Camera Black Screen and Glitching on Laptop (Fixed 2026-05-09)
**Was**: `useCamera.ts` used `facingMode: 'environment'` (rear camera) which failed on laptops. Additionally, an **infinite loop** existed because `startCamera`/`stopCamera` were dependent on the `stream` state; updating the stream caused the callbacks to change, which re-triggered the `useEffect` in `EmergencyMode`, causing the camera to constantly restart ("glitching").
**Fix**: Added camera constraint fallback chain. Fixed infinite loop by using `useRef` for stream management. Added `loadedmetadata` event wait. Switched to `FileReader` for base64 URLs.

### ✅ Firebase Auth Not Working (Fixed 2026-05-02)
**Was**: `.env` had placeholder values.
**Fix**: Replaced with real Firebase project credentials.
