# Page 15 — the instrument and its window: what a benchmark can still see

**Status:** spec only. Nothing run, nothing implemented. Section 3 is pre-registered
against §6's branches; no generation has been seen. Sections 1, 2 and 4 are revisions
of shipped copy and need no new measurement.

**Supersedes in part:** `docs/page_15_coordinates_revision.md` (2026-07-29). That
revision's diagnosis stands and its section 1 survives intact. What it did not have is
a thesis that binds its three sections into one idea, which is what this document adds.

## Why

Page 15 is not weak for lack of data. It is weak because its three sections are three
lessons that happen to share a subject. Section 1 teaches a checklist (four
coordinates), section 2 teaches a mechanism (the window), section 3 teaches a history
(the knob moved into the product). A reader finishes the page able to recite the
checklist and unable to say what a benchmark *is*.

Worse, the checklist is incomplete and the page knows it. Page 15 teaches four
coordinates, then a trailing paragraph concedes that a test can sit inside its window
and still be measuring familiarity, and points at page 17. So the page's own closing
move is to tell the reader the four-item list they just learned does not cover the
case that discounts every number in Acts 2 and 3. That is a page teaching an
incomplete instrument and admitting it in the last paragraph.

The refactor gives the page one idea with three consequences:

> A benchmark is a measuring instrument with a window. The window closes three ways:
> **floor** (nothing scores, no signal), **ceiling** (everything scores, no signal),
> and **familiarity** (it scores, but on recall rather than reasoning). And the token
> cost of staying inside the window rises with every rung of the ladder.

That last clause is what ties this page back to the deck's actual subject. Every page
from 5 to 14 is about buying accuracy with thinking. Page 15 currently spends those
scores without ever showing that the *price* of a benchmark rises with its difficulty.
It is the missing link between "here is how a score is made" and page 16's bill.

## Non-goals

- **No live inference.** Same boundary as every notebook page: the notebook writes
  logs, the page replays them.
- **The contamination caveat stays on page 17.** Decided by the author, 2026-08-09.
  Page 15 gains the *token* signature of familiarity; page 17 keeps the *accuracy*
  drop as one of its failure modes. §5 specifies the split so the two pages do not
  read as duplicates.
- **Not a contamination study.** We measure a token-cost difference between exams
  published before and after a model trained. We do not, and cannot, establish that any
  specific item was memorized. §7 fixes the language this constrains us to.
- **No renumbering, no act-seam change.** The 15|16 handoff survives and gets
  stronger: section 3 measures tokens, page 16 prices them.
- **Section 1 is kept as-is.** It works, it is the page's best interaction, and the
  three headline cases are already pinned. It gains one sentence, not a rebuild.
- **FrontierMath is not measured.** The set is private, Epoch runs it, and our model
  would score near zero, so its token counts would be entirely non-termination. It
  appears as a cited annotation in a visibly different register or not at all (§4.3).

---

## 1. The claim under revision

Current page:

- **A1** — a score is a point with four coordinates, not a property of a model.
- **A2** — a benchmark has a window; it is born at the floor and dies at the ceiling,
  so moving goalposts is the system working.
- **A3** — the thinking-budget knob is not new; it moved from the metric's name into
  the product.
- **A4** — trailing concession: familiarity is a fourth thing, see page 17.

Proposed page:

- **B1** — A1 survives unchanged. It is the entry and it earns its place.
- **B2** — A2 gains its third closer. The window shuts from below, from above, **and
  from behind**. The first two are on the capability axis; the third is not, which is
  why the simulation cannot show it and why section 3 has to measure it.
- **B3** — **new, measured:** the price of admission rises with the rung. Held at one
  model, one cap, one harness, thinking tokens per problem climb from MATH-500 to AIME.
  And on two exams of matched difficulty where only exposure differs, the unseen year
  costs more.
- **B4** — A3 survives, compressed, as the closer's historical half.
- **A4 is deleted as a concession and promoted to B3 as a measurement.** The page stops
  apologizing for its own checklist and shows the fourth thing instead.

The change in kind: A4 is the page conceding a limit. B3 is the page owning it. The
deck's recurring test is "what is the reader gaining over reading the literature
itself?" The accuracy drop on AIME 2025 is in the literature and cited on page 17. The
token cost of unfamiliarity is not a standard framing anywhere I know of, and it is a
strictly harder result to explain away: "scored worse" has a dozen innocent readings,
"had to think roughly twice as long to reach a worse answer on an equally hard exam"
has very few.

---

## 2. Section 1 — the coordinates game (kept)

No structural change. Three quote-true headline pairs, guess which coordinate moved,
reveal the receipts.

One edit, and it is load-bearing for the rest of the page. The "version of the test"
coordinate currently reads as a technicality about problem counts (the 180-problem
2024-11 FrontierMath set versus the 290-problem 2025-02 set). Section 3 turns that
coordinate into the whole familiarity argument, because AIME 2024 versus AIME 2025 is
*literally* a test-version move. Add one sentence to the section's closing prose
flagging that this coordinate has a second edge, and that section 3 puts a number on
it. Nothing else changes; no new cases, no re-pinning.

---

## 3. Section 2 — the window (kept, with the third closer named)

The simulation stays. This was settled by the author on 2026-07-30 on the standing
rule that an authored simulation is judged by whether a dataset could drive the
*interaction*, and no dataset lets a reader move a frontier continuously past a fixed
test. Its shape stays pinned in `benchmarkWindow.test.ts`.

Two changes, both copy:

1. The figure's readout currently offers two verdicts (floor, ceiling) plus the
   in-window state. It keeps exactly that. What changes is the framing sentence above
   it: the slider shows the **two closers that live on the capability axis**, and the
   reader is told up front there is a third that does not, rather than discovering it
   in a trailing box.
2. The trailing paragraph currently ends by pointing at page 17. It now points at
   section 3 of its own page. Page 17 keeps its own callout (§5).

The figure makes no claim about where any real benchmark sits today, and that property
is preserved. It is why the figure cannot expire, and it is worth protecting.

---

## 4. Section 3 — the price of the window (new, measured)

### 4.1 What the reader should walk away with

Two readings off one figure:

- **The ladder.** Harder rung, longer thinking. This is the intuitive claim and it is
  the one that connects to Acts 2 and 3: a benchmark does not just get harder to pass,
  it gets more expensive to attempt.
- **The control.** Three exams the model trained on and one it did not, all the same
  competition, all calibrated to the same difficulty. If the unseen year costs more,
  that difference cannot be difficulty. It is what recall was saving the model.

### 4.2 The figure

One figure, not two. **Survival curves**: the fraction of attempts still generating at
token *n*, one curve per benchmark, *n* on the x-axis to the shared cap.

Chosen over a box-and-band ladder of per-benchmark token ranges for three reasons:

- **Censoring is the central measurement problem here, and this form is built for it.**
  Attempts that hit the cap are right-censored. A mean or a range silently mixes "the
  model thought this long" with "the harness stopped it," and the number moves when you
  change a flag. A survival curve shows the censoring as the curve hitting the right
  edge with mass remaining, which is honest and legible.
- **It refuses to print a benchmark-level scalar.** "AIME 2024 = 8k to 16k tokens" is
  exactly the coordinate-free number this page spends section 1 teaching readers to
  distrust. Tokens per problem is a function of model, cap and effort setting, not a
  property of a benchmark. A curve reads as a distribution under stated conditions; a
  printed range reads as a fact about the exam.
- **The band-versus-outlier form is the abstraction, not decoration.** AIME 2022, 2023
  and 2024 render as one shaded band (the normal year-to-year spread), AIME 2025 as a
  single lit curve. The claim is visual: either 2025 sits inside the band or it does
  not. That is the deck's preferred grammar (shaded ownership bands, bold only where
  the claim lives) rather than four lines with dots.

Layout: full card width, per the standing rule that the page's central figure is never
half-width. Citations sit beside the figure, not only in the prose.

### 4.3 FrontierMath

Cannot be measured by us and should not pretend to be. Two options, in order of
preference:

1. **A right-edge annotation** in a visibly different register (dashed, unfilled,
   labeled as Epoch-reported and not ours), marking that the ladder continues past
   where our instrument can follow. Earns its place only if a defensible published
   token figure exists; §7 lists this as unverified.
2. **Cut it.** The ladder works with MATH-500 and AIME. FrontierMath is already
   section 1's best case study and does not need a second appearance.

Default to (2) unless verification turns up a citable number. A dashed marker with no
source behind it is the "abstraction the reader cannot verify" the author has cut
before.

### 4.4 The run

Per the notebook-first pipeline: spec, then `notebooks/page_15_benchmark_window.ipynb`,
then hardware-agnostic cleanup, then approval, then translation to JS. The page replays
committed logs and runs no inference.

**Model.** `DeepSeek-R1-Distill-Qwen-7B` primary, `-14B` as a second level if the run
budget allows. Not the Act 2 instrument: page 15 is Act 3 and is not bound by it, and
Qwen3-4B in thinking mode would score too low on AIME for non-degenerate statistics.
The distills are the right choice for a reason beyond native long CoT: their exposure is
**traceable**. The SFT recipe is public (R1-generated traces, heavily competition-math
flavored) and the release date is known, so "published after this model trained" is a
checkable statement about AIME 2025 rather than a guess about an opaque pretraining
mix. Page 14 already puts the distill family in the deck's vocabulary.

**Sets.**

| set | problems | why |
| --- | --- | --- |
| MATH-500 | 500 | the low rung; ties to Act 2's instrument |
| AIME 2022, 2023, 2024 | 30 each, 90 total | the baseline band: exams published before the model trained |
| AIME 2025 | 30 | the test: published February 2025, after R1's January 2025 release |

**Sampling.** k = 8 per problem on the AIME sets (30 problems is thin and per-problem
token variance is large), k = 4 on MATH-500. Roughly 2,960 generations. Runtime is
unestimated here on purpose; the notebook reports it.

**Fixed across every run, no exceptions.** One cap (32,768 tokens), one prompt template,
one sampling temperature, one grader. If the cap differs between benchmarks the
comparison is meaningless, and this is the single failure that would silently invalidate
the whole section.

**Logged per generation.** Thinking tokens (to the closing think delimiter), total
tokens, terminated-or-capped, correctness. Per the pipeline's standing requirement,
traces are logged with token-level segmentation.

**Unit of analysis is the problem, not the generation.** k samples of one problem are
not 8 independent observations. Aggregate within problem first, then across problems.

### 4.5 Reported alongside the figure, not buried

- The cap, stated on the figure itself.
- Truncation rate per benchmark. If a third of AIME 2025 attempts hit the cap, the
  reader needs that in view, not in a footnote.
- Accuracy per set, because "spent more and scored worse" is the claim, and half of it
  is an accuracy claim.

---

## 5. The split with page 17

Both pages will discuss AIME 2025. They must not read as the same paragraph twice.

- **Page 17 keeps** the published accuracy drop, as a caveat about when reasoning
  breaks down, in its step-4 balance. Unchanged. Its citation (Balachandran et al.)
  stays there.
- **Page 15 owns** the token signature and the window framing: familiarity as a third
  way an instrument goes blind, measured on our own run.
- **The one-way pointer.** Page 15 does not forward-reference page 17 for this
  (deleting the current trailing pointer is part of §3). Page 17's callout may
  back-reference page 15's measurement in a clause. Back-references are cheap;
  forward-promises are the thing the deck has been burned by before.

The author's judgment on 2026-08-09 was that the caveat fits page 17 imperfectly but
stays. This split is what makes that survivable: 17 keeps a failure mode, 15 gains an
instrument property, and the shared exam is the only overlap.

---

## 6. Pre-registered branches

Written before the run so the page cannot be reverse-engineered from a result.

- **Branch A — 2025 lies outside the 2022 to 2024 band.** The familiarity claim is
  measured. Section 3 leads with the control and the ladder is the supporting read.
  This is the version of the page that justifies the run.
- **Branch B — 2025 lies inside the band.** Familiarity has no token signature at this
  model scale. Section 3 keeps the ladder only, and the page states the null in the
  open: we looked for the price of unfamiliarity and did not find it at 7B. The
  contamination caveat then rests entirely on page 17's cited accuracy drop, and page
  15's third closer is stated as a mechanism rather than a measurement.
- **Branch C — the 2022 to 2024 band is so wide nothing could fall outside it.** The
  experiment cannot decide at n = 30 per year. Say so, drop the control, keep the
  ladder, and do not dress an undecidable result as a null.

Branch B and C are not failures. They cost one run and they are honest page copy. What
would be a failure is running first, finding a gap, and building the section around it
without having said in advance what would have counted as no gap.

---

## 7. Risks and the language they force

1. **Thirty problems per year.** The hard limit of the design. Three baseline years
   exist to absorb year-to-year difficulty variation, and three may not be enough to
   characterize it. Branch C is the honest exit.
2. **Year difficulty is not identical, only calibrated.** This is the confound the band
   is built to absorb, and it is the reason a two-year comparison (2024 versus 2025
   alone) was rejected: with one pair, a token gap and a harder exam are the same
   observation.
3. **Exposure is inferred from a recipe, not verified per item.** The distill's SFT
   data is not public at item level. The page says **"published before this model
   trained"** and never "the model memorized this." No claim about any specific
   problem.
4. **Cap censoring.** Handled by the figure's form (§4.2) and reported as a rate
   (§4.5), not solved.
5. **Non-termination is difficulty, not a separate confound.** Noted because an earlier
   draft of this argument tried to split "genuinely thinking longer" from "flailing and
   never stopping" and that split does not survive scrutiny: failure to converge is a
   symptom of a problem being too hard. The measurement issue that does survive is the
   cap, above, which is why it is the one being managed.
6. **Our own instrument inherits the caveat.** MATH-500's problems date to 2021 (the
   500-item subset was drawn later, in the process-supervision work), which puts them
   well inside every current model's training data, including for most of Act 2. The
   page states this in the open rather than letting a reader find it. A deck that
   spends a page on contamination and quietly exempts its own runs has a credibility
   problem larger than the one it is describing.
7. **The published token ranges that started this are unverified.** The 1k-4k / 8k-16k
   / 15k-32k / 30k-100k figures that motivated the section are plausible in shape and
   are not sourced. Nothing derived from them reaches the page; the page prints our
   run or it prints nothing. Any published figure used for the FrontierMath annotation
   (§4.3) needs a primary source before it renders.

---

## 8. Section 4 — put the coordinates back (kept, compressed)

The Minerva contrast survives: in 2022 the budget travelled inside the metric's name
(`maj1@64 = 50.3` with `pass@1 = 33.6` in the same table), and reasoning models moved it
into the product where the metric's name stopped carrying it. It is the page's
historical depth and it is cheap.

Compression is needed because the page gains a section. Two cards become the same two
cards with tighter copy, and the closing checklist absorbs the third closer:

> which model variant, which version of the test, whose harness, how much thinking,
> and whether the test was published before the model trained.

Then the existing handoff, which gets better rather than changing: of those five, one
has a meter running, and section 3 just showed the meter climbing. Page 16 reads it.

---

## 9. Order of work

1. This spec approved.
2. Sections 1, 2 and 4 revised and shipped. They need no measurement, they are most of
   the page's improvement, and they establish what the token figure has to show.
3. Verification pass for §4.3 (any citable FrontierMath token figure) and §7 item 6
   (MATH-500 subset provenance, stated precisely).
4. Notebook built and run. Branch declared from §6.
5. Section 3 written to the branch, translated to JS, cross-language test asserting the
   JS aggregates match the notebook's `derived.json`.

Step 2 is deliberately ahead of step 4. The page's thesis does not depend on the run;
only one of its four sections does. If the run never happens, steps 1 through 3 still
leave page 15 materially better than it is today.
