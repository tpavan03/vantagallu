# Vantagallu

A personal South Indian cooking companion with a living cooking board, four-language Gemini Live voice, DeepSeek chat and durable cooking sessions. The app adapts to confirmed changes instead of forcing the cook to restart a recipe.

## Personal deployment

- Application: https://vantagallu.vercel.app
- Private source: https://github.com/tpavan03/vantagallu
- Hosting: the owner’s personal Vercel account.
- Storage: Vantagallu-prefixed tables in the owner’s personal Supabase project. Existing application tables and provider settings are preserved.
- Providers: personal Gemini and DeepSeek credentials, available only to server functions.

Google sign-in and the exact production redirect are configured. AI/cloud access is restricted by the backend owner-email allowlist. Guests can browse recipes and cook with locally saved progress.

## Use on a phone

Open the application in Android Chrome or iPhone Safari, sign in, choose a recipe and tap Talk. Allow microphone access when requested. Use the browser’s Install app or Add to Home Screen action to keep Vantagallu on the home screen.

The web app supports foreground voice. Pausing voice closes capture and the connection while retaining the cooking session. Background listening and reliable native alarms require the later native-device integration; an elapsed web timer does not establish food doneness.

## Cooking and knowledge

The current starter library has 72 source-linked, independently summarized plans. The separate 300-dish coverage manifest contains 228 clearly planned entries; these do not appear as usable recipes. Every starter honestly carries a needs-kitchen-test status. Source methods are visible before starting. See docs/recipe-sources.md and docs/recipe-coverage.md for attribution and coverage.

English, Telugu, Kannada and Hindi are voice choices. The interface preserves confirmed ingredients, quantities, cookware, completed actions, adaptations, messages and original recipe versions when a call reconnects or a language changes. Quantities already added are not retroactively rescaled.

## Local development

Use a current supported Node release and npm.

```sh
npm install
cp .env.example .env.local
npm run dev
```

Fill the personal backend and public Supabase fields from .env.example. Provider/service-role keys must never use a VITE_ prefix. Development also loads the ignored .env.backend.local file when present. The web app runs on 127.0.0.1:4400 and the local API on 127.0.0.1:4401. The API and all cooking-state writes require authenticated ownership except public health checks.

```sh
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run build
```

Apply the SQL migrations in supabase/migrations to the personal project in order. Repeatable catalog seeding and optional live database checks have explicit opt-in guards; see server/scripts and server/tests. Never run them against another application’s production project.

## Persistence and safety

Commands use durable IDs and expected revisions. The API commits state, event records and timer updates atomically; stale edits retain both copies for review. Offline timer commands retain their original action timestamps. Device caches are scoped to the signed-in account and cleared on logout or account change. Recipe snapshots preserve the selected source version.

Microphone audio is streamed only after a user action and is not recorded to storage. Finalized conversation turns are saved. The voice client handles interruption, pending-connection cancellation, permission failures, page hiding, offline transitions, lease takeover and bounded reconnects. Its tokens expire quickly; persistent credentials never enter the frontend bundle.

Production builds include an offline shell that caches only public application files. API responses and personal cooking data are not service-worker cached. Usage limits are configurable on the backend and do not imply a fixed provider price.

## Validation

Automated coverage includes recipe integrity, confirmed-quantity preservation, offline deadlines, account switching, API authorization, command idempotency, concurrent writes, recipe-version pinning and voice/audio lifecycle handling. Browser checks cover desktop, 390px and 320px layouts, keyboard controls and accessibility. Separate real-provider probes verify DeepSeek streaming/tool commits and Gemini audio/transcripts in all four languages. Those probes use synthetic text input; physical phone microphone behavior still requires a device trial.
