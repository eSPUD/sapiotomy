# Related Works — *The Story of Inference-Time Scaling*

**Deliverable surveyed:** a 16-page interactive explorable (Next.js / TypeScript / D3) teaching
inference-time compute scaling for LLM reasoning to first- and second-year engineering
undergraduates with no ML background. Three acts: Building Intuition (pp. 1–4), The Toolbox
(pp. 5–11), Frontier & Caveats (pp. 12–16).

**Report date:** 2026-09-20
**Method:** four parallel research streams — a 114-agent fan-out/verify harness, plus three
targeted cataloguing agents (VISxAI programs, books/courses/blogs, VIS-HCI systems and
reproducibility repos). Every item below was fetched or search-verified; unverified items are
marked and kept separate from verified ones.

---

## 0. The headline

**Related work here means the whole pertinent established field, not the venue.** VISxAI's
program (§4) is *venue precedent* — useful for showing where this artifact would sit and what
form reviewers reward — but it is one section among eleven, and it is not the criterion for what
counts as related. The works that matter most to this deck are the ones it **stands on**: a book,
a set of blog explainers, a literature of scaling papers, and a pedagogy tradition. Those come
first, in §1.

**On novelty.** The defensible form is *not* "nobody has explained reasoning." Several people
have explained it well, and there is a crowded and growing literature of reasoning-trace
visualizers. The defensible form is:

> Existing work splits into three families — **authored explanations** that are static,
> **interactive systems** that render a single trace, and **replication repos** that hold real
> scaling curves with no teaching layer. Nothing occupies the **compute-allocation axis**
> (accuracy as a function of compute spent), and nothing pairs that axis with the author's own
> measured, re-derivable runs.

Three findings carry that claim:

1. **VISxAI, all eight editions (2018–2025), 79 accepted submissions: zero on reasoning,
   chain-of-thought, or test-time compute.** 16 of 79 concern LLMs at all, and decoder-era
   generative-LLM explainables only begin in 2024. Verified by enumerating every official
   per-year program listing and grepping the fetched HTML of each LLM-related entry for
   `chain.of.thought`, `reasoning`, `test-time compute`, `o1`, `DeepSeek`, `R1`. No genuine hits.
2. **No VIS, CHI, UIST, IUI, or EuroVis paper through 2026 takes test-time compute scaling as
   its subject**, and no interactive tool exists for self-consistency, best-of-N, or MCTS budget
   visualization. Logged as a confirmed absence after searching the VIS 2024/2025 programs and
   EuroVis 2025/2026.
3. **Every long-form explainer on the topic is static.** Weng, Grootendorst, Raschka, Lambert,
   Hugging Face, Epoch — checked page by page. The only interactivity anywhere in the teaching
   landscape is *notebook* interactivity.

**A methodological caveat to carry into the paper.** The verification harness voted down nine
absence-framed claims 0–3 — not because contradicting evidence appeared, but because
"artifact X contains no coverage of Y" is an argument from absence. The positive scope
descriptions of those same artifacts were confirmed. So the claim should be argued in the
paper as *positive scope enumeration* ("here is what each of these is about, and here is the
axis none of them plots"), never as a bare negative. That is both more honest and harder to
attack.

---

## 1. What this deck is built on — intellectual debts

**Read this section before the comparison tables.** Everything below §2 is work we sit *beside*.
This is work we sit *on top of*, and the distinction is an attribution obligation, not a
rhetorical nicety. A related-works section that frames a direct source as a competitor is both
unfair and easy for a reviewer to catch.

### 1a. Sebastian Raschka — *Build a Reasoning Model (From Scratch)* and `reasoning-from-scratch`

**This is the deck's single largest intellectual debt, and it is a code dependency as well as an
influence.** Manning, June 2026, 440pp, ISBN 9781633434677 ·
[manning.com](https://www.manning.com/books/build-a-reasoning-model-from-scratch) ·
[github.com/rasbt/reasoning-from-scratch](https://github.com/rasbt/reasoning-from-scratch)

What we actually take from it, verified in the repository:

| What | Where it enters | Evidence |
|---|---|---|
| **The grading harness, used unchanged** — `load_math500_test`, `render_prompt`, `extract_final_candidate`, `grade_answer` (ch03) and `get_device` (ch02) | Every measured page, 5–9 | `notebooks/README.md` §"What the book supplies": "using them unchanged means **grading is not ours to defend**" |
| **A literal package dependency** | `pip install reasoning-from-scratch` | `notebooks/page_05_how_to_reason.ipynb` §0 |
| **The MATH-500 item set and its loader** | The 100 L4/L5 items every measured page shares | via `load_math500_test` |
| **The notebook-first evaluation methodology** — spec → notebook → committed logs → page | The whole pipeline in `notebooks/README.md` | Author-confirmed: the notebook evaluations were directly inspired by the book |
| **The `zero_shot_cot` suffix** ("Explain step by step.") | Page 5's condition arm | Matches ch04's exact suffix |
| **ch04 as a cited independent comparison** | Page 5's base-checkpoint arm (15.2% → 40.6% on Qwen3-0.6B-Base) | `docs/page_5_base_arm.md`, which correctly refuses to place his number inside our figure |
| **On-page citation** | Page 8's reference block | `web/src/components/pages/Page8.tsx` |

**Attribution gap to close.** `notebooks/README.md` credits the book properly and page 8 cites it
on-page — but **`web/CREDITS.md` does not mention Raschka at all.** Its three lists (primary
research anchors, pedagogy and design influences, software) omit the one work whose code is
running in the measurement pipeline. Given that the deck's loudest claim is provenance
discipline, that omission is the most consequential correction in this report. Recommended: a
dedicated line in the primary-anchor list *and* the software list, plus a sentence in the paper's
acknowledgements.

**How this changes the differentiation claim.** It means we cannot claim "measured runs shipped
as re-derivable notebooks" as an unqualified novelty — that methodology is inherited. See §11,
differentiator 2, which is re-scoped accordingly. What remains ours is narrower and still real:
binding those runs to an *authored interactive explanation*, and making them re-derive **without
a GPU**.

### 1b. The literature the deck teaches

The deck is downstream of a 54-paper systematic review
([`literature_review/inference_time_scaling_review.md`](literature_review/inference_time_scaling_review.md)).
Its load-bearing primary sources — each cited on the page that teaches it, per `web/CREDITS.md` —
are Wei et al. (CoT, 2201.11903), Wang et al. (self-consistency, 2203.11171), Cobbe et al.
(GSM8K verifiers, 2110.14168), Lightman et al. (Let's Verify Step by Step, 2305.20050), Yao et
al. (Tree of Thoughts, 2305.10601), Snell et al. (2408.03314), Brown et al. (Large Language
Monkeys, 2407.21787), DeepSeek-AI (R1, 2501.12948), Muennighoff et al. (s1, 2501.19393), Zelikman
et al. (STaR), Chen et al./Anthropic (unfaithful CoT, 2505.05410), Shojaee et al. (Illusion of
Thinking, 2506.06941) and Lawsen's comment (2506.09250). These are cited for the *techniques they
introduced*, never for our measurements — a distinction `notebooks/README.md` states explicitly
and the paper should restate.

### 1c. The pedagogy tradition

Per `web/CREDITS.md`: Bret Victor (explorable explanations), Nicky Case (the THEREFORE/BUT act
structure the deck literally follows), Olah & Carter / Distill (distillation as contribution),
Mayer (CTML), Sweller (cognitive load), 3Blue1Brown, TensorFlow Playground, Seeing Theory, R2D3.
Full treatment with the empirical evidence — including the evidence that **complicates** it — is
in §10.

### 1d. Tooling and data infrastructure

Hugging Face `transformers` (all model-specific code), `Qwen2.5-Instruct` and
`DeepSeek-R1-Distill-Qwen` checkpoints, `Qwen2.5-Math-PRM-7B` (page 9's process reward model,
admitted only after clearing a pre-registered AUC gate), MATH-500, and the Next.js / D3 /
Zustand / Framer Motion / Vitest / Playwright stack.

---

## 2. Quick-glance table — the fifteen closest works

Ordered by how directly each competes with us. "Compute axis" = does it plot or expose accuracy
against compute spent?

| # | Work | Type | Year / venue | Interactive? | Compute axis? | Own measured runs? | Novice-facing? | The one-line difference from ours |
|---|---|---|---|---|---|---|---|---|
| 1 | **Build a Reasoning Model (From Scratch)** — Raschka **(SOURCE, not competitor — see §1a)** | Book (440pp) + notebooks | 2026, Manning | Notebooks only | **Yes** (Ch4–5) | Yes (reader's own) | No — assumes PyTorch | **We build on it**: its ch03 grader runs in our pipeline and its notebook methodology shaped ours. It teaches by implementation to a PyTorch reader; we teach by manipulation to a novice |
| 2 | **Transformer Explainer** — Cho, Kim, Karpekov, Helbling, Wang, Lee, Hoover, Chau | Explorable | VISxAI 2025 (Best Submission); VIS 2024 poster; CHI 2026 | **Yes** — live GPT-2 in-browser | No | No | **Yes** | Closest on *form*; it is architecture-scoped (one forward pass), we are budget-scoped (many runs) |
| 3 | **ReasonGraph** — Li, Shareghi, Collier | Web platform | ACL 2025 Demos | **Yes**, zero-setup | No | No | Partly ("beginner-friendly") | Renders CoT / self-consistency / ToT for one run; plots no accuracy-vs-budget relationship |
| 4 | **"Scaling test-time compute with open models"** — Beeching, Tunstall, Rush | Blog + `search-and-learn` repo | 2024, Hugging Face | No (static figures) | **Yes** | **Yes** | No | The closest empirical peer; its curves are static images and its notebook needs an A100 |
| 5 | **"Why We Think"** — Lilian Weng | Long-form essay | 2025 | No | **Yes** (conceptually) | No | Partly | The best static survey of the same territory; no manipulation, no measurement of its own |
| 6 | **"A Visual Guide to Reasoning LLMs"** — Grootendorst | Illustrated essay (40+ diagrams) | 2025 | No | **Yes** (as taxonomy) | No | **Yes** | Nearest on audience and visual ambition; every figure is a fixed diagram, not a control |
| 7 | **Landscape of Thoughts** — Zhou, Zhu, Li, Galkin et al. | Research tool | ICLR 2026 | Yes | Partial — names TTS via its verifier | Yes | No | Only VIS-adjacent work touching test-time scaling, and as a side effect rather than the subject |
| 8 | **s1: Simple Test-Time Scaling** (repo) — Muennighoff et al. | Paper + repo | 2025 | No | **Yes** (budget forcing) | Yes | No | Holds the canonical budget-forcing curve as a static figure; we make the budget a dial |
| 9 | **RLHF Book, Ch. 7 "Reasoning and Inference-Time Scaling"** — Lambert | Free web textbook | live, 2026 | No | **Yes** | No | Partly | Best free textbook-shaped treatment; static prose |
| 10 | **ReTrace** — Felder, Miller, Wallinger, Kobourov, Chen | VIS research system | 2025–26, CGF | Yes | No | Study data | No | Nearest peer-reviewed trace visualizer; axis is comprehension/debugging of one trace |
| 11 | **Interactive Reasoning / Hippo** — Pang, Feng, Feng, Li, Shi, Tsvetkov, Heer, Reinecke | HCI system | IUI 2026 | Yes | No | Study data | No | Lets users edit and regenerate a CoT; a human-oversight contribution, not a scaling one |
| 12 | **large_language_monkeys** — Scaling Intelligence Lab | Repo | 2024 | No | **Yes** (coverage vs k) | Yes | No | Owns the coverage-vs-k result our p.7–8 teach; code only, no narrative, no notebook |
| 13 | **Patchscopes explorable** — Hussein, Ghandeharioun et al. (Google PAIR) | Explorable | VISxAI 2024 (Hall of Fame) | **Yes** | No | Yes | **Yes** | The form we are aiming at, applied to hidden-state decoding rather than compute |
| 14 | **A Survey on Test-Time Scaling** (2503.24235) + sibling surveys | arXiv surveys | 2025 | No | **Yes** (as taxonomy) | No | No | Same map, drawn for researchers; we make the map walkable for novices |
| 15 | **ChainForge** — Arawjo, Swoopes, Vaithilingam, Wattenberg, Glassman | Visual toolkit | CHI 2024 | Yes | No | User's own | No | Practitioner prompt/model comparison; not a concept being taught |

---

## 3. Interactive explorables of ML and LLM internals

The form we are working in. **None covers reasoning or compute allocation.**

| Work | Authors | Year / venue | URL | What it is | Where we differ |
|---|---|---|---|---|---|
| Transformer Explainer | Cho, Kim, Karpekov, Helbling, Wang, Lee, Hoover, Chau | VISxAI 2025 Best Submission; IEEE VIS 2024 poster; CHI 2026 full paper; arXiv 2408.04619 | poloclub.github.io/transformer-explainer | Live GPT-2 small (124M, ONNX) in the browser: tokenization → embeddings → attention → MLP → output probabilities, with temperature/top-k/top-p | It explains **how one token is produced**. We explain **how much computation to spend on a problem**. Its knobs change a distribution; ours change a budget |
| Patchscopes — "Can LLMs Explain Their Internal Mechanisms?" | Hussein, Ghandeharioun, Mullins, Reif, Wilson, Thain, Dixon | VISxAI 2024 (Hall of Fame) | pair.withgoogle.com/explorables/patchscopes | Decoding LLM hidden states by patching them into prompts | Interpretability of representations vs. allocation of compute |
| The Mystery of In-Context Learning | Srivathsan, Lighittha, Prithivraj, Ramamoorthy | VISxAI 2025 | induction-spotlight.vercel.app | Induction heads and in-context pattern learning | ICL is an inference-time *phenomenon*; we teach inference-time *spending*. Nearest miss at the venue |
| ICL-Scope | Sarmah, Harsh | VISxAI 2025 | icl-vis-ui.vercel.app | Real-time attention / induction-head view of ICL | As above |
| ExplainPrompt | Simister | VISxAI 2024 | explainprompt.com | Anatomy of LLM prompts, annotated | Prompt composition, not compute budget |
| Diffusion Explainer | Lee, Hoover, Strobelt, Wang, Peng, Wright, Li, Yang, Park, Chau | VISxAI 2023 (accepted, **not** Hall of Fame) | poloclub.github.io/diffusion-explainer | Stable Diffusion's text encoder and denoising loop | Different modality; iterative denoising is not compute allocation over reasoning attempts |
| Do ML Models Memorize or Generalize? (grokking) | Pearce, Ghandeharioun, Hussein, Thain, Wattenberg, Dixon | VISxAI 2023 (Hall of Fame) | pair.withgoogle.com/explorables/grokking | The memorization → generalization phase change | A training-time phenomenon |
| What Have Language Models Learned? | Pearce | VISxAI 2021 (Hall of Fame) | pair.withgoogle.com/explorables/fill-in-the-blank | BERT fill-in-the-blank, associations and bias | BERT-era; no generation, no reasoning |
| Backprop Explainer | Bertucci, Kahng | VISxAI 2021 | xnought.github.io/backprop-explainer | Backpropagation step by step | Training mechanics |
| MLU-Explain | Wilber, Yeon, Werness (Amazon) | VISxAI 2021 | mlu-explain.github.io | Collection of core ML concept explainers | Classical ML concepts |
| A Visual Exploration of Gaussian Processes | Görtler, Kehlbeck, Deussen | VISxAI 2018 (Hall of Fame) | jgoertler.com/visual-exploration-gaussian-processes | GP priors, kernels, posteriors | The genre's quality benchmark; unrelated subject |

**Named in the field but not VISxAI submissions** — correct these if cited as venue precedent:
**CNN Explainer** (IEEE VIS 2020 short paper, TVCG 27(2)), **GAN Lab** (IEEE VAST 2018, TVCG
25(1)), **TensorFlow Playground** (listed on the 2018–19 VISxAI CfP only as an *inspirational
example*, alongside Distill's "Why Momentum Really Works").

---

## 4. The VISxAI corpus itself — venue precedent

79 accepted submissions across eight editions, from the official per-year listings. Full
enumeration is in the research transcript; the load-bearing summary:

| Year | Accepted | LLM-related | Reasoning / TTS | Hall of Fame |
|---|---|---|---|---|
| 2018 | 12 | 0 | 0 | Gaussian Processes; Dimensionality Reduction; Roads from Above |
| 2019 | 11 | 1 (Deconstructing BERT) | 0 | Doom Memory Reduction; Statistical Distances; Right Tool for the Job |
| 2020 | 8 | 1 (What Does BERT Dream Of?) | 0 | UMAP Tour; How Does a Computer "See" Gender? |
| 2021 | 9 | 2 | 0 | What Have LMs Learned?; Feature Sonification |
| 2022 | 8 | 2 | 0 | K-Means Explorable; Poisoning Attacks |
| 2023 | 10 | 0 full (3 partial) | 0 | PAC Learning; Amumo; Grokking |
| 2024 | 12 | 4 | 0 | Patchscopes; The Illustrated AlphaFold |
| 2025 | 9 | 4 | 0 (2 near-misses) | Transformer Explainer |

**Implication for the submission.** An inference-time-scaling explorable would be the first of
its kind at this venue. The trajectory also favours it: LLM work went from 0–2 entries per year
pre-2023 to 4 in each of the last two editions, and the 2025 Best Submission was an LLM
explorable.

**A venue you should know about: VISxGenAI.** "GenAI, Agents, and the Future of VIS"
(visxgenai.github.io) ran its first edition at VIS 2025 with 40+ submissions; the second is
9 Nov 2026 in Boston. Agentic and reasoning work at IEEE VIS appears to be routing there rather
than to VISxAI. That is both a related-works source we should check before camera-ready and a
plausible alternate or companion venue.

---

## 5. VIS / HCI research systems for reasoning traces and prompt chains

The most crowded neighbourhood, and the one a reviewer is most likely to raise. **Every system
here inspects a trace that already exists.** None exposes a compute-budget control; none plots
accuracy against sample count.

### 5a. Reasoning-trace systems (the direct neighbours)

| Work | Authors | Year / venue | What it is | Where we differ |
|---|---|---|---|---|
| ReasonGraph | Li, Shareghi, Collier | ACL 2025 Demos; arXiv 2503.03979; ~516★ | Web platform rendering sequential methods (CoT, self-refine, least-to-most, **self-consistency**) and tree methods (beam search, ToT) across 50+ models; self-describes as beginner-friendly | The single closest interactive artifact to our Act 2. It **draws the structure** of one run under each method; we **measure the payoff** of each method as budget varies, on a fixed item set |
| ReTrace | Felder, Miller, Wallinger, Kobourov, Chen | arXiv 2511.11187; Computer Graphics Forum | Parses traces via a validated reasoning taxonomy into two visualization designs; controlled study against a raw-text baseline | Its axis is comprehension and error-debugging of an individual trace |
| Interactive Reasoning ("Hippo") | Pang, Feng, Feng, Li, Shi, Tsvetkov, Heer, Reinecke | IUI 2026; arXiv 2506.23678 | CoT as an editable topic hierarchy; users add/edit/delete units and regenerate | Human oversight of one chain, not the economics of many |
| Landscape of Thoughts | Zhou, Zhu, Li, Galkin et al. | ICLR 2026; arXiv 2503.22165 | t-SNE landscape of reasoning trajectories; ships a verifier the authors report improves "the test-time scaling effect" | **The only VIS-adjacent work that names test-time scaling** — as a property of its verifier, not as the object of visualization. Expert research tool, no teaching layer |
| Thought Anchors | Bogdan, Macar, Nanda, Conmy | arXiv 2506.19143; thought-anchors.com; ~143★ | Sentence-level attribution over reasoning traces with an interactive DAG playground | Interpretability of which sentences matter within a trace |
| ReasoningLens | Zhang, Zheng, Cao, Lu, Lin, Zheng, Han, Sun | arXiv 2606.23404 | Hierarchical trace visualization separating strategy from execution, plus an agentic auditor | Trace structure and error detection |
| ReasonDiag ("When the Chain Breaks") | Chen et al. | Computer Graphics Forum 2026 | Step-level CoT error detection as an arc diagram of error propagation | Error localization, not allocation |
| ReasoningFlow | Lee, Agarwal, Parulekar, Madala, Hakkani-Tur, Hockenmaier | arXiv 2606.05402 | Annotation schema + 1,260-trace DAG dataset of trace discourse structure | A representation and dataset, not an interactive system |
| DeepVIS | (VIS 2025) | IEEE VIS 2025; arXiv 2508.01700 | CoT made inspectable inside an NL2VIS pipeline | CoT as a means to a visualization end, not the subject |

### 5b. Prompt-chain and agent systems (the older lineage)

| Work | Authors | Year / venue | What it is |
|---|---|---|---|
| AI Chains | Wu, Terry, Cai | CHI 2022 | Chained prompt steps with editable intermediates; 20-person study |
| PromptChainer | Wu, Jiang, Donsbach, Gray, Molina, Terry, Cai | CHI 2022 LBW | Node-graph IDE for authoring and debugging LLM chains |
| Graphologue | Jiang, Rayan, Dow, Xia | UIST 2023 | LLM prose → real-time interactive node-link diagrams |
| Sensecape | Suh, Min, Palani, Xia | UIST 2023 | Multilevel-abstraction canvas for nonlinear LLM sensemaking |
| Luminate | Suh, Chen, Min, Li, Xia | CHI 2024 | LLM-generated design-space dimensions as a navigable space |
| ChainForge | Arawjo, Swoopes, Vaithilingam, Wattenberg, Glassman | CHI 2024 | Visual dataflow environment for prompt/model comparison and hypothesis testing |
| LLM Comparator | Kahng, Tenney, Pushkarna et al. (Google) | CHI EA 2024; IEEE VIS 2024 / TVCG | Side-by-side LLM-as-judge evaluation with rationale clustering |
| AgentLens | Lu et al. | IEEE TVCG 31(8), 2025; arXiv 2402.08995 | Hierarchical temporal visualization of agent behaviour logs with causal tracing |
| FlowForge | Hao, Kang et al. | IEEE VIS 2025 / TVCG 32(1) | Design-space scaffolding for multi-agent workflow construction |
| Prompt Sapper | Cheng et al. | ACM TOSEM 2024 | Block-based no-code visual IDE for AI chains |
| AutoGen Studio | Dibia et al. (Microsoft) | EMNLP 2024 Demos | No-code builder and debugger for multi-agent workflows |
| InspectorRAGet | IBM Research AI | NAACL 2025 Demos | Introspection platform for RAG evaluation |
| iScore | Coscia, Holmes, Morris, Choi, Crossley, Endert | IUI 2024 | Visual analytics for how LMs score summaries |

**Related interpretability visualizers** (same authors and venues, different object): AttentionViz
(Yeh, Chen, Wu, Chen, Viégas, Wattenberg — IEEE VIS 2023/TVCG), Dodrio (Wang, Turko, Chau —
ACL 2021 Demos), LLM Attributor (Lee, Wang, Chakravarthy, Helbling, Peng, Phute, Chau, Kahng —
AAAI 2025 Demos), Shared Interest (Boggust, Hoover, Satyanarayan, Strobelt — CHI 2022).

**Commercial observability products**, listed for completeness, none peer-reviewed and none
covering compute scaling: LangSmith trace view, Arize Phoenix, W&B Weave, Langfuse, AgentOps,
xAI PromptIDE.

> **Do not cite these — they do not exist.** Early drafts of our search brief named
> "ThoughtFlow", "ReasonViz", "TraceViz", a published "Tree-of-Thought visualizer", and an
> academic "AgentOps". Verification found no such papers or tools. The real neighbours are the
> systems tabled above. One further caution: **Vis-CoT** (arXiv 2509.01412) claims up to +24pp on
> GSM8K but has no code, no demo, and no traceable institutional affiliation — treat its
> provenance as weak and do not lean on it.

---

## 6. Static written explainers on test-time scaling

**The closest competitors on content, and uniformly static.** This is where our form
differentiates most cleanly, and where a reviewer will reasonably ask "why does this need to be
interactive?"

| Work | Author(s) | Date | URL | What it is | Where we differ |
|---|---|---|---|---|---|
| **Why We Think** | Lilian Weng | 2025-05-01 | lilianweng.github.io/posts/2025-05-01-thinking | ~40-minute survey-grade essay: parallel sampling, best-of-N, sequential revision, PRMs, RL, continuous-space thinking, scaling laws for thinking time | The single best static treatment of our exact territory. Static PNG figures; researcher-facing; no measurement of its own. We make each lever a control and measure the payoff ourselves |
| **A Visual Guide to Reasoning LLMs** | Maarten Grootendorst | 2025-02-03 | newsletter.maartengrootendorst.com/p/a-visual-guide-to-reasoning-llms | 40+ custom diagrams: search against verifiers (majority voting, BoN with ORM/PRM, weighted BoN, beam search, MCTS), proposal-distribution modification, STaR | Nearest on audience and visual ambition. Every one of those 40+ visuals is a fixed diagram; none is a control, and none carries data |
| Understanding Reasoning LLMs | Sebastian Raschka | 2025-02-05 | magazine.sebastianraschka.com/p/understanding-reasoning-llms | Four ways to build/improve reasoning models, via DeepSeek-R1 | Static; one of four pillars is inference-time |
| The State of LLM Reasoning Model Inference | Sebastian Raschka | 2025-03-08 | magazine.sebastianraschka.com/p/state-of-llm-reasoning-and-inference-scaling | Survey of 14 post-R1 inference-scaling papers | Static; explicitly a literature round-up |
| **Scaling test-time compute with open models** | Beeching, Tunstall, Rush (HF) | 2024-12 | huggingface.co/spaces/HuggingFaceH4/blogpost-scaling-test-time-compute | Reproduces DeepMind's compute-optimal recipe: Llama-3.2-1B/3B + an 8B PRM; majority voting, BoN, weighted BoN, beam search, DVTS | **Our closest empirical peer.** It measures real curves — but publishes them as static plots, in a Space capable of interactivity, and its runnable path needs an A100 |
| What is test-time compute and how to scale it? | Se, Vert | 2025-02-06 | huggingface.co/blog/Kseniase/testtimecompute | Accessible TTC primer incl. multimodal and agentic variants | Static primer |
| Reverse engineering OpenAI's o1 | Nathan Lambert | 2024-09-16 | interconnects.ai/p/reverse-engineering-openai-o1 | Earliest widely-read attempt at o1's train+test compute curves | Static; our p.13 covers this ground with a manipulable two-axis curve |
| Quick recap on the state of reasoning | Nathan Lambert | 2025-01-02 | interconnects.ai/p/the-state-of-reasoning | Disambiguates post-training vs reasoning vs inference-time compute | Static |
| Trading off compute in training and inference | Villalobos, Atkinson (Epoch AI) | 2023-07-28 | epoch.ai/blog/trading-off-compute-in-training-and-inference | Prescient pre-o1 quantitative analysis of train/inference compute substitution: repeated sampling, MCTS, pruning, model scaling | Directly underwrites our p.3 and p.11. Static figures; we make the substitution a dial |
| Inference economics of language models | Ege Erdil (Epoch AI) | 2025-06-17 | epoch.ai/blog/inference-economics-of-language-models | Speed-vs-cost serving model; latency as bottleneck | Serving economics, not reasoning scaling |

---

## 7. Books and courses

| Work | Author(s) | Year / publisher | Covers inference-time scaling? | Interactive? | Where we differ |
|---|---|---|---|---|---|
| **Build a Reasoning Model (From Scratch)** ⭐ **primary source — see §1a** | Sebastian Raschka | June 2026, Manning, 440pp, ISBN 9781633434677 | **Yes, centrally.** Ch3 verifiers/eval, **Ch4 "Improving Reasoning with Inference-Time Scaling"** (best-of-N, majority voting/self-consistency), **Ch5 "Inference-Time Scaling via Self-Refinement"**, Ch6 RLVR, Ch7 GRPO, Ch8 distillation | Per-chapter Jupyter notebooks, free at github.com/rasbt/reasoning-from-scratch | **Not a competitor — a foundation.** Its ch03 grading functions run unchanged in our measurement pipeline, its ch02 device helper too, and its notebook-first methodology shaped ours. Where the artifacts diverge: it teaches by *implementation* to a PyTorch-literate reader and we teach by *manipulation* to a reader with no ML background; it builds each method and we measure what each buys and where it stops paying |
| RLHF Book, Ch.7 "Reasoning and Inference-Time Scaling" | Nathan Lambert | live web, 2026 | **Yes** — defines test-time compute, RLVR, verification functions, majority voting | No | Best free textbook-shaped treatment; static prose |
| Reinforcement Learning from Human Feedback | Nathan Lambert | July 2026, Manning, 312pp | Yes (named in description) | No | Print edition of the above; **status reads as forthcoming — confirm before citing as published** |
| AI Engineering | Chip Huyen | 2025, O'Reilly | **Partial.** Ch2 has a "Test Time Compute" subsection; Ch9 is inference *optimization* (serving), not reasoning scaling | No | One subsection vs. our whole deck |
| Build a Large Language Model (From Scratch) | Sebastian Raschka | Sept 2024, Manning | No — stops at instruction finetuning | Notebooks | Predecessor volume; no reasoning content |
| Hands-On Large Language Models | Alammar, Grootendorst | 2024, O'Reilly | **No** reasoning/test-time chapter | Colab notebooks per chapter | Note the tension: Grootendorst's *blog* is our nearest visual peer, but the book omits the topic |
| **Stanford CS329A — Self-Improving AI Agents** | Chowdhery, Mirhoseini | Autumn 2025 | **Yes, most directly of any course.** L2 "Test-time Compute Scaling", L3 "Robust Verification", L6 train-time scaling, L8 search-based self-improvement | No | Graduate-level; our audience is first/second-year undergrads |
| Advanced LLM Agents MOOC | Song, Chen, Yang (Berkeley RDI) | Spring 2025 | **Yes** — L1 (Xinyun Chen): "Inference-Time Techniques for LLM Reasoning" | Video + slides + quizzes | Lecture format |
| **NeurIPS 2025 Tutorial — Scale Test-Time Compute on Modern Hardware** | Z. Chen, B. Chen, Mirhoseini | NeurIPS 2025 | **Yes — the entire subject.** The only conference tutorial wholly devoted to it | No | Systems-and-algorithms framing for researchers; 2-hour session, not a durable artifact |
| ACL 2026 Tutorial — Current Advances in LLM Reasoning | Arora, Chaudhary, Kreutzer, Potamitis, Dziri, Tandon | ACL 2026 | Yes, incl. "advanced inference time methods" | **Promises demos + guided hands-on exercises** | The only item in the whole survey committing to hands-on interaction — but a live in-person session, not something a reader can open |
| Stanford CS224N | Yang, Choi | Winter 2026 | Partial — dedicated "Reasoning 1"/"Reasoning 2" lectures; Snell et al. on the reading list | No | Course module |
| Stanford CS336 | Hashimoto, Liang | Spring 2026 | Partial — L10 Inference, L16 RLVR; A5 trains LMs to reason via SFT+RL | Assignments | No dedicated test-time-scaling lecture |
| CMU 11-711 Advanced NLP | Welleck | Spring 2025 | Partial — L21 "Advanced Inference Strategies" reads s1 | No | Course module |
| CME 295 Transformers & LLMs | Amidi, Amidi | current | Partial — "Reasoning" (L3), "Reasoning with GRPO/RLVR" (L4) | No | Course module |
| Reinforcement Fine-Tuning LLMs With GRPO | Addair, Garg (Predibase) | 2025, DeepLearning.AI | **No** — training-time RL only | Graded code exercise | No test-time content despite adjacency |

*Not found:* any Packt or MIT Press equivalent; any ICML 2025 tutorial on the topic. Stanford
CS372 surfaced in search but its syllabus was not fetched — **unverified**.

---

## 8. Surveys and taxonomies

These are the field's existing "maps", and the honest framing is that we are not competing with
them on coverage — we are competing on *walkability*. A survey answers "what exists"; an
explorable answers "what happens if I turn this up".

| Survey | arXiv | Year | Role |
|---|---|---|---|
| A Survey on Test-Time Scaling: What, How, Where, How Well | 2503.24235 | 2025-03 | The unifying 4-axis taxonomy; the closest thing to a canonical map |
| Stop Overthinking: A Survey on Efficient Reasoning | 2503.16419 | 2025-03 | Underwrites our p.15 (where more compute subtracts) |
| Reasoning on a Budget: Adaptive and Controllable Test-Time Compute | 2507.02076 | 2025-07 | Frames difficulty-adaptive allocation — our p.11 keystone |
| Trust but Verify! Verification Design for Test-Time Scaling | 2508.16665 | 2025-08 | Underwrites our p.8–9 (verifiers, PRM vs ORM) |
| A Survey of Frontiers in LLM Reasoning | 2504.09037 | 2025-04 | Inference scaling + learning to reason + agentic systems |
| Test-time Scaling: A Subproblem Structure Perspective | 2511.14772 | 2025-11 | Later synthesis |
| The Art of Scaling Test-Time Compute | 2512.02008 | 2025-12 | Later synthesis |

Our own systematic review (`literature_review/inference_time_scaling_review.md`, 54 verified
papers) sits in this category and is the substrate the deck is built on. Worth stating in the
paper that the explorable is downstream of a real SLR — few explainables can claim that.

---

## 9. Reproducibility and open-replication artifacts

This is where our second differentiator lives, so it needs the most careful handling.
Star counts fetched 2026-09-20.

| Repo | Org | ★ | What it reproduces | Narrative for learners? |
|---|---|---|---|---|
| **search-and-learn** (`sal`) | Hugging Face | 1,132 | Best-of-N, beam search, DVTS under PRM guidance, via YAML recipes | Indirectly — points at the HF blog post |
| **HF Cookbook: "Scaling Test-Time Compute for Longer Thinking in LLMs"** | Paniego (HF) | — | Runnable Colab: Llama-3.2-1B + PRM, comparing BoN vs beam vs DVTS with timing/token tables | **Yes — the single closest artifact to "narrative + re-runnable notebook"** |
| **s1** | simplescaling (Muennighoff et al.) | 6,674 | **Budget-forcing curves**: 1K-example SFT, vLLM with forced thinking budgets, plus a `visuals/` directory with the scaling figure | Partly — README + paper |
| **large_language_monkeys** | Scaling Intelligence Lab | 128 | **Coverage vs k directly** — the log-linear result our p.7–8 teach | No — code only |
| open-r1 | Hugging Face | 26,477 | Full open reproduction of DeepSeek-R1 (GRPO, distillation, eval) | Partly — README + HF blog series |
| TinyZero | Jiayi Pan (Berkeley) | 13,238 | Cheap reproduction of R1-Zero emergent reasoning on Countdown | Partly |
| OpenR | openreasoner | 1,858 | PRM training + MCTS/beam test-time search + RL | Partly |
| verl | verl-project *(moved from volcengine)* | 23,504 | HybridFlow RL post-training (PPO/GRPO) | No |
| TRL (GRPO trainer) | Hugging Face | 19,348 | The trainer open-r1 builds on | Partly — docs are tutorial-grade |
| OpenRLHF | OpenRLHF | 10,020 | Ray-based agentic RL | No |
| simpleRL-reason | HKUST NLP | 3,873 | Simple RL reasoning reproduction | Partly |
| understand-r1-zero | Sea AI Lab | 1,277 | Critical reanalysis of R1-Zero training (Dr. GRPO) | Partly |
| PRIME | PRIME-RL | 1,872 | Implicit process-reward RL | No |
| LIMO | GAIR-NLP | 1,082 | "Less is more for reasoning" data efficiency (COLM 2025) | No |
| lm-evaluation-harness | EleutherAI | 14,036 | The de facto grader under most reproductions | No |
| simple-evals | OpenAI | 4,637 | Benchmark grader/harness | No |

**Only three artifacts re-derive scaling curves at all**: `large_language_monkeys` (coverage vs
k), `search-and-learn` plus its cookbook notebook (BoN / beam / DVTS vs budget), and `s1`
(budget forcing).

**Confirmed absence:** no published work ships measured reasoning runs as downloadable,
re-runnable *teaching* notebooks. Searched across arXiv, GitHub, and the VIS/CHI programs.

**How this should change our wording.** Our differentiator is not "we measured things" — HF, s1
and Scaling Intelligence all measured things, and shipped the code. It is the **conjunction**:
measured runs, re-derivable *without a GPU*, bound to an authored explanation, with a manifest
tying each figure to the run that produced it. The HF cookbook is the only artifact that spans
narrative + re-runnable code, and it has no interactive layer and needs an A100 before a reader
sees anything. That is the specific comparison to make in the paper.

---

## 10. Pedagogy and explorable-explanation foundations

**Read this section before writing the paper's justification, because the evidence does not say
what the genre usually assumes it says.**

### 10a. The manifestos (normative, zero empirical content)

| Work | Author(s) | Year | URL | Role |
|---|---|---|---|---|
| Explorable Explanations | Bret Victor | 2011 | worrydream.com/ExplorableExplanations | The founding manifesto: text as "an environment to think in" for an *active reader*. Names three techniques — **reactive documents**, **explorable examples**, **contextual information** |
| How I Make Explorable Explanations | Nicky Case | 2017 | blog.ncase.me/how-i-make-an-explorable-explanation | Start With a Question → Up The Ladder of Abstraction → End With a Question; the THEREFORE/BUT structure our three acts follow. *(Note: `explorabl.es/how-to/` 404s — cite this post)* |
| Research Debt | Olah & Carter | 2017 | distill.pub/2017/research-debt | Distillation is a first-class research contribution. **Supports the artifact's legitimacy, not its pedagogy** |
| About Distill | Distill editorial | 2016–21 | distill.pub/about | Venue precedent for web-native contributions |
| Reinventing Explanation | Michael Nielsen | 2014 | *original domain dead* — cite the Wayback capture | Non-verbal media for explaining one idea |
| Quantum Country (mnemonic medium) | Matuschak & Nielsen | 2019 | quantum.country/qcvc | Spaced repetition embedded inline. **Caveat: reports no controlled retention data of its own** |

All six are normative. Cite them for design vocabulary and venue precedent; none is evidence of
efficacy.

### 10b. The empirical picture — supports, complicates, and one result that cuts against us

| Work | Year / venue | Design | Verdict |
|---|---|---|---|
| **Thinking Like a Scientist: Can Interactive Simulations Foster Critical AI Literacy?** — Zhao, Michal, Thain, Subramonyam | 2025, arXiv 2507.21090 | **Preregistered, 605 participants.** Explorable vs the *same content as a static PDF* vs no-material control | **COMPLICATES — the most important citation here.** The explorable showed significant pre/post gains, **but did not significantly outperform the static condition** (β = −0.01, p = .642). On transfer, static again did not differ (β = −0.06, p = .19); only the no-material control was reliably worse. Authors conclude interactive tutorials are "at least as effective as static materials". Engagement quantity did not predict learning |
| **Explaining the Gap: Visualizing One's Predictions Improves Recall and Comprehension of Data** — Kim, Reinecke, Hullman | CHI 2017 (Best Paper) | 378 participants, powered, between-subjects | **SUPPORTS — our single best empirical warrant.** All elicitation techniques beat the passive baseline; Predict-Explain-Vis best (−4.08pp absolute error, p < .0001). **Prediction worked better in charts than in text** — the direct argument for putting the prompt inside the figure, as pp. 7, 13 and 15 do |
| Communicating with Interactive Articles — Hohman, Conlen, Heer, Chau | Distill 2020 | Survey of the form | **COMPLICATES.** The field's own canonical survey concedes empirical evaluation is limited and flags the NYT "few readers interact" claim as unvalidated folklore. Cite this to concede the gap before a reviewer does |
| Capture & Analysis of Active Reading Behaviors — Conlen, Kale, Heer | EuroVis 2019 / CGF 38(3) | 50,000+ in-the-wild sessions across three Idyll articles | **COMPLICATES with a direct design lesson.** Interaction rates are component-dependent, not uniformly low: **85%** engaged the component the article was built around, **2–15%** touched peripheral sliders and optional buttons. A load-bearing interaction gets used; an optional one does not |
| Animation: can it facilitate? — Tversky, Morrison, Bétrancourt | IJHCS 2002 | Skeptical review | **COMPLICATES — the strongest negative source.** Apparent animation wins dissolve under scrutiny into non-equivalent comparisons. Double-edged for us: they name *interactivity and prediction* among the confounds that did the real work |
| Instructional animation vs static pictures: a meta-analysis — Höffler & Leutner | Learning and Instruction 2007 | 26 studies, 76 comparisons | **SUPPORTS, moderately.** d = 0.37 (CI 0.25–0.49) — but moderators show the effect belongs to *representational* dynamism (d = 0.40) rather than decorative |
| Multimedia Learning (3rd ed.) — Mayer | CUP 2021 | CTML, 15 principles, 200+ experiments | **BOTH.** Generative-processing principles license interaction; extraneous-processing principles constrain it |
| Coherence principle — Mayer & Fiorella (eds.) | Cambridge Handbook 2022 | 23 of 23 experimental tests, median effect 0.86 | **COMPLICATES.** Every decorative interaction is a coherence violation |
| Seductive Details meta-analysis — Sundararajan & Adesope | Educ. Psych. Review 2020 | ~58 studies, 177 effect sizes | **COMPLICATES honestly.** g = −0.16 — small but real. Worth citing *because* it is small |
| Test-Enhanced Learning — Roediger & Karpicke | Psych. Science 2006 | Two experiments, delayed testing | **SUPPORTS p.16's concept check — with a caveat.** At 5 minutes, **restudy beat testing**; testing won only at days-to-weeks. Justify the quiz by *durable* retention, never immediate comprehension |
| The ICAP Framework — Chi & Wylie | Educational Psychologist 2014 | Engagement taxonomy | **SUPPORTS as scaffold, with a trap.** ICAP's "Interactive" means *dialogic partner* interaction. A slider is only "Active"; a prediction prompt is "Constructive". Using ICAP to justify sliders would misread it |
| Predict-Observe-Explain — White & Gunstone | *Probing Understanding*, 1992 | Original formulation | **SUPPORTS**, but note POE was framed as a *diagnostic* probe, not an achievement intervention |
| POE effects on achievement, attitude, retention — Yaşar | J. Pedagogical Research 2022 | 60 students, 8 weeks, 5-week delayed retention | **SUPPORTS.** Significant gains on achievement, attitude and delayed retention |
| Scrollytelling and long-form reading — Tjärnhage et al. | ECCE 2023 | Within-group, counterbalanced | **COMPLICATES by omission.** The significant effect was *perceived* engagement; comprehension was only self-reported. Do not cite as a comprehension result |
| Static vs scrollytelling vs chatbot onboarding — Chen, Shete, Anavekar, Peiris, Kong | 2026, arXiv 2607.03023 | 25 UX designers | **MIXED.** No comprehension difference; interactive conditions produced higher downstream guideline adherence and engagement. Interactivity may pay off in *application*, not comprehension scores |

**Unverified — do not state its result:** Boy, Détienne & Fekete, "Storytelling in Information
Visualizations: Does it Engage Users to Explore Data?", CHI 2015. Venue and design confirmed;
every full-text route blocked. It is commonly cited as a null finding, and that characterization
is currently unchecked.

### 10c. The defensible claim

**Do not write "interactive explorables teach better than static prose."** The best-powered
direct test of exactly that comparison found no significant difference. What survives is a claim
about **specific interaction mechanisms, not about interactivity as a medium**:

> Interactivity is not itself an instructional benefit; it is a delivery mechanism whose value
> depends on which cognitive activity it recruits. Interactions that force a learner to commit a
> prediction, retrieve an answer, or self-explain a discrepancy have solid support for improving
> recall, comprehension and transfer. Interactions that merely permit exploration have weak and
> inconsistent support, reliably improve only engagement and preference, and carry a small
> measurable coherence cost.

**This has teeth for the deck as built.** Our best-supported features are the **prediction locks**
(pp. 7, 13, 15 — Kim et al. is almost a direct warrant, including the chart-over-text finding)
and the **graded concept check** (p. 16 — Roediger & Karpicke, argued for durable retention). Our
*weakest-supported* features are any slider a reader can skip without losing the argument: Conlen
et al.'s 50,000 sessions put peripheral-control engagement at 2–15%. The design implication, and
a defensible line to put in the paper, is that **every interaction should be load-bearing and
unavoidable**, justified by the mechanism it recruits rather than by the form it takes.

### 10d. Borrowed empirical support, precisely scoped

**ReTrace** (§5a) ran a real controlled study against a raw-text baseline, which is directly
adjacent to our premise — but it must be cited precisely. Within-subjects, **N = 18**, three
conditions, Holm-Bonferroni at α = 0.05. What is actually significant: verification-share
estimation error was significantly lower for Space-Filling Nodes (median 0.30pp vs 14.60pp for
raw text, p = 0.001); NASA-TLX workload significantly lower (p = 0.014); perceived ease
significantly better for Sequential Timeline (p = 0.016); preference decisively favoured the
visualizations (Mdn 8 vs 4, p = 0.0003). What is **not**: strategy-summary quality and
verification-approach richness are reported as medians with no significance test; task
completion time showed no difference; and trust ran counter — correctness-judgment accuracy was
94.4% for raw text and Space-Filling alike but only 88.9% for the Sequential Timeline. Cite
ReTrace for **perceived workload and preference**, and state plainly that its comprehension
evidence is one measure in an 18-person study.

---

## 11. Where our explorable differentiates

Three axes. The claim is the **conjunction**, and each leg is separately defensible.

**1. The compute-allocation axis is unoccupied.**
Every artifact surveyed either explains a *mechanism* (Transformer Explainer: how one token is
produced; Patchscopes: what a hidden state encodes) or renders a *trace* (ReasonGraph, ReTrace,
Thought Anchors, Hippo: what this particular run did). Nothing makes **accuracy as a function of
compute spent** the manipulable object. Our pp. 6–11 are entirely on that axis: thinking budget,
sample count, verifier quality, search depth, and the FLOPs-matched comparison against
parameters.

**2. Measured, re-derivable provenance inside an authored explanation** — *scoped honestly,
because the method is inherited.*
Pages 5–9 replay our own runs over the same 100 MATH-500 L4/L5 items with the same grader, and
ship as downloadable notebooks that re-derive each figure on no GPU.

**What is not ours to claim:** the notebook-first evaluation methodology, and the grader itself,
come from Raschka's *Build a Reasoning Model (From Scratch)* (§1a). Do not present
"measured runs as re-derivable notebooks" as invented here. Both the paper and `CREDITS.md`
should say where it came from — and saying so *strengthens* the provenance argument rather than
weakening it, because the grading standard is then demonstrably not ours to bend.

**What is ours:** (a) binding those runs to an **authored interactive explanation**, so the
reader manipulates the same measurement the notebook re-derives; (b) **no-GPU re-derivation** —
the HF cookbook, the nearest narrative-plus-code artifact, needs an A100 before a reader sees
anything; (c) a **manifest chain** tying each figure to a run id, notebook sha256, item-set hash,
decoding settings and grader, asserted by tests; and (d) the **shared instrument** — one item
set, one grader, five pages, so the levers are comparable on a single axis (p.16). Every
interactive artifact found either renders one live/loaded run or explains a fixed architecture;
every measured artifact found publishes static figures. **No prior work holds both ends**, and
that conjunction is the defensible claim.

**3. The deck breaks its own thesis.**
Page 15 shows where more compute subtracts, on our own runs, and prints the three controls that
cut our own headline observation down to size; page 16 closes on two unresolved items rather
than a summary. Among explainables this is unusual — the genre's failure mode is advocacy. The
surveys do cover limits (Stop Overthinking, Illusion of Thinking), but they are not the artifact
teaching the lever in the first place. Being the same artifact that both sells and prices the
technique is a positionable contribution.

**Secondary differentiators**, weaker individually but worth a sentence each: the audience
floor (no ML background, versus Raschka's PyTorch prerequisite and CS329A's graduate level);
grounding in a 54-paper systematic review; a graded concept check with retrieval practice, which
no surveyed explorable includes; and zero runtime inference, so the artifact is free to serve and
works offline — relevant to a workshop that values artifacts surviving past the conference.

---

## 12. What a reviewer will push on

Anticipated objections and the honest answer to each.

| Objection | Response |
|---|---|
| "Raschka's book already teaches this." | **Agree, credit it, and say we built on it** — his grader runs in our pipeline and his notebook methodology shaped ours (§1a). The honest framing is that the book is a source, not a rival: it teaches by implementation to a PyTorch-literate reader, we teach by manipulation to a reader with no ML background, and we measure the tradeoff rather than build the method. Any framing that positions it as a competitor invites a provenance challenge we would lose |
| "ReasonGraph already visualizes self-consistency and ToT interactively." | True, and it is our nearest interactive neighbour. It renders the *structure* of one run per method. It plots no accuracy-versus-budget relationship, and it targets practitioner analysis. Cite it, describe it accurately, and state the difference precisely |
| "Weng's and Grootendorst's posts already cover the territory." | They do, better than most, and we should say so. Both are static. Our contribution is that the reader moves the knob, and that the curve they move is ours and re-derivable |
| "The HF post already measured this." | It did, and it is our closest empirical peer. Its figures are static and its runnable path needs an A100. Ours re-derive on no GPU inside an authored explanation |
| "Interactivity does not demonstrably improve learning." | **The strongest objection on the list, and the evidence is on the reviewer's side if we overclaim.** A preregistered 605-participant study found an explorable did not significantly beat the same content as a static PDF (Zhao et al. 2025, p = .642). Do not argue the medium. Argue the mechanisms — prediction elicitation (Kim et al., CHI 2017) and retrieval practice (Roediger & Karpicke) — and concede the gap up front by citing Hohman et al.'s own admission of it. See §10c |
| "Novelty is argued from absence." | Restate as positive scope enumeration: here is what each artifact is about; here is the axis none of them plots. Never as a bare negative — the verification harness killed nine absence-framed claims on exactly this ground |

---

## 13. Verification ledger

**Solid.** VISxAI enumeration (all 8 official program pages fetched, 79 rows, HTML-grepped for
reasoning terms). VIS/HCI systems (fetched paper pages and demos; absences at VIS/CHI/UIST/IUI/
EuroVis checked against program pages). Repo star counts (GitHub API, 2026-09-20). Raschka book
status and chapter list (Manning page + official GitHub repo). Blog explainers (each fetched and
checked page-by-page for interactivity). Transformer Explainer's three venues.

**Qualified.** Three publisher pages returned HTTP 403 (O'Reilly's *Hands-On LLMs* and *AI
Engineering*; the S&S listing for Raschka's reasoning book) — those were verified through
publisher-official GitHub repos instead. *AI Engineering*'s January 2025 date and the HF post's
December 2024 date rest on search results rather than a fetched page. Lambert's print RLHF book
reads as forthcoming with a July 2026 date; **confirm before citing as published**.

**Unverified — do not cite without checking.** Stanford CS372. Any Packt/MIT Press equivalent.
VISxGenAI's 2025 accepted list (not yet enumerated; **worth sweeping before camera-ready**, since
it is the most likely home of a competing agentic/reasoning explorable). Vis-CoT (arXiv
2509.01412) — weak provenance, no code or demo.

**Known dead links.** 11 of the 79 VISxAI URLs are dead or unreachable, mostly 2018–2019 entries.

**Corrections to make in existing submission materials.** CNN Explainer, GAN Lab, and TensorFlow
Playground are **not** VISxAI submissions; Diffusion Explainer was VISxAI 2023 accepted but not a
Hall of Fame winner. `web/CREDITS.md` currently lists TensorFlow Playground among pedagogy
influences, which is fine as an influence — but none of these four should be described as venue
precedent.

**Coverage note.** The 114-agent harness produced verified claims in only three of eight
requested categories; categories 4–8 were covered instead by four targeted cataloguing agents
whose results are recorded above. Nine negative claims were voted down as arguments from
absence, with the positive scope descriptions of the same artifacts confirmed — a
verification-protocol artifact, not a substantive refutation.

**Four tool names do not exist.** Early drafts of the search brief speculatively named
"ThoughtFlow", "ReasonViz", "TraceViz", a published "Tree-of-Thought visualizer", and an academic
"AgentOps". None is real. They are recorded here so they do not resurface in a later draft.

---

## 14. Recommended next actions

1. **Sweep VISxGenAI 2025's accepted list** before camera-ready. It is the single most likely
   home of a competing agentic or reasoning explorable, and it is the one real hole left in the
   novelty argument.
2. **Rewrite the novelty claim as positive scope enumeration**, per §0. Never as a bare negative.
3. **Rewrite the interactivity justification** per §10c — mechanisms, not medium. As written, the
   design-rationale table in `SUBMISSION.md` is defensible, but any prose claiming interactivity
   beats static text would not survive a reviewer who knows Zhao et al.
4. **Add Sebastian Raschka to `web/CREDITS.md`** — the highest-priority correction in this
   report. His ch03 grading functions run unchanged in the measurement pipeline and the
   notebook-first methodology derives from the book, yet the top-level credits file does not name
   him. `notebooks/README.md` and page 8 already do it right; the credits file and the paper's
   acknowledgements need to match. Then re-scope the differentiation claim per §11.2 so the
   inherited method is not presented as invented here.
5. **Fix the four venue attributions** in §2 wherever they appear in submission materials.
6. **Confirm Lambert's print RLHF book status** and the two date citations flagged in §12 before
   any of them enter a bibliography.
