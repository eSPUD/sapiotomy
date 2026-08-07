# Page 8 — how to make best-of-N actually win, measured

**Status:** plan. Written after auditing [`page_08_best_of_n.ipynb`](../notebooks/page_08_best_of_n.ipynb)
against page 7's real traces. Supersedes the *figure set* and the *dependency model* of
[page_8_refactor.md](page_8_refactor.md); that spec's bucketing, holdout and provenance
discipline survive intact.

**The premise, stated once:** best-of-N beats majority voting and beats a single chain when
the verifier is good enough. The job of this plan is to find the setting where that is true
for our instrument, and to measure it rather than assert it.

---

## 1. Why the current notebook cannot show it

The audit ran page 8's selectors over the 100-item pool page 7 has on disk
(`Qwen2.5-3B-Instruct`, MATH-500 L4/5, T=0.3, 16 candidates per item, deduplicated):

| N | plain CoT (pass@1) | majority vote | best-of-N (ch05 heuristic) | coverage |
|---|---|---|---|---|
| 4 | 46.7% | 48.4% | 45.7% | 64.0% |
| 8 | 46.7% | 52.2% | 44.7% | 70.9% |
| **16** | **46.7%** | **55.0%** | **42.0%** | **78.0%** |

Best-of-N loses by 13 points and gets worse with N. The cause is mechanical: 100% of
candidates carry a `\boxed{}`, so `heuristic_score`'s boxed bonus is constant and the rule
degenerates to *shortest wins*. The other free rung, `avg_logprob`, is predicted by the
notebook's own section 7b to recover the greedy chain, which scores 43.0% here. The rung that
could win, the LLM judge, is built and switched off.

At the time of the audit the notebook had **never been executed** (zero outputs, no
`out/page_08/`) and **generated nothing**: it was a re-analysis of page 7's dump. It does not
touch experiment 3; that ablation feeds page 5 only.

Neither ch05 scorer is a verifier. Nothing on page 8 read whether the reasoning was right, so
nothing on page 8 could beat a rule that does. Section 5 onward is what replaces that, and the
notebook has since been rebuilt around it.

---

## 2. The bar, measured

Best-of-N's accuracy is `r × coverage(N)`, where `r` is the verifier's reliability: how often
it picks a correct candidate when one is in the pile. So the reliability needed to draw with
counting is `majority(N) / coverage(N)`, and that is a number we can read off our own data.

| N | majority | 95% CI | coverage | **bar: r needed to tie** |
|---|---|---|---|---|
| 2 | 37.8% | 29.6-46.6 | 55.9% | 68% |
| 4 | 48.4% | 39.6-57.8 | 64.0% | 76% |
| 8 | 52.2% | 43.0-61.7 | 70.9% | 74% |
| 16 | 55.0% | 45.0-65.0 | 78.0% | **71%** |

**The bar falls as N grows**, because coverage keeps climbing while the vote saturates.
Fitting `coverage ≈ 0.489 + 0.073·log₂N` projects 85% at N=32 and 93% at N=64, which puts the
bar at roughly **64% at N=32 and 59% at N=64**. That is the first lever: *run wider.*

**What the vote is actually using.** Over all 1,600 candidates, the AUC for telling a correct
candidate from a wrong one:

| signal | AUC |
|---|---|
| cluster size (self-consistency, which *is* the vote) | **0.921** |
| ch05 heuristic, i.e. shortest wins | 0.745 |
| answer is an integer | 0.579 |
| answer token count | 0.488 |
| raw trace length | 0.255 |

Self-consistency is a 0.92-AUC signal at T=0.3, which is why voting is hard to beat here and
why a weak judge has no chance. Note also that a 0.745-AUC signal still *loses* 13 points at
best-of-N: taking an argmax over 16 candidates samples the tail of the score distribution,
where a mediocre signal is at its worst. **AUC is not the deliverable; reliability at the
argmax is.**

---

## 3. The lever that changes the game: sample where the vote has nothing to count

Page 7's run is complete, and its diversity family answers this. The same 30 items at every
temperature, 8 candidates each, as the notebook now computes them:

| T | one chain | majority@8 | coverage@8 | **bar** |
|---|---|---|---|---|
| 0.3 | 41.5% | 47.7% | 62.9% | 76% |
| 0.6 | 38.3% | 46.7% | 60.0% | 78% |
| 0.9 | 32.9% | 36.7% | 63.3% | 58% |
| **1.2** | 25.4% | **30.0%** | **66.7%** | **45%** |

Temperature is the diversity knob, and the two rules spend diversity in opposite directions.
**Coverage rises with it and consensus collapses.** At T=1.2 the right answer is in the pile
*more* often than at T=0.3, and the vote finds it 17 points less often, because there is no
longer a crowd to count. The reliability a verifier needs falls from 74% to **45%**.

**The hot end is 30 items, and that is the binding constraint.** Page 7 generated its full
100-item pool at T=0.3 only; the hotter temperatures are its diversity family, 30 items deep. The
interval on the bar at T=1.2 is correspondingly enormous, 16% to 93%, so the *shape* of the
divergence is measured and its *magnitude* is not. Filling the hot end out to 100 items is the
single highest-value thing phase 1 does, and it is why phase 1 exists at all.

That is the regime where best-of-N is supposed to win, and it is the regime the page should
be measured in. Projecting best-of-8 at each temperature:

| T | if r = 0.6 | if r = 0.75 | if r = 0.9 |
|---|---|---|---|
| 0.3 | 38% | 48% | 57% |
| 1.2 | 40% | **50%** | **60%** |

against the best majority anywhere on the grid, 47%.

**The fairness rule that keeps this honest.** Do not win by sandbagging the vote. Every rule
gets its own best temperature, the whole grid is shown, and the claim is *best-of-N at its
best setting beats majority voting at its best setting.* On the numbers above that needs
r ≥ 0.75 at T ≈ 1.0, which is an ordinary requirement for a real verifier and out of reach
for every scorer currently in the notebook. This rule is the difference between a finding and
a rigged comparison, and the page must state the grid it was chosen from.

---

## 4. What actually goes in the verifier slot

Not ch05. The page needs a model that reads the reasoning and judges it. But **which** model is
not a hunt for the best available judge, and getting that wrong is how this page would fool
itself.

**A judge that is simply a stronger model at the task is a confound.** If it can tell which
candidate is right, it can probably just solve the problem, and then "selection beat counting" and
"a bigger model beat a smaller one" are the same sentence. The deck's own numbers make this sharp.
Page 6 measured these checkpoints on **these exact items at this exact cap**:

| checkpoint | solves | note |
|---|---|---|
| `Qwen2.5-1.5B-Instruct` | **22%** | worse at the problems than the model it would be judging |
| `Qwen2.5-3B-Instruct` | **43%** | wrote every candidate in the pile |
| `Qwen2.5-7B-Instruct` | **60%** | more than the 3B's vote over 16 chains manages (55%) |

One chain from the 7B already beats the whole pile's vote. So a 7B judge cannot carry this page:
a reader would rightly ask why we did not simply generate with it.

**So the rung that settles the claim is the one at or below the writer's size.** If
`Qwen2.5-1.5B-Instruct`, which solves 22% against the 3B's 43%, still selects better than the
crowd counts, that is not "a bigger model helps". It is *verification is easier than generation*,
which is the thing best-of-N actually rests on, demonstrated on our own data instead of quoted
from Cobbe. That is the strongest form of this page's argument and it is also the cheapest tier to
run.

| tier | verifier | what it settles | cost |
|---|---|---|---|
| 0 | `Qwen2.5-3B-Instruct` self-judge | the control: the writer grading its own work, same size, already resident | free |
| 1 | **`Qwen2.5-1.5B-Instruct`** | **the page's claim**, because a weaker model selecting well cannot be explained by capability | minutes, bf16 |
| 2 | `Qwen2.5-7B-Instruct` | the ceiling, and read with the caveat above attached | ~20 min, 8-bit |
| 3 | a trained outcome reward model | the conceptually right answer: trained to verify rather than scaled up at generating | 8-bit |

**Why no math-tuned checkpoint.** This was the first draft's default and it was wrong, for two
reasons both measured rather than assumed. Experiment 2 in this repo found every `Qwen2.5-Math`
model at **0% compliance** with a plain instruction, and a one-word Yes/No verdict is precisely
the instruction-following they are worst at. And their accuracy on these items has never been
measured here, while all three general checkpoints carry a page 6 number, which is what lets the
notebook state each judge's own competence instead of assuming it.

A process reward model would very likely clear the bar and would also spend page 9's subject to do
it. Held in reserve, and if it is needed, page 8 uses it as a single outcome score while page 9
keeps the step-level story.

The mechanism, in all tiers: one forward pass per candidate, a score read off a single position,
no generation and no verdict text to parse. The notebook implements this in section 4.

---

## 5. Phase 0 — the pilot, free, and the gate

Page 7's completed dump is a paid-for pilot bed: **2,320 candidates** at the 2048-token cap,
being 100 items x 16 at T=0.3 plus 30 items x 8 at each of T=0.6, 0.9 and 1.2. **Generate nothing
until a verifier clears the bar there.**

1. **Dedupe on load.** `out/page_07/traces.jsonl` holds 480 duplicate records (240 in
   `t0.30-c2048`, 240 in `t0.00-c2048`, identical traces under identical keys), the
   concurrent-writer trap from [handoff.md](../notebooks/handoff.md). Counting those candidates
   twice would bias every vote taken on them. **Done:** page 8 now deduplicates on
   `(model, config, problem, sample_index)` at load and asserts that any two records sharing a
   key are byte-identical, so a genuine collision fails loudly instead of averaging.
2. **Score every candidate** with tier 0, then tier 1. That is `RUN_MODE = "SCORE"`, which is
   2,320 forward passes per tier and no generation at all.
3. **Report** reliability `r`, best-of-N against majority and against pass@1, at every N and
   every temperature. Section 12 of the notebook is this gate, and it prints the next move
   when the gate fails.

**Gate: best-of-N at its best temperature beats majority at its best temperature, with the
bootstrap intervals separated.** On current numbers that means r ≥ 0.75 near T = 1.0.

If tier 1 misses, escalate to tier 2 before touching the generator. If every tier misses,
the remaining honest moves are more N (the bar falls to ~59% at N=64) and the trap slice,
which the pilot already sizes at **23% of items** (55% solvable, 22% hopeless) and where the
bar is near zero by construction. A page that has to retreat to the trap slice is a weaker
page, and we would say so.

---

## 6. Phase 1 — page 8's own run

Only after the gate. Page 8 stops being a re-analysis and draws its own pool, with its own
`run_id`, on the deck's instrument.

| knob | value | why |
|---|---|---|
| model | `Qwen/Qwen2.5-3B-Instruct` | pages 5 to 7, so the deck keeps one instrument |
| items | the same 100 MATH-500 L4/5 | paired with every other page |
| N | **64 where the bar is lowest** | the bar falls with N; 64 is where the projection puts it near 59% |
| temperature | **the grid {0.3, 0.6, 0.9, 1.2}, at 100 items**, not one point | page 7's grid, extended from 30 items to the full set. Same temperatures, so the pilot's candidates are not wasted: they are the first 8 of each pool |
| chain budget | 2048 tokens | page 7's, so its vote is a cross-check; truncation ran 1.2% |
| verifier | the tier that cleared phase 0 | |

The full grid at full depth is 25,600 generations, which is too much. The grid the notebook
ships is deep where the bar is low and shallow where it is not: `[(0.3, 16), (0.6, 16), (0.9, 32),
(1.2, 64)]`, which is 12,800 generations, and page 7's existing chains cover the first 8 of every
one of them because the temperatures and the cap match deliberately.

Artifacts follow the shared trace-bank schema: `out/page_08/traces.jsonl` (its own
generations), `scores.jsonl`, `derived.json`, `manifest.json`.

---

## 7. The three figures

**Figure 1 — the payoff.** Accuracy against N. Three lines and a ceiling: plain CoT (flat),
majority vote, best-of-N (verifier), with coverage dashed above them. Bootstrap bands. The
annotation is the best-of-N to majority gap, labelled as what the verifier was worth, and the
gap to the ceiling, labelled as what is still on the table. `random`, `heuristic` and
`logprob` come **off** this chart and become a table underneath, where "a rule that grades
presentation loses 13 points to counting" is a sharper sentence than a seventh line.

**Figure 2 — why it wins.** The temperature grid: coverage and majority against T, diverging,
with the bar `majority/coverage` as the shaded distance between them. This is the page's
mechanism and its most original figure: *the vote spends diversity badly and selection spends
it well.* Beside it, the three-bucket base rate with the trap slice called out.

**Figure 3 — the verifier is worth exactly what the verifier is worth.** Measured reliability
on the x-axis, best-of-N accuracy on the y, one point per rule, the majority reference line
across it, and the crossing marked as a measured quantity. Beside it one worked case: a real
candidate the verifier scored highest and got wrong, next to the correct one it passed over.

---

## 8. Work items

| # | Work | Gate |
|---|---|---|
| 1 | Dedupe guard at every trace read | 3,392 unique records load, not 3,872 |
| 2 | Name a trained reward model for tier 3 and verify it on the hub | fits 16 GB; tiers 0 to 2 are already cached from pages 5 and 6 |
| 3 | **Phase 0 pilot on page 7's existing pool** (`RUN_MODE = "SCORE"`) | **best-of-N beats majority at matched best settings, intervals separated** |
| 4 | Notebook restructured: own generation, three figures, ch05 rungs demoted | **done.** Runs end to end on page 7's pool, 22/22 cells, verifier absent |
| 5 | Phase 1 run, plus the verifier pass | invariants hold; no-answer rate reported |
| 6 | `derived.json` claims block gated on `best_of_n_beats_majority` | TRANSLATABLE prints |
| 7 | Translate; delete `LILY_PAD_MODEL` and the reliability slider from `sim.ts` | typecheck, lint, test, build, e2e |

Item 3 is the decision point, it needs a GPU and no generation, and everything before it is
free.

## 9. Open questions

1. **If only the 7B judge clears the bar, what does the page say?** My recommendation: it
   reports the whole ladder and leads with the honest sentence, that on this instrument
   selection needed a judge stronger than the writer, and that a same-size judge did not
   suffice. That is a real finding and a better page than a quiet win.
2. **How far into page 9's subject may the verifier reach?** A process reward model is the
   most likely to clear the bar and the most likely to pre-empt page 9. Recommendation: hold
   it in reserve, and if it is needed, page 8 uses it as a single outcome score while page 9
   keeps the step-level story.
3. **N=64 at two temperatures, or N=32 across four?** The first makes figure 1 stronger, the
   second makes figure 2 stronger. Recommendation: the first, since figure 1 is the page.
4. **Does verifier-weighted voting go on the page?** It usually beats both parents and it is
   the true synthesis of pages 7 and 8. It is not best-of-N, so it belongs as a fourth line
   or a closing sentence, not as the headline the title promises.
