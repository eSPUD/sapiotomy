# The Story of Inference-Time Scaling — VISxAI 2026 submission

**Format:** interactive explorable explanation (hosted web article)
**Target venue:** 9th Workshop on Visualization for AI Explainability (VISxAI), IEEE VIS 2026
**Live URL:** _(fill in the Vercel deployment URL — see `VERCEL_DEPLOY.md`)_
**Source:** this repository (`web/`)

## Contribution

The first interactive explorable that lets a reader **manipulate the test-time-compute
knobs themselves** — think longer, sample wider, search deeper, verify, force more
thinking — and *watch accuracy respond*, including watching it **plateau, cliff, and
backfire**. Twenty pages take a reader from "a model can only blurt an answer" to a
grand sandbox combining every lever, grounded at every step in a cited result from the
primary literature. The contribution is *pedagogical*: novelty and quality of
*explanation*, not of method.

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
| Most pages ask the reader to **predict before revealing** data | Predict-Observe-Explain | POE (constructivist) |
| Three-Act structure (intuition → toolbox → frontier); "THEREFORE / BUT" arc | Narrative over fact-listing | Case |
| One shared colour grammar + one chart grammar across all 19 pages | Consistency reduces extraneous load | Cognitive Load Theory (Sweller) |
| Motion only in response to the reader's action; reduced-motion honoured | Purposeful motion only | 3Blue1Brown; Mayer |
| Overthinking (P17), cost (P16), faithfulness (P18), the "collapse" debate (P19) | Confront wrong intuitions head-on | POE; honest uncertainty |

## Correctness & reproducibility (the core guardrail)

- **Every on-screen number traces to a cited primary source** — see each page's citation
  chip and [`web/data/PROVENANCE.md`](web/data/PROVENANCE.md).
- Simulations reproduce the **shapes and endpoints** of published results (calibrated
  Monte Carlo / digitized curves), asserted by **data-fidelity unit tests** to within
  ±1.0 percentage point.
- **Preprints and estimates are visibly flagged** in-app (Pages 14, 16, 17, 18, 19).
- Where the two source documents disagreed (Page 18 misalignment-hint figures), the app
  shows only the well-agreed headline numbers and logs the unresolved conflict in
  `PROVENANCE.md` — it never silently picks one.

## Limitations & ethics

- Simulations are **illustrative, not predictive** (stated in-app on every page footer).
- Free-to-serve and **offline-capable**: no runtime network calls, no API keys, no per-user
  cost. Optional live in-browser inference (Pages 3/6/14) is feature-flagged OFF by default
  and always falls back to the pre-computed trace.

## Engineering summary

Next.js (App Router) · TypeScript (strict) · Tailwind · Zustand · D3 · Framer Motion.
Pre-computed published curves + client-side Monte Carlo (Web Workers). Full test suite:
unit (Vitest) + E2E/accessibility (Playwright + axe) run in CI on every push.

## Pre-submission checklist (remaining human steps)

These require a person / accounts and cannot be automated from here:

- [ ] Deploy to Vercel and paste the production URL above (`VERCEL_DEPLOY.md`).
- [ ] Capture a **teaser image** + short **video/GIF** (e.g. Page 12 axis-toggle, Page 19
      verdict flip) — see `web/docs/MEDIA.md`.
- [ ] Run the **formative user study** (5–8 undergrads) per `web/docs/USER_TESTING.md`;
      summarise the pre/post learning gain here.
- [ ] **Cross-browser matrix** (Chrome/Edge/Firefox/Safari desktop + mobile) — the
      pre-computed experience should work everywhere.
- [ ] **Lighthouse** on the deployed preview to confirm LCP < 2.5s on mobile (`docs/PERF.md`).
- [ ] **Subject-matter factual proofread** of every number against its cited source.
- [ ] Confirm the current VISxAI 2026 CFP format/length/anonymity requirements before
      submitting via PCS.
