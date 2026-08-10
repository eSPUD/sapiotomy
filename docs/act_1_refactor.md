# Act 1 refactor — deferred findings

Opened 2026-08-09 from `docs/review/pages_1_through_14_analysis.md`. These findings were
**deliberately deferred** out of the forward-plan fix queue for a design conversation, not
because they are wrong. Every one is marked CONFIRMED in the analysis and most were
re-checked by the verifier directly.

Nothing in this document has been actioned. The pages are as shipped.

**Scope note.** F1 is a page-12 finding, filed here by author direction rather than by
subject. It is the one item in this document that sits outside Act 1; see §0.

---

## 0. F1 · page 12 · blocking · the act opens with no interaction and never answers its own lede

`Page12.tsx:436` asks, in bold: *"What happens when you take the answer key away?"* The page
never answers it, because the control that would is switched off.

- `StarLoop` implements the full key-off state already (`Page12.tsx:275-289`).
- The page hard-wires `<StarLoop filter />` (`Page12.tsx:458`).
- `Page12.test.tsx:33-39` **pins the absence** of any toggle.
- Grep of the whole file for `onClick`, `onChange`, `type="range"`, `recordInteraction`:
  zero hits. The only motion is an unprompted `requestAnimationFrame` loop (`:213-269`).

The second half of the page's assigned concept, *"for exactly as long as an external check
filters what it studies"* (`pages.ts:61`), is exactly what the dead control demonstrates.
`SUBMISSION.md:28` and `:34` both claim the page is interactive.

**Cost of the narrow fix:** pass the prop, relax the test, write the copy that reads the
key-off state. Roughly an hour. **Recommended for the fix queue rather than this document.**

**The deeper item, which does belong here:** F90. `notebooks/page_12_gate_specialist.ipynb`
states its gate *"exists to be answered before `docs/page_12_refactor.md` is written"*;
`RUN_MODE` defaults to `"PLAN"` and there is no `data/page-12-derived.json`. Page 12 is the
only Act-2/3 boundary page whose content was decided without its own measurement, which is
why F1 has nothing to be interactive *about*. Restoring the toggle is a repair; giving page
12 a measured spine is the refactor.

Related, not yet filed anywhere: **F106** — the page-5 measured callback page 12 was specced
to open on (`docs/page_12_citations_reorder.md:229-247`) was never built, and `Page12.tsx`
contains no reference to page 5.

---

## 1. F5 + F25 · pages 2-3 · the Act 1 → Act 2 pivot rests on a dichotomy page 2 already broke

**The analysis calls this the deck's most important structural finding.** It is the reason
Act 1 is in a refactor document at all.

The pivot sentence is page 3's close: *"which leaves **only** what it does after it"*
(`Page3.tsx:561-566`), following its open, *"the obvious way to supply it is to train the
model again"*. The word **only** is false, and page 2's own figure is what falsifies it:

- `System2Comic.tsx:87-122` draws "memory ✗ / source ✓" and a **fetched document**.
- Panel 4 counts 2010, 2023 **and 2026** as an accomplished "Three."
- The trace's step 3 reads *"check a current source before committing"* (`authored.ts:214-217`).

Grep of all of `web/src`: `retriev`, `web search` and `look it up` appear **nowhere** in
rendered copy. The single hit is a non-rendered `constraintLabel` string (`authored.ts:126`).

Compounding it (this is the F25 half): page 2's prose correctly says thinking cannot conjure
a missing fact (`Page2.tsx:283-290`) while the figure beside it shows the gap being closed,
and the figure is what a reader remembers.

Consequence stated in the analysis: *the spine's THEREFORE is not earned by Act 1's own
evidence, because no lever in Act 2 gets Spain's count right and no page says so.*

**Two fixes, separable.**

1. **Cheap, ~20 min, available on request.** One clause on page 3 naming retrieval and
   saying why it is out of scope. Removes the refutable "only" without touching the comic.
   This was recommended for the fix queue and is currently **not** being done.
2. **The refactor.** Make the comic stop closing the gap the prose says thinking cannot
   close. Panel 3 currently succeeds at the thing the page is about to argue is impossible.
   Options: have the fetch fail or be withheld; move the fetch to a named "the other road"
   panel that Act 2 explicitly declines to take; or split the comic so System 2's win is
   arithmetic, not lookup.

---

## 2. Page 2

### F23 · major · a nine-year slider with two reachable outputs

`CUTOFF_MIN` = Jan 2017, `CUTOFF_MAX` = Dec 2026 (`Page2.tsx:51-52`), so ~120 handle
positions. `DEFAULT_READING_FINALS` supplies only the men's finals (2010, 2026), and 2010
precedes the range, so `known` is **1 everywhere before Jul 2026 and 2 after**.
`SPAIN_MACHINE_REPLIES[0]` is unreachable.

A reader drags across nine years of track and sees the reply, the badge and the gap count
frozen, concluding either that the control is broken or that training date is not what
drives the answer, which is the opposite of the page's thesis.

Fix is a redesign, not a correction: either give the range more reachable states, or shorten
the track to the transition it actually has.

### F24 · major · the model's replies are authored and unlabelled

`Page2.tsx:116-132` renders a card headed *"the model answers"*. `authored.ts:109-113` states
these are *"an authored EXAMPLE of the ideal System-1 blurt"*. The provenance labels that
exist for exactly this purpose (`machine.label` = "a small open model", `cutoffLabel`,
`constraintLabel`) are referenced **nowhere** in `Page2.tsx` (verified by grep).

There is no model; it is a three-element string array. Pages 3 and 4 both carry their
derived/authored labels, so page 2 is the outlier. The strings already exist and render
nowhere, so the fix is small; it is here only because it travels with F5 and F23.

### F42 · related · the bias half has zero interaction

`DEFAULT_READING_FINALS` contains only men's finals, so no slider position ever displays the
women's record, and `pages.ts` names the bias as half of page 2's concept. Same root cause as
F23; fix them together.

---

## 3. Page 3

### F20 · major · half the assigned concept gets one paragraph and no figure

`Page3.tsx:558-570` is the **entire** treatment of *"none of it touches the bias"*, against
two charts, two sliders, four sub-heads and a meter for the other half.

`pages.ts:52` names it a co-equal half of the page. A reader arriving with page 2's question
(*"Are knowledge biases addressable by System 2 thinking?"*) gets assertion with nothing to
manipulate and no evidence. It is the one place in Act 1 where a claim is purely told.

Rated **L**. Needs a figure or a control, which means it needs a source or a run.

### F21 · major · the frontier legend names a $191M model for a curve starting at $78M

`Page3.tsx:300-303` labels the secondary series *"e.g. Gemini Ultra at $191M"*;
`frontierCumulativeUSDM` (`dailyTraining.ts:24-28`) starts from `RUN_COST_USDM` = 78.

Checkable by a reader at month 0: the two curves coincide, and the legend names a model
costing 2.4x more. Either relabel or reprice; the choice affects §F22 below, so decide both
at once.

### F22 · major · wall (d) argues about a different plan than walls (a)-(c)

`Page3.tsx:406-417` argues from Chinchilla that a **bigger** model only pays off if it also
**reads more**, therefore the ~300T stock is the ceiling. But closing a knowledge gap needs
no bigger model, and the page itself prices the retrain-the-same-model arm at a flat $78M.

A reader following section 1 as a list concludes *"we can't retrain daily because we will run
out of text."* That is wrong: (d) is a wall against continued capability scaling, not against
refreshing facts, and the page never supplies the missing premise.

Fix: separate the two arguments, or supply the premise that joins them.

---

## 4. Page 4

### F27 · major · the step counter inverts the page's own conclusion

`maxStepOf` (`Page4.tsx:69-73`) gives standard 4, lines 6, vedic 6, rendered as "step N of M"
at `:496-498`, while `authored.ts` calls standard *"slow: every digit pair gets touched"* and
Vedic *"the fastest road"*.

The asymmetry is presentational: `StandardPanel` hides digit-level work behind three finished
partial products; `VedicPanel` exposes every cross-product and carry.

A reader who does exactly what the lede instructs (*"walk it to the end, then try another and
compare what they cost"*) reads 4 of 4 for standard and 6 of 6 for Vedic and concludes the
school algorithm is the cheapest road. **This is the only quantitative comparison the page
offers, and it points the wrong way.**

### F28 · major · "three roads, three tolls" never shows a toll

Step 2 (`Page4.tsx:518-551`) renders three cards of name, origin and a prose limit. No count,
no time, no operation tally, no chart, under a heading whose sub-label is *"what each method
is good at, and what it costs"* and above a callout saying *"each road pays its own toll"*.

The data exists and none of it is surfaced: 3 partial products vs 5 diagonals vs 5 columns
with stacked carries. Fix F27 and F28 together; one honest operation tally discharges both.

### F29 · major · page 4's convergence premise is the one Act 2 inverts

`Page4.tsx:545-549` bolds *"Three journeys, one destination"* and stipulates *"Reasoning is
inherently diverse pathfinding from prior knowledge"*. Pages 7 and 8 are built on different
attempts reaching **different** answers.

A reader who internalises page 4 arrives at page 7 expecting sampled paths to converge, and
page 7's premise reads as a contradiction of Act 1 rather than a development of it. The real
distinction (deterministic human algorithms vs stochastic samples from one model) is drawn
nowhere in Act 1.

The cause is on page 4; the collision surfaces at the 6|7 seam. One clause distinguishing
*"different methods, same answer"* from *"different attempts, different answers"* discharges
it.

---

## 5. Page 1

### F26 · major · the System 2 stopwatch measures click latency, beside a hard-coded "instant"

`Page1.tsx:170-172` renders a live `role="timer"` from `s2Ms`, started on the first "Work it
out" press and stopped on the last "Next step" press (`:70-84`). `Page1.tsx:124-126` puts the
**literal string** "instant" in the visually identical chip on the System 1 panel.

A reader who clicks fast reads "0.4 s" beside "instant" and concludes System 2 is barely
slower; a reader who dawdles reads "12.0 s" and concludes the page measured their thinking.
Neither is true. They never computed 17 x 24, and the two chips are not commensurable
quantities in the same slot.

### F34 · minor, travels with F26 · the concept's causal variable is enacted but never named

`pages.ts:50` assigns *"the size of the problem sets the thinking time"*. The page **does**
enact it (3 x 4 in one step against 17 x 24 in three), but the word "size" and any size→time
relation appear nowhere in copy, and step 3 (`Page1.tsx:216-221`) frames the lesson entirely
as recognize-vs-build.

Asked afterwards *"what sets how long you think?"*, a reader answers *"whether you recognize
it"*, not *"how big the problem is"*. That variable is what page 6's token budget and page
11's difficulty bands both spend, and it is never introduced by name.

---

## Explicitly excluded from this document

Per author direction, the **minor** findings on pages 1-4 are not being fixed and are not
tracked here: F35, F36, F37, F38, F39, F40, F41, F43, F44, F45, F46, F47, F48, F49, F50, F51.
They remain in `docs/review/pages_1_through_14_analysis.md` if that decision is revisited.
F34 and F42 appear above only because they share a root cause with an item that is tracked.

## Sequencing note

F21 and F22 are both page-3 section-1 items and should be decided together. F27 and F28 are
one fix. F23, F24 and F42 are one fix. F5's cheap half is independent of everything else here
and can be taken at any time.
