# Horn Practice

Private iPhone practice desk for Frog Finley. Alto sax and trumpet.

The music stand bundles his original landscape charts (Eb alto, written pitch). The exercises are generic scales and long tones generated in the app. There are no copyrighted songs and no transcriptions.

## What it does

- Landscape music viewer with tap and swipe page turns, plus hands-free scroll or timed page turns. The screen stays awake on the stand.
- Metronome from 30 to 300, tap tempo, time signatures, per-beat accents, subdivisions, and a visual pulse. Clicks are a seamless rendered loop so the tempo does not drift.
- Microphone tuner in written pitch for Bb trumpet and Eb alto, with concert pitch shown alongside.
- Drone on the written note (band Bb and concert A presets, optional fifth).
- Practice timer, manual minute log, and a day streak.
- Record a take, play it back, and share the file for the weekly sonicrift recording.

Bundle id: `app.hornpractice.ios`. TestFlight steps, including the pending Apple Developer Individual enrollment, are in `TESTFLIGHT.md`.

## Develop

Requires Node 22 and the Expo SDK 58 CLI.

```bash
npm install
npm test
npm run typecheck
npx expo start
```

`npm run web` opens the same UI in a browser. Microphone features need a browser that can prompt for the mic. The iOS binary is an EAS production build, not Expo Go, because it uses the audio and orientation native modules.

```bash
npx expo export
```

## Privacy

This repository stays private. The sheet music is Frog’s own work (the parts are marked CC0 on the page). Do not add other people’s tunes.
