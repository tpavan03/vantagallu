# Android 1.0.0 verification

Verified 3 November 2026 using Capacitor 8.6.0, JDK 21 and an Android 15 / API 35 emulator.

## Build and application checks

- `npm run lint`: exit 0.
- `npm test`: exit 0, **73 tests passed**. Includes native API routing, callback validation, sanitized auth errors, cold-launch callback deduplication, immediate pause lifecycle handling and native CORS/auth boundaries.
- `npm run android:sync`: exit 0; production TypeScript/Vite bundle and native asset copy completed.
- Gradle `assembleDebug assembleRelease`: exit 0; release lint checks passed.
- Production web Playwright: **22 passed, 2 intentionally skipped** across desktop, 390px and 320px layouts. The account-transport race is tested on desktop rather than duplicated at other viewport sizes.
- Premium strict static audit: zero findings.

## Actual Android checks

The opt-in `scripts/android-smoke.mjs` exercised the installed isolated debug package on an emulator, using synthetic guest cooking data:

- The UI was served locally at `https://localhost`; Capacitor reported `android` and a secure context.
- Cross-origin requests to the production health API succeeded from that native origin.
- Pesarattu source preview and cooking start worked; confirmed quantity remained 0.5 cup.
- Android Back closed the shared COOKer dialog without replacing the cooking session.
- Android microphone permission was granted, an actual audio track opened and was stopped/released. This did not contact Gemini.
- Offline Next-step progress worked, and the native background event was observed.
- A full force-stop/reopen retained the cooking-session ID, current step, completed actions and confirmed ingredients.
- No native service worker was registered. The app uses its bundled UI and recipes.

Reproduce on a signed-out **debug emulator** with the debug APK installed:

```sh
VANTAGALLU_ANDROID_SMOKE=1 ANDROID_HOME=/path/to/android-sdk \
  node scripts/android-smoke.mjs
```

This check refuses physical-device serials and signed-in debug accounts. It does not clear an existing diary or call model providers.

## Signed release artifact

- Installed the exact owner-signed release APK and opened its bundled 73-recipe library.
- Package `in.tpavan.vantagallu`, version `1.0.0`, code `1`, minimum API 24, target API 36.
- `apksigner verify --verbose --print-certs`: exit 0; APK v2 signature, owner RSA-3072 certificate.
- Certificate SHA-256: `f29c17a3bca1ab7b23bfd32144f2c5f8cc09d4ac59589ea325a5e4b3a78d6f6e`.
- APK SHA-256: `715ec20aabee6fc6fe9c8ce914b9ad12e66fc75f2efec2ccb153ce8867728440`.
- The manifest is non-debuggable. Bundled Capacitor configuration disables WebView debugging; the activity uses `BuildConfig.DEBUG`, which is false for release.
- Credential comparisons found no private provider keys, service-role key or signing password in the APK or source candidates. The signing key stays in ignored local files and encrypted personal repository build secrets.

The emulator is a `userdebug` image. Chromium documents a separate DevTools default for such images, so a DevTools socket on that test image does not establish the production-device behavior. This verification establishes the release manifest/configuration settings; it does not claim absence of a debugging endpoint on an ordinary physical phone. See [Chromium's WebView debugging documentation](https://chromium.googlesource.com/chromium/src/+/HEAD/android_webview/docs/net-debugging.md).

## Limits

No model-provider calls or emails were sent during the Android smoke test. Interactive Google consent, a physical phone microphone conversation, background alarms and background voice were not verified or claimed. Existing owner-only API restrictions remain in force. See [installation and build instructions](android.md).
