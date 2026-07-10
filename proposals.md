# VISxAI 2026 — Five Explorable Proposals

Five standalone proposals, each fusing two or three of the scouted visualization paths into a single narrative piece. Every proposal is written for a reader who arrives knowing nothing about the field and leaves with a working mental model. None depends on any other.

Two of the five come from inference-time scaling — deliberately: it is the topic with the least competition of the six scouted (one static guide against a paradigm that has defined frontier AI since o1, and zero interactive pedagogy). The two pieces share no paths, no data, and no visual grammar: one is a statistical simulation about *spending* compute, the other an intervention lab on real reasoning traces asking whether the "thinking" is real.

---

## Priority order

Each proposal scored 1–5 on four categories. **Feasibility** — buildable by a solo author in 8–12 effective person-days, writing included. **Wow factor** — strength of the on-screen surprise; would a reader share it? **Novelty** — does it show something available nowhere else, in any format? **Audience breadth** — who can walk in cold and get the aha?

| Priority | Proposal | Topic | Feasibility | Wow | Novelty | Audience | Total |
|----------|----------|-------|-------------|-----|---------|----------|-------|
| **1** | The Astrid Problem | RLHF/DPO | 4 | 5 | 5 | 5 | **19** |
| **2** | When Thinking Harder Makes It Worse | Inference-time scaling | 5 | 4 | 4 | 4 | **17** |
| **3** | There Is No Math Expert | MoE | 3 | 4 | 4 | 5 | **16** |
| **4** | The Reasoning Illusion | Inference-time scaling | 2 | 5 | 5 | 4 | **16** |
| **5** | Two Kinds of Memory | Mamba hybrids | 2 | 5 | 5 | 3 | **15** |

**Rationale.**

1. **The Astrid Problem** is the only proposal strong in all four categories at once: an original finding (novelty 5) that any chatbot user can feel (audience 5), with a meme-ready emblem (wow 5), on an inference-only pipeline with a day-1 go/no-go pilot (feasibility 4). Nothing else combines a real discovery with this little risk.
2. **When Thinking Harder Makes It Worse** is the bankable anchor: pure simulation, zero pipeline (feasibility 5), and a genuinely counterintuitive reveal — the accuracy curve bending *down* as compute grows. It trades a point of novelty (simulation over original data) for near-certainty of shipping.
3. **There Is No Math Expert** has the broadest cold-open hook on the slate ("8 experts… in what?") and real model internals, but its layered routing UI is the biggest frontend lift, capping feasibility at 3. Its risk is scope, which is cuttable — that breaks the tie with #4, whose risk is not.
4. **The Reasoning Illusion** is the highest-ceiling piece: unshown anywhere, safety-relevant, and the strongest single surprise (cut the AI's "thinking" short — the answer often doesn't change). It sits fourth because its risks stack: a heavy intervention-grid pipeline *and* contested science demanding careful framing. Build only with proven early runway.
5. **Two Kinds of Memory** matches #4's wow and novelty but is the only proposal requiring model training, and its topic ("Mamba hybrids") has the narrowest walk-in audience. Its two-day training timebox and no-training fallback keep it viable, not leading.

If only one gets built, build #1; #2 is the fallback if #1's day-1 pilot fails.

---

## Proposal 1 — The Astrid Problem
### How teaching an AI to be helpful makes every story the same

**One-line pitch.** Sample the same model family hundreds of times at each stage of its training — raw, instruction-tuned, preference-aligned — and show the reader, with real data, how its imagination narrows until every heroine is named Astrid.

**Audience & prerequisites.** Curious public and practitioners; assumes only that the reader has used a chatbot. No math, no ML background.

### The reader's journey

**Opening question:** *"Why do AI stories all feel the same?"*

- **Act 1 — Meet Astrid.** The piece opens with the phenomenon, not the theory. The reader presses a button: "Ask the model to invent a character." A real sampled response appears. They press it again. And again. By the fifth press, they've met two Astrids. A counter tracks it live: this model names its heroine Astrid more than one time in ten. The reader has the mystery before they have a single term of jargon.
- **Act 2 — Three siblings.** Plain-language interlude: every chatbot began life as an autocomplete engine (the *base* model), was then taught to follow instructions (*SFT*), and finally taught human *preferences* — shown pairs of its own answers, with the one people liked reinforced. Three portraits of the same model at three ages. No equations; the pipeline is three sentences because the pipeline is not the story.
- **Act 3 — The receipts.** The centerpiece. Hundreds of real samples from each sibling on identical creative prompts (invent a persona, open a story, name a startup). The reader drags a single control — *training stage* — and watches the distributions move: name-frequency bars spiking from a flat field into an Astrid tower; a cloud of response embeddings collapsing from a scattered nebula into tight clumps. Hovering any point shows the actual sampled text, so the abstraction never detaches from real words. A temperature slider offers the obvious fix — and the reader watches it fail: crank it up and the text degrades into nonsense before the variety comes back.
- **Act 4 — Why it happens: the leash.** A toy simulation makes the mechanism visible. A 2D landscape of possible responses; a policy distribution sitting on it; a slider for the strength of the tether binding the model to its original self (the KL leash). Preference training is mode-seeking by construction — the reader tightens the leash and watches the model barely move; loosens it and watches the distribution slide off the intended peak into a crack in the reward landscape, collapsing onto whatever the judge over-rewards. The Astrid tower from Act 3 reappears, now legible as the footprint of this dynamic in a real model.
- **Knowledge gained.** The reader leaves knowing: what base, instruction-tuned, and aligned models are; that alignment is a *trade* — reliability bought with variety; why temperature can't undo it; and that diversity collapse is a live research problem with named attempts at fixes (DivPO). They arrived wondering why AI stories feel samey; they leave able to explain it mechanistically.

### Visualization paths incorporated
- **The Astrid Problem** (RLHF path A) — Acts 1 and 3, the core data essay.
- **The Leash** (RLHF path C) — Act 4, repurposed from standalone widget to the "why" chapter the data demands.

### Under the hood
Inference-only, no training. Sample public checkpoint families with clean stage separation (OLMo-2 / Tülu: base → SFT → DPO) a few hundred times per prompt offline; embed and project responses; ship JSON. The leash is pure simulation. Day-1 pilot (~50 samples × 2 prompts) validates stage-wise narrowing before committing.

### What's new
The RLHF pipeline is explained to death everywhere; what preference optimization *does to a model's output distribution* exists only as scattered paper figures (Diverse Preference Optimization's name histograms, stage-attribution studies). No explanatory synthesis exists in any format — this gap was never about interactivity. Contribution play: **original mini-experiment** (Forma Fluens lane) with the author's own sampled data.

### Build plan (~9 effective days)
Sampling pipeline 1.5 · embedding/projection + distribution views 2.5 · leash simulation 1 · writing & narrative integration 4.

### Risks & mitigations
Chosen family shows muddy stage separation (collapse already at SFT) → use fully open stage-wise checkpoints and pilot on day 1; the Astrid prompt itself is a published reproduction anchor. Scope lever: Act 4 is severable — the data essay stands alone if time runs short.

### Key sources
Lanchantin et al., *Diverse Preference Optimization* (arXiv:2501.18101) · *Where Does Output Diversity Collapse in Post-Training?* (arXiv:2604.16027) · Rafailov et al. 2023 (DPO) · Lambert, rlhfbook.com (the static baseline).

---

## Proposal 2 — When Thinking Harder Makes It Worse
### The hidden economics behind the "thinking…" spinner

**One-line pitch.** Give the reader a budget knob for an AI's thinking, let them watch accuracy climb and plateau — then hand them the verifier-quality knob and let them discover the field's ugly secret: with a weak judge, more thinking makes the answer *worse*.

**Audience & prerequisites.** Anyone who has watched a chatbot "think" and assumed longer means better; practitioners deploying best-of-N. No background assumed.

### The reader's journey

**Opening question:** *"When the AI says it's 'thinking,' what is it actually doing — and is more always better?"*

- **Act 1 — What thinking buys.** One math problem, one slider: *thinking budget*. As the reader drags it, they watch the two basic ways a frozen model can spend extra compute: parallel samples fanning out and voting (many drafts, majority wins), and a sequential chain growing and second-guessing itself. A live accuracy-vs-tokens curve traces under each. The universal shape emerges under their fingers: steep early gains, then plateau. Diminishing returns isn't asserted; it's felt. (Curves seeded from published results, cited inline with the controls.)
- **Act 2 — The hidden character.** A narrative pivot: all that sampling only helps if *someone picks the right answer* from the pile. Enter the verifier — the judge that scores candidates. The reader is shown what they'd been glossing over in Act 1: every "vote" was really a selection step, and selection has been doing the heavy lifting all along.
- **Act 3 — The betrayal.** The centerpiece. Best-of-N with two knobs: *N* (how many samples) and *verifier quality*. With a strong judge, accuracy climbs with N — the reader reproduces Act 1's optimism. Then they degrade the judge and watch the curve bend over and *decline*: individual samples render as dots streaming through the verifier, and the reader can see exactly why — wrong-but-convincing answers slip through as false positives, and with enough samples, false positives *always* eventually win the pile. More compute became more ways to be confidently wrong.
- **Knowledge gained.** The reader leaves knowing: what test-time compute is and its two basic strategies; that returns diminish and how fast; that generation is not the bottleneck — *selection* is; and therefore why AI labs pour effort into verifiers and reward models, and why "the model thought for five minutes" is not a guarantee of anything. The spinner is demystified into an economic trade the reader can now reason about.

### Visualization paths incorporated
- **The Budget Knob** (inference-time scaling path A, simulation-seeded light version) — Act 1, the on-ramp.
- **Verifier Failure / "When Sampling More Makes It Worse"** (path B) — Acts 2–3, the core.

### Under the hood
Pure simulation throughout — no models, no pipeline. Per-problem solve rates and verifier true/false-positive rates seeded from published results (Brown et al.'s coverage scaling; Stroebl et al.'s imperfect-verifier limits; Snell et al.'s compute-optimal curves), with citations displayed beside the controls. Stretch goal only: replace Act 1's seeded curves with real traces from a small open reasoning model.

### What's new
Against a paradigm that has defined frontier AI since o1, exactly one static guide exists and zero interactive pedagogy. The non-monotonicity result — extra samples *hurting* under an imperfect verifier — lives only in research-paper fragments; it has never been given an explanatory treatment in any format. Contribution play: **craft/simulation with real published stakes** — the classic Distill shape, a clean statistical mechanism with a counterintuitive punchline.

### Build plan (~8 effective days)
Simulation core 1 · budget-knob act 1 · verifier act with sample-dot mechanics 2 · writing & narrative integration 4.

### Risks & mitigations
The simulation reads as a toy → every parameter is a cited published number, shown in the interface, not buried in footnotes. Scope lever: Act 1 can shrink to a single strategy without losing the arc.

### Key sources
Snell et al. 2024 (arXiv:2408.03314) · Brown et al. 2024, *Large Language Monkeys* · Stroebl et al. 2024 (imperfect verifiers) · Zhang et al. 2025 survey (arXiv:2503.24235) · Grootendorst, *A Visual Guide to Reasoning LLMs* (static baseline).

---

## Proposal 3 — There Is No Math Expert
### A guided hunt through the inside of a mixture-of-experts model

**One-line pitch.** The reader arrives believing "8 experts" means a committee of specialists, goes hunting for the math expert in a real model's routing data, fails, finds the punctuation expert instead — and leaves understanding the most economically consequential architecture choice in modern AI.

**Audience & prerequisites.** The very broad public that has read "GPT-4 is rumored to be a mixture of experts" plus practitioners reading model cards. No background assumed.

### The reader's journey

**Opening question:** *"Model cards brag about '8 experts.' Experts in what?"*

- **Act 1 — The trick that made models huge.** Before the hunt, the arithmetic — made physical. A fan of expert blocks; two draggable controls (how many experts, how many actually fire per token); two numbers diverging as the reader drags: *parameters on the shelf* vs *parameters in your hand*. Presets snap to real models — Mixtral's 47B-total/13B-active, DeepSeek-V3. In ninety seconds the reader owns the one fact every news article garbles: capacity and per-token cost are different axes, and MoE is the wedge between them. And it plants the question the rest of the piece answers: a tiny learned *router* decides where each token goes — deciding *what*, exactly?
- **Act 2 — The hunt.** The centerpiece, on real data. Routing traces from a real open MoE (every gate decision logged offline), rendered as tokens flowing through experts, layer by layer. The reader is handed the folk hypothesis as a challenge: *find the math expert.* They feed the model arithmetic, then poetry, then code, watching which experts light up — and the hypothesis dies in their hands. No expert owns math. But patterns *do* emerge: an expert that fires on punctuation, one on numbers-as-tokens, one on connective tissue. The specialists are real — they're just specialists in *token shapes*, not school subjects.
- **Act 3 — Deeper down, the plot complicates.** A layer scrubber. In early layers, routing follows token identity almost regardless of context; in middle layers, context starts to matter — the same token routes differently in different sentences. The piece is explicit that this is an open research dispute (2024's "context-independent specialization" vs 2026's layer-wise counter-evidence), and the reader has just run the experiment at the heart of it themselves.
- **Act 4 — The price of fairness.** If routing is learned, what stops every token from crowding the same few experts? Nothing — that's the failure mode. A closing simulation: a token stream flowing into an expert bank, a balancing-strength slider. Balancing off: rich-get-richer collapse, live, most experts starving. Balancing on, capacity limits tightened: the fix quietly *drops tokens* — and it's the end of the reader's own prompt that pays. The architecture's elegance is real, and so are its casualties.
- **Knowledge gained.** The reader leaves knowing: what MoE is and why frontier labs use it (capacity without proportional compute); that "expert" means a learned traffic pattern over token shapes, not a subject-matter specialist; that where routing is context-sensitive is an open scientific question they have first-hand feel for; and that load balancing is a genuine engineering tension. They can now read a model card and correct the room.

### Visualization paths incorporated
- **Sparsity Widget / "47B on the shelf"** (MoE path C) — Act 1, the on-ramp its own file recommended.
- **Routing Atlas / "There Is No Math Expert"** (path A) — Acts 2–3, the core.
- **The Balancing Act** (path B) — Act 4, compressed to its sharpest beat.

### Under the hood
Act 1 is pure arithmetic. Acts 2–3 are pre-computed routing traces: run an open MoE (OLMoE / Qwen-MoE) once over a curated prompt set, log all router decisions, ship JSON — router logits are exposed, so this is inference-only logging. Act 4 is pure simulation (the pathologies reproduce with simple math).

### What's new
The learner-facing MoE explainers use invented routing numbers; the real-routing tools target researchers. Nobody has closed the loop Transformer Explainer closed for attention: *real model behavior, learner audience*. The misconception under attack is baked into the architecture's own name. Contribution play: **research communication with real experimental data** (Patchscopes lane).

### Build plan (~10 effective days)
Trace pipeline 1.5 · routing UI 3 · sparsity + balancing acts 1.5 · writing & narrative integration 4.

### Risks & mitigations
The layered routing view blows the frontend budget → cut to a single-layer view with a scrubber; the hunt-and-fail challenge is the essence, the full flow map is decoration. Acts 1 and 4 are severable scope buffers.

### Key sources
Xue et al. 2024, *OpenMoE* (arXiv:2402.01739) · *The Myth of Expert Specialization in MoEs* (arXiv:2604.09780) · layer-wise routing locality (arXiv:2604.17182) · Fedus et al., *Switch Transformer* · Grootendorst, *A Visual Guide to MoE* (static baseline).

---

## Proposal 4 — The Reasoning Illusion
### Cut the AI's thinking short and see if it notices

**One-line pitch.** Hand the reader a scalpel and a real reasoning trace: cut the model's "thinking" short, corrupt a step, force it to think longer — then reveal whether the answer changes. Often it doesn't, and that discovery drops the reader into AI safety's most consequential live debate.

**Audience & prerequisites.** Everyone who has watched a reasoning model narrate its work and believed they were watching it think; AI safety researchers debating chain-of-thought monitoring. No background assumed — the piece supplies it.

### The reader's journey

**Opening question:** *"When the AI shows its work, is that actually how it got the answer?"*

- **Act 1 — Reading the mind.** A real reasoning trace from an open model, presented the way users experience it: a math problem, then paragraphs of visible "thinking" scrolling past — *let me reconsider… wait, that's wrong…* — then the answer. The reader's walk-in belief is stated out loud, because it's everyone's: the answer came *from* these steps, the way showing your work works at school. The piece invites that trust. Then it hands over a scalpel.
- **Act 2 — The scalpel.** The centerpiece. The trace becomes an instrument the reader operates on, every intervention pre-computed so results are instant. **Cut:** drag a truncation point — amputate the last 10%, 30%, half of the thinking — and reveal whether the final answer survives. **Corrupt:** flip a number or negate a claim in a middle step and watch whether the damage propagates or gets silently ignored. **Extend:** force the model to think *longer* by injecting "wait…" and see whether more deliberation changes anything. The first time an amputated chain produces the identical answer, the reader's school-workbook model of AI reasoning cracks.
- **Act 3 — Zooming out: the reasoning horizon.** One surviving answer could be a fluke, so the piece aggregates: survival curves across the full curated problem set showing how often answers survive losing the last N% of their thinking — the documented "reasoning horizon," past which tokens have little causal influence. Crucially, the framing is honest in both directions: the reader is also shown problems where truncation *kills* the answer, because faithfulness is a spectrum and task-dependent, not a gotcha. The reader ends this act holding a calibrated, evidence-shaped view of a genuinely contested question.
- **Act 4 — Why this argument matters.** The stakes, briefly and concretely: a leading AI safety strategy is to *monitor* models' chains of thought for signs of deception or dangerous planning. That strategy presumes the thinking on screen is the computation. The reader has just spent ten minutes generating the evidence for why that presumption is contested — they arrived unable to define chain-of-thought and leave inside the strongest version of both sides of a live safety debate.
- **Knowledge gained.** The reader leaves knowing: what chain-of-thought and reasoning models are; that stated reasoning can be post-hoc narration rather than the computation itself; what the reasoning horizon is; that faithfulness varies by task rather than being simply true or false; and why CoT monitoring is simultaneously promising and fragile as a safety tool. They also leave having *run the experiment*, not read about it.

### Visualization paths incorporated
- **Faithfulness Lab / "The Reasoning Illusion"** (inference-time scaling path C) — Acts 1–3, the core.
- **Budget forcing / "wait" injection** (the same file's adjacent direction, s1-style) — the *extend* intervention in Act 2, completing the scalpel set: cut, corrupt, extend.

### Under the hood
Pre-computed intervention grids on a small open reasoning model (e.g., a DeepSeek-R1-Distill variant): for each curated problem, run once per (truncation point × corruption type), plus "wait"-extension runs, using prefill surgery to force answers from modified traces; ship all outcomes as JSON. Heavy but entirely offline — nothing live.

### What's new
Nothing like it exists in any format: the faithfulness findings (Lanham et al., Chen et al.) live purely in research papers, and no tool anywhere lets a reader intervene on a reasoning trace and watch the consequence. It is the highest-ceiling piece on the slate — safety-relevant, misconception-killing, and connected to a debate happening *now*. Contribution play: **original mini-experiment** on contested science, framed as "run it yourself."

### Build plan (~11 effective days)
Intervention-grid pipeline + prompt surgery 3.5 · trace-scalpel UI + survival curves 2.5 · writing with careful epistemic framing 5 (deliberately more than the other proposals — the framing *is* the piece).

### Risks & mitigations
Two stacked risks make this the slate's high-risk/high-ceiling entry. (1) The chosen model shows weak or messy truncation effects → weekend-1 pilot on a handful of problems before committing; small distilled reasoning models keep grid compute tractable. (2) Contested science invites overclaiming → the piece shows faithful cases alongside unfaithful ones, anchors every aggregate to the published literature, and frames conclusions as the debate's actual shape rather than a verdict. Scope lever: the *corrupt* and *extend* interventions are severable; *cut* alone carries the aha.

### Key sources
Lanham et al. 2023, *Measuring Faithfulness in Chain-of-Thought Reasoning* · Chen et al. 2025, *Reasoning Models Don't Always Say What They Think* (arXiv:2505.05410) · Muennighoff et al., *s1* (budget forcing) · Zhang et al. 2025 survey (arXiv:2503.24235) · Grootendorst, *A Visual Guide to Reasoning LLMs* (static baseline).

---

## Proposal 5 — Two Kinds of Memory
### Watch an AI forget — and why the transformer's successor is a hybrid

**One-line pitch.** Plant a fact in an AI's memory and watch two architectures handle it side by side — one writing an ever-growing perfect ledger, one squeezing everything into a fixed-size summary that must overwrite to survive — then watch a single ledger layer rescue the forgetful one, and understand why every frontier "post-transformer" model is a hybrid.

**Audience & prerequisites.** Architecture-curious readers and practitioners parsing "hybrid Mamba-transformer" in model announcements. No background assumed.

### The reader's journey

**Opening question:** *"Chatbots slow down and cost more as conversations grow. Why — and what's the fix everyone is shipping?"*

- **Act 1 — The duel.** Two memories, one story. The reader plants a fact — *the key is under the blue vase* — and streams a story past both architectures. On the left, the transformer's memory: a ledger visibly appending every single word, with a cost meter climbing and climbing (this is the KV cache, and it is *why* long chats get slow and expensive). On the right, the challenger (Mamba): a fixed-size state rendered as a heatmap that never grows — it *overwrites*. At any moment the reader hits **Quiz**: *where's the key?* The ledger answers perfectly, forever. The state answers... at first. As distance and interference accumulate, the reader watches the fact literally fade out of the heatmap — the first time anyone has been shown a state-space model forgetting, live.
- **Act 2 — It isn't dumb, it's choosy.** Why does the fixed-size state work at all? Because it *selects*. Replaying the stream, each incoming token now glows with its write strength: the model visibly declines the filler and commits the payload — the blue vase burns bright, the weather report barely flickers. Then the reader toggles selectivity off, and everything smears into everything; the planted fact drowns immediately. The magic isn't the state — it's the learned judgment about what deserves it.
- **Act 3 — The negotiated settlement.** Neither side wins the duel: perfect recall at ruinous cost versus constant cost with fading recall. The resolution is on screen: flip on a *hybrid* — mostly state layers, with a single ledger layer woven in — and re-run the quiz. Recall comes back, at a sliver of the ledger cost. A ratio dial finishes the argument: drag the attention:Mamba mix and watch three gauges (recall, memory at long context, throughput), with presets snapping to real production models — Jamba's 1:7, Nemotron-H. Every frontier hybrid independently converged on attention-sparse designs, and the reader now feels why.
- **Knowledge gained.** The reader leaves knowing: what the KV cache is and why it makes long context expensive; what a state-space model is *behaviorally* — constant memory bought with necessary forgetting; that selectivity, not the state, is Mamba's real invention; and why hybrids at skewed ratios are the emerging settlement. The next "hybrid architecture" headline will parse on sight.

### Visualization paths incorporated
- **Memory Duel / "Two Kinds of Memory"** (Mamba path A) — Acts 1 and 3's quiz mechanics, the core.
- **Selectivity / "What the Model Chose to Remember"** (path C) — Act 2, as the opening-act fold-in its own file suggested.
- **Ratio Dial** (path B) — Act 3's closer, seeded from published ablations.

### Under the hood
The only proposal requiring training — at toy scale. A tiny SSM/attention pair trained offline on synthetic recall tasks (minutes of training; established recipes in the associative-recall literature); state trajectories and quiz outcomes ship as pre-computed JSON, small enough to ship raw. The ratio dial is simulation seeded from published ablations (Jamba, Nemotron-H), cited inline.

### What's new
The hybrid quadrant is empty in *every* format — Jamba-class models exist only as paper figures and blog prose. Deeper, all prior Mamba pedagogy teaches the mathematics; nobody has ever made the *state itself* inspectable, which is the thing that lets a learner feel why hybrids need attention at all. The strongest lineage claim on the slate: the sequel to Transformer Explainer, for the architecture class succeeding it. Contribution play: **superior pedagogy powered by an original toy experiment**.

### Build plan (~11 effective days)
Toy training + iteration 2.5 · duel UI with quiz mechanics 3 · selectivity + ratio acts 1.5 · writing & narrative integration 4.

### Risks & mitigations
The toy model doesn't produce clean forget-vs-retain behavior → hard two-day timebox using established recall-task recipes; if the effect isn't clean by then, the piece re-scopes around the ratio dial and published numbers (no training), preserving the topic at lower ceiling. Act 2 is a severable scope buffer.

### Key sources
Gu & Dao 2023, *Mamba* · Lieber et al., *Jamba* (ICLR 2025) · NVIDIA, *Nemotron-H* (2025) · memory-recall hybrid analysis (arXiv:2510.26912) · Waleffe et al. (arXiv:2406.07887) · Grootendorst, *A Visual Guide to Mamba* (static baseline).
