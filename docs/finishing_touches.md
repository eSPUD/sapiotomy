# Finishing touches needed

A running list of things that are known, unresolved, and would embarrass us if a reviewer found
them first. Each entry says what the problem is, what is already verified, and what decides it.
Close an entry by deleting it and linking the commit.

Ordered by how much of the deck moves if the answer goes the wrong way.

---

## 1. Page 5 names a technique it never shows working

**Status:** specced, not built. See [`page_5_base_arm.md`](page_5_base_arm.md).

Page 5 is titled *Chain of Thought: Reasoning Out Loud* and cites Wei and Kojima for the technique.
Its only measurement of that technique is a null: adding "Explain step by step." to
Qwen2.5-3B-Instruct moved the score 0.0 points, 12 fixed and 12 broken, ±9.6. Everything else on the
page measures what happens when a chain is *removed*. A reader is entitled to ask what the prompt
was ever for, and the page does not answer.

**The dilemma.** The honest answer is "it was for a model that had not been instruction-tuned", and
we can only assert that by pointing at somebody else's measurement. rasbt's ch04 runs our exact
suffix on a base checkpoint and gets 15.2% → 40.6%, but that is Qwen3-0.6B-Base through a
from-scratch reimplementation: different family, different generation, 5× size gap. It can be cited.
It cannot sit inside our figure.

So either:

- **(a) run `Qwen/Qwen2.5-3B`**, the exact base of the primary, on the same 100 items. ~300
  generations. Instruction tuning becomes the only variable and the page's strongest sentence
  becomes measurable. Full spec, gates and hazards in [`page_5_base_arm.md`](page_5_base_arm.md).
- **(b) accept the gap**, keep the margin note pointing at page 12, and let the page be about
  removal only. Defensible, and the title carries a little less weight than it claims.

**Blocking sub-question, cheap to answer:** a 10-item probe. §2 of the spec describes a silent
failure mode that would sink the arm and present as a result. If that probe comes back with a
usable boxed rate and normal truncation, (a) is worth doing. If not, (b) is forced and we write a
paragraph saying why.

---

## 2. Precision: the claim that 8-bit costs 20 points does not survive the one direct test we have

**Status:** the specific worry looks unfounded, but the provenance around it is genuinely weak.

The concern: our 7B rows have variously run at 8-bit, and if 8-bit costs real accuracy then every
cross-model comparison in the deck is contaminated.

**What is verified.** Pages 5 and 6 score **the same 100 MATH-500 L4-5 items** (both run ids carry
the item hash `9ab2b579`), the same model, the same 2048-token cap, greedy:

| page | model | precision | solved |
|---|---|---|---|
| 5 | Qwen2.5-7B-Instruct | **bf16** | **60 / 100** |
| 6 | Qwen2.5-7B-Instruct | **8-bit** (`load_in_8bit=True`, page 6 notebook cell 12) | **60 / 100** |

Identical. On this model, this band, this decoding, the measured cost of 8-bit is **zero points**,
not twenty. A 20-point gap cannot hide behind identical totals.

**Where the 20 probably came from.** Experiment 2 ran its 7B rows at 8-bit at **n = 20**, which
resolves to roughly ±20 points on its own. Experiment 4 re-ran them at bf16 at n = 100. A 20-point
swing between those two is inside experiment 2's confidence interval before precision is involved
at all, and experiment 4's own header cell already says its 7B numbers "are **not comparable**" to
the earlier run's. The two should not be differenced.

**What is still wrong and worth fixing:**

- **Identical totals are not item-level identity.** Both runs solve 60, not provably the same 60.
  Neither ships per-item outcomes, so this cannot be checked from `web/data/`. It can be checked
  from the two `traces.jsonl` files, and should be, because "same score" and "same behaviour" are
  different claims and only the first is currently supported.
- **Page 6's manifest is self-contradictory.** Its 7B entry carries `"dtype": "torch.bfloat16"`
  alongside `"quant": "8bit"`, and the run id says `bfloat16`. The notebook resolves it (that model
  really is loaded 8-bit; bf16 is the compute dtype), but nothing a reader can see does.
- **[`page-07-derived.json`](../web/data/page-07-derived.json) records no precision at all.** One
  model, presumably bf16, but the page cannot say so.
- **Experiment 4's traces carry no `quant` field per record**, only `manifest.quant_7b`. The sweep
  code writes one; it is not in the shipped `traces.jsonl`. Per-record is the right grain, because
  the whole point is that one run can mix precisions.
- **[`handoff.md`](../notebooks/handoff.md) understates it.** "Quantisation is constant within a
  model, so it does not affect within-model prompt contrasts, only cross-model accuracy" is true,
  and cross-model accuracy is exactly what page 5 figure 3 and page 6 figure 2 do. The guidance
  reads as reassurance when it is a warning.

**What would settle it properly.** Experiment 1 already contains the right control by design:
`Qwen2.5-3B-Instruct` swept twice, bf16 and 8-bit, on identical items, specifically so "the cost of
8-bit is a measured number rather than an argument". Its outputs were never kept. Re-running that
one pair is small and it converts this entry from an argument into a number.

---

## 3. "A small specialist beats a big generalist" is a Qwen2 claim, not a claim

**Status:** measured, and it inverts the result experiment 4 was built to get.

Experiment 4, table 5, reading only the honest rows (specialist against a generalist that is
*allowed to reason*, not against a gagged one):

| generation | L3 | L4 | L5 |
|---|---|---|---|
| Qwen2 (Math-1.5B vs 7B) | **+20** | **+20** | **+19** | all p < 0.001 |
| Qwen2.5 (Math-1.5B vs 7B) | −6 | +1 | +0 | none resolved |

One generation of instruction tuning closed a 20-point specialist gap completely. Any page that
says a small specialist beats a larger generalist must name the generation, or it is stating a 2024
fact in 2026. The "suppressed" rows still show +30 to +56 everywhere, and those are the rows that
must never be quoted alone: experiment 4's own footnote says a specialist that beats only a gagged
generalist has not shown what the page claims.

This does not damage page 12's gate, which compares `Qwen2.5-Math-1.5B` against `Qwen2.5-3B` at
bf16 throughout and is unaffected. It does mean the page-12 spec cannot inherit the
specialist-versus-7B framing from the handoff without re-reading these numbers.

---

## 4. Experiment 4's suppression rows for math models say the opposite of what they look like

**Status:** a caption fix in `tables.md`, and a trap for anyone reading the numbers later.

`refusal.csv` splits the roster cleanly on compliance with the blurt instruction:

| complied | models |
|---|---|
| **0%** | Qwen2-Math-1.5B, Qwen2.5-Math-1.5B, **Qwen2.5-Math-7B** |
| **98-100%** | Qwen2-Math-7B, Qwen2-7B, Qwen2.5-7B |

Where compliance is 0%, the "cost of suppressing reasoning" is ~0 **by construction**, because
nothing was suppressed. Those models wrote 400-750 tokens of working under an explicit instruction
not to. Table 2's current footnote reads "an instruction that costs a general model 40 to 70 points
costs these nothing", which invites exactly the wrong inference. It costs them nothing because they
did not do it.

"Ignored" is the wrong word for what they do, and the traces say so. On the three 0%-compliance
checkpoints the blurt trace is **byte-identical to the bare trace on 6-25% of items** (lowest on the
hard bands), so the suffix does reach the model and does perturb the text on the rest. It just never
stops the reasoning. Compare the compliant models, where the two traces are identical on **0 of 100**
items in every band, because one of them is six tokens long.

Note also that this does not split on math-tuning: `Qwen2-Math-7B` complies at 99-100%. It is a
per-checkpoint property, and the deck must not generalise it to "math models refuse".

Page 5's `blurt_compliance` gate (≥80% answering under 40 tokens) would have correctly refused five
of these six models. That is the gate working, and it is worth saying so somewhere.

---

## 5. Page 7 has page 5's old problems

**Status:** in flight. Pages 5 and 6 are done; page 7 is the rest of this branch.

Same three faults: a footer doing the notebook's job, subsection titles that name a conclusion
instead of the content, and figures that arrive with no sentence saying what they are a picture of.

---

## 6. Page 6's budget grid spends two of five stops on dead travel

**Status:** needs a GPU re-run, so it is not in the copy pass.

The dial is `{128, 256, 512, 1024, 2048}`. The action is entirely between 128 and 1024:

| budget | 128 | 256 | 512 | 1024 | 2048 |
|---|---|---|---|---|---|
| solved | 7 | 17 | 35 | **44** | 43 |
| gain | — | +10 | +18 | +9 | **−1** |
| chains still hitting the cap | 100% | 92% | 55% | 16% | 6% |

Two of five stops sit in the flat tail, so a reader drags through a third of the control's travel
for one problem's worth of change. Re-spacing to something like `{64, 128, 192, 256, 384, 512, 768,
1024}` with 2048 kept as the endpoint puts the resolution in the knee. That is ~8 budgets × 100
items × 3 models ≈ 2,400 records against the current 1,500, so roughly 1.6× the run.

**Going fully continuous is not available, and the reason is worth recording.** Greedy decoding is
deterministic, so the 2048-token trace contains every shorter prefix exactly, and the page already
relies on this (`traceZones` builds the greyed continuation by slicing `referenceTokens`). So the
*trace* could slide continuously for free. The *verdict* could not: at cap N we close the block,
append the forcing stem and generate the answer, which is a forward pass that exists only at the
measured stops. A continuous dial would slide the cut smoothly and snap the verdict, which is a lie
unless heavily labelled. Denser discrete stops, not a continuous slider.

---

## 7. Page 6's extension arm encodes the boring half of its result at full size

**Status:** deliberately left alone pending a decision. Flagged because it is a presentation
problem, not a data problem.

`Wait` injection on the 3B: 43% → 42% over three injections, **30% of answers changed**, 9 fixed
and 10 broken, at 1.8× the tokens. The finding is that forcing a model to keep going *redistributes
rather than adds*, which is a rarer and more useful result than a small positive would have been,
and it is the direct confirmation of section 3's diagnosis: chains that stop early and are wrong do
not improve when you refuse to let them stop.

The figure draws three nearly flat accuracy lines at full size and puts churn underneath at 20%
opacity, so it reads as "nothing happened" when the truth is "a great deal happened and none of it
helped". The fixed/broken counts, which are the actual result, are columns 5 and 6 of a table.

Inverting it would mean leading with what moved (9 fixed / 10 broken / 81 unchanged, in page 5's
paired-flip vocabulary) and demoting the accuracy line to a small inset that says the net was zero.
Not done because the section was explicitly held for review.

---

## 8. Page 8's notebook download ships a `derived.json` the page does not plot

**Status:** found while merging pages 5-7; pre-existing on `main`, not caused by that branch.
Recorded as a deliberate `it.fails` in
[`notebookBundles.test.ts`](../web/src/lib/notebookBundles.test.ts), so rebuilding the zip makes
that test fail and the marker gets deleted with the defect.

`web/public/notebooks/page-08-best-of-n.zip` carries an **older run** than
`web/data/page-08-derived.json`:

| | bundle | what the page plots |
|---|---|---|
| run timestamp | 2026-08-07T**20:51:47** | 2026-08-07T**21:16:35** |
| figure 1's specimen | `test/intermediate_algebra/190.json` | `test/number_theory/357.json` |
| `paired.baseline` | `null` | "candidate index 0, one fixed chain per problem" |
| `paired.baseline_accuracy` | `null` | 0.43 |

So a reader who takes the download and runs it in REPLAY gets **a different figure 1 than the one
they just read**, and no paired baseline at all. The commit that landed it says the pages "agree
byte for byte"; for this bundle they do not.

Everything else about that bundle is correct, which is why it is one line to fix rather than a
rebuild of the pipeline: it unpacks into `page-08-best-of-n/`, puts its five artifacts under
`out/page_08/`, and ships at `RUN_MODE = "REPLAY"`. Re-zipping it against the 21:16 run closes
this.

Page 8 also prints no size beside its download link, where 5, 6 and 7 do. Not wrong, just
inconsistent, and the test skips the size assertion for it.

---

## 9. Small, verified, unglamorous

- `web/data/PROVENANCE.md` should name which pages share the `9ab2b579` item draw. Pages 5, 6 and 7
  all score it and nothing on the pages says they are the same problems, which is the single most
  useful fact for a reader comparing them.
- Experiment 4's `few_shot` rows are a clean null on all 18 cells (range −8 to +5, none resolved,
  correlation −0.79 with bare accuracy). This independently corroborates cutting the exemplar rungs
  from page 5's ladder. Worth one line in the page 5 margin note, which currently justifies the cut
  on answer-format grounds alone.
