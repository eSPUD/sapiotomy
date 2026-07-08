# RLHF / DPO (Preference Optimization)

**Visual grammar:** Distributional/dynamical — probability mass migrating over a space of possible responses during training. A tug-of-war: chosen responses pulled up, rejected pushed down, the whole policy leashed to a frozen reference. The only topic on the slate whose natural x-axis is *training time* — everything else scoped so far visualizes inference.

## What it is

Preference optimization is how a raw next-token predictor becomes an assistant: instead of imitating text, the model is trained on human *judgments* — pairs of responses where annotators picked a winner. RLHF does this in three stages (supervised fine-tuning, then training a reward model to imitate the judgments, then RL against that reward model with a KL penalty leashing the policy to its reference); DPO collapses the last two stages into a single classification-style loss on the preference pairs directly, exploiting the result that the language model is secretly its own reward model. This is where alignment concretely lives — helpfulness, tone, refusals — and by 2025 preference-based post-training had become the default across the industry, with frontier pipelines (e.g. Llama 4's) mixing PPO-based RLHF and DPO in multiple rounds. Yet what these methods *do to a model's distribution* remains essentially invisible to everyone who hasn't trained one.

## Prior tools

Only tools that use visualization to explain how the technique works. Abundant explanation exists, none of it showing the phenomena:

- **Hugging Face, "Illustrating RLHF" (Lambert et al.)** — the canonical explainer: the three-stage pipeline with clean flow diagrams. [static] · learners/practitioners. The piece everyone links; pipeline-shaped, not phenomenon-shaped.
- **Lambert's RLHF Book (rlhfbook.com)** — the field's textbook; comprehensive, with figures throughout, covering DPO, rejection sampling, reward models, and trade-offs. [static] · practitioners/researchers.
- **The prose ocean** — IntuitionLabs' technical guide, Chip Huyen's alignment posts, Wikipedia, vendor guides, PyTorch code-alongs. [static] · all audiences. Uniformly pipeline diagrams plus loss equations.
- **Paper figures showing the real dynamics** — likelihood-trajectory plots in the 3D-Properties paper, name-frequency histograms in Diverse Preference Optimization, entropy-collapse curves in the RLVR-diversity literature. Findings-communication, scattered across venues, never synthesized for a general audience.

Under the corrected evaluation bar (contribution = what the piece *shows* that a reader can't get elsewhere, regardless of interactivity), the gap statement is precise: the *pipeline* has been explained to death in every format; the *consequences* — what preference optimization actually does to a probability distribution over responses — have been shown only in fragments inside research papers, never as an explanatory visual narrative anywhere.

## Gaps identified

### Structural gap

Every existing explainer answers "what are the training stages?" None answers "what happens to the model?" — the distributional story. That story exists as scattered paper figures; the Patchscopes-style synthesis (real experimental data, narrative arc, general-audience framing) is unclaimed. Notably, this gap survives the interactivity correction fully intact — it was never a format gap.

### Under-visualized phenomena

Each is documented, counterintuitive, and reproducible at small scale:

1. **The squeeze / likelihood displacement.** DPO's signature pathology: over training, the likelihood of the *chosen* responses can decline along with the rejected ones, with probability mass leaking to unseen responses — because as the rejected likelihood approaches zero, its gradient pressure explodes while the chosen gradient vanishes, and shared tokens between the pair drag the chosen response down with the rejected one. "You trained it to prefer A over B and it became less likely to say either" is a top-three aha of the entire session.
2. **Diversity collapse, with a name and a face.** DPO's reverse-KL objective is mode-seeking by construction; alignment demonstrably narrows output distributions, with creative tasks hit hardest. The concrete emblem: ask an aligned Llama for a random persona and it names her "Astrid" more than 10% of the time, and temperature can't fix it without destroying quality. Anyone can *feel* that finding — nobody has shown it to a general audience.
3. **The KL leash and reward hacking.** Loosen the leash and the policy drifts toward exploiting its imperfect judge — fluent, confident, formal-sounding outputs that impress evaluators regardless of substance, including learning to hallucinate rather than say "I don't know." Constantly *described*, never *shown* as a trajectory.
4. **RLHF-vs-DPO as a real trade, not a version upgrade.** DPO's simplicity vs. documented over-optimization behavior in direct alignment methods, and the industry's revealed preference for keeping RL in the loop. An honest visual comparison of what each does to the same model on the same data doesn't exist.

## Visualization paths

### Path A — "The Astrid Problem" (diversity-collapse data essay)

- **Core interaction:** Sample a base model, its SFT sibling, and its DPO/RLHF-aligned sibling hundreds of times on identical open-ended prompts (invent a persona, open a story, name a startup). Show the distributions narrowing stage by stage — name-frequency bars spiking, response embeddings collapsing from a cloud into clumps — with real sampled text on hover. Modest interaction; the *data* is the star.
- **The "aha":** Alignment has a diversity price, and here are the receipts — the same model family, growing steadily more samey as preference optimization bites.
- **Under the hood:** **Inference only — no training.** Public checkpoint families (base → instruct pairs) sampled offline; embed and project the responses. The topic's best essay doesn't require doing RLHF.
- **Build difficulty:** Low-medium. The sleeper of the whole session — Forma-Fluens-shaped, original data, famous misconception, cheapest path to an original finding scoped anywhere in this project.

### Path B — "Watching Alignment Happen" (the DPO training diary)

- **Core interaction:** One real small DPO run (sub-1B model, TRL, a public preference set), instrumented per-step: chosen likelihood, rejected likelihood, mass on unseen responses, entropy, KL from reference — presented as a scrolly training diary with sampled outputs at checkpoints so the curves have faces. The squeeze appears on screen: both likelihood curves eventually bending *down* together.
- **The "aha":** Preference optimization is not "reward the good response" — it's a gradient tug-of-war with pathological phases, and you just watched one develop.
- **Under the hood:** Real training, toy scale — a few GPU-hours; then a static-data essay over the logged trajectories.
- **Build difficulty:** Medium-high. The only training-required path in this topic; highest ceiling, Patchscopes-shaped.

### Path C — "The Leash" (KL/β playground)

- **Core interaction:** A toy 2D policy distribution, a reward landscape with an exploitable flaw baked in, and a β slider. Tighten the leash: the policy barely moves. Loosen it: watch it slide off the intended optimum into the reward crack — hacking, live.
- **The "aha":** The KL penalty isn't bureaucracy; it's the only thing standing between optimization and exploitation of an imperfect judge.
- **Under the hood:** Pure simulation.
- **Build difficulty:** Low. K-Means-style craft play; charming, but under the corrected bar it must out-teach existing prose on polish alone — better as an act inside A or B than standalone.

### Adjacent directions

Reward-model anatomy (what the judge actually learned — probing its scores across response perturbations); the DPO variant zoo (IPO/KTO/SimPO) as a comparative dynamics study; RLVR and entropy collapse in reasoning training (the current frontier of the same story); Constitutional AI / RLAIF as "the judge is also a model."

## Key sources

- Ouyang et al. 2022, "Training language models to follow instructions with human feedback" (InstructGPT) — the founding recipe.
- Rafailov et al. 2023, "Direct Preference Optimization: Your Language Model is Secretly a Reward Model."
- "3D-Properties: Identifying Challenges in DPO and Charting a Path Forward" (arXiv:2406.07327) — the squeeze, with likelihood-trajectory figures.
- Lanchantin et al., "Diverse Preference Optimization" (arXiv:2501.18101) — the Astrid finding.
- "Where Does Output Diversity Collapse in Post-Training?" (arXiv:2604.16027) — stage-by-stage collapse attribution.
- Lambert, *Reinforcement Learning from Human Feedback* (rlhfbook.com) and Hugging Face, "Illustrating RLHF" — the static baselines.

## Strategic read

The highest-stakes topic on the slate (it's where alignment lives) with a gap that fully survives the corrected evaluation bar: pipelines explained everywhere, distributional consequences shown nowhere outside paper fragments. The surprise of the template run is Path A — an inference-only data essay, meaning the topic's best proposal doesn't carry the training-cost tax originally assessed; it may be the cheapest original-finding piece of the entire session. Path B is the prestige version if GPU-hours are available. Likely contributes one slot, with A the default pick.