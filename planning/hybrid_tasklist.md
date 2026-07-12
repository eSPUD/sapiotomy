# Task List — *"Watch It Think · Change Its Mind · Watch It Break"*

A milestone-driven implementation plan for a Claude Code agent. Derived from
[`hybrid_explorable_proposal.md`](./hybrid_explorable_proposal.md) (**Rev 2, 2026-07-12** — build spec) and
[`hybrid_explorable_story_review.md`](./hybrid_explorable_story_review.md) (story-quality gates), with verified data anchors
cross-checked against [`InferenceTimeScaling_Survey.md`](./InferenceTimeScaling_Survey.md) and
[`../literature_review/inference_time_scaling_review.md`](../literature_review/inference_time_scaling_review.md).

## Target venue & the two deadlines

This project targets the **9th Workshop on Visualization for AI Explainability (VISxAI)** at IEEE VIS 2026. VISxAI's signature format is a **working, interactive explorable** at a live URL, reviewed on explanatory/pedagogical power, quality of the interactive visualization, novelty, technical soundness, and clarity.

The plan is **two-tier** (proposal §7):

| Tier | Deadline | Deliverable |
|---|---|---|
| **Tier 1 — submission** | **Aug 3, 2026** | The **14-page MVP** (pages 1–13 + 16) live at a stable URL + a backup PDF abstract, submitted via PCS (VGTC → VIS 2026 → VISxAI Blog Posts). |
| **Tier 2 — camera-ready** | **Oct 16, 2026** | Full 16 core pages + optional live mode (17) and methods page (18); formative user testing folded in. |

Two artifacts are first-class, not afterthoughts: **(1)** the explorable itself; **(2)** the **accompanying abstract/description** per the current CFP (**verify exact length/anonymity requirements against the live VISxAI 2026 call before submitting — do not assume**).

## How to use this document

- Work milestone by milestone (**M0 → M10**). Do **not** start a milestone until the prior one's **Exit gate** passes (M0/M1 may overlap — noted below).
- **Milestone ↔ page ordering is intentionally non-linear:** M2 builds **Page 4 (the thinking-budget knob)** first as the reference template because it exercises the riskiest, most-reused tech — the **TraceNavigator + branch bank** — plus a calibrated anchor, POE, and the chart grammar. Every later page copies it. This is deliberate, not an error.
- Every milestone follows the same loop: **Implement → Unit test → Integrate → Validate**, with an explicit **Exit gate**.
- Check off boxes as you go (`- [ ]` → `- [x]`). Commit at the end of each milestone with a message referencing the milestone id (e.g. `M2: Page 4 budget-knob reference template`).
- **Golden rule: lock every simulation to a cited data point before building its UI.** Numbers live in versioned JSON with the citation attached; never invent a curve. Canonical anchors: [Data Anchor Reference](#data-anchor-reference).
- **Source-discrepancy rule:** the planning docs occasionally disagree (e.g. Page 14 misalignment-hint faithfulness: one doc says **20% / 29%**, the survey says **41% / 19%**). Where they conflict, **resolve against the primary paper**, record the resolution in `data/PROVENANCE.md`, and cite the primary source in-app. Known conflicts are flagged in the anchor table.
- After each page is built, run the full test suite + typecheck + lint + build. A milestone is not done if any of those are red.

## Story-QA gates (new in Rev 2 — enforced at M6, checked continuously)

From the story review. These are **release invariants**, equal in rank to the data-fidelity suite:

1. **Causal-chain gate:** no page references a concept (sampling, voting, coverage, verification) before the page that introduces it, *in MVP ordering*. Specifically: 5 (vote) → 6 (coverage/gap) → 7 (verifier) → 8 (PRM) must be navigable in that order with no gaps.
2. **Signature-wow gate:** all **three** signature interactions are demoable in the submitted build — budget knob (4), verifier betrayal (7), log-straightening + dollar-shock (6, 11).
3. **Bookend gate:** page 16 re-presents the **page-1 trace** and explicitly answers the page-1 stake question in copy.
4. **Telescope gate:** every off-spine published anchor renders inside the marked `FieldDataFrame` (🔭) with a zoom-back to the home-base puzzle.
5. **Lever-count gate:** four levers, each numbered in a page title (4, 5, 7, 9), and the `LeverRail` fills ▓▓▓▓ by page 10.
6. **Cut-order invariant:** if scope slips, cut in this order: 8 → 12 → 2. **Never cut 5, 6, 11, or 16.**

---

## Global conventions & definition of done

Applies to every task in every milestone.

- **Language/stack:** Next.js (App Router) + React + TypeScript (strict), Tailwind CSS, Zustand (global sim/settings state), Framer Motion (purposeful animation only), D3 (bespoke charts) with visx/Recharts for standard charts.
- **Testing:** Vitest + React Testing Library for units/components; Playwright for E2E; `@axe-core/playwright` for accessibility. Simulation math (Monte Carlo, interpolation, fits) gets deterministic unit tests via a **seeded RNG** — no flaky randomness.
- **Data fidelity (non-negotiable):** for every page backed by a published number, a unit test asserts the simulation reproduces the paper's endpoints within tolerance (default ±1.0 pp unless noted). Every data JSON carries `citation` and `provenance` fields; a test asserts none is missing either.
- **Trace & branch-bank conventions (new):** traces are JSON `{tokens[], moveTags[], entropy[], branchPoints[]}`; the branch bank is keyed by `(decisionPointId, intervention)` where `intervention ∈ {injectWait, pruneBranch, budgetCap(n), verifierGate}`. A schema validator runs in CI; every exposed decision point must have ≥1 continuation per exposed intervention.
- **A page is "done" only when:** it renders; sim unit tests + data-fidelity test pass; ≥1 live control (Victor); POE predict-before-reveal present; keyboard-operable + ARIA-labelled controls (axe clean); degrades gracefully if an optional feature is unavailable; registered in the Acts rail (and `LeverRail` if Act 2); any off-spine anchor uses `FieldDataFrame`.
- **Accessibility invariant:** never color alone (color + label/shape); honor `prefers-reduced-motion`; all controls keyboard-reachable.
- **Performance invariant:** route-level code splitting; Monte Carlo in Web Workers; core payload a few MB max (branch bank lazy-loaded per page); target LCP < 2.5s on mid-range mobile.

---

# TIER 1 — Submission by Aug 3

## M0 — Project foundations & CI *(Jul 12–15)*

Goal: running skeleton with the design system, state, chart grammar, rails, data loader, and green CI. No page content.

### Implement
- [ ] Scaffold Next.js (App Router) + TypeScript (strict) + Tailwind; clean `next build`.
- [ ] Design-token layer enforcing the 3-hue grammar (**compute/energy**, **correct/accuracy**, **wrong**) used identically everywhere; tokens in one file; "no raw hex in components" lint rule.
- [ ] Zustand global store for simulation/settings state (the store the Page-16 sandbox later reads).
- [ ] Shared primitives: `<Slider>`, `<Toggle>`, `<Stepper>`, `<BigNumber>`, `<ChartFrame>` (shared axis/legend grammar), `<PredictBar>` (POE), `<CitationBadge>` (source + preprint flag), **`<LeverRail>`** (levers-unlocked ▓▓░░ counter), **`<FieldDataFrame>`** (the marked 🔭 telescope-move frame with zoom-back affordance).
- [ ] Persistent **three-Act progress rail** (*Watch it think / You change its mind / Watch it break* + capstone); route map for 16 core + 2 optional pages (stubs OK).
- [ ] `data/` convention + TypeScript loader validating each JSON against a schema requiring `points` (or `trace`/`bank`), optional `fit`, mandatory `citation` (`{ref, url, venue, preprint}`), mandatory `provenance` string.
- [ ] `data/PROVENANCE.md`: per data file — exact source (paper + figure/table), extraction method (digitizer / verbatim / derived / our-own-run + script ref), raw points, fit params. The reviewer-facing audit trail.
- [ ] Web Worker harness + seeded RNG utility (one PRNG shared by app and tests).

### Unit test
- [ ] Tokens resolve; no-raw-hex lint active.
- [ ] Store reducers/selectors behave; stable references.
- [ ] Data loader rejects JSON missing `citation` **or** `provenance`; accepts valid; typed access works. Branch-bank schema validator rejects a bank with an uncovered decision point.
- [ ] Seeded RNG: same seed → same sequence.

### Integrate
- [ ] CI (GitHub Actions): install → typecheck → lint → unit → `next build` → Playwright smoke; required on PR.
- [ ] Vercel connected: preview per PR, production on `main`; env vars scoped; secrets sensitive (none needed yet).
- [ ] Smoke test: app boots, Acts rail renders, navigation between stub routes works.

### Validate
- [ ] CI green end-to-end on a PR; reduced-motion respected by the demo animation.

**Exit gate M0:** CI green; primitives importable; data loader enforces citations; branch-bank validator active; seeded RNG deterministic.

---

## M1 — Offline data pipeline & branch bank *(Jul 13–18, overlaps M0)*

Goal: every MVP page's data exists, validated and cited, before UI work depends on it. All generation scripts are **committed** (they become page 18's reproducibility story).

### Implement (scripts in `scripts/`, output in `data/`)
- [ ] **Hero traces:** DeepSeek-R1 (API) on ~6–10 curated Game-of-24 instances incl. THE hero instance (pages 1, 2, 4, 16); raw `<think>` + answer; light rule/LLM **move tagger** → `{plan, compute, check, backtrack}` tags.
- [ ] **Branch bank** for the hero trace(s): enumerate exposed decision points; generate continuations for each intervention — `injectWait`, `pruneBranch`, `budgetCap` ladder, `verifierGate`; dedupe; size-cap; emit per the bank schema (page 4 + capstone 16).
- [ ] **Entropy overlay:** R1-Distill-Qwen-1.5B local — per-token logprobs/entropy for the hero trace (pages 1–2).
- [ ] **Sampling sweeps:** N ∈ {1…256} on the math ladder → pass@k coverage, majority-vote, verifier-scored, **and corrupted-verifier variants** (pages 5–7).
- [ ] **ToT/MCTS rollouts** on Game-of-24: tree logs, node values, branching-factor sweep (page 9).
- [ ] **Budget-forcing sweep** calibrated to the s1 anchor (page 4 curve).
- [ ] **Hanoi sweep** per *Illusion of Thinking* methodology: accuracy + thinking-effort vs disks (page 13).
- [ ] **Digitized published anchors** → JSON + provenance entries: Wei (p3), Wang/Yao (p5), Brown (p6), Lightman (p8), Yao-ToT (p9), Snell (p10), ARC/o3 (p11), overthinking (p12).

### Unit test
- [ ] Every emitted file passes the loader schema (citation + provenance present).
- [ ] Move tagger deterministic on fixture traces; tag coverage ≥95% of tokens.
- [ ] Branch-bank invariants: acyclic; every decision point covered per intervention; budget-cap ladder monotone in trace length.
- [ ] Coverage curves monotonically non-decreasing in N; corrupted-verifier realized accuracy ≤ clean-verifier.

### Validate
- [ ] Spot-read 3 tagged traces by hand — tags sensible, the hero trace tells a good story (has a visible "Wait" backtrack and a wrong→right budget flip).
- [ ] Total core JSON payload within budget (branch bank chunked for lazy load).
- [ ] `PROVENANCE.md` has one entry per file, incl. our-own-run script references.

**Exit gate M1:** all MVP data files present + schema-valid + cited; hero trace curated and tagged; branch bank validated; payload within budget.

---

## M2 — Reference page template: Page 4 (Lever 1 — the thinking-budget knob) *(Jul 16–19)*

Goal: **one page end-to-end** as the canonical template. Chosen because it de-risks the hero tech first: TraceNavigator + branch bank + calibrated anchor + POE + chart grammar + lever rail.

### Implement
- [ ] **`<TraceNavigator>`**: token-stream rendering with move-tag coloring, scrub/play, grows on budget increase, navigates branch-bank continuations. The single most-reused bespoke component (pages 1, 2, 4, 16).
- [ ] Budget knob (`<Slider>`) → trace grows ("Wait…" appended from the bank) → **answer flips wrong → right** on the seeded path; 🔭 `FieldDataFrame` accuracy curve calibrated to **s1 50% → 57% AIME24** *(preprint badge)*; rises-then-flattens.
- [ ] `<PredictBar>` before the reveal; `<CitationBadge preprint>`; `LeverRail` lights **Lever 1**.

### Unit test
- [ ] Navigator renders bank paths deterministically; scrub position ↔ token index bijective; budget ↑ ⇒ trace length ↑.
- [ ] Curve endpoints 50/57 within ±1.0 pp; flattening (derivative shrinks) asserted; answer-flip event fires on the seeded path.
- [ ] Data-fidelity + citation tests for `budget-forcing.json` and the hero trace/bank files.

### Integrate
- [ ] Registered in Acts rail (Act 2) + LeverRail; worker↔UI message contract component-tested.

### Validate
- [ ] Playwright: predict → drag → trace grows → answer flips → curve annotates; textual announcement of the flip (screen-reader path).
- [ ] axe zero serious/critical; keyboard slider; reduced-motion collapses growth animation to instant.

**Exit gate M2:** Page 4 passes the full page-done checklist. Document layout in `docs/page-template.md` + `data/README.md`. **This is the template.**

---

## M3 — Act 1: *Watch it think* — Pages 1–3 *(Jul 19–22)*

Goal: the active on-ramp, the stake, and the hinge.

### Implement
- [ ] **Page 1 — "Think fast, think slow":** the reader acts FIRST — answer "2+2" instantly, then work "17×24" (stopwatch, authored accuracy set). *Then* the reveal: the hero R1 trace streaming via TraceNavigator (play/scrub). **Stake copy present:** thinking time is now a priced product — worth buying? trustworthy? R1 context anchor available (15.6→71.0→86.7 cons@64) as a `FieldDataFrame` aside.
- [ ] **Page 2 — "Anatomy of a thought":** same trace; move-tag color+label coding (plan/compute/check/**backtrack**); hover + filter by move; entropy overlay toggle.
- [ ] **Page 3 — "Rewind to 2022":** **hinge line in copy** (*"That was a 2025 reasoning model… rewind three years"*); toggle instant-answer vs show-your-work; 🔭 bar **17.9% → 56.9%** GSM8K (PaLM 540B); zoom-back beat to the puzzle.

### Unit test
- [ ] Page 1: mode-accuracy lookup returns authored values; injected clock (no wall-clock flake); **copy test asserts the stake question renders**.
- [ ] Page 2: filter shows only selected move class; entropy overlay maps to per-token values; color never alone (label/shape asserted).
- [ ] Page 3: **copy test asserts the hinge line**; toggle switches datasets; endpoints 17.9/56.9 within tolerance; data-fidelity + citations.

### Integrate
- [ ] Pages 1–3 in Acts rail order; Act 1 → Act 2 navigation continuous (3 → 4).

### Validate
- [ ] Playwright per page (reader-acts-first flow on page 1); axe clean; keyboard; reduced-motion.
- [ ] Content review: one idea per page; no jargon before its page; the stake reads naturally, not bolted on.

**Exit gate M3:** Pages 1–3 pass page-done; stake + hinge copy-tested; Act 1 traversable into Page 4.

---

## M4 — Act 2: *You change its mind* — Pages 5–10 *(Jul 21–27)*

Goal: the remaining levers with the causal chain **sample → vote stalls → coverage can't be cashed in → verifier → betrayal → repair → search → allocate**, and tonal beats (win/stall/reversal/betrayal/repair/win/boss) — not eight identical knob-pages.

### Implement
- [ ] **Page 5 — "Lever 2 — not every path is right → ask many, then vote"** *(merged page: two sequenced reveals, one surface)*: resample the home-base problem → chains diverge green/red (>60% first-step dooms framing, Yao); then votes dial 1→40 → majority climbs (**+17.9 pts** GSM8K 🔭, seeded worker Monte Carlo) → **stalls** (cliffhanger). LeverRail → Lever 2.
- [ ] **Page 6 — "The scaling lab — coverage soars… and you can't cash it in"** *(merged page)*: sample slider across 4 orders of magnitude; **linear↔log toggle straightens the curve** (🔭 SWE-bench Lite **15.9%→56%**); then toggle "oracle picks"→"you must pick": realized accuracy **sags away** on the same chart (plateau beyond several hundred samples).
- [ ] **Page 7 — "Lever 3 — verify… and the betrayal"** ★★: N candidate cards; verifier ON → accuracy jumps toward coverage; **corruption slider** → mis-ranking, capping, active misleading. LeverRail → Lever 3.
- [ ] **Page 8 — "Repairing the judge (PRM vs ORM)":** ORM end-label vs PRM per-step glow; 🔭 MATH best-of-N **PRM 78.2 / ORM 72.4 / MV 69.6**.
- [ ] **Page 9 — "Lever 4 — search the tree":** interactive ToT tree on the home base; branching *b*; **b=1→45%, b=5→74%** vs CoT **4%**; dead branches dim/collapse. LeverRail → Lever 4 (▓▓▓▓).
- [ ] **Page 10 — "The allocation game" (boss):** distribute a fixed budget across easy/med/hard vs the compute-optimal policy; 🔭 **>4× efficiency; beats a 14× larger model**.

### Unit test
- [ ] P5: chain bank has correct+incorrect; displayed failure proportion matches >60% framing; vote curve rises then plateaus; +17.9 endpoint within tolerance; ties deterministic.
- [ ] P6: fit passes through (1, 15.9) and (250, 56); log-space linear fit R² above threshold; realized ≤ coverage everywhere; plateau derivative → ~0.
- [ ] P7: verifier > majority > random under seed; corruption monotonically degrades realized accuracy; at high corruption, verifier < majority (the betrayal is real).
- [ ] P8: 78.2/72.4/69.6 within ±1.0 pp; per-step labels bind color **and** text.
- [ ] P9: b=1/b=5 endpoints 45/74; pruned branches never re-expand; solver terminates.
- [ ] P10: compute-optimal allocation outranks uniform; misallocation loses points; 4× and 14× annotations tied to JSON. Data-fidelity + citations for all six pages.

### Integrate
- [ ] Act 2 continuous 4→10; **navigation-order test enforces the causal chain** (5 before 6 before 7 before 8); LeverRail fills in order.

### Validate
- [ ] Playwright: P6 axis-toggle straightening + gap reveal; P7 betrayal flow (on → jump → corrupt → mislead); P10 bad allocation scores lower.
- [ ] axe clean; keyboard; reduced-motion (tree expansion instant).
- [ ] Beat check: the seven pages read win → stall → reversal → betrayal → repair → win → boss (editorial pass).

**Exit gate M4:** Pages 5–10 pass page-done; Act 2 playable 4→10; causal-chain navigation test green; all Act-2 anchors green.

---

## M5 — Act 3 MVP + capstone: Pages 11–13, 16 *(Jul 26–31)*

Goal: the breaks the story promised, and the bookend that answers page 1. **Preprint sources visibly flagged.**

### Implement
- [ ] **Page 11 — "The bill arrives" ★** *(promoted to MVP — wow #3b, cheapest build)*: 🔭 cost-vs-accuracy scatter, **log-$ axis**: o3 low **75.7% @ ~$17–20/task**; o3 high (172×) **87.5%** (thousands/task, *reported estimates*); o1 ≤ ~32%; human ~$5. Copy links back to the page-1 stake. Data: ARC Prize / OpenAI blog — **flag non-peer-reviewed; costs are estimates**.
- [ ] **Page 12 — "When more thinking hurts":** length slider past the peak; inverse-U; draggable marker for the overthinking threshold (easy crosses first); red overthinking zone. **(preprints flagged)**
- [ ] **Page 13 — "The complexity cliff":** Tower-of-Hanoi disk dial; accuracy collapses past the wall; **thinking-effort trace paradoxically drops** alongside. **(preprint flagged)**
- [ ] **Page 16 — "Back to the first thought" ★★ (bookend + sandbox):**
  - the **page-1 hero trace returns** in TraceNavigator with all learned annotations switchable (moves, entropy, budget, verifier, tree);
  - **the honest answer in copy**: thinking longer works — lawfully, within limits (plateau, backfire, walls, cost, honesty);
  - the grand sandbox: every lever (length, samples, verifier + corruption, search depth, difficulty) → one accuracy/cost readout, "auto-tune to compute-optimal", composed from prior models + Monte Carlo via the Zustand store;
  - short pre/post predict-the-outcome quiz (log-axis reading, verifier-vs-vote, overthinking) with delta report;
  - "further resources" panel linking primary papers.

### Unit test
- [ ] P11: scatter points match anchors; dollar axis log-scale; **copy test asserts the "estimate" disclaimer** and the stake callback.
- [ ] P12: single interior max; easy-peak < hard-peak in thinking length.
- [ ] P13: required moves 2^N−1 grows; accuracy collapse past threshold; effort curve drops after the wall.
- [ ] P16: sandbox readout is a pure function of lever state; each lever moves accuracy/cost in the correct direction; composite agrees with each source page's model at matching settings; quiz delta computed correctly; **copy test asserts the explicit answer to the page-1 question**; bookend renders the SAME hero trace id as page 1 (asserted).
- [ ] **Preprint-flag test:** every `preprint:true`/blog file renders the badge (pages 4, 11, 12, 13).

### Integrate
- [ ] Full MVP traversal 1→13 → 16 (14/15 stubbed with a graceful "camera-ready" placeholder or hidden from nav until Tier 2 — hidden preferred).

### Validate
- [ ] Playwright: P11 log-axis shock renders; P13 collapse + effort-drop; P16 full sandbox exercise + quiz + bookend.
- [ ] axe clean (P16 is the densest panel — extra attention to grouping/labels); keyboard; reduced-motion.

**Exit gate M5:** Pages 11–13 + 16 pass page-done; full MVP traversable end-to-end; bookend + disclaimer copy tests green.

---

## M6 — MVP integration, story-QA gates & hardening *(Jul 30–Aug 1)*

Goal: a coherent, accessible, fast, offline-capable product that passes every release invariant.

### Do
- [ ] **Run the six story-QA gates** (top of doc) as named Playwright/editorial checks; all must pass.
- [ ] Full-app E2E: traverse 1→16, pre-quiz → every sandbox lever → post-quiz → delta reported.
- [ ] axe suite across **all 14 MVP pages** in CI; keyboard-only and reduced-motion full traversals (manual).
- [ ] Mobile pass: narrative stacks above simulation; controls thumb-reachable; charts scroll in their own container.
- [ ] Performance: bundle-size budget test per route; Lighthouse CI LCP < ~2.5s mid-range-mobile on representative pages; workers verified off-main-thread.
- [ ] **Offline check:** with network disabled after first load, all 14 pages function (no live API in MVP).
- [ ] Hobby-tier check: static assets + JSON only; no server route active.
- [ ] Analytics wiring: per-page interaction rate (manipulate ≠ scroll), median interactions/page, completion/drop-off, slider-range coverage.
- [ ] Editorial: every preprint/estimate disclaimer present; "illustrative, not predictive" copy present; colorblind check; copy-edit.

**Exit gate M6 (MVP COMPLETE):** all six story-QA gates green; data-fidelity suite 100% green; axe clean across MVP; offline run passes; perf budgets met. **This is a complete, submittable product.**

---

## M7 — Submission package & submit *(Aug 2–3)*

### Produce
- [ ] **Stable production deployment** at a permanent URL; verify cold load on a clean machine.
- [ ] **Abstract + description** per the live CFP (title, authors, abstract; contribution = novel *explanation*, audience, design rationale incl. Victor/Case/Mayer/POE mapping). **Verify length/format/anonymization against the live call.**
- [ ] Backup **PDF** of the abstract.
- [ ] **Teaser image + short GIF** (budget-knob answer flip; P6 curve-straightening + gap; P7 betrayal; P11 dollar axis).
- [ ] Repo hygiene: README (run/build/test), `PROVENANCE.md` linked, license, third-party attribution.
- [ ] **Submit via PCS:** Society VGTC → Conference VIS 2026 → Track "VIS 2026 VISxAI Workshop Blog Posts" — live URL + PDF backup. **Deadline Aug 3 (ET).**

**Exit gate M7:** submission confirmed in PCS before the deadline; URL loads for a logged-out visitor; teaser assets archived in-repo.

---

# TIER 2 — Camera-ready by Oct 16

## M8 — Camera-ready pages: 14, 15 (+ optional 17, 18) *(Aug – Sep)*

### Implement
- [ ] **Page 14 — "Do the thoughts tell the truth?":** plant-a-hint interaction; confession meter hovers at **Claude 3.7 25% / R1 39%**; **resolve the misalignment-hint SOURCE CONFLICT (20/29 vs 41/19) against the primary paper (arXiv:2505.05410) before building**; log in `PROVENANCE.md`. **(preprint flagged)**
- [ ] **Page 15 — "You be the judge":** split prosecution/defense layout; Hanoi token-budget explosion; toggle "score by full enumeration" vs "score by algorithm" → **verdict flips**; River-Crossing impossible N≥6 noted. **(both sides preprints)**
- [ ] **Page 17 (opt) — live mode, feature-flagged, default OFF:** R1-Distill-1.5B via WebLLM/transformers.js (WebGPU, worker, IndexedDB cache); capability-gated; silent fallback to the branch bank. If a hosted proxy is used instead: sensitive env key, `@upstash/ratelimit` by IP, cached, fallback on limit/error. Flag-OFF app must be byte-identical to MVP behavior (regression: M6 E2E still green).
- [ ] **Page 18 (opt) — How this was made:** provenance panel, committed generation scripts, full reference list.

### Test / validate
- [ ] P14: admission-rate sim converges to primary-source values over seeded trials; conflict resolution recorded.
- [ ] P15: verdict flips on scoring toggle; 2^N−1 token explosion asserted; impossibility flag at N≥6.
- [ ] P17: capability detection both branches (mocked); fallback clean; key never in client bundle (asserted); flag OFF ⇒ M6 E2E green.
- [ ] Re-run story-QA gates with 14–15 inserted (the chain must still read; Act 3 escalation order: cost → backfire → cliff → honesty → illusion → answer).

**Exit gate M8:** full 16 core pages pass page-done; conflict resolved from primary source; optional pages flag-gated with green fallbacks.

---

## M9 — Formative user testing & iteration *(Sep)*

- [ ] Moderated think-aloud with **5–8 target readers** (HS-math+ general audience per Rev 2, not only undergrads).
- [ ] Collect: pre/post quiz deltas; per-page interaction rate; drop-off; confidence survey; overload signals; **story signals** (do they predict before revealing? do they feel the betrayal? does the bookend land?).
- [ ] **Change trigger:** any simulation <50% manipulation → redesign so the control is the first thing touched; re-test.
- [ ] Fix overload hotspots; re-verify one-idea-per-page on the two merged pages (5, 6) specifically.

**Exit gate M9:** meaningful positive pre/post shift; no page below the 50% manipulation threshold; merged pages cleared of overload flags.

---

## M10 — Camera-ready polish & final package *(early Oct, due Oct 16)*

- [ ] Motion refinement behind the "purposeful motion only" gate; final mobile + a11y + perf passes across all pages (axe in CI for all routes).
- [ ] **Final QA gate:** data-fidelity 100%; story-QA gates 100%; cross-browser matrix (Chrome/Edge/Firefox/Safari + mobile viewport) — precomputed experience works everywhere, WebGPU features degrade gracefully; factual proofread by a subject-matter reviewer; every preprint/estimate disclaimer verified.
- [ ] **Limitations & ethics statement** (in-app + description): illustrative-not-predictive; preprint flags; shapes/endpoints only.
- [ ] **Reproducibility appendix:** a reviewer can regenerate every curve from `PROVENANCE.md` + committed scripts.
- [ ] Learning evidence from M9 summarized honestly in the description.
- [ ] Submit camera-ready per workshop instructions — **Oct 16**.

**Exit gate M10:** camera-ready delivered; hosted URL stable; repo public and reproducible.

---

## Data Anchor Reference

Ground-truth numbers every simulation must reproduce (tolerance ±1.0 pp unless noted). Store each in versioned JSON with its citation. **PP = preprint / non-peer-reviewed — must be flagged in-app.** Page numbers = Rev-2 storyboard.

| Page | Anchor | Source |
|---|---|---|
| 1–2 *(context)* | DeepSeek-R1-Zero AIME'24 **15.6% → 71.0%** pass@1; **86.7%** cons@64 | DeepSeek-R1 2025 (arXiv:2501.12948, Nature) |
| 1–2 | Hero trace + per-token entropy: our own R1 / R1-Distill-1.5B runs (committed scripts) | — (own runs, provenance-logged) |
| 3 | GSM8K **17.9% → 56.9%** CoT (+39.0 pts; 58% w/ calculator; prior SOTA 55%) | Wei et al. 2022 (arXiv:2201.11903) |
| 4 | s1-32B AIME24 **50% → 57%** (budget forcing) — **PP** | Muennighoff et al. 2025 (arXiv:2501.19393) |
| 5 | **>60%** of chains fail after step 1; self-consistency GSM8K **+17.9%** (SVAMP +11.0, AQuA +12.2, ARC-c +3.9) | Yao et al. 2023 (arXiv:2305.10601); Wang et al. 2022 (arXiv:2203.11171) |
| 6 | SWE-bench Lite **15.9% (1) → 56% (250)**, log-linear; SOTA 43%; majority/RM selection plateaus beyond several hundred samples | Brown et al. 2024 (arXiv:2407.21787) |
| 7 | Verifier BoN > majority > random; verifier error bounds realized accuracy (corruption model: ours, labeled illustrative) | Generative Verifiers (arXiv:2408.15240); BoN optimality (arXiv:2503.21878); Cobbe et al. 2021 |
| 8 | MATH best-of-N: **PRM 78.2% vs ORM 72.4%** (majority 69.6%) | Lightman et al. 2023 (arXiv:2305.20050) |
| 9 | Game of 24: CoT **4% → ToT 74%** (b=1→45%, b=5→74%; IO 7.3%, CoT-SC 9.0%) | Yao et al. 2023 |
| 10 | Compute-optimal **>4× vs best-of-N**; TTS beats **14× larger** model (FLOPs-matched) | Snell et al. 2024 (arXiv:2408.03314) |
| 11 | o3: low **75.7%** (~$17–20/task); high (172×) **87.5%** (thousands/task, est. $3K→$30K); o1 ≤ ~32%; human ~$5 — **estimates, blog source** | ARC Prize / OpenAI o3 Dec 2024 |
| 12 | Inverse-U: longer CoT reduces accuracy past a peak; easy tasks cross first — **PP** | Overthinking (arXiv:2412.21187); Inverse Scaling in TTC (arXiv:2507.14417) |
| 13 | Hanoi: moves 2^N−1; accuracy collapses past a wall; thinking effort drops — **PP** | Shojaee et al. 2025 (arXiv:2506.06941) |
| 14 | Hint admission: Claude 3.7 **25%**, R1 **39%**. Misalignment hints: **SOURCE CONFLICT** — 20%/29% vs 41%/19% across planning docs; resolve against the primary paper, log in `PROVENANCE.md` — **PP** | Chen et al./Anthropic 2025 (arXiv:2505.05410) |
| 15 | Verdict flips by scoring mode; River-Crossing impossible N≥6 — **PP (both sides)** | Shojaee 2025 + Lawsen 2025 (arXiv:2506.09250) |

### Standing guardrails (apply throughout)
- **Never invent a number.** If a value isn't in the anchor table or a cited JSON, don't display it.
- **Log provenance & resolve conflicts.** Every number traces to `data/PROVENANCE.md`; doc disagreements defer to the primary paper.
- **Illustrative, not predictive.** In-app copy must say simulations reproduce published *shapes and endpoints*, not predict any specific model.
- **Flag every preprint/estimate** (pages 4, 11, 12, 13, 14, 15) via the citation badge.
- **Fallback everywhere.** Optional live features degrade silently to precomputed mode.
- **Story-QA gates are release invariants** — equal in rank to data fidelity (see top of doc).
- Verify plan-dependent externals against live docs before relying on them (exact Vercel Hobby caps, WebLLM VRAM/throughput tiers were unconfirmed in the source research; **re-verify the live VISxAI CFP** for submission format).
