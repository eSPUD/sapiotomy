# Page 4 prototype: "Two machines" (the naming slide, CO2 spine)

A **standalone, dependency-free prototype** of slide 4 in the **4-slide arc**. This is the old slide-3
prototype restructured per the mentor's direction: **the CO2/climate analogy is the spine of the page**,
not a trailing beat, and the twin dollar odometers are gone. Slides 1-3 made the reader feel two ways of
having an answer while deliberately never using the AI words; slide 3 ends by promising *"a different
machine, with its own name and its own price tag."* This page pays that off: **the names first, then the
bills.** The argument: priced the way climate taught us (build once big and visible; use forever, tiny
and everywhere) and read alongside Epoch's measured money rates (sprinting in opposite directions), the
field's marginal dollar moved to thinking. The catch beat plants slide 5 ("more time, more money, more
problems"): long thinking multiplies the per-trip burn, and trips number in the billions.

## How to open
Double-click `index.html` (or drag it into a browser). No server, no build, no network; it runs offline
from `file://`. Toggle light/dark with the ◑ button (it also follows your OS theme).

## The beats
1. **The reveal.** Slide 3's two shelves return as flippable tiles; flipping each names its machine:
   memorized = **training** (the factory step, once, up front), understood = **inference** (the
   answer-time step, every time you ask). The Kahneman System-1/System-2 aside is kept, compact and
   non-blocking. Both flips stamp in the rest of the page.
2. **The objection (vote #1).** New beat, per the slide-issues discussion: the training-first
   counter-argument is posed *explicitly*, in its strongest form ("training is when the machine actually
   gets smarter; surely you feed the factory"). The reader votes before seeing any evidence
   (Predict-Observe-Explain), then the page reads the bills.
3. **The two bills, priced the way climate taught you.** The energy shape first: training burns like
   **building the factory** (≈ 50 GWh, once); inference burns like **the commute** (≈ 0.3 Wh per short
   answer). The four-rung **scale ladder** rehearses stocks vs flows. Then the money's **direction**:
   Epoch's two measured rates as plain trend arrows: ×2.4 per year for a frontier run (headed past $1B
   by 2027, Epoch's projection) vs ÷40 per year for an answer at a fixed quality bar (range ÷9 to ÷900,
   median ÷50, ÷200 since early 2024).
4. **Vote #2 + the verdict.** The same budget question again, bills on the table. The verdict echoes the
   reader's two votes (switched, held out, called it early), then lands the field's answer: **the
   marginal dollar moved to thinking.** A compact three-line strip (the old interactive quote comparator,
   demoted per the four-slide restructure) keeps "you still need both machines" honest: the
   multiplication is thinking's job, tonight's final only thinking reaches in time, the 2010 final only
   the factory can put in there.
5. **The catch + teaser.** 0.3 Wh buys a *short* answer; long thinking runs 2.5 to 40+ Wh, and this deck
   is about making machines think longer. Climate math is dominated by billions of small trips, and the
   field just voted to make every trip longer. "More time per answer, more money per answer... more
   problems per answer? Next slide."

## The acceptance check (no AI words before the reveal)
Everything after beat 1 lives in an inert `<template>` and is stamped into the DOM only when both tiles
have been flipped; the tile backs are injected from a JS string table. So the *file* necessarily contains
the words but the **pre-flip DOM does not**. Console check on a fresh load:
`document.body.innerText.match(/training|inference/i)` → `null`.

## Data honesty (simpler than the previous revision, on purpose)
- **Citable rates and estimates (Epoch AI), quoted on-page:** ×2.4/yr run costs (CI ×2.0 to ×3.1) and
  the >$1B-by-2027 projection; ÷9 to ÷900/yr answer prices (median ÷50; GPQA ÷40; ÷200 median since Jan
  2024); ≈ 50 GWh per GPT-4-class run (range ~33 to 60, marked estimate); 0.3 Wh per short answer and
  the LED comparison; long queries at 2.5 to 40+ Wh; households at ≈ 28 kWh/day.
- **What was removed:** the year scrubber and twin dollar odometers, and with them the two illustrative
  anchors ($40M run, 1.9¢ answer) that carried TBV caveats. **No derived dollar figures remain**; the
  only dollar on the page is Epoch's own projection. The rates ARE the exhibit now, which is both
  smaller and stricter than the old page.
- **Derived and labeled:** the 170-billion-answers division and all ladder arithmetic (10 answers/day
  assumption; ≈ 2.5B answers/day is an OpenAI figure as reported by press, mid-2025).
- **CO2 stays an analogy; energy is the data.** No Wh→gram conversions (grid-mix dependent); the sources
  note says so.

## Design notes
- The acts bar tracks real progress: The reveal → The objection → The two bills → The verdict.
- The teaser is **not** gated on the ladder (optional content should not lock the exit); it reveals with
  the verdict, after vote #2.
- The tile flip is a squeeze-swap (content replaced at the squeeze midpoint), robust to faces of
  different heights; reduced motion swaps instantly.
- Copy is em-dash-free (house preference). The prototype banner is dev chrome and does not ship.
- `SPEC.md` in this directory is the build-time spec of the **previous revision** of this page (when it
  was slide 3, with the odometer beat); kept for history, superseded where it disagrees with this README.

## Flow paths to test by hand
1. Fresh load: run the console check above (expect `null`); acts bar on "The reveal".
2. Flip both tiles (mouse, then keyboard-only): backs fill, reveal line + Kahneman card + the objection
   stamp in; acts bar advances to "The objection".
3. Vote #1 (either): follow-up appears, the bills section reveals; acts bar advances to "The two bills".
4. Ladder: climb four rungs (button disables at "Top of the ladder"), descend, re-climb; announcements
   fire per rung. The ladder is optional; vote #2 is reachable without touching it.
5. Vote #2 (either): the verdict reveals with the correct echo line for the vote pair (check all four
   combos across reloads), plus the three-line strip, the catch, the teaser, and sources; acts bar
   advances to "The verdict".
6. Reduced motion (OS setting): flips swap instantly; no scrolling animation.
7. Theme toggle: the warn-styled catch card, the up/down rate arrows, and the strip read correctly in
   both modes.
8. Sources link under the arrows opens the details block.

## Port path (when the scaffold exists)
- The Epoch rates and energy figures become `data/epoch-training-costs.json` +
  `data/epoch-inference-prices.json` + `data/query-energy.json` with `citation` + `provenance` fields
  (schema enforced by `src/lib/data.ts`); this page's rows land in `web/data/PROVENANCE.md`. Re-verify
  the rates against Epoch's live dashboards at digitization (check for a fresher price-trends insight).
- The tiles component is shared with slide 3; the template-stamping trick becomes the scaffold's own
  gating; the vote pair becomes a small reusable POE component (predict, observe, echo).
- Placeholder CSS tokens swap for the design-token layer; acts bar and theme toggle come from shared
  chrome.
