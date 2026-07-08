# The Context Window (Agent Context Engineering)

**Visual grammar:** Spatial — allocation of a finite resource, a strip of tokens partitioned into regions. Secondary grammar: temporal (loading, eviction, and compaction across a task lifecycle — demand paging) and positional (where in the strip something sits determines whether the model attends to it). Distinct from inference-scaling's trajectory grammar and MoE's routing grammar.

## What it is

Everything an agent knows at any moment lives in its context window — system prompt, AGENTS.md instructions, skill definitions, retrieved documents, tool results, conversation history — and that window is a finite, contested resource. Context engineering is the discipline of deciding what enters it, when, and where: skills load via three-level progressive disclosure (~80-token metadata stubs at startup, ~2,000-token bodies swapped in on demand, reference files fetched only when needed), RAG injects retrieved chunks at query time, and old material gets compressed or evicted under pressure. It matters because "more context" measurably hurts: models attend poorly to the middle of long inputs and degrade as inputs grow even when the evidence is perfectly placed — so an agent's competence is substantially a memory-management problem.

## Prior tools

Only tools that use visualization to explain how the technique works. The quadrant is occupied by *accounting*, not *explanation* — most tools show where tokens go without explaining why it matters:

- **context-engineering-visualizer (mcikalmerdeka)** — explicitly educational Gradio app: live chat with a stacked-container breakdown of the assembled context (system, RAG chunks, memory, tools, query), real FAISS retrieval, smart truncation. [interactive] · practitioners/learners. Closest prior art. Shows the *composition* of one request; doesn't show dynamics over a task, progressive disclosure, or any consequence of the allocation.
- **Damien Henry's context-window comparator** — generates a scrollable text block matching a model's token limit, turning "1M tokens" into something you can feel by scrolling. [interactive] · learners. Explains exactly one thing — scale — and does it well.
- **Static explainer diagrams** — the progressive-disclosure three-tier tables in the SwirlAI / Marcel Castro blog literature, RAG pipeline flowcharts everywhere. [static] · learners/practitioners.

Excluded by the inclusion test, but abundant: token-budget calculators and allocation dashboards (AI Dev Hub, Developers Digest, claude-context-visualizer's gauges and compaction simulator) — planning utilities, not mechanism explanations; and Letta's ADE context viewer — real agent introspection, but product debugging for its own framework.

## Gaps identified

### Structural gap

Existing tools answer *"where do my tokens go?"* Nobody answers the two questions that make the topic intellectually alive: *"why does it matter where they go?"* (the attention science) and *"how does an agent manage this over time?"* (the paging story). Composition without consequence, snapshots without dynamics. And nothing learner-facing connects the engineering practice to the research that justifies it — the blog canon cites "lost in the middle" constantly, but no one has made it operable.

### Under-visualized phenomena

1. **Lost in the middle / the U-curve.** Accuracy on multi-document QA follows a U-shape in evidence position — high at the start and end, 20–30+ points lower in the middle — replicated across six model families, with a mechanistic account in RoPE's long-term decay plus softmax amplification. The single most famous finding about context windows, drawn as a static curve in every blog post, never once made draggable: *put the fact where you want; watch accuracy move.*
2. **Context rot is length, not just position.** Distinct failure mode routinely conflated with #1: accuracy declines as input grows *even when the evidence is fixed and favorably placed* — one controlled study fell from 0.92 to 0.68 going from a few hundred to three thousand tokens, and Chroma's 18-model study found every frontier model degrading at every length increment. The punchline for a demo: padding the context with *irrelevant filler* hurts, which annihilates the intuition "it fits, so it's fine."
3. **Progressive disclosure as demand paging.** The three-tier skill economics — all 17 of Anthropic's official skills discoverable for ~1,700 tokens, less than one activated body — is an OS page-swap running in natural language. Nobody has animated it: stubs flickering resident, a body swapping in on activation, references faulting in on demand.
4. **Compaction and its casualties.** Eviction, summarization, and /compact-style compression keep a long-running agent alive, but every strategy loses something different (keep-recent loses the plan; summarize loses detail an agent later needs). The trade-off has never been shown as a *choice the user makes and then pays for*.

## Visualization paths

### Path A — "Lost in the Middle" (the draggable U-curve)

- **Core interaction:** A visual context strip with one crucial fact the user drags to any position; a live accuracy readout traces the U-curve as they move it. Second knob: total context length, demonstrating rot — same fact, same position, accuracy sliding as filler grows. Third act: peek under the hood at the attention distribution that explains both.
- **The "aha":** The window is not a bag — position and length both change whether the model can use what's in it, and "it fits" is not "it works."
- **Under the hood:** Pre-computed — either reproduce a needle/multi-doc grid on an open model offline (position × length matrix, one run), or seed a simulation directly from published curves with sources cited.
- **Build difficulty:** Low-medium. One interaction, one curve, real science; extremely Distill-shaped.

### Path B — "The Paging Agent" (context lifecycle explorable)

- **Core interaction:** Give a simulated agent a task and watch its window as a living strip across the task timeline: AGENTS.md resident, 17 skill stubs at ~80 tokens, a SKILL.md body swapping in on activation, a RAG chunk landing, tool results accumulating, then pressure — the user chooses the compaction strategy (evict-oldest / summarize / keep-plan) and watches downstream steps succeed or fail depending on what was lost.
- **The "aha":** An agent is running a memory hierarchy — its competence depends on librarian decisions, and every eviction strategy has a casualty.
- **Under the hood:** Pure simulation with real published token numbers; failure consequences scripted from curated scenarios.
- **Build difficulty:** Medium. No model, but the scenario design *is* the work — the failures must feel earned, not authored.

### Path C — "Why Not Just Dump Everything?" (the anti-1M-token demo)

- **Core interaction:** One question, one slider: how much of the knowledge base to stuff into context. Accuracy rises, plateaus, then *falls* as dilution wins; a RAG retriever enters as the fix, and the user sees selective beat exhaustive.
- **The "aha":** Attention is the scarce resource, not space — which is the entire reason retrieval exists.
- **Under the hood:** Simulation seeded from published dilution results, or a small offline grid.
- **Build difficulty:** Low. Punchy but narrow — strongest as the opening act inside A or B rather than standalone.

### Adjacent directions

Prompt caching economics (why context *order* affects cost, not just quality); multi-agent context isolation (sub-agents as separate address spaces); KV-cache as the physical substrate of the window; RAG chunking-strategy failure modes as their own explorable if a pure-RAG piece is ever wanted.

## Key sources

- Liu et al. 2023/2024, "Lost in the Middle: How Language Models Use Long Contexts" (TACL) — the U-curve, six model families.
- Hsieh et al. 2024, "Found in the Middle: Calibrating Positional Attention Bias Improves Long Context Utilization" — the mechanistic account.
- Chroma 2025 context-rot report — 18 frontier models, length degradation at every increment.
- Anthropic Agent Skills specification + SwirlAI token measurements (~80-token stubs, ~2,000-token median bodies, ~1,700 tokens for all 17 official skills) — the progressive-disclosure economics.
- mcikalmerdeka/context-engineering-visualizer — the prior-art baseline to beat.

## Strategic read

The gap isn't "nothing exists" — it's "everything that exists is accounting, and the explanatory move (allocation → consequence) is untouched." Path A is a co-favorite for the final five alongside MoE's routing atlas: famous finding, one-slider interaction, real science, minimal build risk. Path B is the more original piece — the demand-paging story — but carries scenario-design cost. A and B compose naturally (A as the "why," B as the "how") into a single larger submission if desired. Mild headwind to note for the pitch: this is the most systems-y topic of the set — it teaches an engineering pattern rather than a learned neural mechanism, slightly against the VISxAI hall-of-fame grain, offset by context engineering being *the* practitioner topic of 2026.