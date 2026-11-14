# TestFlight

Horn Practice is ready to build for iPhone. Shipping it to TestFlight is waiting on the Apple Developer Program enrollment for an **Individual** account. Until that enrollment is active, do not run a store build expecting it to upload.

Bundle identifier: `app.hornpractice.ios`

The production profile in `eas.json` is `production`: store distribution, remote build number, iOS resource class `m-medium`. The submit block has placeholder `appleTeamId` and `ascAppId` values on purpose. Replace both before the first `eas submit`.

## While the Individual account is pending

- Keep this repository private.
- Do not create the App Store Connect record yet. The bundle id cannot be registered until the account exists.
- A development or preview build also needs an Apple team, so those profiles wait on the same enrollment.
- The app does not use non-exempt encryption (`ITSAppUsesNonExemptEncryption` is false).

## After the Individual enrollment is approved

1. Sign in at [App Store Connect](https://appstoreconnect.apple.com) and accept the latest agreements, including the paid-apps agreement if it is offered. An Individual account holder is the only admin.
2. Create an iOS app named **Horn Practice** with bundle id `app.hornpractice.ios`, SKU `horn-practice`, and primary language English.
3. Copy the Team ID from [Membership](https://developer.apple.com/account) into `eas.json` → `submit.production.ios.appleTeamId`.
4. Copy the numeric Apple ID from the app’s App Store Connect URL (or App Information) into `submit.production.ios.ascAppId`.
5. From a machine with the EAS CLI and this repo:

   ```bash
   npx eas-cli login
   npx eas-cli build --platform ios --profile production
   npx eas-cli submit --platform ios --profile production --latest
   ```

6. In TestFlight, the Individual account holder is the internal tester. Add that Apple ID under Internal Testing. External testers need a short beta review; internal testing does not.
7. Install via the TestFlight app on the iPhone. The first launch asks for the microphone. Allow it. Tuner and takes both need it. The music stand does not.
8. Put the phone in landscape on the stand, open a chart, and confirm tap, swipe, and hands-free scroll. Then record one take and play it back before relying on it for the weekly sonicrift send.

## What the binary contains

- Frog’s original alto sax PDFs and the page images rendered from them.
- Generic scales and long tones generated in the app.
- No copyrighted songs and no transcriptions of other people’s music.

## Privacy labels to enter in App Store Connect

- Microphone: used to tune the horn and to record practice takes. Audio stays on the device until you share a take yourself.
- No account, no tracking, no third-party advertising, no analytics SDK.
