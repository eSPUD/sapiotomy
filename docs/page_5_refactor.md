# Page 5 — "How to Reason" refactor spec

**Status:** **translated.** The premise inverted after three ablations, the notebook was rebuilt to
[`page_5_notebook_v2.md`](page_5_notebook_v2.md), the `FULL` run landed (900 generations, all six
claim gates true), and `web/src/components/pages/Page5.tsx` now renders it. Act 2's opening page.

Resolved at translation, against the open questions in the last section: **figure 3 ships**, and
the 8-bit question is moot because the shipped run put all three checkpoints at bf16, so no row
carries a precision asterisk. The specimen search ran on `FULL` and found 40 qualifying problems.
Figure 1 ships **two** tabs, per section 2, not the three of `page_5_notebook_v2.md` section 2.

**Implementation follows the notebook-first pipeline** in
[page_6_refactor.md](page_6_refactor.md) section 6, which is canonical for every page resting on
traces or empirical analysis: spec to notebook, notebook refined and approved, notebook
translated to JS, page renders committed logs with no inference at demonstration time.

**What we take from `reasoning-from-scratch`:** ch04 section 4.3's mechanism, which is one line
(`prompt + "\n\nExplain step by step."`), plus the ch03 harness. Not its numbers.

**All figures on this page are ours**, measured on Qwen2.5-Instruct over MATH-500 levels 4 and 5
at *n* = 100 paired items. No published figure is redrawn anywhere on the page.

---

## 0. The decision that shapes everything below

### The premise inverted, and the page is better for it

This spec was written to reproduce chain-of-thought prompting: a bare question produces a blurt,
four words produce a chain, and the page measures the difference. **That premise failed on every
instruction-tuned checkpoint tried.** A 2026 instruct model reasons on a maths question
unprompted, and no phrasing of the prompt changes that.

Three ablations (`page_05_selection`, `experiment_2`, `experiment_3`) settled it:

- **No instruct model blurts unprompted.** 0 of 200 bare responses under 60 tokens; chain share
  100% in nearly every cell, across Qwen2, Qwen2.5, Qwen2.5-Coder and Qwen3.
- **Asking for reasoning adds nothing measurable** to a model that already chains. On
  Qwen2.5-3B at *n* = 100 the paired difference is **+0.0 points, 12 fixed and 12 broken**, 95%
  interval [−9.6, +9.6]. **This page measures it and does not plot it** — see the handoff to
  page 12 in section 5.
- **Suppression is enormous.** Told to answer with no working, the same model falls from 43% to
  7%: **40 problems broken, 4 fixed, p < 0.0001.**

**So the page's claim is the reverse experiment.** You cannot make a modern model reason, because
it already does. You can stop it, and stopping it costs 36 points. Chain of thought did not fail
to arrive — it arrived so completely that it stopped being a prompt and became the default. That
is a more interesting page than the one this spec originally described, and every number in it is
ours.

### One consequence for the instrument

The original constraint here was that thinking stays **off** for the whole page, so that a hybrid
model's toggle could not be mistaken for a prompting effect. That constraint is retired because
its subject is gone: the page now runs plain Qwen2.5-Instruct checkpoints, which have no thinking
mode to leave on. The manifest records that nothing was disabled rather than implying something
was.

---

## 1. Page Objective & Core Narrative

**Objective unchanged and it is still the right one.** Act 1 ended asking whether a machine can be
walked down a road. Page 5 shows what that road is actually made of.

**What the page currently is.** `COT_DEMO` ([authored.ts:361](../web/src/lib/authored.ts:361))
quotes Wei Figure 1 verbatim: the cafeteria problem, the "The answer is 27" blurt, the three-line
chain, and the tennis-ball exemplar. Figure 2 redraws the same paper's per-scale table. The page is
a faithful, well-built retelling, and a retelling is what it should stop being.

**Revised narrative, three beats:**

1. **The chain is already there.** Same model, same question, one problem, two prompts. Asked
   plainly, the model writes eight steps of working that nothing in the prompt requested. Real
   traces, both of them.
2. **Take it away and it breaks.** Forbid the working and the same model on the same problems
   falls 36 points. This is the page's headline, and it is the largest effect anywhere in Act 2.
3. **The chain is long.** Six tokens against five hundred and seventy-three. Hand to page 6.

**The page's subject is what reasoning is worth, not how to summon it.** "How to reason" was a
question with an answer in 2022. In 2026 the answer is "you don't have to", and the page that
demonstrates *why that matters* is the one whose instrument can actually support a claim.

**What leaves the page entirely.** The emergence claim and the redrawn PaLM scaling chart. Page 5
is not about where reasoning stops working, and that is a different subject with a different
evidentiary bar.

**Model size may appear, but never as an axis.** Section 2's figure 3 compares three named
checkpoints, and its claim is about a **flat floor** rather than about scale: gagged, a 7B and a
model a quarter its size are nearly indistinguishable. Three points are not a scaling law, and
emergence in Wei et al. is a *sign flip* that our data does not contain — the trend is smooth and
monotone with no threshold. Any caption that could be read as a scaling law or as emergence is out
of scope and must be rewritten. Page 11 owns that subject.

---

## 2. Proposed Visual Layout / Diagrams

### Figure 1 (step 1) — three tabs on one problem

One problem, one model, one decoding setting, three prompts. Each tab carries a **"see the full
prompt"** disclosure above the model's output, so the reader can confirm that the prompts differ
while the outputs do not.

```
  Qwen2.5-3B-Instruct · greedy · one question, three prompts

  ┌ forced blurt ┬ bare ┬ + "Explain step by step." ┐   <- the reader lands on `bare`
  │ ▸ see the full prompt                            │
  │ ------------------------------------------------ │
  │ [the model's output, walked a step at a time]     │
  │ ✗ 27   ·   6 tokens   ·   0 steps                 │
  └──────────────────────────────────────────────────┘
```

**Two tabs, and the instruction condition is not one of them.** An earlier draft made it a third
tab so the reader could watch the prompt change and the behaviour stay put. That is a true and
interesting fact, and it is a fact about **post-training**: this model chains because it was
trained to. Training to reason is pages 11 to 14, and a reader meeting the result here has no
framework to read it with — the likely reading is "chain of thought does not work", which inverts
the page. Tab order matches figure 2's bar order, so the two figures are one argument read twice.

**The stepper survives from the current page and is good:** Back / Next / Play walking the chain a
line at a time. What changes is that all three outputs are real, and that the chain being walked is
the model's *default*, not something an exemplar induced.

Every tab shares ch03's `render_prompt` stem; instruction tabs add text after it. The notebook
splits on that stem and emits `prompt_before` and `prompt_after` per tab, so the page has one
highlight rule for all three rather than a per-tab special case.

**Step segmentation comes from the notebook, not from TypeScript.** Walking a chain a step at a
time requires the trace divided into steps, which is a derivation; doing it during translation
would put logic on the page that the cross-language agreement test cannot check. `derived.json`
carries `steps` per tab, each with a contiguous token range covering every token, so the reveal
animates real token boundaries and stops at step ends.

### Figure 2 (step 2) — the cost of not reasoning

One model, three bars, 95% Wilson intervals, with both paired contrasts annotated beneath.

```
  forced blurt              ███                                7%   ·      6 tokens
  bare                      ████████████████████              43%   ·    573 tokens
                            └──── share of problems solved ────┘

  suppression:   −36 points  ·  40 broken, 4 fixed   ·  p < 0.0001
```

**Contrasts are paired, by exact McNemar over discordant items.** Every condition runs on the same
problems, so an independent-interval test throws the pairing away — it would report a perfectly
symmetric 12-versus-12 result as "unresolved" rather than as measured. Wilson intervals stay on
the bars because a reader should see the precision of each level; the *comparison* is the paired
test.

**The instruction condition is measured and not plotted.** It runs, it is in `traces.jsonl`, and
`derived.json` carries its paired difference and the 95% bound. It is not a bar because the page
cannot explain it: a model that reasons unprompted does so because of how it was trained, and the
deck reaches training at page 12. Section 5 records the handoff so the finding is spent where it
pays rather than dropped here.

If a later draft does put it on this page, it needs an equivalence bound rather than a p-value —
`p = 1.0` is absence of evidence, not evidence of absence — which is why the notebook emits the
interval on the paired difference and never lets a caption say "nothing".

**One honest detail the caption must carry.** On the smallest model the instruction *does* move
something visible: chain share goes from 87% to 100%. It finishes the chaining behaviour on the
weakest checkpoint and still does not convert that into accuracy. Without this clause the null
reads as "the words are inert", which is stronger than what was measured.

**Chain share is a blurt detector and nothing more.** It counts formatting — under the notebook's
segmentation rule a display equation is its own step — so it is fine for verifying that the
suppression manipulation actually suppressed (0% under the blurt, 100% otherwise) and useless as a
measure of how much reasoning happened. It must not be reported as the latter anywhere on the page.

### Figure 3 (step 3, optional) — the floor is flat

Three model rows, two bars each. Ships only if the page has room; figures 1 and 2 carry the
argument alone.

```
                    gagged        left alone
  Qwen2.5-1.5B      ██  4%        ███████████ 22%
  Qwen2.5-3B        ███ 7%        ██████████████████████ 43%
  Qwen2.5-7B        ████ 11%      ██████████████████████████████ 60%
                    └ the floor ┘
```

The right-hand bars fan out; **the left-hand bars do not.** The claim is the flat floor, and the
sentence it supports is:

> A 7B forbidden to reason scores 11%. A 1.5B allowed to reason scores 22%. The chain is worth
> more than four times the parameters.

That cross-model comparison is tested explicitly rather than left to the eye. Its purpose is to
show the effect is not one checkpoint's accident; it is not a scaling result and carries no size
axis (section 1).

**The 7B ran at 8-bit** because bf16 weights do not fit the card the sweep ran on. Quantisation
costs a little accuracy, so it understates that row's suppression cost and makes the trend
conservative rather than flattering — but it is a precision difference inside a cross-model
comparison and the figure must label it.

### Step 4 — the close

One paired readout, not a fourth chart: what the chain cost. Six tokens against five hundred and
seventy-three, roughly **95× the tokens for 36 points**. The sentence the page ends on is that the
chain is not free and nobody has asked yet how much of it is load-bearing.

**Revised after the build: the close IS a fourth chart.** The readout shipped as three stat cards
and two things were wrong with them. They never said *which* checkpoint they were quoting (the
3B, and nothing on the page told the reader that), and the third card put the 95× on the page as a
rate of exchange, which this run cannot price. The two prompts differ by more than the length of
what they produce, so the ratio describes two conditions and is never the reason one of them
scores higher. The cards are now one pair of axes. Across, the median tokens a checkpoint wrote
per problem, log scale. Up, the share of the same 100 problems it solved. Six dots, three
checkpoints under two prompts, each dot labelled with its checkpoint, and the dots deliberately
unjoined with the caption saying why.

This needs two numbers per model that the first run's `derived.json` did not carry, so
`figure_3.models[]` gains `blurt_median_tokens` and `bare_median_tokens`. They make the reading
the figure exists for: **the tokens move with the prompt and the accuracy moves with the model.**
Left alone, the three checkpoints write 561, 573 and 582 tokens and solve 22%, 43% and 60%.
Forbidden to reason they write 5, 6 and 6 and solve 4%, 7% and 11%. A picture in which the
horizontal spread is set by the prompt and the vertical spread by the checkpoint is the one thing
the cards could not show, and it is what stops a reader reading the token count as the cause.

---

## 3. Empirical Data / Reasoning Traces Needed

**Same instrument as pages 6 to 8**, which is what makes Act 2 one continuous measurement:
Qwen2.5-Instruct, bf16, MATH-500 levels 4 and 5, `extract_final_candidate` then `grade_answer`,
greedy decoding throughout.

| | `QUICK` | `FULL` |
|---|---|---|
| models | Qwen2.5-1.5B | 1.5B + 3B + 7B |
| items | 50 | 100 |
| figure 3 | off | on |
| generations | ~150 | 900 |

**`QUICK` stays on levels 4-5 rather than dropping to level 3.** The band rule established by the
ablations — level 3 for 1.5B models, levels 4-5 for 3B and up — exists for *elicitation* headroom,
and elicitation is no longer on this page. The suppression effect resolves comfortably on the 1.5B
at levels 4-5 (+18 points, 22 fixed and 4 broken, p = 0.0005). Same band in both modes means
`QUICK` is a genuine preview of `FULL` rather than a different experiment.

**The primary model is Qwen2.5-3B**, not the 7B. The 7B's −49 is more dramatic, but it runs at
8-bit and the page's headline number should not carry a quantisation caveat. The 3B is bf16, sits
at 43% bare so there is visible headroom in both directions, and −36 with 40 broken against 4
fixed is not a marginal result.

**The sweep is one pass per condition.**

| Condition | Prompt | Note |
|---|---|---|
| `forced_blurt` | + "Give only the final answer. No explanation, no working, no other text." | the floor, and the page's intervention |
| `bare` | the question alone | the true default, which already chains |
| `zero_shot_cot` | + "Explain step by step." | Kojima et al. 2022 · ch04 §4.3's exact mechanism |

Three conditions × 100 items × 3 models. Recorded per item: condition, full prompt, full trace,
token strings, extracted answer, correctness, tokens generated, step count, boxed flag.

**The one-shot and few-shot rungs are cut, and this is not a tidying decision.** Across experiment
3 the few-shot gain is +1 to +15 points and resolves in exactly one cell, while the *boxed rate*
moves 22% → 93% on one model and 47% → 84% on another. The exemplar's job on a 2026 instruct model
is teaching the `\boxed{}` answer format, not teaching reasoning, and a rung that mostly measures
format compliance does not belong on an axis about reasoning. It belongs in a footnote.

Two consequences follow, both simplifications: the **exemplar harvest disappears** — no held-out
pool, no correctness filter, no band-disjointness assertion — and the notebook loses its most
failure-prone cell, which is the one that killed the first `QUICK` run.

**The generation cap is 2048 and must not bind.** A cap that clips only the conditions that write
chains is a scoring penalty aimed at precisely the argument this page makes, since a truncated
trace loses its `\boxed{}` and grades wrong. The notebook asserts the truncation rate **per
condition** at a 5% budget, never in aggregate — an aggregate hid this once already, passing 13%
overall while clipping a third of one rung and none of another.

**Figure 1's specimen is curated from the same run.** Required: the blurt is wrong and the bare
prompt is right. Preferred, as sort keys rather than filters: the step-by-step tab is also right
so all three tabs are populated; the bare trace is under 260 tokens so the chain fits on screen;
then shortest; then `problem_id` for determinism. If no problem qualifies the notebook flags
`specimen_is_fallback` and the run is not translatable.

**One risk worth naming.** The page's floor depends on the model obeying an instruction to stop
reasoning. Every general instruct checkpoint measured so far complies fully — 100% at a median of
6 tokens — but Qwen3-1.7B complied on only 5 of 24 items in an earlier run, and the math-tuned
checkpoints refuse the instruction outright at 0% compliance. Compliance is therefore **measured
on the run's own items and gated**, not assumed. A model that will not stop gives the page no
floor.

---

## 4. Text / Captioning Balance

- **Lede:** two sentences. The technique of prompting for step-by-step work is not ours; what
  follows is what that technique is worth on a model you can download, in 2026.
- **Figure 1:** one caption naming the constraint — only the prompt changed, the model never
  moved — and pointing at the thing worth noticing, which is that two of the three tabs look the
  same. The prompt disclosures do the rest.
- **Figure 2:** one sentence on the suppression bar. The instruction contrast gets a clause
  stating the bound, never the word "nothing" unqualified. Do not describe the bars.
- **Figure 3, if it ships:** one sentence, the flat floor. It must not compare heights across the
  right-hand bars as a fact about scale.
- **Step 4:** one sentence, the handoff. It used to carry the token multiple; since the revision
  above it carries the reading of the close's own figure instead, which is that the tokens move
  with the prompt and the accuracy moves with the model.
- **Margin notes:** the deck's existing convention holds. Wei et al. sits beside figure 1 and
  Kojima et al. beside the step-by-step tab, since those are the figures whose *techniques* they
  originate. Cite the technique, not the measurement: the numbers are ours, so no cite carries a
  number or sits where it implies the data came from a paper.
- **Chips:** the "quoted from Wei et al. Fig. 1" chip is deleted along with the quotation. The
  "no live model" chip becomes a provenance chip naming model, precision, decoding, item set,
  *n* and date.

---

## 5. Transition / Flow

### What page 5 hands forward to page 12, deliberately unspent

Page 5 measures that **asking for reasoning adds nothing** — Qwen2.5-3B, *n* = 100, +0.0 points,
12 problems fixed and 12 broken, 95% interval [−9.6, +9.6] — and does not put it on the page.

It is not a null result about prompting. It is a result about **training**: the instruction is
redundant because the behaviour is already in the weights. Page 5 has no vocabulary for that yet,
and a reader who meets 12-versus-12 here will read it as "chain of thought does not work".

**Page 12 should open on it.** That page argues STaR, ExIt and RFT are RL in disguise — training a
model to produce the reasoning it would otherwise have to be asked for. A callback lands the point
before the page has spent a word on it: *on page 5 the instruction moved twelve problems one way
and twelve the other, on a model that reasons anyway. Here is what put it there.*

The number lives in page 5's `derived.json` under `figure_2.measured_only`, so the callback cites
a measurement rather than a memory.


**From page 4.** Unchanged and already good. Act 1 closed on whether a machine can be walked down
a road; page 5 shows what the road is worth.

**To page 6, which is the reason this refactor is happening.** The current close hands page 6 a
claim about model size that page 6 does not use and cannot support. The new close hands over the
thing page 6 is actually about.

The reader has just watched the token count go from six to five hundred and seventy-three, and
watched the score collapse when those tokens were taken away. So the question page 6 opens on is
concrete rather than abstract: **how much of that length is load-bearing?**

The bridge is the reader's own experience, and it belongs here rather than in figure 2's caption,
where it would spend page 6's opening early:

> You have done this. You told the model to skip the working and answer, and the answer got worse.
> Page 6 asks how much of that working it actually needed, and what happens when you cut it off
> mid-sentence.

The two pages are one experiment read twice. Page 5 varies the prompt at unlimited length; page 6
fixes the prompt and varies the length. Same family, same items, same harness.

---

## 6. What the page is allowed to claim

The claims contract for the translation step ([page_6_refactor.md](page_6_refactor.md) §6): the
notebook produces the numbers, and this section bounds the sentences they can support.

`derived.json` carries a machine-readable form of this section as a top-level `claims` object. The
translation step reads it **before** it reads any number, and a claim whose flag is false does not
go on the page regardless of how good the number looks.

### The gates

| flag | condition | consequence if false |
|---|---|---|
| `suppression_resolves` | McNemar p < 0.05 on blurt vs bare, primary model | **not translatable** — this is the page |
| `blurt_compliance` | primary model answers under 40 tokens on ≥80% of blurt items | **not translatable** — the page has no floor |
| `specimen_usable` | figure 1's triple found, not fallback | **not translatable** — figure 1 is illustrative only |
| `instruction_null_bounded` | 95% CI on bare vs cot within ±15 points | the caption says "did not resolve", never "does nothing" |
| `floor_is_flat` | blurt accuracies within 10 points across models | figure 3 drops its headline sentence |
| `may_compare_across_models` | figure 3 ran, and precision is recorded per model | figure 3 drops |

**Supported by the run:**

- The model produces a chain of reasoning on a bare maths question, with no instruction to do so —
  one model, one setting, the trace shown in full and re-derivable from the notebook.
- Forbidding that reasoning costs what `derived.json` reports, on MATH-500 levels 4 and 5, at the
  *n* recorded, greedy. Gated on `suppression_resolves`.
- Adding "Explain step by step." to a model that already chains produces an effect smaller than
  the bound `derived.json` reports. Gated on `instruction_null_bounded`, and stated as a bound
  rather than as a zero.
- The formulation that reasons writes far more tokens than the one that does not, in the ratio
  `close.token_multiple` reports. Reportable as two token counts side by side, which is what the
  close's figure plots; **not** reportable as a price, since nothing in the run isolates length
  from the rest of what the two prompts changed.
- What each named checkpoint wrote and what it solved, from
  `figure_3.models[].{blurt,bare}_median_tokens` beside the accuracies already there. Same gate as
  the rest of figure 3, `may_compare_across_models`, and the same phrasing rule: named
  checkpoints, never a fact about size.

**Supported only when the gate says so:**

- Anything figure 3 shows, gated on `may_compare_across_models`, and phrased as a comparison of
  named checkpoints rather than as a fact about size.
- The flat-floor sentence, gated on `floor_is_flat`.

**Not supported, and not to appear on the page:**

- Anything about emergence, or any scaling law. The measured trend is smooth and monotone; Wei's
  emergence claim is a sign flip, and a sign flip is not in this data (section 1).
- Any general claim about chain-of-thought beyond this family, dataset and difficulty band. In
  particular, nothing about whether these findings hold outside mathematics: the page measures one
  benchmark in one language.
- Any number attributed to Wei et al. or Kojima et al. (section 4).
- Any claim that a worked example helps, or that it does not. The exemplar rungs left the ladder
  because they mostly measure answer-format compliance (section 3); the page says nothing about
  them beyond a footnote naming why.

**Limitations, stated rather than buried:**

- Comparisons across conditions are paired and use exact McNemar over discordant items; the
  discordant counts are printed beside every contrast, so a reader sees that a "+0 point" result
  is 12 fixed and 12 broken rather than nothing happening.
- The null is a bound, not a zero. At *n* = 100 the instruction contrast resolves to about ±10
  points, so an effect smaller than that is not excluded.
- "A chain" is ≥2 steps under the notebook's segmentation rule, which counts formatting rather
  than reasoning. It serves as a blurt detector and nothing more (section 2).
- `forced_blurt` is one phrasing of "do not explain". A different phrasing would move the floor,
  and the page shows the exact string it used.
- The blurt condition produces almost no `\boxed{}`, by construction, so its answers are extracted
  by the grader's fallback to the last number. This is reported per condition; it is the one place
  a low boxed rate is expected rather than a defect.
- The 7B row of figure 3 ran at 8-bit while the others ran bf16. It understates that row.
- Greedy decoding diverges on a handful of items across hardware; re-deriving reproduces the shape
  and the ranking, not every digit.
- The page measures whether the model *wrote* reasoning and whether it landed the answer, never
  whether the reasoning is sound. A response can contain eight well-formed steps and a wrong
  answer; page 9 is where step quality is examined.

---

## Open questions for review

1. **Does figure 3 ship?** It is net-neutral on page height, since it replaces the PaLM chart
   currently occupying step 2, and it needs no new sweep. Against: it is the only place the page
   puts three checkpoints side by side, and the 8-bit row needs a label. Decide before translation.
2. **Is 8-bit acceptable on a page that otherwise carries none?** If not, figure 3 becomes two
   models and loses its most dramatic row.
3. **Does the specimen search need `FULL`?** `QUICK` at *n* = 50 gives 50 chances at a problem
   where the blurt misses and bare lands. At the measured rates that is ample, but it has not been
   run.

**Resolved by the ablations** (`page_05_selection` n=1,080 · `experiment_2` n=1,440 ·
`experiment_3` n≈2,700):

- *The page's premise.* **Reversed.** No instruct model blurts unprompted, so the page cannot be
  about making one reason. It is about what reasoning is worth, measured by taking it away.
  Section 0.
- *Zero-shot CoT as a mechanism.* **Measured null**, with a bound. It is retained as a rung
  precisely because showing it does nothing is the page's 2026 finding.
- *The exemplar rungs.* **Cut.** They move the boxed rate far more than the score; see section 3.
- *Which model and band.* Qwen2.5-Instruct on MATH-500 levels 4-5, primary 3B. Level 3 is the
  right band for 1.5B models when elicitation is the subject, which here it is not.
- *The instrument's precision.* Wilson intervals on independent rungs was the wrong test for a
  paired design and would have reported a measured tie as unresolved. Exact McNemar throughout.

**Reversed from the earlier review of the first complete run** (Qwen3-0.6B, L4-5, cap 512 — the
run that produced five bars between 0% and 8%). That review demoted accuracy to a secondary,
gated panel and promoted chain share to the headline, because at 0.6B every rung sat between 0%
and 8% and the axis was hiding a working experiment. **Both halves of that decision are now
undone**, and the reason is that its premise was a floored checkpoint rather than a property of
the measurement: at *n* = 100 on a 3B at 43% bare, accuracy resolves at p < 0.0001 and is the
page's strongest number. Chain share moves the other way, down to a blurt detector, because the
segmentation rule counts formatting rather than reasoning and must not be reported as the latter.

What survives that review unchanged: the per-rung truncation assertion, the cap in `RUN_ID`, and
the principle that a run which cannot resolve its claim degrades honestly instead of publishing
noise.
