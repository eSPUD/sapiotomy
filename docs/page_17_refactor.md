# Page 17 — "When Reasoning Breaks" refactor spec

**Status:** spec only. Nothing here is implemented.

**No new run is required.** Every number this spec asks for is already in `web/data`, produced
by the Act 2 notebooks and sitting unrendered. This is a loader and a component, not an
experiment. That is the reason to do it now rather than after the submission window.

**What page 17 is today.** Structurally sound and freshly repaired: the review findings 17.1
through 17.9 in [pages_15_19_refinement.md](review/pages_15_19_refinement.md) are all actioned,
the page has a test file, the cross-references point at real pages, and the two mechanisms
(re-reading against attempting again) are held apart in copy. Nothing below is a correction.

**What page 17 is not.** It is the least measured page in Act 3. Three of its four steps
restate published findings, and the one interactive beat is an authored Markov chain with five
invented constants ([frontier.ts:148](../web/src/lib/frontier.ts:148)):

```
solveProb 0.45   breakProb 0.10   fixProb 0.03   unsolvable 0.15   reliability 0.90
```

Step 3's overthinking pair is an authored inverse-U at authored peak positions
([overthinking.json](../web/data/overthinking.json)). The page's own footnote has to disclose
both, at length, and the disclosure is the longest paragraph on the page.

Meanwhile the deck measured all three of the title's failure modes during the Act 2 run, and in
two cases **measured them coming out differently than the literature says**. That difference is
the page.

---

## 1. Page Objective & Core Narrative

**Objective unchanged.** The compute dial has a wrong side. Self-correction, verifier
reliability, overthinking: the three modes the title names, in that order.

**What changes.** The page stops arguing from an authored simulation and starts arguing from
the deck's own measurements, and it acquires a spine that none of the source papers have:

> **Every pitfall on this page is invisible in the number you were looking at.**

That is not a rhetorical frame. It is what our runs actually show, three times over:

- the aggregate accuracy curve is flat where individual problems are being destroyed
- the judge's reliability is quoted as one number when it is a function of a knob turned two
  pages earlier
- the process grader's reliability was measured only in the 5.8% of the chain it can read

Each beat therefore ends with an instruction the reader can act on, which is the "how to avoid
it" half the page currently lacks.

### The design principle: a null is a finding when the null is the surprise

Several of the measured results below are nulls or small effects. The `Wait` crossing does not
resolve at any checkpoint. Six regressions out of a hundred is six out of a hundred. The top
rung of the budget ladder is flat, and its one loss is confounded.

**This is load-bearing and the copy must not launder it.** The page is not permitted to claim
"we measured overthinking". What it measured is that *the aggregate hid a per-problem effect*,
which is a different and better claim, because it is the one that changes what a reader does.
Any sentence on this page that reads as an effect where the run gives a null is a defect of the
same class as the authored constants it replaces.

Section 7 states the permitted claims exhaustively.

---

## 2. Proposed Visual Layout / Diagrams

Four steps, matching the current count. Page 1's per-step grid (step cell plus margin cell) is
kept. Step 1 shrinks, steps 2 and 3 are new figures, step 4 is kept nearly as-is.

### Step 1 — Marking its own homework (keep, compress)

**Keep Huang et al. Table 3 verbatim.** It is the only beat that should stay published data: we
never ran a pure re-read arm, and inventing one now would be the exact error this spec exists to
remove.

**Compress from two panels to one.** GPT-3.5 on CommonSenseQA (75.8 to 38.1 after one round) is
the memorable one and carries the claim alone. The GPT-4 GSM8K panel (95.5 to 91.5 to 89.0) is a
second instance of the same shape at a fraction of the amplitude.

**Add, in two sentences, what we ran instead.** Page 6's extension arm forced the model to keep
going with the word `Wait` rather than to re-read, which is the adjacent intervention. At
Qwen2.5-3B, three injections moved 30% of the answers and changed accuracy from 43% to 42%, and
not one of the three checkpoints resolves its crossing. Link to page 6; do not redraw its
figure. The lesson stated in the deck's own vocabulary: **the published result says review makes
it worse, and our own measurement says the milder version of the same knob mostly just churns.
Both rule out "ask it again" as a strategy, for different reasons.**

Provenance badge: `verbatim published numbers · one measured null of our own`.

### Step 2 (new figure) — What the climbing curve netted out

Replaces the authored inverse-U entirely. **Specimen-led, not statistic-led**: one problem shown
in full carries the beat, and the aggregates around it are scoped as caveats rather than as the
finding. Section 3 of [page_17_findings.md](page_17_findings.md) is why.

**Figure 2a, the ladder ledger.** Four rungs, one per budget doubling, each drawn as a paired
bar: answers gained against answers lost. This is the whole finding in one picture.

| rung | gained | lost | net |
|---|---|---|---|
| 128 to 256 | 11 | 1 | +10 |
| 256 to 512 | 20 | 2 | +18 |
| 512 to 1024 | 11 | 2 | +9 |
| 1024 to 2048 | 0 | 1 | -1 |

Every rung loses answers. The reader has seen page 6's climbing curve; this is the same run with
the losses drawn instead of netted out.

**Figure 2b, the specimen.** This is the step's centre and gets full card width.

`test/intermediate_algebra/190.json` at Qwen2.5-3B. Given `xyz(x + y + z) = 1`, minimise
`(x + y)(y + z)`. Ground truth 2.

The reader drags the same budget control as figure 2a and watches one chain:

- **cut at 128, 256 or 512 tokens and forced to commit: right, all three times**
- **allowed to run to its own 818-token ending: wrong, concludes `4√3/3`**

The error is legible and that is the whole reason this item was chosen. The chain assumes
`x = y = z`, computes `4/√3 ≈ 2.309`, and boxes it, where AM-GM on
`(x + y)(y + z) = y(x + y + z) + xz ≥ 2√(xyz(x + y + z))` gives exactly 2. A reader can check it
in thirty seconds, and both traces ship in the page 6 zip.

Show the chain folded with two zones lit: the symmetry assumption where it goes wrong, and the
concluding box. The full 818 tokens will not fit and should not be asked to.

**Three things the copy must say beside it, because each one is a control that failed.** These
are not hedges; they are what stops the specimen from being oversold, and section 3 of the
findings report has the numbers.

1. **The cut chain had not derived the answer.** In all 25 cases like this across the run, the
   work was cut mid-stream with no concluded answer, so the right answer came from the forced
   commit rather than from finished reasoning.
2. **The model did not simply know it.** Page 5's zero-token blurt arm gets only 6 of the 16
   affected items right.
3. **Nothing selects the good stopping point, and it is not cheap.** A fixed cut at 512 scores
   35% against the natural 43%, and five cut points buy the same coverage per token as plain
   resampling. This is page 7's coverage-without-selection shape, and naming it that way is the
   honest close.

**Figure 2c, the scope.** A small ledger, not a chart: 6 items in 100 at 3B, 8 at 1.5B, 2 at 7B.
The effect shrinks as the model gets better, which is the one aggregate claim worth making here
and it is a claim about capability, not about budgets.

**The structural fact that bounds the whole figure, and must be on screen.** Decoding is greedy,
so above the model's natural stopping point every larger budget is the *same generation*. At
Qwen2.5-3B the mean own-length is 693 tokens and 94% of chains self-terminate before 2,048, which
is why the 1024-to-2048 rung gains zero: for almost every item it is not a different run. The
budget axis therefore **cannot** show accuracy falling past a peak, only that some prefix beat the
whole. Say this in the caption. Without it a reader reasonably concludes the flat top is a
measured plateau rather than an artifact of where the axis ends.

`algebra/2391` is the one affected item whose natural length exceeds the cap, so its top column is
a forced commit at the cap rather than its own ending, and it is also the only loss on the top
rung. If figure 2c names items, mark it.

**Figure 2d, the instrument that works.** One row, not a chart: over roughly 1,600 candidates on
page 8's pile, trace length separates right from wrong at **AUC 0.257**. A correct candidate is
longer than a wrong one about a quarter of the time. Read the other way round, "prefer the
shorter chain" scores 0.743, which beats two of the four models asked to judge on that same pile
(`qwen1.5b` 0.607, `math1.5b` 0.719) and costs nothing to compute.

This is the step's actionable close, and it is our own measurement of the line the page currently
cites secondhand from Zeng et al. Keep the citation, demote it to corroboration.

Provenance badge: `our run · 100 problems · Qwen2.5-3B-Instruct · greedy`.

### Step 3 (new figure) — The verifier's reliability is a coordinate, not a property

**Figure 3a, reliability against temperature.** Four x positions, one line per selector, all
measured at a **common depth of N = 16** so temperature is the only thing moving. The notebook
computes it this way deliberately, because reliability decays with N and mixing depths would
smuggle that decay into the comparison.

| selector | T 0.3 | T 0.6 | T 0.9 | T 1.2 |
|---|---|---|---|---|
| one chain | 64.1 | 62.8 | 59.0 | 37.8 |
| majority vote | 71.8 | 71.8 | 69.2 | 59.5 |
| best-of-N, self as judge | 64.1 | 65.4 | 53.8 | 56.8 |
| best-of-N, Qwen 7B judge | 70.5 | 71.8 | 62.8 | 56.8 |
| best-of-N, Skywork PRM | 70.5 | 76.9 | 73.1 | 70.3 |

Two things the reader should extract, in this order:

1. **Every judge degrades, and the knob doing it is page 8's own diversity knob.** Temperature is
   what makes best-of-N worth running. It is also what blinds the judge. One chain falls 26
   points. Nothing here is a property of a verifier in isolation.
2. **The trained reward model is the only line that is flat.** 70.5 to 70.3 across the sweep. At
   T 0.3 it is mid-pack and `qwen1.5b` beats it; by T 0.9 and T 1.2 it is above every
   generator-as-judge by 10 points or more. The crossing is the claim, so the figure must be read
   left to right rather than at one column. The page's second actionable instruction: when the
   pool is noisy, a model asked to judge is not a verifier, and a thing trained to score is.

Draw the PRM line bold and the rest at reduced weight, per the deck's bold-only-where-winning
idiom. Do not draw `coverage` (100% at every column by construction) or `heuristic`/`logprob`
unless the step has room; they are page 8's diagnostics and they dilute this figure.

**Figure 3b, the 94%.** A single full-width bar, 18,772 steps, split at 5.8% / 94.2%. Of every
step in 1,580 real chains, an arithmetic checker can adjudicate 1,092. The rest state nothing it
can compute.

The payload sits underneath: the process reward model's headline quality on those chains is
**AUC 0.892, recall on false steps 0.79, specificity 0.86**, and every one of those numbers was
computed on the lit 1,092. The run file says so itself, and the sentence should appear on screen
as the citation anchor rather than be paraphrased:

> steps with a closed-form numeric claim, which are the steps most like the PRM's training
> distribution; an optimistic estimate of its reliability on the prose steps it is trusted with

Page 9 states the same 5.8/94.2 split as framing for its two instruments. **Page 17 is not
allowed to redraw page 9's figure**; what is new here is turning the split on the reliability
number itself. Cite page 9 by name in one clause.

**The close, two measured costs of trusting it anyway,** as one line each, no figure:

- filtering page 7's candidate pool by step soundness moved majority vote 57% to 58% and changed
  the answer on **1 problem in 100**
- how much of a wrong chain counts as sound moves 25 points depending only on where the chain is
  cut into steps. Page 9 already draws this at
  [Page9.tsx:718](../web/src/components/pages/Page9.tsx:718), so page 17 gets a clause pointing
  there and **does not restate the number**

Provenance badge: `our runs · pages 8 and 9 · unrendered until now`.

### Step 4 — What still works (keep)

Keep all three items and the contamination callout, which is correctly placed and correctly
scoped. Two edits only:

- the verifier bullet gains the PRM result from step 3: selection with a judge still beats blind
  voting, and a *trained* judge is the one that holds up when the pool gets noisy
- the external-feedback bullet gains the sharpest number the page owns: the reason "give the
  reviser real information" is not a platitude is that 94% of the chain has no information a
  checker can supply

---

## 3. Empirical Data: what exists, where, and what is already drawn

Nothing new to run. Every field below is present today.

| # | Claim | Source field | Rendered anywhere? |
|---|---|---|---|
| 1 | forced `Wait` churns without adding | `page-06-derived.json` `figure_wait` | **Yes**, page 6 step 4. Cite, never redraw |
| 2 | every budget rung loses answers | `figure_3.items[].correct_by_budget` | No. Losses are netted out of page 6's curve |
| 3 | six problems break permanently | `figure_3.n_regressions` = 6 | No. [page06.ts:642](../web/src/lib/page06.ts:642) exports `nRegressions` and nothing consumes it |
| 4 | length is an anti-signal, AUC 0.257 | `page-08-derived.json` `figure_3.discrimination` | No. Unreferenced by [page08.ts](../web/src/lib/page08.ts) |
| 5 | reliability falls with temperature | `figure_3.reliability_across_temperatures` | No. [page08.ts:429](../web/src/lib/page08.ts:429) collapses `per_config` to mean/lo/hi |
| 6 | 94.2% of steps are unreadable | `page-09-derived.json` `step_label_counts` | Partly. Page 9 states the split as instrument framing |
| 7 | PRM quality measured only in the lit 6% | `prm_reliability.measured_on` | No |
| 8 | step filtering bought 1 point | `selection` | **Yes**, page 9 step 3. One clause, no figure |
| 9 | soundness moves 25 points with segmentation | `localisation.segmentation_spread_pts` | **Yes**, [Page9.tsx:718](../web/src/components/pages/Page9.tsx:718). Cite in a clause, do not restate |

**Run identity for the provenance line.** Items 2, 3 come from
`full-math500_l45-n100-9ab2b579-cap2048-bfloat16-cuda`: Qwen2.5-3B-Instruct at bf16, MATH-500
levels 4 and 5, n = 100, `item_set_sha256` 9ab2b579, greedy. Items 4, 5 come from page 8's grid
at pool depth 16. Items 6 through 9 come from page 9's 1,580 chains, which are page 7's pile at
`t0.30-c2048`. All three share the same item set, so the page can say "the same hundred problems"
and mean it.

### Three confounds that must reach the screen

1. **The budget axis is bounded above by the model's own stopping point.** Section 2 covers this
   in full. It is the confound that shapes the figure rather than merely qualifying it, and it is
   the reason the difficulty-threshold claim in section 7 is unreachable rather than merely
   underpowered.
2. **Reliability denominators shrink with temperature.** Reliability is undefined where no
   candidate is right, so `n_reachable` falls as T rises. The decline in figure 3a is therefore
   measured on an easier and easier subset, which makes it a *conservative* reading of the fall.
   One clause in the caption.
3. **Pool depth differs across page 8's temperature columns** (16, 16, 32, 64) for coverage and
   majority, but **not** for figure 3a, which is pinned at 16. Do not quote page 8's
   `by_temperature` coverage numbers next to figure 3a without saying which is which.

---

## 4. What gets deleted

The page cannot carry both arguments, and leaving the authored version in as a "model" would
teach the reader that an authored chain and a measured ladder have equal standing.

| Artifact | Disposition |
|---|---|
| `SELF_CORRECTION`, `selfCorrectionCurve` ([frontier.ts:148](../web/src/lib/frontier.ts:148)) | Delete. Page 17 is the only consumer |
| `inverseU` ([frontier.ts:183](../web/src/lib/frontier.ts:183)) | Delete. Page 17 is the only consumer |
| `web/data/overthinking.json`, `curves.overthinking` | Delete |
| `curves.selfCorrection` (`self-correction.json`) | **Keep.** This is Huang Table 3 and step 1 still prints it |
| [act3.test.ts:153-179](../web/src/lib/act3.test.ts:153), `:231` | Delete the four blocks covering the above |
| The step-2 slider, the verifier toggle, `LineChart` on the self-correction curve | Delete with the model |
| The footnote's authored-constants paragraph | Delete. It exists only to disclose what is being removed |

The footnote shrinks to what a downloadable notebook cannot state, per the page-5 rule: the
truncation confound, the shrinking reliability denominator, and the fact that page 6's Huang-shaped
result is a null rather than a confirmation.

---

## 5. Text / Captioning Balance

**This budget was missed, and the miss is recorded rather than quietly dropped.**

The target was at or under 890 rendered words, on the basis that page 17 measured ~890 and page
16 ~1,150 in [page_16_simplification.md](page_16_simplification.md). Measured the same way after
the refactor, page 17 is **1,985**. Neighbours for scale: page 15 is 951, page 16 is 1,042, page
18 is 949, page 9 is 1,385 and page 6 is 1,797. Page 17 is now the wordiest page in the deck.

Two trimming passes took roughly 250 words out. What is left resists cutting for a structural
reason: the page gained two measured steps where it had one authored figure and one prose beat,
and **the specimen cannot ship without its three controls** (section 2). Cutting to 890 means
deleting a control, a figure, or the specimen itself, and each of those makes the page less
honest rather than shorter.

Two calls made under that pressure, both against the earlier draft of this spec:

- **Step 1 keeps both Huang panels.** The spec proposed compressing to one. Step 1 is now the
  page's only borrowed claim, and two benchmarks at very different amplitudes (95.5 to 89.0
  against 75.8 to 38.1) are what stop it reading as a one-benchmark fluke. It costs ~40 words.
- **The footnote is three entries, not five.** The axis bound and the sweep caveat are stated
  beside their own figures, so restating them in the tail is the manifest recap the house rule
  forbids.

If the page must come down further, the honest lever is **step 4**, not steps 2 or 3: it is the
one section carrying no measurement of its own.

Every figure carries its citation beside it. Margin notes stay one imperative sentence.

## 6. Transition / Flow

**Inbound from 16** is already correct: *"the side of the dial where spending more makes the
answer worse."* This refactor delivers exactly that with a measured dial instead of an authored
one, which strengthens the seam without touching page 16.

**Outbound to 18** is kept verbatim. It survives the rewrite intact, and it improves, because step
3 now ends on a measurement showing 94% of the chain is unreadable to the checker and the handoff
asks whether the readable part is even the real reason.

**Backward pressure on Act 2, which is the point of the page.** Every figure here re-reads a run
the reader already met as a success:

- page 6's climbing curve, with the losses drawn back in
- page 8's judge ladder, with the temperature axis restored
- page 9's two instruments, with the reliability number scoped to where it was taken

Say this once, in the step 1 lede, and let the figures carry it.

---

## 7. What the page is allowed to claim

Exhaustive. Anything not on this list needs a new run.

**May claim:**

- on 6 items in 100 at 3B (8 at 1.5B, 2 at 7B) the model answered correctly when cut off early
  and forced to commit, and incorrectly when it ran to its own stopping point, and the count
  falls as the model gets better
- problem 190 specifically was right at three separate cut points and wrong at its own ending,
  and its error is an unjustified symmetry assumption a reader can check
- that the correct answer in those cases came from the forced commit and **not** from finished
  reasoning: the work was cut mid-stream with no concluding step in all 25 cases
- that the model did not simply know the answer: page 5's blurt arm gets 6 of the 16 affected
  items
- that nothing tested selects the good stopping point: a fixed cut at 512 scores 35% against the
  natural 43%, and cut points buy no more coverage per token than resampling does
- every budget rung in the ladder loses answers as well as gaining them
- the aggregate accuracy curve shows none of this
- the top rung gains nothing because, under greedy decoding, 94% of chains have already
  self-terminated and the larger budget is not a different run
- on this pile, trace length separates correct from incorrect at AUC 0.257
- every selector's reliability falls as temperature rises, measured at a common depth
- the trained reward model's reliability is flat across that sweep and the model judges' is not
- 94.2% of 18,772 steps state nothing the arithmetic checker can compute
- the PRM's reliability figures were computed on the remaining 5.8%
- step filtering moved majority vote by one point and one problem
- forced `Wait` injections moved 30% of answers and resolved nothing, at three checkpoints

**May not claim:**

- that we measured overthinking, or an inverse-U, or a threshold. The aggregate is flat at the
  top and its one net loss is confounded
- that stopping early is a strategy, a skill, or worth points. It is coverage without a selector,
  and the page must say so in the same breath as the specimen
- that easy problems cross a threshold before hard ones. This is the one claim the authored figure
  made that the run cannot support, and dropping it is the price of the refactor. It was tested
  during drafting and it fails twice over. **Empirically:** pooling all three checkpoints from the
  shipped `traces.jsonl` gives 18 regression events, and the median break budget is 512 for level
  4 and 512 for level 5, with 8 events against 10. There is no signal to split. **Structurally:**
  under greedy decoding the budget axis stops mattering at the model's own stopping point, so it
  cannot carry a threshold that a problem crosses. Getting the claim back is not a matter of more
  items or a finer ladder; it needs a different axis. See section 9
- that `Wait` injections lower accuracy. Not one crossing resolves
- that a verifier's reliability at one temperature predicts another model's, or the same model's
  at another depth
- any AUC or reliability figure as a property of a model rather than of a model on this pile

---

## 8. Implementation plan

### 8.0 The dependency that sets the shape

**Problem 190's traces are not in `page-06-derived.json`.** Its `figure_1.rows` carries nine
specimens and 190 is not one of them; the traces exist only in `traces.jsonl` inside the shipped
zip. Adding a row to page 6's data file is the wrong fix, because page 6 renders those rows and
would gain a specimen it never asked for.

So page 17 needs its own derived file and therefore its own notebook, like every other measured
page in the deck. This is REPLAY-only over artifacts already committed: **no GPU, roughly a minute
of runtime, no new generations.** It is a small scope addition and it is what makes the page
downloadable and re-derivable to the same standard as pages 5 through 9.

### 8.1 Ordered work

Each step is commit-sized, states what it proves, and how it is checked.

| # | Work | Proves | Check |
|---|---|---|---|
| 1 | `notebooks/page_17_when_reasoning_breaks.ipynb`, REPLAY only. Reads pages 5/6/7/8/9 artifacts, emits `web/data/page-17-derived.json` plus manifest | The three runs are one population; every page number is re-derivable | Gate block asserts `item_set_sha256` agreement and reproduces page 6's 15 accuracy cells bit-exactly, the way page 11 arm 0 does |
| 2 | `web/src/lib/page17.ts` and `page17.test.ts` | The page reads data, never literals | `npm run test`, `npm run typecheck` |
| 3 | **Step 3 figures** (reliability against temperature, the 94.2% bar) | The strongest and least contested material lands first | Renders; numbers match loader |
| 4 | **Step 2 figures** (rung ledger, the 190 specimen, the scope ledger, the length row) | The specimen beat, with its three controls in copy | Renders; controls present in text |
| 5 | Step 1 compression, step 4 edits, footnote rewrite, handoff untouched | Word budget holds at or under 890 | Word count; copy review |
| 6 | Deletions per section 4, in one commit with their tests | Suite never sits green over dead constants | `npm run test` |
| 7 | `Page17.test.tsx` rewrite | Rendered copy is pinned, including the confounds | `npm run test` |
| 8 | `PROVENANCE.md` row, `notebooks/README.md` row, screenshot | Provenance rebuild picks the new file up with no special case | Visual review |

### 8.2 What the notebook must emit

Keep it minimal. Everything else the page needs already has a loader.

- the rung ledger: gained, lost and net per budget doubling, recomputed from item records
- affected-item counts per checkpoint (8, 6, 2) with the definitions of *regression* and
  *rescued item* kept distinct
- the 190 specimen: `by_budget` traces at all five budgets, with `cut_index`, `answer_start`,
  `truncated`, `forced` and `extracted_answer`, so the page can light the two zones
- the three control numbers: the 25-cases-no-concluding-step count, page 5's blurt hit rate on
  the affected items, and the fixed-cut-at-512 accuracy against the natural ending
- a `claims` block in the pages 5 to 9 style, so a future reader sees which gates passed

### 8.3 Ordering rationale, and where it is safe to stop

Step 3 before step 2 deliberately. The verifier material is solid, unrendered and uncontested,
while step 2 is the one carrying a specimen and three controls. If the window closes early, the
page should already be better rather than half-converted.

Two safe stop points:

- **after step 3:** page 17 has one fully measured step and three as they are today. Coherent,
  shippable, strictly an improvement.
- **after step 6:** the refactor is complete and only the test rewrite and provenance rows remain,
  which are a single sitting.

Do not stop between steps 4 and 6. Landing the new figures while the authored constants are still
imported leaves the page arguing both ways at once.

### 8.4 Effort

| | |
|---|---|
| Notebook and derived file | half a sitting |
| Loader and its tests | half a sitting |
| Three figures | one sitting |
| Copy, deletions, tests, provenance | one sitting |
| **Total** | **about three sittings, no GPU** |

---

## 9. Getting the difficulty-threshold claim back: what it would take

Asked during review. Answered here rather than left as an open question, because the answer
turned out to be structural and it changes section 2.

### What is already free, and what it settled

Page 6 ships all 2,720 raw records in
[page-06-thinking-longer.zip](../web/public/notebooks/page-06-thinking-longer.zip), and every
checkpoint has a complete item-by-budget grid, not just the primary. `figure_3` only ever emitted
the 3B. Pooling all three is a `REPLAY`, no GPU, and it triples the sample:

| checkpoint | regression events |
|---|---|
| Qwen2.5-1.5B-Instruct | 8 |
| Qwen2.5-3B-Instruct | 6 |
| Qwen2.5-7B-Instruct | 4 |
| **pooled** | **18** |

Run during drafting. The level split is flat: median break budget 512 at level 4 (n = 8) and 512
at level 5 (n = 10). Every one of the 18 events has the model truncated on the correct side. Zero
events are one natural ending beating another, which under greedy decoding is impossible by
construction.

**So the cheap version is done and it is a null.** Cost to write it up as a stated null rather
than a silence: about half a day, no GPU. Recommended regardless of what follows.

### Why more of the same instrument will not work

The budget ladder cannot express the claim. Greedy decoding means that once the model
self-terminates, every larger budget replays the same generation, so the axis has no room above
the natural stopping point (mean 693 tokens at 3B, 94% self-terminated by 2,048). A threshold the
reader crosses by spending more has nowhere to sit. More items, more checkpoints and a finer
ladder all raise the event count and none of them move this.

The axis that does extend past the natural stop is page 6's wait-injection arm, and **that arm
already ran and returned a null at all three checkpoints** (fixed against broken: 9/10, 7/9, 4/7;
no crossing resolves).

### What a real attempt looks like

Wait-injection as a fine ladder rather than four points, over a difficulty split that our
instrument actually orders, with per-band paired counts.

| | |
|---|---|
| Item set | 200 per band, two bands. Level 4/5 barely orders break timing, so the band needs the L1-3 set, which page 11 arm A already implements and which is itself waiting on a GPU. Shared cost |
| Ladder | 8 or more injection levels, not 4 |
| Checkpoints | 2 (3B and 7B). The 1.5B churns 59% and is mostly noise on this axis |
| Generations | roughly 6,400, at the wait arm's longer mean length (1,250 tokens against the budget arm's 693) |

Elapsed, assuming a GPU is in hand:

- notebook authoring, band definition, pre-registered gates and both branches of the copy: **1 to 2 days**
- the run itself: **10 to 16 GPU-hours**, so 1 to 2 days of wall clock with the usual reruns
- analysis, `derived.json`, loader, figure, tests, copy: **2 to 3 days**
- **about a week of focused work, plus GPU availability**

### Recommendation: do not

Three reasons, in order of weight.

1. **The prior is another null.** We are proposing to split a measured null by difficulty, which
   halves the n per cell. Page 6's wait arm is the best evidence we have about what this axis
   does, and what it does is churn.
2. **The replacement finding is better and costs nothing.** "The model's own choice of when to
   stop is worse than an early forced stop, on 5 of 100 problems, one of them at three separate
   cut points" is more surprising than "easy problems peak sooner", it is ours, and a reader can
   check it in the shipped traces. Section 2 now leads with it.
3. **Page 17 is not the page that should be spending a GPU week.** Page 11 arm A and page 14's
   distill run are both queued on the same hardware and both settle load-bearing claims. This
   would settle a claim we can simply decline to make.

If the word "overthinking" in the page title is the actual pressure, open question 1 resolves that
for free.

---

## Open questions for review

1. **The title.** `pages.ts` calls page 17 "Self-Correction, Verifier Reliability, Overthinking".
   Section 7 forbids claiming overthinking as measured. Either the third noun goes, or it stays
   and step 2 is explicit that the published finding is what names the beat while our run
   supplies the per-problem version. **Recommend keeping the word and letting step 2 own the
   distinction**, since the honest gap is more interesting than a retitle, but it is a call to
   make before implementation rather than during.
2. **Step 1's second panel.** Cutting GPT-4/GSM8K saves about 40 words and one figure. It also
   removes the page's only cross-benchmark evidence for the Huang result. Cut or keep?
3. **Figure 3a's line count.** Five selectors is readable; adding `heuristic` and `logprob` makes
   seven and turns it into page 8's diagnostic panel. Recommend five.
4. **The six squares are 6% of a 100-square grid.** Whether that reads at page width, or whether
   the grid needs a "show only the six" affordance, is a visual call best made against a
   screenshot rather than decided here.

*Resolved during drafting: page 9 does render the 25-point segmentation spread
([Page9.tsx:718](../web/src/components/pages/Page9.tsx:718)), so page 17 cites it and does not
restate it.*
