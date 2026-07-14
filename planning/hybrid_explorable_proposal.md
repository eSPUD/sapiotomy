# Proposal: *"Watch It Think · Change Its Mind · Watch It Break"*

### An interactive explorable on inference-time scaling

**Target venue:** 9th Workshop on Visualization for AI Explainability (**VISxAI 2026**), IEEE VIS, Boston — camera-ready Oct 16, 2026
**Format:** Blog-style **explorable** (interactive web article), hosted on Vercel
**Source proposals (merged):** [`literature_review/visxai_reasoning_explorable_proposal.md`](../literature_review/visxai_reasoning_explorable_proposal.md) ("Watch a Model Think") + [`planning/InferenceTimeScaling_Explainable.md`](InferenceTimeScaling_Explainable.md) ("The Story of Inference-Time Scaling")
**Grounding corpus:** [`literature_review/inference_time_scaling_review.md`](../literature_review/inference_time_scaling_review.md) (+ plain-language companion)
**Audience:** curious readers with high-school math + probability and *no* assumed ML background
**Author/contact:** evielation@gmail.com · **Draft:** 2026-07-10 · **Rev 2:** 2026-07-12 · **Rev 3:** 2026-07-13

> **What this document is.** A single hybrid proposal fusing the two prior write-ups. From *"Watch a Model Think"*: the hero move — **a real, manipulable reasoning trace** — plus the VISxAI venue and the precompute-only architecture. From *"The Story of Inference-Time Scaling"*: the **three-act narrative spine**, the **learning-science scaffolding** (Victor / Case / Mayer / Predict-Observe-Explain), and the **verified per-page quantitative anchors**. Per the lineup notes, the beautiful, low-competition **thinking-budget** interaction is the backbone, it **absorbs the verifier "betrayal"** for wow, and the highest-wow **operate-on-a-trace** concept is made feasible via a precomputed *branch bank* (§4).

> **Rev 2 (2026-07-12) — restructured per the story-quality review** ([`hybrid_explorable_story_review.md`](hybrid_explorable_story_review.md)). Changes: **(1)** the MVP causal chain is repaired — variance + voting are merged into an [MVP] page so coverage/verifier pages have their premise; **(2)** all **three** signature wows now ship in the MVP (economics dollar-shock promoted; log-straightening merged with the coverage gap); **(3)** the "single running example" claim is replaced by an honest **home-base + telescope-move** design; **(4)** Act 2 is reframed as "**You** change its mind" with the four levers explicitly counted; **(5)** the 2025→2022 time-jump gets a hinge and the capstone becomes a **bookend** that answers the opening stake; **(6)** the split coverage thread is reunited and Act 2's beats are tonally varied; **(7)** the opening is active and the stake is seeded on page 1. Net: **16 core pages (+2 optional), 14-page MVP** whose build effort ≈ the old 12–13 (two pages are merges of four; the econ page is the cheapest build in the deck).

> **Rev 3 (2026-07-13) — currency pass** ([`hybrid_explorable_currency_review.md`](hybrid_explorable_currency_review.md)). The topic moves fast, so the deck now separates the **durable law** (the shape of the compute/accuracy trade — timeless) from the **dated snapshot** (this model, this price, this month — decays ~10×/yr). Changes: **(1)** the page-1 stake and page-11 payoff no longer say "thousands of dollars a task" (a Dec-2024 o3 fact, now false) — they anchor on the *shape* (the last accuracy points cost far more than the first); **(2)** page 11 re-anchors to the **current** frontier benchmark **ARC-AGI-2 (2026)** with **o3/2024 kept as an explicit historical layer** — the bill *relocated to a harder test*, a sharper story than a static price shock; **(3)** every model/price/capability claim gets an **"as of" date + benchmark stamp**, reusing the page-3 time-telescope treatment; **(4)** accuracy fixes — the page-15 "Lawsen rebuttal" is re-anchored on the real synthesis (Lawsen's viral paper was self-described as a joke), page-13's cliff is framed as *partly artifact, partly real*, page-10's "beats a 14× model" is softened to a dated finding; **(5)** a **currency gate** joins the release invariants. Net: the *"Watch a Model Think"* explainable is unchanged — spine, hero trace, four levers, three wows, precompute architecture all intact; only numbers, stamps, and two hooks' phrasing move.

---

## 0. TL;DR — the recommendations

| Decision | Recommendation | Why (one line) |
|---|---|---|
| **The one big idea** | A model gets dramatically better by **thinking longer at answer time** — in lawful, measurable, sometimes counter-intuitive ways — **until it doesn't.** | One thesis, three acts that ARE the title: *watch it think → you change its mind → watch it break.* |
| **The stake (page 1)** | **"Thinking time is now a product.** Frontier systems bill you for it — by the token, by the "effort level," and the last few points of accuracy can cost far more than the first many. Is machine thinking worth buying, and can you trust what you're paying for?" | Seeds why the reader should care; anchored on the durable *shape* (not a decaying price); paid off by the economics page (11), faithfulness (14), and answered in the bookend (16). |
| **The hero object** | A **home-base DeepSeek-R1 `<think>` trace on Game-of-24** the reader inspects, re-runs, and **operates on** (inject "Wait", prune a branch, add a verifier) — with a deliberate, visually-marked **telescope move** out to real benchmark data and back. | Fuses the highest-wow concept (operate on a trace) with the best-looking one (the thinking-budget knob), without over-promising "one example, never left." |
| **The three signature "wow" interactions** | **(1) the thinking-budget knob**; **(2) the verifier betrayal**; **(3) the log-axis straightening + economics dollar-shock**. **All three ship in the MVP.** | Each is a visceral, one-gesture causal loop; competition for all three is essentially nonexistent. |
| **Model / hosting** | **Precompute-only** for the submission. Static-JSON traces + curves generated offline with **DeepSeek-R1** (open, visible `<think>`, central paper in our review) + **R1-Distill-Qwen-1.5B** locally for token entropy. Live "bring-your-own-prompt" is Future Work. | You can't run a real reasoning LLM *on* Vercel (no GPU, 10–60s caps). Precompute = deterministic, instant, free, reviewer-friendly, lowest risk. |
| **Feasibility (40 hrs/wk + Claude Code)** | Ship the **14-page MVP by the Aug 3 submission** (effort ≈ the old 12–13 — see Rev-2 note), then the **full 16-page vision + extras by the Oct 16 camera-ready.** Claude Code does scaffolding, data pipeline, Monte-Carlo workers, a11y passes; human time goes to taste, correctness, and the trace-navigator feel. | Two-tier scope reconciles an ambitious storybook with a 3-week first deadline. See §7. |

---

## 1. The unifying thesis

The two source proposals were pulling in complementary directions:

- **"Watch a Model Think"** is *visceral but narrow* — a reader **inspects and manipulates a genuine reasoning trace**, watches the scaling knobs move accuracy, and sees the laws **break** (plateau, cliff, backfire). Highest wow; the notes flag feasibility as the concern.
- **"The Story of Inference-Time Scaling"** is *structured and rigorous* — a clean **three-act history** (2022 discovery → 2023–24 toolbox → 2025 frontier + debate), every page anchored to a **verified published number**, every design choice justified by **learning-science research**. Strong pedagogy; lower on raw spectacle.

**The hybrid keeps the trace as the hero and hangs the three-act story on it.** The reader works from a **home base** — a real R1 trace on Game-of-24 — and each page adds one lever, one law, or one limit. When a lesson's *evidence* lives on another benchmark (GSM8K, SWE-bench, ARC-AGI), the article makes a deliberate, visually-marked **telescope move**: *zoom out* to the published field data, then *zoom back* to the home-base puzzle to feel the same principle by hand. One consistent visual language + one home base ≈ the orientation benefit of a single running example, without misrepresenting where the numbers come from. This is the pattern the best VISxAI explainables (Transformer Explainer, Diffusion Explainer) use: **a concrete manipulable spine carrying a general payload.**

> **Contribution (for the venue):** the first interactive explorable where a reader can **operate the test-time-compute knobs on a live-looking reasoning trace** — think longer, sample wider, verify (then *sabotage* the verifier), search deeper — and **watch accuracy respond**, including watching it plateau, cliff, and backfire. Novel *explanation* of a hot topic, not novel method.

> **What makes it an explanation, not a report — the time-invariance commitment.** Every page teaches a property of *how* inference-time reasoning works — think longer, sample wider, verify, search, and where each one breaks — that holds **regardless of which model, benchmark, or year supplies the numbers.** Published data makes each mechanism concrete and credible; the data is never the lesson. **Swap any 2026 snapshot for a future era's and every takeaway still lands** — because the takeaway is a mechanism, not a moment. A reader who ignored every number would still learn how reasoning works. This is the difference between an explanation (durable) and a report (perishable), and it is the deck's governing design constraint: when a page's *evidence* dates, its *lesson* must not. Concrete numbers are stamped with their date/benchmark (§6.3) so the deck reads as *illustrated mechanism*, never *stale news*.

---

## 2. Target venue & the gap we fill

**VISxAI 2026** (9th edition, IEEE VIS, Boston) explicitly calls for *"explainables / explorables that explain how AI techniques work using visualization."* Submission is a **live URL** (plus a backup PDF abstract) via PCS → VGTC → VIS 2026 → VISxAI Blog Posts. Key dates (ET): **submission Aug 3, 2026** · reviews Sep 8 · notification Sep 14 · **camera-ready Oct 16**.

Reviewers reward **clarity, genuine interactivity, novelty of explanation, and correctness** — not academic novelty of method. The "Hall of Fame" is transformers, diffusion, k-means, Gaussian processes.

**Gap:** there is **no explorable on inference-time / test-time scaling** — arguably the defining LLM story of 2024–2026. The topic is timely, visually rich (curves, trees, traces), full of counter-intuitive reversals that reward interaction, and grounded in a strong verified corpus. Competition is near-zero (per the lineup notes) and the "operate on a trace" interaction has no precedent at this venue.

Sources: [VISxAI 2026](https://visxai.io/) · [submit page](https://visxai.io/submit) · [IEEE VIS 2026 workshops](https://ieeevis.org/year/2026/info/program/workshops/).

---

## 3. The hero object, the four levers & the three signature interactions

**Home base:** a real DeepSeek-R1 reasoning trace solving **Game-of-24** (make 24 from four numbers with + − × ÷) — chosen because its *solution is literally a search tree*, so one object can visualize sequential thinking, parallel sampling, tree search, and verification. A **difficulty ladder** (GSM8K-easy → MATH → AIME-hard, plus Tower-of-Hanoi for controllable complexity) lets every principle be seen to **hold or break**. **The telescope move** (§1) is the standing device for every published anchor that lives off-spine.

**The four levers** (Act 2's explicit count — a persistent "levers unlocked ▓▓░░" rail tracks them):
**Lever 1 — think longer** (sequential) · **Lever 2 — sample wider** (parallel) · **Lever 3 — verify & select** · **Lever 4 — search** (structured exploration).

Three interactions carry the "wow" and recur across pages — **all three in the MVP**:

1. **The thinking-budget knob** *(the best-looking, lowest-competition interaction — per the notes).* A single slider sets how long the model thinks. Drag it and the **home-base trace visibly grows** (budget-forcing appends "Wait…"), the **answer flips wrong → right**, and an accuracy curve rises then flattens. Anchor: s1-32B (an early open recipe) extrapolates **50% → 57% on AIME24** — the same "effort level" dial the current frontier (mid-2026) now bills you for directly. *(Page 4, MVP.)*

2. **The verifier betrayal** *(the "thinking-harder" selection-economics component, merged in for wow).* Generate N candidates; turn a verifier **on** and watch accuracy jump. Then **corrupt the verifier** (inject error) and watch it **cap out, mis-rank, and actively mislead** — dramatizing that *having* a right answer ≠ *picking* it. Anchors: verifier best-of-N > majority, with verifier error bounding realized accuracy (Generative Verifiers; BoN optimality); PRM **78.2%** vs ORM **72.4%** vs majority **69.6%** (Lightman). *(Pages 7–8, MVP; the coverage-vs-realized divergence anchor moved to page 6 in Rev 2.)*

3. **The log-axis straightening + the economics dollar-shock.** Drag samples across four orders of magnitude, flip linear↔log — the messy curve **snaps into a straight line** (SWE-bench Lite **15.9% → 56%**, a 2024 illustration of the coverage law), then the realized-accuracy overlay **sags away from coverage** (the gap, on the same chart). Later, the economics dashboard puts accuracy against a **shocking log-scale dollar axis** on the *current* frontier benchmark: on **ARC-AGI-2 (2026)** the top scores (~83–85%) cost *hundreds* of dollars per task, one model's refinement runs **~$0.81 → ~$31/task for +23 points**, and a human solves the same puzzles for **~$17**. A **historical layer** shows where this started — o3 on ARC-AGI-1 (Dec 2024), **75.7% at ~$20 → 87.5% at 172× the compute** (thousands/task) — now inexpensive, which is *why the bill moved to a harder benchmark.* *(Pages 6 and 11, both MVP.)*

These three are the trailer; the storyboard (§5) threads them through the arc.

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

## 5. The storyboard — three acts, 16 core pages (+2 optional)

Each page = **one concept · one interaction · one data source · one paper.** ★ = a signature "wow" beat. **[MVP]** = in the 14-page Aug-3 submission set. Every page follows **Predict-Observe-Explain**. 🔭 = a marked **telescope move** to off-spine published data. Beat labels (win / stall / reversal / betrayal / repair / boss) keep Act 2 tonally varied.

### ACT 1 — *Watch it think* (pages 1–3)
| # | Page | Interaction | Learn | Source |
|---|---|---|---|---|
| 1 **[MVP]** | **Think fast, think slow** | **The reader goes first:** answer "2+2" instantly, then work "17 × 24" — feel the two speeds. *Then* the reveal: a real R1 `<think>` stream solving the home-base Game-of-24; play / scrub. **Stake seeded in copy:** thinking time is now a product — billed by the token and the "effort level," with the last points costing far more than the first — worth buying? trustworthy? | Deliberate thinking is a *thing*, machines now do it, and it's real, inspectable text | Kahneman framing; R1 (2501.12948) |
| 2 **[MVP]** | **Anatomy of a thought** | Same trace, tokens color-coded by move (plan / compute / check / **backtrack "Wait"**); hover + filter; token-entropy overlay | Long CoT = plan–compute–verify–backtrack loops | Demystifying Long CoT (2502.03373) |
| 3 **[MVP]** 🔭 | **Rewind to 2022 — the instant-answer problem** | **Hinge line:** *"That was a 2025 reasoning model. It wasn't always this good — rewind three years."* Toggle "answer immediately" vs "show your work"; bar leaps **17.9% → 56.9%** GSM8K (PaLM 540B); zoom back: our puzzle needs the same scratch space | Intermediate steps buy accuracy — the founding discovery | Wei (2201.11903) |

### ACT 2 — *You change its mind* (the four levers, pages 4–10)
| # | Page | Interaction | Beat | Learn | Source |
|---|---|---|---|---|---|
| 4 ★ **[MVP]** | **Lever 1 — think longer (the thinking-budget knob)** | **You** drag the budget; the home-base trace grows ("Wait…"), the **answer flips wrong → right** — the first time you change its mind; 🔭 accuracy curve rises then flattens (s1 **50→57** AIME24 — the "effort level" the frontier now bills directly) | win → stall | Thinking longer helps — with diminishing returns | s1 (2501.19393); Kimi k1.5 (2501.12599) |
| 5 **[MVP]** 🔭 | **Lever 2 — sample wider (not every path is right → ask many, then vote)** | Resample the home-base problem: chains diverge, end green/red (>60% of first steps doom a chain); then a votes dial 1→40 — majority climbs **+17.9 pts** GSM8K… and **stalls** | win → stall | One try is a coin flip; independent tries + voting raise accuracy — to a ceiling | Yao (2305.10601); Wang (2203.11171) |
| 6 ★ **[MVP]** 🔭 | **The scaling lab — coverage soars… and you can't cash it in** | Drag samples across 4 orders of magnitude; flip linear↔log — the curve **snaps straight** (SWE-bench Lite **15.9%→56%**, a 2024 illustration of the coverage law). Then toggle "oracle picks" → "you must pick": realized accuracy **sags away** from coverage, on the same chart | rise → **reversal** | Coverage grows lawfully (log-linear) — but a right answer *existing* ≠ *picking* it | Brown (2407.21787); Limits of Resampling (2411.17501) |
| 7 ★★ **[MVP]** | **Lever 3 — verify… and the betrayal** | Verifier **on** → accuracy jumps toward coverage; then **corrupt it** → it caps, mis-ranks, **actively misleads** | rescue → **betrayal** | Verifiers unlock best-of-N — and their errors bound it | Generative Verifiers (2408.15240); BoN optimality (2503.21878) |
| 8 **[MVP]** 🔭 | **Repairing the judge — grade the steps, not the answer** | Toggle ORM (one end label) vs PRM (per-step glow); best-of-N on MATH: **PRM 78.2% vs ORM 72.4% vs MV 69.6%** | repair | Dense per-step signals make a far better judge | Lightman (2305.20050); Math-Shepherd (2312.08935) |
| 9 **[MVP]** | **Lever 4 — search the tree** | Interactive reasoning tree on the home base; set branching *b*: **b=1→45%, b=5→74%** vs CoT **4%**; dead branches dim and collapse | win | Structure the tries as a guided search | Tree-of-Thoughts (2305.10601); rStar-Math (2501.04519) |
| 10 **[MVP]** 🔭 | **The allocation game (all four levers, one budget)** | Distribute a fixed compute budget across easy/med/hard; scored vs the compute-optimal policy — **~4× more efficient; matched a 14× larger model** on Snell's 2024 setup (a finding since complicated — flagged in-app, not stated as a standing law) | boss | Match method & budget to difficulty | Snell (2408.03314); Inference Scaling Laws (2408.00724) |

### ACT 3 — *Watch it break* (pages 11–15)
| # | Page | Interaction | Learn | Source |
|---|---|---|---|---|
| 11 ★ **[MVP]** 🔭 | **The bill arrives (economics dashboard)** | Cost-vs-accuracy scatter on a **shocking log-$ axis**, *current* frontier: **ARC-AGI-2 (2026)** — top ~83–85% at *hundreds*/task, one model's refinement **~$0.81 → ~$31/task for +23 pts**, human **~$17**; a stamped **historical** layer (o3, ARC-AGI-1, Dec 2024: **75.7%@~$20 → 87.5%@172×**, thousands/task) shows the bill *moving to the next hard test.* *Pays off the page-1 stake.* | More accuracy costs more, with diminishing returns; absolute prices fall over time, the shape does not | ARC Prize / ARC-AGI-2 leaderboard (2026) + o3 (Dec 2024) *(blog/leaderboard est.)* |
| 12 ★ **[MVP]** | **When more thinking hurts (overthinking)** | Push the length knob past the peak; accuracy **arcs up then down**; easy problems overthink first | Extra thinking can *backfire* (inverse-U) | Overthinking (2412.21187); Inverse Scaling in TTC (2507.14417) |
| 13 ★ **[MVP]** | **The complexity cliff (Tower of Hanoi)** | Add disks; accuracy **collapses** past a wall; thinking effort paradoxically *drops*. Carries a **"contested"** chip — the collapse is *partly* a test-setup artifact (token/format limits) and *partly* real (models still stumble ~8 disks even given programmatic answers); see page 15 — so the MVP never presents it one-sidedly | Past a complexity wall, thinking degrades — how much is *real* is debated | The Illusion of Thinking (2506.06941) |
| 14 ★ 🔭 | **Do the thoughts tell the truth? (faithfulness)** | Plant a hint; check whether the trace admits using it; the "confession meter" stays low — **Claude 3.7: 25%, R1: 39%** *(early-2025 models; refresh to current frontier for camera-ready)* | The stated reasoning may not be the real reasoning | Anthropic (2505.05410) |
| 15 ★ | **You be the judge (Illusion-of-Thinking debate)** | Courtroom: Apple "collapse" vs the **methodological critique** (token/format limits; impossible N≥6 instances) and the **synthesis** (partly artifact, partly a real ~8-disk wall); toggle the scoring rule, watch the **verdict shift**. *(Cite the serious critique — Lawsen's viral "Illusion of the Illusion" was self-described as a joke, not a rebuttal.)* | Adjudicate a live scientific debate yourself | Shojaee (2506.06941); Rethinking the Illusion of Thinking (2507.01231) |

### CAPSTONE — *the bookend* (page 16)
| # | Page | Interaction | Learn | Source |
|---|---|---|---|---|
| 16 ★★ **[MVP]** | **Back to the first thought — the grand sandbox** | **Return to the page-1 trace** and re-read it with everything now known (moves, entropy, budget, verifier, tree annotations switchable). The article **answers the opening stake in plain words**: *thinking longer does make it better — lawfully, within limits: it plateaus, it can backfire, it hits walls, and you should watch the bill and the honesty of the transcript. The prices fall every year and the frontier keeps moving — but the shape of the trade-off doesn't.* Then every knob at once — length, samples, verifier (+corruption), search depth, difficulty → one accuracy/cost readout + "auto-tune to compute-optimal"; short pre/post quiz | Synthesis: *when it helps, how to spend, where it stops* | RQ3 synthesis across corpus |

### OPTIONAL / STRETCH (camera-ready)
- **17 (opt)** — *Bring your own prompt (live):* R1-Distill-1.5B via WebLLM (WebGPU) or an Edge proxy; gated, graceful fallback to the branch bank.
- **18 (opt)** — *How this was made / sources:* provenance panel + full arXiv reference list; committed generation scripts.

**Narrative arc = the title:** *watch it think (1–3) → **you** change its mind (4–10) → watch it break (11–15) → the honest answer + free play (16).* The MVP set (1–13, 16) preserves the full causal chain: *sample → vote stalls → coverage can't be cashed in → verifier → betrayal → repair → search → allocate → cost → backfire → cliff → answer.*

---

## 6. Pedagogy, design & the verified anchors

### 6.1 Why each choice (learning-science grounding)
- **Active reading over passive** (Victor): every page has ≥1 live control — including page 1, where the reader acts *before* watching anything.
- **Start concrete, climb, end in a sandbox** (Case): page 1 is the reader's own two-speed thinking; page 16 is the combined sandbox; difficulty rises step by step. Case's *"this happens, THEREFORE that, BUT that"* is enforced by the Act-2 beat labels (win → stall → reversal → betrayal → repair → win → boss) — no "AND… AND… AND" plateau of eight identical knob-pages.
- **Predict-Observe-Explain**: most pages ask a prediction *before* revealing data — targeted at this domain's wrong intuitions ("bigger is always better", "more thinking is always better").
- **Mayer's multimedia principles**: one idea per page (segmenting; the two merged pages each stage their two beats as *sequenced reveals on one interaction surface*), spotlight one number (signaling), strip extraneous elements (coherence), words + visuals (dual-channel).
- **Distillation, not polish** (Distill *Research Debt*): simulations **re-derive** published curves, they don't merely display them.

### 6.2 Design principles reviewers reward
**The overarching commitment — explain the mechanism, not the moment.** Every principle below serves one goal: the reader learns *how reasoning works*, a truth that survives any change of model, benchmark, or year. The data only makes it concrete. If a page's lesson would change when next year's numbers replace this year's, the page is teaching a moment, not a mechanism — and must be rebuilt until it teaches the mechanism. The rest of these principles are how that commitment is kept:

1. **One idea per page** — if the takeaway needs two paragraphs, split it (merged pages: two *reveals*, one idea arc).
2. **Direct manipulation + immediate feedback** — every knob visibly moves a curve.
3. **The home base is always one gesture away** — every 🔭 telescope move zooms out to marked "field data" and *back to the puzzle*; the reader is never stranded on an unfamiliar benchmark.
4. **Count the levers** — a persistent "levers unlocked ▓▓░░" rail in Act 2; each lever page is numbered in its title.
5. **Show the real numbers** — precomputed real runs or clearly-labeled digitized paper figures; **no invented data.**
6. **Honest uncertainty** — the plateau/cliff/backfire pages are the *point*; flag preprints explicitly.
7. **Accessibility** — colorblind-safe palette (never color alone; see the `dataviz` skill), keyboard-navigable controls, `prefers-reduced-motion`, light/dark aware, charts scroll inside their own container on narrow screens.
8. **Cite on every page** — a small "based on: arXiv:XXXX" chip; this is what separates an explainer from a toy.

### 6.3 Visual identity
Modern high-contrast canvas; a **restrained, consistent palette** used identically on every page — one "compute/energy" hue, one "correct/accuracy" hue, one "wrong" hue (Mayer signaling). Motion is **purposeful only** — values animate in response to the reader's action. A persistent top rail shows the three Acts (+ the lever counter within Act 2). The 🔭 "field data" frame is one consistent visual treatment, so zoom-outs read as a deliberate rhythm, not drift. A light **"you are here (2026) / history"** time treatment — reusing that same frame — marks every dated snapshot, so the frontier's movement is a stated theme rather than a slow leak of relevance. One shared chart grammar throughout.

### 6.4 Verified quantitative anchors (the correctness backbone)
Every simulation is locked to a cited number **before** its UI is built. Store digitized source values in versioned JSON with the citation attached — the single most important guardrail against "invented curves." **These anchors *illustrate* their mechanism; they are not the lesson.** Each is stamped with its date + benchmark and isolated in JSON so a future model's numbers can replace it without touching the page — the curve's *shape* is the teaching, and the shape is what survives. If swapping an anchor for next year's figure would change what the page *means*, that page is mis-built (see §6.2).

| Page | Anchor (as reported) | Source |
|---|---|---|
| 1–2 *(context)* | DeepSeek-R1-Zero AIME24 **15.6% → 71.0%** pass@1; **86.7%** cons@64 — what the modern reasoner on screen can do | DeepSeek-R1 2025 (2501.12948) |
| 3 | GSM8K: standard **17.9%** → chain-of-thought **56.9%** (PaLM 540B); +cal. 58% > prior SoTA 55% | Wei 2022 (2201.11903) |
| 4 | s1-32B budget forcing extrapolates **50% → 57%** on AIME24 | Muennighoff 2025 (2501.19393) *(preprint)* |
| 5 | >60% of chains fail after step 1; self-consistency **+17.9 pts** GSM8K (also +11.0 SVAMP, +12.2 AQuA, +3.9 ARC-c) | Yao 2023 (2305.10601); Wang 2022 (2203.11171) |
| 6 | SWE-bench Lite **15.9% (1) → 56% (250 samples)**, log-linear; majority/reward selection **plateaus beyond several hundred samples** | Brown 2024 (2407.21787) |
| 7 | Verifier best-of-N beats majority; verifier error bounds realized accuracy | Generative Verifiers (2408.15240); BoN optimality (2503.21878) |
| 8 | MATH best-of-N: **PRM 78.2% vs ORM 72.4% vs MV 69.6%** | Lightman 2023 (2305.20050) |
| 9 | Game-of-24: CoT **4%** → ToT **74%** (b=1 45%, b=5 74%; IO 7.3%, CoT-SC 9.0%) | Yao 2023 (2305.10601) |
| 10 | Compute-optimal **>4×** more efficient than best-of-N; **matched a 14× larger model** (FLOPs-matched) *on Snell's 2024 setup — present as a dated finding; the stronger "beats a bigger model" claim has since been complicated* | Snell 2024 (2408.03314) |
| 11 *(current)* | **ARC-AGI-2 (2026):** Gemini 3 Pro **$30.57/task @ 54%**, GPT-5.2 Pro **$15.72 @ 54%**, Opus 4.5 **~$60**; ceiling **83–85%** (hundreds/task); one refinement **31%@$0.81 → 54%@$31**; human **~$17** — *stamp "as of 2026"; verify vs live leaderboard; pull newest frontier (Sol 5.6, Fable 5) figures at build time if clean* | ARC Prize 2025 results / ARC-AGI-2 leaderboard *(blog/leaderboard est.)* |
| 11 *(historical)* | **ARC-AGI-1 (Dec 2024):** o3 **75.7% @ ~$20** → **87.5% @ 172× compute** (≈thousands/task) — now inexpensive; the "before" that shows the bill relocated | ARC Prize / o3 (Dec 2024) *(blog est.)* |
| 12 | Inverse-U: accuracy rises, peaks, falls; easy problems cross first | Overthinking (2412.21187); Inverse Scaling in TTC (2507.14417) *(preprints)* |
| 13 | Hanoi collapse past a complexity wall; thinking effort drops — *contested: partly a token/format artifact, partly a real ~8-disk wall (community synthesis)* | Shojaee 2506.06941; Rethinking (2507.01231) *(preprints)* |
| 14 | Hint admission: **Claude 3.7 25%, R1 39%** *(early-2025 models — date-stamp in-app; refresh for camera-ready)*; misalignment hints lower *(source-conflict on exact values — resolve against primary paper; see task list)* | Anthropic 2025 (2505.05410) *(preprint)* |
| 15 | "Collapse" vs the **methodological critique** (token-limit/format artifacts; River-Crossing impossible N≥6) and synthesis — *Lawsen's "Illusion of the Illusion" was self-described as a joke; cite the serious critique instead* | Shojaee 2506.06941 · Rethinking (2507.01231) *(preprints)* |

Preprints are **explicitly flagged in-app**. Where a core page rests wholly on preprints (4, 12, 13), the claim is framed as *emerging/contested* in copy and its numbers are isolated in versioned JSON so they can be swapped without touching the page. **Every model/price/capability claim also carries an "as of" date + benchmark stamp** (a currency discipline; see [`hybrid_explorable_currency_review.md`](hybrid_explorable_currency_review.md)) so the deck reads as *dated history*, never as *stale error*, when the frontier moves.

---

## 7. Feasibility at 40 hrs/week with Claude Code

This is the binding design constraint, so it drives scope directly.

### 7.1 Two-tier scope
- **By Aug 3 (submission, ~3 weeks ≈ 120 human-hours):** the **14-page MVP** — pages **1–13 + 16**. Build effort ≈ the previous 12–13-page plan: pages 5 and 6 are merges of four old pages, and page 11 (a scatter of published numbers) is the cheapest build in the deck. The MVP preserves the full causal chain and **all three signature wows**. Submit the **live URL** + a backup PDF abstract.
- **By Oct 16 (camera-ready, ~10 weeks):** add pages **14–15**, optional live mode (17) and methods page (18), run a formative user test with 5–8 readers, and polish. VISxAI lets the camera-ready improve substantially on the submitted version, so the extras land *after* acceptance risk is retired.

### 7.2 What Claude Code does vs. what the human does
Claude Code is a genuine multiplier because most of the build is **repetitive scaffolding over a shared grammar** — exactly what it's fastest at.

| Claude Code carries | Human carries |
|---|---|
| Scaffold Next.js/Vercel app + shared component library (`ChartFrame`, `KnobSlider`, `TraceNavigator`, `CurveChart`, `TreeView`, `LeverRail`, `FieldDataFrame`) from one reference page | Design taste, palette, motion feel, narrative copy (incl. the stake, the hinge, the bookend answer) |
| Generate the offline data pipeline (R1 API calls, **branch-bank generator**, budget-forcing sweeps, BoN/verifier eval, ToT/MCTS rollouts, logprob/entropy capture) | Curate which traces/examples to ship; verify every anchor against the primary source |
| Write client-side Monte-Carlo **Web Workers** seeded to published shapes | The bespoke *feel* of the trace-navigator & tree interactions |
| Stamp out all 16 per-page scaffolds from the §5 table | Formative user testing; cognitive-load review |
| Encode verified anchors into versioned JSON + a `PROVENANCE.md` map | Final correctness sign-off |
| Accessibility passes (ARIA, keyboard, reduced-motion, colorblind), responsive passes, perf tuning | The three signature interactions' polish |

The **branch bank** (§4.2) is what makes the flagship "operate on a trace" interaction fit the hour budget: Claude Code writes both the offline generator and the navigator UI; there is no runtime inference to engineer, tune, or pay for.

### 7.3 Timeline (from Jul 12)
| Window | Milestone |
|---|---|
| **Jul 12–18** | Foundations (skeleton, tokens, primitives, CI/Vercel) **+ offline data pipeline & branch bank** **+ reference page** (page 4: TraceNavigator + budget knob — the riskiest tech, de-risked first); draft the abstract (needed for PCS). |
| **Jul 19–25** | Act 1 (pages 1–3, incl. stake + hinge copy) + Act 2 (pages 5–10: vote, scaling lab, **betrayal**, PRM/ORM, tree, allocation game). |
| **Jul 26–Aug 1** | Act 3 MVP (11–13) + the bookend capstone (16); story-QA gates (below); accessibility & mobile pass. |
| **Aug 2** | Polish, cross-browser/perf, colorblind check, copy-edit, provenance stub. |
| **Aug 3** | **Submit** live URL + PDF abstract via PCS. |
| **Aug 4 → Oct 16** | Pages 14–15; optional live mode (17) + methods (18); user testing; camera-ready polish. |

**Story-QA gates (from the review — enforced before submission):**
1. *Causal-chain gate:* no page references a concept (sampling, voting, coverage) not yet introduced in the MVP ordering.
2. *Signature-wow gate:* all three wows demoable in the submitted build.
3. *Bookend gate:* page 16 explicitly answers page 1's stake question, on the page-1 trace.
4. *Telescope gate:* every off-spine anchor renders in the marked `FieldDataFrame` with a zoom-back.
5. *Lever-count gate:* four levers, each numbered in a page title, and the rail fills to ▓▓▓▓.

**Priority order if time slips** *(never violates the gates)*: first cuts are **8** (fold the PRM/ORM number into page 7's copy), then **12** (keep 13 as the break exemplar), then **2** (fold move-coloring into page 1). **Never cut 5, 6 (causal chain), 11 (wow #3), or 16 (bookend).**

---

## 8. Correctness & reproducibility (non-negotiable for a research venue)
- Generate all traces/curves with **committed scripts**; publish them (page 18) so a reviewer can regenerate.
- Where a paper's headline curve is reused, **reproduce it on our own runs** where feasible, else clearly label *"digitized from Fig. X of arXiv:…"*.
- Keep a `PROVENANCE.md` mapping every chart → data source → paper, mirroring the review's zero-hallucination stance.
- **Simulations are illustrative, not predictive** — they reproduce the *shape and endpoints* of real results; in-app copy says so.

---

## 9. Risks & mitigations
| Risk | Mitigation |
|---|---|
| **3-week first deadline** | Two-tier scope (§7); 14 MVP pages ≈ old 12–13 in effort (merges + cheap econ page); gate-respecting cut order if time slips. |
| **"Operate on a trace" is too ambitious** *(the notes' concern)* | **Branch bank** (§4.2): navigating a precomputed continuation tree, zero runtime inference; built *first* as the reference page. |
| **Merged pages overload one-idea-per-page** | Each merge is two *sequenced reveals* on one interaction surface (variance→vote; straighten→gap), with POE pacing; validated in the cognitive-load review. |
| Running a model on Vercel (won't work) | Precomputed JSON backbone; any live model is external/optional and gated. |
| Reviewer doubts about correctness | Committed generation scripts + provenance map + digitized-figure labeling + per-page citation chips. |
| Preprint volatility (s1, overthinking, Illusion debate) | Flagged in-app; never the sole basis of a core page; numbers isolated so they can be updated. |
| WebLLM weight size / WebGPU support | Live page is opt-in, capability-gated, falls back to the branch bank. |
| Over-animation hurting clarity/accessibility | One idea per page; `prefers-reduced-motion`; keyboard controls; a "purposeful motion only" review gate. |
| **Content dates as the frontier moves** *(the defining risk for a fast-topic explorable — e.g. "thousands/task" was true of Dec-2024 o3, false by mid-2026)* | Anchor hooks on the durable **shape**, not absolute prices; **"as of" date+benchmark stamps** on every model/price claim; a **current layer** (ARC-AGI-2, 2026) plus a **historical layer** that *owns* the movement; a **currency gate** as a release invariant. See [`hybrid_explorable_currency_review.md`](hybrid_explorable_currency_review.md). |

---

## 10. Open decisions to confirm
1. **Deadline commitment:** target the Aug 3 VISxAI submission with the 14-page MVP, expanding by Oct 16? *(recommended; Rev 2 and the task list assume it)* — or treat this as a non-deadline educational project on a relaxed roadmap?
2. **Spine:** approve **Game-of-24 as the home-base trace** (+ Hanoi for the cliff, math ladder for difficulty)? Alternative: a pure math-word-problem spine.
3. **Trace source:** **DeepSeek-R1** as the spine (recommended — open + in our review). Add a **Claude extended-thinking** "frontier comparison" trace, yes/no?
4. **Live mode appetite:** ship precompute-only for the submission (recommended) and add WebLLM live mode only for camera-ready?
5. **Budget:** any offline API/GPU budget for trace + branch-bank generation? (R1 via Together/Fireworks is inexpensive for a few hundred traces; the 1.5B distill runs on a modest GPU or CPU.)

---

## 11. Appendix — page → review mapping
- **Taxonomy (review §2)** → pages 4 (SEQ), 5–6 (PAR + coverage), 7–8 (VER), 9 (SRCH), 10 (OPT).
- **RQ1 / 2024 (review §3)** → 5–8, 10 (sample-and-select, verifier bottleneck, compute-optimal).
- **RQ2 / 2025–26 (review §4)** → 1–2, 4 (long-CoT reasoners, budget forcing), 9 (search→training data), 6 (scaling laws).
- **RQ3 / limits (review §5)** → 11 (cost), 12 (overthinking/inverse), 13 (cliff), 14 (faithfulness), 15 (illusion debate), 16 (allocation synthesis + the honest answer).

---

### Sources
- [VISxAI 2026 — 9th Workshop on Visualization for AI Explainability](https://visxai.io/) · [Submit](https://visxai.io/submit) · [IEEE VIS 2026 workshops](https://ieeevis.org/year/2026/info/program/workshops/)
- Story-quality review driving Rev 2: [`hybrid_explorable_story_review.md`](hybrid_explorable_story_review.md)
- Pedagogy: Victor *Explorable Explanations* (2011); Case *How I Make Explorable Explanations*; Olah & Carter *Research Debt* (Distill 2017); Mayer *Cognitive Theory of Multimedia Learning* (2014).
- All paper citations refer to the verified corpus in [`inference_time_scaling_review.md`](../literature_review/inference_time_scaling_review.md) §6.
