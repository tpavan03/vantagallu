# Vantagallu Android

The Android package bundles the React cooking interface and all 73 available recipe plans with Capacitor 8. It runs its UI inside the app, with local cooking progress and the existing personal Vercel/Supabase backend. It is a bundled hybrid app, not a Flutter rewrite or a shortcut that opens the website.

## Install

Download **Vantagallu-1.0.0.apk** from the [v1.0.0 GitHub release](https://github.com/tpavan03/vantagallu/releases/tag/v1.0.0). The repository is private, so sign into an account with access to see the release and its downloads.

- Package: `in.tpavan.vantagallu`; version `1.0.0`, code `1`.
- Android 7.0 / API 24 and newer, with a current Android System WebView.
- Owner-signed RSA-3072 release. Preserve the signing identity for future updates.
- The separate `.debug` package is only for isolated device testing.

Choose a recipe to cook offline without an account. Chat, cloud sessions and live voice need connectivity and the existing allowed personal account. Permit microphone access when starting voice. Google sign-in opens its secure browser screen when explicitly requested and returns through `in.tpavan.vantagallu://login-callback/`; later opens restore the app's saved session.

Browser/PWA guest data does not automatically move into a new Android package. Signed-in cloud sessions use the same account and backend. Keep the original browser diary until any important sessions are verified in the app.

## Mobile behavior

Android Back closes the existing app dialog first, otherwise returns through navigation or minimizes the app. Backgrounding pauses microphone capture and live transport; it does not end the cooking session or rewrite timer deadlines. Foreground voice can reconnect to the same session. Background listening and native scheduled alarms are outside this release.

The same COOKer view, pantry setup, gas/induction guidance, author/source notes and confirmed quantities are preserved. Screen insets are supplied by Capacitor SystemBars and consumed by the shared stylesheet. Release WebView debugging is disabled, cleartext networking is disabled, and Android app backups are disabled. Session credentials use the app's private WebView storage; no claim of a custom Keystore-backed auth adapter is made.

## Backend and credentials

The bundled app calls `https://vantagallu.vercel.app/api`. The API allows the exact native `https://localhost` origin while retaining the account authentication and owner-email restrictions. CORS does not grant access to personal sessions. Supabase's redirect allowlist includes the exact native callback while preserving existing web and other application redirects.

Only public Supabase URL/client-key values are included in the app. Gemini, DeepSeek and Supabase service-role credentials stay on Vercel. There are no company-server dependencies.

## Build and future releases

Use Node 22+, JDK 21 and Android SDK/platform 36. The project uses Capacitor 8.6.0 and the checksum-pinned Gradle 8.14.3 distribution.

```sh
npm ci
npm run lint
npm test
npm run android:apk
```

Gradle reads ignored `android/key.properties` with `storeFile`, `storePassword`, `keyAlias` and `keyPassword`. The personal key is `.secrets/android/vantagallu-release.jks`, alias `vantagallu`. Keep it and the passwords backed up privately. Never commit them or embed provider keys in a client environment variable.

For a hosted build, use **Actions → Vantagallu Android APK → Run workflow** on `main`. The workflow uses public repository variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, plus encrypted signing secrets `ANDROID_RELEASE_KEYSTORE_BASE64` and `ANDROID_RELEASE_KEYSTORE_PASSWORD`. Its artifact includes the owner-signed APK, checksums and an isolated debug test APK. Only the signed release belongs in the user-facing GitHub release. The workflow does not publish releases automatically.

Vercel deployments update the website and APIs. Bundled Android UI changes require a new APK; deploying the site alone does not replace an installed app binary. Update both `package.json` and Android version fields before a future versioned release.

## Verification limits

Unit checks cover native API routing, strict auth callback validation, sanitized auth errors, native CORS and unauthenticated denial. Browser tests retain the web interface's layout, accessibility, offline progress and account-isolation checks. Android emulator checks and release artifact validation are recorded in the release notes after execution. Interactive Google consent and conversational audio from a physical phone require a device trial; capability booleans are not a provider-call test.
