# Proposal: *"Watch a Model Think"* — An Interactive Explorable on Inference-Time Scaling

**Target venue:** 9th Workshop on Visualization for AI Explainability (**VISxAI 2026**), IEEE VIS, Boston, October 2026
**Format:** Blog-style **explorable** (interactive web article), hosted on our Vercel blog
**Source material:** our systematic literature review [`inference_time_scaling_review.md`](inference_time_scaling_review.md) + plain-language companion [`inference_time_scaling_review_plain_language.md`](inference_time_scaling_review_plain_language.md)
**Audience:** readers with high-school math/science and some AI familiarity
**Author/contact:** evielation@gmail.com
**Draft date:** 2026-07-10

> **Decisions locked (2026-07-10).** (1) **Anchor = both spines side-by-side** — a puzzle spine (Game of 24 / Hanoi) *and* a math spine (GSM8K→AIME), switchable for the whole article. (2) **Precompute-only MVP** — no live model in this submission; live "bring-your-own-prompt" moves to Future Work. (3) **Hold at proposal** — do not start building yet. Sections below are updated to reflect these; see §2, §3, §7 for the dual-spine scope/mitigation and revised plan.

---

## 0. TL;DR — the recommendations

| Decision | Recommendation | Why (one line) |
|---|---|---|
| **One prompt vs. reasoning in general** | **LOCKED: hybrid with *two* switchable spines** — a **puzzle spine** (Game of 24 / Hanoi) *and* a **math spine** (GSM8K→AIME). Every page anchors in a manipulable running example; a global spine-switcher + difficulty-switcher let principles be seen to hold *or break*. | Proven VISxAI pattern (Transformer/Diffusion Explainer). Two spines add breadth (and ~1.5× data/build work — mitigation in §2/§7). |
| **What model, hostable on Vercel** | **LOCKED: precompute-only.** Static-JSON reasoning traces generated offline with **DeepSeek-R1** (open, emits visible `<think>` traces, *central paper in our review* → citable/reproducible) + **DeepSeek-R1-Distill-Qwen-1.5B** locally for token probabilities/entropy. **No live model in this submission** (moved to Future Work, §3.4). | You cannot run a real LLM *on* Vercel (no GPU, 10–60s limits). Precompute = fast, free at view-time, deterministic, reviewer-friendly, lowest deadline risk. |
| **How many pages / what's on them** | **15 core pages + 2 optional** (within the ≤20 limit). Storyboard in §4. | One idea per page, each mapped to a specific paper and a specific interaction. |
| **How to build reliably for VISxAI** | **Next.js on Vercel + D3/visx + Scrollama + KaTeX**, scrollytelling, precomputed data, per-page citations, colorblind-safe palette, a "How this was made" methods page. | Matches the workshop's "explainables/explorables" bar and IEEE VIS Hall-of-Fame precedent. |
| **Timeline** | **Deadline is Aug 3, 2026 (~3.5 weeks).** Ship a **strong 10–12-page MVP** by the deadline; the ≤20 ceiling is a stretch goal. | See §7. This is the single biggest constraint. |

---

## 1. The target: what VISxAI actually wants

Grounding the plan in the real 2026 call:

- **Edition & venue:** 9th VISxAI, at IEEE VIS 2026 in Boston, **October 16, 2026** (camera-ready date).
- **Accepted formats:** *"blog-style posts and jupyter-like notebooks,"* plus traditional position papers. The workshop explicitly *"initiates a call for 'explainables' / 'explorables' that explain how AI techniques work using visualization."* Our interactive web article is squarely in the primary category.
- **Key dates (ET):** CfP May 5, 2026 · **Submission deadline Aug 3, 2026** · Reviews Sept 8 · Notification Sept 14 · Camera-ready Oct 16.
- **How you submit:** via the **PCS** system → Society **VGTC** → Conference **VIS 2026** → Track **"VIS 2026 VISxAI Workshop Blog Posts."** A submission needs a **Title, all author names, and an Abstract**; then **either a link to the online version or an uploaded document (PDF/source) — at least one is required, both allowed.** So we submit **the live URL to our hosted explorable** (plus a short PDF abstract as backup).
- **Bar for quality:** the "Hall of Fame" is interactive explanations of ML concepts (transformers, diffusion, k-means, Gaussian processes). Reviewers reward **clarity, genuine interactivity, novelty, and correctness** — not academic novelty of *method*, but novelty and quality of *explanation*.

**Implication for us:** our contribution is *pedagogical* — the first interactive explorable that lets a reader **manipulate the test-time-compute knobs themselves** (think longer, sample wider, search deeper, verify) and *watch accuracy respond* — including watching it plateau, cliff, and backfire. That framing is novel for this venue and directly teaches our review's three research questions.

Sources: [VISxAI 2026 home](https://visxai.io/), [VISxAI submit page](https://visxai.io/submit), [IEEE VIS 2026 workshops](https://ieeevis.org/year/2026/info/program/workshops/).

---

## 2. Decision 1 — "one prompt" vs. "reasoning in general"  *(LOCKED: hybrid, two switchable spines)*

**Decision: a hybrid — *"a running example as the spine, the general law as the payload"* — with two spines the reader can switch between: a puzzle spine and a math spine.**

- **Spine (concrete):** every page opens on **one running example** the reader can manipulate. A single, vivid task keeps orientation and lets us reuse the same visual objects (tokens, samples, trees) page to page.
- **Payload (general):** each page's *lesson* is the general finding from the literature (e.g., "coverage grows log-linearly with samples"), stated as a takeaway and backed by a real chart from a real paper.
- **Bridge (does it generalize?):** a **task-switcher** with three preset difficulties (easy → hard) lets the reader confirm a principle holds — and, crucially, watch it **break** (e.g., the complexity cliff appears only on the hardest task). This directly dramatizes RQ3 ("*when* does compute help / *where* does it saturate").

This resolves the tension: pure "one prompt" risks looking like an anecdote; pure "in general" is abstract and un-manipulable. The hybrid is exactly what the best VISxAI explainables do.

### Recommended anchor tasks (chosen to match real papers → maximizes correctness & citability)
1. **Primary spine — Game of 24** (make 24 from four numbers using +−×÷). The canonical Tree-of-Thoughts demo. Its solution *is* a search tree, so it visualizes sequential thinking, parallel sampling, search, and verification all on one object. HS-accessible.
2. **Difficulty ladder — a math-word-problem set** binned easy (GSM8K-style) → hard (AIME-style). Powers the compute-optimal, plateau, and overthinking pages.
3. **Controllable complexity — Tower of Hanoi (N disks)**, mirroring *The Illusion of Thinking*'s exact methodology, so the "cliff" page reproduces a published result rather than inventing one.

---

## 3. Decision 2 — model choice & Vercel hosting

### 3.1 The hard constraint
You **cannot run a real reasoning LLM *on* Vercel.** Vercel has **no GPU**, and serverless functions cap at **~10s (Hobby) / up to 60–300s (Pro)** — far too short for multi-thousand-token reasoning. Any "live model" must run **elsewhere** (a hosted inference API you call from a Vercel Edge Function) or **client-side** (WebGPU in the browser).

### 3.2 Recommended architecture — **precompute-first**

```
        OFFLINE (once, on your machine / a GPU box)                     ONLINE (Vercel, static)
  ┌──────────────────────────────────────────────┐            ┌──────────────────────────────┐
  │ DeepSeek-R1 (API)   → full <think> traces     │            │ Next.js app on Vercel        │
  │ R1-Distill-1.5B     → token logprobs/entropy  │  ==JSON==> │  • static trace files (/data)│
  │ ToT/MCTS script     → search-tree rollouts    │            │  • D3/visx replays them      │
  │ BoN + verifier eval → coverage & score curves │            │  • zero inference at runtime │
  └──────────────────────────────────────────────┘            └──────────────────────────────┘
```

**Why precompute is the right backbone for a *submission*:** deterministic (reviewers see exactly what we describe), instant (no latency), free at view-time (no per-view API cost), robust (no key leakage, no rate limits, works offline), and **reproducible** (we ship the generation scripts — reviewers love this).

### 3.3 Which model(s)

| Role | Model | Why |
|---|---|---|
| **Core traces (quality)** | **DeepSeek-R1** (or R1-0528) via API (DeepSeek / Together / Fireworks) | Open weights; emits explicit `<think>…</think>` we can parse into reasoning moves; **it is a central paper in our review** → citing our own visualization of it is coherent and reproducible. |
| **Token probabilities / entropy / logits** | **DeepSeek-R1-Distill-Qwen-1.5B** run locally (transformers.js or vLLM) | To visualize *where the model is uncertain* you need logits/logprobs. A small open model you run yourself gives full access; 1.5B is cheap to run. |
| **Optional in-browser "live" toy** | **DeepSeek-R1-Distill-Qwen-1.5B** via **WebLLM (WebGPU)** | ~1.1 GB 4-bit download, cached; runs fully client-side, no server, no API cost; emits visible reasoning. Good for a gated "try it yourself" page. |
| **Optional live server route** | R1-distill-70B on **Groq** (very fast streaming) or full **R1** on Together/Fireworks, proxied by a Vercel **Edge Function** that streams tokens and hides the key | For a "bring-your-own-prompt" experience with frontier-ish quality. Cost/latency/repro caveats → keep optional and clearly labeled. |

**Recommendation:** ship the whole core experience on **precomputed R1 traces + local-distill logit data**. Treat any live mode as a **stretch feature** behind a clear "experimental / live model" banner — never on the critical path to a working submission.

> Note on Claude: Claude (Sonnet/Opus) with extended thinking is an excellent *alternative* trace source and easy to call from a Vercel route, but its thinking traces are summarized/less raw than R1's and the weights aren't open — so for a *reproducible, weight-open* explorable, **R1 is the better spine**. We can include a Claude trace as a "frontier comparison" if useful.

---

## 4. Decision 3 — page-by-page storyboard (15 core + 2 optional)

Each page = **one concept · one interaction · one data source · one paper.** Numbered as the reader scrolls. "Viz" = the main visual; "Do" = the reader's interaction; "Learn" = the takeaway; "Source" = grounding paper(s) from the review.

| # | Page (concept) | Viz | Do (interaction) | Learn | Source |
|---|---|---|---|---|---|
| 1 | **Hook: "Watch a model think"** | Live-style token stream of R1's `<think>` trace on the Game-of-24 anchor | Press play / scrub | A model's "thinking" is real text we can inspect | R1 (2501.12948) |
| 2 | **Anatomy of a reasoning trace** | Token timeline color-coded by *reasoning move* (plan / compute / check / **backtrack "Wait"**) | Hover tokens; filter by move | Long CoT = plan-compute-verify-backtrack loops | R1; Demystifying Long CoT (2502.03373) |
| 3 | **The length knob (sequential scaling)** | Accuracy-vs-thinking-tokens curve that rises then **flattens** | Drag a "thinking budget" slider (budget-forcing) | Thinking longer helps — with diminishing returns | s1 (2501.19393); Kimi k1.5 (2501.12599) |
| 4 | **Try many, then vote (parallel)** | Grid of N sampled solutions + a vote tally | Increase N; watch majority vote | Independent tries + voting raises accuracy… | self-consistency (context); Are More LLM Calls (2403.02419) |
| 5 | **Coverage vs. selection — the core gap** | Two rising curves: **coverage (pass@k)** vs. **realized accuracy**, diverging | Toggle "oracle verifier" vs "majority vote" | Having a right answer ≠ *picking* it; selection is the bottleneck | Large Language Monkeys (2407.21787); Limits of Resampling (2411.17501) |
| 6 | **Best-of-N + a verifier** | Same N samples, now with per-sample reward-model scores; re-rank | Turn the verifier on; corrupt it (add error) | Verifiers unlock BoN — but their errors cap it | Generative Verifiers (2408.15240); Best-of-N optimality (2503.21878) |
| 7 | **Search the tree (MCTS / ToT)** | Interactive reasoning tree; value-guided expansion & pruning | Step the search; expand/collapse nodes | Structure the tries as a guided search | Tree-of-Thoughts (context); rStar / rStar-Math (2408.06195, 2501.04519) |
| 8 | **Process vs. outcome reward** | Same tree; toggle **dense per-step** vs **sparse final-only** reward glow | Flip PRM↔ORM; see search redirect | Dense step signals steer search far better | Math-Shepherd (2312.08935); Rewarding Progress (2410.08146) |
| 9 | **Depth vs. width (the tradeoff)** | A fixed compute budget split between "think longer" and "sample more," with an accuracy heat-surface | Drag the split; find the sweet spot | Depth & width are complementary, not rivals | ParaThinker (2509.04475); Snell (2408.03314) |
| 10 | **Compute-optimal allocation** | Difficulty slider vs. best-strategy region map; a "beats a 14× bigger model" marker | Slide difficulty; watch the optimal mode change | Match the *method & budget* to the *difficulty* | Snell et al. (2408.03314); Inference Scaling Laws (2408.00724) |
| 11 | **Diminishing returns (the plateau)** | Accuracy vs. **log** compute, curve bending flat | Pour in compute; watch marginal gain shrink | More compute → ever-smaller gains | Scaling over Scaling (2505.20522) |
| 12 | **When more thinking *hurts*** | Non-monotonic curve: accuracy rises, peaks, then **drops** | Push length past the peak on a "distractor" task | Overthinking wastes; extra thinking can backfire | Overthinking (2412.21187); Inverse Scaling in TTC (2507.14417) |
| 13 | **The complexity cliff** | Tower-of-Hanoi complexity dial; accuracy **collapses** past a threshold; thinking effort paradoxically *drops* | Add disks; watch collapse + effort-give-up | Past a complexity wall, thinking fails outright | The Illusion of Thinking (2506.06941) |
| 14 | **Does thinking add ability — or reshuffle it?** | Base-model pass@k vs. RL-model accuracy, converging at large k | Increase k; watch the gap close | Open debate: RL may re-weight, not create, reasoning | Does RL Really Incentivize… (2504.13837) |
| 15 | **The allocation playground (capstone)** | Pick task+difficulty; set knobs (length, N, search depth, verifier); read predicted accuracy vs. compute + a recommended policy | Free play; hit "compute-optimal" to auto-tune | Synthesis: *when it helps, how to spend, where it stops* | RQ3 synthesis across corpus |
| 16 *(opt.)* | **Bring your own prompt (live)** | Real-time R1 trace on the reader's prompt | Type a prompt (gated: WebLLM or Edge proxy) | See it on your own question | live model |
| 17 *(opt.)* | **How this was made / sources** | Reproducibility panel + full reference list linking arXiv | Click through to papers & code | Trust & reproducibility | whole review |

**Narrative arc:** *inspect a trace (1–2) → the four levers (3–8) → how to combine them (9–10) → where they stop (11–14) → play with all of it (15).* This maps 1-to-1 onto the review: pages 3–8 ≈ the **taxonomy** and **RQ1**; pages 9–10 ≈ **RQ2** (compute-optimal, hybrid); pages 11–14 ≈ **RQ3** (limits/saturation); page 15 is the RQ3 synthesis made playable.

---

## 5. How to build it reliably (for a VISxAI-grade result)

### 5.1 Tech stack (Vercel-native)
- **Framework:** **Next.js (App Router) on Vercel** — first-class Vercel support, static export for the data-driven pages.
- **Visualization:** **D3** (or **visx** for React-friendly D3) for bespoke charts (curves, trees, heat-surfaces); **Framer Motion** for transitions.
- **Scrollytelling:** **Scrollama** (IntersectionObserver) or a stepper — one idea per viewport, text and viz side-by-side.
- **Math:** **KaTeX** for pass@k, log-linear fits, etc.
- **Data:** precomputed **static JSON** in `/public/data`, one file per page; no runtime inference. (Optional live route = a single Vercel **Edge Function** streaming from a hosted model.)
- **Perf:** lazy-load per-page data; keep the whole article under a few MB excluding any optional WebLLM weights (which load only on the opt-in live page).

### 5.2 Design principles (what reviewers reward)
1. **One idea per page.** If a page needs two paragraphs to state its takeaway, split it.
2. **Direct manipulation + immediate feedback.** Every knob visibly moves a curve.
3. **The running example is always on screen** — orientation never lost.
4. **Show the real numbers.** Curves come from precomputed real runs / digitized paper figures, labeled as such; no invented data.
5. **Honest uncertainty.** The plateau/cliff/backfire pages are the *point*, not hidden. Flag the two ⚠ 2026 papers as recent/less-verified.
6. **Accessibility:** colorblind-safe categorical palette (see the `dataviz` skill), keyboard-navigable controls, `prefers-reduced-motion` respected, light/dark aware, responsive (charts scroll inside their own container on narrow screens).
7. **Cite on every page.** A small "based on: arXiv:XXXX" chip linking the source paper — this is what separates an explainer from a toy.

### 5.3 Correctness & reproducibility (non-negotiable for a research venue)
- Generate all traces/curves with **committed scripts**; publish them (page 17) so a reviewer can regenerate.
- Where we reuse a paper's headline curve (e.g., coverage vs. k), **reproduce it on our own runs** where feasible, or clearly mark it as *"digitized from Fig. X of arXiv:…"*.
- Keep a `PROVENANCE.md` mapping every chart → data source → paper, mirroring the review's zero-hallucination stance.

---

## 6. Data pipeline (offline, one-time)

1. **Traces:** run **DeepSeek-R1** on the three anchor tasks; save raw `<think>` + answer; parse into "reasoning moves" with a light rule/LLM tagger (for pages 1–2, 7).
2. **Length curves (page 3):** re-run with budget-forcing at increasing token caps; record accuracy per cap.
3. **Parallel/coverage (pages 4–6):** sample N∈{1…256}; compute pass@k (coverage), majority-vote accuracy, and verifier-selected accuracy (train/borrow a small PRM or use R1-distill as a grader).
4. **Search (pages 7–8):** run a ToT/MCTS script on Game-of-24; log the tree, node values, PRM vs ORM scores.
5. **Compute-optimal / plateau / cliff (10–13):** sweep difficulty and budget; record accuracy surfaces; for the cliff, run Hanoi at increasing N per *Illusion of Thinking*.
6. **Uncertainty overlays:** from local **R1-Distill-1.5B**, capture per-token logprobs/entropy for pages 1–2.
7. Export each as compact JSON keyed to its page.

---

## 7. Timeline to Aug 3, 2026 (~3.5 weeks) — the binding constraint

| Window | Milestone |
|---|---|
| **Week 1 (now → Jul 17)** | Lock anchor tasks; stand up Next.js-on-Vercel skeleton + scrollytelling shell; run the R1 data pipeline for pages 1–6; write the abstract (needed for PCS). |
| **Week 2 (Jul 18–24)** | Build pages 1–8 (trace, length knob, coverage-vs-selection, BoN+verifier, search tree, PRM/ORM). These are the pedagogical core. |
| **Week 3 (Jul 25–31)** | Build pages 9–13 (depth/width, compute-optimal, plateau, backfire, cliff) + capstone playground (15). Accessibility & mobile pass. |
| **Aug 1–2** | Page 14, methods/sources page (17), polish, cross-browser/perf, colorblind check, copy-edit. |
| **Aug 3** | **Submit** the live URL + backup PDF abstract via PCS (VGTC → VIS 2026 → VISxAI Blog Posts). |

**Scope guidance:** a **tight 12-page MVP done well beats 20 pages half-built.** Priority order if time runs short: pages **1, 2, 3, 5, 6, 7, 10, 13, 15** (these alone tell the whole story). Live mode (16) and page 14 are the first cuts.

---

## 8. Open decisions we recommend you confirm

1. **Anchor task:** approve **Game of 24** as the spine (+ Hanoi for the cliff). Alternative: a pure math-word-problem spine if you prefer no puzzles.
2. **Live model appetite:** ship **precompute-only** for the deadline (recommended), or commit engineering time to the optional live page (WebLLM vs. Edge proxy)?
3. **Trace source:** **DeepSeek-R1** as spine (recommended, open + in our review). Add a **Claude extended-thinking** comparison trace, yes/no?
4. **Budget:** any offline API/GPU budget for trace generation? (R1 via Together/Fireworks is inexpensive for a few hundred traces; a local 1.5B needs only a modest GPU or even CPU.)
5. **Scope target:** commit to the **12-page MVP** as the deadline deliverable, with pages 14/16/17 as stretch?

---

## 9. Risks & mitigations

| Risk | Mitigation |
|---|---|
| **3.5-week deadline** | MVP-first scoping (§7); precompute avoids all live-infra risk. |
| Running a model on Vercel (won't work) | Precomputed JSON backbone; any live model is external/optional. |
| Reviewer doubts about correctness | Committed generation scripts + provenance map + digitized-figure labeling. |
| WebLLM weight size / WebGPU support | Live page is opt-in, gated behind a capability check with graceful fallback. |
| Two 2026 source papers unverified (⚠ in review) | Don't build a core page solely on them; use only as supporting citations. |
| Over-animation hurting clarity/accessibility | One idea per page; `prefers-reduced-motion`; keyboard controls. |

---

## 10. Appendix — page → review mapping

- **Taxonomy (review §2)** → pages 3 (SEQ), 4–6 (PAR), 7 (SRCH), 8 (VER), 10 (OPT).
- **RQ1 / 2024 (review §3)** → pages 4–6, 8, 10 (sample-and-select, verifier bottleneck, compute-optimal).
- **RQ2 / 2025–26 (review §4)** → pages 2–3 (long-CoT reasoners), 7–8 (search→training-data, generative verifiers), 9 (native parallelism).
- **RQ3 / limits (review §5)** → pages 11 (plateau), 12 (overthinking/inverse), 13 (cliff), 14 (RL-reshuffle debate), 15 (allocation synthesis).

---

### Sources
- [VISxAI 2026 — 9th Workshop on Visualization for AI Explainability](https://visxai.io/)
- [VISxAI — Submit page](https://visxai.io/submit)
- [IEEE VIS 2026 — Accepted Workshops](https://ieeevis.org/year/2026/info/program/workshops/)

*All paper citations above refer to the verified corpus in [`inference_time_scaling_review.md`](inference_time_scaling_review.md) §6.*
