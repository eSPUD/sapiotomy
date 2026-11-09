# Page 5 rework plan

From Shashank's guidance for page 5 (CoT), decided by the author 2026-10-15 to 2026-10-18. Two
notebooks re-populate the page, and the download button links both:

- `notebooks/page_5_few_shot.ipynb`: base models, zero-shot against few-shot CoT. Built and
  committed; the author runs it on Colab.
- `notebooks/page_5_instruct_reasoning.ipynb`: instruct models, reasoning against direct answer.
  Its run is done (`5_CoT_rerun`, below); the notebook is still to be tidied and committed.

## Shashank's outline

1. Show 3 few-shot prompts, switch to see one at a time.
2. Inference-time solution with base models: zero-shot versus few-shot, base models of 3 sizes,
   accuracy on MATH-500. Build the understanding: "By providing the step-by-step intermediate
   logic in the examples, you force the model to generate its own reasoning pathway before
   committing to a final answer. This prevents the model from hallucinating a final state because
   it has to calculate the state sequentially."
3. Post-training solution: instruct models of three sizes do better than few-shot solutions.
4. Ask instruct models of three sizes not to reason, and show the effect.

## The page after the rework

Old sections 1 (the System 1 / System 2 chat), 2 (the 3B stacked bars) and 4 (token cost) are
cut. Old section 3 ("Smaller reasoning models do better than larger non-reasoning models") becomes
section 4, redrawn from the new run.

| Section | Shows | Data |
|---|---|---|
| 1 | The few-shot CoT prompt (five expanded worked solutions) with three test problems, chosen by a fixed rule before any results are seen. The reader cycles through them. | `page_5_few_shot` |
| 2 | Base Qwen2.5 1.5B, 3B, 7B: zero-shot against few-shot CoT on the same 495 problems. The figure comes first, then the prose explaining Shashank's sentence. | `page_5_few_shot` |
| 3 | Qwen2.5-Instruct 1.5B, 3B, 7B reasoning with no examples, against their base models with few-shot CoT. | both, paired on the 495 |
| 4 | The same instruct models asked to give only the final answer, against their default. Same chart shape as the old section 3. | `page_5_instruct_reasoning` |

## Decisions

- **Examples:** five MATH-500 problems, one per level, chosen by shuffling with seed 42 and taking
  the first of each level (`precalculus/697`, `algebra/101`, `geometry/178`, `number_theory/769`,
  `number_theory/612`). The test set is the other **495**.
- **Worked solutions:** written for this experiment, expanding MATH's own solutions: the same
  method and plain style, with the skipped steps written out. Drafted by Claude without
  consulting the test problems or any results, checked by
  `notebooks/check_page_5_few_shot_solutions.py`, approved by the author 2026-10-18 and committed
  before any run (sha256 `f41c1965…bfa8`, asserted by the notebook). The page may say "worked
  solutions written for this experiment, expanding MATH's own solutions."
- **Base setups:** zero-shot and few-shot CoT only.
- **Instruct setups:** Qwen's default system prompt, the problem, then "Put your final answer within
  \boxed{}." Direct adds "Give only the final answer. No explanation, no working, no other text."
  No examples.
- **Grader:** `math_verify` on the first `\boxed{}` (Raschka's `grade_answer` is not used on this
  page). A reply with no box is wrong.
- **Decoding:** greedy, bf16, a 1024-token limit for every setup, repetition penalty 1.0.
- **Data:** traces of both runs are stored in the repo. A combination script pairs them on the
  495 and writes the page's data. `derived.json` is not offered as a download.

## Open

- Tidy `5_CoT_rerun` into `page_5_instruct_reasoning.ipynb` and commit it with its traces.
- The combination script and the page rebuild, after the few-shot run lands.
- The rule that picks section 1's three test problems.
- `notebooks/README.md` says grading comes from Raschka's harness. Page 5 is the exception.

## Runs

- **Instruct rerun** (`5_CoT_rerun`, 2026-10-18), 500 problems, % correct on the 495:
  CoT 56.2 / 64.2 / 74.9, Direct 13.3 / 18.0 / 27.5 (1.5B / 3B / 7B). Direct replies of 40 tokens
  or fewer: 99.4%, 98.6%, 100%. CoT replies cut off at 1024 tokens: 39, 62, 36.
- **Superseded instruct run** (`5_CoT`): Direct put its instruction in a system prompt with a
  128-token limit, so the 1.5B and 3B often ignored it and were cut off; the checkpoints'
  repetition penalty (1.05 to 1.1) was left on and token counts were batch lengths.
- **Earlier base run** (`5_CoT_FewShotPrompting`, `traces.json`): zero-shot and five-shot with
  MATH's own solutions. Accuracy 24.0→25.3, 29.5→37.8, 51.1→46.3.

## Why MATH's solutions made the 7B worse (2026-10-18)

Measured on the earlier base run.

- **Easy problems up, hard problems down.** 7B zero-shot → five-shot by level: 71.4→81.0,
  65.2→68.5, 66.3→58.7, 47.2→36.2, 27.1→20.3. Median reply length falls to about a third (level 5:
  633→224 tokens). MATH's solutions are terse, and the model copies their length.
- **The loss sits on the problems where the 7B writes code.** Zero-shot, it writes Python in 268 of
  495 replies (never run, with invented output). On those problems the examples cost 11.6 points;
  on the other 227 they help. With examples it never writes code.
- **For the small models, much of the gain is format.** Replies with no `\boxed{}`, zero-shot →
  five-shot: 176→98 (1.5B), 179→60 (3B), 101→53 (7B). Counting unboxed "The answer is: X" replies
  would add at most 3.4 points, so strict grading stays.

A test that put Qwen2.5-7B-Instruct's replies in place of MATH's solutions raised all three base
models by more than 20 points (7B: 43.8 → 71.7). It was dropped: examples written by the
post-trained model make the section 3 comparison circular. It motivated the expanded worked
solutions above.
