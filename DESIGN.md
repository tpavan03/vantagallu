---
version: alpha
colors:
  primary: "#196343"
  background: "#F3F6F2"
  surface: "#FCFDF9"
  text: "#182725"
  muted: "#56654F"
  line: "#DCE3D8"
  accent: "#CC3E2C"
  ingredient: "#E9EFDF"
typography:
  display:
    fontFamily: Space Grotesk
  body:
    fontFamily: Manrope
rounded:
  control: 10px
  dialog: 20px
spacing:
  unit: 8px
components:
  page:
    backgroundColor: "{colors.background}"
    textColor: "{colors.text}"
  surface:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
  button:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
  caption:
    textColor: "{colors.muted}"
  ingredient:
    backgroundColor: "{colors.ingredient}"
    textColor: "{colors.text}"
  alert:
    textColor: "{colors.accent}"
---

# Vantagallu — the open cooking counter

## Overview

A personal Telugu-first South Indian cooking companion. The owner approved the standalone design study before implementation. The main experience is a single current cooking instruction, an original iron-pan illustration, a ready/added ingredient rail and anchored Talk, Type and Next controls. Preserve the approved open countertop composition: no dashboard sidebar, promotional hero, generic recipe-grid landing or animated AI orb.

Recipes are a starting method. The selected author/source stays visible; confirmed cooking facts and valid changes belong to the same saved session across voice, text and later visits. Frontend components display actual runtime state. Never fabricate an AI answer, microphone activity, cloud save or successful provider connection.

## Colors

src/styles/kitchen.css owns semantic runtime colors: rice background #F3F6F2, warm paper #FCFDF9, dark iron #182725, leaf green #196343, restrained chilli #CC3E2C. Muted text is #56654F with readable contrast. Red marks errors/heat; added ingredients also show explicit text and a check, not color alone. Keep large surfaces quiet and let the stateful cooking illustration carry personality.

## Typography

Self-hosted Space Grotesk supplies dish names, current instructions and dialog headings. Manrope handles reading and controls. Both are bundled under public/fonts with their licenses. Native script fallbacks render Telugu, Kannada and Hindi. Instructions follow the selected session language with the domain's English fallback. The language selector must not reset the cooking session.

## Layout

Desktop uses a quiet wordmark/navigation row, dish context, one open cooking surface and a narrow ingredient rail. The current instruction remains the strongest text. Phones keep the same hierarchy, move ingredients into an explicit horizontal rail with a visible scrollbar, and anchor Talk/Type/Next above the safe bottom area. Normal page scrolling belongs to the document; dialogs scroll independently.

Recipe search, regional/diet filters, source preview, saved sessions, conversation, adaptation, quantity, cookware and account all use one shared dialog owner. Choosing a recipe shows its method, review state, ingredients, relevant safety notes and actual source links before starting. No unreviewed recipe is labeled kitchen-tested.

## Elevation & Depth

Minimal borders and elevation. The illustrated vessel has its own grounded shadow; the interface does not need layered dashboard cards. The dialog alone uses a strong overlay. No ambient orb or false activity. Steam is decorative and stops with reduced motion.

## Shapes

Controls use 10px corners, dialogs 20px. Ingredients use illustrated circular counter objects. Cooking controls, timer actions and dialog close actions have a 44px minimum target; the primary voice/next row is at least 50px high.

## Components

KitchenApp.tsx is the UI boundary. It consumes shared Recipe/CookingSession/VoiceStatus/SaveStatus domain types and callback props supplied by App.tsx. It owns only transient view state: dialogs, form drafts, pending action locks and filters. Runtime, authorization, persistence, model calls, microphone transport and confirmed cooking mutations belong to App/client/domain/server owners.

CookingPan.tsx owns original cookware and ingredient drawings. It illustrates confirmed ingredient names and selected cookware; it does not imply sensor readings or assume that a cooker lid is closed. Quantity changes preserve already-added ingredient amounts. The UI does not scale cooking time or invent pressure-cooking instructions.

Native selects and dialog supply platform keyboard/focus behavior. One shared dialog hosts source previews and edit forms; callback failures keep entered text/context visible. Actual provider pending state disables duplicate chat requests. Local/offline/cloud saving labels are distinct. Voice status represents actual connecting/listening/speaking/reconnecting/error state, and can always be stopped while connected.

Timer displays derive from absolute saved deadlines. Expiry requests a food check, not a claim of doneness. Timers are not silently paused when a voice connection ends. Account sign-in and source links are real actions supplied by the runtime.

## Do’s and Don’ts

- Keep current instructions large, multilingual and stable while controls change state.
- Keep author/method and review limitations visible in recipe selection.
- Preserve chat drafts after failures; explain offline/unavailable features inline.
- Record ingredients only through confirmed runtime actions.
- Do not invent model replies, recipe reviews, timers or cloud success.
- Check 320px/390px, long native-script instructions, keyboard, popup focus, offline state and reduced motion.
