# Performance & polish notes (M7)

## Bundle / code-splitting
- **Route-level code splitting** (App Router default): each page ships only its
  own simulation code. Per-route first-load JS is ~106–135 kB; shared chunk ~102 kB.
- Heavy Monte Carlo runs in a **Web Worker** (with a synchronous fallback), off
  the UI thread.
- `outputFileTracingRoot` is pinned to `web/` so builds don't trace sibling dirs.

## Accessibility (verified in CI)
- Axe (`wcag2a`, `wcag2aa`) runs on **all 21 routes** (home + p/1–20) with zero
  serious/critical violations (`tests-e2e/polish.spec.ts`).
- Meaning is never colour-only (colour + label/shape everywhere).
- All controls keyboard-operable; charts carry `aria-label`s.
- Semantic hues are contrast-checked (AA) on the dark canvas and on tinted pills.

## Motion
- Purposeful motion only. The animated counter (`BigNumber`) and the `Reveal`
  wrapper both honour `prefers-reduced-motion` (content appears instantly).
- Verified by a reduced-motion E2E test.

## Mobile
- Narrative + simulation use responsive grids that stack to a single column on
  narrow screens; verified with a Pixel-5 viewport E2E test.

## No runtime network
- Grepped: zero `fetch`/`axios`/XHR in `src/`. The app is fully static and works
  offline after first load.

## Suggested next step (not automatable here)
- Run Lighthouse CI on the deployed preview to confirm LCP < 2.5s on a
  mid-range-mobile profile. The static, code-split build is well within budget,
  but a real-device number should be captured before submission.
