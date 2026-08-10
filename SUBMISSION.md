# The Story of Inference-Time Scaling — VISxAI 2026 submission

**Format:** interactive explorable explanation (hosted web article)
**Target venue:** 9th Workshop on Visualization for AI Explainability (VISxAI), IEEE VIS 2026
**Live URL:** _(fill in the Vercel deployment URL — see `VERCEL_DEPLOY.md`)_
**Source:** this repository (`web/`)

## Contribution

The first interactive explorable that lets a reader **manipulate the test-time-compute
knobs themselves** — think longer, sample wider, search deeper, verify, force more
thinking — and *watch accuracy respond*, including watching it **plateau, cliff, and
backfire**. Sixteen pages take a reader from "a model can only blurt an answer" to the
levers' own failure modes, and then close by putting every lever on one axis for the first
time, next to a twelve-question concept check and the two things the deck does not settle.

Two things here are unusual for an explainable. First, **pages 5 to 9 are not digitized
from papers; they are measured**. Each replays a run over the same 100 MATH-500 level-4
and level-5 items with the same grader, and each ships that run as a download that
re-derives the page's own figures on no GPU. Second, the deck **prices and breaks its own
thesis before it ends**: page 15 is a candour page that shows where more compute subtracts,
on the deck's own runs, and prints the three controls that cut its own headline observation
down to size. The contribution is
*pedagogical*: novelty and quality of *explanation*, not of method.

## Audience

First/second-year engineering undergraduates with high-school algebra and probability
and **no machine-learning background**. Every concept starts from a manipulable concrete
experience, never a definition.

## Design rationale — each decision mapped to the principle it serves

| Design decision | Principle | Source |
|---|---|---|
| Every page has ≥1 live control; the reader changes a value and sees the consequence | Active reading over passive reading | Victor, *Explorable Explanations* |
| Page 1 is pure play; difficulty climbs from there to the levers' failure modes on Page 15, then the reader is checked on Page 16 | "Start concrete, then climb" | Case |
| One idea per page; one number spotlighted; extraneous elements removed | Segmenting, signaling, coherence | Mayer, CTML |
| Several pages ask the reader to **guess before revealing** data (P7's prediction lock, P13's dials, P15's budget dial) | Predict-Observe-Explain | POE (constructivist) |
| Three-Act structure (intuition → toolbox → frontier); "THEREFORE / BUT" arc | Narrative over fact-listing | Case |
| One shared colour grammar + one chart grammar across all 16 pages | Consistency reduces extraneous load | Cognitive Load Theory (Sweller) |
| Motion only in response to the reader's action; reduced-motion honoured | Purposeful motion only | 3Blue1Brown; Mayer |
| Self-correction failure, budget rungs that lose answers, verifier reliability (all P15) | Confront wrong intuitions head-on | POE; honest uncertainty |
| P15 ends on the assumption the whole deck rested on (that the chain is the working), and P16 hands it back as one of two open items rather than resolving it | Leave a question, not a summary | Case |
| P16 grades twelve concept questions as they are answered, each naming the page it came from, instead of a summary the reader skims | Retrieval practice beats re-reading; feedback at the moment of the error | Roediger & Karpicke; Mayer |
| P16's ladder is the only chart that puts every lever on one axis, and it is withheld until every lever has been met | Contrast requires a shared frame the reader has earned | Mayer, CTML |

## Correctness & reproducibility (the core guardrail)

Every on-screen number is one of three things, and the page says which:

1. **Transcribed or digitized from a cited primary source.** Digitized curves reproduce the
   published shapes and endpoints and are asserted by data-fidelity unit tests, to ±1.0
   percentage point except where the page states a wider tolerance in-app (page 11's
   by-eye Pythia digitization is ±3 points, and its section 1 is authored illustration).
2. **Measured by us** (pages 5 to 9). These are the deck's own runs, not anyone's published
   numbers, and each carries a manifest with the run id, notebook sha256, item-set hash,
   decoding settings and grader. `notebookBundles.test.ts` asserts that the notebook in
   each download is the notebook the manifest names and that its `derived.json` hashes
   identically to the file the page plots.
3. **Authored** for teaching, and labeled as such on the page that draws it: page 11's
   allocator and page 13's two-axis surface. Page 15's authored chain and overthinking
   curves were retired in favour of its own measured run. Page 16 authors nothing and
   loads nothing: every number on it is read back out of the module that measured it, so
   the wrap-up cannot drift from the pages it is wrapping up.

[`web/data/PROVENANCE.md`](web/data/PROVENANCE.md) records every file, which page imports
it, and which of the three it is. Its Page column is derived by grep, not by hand.

- **Preprints and estimates are visibly flagged** in-app (Pages 14 and 15).
- Where the two source documents disagreed, the app showed only the well-agreed headline
  numbers and logged the unresolved conflict in `PROVENANCE.md` rather than silently
  picking one. The one live instance (misalignment-hint figures) sat on a page cut on
  2026-08-10; the conflict is still logged, unresolved and now undisplayed.
- The two claims that were known-unverified against their primary papers (DeepSeek's AIME
  2024 problem set, and whether the RL-trained IOI successors beat the hand-engineered
  pipeline) were both hedged on pages cut on 2026-08-10, and are no longer asserted
  anywhere in the deck.

## Limitations & ethics

- Simulations are **illustrative, not predictive** (stated in-app on every page footer).
- Free-to-serve and **offline-capable**: no runtime network calls, no API keys, no per-user
  cost. Optional live in-browser inference (Pages 3 and 14) is feature-flagged OFF by
  default and always falls back to the pre-computed trace. Page 6 runs no inference in the
  browser at all: its numbers come from the measured run it ships.
- The deck **ends at page 16**. Pages 20 (an Illusion-of-Thinking jury) and 21 (a grand
  sandbox plus a takeaway toolkit) were cut on 2026-07-30, off the end, so nothing was
  renumbered. On 2026-08-10 four more went: 15 (The Scoreboard), 16 (The Bill Comes Due),
  18 (Can We Trust the Thoughts?) and 19 (The Frontier). That cut hit the middle of Act 3,
  so its one survivor moved: old page 17 (When Reasoning Breaks) is now page 15 and closes
  the deck, and page 16 (Wrap-Up) was written the same day to close it. **One thing the
  deck used to do, it no longer does**: it does not teach how to read a benchmark score.
  It also no longer returns at the end to the question the reader was asked on page 2;
  page 16 closes on the two open items instead, which is a weaker loop and is stated as
  such rather than papered over.
- **Accuracy numbers across Acts 2 and 3 are discounted by benchmark contamination**, and
  the deck says so on pages 15 and 16 rather than in a footnote: on AIME 2025, released after these
  models trained, reasoning models scored 7 to 30 points below their averages on older
  years. Nothing here can say by how much any individual number is inflated.

## Engineering summary

Next.js (App Router) · TypeScript (strict) · Tailwind · Zustand · D3 · Framer Motion.
Pre-computed published curves + client-side Monte Carlo (Web Workers). Full test suite:
unit (Vitest) + E2E/accessibility (Playwright + axe) run in CI on every push.

## Pre-submission checklist (remaining human steps)

These require a person / accounts and cannot be automated from here:

- [ ] Deploy to Vercel and paste the production URL above (`VERCEL_DEPLOY.md`).
- [ ] Capture a **teaser image** + short **video/GIF** (e.g. Page 15's budget dial, where one
      problem is answered right when cut off and wrong when allowed to finish) — see
      `web/docs/MEDIA.md`.
- [ ] Run the **formative user study** (5–8 undergrads) per `web/docs/USER_TESTING.md`;
      summarise the pre/post learning gain here.
- [ ] **Cross-browser matrix** (Chrome/Edge/Firefox/Safari desktop + mobile) — the
      pre-computed experience should work everywhere.
- [ ] **Lighthouse** on the deployed preview to confirm LCP < 2.5s on mobile (`docs/PERF.md`).
- [ ] **Subject-matter factual proofread** of every number against its cited source.
- [ ] Confirm the current VISxAI 2026 CFP format/length/anonymity requirements before
      submitting via PCS.
