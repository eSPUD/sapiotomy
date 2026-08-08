# Page 11 — measuring the keystone: training vs. scale vs. test-time compute

**Status:** arm 0 implemented and run. `notebooks/page_11_training_vs_scale.ipynb` exists;
its `REPLAY` tier ran 2026-08-07 and **gate 1 passed bit-exactly** (max drift 0.0 against
pages 6/7/8's shipped aggregates), producing `out/page_11/derived.json` and the family
chart. Gate 2 and arms A–C are implemented in the same notebook and await a GPU. §2
(provenance) and §3 (prior evidence) are verified; §6's branches remain pre-registered —
no new generation has been seen.

## Why

Page 11 closes Act 2 on its biggest claim — parameters and test-time compute spend the
same FLOPs, and matched budget for budget the small thinker wins — and it is the last
data-bearing page in the act whose centerpiece is invented. The page's own footer says
so: the section-1 allocator curves are "authored illustrations pinned to the cited
findings, not digitized data." Pages 5–9 now replay their own measured runs; the
keystone asserts.

Worse, the current page's mechanism paragraph is contradicted by the deck's own
measurements. It says of hard problems: *"every chain breaks somewhere, so no number of
re-draws holds a right answer to find."* Page 7 measured the opposite on exactly these
items: the right answer appears somewhere in 16 samples for **78%** of them. The chains
do not all break; the *selectors* fail to find the survivors (vote 55%, trained verifier
60%, oracle 78%). A reader who walks pages 7→9→11 in order can catch the deck
disagreeing with itself. That alone justifies the refactor.

The refactor: derive the accuracy-vs-FLOPs picture from the runs the deck already owns,
add one cheap new arm — a small model *trained for reasoning* — and let the page state
what the instrument actually shows: on a 2026 post-trained family, sampling + realistic
selection does not substitute for parameters at matched FLOPs, and the knob that does
beat parameters is not more samples but different training. Which is the act seam: the
winning model's training recipe (rejection-sampled rationales, then RL against a
correctness verifier) is Act 3's table of contents.

## Non-goals

- **No live inference.** Same boundary as every notebook page: the notebook writes logs,
  the page reads them.
- **Not a refutation of Snell et al. or Wu et al.** One family, ~150 items, one grader,
  one date. The published results stay on the page as published results; ours is an
  instance on a 2026 instrument, and the page must scope it that way (§4.2, item 1).
- **No renumbering, no act-seam change.** The 11|12 boundary and the hand-off structure
  survive; the hand-off gets *evidence* instead of a promise.
- **Steps 3–4 of the current page (Wu's Pythia bands, REBASE Pareto) are kept.** They
  become the published-era receipts beside our measured era-instance, not casualties.

---

## 1. The claim under revision

Current page (borrowed, authored):

- **A1** — parameters and test-time compute are one currency.
- **A2** — matched budget for budget, a small model that thinks beats a 14× larger one,
  except on the hardest problems.
- **A3** — mechanism: "thinking amplifies competence; only parameters create it."
- **A4** — hand-off: page 12 will fix the waste and the hard boundary.

Proposed page (owned, measured, conditional on §6's branches):

- **B1** — on our post-trained 2026 family, the published crossing does not appear at
  matched FLOPs: 6.5× the big model's bill buys the small model a tie at best.
- **B2** — the failure is localized: coverage says the small model holds correct chains
  (78%); every realistic selector fails to cash them (55/60 vs. the 7B's 60). The gap
  between coverage and selection is where the law's premise died.
- **B3** — what does beat parameters is training aimed at reasoning: a 1.5B model whose
  recipe is rejection-sampled rationales + verifier-rewarded RL, measured against the
  general 7B's greedy answer at ~5× fewer inference FLOPs per answer.
- **B4** — hand-off, now measured: the winning recipe *is* pages 12–14 (STaR-style
  filtering, then GRPO with a verifiable reward).

A1 survives unchanged (it is an accounting identity, not an empirical claim). A2 is
what the experiment tests. A3 is rewritten: **"thinking amplifies what the weights
hold; only weights create it — bigger, or better-trained."**

## 2. Training provenance, verified (2026-08-07, primary sources)

The premise "the Instruct models were not trained to reason" is **false**, and the page
must not say it. From the Qwen2.5 Technical Report (arXiv 2412.15115, §4, quoted from
the PDF):

- SFT includes math chain-of-thought **distilled from Qwen2.5-Math** ("we introduce the
  chain-of-thought data of Qwen2.5-Math … we employ rejection sampling along with reward
  modeling and annotated answers"), plus 70K logical-reasoning queries filtered for
  "incorrect answers or flawed reasoning processes."
- Offline RL is DPO (~150K pairs) on "objective query domains such as mathematics,
  coding, instruction following, and logical reasoning," positives validated by
  execution feedback and answer matching.
- Online RL is GRPO against a reward model whose labeling criteria are "truthfulness,
  helpfulness, conciseness, relevance, harmlessness and debiasing" — **no correctness
  signal**.

From the Qwen2.5-Math Technical Report (arXiv 2409.12122):

- Continued pretraining on Qwen Math Corpus v2, "from 700B to over 1T" tokens,
  initialized from Qwen2.5 base.
- SFT built by **iterated rejection sampling**: "select the top-k reasoning paths with
  correct final answers," 2.5M CoT samples, RM and SFT model improving each other across
  rounds. SFT problems include "the training set of GSM8K, MATH, and NuminaMath."
- RL is **GRPO with a rule-based correctness verifier in the reward**,
  r = σ(α·r_m) + (r_v − 1), on 66K queries kept only when 2–5 of 8 samples were correct.
- Pretraining data is decontaminated "against datasets such as GSM8K and MATH" (test
  sets).

So the honest contrast is **dose and mechanism, not presence and absence**: the general
Instruct model *ingested the outputs* of the reasoning loop (distilled CoT, one
correctness-checked DPO pass) inside an assistant recipe; the Math model *was trained by
the loop* — repeatedly, with a verifier in the reward. The page claim is:

> a model trained **by** the reasoning loop beats a ~5× larger model that merely
> studied the loop's outputs, at ~5× fewer inference FLOPs per answer.

Two footnotes this obligates on the page: (1) the Math model's SFT contains the MATH
*training* split — train-distribution exposure is part of what "trained to reason on
math" means, and it must be said; (2) the win is attributed to the **bundle** (corpus +
filtered rationales + verifier RL) — the reports publish no ablation separating them,
so neither may we.

## 3. What the deck already measured (no new compute)

All on the same 100 MATH-500 L4/5 items, same ch03 grader. FLOPs per answer accounted
as 2·P·tokens_generated with measured token counts.

| Configuration | Source | Accuracy | Inference FLOPs vs 7B greedy |
|---|---|---|---|
| 1.5B-Instruct greedy, uncapped | page 6 (`figure_2`, budget 2048, 567 mean tok) | 22% | ~0.17× |
| 3B-Instruct greedy, uncapped | page 6 (693 mean tok) | 43% | ~0.43× |
| **7B-Instruct greedy, uncapped** | page 6 (656 mean tok) | **60%** | 1× |
| 3B majority-of-16, T=0.3 | page 7 | 55% | ~6.4× |
| 3B best-of-16, trained verifier | page 8 | 60% | ~6.4× + judge FLOPs |
| 3B coverage@16 (oracle selector) | page 7 | 78% | — (unrealizable) |

Two prior results bear directly on the crossing and are already in shipped
`derived.json`s:

- **Page 7, fixed-budget split:** splitting one token budget into N sampled chains and
  voting never beat spending it on one chain (`splitting_pays: false`,
  `best_split_n: 1`). This is the within-model FLOPs-matched substitution test, and it
  failed.
- **Page 7, vote vs one sampled chain:** +4 points, p = 0.39 — not a difference. The
  significant +12 is against the *greedy* chain. Voting's measured value on this
  instrument is mostly noise-averaging over sampling, not new competence.

So before any new generation, the existing artifacts already say: at 6.4× the big
model's bill, the strongest selector we own ties it. The new arms decide what that
means (§6).

## 4. The argument audit — does the refactor make the argument stronger?

Pre-registered and deliberately neither optimistic nor pessimistic. The refactor is
justified only if the entries in 4.1 survive the entries in 4.2.

### 4.1 Where the argument strengthens

1. **Owned vs. authored.** The act's payoff page stops being its only invented
   centerpiece; every number becomes re-derivable from a download, like pages 5–9.
2. **An internal contradiction is repaired.** A3's "every chain breaks" is refuted by
   our own coverage measurement; B2 replaces it with the mechanism the deck actually
   observed (selection, not coverage, is the bottleneck — and Stroebl et al., already
   cited on the page, is the published form of exactly that point).
3. **The act seam becomes an argument instead of a promise.** "Why did the frontier
   move to training models to reason?" currently gets answered by page 13's citations;
   B3 answers it with a measurement two pages earlier, on the deck's own instrument.
4. **Continuity of instrument.** Same checkpoints, same items, same grader as pages
   5–9; the family chart's 3B points *are* pages 6–8's numbers, cross-checked, not new
   claims.

### 4.2 Where it weakens, and what that obligates

1. **Scope shrinkage.** Snell and Wu measured many budgets, strategies, and bins; we
   have one family on ~150 items. The page trades a general law for a case study. It
   must present ours as *an era-instance beside the published results*, never as their
   replacement — hence keeping steps 3–4 intact.
2. **The difficulty-band confound (the serious one).** Our 100 items are L4/5 —
   **Snell's hard regime, where his own law says parameters win.** On existing data
   alone, "the crossing is gone" is not an update to Snell; it is consistent with him.
   The easy-band arm (§5, arm A) is therefore **mandatory** before B1 may be claimed.
   If the crossing appears on easier items, B1 is rewritten (§6, branch 2) — and that
   page is also fine.
3. **The machinery confound.** Snell's compute-optimal result uses PRM-guided search
   and revisions with per-difficulty allocation; our best selector is best-of-16 under
   an off-the-shelf PRM (gated at AUC 0.89 on page 9). "No crossing" could partly mean
   "weaker machinery." Page 8's trained-verifier tie blunts but does not remove this;
   the page must carry it as a stated limit, not bury it.
4. **The attribution bundle.** B3 cannot separate corpus, MATH-train exposure,
   rejection-sampled SFT, and verifier RL (§2). The claim is the bundle. Any page copy
   implying "RL did it" overclaims.
5. **Parity arithmetic stacks the deck.** At matched FLOPs, a 2.3× parameter gap buys
   the small model ~2.5 samples — too few for voting to operate. Small-gap crossings
   are impossible by arithmetic, not by discovery, and the figure caption must not
   present that arithmetic as an empirical finding. (The 14× pair — 0.5B vs 7B, 15
   samples at parity — is where voting has room, and where the model is weakest. That
   tension *is* Snell's difficulty story and should be stated as such.)
6. **A real pedagogical cost.** The current headline — "a small model that thinks can
   beat a 14× larger one" — is crisp, memorable, and true as published. Its replacement
   is conditional and hedged. The act's closing sentence must be rewritten so the
   toolbox still lands: pages 7–8's within-model gains (+12 vote, +17 best-of-N over
   greedy) are untouched by any branch of this experiment, and the page should say so
   explicitly, or the reader leaves believing the whole act was for nothing.

**Verdict.** The argument gets stronger **iff** (a) the easy-band arm runs before B1 is
asserted, (b) §6's branches are written before the run, (c) the claim is scoped as an
era-instance with Wu kept as receipts, and (d) B3 is reported as the bundle. Under
those conditions every branch of §6 yields a page at least as defensible as today's,
and most branches yield a strictly stronger one. Absent condition (a), the refactor
would replace an authored illustration with an overclaimed measurement — worse than
what it replaces.

---

## 5. The experiment

Notebook `notebooks/page_11_training_vs_scale.ipynb`, standard REPLAY / QUICK / FULL
modes, shared trace-bank schema keyed by `model_id` + `config_id` + `sample_index`,
harness.py plumbing, manifest with `harness.fingerprint()`. Grading unchanged from
ch03. Follows the canonical pipeline in `page_6_refactor.md` §6.

### Arm 0 — derivation from existing artifacts (no GPU, gate 1)

Read `out/page_06/`, `out/page_07/`, `out/page_08/` and derive the family chart:
accuracy vs. measured inference FLOPs (2·P·tokens_generated), with the 7B greedy point
as the target, the 3B voting curve N=1..16, best-of-16, and the coverage line.

**Gate 1 (go/no-go for everything else):** the derivation must reproduce, exactly, the
shipped numbers — 3B greedy 43%, vote@16 55%, best-of-16 60%, coverage 78%, 7B greedy
60%. Degrades to a printed skip per missing upstream run, like page 7's.

### Arm A — the easy band (mandatory for B1)

50 MATH-500 items, levels 1–3, disjoint from the 100, same seed rule. General family:
1.5B and 3B at T=0.3, N=16 per item (page 7's protocol); 7B greedy. Decides whether the
crossing exists *anywhere* on our instrument, i.e. whether B1 is an era-update or a
difficulty artifact.

~1,650 generations, mostly small models. `QUICK` = 3B only, 25 items.

### Arm B — the specialist (the B3 arm)

`Qwen/Qwen2.5-Math-1.5B-Instruct`, its own chat template and recommended CoT system
prompt, chain cap 2048 (its context is 4K), on **both** item sets (100 L4/5 + 50 L1–3):
greedy, plus N=16 at T=0.3 for the voting overlay. FLOPs parity computed from
**measured** token counts — math-tuned models may write longer chains, and the ~4.9×
parameter ratio must not be presented as the FLOPs ratio if the chains differ.

**Gate 2 (before the full arm):** smoke test, greedy on 20 L4/5 items. If the Math
model lands far below the 7B (indicatively < 45% while 7B is at 60%), B3 is dead on
this instrument; stop and take §6 branch 5 rather than spending the run. The smoke test
also records mean chain length for the parity accounting.

~1,800 generations for the full arm, 1.5B — cheap.

### Arm C — optional rungs (run only if arms A–B land cleanly)

- **The floor:** 0.5B-Instruct, N up to 64 on the easy band — the measured "no amount
  of compute" curve for the game's hard mode, and the honest 14×-at-parity pair.
- **The third rung:** a base (non-instruct) checkpoint few-shot, making the training
  ladder *base → generalist → specialist* measurable within one family. Reuse page 5's
  base-arm traces if they cover these items; otherwise a new small run, or drop.

### Cross-checks (the drift traps, per house rule)

1. Arm 0 vs. shipped `derived.json`s (gate 1).
2. Arm B's grader on arm-A traces reproduces arm A's accuracies (same code path).
3. The page's TypeScript recomputation of `derived.json` from `traces.jsonl` — the
   standard step-4 cross-language agreement test.

## 6. Pre-registered outcome branches

Written before the run so the page cannot be steered by the result. Every branch ships.

| # | Result | Page treatment |
|---|---|---|
| 1 | No crossing on either band; Math-1.5B ≥ 7B greedy | Full B1–B4 as in §1. The strongest version of the refactor. |
| 2 | Crossing appears on the easy band; Math-1.5B ≥ 7B | B1 becomes: "the law holds where the model has headroom — and on a 2026 instrument that region has moved down the difficulty axis." Snell survives era-qualified; B2–B4 unchanged. |
| 3 | No crossing; Math-1.5B merely *ties* 7B greedy | B3 weakens to "matches at ~5× fewer FLOPs per answer" — still a substitution result, still the hand-off. Say "ties," not "beats." |
| 4 | Crossing on easy band; Math-1.5B only ties | Both halves qualified; the page leads with the coverage/selection mechanism (B2), which no branch threatens. |
| 5 | Math-1.5B clearly below 7B greedy (gate-2 stop) | The specialist claim is dropped, not massaged. The page becomes B1+B2 with the hand-off reverting to citation form (o1/R1 as the evidence training moves the wall). Report the negative in the notebook per the page-6 Wait precedent. |

B2 (coverage vs. selection) is the only claim no branch can kill: it is already
measured and shipped. It is therefore the page's load-bearing beam, and the layout
should reflect that.

## 7. Page rebuild (step 4, sketch — final layout decided at translation)

- **Step 1, the game, keeps its interaction** (size picks the curve, compute slides the
  marker) but the curves become the measured family from arms 0/A, per difficulty band.
  On the hard band the game is honestly unwinnable with the general family — and the
  verdict box says why (B2), instead of pretending. A third control appears:
  **training** — switching to the Math-1.5B curve is the winning move the size and
  compute knobs cannot find. The game's solution is the act transition.
- **Step 2 panels survive** as the published law (Snell's 4×/14×/R), reframed as "what
  was measured in 2024, on models before the reasoning recipes" — with the era note
  carrying §2's provenance in one sentence each.
- **Steps 3–4 (Wu) survive unchanged** as published receipts.
- **New closing figure:** the training ladder — base / generalist / specialist points
  at their measured FLOPs, if arm C runs; otherwise generalist vs. specialist.
- **Mechanism line rewritten:** "thinking amplifies what the weights hold; only weights
  create it — bigger, or better-trained."
- **Hand-off rewritten** to name the measured recipe: the model that won was trained on
  its own filtered rationales (page 12) and then by RL against a verifier (pages
  13–14).
- **Footer:** Simulated label is retired for section 1; Measured / Cited split per the
  page-9 pattern. Fidelity notes: MATH-train exposure (§2), bundle attribution (§2),
  machinery limit (§4.2.3), one-family scope (§4.2.1).

## 8. Cost and hardware

New generation ≈ 3,500–5,500 chains, all on ≤1.5B models except 7B greedy on 50 easy
items (350 chains) and optional arm C. Hours on the 16 GB tier used for pages 5–9; no
new hardware class. REPLAY stays laptop-CPU, ~1 min, per house standard.

## 9. Risks

- **Branch-2 embarrassment risk is nil by design** — every §6 branch ships, and §4.2
  froze the hedges before the data existed.
- **Math-model template drift:** Qwen2.5-Math's chat template and system prompt differ
  from the general family's; the notebook must render both from their own tokenizers
  and show the rendered prompts side by side in a section-0 cell, or the comparison is
  attackable.
- **Token-length asymmetry:** if Math-1.5B writes 2× longer chains, "5× fewer FLOPs"
  halves. Parity numbers come from measured tokens only (§5, arm B).
- **Truncation at cap 2048** on the easy band should be near zero (page 6 measured 6%
  on the *hard* band); assert it and report it.
- **Overreach in copy** is the main failure mode of this refactor. The reviewer
  checklist for step 4 is §4.2, items 1–6, read as prohibitions.

## 10. Sequencing

1. Arm 0 notebook + gate 1 (no GPU). If gate 1 fails, stop: the deck has a
   reproducibility bug worth more than this page.
2. Gate 2 smoke test (20 items, minutes).
3. Arm A, then arm B full; branch per §6.
4. Optional arm C.
5. Promote `derived.json` + `manifest.json` to `web/data/page-11-derived.json`;
   cross-language agreement test; page rebuild per §7; zip per house download pattern.
