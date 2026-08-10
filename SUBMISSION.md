# The Story of Inference-Time Scaling — VISxAI 2026 submission

**Format:** interactive explorable explanation (hosted web article)
**Target venue:** 9th Workshop on Visualization for AI Explainability (VISxAI), IEEE VIS 2026
**Live URL:** _(fill in the Vercel deployment URL — see `VERCEL_DEPLOY.md`)_
**Source:** this repository (`web/`)

## Contribution

The first interactive explorable that lets a reader **manipulate the test-time-compute
knobs themselves** — think longer, sample wider, search deeper, verify, force more
thinking — and *watch accuracy respond*, including watching it **plateau, cliff, and
backfire**. Nineteen pages take a reader from "a model can only blurt an answer" to the
open frontier, and close by returning to the question the reader was asked on page 2 and
answering it in halves: inference-time compute settles the misread question completely
and cannot settle the stale fact at all.

Two things here are unusual for an explainable. First, **pages 5 to 9 are not digitized
from papers; they are measured**. Each replays a run over the same 100 MATH-500 level-4
and level-5 items with the same grader, and each ships that run as a download that
re-derives the page's own figures on no GPU. Second, the deck **prices and breaks its own
thesis before it ends**: page 16 bills every lever, page 17 shows where more compute
subtracts, page 18 shows the trace cannot be trusted on its own. The contribution is
*pedagogical*: novelty and quality of *explanation*, not of method.

## Audience

First/second-year engineering undergraduates with high-school algebra and probability
and **no machine-learning background**. Every concept starts from a manipulable concrete
experience, never a definition.

## Design rationale — each decision mapped to the principle it serves

| Design decision | Principle | Source |
|---|---|---|
| Every page has ≥1 live control; the reader changes a value and sees the consequence | Active reading over passive reading | Victor, *Explorable Explanations* |
| Page 1 is pure play; difficulty climbs from there to the open frontier on Page 19 | "Start concrete, then climb" | Case |
| One idea per page; one number spotlighted; extraneous elements removed | Segmenting, signaling, coherence | Mayer, CTML |
| Several pages ask the reader to **guess before revealing** data (P13's dials, P15's coordinate cases, P17's threshold, P18's monitor) | Predict-Observe-Explain | POE (constructivist) |
| Three-Act structure (intuition → toolbox → frontier); "THEREFORE / BUT" arc | Narrative over fact-listing | Case |
| One shared colour grammar + one chart grammar across all 19 pages | Consistency reduces extraneous load | Cognitive Load Theory (Sweller) |
| Motion only in response to the reader's action; reduced-motion honoured | Purposeful motion only | 3Blue1Brown; Mayer |
| Cost (P16), self-correction failure and overthinking (P17), faithfulness (P18) | Confront wrong intuitions head-on | POE; honest uncertainty |
| P19 returns to P2's question rather than surveying open problems | Close the loop you opened | Case |

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
   allocator, page 13's two-axis surface, page 15's benchmark-window simulation, page 17's
   three-state chain and its overthinking curves, page 18's traces and pressure shapes, and
   page 19's capstone panel.

[`web/data/PROVENANCE.md`](web/data/PROVENANCE.md) records every file, which page imports
it, and which of the three it is. Its Page column is derived by grep, not by hand.

- **Preprints and estimates are visibly flagged** in-app (Pages 14, 16, 17, 18, 19).
- Where the two source documents disagreed (Page 18 misalignment-hint figures), the app
  shows only the well-agreed headline numbers and logs the unresolved conflict in
  `PROVENANCE.md` — it never silently picks one.
- Two claims are known-unverified against their primary papers and are hedged on the page
  rather than asserted: whether DeepSeek's AIME 2024 evaluation used the same 15-problem
  set OpenAI's did (Page 15), and whether the RL-trained IOI successors matched or exceeded
  the hand-engineered pipeline (Page 19).

## Limitations & ethics

- Simulations are **illustrative, not predictive** (stated in-app on every page footer).
- Free-to-serve and **offline-capable**: no runtime network calls, no API keys, no per-user
  cost. Optional live in-browser inference (Pages 3 and 14) is feature-flagged OFF by
  default and always falls back to the pre-computed trace. Page 6 runs no inference in the
  browser at all: its numbers come from the measured run it ships.
- The deck **ends at page 19**. Pages 20 (an Illusion-of-Thinking jury) and 21 (a grand
  sandbox plus a takeaway toolkit) were cut on 2026-07-30. The survivors were deliberately
  not renumbered, because every cross-page reference in the deck is written against 1 to
  19. Page 19's close now carries what the toolkit was for.
- **Accuracy numbers across Acts 2 and 3 are discounted by benchmark contamination**, and
  the deck says so on page 17 rather than in a footnote: on AIME 2025, released after these
  models trained, reasoning models scored 7 to 30 points below their averages on older
  years. Nothing here can say by how much any individual number is inflated.

## Engineering summary

Next.js (App Router) · TypeScript (strict) · Tailwind · Zustand · D3 · Framer Motion.
Pre-computed published curves + client-side Monte Carlo (Web Workers). Full test suite:
unit (Vitest) + E2E/accessibility (Playwright + axe) run in CI on every push.

## Pre-submission checklist (remaining human steps)

These require a person / accounts and cannot be automated from here:

- [ ] Deploy to Vercel and paste the production URL above (`VERCEL_DEPLOY.md`).
- [ ] Capture a **teaser image** + short **video/GIF** (e.g. Page 18's pressure dial, where
      reward rises while the monitor goes silent, or Page 17's cliff) — see
      `web/docs/MEDIA.md`.
- [ ] Run the **formative user study** (5–8 undergrads) per `web/docs/USER_TESTING.md`;
      summarise the pre/post learning gain here.
- [ ] **Cross-browser matrix** (Chrome/Edge/Firefox/Safari desktop + mobile) — the
      pre-computed experience should work everywhere.
- [ ] **Lighthouse** on the deployed preview to confirm LCP < 2.5s on mobile (`docs/PERF.md`).
- [ ] **Subject-matter factual proofread** of every number against its cited source.
- [ ] Confirm the current VISxAI 2026 CFP format/length/anonymity requirements before
      submitting via PCS.
