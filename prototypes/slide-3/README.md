# Page 3 prototype: "Two machines" (the naming slide)

A **standalone, dependency-free prototype** of slide 3, built from `SPEC.md` (which was built from
`notes_on_slides.md` › Slide 3). Slides 1 and 2 made the reader *feel* two ways of having an answer while
deliberately never using the AI words; slide 2 ends by promising *"a different machine, with its own name
and its own price tag."* This page pays that off in that order: **the names first, then the price tags.**
The argument of the page: *knowing has a price and reasoning has a price, and the two prices are sprinting
in opposite directions* (Epoch AI's measured rates), which is why the field's marginal dollar moved to
thinking. Slide 4 ("more time, more money, more problems") opens on the seed planted in the last beat.

## How to open
Double-click `index.html` (or drag it into a browser). No server, no build, no network; it runs offline from
`file://`. Toggle light/dark with the ◑ button (it also follows your OS theme).

## The beats
1. **The reveal.** Slide 2's two tiles return; flipping each names its machine: memorized = **training**
   (the factory step, once, up front), understood = **inference** (the answer-time step, every time you
   ask). A non-blocking aside gives the human names, Kahneman's System 1 / System 2, with a
   hold-it-loosely hedge. Both flips reveal the rest of the page.
2. **The price tags.** A year scrubber (mid-2022 → today) drives **twin odometers**: one frontier training
   run (climbs **×2.4 per year**, Epoch AI, 95% CI ×2.0 to ×3.1) and one answer at a fixed quality bar
   (falls **÷40 per year** at GPT-4 level on GPQA; range **÷9 to ÷900 per year, median ÷50**, steepening
   to a median of ÷200 per year since January 2024). Before spring 2023 the answer meter reads **"not for
   sale, at any price"** (the run that first clears the bar hasn't happened yet); near the end it falls
   **off the bottom of its own dial** ("under 0.01¢, still falling") rather than quote false precision.
   Reaching today reveals Epoch's >$1B-by-2027 projection and the landing line.
3. **Three problems, two machines.** Quote comparator over three callbacks: 350 × 638 (inference: seconds,
   a fraction of a cent; training: months and nine figures, not sold à la carte), tonight's final
   (training: **NOT FOR SALE, AT ANY PRICE**, the data does not exist yet), the 2010 final (inference:
   **NO AMOUNT OF THINKING**; training: already paid, amortized). The dead ends render as warn-styled
   states, not numbers. Visiting all three lands: *you need both machines; the live question is which to
   buy more of at the margin, and the meters already answered it.*
4. **Two exhaust pipes.** The climate beat, in energy units: training burns like building the factory
   (≈ 50 GWh once, estimate range ~33 to 60) and inference burns like the commute (≈ 0.3 Wh per short
   answer, less than an LED bulb for a few minutes; ≈ 170 billion answers per run, derived). A four-rung
   **scale ladder** (one answer → your year → the world's day → one run) rehearses stocks vs flows. The
   catch sits in body copy, warn-styled: 0.3 Wh buys a *short* answer; long thinking runs 2.5 to 40+ Wh,
   and this deck is about making answers longer. Climate math is dominated by billions of small trips.
5. **Teaser to slide 4.** The field moved its money to the collapsing meter, then started buying more
   thinking per answer. "More time, more money... more problems? Next slide."

## The acceptance check (no AI words before the reveal)
Everything after beat 1 lives in an inert `<template>` and is stamped into the DOM only when both tiles
have been flipped; the tile backs are injected from a JS string table. So unlike slide 2 (where the file
itself greps clean), here the *file* necessarily contains the words but the **pre-flip DOM does not**.
Console check on a fresh load: `document.body.innerText.match(/training|inference/i)` → `null`.

## Data honesty (what is citable vs what is illustration)
- **Citable rates (Epoch AI), quoted on-page:** ×2.4/yr run costs (CI ×2.0 to ×3.1) and the >$1B-by-2027
  projection; ÷9 to ÷900/yr answer prices (median ÷50; GPQA ÷40; ÷200 median since Jan 2024); 0.3 Wh per
  short answer and the LED comparison; long-input queries at 2.5 to 40+ Wh; households at ≈ 28 kWh/day.
- **Derived, marked "illustrative meter" in the UI:** both odometer dollar sequences (anchors × rate).
  Anchors: **$40M** for a GPT-4-class run (order of magnitude, mid-2022) and **≈ 1.9¢** for a 500-token
  answer at spring-2023 frontier prices. Ladder arithmetic is derived and says so (10 answers/day
  assumption; ≈ 2.5B answers/day is an OpenAI figure as reported by press, mid-2025).
- **The dial floor is deliberate.** The answer meter's late-scrub values are trend extensions past Epoch's
  measured window (which runs to ~2025), so below 0.01¢ the meter reads "under 0.01¢, still falling"
  instead of a number. The ÷N chip switches to "if the rate held" phrasing at the same moment.
- **CO₂ stays an analogy; energy is the data.** No Wh→gram conversions (grid-mix dependent); the sources
  note says so. All sources and derivations are in the page's collapsible **Sources and derivations**,
  linked from beats 2 and 4.

## Resolved spec questions / deliberate deviations
- **Kahneman aside: kept** (one compact card; it names what slides 1-2 only gestured at).
- **Scale ladder: kept**, compact (four rungs, climb/descend buttons, announce on move).
- **Beat-3 quotes: qualitative by design** ("months", "nine figures"); no wall-clock citations to defend.
- **The flip is a squeeze-swap** (content replaced at the squeeze midpoint), not a 3D card flip: robust to
  faces of different heights at any width. Reduced motion: instant swap.
- **The teaser is not gated on the ladder** (optional content should not lock the exit).
- **Anchors are order-of-magnitude and marked TBV**: before shipping, re-anchor both meters against
  Epoch's live dashboards (and check for a fresher price-trends insight); consider ending the answer
  meter's numeric range at the measured window rather than extending. The banner carries this caveat.

## Flow paths to test by hand
1. Fresh load: run the console check above (expect `null`); acts bar on "The reveal".
2. Flip both tiles (mouse, then keyboard-only): backs fill, reveal line + Kahneman card + the rest of the
   page stamp in; acts bar advances to "The price tags".
3. Scrub mid-2022 → today: run meter $40,000,000 → $1,330,000,000 (settles exactly, even if you scrub
   fast); answer meter walks presale → cents → under-the-dial; ×N and ÷N chips track; at the end the
   projection note, the scissors landing, and beat 3 appear; acts bar advances.
4. Visit the three problems in any order, revisit freely: dead-end cells read as dead ends; verdicts
   update; after all three the landing and beat 4 appear; acts bar advances to "The exhaust pipes".
5. Ladder: climb four rungs (button disables at "Top of the ladder"), descend, re-climb; announcements
   fire per rung.
6. Reduced motion (OS setting): flips swap instantly, odometers snap, quote rows appear at once.
7. Theme toggle: warn-styled dead ends, the turn card, and both meters legible in both modes.
8. Sources links in beats 2 and 4 open the details block.

Build-time verification: the above paths (121 assertions across four headless Chrome runs: pre-flip check,
two full animated runs in light and dark with different problem orders, one forced-reduced-motion run)
passed, plus eyeballed full-page screenshots in both themes.

## Port path (when the scaffold exists)
- The inlined `DATA` block becomes `data/epoch-training-costs.json` + `data/epoch-inference-prices.json` +
  `data/query-energy.json` with `citation` + `provenance` fields (schema enforced by `src/lib/data.ts`);
  this page's rows land in `web/data/PROVENANCE.md`, with the two meter anchors re-verified at digitization.
- Scrubber+odometer and the quote comparator become components; beat-3 copy and the machine-name strings
  move to an authored config (the template-stamping trick becomes the scaffold's own gating).
- Placeholder CSS tokens swap for the design-token layer; acts bar and theme toggle come from shared chrome.
- Copy is em-dash-free (house preference). The prototype banner is dev chrome and does not ship.
