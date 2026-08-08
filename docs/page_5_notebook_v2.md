# Page 5 notebook — rebuild plan

**Supersedes** the notebook described in [`page_5_refactor.md`](page_5_refactor.md), which was
built for Qwen3 with thinking off and a chain-share headline. Three ablations have since inverted
the page's premise. This is the plan for the notebook that replaces it; the spec changes it forces
are listed in §7.

**The finding the page now makes:** a 2026 instruct model reasons on a maths question unprompted.
You cannot make it reason, because it already does. You *can* stop it, and stopping it costs 36
points. Chain of thought did not fail to arrive; it arrived so completely that it stopped being a
prompt and became the default.

All numbers below are from `experiment_3`, MATH-500 levels 4-5, *n* = 100 paired items, and are
what the rebuilt notebook must reproduce.

---

## 1. The three conditions, and why only three

| condition | prompt | 3B accuracy | median tokens | chain share |
|---|---|---|---|---|
| `forced_blurt` | + "Give only the final answer. No explanation, no working, no other text." | 7% | **6** | 0% |
| `bare` | the question alone | **43%** | 573 | 100% |
| `zero_shot_cot` | + "Explain step by step." | **43%** | 709 | 100% |

`one_shot` and `few_shot` are **cut from the ladder.** They are not dropped for tidiness; they
measure the wrong thing. Across experiment 3 the few-shot gain is +1 to +15 and resolves in
exactly one cell, while the *boxed rate* moves 22% → 93% on one model and 47% → 84% on another.
The exemplar's job in 2026 is teaching `\boxed{}`, not teaching reasoning. That belongs in a
footnote, not on an axis. (Retained in the trace bank; see §5.)

---

## 2. Figure 1 — three tabs on one problem

One problem, one model, one decoding setting. Each tab carries a **"see the full prompt"**
disclosure above the model's output, so the reader can see that the prompts differ while the
outputs do not.

```
  ┌ forced blurt ┬ bare ┬ + "Explain step by step." ┐     <- reader lands on `bare`
  │ ▸ see the full prompt                            │
  │ ------------------------------------------------ │
  │ [the model's output, walked a step at a time]     │
  │ ✗ 27   ·   6 tokens   ·   0 steps                 │
  └──────────────────────────────────────────────────┘
```

**Three tabs, not two.** This is the one place I would change the plan as written. A two-tab
figure (blurt versus step-by-step) implies the instruction caused the chain, and our own data says
it did not: bare and step-by-step are the same column. The third tab is what makes the page 2026
rather than 2022 — the reader clicks from `bare` to `+ "Explain step by step."`, sees the prompt
change and the behaviour not change, and the page's thesis lands without a sentence being spent
on it.

Tab order matches figure 2's bar order left to right, so the two figures are one argument.

**The stepper survives.** Back / Next / Play walking the chain a line at a time is the best thing
on the current page and it carries over unchanged. What changes is that the chain is the model's
*default* output rather than something an exemplar induced.

**Specimen curation**, from the sweep, never generated for the figure:

- required: `forced_blurt` wrong **and** `bare` correct
- preferred, in sort order: `zero_shot_cot` also correct (so all three tabs are populated);
  `bare` under `MAX_SPECIMEN_TOKENS` (260) so the chain fits on screen; then shortest; then
  `problem_id` for determinism
- **blocking gate:** no qualifying problem sets `specimen_is_fallback: true`, and that run is not
  translatable. Figure 2 and 3 are unaffected.

**Step segmentation stays in the notebook**, emitted per tab with contiguous token ranges covering
every token. It is a formatting rule, not a reasoning measure (§7), and it is used here only to
decide where the reveal pauses.

---

## 3. Figure 2 — the cost of not reasoning

Three bars, one model, 95% Wilson intervals, with the paired contrast annotated beneath:

```
  forced blurt              ███                                7%
  bare                      ████████████████████              43%
  + "Explain step by step." ████████████████████              43%

  suppression:  -36 points   ·   40 problems broken, 4 fixed   ·   p < 0.0001
  the instruction: +0 points ·   12 broken, 12 fixed           ·   95% CI [-9.6, +9.6]
```

**Both contrasts are paired McNemar, not overlapping Wilson intervals.** Every condition runs on
the same items, so the independent-interval test throws away the pairing and would call a
perfectly symmetric 12-versus-12 tie "unresolved" rather than measured.

**The null needs an equivalence bound, not a p-value.** The page wants to claim the instruction
does nothing, and `p = 1.0` does not support that — absence of evidence is not evidence of
absence. The notebook emits the 95% CI on the paired difference so the caption can say *any effect
is smaller than ten points* rather than *there is no effect*. Measured:

| model | bare → +step-by-step | 95% CI | discordant |
|---|---|---|---|
| Qwen2.5-1.5B | +7.0% | [−1.4, +15.4] | 13 / 6 |
| Qwen2.5-3B | +0.0% | **[−9.6, +9.6]** | 12 / 12 |
| Qwen2.5-7B | +2.0% | [−5.8, +9.8] | 9 / 7 |

**One honest detail to carry:** on the 1.5B the instruction *does* do something visible — chain
share moves 87% → 100%. It finishes the chaining behaviour on the weakest model and still does not
convert that into accuracy. Worth a clause; it stops the null reading as "the words are inert."

---

## 4. Figure 3 — my recommendation: yes, but not as a size chart

**Do not draw model size on an axis, and do not use the word emergence.**

Three reasons. Emergence in Wei et al. is a *sign flip* — CoT hurts below a threshold and helps
above it. Our three points show a smooth monotone trend with no threshold and no sign flip, so the
data cannot show emergence; it can only be misread as showing it. Second, three points are not a
scaling law, and a line through them invites extrapolation the run cannot support. Third, page 11
owns the scaling law in the deck's structure, and the 7B ran at 8-bit, which puts a precision
asterisk on the most dramatic point.

**Draw the finding that is actually there instead.** Three model rows, two bars each:

```
                    gagged        left alone
  Qwen2.5-1.5B      ██  4%        ███████████ 22%
  Qwen2.5-3B        ███ 7%        ██████████████████████ 43%
  Qwen2.5-7B        ████ 11%      ██████████████████████████████ 60%
                    └── the floor is flat ──┘
```

The right-hand bars fan out. **The left-hand bars do not.** Gagged, a 7B and a model a quarter its
size are nearly indistinguishable, and the headline sentence writes itself:

> A 7B forbidden to reason scores **11%**. A 1.5B allowed to reason scores **22%**. The chain is
> worth more than four times the parameters.

That is a stronger claim than the size story, it is ours, it is paired and testable, and it
carries no emergence implication. The notebook runs McNemar on that cross-model comparison
explicitly rather than leaving it to the eye.

**On page inflation:** it is net-neutral. It replaces the PaLM scaling chart currently occupying
step 2 of the live page, and the data already exists — no new sweep, one extra chart cell.

**If it must be cut**, cut it. Figures 1 and 2 carry the page alone, and figure 3's job is only to
show the effect is not one checkpoint's accident.

---

## 5. The close

The current close hands page 6 a size claim that page 6 does not use. Replace it with the token
cost, which is what page 6 actually opens on:

- gagged: **6 tokens**, 7% solved
- left alone: **573 tokens**, 43% solved

Roughly **95× the tokens** for 36 points. The sentence: the chain is not free, and nobody has
asked yet how much of it is load-bearing.

**The reader's own experience is the bridge, and it belongs here rather than on figure 2.** Telling
a reasoning model to answer now instead of continuing to think is exactly page 6's intervention —
cap the budget, force the commit. Putting the analogy in figure 2's caption would spend page 6's
opening on page 5. In the close it is the handoff:

> You have done this. You told the model to skip the working and answer, and the answer got worse.
> Page 6 asks how much of that working it actually needed, and what happens when you cut it off
> mid-sentence.

---

## 6. Notebook architecture

**Self-contained, not a reader of `experiment_3`.** The pipeline's whole claim is that a skeptical
reader downloads the notebook and re-runs it, so page 5's notebook runs its own sweep. It is small:
3 conditions × 100 items × 3 models = **900 generations**, roughly an hour. Its numbers must agree
with experiment 3's, which is a free cross-check rather than duplicated effort.

```
PRESETS = {
  "QUICK": model_ids=["Qwen/Qwen2.5-1.5B-Instruct"],  n_items=50,  figure_3=False,
  "FULL":  model_ids=["Qwen/Qwen2.5-1.5B-Instruct",
                      "Qwen/Qwen2.5-3B-Instruct",
                      "Qwen/Qwen2.5-7B-Instruct"],    n_items=100, figure_3=True,
}
BAND = "math500_l45"      # same band in both modes, so QUICK previews FULL
PRIMARY = "Qwen/Qwen2.5-3B-Instruct"   # figures 1 and 2; bf16, no precision asterisk
CONDITIONS = ["forced_blurt", "bare", "zero_shot_cot"]
GEN_CAP = 2048
```

`QUICK` stays on L4-5 rather than dropping to L3: the band rule (L3 for 1.5B) exists for
*elicitation* headroom, and the suppression effect resolves comfortably on the 1.5B at L4-5
(+18, 22/−4, p = 0.0005). Same band in both modes means `QUICK` is a genuine preview.

`PRIMARY` is the 3B, not the 7B. The 7B's +49 is more dramatic but it ran at 8-bit, and the page's
headline number should not carry a quantisation caveat.

**Reuse from `experiment_3`, verbatim:** the condition suffixes, `n_steps`, `tokens_to_answer`,
`mcnemar`, `box_exemplar`, the `TraceStore` key shape, the duplicate-key guard. Page 5's notebook
should not re-derive any of them differently or the two banks stop being comparable.

**Gates**, emitted into `derived.json.claims`:

| flag | condition | consequence if false |
|---|---|---|
| `suppression_resolves` | McNemar p < 0.05 on blurt vs bare, primary model | **not translatable** — the page's core claim |
| `instruction_null_bounded` | 95% CI on bare vs cot within ±15 points | the caption says "did not resolve", never "does nothing" |
| `specimen_usable` | figure 1's triple found, not fallback | **not translatable** — figure 1 is illustrative only |
| `floor_is_flat` | blurt accuracies within 10 points across models | figure 3 drops its headline sentence |
| `may_compare_across_models` | figure 3 ran and quantisation is recorded per model | figure 3 drops |

**Integrity checks**, each raising rather than warning:

1. duplicate-key guard on the trace bank (two processes have done this before)
2. truncation **per condition** at a 5% budget — a cap that clips only the reasoning conditions is
   a scoring penalty aimed at the page's argument
3. boxed rate per condition, reported; `forced_blurt` will be low by construction and that is the
   one place it is expected
4. blurt compliance: median tokens under `COMPLIES_UNDER` (40). If the primary model refuses the
   instruction the page has no floor and the run is not translatable

**`derived.json` shape:**

```
claims{...}                 read before any number
figure_1{ problem_id, question, ground_truth, prompt_stem,
          tabs[3]{ condition, prompt_before, prompt_after, trace, tokens,
                   steps[{text, token_start, token_end}], tokens_generated,
                   extracted_answer, correct },
          specimen_is_fallback, n_candidates }
figure_2{ model_id, conditions[3]{ accuracy, ci, median_tokens, p90_tokens,
                                   chain_share, boxed_rate, n },
          contrasts[2]{ pair, delta_pts, discordant_hi, discordant_lo, p, ci } }
figure_3{ models[3]{ tag, params, quant, blurt_accuracy, bare_accuracy,
                     blurt_median_tokens, bare_median_tokens,
                     delta_pts, discordant, p },
          floor_spread_pts, cross{ gagged_large, ungagged_small, delta, p } }
close{ blurt_tokens, bare_tokens, token_multiple, delta_pts }
manifest{...}
```

`figure_3.models[].quant` is mandatory: the 7B is 8-bit and the page must be able to say so.

`figure_3.models[].{blurt,bare}_median_tokens` were added when the close became a chart of tokens
against accuracy. Without them the page could plot that pair for the primary only, which is how it
came to print a token count that never said which of the three checkpoints had written it.

---

## 7. Spec changes this forces

Changes to [`page_5_refactor.md`](page_5_refactor.md), to be made in the same commit series:

1. **§0 dies.** "Thinking stays OFF for the entire page" was about hybrid Qwen3. Plain instruct
   checkpoints have no toggle; the constraint becomes "no thinking mode exists here."
2. **§2's primary axis reverses back to accuracy.** It was demoted because a Qwen3-0.6B run put
   every rung between 0% and 8%. That reason is gone: at *n* = 100 with a 3B at 43% bare, the
   contrast is p < 0.0001. Chain share stays, demoted to what it is — a blurt detector that
   verifies the manipulation worked, never a measure of how much reasoning happened.
3. **§3's instrument becomes the Qwen2.5 family**, MATH-500 L4-5, with the band rule recorded.
4. **§6 gains the paired-test requirement** and the equivalence-bound rule for the null.
5. **§1's model-size exclusion is amended, not lifted.** Figure 3 carries no size axis. It compares
   named checkpoints and its claim is about the flat floor, not about scale.
6. **The one-shot and few-shot rungs leave the ladder**, with the boxed-rate reason recorded so it
   is not relitigated.
7. Narrative beats 1 and 2 in §1 invert: not "add four words and a chain appears" but "the chain is
   already there, and taking it away costs 36 points."

---

## 8. Order of work

1. Spec revision (§7) — the claims contract has to exist before the notebook writes against it.
2. Notebook rebuild, stubbed-model validated end to end before any real run.
3. `QUICK` run on the 1.5B, ~150 generations. Confirms the gates fire and figure 1 finds a
   specimen.
4. `FULL` run, 900 generations.
5. Page 5 translation, which is a separate pass and reads `claims` first.

**Open, and worth a decision rather than a default:** whether figure 3 ships at all (§4), and
whether the 7B's 8-bit precision is acceptable on a page that otherwise carries none.
