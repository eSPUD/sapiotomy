# Page 9 — "Outcome vs Process Supervision" assessment and partial refactor

**Status:** spec only. Nothing here is implemented. Consumes pages 6 to 8's dumps.

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

**The one number the page is missing.** The page asserts that outcome grading rewards nonsense
that happens to land right. It never says how often. Pages 6 to 8's dumps contain thousands of
correct-answer traces, so:

> On **N%** of the problems this model answered correctly, at least one step of the reasoning
> that got there was false.

Every one of those is a case an outcome grader signs off on and rewards. That sentence turns
the page's premise from a plausible story into a measured rate, and it costs no inference.

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

## 3. Replacing the chart

The current chart redraws published MATH best-of-N numbers for majority, ORM and PRM. It has to
go on the constraints alone, and the replacement is already built.

**Add a sixth rung to page 8's ladder: a step-checking selector.** Among the N candidates, drop
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

---

## 4. Text / Captioning Balance

Prose changes are small, because the page's writing is already doing the right job.

- The two limits (there must be a fact to be right about; the step must be big enough to carry
  one) stay as written. They are the best prose on the page.
- The reveal's label changes from the PRM's verdict to the checker's, and gains one clause
  naming what the checker can and cannot see.
- One new sentence carrying the base rate, placed before the traces rather than after, so the
  reader meets the specimens already knowing they are representative of something.
- The `ormVerdict` and `prmVerdict` strings are per-trace prose and should shorten now that a
  reader can see the labels. Two sentences each is generous; the current ones run longer.
- **Chips:** an authored-example chip is no longer needed for curated traces, replaced by a
  provenance chip naming model, item set and date. Any hand-labelled method-error specimen
  keeps an explicit chip saying the label is ours.

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

1. Fix the PRM attribution. Not optional; it is a correctness issue.
2. Add the base rate. One number, large payoff, near-zero cost.
3. Curate the specimens.
4. Replace the chart with the step-checking rung.

Items 1 and 2 are worth doing even if 3 and 4 are dropped entirely.

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
