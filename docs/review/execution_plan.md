# Execution plan — reconciling the review notes against `forward_plan.md`

Status: **awaiting approval**. Written 2026-08-09.

Sources: `docs/review/pages_1_through_14_analysis.md` (F-numbers),
`docs/review/pages_15_19_refinement.md` (page.number IDs), `docs/review/forward_plan.md`
(59 numbered items merging both).

Baseline verified before planning: `npm install` in `web/` (deps were absent in this
workspace), then `npx vitest run` → **49 files, 721 tests, all green**.

---

## 1. Reconciliation

The notes address the 1–14 analysis. `forward_plan.md` merges 1–14 **and** 15–19, so the
notes leave part of the plan unspoken. Mapping every one of the plan's 59 items:

| Disposition | forward_plan items | Count |
|---|---|---|
| **Fix this pass** (notes confirm) | 2, 3, 5, 6, 7, 8, 9, 22, 23, 24, 25, 26, 34, 41*, 42*, 45, 46, 47, 51 | 19 |
| **Defer to a refactor doc** (notes direct) | 4, 10, 11, 17, 28, 29, 30, 31, 32, 39, 40, 43 | 12 |
| **Drop** ("ignore minor fixes of pages 1–4") | 55, 56, 57 | 3 |
| **Notes silent — pages 15–19** | 1, 12, 13, 14, 15, 18, 19, 20, 21, 33, 35, 36, 37, 38, 48, 49, 50, 59 | 18 |
| **Notes silent — deck-wide / page 12** | 16, 27, 52, 53, 54, 58 | 6 |

\* Items 41 and 42 are page-13 findings; per the notes they move to `page_13_refactor.md`
rather than being fixed, so they count as deferred in substance.

### F-number roll-up of what the notes put in scope

- **Fix:** F2, F3, F4, F6, F7, F8, F10, F11, F12 (+ *"the PRM was used as an ORM"* must be
  explicit), F13, F19, F31, F32, F54–F63, F64 (explore), F65–F79 (F76 + *"say explicitly we
  ran no results for page 10, and why"*), F80–F85.
- **`act_1_refactor.md`:** F1, F5, F20, F21, F22, F23, F24, F25, F26, F27, F28, F29.
- **`page_13_refactor.md`:** all remaining page-13 Fs — F17, F18, F91, F92, F93, F94, F95, F96.
- **`page_14_refactor.md`:** F14, F15, F16, F33 (+ the DeepSeek-R1-Distill-Qwen-1.5B / 7B run).
- **Ignore:** F34–F51 (pages 1–4 minors).

---

## 2. Three places the notes and the plan disagree

Each needs a yes/no before Wave 0 is written.

### (a) F1 is a page-12 finding, not an Act 1 one

The notes send F1 to `act_1_refactor.md`. F1 is *"page 12 has zero reader-driven
interaction and never answers its own bolded lede question."* Page 12 opens Act 3.

The plan ranks it **blocking, effort S**: `StarLoop` already implements the key-off state
(`Page12.tsx:275-289`); the page hard-wires `<StarLoop filter />` at `:458` and
`Page12.test.tsx:33-39` pins the absence of a toggle. The fix is a prop and a test edit.

**Recommendation:** fix it now (~1h) and defer only F90 — the deeper problem that page 12
is the one Act-2/3 boundary page with no measurement of its own — to a refactor doc.
Otherwise say which doc it belongs in and it goes there untouched.

### (b) F14 and F15 are false as written, and both are one sentence

The notes send them to `page_14_refactor.md`.

- F14: the lede credits R1 with *"no worked examples at all"*. Only R1-Zero had no SFT
  warm-up. The page states it correctly at `:885-887` and corrects itself ~700 words later
  at `:1129-1131`, never joined to the lede.
- F15: the closing block says *"71.0% on AIME, level with o1-0912"*. The page states it
  correctly at `:1024-1029` — the match is cons@64 at 86.7%, ~64× the answer-time compute.

Both are corrections to statements the page already makes correctly elsewhere. Deferring
them ships two known-false claims on the deck's most quotable page, and F15 is the sentence
the reader carries into page 15.

**Recommendation:** fix F14 and F15 now; defer F16 (the undisclosed authored length series)
and F33 (needs new data), which genuinely need design.

### (c) F5 has a cheap half and an expensive half

The notes send F5 to `act_1_refactor.md`. Agreed for the expensive half — making page 2's
System 2 comic stop closing the gap the prose says thinking cannot close is a redesign.

But the falsity is one word. Page 3 closes *"which leaves **only** what it does after it"*
(`Page3.tsx:561-566`), and page 2's own panel 3 fetches a document. One clause naming
retrieval and scoping it out removes the refutable "only" in ~20 minutes.

**Recommendation:** take the one-clause version now; comic redesign to `act_1_refactor.md`.

---

## 3. F64, explored

*"Give the reader a control that adds a voter"* — the plan rates this **L** and the analysis
calls it structural. Checked against the data: it is not L.

`web/data/page-07-derived.json` already carries the axis:

- `manifest.pile.n_axis = [1, 2, 4, 8, 16]`, `n_resamples: 64`,
  `axis_rule: "a point at N is the mean over random N-subsets of the same pile"`
- `figure_2.pile` holds one series per temperature (5 of them: 0.0, 0.3, …), each with a
  point at every N carrying `accuracy`, `coverage`, `tie_rate`, `single_chain_accuracy`,
  `mean_distinct`, `mean_tokens`, `truncated_rate`, `n_draws`.

Page 7 already imports this file. So "does the vote still beat one chain at N = 4?" — the
exact question F64 says the reader cannot ask — is answerable from data already in the
bundle. It is a slider over a measured axis, not a new experiment.

**Revised effort: M.** Confirmed against the data file; still to confirm against
`Page7.tsx`'s existing chart components before committing to it. Bonus: an N control makes
F65 (the T = 0.3 vs T = 0.6 tie) inspectable rather than a wording patch, since the
temperature series are in the same structure.

---

## 4. The plan

Serial estimate, one agent (me). Waves 1 and 2 parallelize near-perfectly across pages —
each page is an independent `.tsx` + `.test.tsx` pair — so fanning out to subagents cuts
the total to roughly a third. **Not doing that without an explicit go-ahead.**

### Wave 0 — the three refactor docs (~1.5h, no code)

Written first so they are available for the mentor conversation while code work proceeds.

- **`docs/act_1_refactor.md`** (new) — F5, F20, F21, F22, F23, F24, F25, F26, F27, F28, F29,
  plus F1 pending (a).
- **`docs/page_13_refactor.md`** (exists, 150 lines, the pre-ship refactor) — append a dated
  *Post-review findings* section: F17, F18, F91, F92, F93, F94, F95, F96. F2, F3 and F6 stay
  in the fix queue per the notes.
- **`docs/page_14_refactor.md`** (new) — opens with F14, F15, F16 as directed, then F33 with
  the distill run spec, then F97–F105 unless those are wanted elsewhere.

**F33 run spec** (written, not executed): DeepSeek-R1-Distill-Qwen-1.5B and -7B on the deck's
own harness. The item set is already pinned — `9ab2b579…`, MATH-500 L4/L5, n = 100, the same
set pages 6 and 7 measured (`manifest.items.same_as_page_6: true`) — which is exactly what
makes a measured distill run worth more than the published MATH-500 column. The spec will
name models, decoding, harness version, gates, and what the page claims in both branches:
if the 32B/70B kink survives on this harness, and if it reverses. **No GPU time is spent
until that is separately approved.**

### Wave 1 — false and reader-checkable (~1 day)

Ordered by how fast a reviewer catches it.

| | Finding | Page | Change |
|---|---|---|---|
| 1 | F13 | 6 | Intersection, not difference of totals: 45 → **46**. `Page6.tsx:1502-1509` + test |
| 2 | F7 | 7 | "will refuse to continue" → "continuing does not buy anything" |
| 3 | F8 | 10 | "a verifier" → the model's own confidence, in all three places |
| 4 | F6 | 13 | "they do not substitute" — say what the parametrization actually does |
| 5 | F3 | 13 | Waterfall → three parallel readings (M; prerequisite for page 15) |
| 6 | F2 | 13 | Fidelity note names the joint two-axis law itself as authored |
| 7 | F4 | 8 | Unmeasured verifier off-axis; reword "cannot solve a single one of these" |
| 8 | F12 | 8 | Disclose the rebuild **and** state plainly that the PRM was read as an ORM (final-token score only) |
| 9 | F10, F11 | 9 | "were sound" → "not disproved"; disclose the threshold fitted on the checker's labels |
| 10 | F19 | 11 | Soften the ownership bands to what a ±3-point by-eye digitization supports |

Plus, if (b) and (c) are approved: F14, F15 (page 14) and the F5 one-clause (page 3).

### Wave 2 — per-page wording sweeps (~1.5 days)

One pass per page, tests updated in the same commit.

- **p5** — F54 (raw `bare` key, bare "conservative"), F55 (Kojima phrase), F56 (hedge the
  4.7× callout). F57 is opinion/structural; noted, not built.
- **p6** — F58 (legend swatch), F59 (censored median), F60 (tautological inset), F61
  (null stated as mechanism), F62 ("roughly double"), F63 (slab annotation scope).
- **p7** — F65 (T = 0.3/0.6 tie), F66 ("no cheaper way to buy it").
- **p8** — F67 (mixed provenances on figure 3's x-axis), F68 (43% vs 45.6%), F69 (unnamed
  heuristic scorer), F70 (judges stronger than the generator), F71 (assert-and-withdraw).
- **p9** — F72 (clustering, not just sample size), F73 (localisation band), F74 (specimens
  never disagree with the PRM), F75 (index used as a count).
- **p10** — F77 ("the more expensive half"), F78 ("the two middle bars"), F79 (concede that
  DFS and MCTS also do not survive a real tree).
- **p11** — F80 (band painted where only one series has data), F81 (1×/2×/4× → 1×/6.8×/29×),
  F82 (hedge Shojaee), F83 (gloss FLOPs at first use), F84 (structural — the difficulty
  control changes the population, it does not allocate; **scoping note, see below**), F85
  (positional; disclosure judged adequate — recommend no-op, will confirm).

### Wave 3 — F76 and F64 (~1 day)

- **F76** — package `notebooks/page_10_search_arm.ipynb` and
  `notebooks/page_11_training_vs_scale.ipynb` into `web/public/notebooks/` and link them.
  `notebooks/page-10-search-arm.zip` already exists and was simply never copied across.
  Plus the notes' addition: state on page 10 that **nothing on it is a measurement, and
  why**. These pull in opposite directions and the copy must do both — the honest form is
  "this page has no run of its own; here is the notebook that shows why we could not make
  one", which also discharges F79 (of the five strategies, only beam survives contact with a
  real reasoning tree).
- **F64** — the N control on page 7, per §3.

### Wave 4 — the documents of record (~0.5 day). Must run last.

- **F31 `PROVENANCE.md`** — five files assigned to pages that do not import them; no rows for
  `page-05..09-derived.json`, `star-cqa`, `tot-crosswords`, `neural-degeneration`,
  `chinchilla`, `epoch-dataset-projection`, `deepseek-pricing`; stale page columns on 13, 15,
  17, 19. Must also describe whatever Wave 3 adds.
- **F32 `SUBMISSION.md`** — "Twenty pages", the collapse debate mapped to P19, the ±1.0pp
  fidelity claim (false for page 11), page 6 listed as live-inference, and "every on-screen
  number traces to a cited primary source", which *understates* pages 5–9 where the numbers
  are the deck's own measurements.

### Wave 5 — verification (~0.5 day)

`npx vitest run`, `npm run typecheck`, `npm run build`, `npx playwright test` including the
axe loop. Diff review against `origin/main`.

---

## 5. Open decisions

Outside the notes; flagged rather than silently dropped.

1. **Item 16 / F30 — two guaranteed CI failures.** `web/tests-e2e/act2search.spec.ts:4-20`
   targets four selectors from the obsolete page numbering; none exists in `Page13.tsx` or
   `Page14.tsx`. A reviewer who runs the suite concludes 13 and 14 are broken. ~20 minutes,
   and the axe loop in the same file survives. **Recommend doing it.**
2. **Pages 15–19 — 18 of the plan's 59 items, entirely unaddressed by the notes.** Includes
   item 13 (page 19 cites the wrong page number *and a test pins the mistake*), item 15
   (page 17 is the only page 1–19 with no test file, which is how items 1 and 14 survived),
   and item 18 (the deck's ending, rated L). This pass, a separate `act_3_refactor.md`, or
   another workspace?
3. **Four small orphans.** F9 (page 11's unhedged "only parameters create it", refuted by
   page 12 — S); item 54 (delete the dead page-20/21 surface: `sandbox.ts`, `quiz.ts`,
   `Quiz.tsx`, `scoreboard.ts`, `frontier.ts`'s Hanoi block, `REACT_CITATION`, stale
   docstrings — S); F52 (`aria-live` on pages 7–11 — M, and this is an a11y venue); F53
   (em-dash guard on pages 3, 12, 15–19 — M).
4. **Three items in the notes' ranges are not wording fixes.** F57 (page 5 has no
   predict-observe-explain beat), F64 (handled — §3), F84 (page 11's difficulty control does
   not allocate). F57 and F84 are page redesigns. Default: document them in the relevant
   refactor doc rather than build them under a deadline.
5. **The deadline itself.** Not stated. The wave order above is severity-first, so it
   degrades gracefully — but knowing the date decides whether Waves 3–5 fit and whether it
   is worth fanning out to subagents.
