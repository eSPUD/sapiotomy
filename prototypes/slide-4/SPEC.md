# Page 3 spec: "Two machines" (training vs inference)

**Status: superseded (kept for history).** This was the build-time spec for the *previous revision* of
this page, when the deck was three slides and "Two machines" was slide 3, carrying the year-scrubber
odometer beat, the interactive quote comparator, and the exhaust pipes as a trailing beat. In the
**4-slide restructure** (July 2026, per `slide_issues.md` and the follow-up discussion) the page moved
to slide 4, the CO2/climate analogy became the spine, the odometers and their illustrative dollar
anchors were removed in favor of Epoch's plain measured rates, the comparator was demoted to a static
three-line strip, and an explicit objection/vote (POE) beat was added. `README.md` in this directory
describes what is now built; where this file disagrees with it, the README wins.

Slide 3 is **the naming slide**. Slides 1 and 2 made the reader *feel* two ways of having an answer
(it pops vs. you rebuild it) while deliberately never using the AI words; slide 2's README bans them
outright and ends on the promise: *"a different machine, with its own name and its own price tag."*
This page pays that off, in that order: **the names first, then the price tags.** The price tags are
the actual argument of the page: why the field's marginal dollar moved from training to inference,
which is the question the whole deck exists to answer.

Like slides 1 and 2: standalone, dependency-free, vanilla JS, opens offline from `file://`, light/dark
via the ◑ button, prototype banner as dev chrome. **No live epoch.ai calls**: all data is digitized
into one inlined `DATA` config block with per-number provenance comments (rules below).

## Narrative role

- **Opens on slide 2's hinge.** Slide 2 ended with two kinds of question: one where more thinking keeps
  paying, one where thinking buys nothing because the answer is either already in there or it isn't.
  This page names the machinery behind each and shows what each costs.
- **One idea (one axis):** *knowing has a price and reasoning has a price, and the two prices are
  sprinting in opposite directions.* Every beat serves that; anything about whether reasoning is "real,"
  or where inference scaling breaks, belongs to slides 4-5.
- **Hands off to slide 4** ("more time, more money, more problems"): the last beat plants exactly one
  seed, that the cheap-per-use machine is the one we are about to start using much harder.
- **Does not duplicate page 11 of the main deck** ("The bill arrives," per-task diminishing returns on
  ARC). This page is the macro scissors (two multi-year price trends); page 11 is the micro curve
  (accuracy vs. dollars within one era). No ARC data here.

## The beats

1. **The reveal.** One-line recap of slide 2's two tiles, then the flip: the "I've seen this one" tile
   turns over to read **training** (how an answer gets *in there*: shown millions of examples ahead of
   time, once, at the factory) and the "I can rebuild it" tile turns over to read **inference**
   (thinking it through at answer time, every time you ask). Copy anchor, straight from the notes:
   *"In the world of AI, making things familiar is called training. Reasoning through the unfamiliar is
   called inference."* (Superseding the older "memorizing/reasoning" phrasing; see slide-3/slide-4
   READMEs for the familiar/unfamiliar axis.)
   - **Side callout (fun fact, non-blocking):** the human names for the same split, System 1 / System 2,
     from Kahneman's *Thinking, Fast and Slow*. Four names, two ideas: System 1 : training :: System 2 :
     inference (as an intuition pump, with a one-line "the analogy is loose" hedge).
2. **The price tags (the scissors).** A **year scrubber** (2022 → present) driving **two odometers**:
   - *One frontier training run:* climbs ~**2.4× per year** (Epoch AI; 95% CI 2.0-3.1×), headed past
     **$1B by 2027** (their projection).
   - *Answers at a fixed quality bar* (GPT-4-level): falls ~**40× per year** (GPQA); across Epoch's
     benchmarks the drop ranges **9× to 900× per year, median ~50×**, and has accelerated since 2024.
   Dragging the scrubber runs both meters at once; the felt effect is one runaway meter and one
   collapsing one. The landing line: **same industry, two machines, opposite price directions.**
3. **Three problems, two machines.** The interactive comparator, using only problems the reader has
   already met (callbacks, not new material). Pick a problem; both machines quote you **time** and
   **price** to deliver the answer:
   | Problem | By inference | By training | Verdict |
   |---|---|---|---|
   | 350 × 638 (slides 1-2) | seconds, well under a cent | months and a nine-figure run to make one more fact pop; not sold à la carte | inference's job |
   | Tonight's final (slide 2, match night) | seconds, given tonight's facts to reason from | **not for sale at any price**: the data does not exist yet; the next run is months away | only inference arrives in time |
   | The 2010 final (slide 2, the third pole) | **no amount of thinking summons it**; a fixed fact is either in there or nowhere | already paid: baked in by a past run, amortized over billions of questions, recalled instantly | only training puts it in there |
   The two "not for sale" / "no amount of thinking" cells are the stars; they render as a distinct
   dead-end state, not as big numbers. Landing: **you need both machines. The live question is which
   one to buy *more* of at the margin, and beat 2 already answered it.**
4. **Two exhaust pipes (the CO2 beat).** The climate analogy, kept in *energy* units (see data rules):
   training is the **factory being built**, one concentrated, visible burn (a GPT-4-class run: tens of
   GWh); inference is the **daily commute**, invisibly small per trip (~**0.3 Wh** per typical query,
   less than an LED bulb burns in a few minutes). One derived garnish: one frontier run ≈ the energy of
   **~170 billion queries**. Then the climate turn, one line only: *climate math is never dominated by
   the rare big builds; it is dominated by billions of small trips, and we are about to make every trip
   longer.* That sentence is slide 4's doorbell; do not develop it here.
5. **Teaser to slide 4.** The field read the same two meters and moved its money to the cheap machine,
   then started buying *more thinking per answer*. "More time, more money... more problems?"

## Interaction spec

**Primary (page-done requires all three):**
- **Tile flip (beat 1).** Reader-triggered (click/keyboard), one flip per tile or one "name them" button
  for both. The AI words must not appear anywhere on the page until flipped (acceptance check: grep the
  pre-flip DOM for "training"/"inference", expect zero, mirroring slide 2's check).
- **Year scrubber + twin odometers (beat 2).** One range input, keyboard-operable; both odometers and a
  small "×N since 2022 / ÷N since 2022" chip update live. No chart is required; if a garnish sparkline
  is added behind each odometer, each panel gets its own scale, clearly separate panels. **Never one
  shared dollar axis** for the two series: units differ ($/run vs. $/answer at fixed quality) and the
  honest comparison is *rates of change*, which the odometers embody without demanding log-axis literacy.
- **Problem comparator (beat 3).** Three problem chips; selecting one fills the two machine columns
  (time meter + price line + verdict). Meters animate under normal motion, render final state instantly
  under reduced motion. Chips are revisitable in any order; visiting all three unlocks the landing line.
- **Acts bar:** The reveal → The price tags → Three problems → The exhaust pipes.

**Recommended (build-time call, cut first if busy):**
- **Scale ladder in beat 4:** four rungs (one query → your year of queries → the world's day of queries →
  one training run), reader-climbable, units shifting Wh → kWh → MWh → GWh. It rehearses the
  stocks-vs-flows turn without new copy.

**Out of scope:** no LLM calls, no live pricing APIs, no CO2-gram conversions (grid-mix dependent; see
data rules), no benchmark scatter (page 11's job), no efficiency/bottleneck content (slides 4-5).

## Data rules (provenance)

House rule applies (`web/data/PROVENANCE.md`): every on-screen number traces to a source; estimates are
marked as estimates in the UI, not only in comments. Three classes on this page:

| Class | Numbers | Treatment |
|---|---|---|
| **Verbatim (citable)** | 2.4×/yr training-cost growth (CI 2.0-3.1×); >$1B/run by 2027 (projection); cost split (hardware 47-67%, staff 29-49%, **energy 2-6%**); 9-900×/yr inference-price fall, median ~50×, GPQA 40×/yr, ~200×/yr since Jan 2024; 0.3 Wh/query (~500-token text reply); "LED for a few minutes" comparison | On-screen with a sources note; growth *rates* are the citable spine of beat 2 |
| **Derived** | Odometer dollar sequences (anchor × rate^years); "~170 billion queries per run" (≈50 GWh ÷ 0.3 Wh) | Marked *illustrative, derived from the rates above* in the UI, like slide 1's scripted computer |
| **TBV at build** | Absolute anchors: starting $/run (GPT-4-class) and $/Mtok at GPT-4-level in 2022; training-run energy (external estimates ~32.8-60 GWh, ±30-50% variance); whether Epoch has refreshed the price-trends insight past 2025 | Verify against live Epoch pages at build; record in the config block |

Sources (inline these URLs in the `DATA` block comments and a reader-facing sources note):
- Epoch AI, *How much does it cost to train frontier AI models?* (Cottier et al. 2024):
  https://epoch.ai/blog/how-much-does-it-cost-to-train-frontier-ai-models
- Epoch AI data insight, *LLM inference price trends*: https://epoch.ai/data-insights/llm-inference-price-trends
- Epoch AI, *How much energy does ChatGPT use?*: https://epoch.ai/gradient-updates/how-much-energy-does-chatgpt-use
- Epoch AI energy hub (TBV anchor for training energy): https://epoch.ai/topics/energy

Honesty notes that must survive into the UI:
- **The 0.3 Wh figure assumes a short (~500 token) answer.** Long-context / long-thinking queries run
  2.5-40+ Wh. This deck is literally about making answers longer; the caveat is not fine print here, it
  is the beat-4 → slide-4 bridge, so it appears in body copy, not a footnote.
- **CO2 stays an analogy, energy stays the data.** Converting Wh to grams requires a grid-mix assumption
  we cannot cite cleanly; if the build wants one real emissions number, the citable candidate is a
  vendor-reported training figure (e.g. a Llama model card), recorded in PROVENANCE at digitization.
- **Two meters, two units.** Beat 2 never claims training and inference prices are on the same scale,
  only that their *directions and rates* differ; copy says "price of a run" vs. "price of an answer."

## Design notes

- Copy is em-dash-free (house preference). Second person, short beats, same voice as slides 1-2.
- **Dataviz:** odometers and meters over charts (no log-axis literacy assumed in this deck, unlike the
  main deck's page 6). Single accent hue for compute/spend, matching slides 1-2's `--compute`; the two
  dead-end cells in beat 3 use the warn treatment, not a second series hue. Direct labels, no legends.
- Reduced motion: odometers snap to scrubbed values (no rolling-digit animation), comparator meters
  render final state, tile flip becomes a fade-swap. Keyboard: scrubber (arrows), chips, flips, ladder;
  aria-live announcements when odometers settle and when a verdict lands.
- The prototype banner marks the derived odometer sequences as illustrative until anchors are TBV'd.

## Flow paths to test by hand

1. Flip both tiles (mouse, then keyboard-only); pre-flip DOM contains neither AI word; acts bar advances.
2. Scrub 2022 → present: both odometers and both ×N chips update coherently; ends at the >$1B-by-2027
   projection callout, labeled as a projection.
3. Visit the three problems in every order; the two dead-end cells read as dead ends; landing line
   unlocks only after all three.
4. Beat 4: the long-answer caveat is present in body copy; ladder (if built) climbs and descends sanely.
5. Reduced motion: no rolling digits, no meter animation, fade-swap flip. Theme toggle: warn-state cells
   and odometers legible in both modes.
6. Sources note reachable from beats 2 and 4; derived numbers visibly marked illustrative.

## Port path (when the scaffold exists)

- The inlined `DATA` block becomes `data/epoch-training-costs.json` + `data/epoch-inference-prices.json`
  + `data/query-energy.json` with `citation` + `provenance` fields (schema already enforced by
  `src/lib/data.ts`), and this page's rows land in `web/data/PROVENANCE.md`.
- Odometer/scrubber and the comparator become components; problem copy and quotes move to an authored
  config so beat 3's copy stays separable from meter logic.
- Placeholder CSS tokens swap for the design-token layer; acts bar and theme toggle come from the shared
  chrome.

## Open questions (resolve at build)

1. Absolute anchors for the odometers (2022 $/run and $/Mtok-at-GPT-4-level): best citable values from
   Epoch's dashboards, and whether a fresher-than-2025 price insight exists by build time.
2. Keep or cut the Kahneman callout (it names System 1/2, which slides 1-2 only ever gestured at; naming
   humans' machinery here is tidy, but it is a fourth name on a page that must stay light).
3. Does the scale ladder survive the one-idea test, or does it crowd beat 4?
4. Time quotes in beat 3 ("months" for a run): keep qualitative, or anchor to a citable wall-clock
   (e.g. reported run durations) at digitization.
