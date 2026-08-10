# Page 9 rerun: what it changed, and what the measurement corrected

**Date:** 2026-08-09, revised the same day after the runs
**Scope:** republishing page 9, and what it does to pages 9 and 18.
**Status:** done. Three notebook runs, artifacts promoted, bundle rebuilt, tests green.

> **This document was rewritten after the work.** Its first version argued for caching the
> PRM scores to protect against run-to-run drift, and quantified that drift as the main
> risk. The measurement killed that argument: two independent `FULL` runs produced
> byte-identical traces. Section 8 records what the first version got wrong, because the
> reasoning failure is more reusable than the conclusion.

---

## 1. Summary

Page 9 reported 0.67% contamination over a denominator of 747 right chains, 479 of which
the arithmetic checker could not read at all. It now names that denominator. The republish
also emits, for the first time, that **1,062 of 1,580 chains contain not one checkable
step**, which is the figure page 18 now opens on.

Along the way the run settled a question nobody had tested: **the PRM does not drift.** Two
independent `FULL` runs produced byte-identical `traces.jsonl` (sha256 `8e658d12…`,
matching the already-shipped bundle). Every published PRM figure reproduced to the last
digit.

That result inverted the plan. Caching the scores was proposed as protection against
variance; there is no variance to protect against. It was implemented anyway, for a
different and better reason: it is what lets a reader reproduce the PRM half at all.

---

## 2. What is now published

Three fields, all checker-side aggregates over `n_checkable` and `n_false`, which every
record already carried:

| field | value | why it matters |
|---|---|---|
| `n_right_reachable` | 268 of 747 (35.9%) | the denominator the base rate did not have |
| `reachable_rate` | 1.87% | contamination over chains the checker could read, against 0.67% published |
| `n_chains_with_no_checkable_step` | 1,062 of 1,580 (67.2%) | the median chain has nothing to grade |

`n_right` counts every chain that reached the right answer, including 479 where the checker
had no closed-form numeric claim to read. Dividing by all 747 reports the instrument's
blind spot as though it were evidence of clean reasoning. Both denominators are now on the
page: the unconditional rate for comparability with the PRM, which scores every chain, and
the conditional one for what the checker actually looked at.

---

## 3. The real problem, which was not drift

**Page 9's REPLAY replayed page 7's run, not its own.** Every other page's REPLAY reads
`out/page_NN/traces.jsonl` and re-derives its figures from it. Page 9's read page 7's pile
and re-graded from scratch, which is a re-derivation rather than a replay. Page 7's chains
carry no PRM scores, so REPLAY could not produce the PRM half at all, and computing it
needs 15.3 GB of weights and a 16 GB card.

The consequence was invisible and serious: **nobody could re-derive page 9's published PRM
figures.** A reader could check every checker number and none of the PRM ones, on a page
whose central figure is the two graders side by side.

Three defects followed from it, all now fixed:

1. `manifest.notebook_sha256` named a notebook that existed in no obtainable copy, because
   the manifest could only ever be written by a `FULL` run whose working copy carried
   `RUN_MODE = "FULL"` while the bundle shipped `REPLAY`.
2. The bundle unpacked flat rather than into a folder, and carried no README, though cell 9
   explicitly accommodates the flat layout so REPLAY did still work from a download. (The
   first version of this document claimed the flat layout broke REPLAY. It did not.)
3. Page 9 was absent from `notebookBundles.test.ts`, which is why 1 and 2 survived.

---

## 4. The fix

REPLAY now adopts this page's own PRM scores when the fingerprint matches, and re-derives
everything else from scratch. The checker re-runs over all 18,772 steps, the threshold is
refitted, every gate and aggregate is recomputed. The only thing taken on trust is the
tensor arithmetic.

**The fingerprint is the safety argument**: `PRM_MODEL | revision | quantisation |
MIN_STEP_CHARS | STEP_SEP`. On mismatch the notebook prints both keys and refuses. Partial
coverage is refused too, since a cache covering some chains would fit the threshold on a
different population than the checker's labels. `PRM_ADOPT_SCORES = False` forces a
rescore. Both the traces and the manifest resolve through the same flat-or-nested fallback
cell 9 uses, or a reader replaying the download would lose the PRM half silently.

The manifest records which half is which: `graders.prm.scores` is `"adopted"` or
`"computed by this run"`, `scores_adopted_from` names the source run's id, mode, notebook
sha and timestamp, and `separation_preflight_is_adopted` flags the preflight as carried
forward rather than re-run.

**Publishing is now two stages.** `FULL` on a GPU computes the scores; `REPLAY` re-derives
every aggregate and writes the artifacts. The manifest therefore names the committed
REPLAY-mode notebook, and the sha contract holds without weakening either test. This
pattern would also retire the declared debt on pages 6 and 8
(`repoNotebookIsTheShippedOne: false`).

---

## 5. Verification

Three runs, in order:

1. `FULL` in an isolated scratch tree. Checker-side and PRM-side both identical to the
   shipped values; `traces.jsonl` byte-identical.
2. `FULL` from the worktree, so `notebook_git_sha` resolved. Byte-identical again.
3. `REPLAY` with adoption, no GPU loaded. Against run 2: **15 fields added, 0 removed, 4
   changed.** Every addition is the new provenance block; every change is `run_id`,
   `run_mode`, `timestamp_utc`, `notebook_sha256`. No measured value moved.

`manifest.notebook_sha256` now equals sha256 of the committed notebook
(`02bca6f2…`), and page 9 passes all seven bundle-integrity assertions.

---

## 6. Effect on the pages

**Page 9** names its denominator in beat 3, and discloses that its three specimens are far
more gradable than the pile they came from (17 of 31 steps checkable, against 5.8% across
the run). The specimen disclosure needed no rerun: the specimens carry their own labels, so
`page09.ts` derives it client-side and marks it as the one figure on the page that is not a
notebook measurement.

**Page 18** opens on 1,062 of 1,580 chains, 67.2%, with the step-level 94.2% behind it. The
chain figure is the image and the step figure is the measurement; a test pins that ordering,
because dropping the step share would invite "so a third of chains are checkable", which
overstates it badly. The reachable third averages barely two checkable steps each.

Four consistency gates were added to `page09.ts`, so a run where the reachable population
exceeded the right chains, or the convictions exceeded what the checker could read, fails
the build instead of drawing a wrong figure.

---

## 7. Why not broaden the checker

Raised and rejected. Recorded so it is not re-proposed.

A CAS equivalence check would stop symbolic steps returning `unknown`. It fails on the most
common step type in the corpus: `3x - 9 = 2x + 74` is an equation being solved, not an
identity, so `simplify(lhs - rhs) == 0` labels correct algebra **false**. Telling an
identity claim from an equation being solved from a definition made on an earlier line is a
semantics problem, not a sympy problem.

The cost of getting it wrong is the checker's only real property: that every label is a
fact a reader can verify by hand. Cell 12 already documents three false-positive classes
found in real output, one of which produced 23 bogus candidates that "outranked every real
one because they looked short and clean."

The PRM's operating point is also fitted on the checker's labels, so a new checker moves
the threshold, the AUC, the detection rate, the publishability gate, localisation and the
specimen picks. That is a re-audit of page 9 and page 8's PRM comparison, not a swap.

And the 94.2% is a finding page 18 leans on, not a defect.

---

## 8. What the first version of this document got wrong

Kept deliberately. The errors share one cause: **I treated the notebook's own prose as
measurement.**

- **Drift.** Cell 20's comment says two identical runs chose cut-offs 0.057 apart, and I
  built sections 3, 4.2 and 4.3 on it, including a sensitivity table bounding a risk that
  does not exist. One 4-minute run would have told me. The comment presumably describes an
  earlier state of the code; it should be dated or removed.
- **"10 seconds, no GPU."** I asserted caching would make the rerun GPU-free without
  checking that cell 17 loads the model eagerly for the separation preflight. That claim
  only became true once the preflight was carried forward too.
- **The flat bundle.** I reported that it broke REPLAY on a fresh download. Cell 9 accepts
  `traces.jsonl` beside the notebook, deliberately and with a comment saying so.
- **Order of work.** I recommended cache-then-rerun. Correct order was rerun-then-decide:
  the cheap measurement disambiguated the expensive design question, and would have changed
  the design if it had gone the other way.

The one call that held up: **relational tests would not have caught PRM drift.** Every page
9 test asserts consistency against whatever `PAGE9` holds rather than pinned values, so a
rerun that moved the detection rate would pass. That is the right default for numbers meant
to be replaceable, but it means a republish needs a human diff. This document is that diff.

---

## 9. Cost, as measured

| Stage | Time | Hardware |
|---|---|---|
| `FULL` (computes scores) | ~3 min | RTX 5080, weights cached; +15.3 GB on a first run |
| `REPLAY` (re-derives, writes artifacts) | ~20 sec | none |

`REPLAY` was previously incapable of producing the PRM half at any cost.
