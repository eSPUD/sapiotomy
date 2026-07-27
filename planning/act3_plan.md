# Act 3 Plan — "Frontier & Caveats" (pages 11–16)

## Context

The VISxAI 2026 explainable on inference-time scaling has a polished 10-page deck: Act 1 (pages 1–4) and Act 2 (pages 5–10, ending on Tree of Thoughts). **Act 2 is complete at page 10.** The repo still carries legacy pages 11–21 at an older visual standard, and `web/src/lib/pages.ts` declares stale act ranges. This plan defines Act 3: **6 slides, pages 11–16**, written to the rigor standard of the reference plan for slides 4–10 (per-page Purpose / So What? / Core content with verbatim quotes and exact figures / Interactive / Citations), shipping by the **Aug 3 VISxAI submission** (camera-ready Oct 16).

### User decisions (2026-07-26)
1. **Act 3 size:** 6 slides, pages 11–16.
2. **Legacy pages:** keep live until replaced — legacy Act 3 content (old 16–21) renumbers into slots 11–16 at day-0 migration and stays live (old style) until each rebuild replaces it in place; orphaned legacy 11–15 (maze, alphago, scaling-curve-lab, allocation-game, wait-button) have no slots (wait-button is redundant with new page 6; Brown/Snell anchors fold into page 12) and are removed at migration.
3. **Deadline:** all six slides submission-ready by Aug 3, thinner polish accepted (pages 14–15 ship as house-shelled ports, upgraded for camera-ready).
4. **Scope:** includes bounded flow fixes for pages 1–10; no structural rewrites.
5. **Rigor bar (plan revision, this round):** every slide spec below is grounded in primary literature with verbatim quotes (fetched from the papers' abstracts on 2026-07-26; items marked *[verify verbatim]* must be checked against the primary source during build), exact numbers, arXiv IDs + venues, and explicit cross-page connective tissue — matching the reference plan for slides 4–10.

## Narrative spine

Act 2 ended with the reader hand-building a search scaffold (page 10: branch, score, prune, backtrack). Act 3: the labs trained that scaffold *into* the model (11); thinking became a metered product with lawful, diminishing-returns economics (12); then the fine print — more thinking can hurt (13), the transcript can lie (14), and whether it "really" reasons is an open scientific fight the reader adjudicates (15); the bookend answers page 1's stake (16).

---

## Act 3 — slide-by-slide

House style for every page (unchanged from pages 1–10): `lg:grid-cols-[minmax(0,1fr)_15rem]` numbered-step + margin-note shell, no gating (PredictBar never blocks), `CitationBadge` inside the figure it supports, preprint chips, "as of" date stamps on model/price claims, provenance footnote, `aria-live`, `recordInteraction`, Vitest + Playwright + axe per `web/docs/page-template.md`.

### Page 11 — Learning to Think: RL Trains the Scaffold Into the Model

**(b) Purpose:** Bridge from hand-engineered inference scaffolds (pages 5–10) to *trained* reasoners: reinforcement learning on verifiable rewards makes backtracking, self-verification, and long chains emerge inside the model — and introduces the second scaling axis (train-time RL compute) alongside test-time thinking.

**(c) So What?** On page 10 you built the search by hand: branch, score, prune, back up. In 2024–25 the labs stopped building it by hand. Trained only on "was the final answer right?", models *taught themselves* to pause mid-sentence, say "Wait," and re-derive — the exact move you invented. The scratchpad stopped being a prompt trick and became a learned behavior with its own dial, and that dial is now a product you can buy.

**(d) Core content:**
- **o1 — the announcement of the axis.** OpenAI's o1 (Sept 2024, "Learning to reason with LLMs"): performance "consistently improves with more reinforcement learning (train-time compute) and with more time spent thinking (test-time compute)" *[verify verbatim — the blog blocks automated fetch; sentence widely reproduced]*. Through RL, o1 "learns to recognize and correct its mistakes… learns to break down tricky steps into simpler ones… learns to try a different approach when the current one isn't working" *[verify verbatim]* — item for item, the behaviors pages 6–10 engineered externally. Headline results (stamp *as of Sept 2024*): 89th percentile on Codeforces; among top-500 US students on the AIME qualifier; exceeds PhD-level human accuracy on GPQA.
- **DeepSeek-R1 — the open, peer-reviewed replication.** DeepSeek-AI, "DeepSeek-R1 incentivizes reasoning in LLMs through reinforcement learning" (arXiv:2501.12948; **Nature, 2025** — the deck's only peer-reviewed reasoning-model source; render `preprint: false`). Pure RL (GRPO; Shao et al., arXiv:2402.03300) on V3-Base with *rule-based verifiable rewards* — answer correctness + format only, deliberately avoiding a learned reward model and the reward hacking pages 8–9 warned about. Result, R1-Zero on AIME 2024: **pass@1 15.6% → 71.0%** over training; **86.7% with majority voting over 64 samples** — parity with o1-0912, and a direct callback to page 7's voting lever. Two *emergent* phenomena, neither explicitly trained: (i) **response length grows steadily across RL steps** (the model discovers that longer thinking earns more reward — digitize the paper's response-length figure, don't interpolate); (ii) reflection and re-evaluation appear, including the paper's "aha moment" transcript: "Wait, wait. Wait. That's an aha moment I can flag here." *[verify verbatim against the Nature version; arXiv v1 Table 3]* Connective: R1-Zero re-derives page 10's tree search as *sequential in-context search* — the backtrack lives in the token stream instead of an external controller.
- **s1 — the behavior is distillable and steerable.** Muennighoff et al., "s1: Simple test-time scaling" (arXiv:2501.19393; preprint): SFT on just **1,000 curated reasoning traces** (s1K, distilled from Gemini Thinking) plus **budget forcing** — appending "Wait" to extend thinking — "allows extrapolating beyond its performance without test-time intervention: from 50% to 57% on AIME24" (verbatim). This mechanizes page 6's "Wait" button and closes the loop: what RL discovers, a small SFT can transplant.
- **The productization.** By mid-2026 every frontier lab sells the dial — Gemini "thinking budgets," Claude "extended thinking," GPT-5 "reasoning effort" (survey: "Reasoning on a Budget: A Survey of Adaptive and Controllable Test-Time Compute in LLMs," arXiv:2507.02076; preprint). Stamp every product card *as of 2026-07*. Foreshadow page 13: an adjustable dial implies a wrong setting exists.

**(e) Interactive:** (i) The aha-moment excerpt as a trace card with move-filter chips (plan / compute / check / **backtrack**) that highlight the corresponding spans — the reader physically finds the backtrack the way they used page 10's tree; honesty chip: quoted excerpt, not a live model. (ii) RL-training-step scrubber (0→8000) driving two stacked `LineChart`s sharing one x-marker (never dual-axis): AIME24 pass@1 15.6→71.0, and mean response length rising unprompted; cons@64 toggle surfaces 86.7% + the o1-0912 reference line. (iii) Three effort-dial product cards with as-of stamps.

**(f) Citations:** DeepSeek-AI (arXiv:2501.12948; Nature 2025) · OpenAI, "Learning to Reason with LLMs" (blog, Sept 2024) · Muennighoff et al. (arXiv:2501.19393) · Shao et al., GRPO (arXiv:2402.03300) — margin · survey arXiv:2507.02076 — margin, preprint-flagged.

**(g) Implementation:** Salvage legacy `Page16.tsx` scrubber + `deepseek-r1-training.json` (reuse). NEW `web/data/deepseek-r1-response-length.json` (digitized from the R1 response-length figure; replace the unsourced `lengthStart/lengthEnd` interpolation params; log in `PROVENANCE.md`). `R1_AHA` + `EFFORT_DIALS` in `authored.ts`. Tests: `act3.test.ts` (15.6→71.0 monotone, cons64 86.7, length endpoints match digitization, R1 `preprint === false`); NEW `Page11.test.tsx` (scrubber endpoints, toggle, quoted-content chip, as-of stamps, chip highlighting); E2E slider End-key + axe. Handoff: *"The scaffold moved inside the model — and the meter moved onto your bill."* **Effort: M.**

### Page 12 — The Bill Arrives: The Economics of Thinking

**(b) Purpose:** Make the *cost side* of inference-time scaling concrete: the log-linear coverage law implies exponentially many samples for linearly more accuracy; absolute prices collapse across years while the diminishing-returns shape is invariant — the durable law vs the dated snapshot.

**(c) So What?** Every "Wait" you pressed on page 6 was metered tokens. Thinking got ~1000× cheaper in eighteen months — and yet at every frontier, in every era, the last few points of accuracy cost far more than the first many. The price tag moves; the shape of the bill doesn't.

**(d) Core content:**
- **The law (planted on page 7, stated here).** Brown et al., "Large Language Monkeys" (arXiv:2407.21787; preprint): "coverage — the fraction of problems that are solved by any generated sample — scales with the number of samples over four orders of magnitude" (verbatim); on SWE-bench Lite, "the fraction of issues solved with DeepSeek-Coder-V2-Instruct increases from 15.9% with one sample to 56% with 250 samples" (verbatim); "the relationship between coverage and the number of samples is often log-linear and can be modelled with an exponentiated power law, suggesting the existence of inference-time scaling laws" (verbatim). Margin math from the repo's digitized slope (`coverage-scaling.json`, 16.72 pts/decade): each +1 point of coverage costs a constant ×1.15 multiplier in samples — linear accuracy, exponential compute. *This is why the cost curve bends.*
- **The catch (planted on page 8, paid off here).** Stroebl et al., "Inference Scaling fLaws: The Limits of LLM Resampling with Imperfect Verifiers" (arXiv:2411.17501; preprint): with an imperfect verifier, resampling yields diminishing and even *negative* returns — realized accuracy sags below coverage. A right answer existing among N samples ≠ being able to pick it; the coverage law is an upper bound you cannot always cash in.
- **Spending it well.** Snell et al., "Scaling LLM Test-Time Compute Optimally Can Be More Effective than Scaling Model Parameters" (arXiv:2408.03314; **ICLR 2025 oral**): difficulty-adaptive, per-prompt "compute-optimal" allocation "can improve the efficiency of test-time compute scaling by more than 4x compared to a best-of-N baseline" (verbatim); FLOPs-matched, "on problems where a smaller base model attains somewhat non-trivial success rates, test-time compute can be used to outperform a 14x larger model" (verbatim). Stamp *on Snell's 2024 setup* — the strong reading has since been complicated; present as a dated finding, per the currency review.
- **The bill at the frontier.** Historical layer (verified, ships unconditionally): OpenAI o3 on ARC-AGI-1 (ARC Prize, Dec 2024, blog): **75.7%** on the semi-private set at roughly **$20/task** in low-compute mode; **87.5% at 172× compute** — thousands of dollars per task for the last twelve points. Current layer (2026, *gated on verification*): the ARC-AGI-2 leaderboard shows the same shape at ~1000× lower prices; ARC-AGI-3 near-zero for machines vs ~100% for humans (frontier ratchet). Benchmark context: Chollet et al., "ARC-AGI-2" (arXiv:2505.11831). Durable trend layer (verified, Epoch AI): the price of GPQA-equivalent performance falls **~÷40/yr** (range ÷9–÷900, `epoch-inference-prices.json`); energy margin: **~0.3 Wh per ChatGPT query** (`query-energy.json`) — both files are already cited + schema-validated and currently unused by any page.

**(e) Interactive:** Non-blocking `PredictBar` ("the best model scores ~92% on ARC-AGI-2 — guess the per-task cost"), then a staged-reveal log-$ scatter (NEW `CostScatter`, hand-rolled SVG per the page-10 tree tradition; tooltips + toggleable data table as the a11y fallback): same-family connected curve (last points cost most) → cost≠value outlier → human baseline (distinct mark shape, never color-alone) → era toggle dropping in the o3/Dec-2024 layer in an aged treatment (opacity + dashed + date stamp) with a $3K–$30K range bar → Epoch ÷40/yr strip. Margin: the ×1.15-per-point coverage calculator; the energy rung ladder.

**(f) Citations:** Brown et al. (arXiv:2407.21787) · Stroebl et al. (arXiv:2411.17501) · Snell et al. (arXiv:2408.03314; ICLR 2025) · ARC Prize Foundation, o3 results (blog, Dec 2024) + ARC-AGI-2 leaderboard (2026, *as-of stamped*) · Chollet et al. (arXiv:2505.11831) · Epoch AI, LLM inference price trends; "How much energy does ChatGPT use?".

**(g) Implementation:** Follow the existing draft spec `pages/page-11-the-bill-arrives.md` + prototype `prototypes/page-11/index.html` (reveal sequence, table view, ★ copy-tested strings C4/C6/C7/C8). Reuse `arc-cost.json` (extend `fit.params` with the o3-high $3K–$30K range), `epoch-inference-prices.json`, `query-energy.json`, `coverage-scaling.json`, `compute-optimal.json`. NEW `arc-agi-2-cost.json` gated behind one `SHOW_2026_LAYER` const with two copy variants (A: 2026-verified inversion-shock; B: historical-primary fallback). NEW `web/src/lib/econ.ts` (pure): `samplesPerPoint`, `priceAfterYears`, `logDollarTicks`. Tests: NEW `act3econ.test.ts` (`samplesPerPoint(16.72)` ≈ 1.148; `priceAfterYears(1,40,1)` = 0.025; o3 75.7/87.5/172 exact; 2026 points exact-match if shipped); `Page12.test.tsx` (variant-aware ★ strings, decade ticks, era stamps, aged-treatment class); E2E reveal/toggle/table/reduced-motion/axe. Handoff: *"Thinking is cheap now — why not always buy the maximum? Because past a point, the extra thinking doesn't just cost money. It costs accuracy."* **Effort: M–L** (M on the verified base layer).

### Page 13 — When More Thinking Hurts: Inverse Scaling in Test-Time Compute

**(b) Purpose:** First break: more test-time compute can *reduce* accuracy. Establish the inverse-U empirically and name the failure modes, motivating difficulty-aware budgets.

**(c) So What?** All of Act 2 said more thinking helps. Sometimes the opposite is measurably true: give a model more room to think on an easy question and it talks itself out of the right answer. The dial you just watched the labs ship has a wrong setting — and easy problems hit it first.

**(d) Core content:**
- **The headline result.** "Inverse Scaling in Test-Time Compute" (arXiv:2507.14417; preprint; Anthropic Fellows program *[verify author list during build]*): constructed tasks where "extending the reasoning length of Large Reasoning Models (LRMs) deteriorates performance, exhibiting an inverse scaling relationship between test-time compute and accuracy" (verbatim). Five distinct failure modes (verbatim list): "Claude models become increasingly distracted by irrelevant information; OpenAI o-series models resist distractors but overfit to problem framings; models shift from reasonable priors to spurious correlations; all models show difficulties maintaining focus on complex deductive tasks"; and "extended reasoning may amplify concerning behaviors, with Claude Sonnet 4 showing increased expressions of self-preservation." Four task categories: simple counting with distractors, regression with spurious features, deduction with constraint tracking, advanced AI risks.
- **The earlier overthinking evidence.** Chen et al., "Do NOT Think That Much for 2+3=?" (arXiv:2412.21187; preprint): o1-like models spend orders of magnitude more tokens on trivial problems with negligible benefit — the canonical padded "2+3" trace; accuracy vs length is an **inverse-U**, and easy problems peak (then decline) at shorter lengths than hard ones. (Ship the repo's honestly-flagged authored inverse-U shape for Aug 3; digitize a real task-pair series + threshold tokens for camera-ready, verifying exact values against 2507.14417.)
- **Connective tissue.** This is the mechanism-level justification for page 11's effort dials and page 12's Snell allocation: *because* the response to thinking is non-monotone and difficulty-dependent, budget must be matched to the problem — adaptive compute is the product answer to the inverse-U (margin: arXiv:2507.02076).

**(e) Interactive:** PredictBar first ("Doubling thinking on an easy problem will: help / do nothing / hurt" — targeting the intuition the deck itself built). Thinking-length slider driving easy + hard `inverseU` curves on one `LineChart`; readout card flips to the `wrong` tone past the easy peak ("overthinking zone"). Failure-mode chip row (the five modes), each revealing a one-line authored micro-example.

**(f) Citations:** arXiv:2507.14417 (preprint) · Chen et al. (arXiv:2412.21187; preprint) · margin: arXiv:2507.02076.

**(g) Implementation:** Salvage legacy `Page18.tsx` + `inverseU` in `frontier.ts` (unchanged). Reuse `overthinking.json` (`easyPeak < hardPeak`, provenance already honest about authored shape); camera-ready NEW `inverse-scaling-ttc.json`. Tests: renumbered `act3.test.ts` block (single interior max; `easyPeak < hardPeak`; preprint flags); NEW `Page13.test.tsx` (zone-card class flip, five chips, non-blocking prediction). Handoff: *"Overthinking at least shows up in the score. The next failure doesn't: the transcript itself can lie."* **Effort: M.**

### Page 14 — The Honest Transcript: Chain-of-Thought Faithfulness

**(b) Purpose:** The stated chain of thought is evidence, not testimony: measure how often reasoning models *verbalize* the actual cause of their answer, and why this matters for the safety plan of monitoring CoT.

**(c) So What?** Pages 9 and 15 both grade the transcript — but grading assumes the transcript *is* the reasoning. Plant a hint that flips a model's answer and read its explanation: most of the time, the hint is never mentioned. If the working can silently omit the real reason, a clean-looking chain proves less than it seems.

**(d) Core content:**
- **The measurement.** Chen et al. (Anthropic Alignment Science), "Reasoning Models Don't Always Say What They Think" (arXiv:2505.05410; preprint). Setup: 6 hint types inserted into prompts; faithfulness = whether the CoT acknowledges the hint *in the cases where the hint demonstrably changed the answer*. Abstract, verbatim: "for most settings and models tested, CoTs reveal their usage of hints in at least 1% of examples where they use the hint, but the reveal rate is often below 20%"; overall per-model reveal rates (paper body; the repo's verified anchors in `faithfulness.json`): **Claude 3.7 Sonnet 25%, DeepSeek R1 39%**. Also verbatim: "outcome-based reinforcement learning initially improves faithfulness but plateaus without saturating," and "when reinforcement learning increases how frequently hints are used (reward hacking), the propensity to verbalize them does not increase, even without training against a CoT monitor." Faithfulness is *lower on harder questions* (GPQA vs MMLU — verify exact deltas before quoting in-app).
- **The stakes.** Abstract, verbatim: "Chain-of-thought (CoT) offers a potential boon for AI safety as it allows monitoring a model's CoT to try to understand its intentions and reasoning processes" — this page shows the monitor's window is partly frosted, and RL does not un-frost it.
- **The precursor.** Turpin et al., "Language Models Don't Always Say What They Think: Unfaithful Explanations in Chain-of-Thought Prompting" (arXiv:2305.04388; **NeurIPS 2023**): biased-context unfaithfulness predates reasoning models — this is a property of CoT itself, not an R1-era regression.
- **Connective tissue.** Page 9's PRM graded steps assuming the steps are the computation; page 15's debate will hinge on what transcripts prove. Stamp models *early-2025*; refresh for camera-ready.

**(e) Interactive:** (i) *(camera-ready)* Plant-one-hint exhibit: toggle inserts "a Stanford professor thinks the answer is (B)" into a question card; side-by-side authored transcripts — answer flips A→B while the transcript never mentions the professor ("authored reconstruction of the paper's protocol" chip). (ii) The confession meter (Aug 3): model toggle (Claude 3.7 ↔ R1), "plant a hint in 100 questions" batch button, seeded Monte Carlo converging to 25% / 39%.

**(f) Citations:** Chen et al. (arXiv:2505.05410; preprint) · Turpin et al. (arXiv:2305.04388; NeurIPS 2023).

**(g) Implementation:** Salvage legacy `Page19.tsx` + `faithfulnessAdmitRate` in `frontier.ts`; reuse `faithfulness.json` unchanged (its provenance already documents the misalignment sub-figure source conflict — resolve against the primary paper for camera-ready). `FAITHFULNESS_DEMO` in `authored.ts` (camera-ready). Tests: renumbered MC-convergence block (25/39 ±1.5); NEW `Page14.test.tsx` (toggle/batch/reset, date stamps; hint-exhibit assertions at camera-ready). Handoff: *"If the transcript can't be trusted, how do we judge whether the thinking is real? That's now an open scientific fight — and you're on the jury."* **Effort: S–M.**

### Page 15 — You Be the Judge: The Illusion-of-Thinking Debate

**(b) Purpose:** Present a live scientific controversy — does reasoning "collapse" past a complexity wall, or does the evaluation? — and let the reader flip the scoring rule and watch the verdict change, then read the synthesis.

**(c) So What?** A famous experiment says reasoning models hit a wall and give up. A famous rebuttal says the wall was largely the grading script. Both are partly right — and you can reproduce the whole argument with one slider and one toggle. This is what the frontier of knowledge actually looks like: preprints, artifacts, and a real residual wall smaller than the headline.

**(d) Core content:**
- **The prosecution.** Shojaee et al. (Apple), "The Illusion of Thinking" (arXiv:2506.06941; preprint): on controllable puzzles (Tower of Hanoi, River Crossing, …), "LRMs face a complete accuracy collapse beyond certain complexities" (verbatim); counter-intuitively, "their reasoning effort increases with problem complexity up to a point, then declines despite having remaining token budget" (verbatim, abstract *[confirm "adequate" vs "remaining" against the PDF]*); three regimes (verbatim): low-complexity tasks where standard models outperform LRMs, medium-complexity where LRMs show advantage, high-complexity where both collapse.
- **The defense.** The token-limit critique (Opus & Lawsen, "The Illusion of the Illusion of Thinking," arXiv:2506.09250 — a comment the author later described as partly tongue-in-cheek; cite as commentary, per the currency review, not as the definitive rebuttal): a 15-disk Hanoi solution requires **2¹⁵ − 1 = 32,767 moves** — the solution *length* is exponential while the solution *algorithm* is trivial, so models hit output ceilings and were scored as failures, sometimes while explicitly saying they were truncating; River Crossing instances with **N ≥ 6 are mathematically unsolvable** yet were scored as failures (the repo's `illusion-of-thinking.json` already carries `riverCrossingImpossibleN: 6`).
- **The synthesis (the third witness).** "Rethinking the Illusion of Thinking" (arXiv:2507.01231; preprint): under fairer scoring the cliff *moves but does not vanish* — a real residual wall around ~8 disks *[verify exact figure and conditions against the paper before shipping]*: partly artifact, partly real.
- **Connective tissue.** The scoring-rule flip is page 9's ORM lesson at benchmark scale: *what you grade determines what you conclude* — grade move-enumeration and Hanoi "collapses"; grade the algorithm and it's "solved," until the real wall where both rules fail.

**(e) Interactive:** Salvaged Hanoi exhibit: disks slider (1–12), live `2^N − 1` move count, token meter vs a 32k budget bar. Prosecution / defense / synthesis witness cards. The verdict toggle (score by enumeration ↔ by algorithm) flips **COLLAPSE ↔ SOLVED** — framed as "you changed the *experiment*, not the model"; past the synthesis wall a third verdict state reads "COLLAPSE — under either rule."

**(f) Citations:** Shojaee et al. (arXiv:2506.06941; preprint) · Opus & Lawsen (arXiv:2506.09250; commentary) · "Rethinking the Illusion of Thinking" (arXiv:2507.01231; preprint).

**(g) Implementation:** Salvage legacy `Page20.tsx` + `hanoiMoves`/`hanoiTokens`/`enumerationSolved`/`algorithmSolved` in `frontier.ts`; NEW `courtVerdict(disks, scoring, params): "solved" | "collapse-artifact" | "collapse-real"` (pure). Reuse `illusion-of-thinking.json` (update citation/provenance re: Lawsen framing); camera-ready NEW `illusion-synthesis.json` (`realWallDisks`, cite 2507.01231). Tests: renumbered block (2^N−1; verdict flips; `riverCrossingImpossibleN === 6`); `courtVerdict` state table; NEW `Page15.test.tsx` (three witness cards, three verdict states, the commentary-framing note). Handoff: *"You've watched it think, changed its mind, and watched it break. One question is left — the one we started with."* **Effort: M** (interim port S).

### Page 16 — Back to the First Thought: The Grand Sandbox

**(b) Purpose:** Synthesis bookend: answer page 1's stake in plain words, then hand the reader every lever at once with an accuracy/cost readout and a pre/post quiz measuring what they learned.

**(c) So What?** Page 1 asked whether a machine constructing an answer is different from recalling one — and whether the constructing is worth buying. The honest answer, earned over 15 pages: thinking longer does make it better — *lawfully, within limits*: it plateaus (7), can't always be cashed in (8, 12), can backfire (13), hits walls (15), and the transcript reporting it may omit the truth (14). Prices fall ~40×/yr and the frontier keeps moving — but the shape of the trade doesn't.

**(d) Core content:** No new claims — every number in the sandbox echoes its source page (the `sandbox.ts` header documents the mapping: the 18↔57 base range is Wei/page 5; the voting plateau is Wang/page 7; the verifier cap is Stroebl/page 8; the budget-forcing hump is the page-13 inverse-U; the search lever is Yao/page 10). The one new mechanic is the payoff of Snell (page 12): an **"auto-tune (compute-optimal)"** button that grid-searches the lever space under a cost cap — the reader watches a principled allocation beat their hand-tuning, margin-cited to arXiv:2408.03314 and stamped *Snell's 2024 setup*. Bookend copy card must testably reference page 1's question; per-act one-line recaps link back by page number.

**(e) Interactive:** Skippable 5-question pre-quiz (extend `QUIZ` from 3: add a cost-shape question — "prices fell ~1000×; did the diminishing-returns shape change?" — and a faithfulness question); the six-lever mixing desk (`cotEnabled, samples, verifier, treeBranching, budgetForcing, computeBudget` → `sandboxOutcome` accuracy/cost readout); auto-tune button; post-quiz with learning-gain readout; extended `RESOURCES` (add 2507.14417, 2507.01231, ARC Prize leaderboard, Epoch price/energy pages); keep the "illustrative, not predictive" disclaimer.

**(f) Citations:** Synthesis across the deck's corpus (each lever cites its source page); Snell et al. (arXiv:2408.03314) for auto-tune.

**(g) Implementation:** Salvage legacy `Page21.tsx` nearly whole; `sandbox.ts` + Zustand store unchanged except NEW `autoTune(costCap)`; extend `quiz.ts` (+2 questions; fix its "Page 20" docstring → 16); fix hardcoded "20 simulations" → `PAGES.length`. Tests: extend `sandbox.test.ts` (`autoTune` beats defaults at equal cost; budget forcing past 4 reduces accuracy); NEW `Page16.test.tsx` (skippable quiz, bookend stake-answer string, gain readout, ≥12 resources); E2E full 1→16 journey. No handoff — end of deck. **Effort: M.**

---

## Flow assessment — pages 1–10 (fixes, priority order)

The 1→10 arc is strong, and the built pages already match the reference plan's rigor for slides 4–10 (Wei's verbatim emergence claim and PaLM 8/62/540B points on page 5; Kojima + Feng 2023 / Merrill & Sabharwal 2024 expressivity margin notes on page 6; Wang's verbatim 56.5→74.4 on page 7; Cobbe + Stroebl on page 8; Lightman on page 9; Yao + measured thought-counts on page 10). Fixes:

1. **Page 2 Spain placeholder — verify, don't replace.** Resolve the red "authored placeholder · verify before shipping" chips ([Page2.tsx](web/src/components/pages/Page2.tsx) ~lines 215/362): verify the actual 2026 World Cup result, update the authored count, log per `web/data/README.md`. Analogy replacement (slide_issues.md) deferred to camera-ready with user-test data.
2. **Stale act metadata** in `pages.ts` (Act 2 = 5–14, Act 3 = 15–21) leaks into every kicker and the landing TOC — shipping blocker, fixed in migration.
3. **Page 10 Act-3 bridge.** Fix the stale "the rest of this act" (~line 598) → "the rest of the story"; add a Step-3 handoff card (page 5's `border-l-4 border-compute` pattern): *"You built this search by hand: branch, score, prune, back up. In 2025 the labs stopped building it by hand — they trained models to do it to themselves, mid-sentence, with one word: 'Wait.'"* + test assertion.
4. **Rigor deltas vs the reference plan (cheap margin additions):** page 9 — add Uesato et al. 2022 (arXiv:2211.14275, the original outcome-vs-process comparison) as a margin reference beside Lightman; page 10 — add Graph of Thoughts (Besta et al., AAAI 2024, arXiv:2308.09687) to the margin note as the generalization, and make the ">100× the compute of a single CoT pass" cost contrast explicit next to the existing thoughts-scored counter.
5. **Page 6 stale forward reference** to "page (15)" (~line 393 + header comment) → "trained into the model itself on page 11."
6. **Page 3 length trim (if time allows):** demote energy/CO₂ material to a margin note forward-linking to page 12 ("the meter returns with a price tag").

## Migration (day 0 — do FIRST, ~half day)

All in [pages.ts](web/src/lib/pages.ts) unless noted:
1. **ACTS:** `1: 1–4 "Building Intuition"`, `2: 5–10 "The Toolbox"`, `3: 11–16 "Frontier & Caveats"`.
2. **PAGES:** delete legacy rows 11–15; re-slug 16→11 `learning-to-think`, 17→12 `the-bill-arrives`, 18→13 `overthinking`, 19→14 `faithfulness`, 20→15 `the-open-argument`, 21→16 `grand-sandbox`; milestones M5 (11–15) / M6 (16); update `concept` strings to the theses above.
3. **Routes:** repoint `web/src/app/p/11..16/page.tsx` imports; `rm -r web/src/app/p/17..21`.
4. **Components:** write-new `Page11.tsx`–`Page16.tsx` from salvage sources, delete each legacy file as it's superseded (legacy content stays live at its new number until its rewrite lands — per user decision 2).
5. **Tests hardcoding 21:** `tests-e2e/journey.spec.ts`, `smoke.spec.ts` (`toHaveCount(21)` → 16), `act3.spec.ts`; delete legacy `/p/13–14` cases in `act2search.spec.ts`; renumber `act3.test.ts` describe strings.
6. **Stale cross-refs:** page 6 "(15)" fix; `web/data/README.md` + `PROVENANCE.md` page tables; mark unused rows "reserved".
7. **`search.ts` orphans** (`logLinearCoverage`, `allocationScore`, `optimalAllocation`): keep (page 12 margin math + existing tests), note in module docstring.
8. Run full Vitest + Playwright *before* page work, so later failures are page bugs, not migration bugs.

## Risks

- **Unverified 2026 ARC-AGI-2 numbers.** All 2026 leaderboard figures are unverified leads. The verified base ships unconditionally (`arc-cost.json` o3 + Epoch ÷40/yr carry the collapse story); the 2026 layer is additive behind `SHOW_2026_LAYER`, transcribed from the live leaderboard with eval-set + cost-definition pinned and a `verified: YYYY-MM-DD` line in `PROVENANCE.md`. **Go/no-go Aug 1**; miss → Variant B, layer added for camera-ready. Variant-aware copy test prevents a half-flipped state.
- **Verbatim-quote debt.** Items marked *[verify verbatim]* (o1 blog sentences, R1 aha-moment wording vs the Nature version, 2506.06941 "adequate/remaining token budget," the ~8-disk synthesis wall, GPQA-vs-MMLU faithfulness deltas, 2507.14417 author list) must be checked against primary sources during build; any quote that can't be verified is paraphrased and de-quoted.
- **Digitization debt** (R1 response-length figure, 2507.14417 curves, 2507.01231 wall): each has an honest authored/params fallback already provenance-flagged; none blocks Aug 3.
- **Preprint volatility** (pages 13–15 rest on preprints): preprint chips, contested framing, numbers isolated in JSON; extend the preprint-flag test suite to new files.
- **Runway:** 6 pages × 1–1.5 days > 8 days at full polish → pages 14–15 ship as interim house-shelled ports (user decision 3); page 12 leans on its finished prototype; page 16 is ~80% salvage.
- **Contiguity:** `PageNav`/`ProgressRail` assume contiguous 1..N — 14/15 must ship (as ports), not be omitted.

## Build order (Jul 26 → Aug 3)

| Day | Work |
|---|---|
| Jul 26 (first action) | **Save this plan into the repo:** write it to `planning/act3_plan.md` and commit directly to `main`. |
| Jul 26 (0.5d) | Migration + test renumber; page 10 handoff; page 6 + page 9/10 margin fixes. In parallel (research): ARC-AGI-2 verification, page 2 World Cup verification, verbatim-quote checks. |
| Jul 27–28 | **Page 12** on the verified base layer; `econ.ts`; `CostScatter`; both copy variants. |
| Jul 29–30a | **Page 11** + response-length digitization. |
| Jul 30b–31a | **Page 13** on the existing authored shape. |
| Jul 31b | **Pages 14+15 interim ports** (engines re-shelled: lede/steps/margin/provenance; no new exhibits). |
| Aug 1 | **Page 16** capstone (bookend copy, quiz +2, `autoTune`). ARC-AGI-2 go/no-go. Page 3 trim if time allows. |
| Aug 2 | Full-deck pass: axe on 11–16, reduced-motion, mobile scroll containers, `journey.spec` green, provenance/README renumber, copy edit. |
| Aug 3 | Submit live URL + PDF abstract. |

**Camera-ready backlog (Oct 16):** page 14 hint exhibit + misalignment-figure resolution + frontier-model refresh; page 15 third-witness state + `illusion-synthesis.json`; page 13 digitized `inverse-scaling-ttc.json` + threshold tokens; page 12 2026 layer (if missed) + budget line; page 11 dial expansion; World-Cup-analogy decision (with user-test data); formative user test; optional methods/provenance page.

## Verification

1. **Anchor tests:** `npx vitest run` in `web/` — every new/renumbered assertion green (R1 endpoints, o3 75.7/87.5/172, econ math, inverse-U shape, 25/39 convergence, Hanoi verdict states, `autoTune`).
2. **Data validation:** the build validates every `web/data/*.json` against the citation/provenance schema (`curves.ts` throws at import) — a missing citation fails the build.
3. **E2E + a11y:** `npx playwright test` — smoke (16 pages), journey (1→16), act3 per-page interactions, axe clean on 11–16, reduced-motion.
4. **Manual pass:** walk 10→16 checking the handoff chain reads as one argument; toggle page 12's era layer in both variants; confirm every model/price claim carries an "as of" stamp, every preprint a chip, and every in-app verbatim quote traces to its `[verify verbatim]` check.
5. **Currency gate (pre-submission):** grep for unstamped dated claims; Spain placeholder chips gone; `SHOW_2026_LAYER` matches the verification log in `PROVENANCE.md`.
