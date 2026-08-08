# Finishing touches — pages 1–12

A five-dimension review of the deck as it stands on 2026-08-07, focused on whether the new
pages 5–9 do their assigned jobs, plus a direction check on the unbuilt pages 11–14.

**How to read this.** Every claim below cites `file:line` and was checked against the file, not
against a spec. Findings marked **[verified]** survived an adversarial pass by an independent
agent that was instructed to refute them. Findings marked **[weakened]** are real but were
overstated or came with a wrong fix; the corrected fix is what appears here. Findings marked
**[hand-checked]** are ones I confirmed myself by opening the artifacts. Two findings were
**refuted** and are listed at the bottom so nobody re-raises them.

This document does not duplicate [`docs/finishing_touches.md`](../docs/finishing_touches.md), the
author's own running list. Where a finding is already tracked there, it says so and cites the
section, because "already known" changes the priority but not the fact.

Four pages get their own file:

- [`page_2_concerns.md`](page_2_concerns.md) — the weakest page in the deck
- [`page_7_concerns.md`](page_7_concerns.md) — a strong page with a false sentence and a broken download
- [`page_8_concerns.md`](page_8_concerns.md) — the one new page that never got the house-style pass
- [`page_11_concerns.md`](page_11_concerns.md) — the deck contradicting its own measurement

---

## The headline

**Pages 5–9 do their jobs.** All five teach their assigned concept, all five carry their own
measured data, and the seams between them are the best-chained stretch in the deck: page 5 closes
on "how much of that working did it need" and page 6 opens on exactly that dial; page 6 closes on
"40 chains of 128 instead of one long one" and page 7's step-4 table runs that exact arithmetic;
page 7 closes on "stop counting, start judging" and page 8 does; page 8 closes on "none of them
looks at whether step three followed from step two" and page 9 does. They also share one measured
population (item hash `9ab2b579`), so the handoffs carry receipts rather than rhetoric.

The reproducibility standard is genuinely unusual. Every headline number traces to a committed
`derived.json` produced by a checked-in notebook, loaded through a TypeScript module that reads the
run's own `claims` gates before any number and throws if one is false. Roughly ten numbers per page
were spot-checked against the artifacts; all matched.

**The gap is uneven polish, not correctness.** Pages 5, 6 and 7 received a copy-and-apparatus pass
that pages 8 and 9 did not, and the seam is visible: 5–7 put a provenance plate and the notebook
download above the fold and retired their footers, while 8 and 9 still end in a run-on paragraph
carrying method, citations and caveats. Page 8 is furthest behind — it speaks notebook shorthand
on its main evidence figure.

**One page states something its own data denies, and one page contradicts a sibling page.** Those
are the two things a reviewer would actually catch, and they are the top of the priority list.

Grades by dimension (`good` / `fair`; no page graded `poor`):

| Page | Flow | Repro | Explainable | Intuitive | Prose |
|---|---|---|---|---|---|
| 1 | fair | good | good | good | good |
| 2 | fair | good | **fair** | **fair** | **fair** |
| 3 | good | good | good | good | good |
| 4 | good | good | good | good | fair |
| **5** | good | good | good | good | good |
| **6** | good | fair | good | good | fair |
| **7** | fair | fair | good | fair | good |
| **8** | fair | good | **fair** | **fair** | **fair** |
| **9** | good | good | good | good | fair |
| 10 | fair | good | good | good | good |
| 11 | fair | good | good | good | fair |
| 12 | good | good | good | good | good |

---

## Priority 1 — fix before anyone reviews the deck

### 1. Page 7 tells the reader something page 8's own data denies **[verified]**

`Page7.tsx:649-652` closes the page with *"Page 8 keeps the same 16 candidates and changes only the
rule for picking one."* That is an identity claim, and `web/data/page-08-derived.json` explicitly
denies it: `page_7_agreement.same_candidates: false`, `manifest.candidates.source: "page 8's own
generations"` — 12,800 fresh chains under run hash `5a00d35f`, against pages 5–7's `9ab2b579`.

The sentence was true of the plan (`docs/page_8_refactor.md`: page 8 "runs no generation at all: it
opens page 7's traces.jsonl") and the implementation then went the other way. A reviewer who
downloads the bundle finds the deck asserting an identity its shipped JSON refuses.

The mitigation exists and is invisible: page 8 *did* measure the agreement (vote 55% vs 56%,
coverage 78% both ways, gate `agrees_with_page_7: true`), and nothing on either page renders it.

**Fix.** Rewrite to what is true and just as strong: *"Page 8 re-runs the same protocol on the same
problems, checks it lands where this page landed, and changes only the rule for picking one."*
Then surface `page_7_agreement`'s numbers in page 8's margin as the receipt. Also clean up
`web/data/page-07-derived.json`'s `pool.note` — *"page 8's candidate pile: the same chains, read by
other selection rules"* — which carries the same stale claim and is emitted by the page 7 notebook.
**[hand-checked]**

### 2. Page 11's mechanism sentence contradicts page 7's measurement **[hand-checked]**

`Page11.tsx:988-991`: *"On hard ones every chain breaks somewhere, so no number of re-draws holds a
right answer to find."* On exactly those L4/5 items, `web/data/page-07-derived.json` records
`handoff.coverage: 0.78` — the right answer is in the pile for 78% of them. The chains do not all
break; the *selectors* fail to find the survivors (vote 55%, trained verifier 60%, oracle 78%).

A reader walking 7 → 9 → 11 in order catches the deck disagreeing with itself. The page-11 refactor
spec documents this contradiction as its own justification, so the fix is coming — but the sentence
is on the live page now and the patch is one paragraph.

**Fix (independent of the refactor).** Replace with the measured mechanism: on hard problems correct
chains still appear, but rarely enough that no realistic selector fishes them out — selection, not
coverage, is the bottleneck. Stroebl et al., already cited on this page, is the published form of
that point. See [`page_11_concerns.md`](page_11_concerns.md).

### 3. Page 8 states an unresolved ranking as fact **[hand-checked]**

`Page8.tsx:645-648`: *"the best solver on this ladder is the worst judge on it. The only judge above
the vote is [skywork-prm]."* The run's own flags say otherwise:
`claims.judge_ranking_resolved: false` and `claims.a_weaker_judge_beats_counting: false`. The means
behind the figure differ by 2–7 points on ~78-item denominators with overlapping bars.

Both sentences are true of the point estimates, but the notebook refused to call the ranking
resolved — and this is a page that quotes a p-value for every other comparison. Its two strongest
sentences carry none.

**Fix.** Soften to point-estimate language ("on this run, the best solver ranked last") or add the
one clause saying the ordering is not resolved at this sample. The flag is already in the artifact.

### 4. Two download bundles break the chain of custody the README advertises **[hand-checked]**

`notebooks/README.md:130-132` tells readers: *"The manifest records the notebook's sha256, so 'this
file made these numbers' is checkable rather than asserted."* I ran that check on all five pages:

| Page | manifest `notebook_sha256` | bundled notebook | repo notebook | |
|---|---|---|---|---|
| 5 | `c66d1a9c` | `c66d1a9c` | `2652469c` | chain holds via the download |
| 6 | `8c1feac6` | `7f83c725` | `9d7ef573` | **broken — matches neither** |
| 7 | `2d1a51af` | `6bf06128` | `9c210953` | **broken — matches neither** |
| 8 | `b4c668e0` | `b4c668e0` | `ca8adbf2` | chain holds via the download |
| 9 | `7b806dfc` | `7b806dfc` | `7b806dfc` | perfect |

Worse for page 7: the repo notebook contains a crash fix (`# without this filter a None sorts
against an int and the cell dies`) that **the shipped zip does not have**. A reader who follows the
README — download page 6's bank, then run page 7's notebook — hits the exact crash the authors
already fixed.

**Fix.** Rebuild the pages 6 and 7 zips from the current notebooks and regenerate their REPLAY
manifests in the same pass, so zip, repo and manifest agree. Consider hashing code cells only, so a
notebook re-save cannot break the chain — that is what happened here; the code is unchanged.

---

## Priority 2 — per page

### Page 5 — Chain of Thought · **good, one conceptual gap**

The strongest prose on the deck (~10% cuttable, the tightest of pages 1–12) and the best "term
before the measurement" opening: step 1 rebuilds *chain of thought* from the reader's own page-1
arithmetic, pulled live from `SYSTEMS.slow` so the callback cannot drift.

- **The title names a technique the page never shows working.** Already tracked as
  `docs/finishing_touches.md` §1 and it remains the page's one conceptual gap. Note the correction:
  do not "reframe step 1 to be removal-only" — the lede, step 2 and the `pages.ts` concept line
  already say that, and step 1's "the classic way is to ask" is the deliberate setup for step 2's
  "nothing has to ask it to." Follow the tracked sequence: run the 10-item probe from
  `docs/page_5_base_arm.md` first; the full arm is gated on it. **[weakened]**
- **`Page5.tsx:874-875` promises "page 12 opens on it" and page 12 does not.** Verified by grep:
  the built page 12 (STaR) opens on the answer-key question and never mentions the instruction
  null. The receiving sentence is specced (`docs/page_5_refactor.md:301-316`,
  `docs/page_12_citations_reorder.md:229-247`) and was never built. Either add the pickup to page 12
  or reword the clause; `docs/finishing_touches.md` §1 option (b) depends on this pointer landing
  somewhere real. **[verified]**
- **Figure 2's reveal is spent before the reader touches the switch.** The intro gives both
  endpoints, the invitation box names the count that will leave, and the delta paragraph renders
  *before* the flip. Trim the intro to the denominator and the free-run number, make the invitation
  countless ("press it and watch what leaves"), and gate the delta paragraph and the legend's
  discordant counts on the gagged state. Leave step 5 alone — it is the spec-sanctioned close.
  **[weakened]**

### Page 6 — Thinking Longer · **good; two tracked figure problems**

Step 3's takeaway — *"they did not run out of room, they ran out of ideas"* — is the deck's best
earned post-figure line.

- **The Wait-injection figure leads with the boring half of its result.** Tracked as
  `docs/finishing_touches.md` §7 and explicitly *"held for review pending a decision."* This review
  is that decision: **invert it.** The figure draws three near-flat accuracy lines at full strength
  with churn bars at 20% opacity, so it reads "nothing happened" when the finding is "30% of answers
  changed and none of it helped." Lead with 9 fixed / 10 broken in page 5's paired-flip vocabulary
  (reuse `Page5.tsx`'s `PairedGrid`) and demote the accuracy lines to an inset. **[verified, twice]**
- **The budget grid's resolution, restated correctly.** `docs/finishing_touches.md` §6 calls it "two
  of five stops on dead travel"; by the committed data only 2048 is accuracy-dead (`knee_budget` is
  1024, and 512→1024 gains +9 points). The tracker entry also predates commit `06bff87`, which
  replaced the slider with five radio stops — there is no travel to drag through any more, and the
  page deliberately teaches the flat stop. The real issue is coarse resolution *inside* the knee: 7
  to 44 solved across three interior steps. Keep the tracked GPU re-run, reframe the reason, and
  make no interim page change. **[weakened]**
- **The heights caveat is stated twice nearly verbatim** (`Page6.tsx:980-985` and the margin note at
  `1034-1037`, with "differ in size and in training" literally repeated). Intro keeps *"Read the
  shape rather than the heights"*; the margin keeps the full reason. **[verified]**
- **Step 4's finding is told three times around one table** (footnote 1188-1192, takeaway 1195,
  margin 1205). After the §7 inversion, keep the takeaway, cut the footnote to its pairing
  definition, drop the margin note. **[verified]**

### Page 7 — Frequency Voting · see [`page_7_concerns.md`](page_7_concerns.md)

Excellent page — the pizza parable is two paragraphs that exist to land one load-bearing clause, and
the whole rest of the page measures that clause. It carries the deck's single false sentence
(priority 1.1), a broken download (priority 1.4), and a vocabulary desync on its main figure: the
intro names the three lines *"The vote / In the pile / T = 0"* while the chart labels them *"the
vote returns it / at least one chain is right / one greedy chain."* Git history shows the chart was
renamed and the intro was not. **[verified]**

### Page 8 — Best-of-N and Verifiers · see [`page_8_concerns.md`](page_8_concerns.md)

The weakest of the new five: four of five dimensions grade it `fair`. It missed the pages 5–7
house-style pass entirely, renders raw notebook selectors (`best-of-N (skywork-prm)`, `heuristic`,
`logprob`) as row labels on its main evidence figure, references an unnamed book as "ch05", defines
"verifier" three figures after first use, and states an unresolved ranking flatly. Its lede and its
"lead with the win" structure are **not** faults — that is a settled decision in
`docs/page_8_measured_payoff.md` §9, and the reviewer who challenged it was refuted.

### Page 9 — Outcome vs Process · **good; apparatus in the wrong place**

The in-card localisation caveat — *"The direction is solid; the digit is not"* — is the deck's best
honest-number treatment, and the mode-conditional coaching boxes are exactly-sized.

- **The trained PRM is visually subordinate to the arithmetic checker**, which declines ~94% of
  steps. Do **not** promote it to a co-equal column: `docs/page_9_refactor.md` §4 deliberately moved
  the reveal's verdict from the PRM to the checker (the page's founding defect was hand-written
  booleans attributed to a PRM), and the AUC 0.89 was measured only on the 5.8% of steps the checker
  can judge. The real, small gap is that the bare per-step decimal is uninterpretable: the shipped
  data carries a thresholded `prm_label` at the fitted 0.747 operating point that `asSpecimen` in
  `web/src/lib/page09.ts` drops. Surface it, or render the score relative to that threshold.
  **[weakened]**
- **The footer is the deck's longest** (`Page9.tsx:592-607`), and it is the *only* carrier of a
  spec-mandated disclosure: `docs/page_9_refactor.md` §3d requires the clause "on chains this model
  finished on its own" on the section-2 rate captions, which currently state rates with no
  population. Move that clause to the captions; cut the segmentation sentence as duplicative of
  `507-514`; cut two of the three AUC mentions (the spec says it appears once). **[weakened]**
- **`notebooks/README.md` contradicts itself about this page.** Line 84 says *"Page 9 reuses page
  7's pile"*; lines 199-205 say *"Page 9 is the one page that does not reuse the pile above it …
  page 9 runs its own uncapped pass."* The artifact (`detection.source: "page_07_pile"`,
  `chain_budget: 2048`) and the page footer both agree with line 84, so the second paragraph
  describes an experiment that was never run and mislabels the population as uncapped. Rewrite it as
  the reason for the self-ended-chain *filter*. **[hand-checked]**

### Pages 1, 3, 4, 10, 12 — small stuff

- **Page 1 ends flat.** `Page1.tsx:216-221` closes on *"Recognizing an answer and constructing one
  are not the same act"* and goes straight to `PageNav`. It is the only seam in the deck with no
  hook, and page 2's cold open on "an LLM" has to do all the bridging. One sentence fixes it.
- **Page 3's designed aha is announced only to screen readers.** `Page3.tsx:240-247` sets the
  milestone ("the frontier plan has already outspent a full year at the flat rate") via
  `setAnnouncement`, which renders only into the `sr-only` live region at `538-540`. Surface it
  visibly as a chip that lights when the crossing happens.
- **Page 3 uses "parameter" load-bearing with no gloss** (`389-394`, "about 20 tokens per
  parameter"), and pages 5 and 11 are denominated in it. One parenthetical at first use.
- **Page 4's lede pre-narrates its interactive** (`415-424`, "three cultures built three different
  roads to the same 223,300"), then step 2's verdict box and step 3 say it again. Let the lede pose
  the walk and step 2 own the convergence.
- **Page 10 has no closing handoff to page 11** — the last content sentence is inside a caption.
  Every page from 5 to 9 has one. Two sentences: everything on pages 5–10 spends FLOPs at answer
  time, the same currency parameters are bought with, so which is the better buy at a matched bill?
- **Page 11 never glosses FLOPs**, which denominates every axis and panel on it.
- **Page 12's counterweight doesn't quote the contamination number page 9 minted for it.** Page 9
  says "This is that filter's contamination rate" and points at page 12 by name; page 12 argues the
  same point from literature. Close the loop.

### Deck-wide jargon ledger

Terms that go load-bearing before any gloss: **parameter** (page 3), **greedy** (page 7 — first
explained on page 10; note the correct fix is to attach the word to the operational definition page
7 already gives, *not* to import page 10's likeliest-word mechanism, which
`docs/page_7_refactor.md:225-234` explicitly forbids at this altitude), **temperature / top-p**
(page 7), **verifier** (page 8), **FLOPs** (page 11), **MCTS** (page 10).

---

## Cross-cutting themes

**1. The pages 5–7 pass stopped before it finished.** The provenance plate above the fold, the
retired footer, the one-note-per-step margin apparatus — pages 5, 6 and 7 have all of it; pages 8
and 9 have none of it. Treat this as one act-wide conversion, not two page defects. Fixing page 8
alone just moves the outlier to page 9.

**2. Reveal-spoiling is the most common prose fault.** Ledes and intros hand over an interactive's
payoff before the reader touches the control: page 5's gag figure (told four times), page 4's lede,
page 9's lede, page 12's margin matrix. The house rule says outputs carry the intuition; the
recurring failure is prose that leaves the output with nothing to deliver. **Caveat:** this is not
universal — page 8's "lead with the win" lede is a deliberate, documented decision, and the finding
against it was refuted. Check the spec before cutting.

**3. Triple-telling around figures that under-perform.** Where a figure encodes its finding weakly,
prose compensates — and then the same point appears in the caption, the takeaway and the margin
note. Page 6's Wait figure is the clearest case: three prose blocks propping up one chart. Fix the
figure and two of the three tellings become deletable.

**4. Stale cross-references are this repo's signature hazard, and they are still accruing.** Page 5
points at content page 12 does not have; page 7 asserts an identity page 8's data denies; page 7's
own `derived.json` carries the same stale note; `notebooks/README.md` describes an experiment page 9
never ran. Every one of these was true when written. **Recommendation:** add a cross-reference sweep
as a standing step-4 task in the page pipeline — when a page ships, grep the deck for sentences that
name it.

---

## Direction check — pages 11–14

Two agents assessed this independently, one of them with no access to the other's verdicts. They
agreed on every page and converged on the same three additions, which is the strongest signal in
this review.

### Page 11 — **right direction** (`docs/page_11_refactor_spec.md`)

> **Updated after the merge of `c194308`.** This spec, and the notebook implementing it, are now on
> main. The review below was written against the spec when its status read "plan only"; the spec is
> otherwise byte-identical, so every judgement stands. What changed: **arm 0 has been run, and gate
> 1 passed bit-exactly** — max drift 0.0 against pages 6/7/8's shipped aggregates. That was
> recommendation 3 in the order below, and it is done. It also independently audits pages 6–8's
> reproducibility, which is the strongest confirmation in this document that the measured pipeline
> holds. Gate 2 and arms A–C are implemented and await a GPU.

The best spec of the set. It brings the act's payoff page up to the 5–9 measured standard using runs
the deck already owns (arm 0 needs no GPU and must reproduce the shipped numbers before anything
else runs), repairs the page-7 contradiction with the measured coverage-vs-selection mechanism,
keeps the game UI and the Wu/Snell receipts, and turns the 11|12 act seam from a promise into a
measurement. Pre-registered branches, a mandatory easy-band arm blocking the one overclaim risk, and
gates written before the data existed — exactly the discipline pages 5–9 set.

Three things to add:

1. **The deck already holds evidence for the likely landing and the spec doesn't cite it.**
   `docs/finishing_touches.md` §3 records experiment 4's Qwen2.5 result — Math-1.5B vs 7B,
   allowed to reason, is −6/+1/+0 with nothing resolved. That points at branch 3 ("ties"), not
   branch 1 ("beats"). Draft the copy from "ties at ~5× fewer FLOPs" and treat "beats" as the
   upgrade. §3 explicitly warns the specialist-vs-7B framing cannot be inherited without re-reading
   these numbers.
2. **Add the downstream cross-reference sweep as a step-4 task.** `pages.ts:60`, `Page12.tsx:641-642`
   and `Page13.tsx:576-579` all quote page 11's current headline and go stale under branches 1/3/4.
3. **Keep both loose ends in the rewritten handoff.** §7 names the measured recipe but silently drops
   the "waste" clause (reasoning bought at answer time and discarded) that page 12's lede and page
   13's seam were both written to receive.

### Page 12 — **right direction** (`pages-11-12-experiment-ideas` worktree, `docs/page_12_refactor.md` — not yet on main)

Correctly scoped: keep the page's shape (loop → listing → bars → counterweight → handoff, with the
o1/R1 block and `starListing` frozen so the 12→13 seam survives) and replace only the invented
centerpiece — `lib/star.ts`'s seeded sigmoid — with a measured bootstrap replayed round by round.
Arm C, the answers-only fine-tune, is the control the page's central sentence currently lacks.
Replacing the CommonsenseQA guessing floor (meaningless on MATH, where chance is ~0) with arm B is a
straight correctness fix.

Watch items:

1. **Its stated dependency is unmet.** The spec opens *"Assumed shipped before this page:
   page_5_base_arm.md"*, and that arm is "specced, not built." Sequence page 5's base arm first, or
   page 12 owes an introduction it has not budgeted for. Making page 5's dangling "page 12 opens on
   it" an explicit acceptance criterion would close the deck's broken forward reference at the same
   time.
2. **The counterweight should quote page 9's measured number, not literature.** Page 9 measured the
   contamination rate and points at page 12 by name. Running the arithmetic checker over arm D's
   kept set costs no generation.
3. **Price the pedagogical risk up front.** A 3–4-round LoRA bootstrap evaluated at n=100 (±10
   points) may replay as a mushy climb where the current synthetic curves are crisp. The fallback
   pages are pre-registered and shippable; accept in advance that the measured page may look weaker
   than the simulation it replaces. That is still the right trade at this seam.
4. Include arm F (fine-tune on human rationales). It needs no generation and it answers STaR's
   actual thesis — did the model need human labels at all?

### Pages 13 and 14 — **no live spec, and mostly none needed**

The four `docs/page_13_*` and `docs/page_14_*` documents refer to today's pages by content, but all
four are **already applied** — their verbatim replacements are on the pages (commits `76a93f5`,
`54c52d8`, `88cf6e8`, `9f13fcd`). They are records, not plans. `page_13_refactor.md` is doubly
stale: its section-4 prescription was itself superseded by the 2026-07-30 review.

Neither page can adopt the 5–9 measured standard for its subject, and neither should try — o1's
chain is hidden, and the closed-lab boundary *is* page 13's thesis. Their honest register
("authored redrawing · anchors verbatim") is correct. What remains live:

- **Receiving-side work triggered by the 11/12 refactors.** `Page13.tsx:576-579` opens section 2 on
  "Page 11's law," which needs an era clause if page 11 ships branch 1 or 3. Re-seat page 13's lede
  so o1 reads as the industrial escalation of a loop the reader has just run and measured.
- **One genuinely available measurement, proposed independently by both agents.** The R1 distills
  are open weights small enough for the 16 GB harness. Running DeepSeek-R1-Distill-Qwen-1.5B on the
  same 100 MATH-500 L4/5 items (hash `9ab2b579`) would put one measured dot beside the cited Table-5
  dot plot, give page 11's training ladder a fourth rung (base → generalist → specialist →
  distilled), and hand page 15 a concrete example of why a score needs its coordinates: our number
  on our harness against their published number. It is the only 5–9-standard extension Act 3 has.
- **A 13/14 inconsistency awaiting a round:** page 14 still carries a Simulated/Cited footer
  (`Page14.tsx:1183-1195`) that page 13 dropped under the newer inline-provenance rule.

Absent that distill run, neither page should be touched for standard-uniformity alone.

---

## Refuted — do not act on these

Two findings failed adversarial verification. They are recorded so they are not raised again.

- **"Page 9's reveal is pre-narrated by the picker labels."** The exercise operates at *step*
  granularity — which line breaks, what claim was judged, the per-step agreement count — and none of
  that is disclosed by a label saying a false step exists. More importantly, the disclosure is
  load-bearing: the default view's outcome-grader verdict depends on the reader knowing the chain is
  contaminated in order to watch the outcome grader pass it anyway. The pre-refactor page disclosed
  the kinds the same way, and `docs/page_9_refactor.md:145` freezes that structure.
- **"Page 8's lede pre-narrates figure 2."** The quoted numbers were wrong (the lede says 43%→60%
  and 21 fixed / 4 broken, not "46%→61% … 6 broken"), one of the three "tellings" was an aria-label,
  and "lead with the win" is marked **Settled** in `docs/page_8_measured_payoff.md` §9. The fallback
  suggestion contradicted the same spec's figure-2 prescription.

---

## Method and its limits

Five dimension agents (flow, reproducibility, explainable quality, intuitiveness, prose) each read
pages 1–12 with their own per-page subagents, then 36 high- and medium-severity findings were routed
to independent skeptics instructed to refute them. 42 agents, ~2.9M tokens.

**Caveat on coverage.** Eight verification agents died on a billing limit mid-run: page 11's
contradiction, page 8's "ch05", page 8's judge-ranking claim, both notebook-hash findings, page 7's
stale bundle, page 6's precision field, and page 9's README contradiction. **I checked all eight
myself** — reading the sentences, hashing the notebooks, unzipping the bundles, and querying the
JSON. All eight hold; the hash table and the crash-fix diff in priority 1.4 are my own output.

**What this review did not do.** No notebook was executed and no inference was run — this is static
reading plus shell checks on committed data, per the project's offline-only rule. Nothing here has
been applied to any file.

**One external check.** Page 2's central widget rests on a fact the code itself flags
`!! PLACEHOLDER FACT !!` and says to verify before shipping. I verified it: Spain beat Argentina
1–0 in the 2026 final (Ferran Torres, 106'), their second title. `wins: [2010, 2026]` and
`trueCount: 2` are correct and the page ships as-is — the remaining work is deleting the placeholder
warnings. See [`page_2_concerns.md`](page_2_concerns.md).
