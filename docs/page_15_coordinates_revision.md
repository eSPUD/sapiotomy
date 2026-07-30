# Page 15 revision: from score dashboard to the coordinates game

**Date:** 2026-07-29. **Trigger:** review of whether page 15 earns its place in a deck
whose edge is technical intuition through abstraction of literature.

## The critique

The previous revision of page 15 opened on a score dashboard: five benchmark
timelines of published dots, each dot selectable for its source and caveat. The
critique (author + mentor): the figure reads as a transcription, not an
abstraction. It was original as a *compilation* (no such chart exists in any one
paper; eight sources), but its only interaction was reading receipts, which the
literature itself already offers. The treadmill (section 2) was judged a genuine
abstraction and kept. The three "asterisk" cards (section 3) were prose
retellings and cut.

## The verification behind the reframe

The candidate thesis was: "inference-time scaling broke what a benchmark score
measures; before reasoning models a score was a property of a model." Three
research passes against primary sources returned:

1. **The post-reasoning exhibits all check out.** o1's 74/83/93 on AIME under
   1/64/1,000 samples (OpenAI o1 announcement, Sept 2024); o3's 75.7 vs 87.5 on
   ARC-AGI at ~172x compute (ARC Prize, Dec 2024; note: ~$26.8/task retail for
   the low config, and it was o3-preview); FrontierMath 25.2 (internal,
   aggressive compute, 180-problem set, funder-run, disclosed late) vs Epoch's
   ~10 on the released o3 over 290 problems (Apr 2025); o3-mini's low/med/high
   `reasoning_effort` spread on AIME (60.0/79.6/87.3, with cons@64 embedded in
   the chart's top labels).
2. **The "before" half is false as stated.** Pre-o1 headline scores already
   embedded inference compute: Minerva's 50.3 on MATH was `maj1@64` (pass@1
   33.6, same table); AlphaCode's Codeforces result used up to 10^6 samples
   (`10@k`, with a published log-linear sample-scaling curve, 2022);
   self-consistency set a GSM8K SOTA by voting over 40 paths (2022); harness
   alone moved LLaMA 65B's MMLU by ~15 points (HF leaderboard episode, 2023).
   What changed at o1: the knob moved from the *metric's name* (pass@k, maj1@k,
   n-shot) into the *product* (effort dials, token budgets), and bare headline
   numbers stopped identifying a measurement.
3. **Treadmill causality is partial.** Benchmark shelf-life collapse predates
   reasoning models (Dynabench quantified it in 2021; GLUE/SuperGLUE died
   2019-2021; GSM8K and MMLU fell to non-reasoning models before o1). What
   reasoning models did collapse is the holdout tier: GPQA's PhD bar stood ~11
   months and fell first to o1; AIME 2024 fell inside its own calendar year;
   MATH's gold-medalist line fell only to o1. SWE-bench's 2024 jump was largely
   agent scaffolds around non-reasoning models.

## The new page

- **Section 1, "Two true headlines, one model"** (replaces the dashboard): three
  real cases of quote-true headline pairs that disagree (74.4 vs 93; 12 vs 9.3;
  25.2 vs 10). The reader guesses which of four coordinates moved (model
  variant, test version, harness, thinking budget), then reveals the two
  receipts with moved rows flagged. The asterisk cards' content became the
  cases; prose retelling became a guessing game. Non-blocking (a "just show me"
  path), one guess per case, receipts persist per case.
- **Section 2, the treadmill**: kept as-is visually; caption recast to the
  verified causality (treadmill older than reasoners; late 2024 collapsed the
  holdout tier). "The moving goalposts are the system working" retained.
- **Section 3, "Put the coordinates back"**: the corrected before/after (2022:
  knob in the metric's name, Minerva `maj1@64 = 50.3` vs `pass@1 = 33.6`;
  2024-on: knob inside the product, fine print only), then the takeaway
  checklist and the handoff: the thinking budget is the one metered coordinate,
  which is page 16's bill. This also fixes two stale pointers from before the
  frontier pair moved to 13-14 (the old "next: how models are trained" handoff
  and the "page 17" ARC-AGI deferral, now page 16).

## Division of labor with neighboring pages

Page 13's waterfall teaches *where* o1's three AIME numbers come from (chain,
vote, re-ranker); page 15 teaches what their coexistence does to the word
"score". Same numbers, same data source (`data/o1-scaling.json` fit params, so
the pages cannot drift), different lesson. ARC-AGI stays off this page; its
story is the price tag and page 16 tells it with a dollar axis. Page 20's
verdict flip is the exam this page trains for.

## Addendum (same day): the treadmill replaced by the window simulation

The lifespan-bars treadmill had the exact defect the page warns about: a shelf
life. Its "still standing" state was a live status claim — it showed
FrontierMath standing on the strength of April-2025 data, which had already
stopped being true by mid-2026 (frontier models at max reasoning settings score
far above the disputed 25.2). Patching the number would only reset the clock;
any status-board design rots on the next model release.

Section 2 is now **"Why tests die"**: an authored, illustrative simulation
(`lib/benchmarkWindow.ts`) of a benchmark as a measuring instrument with a
window. One slider moves an abstract frontier past four stylized tests
(deliberately not named after real benchmarks); each test's readout passes
floor (everyone fails, no signal) → window (five models spread out, signal) →
ceiling (everyone passes, no signal). At the top of the slider every test is
blind and the figure asks for harder goalposts. The treadmill now *emerges*
from mechanics instead of being reported, and the figure makes no claim about
where any real benchmark sits on the day it is read, so it cannot expire.

Real history moved to the caption as immutable facts only: the four completed
falls (each ceiling faster than the last, GSM8K's pre-reasoning), and
FrontierMath's *launch* state (under 2% by design) as the example of a test
born at the floor. No durations, no dates in the figure, no "standing" states
anywhere. The simulation's shape (mid-ladder = ceiling/window/window/floor;
floor→window→ceiling sweep per test; all-blind at max) is pinned in
`benchmarkWindow.test.ts`, and its authored nature is disclosed in the step
body and the provenance footer, page-18 style. `benchmark-scoreboard.json` and
its tests remain in the repo but no page renders them now.

## Data and pins

No data files changed. `benchmark-scoreboard.json` still feeds the treadmill
(and remains pinned by `scoreboard.test.ts`); the o1/GPT-4o case numbers come
from `o1-scaling.json` params; the 9.3 (DeepSeek Table 4), 25.2/10
(OpenAI announcement / Epoch via TechCrunch), and Minerva 33.6/50.3
(Lewkowycz et al. 2022, Table 3, k=64 for the 540B model) are pinned in
`Page15.test.tsx`. The dashboard's `frontierOf` staircase helper stays in
`lib/scoreboard.ts` (still covered by its tests) in case a future page wants
the best-so-far line.
