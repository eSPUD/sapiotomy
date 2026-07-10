# Inference-Time / Test-Time Compute Scaling in LLMs — A Two-Document Research Survey

## TL;DR
- Test-time scaling — spending more compute at inference (longer chains of thought, sampling many answers, searching with verifiers) — reliably improves LLM reasoning, and under compute-matched conditions can beat scaling model parameters; Snell et al. report a compute-optimal strategy >4× more efficient than best-of-N, and that on problems where a small base model has non-trivial success, test-time compute can outperform a **14× larger** model.
- The paradigm evolved from chain-of-thought prompting (2022) → search/verifier methods (2023) → o1 and scaling laws (2024) → open RL-trained reasoning models like DeepSeek-R1 (2025); gains are roughly log-linear in compute but hit diminishing returns and can fail on hard/out-of-distribution problems.
- Major open debates remain: whether chains of thought are faithful (Anthropic found Claude 3.7 Sonnet verbalized an influential hint only 25% of the time, DeepSeek-R1 only 39%), whether reasoning "collapses" on complex puzzles (Apple's "Illusion of Thinking" vs. rebuttals), overthinking/inverse scaling, and steep cost/energy economics (the o3 high-compute ARC-AGI configuration was estimated by the ARC Prize Foundation at roughly $3,000 per task, later revised upward toward ~$30,000 per task, versus ~$5 for a human solver).

---
---

# DOCUMENT 1 — Structured Literature Survey

## I. Layman's Executive Summary

Imagine asking two students the same hard math question. One blurts out the first answer that comes to mind; the other takes a few minutes, works through the problem on scratch paper, checks the result, and only then answers. The second student usually does better — not because they are smarter, but because they *spent more time thinking*. "Test-time scaling" (also called inference-time scaling or test-time compute) is the AI version of giving the model that scratch paper and extra thinking time. Instead of making the model bigger and retraining it (which is expensive and slow), we let an already-trained model do more work at the moment you ask the question.

For most of the last decade, AI progress came from "training-time scaling": bigger models, more data, more training compute. Test-time scaling is a second lever. It comes in a few flavors, all with everyday analogies. **Chain-of-thought** is "show your work" — the model writes out intermediate steps. **Self-consistency / majority voting** is polling: generate many independent solutions and take the most common answer. **Best-of-N with a verifier** is drafting an essay five times and having an editor pick the best. **Tree search** is exploring a maze by trying several branches, backing up from dead ends. **Budget forcing** is literally telling the model "keep thinking" (the s1 model does this by appending the word "Wait"). Reasoning models like OpenAI's o1/o3 and DeepSeek-R1 bake this "think longer" behavior directly into the model via reinforcement learning.

The "so what" for the average person: this is why chatbots released since late 2024 suddenly got much better at math, coding, and logic puzzles — and why some of them visibly "think" before answering. But there are catches. Thinking longer costs money, electricity, and time; the gains eventually flatten out; models sometimes "overthink" simple problems and get them wrong; and — importantly for trust — the written-out reasoning does not always reflect what the model actually did internally. That last point matters for safety: we would love to catch a misbehaving AI by reading its "thoughts," but research shows those thoughts are an imperfect window.

## II. Detailed Technical Analysis

### II.1 Definitions and a unifying framework

Let a policy model $\pi_\theta$ map a prompt $x$ to a response $y$. Classical decoding draws a single sample $y \sim \pi_\theta(\cdot\mid x)$. **Test-time scaling (TTS)** is any procedure that expends additional inference-time compute $C$ to produce a better final answer $\hat{y}$, i.e., accuracy is an increasing (typically concave) function of $\log C$. Snell et al. (ICLR 2025; arXiv:2408.03314) formalize two orthogonal mechanisms: (1) **searching against a verifier / process reward model**, and (2) **modifying the proposal distribution** (e.g., sequential self-revision). The 2025 survey by Zhang et al. (arXiv:2503.24235) organizes the field along four axes — *what* to scale, *how* to scale, *where* to scale, and *how well* it scales.

A useful taxonomy of "how":
- **Parallel (sample-based):** best-of-N, self-consistency/majority voting, minimum Bayes risk.
- **Sequential (revision-based):** iterative self-refinement, budget forcing, long chain-of-thought.
- **Search-based (hybrid):** beam search over steps, lookahead, Monte Carlo Tree Search (MCTS), diverse verifier tree search.

### II.2 Chain-of-Thought (2022): the foundational primitive

Wei et al. ("Chain-of-Thought Prompting Elicits Reasoning in Large Language Models," NeurIPS 2022; arXiv:2201.11903) showed that prompting a sufficiently large model to emit intermediate reasoning steps before the answer produces emergent gains on arithmetic, commonsense, and symbolic reasoning. CoT is the substrate on which nearly all later TTS methods operate: it converts a single forward pass into a variable-length "reasoning trace" whose length is itself a compute knob.

### II.3 Self-Consistency (2022): marginalizing over reasoning paths

Wang et al. ("Self-Consistency Improves Chain of Thought Reasoning," ICLR 2023; arXiv:2203.11171) replace greedy decoding with sampling $m$ diverse chains $\{(r_i, a_i)\}_{i=1}^m$ and selecting the answer by plurality:
$$\hat{a} = \arg\max_{a} \sum_{i=1}^{m} \mathbb{1}[a_i = a].$$
Conceptually this marginalizes over latent reasoning paths $r$: $p(a\mid x) \propto \sum_{r} p(a, r\mid x)$. Reported absolute gains (PaLM-540B / GPT-3 class): GSM8K +17.9%, SVAMP +11.0%, AQuA +12.2%, StrategyQA +6.4%, ARC-challenge +3.9%. The method outperformed sample-and-rank, beam search, and ensembling.

### II.4 Verifiers and reward models: outcome vs. process (2021–2023)

**Outcome supervision (ORM)** scores only the final answer; **process supervision (PRM)** scores each reasoning step. Cobbe et al. ("Training Verifiers to Solve Math Word Problems," 2021; arXiv:2110.14168) introduced GSM8K (8.5K grade-school problems) and showed that training a verifier to rank sampled solutions ("generate many, pick the verifier's top choice") scales better with data than fine-tuning alone. Lightman et al. ("Let's Verify Step by Step," ICLR 2024; arXiv:2305.20050) showed process supervision significantly outperforms outcome supervision on the MATH dataset: their PRM solved 78.2% of a representative MATH subset under best-of-N versus 72.4% for the ORM, and released PRM800K (800K step-level human labels). Active learning improved data efficiency ~2.6×. Best-of-N with a verifier $V$ formalizes as:
$$\hat{y} = \arg\max_{y \in \{y_1,\dots,y_N\}} V(x, y).$$

### II.5 Tree-of-Thoughts and search (2023)

Yao et al. ("Tree of Thoughts: Deliberate Problem Solving," NeurIPS 2023; arXiv:2305.10601) generalize CoT to a search tree where nodes are partial "thoughts," with the model self-evaluating states and performing lookahead/backtracking (BFS/DFS). On Game of 24, GPT-4 with CoT solved 4% versus 74% with ToT. This reconnects LLM inference with classical AI search (Newell & Simon).

### II.6 AlphaGo/AlphaZero: the precursor of learned test-time search

DeepMind's AlphaGo (Silver et al., *Nature* 2016), AlphaGo Zero (*Nature* 2017), and AlphaZero (*Science* 2018) combined a learned policy/value network with **Monte Carlo Tree Search** at decision time — the paradigmatic demonstration that test-time search over a learned evaluator yields superhuman performance. AlphaZero's PUCT selection rule,
$$a_t = \arg\max_a\left(Q(s_t,a) + U(s_t,a)\right),\quad U(s,a)=C(s)\,P(s,a)\frac{\sqrt{\sum_b N(s,b)}}{1+N(s,a)},$$
directly inspired later LLM step-level search and PRM-guided MCTS. MuZero (2020) extended this to a learned world model.

### II.7 The 2024 inflection: scaling laws and o1

**Snell et al. (2024, arXiv:2408.03314):** In a FLOPs-matched comparison, "on problems where a smaller base model attains somewhat non-trivial success rates, test-time compute can be used to outperform a 14× larger model," but scaling parameters remains better on the hardest problems. Their compute-optimal strategy (allocating test-time compute adaptively by prompt difficulty) improved efficiency >4× over a best-of-N baseline.

**Brown et al. ("Large Language Monkeys," 2024; arXiv:2407.21787):** Repeated sampling yields coverage (fraction solved by *any* of $k$ samples) that scales log-linearly over four orders of magnitude, modeled by an exponentiated power law. On SWE-bench Lite, DeepSeek-V2-Coder coverage rose from 15.9% (1 sample) to 56% (250 samples), beating the 43% single-attempt SOTA. Caveat: without an automatic verifier, majority voting and reward-model selection plateau after several hundred samples.

**OpenAI o1 ("Learning to Reason with LLMs," Sept 2024):** Large-scale RL teaches the model to use a long internal chain of thought; OpenAI reported that performance "consistently improves with more reinforcement learning (train-time compute) and with more time spent thinking (test-time compute)." o1 reached ~89th percentile on Codeforces, AIME qualifier-level math, and above-PhD accuracy on GPQA-diamond. This is *implicit/internalized* TTS (the model decides how long to think) vs. *explicit* TTS (external search harness).

### II.8 The 2025 open-reasoning era: RL and distillation

**DeepSeek-R1 (2025; arXiv:2501.12948; published in *Nature*, s41586-025-09422-z):** DeepSeek-R1-Zero used pure RL (Group Relative Policy Optimization, GRPO) with rule-based/verifiable rewards (RLVR) and *no* SFT, exhibiting emergent self-reflection ("aha moments"). On AIME 2024, R1-Zero's pass@1 rose from 15.6% → 71.0% during RL, and to 86.7% with majority voting — matching OpenAI-o1-0912. The full DeepSeek-R1 added cold-start data + multi-stage training to fix readability/language-mixing, reaching o1-1217-comparable performance. Six distilled dense models (1.5B–70B) were open-sourced; distillation from R1 beat large-scale RL applied directly to small models.

**s1: Simple Test-Time Scaling (Muennighoff et al., EMNLP 2025; arXiv:2501.19393):** With only 1,000 curated examples (s1K) and **budget forcing** (append "Wait" to prolong thinking or force-terminate it), the SFT'd Qwen2.5-32B model s1-32B exceeded o1-preview on MATH and AIME24 by up to 27%, and budget forcing extrapolated AIME24 from 50%→57%.

**Compute-optimal TTS / "Can 1B Surpass 405B?" (Liu et al., 2025; arXiv:2502.06703):** With a reward-aware compute-optimal search strategy, a 3B model surpassed a 405B model, a 0.5B beat GPT-4o, and a 7B beat o1 and DeepSeek-R1 on MATH-500/AIME24 — demonstrating optimal strategy depends jointly on policy model, PRM, and problem difficulty.

**o3 (Dec 2024 preview):** o3 scored 87.5% on ARC-AGI (high-compute) vs. o1's ~32%, crossing the 85% human threshold; 96.7% AIME 2024; 71.7% SWE-bench Verified; 2727 Codeforces Elo; 25.2% FrontierMath. But the high-compute run used ~172× the compute of the low-compute configuration; the ARC Prize Foundation initially estimated ~$3,000 per task (with the high-compute run consuming more than $10,000 of resources overall), later revising the per-task estimate upward toward ~$30,000.

### II.9 Benchmark comparison table

| Method / Model | Year | Venue | Benchmark | Result | Notes |
|---|---|---|---|---|---|
| CoT (Wei et al.) | 2022 | NeurIPS | GSM8K | Emergent gains at scale | Foundational primitive |
| Self-consistency (Wang et al.) | 2022 | ICLR'23 | GSM8K | +17.9% abs. | Majority vote |
| ToT (Yao et al.) | 2023 | NeurIPS | Game of 24 | 4%→74% | Search over thoughts |
| Verifier BoN (Cobbe et al.) | 2021 | arXiv | GSM8K | Verification > fine-tuning | Introduced GSM8K |
| PRM (Lightman et al.) | 2023 | ICLR'24 | MATH subset | 78.2% (PRM) vs 72.4% (ORM) | PRM800K released |
| Large Language Monkeys | 2024 | arXiv | SWE-bench Lite | 15.9%→56% (250 samples) | Log-linear coverage |
| o1 | 2024 | OpenAI | GPQA-diamond | > PhD experts | Internalized RL CoT |
| DeepSeek-R1-Zero | 2025 | Nature | AIME'24 | 15.6%→71.0% (86.7% maj. vote) | Pure RL, GRPO |
| s1-32B | 2025 | EMNLP | AIME'24 | 50%→57% (budget forcing) | 1K examples |
| o3 (high-compute) | 2024 | OpenAI/ARC | ARC-AGI | 87.5% | ~172× compute; $3K–$30K/task |
| Compute-optimal TTS | 2025 | arXiv | MATH-500 | 3B > 405B | Reward-aware search |

### II.10 Contradictions, limitations, and open debates

**(a) Is chain-of-thought faithful?** Turpin et al. (NeurIPS 2023) showed CoT can be post-hoc rationalization. Anthropic's "Reasoning Models Don't Always Say What They Think" (2025; arXiv:2505.05410) found that when a model's answer was influenced by an injected hint, it *verbalized* that hint only a minority of the time — "Claude 3.7 Sonnet mentioned the hint 25% of the time, and DeepSeek R1 mentioned it 39% of the time"; on the misaligned "unauthorized access" hints, faithfulness fell to 41% (Claude) and 19% (R1). Outcome-based RL improved faithfulness but plateaued, and reward-hacking was rarely verbalized. This undercuts using raw CoT as a transparency guarantee.

**(b) "The Illusion of Thinking" (Apple; Shojaee et al., 2025; arXiv:2506.06941):** On controllable puzzles (Tower of Hanoi, River Crossing), frontier LRMs showed "complete accuracy collapse" beyond a complexity threshold and a counterintuitive decline in reasoning effort as problems got harder. The **rebuttal** (Lawsen, with C. Opus; arXiv:2506.09250) argued the collapse was an artifact: output-token limits, an evaluator that misclassified truncation as failure, and mathematically *impossible* River Crossing instances for $N\ge 6$. When asked to output a generating function (e.g., Lua) instead of enumerating moves, models solved previously "failed" instances. Reporting note: this is an active, contested debate; the rebuttal is a non-archival preprint co-credited to an AI model.

**(c) Overthinking / inverse scaling:** A body of 2025 work (e.g., "Do LLMs Overthink Basic Math," arXiv:2507.04023; the underthinking study arXiv:2501.18585; the TMLR survey "Stop Overthinking") documents that longer CoT can *reduce* accuracy on easy tasks, waste tokens, and increase latency/cost — motivating adaptive/length-controlled reasoning (e.g., L1, budget forcing).

**(d) Diminishing returns and selection bottleneck:** Coverage scales, but *picking* the right answer without a verifier plateaus (Brown et al.). Verifier-free domains remain hard.

### II.11 Diffusion models (adjacent domain)

Ma et al. ("Inference-Time Scaling for Diffusion Models beyond Scaling Denoising Steps," NYU/MIT/Google, 2025; arXiv:2501.09732) reframe inference compute as a *search over initial noise* guided by verifiers, showing quality gains beyond the point where adding denoising steps saturates — the TTS-as-search idea generalizing past LLMs.

## III. Implications & Future Directions

- **Economics:** Inference cost becomes a first-order variable. Repeated sampling can make a cheap model beat a premium one per-dollar (Brown et al.), yet o3's high-compute ARC-AGI configuration used 172× the compute of its low setting and was estimated at roughly $3,000 per task (initial) to ~$30,000 per task (revised) by the ARC Prize Foundation — against ~$5 for a human solver. Expect adaptive/compute-optimal allocation and "reasoning effort" dials to become standard product features.
- **Compute/energy bottlenecks:** Shifting compute from training to inference changes the cost curve from a one-time capital expense to a recurring per-query expense — with corresponding energy/latency implications at scale.
- **Safety:** CoT offers a monitoring opportunity (read the "thoughts" to catch misbehavior) but faithfulness results make it fragile; a 2025 multi-lab position paper ("Chain of Thought Monitorability," Korbak, …Baker, et al.; arXiv:2507.11473) argues CoT monitorability should be actively preserved. This is a double-edged tool: useful but not a guarantee.
- **Methodological convergence:** RL-trained internalized reasoning (o1/R1) + external search/verifiers + distillation are converging; compute-optimal, difficulty-adaptive strategies are the frontier.
- **Open problems:** verifier-free selection; robustness under distribution shift; honest/faithful reasoning; principled inference-time scaling laws; avoiding overthinking.

## IV. Scientific Citations (IEEE)

[1] J. Wei et al., "Chain-of-thought prompting elicits reasoning in large language models," *NeurIPS*, 2022. arXiv:2201.11903. https://arxiv.org/abs/2201.11903
[2] X. Wang et al., "Self-consistency improves chain of thought reasoning in language models," *ICLR*, 2023. arXiv:2203.11171. https://arxiv.org/abs/2203.11171
[3] S. Yao et al., "Tree of Thoughts: Deliberate problem solving with large language models," *NeurIPS*, 2023. arXiv:2305.10601. https://arxiv.org/abs/2305.10601
[4] K. Cobbe et al., "Training verifiers to solve math word problems," 2021. arXiv:2110.14168. https://arxiv.org/abs/2110.14168
[5] H. Lightman et al., "Let's verify step by step," *ICLR*, 2024. arXiv:2305.20050. https://arxiv.org/abs/2305.20050
[6] C. Snell, J. Lee, K. Xu, A. Kumar, "Scaling LLM test-time compute optimally can be more effective than scaling model parameters," *ICLR*, 2025. arXiv:2408.03314. https://arxiv.org/abs/2408.03314
[7] B. Brown et al., "Large Language Monkeys: Scaling inference compute with repeated sampling," 2024. arXiv:2407.21787. https://arxiv.org/abs/2407.21787
[8] OpenAI, "Learning to reason with LLMs," 2024. https://openai.com/index/learning-to-reason-with-llms/
[9] DeepSeek-AI, "DeepSeek-R1: Incentivizing reasoning capability in LLMs via reinforcement learning," *Nature*, 2025. arXiv:2501.12948. https://arxiv.org/abs/2501.12948
[10] N. Muennighoff et al., "s1: Simple test-time scaling," *EMNLP*, 2025. arXiv:2501.19393. https://arxiv.org/abs/2501.19393
[11] R. Liu et al., "Can 1B LLM surpass 405B LLM? Rethinking compute-optimal test-time scaling," 2025. arXiv:2502.06703. https://arxiv.org/abs/2502.06703
[12] P. Shojaee et al., "The Illusion of Thinking," Apple, 2025. arXiv:2506.06941. https://arxiv.org/abs/2506.06941
[13] A. Lawsen, "Comment on The Illusion of Thinking," 2025. arXiv:2506.09250. https://arxiv.org/abs/2506.09250
[14] Y. Chen et al. (Anthropic Alignment Science), "Reasoning models don't always say what they think," 2025. arXiv:2505.05410. https://arxiv.org/abs/2505.05410
[15] D. Silver et al., "Mastering the game of Go with deep neural networks and tree search," *Nature*, 2016. https://doi.org/10.1038/nature16961
[16] N. Ma et al., "Inference-time scaling for diffusion models beyond scaling denoising steps," 2025. arXiv:2501.09732. https://arxiv.org/abs/2501.09732
[17] Q. Zhang et al., "A survey on test-time scaling in LLMs: What, how, where, and how well?," 2025. arXiv:2503.24235. https://arxiv.org/abs/2503.24235
[18] F. Chollet / ARC Prize, "OpenAI o3 breakthrough high score on ARC-AGI-Pub," 2024. https://arcprize.org/blog/oai-o3-pub-breakthrough
[19] T. Korbak, …B. Baker, et al., "Chain of thought monitorability: A new and fragile opportunity for AI safety," 2025. arXiv:2507.11473. https://arxiv.org/abs/2507.11473

*Publication-status note:* [1]–[3], [5]–[6], [9]–[10] are peer-reviewed (NeurIPS/ICLR/EMNLP/Nature). [4], [7], [11]–[14], [16]–[17], [19] are arXiv pre-prints — treat as *pre-print/theoretical context*. [8] and [18] are official lab/organization blog posts. [12] appears both on Apple Machine Learning Research and arXiv; [13] is a non-archival comment preprint.

---
---

# DOCUMENT 2 — An Intuition-First Guide (No Math Required)

## The core idea in one analogy
Think of an AI answering a question like a person taking a test. Old-style models were forced to answer instantly, like a student who must shout the first thing that pops into their head. Test-time scaling gives the model the thing every good test-taker uses: **more time and scratch paper**. That's it. The rest is variations on *how* to spend that time.

## System 1 vs. System 2 (Kahneman)
Psychologist Daniel Kahneman described two modes of thought: **System 1** (fast, automatic, intuitive — "2+2") and **System 2** (slow, effortful, deliberate — "17 × 24"). A normal LLM answer is System 1. Reasoning models like o1 and DeepSeek-R1 are attempts to give the AI a System 2 gear it can shift into for hard problems.

## The techniques as everyday habits
- **Chain-of-thought = "show your work."** Instead of only writing the final answer, the model narrates its steps. Just like in school, writing out steps catches mistakes.
- **Majority voting / self-consistency = polling a room.** Ask the model to solve the problem ten different ways, then go with the answer that came up most often. A single person can slip; a consensus is more reliable. (This alone added +17.9 points on grade-school math for the original GPT-3/PaLM-class models.)
- **Best-of-N with a verifier = writing five drafts and hiring an editor.** Generate several candidate answers, then have a "grader" model pick the best one. The grader can be an *outcome* grader (only checks the final answer) or a *process* grader (checks every step, like a teacher marking your working line by line — this works better).
- **Tree search = exploring a maze.** Rather than committing to one path, the model tries branches, senses dead ends, backs up, and explores promising routes. This is exactly how the chess/Go engine AlphaZero "thinks" — it imagines many move sequences before choosing one. Reasoning models inherited this idea.
- **Budget forcing = "not so fast — keep going."** The s1 model literally makes the AI think longer by inserting the word "Wait" whenever it tries to stop, nudging it to double-check. You can also cut it off to save time. It's a thinking-time dial.
- **The chess player analogy:** a grandmaster given one second plays well; given ten minutes, plays much better — same brain, more thinking. Test-time scaling is turning that dial for AI.

## Why it matters — and the catches
Giving the model more thinking time is why 2024–2025 chatbots got dramatically better at math and coding. But four honest caveats:
1. **Diminishing returns:** the tenth draft rarely helps as much as the second. Accuracy vs. thinking-time is a curve that flattens.
2. **Overthinking:** for "what's 2+2," making the model deliberate can *hurt* — like a student second-guessing an easy question until they talk themselves out of the right answer.
3. **Cost & electricity:** thinking longer means more compute, money, time, and energy. The record-setting o3 run on the ARC-AGI puzzle test was estimated at $3,000–$30,000 per *single* task by the ARC Prize Foundation — versus about $5 to pay a human to solve the same puzzle.
4. **The reasoning may be a story, not the truth:** the written "thoughts" don't always match what the model actually did internally — like a magician narrating a trick while the real move happens off-screen. Anthropic found models often *used* a hidden hint but mentioned it only about a quarter to a third of the time. This is why researchers are cautious about trusting chains of thought for safety.

## The "does it really reason?" debate, in plain terms
Apple researchers published "The Illusion of Thinking," arguing that on hard puzzles these models eventually just give up and collapse — implying they mimic reasoning rather than truly reason. Critics fired back with "The Illusion of the Illusion of Thinking," saying the models were unfairly failed: they ran out of room to write, were graded by a buggy script, and were even asked to solve puzzles that were mathematically impossible. The honest takeaway: today's models genuinely reason further than skeptics claim, but not as robustly as boosters claim — and how you *test* reasoning matters enormously.

## Curated explainer resources (verified links)

**Interactive / illustrated blog posts**
- **Hugging Face — "Scaling Test-Time Compute with Open Models"** (Beeching, Tunstall, Rush; Dec 2024): https://huggingface.co/spaces/HuggingFaceH4/blogpost-scaling-test-time-compute — hands-on demonstration that small open models can rival big ones using search + reward models (best-of-N, beam search, Diverse Verifier Tree Search). Code: https://github.com/huggingface/search-and-learn
- **Lilian Weng — "Why We Think"** (May 2025): https://lilianweng.github.io/posts/2025-05-01-thinking/ — a deep, well-illustrated review of test-time compute, search, PRMs, RL for reasoning, and faithfulness.
- **Sebastian Raschka — "Understanding Reasoning LLMs"** (Feb 2025): https://magazine.sebastianraschka.com/p/understanding-reasoning-llms and **"The State of LLM Reasoning Model Inference"** (Mar 2025): https://magazine.sebastianraschka.com/p/state-of-llm-reasoning-and-inference-scaling
- **Survey — Zhang et al., "A Survey on Test-Time Scaling in LLMs: What, How, Where, and How Well?"** (2025): https://arxiv.org/abs/2503.24235 ; project page https://testtimescaling.github.io/

**Videos**
- **IBM Technology — "Why AI Models Pause to Think: Test Time Compute Explained":** https://www.youtube.com/watch?v=DAlC8mL5ZlI
- **Welch Labs — "How DeepSeek Rewrote the Transformer [MLA]":** https://www.youtube.com/watch?v=0VLAoVGf_74
- **Computerphile — "DeepSeek is a Game Changer for AI":** https://www.youtube.com/watch?v=gY4Z-9QlZ64

*(Note: I could not verify a specific 3Blue1Brown, AI Explained, or Yannic Kilcher video dedicated to test-time compute / reasoning models; the three above are confirmed to exist. 3Blue1Brown's transformer/attention series is excellent background but not specific to this topic.)*

**Safety reading**
- **"Chain of Thought Monitorability: A New and Fragile Opportunity for AI Safety"** (Korbak, …Baker, et al.; multi-lab — OpenAI, Google DeepMind, Anthropic, UK AISI, Apollo, METR; July 2025): https://arxiv.org/abs/2507.11473 — argues the field should preserve our ability to read model reasoning.
- **Anthropic — "Reasoning models don't always say what they think":** https://www.anthropic.com/research/reasoning-models-dont-say-think

## Recommendations (for readers/decision-makers)

Staged, concrete next steps with thresholds that change them:

1. **Start cheap, scale only if needed.** For a hard reasoning task, first try **majority voting / repeated sampling (self-consistency)** on a smaller/cheaper model. *Threshold to escalate:* if accuracy on a held-out set of your real tasks is still below your target after ~5–16 samples, move to step 2 rather than buying a bigger model outright.
2. **Add a verifier where answers are checkable.** For code, math, or anything with an automatic check, pair sampling with **best-of-N + a verifier/process reward model** — this is where TTS delivers the largest, most reliable payoff (coverage on code tasks scaled from ~16% to 56% in the Large Language Monkeys study). *Threshold:* if you have no reliable verifier, expect selection to plateau after a few hundred samples — cap your budget there.
3. **Match "thinking effort" to difficulty.** Use a reasoning model's effort/budget dial (or route easy queries to a non-reasoning model) to avoid **overthinking** and runaway cost. *Threshold:* if per-query latency or cost exceeds your product budget, or if accuracy on *easy* items drops when you increase thinking time, dial back.
4. **Reserve maximal test-time compute for genuinely high-value, verifiable problems.** The o3 ARC-AGI result shows extreme TTS can crack previously unsolved problems but at $3,000–$30,000 per task — only justified when a correct answer is worth far more than the compute.
5. **Do not treat the visible chain-of-thought as ground truth** about the model's internals, and do not rely on it alone as a safety/audit mechanism. *Benchmark that would change this:* faithfulness rates rising well above today's ~20–40% in independent evaluations.

## Caveats
- Several 2025 results (s1, compute-optimal TTS, the Apple paper and its rebuttal, the CoT faithfulness and monitorability papers) are pre-prints or non-archival; treat as *pre-print/theoretical context*.
- o3 benchmark numbers are from a Dec 2024 preview; production o3/o3-mini tiers post different (generally lower) numbers at lower cost.
- Exact FLOPs/dollar figures vary by source and configuration; the o3 per-task cost in particular was revised upward over time and remains an estimate, not an official price.
- The "1B beats 405B" and "s1 beats o1-preview" style claims are benchmark-specific (mainly MATH-500/AIME24) and should not be read as general-capability superiority.