# Page 5 notebook — fix plan

**Status:** plan only. Addresses six review problems plus one blocking error from the first
`QUICK` run, and one defect found while diagnosing them.

---

## The blocking error: no usable exemplars

**Not a code bug.** The harvest failed because `QUICK` asks the weakest model, with thinking
off, to solve eight of the hardest problems in the set. Zero solved is the expected outcome.

Here is the actual `QUICK` held-out pool, drawn with `SEED = 123`:

| Level | Problem |
|---|---|
| L4 | product of two cubics, solve for two coefficients |
| L5 | sum of all complex solutions of a rational equation |
| L5 | piecewise function, composition |
| L4 | altitudes of a triangle, angle chase |
| L4 | complex Mobius iteration, find `z_n` |
| L5 | regular tetrahedron, area of a parallel cross-section |
| L4 | two-bag colour probability |
| L5 | degree of a symmetric polynomial in three distinct reals |

Qwen3-0.6B **with `enable_thinking=False`** has no chain to reason with beyond what the prompt
induces. The harvest then filters further to correct *and* untruncated *and* under 400 tokens.
Expected yield: zero.

### The fix: exemplars come from levels 1 and 2

Evaluate on hard problems, demonstrate with easy ones.

MATH-500 carries 43 level-1 and 90 level-2 items, **133 problems currently unused**, because
section "The item set" filters everything to levels 4 and 5 before splitting.

This is right on four independent grounds, not just availability:

- **It is what few-shot chain of thought actually is.** The canonical exemplars are simple
  worked problems. Nothing about the technique requires the demonstration to match the
  question's difficulty, and matching it is the unusual choice, not the default.
- **The spec permits it.** §3 says the exemplars are "held-out problems the model already solved
  correctly under the zero-shot CoT rung." It never says they share the eval band.
- **It makes the page better.** The exemplar is rendered verbatim in the "see full prompt"
  disclosure, so a short, legible worked example is worth more to a reader than a page of
  intermediate algebra.
- **Disjointness becomes structural.** Different levels entirely, so the pool cannot leak into
  the eval set by accident. The existing assertion stays as a belt-and-braces check.

**Changes:** split the item set into an eval pool (levels 4 and 5) and an exemplar pool (levels
1 and 2) before sampling. Raise `n_pool` for `QUICK` from 8 to 12, which is cheap on easy items
because their solutions are short. Keep `MAX_EXEMPLAR_TOKENS` at 400; on level 1 and 2 it will
rarely bind.

**Keep the hard `RuntimeError`.** Authoring exemplars by hand is the one thing this page cannot
do, so failing is correct. Rewrite the message to report the pool's solve rate and name the two
real levers (`n_pool`, model size) rather than implying the operator did something wrong.

Add a printed solve rate for the pool regardless of outcome, so a near-miss is visible before
it becomes a failure on the next run.

---

## Problem 1 — model loading has no progress

`from_pretrained` only shows a bar when a checkpoint has several shards. Qwen3-0.6B is one
file, so the reader watches a blank cell and cannot tell downloading from loading from hanging.

**Plan, three visible stages:**

1. **Download with `snapshot_download` first.** `huggingface_hub` renders a real per-file
   progress bar with sizes and rates. Then point `from_pretrained` at the local directory, so
   the network phase is separated from the load phase instead of hidden inside it.
2. **Stage prints with elapsed time** around load and device transfer: resolving, loading
   weights, moving to `{device}`, each reporting its own seconds. Cheap, and it turns a blank
   wait into a readout.
3. **A warm-up generation** of a few tokens, with its own timing line. It absorbs the one-off
   CUDA and kernel-compilation cost that would otherwise be charged to the first real
   generation, and it proves the model answers before the sweep commits an hour to it.

Report parameter count, dtype and device on one line at the end, and on CPU add the measured
warm-up tokens per second plus a projected sweep runtime. That replaces the README's estimated
runtimes with a number measured on the machine actually running it.

**Also add `tqdm` to the sweep loops.** The current `\r` print carries an ETA but no bar, and it
is the part of the notebook that runs for hours. One bar per rung, with the running accuracy in
the postfix.

---

## Problem 2 — are the grader and item-set cells pulling their weight?

**Different answers for the two cells.**

**The grader checks: keep, compress.** They are not decoration. They are what licenses the
claim that grading is not ours to defend, and they are a real version tripwire: if a future
`grade_answer` stops accepting a LaTeX fraction against a decimal, every accuracy number on the
page shifts and nothing else in the notebook would notice. The one check specific to this page
is "wrote a chain but boxed the answer", which is precisely what the CoT rungs produce.

What is wrong is the presentation: seven cases printing seven lines of `extract=... truth=...`
reads like a test suite that escaped into the document. Collapse to a single line, `grader
preflight: 7/7 as expected`, and print the table only on failure.

**The item-set cell: keep as-is, but it is mislabelled.** It is not a verification at all. It
loads the dataset, filters, shuffles, splits eval from held-out, and computes the hash that
makes "same items" checkable. That is the experiment being defined. Nothing here can be
removed. The confusion is the section heading reading like a check when the cell is setup, so:
rename to make the split its subject, and shorten the printout to the two facts that matter,
the split sizes and the hash prefix.

---

## Problem 3 — "Proof that thinking is off" is unreadable

Two `repr()` dumps of a full chat template, and the reader is expected to spot the difference.
The cell proves the constraint but demonstrates nothing.

**Plan: show the difference, not the two strings.**

- Print only the **tail** of each rendering, from the last user token onward. That is where the
  templates diverge; everything above it is identical boilerplate.
- Put the two tails on labelled adjacent lines with the divergence marked, so the pre-closed
  `<think>\n\n</think>` is visible as the thing that changed.
- Replace `repr()` with a rendering that shows `\n` as a visible glyph, since the pre-closing is
  literally a newline arrangement and `repr` buries it in escapes.
- Add one asserted, plain-language conclusion: the OFF template ends with a **closed** think
  block, so the model has nowhere to reason. Assert `<think>` and `</think>` are adjacent in the
  OFF rendering and absent from the ON one, rather than only comparing the strings for
  inequality.

One sentence above the output telling the reader what they are about to look at, and what would
be true if we had cheated.

---

## Problem 4 — the generation loop's output, and a defect behind it

The output was:

```
2 tokens, truncated=False, thinking_leaked=False
tokens: ['2', '']
text: 2
```

Three separate things are going on, and one of them is a bug.

**The empty trailing token is a defect, and it matters.** That `''` is the end-of-turn token
decoding to nothing under `skip_special_tokens=True`. Page 5's `generate` never strips it, so:

- `tokens_generated` is **inflated by one on every record**, and token counts are this page's
  entire cost axis and its handoff to page 6;
- the `tokens` list ends in an empty string, which the page's reveal animation would step
  through as a token that renders nothing.

Page 6's notebook already handles this (`while gen_ids and gen_ids[-1] in EOS_IDS: gen_ids.pop()`).
Page 5 needs the same, derived once next to the thinking-toggle checks.

**The wrong answer is probably not a bug.** A 0.6B with thinking disabled answering "2" to
"What is 2+2?" is disappointing but plausible; it may be echoing the first operand. The real
problem is that **the output gives the reader no way to tell a weak model from a broken
harness**, which is the only question a smoke test exists to answer.

**Plan:** make the smoke test diagnostic. Print the exact prompt as sent after templating, the
raw token ids beside their decoded strings, whether generation stopped on end-of-turn or hit the
cap, and expected against got with a plain verdict. Add a second probe whose answer a 0.6B
cannot miss, so a failure on both means the harness, and a failure on one means the model.

**Also add `add_special_tokens=False`** to the tokenizer call. The chat template already carries
its special tokens as text; page 6 passes this flag and page 5 does not. On Qwen it is likely
harmless, which is exactly why the inconsistency should not be left to luck.

**Comments.** The generation cell gets a comment per stage: template, encode, generate with
sampling explicitly off, slice the prompt off the output, strip end-of-turn, decode twice and
assert the two agree. Same for `incremental_token_strings`, whose reason for existing (a
character can span two tokens) is currently a docstring a reader will skim past.

---

## Problem 5 — "The ladder" printing whole prompts

**Intentional, and it should stay.** The prompts *are* the experiment on this page: the only
thing that varies across the five rungs is the text in that box, so printing it is the notebook
showing its independent variable. Nothing else in the file substitutes for it.

**One improvement.** It currently prints two rungs in full, which is a lot of screen for two of
five. Print the shared `render_prompt` stem once, then one line per rung showing only what that
rung adds and where (before the stem for exemplars, after it for instructions). Keep exactly one
rung in full, `one_shot`, because it is the only one whose addition a reader cannot picture from
a one-line description. That is the same before-and-after split the page uses for its highlight,
so the notebook and the figure describe the prompt the same way.

---

## Problem 6 — "The sweep" is machinery and running, in one breath

Correct diagnosis: one long cell defines resume, appending and the per-rung loop, and the cell
below runs it. The prose does not say which is which.

**Plan:** two labelled subsections with short headings, `6a. The machinery` and `6b. Run it`,
and prose in the register you asked for. For the machinery, something in the shape of: *this
defines one function. Give it a rung and a list of problems, and it asks the model each one,
records what came back, and returns the list of records. It saves every answer to a file as it
goes, so if the run stops halfway it picks up where it left off instead of starting over.*

For the run cell: *now we actually run it. Three rungs need no examples, so they go first.* Plus
the one non-obvious thing, that the zero-shot pass over the held-out pool is doing double duty
as the source of the worked examples.

No paragraph explaining why resume is designed the way it is. That belongs in the spec.

---

## Order of work

1. **Exemplar pool from levels 1 and 2.** Blocking; nothing else can be tested until the run
   completes.
2. **Strip end-of-turn tokens.** A defect in committed numbers, and it silently corrupts the
   token axis.
3. Model loading progress and sweep bars (problem 1).
4. Smoke test diagnostics and comments (problem 4).
5. Thinking-off cell (problem 3).
6. Grader and item-set presentation (problem 2), ladder printout (problem 5), sweep split
   (problem 6).

Items 1 and 2 change what the notebook produces. Everything else changes only what it shows.
