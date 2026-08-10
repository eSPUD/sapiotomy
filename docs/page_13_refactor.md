# Page 13 refactor — from announcement transcription to abstraction

Plan for the page 13 revision. The page's scaffold (grid, margin refs, numbered
sections, footer, PageNav) already matches house style; the break is
pedagogical. Pages 1–3, 11, and 12 teach by a mechanism the reader manipulates,
with cited numbers used only as pinned anchors. Page 13's sections 2–4 are a
static transcription of OpenAI's announcement — a scoreboard, a chronology, a
diagram that doesn't parse. This doc reframes every section around one job and
maps each identified issue to a fix.

## The page's one job

> Page 12's loop, run at scale as general-purpose RL with the human removed,
> is a **new training axis** — one that compounds with test-time thinking and
> escapes page 3's data wall. The price of the commercial version: the chain
> that does the work is hidden.

The reader should leave with three things the literature never states in one
place:

1. **The loop-diff intuition** — o1-class training is page 12's loop with the
   disguise dropped (filter → explicit reward, fine-tune → RL update, human
   labels → model-written chains scored by an answer key).
2. **The unified two-knob law** — page 11 said "model size picks your curve;
   test-time compute slides you along it." Here RL-on-reasoning replaces model
   size as the curve-picker. Same chart grammar, cheaper knob, and its
   training data is model-generated — the one input page 3 proved pretraining
   would run out of.
3. **The visibility boundary** — what crosses the lab/user line and what
   doesn't (kept from the current page, with the diagram fixed).

## New section structure

### 1. "The human leaves the loop" (replaces current section 1's framing; solves Issue 1, Primary)

An abstraction, not a history. Render page 12's ten-line pseudocode again and
let the reader **toggle it into the reasoner recipe** — a diff view where the
changed lines highlight:

| page 12's loop | the reasoner recipe |
|---|---|
| `if ŷ = y: keep` (filter) | `reward = check(ŷ, y)` (explicit RL signal) |
| `M ← finetune(M₀, kept)` | `M ← RL-update(M, reward)` (compounds, no restart) |
| one greedy rollout | sample many chains per problem |
| humans label preferences (RLHF) | **no human in the loop** — the answer key is the only judge |

Honesty labels, house-style, in the h3 annotation and copy:

- **Confirmed** (citable): o1 is trained with large-scale RL to reason in a
  long chain of thought (OpenAI, *Learning to Reason with LLMs*); "large
  reasoning models (LRMs): language models trained via reinforcement learning
  to 'reason' and 'think through' extended chains of thought" (El-Kishky et
  al. 2025) — the RL-trained-reasoner shape is on the record from OpenAI's own
  authors.
- **Inferred/rumored** (say so out loud, as the page already does for the
  unlabeled axes): o1's specific recipe is closed; the STaR-shaped
  reconstruction is the community's, matched to page 12's expert-iteration
  lineage, not a published algorithm.

Tie back explicitly to page 3: the loop's training set is model-written, so
the "data runs out" wall (≈300T token stock) does not price this axis — the
model writes its own curriculum and the answer key grades it for free.

### 2. "One law, two knobs" (keep the lab; re-copy it; solves Issue 2)

The interactive is already the best thing on the page — keep the sliders, the
translated-curve mechanic, the missing-RL delta, the unlabeled-axis fidelity
note. Rewrite the surrounding copy so the lab lands as a continuation, not a
report:

- Open by invoking page 11's idiom by name: *"Page 11's law: model size picks
  your curve; test-time compute slides you along it. o1's chart is the same
  picture with the curve-picker swapped — **RL training picks your curve
  now.**"*
- Name the compounding claim the user wants: thinking alone climbs the curve;
  training alone lifts it; together they multiply — that is what the two
  sliders demonstrate, so say it above them.
- One sentence to page 3: buying a new curve used to mean a pretraining run
  (the bill compounds, ×2.4/yr); RL-on-reasoning buys curve-lifts from data
  that costs sampling compute, not the world's text supply.

### 3. "The toolbox becomes a second storey" + generalization (solves Issues 3, 4, 6, 7)

- **Keep the waterfall** (base → learned chain → page 7's voting → page 8's
  re-ranker). It is already an abstraction — Act 2's tricks stacking on the
  learned chain — and it references earlier pages the way the deck likes.
  Re-copy it so GPT-4o is "a model with no learned chain," not a product
  predecessor: the rows are *mechanisms*, not a release timeline.
- **Cut the GPT-4o / o1 / o3 scoreboard table entirely.** It is the
  regurgitation the review calls out, it reads as chronology, and it creates
  the o3-in-3-but-not-2 inconsistency. Replace with a "the recipe generalizes"
  block built on El-Kishky et al.: scaling **general-purpose** RL, rather than
  domain-specific techniques, is the robust path in reasoning domains — one
  law, many domains (maths, science, code), no per-benchmark tuning. Render as
  three small same-shaped curve chips or a single claim card, not a table of
  scores.
- o3 shrinks to one sentence inside that block: *"Turn both knobs again and
  the law holds"* — optionally a second dot on section 2's chart, never a
  column of numbers. o3 now appears exactly once, in service of the law, which
  dissolves Issue 7.

### 4. "The thoughts you cannot read" (fix the diagram; solves Issue 5)

Keep the section and, verbatim and in place, the three blocks the review marks
as good: **"The case for hiding"**, **"The price"**, and the closing
turn-the-page callout.

Replace the boundary diagram. Its current failure: the summary arrow floats
between grid cells, the deception-monitor box has no drawn relationship to
anything, and the billing line is a detached rule — three visual systems, no
shared grammar. Two candidate fixes, in order of preference:

1. **Ledger, not map** — a three-row "what exists / who can read it / who pays
   for it" strip: raw chain (lab only · user pays per token), model-written
   summary (user · free), deception monitor's verdict (lab only). The
   asymmetry the diagram was reaching for becomes a column the eye can scan.
2. If it stays spatial: one vertical boundary, and **every** element gets an
   explicit labelled arrow — chain → summarizer → user; chain → monitor
   (dead-ends inside the lab); user → tokens billed across the line. No
   floating glyphs.

The 0.17% monitor number and system-card citation survive either way as the
one pinned anchor.

## Bookkeeping

- `curves.o3Preview` usage shrinks to the single generalization mention (or is
  dropped); update `frontier.test.ts` pins accordingly. Waterfall and two-axis
  anchors in `data/o1-scaling.json` are untouched.
- New citation payload from El-Kishky et al. 2025 (already ref'd on the page):
  the LRM definition quote and the general-purpose-RL conclusion. Verify
  verbatim before pinning, per the page 12 revision's protocol.
- Section 1's pseudocode diff should import/share page 12's listing rather
  than fork it, so the two pages cannot drift.
- Footer "Simulated/Cited" split stays; the Simulated line gains the
  rumored-recipe disclaimer.

## Issue → fix map

| Issue | Fix |
|---|---|
| Styling break | Interactive/derived-first sections with honesty badges; cited numbers demoted to anchors; copy in house voice |
| 1 (section 1 from literature; STaR+RL missing) | New section 1: pseudocode diff off page 12, human-out-of-the-loop framing, confirmed-vs-rumored labels |
| 2 (build on slides 3 & 11) | Section 2 re-copy: page 11's idiom with RL as curve-picker; page 3's data wall named as what the loop escapes |
| 3 (reads as history) | Model names become mechanisms/data points; no version timeline anywhere |
| 4 (regurgitates o3) | Scoreboard cut; generalization block (El-Kishky) replaces it |
| 5 (flowchart) | Ledger strip (or fully-arrowed boundary) replaces the diagram |
| 6 (section 3 history) | Same fix as 4 — the table is gone |
| 7 (o3 in 3 not 2) | o3 appears exactly once, as "the law applied again" |
| The Good | Three closing blocks kept verbatim, in place |

---

# Post-review findings (2026-08-09)

Everything above describes the refactor that **shipped**. This section is new: it collects
the page-13 findings raised by the full-deck review in
`docs/review/pages_1_through_14_analysis.md`, deferred out of the fix queue by author
direction for a design conversation.

Three page-13 blockers are **not** here because they are being fixed now, in the forward-plan
pass: **F2** (name the joint two-axis surface as authored), **F3** (draw the waterfall as
three parallel readings, not an additive stack), **F6** (the "they do not substitute" claim).
Expect the fidelity note, the waterfall figure and section 2's closing line to have changed
by the time this document is picked up.

## Do not touch

Two elements are named in the review as load-bearing strengths. Any fix below must leave
them intact.

- **Section 4's four open questions** (`Page13.tsx:379-396`) **and the handoff**
  (`:779-784`). Each question is answerable only by an open model, page 14 answers all four,
  and the pairing is pinned in test on both sides. The analysis calls this the strongest
  structural device in pages 12-14 and page 13's real novelty claim, present in no source
  paper.

---

## Honesty protocol vs the figure

### F17 · major · "confirmed frame only" badges three unconfirmed station labels

The badge (`Page13.tsx:498-500`) and figcaption (`:543`, *"The shape is the whole of what was
confirmed"*) sit directly above sub-labels making specific mechanism claims:

- *"generate xk — k sampled chains explore instead"* (`:521-525`)
- *"reinforce — this updates the current model, so gains compound"* (`:533-537`)

A reader who trusts the badge concludes OpenAI stated that o1's training samples k chains per
problem and reinforces in place. Both are inferences from the phrase "reinforcement learning",
and they are exactly the class of unconfirmed specifics this page cut its rumored recipe to
avoid. **The page's honesty protocol is stricter than its own figure.**

Fix: either drop the mechanism sub-labels to what was confirmed, or badge them separately.

### F92 · minor · section 2 asserts as fact what section 4 calls unknowable

`:585-588` states without hedge that *"x100 thinking is one answer whose private chain is
allowed to run a hundred times as long, not a hundred sampled answers"*. `:381-383` then says
*"nothing visible from outside tells the two apart"*. The page's own header comment admits it
(`:104-105`); no on-screen word does.

Fix: hedge section 2 to what section 4 already concedes. Small, and it strengthens section 4.

### F91 · minor · the o1 dot is called "verbatim" and its x position is authored

`Page13.tsx:159` computes the dot's x by inverting the authored law (≈ x65). The fidelity
note says *"the dashed GPT-4o line and the o1 dot are verbatim"* (`:666-667`). Only the dot's
**y** (74.4%) is published.

Overlaps the F2 fix landing now; re-read the rewritten fidelity note before acting.

---

## Pedagogy

### F18 · major (partly opinion) · the one predict-observe-explain moment is narrated four times first

The page's only discovery beat is pre-stated in four places before the reader can act:

1. in prose before the chart (`:593-599`)
2. as static staircase labels on it (`:345-366`)
3. in the fine print under it (`:603-607`)
4. in the closing line (`:654-661`)

Only *then* does the margin note say "drag" (`:672-677`).

A reader reaches the sliders already holding the conclusion and drags to confirm, not to
discover, which is the decoration failure mode this venue penalizes. Page 14 has a "setup
before, meaning after" guard pinned in test; page 13 has none.

Fix: cut three of the four. **The opinion component is which three** — that is the design
call this document exists to hold. Note that (4) is also being reworded right now by the F6
fix, so decide (1)-(3) first.

---

## Figure artifacts and wording

### F93 · minor · the x1 curve's left end is a clamp artifact presented as data

`floor = 1` in `twoAxisAccuracy` means the run enters the plot at 1% and runs flat for part of
a decade. A reader reads it as *"no amount of thinking helps an untrained model below some
threshold"*, a claim neither the page nor the source makes.

### F94 · minor · "the missing RL's share" renders as a bare `+` with no unit

`:645-651` renders a `BigNumber` with `prefix="+"` and no suffix; the chart bracket says *"the
missing RL: +29.5"*. A reader may take it as a percentage **share** rather than accuracy
**points**.

### F95 · minor · "one instant answer from a strong LLM (GPT-4o)" contradicts page 5

`Page13.tsx:438-439`. Page 5 established that a 2026 instruct model writes a chain unasked.
What the label means is *"no RL-trained long private chain"*. Say that. Note this label sits
inside the waterfall, which the F3 fix is redrawing now.

---

## Dead constraint

### F96 · minor · `starListing.tsx` preserves a constraint whose purpose is gone

`starListing.tsx:3-9` instructs *"never fork this column"* because *"page 13's diff is only
honest if the left-hand side is exactly what the reader ran on page 12."* **Page 13 no longer
imports it.** A future editor will preserve a constraint that no longer binds anything.

Fix: delete the docstring or the module. This is also listed in the forward plan's
orphaned-surface sweep (item 54), so check whether that pass took it first.

---

## Not a defect, recorded so it is not re-raised

**F101 · GPT-4o at 12% here vs 9.3% on page 14.** Both are correctly sourced (OpenAI's own
report vs DeepSeek's measurement). Page 15 uses exactly this pair as a teaching case and
**needs the discrepancy to arrive unexplained**. The forward plan resolves this explicitly:
leave both pages silent. Do not add a reconciling clause.

**Page 14's Simulated/Cited footer.** A prior pass proposed deleting it for consistency with
page 13's inline-only provenance. The review finds page 13 is the page with the disclosure
gap (F2, F17). If uniformity is wanted, **unify upward**: page 14's footer is the correct
pattern. Do not action the prior proposal.

