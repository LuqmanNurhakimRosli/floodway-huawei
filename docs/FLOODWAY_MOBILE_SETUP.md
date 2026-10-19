# FloodWay Android app: setup, run and build

The app lives in `mobile/`. It is an Expo (SDK 58) React Native app written in TypeScript, and it talks to the
FloodWay backend in `backend/`.

> **Status (2026-10-19):** the code typechecks, its unit tests pass, the Android JavaScript bundle builds, and the
> native Android project generates. **No APK or AAB has been built yet**, and the app has not been run on a phone or
> emulator. The build machine used so far had no Android SDK, and its network blocked dl.google.com and
> api.expo.dev. The first build and the first device test are still to do (section 6).

## 1. Prerequisites

| Need | Version | For |
|---|---|---|
| Node.js | 20 or newer | everything |
| npm | comes with Node | install |
| The backend | `backend/` running on port 8080 | live data |
| Android Studio with an emulator, **or** an Android phone | Android 7.0 (API 24) or newer | running the app |
| For local release builds: Android SDK platform 37, build-tools 37.0.0, NDK 27.1.12297006, a JDK supported by Gradle 9.4 | React Native 0.88 defaults (`node_modules/react-native/gradle/libs.versions.toml`) | `./gradlew assembleRelease` |
| For cloud builds: an Expo account and `eas-cli` | latest | `eas build` |

## 2. Install

```bash
cd mobile
npm install          # .npmrc sets legacy-peer-deps (react-dom 19.3.1 asks for react 19.3.1; Expo 58 pins 19.3.0)
npm run check        # tsc --noEmit + jest
```

## 3. Point the app at the backend

The app's backend address is set in two places:

- At build time: `EXPO_PUBLIC_API_BASE`. If it is unset, the app uses `http://10.0.2.2:8080`, which is how the
  Android emulator reaches port 8080 on your computer.
- At run time: **Settings** (the gear icon on Home) → FloodWay server → Save and reload. The value is saved on the phone.

| Where the app runs | Server address |
|---|---|
| Android emulator, backend on the same computer | `http://10.0.2.2:8080` |
| Phone on the same Wi-Fi as the laptop | `http://<laptop LAN IP>:8080` (the backend listens on `0.0.0.0` by default; allow port 8080 through the firewall) |
| Hosted backend | `https://your-host` |

Plain `http://` works in development and preview builds. The **production** build accepts only `https://`
(`app.config.js`).

`EXPO_PUBLIC_*` values are compiled into the app and anyone can read them. Never put a secret there.

## 4. Run during development

```bash
cd backend && .venv/bin/python run.py         # Windows: .venv\Scripts\python.exe run.py
cd mobile && npx expo start                   # press "a" for the Android emulator
```

For a phone, either scan the QR code in Expo Go or install a development build:
`npx eas build --platform android --profile development`.
Some native features may behave differently in Expo Go, so test notifications and location on a development or
preview build.

## 5. Build an APK or AAB

### Cloud build with EAS (recommended: no local Android SDK needed)

1. In `mobile/eas.json`, replace `https://YOUR-BACKEND-HOST` in `preview` and `production` with the real backend. For
   a LAN demo APK, `http://<laptop IP>:8080` also works in `preview`.
2. Run:
   ```bash
   cd mobile
   npx eas-cli login
   npx eas-cli build --platform android --profile preview      # APK, for installing directly on phones
   npx eas-cli build --platform android --profile production   # AAB, for Google Play
   ```
   The `npm run build:apk` and `npm run build:aab` scripts run the same two builds.
3. EAS creates and stores the Android signing key on the first build. Keep the account: Play Store updates must use
   the same key.

### Local build (needs the Android SDK)

```bash
cd mobile
npx expo prebuild --platform android --clean
cd android && ./gradlew assembleRelease
# APK: android/app/build/outputs/apk/release/app-release.apk
```

`npm run build:apk:local` runs the same steps. The generated `android/` folder is not committed (`.gitignore`).
The app is built fresh from `app.json` each time. A release you plan to distribute needs your own keystore, set up in
`android/app/build.gradle` or through EAS. Never commit the keystore (`*.jks` is already ignored).

### Check that the APK is real

```bash
ls -l android/app/build/outputs/apk/release/app-release.apk
"$ANDROID_HOME"/build-tools/37.0.0/aapt2 dump badging app-release.apk | head -3   # package com.floodway.mobile
adb install -r app-release.apk
```

## 6. First device test (not done yet)

Run this list on a phone or emulator, and record the results in `FLOODWAY_TEST_REPORT.md`.

- [ ] Home opens with the backend off: "No data yet", or saved data marked "not live".
- [ ] Backend on: camera level shows "Live, updated just now" and the "Sample cameras" label.
- [ ] "Use my location": the system prompt appears only after the tap. Denying it leaves the app usable.
- [ ] Map: tiles load online; in airplane mode it shows "Offline map: saved roads only" and still draws zones and centres.
- [ ] Tap a relief centre: the sheet shows distance; "Directions" opens the maps app.
- [ ] Alerts: turning on notifications asks permission; a new WARNING from the storm lab shows a notification while the app is open.
- [ ] Family: "Send my location" opens the share sheet; adding a contact rejects a 3-digit number; Call opens the dialler.
- [ ] Guide: 999 and 112 open the dialler; the go-bag checklist survives an app restart.
- [ ] Settings: a wrong server URL is refused; Remove saved data keeps the contacts.
- [ ] TalkBack reads the level badges as words, and every button is at least 48 dp.

## 7. Known limits

- Notifications only arrive while the app is running. Reaching a closed app needs push credentials (Firebase Cloud
  Messaging) and a sender on the server. Neither is built.
- The family screen shows nobody else: there is no account or location-sharing server.
- Directions open the phone's maps app, which does not know where the floods are. The app says so.
- Sample cameras, relief centres and the demo flood-prone areas are demo data. The app labels them.
