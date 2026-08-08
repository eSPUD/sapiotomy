# Page 8 — what the run found, and what the page may say

**Status:** plan, rewritten after the run. Every number below is measured on our own
generations unless it says otherwise. Supersedes the *figure set* and the *dependency model*
of [page_8_refactor.md](page_8_refactor.md); its bucketing, holdout and provenance discipline
survive.

**Supersedes this document's own earlier drafts.** Two of their claims were falsified by the
run. They are corrected in section 5 rather than quietly deleted, because the page must not
repeat either.

---

## 1. The instrument

`Qwen2.5-3B-Instruct`, MATH-500 levels 4 and 5, the same 100 items as pages 5 to 7. Page 8
generated its own pool: **12,800 chains** at a 2048-token cap across T=0.3, 0.6, 0.9 and 1.2,
16 to 64 candidates per item. Five judges then scored every candidate, **64,000 judgements**
in total, plus the two free scorers from ch05.

Two provenance facts worth keeping. Page 8's T=0.3 chains came back **98.8% byte-identical**
to page 7's from the seed alone, the residual being GPU non-determinism, which is a
reproducibility result the deck can state plainly. And page 8's vote reproduces page 7's
within a point on the same configuration.

---

## 2. The headline, and it is resolved

**Scoring N candidates and keeping the best takes 43% to 60%.** T=0.6, N=16, 100 problems,
against a single chain, exact McNemar over discordant items:

| rule | accuracy | delta | fixed | broke | p |
|---|---|---|---|---|---|
| one chain (baseline) | 43.0% | | | | |
| **best-of-16, trained verifier** | **60.0%** | **+17.0** | 21 | 4 | **0.0009** |
| majority vote | 56.0% | +13.0 | 17 | 4 | 0.0072 |
| best-of-16, `qwen7b` judge | 56.0% | +13.0 | 17 | 4 | 0.0072 |
| best-of-16, `math1.5b` judge | 53.0% | +10.0 | 16 | 6 | 0.053 |
| best-of-16, `qwen1.5b` judge | 50.0% | +7.0 | 14 | 7 | 0.19 |
| best-of-16, ch05 `heuristic_score` | **35.0%** | **-8.0** | 8 | 16 | 0.15 |

This is the comparison `reasoning-from-scratch` ch05 makes, and we reproduce it. Being precise
about why that matters: **`self_consistency_vote` is in ch04 and the scorers are in ch05.** The
book introduces counting and selection as successive techniques and never sets them against
each other. "Best-of-N works" means beating one chain, and it does, at p < 0.001.

**The book's own scorer makes things worse.** `heuristic_score` loses 8 points. Every candidate
here carries a `\boxed{}`, so its boxed bonus cancels and the rule reduces to *shortest wins*.
A judge that grades presentation is worse than not choosing at all, and that is the page's
warning demonstrated in the book's own code rather than offered as an analogy.

---

## 3. The caveat, which is ours and not the book's

Against the vote, on identical candidates, nothing wins:

| rule | accuracy | vs the vote | fixed | broke | p |
|---|---|---|---|---|---|
| majority vote | 56.0% | | | | |
| best-of-16, trained verifier | 60.0% | +4.0 | 10 | 6 | 0.45 |
| best-of-16, `qwen7b` | 56.0% | **0.0** | 8 | 8 | 1.00 |
| best-of-16, `math1.5b` | 53.0% | -3.0 | 3 | 6 | 0.51 |
| best-of-16, `qwen1.5b` | 50.0% | -6.0 | 2 | 8 | 0.11 |

**Both techniques deliver a large, significant gain over one chain, and they deliver the same
gain.** That is the finding, and it exists only because page 7's candidates made the comparison
possible. The book cannot state it because the book never runs it.

The practical reading is sharper than a tie: counting is free and selection costs a forward
pass per candidate. On this instrument you would take the vote.

**Why counting is so hard to beat here.** Self-consistency is a 0.923-AUC signal on this pool.
The 3B produces about five distinct answers per sixteen chains on MATH L4/5, so the crowd is
tight and counting is strong. A verifier must clear `majority / coverage` = 72% to draw with
it, and only the trained one does, at 77%.

**A 4-point margin is not reachable on this item set.** With 16% discordance, extending from
100 items to the entire level 4-5 band of 262 projects to roughly p = 0.12, for two and a half
times the generation cost. Chasing significance here is not a good use of the GPU, and the page
should state the tie rather than fund another attempt at breaking it.

---

## 4. The judge ladder

Five judges over identical candidates, spanning size, domain and training objective:

| judge | params | trained for | solves alone | reliability | 95% CI | AUC |
|---|---|---|---|---|---|---|
| `self` | 3B | chat, wrote the pile | 43% | 64% | 53-76 | 0.783 |
| `math1.5b` | 1.5B | mathematics | **64%** | 65% | 55-76 | - |
| `qwen7b` | 7B | chat | 60% | 71% | 60-81 | 0.851 |
| `qwen1.5b` | 1.5B | chat | 22% | 73% | 63-83 | 0.614 |
| **`skywork-prm`** | **1.5B** | **verification** | n/a | **77%** | **67-86** | **0.898** |

Three findings, in order of how much weight they carry:

1. **Being good at the task is not being good at judging it.** Solve rates of 22, 43, 60 and 64
   map to reliabilities of 73, 64, 71 and 65. Essentially unrelated, and if anything inverted.
   The domain specialist is the best solver on the ladder and the second-worst judge.
2. **Training for verification is what helps.** The only judge above the bar is the only one
   trained to verify, and it is a smallest-tier 1.5B. It is also the only rung that cannot be
   confounded: with no generative head, nothing it achieves can be explained by being better at
   mathematics than the model it grades.
3. **No pair of judges is individually resolved.** Every interval overlaps its neighbours. The
   pattern across five is the finding; no single comparison within it is.

**AUC does not predict argmax reliability.** `qwen1.5b` has the worst AUC and the best chat
reliability; `qwen7b` has a far better AUC and slightly worse reliability. An argmax reads the
tail of a score distribution and AUC averages its middle. The page should say this once,
because it is why a verifier that looks good on a discrimination metric can still pick badly.

---

## 5. Two claims from earlier drafts that the run falsified

**"Diversity feeds selection and starves counting."** Half wrong. Coverage is flat at 78% from
T=0.3 to T=0.9 and *falls* to 74% at T=1.2, while single-chain accuracy drops 17 points. The
30-item pilot showed coverage climbing and that did not survive 100 items. Diversity buys new
ways to be wrong. The bar does fall with temperature, 72% to 59%, but only because the vote
collapses, which is a smaller room to win in rather than a bigger one.

**"The bar falls with N, so run wider."** Much weaker than it looked. Judge reliability decays
with N at close to the rate the bar falls, 90/83/78/73 at N=2/4/8/16, because an argmax over
more candidates reaches further into the tail of a noisy score. At T=1.2 and N=64 the vote beats
best-of-N outright. More N raises the ceiling and does not close the gap.

Both are now claim flags in `derived.json` (`coverage_rises_with_temperature`,
`judge_ranking_resolved`) so neither can be asserted by accident.

---

## 6. The three figures

The notebook currently emits four, designed when the headline was "selection beats counting".
That headline is gone, the evidence for the one we have is undrawn, and the existing set is
cluttered.

### Figure discipline, because the current figures fail it

The four figures on disk carry seven lines on one axes, annotations that repeat the legend,
bracket arrows, shaded bands behind five overlapping series, and titles that describe the setup
rather than the finding. Rules for the rebuild, and a figure that breaks one does not ship:

- **Three series per axes, maximum.** The diagnostic rungs (`random`, `heuristic`, `logprob`,
  and the judges not being discussed) live in a printed table, never on a chart.
- **No annotation that repeats something already readable.** A bracket earns its place only by
  carrying a number that appears nowhere else on the figure.
- **The title states the finding, not the setup.** Model, n and temperature go in the caption.
- **One shaded band per panel at most.** Five translucent bands over each other is a smear.
- **No dual axes, ever.**

### Figure 1 — judge one batch two ways, and what that is worth

Two panels, full width, the deck's specimen-then-curve pattern.

**Left, the specimen**, rebuilding the old page's step 1 with real candidates:
`counting_and_probability/870`, four points on a circle, does AB cross CD. Sixteen real chains,
shown twice.

- *Counted*: the answers tallied. **1/2 takes 9 of 16 votes. The truth is 1/3.** The vote's
  winner ringed, and wrong.
- *Scored*: the same sixteen chains ordered by the verifier, its pick ringed, and right.

Same batch, same compute, two rules, two answers. This is the page's intuition and it is now a
measurement rather than a simulation. The old page had to invent an `appeal` vector to produce
this picture; the data produced it on its own, and nine of sixteen chains agreeing on a wrong
answer is a better attractor than the lily pad because nobody chose it.

**Right, the aggregate**: accuracy against N at T=0.6. Three lines only, one chain flat at 43%,
majority, best-of-N by the trained verifier reaching 60%, with the coverage ceiling as a light
dashed reference and no band on it.

### Figure 2 — the paired comparison

The strongest evidence on the page, and it has to be legible at a glance or it is worth nothing.

One row per rule. A single horizontal axis, **problems fixed to the right of zero, problems
broken to the left**, both counted against the same single-chain baseline on the same 100
problems. Rows ordered by net gain. The p-value sits at the end of each row as plain text.

Read it as: the trained verifier fixes 21 and breaks 4. Majority fixes 17 and breaks 4. The ch05
heuristic fixes 8 and breaks 16, the only row whose mass sits on the left.

**Eight rows** (revised 2026-08-08, was six), two colours, no bands, no second axis. If it needs a
legend it is too complicated: the two directions are labelled once, above the axis.

The two diagnostic rungs, `logprob` and `self`, stay on the chart rather than moving to a printed
table. The "diagnostics live in a table" rule above is about *series on shared axes*, where a
seventh line is a smear; here each rung is one row of its own and costs nothing but 30 pixels.
`logprob` earns its row by being the page's only exact null, nine fixed against nine broken, and
`self` by being the rung a reader asks about unprompted. What was actually wrong with them was that
they arrived as identifiers: every row now prints English, mapped in `page08.ts`, which throws on a
selector it cannot name. A row that reads `best-of-N (qwen1.5b)` is the fault; a row that reads
`best-of-N, 1.5B generalist` is evidence.

### Figure 3 — what a judge is worth

**One panel, not two.** What each judge solves on its own against the reliability it achieves,
five points, with the 72% bar as a horizontal line. That single panel carries the finding: the
points do not trend, and only the one that cannot solve anything sits above the line.

The reliability-against-accuracy scatter is cut. It restates figure 1 with extra steps.

Beside the figure, the worked case as text: the ω^1997 problem, where every judge preferred a
670-character wrong answer over the correct 2,456-character one and `qwen7b` scored the correct
one at -12.25.

**Retired:** the temperature-mechanism figure, demoted to section 5's sentence, and the bucket
figure, demoted to the trap base rate as a number. Both are real; neither earns a figure now.

### A side note the page must carry

**The trained verifier is a process reward model used as an outcome one.** It is read at the
final token only, one number for the whole solution, never per step. It is on this page as a
*trained verifier*, which is the property being tested, and not as a PRM, which is a different
claim. Step-level scoring is page 9's subject and this page deliberately does not spend it. One
margin note, and a forward reference: *more on this next page*.

## 7. Notebook refactor

| # | Change | Why |
|---|---|---|
| 1 | Four figures cut to three, per section 6, against the discipline rules | the set predates the result and is cluttered |
| 2 | New specimen panel: one real batch, counted and scored | the page's intuition, currently missing |
| 3 | New paired-comparison figure drawn from `PAIRED` | the headline is undrawn |
| 4 | Temperature and bucket figures demoted to printed numbers | neither earns a figure |
| 5 | Verifier-weighted vote computed and printed as one number | the closing sentence needs it |
| 6 | `derived.json` figure blocks renumbered to match | the page reads these keys |
| 7 | Prose in sections 0, 7 and 8 rewritten around the measured result | it still argues for a win we did not get |

The gate, the paired tests, the judge ladder, the holdout, the competence measurement and the
provenance checks stay as they are.

---

## 8. Page rebuild

- **Delete `LILY_PAD_MODEL` and the reliability slider** from `sim.ts`. The slider is replaced
  by the measured ladder in figure 3.
- **Lede, two sentences.** Counting asks what is most common. Judging asks what is best. On our
  data they arrive at the same place, and both beat asking once.
- **Cobbe et al. 2021 stays**, cited for the technique while the numbers on screen are ours.
  **Stroebl et al. 2024 stays** for the shape of the imperfect-verifier claim, which the ladder
  measures rather than asserts.
- **The chip** changes from *"seeded illustrative simulation"* to model, item set, N and date.
- **The page must not say the book found counting and selection equivalent.** It did not run
  that comparison. That result is ours.

---

## 9. Open decisions

1. **Is the figure set in section 6 right?** It retires two existing figures and adds one that
   does not exist yet. This is the main thing to approve.
2. **Lead with the win.** Settled. The resolved result opens the page and the tie takes the
   closing beat, where it hands to page 9.
3. **Verifier-weighted voting: a sentence and a number, not a figure element.** Settled. It
   beat plain voting in four of six cells and is free given the scores, but it is not best-of-N
   and a sixth row would cost figure 2 the clarity it is being rebuilt for. It appears as one
   measured sentence in the closing beat. *(If this reading of the decision is wrong, say so
   before the notebook refactor.)*
4. **Does page 9 still get process supervision?** Yes. The verifier is read at the final token
   only, one number per solution, which is the outcome reading by construction.
