# Page 15 rework for VISxAI submission — no GPU, ~9 hours

**Written:** 2026-08-09, Sunday night. **Deadline:** Tuesday 05:00.
**Constraint:** no new generation. Everything below uses data already committed to the repo.
**Relationship to `page_15_window_refactor.md`:** that spec's thesis survives intact. Its
section 3 (the AIME familiarity run, 3 to 5 days of GPU) is cut and replaced by §3 here,
which uses a measurement the deck already made. The spec stays as the post-deadline roadmap.

---

## 1. The headline finding

The token ladder does not need a run. It is sitting in `web/data/page-11-derived.json`,
paid for by page 11's arm A, and no page draws it.

Same family, same cap (2048), same grader, same seed, greedy throughout. The only thing
that changes between the two columns is **which problems were asked**:

| model | easy band acc | easy tokens | hard band acc | hard tokens | token ratio |
| --- | ---: | ---: | ---: | ---: | ---: |
| Qwen2.5-1.5B | 0.56 | 223.6 | 0.22 | 567.3 | **2.54x** |
| Qwen2.5-3B | 0.74 | 302.3 | 0.43 | 693.2 | **2.29x** |
| Qwen2.5-7B | 0.88 | 323.2 | 0.60 | 656.3 | **2.03x** |

Easy band = MATH-500 levels 1 to 3, n = 50 (`arms.easy`, run by page 11).
Hard band = MATH-500 levels 4 to 5, n = 100 (`family.greedy`, sourced from page 6).

Every model moves the same way: **roughly twice the tokens, roughly thirty points less
accuracy.** Spend more, get less. That is the price of a harder rung, measured on the
deck's own instrument, and it is the missing link between Act 2's levers and page 16's bill.

## 2. Why this is a better figure than the benchmark ladder we specced

The original idea was MATH-500 to AIME 2024 to AIME 2025 to FrontierMath, with a token
band per rung. Beyond costing three to five days of GPU we do not have, that comparison
**violates page 15's own thesis.**

Section 1 of this page spends its entire length teaching that you cannot compare a number
across reports because the prompt, the harness, the answer extraction and the sampling
defaults all move at once. A cross-benchmark token ladder moves exactly those things:
different prompt template, different grader, different answer format, different item
count. The page would teach a rule in section 1 and break it in section 3.

The band comparison changes **one** coordinate. Same model, same cap, same prompt, same
grader, same run family, same date. Only the items differ. It is the controlled version
of the reader's intuition, and it is the version this page is allowed to make.

That argument should appear on the page, not just in this document. It is the strongest
sentence available: *we wanted to show you the ladder across benchmarks, and our own
section 1 forbids it, so here is the honest version.*

## 3. The revised page

Thesis, unchanged from the refactor spec:

> A benchmark is an instrument with a window. It closes three ways: **floor** (nothing
> scores), **ceiling** (everything scores), and **familiarity** (it scores, but on recall).
> And keeping it open costs more every time.

### Section 1 — the coordinates game (kept, +1 sentence)

No structural change, no re-pinning. Add one sentence to the closing prose noting the
"version of the test" coordinate has a second edge: a test version published after a model
trained is a different instrument, not just a different problem count. This is what makes
section 2's third closer land rather than arrive from nowhere.

### Section 2 — the window (kept, copy reframe only)

The simulation stays exactly as it is, including its test pins. Two copy changes:

1. The framing sentence above the slider says the slider shows the two closers that live
   on the capability axis, and names the third that does not. The reader is told the shape
   of the lesson before the interaction rather than after it.
2. The trailing paragraph stops pointing at page 17 and points at section 3 of its own
   page. Page 17 keeps its contamination callout untouched (author's decision, 2026-08-09);
   §6 below fixes the split.

### Section 3 — NEW: what the window costs (measured, no GPU)

**Figure.** Full card width. x = mean tokens per problem, y = accuracy. One **arrow per
model**, tail at its easy-band point, head at its hard-band point. Three arrows, all
pointing down and to the right, near-parallel.

The geometry *is* the claim: right means more expensive, down means less accurate, and
every model does the same thing. This is the "arrows showing movement" grammar the deck
prefers over lines-with-dots, and one glance carries the whole lesson.

**Copy beneath it.** The ratio stated plainly (about twice the tokens for about thirty
points less accuracy, on every model in the family), then the extrapolation the figure
licenses: this is two rungs of one benchmark. A benchmark ladder is the same move
repeated, which is why the frontier tests cost what they cost, and why the meter on page
16 runs faster every year.

**Provenance line beside the figure.** Same family, same cap of 2048 tokens, same grader,
greedy throughout; the easy band is 50 items at levels 1 to 3 and the hard band is 100
items at levels 4 to 5. Page 11 priced these runs in FLOPs; this is the raw token count
underneath that price.

### Section 4 — put the coordinates back (kept, compressed)

Minerva contrast survives as-is. The closing checklist gains its fifth item:

> which model variant, which version of the test, whose harness, how much thinking, and
> whether the test was published before the model trained.

Handoff to page 16 unchanged in structure and stronger in content: of those five, one has
a meter running, and section 3 just showed the meter climbing with difficulty.

## 4. The de-duplication problem with page 11, and the fix

Page 11 already ships this run and already has a hard/easy band toggle
(`Page11.tsx:782`). The deck's standing rule is not to re-print an earlier page's content.

Three things keep section 3 legitimately new:

1. **Different axis.** Page 11 plots accuracy against inference **FLOPs** to test whether a
   small thinker crosses a big model. Section 3 plots accuracy against **raw tokens** to
   price difficulty. FLOPs is a derived currency; tokens is what the meter reads.
2. **Different comparison.** Page 11's bands are a **toggle**, a robustness check: you see
   one band at a time and ask whether the crossing survives. Section 3 shows **both at
   once**, because the difference between them is the entire subject.
3. **Different quantity.** The easy-to-hard token ratio is not drawn, stated, or derivable
   by eye anywhere in the deck today.

**Mitigation to write into the page:** the provenance line names page 11 as the source run
rather than presenting this as fresh measurement, and the figure's axis label says raw
tokens explicitly. Annotations map back to the earlier page; the artifact is new.

**Risk to accept:** the two charts will look related, because the deck has one chart
grammar by design. This is a family resemblance, not a duplicate, but it is the thing most
likely to draw a reviewer's "haven't I seen this?" and it is worth a second opinion during
visual QA.

## 5. Limitations to state on the page

1. **The two bands come from two runs.** The hard band is page 6's run; the easy band was
   generated fresh by page 11. Both are bfloat16, cap 2048, same grader, same family, and
   both run_ids record it, but they are not one execution. Say so.
2. **Unequal n.** 50 easy items against 100 hard items. Say so.
3. **The specialist has no hard-band number.** `Qwen2.5-Math-1.5B-Instruct` appears in
   `arms.easy` (0.80 accuracy, 388.5 tokens) with no hard-band counterpart. **Exclude it
   from the figure**; three arrows with no holes beats four with a gap.
4. **Two rungs is not a ladder.** The page extrapolates from two difficulty bands to the
   benchmark ladder and must mark that as extrapolation, not measurement. The honest
   sentence: we measured one step and the frontier is many steps of the same kind.
5. **MATH-500's problems date to 2021,** which puts them inside every current model's
   training data, including for most of Act 2. Given that section 2 now teaches
   familiarity as a closer, the page states this about its own instrument rather than
   letting a reader notice it. A page that teaches contamination and exempts its own runs
   has a worse problem than the one it describes.

## 6. Split with page 17

Unchanged from the refactor spec. Page 17 keeps the published AIME 2025 accuracy drop as
one of its failure modes, with its citation. Page 15 owns familiarity as an instrument
property and never forward-references page 17 for it. Back-references from 17 to 15 are
fine; forward-promises are what the deck has been burned by before.

## 7. Time budget and cut order

| step | est. |
| --- | --- |
| This report approved | 0.5h |
| Section 3 data plumbing: derive the six points into a lib module, unit test the ratios | 1.5h |
| Section 3 component and figure | 2.5h |
| Sections 1, 2, 4 copy revisions | 1.5h |
| Test updates: pinned strings, emdash ban, fidelity assertions | 1.0h |
| Visual QA, Playwright screenshots per the standing rule | 1.0h |
| Buffer | 1.0h |
| **Total** | **~9h** |

**This does not include deployment.** The Vercel URL is still blank in `SUBMISSION.md` and
remains the hard blocker for the submission existing at all. Budget it separately and do it
first, not last.

**Cut order if time runs short**, most expendable first:

1. The figure degrades to a three-row table with the ratio column. Ugly, still true, still
   the finding. Saves ~2h.
2. Section 4's compression is skipped; leave it as it ships today. Saves ~0.5h.
3. Section 3 is dropped entirely and sections 1, 2 and 4's copy reframe ships alone. This
   is the floor, it is still a materially better page than today's, and it costs ~2.5h
   total.

Do **not** cut the section 2 reframe to save time. It is the cheapest change on the list
and it is the one that turns three loosely related lessons into one page.
