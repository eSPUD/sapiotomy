# Proposal: *"Watch It Think · Change Its Mind · Watch It Break"*

### An interactive explorable on inference-time scaling

**Target venue:** 9th Workshop on Visualization for AI Explainability (**VISxAI 2026**), IEEE VIS, Boston — camera-ready Oct 16, 2026
**Format:** Blog-style **explorable** (interactive web article), hosted on Vercel
**Source proposals (merged):** [`literature_review/visxai_reasoning_explorable_proposal.md`](../literature_review/visxai_reasoning_explorable_proposal.md) ("Watch a Model Think") + [`planning/InferenceTimeScaling_Explainable.md`](InferenceTimeScaling_Explainable.md) ("The Story of Inference-Time Scaling")
**Grounding corpus:** [`literature_review/inference_time_scaling_review.md`](../literature_review/inference_time_scaling_review.md) (+ plain-language companion)
**Audience:** curious readers with high-school math + probability and *no* assumed ML background
**Author/contact:** evielation@gmail.com · **Draft date:** 2026-07-10

> **What this document is.** A single hybrid proposal that fuses the two prior write-ups. From *"Watch a Model Think"* it takes the hero move — **a real, manipulable reasoning trace** — plus the VISxAI venue and the precompute-only architecture. From *"The Story of Inference-Time Scaling"* it takes the **three-act narrative spine**, the **learning-science scaffolding** (Victor / Case / Mayer / Predict-Observe-Explain), and the **verified per-page quantitative anchors**. Per the lineup notes, the beautiful, low-competition **thinking-budget** interaction becomes the backbone, it **absorbs the verifier "betrayal"** for wow, and the highest-wow **operate-on-a-trace** concept is made feasible via a precomputed *branch bank* (see §4).

---

## 0. TL;DR — the recommendations

| Decision | Recommendation | Why (one line) |
|---|---|---|
| **The one big idea** | A model gets dramatically better by **thinking longer at answer time** — in lawful, measurable, sometimes counter-intuitive ways — **until it doesn't.** | One thesis, three acts: *watch it think → change its mind → watch it break.* |
| **The hero object** | A single **real DeepSeek-R1 `<think>` trace on Game-of-24** the reader can inspect, re-run, and **operate on** (inject "Wait", prune a branch, add a verifier). | Fuses the highest-wow concept (operate on a trace) with the best-looking one (the thinking-budget knob). |
| **The three signature "wow" interactions** | **(1) the thinking-budget knob** (drag → trace grows → accuracy rises then plateaus); **(2) the verifier betrayal** (turn a verifier on → accuracy jumps → *corrupt it* → watch it mislead); **(3) the log-axis straightening + economics dollar-shock.** | Each is a visceral, one-gesture causal loop; competition for all three is essentially nonexistent. |
| **Model / hosting** | **Precompute-only** for the submission. Static-JSON traces + curves generated offline with **DeepSeek-R1** (open, visible `<think>`, central paper in our review) + **R1-Distill-Qwen-1.5B** locally for token entropy. Live "bring-your-own-prompt" is Future Work. | You can't run a real reasoning LLM *on* Vercel (no GPU, 10–60s caps). Precompute = deterministic, instant, free, reviewer-friendly, lowest risk. |
| **Feasibility (40 hrs/wk + Claude Code)** | Ship a **12–13-page MVP by the Aug 3 submission**, then expand to the **full 18-page vision by the Oct 16 camera-ready.** Claude Code does the scaffolding, data pipeline, Monte-Carlo workers, and a11y passes; human time goes to taste, correctness, and the bespoke trace-navigator. | Two-tier scope is the honest reconciliation of an ambitious storybook with a 3.5-week first deadline. See §7. |

---

## 1. The unifying thesis

The two source proposals were pulling in complementary directions:

- **"Watch a Model Think"** is *visceral but narrow* — its power is letting a reader **inspect and manipulate a genuine reasoning trace**, watch the scaling knobs move accuracy, and see the laws **break** (plateau, cliff, backfire). Highest wow; the notes flag its feasibility as the concern.
- **"The Story of Inference-Time Scaling"** is *structured and rigorous* — a clean **three-act history** (2022 discovery → 2023–24 toolbox → 2025 frontier + debate), every page anchored to a **verified published number**, every design choice justified by **learning-science research**. Strong pedagogy; lower on raw spectacle.

**The hybrid keeps the trace as the hero and hangs the three-act story on it.** The reader never leaves a single running example — a real R1 trace on Game-of-24 — and each page adds one lever, one law, or one limit *to that same object*. This is exactly the pattern the best VISxAI explainables (Transformer Explainer, Diffusion Explainer) use: **a concrete manipulable spine carrying a general payload.**

> **Contribution (for the venue):** the first interactive explorable where a reader can **operate the test-time-compute knobs on a live-looking reasoning trace** — think longer, sample wider, search deeper, add and then *sabotage* a verifier — and **watch accuracy respond**, including watching it plateau, cliff, and backfire. Novel *explanation* of a hot topic, not novel method.

---

## 2. Target venue & the gap we fill

**VISxAI 2026** (9th edition, IEEE VIS, Boston) explicitly calls for *"explainables / explorables that explain how AI techniques work using visualization."* Submission is a **live URL** (plus a backup PDF abstract) via PCS → VGTC → VIS 2026 → VISxAI Blog Posts. Key dates (ET): **submission Aug 3, 2026** · reviews Sep 8 · notification Sep 14 · **camera-ready Oct 16**.

Reviewers reward **clarity, genuine interactivity, novelty of explanation, and correctness** — not academic novelty of method. The "Hall of Fame" is transformers, diffusion, k-means, Gaussian processes.

**Gap:** there is **no explorable on inference-time / test-time scaling** — arguably the defining LLM story of 2024–2026. The topic is timely, visually rich (curves, trees, traces), full of counter-intuitive reversals that reward interaction, and grounded in a strong verified corpus. Competition is near-zero (per the lineup notes) and the "operate on a trace" interaction has no precedent at this venue.

Sources: [VISxAI 2026](https://visxai.io/) · [submit page](https://visxai.io/submit) · [IEEE VIS 2026 workshops](https://ieeevis.org/year/2026/info/program/workshops/).

---

## 3. The hero object & the three signature interactions

Everything anchors to **one running example: a real DeepSeek-R1 reasoning trace solving Game-of-24** (make 24 from four numbers with + − × ÷). Chosen because its *solution is literally a search tree*, so one object visualizes sequential thinking, parallel sampling, tree search, and verification. A **difficulty ladder** (GSM8K-easy → MATH → AIME-hard, plus Tower-of-Hanoi for controllable complexity) lets every principle be seen to **hold or break**.

Three interactions carry the "wow" and recur across pages:

1. **The thinking-budget knob** *(the best-looking, lowest-competition interaction — per the notes).* A single slider sets how long the model thinks. Drag it and the **trace visibly grows** (budget-forcing appends "Wait…"), while an accuracy curve **rises and then flattens**. Anchor: s1-32B extrapolates **50% → 57% on AIME24** via budget forcing.

2. **The verifier betrayal** *(the "thinking-harder" selection-economics component, merged in for wow).* Generate N candidate solutions; turn a verifier **on** and watch accuracy jump as it picks the best. Then **corrupt the verifier** (inject error) and watch it **cap out, mis-rank, and actively mislead** — dramatizing that *having* a right answer ≠ *picking* it. Anchors: coverage vs. realized-accuracy divergence (Large Language Monkeys); PRM **78.2%** vs ORM **72.4%** vs majority-vote **69.6%** on MATH (Lightman).

3. **The log-axis straightening + the economics dollar-shock.** Drag samples across four orders of magnitude and flip linear↔log — the messy curve **snaps into a straight line** (log-linear coverage; SWE-bench Lite **15.9% → 56%**). Then the economics dashboard puts accuracy against a **shocking log-scale dollar axis**: o3 on ARC-AGI scored **75.7% at ~$17–20/task** vs **87.5% at 172× the compute** (thousands of dollars/task); a human costs ~$5.

These three are the trailer. The storyboard (§5) threads them through the full arc.

---

## 4. Architecture — precompute-first, with a *branch bank* to make "operate on a trace" feasible

### 4.1 The hard constraint
You **cannot run a reasoning LLM on Vercel** (no GPU; serverless caps ~10s Hobby / ≤300s Pro). Any live model must run **client-side** (WebGPU) or on an **external API behind an Edge proxy**. So the submission is **precompute-only**.

```
        OFFLINE (once, on a GPU box / via API)                     ONLINE (Vercel, static)
  ┌───────────────────────────────────────────────┐         ┌──────────────────────────────┐
  │ DeepSeek-R1 (API)  → full <think> traces        │         │ Next.js app on Vercel        │
  │ + BRANCH BANK      → precomputed continuations  │ ==JSON=> │  • static traces/curves      │
  │ R1-Distill-1.5B    → token logprobs / entropy   │         │  • D3/visx replay + navigate │
  │ ToT/MCTS + BoN     → trees, coverage, verifiers  │         │  • client Monte Carlo (WW)   │
  └───────────────────────────────────────────────┘         │  • ZERO runtime inference    │
                                                              └──────────────────────────────┘
```

### 4.2 The feasibility unlock (addresses the notes' concern directly)
The lineup notes flag *"letting a reader operate on a reasoning trace… feasibility is lower for 40 hours of development time a week."* The fix: **a precomputed branch bank.** Instead of running a model when the reader edits the trace, we **pre-generate the model's continuations from every decision point we expose** — with/without an injected "Wait", with branch X pruned, with a verifier gate, at each budget cap. "Operating on the trace" then becomes **navigating a precomputed continuation tree**: it *feels* live, costs nothing at runtime, and is fully deterministic for reviewers. This converts the highest-wow / lowest-feasibility idea into a bounded, shippable one.

### 4.3 Model roles
| Role | Model | Why |
|---|---|---|
| Core traces + branch bank | **DeepSeek-R1** (via DeepSeek/Together/Fireworks) | Open; explicit `<think>` we can parse into reasoning moves; central paper in our review → coherent & reproducible. |
| Token entropy / uncertainty overlay | **R1-Distill-Qwen-1.5B** local (vLLM/transformers) | Need logprobs to show *where the model is uncertain*; 1.5B is cheap. |
| *(Stretch)* in-browser "try it" | R1-Distill-1.5B via **WebLLM (WebGPU)** | ~1.1 GB 4-bit, cached, fully client-side, no API cost; graceful fallback to the trace bank. |

Live modes stay behind a clearly-labeled "experimental" banner, **never on the critical path**.

---

## 5. The storyboard — three acts, 18 core pages (+2 optional)

Each page = **one concept · one interaction · one data source · one paper.** ★ = a signature "wow" beat. **[MVP]** = in the 12–13-page Aug-3 submission set. Every page follows **Predict-Observe-Explain**: the reader guesses before the data is revealed.

### ACT 1 — Meet the thinking machine *(concrete grounding)*
| # | Page | Interaction | Learn | Source |
|---|---|---|---|---|
| 1 **[MVP]** | **Two Speeds of Thinking → watch it think** | System 1/2 hook ("2+2" vs "17×24"), then a real R1 `<think>` stream plays on the Game-of-24 anchor; press play / scrub | A model's "thinking" is real, inspectable text | Kahneman framing; R1 (2501.12948) |
| 2 **[MVP]** | **Anatomy of a thought** | Same trace, tokens color-coded by move (plan / compute / check / **backtrack "Wait"**); hover + filter; token-entropy overlay | Long CoT = plan–compute–verify–backtrack loops | Demystifying Long CoT (2502.03373) |
| 3 **[MVP]** | **The instant-answer problem → show your work** | Toggle "answer immediately" vs "show your work"; bar leaps **17.9% → 56.9%** GSM8K (PaLM 540B) | Intermediate steps buy accuracy | Wei (2201.11903) |
| 4 | **Not every path is right** | Resample the same problem; chains end green/red (a slip on line 2 dooms the rest) | Stochastic variance exists — and can be exploited | Yao error analysis (2305.10601) |

### ACT 2 — The four levers & the economics of selection
| # | Page | Interaction | Learn | Source |
|---|---|---|---|---|
| 5 ★ **[MVP]** | **The length knob (budget forcing)** | Drag "thinking budget"; the trace grows ("Wait…"); accuracy rises then flattens | Thinking longer helps — with diminishing returns | s1 (2501.19393); Kimi k1.5 (2501.12599) |
| 6 **[MVP]** | **Ask many, then vote (self-consistency)** | Attempts dial 1→40; majority vote climbs **+17.9 pts** GSM8K (client Monte Carlo) | Independent tries + voting raise accuracy | Wang (2203.11171) |
| 7 ★ **[MVP]** | **Coverage vs. selection — the core gap** | Two curves: coverage (pass@k) soars while realized accuracy lags; toggle oracle vs majority | A right answer existing ≠ *picking* it | Large Language Monkeys (2407.21787); Limits of Resampling (2411.17501) |
| 8 ★★ **[MVP]** | **Best-of-N + a verifier — and the betrayal** | Verifier **on** → accuracy jumps; then **corrupt it** → it caps, mis-ranks, backfires | Verifiers unlock BoN, but their errors bound it | Generative Verifiers (2408.15240); BoN optimality (2503.21878) |
| 9 **[MVP]** | **Grading the steps (process vs outcome)** | Toggle ORM (final label) vs PRM (per-step glow); best-of-N on MATH: **PRM 78.2% vs ORM 72.4% vs MV 69.6%** | Dense step signals steer far better | Lightman (2305.20050); Math-Shepherd (2312.08935) |
| 10 **[MVP]** | **Search the tree (ToT / MCTS)** | Interactive reasoning tree on Game-of-24; set branching *b*: **b=1→45%, b=5→74%** vs CoT **4%**; optional AlphaGo sidebar | Structure the tries as a guided search | Tree-of-Thoughts (2305.10601); rStar-Math (2501.04519) |
| 11 ★ | **The scaling-curve lab (log-linear coverage)** | Drag samples across 4 orders of magnitude; flip linear↔log; curve **straightens into a line**; SWE-bench Lite **15.9%→56%** | Each doubling of attempts buys a roughly constant bump; how to read a log axis | Brown (2407.21787) |
| 12 **[MVP]** | **The allocation game (compute-optimal)** | Distribute a fixed budget across easy/med/hard; scored vs the compute-optimal policy | Match method & budget to difficulty — **4× more efficient; beats a 14× larger model** | Snell (2408.03314); Inference Scaling Laws (2408.00724) |

### ACT 3 — Where it breaks *(the counter-intuitive reversals)*
| # | Page | Interaction | Learn | Source |
|---|---|---|---|---|
| 13 ★ | **The cost of thinking (economics dashboard)** | Cost-vs-accuracy scatter on a **shocking log-$ axis**: o3 **75.7% @ ~$17–20** vs **87.5% @ 172×** compute; human ~$5 | More compute costs real, sometimes absurd, money | ARC Prize / o3 (Dec 2024) |
| 14 ★ **[MVP]** | **When more thinking hurts (overthinking)** | Push length past the peak; accuracy **arcs up then down**; easy problems overthink first | Extra thinking can *backfire* (inverse-U) | Overthinking (2412.21187); Inverse Scaling in TTC (2507.14417) |
| 15 ★ **[MVP]** | **The complexity cliff (Tower of Hanoi)** | Add disks; accuracy **collapses** past a wall; thinking effort paradoxically *drops* | Past a complexity wall, thinking fails outright | The Illusion of Thinking (2506.06941) |
| 16 ★ | **Do the thoughts tell the truth? (faithfulness)** | Plant a hint; check whether the trace admits it; a "confession meter" stays low — **Claude 3.7: 25%, R1: 39%** | The stated reasoning may not be the real reasoning | Anthropic (2505.05410) |
| 17 ★ | **You be the judge (Illusion-of-Thinking debate)** | Courtroom: Apple "collapse" vs Lawsen rebuttal (token limits, impossible N≥6 instances); toggle the scoring rule, watch the **verdict flip** | Adjudicate a live scientific debate yourself | Shojaee (2506.06941); Lawsen (2506.09250) |

### CAPSTONE
| # | Page | Interaction | Learn | Source |
|---|---|---|---|---|
| 18 ★★ **[MVP]** | **The grand sandbox / allocation playground** | Every knob at once — length, samples, verifier (+corruption), search depth, difficulty → one live accuracy/cost readout + recommended policy + "auto-tune to compute-optimal"; short pre/post quiz | Synthesis: *when it helps, how to spend, where it stops* | RQ3 synthesis across corpus |

### OPTIONAL / STRETCH
- **19 (opt)** — *Bring your own prompt (live):* R1-Distill-1.5B via WebLLM (WebGPU) or an Edge proxy; gated, with graceful fallback to the branch bank.
- **20 (opt)** — *How this was made / sources:* provenance panel + full arXiv reference list; committed generation scripts.

**Narrative arc:** *inspect a trace (1–4) → work the four levers & the selection economics (5–12) → watch every law break (13–17) → play with all of it (18).* This maps 1-to-1 onto the review's taxonomy and RQ1/RQ2/RQ3 (see Appendix).

---

## 6. Pedagogy, design & the verified anchors

### 6.1 Why each choice (learning-science grounding, from the second proposal)
- **Active reading over passive** (Victor): every page has ≥1 live control; the reader *plays with the assumptions and sees the consequences.*
- **Start concrete, climb, end in a sandbox** (Case): Page 1 is pure play; Page 18 is the combined sandbox; difficulty rises step by step.
- **Predict-Observe-Explain**: most pages ask a prediction *before* revealing data — specifically effective against this domain's wrong intuitions ("bigger is always better", "more thinking is always better").
- **Mayer's multimedia principles**: one idea per page (segmenting), spotlight one number (signaling), strip extraneous elements (coherence), words + visuals (dual-channel).
- **Distillation, not polish** (Distill *Research Debt*): simulations **re-derive** published curves, they don't merely display them.

### 6.2 Design principles reviewers reward
1. **One idea per page** — if the takeaway needs two paragraphs, split it.
2. **Direct manipulation + immediate feedback** — every knob visibly moves a curve.
3. **The running example is always on screen** — orientation is never lost.
4. **Show the real numbers** — curves come from precomputed real runs or clearly-labeled digitized paper figures; **no invented data.**
5. **Honest uncertainty** — the plateau/cliff/backfire pages are the *point*; flag preprints explicitly.
6. **Accessibility** — colorblind-safe palette (never color alone; see the `dataviz` skill), keyboard-navigable controls, `prefers-reduced-motion`, light/dark aware, charts scroll inside their own container on narrow screens.
7. **Cite on every page** — a small "based on: arXiv:XXXX" chip; this is what separates an explainer from a toy.

### 6.3 Visual identity
Modern high-contrast canvas; a **restrained, consistent palette** used identically on every page — one "compute/energy" hue, one "correct/accuracy" hue, one "wrong" hue (Mayer signaling). Motion is **purposeful only** — values animate in response to the reader's action. A persistent top rail shows the three Acts. One shared chart grammar so the reader learns a single visual language.

### 6.4 Verified quantitative anchors (the correctness backbone)
Every simulation is locked to a cited number **before** its UI is built. Store digitized source values in versioned JSON with the citation attached — the single most important guardrail against "invented curves."

| Page | Anchor (as reported) | Source |
|---|---|---|
| 3 | GSM8K: standard **17.9%** → chain-of-thought **56.9%** (PaLM 540B); +cal. 58% > prior SoTA 55% | Wei 2022 (2201.11903) |
| 5 | s1-32B budget forcing extrapolates **50% → 57%** on AIME24 | Muennighoff 2025 (2501.19393) *(preprint)* |
| 6 | Self-consistency **+17.9 pts** GSM8K (also +11.0 SVAMP, +12.2 AQuA, +3.9 ARC-c) | Wang 2022 (2203.11171) |
| 7 | Coverage grows log-linearly; majority/reward selection **plateaus beyond several hundred samples** | Brown 2024 (2407.21787) |
| 9 | MATH best-of-N: **PRM 78.2% vs ORM 72.4% vs MV 69.6%** | Lightman 2023 (2305.20050) |
| 10 | Game-of-24: CoT **4%** → ToT **74%** (b=1 45%, b=5 74%; IO 7.3%, CoT-SC 9.0%) | Yao 2023 (2305.10601) |
| 11 | SWE-bench Lite: **15.9% (1 sample) → 56% (250 samples)** > single-sample SoTA 43% | Brown 2024 (2407.21787) |
| 12 | Compute-optimal **>4×** more efficient than best-of-N; **beats a 14× larger model** (FLOPs-matched) | Snell 2024 (2408.03314) |
| 13 | ARC-AGI: o3 **75.7% @ ~$17–20/task** vs **87.5% @ 172× compute** (≈thousands/task); human ~$5 | ARC Prize / o3 (Dec 2024) *(blog est.)* |
| 15 (R1) | DeepSeek-R1-Zero AIME24 **15.6% → 71.0%** pass@1; **86.7%** with cons@64 | DeepSeek-R1 2025 (2501.12948) |
| 16 | Faithfulness (admits using a hint): **Claude 3.7 25%, R1 39%**; misalignment hints 20% / 29% | Anthropic 2025 (2505.05410) |
| 17 | Hanoi "collapse" vs rebuttal (token-limit / impossible N≥6 instances) | Shojaee 2506.06941 · Lawsen 2506.09250 *(both preprints)* |

Preprints (s1, overthinking/inverse-scaling, both Illusion-of-Thinking sides) are **explicitly flagged in-app** and never the sole basis of a core page.

---

## 7. Feasibility at 40 hrs/week with Claude Code

This is the binding design constraint, so it drives scope directly.

### 7.1 Two-tier scope (the honest reconciliation)
- **By Aug 3 (submission, ~3.5 weeks ≈ 140 human-hours):** a **strong 12–13-page MVP** — pages **1, 2, 3, 5, 7, 8, 9, 10, 12, 14, 15, 18** (marked **[MVP]**). These alone tell the whole story: *inspect a trace → the levers → the verifier betrayal → the breaks → play.* Submit the **live URL** + a backup PDF abstract.
- **By Oct 16 (camera-ready, ~10 weeks):** expand to the **full 18 pages**, add the optional live mode (19), run a formative user test with 5–8 readers, and polish. VISxAI lets the camera-ready improve substantially on the submitted version, so the ambitious storybook lands *after* acceptance risk is retired.

### 7.2 What Claude Code does vs. what the human does
Claude Code is a genuine multiplier here because most of the 18-page build is **repetitive scaffolding over a shared grammar** — exactly what it's fastest at.

| Claude Code carries | Human carries |
|---|---|
| Scaffold Next.js/Vercel app + a shared component library (`ChartFrame`, `KnobSlider`, `TraceNavigator`, `CurveChart`, `TreeView`) from one reference page | Design taste, palette, motion feel, narrative copy |
| Generate the offline data pipeline (R1 API calls, **branch-bank generator**, budget-forcing sweeps, BoN/verifier eval, ToT/MCTS rollouts, logprob/entropy capture) | Curate which traces/examples to ship; verify every anchor against the primary source |
| Write client-side Monte-Carlo **Web Workers** seeded to published shapes | The bespoke *feel* of the trace-navigator & tree interactions |
| Stamp out all 18 per-page scaffolds from the §5 table | Formative user testing; cognitive-load review |
| Encode verified anchors into versioned JSON + a `PROVENANCE.md` map | Final correctness sign-off |
| Accessibility passes (ARIA, keyboard, reduced-motion, colorblind), responsive passes, perf tuning | The three signature interactions' polish |

The **branch bank** (§4.2) is what makes the flagship "operate on a trace" interaction fit the hour budget: Claude Code writes both the offline generator and the navigator UI; there is no runtime inference to engineer, tune, or pay for.

### 7.3 Timeline
| Window | Milestone |
|---|---|
| **Now → Jul 17** | Lock anchor/spine; Next.js-on-Vercel + scrollytelling skeleton; shared component library; run R1 pipeline + branch bank for pages 1–8; write the abstract (needed for PCS). |
| **Jul 18–24** | Build MVP pages 1–3, 5, 7–10 (trace, anatomy, CoT, length knob, coverage-gap, **verifier betrayal**, PRM/ORM, tree). |
| **Jul 25–31** | Build MVP pages 12, 14, 15 + capstone 18; accessibility & mobile pass. |
| **Aug 1–2** | Polish, cross-browser/perf, colorblind check, copy-edit, provenance page. |
| **Aug 3** | **Submit** live URL + PDF abstract via PCS. |
| **Aug 4 → Oct 16** | Expand to full 18; add pages 4, 6, 11, 13, 16, 17; optional live mode; user testing; camera-ready polish. |

**Priority order if time slips:** the twelve [MVP] pages tell the whole story; live mode (19), the methods page (20), and Act-3 pages 13/16/17 are the first cuts.

---

## 8. Correctness & reproducibility (non-negotiable for a research venue)
- Generate all traces/curves with **committed scripts**; publish them (page 20) so a reviewer can regenerate.
- Where a paper's headline curve is reused, **reproduce it on our own runs** where feasible, else clearly label *"digitized from Fig. X of arXiv:…"*.
- Keep a `PROVENANCE.md` mapping every chart → data source → paper, mirroring the review's zero-hallucination stance.
- **Simulations are illustrative, not predictive** — they reproduce the *shape and endpoints* of real results; in-app copy says so.

---

## 9. Risks & mitigations
| Risk | Mitigation |
|---|---|
| **3.5-week first deadline** | Two-tier scope (§7); the twelve [MVP] pages are the deliverable, the rest is camera-ready. |
| **"Operate on a trace" is too ambitious** *(the notes' concern)* | **Branch bank** (§4.2): navigating a precomputed continuation tree, zero runtime inference. |
| Running a model on Vercel (won't work) | Precomputed JSON backbone; any live model is external/optional and gated. |
| Reviewer doubts about correctness | Committed generation scripts + provenance map + digitized-figure labeling + per-page citation chips. |
| Preprint volatility (s1, overthinking, Illusion debate) | Flagged in-app; never the sole basis of a core page; numbers isolated so they can be updated. |
| WebLLM weight size / WebGPU support | Live page is opt-in, capability-gated, falls back to the branch bank. |
| Over-animation hurting clarity/accessibility | One idea per page; `prefers-reduced-motion`; keyboard controls; a "purposeful motion only" review gate. |

---

## 10. Open decisions to confirm
1. **Deadline commitment:** target the Aug 3 VISxAI submission with the 12–13-page MVP, expanding to 18 by Oct 16? *(recommended)* — or treat this as a non-deadline educational project on the relaxed roadmap?
2. **Spine:** approve **Game-of-24 as the hero trace** (+ Hanoi for the cliff, math ladder for difficulty)? Alternative: a pure math-word-problem spine.
3. **Trace source:** **DeepSeek-R1** as the spine (recommended — open + in our review). Add a **Claude extended-thinking** "frontier comparison" trace, yes/no?
4. **Live mode appetite:** ship precompute-only for the submission (recommended) and add WebLLM live mode only for camera-ready?
5. **Budget:** any offline API/GPU budget for trace + branch-bank generation? (R1 via Together/Fireworks is inexpensive for a few hundred traces; the 1.5B distill runs on a modest GPU or CPU.)

---

## 11. Appendix — page → review mapping
- **Taxonomy (review §2)** → pages 5 (SEQ), 6–8 (PAR + selection), 10 (SRCH), 9 (VER), 12 (OPT).
- **RQ1 / 2024 (review §3)** → 6–9, 12 (sample-and-select, verifier bottleneck, compute-optimal).
- **RQ2 / 2025–26 (review §4)** → 1–2, 5 (long-CoT reasoners), 10 (search→training data), 11 (scaling laws).
- **RQ3 / limits (review §5)** → 13 (cost), 14 (overthinking/inverse), 15 (cliff), 16 (faithfulness), 17 (RL/illusion debate), 18 (allocation synthesis).

---

### Sources
- [VISxAI 2026 — 9th Workshop on Visualization for AI Explainability](https://visxai.io/) · [Submit](https://visxai.io/submit) · [IEEE VIS 2026 workshops](https://ieeevis.org/year/2026/info/program/workshops/)
- Pedagogy: Victor *Explorable Explanations* (2011); Case *How I Make Explorable Explanations*; Olah & Carter *Research Debt* (Distill 2017); Mayer *Cognitive Theory of Multimedia Learning* (2014).
- All paper citations refer to the verified corpus in [`inference_time_scaling_review.md`](../literature_review/inference_time_scaling_review.md) §6.
