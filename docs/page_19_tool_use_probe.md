# Page 19 — the tool-use beat, and the probe we decided not to run

**Status.** Decision recorded 2026-08-09. The tool-use beat is built from three trace specimens
already sitting in a shipped bundle. The 20-item GPU probe that was scoped alongside them is
**not being run**, and §3 records why, so the question is not reopened by accident.

**What was on the table.** Twenty items, one model, one prompt change, one Python executor,
producing a specimen rather than a figure. It was scoped, costed and rejected on aim rather than on
price.

---

## 1. Where page 19 is weakest, and why it is exactly here

Page 19's close is the deck's loop-closer. It puts page 2's question back in front of the reader and
answers it in halves (`Page19.tsx:402-460`): the misread question is settled by thinking, and the
moved record is *not*.

That second half is the deck's ending. And its resolution is one paragraph:

> What settles it is the one lever that stops being a monologue. ReAct interleaves thought with
> action: think a step, call a tool, read what comes back, think again. (`Page19.tsx:435-438`)

This is the single load-bearing claim of the deck's ending, and it is the least evidenced sentence
in the deck. It is a citation and an assertion. The page's own footer concedes the neighbouring
weakness in the same breath: *"Step 2 is an illustrative composite, not a live model"*
(`Page19.tsx:502-505`).

Set that against what the rest of the deck now does. Pages 5 through 11 each ship a measured run,
a `derived.json` and a downloadable notebook. Page 9 grades 1,580 chains twice. Page 11 reproduces
three upstream runs bit-exactly before it spends a FLOP of its own. The whole Act 2 refactor has
been a systematic replacement of authored simulation with measured trace. Page 19's tool beat is
the last authored assertion standing in the deck's spine, and it happens to be the one carrying the
ending.

**Page 2 sold this debt seventeen pages earlier.** `Page2.tsx:289`: a System 2 pass turns "a
confident wrong answer into a flagged one, and a flagged one into a reason to go look." The deck
promises a lookup, argues for it once at page 19 in prose, and never shows one. That is the gap
this report is about.

---

## 2. What the existing traces already give us, free

Three specimens, all from `web/public/notebooks/page-11-training-vs-scale.zip`, all
`Qwen2.5-Math-1.5B-Instruct` under the CoT system prompt, greedy, cap 2048, on pages 6 to 8's own
hundred MATH-500 L4/5 items. No GPU is needed to use them; they are already published.

### S1 — the model reaches for a tool it does not have

`test/intermediate_algebra/956.json`. Factor `x^3 - 3x^2 + 4x - 1` into `x^9 + px^6 + qx^3 + r`,
give `(p,q,r)`. Ground truth `(6,31,-1)`. The chain tests two rational roots, fails, and then:

> Given the complexity, we use known results or computational tools to find: a = 0, b = 0, c = 0,
> d = 0, e = 0, f = 1

Those zeros are invented. There is no tool. The model states the need for an interpreter, supplies
the interpreter's output from its own weights, and answers `(-3, 3, -1)`.

This is page 19's argument, performed by the deck's own instrument, in one trace. It is worth more
to the page than the ReAct citation, because it shows the failure the citation is the fix for.

The behaviour is not a one-off. Across all 2,550 specialist traces the model names an absent tool
(Mathematica, a calculator, a numerical solver) 89 times on 14 distinct items. Most of those land on
items it gets right anyway, so this is a specimen, not a statistic, and the page should present it
as one.

### S2, S3 — the boxed answer contradicts the chain

`test/intermediate_algebra/102.json`: the telescoping Fibonacci sum. The chain derives
`1/F_1 + 1/F_2 = 1 + 1 = 2` on its final line and boxes `1`.

`test/precalculus/1133.json`: derives `15R^2/4` and boxes `3(a^2+b^2+c^2)/4`.

These belong to page 18's faithfulness thread rather than to tool use, and the recommendation is to
place them there with a pointer forward rather than crowd page 19's close. They are listed here
because they came out of the same read and should not be lost.

### What the failures are actually made of

All 36 hard-band greedy failures were read. The dominant shape is not arithmetic. It is **search**:
the model tries the candidate points it happens to think of and reports the best of those.

- Minimizing a sum of three square roots over a box: it evaluates four points and picks the smallest
  of the four. True minimum `70√2`; it answered `20√5 + 10√34`.
- Counting distinct values of a re-parenthesized product: hand-enumeration, cases missed, 14 for 4.
- `gcd(3339, 2961, 1491)`: Euclid by hand, botched, 3 for 21.
- Integer parameters of a parallelogram, divisors of 500, the period of a Möbius iteration: all
  brute-force jobs done in prose.

Roughly six of the 36 are modelling or diagram failures (a tetrahedron cross-section, an angle
trisection read off an `asy` figure) where an interpreter buys nothing.

**This kills the obvious framing before the page can reach for it.** "Python fixes the model's
arithmetic" is already refuted by our own page 9: the deterministic arithmetic checker proves a
false step in **0.67%** of chains that reached the right answer, and 17,680 of 18,772 steps are
beyond the checker entirely (`web/data/page-09-derived.json`). Arithmetic slips are not what is
killing these models on this band. Guessing where they should be exhausting is.

---

## 3. Decision: no probe. The reasons, in the order they carry weight

The probe's deliverable would have been a **fourth specimen**: the same model, on an item it missed
in prose, under the TIR system prompt, writing a code block, having it executed, and landing the
answer. Beside S1 that is a before-and-after with one variable changed. It was rejected anyway.

**1. It demonstrates the wrong half.** This is decisive and it is the reason the earlier draft of
this report got wrong. Page 19's close settles page 2's *knowledge gap*, the fact the weights never
held, the record that moved. What settles that is **retrieval**, a lookup against the world. A
Python interpreter on MATH-500 demonstrates **computation**. A TIR specimen would have strengthened
a general "tools help reasoning" claim while the sentence actually carrying the deck's ending stayed
exactly as asserted as it is today. Evidence aimed next to the target is not evidence for the
target.

**2. S1 is better aimed than a success would have been.** A model stating it needs computational
tools and then filling the gap from its own weights *is* the knowledge-gap failure in miniature, on
our own instrument. A successful `sympy` call would be a picture of a model doing algebra well. The
fabrication is the argument.

**3. Register.** Nothing in pages 12 through 19 ships a measured run; `web/data/` stops at page 11.
Act 3 is published receipts by design. S1 costs nothing against that, because it comes out of a run
the deck already ships and links from page 11. A fresh probe would stand a new instrument up on the
last page of the deck, to appear exactly once, for one illustrative trace.

**4. Price.** Thirty to fifty minutes of environment build against pins we do not have installed,
with real version risk, for a trace that by construction could never enter a figure.

**What this costs us, on the record.** Page 19 will show a failure and cite the fix. That is
asymmetric evidence and the copy must not paper over it. The honest structure, and the one §6
builds, is: here is our own model failing for want of a tool, here is what the field does about it.
Claiming the repair on someone else's evidence is what every other page in Act 3 does.

**What would reopen this.** Not a better TIR prompt. Only a page that needs the repair *shown*, and
the run that serves it is a retrieval arm rather than a tool-integrated-reasoning arm: a chain that
fetches a fact the weights never held. That is a different experiment, on a different item set,
and it does not belong in page 19's close.

**Environment, recorded for whoever revisits this.** There is no usable environment on this
machine. The only torch present is in `reasoning-from-scratch/.venv` at 2.13.0 with no
`transformers` and `reasoning_from_scratch` 0.1.21, against `notebooks/requirements.txt`'s
`torch>=2.7,<2.11` and `reasoning-from-scratch>=0.2.0`, and against the run manifest's torch
2.10.0+cu128 / transformers 5.14.1. The weights are cached (2.9 GB) and the item set ships inside
`page-10-search-arm.zip`, so inference would be roughly ten minutes and the venv build thirty to
fifty. A probe would not have needed instrument parity, because none of its numbers ship. An arm
would, and the environment gets rebuilt to the manifest first.

---

## 4. What this contributes to the story of inference-time scaling

This is the part that matters beyond page 19, and it is not decoration on the ending. Tool use is
the one inference-time lever that behaves differently from every lever the deck measured, and the
deck currently has no way to say why.

**Every Act 2 lever rearranges what the weights already hold.** Longer chains, wider votes, trained
verifiers, tree search. Page 11's keystone measured where that ends: on the hard band, sampling and
voting on the 3B never reaches the 7B's single greedy answer even at several times the bill, and the
reason is selection rather than coverage. The right answer is in the pile 78% of the time and no
answer-time rule reliably returns it. Page 19's own close restates it: these levers "all rearrange
what the weights already hold. None of them puts a fact in there that was never in there."

**An interpreter is an external selector.** Its verdict is not another sample from the same
distribution, which is precisely why it can do what majority voting cannot. Page 8 already found
the ceiling on internal selection: a trained verifier's +4 over the vote on identical candidates is
not a difference at p=0.45. The deck has spent four pages establishing that models are bad at
choosing among their own outputs, and has never shown the reader the one selector that is not the
model.

**And it is free in the deck's own currency.** Page 11 prices everything at `2 · params · tokens`.
An interpreter's work costs zero model FLOPs. A tool call is inference-time compute that does not
appear on the model's bill at all. That is a genuinely new point on page 11's axes, and it is the
strongest available support for the claim page 19 already makes in its closing box, that
inference-time scaling opened "a second, durable axis of progress."

**The mechanism is legible in the specimens.** The specialist fails by testing the candidates it
happens to think of. That is sampling without coverage, occurring *inside a single chain*. Page 7
measured that failure across chains; the traces show the same shape within one. An interpreter
converts a guess into an exhaustion. Same coverage-versus-selection frame the deck built in Act 2,
turned on a new instrument, which is what makes this an ending rather than an appendix.

**On "better reasoning means better tool use."** No run in this deck can settle it, since separating
the prompt from the training needs an ablation nobody here is going to run. But S1 is the cleanest
illustration of it available: a model with enough reasoning to know it needs an interpreter, and no
interpreter to call, filling the gap from its own weights. Page 19 already carries the sentence this
specimen belongs under, at `Page19.tsx:443-445`: "it is not thinking harder; it is looking it up,
and the thinking in this story is what decides when to look and what to do with the answer." Today
that sentence is asserted at both ends. S1 makes the first half concrete and leaves the second half
where Act 3 leaves everything else, on the citation.

**The attribution caveat the page inherits.** `Qwen2.5-Math-1.5B-Instruct` was trained for
tool-integrated reasoning among other things, so nothing about its behaviour separates the prompt
from the training. Page 11's manifest already carries the wording for the specialist's provenance:
*"the attribution is the bundle; no ablation separates it."* Page 19 says no more than that, which
is why S1 is presented as a specimen of a failure mode and never as a measurement of one.

---

## 5. Two corrections this read turned up, independent of everything above

1. **Two of the specialist's 36 hard-band failures are grader misses on formatting alone.**
   `\begin{pmatrix} \frac{1}{5} \\ -\frac{18}{5}\end{pmatrix}` marked wrong against
   `\begin{pmatrix} 1/5 \\ -18/5 \end{pmatrix}`, and `(2, 12) \cup (12, 102)` marked wrong against
   `(2,12) \cup (12,102)` on whitespace. The specialist's hard-band greedy is 66%, not 64%. All
   5,900 traces in the bundle were swept for the same shape and turn up a third, `12 \pi` against
   `12\pi`, on one sampled 1.5B draw of the sixteen on a single hard-band item, which touches a
   pooled figure by well under a point and no greedy point at all. So the misses are notation and
   whitespace rather than a property of one model. No ordering changes, but `grade_answer` is
   shared by every measured page and the rate belongs in `PROVENANCE.md`, where the full table is.

2. **The specialist arm is orphaned data.** It ran on 2026-08-10 and nothing plots it.
   `page11.ts:19` and `Page11.tsx:22` both record the reason: the reasoning-versus-general
   comparison was reserved for page 14 at matched size against the R1 distills, and page 14's
   notebook is authored but unrun. The specimens are the first use this run has had.

---

## 6. What gets built

No notebook, no run, no new `derived.json`. The specimens already exist in a published bundle; the
work is extracting them into committed data and spending them on two pages.

1. **`web/data/trace-specimens.json`.** The three traces lifted verbatim from
   `web/public/notebooks/page-11-training-vs-scale.zip`, each carrying its `problem_id`, question,
   ground truth, extracted answer, the full trace, and the sha256 of the exact `traces.jsonl` line
   it came from. Generated from the zip rather than hand-typed. Page 9's `specimens` /
   `specimen_sources` block is the precedent.

2. **`web/src/lib/specimens.ts`.** Loader in the house style: a data error at import time
   rather than a conditional in a component. Its invariant is that a page can only display text the
   run produced, enforced by asserting every published excerpt is a substring of its trace and every
   highlight a substring of its excerpt. A wrong file pasted into `web/data/` fails the build
   instead of drawing a plausible lie.

3. **Page 19's close gains S1**, immediately before the existing `thought → action → observation`
   line, so ReAct arrives as the fix for a failure the reader has just watched. The copy makes the
   claim §2 supports and not the calculator claim page 9 already refuted: an interpreter replaces
   guessing with exhaustion.

4. **Page 18 gains S2 and S3** as a faithfulness callback. They are a different claim from tool
   use, the chain and the answer disagreeing, and crowding them into page 19's close would blur its
   one idea. Page 18 is where the deck already argues that the visible chain may not be the reason
   for the answer, and it currently argues it entirely on other people's traces.

5. **The two corrections in §5** land in `page11.ts`'s header comment and in `PROVENANCE.md`.
