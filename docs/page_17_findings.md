# Page 17 findings report

What the deck's own runs say about the three failure modes page 17 is named for, what survived
adversarial checking, what did not, and what page 17 can build from it.

**Scope.** No new experiments. Everything here comes from artifacts already committed:
`web/data/page-0{5,6,7,8,9}-derived.json` and the raw `traces.jsonl` inside
`web/public/notebooks/page-06-thinking-longer.zip` and `page-05-how-to-reason.zip`.

**Companion document.** [page_17_refactor.md](page_17_refactor.md) is the build spec. This report
is the evidence behind it, including the parts that failed. Section 6 lists the edits this report
forces on that spec.

---

## 1. Why page 17 was opened at all

Page 17 is structurally sound. Review findings 17.1 through 17.9 in
[pages_15_19_refinement.md](review/pages_15_19_refinement.md) are all actioned, it has a test
file, and its cross-references are correct.

It is also the least measured page in Act 3. Three of its four steps restate published findings,
and its one interactive beat is an authored Markov chain with five invented constants
([frontier.ts:148](../web/src/lib/frontier.ts:148)):

```
solveProb 0.45   breakProb 0.10   fixProb 0.03   unsolvable 0.15   reliability 0.90
```

Step 3's overthinking pair is an authored inverse-U at authored peak positions. The page's
longest paragraph is the footnote disclosing both.

The question this report answers: **can the deck's own measurements carry those three claims
instead?** Partly. Two of the three, solidly. The third, not at all, and the reason is
structural rather than a matter of sample size.

---

## 2. Findings that hold

### F1 · Every budget rung loses answers, and the aggregate curve hides it

Page 6's accuracy curve climbs 7, 17, 35, 44, 43 at Qwen2.5-3B. Netted out of that climb:

| rung | gained | lost | net |
|---|---|---|---|
| 128 to 256 | 11 | 1 | +10 |
| 256 to 512 | 20 | 2 | +18 |
| 512 to 1024 | 11 | 2 | +9 |
| 1024 to 2048 | 0 | 1 | -1 |

Status: **solid.** Derived from `figure_3.items[].correct_by_budget`, 100 items, greedy, no
sampling noise. Unrendered anywhere in the deck.

### F2 · The budget axis is bounded above by the model's own stopping point

Decoding is greedy, so once the model self-terminates every larger budget replays the *same
generation*. At 3B the mean own-length is 693 tokens and the truncation rate falls 1.00, 0.92,
0.55, 0.16, 0.06 across the ladder. By 2,048 tokens 94% of chains have already stopped
themselves.

This is why the top rung gains zero: for almost every item it is not a different run.

Status: **solid, and it is the most consequential finding in this report.** It means the budget
axis cannot express "accuracy falls past a peak" at all. It can only express "some prefix beat
the whole". Everything downstream of this, including the death of the difficulty-threshold claim
in section 4, follows from it.

### F3 · Verifier reliability falls with the knob that makes best-of-N worth running

Measured at a common depth of N = 16 so temperature is the only variable
(`page-08-derived.json` `figure_3.reliability_across_temperatures`):

| selector | T 0.3 | T 0.6 | T 0.9 | T 1.2 |
|---|---|---|---|---|
| one chain | 64.1 | 62.8 | 59.0 | 37.8 |
| majority vote | 71.8 | 71.8 | 69.2 | 59.5 |
| best-of-N, self as judge | 64.1 | 65.4 | 53.8 | 56.8 |
| best-of-N, Qwen 7B judge | 70.5 | 71.8 | 62.8 | 56.8 |
| best-of-N, Skywork PRM | 70.5 | 76.9 | 73.1 | 70.3 |

Every model-as-judge degrades. The trained reward model does not: 70.5 to 70.3 across the sweep.
At T 0.3 it is mid-pack and `qwen1.5b` beats it; by T 0.9 it leads every generator-judge by 10
points or more. **The crossing is the finding, so the figure must be read left to right rather
than at any one column.**

Status: **solid.** The notebook computes this at a fixed depth deliberately, because reliability
also decays with N and mixing depths would confound the two.

Caveat for the caption: reliability is undefined where no candidate is right, so the denominator
shrinks as temperature rises. The decline is therefore measured on an increasingly easy subset,
which makes it a conservative reading.

### F4 · The verifier cannot read most of the chain, and its reliability was measured where it can

Across 1,580 real chains, 18,772 steps:

| | steps | share |
|---|---|---|
| checker proves true | 1,016 | 5.4% |
| checker proves false | 76 | 0.4% |
| checker states nothing computable | 17,680 | **94.2%** |

The process reward model's headline quality on those chains is AUC 0.892, recall on false steps
0.79, specificity 0.86. All of it computed on the lit 1,092. The run file says so itself, and the
sentence should be the on-screen citation anchor rather than paraphrased:

> steps with a closed-form numeric claim, which are the steps most like the PRM's training
> distribution; an optimistic estimate of its reliability on the prose steps it is trusted with

Two costs of trusting it anyway, both measured: filtering page 7's candidate pool by step
soundness moved majority vote 57% to 58% and changed the answer on 1 problem in 100; and how much
of a wrong chain counts as sound moves 25 points depending only on where the chain is cut into
steps.

Status: **solid.** Page 9 states the 5.8/94.2 split as framing for its two instruments. What is
new for page 17 is turning the split on the reliability number itself. Page 9 already draws the
25-point spread at [Page9.tsx:718](../web/src/components/pages/Page9.tsx:718), so page 17 cites it
and does not restate it.

### F5 · Length is an anti-signal, strongly

Over roughly 1,600 candidates at T 0.6, `figure_3.discrimination` ranks every signal by how well
it separates a correct candidate from a wrong one:

| signal | AUC |
|---|---|
| cluster size (the vote's own signal) | 0.926 |
| Skywork PRM | 0.869 |
| Qwen 7B as judge | 0.834 |
| self as judge | 0.774 |
| Qwen2.5-Math-1.5B as judge | 0.719 |
| Qwen 1.5B as judge | 0.607 |
| **trace length** | **0.257** |

A correct candidate is longer than a wrong one about a quarter of the time. Read the other way
round, "prefer the shorter chain" scores 0.743 and beats two of the four models asked to judge on
the same pile, at zero cost.

Status: **solid**, and it is our own measurement of the Zeng et al. line page 17 currently cites
secondhand. Unrendered anywhere.

---

## 3. The finding that was reduced by its own controls

This one was pitched larger than it survived. Recording the full arc because the controls are the
useful part.

### The observation

Compare the model's natural ending against the best of its five cut points:

| checkpoint | natural ending | best cut point | gap |
|---|---|---|---|
| Qwen2.5-1.5B | 22/100 | 30/100 | +8 |
| Qwen2.5-3B | 43/100 | 49/100 | +6 |
| Qwen2.5-7B | 60/100 | 62/100 | +2 |

The gap shrinks with capability. Two definitions used throughout, deliberately distinct: a
**regression** is any right-to-wrong step in the ladder (8, 6, 4 events by checkpoint, 18 pooled);
a **rescued item** is one whose natural ending is wrong but some cut point is right (8, 6, 2 by
checkpoint, 16 pooled). The 7B has 4 regressions but only 2 rescued items because two of its dips
recover.

### Control 1: was the truncated reasoning actually correct? No.

In **all 25** rescue cases, the visible work was cut mid-stream with no concluded answer. The
regex is sound: 96% of natural traces carry a boxed answer in the body against 1% of truncated
ones. The correct answer came from the forced commit every time, never from a finished
derivation.

So the first framing, "the model's own stopping point is worse than an early stop", is wrong as
stated. Nothing here shows the model choosing badly when to stop.

### Control 2: did the model already know the answer? Only sometimes.

Page 5 ran a zero-token forced-blurt arm on the same 100 items. Of the 16 rescued items, the
blurt is right on 6 and zero-shot CoT on 4. So this is not latent knowledge surfacing. It is the
partial chain plus the commit.

### Control 3: is cut-point diversity cheaper than sampling? No, and this is what shrank it.

Five cut points of one greedy chain cost about 820 tokens: one 693-token generation, whose
prefixes are free under greedy, plus four 32-token forced commits. That buys 49% coverage at 3B.

Page 7's sampling curve on the same 100 items at T 0.3:

| n | coverage | mean tokens |
|---|---|---|
| 1 | 0.46 | 618 |
| 2 | 0.56 | 1,244 |
| 4 | 0.64 | 2,482 |
| 8 | 0.71 | 4,973 |
| 16 | 0.78 | 9,931 |

The chord between n = 1 and n = 2 puts sampling at about 49.2% for 820 tokens. Cut-point coverage
is 49%. Since the true curve is concave and therefore lies above its chord, **cut-point diversity
is at best equal to sampling per token, and probably slightly worse.**

And no rule selects the good stop: a fixed cut at 512 gives 35% against the natural 43%. This is
coverage without selection, which is exactly the shape page 7 taught.

### What survives

Not a statistic. A **specimen**, and a good one.

`test/intermediate_algebra/190.json` at Qwen2.5-3B. Given `xyz(x + y + z) = 1`, minimise
`(x + y)(y + z)`. Ground truth 2.

- cut at 128, 256 and 512 tokens and forced to commit: **right** all three times
- allowed to run to its own 818-token ending: **wrong**, concludes `4√3/3`

The error is legible in thirty seconds. The chain assumes `x = y = z`, computes `4/√3 ≈ 2.309`,
and boxes it, where AM-GM on `(x + y)(y + z) = y(x + y + z) + xz ≥ 2√(xyz(x + y + z))` gives
exactly 2. The same item regresses on all three checkpoints, and both traces ship in the page 6
zip, so a reader can re-derive it by download.

Status: **usable as a specimen with the three controls stated on screen.** Not usable as an
effect size.

---

## 4. The claim that died, and why it is unreachable rather than underpowered

Page 17's authored figure asserts that easy problems cross the overthinking threshold before hard
ones. The run cannot support it, and cannot be stretched to.

**Empirically.** Page 6 ships all 2,720 raw records and every checkpoint has a complete
item-by-budget grid; `figure_3` only ever emitted the primary model. Pooling all three is a
`REPLAY` with no GPU and triples the sample to 18 regression events. The level split is flat:
median break budget 512 at level 4 (n = 8) and 512 at level 5 (n = 10). There is no signal to
split.

**Structurally.** By F2, the budget axis has no room above the model's own stopping point, so a
threshold a problem crosses by spending more has nowhere to sit. More items, more checkpoints and
a finer ladder all raise the event count and none of them move this.

The axis that does extend past the natural stop is page 6's wait-injection arm, and that arm
already ran and returned a null at all three checkpoints:

| checkpoint | accuracy at 0, 1, 2, 3 injections | churn | fixed vs broken at 3 |
|---|---|---|---|
| 1.5B | 22, 23, 17, 20 | up to 59% | 7 vs 9 |
| 3B | 43, 41, 41, 42 | 30% | 9 vs 10 |
| 7B | 60, 59, 58, 57 | 21% | 4 vs 7 |

Mean tokens at 3B go 693 to 1,252 for that. No crossing resolves at any checkpoint.

**Cost to chase it anyway:** roughly 6,400 generations over two difficulty bands at 8 injection
levels, 10 to 16 GPU-hours, about a week of work end to end, with a high prior on another null
because we would be splitting a measured null by difficulty. Declined. Section 9 of the refactor
spec records the full estimate.

---

## 5. What page 17 gets

Four steps, each a measured reversal instead of a citation, on one spine: **every pitfall on this
page is invisible in the number you were looking at.**

| step | carried by | source | new? |
|---|---|---|---|
| 1. Marking its own homework | Huang et al. Table 3 verbatim, plus our `Wait` null in two sentences | published; `figure_wait` | page 6 owns the null, cite only |
| 2. The chain can destroy the answer | F1 ladder ledger, plus the 190 specimen with its three controls | `figure_3.items`, page 6 zip | fully new |
| 3. Reliability is a coordinate, not a property | F3 temperature table, F4 the 94.2% | pages 8 and 9 derived | fully new |
| 4. What still works | kept, plus F3's PRM result and F4's 94.2% | as above | small edits |

F5 (length AUC 0.257) rides along in step 2 as the one instrument that is both cheap and works.

**What this costs the page.** The claim that easy problems peak sooner, deleted outright, with
`SELF_CORRECTION`, `selfCorrectionCurve`, `inverseU`, `overthinking.json` and four blocks of
`act3.test.ts`. `curves.selfCorrection` stays because step 1 still prints Huang.

**What it buys.** Every figure re-reads a run the reader already met as a success: page 6's
climbing curve with the losses drawn back in, page 8's judge ladder with the temperature axis
restored, page 9's two instruments with the reliability number scoped to where it was taken. That
backward pressure on Act 2 is the page's reason to exist, and it also improves both seams. Page
16 hands over "the side of the dial where spending more makes the answer worse" and now gets a
measured dial. Step 3 ends on 94% of the chain being unreadable, and page 18 opens by asking
whether the readable part is even the real reason.

**Effort:** one sitting for the loader and tests, one for the three figures. No GPU.

---

## 6. Edits this report forces on the refactor spec

Applied already, listed for the record.

1. §2 step 2's six-problem table was framed as "five clean regressions breaking well inside the
   cap". Wrong. Control 1 shows the mechanism is a forced commit, not a truncated derivation.
   Rewritten around the specimen.
2. §2 gains the F2 caption requirement. Without it a reader takes the flat top for a measured
   plateau rather than an artifact of where the axis ends.
3. §3's confound 1 was "`algebra/2391` is truncated at max". Replaced with F2, which shapes the
   figure rather than merely qualifying it.
4. §7's permitted claims rewritten to match Controls 1 to 3.
5. §9 added: the difficulty-threshold estimate and the recommendation against it.

6. §2 step 2 rewritten specimen-first: the oracle gap is demoted to a scope ledger, the three
   failed controls are promoted into required on-screen copy, and the step is retitled "What the
   climbing curve netted out" since it no longer claims a peak.
7. §8 replaced with an ordered build plan. Writing it surfaced one dependency worth recording
   here: **problem 190's traces are not in `page-06-derived.json`**, only in the shipped zip, so
   page 17 needs its own REPLAY notebook and derived file. No GPU, about a minute of runtime.

No outstanding edits. The spec and this report agree.

---

## 7. Open decisions

1. **The page title.** `pages.ts` calls page 17 "Self-Correction, Verifier Reliability,
   Overthinking", and section 4 forbids claiming overthinking as measured. Recommend keeping the
   word and letting step 2 own the distinction between the published finding that names the beat
   and the per-problem version we can show, since the honest gap is more interesting than a
   retitle.
2. **Step 1's second panel.** Cutting the GPT-4 GSM8K panel saves about 40 words and one figure,
   and removes the page's only cross-benchmark evidence for the Huang result.
3. **Figure 3a's line count.** Five selectors reads; adding `heuristic` and `logprob` makes seven
   and turns it into page 8's diagnostic panel. Recommend five.
4. **How much of specimen 190 to show.** The full 818-token chain is too long for the page. The
   symmetry assumption and the concluding box are the two things a reader needs, so a folded trace
   with those two zones lit is probably right, but it is a visual call best made against a
   screenshot.
