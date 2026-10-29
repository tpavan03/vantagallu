# Vantagallu UI behavior ownership

## Canonical UI Map

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
| --- | --- | --- | --- | --- |
| Select/Listbox | Native select in KitchenApp | Runtime language and library filter state | Language, region and diet; OS-owned popup | Keyboard selection and four-language browser checks |
| Form | KitchenApp shared dialog and validateForm | Controlled drafts, validity state and actual callback result | Chat, sign-in, serving, cookware and adaptation forms | Inline error, invalid-field focus and pending submission tests |
| Textarea | KitchenTextarea | Controlled draft | Shared auto-grow 80–240px with resize disabled and visible overflow | Draft preservation and narrow viewport checks |
| Dialog | KitchenApp native dialog | Modal state and actual dialog open state | One modal with title, Escape, backdrop close and native focus containment | Escape and focus-restoration browser checks |
| Feedback | Runtime props and KitchenApp inline status | Real API, save, voice, chat and authentication state | Pending, saved locally, saved to cloud, offline, error | Provider failures and disconnected-health browser checks |
| Scrollbar | src/index.css and src/styles/kitchen.css | Global CSS thumb, track, hover and forced-colors rules | Ingredient rail and dialog geometry | Narrow viewport and keyboard scrolling |
| Session changes | Domain commands and authenticated API | Revision-checked session state plus durable command IDs | Guest local storage, signed-in cloud, queued offline changes | Domain, runtime, API and live database tests |
| Timer | Domain deadlines and TimerControl | Original occurredAt, absolute deadline and pause/resume state | Start, pause, resume, cancel and restart with a new timer ID | Offline replay and expired-timer regressions |
| Source selection | RecipeLibrary and recipe preview | Source-linked recipe version and authoritative session snapshot | Inspect a method or start a new session | Sources before start and saved-version tests |

Forms declare noValidate. Validation reads field validity, displays an application-owned inline error, associates it with the invalid field and moves focus there. Native validation bubbles are not invoked. Drafts stay intact when a callback fails.

The UI represents confirmed cooking state; its pan illustration is not a sensor. Expired timers do not establish food doneness. Microphone transport, provider credentials and authenticated persistence belong to the client controller and backend, not the drawing components.

Voice pause closes microphone capture and transport without ending the cooking session. Account switches invalidate in-flight responses and clear the previous account cache. Conflicted offline updates retain both local and cloud copies and block automatic overwriting until reviewed.

Reduced-motion disables decorative movement without changing cooking state. Native installation and background audio/alarms require separate device verification; the web app supports foreground cooking and persistent session recovery.
