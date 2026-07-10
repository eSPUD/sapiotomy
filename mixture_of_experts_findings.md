# Mixture of Experts (MoE)

**Visual grammar:** Spatial/routing — tokens flowing through a gate and fanning out across parallel expert blocks, layer after layer. Secondary grammar: distributional (load across experts, specialization patterns over thousands of tokens). This is fundamentally about *where computation goes*, which makes it natural Sankey/flow-map territory.

## What it is

MoE replaces the single feed-forward network in each transformer layer with many parallel "expert" FFNs plus a small learned router that sends each token to only the top-k experts (often 2 of 8+). This decouples parameter count from compute: Mixtral 8x7B gives each token access to 47B parameters while actively using only ~13B per inference step. It's why frontier labs can scale total capacity without proportionally scaling the cost of every token — most major frontier models (DeepSeek-V3, Mixtral, and by broad consensus GPT-4-class models) are MoEs, making this arguably the most economically consequential architecture choice in modern LLMs that the public has never seen the inside of.

## Prior tools

Only tools that use visualization to explain how the technique works. Unlike inference-time scaling, this list is *not* empty — the pedagogical quadrant is partially occupied:

- **Grootendorst, "A Visual Guide to Mixture of Experts"** — thorough illustrated walkthrough of experts, routing, load balancing, and expert capacity. [static] · learners. The best explanation that exists; you read it, you don't operate it.
- **Brenndoerfer, "Top-K Routing" interactive chapter** — book-style chapter on gating and top-k selection with interactive elements (adjustable tooltip density, embedded widgets). [interactive, lightly] · learners. Interaction serves the reading experience more than the mechanism.
- **Tech Jacks MoE explainer (2026)** — includes a "router visualizer" with illustrative numbers to convey sparse activation; self-described as not measuring any specific model. [interactive] · learners. The routing is *invented for the diagram*, not real model behavior.
- **MixtureKit token-routing visualizer** — Streamlit interface showing real color-coded token-to-expert assignments and expert-weight aggregation across layers. [interactive] · practitioners/researchers. Real routing data, but built for people training MoEs, and it explains a *specific model's* decisions rather than teaching the mechanism.

(Routing visualizations also appear as static figures inside papers — OpenMoE's token-ID routing plots, MoTE's modality-routing distributions, patch-routing grids in vision MoE — but those are findings-communication, not standalone explainers.)

## Gaps identified

### Structural gap

The quadrant isn't empty — it's *shallow*. What exists teaches the textbook mechanism (router → top-k → weighted sum) either statically or with toy numbers. The missing artifact is the one where a learner explores *real routing behavior from a real model* interactively — MixtureKit has the real data but a researcher audience; the learner-facing pieces have the audience but fake data. Nobody has closed that loop, which is exactly the loop Transformer Explainer closed for attention.

### Under-visualized phenomena

The folk understanding of MoE is wrong in a specific, visualizable way:

1. **Experts aren't subject-matter experts.** Everyone's mental model is "the math expert handles math." In reality an expert is not specialized in a domain like psychology or biology — it learns token-level, largely syntactic patterns. A demo that lets you *hunt* for the "math expert" and fail — then discover the "punctuation expert" — directly attacks the misconception baked into the architecture's own name. Best single "aha" in the topic.
2. **Routing is contested science, live right now.** OpenMoE found routing dominated by token identity regardless of context ("Context-Independent Specialization"), with assignments fixed early in training. But 2026 work refines and partially contradicts this: token identity dominates input layers while middle layers are clearly context-dependent, and other analyses argue the context-independence finding was an artifact of insufficient training. An explorable could let users run this experiment themselves — same token, different contexts, layer by layer — putting them inside an open research question rather than a settled textbook.
3. **Load balancing and its pathologies.** Routers suffer rich-get-richer dynamics leading to expert collapse and straggler experts; the fix (auxiliary balance losses, capacity limits) causes its own casualties — "Drop-towards-the-End," where tokens late in a sequence get dropped because experts hit capacity. Your tokens getting *silently dropped* by a capacity limit is vivid, mechanical, and almost never explained. Great simulation material.
4. **The parameters-vs-compute decoupling.** The "47B total, 13B active" arithmetic is recited constantly but never *felt* — a fan of experts where you drag k and expert-count and watch total vs. active parameters diverge is trivially simple and fixes the most common confusion in every MoE comm thread (the recurring trap of quoting total parameters as if they were compute cost).

## Visualization paths

### Path A — "There Is No Math Expert" (routing atlas of a real model)

- **Core interaction:** Type or pick from curated prompts; watch tokens light up a token-to-expert Sankey through the layers of a real small MoE (e.g., Qwen-MoE-mini / OLMoE / Mixtral, traced offline). Flip contexts on the same token; compare routing by layer. A "find the domain expert" challenge mode that lets the user's own hypothesis fail.
- **The "aha":** Experts specialize in tokens and shallow patterns, not subjects — and whether context matters depends on *depth*, which is an open research question you just explored.
- **Under the hood:** Pre-computed routing traces over a curated prompt set (run an open MoE once, log all gate decisions, ship JSON). No live model needed.
- **Build difficulty:** Medium. The trace pipeline is a weekend (open MoEs expose router logits); the Sankey-with-layers UI is the main lift.

### Path B — "The Balancing Act" (load-balancing simulator)

- **Core interaction:** A stream of tokens flows into a bank of experts. Sliders for auxiliary-loss strength, capacity factor, and top-k. Watch expert collapse happen with balancing off (rich-get-richer in real time), then watch capacity limits start dropping late-sequence tokens as you tighten them.
- **The "aha":** Load balancing isn't bookkeeping — it's a genuine tension where every fix has a casualty, and your prompt's last tokens can be the ones paying.
- **Under the hood:** Pure simulation — a toy router with real dynamics (the failure modes reproduce with simple math). No model at all.
- **Build difficulty:** Low-medium. Closest in spirit to classic Distill explorables; the most buildable proposal generated so far across both topics.

### Path C — "47B on the shelf, 13B in your hand" (sparsity intuition widget)

- **Core interaction:** Drag expert count and k; watch total vs. active parameters, memory footprint, and per-token FLOPs diverge, with real model presets (Mixtral, DeepSeek-V3, Switch).
- **The "aha":** Parameters and compute are different axes, and MoE is the wedge between them.
- **Under the hood:** Pure arithmetic.
- **Build difficulty:** Low — but likely too thin to carry a whole submission alone; better as the opening act *inside* Path A or B.

### Adjacent directions

DeepSeekMoE's fine-grained + shared-expert design (visualizing *why* shared experts exist); expert-choice vs. token-choice routing as a duel; Soft-MoE's fully-differentiable mixing; upcycling dense models to MoE; MoE inference economics (expert offloading, why middle-layer experts should stay GPU-resident).

## Key sources

- Shazeer et al. 2017, "Outrageously Large Neural Networks: The Sparsely-Gated Mixture-of-Experts Layer" — the founding paper.
- Fedus et al., "Switch Transformer" — load-balancing loss, capacity factor.
- Xue et al. 2024, "OpenMoE: An Early Effort on Open Mixture-of-Experts Language Models" (arXiv:2402.01739) — routing analysis: Context-Independent Specialization, Early Routing Learning, Drop-towards-the-End.
- "The Myth of Expert Specialization in MoEs" (arXiv:2604.09780) and "Layer-wise MoE Routing Locality under Shared-Prefix Code Generation" (arXiv:2604.17182) — the 2026 counter-evidence on routing.
- Grootendorst, "A Visual Guide to Mixture of Experts (MoE)" — the static baseline to beat.

## Strategic read

MoE's gap argument is *weaker* than inference-time scaling's ("shallow quadrant" vs. "empty quadrant") — but its best proposals are *stronger on buildability*, and Path A has the most Transformer-Explainer-shaped profile of anything so far: real model internals, misconception-killing, tied to a live research dispute. Paths A and B are both genuine contenders for the final five.
