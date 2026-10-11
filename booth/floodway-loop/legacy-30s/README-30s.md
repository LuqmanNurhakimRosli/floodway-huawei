# FloodWay Booth Loop (v2)

A silent, seamless 30-second motion piece for the FloodWay booth TV and social channels. It plays from a browser with no internet connection and conveys the full product value in seven scenes:

| Scene | Time (s) | Title | Content |
|---|---|---|---|
| S1 | 0.0–3.6 | The People | Periodic rain streaks, 4 persona cards flip in: Aisyah, Kumar, Mei Ling, Nenek. "Same rain. Different risks." |
| S2 | 3.6–7.5 | The Hero | Circular wipe. Hero phone rises from below. Lock screen alert: "Flood risk rising near you." Wordmark "FloodWay" reveals. "Know before you go." |
| S3 | 7.5–12.5 | Watch The Water | Push into phone. Digital Twin street & house cross-section. Water plane rises 0.00m to 0.30m. "Navigate to Safe Shelter (PPS)" button slides up with pulse. |
| S4 | 12.5–17.5 | Get Out The Smart Way | Phone eases back. Shelter map: red flooded road segments. Green safe route draws dynamically avoiding blocked roads. ETA chip lands: "SK Seksyen 24 · 7 min · 1.2 km". |
| S5 | 17.5–22.0 | Tell Your People | Tap ripple on SOS button. 3 family avatars (Papa, Mama, Adik) check in with green status ticks. "Live GPS shared via Telegram". |
| S6 | 22.0–26.0 | How It Works | Phone slides to left third. 3-node technical pipeline: Rain & water data → Forecast service → Your route & alerts. Community reports pill. |
| S7 | 26.0–30.0 | Home Safe + Loop | 4 personas return with green "Home safe" badges. Phone re-centres. Closing tagline & URL. Last 1.0s cleanly clears to S1 rain state for seamless loop. |

S1–S5 carry "Illustrative dramatization" and "Always follow official warnings (MetMalaysia / JPS)" corner disclaimers. S1 & S7 carry "Illustrative personas".

## File Structure

| File | Purpose |
|---|---|
| `index.html` | Completely self-contained motion engine. Inline CSS, JS, SVG, embedded Outfit font (base64 woff2), strict CSP, zero external requests, pure `window.renderFrame(t)` function. |
| `render.mjs` | Playwright + FFmpeg frame exporter: steps `renderFrame(t)` frame-by-frame and streams lossless PNGs into FFmpeg. |
| `generate-index.mjs` | Build script that embeds font binaries into `index.html`. |
| `BRIEF.md` | Master brief saved verbatim from specifications. |
| `package.json` | Pinned dev dependencies (`playwright-core` 1.60.0, `@fontsource/outfit`). |
| `README.md` | Documentation and setup guide. |

## Running Locally

Simply open `index.html` in Chrome, Edge, or any modern browser. It runs offline from `file://` or any local server.

### Controls

| Key / Query | Action |
|---|---|
| `F` | Toggle fullscreen |
| `Space` | Pause / resume |
| `←` / `→` | Scrub 1.0 second backward / forward |
| `?t=12.5` | Jump directly to timestamp 12.5s |
| `?debug` | Show live timecode, frame counter (0–900), and scene overlay |

The cursor hides automatically after 2 seconds of inactivity. The page requests a screen wake lock if supported by the browser.

### Booth Kiosk Setup (Windows, Chrome)

Launch Chrome in dedicated kiosk mode:

```powershell
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk --no-first-run --disable-session-crashed-bubble `
  --user-data-dir="$env:TEMP\floodway-kiosk" "file:///c:/path/to/booth/floodway-loop/index.html"
```

To exit kiosk mode, press `Alt+F4`.

### Pre-Event Checklist

1. **Disable Sleep / Screen Blanking**:
   ```powershell
   powercfg /change standby-timeout-ac 0
   powercfg /change monitor-timeout-ac 0
   ```
2. **Display Settings**: Set TV to "Just Scan", "Screen Fit", or "1:1" to prevent overscan cropping, and disable TV motion interpolation / smoothing.
3. **Turn off Notifications**: Enable Windows Focus Assist / Do Not Disturb and pause Windows Update.

## Exporting Video and Stills

From `booth/floodway-loop`:

```powershell
# 1. Capture PNG stills at all verification checkpoints:
npm run stills

# 2. Benchmark frame rendering performance:
npm run bench

# 3. Export broadcast master MP4 (1920x1080 @ 30fps, 30.000s, H.264 High, BT.709):
npm run render
```
