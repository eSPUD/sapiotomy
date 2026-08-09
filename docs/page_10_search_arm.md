# Page 10 — the search arm: measuring what the judge inside the loop buys

**Status:** notebook implemented as `notebooks/page_10_search_arm.ipynb`; gates 1 and 2
pass locally; gate 3 has run once, on the outcome judge, and **failed its pre-registered
floor**. The process-judge run is specced and bundled for a rented card and has not run.
No page copy has been written and no figure has been drawn.

**This document exists to be argued with.** Its §7 is the case against running the arm at
all.

---

## 1. What page 10 is now, and what it is missing

Page 10 is one of the better pages in the deck and none of it is at risk here.

- **Section 1** hands the reader the next-word tree and lets them finish the line by hand.
- **Section 2 is the centrepiece**: one fixed 29-word tree, five strategies, animated in
  time so each algorithm's signature is legible — breadth-first washing across a column,
  depth-first diving and visibly retreating, beam advancing *b* tracks in lockstep, MCTS
  narrowing by trial. Every number in it is measured and pinned in
  `act2nextword.test.ts`.
- **Section 3** is what search buys, cited from Yao et al. 2023 (`tot-crosswords.json`).

The gap is narrow and specific. **Page 10 is the only page in Act 2 with no measured arm
on the deck's own instrument.** Pages 5, 6, 7, 8 and 9 each replay a run over the same 100
MATH-500 items with the same grader; page 10 demonstrates search on an authored toy and
then cites someone else's benchmark for whether it works. A reader who has just watched
five pages prove their claims on one instrument is entitled to ask what search does *on
that instrument*.

The page's own header already states the thesis this arm would test:

> Everything else on this page is best-of-N (page 8) with the judge moved inside the loop:
> a verifier scores partial lines while they are still being written (page 9), and the
> search decides which lines to extend.

That is an empirical claim about our own pipeline, and nothing on the page measures it.

## 2. Non-goals

- **Section 2 is not touched.** A real MATH search tree cannot be rendered, and nothing
  here tries. The measured panel goes *beside* Yao in section 3, small, as apparatus.
- **Yao is not replaced.** The published result stays; ours joins it.
- **Not a claim about search in general.** See §6 and §7.
- **No new page-level structure**, no renumbering, no change to the 10→11 flow.

## 3. The arm

`notebooks/page_10_search_arm.ipynb`. Standard REPLAY / QUICK / FULL, harness plumbing,
trace bank, manifest. Follows the canonical pipeline in `page_6_refactor.md` §6.

**Held fixed:** pages 6–8's exact 100 MATH-500 L4/5 items (asserted against page 7's
manifest), `Qwen2.5-3B-Instruct` as writer, the ch03 grader, and a 2,048-token budget per
line — the same budget a single chain got on page 6, so search is not smuggling in a
longer one.

**Varied:** when the judge is allowed to look.

### 3.1 What can actually run, and what cannot

Of section 2's five strategies, two survive contact with free-text reasoning steps:

| strategy | on MATH-500 | why |
|---|---|---|
| greedy | yes, page 6 already | one line, no way back |
| **beam** | **yes, this arm** | fixed frontier, *b* lines carried forward |
| best-of-N | yes, page 8 already | the judge, applied after |
| breadth-first | no | the frontier is unbounded once a step is free text |
| depth-first | no | no terminal test short of generating every branch to the end |
| MCTS | no | rollouts-to-terminal per node, thousands per item |

**The page must say this in those words.** It is a limit of our hardware and of free-text
steps, not a result about the algorithms, and quietly showing two of five would be the
dishonest version.

### 3.2 The ladder

Three of four rungs already exist. Only the top is generated.

| when the judge looks | accuracy | judge calls/item | source |
|---|---|---|---|
| never (greedy, one line) | 43% | 0 | page 6 |
| never (majority vote@16) | 55% | 0 | page 7 |
| after a finished chain (best-of-16) | 60% | 16 | page 8 |
| **during a partial chain (beam)** | **?** | ~127 | this arm |

### 3.3 Two judges, and why both

Page 8 chose its judge deliberately and recorded why:

> An OUTCOME reward model keeps page 9's process-supervision story intact; a process
> reward model would win more easily and spend page 9's subject to do it.

- **Outcome judge** — Skywork PRM, page 8's, a value pooled at the *last* token of a
  solution. Holding it fixed isolates timing perfectly, but it was trained to score
  *finished* work, so asking it to value a prefix asks a question it never learned.
- **Process judge** — `Qwen2.5-Math-PRM-7B`, page 9's, trained to score every step. This
  is the fair test, and page 10 **consumes** page 9's conclusion (only process supervision
  reads steps) rather than re-deriving it.

Running both is the point: the contrast between them *is* page 9's thesis, demonstrated
inside a search rather than asserted.

### 3.4 What has already been measured

The outcome-judge run is done, on 20 items:

```
beam 4x4, outcome judge during   40%   (greedy 43%, best-of-16 60%)
```

Moving page 8's judge inside the loop **cost 17 points against using it after, and 3
against not using it at all.** Diagnostics point at premature closure: winning lines
averaged 549 tokens against greedy's 693, and short lines won more often than long ones.
That is the expected failure of an outcome model used as a value function — a prefix that
*looks finished* outscores one mid-derivation.

**This number is only trustworthy because of what it cost to get.** The first attempt
returned 30% and was a bug: in a batched `generate` with `stop_strings`, a sequence that
stops early is padded with `pad_token_id`, which for Qwen equals `eos_token_id`, so the
terminal test read padding as end-of-turn and declared almost every step final. It
produced 27-token "finished" lines containing no answer. A result and a bug were
indistinguishable from the output, which is the hazard this whole arm has to be built
against.

## 4. The gates

Each is pre-registered, prints its own verdict, and blocks what follows.

**Gate 1 — the port.** The ported vote and coverage rules reproduce page 7's shipped
aggregates exactly. *Passed, drift `0.00e+00`.*

**Gate 2 — the judge is the one the deck already measured.** Different by kind, because
"the same judge" means different things:

- *Outcome:* exact agreement against page 8's per-candidate scores. *Passed, `0.00e+00`
  over 60 candidates.*
- *Process:* page 9's Paris preflight (a broken forward pass returns finite, wrong hidden
  states and announces nothing), then AUC against its 1,092 checker-labelled steps,
  floored at page 9's own 0.65. *Passed at 8-bit: **AUC 0.8905** against page 9's 0.8922,
  mean per-step drift 0.0013.*

At bf16 this gate also measures **what page 9's quantisation cost** — a number page 9
could only name as an unknown.

**Gate 3 — the sweep, and the reason it is a sweep.** One number per item cannot separate
"search degrades the model" from "our harness broke generation," and we have already shipped
one bug that looked exactly like a result. So gate 3 runs three configurations on 20 items:

| config | what it isolates |
|---|---|
| **(1,1)** | **the control.** Width 1, expand 1 is chopping and resuming with *no selection at all*. If it lands near a plain sampled chain (~47%), the machinery is harmless and everything above it is about search. If it craters, the harness is the story and nothing else may be read. |
| (2,4), (4,4) | the width sweep. Accuracy *falling* as width rises is the over-optimisation signature, measured rather than argued. |

It also grades **every finished line, not just the winner** — ~19 per item, already
generated and currently discarded. That yields **beam coverage against beam selection**,
the deck's own lens: coverage high and selection low is a selection failure (Stroebl);
coverage low means the search genuinely never reached the answer.

Pre-registered floor: 45%. Below it the arm does not run and the negative is reported.

## 5. Pre-registered outcome branches

Written before the process run. Every branch ships.

| # | Result | Page treatment |
|---|---|---|
| 1 | Process beam clears best-of-16 | The ladder completes: the judge is worth more inside the loop than after it, and page 10 owns a measured search result on the deck's instrument. |
| 2 | Process beam beats greedy but not best-of-16 | Search helps and does not pay for itself at 8× the judge calls. The economics land on page 16 and R (page 11 §2) explains why. |
| 3 | Process beam loses, coverage stays high | **The most interesting branch.** The lines were there and the judge could not pick them: Stroebl reproduced on our instrument, with AUC 0.89 compounded over eight steps instead of applied once. |
| 4 | Process beam loses, coverage also low | Search is degrading the model, not just failing to select. Report it, and the `(1,1)` control decides whether it is search or our harness. |
| 5 | The `(1,1)` control craters | The harness is the finding. Nothing else in the arm is reportable and the page keeps Yao alone. |

Branch 3 is the one the theory predicts and the one that most helps Act 3.

## 6. Why this is a big step over the current page 10

1. **It closes the deck's last Act 2 gap.** Page 10 stops being the one page that
   demonstrates on a toy and cites for the real thing.
2. **It makes section 2's thesis checkable.** "Best-of-N with the judge moved inside the
   loop" becomes a measurement instead of a description, on the same items as pages 6–9.
3. **The ladder is a controlled comparison, which nothing published here has been.** One
   generator, one item set, one grader, one line budget; only the *timing of judgment*
   moves. Gate 2 proves the judge is the same judge. That is a cleaner experiment than the
   published law page 11 states (Snell's 14× comparison is FLOPs arithmetic against an
   untrained baseline whose small side got revision fine-tuning and a trained verifier the
   large side never received — **verify directly before this claim reaches any page**).
4. **It converts an honest limitation into content.** Naming BFS, DFS and MCTS as
   unrunnable, with the reason, teaches something section 2's animation cannot: these
   algorithms need a bounded frontier and a terminal test, and free-text reasoning gives
   neither.
5. **It costs almost nothing to be wrong.** Three of four rungs are free, only the top is
   generated, and the failure mode is a publishable negative rather than a wasted page.

## 7. The case against, which a reviewer should press

1. **A negative may be the harness, and we have already been fooled once.** The `(1,1)`
   control and the coverage split exist for this, and they are the first things to
   scrutinise. If the control is weak, discard the arm.
2. **One search, one judge, one width, one band, 100 items.** A beam of 4 with an AUC-0.89
   verifier failing says nothing about search in general, and **page 11's own section 4
   contains the counterexample**: Wu's REBASE beats a 34× larger model's best sampling at
   ~8× fewer FLOPs, with search, on MATH500. The page cannot claim "search does not work"
   with that figure three inches away.
3. **The step boundary is a claim.** Steps are cut at a blank line (page 9's first cascade
   rule, and the convention the judge's own released usage splits on). A different rule is
   a different experiment.
4. **`VALUE_AT` is a free parameter.** A prefix gets one probability per step and a beam
   needs a scalar; `"last"` is the value-function reading, `"min"` and `"mean"` are
   defensible alternatives, and only one is being run. Recorded in the manifest, not
   swept.
5. **Precision is a variable on a rented card.** bf16 on A100, 8-bit on L4. Gate 2
   re-measures AUC at whatever loads, so this is reported rather than assumed — but the
   arm should not be run at a precision that gate has not cleared.
6. **This is the third thing page 10 would be doing.** If it makes the page feel like a
   survey, cut it. Section 2 is the reason the page exists.

## 8. How it sets up the pages after it

### Page 11 — and why page 11 may lean on this

Page 11's revised claim is that at matched FLOPs, sampling plus a realistic selector never
beats spending the same FLOPs on parameters. **That claim currently has a hole a reader can
put a finger through: "you never tried search."**

Act 2 escalates 7 → 8 → 10: vote, then judge-after, then judge-during. Page 11 prices the
toolbox against parameters, and until page 10's arm exists it prices only two of the three
rungs, then borrows Wu's REBASE for the third. Borrowing is what page 11 spent its whole
refactor trying to stop doing.

With the arm, page 11 gets one of two things, and both are good:

- **Search loses too** → the negative is near-complete. Every rung of Act 2's escalation
  was measured against parameters on one instrument, and the page's scoping shrinks from
  "sampling and post-hoc selection" to something much closer to "the toolbox."
- **Search wins** → page 11 becomes a *positive* page with a measured crossing of its own,
  stops leaning on Wu for that claim, and the story becomes **which** test-time compute
  rather than whether.

Either way page 11 stops making a claim its own section 4 undercuts. **The dependency is
real but not blocking:** page 11 can ship scoped to sampling and post-hoc selection, citing
page 10 for search exactly as it cites Wu. It is simply a weaker page.

### Page 12 — STaR

Page 12's loop keeps rationales that reach the right answer: an external check, applied at
*training* time. If page 10 shows an answer-time verifier capped at AUC 0.89 and compounding
badly under repeated selection, page 12's filter reads as the same verifier moved somewhere
it can afford to be right — once per problem, on problems with known answers.

### Page 13 — o1

Page 13's two-axis curve separates train-time RL compute from test-time thinking. Page 10
measures the *cost side* of the test-time axis in judge calls per answer: ~127 against
best-of-N's 16. That is what makes "the frontier moved the spend to the other axis" an
economic statement rather than a stylistic one.

### Page 14 — R1

This is the sharpest hand-off and **the deck has already written it**.
[`Page14.tsx:196`](../web/src/components/pages/Page14.tsx:196), on the aha stage:

> Page 10's branch, score, backtrack, with the harness deleted and the scoring moved inside
> the chain.

`page_14_scaling_frame.md` holds page 14 to two deck callbacks, one of them *"page 10 at
the aha."* The connection is written; what it lacks is evidence. If page 10 measures that
branch-score-backtrack from *outside* is expensive and verifier-capped, page 14's aha stops
being a curiosity and becomes the resolution.

**The claim to make, and it is sharper than "bake the search in":** the verifier does not
disappear, **it relocates**. R1 still uses a rule-based correctness verifier — at training
time, once per problem, where ground truth exists. At answer time there is none; the doubt
is in the weights. Page 14's own text says it: *"Nothing scored those steps: the reward only
sees the final answer."*

So the spine reads: **page 9** verifiers are fallible (AUC 0.89) → **page 10** steering with
a fallible verifier at every step is worse than checking once with it, because 0.89
compounds → **Act 3** move the verifier to where being wrong costs a gradient instead of an
answer.

That is a claim about *where you can afford to be right*, which is stronger and more
defensible than any claim about search topology. It also closes a loop page 11 opens: its
§2 defines R = tokens served ÷ tokens trained, and answer-time search is the limiting case —
you pay the verifier on every query, forever. Page 16 collects that bill.

## 9. Page rebuild

Small and local; section 2 untouched.

- **A panel under Yao's figure in section 3.** The ladder as four rungs, judge calls beside
  accuracy, with the beam coverage/selection pair beneath. Apparatus, not hero: a null in
  the hero slot reads as a wasted page, a null in apparatus reads as honesty.
- **A sentence naming what could not run**, with the reason.
- **Callback budget.** `page_14_scaling_frame.md` holds page 14 to two callbacks; page 10
  has no such rule but should inherit the discipline. The arm adds at most one new
  reference, to page 8's judge, because that is the comparison being made.
- **Footer** gains a Measured label beside Simulated and Cited.

## 10. Sequencing

1. ~~Gate 1, the port.~~ **Passed.**
2. ~~Gate 2a, the outcome judge.~~ **Passed, exact.**
3. ~~Gate 3 on the outcome judge.~~ **Ran; failed the floor at 40%. Kept as the diagnostic
   rung.**
4. ~~Gate 2b, the process judge.~~ **Passed at 8-bit, AUC 0.8905.**
5. Gate 3 sweep on the process judge, on a rented card. **Read the `(1,1)` control before
   anything else.**
6. FULL arm only if the floor is cleared; branch per §5.
7. Page rebuild per §9, and only then any change to page 11's scoping.
