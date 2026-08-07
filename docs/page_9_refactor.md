# Page 9 — "Outcome vs Process Supervision" assessment and partial refactor

**Status:** notebook drafted (`notebooks/page_09_outcome_vs_process.ipynb`), revised after a
data-validity review, pending a run and approval; the page itself is unchanged.

**What the validity review changed** is recorded in section 3d below and summarised here, because
two of the four items were defects rather than refinements: the notebook pooled every one of page
7's configurations instead of its pile, and its manifest asserted a prompt that page 7's chains
were never shown. The other two admit a PRM under conditions this note previously ruled it out
under, and add a segmentation-sensitivity check. Nothing about the page's claims changes; what
changes is what the notebook is allowed to say it measured.

**One thing changed during implementation, and it is a filter rather than the exclusion an
earlier draft of this note claimed.** The spec said this page consumes pages 6 to 8's dumps. Some
of that is unusable: page 6's sweep is capped and force-committed on purpose, and page 7's
*split* axis is budget-starved on purpose, so a break in either is **our** intervention rather
than the model's error and grading it would report our own experiment as a finding. But page 7's
*pile* runs each chain to its natural end, and the ones where the cap never bound are exactly
what this page needs.

So the rule is: **grade only chains the model ended itself** (`truncated` false, not forced). The
notebook prefers page 7's pile under that filter, reports how many survived, and generates its
own uncapped pass only if too few do. It runs on Act 2's shared instrument, `Qwen2.5-3B-Instruct`,
so page 9 describes the same population as the pages before it.

**Implementation follows the notebook-first pipeline** in
[page_6_refactor.md](page_6_refactor.md) section 6. This page's notebook is where the step
checker lives, and being able to read that checker line by line is most of what makes its labels
trustworthy, so the beginner-readable requirement matters here more than anywhere.

---

## Verdict: partial revamp, deliberately scoped

**Chapter 5 does not help this page.** Its scorers grade whole responses; process supervision
grades steps, and nothing in the book does that. This is the one page in the run where the
book has nothing to lend, and it is worth saying plainly rather than reaching.

**Our own dumps do help, in two specific places, and not in a third.**

| Element | Current state | Verdict |
|---|---|---|
| The three traces | authored, on 16/64 | **replace with curated real ones** |
| "Reveal the PRM's labels" | no PRM ever ran | **fix; this is an honesty defect, not a style one** |
| The base rate of right-answer-wrong-reasoning | asserted, never quantified | **add; cheap and it is the page's thesis** |
| The ORM vs PRM bar chart | redrawn published numbers | **replace, but with a step-checking selector, not a PRM** |
| The close reading itself | authored, excellent | **keep the structure entirely** |

The reason this is a partial rather than a full revamp is that page 9's most valuable content
does not benefit from scale. Pages 6, 7 and 8 each needed a population to say anything at all.
Page 9 needs three specimens and a careful look at them, and three specimens do not become
more true for having been drawn from a thousand. What they do become is **real**, and that is
worth the (small) effort.

**What we explicitly do not do:** build a PRM-driven interactive, or attempt to reproduce an
ORM-versus-PRM comparison with a trained process reward model. A PRM's step labels are a
model's opinion, so teaching process supervision with an unvalidated process supervisor is
circular, and establishing that model's reliability is a bigger job than this page. Cheaper and
more defensible options exist, below.

**Amended: a PRM may participate, under conditions.** The sentence above rules out an
*unvalidated* process supervisor and that ruling stands. What it accidentally also ruled out was
a **validated** one, and validation turns out to be affordable here for a reason the earlier
draft missed: the arithmetic checker gives us ground truth on a subset of steps, so a PRM can be
measured against it rather than trusted. The conditions, all implemented in section 6 of the
notebook:

- it is measured, not asserted, and the measurement is **AUC** rather than accuracy at a
  guessed cut-off;
- its operating threshold is **fitted on the checker's labels and recorded as fitted**;
- it must clear a bar **set before the run**, and if it misses, its labels are stripped from
  `derived.json` rather than published with a caveat;
- it never carries detection or localisation, which remain the checker's alone.

So the position is unchanged in substance: no unvalidated supervisor reaches the page. What
changed is that we found a cheap way to validate one, and a measured negative result about an
off-the-shelf PRM is worth as much to this page as a positive one.

---

## 1. Page Objective & Core Narrative

**Objective unchanged.** Grade the final answer or grade every step. Only the second catches
right answer with wrong reasoning, and only the second localises the break. The teaching case
and the two limits the page refuses to skip are all good and all stay.

**The honesty defect to fix first.** The interactive invites the reader to mark each step, then
reveals what it calls the PRM's labels. No PRM produced them; they are hand-written `ok`
booleans in [authored.ts](../web/src/lib/authored.ts:598). Every other authored element in the
deck is chipped as authored, and this one is not merely unchipped, it is attributed to a system
that never ran. That is the sharpest thing on the page and it gets fixed whether or not the
rest of this spec is built.

**The page makes two claims, not one, and the spec must serve both.** Read the current page's
own framing: Solution A is *detection* (process catches a right answer reached by nonsense), and
Solution B is *localisation* (outcome grading can only say "wrong", process grading points at
step 2). The header calls localisation "the signal you actually need"
([Page9.tsx:19](../web/src/components/pages/Page9.tsx:19)).

An earlier draft of this spec measured only detection. Section 3 now covers both, because a
refactor that drops localisation would keep the page's traces while quietly abandoning half of
what they are there to teach.

**The one number the page is missing.** The page asserts that outcome grading rewards nonsense
that happens to land right. It never says how often:

> On **N%** of the problems this model answered correctly, at least one step of the reasoning
> that got there was false.

**Why that number matters beyond this page, which the earlier draft missed.** Page 12 is STaR:
generate rationales, keep the ones that reach the right answer, fine-tune on those, repeat. N%
*is the contamination rate of that filter*. Every trace in the base rate is a piece of bad
reasoning that an outcome check waves into the training set, and the model then learns from it.
That makes even a small N consequential, and it turns page 9 from a detour into the page that
sets up Act 3's central mechanism. Say so in one sentence on the page.

---

## 2. From authored to curated: the method that makes this cheap

The objection to real traces on this page is legibility. Real traces run hundreds of tokens,
their invalid steps are subtle and buried, and the mark-the-step interaction needs something a
reader can hold in their head. That objection is correct, and it is answered by not generating
anything new.

**We do not author the specimens. We search for them.**

From the existing dumps, query for traces that are simultaneously short, verifiably broken at
exactly one step, and correct at the end. In a dump of thousands that is a needle-in-haystack
search, which is to say it is easy, because a haystack is exactly what makes needles findable.
Three or four specimens is the whole requirement.

Selection criteria, applied as a filter rather than as a judgement:

- fewer than roughly 8 steps, so the interaction still fits
- at least one step failing the checker below
- one specimen per row of the existing table: right answer with a false step, wrong answer with
  one localisable break, and a clean chain for contrast

The three roles the current traces play are well chosen and the curated set should fill the
same three. What changes is only that a model wrote them.

### The step checker

Labels come from **deterministic arithmetic verification**, not from a model.

Parse each step for computational claims of the form `a op b = c` or `x = y`, and check them
with sympy. This is the same machinery ch03's `grade_answer` already uses for final answers,
pointed at intermediate lines instead.

**The precision rule, which is not an implementation detail.** The checker may only judge
claims that are **closed-form numeric on both sides, with no free symbols**. `3/4 = 9/12` is
checkable. `Let x = 5` is a definition and must be skipped, not failed. `f(2) = 7` depends on a
definition earlier in the trace and must be skipped too. A naive equation-matcher flags both as
false, and a single false positive destroys the only thing this checker has going for it: that
its labels are facts rather than opinions. High precision, low recall, and the recall limit
stated openly.

The skipped steps are not a hole to hide. Each step gets one of three labels: **checked and
true**, **checked and false**, or **not checkable**. The reveal shows all three, and the third
is honest about what a deterministic checker cannot reach. It also, usefully, makes the page's
own point visible: most of a reasoning chain is not arithmetic, which is exactly why real
process supervision needs a model and why that model's reliability then becomes the problem.

Why this rather than a PRM:

- **It is re-derivable.** A reader can check any label by hand, which is the deck's standard.
- **It has no opinion.** A false arithmetic claim is false, and the reveal is then a fact rather
  than an attribution.
- **It has honest, statable limits.** It catches slips and cannot catch invalid *method*. The
  cancel-the-sixes case has perfectly valid arithmetic and would sail through, which is worth
  admitting on the page, because it says something true about how hard process supervision is.

That last limitation is a feature for the narrative and a constraint on curation: the
curated specimens will skew toward arithmetic slips rather than method errors. If we want a
method-error specimen, it gets found by hand and labelled by hand, and chipped as such.

**The checker forces the page's own pedagogical point.** The page argues that the reasoning
step is the unit because a claim does not exist until the line is finished. The checker cannot
parse a claim out of half a line, so the implementation runs into the same floor the prose
describes. Worth one sentence, because an argument that the implementation independently
discovers is stronger than one asserted.

---

## 3. What step grading buys, measured three ways

The current chart redraws published MATH best-of-N numbers for majority, ORM and PRM. It has to
go on the constraints alone. What replaces it is **not one figure but three measurements**,
because the page makes more than one claim and the accuracy comparison is the weakest of the
three and the one most likely to come out null.

**Which traces, specifically. Superseded during implementation; the rule below is what runs.**
An earlier draft said to use page 6's records at the top two budgets and page 7's at low N. That
is too loose in the one way that matters: it pools chains generated under different budgets and
different decoding, and step-grading a mixture reports a population that never existed.

The implemented rule is narrower and is a single line: **page 7's pile, one configuration, one
chain per problem, where the chain ended itself.**

- **One configuration.** Page 7's dump holds the pile, the split axis, a diversity family at four
  other temperatures, and a replicated greedy set. Only the pile qualifies, and the notebook
  names it from page 7's manifest rather than by pooling whatever shares a `problem_id`.
- **One chain per problem**, the first by `sample_index`. That is one unbiased draw from N
  samples, which is what an outcome grader would actually be handed. It is not the best chain,
  the modal chain, or the greedy chain, and the page must not describe it as any of those.
- **Where the chain ended itself**, meaning `truncated` false and not forced.

Page 7's high-N split traces are 32 to 64 tokens and contain almost no checkable steps, so the
earlier draft's instinct about them was right; the fix is to exclude the axis rather than to pick
a good end of it.

### 3a. Detection: how often does outcome grading reward nonsense

The base rate from section 1: among traces with a **correct final answer**, the share containing
at least one checked-false step.

**The risk, named up front because it can hollow out this measurement.** An arithmetically false
step usually propagates into a wrong final answer, and the classic right-answer-wrong-reasoning
cases are *method* errors with valid arithmetic, which this checker cannot see by construction.
So N may come out very small, a few percent rather than the double digits the page's rhetoric
implies.

Measure it first. It is a query, not a run, so it costs nothing to know early, and the whole
page's framing depends on the answer:

- **N is a visible share:** the page reads as drafted.
- **N is small:** report it as small and change the verb. "Rarer than you would think, and every
  one of them is a piece of bad reasoning an outcome check waves into the training set" is a
  true and interesting sentence, and the STaR link in section 1 is what gives it stakes. Do not
  inflate it.
- **N is zero:** the checker is finding nothing at all, which is a fact about the checker rather
  than about the model. Fall back to the internal-consistency check in the open questions before
  abandoning the measurement.

### 3b. Localisation: how much of a wrong chain survives

**This is the measurement the earlier draft was missing**, and it maps onto Solution B, the page's
second teaching case, which no figure has ever supported.

Take traces with a **wrong final answer** where the checker flags a false step at position *k* of
*n*. Two graders look at that trace:

- **outcome** can only say *wrong*, which condemns all *n* steps;
- **process** points at step *k*, leaving steps 1 to *k-1* standing.

So the measured quantity is the share of the chain that process grading exonerates, and the
headline is a single sentence the page has never been able to say:

> When the break is findable, the first **X%** of the chain was fine. Outcome grading throws all
> of it away.

Second reading from the same data, and it tests something the page currently asserts: **how
often is there exactly one false step rather than several?** Solution B teaches that the break
localises to one line. If real traces routinely carry three, that is a genuine finding and the
prose should follow the data rather than the other way round.

Both come from the same dump with no inference. The figure is a distribution of *k/n*, or a
single stacked bar contrasting what each grader condemns.

### 3c. Selection: a sixth rung on page 8's ladder

**Add a step-checking selector.** Among the N candidates, drop
any whose reasoning contains a verified-false step, then apply the best outcome selector to what
remains. That is a process-aware selector standing beside five outcome-based ones, on identical
candidates, and the comparison is ours.

```
  accuracy at fixed N
   oracle        ●
   step-check +  ●        ← process-aware: reads the working
   logprob       ●
   majority      ●        ← outcome only: reads the answer
   heuristic     ●
   random        ●
```

**Expect a small gain, and report it honestly.** The checker is a weak process supervisor with
limited recall, so its improvement over the outcome selectors may be modest. A small measured
gain from a deterministic checker is still worth more than a redrawn bar chart, and if the gain
is zero that is a real finding about how much of the failure is method rather than arithmetic.
Say so either way.

This also keeps the page's cited claim alive without the numbers: process supervision does
better, and here is a floor on how much better, obtained with the crudest possible process
supervisor.

**Why this rung is third and not first.** It is the rung a reader expects, and it is the one
whose result we can least predict. Putting the page's answer to "what does step grading buy"
entirely on an accuracy delta that may be zero would leave the page with nothing to say in the
null case. Detection and localisation do not have that problem: they are properties of the
labels themselves and they hold whatever the selection accuracy turns out to be. So 3a and 3b
carry the page, and 3c is the honest attempt at the comparison the old chart borrowed.

### 3d. What has to be true about the data before any of the three counts

Reusing pages 6 to 8's generations is the right call and it is what makes this the cheapest
refactor of the four. It is also where this page can quietly go wrong, because a reused chain
arrives without the conditions it was generated under. Four things the notebook now measures or
records rather than assumes, each of which was found to be a real defect in the first draft.

**One configuration, named from page 7's manifest.** Covered above. The first draft pooled every
`config_id` in page 7's dump and took whichever record happened to sort first per problem, so the
graded chain's temperature was uncontrolled. Both the detection pass and the selector rung in 3c
now filter to the pile.

**The filter is a selection and its cost is measured.** A chain hits the cap because it was long,
and it was long because the problem was hard, so dropping cap-hitting chains preferentially drops
hard problems and the failures attached to them. Everything in 3a and 3b is conditional on
*chains the model ended itself*, which is a narrower and easier population than *all chains*. The
notebook prints the level mix and outcome accuracy of what survived against what was dropped, and
both land in `derived.json`. **The caption carries this**, in the shape of *on chains this model
finished on its own*. It is one clause and it is the difference between a rate and a rate about
something.

**Two sources means two decoding regimes, and the manifest names which one ran.** Page 7's pile
is *sampled* at the temperature page 7 chose. Chains the notebook generates for itself are
*greedy* and carry a step-per-line instruction page 7's chains never saw. The first draft
recorded this page's prompt suffix in the manifest either way, which asserted a prompt that most
of its chains were never shown. The manifest now records the source's real run id, config,
temperature, `top_p` and prompt.

**Where a step ends is a choice, and the numbers have to survive it.** Both graders judge *steps*,
so cutting finer gives the checker more chances to find a false claim and cutting coarser buries
one inside a step that also contains true claims. `harness.step_spans` runs a cascade, blank lines
then lines then sentences, so different chains in one run are cut by different rules. Section 8b
forces each rule on every chain and reports the spread. It is free, it runs without a GPU, and it
decides whether the page may quote a single figure or has to quote a range. **If detection moves
more than about five points across the four rules, the page reports the range.**

---

## On simulating the process grader

Raised as a last resort, and it should stay unused. Page 9's refactor exists because the page
reveals hand-written booleans and calls them a PRM's labels. Replacing that with a *simulated*
PRM is the same defect wearing a different hat, and it would be worse than leaving the page
alone, because the current version at least has no machinery implying rigour.

The experiment is within reach. What is at risk is not feasibility but **effect size**, and the
answer to a small effect is to report a small effect. If 3a comes back near zero and 3b has too
few flagged wrong traces to plot, the correct outcome is that page 9 ships items 1 and 2 from
the priority list, keeps its authored traces with an honest chip, and says plainly that a
deterministic checker could not find enough to draw. That is a worse page than the one specced
here. It is still a better page than one that simulates its evidence.

---

## On the process reward model, now that one is admitted

`Qwen2.5-Math-PRM-7B` is the checkpoint, and three things about that choice have to be stated
correctly, because an earlier draft of the notebook stated one of them backwards.

**Its lineage is not independent, and the notebook previously claimed it was.** The draft read
"the PRM is deliberately *not* from that family: a grader scoring another model's work has no
self-scoring bias to argue about." That is false. It is the same Qwen2.5 pretraining lineage as
`Qwen2.5-3B-Instruct`, on the math-specialised branch. So this pairing tests whether a **bigger,
specialised** checkpoint catches this one's errors, not whether an **unrelated** grader does, and
any error mode the two inherited together is invisible to it. Page 8's notebook already carries
exactly this limitation for its 7B judge and says so; page 9 says so too. If we ever want the
stronger claim, it needs a grader from another family, and that is a separate decision.

**Its competence gap is not a problem and is arguably the point.** The PRM is far better at
mathematics than the 3B whose work it grades. That is the right direction for a verifier: a
grader no stronger than the thing it grades is the useless case. This is worth writing down
because the gap is startling enough to *look* like a confound, and it is not one.

**Distribution shift is the actual risk, and it has a signature.** Its step labels were learned
on terse, LaTeX-dense rollouts from math-specialised models with steps delimited by blank lines.
This page feeds it chatty 3B-Instruct prose cut by whatever rule the cascade chose. The failure
that produces is not noise, it is **low specificity**: sound-but-verbose steps marked down for
being unlike the training distribution. That inflates the PRM's detection row precisely where the
page would most like a big number, which is the direction of failure we are least able to notice
by eye.

**So the PRM is gated on numbers fixed before the run:**

| bar | value | why this one |
|---|---|---|
| AUC vs the checker | ≥ 0.65 | threshold-free; asks only whether it *ranks* false below true |
| specificity on checker-true steps | ≥ 0.80 | the distribution-shift signature, and the one that would poison 3b |
| comparable steps | ≥ 30 | below this the reliability is too noisy to gate on |

Miss any of them and its labels are **stripped from `derived.json`**, not published with a
footnote. A suppressed PRM is a finding in its own right and worth one sentence on the page: an
off-the-shelf process reward model pointed at off-distribution prose is not free, which is a
concrete version of the thing this page is already arguing about how hard process supervision is.

**The threshold is fitted, and the reliability is an upper bound.** Two consequences the page
inherits. First, 0.5 is not a threshold, it is where a probability calibrated on someone else's
distribution happens to land on ours, so the operating point is chosen on the checker's labels
and recorded as fitted rather than as a property of the model. Second, and this is the deeper
one: **the checker only judges closed-form arithmetic, which is the subset of steps most like the
PRM's training data.** Everything measured about the PRM is therefore measured on its friendliest
ground and applied to the prose steps it is actually trusted with. Any PRM-derived sentence on the
page carries that, in the shape of *measured where we could check it, which is the easy part*.

---

## 4. Text / Captioning Balance

Prose changes are small, because the page's writing is already doing the right job.

- The two limits (there must be a fact to be right about; the step must be big enough to carry
  one) stay as written. They are the best prose on the page.
- The reveal's label changes from the PRM's verdict to the checker's, and gains one clause
  naming what the checker can and cannot see.
- One new sentence carrying the base rate, placed before the traces rather than after, so the
  reader meets the specimens already knowing they are representative of something. **It carries
  its conditioning clause in the same sentence**, in the shape of *on chains this model finished
  on its own*, because a rate without its population is the thing this refactor exists to stop.
  If section 8b found the number moves with the segmentation rule, the sentence carries a range.
- The `ormVerdict` and `prmVerdict` strings are per-trace prose and should shorten now that a
  reader can see the labels. Two sentences each is generous; the current ones run longer.
- **Chips:** an authored-example chip is no longer needed for curated traces, replaced by a
  provenance chip naming model, item set and date. Any hand-labelled method-error specimen
  keeps an explicit chip saying the label is ours. The provenance chip also names the
  **decoding and the source** of the chains, because these are page 7's samples rather than
  fresh greedy ones and the two are not interchangeable.
- **Who labelled each step** is named on the reveal itself, not only in the chip. If the PRM
  cleared its gate the reveal says checker plus PRM and the PRM's AUC appears once; if it did
  not, the reveal says checker only and the suppression gets its one sentence. There is no third
  state where a label appears without an owner, which is the state the current page is in.

---

## 5. Transition / Flow

**From page 8.** The bridge already exists and is free: every selector on page 8's ladder is an
outcome grader. The heuristic reads formatting, the logprob reads confidence, the judge reads
the answer, and not one of them reads whether step three followed from step two. Page 8 closes
by asking what the judge is actually reading; page 9 opens by answering that none of them read
the working, and then reads it.

**To page 10.** Page 10 is search through thoughts: branch, evaluate, prune, backtrack. Process
supervision is what makes that possible, because you cannot prune a branch you can only grade at
the end. A per-step signal is precisely the thing a search needs in order to abandon a path
early, and page 9 has just established both that such a signal exists and how partial it is.
That is a stronger handoff than the current one and it costs one sentence.

---

## Effort and priority

**This is the smallest of the four refactors and should be sequenced last.** No new inference
is required, the step checker is a modest piece of code sharing ch03's sympy machinery, and the
curation is a query. If time runs short, the ordering within the page is:

0. **Done, in the validity revision.** Restrict to page 7's pile, record the source's real
   decoding, measure what the natural-ending filter selected away, and gate the PRM. These are
   preconditions rather than deliverables: every number below is wrong or unattributable without
   them, so they are listed to be checked off rather than scheduled.
1. Fix the PRM attribution. Not optional; it is a correctness issue.
2. Run the checker over the dump and get the detection rate (3a), with section 8b's spread beside
   it. It is a query, it is free, and it decides the page's framing, so nothing else should be
   built before it is known.
3. Add the localisation measurement (3b). Same dump, same query, and it is what supports the
   page's second teaching case.
4. Curate the specimens.
5. Add the step-checking rung to page 8's ladder (3c).

Items 1 to 3 are worth doing even if 4 and 5 are dropped entirely. Item 2 gates the rest: if the
checker finds nothing, items 3 to 5 have nothing to work with and the page falls back to the
position described under "On simulating the process grader".

---

## Open questions for review

1. **Does the step-checking rung live on page 8's chart or page 9's?** It is page 9's argument
   but page 8's figure, and drawing page 8's ladder twice is the mistake we just avoided with
   page 7's figure 3. My recommendation: the ladder is drawn once on page 8 *without* the rung,
   and page 9 adds the rung to it, so the reader sees the same figure gain a line. That makes
   the two pages one continuous argument rather than two charts.
2. **Do we want a hand-labelled method-error specimen** (the cancel-the-sixes shape) alongside
   the checker-labelled ones? It is the more striking failure and the checker cannot find it.
   Including it means one trace on the page carries a human label.
3. **Keep the 16/64 problem at all?** It is memorable and it is the canonical case. If a curated
   real specimen is nearly as legible, the real one should win; if nothing real comes close, the
   authored one stays with an honest chip.
4. **If the detection rate is near zero, do we add an internal-consistency check?** A second
   deterministic rule: flag a step that *uses* a value contradicting one an earlier step
   established. It stays opinion-free and it reaches errors of bookkeeping that pure arithmetic
   checking misses, but it needs the trace's variable bindings tracked, which is a real piece of
   work rather than a small one. My recommendation: hold it in reserve, and only build it if 3a
   comes back empty.
5. **Do we want a process grader from outside the Qwen family?** The current pairing tests
   "a bigger, specialised checkpoint" rather than "an independent grader", and only the second
   supports the general claim that process supervision catches what outcome supervision misses.
   The cost is another set of weights and another reliability measurement, and the benefit is one
   sentence the page could otherwise not write. My recommendation: decide after seeing whether
   the current PRM clears its gate at all. If it does not, an independent grader is the next
   thing to try; if it does, the shared-lineage caveat is cheap to state and the page can ship
   with it.
6. **Does 3c need a deeper pile than page 7 currently has?** The selector rung needs problems
   with four or more natural-length candidates, and page 7's pile holds sixteen chains per
   problem before the filter. If the filter leaves too few problems qualifying, the honest
   options are to report the rung on the smaller set with its n stated, or to ask page 7 to
   extend its pile at the same `config_id`, which appends samples to the same distribution rather
   than starting a new experiment. Flagged here because it is page 7's decision, not this page's,
   and page 8 wants the same thing for its own reasons.
