# Page 7 — "Frequency Voting" refactor spec

**Status:** spec only. Nothing here is implemented. Depends on page 6's sweep infrastructure.

**Implementation follows the notebook-first pipeline** in
[page_6_refactor.md](page_6_refactor.md) section 6. Note especially the artifact-size tier
described there: this page's dump is the one that forces the split between bundled and
downloadable logs.

**What we take from `reasoning-from-scratch`:** the harness again (ch03 grading), plus ch04's
`self_consistency_vote` as a reference for *what* to tally. Not its numbers, and not its
model.

---

## 1. Page Objective & Core Narrative

**Objective unchanged:** page 6 bought accuracy by making one chain longer. This page buys it
by running the chain many times and keeping the answer that comes up most. Same trade,
different axis.

**The concern this spec had to answer.** Frequency voting was flagged as possibly too hard to
show empirically with legible results, and the worry is well founded in one specific way: a
real model does not produce four tidy buckets. It produces one concentrated correct answer and
a long tail of wrong answers, most appearing exactly once.

That messiness is the lesson, not an obstacle to it.

Majority voting works **because errors are diffuse and truth is concentrated.** Wrong
reasoning goes wrong in many different directions and lands scattered; correct reasoning has
one place to land. The current page's four named misreadings
([SAMPLING_CHAMBER](../web/src/lib/authored.ts:469)) actively hide this, because four evenly
weighted distractors make the vote look like a coin-counting exercise. The real histogram, one
tall spike against a scatter of singletons, *is* the mechanism drawn.

So the page keeps its analogy and loses its simulation.

**What the page currently fabricates.** Two things, and both go:

- `CHAMBER_MODEL` ([sim.ts:34](../web/src/lib/sim.ts:34)), a Monte Carlo with `pCorrect`,
  three distractors and a `solvableFraction`, tuned to land on a published GSM8K curve.
- The temperature dial, which the page's own comment admits is modelled because temperature
  appears in no reported number.

**Revised narrative, three beats:**

1. **The vote, run for real.** N real chains at real temperature, streaming in, tallied into
   a ranked histogram of distinct answers. Truth spikes; errors scatter. Click any bar and
   read the actual traces that landed there.
2. **It only works if the voters differ.** Temperature is now a measured axis, not a modelled
   one, and the T=0 case is the punchline: at greedy decoding all N chains are *identical*, so
   the vote is a no-op and the curve is flat. Diversity is reported as a number (distinct
   answers, and entropy over the answer distribution), not asserted.
3. **The vote can be beaten.** One measured number, no figure: the share of problems where the
   model produced the right answer and the vote threw it away. This is the bridge, and it is
   deliberately not drawn here. See the note below.

**Budget is matched throughout, which is the promise page 6 makes.** Page 6 closes on "same
total budget, spent differently." This page keeps that literally: total tokens per problem is
held constant and only the *split* varies. N chains of B/N tokens each. That makes the N axis
an allocation question rather than a spend-more question, it keeps every point on the curve
costing the same, and it produces an interior optimum rather than a flattening asymptote,
because at large N each chain is too short to reason at all.

**Why page 6 was greedy is answered here.** Page 6 held decoding fixed so budget was the only
variable. Page 7 opens by turning on exactly the thing page 6 held off. The seam is a
deliberate reveal rather than a change of subject.

---

## 2. Proposed Visual Layout / Diagrams

Keep page 1's per-step grid. The PredictBar mechanic stays; it is good pedagogy and it is
already correctly ungated (the chamber renders from first paint, and committing a prediction
draws a reference line rather than swapping the page). Do not rebuild that gate.

### Figure 1 (step 1) — the chamber, with a real tail

The dot array survives; the four-colour legend does not, because there are no longer four
buckets.

```
  N = 32 chains, T = 0.9, 64 tokens each          budget: 2,048 tokens total

  ● ● ● ● ● ● ● ● ● ● ● ●    ← correct (12)
  ● ● ●   ● ●   ● ●   ● ● ● ● ● ● ● ● ● ● ●    ← 17 chains, 14 distinct wrong answers

  ranked tally
  ┌──────────────────────────────────────────────────┐
  │ 3/8   ████████████████████████  12   ✓ correct   │
  │ 7/24  ██████  3                                  │
  │ 1/4   ████  2                                    │
  │ 5/12  ████  2                                    │
  │ 11/24 ██  1                                      │
  │ 2/3   ██  1                                      │
  │ …     ▏   1 each, 9 more distinct answers        │
  └──────────────────────────────────────────────────┘
       truth concentrates          errors scatter
```

Three things this figure must do that the current one cannot:

- **Show the tail truthfully.** Do not bucket the singletons into an "other" row. The row of
  ones *is* the argument. Collapse only past what fits, and label the collapse with a count.
- **Let the reader open a bar** and read the real traces that landed on that answer. Two
  chains agreeing on a wrong answer will usually have made *different* mistakes, and that is
  worth seeing. This is the trace payoff, and real wrong reasoning is more instructive than
  authored wrong reasoning.
- **Carry the matched-budget line** in the header: N chains at B/N tokens, total constant.

### Figure 2 (step 2) — two dials, both measured

Accuracy against N at fixed total budget, one line per temperature. The T=0 line is flat and
sits at the single-chain rate, because all N samples are the same sample.

```
  acc │                    ╭──●──╮
      │              ╭─────╯      ╰──╮        T = 0.9
      │        ╭─────╯                ╰───╮
      │   ╭────╯                            ╰──   T = 1.2
      │───────────────────────────────────────    T = 0   (flat: one voter, N times)
      └─────────────────────────────────────────
        1    2    4    8   16   32   64    N (chains, B/N tokens each)
```

The interior maximum is the figure's payload and it is a genuine finding rather than a
restatement: too few chains wastes the diversity, too many starves each chain of the room it
needs to reason. Mark it.

Beside the chart, a small **diversity readout** that moves with temperature: distinct answers
out of N, and entropy over the answer distribution. This replaces `chamberDiversity` with a
measurement. At T=0 it reads 1 distinct answer, entropy 0, and the flat line stops needing a
caption.

### Step 3 — the handoff, as one number rather than a figure

**Resolved (was open question 2).** An earlier draft of this spec drew a third figure here:
two lines, "the correct answer is somewhere in the N samples" against "the correct answer wins
the vote," with the gap shaded. That figure has moved to page 8, and the reasoning is recorded
in [page_8_refactor.md](page_8_refactor.md).

Briefly: page 8's main figure is a ladder of selection rules that all live *inside* that
shaded gap. The gap is not an illustration of page 8's problem, it is page 8's y-axis. Drawing
it in both places spends the deck's strongest bridge twice and weakens both uses.

What stays here is the finding itself, as a single measured sentence in a callout, in the
shape of:

> On **N%** of these problems the model produced the right answer and the vote threw it away.

No chart, no second axis. The number is computed from the same dump (`any_correct` minus
`plurality_correct` at the chosen N) and it carries the reader across the page break on its
own. This also returns space to figures 1 and 2, both of which want it.

---

## 3. Empirical Data / Reasoning Traces Needed

**Models and harness are page 6's**, unchanged: Qwen3-4B primary and Qwen3-1.7B as the second
level, bf16, MATH-500 levels 4 and 5, `extract_final_candidate` then `grade_answer`. Same item
set as page 6 so the two pages describe the same population and figure 3's N=1 point agrees
with page 6's curve at the same budget. That agreement is worth checking as a test.

**Two sweeps, both at fixed total budget B (2,048 tokens per problem).**

| Sweep | Held fixed | Varied | Produces |
|---|---|---|---|
| A · diversity | N = 32, so 64 tokens per chain | temperature 0.0, 0.3, 0.6, 0.9, 1.2 | figure 1's histogram, figure 2's line family, the diversity readout |
| B · allocation | temperature at sweep A's best | N = 1, 2, 4, 8, 16, 32, 64 (B/N tokens each) | figure 2's x-axis, figure 3 |

**Cost is bounded by construction.** Every configuration spends the same B tokens per problem,
so 12 configurations x 160 items x 2,048 tokens is roughly 3.9M generated tokens per model.
This is a smaller run than page 6's, not a larger one, which is the useful surprise: matched
budget makes the expensive-looking page cheap.

**Sampling parameters:** top-p 0.95 held constant so temperature is the only diversity knob.
Seeds recorded per sample. Every chain uses page 6's forcing rule at its own B/N cap, so short
chains still commit to an answer instead of grading as "no answer," and the two pages measure
the same thing.

**Per-sample record:**

```
problem_id, level, question, ground_truth,
config: { N, budget_total, budget_per_chain, temperature, top_p },
sample_index, seed,
trace, truncated, forced,
extracted_answer, correct, tokens_generated
```

Derived per problem and config, all from the dump with no further inference:
`distinct_answers`, `answer_entropy`, `plurality_answer`, `plurality_correct`,
`any_correct` (coverage), `plurality_margin`.

**Expected shapes, recorded now so we notice if reality disagrees:**

- Answer frequency should be heavy-tailed, with most wrong answers appearing once. If instead
  wrong answers concentrate, the page's thesis is in trouble and we would need to say so.
- The T=0 line must be exactly flat. If it is not, sampling is leaking somewhere and the run
  is broken. This doubles as a correctness check on the harness.
- The allocation curve should have an interior maximum. If it is monotone increasing across
  the whole range, B is too large for the item set and should be lowered until the starvation
  regime is visible.

**The one risk:** at small B/N, chains may be too short to emit any usable answer even with
forcing, so the right end of figure 2 could collapse to noise rather than to a clean decline.
Mitigation is to choose the N grid after a pilot, and to plot the "no usable answer" fraction
as a faint band rather than silently scoring it wrong.

---

## 4. Text / Captioning Balance

The current page carries a large explanatory load because everything on it is asserted. Real
data does most of that work, so the prose should shrink accordingly.

- **Lede:** two sentences. One chain, made longer, was page 6. Many chains, and keep what
  recurs.
- **Figure 1:** one caption sentence, and it should name the mechanism rather than describe
  the picture, in the shape of *wrong answers disagree with each other; right answers agree.*
  The pizza-vote analogy stays and stays short: it is load-bearing, and one clause is enough.
- **Figure 2:** one sentence on the interior maximum. The T=0 line needs no caption once the
  diversity readout says 1 distinct answer, and that substitution is the page's best
  prose-for-pixels trade.
- **Naming the temperature dial.** T appears on the page before anything explains it, so it
  needs one plain sentence at first use, sitting on the control itself rather than in prose.
  Keep it to what the reader needs in order to operate the dial:

  > **Temperature** is how much room the model has to answer differently each time. At zero
  > it has none, so every chain comes out the same.

  Nothing about tokens, scores, or probability distributions. The reader does not need the
  mechanism to read the figure, and the second sentence is what makes the flat T=0 line
  self-explanatory. If a reader wants the mechanism, the margin cite is where it lives.
- **Step 3:** one sentence carrying one number, framed as a thing that can be recovered rather
  than a loss to be accepted. It is the page's most important sentence precisely because it is
  the only thing standing where a figure used to.
- **Margin notes:** one operating hint beside figure 1; one bare cite for self-consistency as
  a technique, with **no numbers attached**. The Wang et al. author-year currently appears in
  exactly one prose place; keep that discipline and keep it numberless.
- **Chips:** "modelled temperature dial" is **deleted**, and deleting it is the point of the
  refactor. The provenance chip names model, decoding, item set and date.

---

## 5. Transition / Flow

**From page 6.** Two threads arrive and both get picked up in the first beat. Page 6's dial
ran out on a band of problems no budget reached, and page 6 was deliberately greedy. This page
answers the second immediately (turn temperature up) and the first structurally (a problem one
chain cannot reach may still be reachable by a different chain). The matched-budget framing
keeps the arithmetic honest: nothing here is buying more compute, only spending it differently.

**To page 8.** The step 3 callout is the bridge, and it is a much stronger one than the current
close. The model already had the right answer in hand on those problems and the vote discarded
it, because voting can only ever return the *most common* answer, and the right answer is
sometimes rare. Page 8 opens by pointing at that number and changes only the selection rule: stop
counting, start judging.

*Corrected 2026-08-08.* This paragraph used to say page 8 "keeps the same N candidates". It does
not: page 8 generated its own 12,800 chains and its `derived.json` says so in a field called
`same_candidates`. What it does do is re-run this protocol and land where page 7 landed, vote 56%
against 55% and coverage 78% both ways, which is the claim the page now makes and page 8's step 2
margin renders as the receipt.

**Boundary with page 11, worth respecting.** Page 11 owns the parameters-versus-thinking
exchange rate. Page 7 owns splitting one fixed inference budget across chains. Both are
allocation questions, so keep page 7's language on the *split* and let page 11 keep model size
entirely.

---

## Open questions for review

1. **One model or two on figure 2?** Page 6 establishes the shape-not-level principle with two
   curves, so page 7 may be able to spend that credit rather than re-earn it, keeping the
   temperature family legible. My recommendation: run both, plot Qwen3-4B, hold 1.7B in
   reserve for a faint confirmation line only if figure 2 looks thin without it.
2. ~~Does figure 3 belong on page 7 or as page 8's opening?~~ **Resolved: page 8.** Page 7
   keeps the finding as a one-number callout. See step 3 above and
   [page_8_refactor.md](page_8_refactor.md).
3. **B = 2,048 per problem.** Inherited from page 6 for comparability, but the allocation
   curve's interior maximum may sit at an awkward place in the N grid. Confirm with the pilot.
