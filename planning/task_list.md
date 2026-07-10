# Task List — *The Story of Inference-Time Scaling*

A milestone-driven implementation plan for a Claude Code agent. Derived from
[`InferenceTimeScaling_Explainable.md`](./InferenceTimeScaling_Explainable.md) (build spec) and
[`InferenceTimeScaling_Survey.md`](./InferenceTimeScaling_Survey.md) (verified data anchors).

## Target venue & quality bar

This project targets submission to the **9th Workshop on Visualization for AI Explainability (VISxAI)** at IEEE VIS 2026. VISxAI's signature format is a **working, interactive explorable explanation** (not a traditional paper), reviewed by a program committee on: explanatory/pedagogical power, quality and appropriateness of the interactive visualization, novelty, technical soundness, and clarity. Two artifacts are therefore first-class deliverables, not afterthoughts:

1. **The interactive article itself** — the 20-page explorable, publicly hosted at a stable URL for reviewers.
2. **A short accompanying description** — contribution, audience, and design rationale, in the format required by the current CFP (**verify exact length/anonymity requirements against the live VISxAI 2026 call before submitting — do not assume**).

Every milestone below is scoped to that bar. In particular: data provenance must be reproducible and citable (a reviewer can trace any on-screen number to a paper *and* a digitization record); the pedagogy must be defensible against the learning-science literature the spec cites (Victor, Case, Mayer, POE, CLT); and accessibility is a review criterion, not a nice-to-have.

## How to use this document

- Work milestone by milestone (**M0 → M10**). Do **not** start a milestone until the prior one's **Exit gate** passes.
- **Milestone ↔ page ordering is intentionally non-linear:** M1 builds Page 6 first as the reference template (it exercises the whole stack — worker Monte Carlo, POE, a calibrated anchor, chart grammar); M2 then builds Pages 1–5, and every later page copies the M1 template. This is deliberate, not an error.
- Every milestone follows the same loop: **Implement → Unit test → Integrate → Validate**. Each has an explicit **Exit gate** that must be green before moving on.
- Check off boxes as you go (`- [ ]` → `- [x]`). Commit at the end of each milestone with a message referencing the milestone id (e.g. `M1: Page 6 self-consistency template`).
- **Golden rule (from the spec's Risks section): lock every simulation to a cited data point before building its UI.** Numbers live in versioned JSON with the citation attached; never invent a curve. The canonical anchors are collected in the [Data Anchor Reference](#data-anchor-reference) at the bottom — treat those as ground truth.
- **Source-discrepancy rule:** the two planning docs occasionally disagree (e.g. Page 18 misalignment-hint faithfulness: the Explainable doc says **20% / 29%**, the Survey says **41% / 19%**). Where they conflict, **resolve against the primary paper**, record the resolution and the extracted value in `data/PROVENANCE.md`, and cite the primary source in-app — do not silently pick one. Known conflicts are flagged in the anchor table.
- After each page is built, run the full test suite + typecheck + lint + build. A milestone is not done if any of those are red.

---

## Global conventions & definition of done

Applies to every task in every milestone.

- **Language/stack:** Next.js (App Router) + React + TypeScript (strict), Tailwind CSS, Zustand (global sim/settings state), Framer Motion (purposeful animation only), D3 (bespoke charts) with Recharts/visx for standard charts.
- **Testing:** Vitest + React Testing Library for units/components; Playwright for E2E/integration; `@axe-core/playwright` for accessibility assertions. Simulation math (Monte Carlo, interpolation, curve fits) must have deterministic unit tests using a **seeded RNG** — no flaky randomness in tests.
- **Data fidelity test (non-negotiable):** for every page backed by a published number, a unit test asserts the simulation reproduces the paper's endpoints within a stated tolerance (default ±1.0 percentage point unless noted). Each data JSON file carries `citation` and `provenance` fields; a test asserts no data file is missing either.
- **A page is "done" only when:** component renders, its simulation unit tests pass, its data-fidelity test passes, it has ≥1 live control (Victor's active-reading requirement), it has a keyboard-operable + ARIA-labelled control set (axe clean), it degrades gracefully if an optional feature (WebGPU/API) is unavailable, and it appears correctly in the progress rail.
- **Accessibility invariant:** never encode meaning by color alone (always color + label/shape); honor `prefers-reduced-motion`; all interactive controls keyboard-reachable. Enforced by an axe check per page and a manual reduced-motion check.
- **Performance invariant:** route-level code splitting so each page ships only its own sim code; Monte Carlo / inference runs in a Web Worker; target LCP < 2.5s on mid-range mobile.

---

## M0 — Project foundations & CI (Phase 0)

Goal: a running skeleton with the shared design system, state, chart grammar, progress rail, and a green CI pipeline. No page content yet.

### Implement
- [ ] Scaffold Next.js (App Router) + TypeScript (strict) + Tailwind; commit a clean `next build`.
- [ ] Add design-token layer enforcing the shared 3-hue grammar: one **compute/energy** hue, one **correct/accuracy** hue, one **wrong** hue — used identically everywhere (Mayer signaling). Tokens live in one file; components must reference tokens, never raw hex.
- [ ] Install & wire Zustand global store for simulation/settings state (the store the Page-20 sandbox will later read from).
- [ ] Build shared primitives: `<Slider>`, `<Toggle>`, `<Stepper>`, `<BigNumber>` counter, `<ChartFrame>` (shared axis/legend grammar), `<PredictBar>` (POE predict-before-reveal control), `<CitationBadge>` (renders source + preprint flag).
- [ ] Build the persistent **three-Act progress rail** (Act 1 / Act 2 / Act 3) with current-page indicator; wire the 20-route map (routes may be stubs).
- [ ] Add a `data/` directory convention + a TypeScript loader that validates each JSON file against a schema requiring `points`, optional `fit`, a mandatory `citation` (`{ ref, url, venue, preprint: boolean }`), and a mandatory `provenance` string (how the points were obtained).
- [ ] Create `data/PROVENANCE.md`: for every data file, record the exact source (paper + figure/table number), the extraction method (e.g. WebPlotDigitizer on Fig. X, verbatim table value, or derived), the raw extracted points, and any fitted-function parameters. This is the reviewer-facing audit trail for data fidelity.
- [ ] Web Worker harness + seeded RNG utility (single shared PRNG implementation used by both app and tests).

### Unit test
- [ ] Design tokens: test that the 3 semantic hues resolve and that a "no raw hex in components" lint rule is active.
- [ ] Zustand store: reducers/actions update state as expected; selectors are stable.
- [ ] Data loader: rejects a JSON file missing `citation` **or** `provenance`; accepts a valid one; exposes typed `points`/`fit`.
- [ ] Seeded RNG: same seed → same sequence (determinism guarantee for all later sim tests).

### Integrate
- [ ] CI pipeline (GitHub Actions): install → typecheck → lint → unit tests → `next build` → Playwright smoke. All required to pass on PR.
- [ ] Vercel project connected: preview deploy per PR, production on `main`. Env vars scoped per environment; any secrets stored as sensitive vars (none needed yet).
- [ ] Playwright smoke test: app boots, progress rail renders, navigation between two stub routes works.

### Validate
- [ ] `npm run build` clean; CI green end-to-end on a PR.
- [ ] Manual: progress rail visible on every stub route; reduced-motion media query respected by the one demo animation.

**Exit gate M0:** CI green (typecheck + lint + unit + build + smoke); shared primitives importable; data loader enforces citations; seeded RNG deterministic.

---

## M1 — Reference page template: Page 6 (Self-Consistency) (Phase 0)

Goal: build **one page end-to-end** as the canonical template every other page copies. Chosen because it exercises the full stack: Monte Carlo in a worker, POE, a calibrated published anchor, chart grammar.

### Implement
- [ ] `data/self-consistency.json`: digitized anchor — self-consistency improves CoT on GSM8K by **+17.9%** (plus SVAMP +11.0%, AQuA +12.2%, StrategyQA +6.4%, ARC-challenge +3.9%). Cite Wang et al. 2022 (arXiv:2203.11171). Not a preprint (ICLR'23).
- [ ] Page 6 UI: "votes" slider (1→40); ballot/histogram animation with the plurality winner highlighted (color + label, not color alone); a `<PredictBar>` asking the student to predict before revealing.
- [ ] Client-side binomial/plurality Monte Carlo in a Web Worker, **seeded to reproduce the published shape**, surfacing the +17.9% anchor annotation.
- [ ] `<CitationBadge>` showing the Wang et al. source.

### Unit test
- [ ] Monte Carlo majority-vote sim: with seeded RNG and calibrated per-sample accuracy, the vote-accuracy curve rises monotonically then shows diminishing returns; endpoint matches the calibrated target within ±1.0 pp.
- [ ] Plurality selection returns the modal answer; ties handled deterministically.
- [ ] Data-fidelity test: `self-consistency.json` endpoint equals the +17.9% delta (within tolerance) and carries its citation.

### Integrate
- [ ] Worker ↔ UI message contract tested (component test drives the slider, worker posts back, chart updates).
- [ ] Page registered in progress rail (Act 2) and route map.

### Validate
- [ ] Playwright: load Page 6, make a prediction, drag the slider, assert the histogram + accuracy readout update and the winner is announced textually (screen-reader path).
- [ ] axe: zero serious/critical violations. Keyboard: slider operable via arrow keys.
- [ ] Reduced-motion: ballot animation collapses to instant state change.

**Exit gate M1:** Page 6 fully passes the "page done" checklist. This page is now the **reference template**; document the file layout in a short `data/README.md` + `docs/page-template.md`.

---

## M2 — Act 1: Building Intuition, Pages 1–5 (Phase 1 MVP)

Goal: the concrete, low-jargon on-ramp. Each page copies the M1 template.

### Implement
- [ ] **Page 1 — "Two Speeds of Thinking":** System 1/2 hook. Two mental-math problems + stopwatch; tap "answer instantly" vs "work it out"; accuracy per mode from a hand-authored set. Split-screen warm/cool, heartbeat timer. Data: local/authored.
- [ ] **Page 2 — "The Instant-Answer Problem":** one big percentage counter ticking to the **17.9% GSM8K standard-prompting baseline (PaLM 540B)**. Data: `data/cot-baseline.json`, Wei et al. 2022.
- [ ] **Page 3 — "Show Your Work (CoT)":** "Show your work" toggle animating **17.9% → 56.9% (+39.0 pts)** on GSM8K for PaLM 540B (note: 58% with calculator; prior SOTA 55%); stepper reveals one worked example. Data: `data/cot.json`, Wei et al. 2022. POE predict-before-flip.
- [ ] **Page 4 — "Not Every Path Is Right":** "Resample" shows several pre-generated chains, some green some red, from an authored trace bank illustrating Yao et al.'s finding that **>60% of CoT "thoughts" failed after their first step**.
- [ ] **Page 5 — "What If We Ask Many Times?":** attempts dial (1→10); P(at least one correct) climbs via live client-side binomial Monte Carlo (worker). Grid of avatars lighting up. Introduces "coverage" before naming it.

### Unit test
- [ ] Page 1: mode-accuracy lookup returns authored values; timer logic unit-tested (no wall-clock flake — inject a clock).
- [ ] Page 2/3: counter reaches exactly the anchored percentages; toggle switches baseline↔CoT datasets; data-fidelity tests for both JSONs (+ citations).
- [ ] Page 4: trace bank has both correct and incorrect chains; the displayed failure proportion matches the ">60% fail after step 1" framing.
- [ ] Page 5: seeded binomial coverage = closed-form `1-(1-p)^n` within tolerance; monotonic in n.

### Integrate
- [ ] All five pages in progress rail (Act 1) and route map, in order; Act-1 → Act-2 navigation works.
- [ ] Shared store records per-page interaction events (for later analytics).

### Validate
- [ ] Playwright happy-path per page (predict → interact → observe reveal).
- [ ] axe clean on all five; keyboard operable; reduced-motion respected.
- [ ] Content review checkpoint: one-idea-per-page holds; no undefined jargon appears before its page.

**Exit gate M2:** Pages 1–5 pass the page-done checklist; Act 1 navigable start-to-finish; all Act-1 data-fidelity tests green.

---

## M3 — Act 2 part 1: Pages 7–9 (verifiers) (Phase 1 MVP)

Goal: motivate and introduce verifiers. (Page 6 already built in M1.)

### Implement
- [ ] **Page 7 — "When Voting Isn't Enough":** push votes past ~40 → majority curve flattens; toggle contrasts **coverage (any sample correct)** vs **majority correct**. Data: `data/voting-plateau.json`, Brown et al. 2024 — selection methods plateau beyond several hundred samples. Rising coverage line vs flattening majority line.
- [ ] **Page 8 — "Best-of-N with a Verifier":** generate N candidates; toggle pick-randomly / majority / verifier-picks; accuracy jumps under verifier. Monte Carlo seeded to a verifier-accuracy parameter (worker). N draft cards + sweeping "verifier lens." Cite Cobbe et al.
- [ ] **Page 9 — "Grading the Steps (PRM vs ORM)":** solution with per-step correctness; switch ORM view (one end label) vs PRM view (per-step colored+labeled); best-of-N on MATH shows **PRM 78.2% vs ORM 72.4%** (majority-vote baseline 69.6%). Data: `data/prm-vs-orm.json`, Lightman et al. 2023.

### Unit test
- [ ] Page 7: coverage curve strictly increasing; majority curve plateaus (derivative → ~0 past threshold); both match anchored shape.
- [ ] Page 8: verifier selection accuracy > majority > random for the seeded params; deterministic under seed.
- [ ] Page 9: PRM/ORM/majority endpoints = 78.2 / 72.4 / 69.6 within ±1.0 pp; per-step labels bind correct color **and** text. Data-fidelity + citation tests for all three JSONs.

### Integrate
- [ ] Pages 7–9 slot into Act 2 rail between Page 6 and Page 10; navigation continuous 6→9.

### Validate
- [ ] Playwright per page; axe clean; keyboard + reduced-motion.
- [ ] Cross-page consistency: coverage-vs-majority framing on Page 7 matches the same concepts as introduced on Pages 5–6 (shared vocabulary/legend).

**Exit gate M3:** Pages 7–9 pass page-done checklist; Act 2 continuous from 6→9; verifier data anchors green.

---

## M4 — Act 2 part 2: Pages 10–13 (search, scaling laws, allocation) (Phase 1 MVP)

Goal: search algorithms and the quantitative centerpiece pages.

### Implement
- [ ] **Page 10 — "The Maze Explorer (Tree Search)":** interactive branching tree/maze; branching factor `b`; pruned BFS solves Game of 24. Reproduce **GPT-4 CoT 4% → ToT 74%** (b=1→45%, b=5→74%; plain IO 7.3%, CoT-SC 9.0%). Data: `data/tree-of-thoughts.json`, Yao et al. 2023.
- [ ] **Page 11 — "Interlude: How AlphaGo Thought":** look-ahead budget slider; move quality improves with simulated rollouts. Data: **client-side toy MCTS** on a tiny game (not a published curve — label as illustrative).
- [ ] **Page 12 — "The Scaling-Curve Lab (Log-Linear Coverage)":** sample-budget slider across 4 orders of magnitude; **linear↔log x-axis toggle** straightens the curve into a line. Plot **SWE-bench Lite: DeepSeek-Coder-V2-Instruct 15.9% (1 sample) → 56% (250 samples)**, beating single-sample SOTA 43%. Data: `data/coverage-scaling.json`, Brown et al. 2024. Teach log-axis reading.
- [ ] **Page 13 — "The Allocation Game (Compute-Optimal)":** distribute a fixed thinking budget across easy/medium/hard to beat baseline; score vs compute-optimal policy. Anchors: **compute-optimal >4× more efficient than best-of-N**; FLOPs-matched **test-time compute beats a 14× larger model**. Data: `data/compute-optimal.json`, Snell et al. 2024.

### Unit test
- [ ] Page 10: b=1 and b=5 endpoints = 45% and 74% within tolerance; pruning logic never expands a pruned branch; solver terminates.
- [ ] Page 11: toy MCTS move quality monotonic in rollout budget under seed; PUCT/selection rule unit-tested on a trivial game with known optimal move.
- [ ] Page 12: fitted coverage function passes through (1, 15.9%) and (250, 56%); log-transform renders the fitted power-law as ~straight (R² of linear fit in log-space above threshold).
- [ ] Page 13: scoring function ranks the compute-optimal allocation above naive uniform; misallocation loses points; the **>4× efficiency** ratio and the **14×-larger-model** comparison appear as labelled annotations tied to the JSON. Data-fidelity + citation tests for pages 10, 12, 13 (11 flagged illustrative).

### Integrate
- [ ] Pages 10–13 complete Act 2 (6→13 continuous). The axis-toggle chart on Page 12 reuses `<ChartFrame>` grammar.

### Validate
- [ ] Playwright: Page 12 axis toggle produces the "curve becomes a straight line" transition; Page 13 game scores a deliberately bad allocation lower than optimal.
- [ ] axe clean; keyboard (branching factor, sliders); reduced-motion (tree expansion collapses to instant).

**Exit gate M4:** Pages 10–13 pass page-done checklist; **entire Act 2 (6–13) playable end-to-end**; scaling-law anchors green.

---

## M5 — Act 3: Pages 14–19 (frontier & caveats) (Phase 1 MVP)

Goal: modern reasoning models and the honest caveats. **Preprint sources must be visibly flagged** via `<CitationBadge preprint>`.

### Implement
- [ ] **Page 14 — "The 'Wait' Button (Budget Forcing)":** big "Wait" button; each press appends a reconsideration step to a pre-recorded trace and nudges accuracy along **s1-32B AIME24 50% → 57%**. Data: `data/budget-forcing.json`, Muennighoff et al. 2025 **(preprint)**. Answer sometimes flips red→green.
- [ ] **Page 15 — "Reasoning Models & the RL Training Curve":** scrubber over training steps replays **DeepSeek-R1-Zero AIME'24 15.6% → 71.0% pass@1**, toggle adds cons@64 majority vote → **86.7%** (matches o1-0912); response length grows alongside (dual line). Data: `data/deepseek-r1-training.json`, DeepSeek-R1 2025.
- [ ] **Page 16 — "The Cost of Thinking (Economics Dashboard)":** compute-per-task slider vs ARC-AGI accuracy & dollar cost: **o3 low ~75.7% (~$17–20/task); o3 high (172× compute) 87.5% (thousands/task); o1 ≤ ~32%; human ~$5/task.** Present costs as *reported estimates* (survey notes ~$3K initial → ~$30K revised). Data: `data/arc-cost.json`, ARC Prize / OpenAI o3 (Dec 2024, blog — flag as non-peer-reviewed). Log-scale dollar axis.
- [ ] **Page 17 — "When More Thinking Hurts (Overthinking)":** thinking-length slider pushed past peak; inverse-U accuracy; draggable marker for where overthinking starts (easy vs hard cross first). Data: `data/overthinking.json`, inverse-scaling/overthinking literature 2025 **(preprints flagged)**. Red "overthinking zone."
- [ ] **Page 18 — "Do the Thoughts Tell the Truth? (Faithfulness)":** plant a hint; check whether displayed reasoning admits it; admission rate hovers near **Claude 3.7 Sonnet 25% / DeepSeek-R1 39%** (misalignment-hint rates **conflict between the two planning docs — see anchor table; resolve against the primary paper before building**). Data: `data/faithfulness.json`, Chen et al./Anthropic 2025 **(preprint)**. "Confession meter" stays low.
- [ ] **Page 19 — "You Be the Judge (Illusion of Thinking debate)":** interactive Tower of Hanoi; increasing disks makes required output explode past a token budget; toggle "score by full enumeration" vs "score by algorithm" flips the verdict. Data: `data/illusion-of-thinking.json`, Shojaee et al. 2025 + Lawsen 2025 **(both preprints flagged)**; note River-Crossing impossible for N≥6.

### Unit test
- [ ] Page 14: each "Wait" press advances along the fitted 50→57% curve; capped at trace length; some seeded runs flip incorrect→correct.
- [ ] Page 15: scrubber endpoints = 15.6% and 71.0%; cons@64 toggle reaches 86.7%; accuracy & length both monotonic under the replay.
- [ ] Page 16: cost/accuracy points match anchored o3 low/high, o1, human; dollar axis renders log-scale; UI copy contains an "estimate" disclaimer (asserted in test).
- [ ] Page 17: curve is inverse-U (single interior max); easy-problem peak occurs at lower thinking length than hard.
- [ ] Page 18: admission-rate simulation converges to 25%/39% (and the primary-source-verified misalignment rates) within tolerance over many seeded trials.
- [ ] Page 19: increasing disks increases required move-count (2^N−1) and required tokens; verdict flips when scoring mode toggles; N≥6 River-Crossing flagged impossible.
- [ ] **Preprint-flag test:** every Act-3 data file with `preprint:true` renders a visible preprint badge; assert Pages 14, 17, 18, 19 (and any 2025 non-archival source) are flagged. Data-fidelity + citation tests for all Act-3 JSONs.

### Integrate
- [ ] Pages 14–19 complete Act 3 in the rail; full 1→19 linear traversal works.

### Validate
- [ ] Playwright per page (esp. Page 19 verdict flip; Page 16 log axis; Page 14 answer flip).
- [ ] axe clean; keyboard (scrubber, sliders, disk count); reduced-motion.
- [ ] Editorial pass: every preprint/estimate carries its disclaimer in-app; "simulations are illustrative, not predictive" copy present where required.

**Exit gate M5:** Pages 14–19 pass page-done checklist; **all preprint/estimate sources visibly flagged**; Act 3 anchors green; app traversable 1→19.

---

## M6 — Page 20 sandbox, quiz & MVP integration (Phase 1 MVP → complete shippable product)

Goal: the synthesis page and a coherent, analytics-instrumented, end-to-end product.

### Implement
- [ ] **Page 20 — "The Grand Sandbox + Your Toolkit":** one combined control panel with every lever (CoT on/off, samples, verifier type, tree branching, budget forcing, compute budget) feeding a single live accuracy/cost readout — composed from all prior pre-computed models + client-side Monte Carlo, reading the Zustand store.
- [ ] Pre/post **predict-the-outcome quiz** reporting a pre/post score delta; questions target the conceptual objectives (log-axis reading, verifier-vs-vote, overthinking).
- [ ] "Further resources" panel linking the primary papers (from the References lists).
- [ ] Analytics wiring: per-page interaction rate (did the user manipulate the sim, not just scroll), median interactions/page, completion/drop-off, slider-range coverage.

### Unit test
- [ ] Sandbox readout is a pure function of the combined lever state; each lever moves accuracy/cost in the correct direction; composite model agrees with each source page's model at matching settings.
- [ ] Quiz scoring: pre/post delta computed correctly; item-level correctness mapped to objectives.
- [ ] Analytics events fire once per genuine interaction (no double counting; scroll ≠ interaction).

### Integrate
- [ ] Full-app E2E: traverse Pages 1→20, take pre-quiz, exercise every sandbox lever, take post-quiz, confirm delta reported and analytics captured.
- [ ] Store rehydration: sandbox reflects any state the learner set on earlier pages (if that carryover is in scope) or resets cleanly.

### Validate
- [ ] Playwright full-journey test green; axe clean on Page 20 (the densest control panel — special attention to labelling/grouping).
- [ ] Verify the product is genuinely **free-to-serve & offline-capable**: run the built app with network disabled after first load; all 20 pages function (no page depends on a live API in MVP).
- [ ] Confirm Hobby-tier fit: static assets + pre-computed JSON only in MVP; no server route active.

**Exit gate M6 (MVP COMPLETE):** all 20 pages done; full journey + quiz + sandbox E2E green; offline run passes; analytics captured; data-fidelity suite 100% green across every anchored page. **This is a complete, shippable product.**

---

## M7 — Polish: motion, accessibility, mobile, performance (Phase 2)

Goal: production quality. No new concepts.

### Implement
- [ ] Framer Motion refinement pass — purposeful motion only; a "purposeful motion review gate" removes any animation not tied to a student action (3B1B "avoid pointless animations").
- [ ] Mobile pass: narrative stacks above simulation on narrow screens; controls thumb-reachable.
- [ ] Full accessibility pass beyond per-page axe: focus order, ARIA relationships on composite widgets, screen-reader narration of dynamic values, color-contrast on the dark canvas.
- [ ] Performance tuning: modular D3 imports, verify route-level splitting, confirm workers offload heavy compute, GPU-composited animations that reduce under `prefers-reduced-motion`.

### Unit / automated test
- [ ] Bundle-size budget test per route (fails CI if a page pulls in another page's sim code).
- [ ] Lighthouse CI (or equivalent) asserts LCP < ~2.5s on a mid-range-mobile profile for representative pages.
- [ ] axe suite across **all 20 pages** in CI (not just spot checks).

### Integrate
- [ ] Cross-device Playwright matrix (desktop + mobile viewport) for the full journey.

### Validate
- [ ] Manual reduced-motion + keyboard-only full traversal.
- [ ] Manual mobile traversal on a real/emulated device.

**Exit gate M7:** perf budgets met; axe clean across all 20 pages in CI; mobile + reduced-motion + keyboard-only traversals pass.

---

## M8 — Formative user testing & iteration (Phase 2)

Goal: validate learning, not just correctness. (From the spec's Recommendation 3.)

### Do
- [ ] Run a moderated think-aloud / formative test with **5–8 target undergraduates**.
- [ ] Collect: pre/post quiz deltas, per-page interaction rate, drop-off, confidence-and-clarity survey mapped to the six learning objectives, qualitative overload signals.
- [ ] **Change trigger (act on it):** if <50% of users manipulate a given simulation, redesign that page so the control is the first thing they touch (Case's "start on the ground"). Re-test affected pages.
- [ ] Fix cognitive-overload hotspots; re-verify one-idea-per-page holds where flagged.

**Exit gate M8:** pre/post quiz shows a meaningful positive conceptual shift; no simulation below the 50% manipulation threshold after iteration; overload hotspots resolved.

---

## M9 — Optional live in-browser inference (Phase 3, feature-flagged)

Goal: let Pages **3, 6, 14** *optionally* show a real chain-of-thought — **always behind a flag, always with graceful fallback to the pre-computed trace bank.** Do not start unless M6 (and ideally M8) are complete; this is an enhancement, never a dependency, and **not a blocker for the M10 submission package** (the piece is fully submittable with the flag OFF).

### Implement
- [ ] In-browser inference (preferred, zero server cost): transformers.js (`@huggingface/transformers` v3+) running a small quantized instruct model (e.g. Qwen2.5-0.5B-Instruct) via **WebGPU (WASM fallback)**, in a Web Worker, cached in IndexedDB after first load. WebLLM is an acceptable alternative for a slightly larger chat model.
- [ ] Feature flag gating the live demo on Pages 3/6/14; **default OFF**. When WebGPU is unavailable, silently revert to the pre-computed trace bank.
- [ ] (Only if a specific hosted model is required) Next.js Route Handler holding the provider key in a **sensitive** Vercel env var (never client-exposed); `@upstash/ratelimit` sliding-window by IP in edge middleware; responses cached; on limit/error → fall back to pre-computed. Respect Vercel function-duration and edge first-byte limits.

### Unit / integration test
- [ ] Capability-detection returns correct WebGPU availability; fallback path selected when absent (mock both branches).
- [ ] With the flag OFF, pages behave exactly as the MVP (regression: M6 E2E still green).
- [ ] With the flag ON + WebGPU mocked present, the worker streams tokens into the trace UI; on simulated model error → falls back without breaking the page.
- [ ] (If server route built) rate-limit returns 429 past the window and the client falls back; key never appears in client bundle (asserted).

### Validate
- [ ] Manual: on a WebGPU browser, Page 3/6/14 show a genuine chain-of-thought; on a non-WebGPU browser, identical pre-computed experience with no error.
- [ ] Confirm default deployment (flag OFF) remains within Vercel Hobby tier and incurs no API spend.

**Exit gate M9:** live demo works on WebGPU, falls back cleanly everywhere else, is OFF by default, and the flag-OFF app is byte-for-byte the shippable MVP experience. A cost spike or provider outage cannot break the lesson or the budget.

---

## M10 — VISxAI submission package (final)

Goal: turn the finished, tested, polished explorable into a complete, reviewable VISxAI submission. Depends on M6 (MVP) and M7 (polish); M8 (user-testing) results strengthen it; M9 (live inference) is optional and not a blocker.

### Produce
- [ ] **Stable public deployment** of the production build at a permanent URL for reviewers; verify it loads cold on a clean machine and works offline after first load.
- [ ] **Accompanying description** per the current VISxAI CFP: contribution, target audience (1st–2nd-year engineering undergrads with no ML background), and the explorable-explanation + learning-science rationale (Victor active reading, Case start-concrete/sandbox, Mayer multimedia principles, Predict-Observe-Explain, Cognitive Load Theory — as cited in the spec), with an explicit mapping from each design decision to the principle it serves. Verify required length/format/anonymization against the live call.
- [ ] **Teaser image + short video/GIF walkthrough** of representative simulations (e.g. Page 12 axis-toggle "curve becomes a line" moment; Page 19 verdict flip; Page 16 cost dashboard).
- [ ] **Open-source repository**: clean README (run/build/test instructions), `PROVENANCE.md` linked, a license chosen for code + content, and third-party attribution (papers, datasets, libraries).
- [ ] **Limitations & ethics statement** (in-app + description): "illustrative, not predictive"; every preprint/estimate flagged; simulations reproduce published shapes/endpoints only, not any specific model's behavior.
- [ ] **Reproducibility appendix**: a reviewer can regenerate every curve from the cited data points via the digitization records in `PROVENANCE.md`.

### Verify (final QA gate)
- [ ] Full **data-fidelity suite green**: every on-screen number traces to the anchor table *and* `PROVENANCE.md`, within stated tolerance; no uncited or invented numbers anywhere.
- [ ] **Accessibility**: axe clean across all 20 pages + Page 20; keyboard-only and reduced-motion full traversals pass; contrast verified on the dark canvas.
- [ ] **Cross-browser/device matrix** (current Chrome/Edge/Firefox/Safari desktop + a mobile viewport): the pre-computed experience works everywhere; any WebGPU-only feature (if M9 shipped) degrades gracefully.
- [ ] **Performance**: LCP < ~2.5s on a mid-range-mobile profile for representative pages.
- [ ] **Factual proofread** by a subject-matter reviewer; confirm every preprint/estimate disclaimer is present and correct.
- [ ] **Learning evidence** (from M8) summarized in the description: pre/post conceptual gain reported honestly.

**Exit gate M10:** submission-ready — hosted URL live, description + teaser + repo + license + ethics complete, full data-fidelity and accessibility suites green, and the piece has passed a subject-matter factual review. Re-verify all logistics against the live VISxAI 2026 CFP before submitting.

---

## Data Anchor Reference

Ground-truth numbers every simulation must reproduce (tolerance ±1.0 pp unless noted). Store each in versioned JSON with its citation. **PP = preprint / non-peer-reviewed — must be flagged in-app.**

| Page | Anchor | Source |
|---|---|---|
| 2 | GSM8K standard-prompting baseline **17.9%** (PaLM 540B) | Wei et al. 2022 (arXiv:2201.11903) |
| 3 | GSM8K **17.9% → 56.9%** CoT (+39.0 pts; 58% w/ calculator; prior SOTA 55%) | Wei et al. 2022 |
| 4 | **>60%** of CoT "thoughts" fail after step 1 (authored trace bank) | Yao et al. 2023 (arXiv:2305.10601) |
| 5 | Coverage `1-(1-p)^n` (client Monte Carlo) | — (derived) |
| 6 | Self-consistency GSM8K **+17.9%** (SVAMP +11.0, AQuA +12.2, StrategyQA +6.4, ARC-c +3.9) | Wang et al. 2022 (arXiv:2203.11171) |
| 7 | Majority vote / reward models plateau beyond several hundred samples | Brown et al. 2024 (arXiv:2407.21787) |
| 8 | Verifier best-of-N > majority > random | Cobbe et al. 2021 (arXiv:2110.14168) |
| 9 | MATH best-of-N: **PRM 78.2% vs ORM 72.4%** (majority 69.6%) | Lightman et al. 2023 (arXiv:2305.20050) |
| 10 | Game of 24: CoT **4% → ToT 74%** (b=1→45%, b=5→74%; IO 7.3%, CoT-SC 9.0%) | Yao et al. 2023 |
| 11 | Toy MCTS move quality ↑ with rollouts (illustrative, not published) | AlphaGo/Zero lineage (Silver et al.) |
| 12 | SWE-bench Lite: **15.9% (1) → 56% (250 samples)**, log-linear; SOTA 43% | Brown et al. 2024 |
| 13 | Compute-optimal **>4× vs best-of-N**; TTS beats **14× larger** model (FLOPs-matched) | Snell et al. 2024 (arXiv:2408.03314) |
| 14 | s1-32B AIME24 **50% → 57%** (budget forcing) — **PP** | Muennighoff et al. 2025 (arXiv:2501.19393) |
| 15 | DeepSeek-R1-Zero AIME'24 **15.6% → 71.0%** pass@1; **86.7%** cons@64 | DeepSeek-R1 2025 (arXiv:2501.12948, Nature) |
| 16 | o3: low **75.7%** (~$17–20); high (172× compute) **87.5%** (thousands/task, est. $3K→$30K); o1 ≤ ~32%; human ~$5 — **estimates, blog source** | ARC Prize / OpenAI o3 Dec 2024 |
| 17 | Inverse-U: longer CoT can reduce accuracy on easy tasks — **PP** | Overthinking/inverse-scaling lit. 2025 |
| 18 | Hint admission: Claude 3.7 **25%**, R1 **39%**. Misalignment hints: **SOURCE CONFLICT** — Explainable doc says 20% / 29%, Survey says 41% / 19%; resolve against the primary paper and log in `PROVENANCE.md` — **PP** | Chen et al./Anthropic 2025 (arXiv:2505.05410) |
| 19 | Hanoi tokens explode (2^N−1 moves); verdict flips by scoring mode; River-Crossing impossible N≥6 — **PP (both sides)** | Shojaee et al. 2025 (arXiv:2506.06941) + Lawsen 2025 (arXiv:2506.09250) |

### Standing guardrails (apply throughout)
- **Never invent a number.** If a value isn't in the anchor table or a cited JSON, don't display it.
- **Log provenance & resolve conflicts.** Every number traces to `data/PROVENANCE.md` (source figure/table + extraction method). Where the two planning docs disagree, defer to the primary paper and record the decision.
- **Illustrative, not predictive.** In-app copy must say simulations reproduce published *shapes and endpoints*, not predict any specific model.
- **Flag every preprint/estimate** (Pages 14, 16, 17, 18, 19) via the citation badge.
- **Fallback everywhere.** Any optional live feature must degrade silently to pre-computed mode.
- Verify plan-dependent externals against live docs before relying on them: exact Vercel Hobby caps and WebLLM VRAM/throughput tiers were unconfirmed in the source research.
