# Horn Practice

Practice desk for Frog Finley (Matthew Finley): Eb alto sax and Bb trumpet.

Version 1 is a phone-shaped Expo app you can use today in a browser or in Expo Go. Neither needs a paid Apple Developer account. A signed iPhone build for TestFlight waits on the Apple Developer Program enrollment, planned for 1 December 2026. The steps for that build are in [TESTFLIGHT.md](TESTFLIGHT.md).

## What it does

- **Music stand.** Landscape pages of Frog's original charts. Tap the edges or swipe to turn, or turn on hands-free scroll or timed page turns. The screen stays awake.
- **Metronome.** 30–300, tap tempo, meters from 2/4 through 12/8, accents, and subdivisions of the beat. The click is one rendered loop, so it does not drift.
- **Tuner.** Microphone pitch in written pitch for Bb trumpet or Eb alto, with concert pitch and cents beside it. Reference A4 can be 438, 440, 442, or 444.
- **Drone.** A sustained written note (band Bb and concert A presets, optional fifth). The speaker plays the concert pitch.
- **Exercises.** Generic scales and long tones drawn on a treble staff. Nothing copied from a method book.
- **Timer and streak.** A clock that keeps running when you leave the screen, a 12-week calendar, and a manual minute log.
- **Takes.** Record a practice take, play it back, and download or share the file for the weekly sonicrift recording.

The horn switch is on the home desk and on every screen that changes with the instrument. Charts on the stand stay in treble clef at Eb alto written pitch. Trumpet players should use the tuner, drone, and exercises for fingerings, not the alto pages.

## Original music

The PDFs and page images in `assets/` are original pieces. Each part is marked **CC0 1.0** on the page, and that dedication is unchanged by the license on the code. Exercises are generated in the app. Do not add copyrighted songs or transcriptions of other people's music.

## Run it

Node 22.

```bash
npm install
npm test
npm run typecheck
npm run web
```

Expo prints a localhost URL. Open it. Start the metronome or the drone from a click or a tap — browsers will not start audio until you do. The tuner and the takes recorder ask for the microphone. Use headphones with the drone so a tuner in the same room is not hearing the speaker.

On a phone, the same UI opens in Expo Go:

```bash
npx expo start
```

Scan the QR code with the iPhone camera (or the Expo Go app on Android). Expo Go is free. You do not need an Apple Developer membership for this.

`npm run export:web` writes a static web bundle to `dist/`.

## Check

```bash
npm test
npm run typecheck
```

`npm test` covers pitch transposition, the YIN detector, click placement, drone loop length, streaks, the practice calendar, scale spelling, and key-signature accidentals.

## iOS binary

Shipping to TestFlight needs the paid Apple Developer Program. Until that enrollment is active, practice in the browser or in Expo Go. Do not expect `eas build` to upload. Placeholders in `eas.json` (`appleTeamId`, `ascAppId`) are documented in `TESTFLIGHT.md`.

Bundle id, when the account exists: `app.hornpractice.ios`.

## License

The app code is [MIT](LICENSE), copyright 2026 Matthew Finley. The charts stay CC0, as printed on the parts.
