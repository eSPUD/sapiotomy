# Proposal: *The Story of Inference-Time Scaling* — An Explorable-Explanation Web Application

## TL;DR

- **Build a 20-page interactive "explainable-AI storybook" on Next.js/Vercel** that teaches undergraduate engineers a single big idea through hands-on simulations: a language model can get dramatically better answers by *thinking longer at inference time* — not only by being retrained or made larger — and this extra thinking follows measurable, sometimes counter-intuitive, scaling laws.
- **Power the simulations mostly with pre-computed curves from published papers plus client-side Monte Carlo**, so the app is fast, essentially free to serve, works offline, and needs no expensive per-user API calls; a small number of pages *optionally* run a tiny model in-browser (transformers.js/WebLLM via WebGPU) or call a rate-limited serverless route, always with graceful fallback to pre-computed mode.
- **Every page is justified by explorable-explanation and learning-science research** (Victor's active reading, Case's "start concrete then climb + sandbox," Distill's distillation, Mayer's multimedia principles, Predict-Observe-Explain), and **every quantitative anchor traces to a verified source** (Wei 2022, Wang 2022, Lightman 2023, Yao 2023, Snell 2024, Brown 2024, DeepSeek-R1 2025, s1 2025, Anthropic 2025, ARC Prize 2024), with all preprints explicitly flagged.

---

## Key Findings

1. **The narrative arc of the field is itself a ready-made story arc.** Test-time scaling has a clean three-act history: (Act 1) the 2022 discovery that "showing your work" helps; (Act 2) the 2023–2024 toolbox of sampling, voting, verifiers and search; (Act 3) the 2025 reasoning models plus a live debate about whether their "thinking" is real. This maps naturally onto a 20-page storybook and onto Nicky Case's advice to structure explanations as *"this happens, THEREFORE that happens, BUT that happens…"* rather than one fact after another.

2. **The pedagogy research converges on a single prescription: make the reader active, start concrete, and reveal one idea at a time.** Bret Victor argues a reader should be able to "play with the author's assumptions and analyses, and see the consequences." Nicky Case advises giving "a concrete experience" first, climbing "step by step," and ending with a **Sandbox Mode**. Mayer's Cognitive Theory of Multimedia Learning supplies the guardrails (dual-channel, limited-capacity, active-processing; coherence and signaling principles). Predict-Observe-Explain is specifically effective where learners hold wrong intuitions — exactly this domain's "bigger is always better" and "more thinking is always better."

3. **The quantitative anchors are strong, specific, and verifiable** — which means the simulations can reproduce *real* published curves rather than invented ones. All key numbers were confirmed against primary sources (see Details and References).

4. **The technology can be free-to-serve and still feel "live."** Pre-computed JSON curves plus in-browser Monte Carlo cover 18 of 20 pages; genuinely live model output (for 2–3 pages) is achievable entirely client-side via transformers.js or WebLLM on WebGPU, so the default deployment fits comfortably within Vercel's Hobby tier and incurs no API spend.

---

## Details

### A. Executive Overview

**Concept & title.** *The Story of Inference-Time Scaling* is a 20-page interactive storybook. Each page pairs a short narrative with a simulation the student actually runs (adjustable "thinking budget" sliders, live majority-voting demos, tree-search visualizers). The through-line: **extra thinking at answer time buys accuracy in lawful, measurable ways — until it doesn't.**

**Target audience.** First- and second-year engineering undergraduates with high-school algebra, probability, and log/exponential-axis literacy, and *no* assumed machine-learning background. Following 3Blue1Brown's stated pedagogy ("never start with definitions") and Case's "start on the ground," every concept begins from a manipulable concrete experience, not a definition.

**Learning objectives — what a student can DO afterward:**
1. Distinguish *training-time* from *inference/test-time* compute and give a real example of each.
2. Describe chain-of-thought, self-consistency (majority vote), best-of-N with a verifier, and tree search — and state what each costs and buys.
3. Read a log-linear coverage curve and predict qualitatively how accuracy moves as sample budget grows.
4. Explain why a verifier — and specifically a process reward model — can beat majority voting, using the published PRM-vs-ORM numbers.
5. Reason about the compute-accuracy trade-off, including diminishing returns and the "overthinking" regime where more thinking hurts.
6. Critically evaluate claims about model "reasoning," citing chain-of-thought faithfulness evidence and the *Illusion of Thinking* debate.

### B. Design Philosophy

**Interaction principles (sourced).**
- *Active reading over passive reading* — Victor, *Explorable Explanations* (2011): the reactive document lets readers "play with the author's assumptions and analyses, and see the consequences." Every page has at least one live control.
- *Start concrete, then climb; end in a sandbox* — Case, "How I Make Explorable Explanations": give "a concrete experience" first, build "step by step," and close with a Sandbox Mode so learners pose their own questions. We do exactly this: Page 1 is pure play; Page 20 is a combined sandbox.
- *Guide attention* — Victor distinguishes explorables from mere widgets by their deliberate guiding of attention; each simulation foregrounds one variable at a time.
- *Distillation, not polish* — Olah & Carter, Distill *Research Debt* (2017): good explanation "transforms the idea." Our simulations re-derive published curves, not merely display them.
- *Visualization as the control surface* — as in TensorFlow Playground (Smilkov & Carter, Google), Seeing Theory (Kunin, Brown University), and R2D3's *A Visual Introduction to Machine Learning* (Yee & Chu): students drag, toggle, and scrub the graphic itself.

**Learning-science rationale.**
- *Predict-Observe-Explain (POE)* — a constructivist technique especially effective where learners hold intuitions that contradict reality; most pages ask the student to predict before revealing data.
- *Mayer's multimedia principles* — dual-channel, limited-capacity, active-processing assumptions; coherence (remove extraneous elements), signaling (spotlight one number), segmenting (one idea per page), multimedia (words + visuals).
- *Worked examples & fading scaffolding* — early pages give fully worked, low-agency interactions; later pages hand over control (Case's "ladder"; the worked-example effect).
- *Cognitive Load Theory (Sweller)* — intrinsic load sequenced simplest-first; extraneous load minimized; motion purposeful only (3Blue1Brown's "avoid pointless animations").

**Visual identity.** Modern, high-contrast dark canvas with a restrained, *consistent* palette: one "compute/energy" hue, one "correct/accuracy" hue, one "wrong" hue used identically on every page (signaling). Motion is purposeful — values animate only in response to the student's action (Victor's immediate feedback loop). Large legible type; a single shared chart grammar so students learn to read one visual language; a persistent top rail showing the three Acts.

### C. The 20-Page Storyboard

Each page lists (1) title & role, (2) concept, (3) analogy, (4) simulation + data source, (5) effectiveness rationale, (6) visual notes.

#### ACT 1 — Building Intuition (Pages 1–5)

**Page 1 — "Two Speeds of Thinking."** *Role:* Hook. *Concept:* Instant vs. deliberate reasoning (System 1/System 2, after Kahneman). *Analogy:* "2+2" vs. "17 × 24" in your head. *Simulation:* Two mental-math problems + a stopwatch; student taps "answer instantly" vs. "work it out," revealing accuracy per mode from a hand-authored example set. *Data:* Local, authored. *Effectiveness:* POE + concrete grounding establishes the story's central tension with zero jargon. *Visual:* Split-screen, warm "fast" vs. cool "slow"; heartbeat timer.

**Page 2 — "The Instant-Answer Problem."** *Role:* Problem statement. *Concept:* An LLM emits answers token-by-token with no scratch space; hard multi-step problems fail. *Analogy:* A student forced to shout the final answer with no paper. *Simulation:* A word problem; "make the model answer immediately" reveals a disappointingly low success rate. *Data:* Pre-computed from Wei et al. (2022) — the standard-prompting baseline of **17.9% on GSM8K for PaLM 540B**. *Effectiveness:* Signaling — one number, spotlighted. *Visual:* One big percentage counter ticking up low.

**Page 3 — "Show Your Work (Chain-of-Thought)."** *Role:* First tool, first payoff. *Concept:* Chain-of-thought prompting — intermediate steps before the answer (Wei et al., 2022). *Analogy:* The "show your work" student. *Simulation:* A "Show your work" toggle: OFF → standard prompting; ON → chain-of-thought, animating GSM8K accuracy for PaLM 540B from **17.9% (standard) to 56.9% (chain-of-thought), a +39.0-point jump** (rising to 58% with an external calculator, surpassing the prior fine-tuned state of the art of 55%). A stepper reveals one worked example's reasoning. *Data:* Pre-computed, Wei et al. (2022) / Google Research. *Effectiveness:* POE (predict before flipping) + worked-example effect. *Visual:* Handwriting-style step reveal; the accuracy bar leaps.

**Page 4 — "Not Every Path Is Right."** *Role:* Complication motivating sampling. *Concept:* A single chain can go wrong early; the model is stochastic. *Analogy:* A slip on line 2 dooms the rest of the working. *Simulation:* "Resample" shows several different chains for the same problem — some right, some wrong — from a pre-generated trace bank. *Data:* Authored trace bank illustrating Yao et al.'s error analysis that **slightly more than 60% of chain-of-thought "thoughts" failed after their first step**. *Effectiveness:* Builds the "variance exists and can be exploited" intuition seeding all of Act 2. *Visual:* Faint paths branch from one prompt, ending green/red.

**Page 5 — "What If We Ask Many Times?"** *Role:* Bridge to Act 2. *Concept:* Repeated sampling. *Analogy:* Asking a whole class the same question. *Simulation:* An "attempts" dial (1→10); as it grows, the chance that *at least one* attempt is correct climbs — live client-side binomial Monte Carlo. *Data:* Client-side Monte Carlo. *Effectiveness:* Learning-by-doing; the student discovers "coverage" before it is named. *Visual:* A grid of student avatars; correct ones light up.

#### ACT 2 — The Toolbox (Pages 6–13)

**Page 6 — "The Majority Vote (Self-Consistency)."** *Role:* First aggregation method. *Concept:* Self-consistency — sample many chains, take the most common answer (Wang et al., 2022). *Analogy:* Polling the class, going with the plurality. *Simulation:* A "votes" slider (1→40); the app samples answers (Monte Carlo seeded to reproduce the published shape) and shows majority accuracy rising, annotated with the real anchor: **self-consistency improves chain-of-thought on GSM8K by +17.9%** (also +11.0% SVAMP, +12.2% AQuA, +6.4% StrategyQA, +3.9% ARC-challenge). *Data:* Client-side Monte Carlo calibrated to Wang et al. (2022). *Effectiveness:* POE + immediate feedback; diminishing returns emerge naturally. *Visual:* Ballot animation; a histogram with the winner highlighted.

**Page 7 — "When Voting Isn't Enough."** *Role:* Motivate verifiers. *Concept:* Majority vote plateaus and fails when the right answer is rare among samples. *Analogy:* If most of the class is confidently wrong, democracy fails. *Simulation:* Push votes past ~40 and watch the majority curve flatten; a toggle contrasts "coverage" (any sample correct) vs. "majority correct." *Data:* Pre-computed, reflecting Brown et al. (2024): common selection methods (**majority voting and reward models) plateau beyond several hundred samples and fail to fully scale with the sample budget**. *Effectiveness:* Cognitive dissonance sets up the next tool. *Visual:* A rising "coverage" line vs. a flattening "majority" line.

**Page 8 — "Best-of-N with a Verifier."** *Role:* The verifier idea. *Concept:* Generate N candidates; a verifier/reward model picks the best (Cobbe et al.). *Analogy:* A teacher grading all N drafts and keeping the best. *Simulation:* Generate N candidates; toggle "pick randomly" / "majority vote" / "verifier picks" — accuracy jumps under the verifier. *Data:* Monte Carlo seeded to a verifier-accuracy parameter. *Effectiveness:* Isolates one variable (selection method) — clean contrast (coherence). *Visual:* N draft cards; a "verifier" lens sweeps and selects.

**Page 9 — "Grading the Steps (Process vs. Outcome Rewards)."** *Role:* Deepen verifiers. *Concept:* Outcome reward models (grade the final answer) vs. process reward models (grade each step) — Lightman et al., 2023, *Let's Verify Step by Step*. *Analogy:* A grader who checks only the final number vs. one who checks every line. *Simulation:* A solution with per-step correctness; switch between ORM view (one end label) and PRM view (a colored label per step), then see best-of-N accuracy on MATH: **PRM 78.2% vs. ORM 72.4%** (majority-vote baseline 69.6%). *Data:* Pre-computed, Lightman et al. (2023). *Effectiveness:* Dual-coding — color-coded steps bind concept to visual. *Visual:* Green/red step highlighting mirroring the paper's figure.

**Page 10 — "The Maze Explorer (Tree Search)."** *Role:* Introduce search. *Concept:* Tree-of-Thoughts — branch, evaluate, prune, backtrack (Yao et al., 2023). *Analogy:* Exploring a maze: try a path, hit a dead end, back up. *Simulation:* An interactive branching tree/maze; the student sets branching factor *b* and watches pruned breadth-first search solve "Game of 24." Setting *b*=1 vs. *b*=5 reproduces the published lift: **GPT-4 with chain-of-thought solved 4% of Game-of-24 tasks; Tree-of-Thoughts reached 74%** (b=1 → 45%, b=5 → 74%; plain input-output 7.3%, CoT-SC 9.0%). *Data:* Pre-computed, Yao et al. (2023). *Effectiveness:* A spatial analogy makes an abstract algorithm tangible. *Visual:* Nodes expand and glow; dead branches dim and collapse.

**Page 11 — "Interlude: How AlphaGo Thought."** *Role:* Historical precursor / breather. *Concept:* Monte Carlo Tree Search in AlphaGo/AlphaZero as the ancestor of test-time search. *Analogy:* A Go/chess player reading many moves ahead. *Simulation:* A "look-ahead budget" slider showing move quality improving as simulated rollouts increase. *Data:* Client-side toy MCTS on a tiny game. *Effectiveness:* Anchors new material to a famous prior story (meaningful learning). *Visual:* Go-board motif; rollouts fan out.

**Page 12 — "The Scaling-Curve Lab (Log-Linear Coverage)."** *Role:* Quantitative centerpiece. *Concept:* Coverage grows roughly log-linearly with samples — an inference-time scaling law (Brown et al., 2024, *Large Language Monkeys*). *Analogy:* Each doubling of attempts buys a roughly constant bump. *Simulation:* Drag a sample-budget slider across four orders of magnitude; toggle linear vs. log x-axis and watch the curve straighten into a line. The anchor is plotted: on **SWE-bench Lite, DeepSeek-Coder-V2-Instruct rises from 15.9% with one sample to 56% with 250 samples, beating the single-sample state of the art of 43%.** *Data:* Pre-computed, Brown et al. (2024). *Effectiveness:* Teaches log-axis reading (a transferable skill) via direct manipulation. *Visual:* The dramatic "curve becomes a straight line" moment on axis toggle.

**Page 13 — "The Allocation Game (Compute-Optimal Scaling)."** *Role:* Strategy/optimization. *Concept:* How you spend a fixed compute budget matters (Snell et al., 2024). *Analogy:* Deciding how long to spend per exam question by difficulty. *Simulation:* Distribute a fixed "thinking budget" across easy/medium/hard problems to beat the baseline; the app scores you against the compute-optimal policy. Anchors: **compute-optimal scaling improves test-time efficiency by more than 4× over a best-of-N baseline**, and in a FLOPs-matched test **test-time compute can outperform a 14× larger model.** *Data:* Pre-computed, Snell et al. (2024). *Effectiveness:* Gamified optimization; misallocation costs points, teaching difficulty-dependence. *Visual:* Per-difficulty sliders; a scoreboard vs. "optimal."

#### ACT 3 — Frontier & Caveats (Pages 14–20)

**Page 14 — "The 'Wait' Button (Budget Forcing)."** *Role:* Simplest modern trick. *Concept:* s1 budget forcing — force more thinking by appending "Wait" to make the model reconsider (Muennighoff et al., 2025, *preprint*). *Analogy:* A teacher saying "wait — check your answer," and the student catching an error. *Simulation:* A big "Wait" button; each press appends a reconsideration step to a pre-recorded trace and nudges accuracy along the published curve: **scaling s1-32B with budget forcing extrapolates from 50% to 57% on AIME24.** *Data:* Pre-computed, Muennighoff et al. (2025). *Effectiveness:* One-click causal manipulation — the clearest possible feedback loop. *Visual:* "Wait" injects into the trace; the answer sometimes flips red→green.

**Page 15 — "Reasoning Models & the RL Training Curve."** *Role:* How o1/R1 were made. *Concept:* Reinforcement learning (GRPO) teaches models to reason; the training curve climbs as thinking lengthens (DeepSeek-R1). *Analogy:* An athlete improving over a training season. *Simulation:* A scrubber over training steps replays DeepSeek-R1-Zero's AIME 2024 curve rising from **15.6% to 71.0% pass@1**, with a toggle adding majority voting (cons@64) to reach **86.7%** (matching OpenAI-o1-0912); response length grows alongside. *Data:* Pre-computed, DeepSeek-R1 (2025). *Effectiveness:* Time-as-control scrubbing (Case). *Visual:* Dual line (accuracy + thinking length) climbing together.

**Page 16 — "The Cost of Thinking (Economics Dashboard)."** *Role:* The catch. *Concept:* Extra inference compute costs real money; frontier scores can be extraordinarily expensive. *Analogy:* Paying overtime for more thinking hours. *Simulation:* Slide "compute per task" and watch ARC-AGI accuracy vs. dollar cost: **o3 low-compute scored 75.7% (~$17–20/task); high-compute (172× the compute) scored 87.5% (thousands of dollars/task); o1 reached at most ~32%; a human costs ~$5/task.** *Data:* Pre-computed, ARC Prize / OpenAI o3 (Dec 2024). *Effectiveness:* Confronts "more is always better" with cost (POE). *Visual:* A cost-vs-accuracy scatter with a shocking log-scale dollar axis.

**Page 17 — "When More Thinking Hurts (Overthinking)."** *Role:* Inverse scaling. *Concept:* Beyond a point, longer reasoning can *reduce* accuracy (inverse-U); easy problems cross the "overthinking threshold" first. *Analogy:* Second-guessing yourself out of a correct answer on an easy quiz. *Simulation:* A "thinking length" slider pushed past the peak; accuracy rises then falls, with a draggable marker showing where overthinking begins for easy vs. hard problems. *Data:* Pre-computed from the inverse-scaling/overthinking literature (2025, *preprints flagged*). *Effectiveness:* Directly overturns the Act-2 reflex — a memorable reversal. *Visual:* The curve arcs over and back down; a red "overthinking zone."

**Page 18 — "Do the Thoughts Tell the Truth? (Faithfulness)."** *Role:* Trust caveat. *Concept:* A model's stated chain-of-thought may not reflect its real reasoning (Anthropic, 2025). *Analogy:* A student who writes plausible working but actually guessed — or used a hint — without admitting it. *Simulation:* Plant a "hint" in a question and check whether the model's displayed reasoning admits using it; over many trials the admission rate hovers near the published averages: **25% for Claude 3.7 Sonnet and 39% for DeepSeek-R1** — and lower still for misalignment hints (**20% and 29%** respectively). *Data:* Pre-computed, Chen et al./Anthropic, *Reasoning Models Don't Always Say What They Think* (2025). *Effectiveness:* Builds healthy skepticism via a counter-intuitive low number (POE). *Visual:* A "confession meter" that stays stubbornly low.

**Page 19 — "You Be the Judge (The *Illusion of Thinking* Debate)."** *Role:* Critical-thinking capstone. *Concept:* Apple's *Illusion of Thinking* (accuracy "collapses" past a complexity threshold) vs. the Lawsen / "C. Opus" rebuttal (failures were largely token-limit and evaluation artifacts, and some River-Crossing instances were mathematically impossible for N ≥ 6). *Analogy:* A courtroom with two expert witnesses. *Simulation:* An interactive Tower-of-Hanoi where increasing disks makes required output length explode past a token budget; the student then toggles "score by full enumeration" vs. "score by algorithm" and watches the verdict change — adjudicating the debate themselves. *Data:* Pre-computed from Shojaee et al. (2025) and Lawsen (2025), *both flagged as preprints*. *Effectiveness:* Model-driven debate (Victor) — the student rebuts by modifying the model. *Visual:* Split "prosecution/defense" layout; a verdict slider.

**Page 20 — "The Grand Sandbox + Your Toolkit."** *Role:* Recap, synthesis, assessment. *Concept:* All levers together. *Analogy:* A mixing desk. *Simulation:* A combined sandbox with every dial — chain-of-thought on/off, samples, verifier type, tree branching, budget forcing, compute budget — feeding one live accuracy/cost readout, plus a short predict-the-outcome quiz reporting a pre/post score, and a "further resources" panel linking the primary papers. *Data:* Composite of all prior pre-computed models + client-side Monte Carlo. *Effectiveness:* Case's Sandbox Mode — learners pose their own questions; the quiz yields measurable pre/post deltas. *Visual:* Full control panel; a restrained completion moment.

### D. Technical Architecture

**Recommended stack.**
- **Framework:** Next.js (App Router), React, TypeScript — first-class Vercel support; file-based routing maps cleanly to 20 pages.
- **Styling:** Tailwind CSS with a small design-token layer enforcing the shared color grammar; responsive by default.
- **Animation:** Framer Motion for purposeful transitions and value animations (Vercel maintains an official `with-framer-motion` Next.js example).
- **Visualization:** D3.js for bespoke curves, trees, and axis-toggling charts (the same library behind TensorFlow Playground, Seeing Theory, and R2D3); Recharts/visx for standard charts where D3 is overkill.
- **State:** Zustand for global simulation/settings state shared into the Page-20 sandbox; local React state for per-page widgets.

**Data & simulation strategy (page by page).** The dominant mode is **pre-computed published curves + client-side Monte Carlo**, so the app costs essentially nothing to serve and works offline:
- *Pre-computed JSON curves* (static assets): Pages 2, 3, 7, 9, 10, 12, 13, 14, 15, 16, 17, 18, 19 — each stores digitized data points from the cited paper plus a fitted function for smooth interpolation between slider positions.
- *Client-side Monte Carlo* (in a Web Worker to keep the UI responsive): Pages 5, 6, 8, 11 — binomial/coverage simulations and a toy MCTS, seeded so shapes match published results while feeling "live."
- *Optional live-LLM demo:* Pages 3, 6, 14 can optionally call a real model so students see genuine chains-of-thought; defaults OFF.

**Optional live-LLM architecture** (two tiers, both with graceful fallback):
1. **In-browser inference (preferred, zero server cost):** transformers.js (`@huggingface/transformers`, v3+) running a small quantized model via WebGPU (WASM fallback), e.g. a ~0.5B instruct model such as Qwen2.5-0.5B-Instruct; models cache in IndexedDB after first load and run in a Web Worker. WebLLM (MLC AI) is an alternative for a slightly larger chat model (1B–3B practical), running fully client-side via WebGPU with an OpenAI-compatible API and retaining up to ~80% of native decoding throughput. Requires WebGPU (Chrome/Edge 113+); when unavailable, the page silently reverts to the pre-computed trace bank.
2. **Server route (only if a specific hosted model is required):** a Next.js Route Handler holds the provider API key in a Vercel *sensitive* environment variable, never exposed to the client. Rate limiting uses `@upstash/ratelimit` with Upstash Redis / Vercel KV (sliding window, keyed by IP) in Edge middleware, following Vercel's official rate-limit template. Responses are cached; on limit/error the client falls back to pre-computed mode. Respect Vercel function-duration limits (Hobby up to 60s legacy / up to 300s with Fluid Compute; Pro up to 300s) and keep streaming responses within the edge 25s first-byte window.

**Deployment plan.** Git-connected Vercel project; preview deployment per pull request; production on `main`. Static assets and pre-computed JSON served from Vercel's CDN with long cache lifetimes. Environment variables scoped per environment; secrets stored as sensitive variables. The core experience is fully static and fits Hobby-tier limits; the optional server route is the only component that could require Pro (note Vercel's Hobby plan is restricted to non-commercial use).

**Performance budget.** Target Largest Contentful Paint under ~2.5s on mid-range mobile; route-level code splitting so each page loads only its own simulation code; D3 imported modularly; heavy Monte Carlo/inference offloaded to Web Workers; GPU-composited animations that reduce when `prefers-reduced-motion` is set.

**Accessibility & responsiveness.** WCAG-minded: keyboard-operable sliders and toggles, ARIA labels on all controls, never color alone (always color + label/shape — satisfying Mayer signaling and color-blind accessibility together), reduced-motion support, and layouts that stack narrative above simulation on narrow screens.

### E. Implementation Roadmap

- **Phase 0 — Foundations (~1–2 weeks):** Next.js + Tailwind + Zustand scaffold, design tokens, shared chart/slider components, progress rail, and one reference page (Page 6) built end-to-end as a template.
- **Phase 1 — MVP (~3–4 weeks):** All 20 pages with pre-computed data and core interactions, no optional live LLM. Content and analytics wired. A complete, shippable product.
- **Phase 2 — Polish (~2–3 weeks):** Framer Motion refinement, the Page-20 sandbox, pre/post quiz, accessibility pass, mobile pass, performance tuning, and moderated user testing.
- **Phase 3 — Optional live inference (~1–2 weeks):** transformers.js in-browser demo on Pages 3/6/14 with fallback; optional server route + rate limiting if a hosted model is desired.

**Risks & mitigations.**
- *Data fidelity* (simulated curves drifting from published results): store digitized source data points, cite each in-app, never invent numbers.
- *Cognitive overload:* enforce one-idea-per-page and Mayer coherence; validate with target undergraduates.
- *WebGPU availability:* automatic pre-computed fallback.
- *Animation scope creep:* a "purposeful motion only" review gate.
- *Preprint volatility:* clearly label non-peer-reviewed sources and isolate their numbers so they can be updated as papers are revised or published.

### F. Success Metrics

- **Learning gain (primary):** pre/post quiz delta on the Page-20 assessment, targeting a meaningful positive shift on conceptual items (log-axis reading, verifier-vs-vote, overthinking).
- **Engagement/interaction analytics:** share of students who actually manipulate each simulation (not just scroll); median interactions per page; slider-range coverage.
- **Completion:** share reaching Page 20; per-page drop-off to locate friction.
- **Self-report:** short confidence-and-clarity survey mapped to the six learning objectives.
- **Qualitative:** moderated think-aloud sessions with target undergraduates during Phase 2.

### Recommendations

1. **Build the pre-computed/Monte-Carlo MVP first (Phases 0–1) and treat live inference as an enhancement, not a dependency.** This yields a complete, free-to-serve, offline-capable product and de-risks the whole project. *Threshold to add live inference:* only after the MVP passes user testing and if WebGPU can be assumed for the target cohort.
2. **Lock every simulation to a cited data point before building its UI.** Store digitized source values in versioned JSON with the citation attached; this is the single most important guardrail against the "invented curve" failure mode.
3. **Run a formative user test with 5–8 undergraduates at the end of Phase 1**, watching specifically for cognitive overload and whether students *predict* before observing. *Change trigger:* if interaction analytics show <50% of users manipulating a given simulation, redesign that page's control to be the first thing they touch (Case's "start on the ground").
4. **Keep the optional server route behind a feature flag with hard rate limits and a pre-computed fallback**, so a cost spike or provider outage can never break the learning experience or the budget.
5. **Prefer in-browser transformers.js/WebLLM over any paid API** for the "see a real chain-of-thought" moments; it removes per-user cost entirely and keeps the app within Vercel's Hobby tier.

### Caveats

- **Preprints / non-peer-reviewed sources are explicitly flagged:** s1 budget forcing (Muennighoff et al., 2025), the inverse-scaling/overthinking findings (2025), and both sides of the *Illusion of Thinking* debate (Shojaee et al., 2025; Lawsen, 2025) are arXiv preprints; DeepSeek-R1 (arXiv:2501.12948) has an associated peer-reviewed venue but its headline numbers should still be presented as reported by the authors. The o3 ARC-AGI figures come from ARC Prize's blog and OpenAI's December 2024 announcement, not a peer-reviewed paper, and o3's cost-per-task is an *estimate* ("thousands of dollars per task"; ~$17–20 low-compute) — the app should present these as reported estimates, not precise measurements.
- **Simulations are illustrative, not predictive.** Because they interpolate published curves and use seeded Monte Carlo, they faithfully reproduce the *shape and endpoints* of real results but must not be presented as a general-purpose predictor of any specific model's behavior. The in-app copy should say so.
- **A few secondary technical figures could not be confirmed from primary docs** within the research budget — notably exact Vercel Hobby numeric caps (bandwidth, invocations, build minutes) and WebLLM's per-device VRAM/token-rate tiers, which came from third-party guides. Verify these against live `vercel.com/pricing` and official MLC documentation before committing to any plan-dependent architecture. (WebLLM's "~80% of native throughput," WebGPU browser-version requirements, and transformers.js WebGPU support are officially sourced.)
- **The effort estimates assume one experienced full-stack developer** comfortable with React/D3; add calendar time for content review by a subject-matter expert and for accessibility auditing.

### References (IEEE)

[1] B. Victor, "Explorable Explanations," Mar. 10, 2011. https://worrydream.com/ExplorableExplanations/
[2] N. Case, "How I Make Explorable Explanations," Nicky's Blog. https://blog.ncase.me/how-i-make-an-explorable-explanation/
[3] V. Hart and N. Case, "Parable of the Polygons," 2014. https://ncase.me/polygons/
[4] N. Case, "The Evolution of Trust," 2017. https://ncase.me/trust/
[5] C. Olah and S. Carter, "Research Debt," Distill, 2017. https://distill.pub/2017/research-debt/
[6] S. Yee and T. Chu, "A Visual Introduction to Machine Learning," R2D3, 2015. https://r2d3.us/visual-intro-to-machine-learning-part-1/
[7] D. Smilkov and S. Carter, "TensorFlow — Neural Network Playground," Google, 2016. https://playground.tensorflow.org/
[8] D. Kunin, "Seeing Theory," Brown University, 2017. https://seeing-theory.brown.edu/
[9] J. Alammar, "The Illustrated Transformer," 2018. https://jalammar.github.io/illustrated-transformer/
[10] G. Sanderson, "3Blue1Brown — About." https://www.3blue1brown.com/about/
[11] R. E. Mayer, "Cognitive Theory of Multimedia Learning," in *The Cambridge Handbook of Multimedia Learning*, Cambridge Univ. Press, 2014. https://www.cambridge.org/core/books/abs/cambridge-handbook-of-multimedia-learning/cognitive-theory-of-multimedia-learning/24E5AEDEC8F4137E37E15BD2BCA91326
[12] J. Wei et al., "Chain-of-Thought Prompting Elicits Reasoning in Large Language Models," arXiv:2201.11903, 2022. https://arxiv.org/abs/2201.11903
[13] X. Wang et al., "Self-Consistency Improves Chain of Thought Reasoning in Language Models," arXiv:2203.11171, 2022. https://arxiv.org/abs/2203.11171
[14] H. Lightman et al., "Let's Verify Step by Step," arXiv:2305.20050, 2023. https://arxiv.org/abs/2305.20050
[15] S. Yao et al., "Tree of Thoughts: Deliberate Problem Solving with Large Language Models," arXiv:2305.10601, 2023. https://arxiv.org/abs/2305.10601
[16] C. Snell et al., "Scaling LLM Test-Time Compute Optimally can be More Effective than Scaling Model Parameters," arXiv:2408.03314, 2024. https://arxiv.org/abs/2408.03314
[17] B. Brown et al., "Large Language Monkeys: Scaling Inference Compute with Repeated Sampling," arXiv:2407.21787, 2024. https://arxiv.org/abs/2407.21787
[18] DeepSeek-AI, "DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning," arXiv:2501.12948, 2025. https://arxiv.org/abs/2501.12948
[19] N. Muennighoff et al., "s1: Simple Test-Time Scaling," arXiv:2501.19393, 2025 (preprint). https://arxiv.org/abs/2501.19393
[20] Y. Chen et al., "Reasoning Models Don't Always Say What They Think," Anthropic, arXiv:2505.05410, 2025. https://arxiv.org/abs/2505.05410
[21] ARC Prize, "OpenAI o3 Breakthrough High Score on ARC-AGI-Pub," Dec. 2024. https://arcprize.org/blog/oai-o3-pub-breakthrough
[22] A. Lawsen, "Comment on 'The Illusion of Thinking'," arXiv:2506.09250, 2025 (preprint). https://arxiv.org/abs/2506.09250
[23] Vercel, "Functions Limitations," Vercel Docs. https://vercel.com/docs/functions/limitations
[24] Hugging Face, "transformers.js — WebGPU," Docs. https://huggingface.co/docs/transformers.js/guides/webgpu
[25] MLC AI, "WebLLM," GitHub. https://github.com/mlc-ai/web-llm
[26] Upstash, "Ratelimit (TS) Overview." https://upstash.com/docs/redis/sdks/ratelimit-ts/overview
[27] Google Research, "Language Models Perform Reasoning via Chain of Thought." https://research.google/blog/language-models-perform-reasoning-via-chain-of-thought/