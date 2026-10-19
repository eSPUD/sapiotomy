# Page 5 rework: handoff

Written 2026-10-18 on the Linux machine, for the session continuing page 5 on the Mac. Read this
first, then [page_5_rework_plan.md](page_5_rework_plan.md) (decisions and history) and
[page_5_expanded_solutions.md](page_5_expanded_solutions.md) (the approved worked examples).

## 1. Hard rules from the author

1. **Never merge into `main`.** Said emphatically on 2026-10-18. Merging `main` *into* another
   branch is a different operation; ask before doing either.
2. Page 5 is reworked on a new branch, `dev/page-5-refinement`, branched from `act-2-redesign`
   once `act-2-redesign` holds the latest page 5 to 7 work (section 6).
3. Section 3's prose waits for a discussion with the author. Do not draft it unasked.
4. Page style rules (author memory): no em dashes anywhere in visible copy (a test bans them on some
   pages), no bare "—" in table cells, references beside the figure they support, margin notes are
   one imperative sentence, no literature retelling. Page notebooks: plain prose saying what each
   step does; no justification, history or advice.
5. Commit only when the author asks or at an agreed checkpoint. Never push without asking.

## 2. What page 5 becomes

From Shashank's outline, as decided with the author:

| Section | Shows | Data |
|---|---|---|
| 1 | The few-shot CoT prompt (five expanded worked examples) followed by three test problems: one easy, one medium, one hard. The reader cycles through them. Prompts only, unless the author asks for replies. | few-shot run |
| 2 | Base Qwen2.5 1.5B, 3B, 7B: zero-shot against few-shot CoT on the same 495 problems. Figure first, then prose explaining Shashank's sentence (quoted in the plan doc). | few-shot run |
| 3 | Instruct models reasoning with no examples, against base few-shot CoT. **Wait for the author.** | both runs, paired on 495 |
| 4 | Instruct models asked to give only the final answer, against their default. Keep the old section 3's chart **almost exactly**: only the numbers change. | instruct run |

Old sections 1 (System 1 / System 2 chat), 2 (3B stacked bars) and 4 (token cost) are cut.
Section 1 used to define "System 1" and "System 2"; if section 4 keeps those words, they need
defining again somewhere, or section 4 says "reasoning" and "direct answer" instead.

**Section 1's three problems**, by the rule "the first test problem in MATH-500 order at levels 1,
3 and 5, skipping problems with an `[asy]` diagram" (fixed before looking at any results; confirm
with the author):

| Level | Problem | Answer |
|---|---|---|
| 1 | `test/intermediate_algebra/134.json`: Compute $1-2+3-4+5- \dots +99-100$. | $-50$ |
| 3 | `test/algebra/2584.json`: $f(x) = \frac{3x-2}{x-2}$, find $f(-2)+f(-1)+f(0)$. | $\frac{14}{3}$ |
| 5 | `test/intermediate_algebra/1994.json`: $p = \sum 1/k^2$, $q = \sum 1/k^3$; write $\sum_j\sum_k 1/(j+k)^3$ in terms of $p, q$. | $p - q$ |

## 3. The two runs (both finished, both in the repo)

Both on a Colab A100, bf16, greedy, `repetition_penalty=1.0`, 1024-token limit, answer = first
`\boxed{}` graded with `math_verify` (a reply with no box is wrong). Raschka's `grade_answer` is
**not** used on page 5.

**Few-shot run.** `notebooks/page_5_few_shot.ipynb` (committed `75c9273`), traces
`notebooks/traces/page_5/few_shot.jsonl` (2,970 records). Base Qwen2.5-1.5B, 3B, 7B; arms
`zero_shot` and `few_shot`; 495 problems (MATH-500 minus the five example problems, chosen by
seed-42 shuffle, one per level: `precalculus/697`, `algebra/101`, `geometry/178`,
`number_theory/769`, `number_theory/612`). The few-shot prompt is `Problem:\n…\n\nSolution:\n…`
five times, then the test problem; 3,700 tokens before the test problem. The worked solutions
were written for this experiment by Claude, expanding MATH's own solutions, approved by the
author and committed before the run (`91b912b`, sha256 `f41c1965…bfa8`, asserted by the
notebook; checks in `notebooks/check_page_5_few_shot_solutions.py`). The page may say "worked
solutions written for this experiment, expanding MATH's own solutions."
Record fields: `model, arm, unique_id, level, gold, reply, extracted, correct, tokens,
truncated, boxed, wrote_code, batch_size`. The 7B few-shot arm halved its batch to 32 after an
out-of-memory error (239 replies); recorded per reply.

**Instruct run.** `notebooks/page_5_instruct_reasoning.ipynb` is committed **exactly as run**
(the author's `5_CoT_rerun`, outputs included); tidying it is task 1 below. Traces
`notebooks/traces/page_5/instruct_reasoning.jsonl` (3,000 records: the run's
`math500_raw_responses.json` converted to JSONL, verified identical record by record).
Qwen2.5-1.5B/3B/7B-Instruct, all 500 problems, Qwen's default system prompt, batch 128 in dataset
order. User turn: the problem + `\n\nPut your final answer within \boxed{}.`; Direct adds
` Give only the final answer. No explanation, no working, no other text.`
Record fields: `model` (short name, e.g. `Qwen2.5-7B-Instruct`), `unique_id, mode`
(`CoT`/`Direct`), `difficulty_level, problem, ground_truth, raw_generated_response,
extracted_answer, is_correct` (0/1), `generated_tokens_count, truncated`.

Both trace files were audited: no duplicates, re-grading reproduces every stored verdict, and the
few-shot notebook that ran is line-for-line the committed one.

### The numbers (% correct on the same 495 problems)

| Size | Base zero-shot | Base few-shot CoT | Instruct CoT | Instruct Direct |
|---|---|---|---|---|
| 1.5B | 22.8 | 37.6 | 56.2 | 13.3 |
| 3B | 30.7 | 43.2 | 64.2 | 18.0 |
| 7B | 49.7 | 54.9 | 74.9 | 27.5 |

- Few-shot vs zero-shot, paired (few-only / zero-only, exact McNemar): 96/23 p≈8e-12; 112/50
  p≈1e-6; 89/63 p≈0.04.
- Instruct CoT vs base few-shot, paired: 134/42, 117/13, 117/18; all p < 1e-11.
- 7B by level 1 to 5, zero-shot → few-shot: 73.8→88.1, 60.7→79.8, 64.4→63.5, 45.7→44.9,
  27.1→30.8. The gain is on easy problems; hard ones hold level.
- Median reply tokens, zero → few: 212→228, 289→213, 425→223. Replies with no box: 175→91,
  178→71, 104→40. Zero-shot base replies often write Python and invent its output (7B: 265 of
  495); few-shot replies never do.
- Instruct, on all 500: CoT 56.0 / 64.4 / 75.0, Direct 13.2 / 18.2 / 27.4. Direct replies of 40
  tokens or fewer: 99.4%, 98.6%, 100%. CoT replies cut off at 1024 tokens: 39, 62, 36.
- The old section 3 headline still holds: the 1.5B reasoning (56.2) solves about twice what the
  7B does answering directly (27.5); every model reasoning beats every model answering directly.

## 4. Section 3: what is known, for the discussion

The author's thesis: few-shot's efficiency matters, how expanded and detailed each example is
directly affects accuracy, and post-training bakes the reasoning into the weights, removing that
dependence. The published runs show: few-shot puts 3,700 tokens in front of every question
(instruct needs about 30); it trails post-training by about 20 points at every size; its gain
shrinks with size (+14.8, +12.5, +5.2).

That example wording moves accuracy was measured only in runs that are **not** published and
were dropped: the same five problems with MATH's short solutions (7B 43.8) and with
Qwen2.5-7B-Instruct's replies (7B 71.7; circular, since the examples are the post-trained model's
own output). The author decided on 2026-10-18 **not** to add the short-solution arm to the
notebook. So the page cannot cite our numbers for that claim; how to phrase it is the open
question. Those traces exist only on the Linux machine (`~/Downloads/traces(2).json`,
`traces(1).jsonl`) and in the author's Drive.

## 5. Tasks, in order

**Task 1. Tidy `page_5_instruct_reasoning.ipynb`.** Keep everything that shapes a reply
identical: models, the two prompt suffixes, chat template, `tokenizer(…, padding=True)`, batch
128 over the 500 problems in dataset order, `model.generate(max_new_tokens=1024,
do_sample=False, temperature=None, top_p=None, top_k=None, repetition_penalty=1.0)`, the token
count up to the first end-of-turn or pad id, `extract_answer` (stop phrases `Difficulty Level:`
and `\nProblem:`) and `grade`. Change only:
- markdown in the plain style of `page_5_few_shot.ipynb` (the current text still mentions a
  "target difficulty level" and "sample size");
- Drive mount kept, output to `MyDrive/page_5_instruct_reasoning/`;
- append each batch to `traces.jsonl` with the same record fields, and on restart skip whole
  batches already saved, so batches stay identical after a disconnect;
- replace the pandas, seaborn and heatmap cells with a summary (`summary.json`) and two charts,
  as in the few-shot notebook.
Check: run the original cell and the tidied code on CPU with a tiny setting (1.5B-Instruct, 4
problems, batch 2, 48 tokens) and assert identical records; then simulate a disconnect (cut the
file mid-line) and assert the resumed file matches an uninterrupted one.

**Task 2. Combination script, `notebooks/page_05_site_data.py`.** Serves page 5 only; computes
nothing the notebooks did not. Reads the two trace files, `page_5_few_shot_solutions.json` and
MATH-500; asserts both runs cover the same 495 problems (the instruct run also has the five
example problems, which are excluded), no duplicates, and the solutions hash; writes
`web/data/page-05-derived.json` with: provenance (notebook names, sha256 of each trace file and
of the script, solutions hash, decoding, grader); section 1 (the five examples' problem and
solution text in prompt order and the three test problems); per model and arm: n, correct,
accuracy, accuracy by level, median tokens, truncated, unboxed; paired counts for the three
comparisons; Direct short-reply share; section 4's per-size Direct and CoT accuracy. Replace the
old `page-05-derived.json` and rewrite `web/src/lib/page05.ts` in the same commit on the page
branch (the old loader reads `claims` gates from the retired 100-problem run). Follow
`notebooks/page_06_site_data.py` for conventions.

**Task 3. Branches** (section 6), before any page edits.

**Task 4. Rebuild `web/src/components/pages/Page5.tsx`** sections 1, 2 and 4 and
`Page5.test.tsx` (pin every number in the prose against the data). Section 4 reuses the old
`FloorChart` with the new numbers. Screenshot before committing.

**Task 5. Downloads.** The button links both notebooks (copy them into `web/public/notebooks/`).
Remove `web/public/notebooks/5_CoT.ipynb`: it is a version of the superseded instruct notebook
(Direct instruction in a system prompt), not either run above.

**Task 6. Docs.** `notebooks/README.md` and `web/data/PROVENANCE.md`: page 5 grades with
`math_verify`, not Raschka's harness; its runs, traces and site-data script. Decide with the
author whether `notebooks/page_05_how_to_reason.ipynb` (the retired run) stays.

## 6. Branch state, checked 2026-10-18 on the Linux machine

| Branch | Relative to `main` | Relative to `act-2-redesign` |
|---|---|---|
| `act-2-redesign` (local `a86a068`, 2 commits ahead of `origin`) | fully contained in `main` | |
| `main` (`6129bc9`, latest page 5 work up to 2026-10-14) | | 54 commits ahead |
| `dev/page-6-refinement` (local `ff5e7f3`; `origin` `a64b634` is 4 commits further) | both fully contained in `main` | +8 / +12 |
| `dev/page-7-refinement` (`586a464`, pushed) | **10 commits not in `main`**; a trial merge of `cd138d2` with `main` was clean | +56 |
| `wip/page-7-section-4` | 6 not in `main`; rebased copies of page 7 commits plus one "local, not for push" WIP that looks superseded by `bd6eed4` | |
| `origin/dev/page-8-refinement` | 19 not in `main`; merges an older page 7 | |
| this branch, `claude/page-5-rework-new-data-556ad7` | `main` + the page 5 commits | |

So `act-2-redesign` holds neither the latest page 5 nor page 6 work; `main` does. The author wants
`dev/page-6-refinement` and `dev/page-7-refinement` committed and merged into `act-2-redesign`,
then `dev/page-5-refinement` branched from it. Confirm the exact steps with the author before any
merge; never merge into `main`.

**Page 7's uncommitted work is now committed and pushed** as `586a464` on
`dev/page-7-refinement` (section 3 as a line per temperature from the sweep; work in progress from
2026-10-15, committed as found; page 7's tests passed). This branch is pushed as
`origin/claude/page-5-rework-new-data-556ad7`.
