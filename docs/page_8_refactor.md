# Page 8 — "Best-of-N and Verifiers" refactor spec

**Status:** spec only. Nothing here is implemented. Consumes page 7's candidate dump.

**Supersedes** the transport and cost sections of
[page_8_best_of_n_experiment.md](page_8_best_of_n_experiment.md), which specced a paid API
study. Its item-design warnings and its trap / solvable / hopeless bucketing survive intact
and are carried forward below; only the plumbing is obsolete.

**What we take from `reasoning-from-scratch`:** ch05's two scorers, `heuristic_score` and
`avg_logprob_answer`, as real selectors of genuinely different quality. Not its numbers.

---

## Resolving page 7's open question 2: where figure 3 goes

**Decision: the figure goes here. Page 7 keeps the finding as one number.**

With both specs in view it turns out page 7's figure 3 and page 8's main figure are the same
object seen from two sides. Figure 3 draws two lines, "the right answer is in the pile" and
"the right answer wins the vote," and shades the gap between them. Page 8's entire content is
a ladder of selection rules that live *inside* that gap: the shaded region is not an
illustration of page 8's problem, it is page 8's y-axis.

Drawing it on page 7 and then redrawing it on page 8 spends the deck's strongest bridge twice
and weakens both uses. Drawing it only on page 8 lets it arrive as the frame for the ladder
rather than as a recap.

So page 7's third beat contracts to a single measured sentence with no figure, in the shape
of: *on N% of these problems the model produced the right answer and the vote threw it away.*
One number, stated, carrying the reader across the page break. That is a stronger bridge than
a figure the next page immediately repeats, and it buys page 7 back the space its histogram
and allocation curve want.

Page 7's spec has been updated accordingly.

---

## 1. Page Objective & Core Narrative

**Objective, sharpened:** page 7 counted votes, which assumes the crowd leans right. This page
stops counting and starts judging, and then discovers that a judge is only worth what the
judge is worth.

**What the page currently fabricates.** `LILY_PAD_MODEL` in [sim.ts](../web/src/lib/sim.ts)
is a Monte Carlo with an invented `appeal` vector and a verifier-reliability slider whose
units the page's own footnote admits nobody can defend. That slider is the thing to kill, and
the replacement is the whole idea of the refactor: **verifier reliability stops being a dial
the reader drags and becomes a measured property of real selectors.**

We have a ladder of them, spanning from useless to perfect, all scoring the *same* candidates:

| Selector | What it knows | Source |
|---|---|---|
| random pick | nothing | baseline, equals single-sample accuracy |
| majority vote | which answer recurs | page 7's rule |
| heuristic score | whether the answer is boxed, and how short it is | ch05 `heuristic_score` |
| average logprob | the model's own confidence in its answer | ch05 `avg_logprob_answer` |
| LLM judge | reads the reasoning and grades it | optional, a stronger local model or a hosted judge |
| oracle | the ground truth | ceiling, equals coverage |

**The analogy holds and gets sharper.** Page 8's existing framing is a judge at a competition
who does not pick whichever entry was submitted most often. The failure mode is a judge who
grades on presentation rather than on being right, and `heuristic_score` **is literally that
judge**: it rewards a boxed final answer and short output, and knows nothing whatsoever about
correctness. That is not an analogy we impose on the data, it is what the scorer does. The
page should say so plainly, because it makes the human parallel exact instead of decorative.

**Revised narrative, three beats:**

1. **Stop counting, start judging.** The same N candidates from page 7, run through the
   ladder. One chart, one line per selector, and the band between random and oracle is the
   whole playing field.
2. **Where selection earns its keep.** Items split three ways by how the vote behaves, with a
   measured base rate. On the trap slice, voting gets *worse* with N while a good selector
   climbs.
3. **The judge is a model too.** Verifier quality as a measured x-axis, and the crossing where
   a bad judge does worse than just counting.

**A tension between pages 7 and 8 that the data forces us to resolve honestly.** Page 7's
thesis is that errors scatter and truth concentrates, which is why voting works. Page 8's
thesis is that the popular answer is sometimes wrong. Both are true, and the resolution is
that the second describes a *minority slice* whose size we can measure. The current page 8
presents the attractor as the normal case, which is the more dramatic story and the less
honest one. Measuring the base rate is better on both counts: voting works on most problems,
here is the slice where it does not, and that slice is exactly where selection earns its keep.

---

## 2. Proposed Visual Layout / Diagrams

### Figure 1 (step 1) — the selector ladder

Accuracy against N, one line per selection rule, all reading the same candidates.

```
  acc │ ─────────────────────────────────────  oracle (correct answer is present)
      │                              ╭──────
      │                      ╭───────╯         LLM judge
      │              ╭───────╯   ╭─────────
      │        ╭─────╯      ╭────╯             avg logprob
      │   ╭────╯      ╭─────╯    ╭─────────    majority vote
      │ ╭─╯     ╭─────╯     ╭────╯
      │─────────────────────────────────────   heuristic (flat: grades presentation)
      │─────────────────────────────────────   random pick
      └──────────────────────────────────────
        1    2    4    8   16   32   64   N
```

The figure's job is the **vertical spread at fixed N**, not the climb. Same candidates, same
compute, five answers, and the difference between top and bottom is entirely the selection
rule. Annotate one N with a bracket reading *this much accuracy was already generated and
thrown away.*

The oracle line is page 7's "in the pile," arriving here as the ceiling it was always going to
be. The margin above it is unreachable without generating more, which is what makes it the
right frame.

### Figure 2 (step 2) — the three buckets

Bucket every item by what page 7's N candidates did, then show a stacked bar with the measured
base rate and a small curve per bucket.

```
  ┌──────────────────────────────────────────────────┐
  │ solvable ████████████████████████  the vote works│
  │ trap     ██████                    the vote loses│
  │ hopeless ███                       nothing works │
  └──────────────────────────────────────────────────┘

  per bucket, accuracy vs N:

  solvable        trap             hopeless
   ╭─────         ╮                ─────────
  ╭╯          ────╰────  majority  (flat at zero)
                ╭──────  judge
```

- **solvable:** the modal answer is correct. Page 7's regime.
- **trap:** the modal answer is wrong and the correct answer appears at least once. Page 8's
  regime, and the only place selection can beat counting.
- **hopeless:** the correct answer never appears. The coverage ceiling, where no selector
  helps and only more generation or a better model can.

The trap panel is the page's proof: **majority accuracy declines with N there**, because more
samples means a more reliable measurement of the wrong consensus. Stated globally that claim
is shaky; stated on a bucket defined by that very property it is nearly tautological, and the
honest move is to show it where it lives and say what fraction of items that is.

Bucketing costs no inference. It is a reduction of page 7's dump.

### Figure 3 (step 3) — verifier quality, measured

The reliability slider dies here and is replaced by a scatter.

Define selector reliability as: **on items where a correct candidate exists, how often does
this selector pick one?** That is a clean, measurable number per selector, computed on the
same dump.

```
  best-of-N   │                                    ● oracle
  accuracy    │                        ● judge
              │                 ● logprob
              │- - - - - - - - - - - - - - - - -  majority vote (reference line)
              │        ● heuristic
              │  ● random
              └────────────────────────────────────
                 measured selector reliability →
```

The crossing with the majority-vote reference line is the page's second half, and it is now a
*measured* crossing rather than a modelled one: below that reliability, judging is worse than
counting, and page 7's tool keeps its place in the toolbox.

Beside the scatter, one worked case with real traces: a problem where the heuristic scorer
picked a short, cleanly boxed, wrong answer over a longer correct one. That is the judge
grading on presentation, shown rather than asserted, and it is the single most persuasive
artifact this page can carry.

---

## 3. Empirical Data / Reasoning Traces Needed

**Almost all of it already exists.** Page 8 consumes page 7's sweep B dump at the allocation
optimum: same items, same model, same candidates. Nothing about the candidate pool changes,
which is precisely what makes the ladder a fair comparison and what keeps pages 7 and 8
describing one population.

**New computation required:**

| Selector | Cost | Note |
|---|---|---|
| random, majority, oracle | free | reductions of the dump |
| heuristic | free | `heuristic_score` is pure text analysis |
| avg logprob | one forward pass per candidate, no generation | `avg_logprob_answer`; cheap, and it must score the *answer* tokens given the prompt |
| LLM judge | one short call per candidate | optional, see below |

**On the LLM judge.** This is the one place a hosted model is a good fit rather than a bad
one, because judging needs no prefill and no truncation, so the constraint that ruled Gemini
out on page 6 does not apply. A stronger local model works too. Treat it as optional: the
page's argument stands on the four free selectors, and the judge only extends the ladder
upward. Decide after seeing whether the logprob-to-oracle gap is wide enough to be worth
filling.

**Item pool, carried forward from the prior plan.** Two warnings from that document remain
live and are worth restating because they are easy to forget:

- **Classic CRT items will not trap a current model.** Lily pad, bat and ball, and the widgets
  problem are memorized many times over. If we want an attractor family at all it must be
  structurally perturbed variants.
- **Ground truth must be computed, not typed,** for any generated or perturbed items.

However, the main sweep no longer needs a bespoke attractor pool, and this is a real
simplification. MATH-500 levels 4 and 5 will produce trap items naturally wherever the model
has a systematic error mode, and finding them is a *measurement* rather than a construction.
Building a pool designed to trap the model would put the page's thumb on the scale; letting
the buckets fall out of the data is both cheaper and more defensible. Keep the perturbed-CRT
idea in reserve only if the measured trap bucket turns out too small to plot.

**The go/no-go gate, now free.** The prior plan wanted a paid pilot to decide whether the
page's thesis survives contact with a real model. That gate is now a query against page 7's
dump: count the buckets. If the trap bucket is a reasonable slice, figure 2 works as specced.
If it is nearly empty, the page's second beat needs rethinking and we would want to know that
before building anything.

**Provenance and records.** Per item and selector: `selected_index`, `selected_answer`,
`selected_correct`, plus `bucket` and `reliability` aggregates. Every selector's version and
parameters recorded, including `heuristic_score`'s bonus weights, since those weights are what
make it a presentation grader and a reader may reasonably want to check that.

---

## 4. Text / Captioning Balance

The current page carries two long explanatory passages because the simulation cannot speak for
itself. Real selectors mostly can.

- **Lede:** two sentences. Counting asks what is most common. Judging asks what is best. They
  are not the same question.
- **Figure 1:** one caption sentence pointing at the vertical spread, not the climb. The
  bracket annotation does the rest.
- **Figure 2:** two sentences, one naming the three buckets and one giving the measured base
  rate. The base rate is the page's most quotable number and should read as a finding.
- **Figure 3:** two sentences, and the judge analogy belongs in the first of them. The worked
  case beside it needs a caption of one line naming what the heuristic rewarded.
- **Margin notes:** one bare cite for verifier-based best-of-N as a technique, numberless; one
  operating hint if figure 1 is interactive. The existing discipline of keeping author-year
  mentions to a single prose location holds.
- **Chips:** the illustrative-simulation chip is **deleted**. The provenance chip names model,
  item set, N, and date, and one line states that every selector reads the same candidates,
  because that is the fact the whole page rests on.

---

## 5. Transition / Flow

**From page 7.** Page 7 ends on one number: the share of problems where the right answer was
generated and the vote discarded it. Page 8 opens by pointing at that number and asking what
else could have been done with the same candidates. No new compute is introduced, and saying
so plainly is what makes the ladder land.

**To page 9.** Page 9 is outcome versus process supervision: grading the final answer against
grading every step. Page 8's ladder supplies the setup, because every selector on it is an
*outcome* grader. The heuristic looks at formatting, the logprob at confidence, the judge at
the answer, and none of them look at whether step three followed from step two. So the natural
question at the end of page 8 is not "can we get a better judge" but "what is the judge
actually reading," and page 9 answers by grading the working instead of the result.

That bridge is available for free from figure 3's worked case: the heuristic picked a wrong
answer that *looked* right. A grader that read the steps would have caught it.

---

## Open questions for review

1. **Does the LLM judge get built?** The four free selectors carry the argument. The judge
   extends the ladder and makes figure 3's scatter less sparse. My recommendation: decide
   after seeing the logprob-to-oracle gap, and prefer a local model over hosted so the page's
   provenance stays uniform.
2. **Is figure 2's three-bucket split one figure or two?** The stacked base-rate bar and the
   per-bucket curves are doing different jobs, and the trap panel may deserve to stand alone.
3. **Trap bucket size is unknown until we look.** If it is very small, options are to widen the
   item set, to lower N (traps are more visible at small N), or to fall back on the perturbed
   attractor family. Flagged now so it is not a surprise later.
