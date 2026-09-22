# FloodWay — TODO

## High Priority

- [ ] Remove `hasDanger = true` hardcode in `HomePage.tsx` (line ~39) and connect to real prediction data
- [ ] Connect CCTV feed to real camera stream (currently static image)
- [ ] Deploy backend (FastAPI) to a cloud service (Railway, Render, or Cloud Run)
- [ ] Add proper error boundaries for 3D simulation (WebGL crashes)
- [ ] Rename `useBluetooth.ts` to `useSerialPort.ts` (name is misleading — it uses Web Serial, not Bluetooth)

## Medium Priority

- [ ] Implement real Firestore deletion in moderator panel (currently session-only hide)
- [ ] Add offline support / PWA manifest
- [ ] Add loading states for Firestore operations
- [ ] Implement proper user roles (admin vs regular user) in Firestore rules
- [ ] Add report photo upload to Firebase Storage (currently base64 inline)
- [ ] Clean up legacy `screens/` folder (dead code)
- [ ] Clean up legacy `Navigation app/` and `report feature/` folders
- [ ] Remove or update `docs.tsx` (55KB in-app docs, may be stale)

## Low Priority / Future

- [ ] v4.0: GPS-anchored 3D simulation (Mapbox 3D Tiles or CesiumJS)
- [ ] v5.0: AR flood overlay (WebXR API)
- [ ] LSTM model for time-series flood prediction (replacing ANN)
- [ ] Real-time Firestore listeners (onSnapshot) for live report updates
- [ ] Push notifications via Firebase Cloud Messaging
- [ ] Multi-language support (Bahasa Malaysia, Chinese, Tamil)
- [ ] Integrate real weather API (OpenWeatherMap or Malaysian MET)
- [ ] Add unit tests (currently zero test coverage)
- [ ] Add E2E tests (Playwright or Cypress)

## Technical Debt

- [ ] `SimulationPage.tsx` is 856 lines — consider splitting into sub-components
- [ ] `HomePage.tsx` is 554 lines — consider component extraction
- [ ] Duplicate `city.glb` exists at root and `public/` — remove root copy
- [ ] Some CSS is inline, some in separate `.css` files, some Tailwind — standardize
- [ ] `@types/web-bluetooth` in devDeps but Web Bluetooth is not actually used
- [ ] `arch.md` at root is 80KB — superseded by this `/docs` system
