# Page 6 — "Thinking Longer" refactor spec

**Status:** spec only. Nothing here is implemented.

**What we take from `reasoning-from-scratch`:** the **harness only**. `load_math500_test`,
`render_prompt`, `extract_final_candidate` and `grade_answer` (ch03) are plain text-in,
text-out functions with no model dependency, and answer extraction plus equivalence checking
is plumbing rather than concept. We do not take the checkpoints, and we do not take any
reported number.

Worth recording, since it was the question that shaped this spec: **no budget sweep exists in
either chapter.** Chapter 4's reported axes are method (CoT prompting, temperature, top-p,
self-consistency at n=3/5/10); chapter 5's are scorer type and refinement iteration count.
Neither ever puts token budget on an axis, and the per-problem threshold analysis in figure 3
appears nowhere. This page is an experiment the book's harness makes cheap but never runs.

---

## 1. Page Objective & Core Narrative

**Objective unchanged:** the length of the chain is the compute, so a cap on the length is a
cap on the thinking. Page 6 is the deck's first naming of inference-time compute.

**What changes:** every number and every trace on the page becomes something we measured.

The page today rests on two things the constraints rule out. `THINK_BUDGET`
([authored.ts:426](../web/src/lib/authored.ts:426)) is a hand-written five-step chain with
hand-assigned word costs, and step 3 is a redraw of a published AIME24 curve for a 32B model
nobody reading can inspect. The first is invented, the second is a prior-reported number
doing the work a demonstration should do.

Both are replaceable by one experiment, because `max_new_tokens` **is** the budget dial. Cap
the model, force it to answer at the cap, grade the answer. That is the page's thesis
executed rather than asserted.

**Revised narrative, three beats:**

1. **One problem, one dial.** Drag the budget. A real trace truncates where you cut it, the
   model is forced to commit, and the answer flips. The reader sees working stop mid-sentence.
2. **The same dial, every problem.** Accuracy across the item set against budget: a climb
   that bends over. Inference-time scaling, and its ceiling, in one curve we own.
3. **Not every problem costs the same.** Each problem's *flip point*, the budget at which it
   first becomes correct. Some flip at 64 tokens, some at 2,048, some never flip. This is the
   beat the page does not currently have, and it is what hands off to page 7.

**Decoding is greedy throughout (temperature 0).** This is load-bearing for flow, not a
detail: budget must be the only variable on page 6 so that sampling can be the whole subject
of page 7. It also removes run-to-run noise from the curve.

### The design principle: shape, not level

An accuracy percentage on a named benchmark is a fact about one model-dataset pair. It does
not travel, and it does not build intuition. The page's claims must instead be **structural**,
and all three survive changing the model:

- accuracy climbs with budget and then bends over
- a problem has a *threshold* budget, not gradual improvement; item-level accuracy is a step
  function
- the distribution of thresholds has a long tail, and the tail holds problems no budget reaches

None of those are properties of a particular checkpoint. They are properties of what a chain
of thought is.

The test every figure on this page must pass: **could a reader run this procedure on their own
model and see the same shape?** If yes, the model is an instrument and the figure teaches a
concept. If no, the figure is a portrait of one checkpoint. This is the difference between
*reproducible* (we pinned our seed) and *re-derivable* (you can do it too), and the page is
aiming at the second.

Two consequences that bind on the layout below: the y-axis is deemphasized in favour of the
curve's shape, and figure 2 carries **two models** so the reader's eye extracts the invariant
from the difference in levels rather than memorising one.

---

## 2. Proposed Visual Layout / Diagrams

Keep page 1's per-step grid (step cell + margin cell). Three steps, down from three plus a
prose interlude. The standalone System 1 / System 2 card pair is **cut** and folded into the
step 1 caption; it restates Act 1 at a length the page cannot afford.

### Figure 1 (step 1) — the truncation view

The existing slider, rebuilt on real data. Full width of the step cell.

```
┌─ Question (real MATH-500 item) ────────────────────────────┐
│                                                             │
│  Budget  [────────●──────────────]  384 of 2048 tokens      │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Let me work through this. First I need to find the    │ │
│  │ common denominator, which is 12. So 3/4 becomes 9/12  │ │
│  │ and 2/3 becomes 8/12. Adding those gives 17/12. Now   │ │
│  │ I need to subtract... wait, let me recheck the sec▌   │ │  ← cut mid-token
│  │ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ │ │
│  │ Final answer: \boxed{17/12}          ← forced, tinted │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ✗ graded wrong    ·    384 tokens spent                    │
└─────────────────────────────────────────────────────────────┘
```

Three visual facts carry the whole idea and need no prose:

- The trace is **greyed past the cut**, not hidden. The reader sees what the model would have
  written and was not allowed to. This is the single most important pixel on the page.
- The **forced answer is tinted differently** from the model's own working, so it reads as an
  intervention rather than a conclusion.
- The verdict chip changes as the reader drags, and the flip is discontinuous. Accuracy at the
  item level is a step function, which is why the population curve in figure 2 is smooth and
  this one is not. That contrast is worth having on the page.

**Inset, bottom right of figure 1 (small, one row):** "asked nicely vs cut off." Two bars, the
token count when the prompt says *answer in one line* versus the hard cap at the same nominal
budget. The soft request overshoots. This turns the current honesty caveat (you cannot hold a
model to one word) from a muted apology into a measurement, and costs one bar chart.

### Figure 2 (step 2) — the population curve

Share of problems solved against token budget, log x-axis, our data. Marker tracks the same
budget value as figure 1's slider so the two figures are one instrument. Secondary readout,
not a second axis: **total tokens generated** at the current budget, as a plain number. Cost
gets a number here and a chart on page 16; do not build the cost/accuracy frontier on this
page.

**Two curves, same family, different size.** This is a requirement rather than a nicety. One
curve teaches a number; two curves that bend at different heights teach the invariant, because
the shared shape is what survives the difference. The benchmark is named in the provenance
line, not in the axis title: the page is not reporting a benchmark result and must not look
like it is.

Below the figure, one line stating the **procedure** (cap, force, grade, sweep). That line is
what makes the figure re-derivable rather than merely reproducible, and it is worth more than
any sentence describing the curve the reader can already see.

### Figure 3 (step 3) — the flip-point strip

The new visual, and the one that earns the page its handoff.

```
        budget →   32   64   128   256   512   1024  2048
  easy   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
         ░░░░░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
         ░░░░░░░░░░░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
         ░░░░░░░░░░░░░░░░░░░░░░░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
         ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░▓▓▓▓▓▓▓▓▓▓▓▓
  hard   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ← never flips
```

One row per problem, sorted by flip point, shaded from the budget where it first grades
correct. A vertical rule marks the reader's current budget so figures 1, 2 and 3 all move
together. Clicking a row loads that problem into figure 1.

The band at the bottom that never turns is the payload. Those problems are not
budget-limited, and no amount of the page's own lever reaches them. The reader should reach
page 7 already suspecting that a longer chain is not the only axis.

---

## 3. Empirical Data / Reasoning Traces Needed

**One sweep produces all three figures.**

### Model selection

Two requirements filter the field, and together they leave very little standing:

1. **It must blurt when not asked to think.** Otherwise budget zero is unreachable and the
   dial has no left end. This rules out every always-on reasoning model: R1 distills,
   gpt-oss, and the Qwen3 `-Thinking-2507` variants all emit a chain unconditionally.
2. **It must think on demand, with the thinking separable enough to cut.** This rules out
   pure non-reasoning models unless we settle for prompt-induced "think step by step," which
   is softer and messier to truncate.

Only hybrid models satisfy both natively, which in open weights is essentially the original
Qwen3 release (not the 2507 refresh, which split hybrid into separate Instruct and Thinking
checkpoints and lost the toggle; confirm exact repo IDs at download time).

| Model | bf16 VRAM | Blurts by default | Thinking control | Role |
|---|---|---|---|---|
| Qwen3-1.7B | 3.4 GB | yes, thinking off | `enable_thinking`, `<think>` tags | small curve |
| Qwen3-4B | 8.0 GB | yes, thinking off | same | primary curve |
| Gemma 3 4B | 8.6 GB | yes, always | prompt-induced only | cross-family check |

**Why Qwen3 specifically.** The `<think>...</think>` tags make budget forcing clean rather
than crude: cap generation inside the think block, inject `</think>\n\nFinal answer:
\boxed{`, let it commit. The closing tag is a forcing signal the model already understands, so
the intervention reads as *stop thinking and answer* rather than as a string splice. That is
both more honest and more legible in figure 1, where the reader watches the cut land.

**Why the same family for both curves.** Token counts are tokenizer-specific, so plotting two
families on a shared token-budget x-axis is quietly apples to oranges. Same family means the
x-axis means one thing, and size becomes the only variable.

**Gemma 3 4B does a different job:** one run, plotted faintly or held in reserve, that rules
out "this is a Qwen artifact." It is much weaker at math at the same size, so treat it as an
existence check on the shape and never as a level comparison.

**Ruled out and why, recorded so it is not relitigated:**

- *Hosted models (Gemini and similar).* Budget forcing needs prefill: resume generation from
  an assistant-role prefix. Locally this is free. Hosted chat APIs vary and Gemini's support
  is not a documented guarantee, and the workaround (feed the partial trace back as a new user
  turn) is a *different intervention* belonging to chapter 5, pages 8 and 10. Closed weights
  also cannot be pinned by hash, so the sweep would stop being re-derivable. Gemini remains a
  good fit as page 8's judge and page 10's critic.
- *12B and above.* Does not fit 16 GB at full precision (roughly 24 GB of weights), and 4-bit
  undercuts the reason to reach for it.
- *The book's Qwen3-0.6B pair.* Its natural home is pages 12 and 13, where same architecture,
  same size, one trained to reason and one not is a controlled contrast that is hard to buy
  anywhere else, and where training is the subject. Using it here would import the book's
  framing onto a page that is not teaching the book.

### Sweep parameters

| Parameter | Value | Why |
|---|---|---|
| Models | Qwen2.5-3B (primary), Qwen2.5-1.5B and Qwen2.5-7B (8-bit) | **three** curves, one tokenizer, page 5's checkpoints |
| Precision | bf16, not quantized | keeps quantization out of our own data; readers re-deriving at 4-bit should see the same shape at a different level, and that gap is itself a small argument for the page |
| Decoding | greedy, temperature 0, top-p 1 | budget is the only variable; sampling belongs to page 7 |
| Budgets | 128, 256, 512, 1024, 2048 | log-spaced; bounded by measurement — 0% of unconstrained traces finish inside 128 tokens and 100% finish inside 2048 |
| Items | 100 from MATH-500 levels 4-5, or GSM8K | paired with page 5's item set; 100 is the floor for resolving a 10-point paired difference |
| Forcing | at the cap, close the think block and append the forced-answer suffix, allow 32 further tokens | without this, low budgets grade as "no answer" and the curve is trivially zero |
| Grading | `extract_final_candidate` then `grade_answer` | inherited harness, so grading is not ours to defend |

**Headroom is the constraint that decides the item set.** The figures only exist if the model
fails at low budget and succeeds at high budget: the y-axis *is* the demonstration. Qwen3 is
heavily math-tuned and full MATH-500 may sit near its ceiling, which would flatten figure 2
and empty figure 3's tail. Filtering to difficulty levels 4 and 5 restores dynamic range
without leaving the harness, since the dataset already carries a `level` field and grading is
unchanged. A model too strong for the item set kills this page more thoroughly than a model
too small.

**The instrument is page 5's, and that is the point.** Page 5 measured both ends of this page's
curve on these same checkpoints, items and grader: forbidden to reason, Qwen2.5-3B scores 7% on
MATH levels 4-5; unconstrained it scores 43%. Page 6 fills the middle of a segment whose endpoints
are already published, which makes the two pages one measurement rather than two.

Qwen3 was the original choice because the intervention closed its `<think>` block. Two things
retired it. The requirement that a model "must blurt when not asked to think" is void — nothing
blurts unprompted, which is the finding that rewrote page 5. And Qwen3 does not share the Qwen2.5
tokenizer (`41e00eccf531` against `e360e6f62668`), so it cannot sit on a shared token-budget axis
without comparing two different units. It belongs in an appendix panel on its own axis, if at all.

**The grid is derived from measured lengths.** Across the three checkpoints, the share of
unconstrained traces that finish inside each budget runs 0-14% at 128, 8-19% at 256, 40-46% at
512, 84-91% at 1024 and **94-99% at 2048**. Five budgets bracket the transition; below 128
everything is forced.

The top is *marginally* binding rather than clear: 1-6% of traces are still running at 2048, worst
on Qwen2.5-3B. That residue is small and it biases conservatively — a truncated trace loses its
`\boxed{}` and grades wrong, so the right end of the curve is understated rather than flattered —
but the pilot's truncation readout is what decides whether 4096 is needed, and it should be read
rather than assumed. Measure it with the `truncated` flag, never with `tokens_generated <= budget`:
a trace cut *at* the cap has a token count equal to it and will otherwise be counted as finished.

**This is measured, not assumed.** Before the full sweep, a pilot runs both models at maximum
budget over ~30 items from levels 4 and 5 and reports accuracy plus mean thinking length. We
want both to land roughly in the 40 to 70 percent band. Above it, drop to level 5 only or step
the pair down to 1.7B and 0.6B. Script to be written separately.

**Only `generate_text_stream_concat_flex` is Qwen3-from-scratch specific.** Replacing it with a
transformers generate loop that respects `max_new_tokens` and supports prefix continuation is
roughly thirty lines. The rest of the harness is model-agnostic, which is what makes this
model swap cheap and what de-risks the same swap on later pages.

**Per-item record to capture** (this is also the trace bank's schema for later pages):

```
problem_id, level, question, ground_truth,
budget,                  # the cap this run used
trace,                   # full generated text at this budget
truncated,               # bool: did it hit the cap
forced,                  # bool: was the answer suffix appended
extracted_answer, correct,
tokens_generated,
provenance: { model_id, weights_sha, precision, device, decoding, seed, date, prompt_template }
```

Storing the **full trace at every budget** rather than one long trace to slice matters: a
model cut at 128 tokens and forced to answer does not produce the first 128 tokens of its
2,048-token trace, because the forced suffix changes what follows. Slicing one long trace
would be a fabrication of exactly the kind this refactor exists to remove. The page ships the
committed sweep and replays it; no live inference. See section 6 for how the sweep is produced
and how it reaches the page.

**Cost estimate:** 7 budgets x ~160 items x 2 models, greedy, with mean output well under the
cap at low budgets. Hours, not days, at bf16 on 16 GB. Re-runnable, which is the point.

**The one risk:** the curve may be non-monotone, with accuracy dipping at some middle budget
where the model has enough room to talk itself out of a right answer but not enough to
recover. If that appears, **keep it and show it**. It is a real result, it is more interesting
than the clean curve, and page 17 (When Reasoning Breaks) is already waiting for it. It should
not be smoothed away.

---

## 4. Text / Captioning Balance

Target: roughly half the current prose. The three figures carry the argument; text does only
what pixels cannot.

- **Lede:** two sentences. The chain has a length, and length is compute you pay for.
- **Figure 1:** one caption sentence naming the intervention (cut it off, make it commit),
  plus the System 1 / System 2 callback compressed to a single clause. The two-card System
  1 / System 2 block and the paragraph beneath it are cut; the reader met that idea in Act 1
  and does not need it re-explained at 90 words.
- **Figure 2:** one sentence on the bend. Not two, and no restatement of what the reader can
  see.
- **Figure 3:** two sentences, and they are the page's most important prose, because the
  never-flips band needs naming to land. Something in the shape of: *the dial runs out before
  these problems do.*
- **Close:** one sentence, the handoff below.
- **Margin notes:** one operating hint beside figure 1, one bare cite beside figure 2. Budget
  forcing gets an author-year attribution with **no numbers attached**; we show our curve, not
  theirs.
- **Chips:** the "no live model" chip is replaced by a provenance chip naming the model,
  decoding, item set and date; with two curves on figure 2 the model name belongs in the
  legend and the chip carries the rest. The "counts words, not tokens" chip is **deleted**,
  and this is a real
  simplification win: the whole word-versus-token dance in the current file exists only
  because the numbers were authored. Once we run a tokenizer, the axis is tokens and says so.

---

## 5. Transition / Flow

**From page 5.** Page 5 put a road in front of the model: show it one worked example and it
writes a chain instead of blurting. Page 6 opens on the obvious next question, which the
current page already asks well. Keep the seam, sharpen one word: page 5 gave the chain, page 6
gives it a **length**, and length is the meter.

**To page 7.** The current close ("the next pages explore methods that push the same trade
further") is a table of contents, not a bridge. Figure 3 supplies a real one.

Page 6 spends its entire budget on one chain, and figure 2 bends over while figure 3 shows a
band of problems the dial never reaches. The chain is not wrong, it is *one* chain, and a
problem it cannot reach it cannot reach at any length. So: same total budget, spent
differently. Instead of one chain of 2,048 tokens, sixty-four chains of 32. Page 7 turns the
dial from serial to parallel, and the pizza-vote analogy lands on a reader who already knows
why one voter is not enough.

This bridge also sets up the page 7 refactor cleanly, because a self-consistency run at fixed
total budget is exactly what ch04's `self_consistency_vote` measures.

---

## 6. Implementation plan

**This section is canonical for the whole deck.** Every page whose figures rest on reasoning
traces or empirical analysis follows this path: pages 5, 6, 7, 8 and 9 now, and pages 12, 13
and 14 when they are specced. Page 6 is the reference implementation because it is first and
simplest.

### The pipeline

| # | Step | Owner | Done when |
|---|---|---|---|
| 1 | Spec implemented as a Jupyter notebook | AI | the sweep runs end to end and writes logs |
| 2 | Notebook refined: hardware-agnostic, beginner-readable | AI | it runs on a laptop CPU and on a 16 GB GPU without edits |
| 3 | Notebook approved | human + AI | both sign off on correctness and readability |
| 4 | Notebook translated to JS for the page | AI agent | the page renders from committed logs |
| 5 | Post-translation edits: formatting, balance | AI | the page matches sections 2 and 4 above |
| 6 | Implementation complete | | |

**Why notebook-first rather than page-first.** The notebook is not scaffolding that gets thrown
away; it is the artifact that makes the page's claims checkable. A reader who doubts figure 2
can download one file and re-run it. That is the difference between a page that reports a result
and a page that hands you the result and the means to reproduce it, and it is the concrete form
of the re-derivability standard in section 1.

Notebook lives at `notebooks/page_06_thinking_longer.ipynb`, with a download link on the page
itself.

### Step 2 in detail: hardware-agnostic and beginner-readable

These are the two properties most likely to be lost if not specified, so:

**Hardware-agnostic**

- Device selection is automatic across CUDA, MPS and CPU. Reuse ch02's `get_device()` rather
  than writing another one.
- **Two run modes, chosen by one variable at the top.** `QUICK` runs a reduced grid (roughly 20
  items, 4 budgets, smallest model) and finishes on a laptop CPU in minutes. `FULL` runs the
  grid in section 3.
- **What `QUICK` guarantees, stated precisely.** It must produce every *aggregate* figure in a
  legible and correctly-shaped form, because most readers will never run `FULL`. It does **not**
  guarantee figures built from a *curated specimen*: finding a trace with a particular property
  (page 5's default-misses-and-CoT-lands pair, page 9's broken-step-but-correct-answer) is
  luck-dependent on a small grid with a small model. Specimen search must therefore degrade with
  a flag rather than raise, and a flagged specimen must never be translated to a page. Failing
  the whole run over a missing specimen would deny the reader the aggregates too, which are the
  part `QUICK` exists to deliver.
- Model size is a variable, not a constant, with a documented fallback ladder (4B, 1.7B, 0.6B)
  and a 4-bit option for small VRAM. State expected runtime per configuration.
- No dependency on the book's package for anything model-specific. The ch03 grading functions
  are vendored or imported; the generation loop is plain transformers.

**Beginner-readable, which is not the same as verbose**

- Narrative structure: markdown cell explains, code cell does, output shows. One idea per cell.
- No helper module imports for the interesting parts. The truncate-and-force loop is the thing
  the reader came to see, and it should be visible in the notebook rather than behind a
  function call in another file.
- **The notebook states decisions; the page's spec defends them.** A markdown cell gets one to
  three sentences: what the next cell does where that is not obvious, plus any constraint a
  re-deriver must not break, stated in one bold sentence and not argued. Rationale links to
  the spec rather than restating it — a duplicated argument is a sync hazard, not an aid.
- **Outputs carry the intuition.** Never narrate what the next cell's output will show; the
  printed table, diff or figure makes the point, and prose that pre-empts it is cut.
- A parameter whose value is a choice gets a short comment where it is defined, not an essay.
- Page-editorial content — narrative beats, caption drafting, what the page may or may not
  claim — lives in the page's spec, never in the notebook. Section names are plain (setup,
  sweep, figures, artifacts): the notebook is the measurement, and the page's beats belong to
  the page.

### The log format is the contract

The notebook writes logs; the page reads them. Nothing else crosses the boundary, and **no
inference runs at demonstration time.** The existing `NEXT_PUBLIC_LIVE_INFERENCE` and
`LiveDemo` path is explicitly not used by this page.

Two artifacts per run:

1. **`traces.jsonl`** — one line per generation, schema as in section 3.
2. **`derived.json`** — the aggregates the page actually plots: the accuracy-by-budget curve,
   the per-problem flip points, token totals.

**Log tokens, not just text.** For the animation to be honest, the trace must be stored as its
token strings, not only as decoded text. Replaying a character-by-character typewriter effect
would misrepresent generation on a page whose entire thesis is that *tokens* are the compute
currency. Store `tokens: string[]` alongside `text`, and let figure 1's reveal step through
real token boundaries.

**Run manifest**, emitted with every run so "re-derivable" is checkable rather than asserted:
model repo id and revision hash, tokenizer hash, dtype, device, torch version, seeds, item set
hash, notebook git sha, timestamp, run mode.

### Step 4 in detail: the translation, and how it is verified

The AI agent reimplements the notebook's **derivation** logic in TypeScript, not its inference.
Curve computation, flip-point extraction and bucketing all get TS equivalents so the page can be
tested.

**Cross-language agreement test.** The notebook's `derived.json` is committed. A TS test
recomputes those same aggregates from `traces.jsonl` and asserts they match. This is the one
place translation bugs hide, and it is cheap to close: if the JS curve and the Python curve
disagree, the suite fails rather than the page quietly shipping a different result than the
notebook produced.

### Artifact size, which needs a decision before implementation

Page 6's full logs are modest, roughly 2,000 traces at a few kilobytes each. **Page 7's are
not:** the N sweep produces on the order of 20,000 traces per model, tens of megabytes, which
does not belong in a web bundle.

So, two tiers, applied uniformly from the start rather than retrofitted when page 7 hits the
limit:

- **Bundled with the page:** `derived.json`, plus the specific traces the page displays (figure
  1's specimens, figure 3's clickable rows). Small.
- **Published as a downloadable archive:** the complete `traces.jsonl`, linked from the page
  next to the notebook link.

The page therefore ships what it draws and links what it drew it from.

---

## 7. What the page is allowed to claim

The claims contract for the translation step (section 6): the notebook produces the numbers, and
this section bounds the sentences they can support. Field names below refer to `derived.json`.

**Supported by this run:**

- Capping generation inside the think block and forcing the model to commit changes what it answers,
  on a specific model at a specific setting, with every trace shown in full and re-derivable from
  this file.
- Whatever `figure_2.curves[].points` actually shows, on MATH-500 levels 4 and 5, at *n* = the
  item-set size, greedy, thinking on. The page's expected claim is *rises, then flattens*, and
  `knee_budget` is where it flattened — but that is a result to read off the run, not a premise. If
  `knee_budget` is null the curve has not bent inside the grid and the page may not say it did; if
  `monotone` is false the page shows the dip rather than describing a climb.
- An individual problem's accuracy is a **step**: it flips at a budget and (usually) stays flipped.
  The per-item grid in `figure_3.items` is the evidence, and `figure_3.n_regressions` is the count of
  exceptions rather than a claim that there are none.
- A share of problems — `figure_3.never_flip_share` — is not solved at any budget in this grid.
- Asking for brevity in the prompt does not hold the model to a length, while `max_new_tokens` does:
  `figure_1.inset.overshoot_multiple`.

**Not supported, and the page must not imply it:**

- Any statement about *models in general*. Two checkpoints of one family is an existence proof that
  the shape is not one checkpoint's accident, not a survey. The page's claims are structural for
  exactly this reason.
- Any comparison of *level* between the two curves as a fact about scale. They differ in size and in
  training, and this page holds neither fixed. Two curves are on the page so the reader extracts the
  shared **shape**; if a caption is drafted that compares the heights, cut it.
- Any claim that the never-flipping band is *unsolvable*. What we measured is that no budget **in
  this grid**, with **this decoding**, reaches them. Page 7 changes the decoding and revisits them,
  which is the entire point of the handoff.
- Any number from a published paper. Budget forcing gets an author-year attribution on the page with
  **no figures attached** — we show our curve, not theirs.

**Two things to check before the page ships**, because they can only be answered after a `FULL` run:

1. Does the curve bend inside the grid? If `knee_budget` is None, extend the grid to 4,096 rather
   than describing a bend the data does not show.
2. Is the never-flips band big enough to see and small enough to be a band? If it is 2% the page's
   third beat has no payload; if it is 60% the item set is too hard and the pilot's verdict was
   ignored.

---

## Resolved during review

- **Which models.** Qwen3-4B and Qwen3-1.7B, hybrid thinking, bf16. Settled by two hard
  requirements (must blurt, must think on demand and be cuttable) rather than by size.
- **Two curves on figure 2.** Confirmed, and on stronger grounds than "preempt the reviewer
  question about scale": two levels are what let the reader see the shape as an invariant.
- **Not the book's checkpoint.** The 0.6B pair carries the book's framing; it moves to pages
  12 and 13 where the training contrast is the actual subject.
- **Not a hosted model.** Budget forcing needs prefill, which local weights give for free.

## Open questions for review

1. **Does the "asked nicely vs cut off" inset earn its space,** or should the soft-request
   finding move to page 17 where instruction-following failures already live?
2. **Item count.** 120 keeps figure 3's rows readable at page width; 200 makes figure 2's
   estimates tighter. Figure 3 can subsample for display if we prefer 200.
3. **Does Gemma 3 4B get plotted or held in reserve?** Plotting it is the strongest available
   evidence that the shape is not architecture-specific; holding it back keeps figure 2 to two
   clean lines. Decide after seeing whether its curve is legible alongside the Qwen3 pair.
4. **Pending the pilot:** if Qwen3-4B ceilings above ~70% on levels 4 and 5, we drop to level
   5 only, or step the pair down to 1.7B and 0.6B.
