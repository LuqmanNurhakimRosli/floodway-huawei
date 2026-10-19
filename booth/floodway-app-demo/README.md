# FloodWay: app demo film (1:56, 1920x1080)

A walkthrough of every feature in the phone app, with motion graphics: a phone frame showing real screenshots of the
app, scrolling screens, taps, highlight boxes with labels, an animated diagram of the verified-report rules, captions
and a chapter bar. Score generated in code (no samples).

| Output | What it is |
|---|---|
| `out/floodway-app-demo.mp4` | The film with sound: H.264 High, 1920x1080, 30 fps, 116 s, AAC 192 kb/s. |
| `out/floodway-app-demo-silent.mp4` | The same video without sound. |
| `out/score.wav` | The score alone (48 kHz stereo). |

## Chapters

| Time | Chapter | Shows |
|---|---|---|
| 0:00 | Intro | Brand, "Know before the water rises." |
| 0:04 | 01 Opening | The Welcome screen's looping evacuation animation (captured frame by frame) |
| 0:15 | 02 Home | Flood risk, your family, near you, relief centres (the page scrolls) |
| 0:29 | 03 Family map | People, Safety tab, Tok Wan (flood area, 18% battery), Places |
| 0:44 | 04 SOS | Hold to send (the ring fills), SOS on, check in, activity |
| 0:57 | 05 Verified reports | The report area on the map, and the rules as a diagram |
| 1:11 | 06 Safe routes | Flood scenario, route panel, turn-by-turn (simulated drive) |
| 1:22 | 07 Reports | Report a flood, depth from the photo, evidence check |
| 1:34 | 08 Live Vision | A sample camera with its reading |
| 1:43 | 09 Control room | Barriers, barrier log, storm lab |
| 1:49 | Outro | All features, brand, the demo-data line |

## Honesty on screen

- The app screens are real captures of this repo's frontend. The camera frames in them are labelled SAMPLE.
- The captions say the family circle, flood scenario, barriers and the drive are simulated.
- The last frame says: "Demo data: sample camera scenes, a simulated family circle and flood scenario."
- No agency names or logos appear.

## Rebuild

```bash
cd frontend && npm run dev                 # app on :5173 (and backend/run.py on :8080 for the Telegram and Live states)
cd booth/floodway-app-demo
node capture.mjs                           # cap/: screenshots, welcome frames, element boxes (about 2 minutes)
node render.mjs --stills 16,46.5,60        # review stills in out/stills/
node render.mjs                            # out/floodway-app-demo-silent.mp4 (about 15 minutes)
../../backend/.venv/bin/python make_audio.py
ffmpeg -y -i out/floodway-app-demo-silent.mp4 -i out/score.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest out/floodway-app-demo.mp4
```

Set `CHROME_PATH` to a Chromium binary when Chrome is not installed. Preview in a browser: open `index.html` after a
render (it plays in real time; `?t=60` starts at 60 s).

Note: map tiles were blocked where this was captured, so the map shows the app's offline street map (stored roads and
place names). On a normal connection the app loads CARTO street tiles instead.
