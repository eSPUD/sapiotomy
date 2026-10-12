# Page 8 refinement plan: Best-of-N

**Status:** plan. The intro and figure 1 are built (branch `dev/page-8-refinement`). Everything else waits for page 7's new chains.
**Opened:** 2026-10-11.
**Trigger:** implement as soon as page 7's new chains (the 12-temperature run on the Linux branch) are integrated.
**Supersedes:** `docs/page_8_refactor.md`, `docs/page_8_measured_payoff.md` and `docs/page_8_best_of_n_experiment.md` for what the page shows. Those stay as history of the measurement.

## What the page shows

1. What Best-of-N is, in simple terms. An intro with little prose.
2. The Best-of-N process, visualised.
3. What Best-of-N costs.
4. How Best-of-N compares with majority voting.

The intro follows pages 1 to 5, not page 7: a few plain sentences, one bold term, no results.

## Page outline

### Intro (done)

Chain of thought → majority voting → what if we judged each answer instead of counting → **Best-of-N sampling**.

### Section 1. How Best-of-N works (figure 1 done)

**Figure 1** is the sister's-age demo (`BestOfNDemo` in `Page8.tsx`). "When I was 6, my sister was half my age. Now I'm 70. How old is my sister?" Four chains of thought (35, 67, 35, 64; the answer is 67), three presses:

- **Generate.** The model answers the same question 4 times, each chain written without seeing the others.
- **Judge.** A second model reads one chain at a time (question + chain → judge → how likely it is right). Only the outcome is scored.
- **Keep the best.** The highest-rated chain is kept and the rest are thrown away.

It is illustrative and says so. Its ratings are authored and appear nowhere else on the page.

Rules the figure must keep:

- No majority vote in this figure. It shows the mechanism only.
- No ✓/✗ checks. The judge is a trained model, not a checker: it never sees the answer key and does not plug answers back into the question.
- One rating per chain, never per step. Grading steps is page 9's subject.

To do: rename the heading (now "Judge one batch two ways") to something like "Generate, judge, keep the best". Delete the old paragraph after the demo, which introduces the retired figure.

**The anchor sentence, from Cobbe et al. 2021 (ref 1, already cited).** Section 1's prose rests on it the way page 7's rests on Wang et al. From the abstract of *Training Verifiers to Solve Math Word Problems* (arXiv 2110.14168), verified against arXiv on 2026-10-11:

> "we propose training verifiers to judge the correctness of model completions. At test time, we generate many candidate solutions and select the one ranked highest by the verifier."

It sits under figure 1 as the formal version of what the demo just showed: generate, judge, keep the best. The citation goes in the margin. The intro names Best-of-N, figure 1 shows it, and this sentence defines it.

### Section 2. Best-of-N on 100 problems

**Figure 2: heat map, 100 problems × 16 chains.** This replaces the old figure 2. Both of its panels are retired: the one-problem dot plot and the accuracy-against-N curves.

- **Rows:** the 100 MATH-500 problems, ordered by how many of their 16 chains are correct.
- **Columns:** each problem's 16 chains, sorted by judge score, highest on the left. Column 1 is the chain Best-of-N keeps.
- **Cells:** one chain each, correct or wrong. Click a cell to read the chain, as on page 7.
- **Reading it:** the map falls into bands. All correct is easy problems. All wrong means there is nothing for the judge to find. In the mixed middle, whether column 1 is correct is whether the judge found the right chain.

**How it relates to page 7's heat map.** Page 7's map is problems × temperatures, and each cell packs 16 chains into one ratio and the vote's result. Page 8's map is problems × chains at one temperature, so one row here is one cell of page 7's map opened into its 16 chains. The caption says so in one line. Both maps use the same colours and the same row order.

### Section 3. Chain of thought vs majority vote vs Best-of-N

**Figure 3: three bars on the same 100 problems and the same chains.**

- **Bars:** one chain (chain of thought), majority vote over 16, and Best-of-N over 16 with the trained verifier.
- **Ceiling line:** "a correct answer is among the 16", the most any selection rule can reach.
- **Temperature:** page 7's headline temperature, fixed before looking at page 8's results. Do not pick the temperature where voting or Best-of-N did best.
- **Honesty:** if the vote-against-Best-of-N gap does not resolve, the chart shows the two as level and the text says so. The current run has Best-of-N about 4 points ahead at p = 0.45, which is not a difference.

This replaces the current "What each rule fixed, and what it broke" figure. Its fixed/broken counts may survive as the detail under the bars.

Temperature is not a topic on this page. Page 7 owns it. One sentence carries the link: Best-of-N needs different chains for the same reason voting does, because at temperature 0 the judge has 16 copies to choose from.

### Section 4. The cost

**Figure 4: what each method pays for N chains**, measured in tokens from the run where possible.

- **One chain:** 1 generation.
- **Majority vote:** N generations.
- **Best-of-N:** N generations + N judge reads.

The point: the judge is a second model, so Best-of-N pays more than voting for about the same accuracy on this run.

### Section 5. What a judge is worth (cannot be omitted)

Page 7 shows that the most common answer is not always right. This section shows the same for Best-of-N: the chain the judge rates highest is not always right. It must stay small. No new chart types.

- **Point back at figure 2.** A row with a correct chain somewhere but a wrong chain in column 1 is a problem where the judge kept the wrong chain. Figure 2 marks those rows. The text gives one count: on X of the Y problems where a right chain was in the pile, the judge kept a wrong one.
- **Figure 5: one real miss, drawn like figure 1.** One problem from the new chains where the judge rated a wrong chain highest while a correct chain sat lower. A few chain cards with their ratings, figure 1's layout, except the kept card is wrong. Measured, so it carries the model and benchmark like the other measured figures.
- **The five-judge ladder leaves the page.** Its finding stays as one sentence: what a judge can solve does not predict what it can select; what it was trained for does. The full comparison stays in the download.
- **Not drawn:** a problem where the judge is wrong and the right answer was also the most common. It makes the same point twice.

## Data

1. **Chains.** Use page 7's new chains so all three bars read the same candidates. The current file records `same_candidates: false` against page 7.
2. **Scoring.** Score page 7's chains at the headline temperature with the trained verifier: 100 × 16 = 1,600 judge reads. Scoring all 12 temperatures (19,200 reads) is optional. It would only check that the bars keep their order at other temperatures, and that result belongs in the download, not on the page.
3. **Export** these new fields to `page-08-derived.json`:
   - per problem: its 16 chains, each correct/wrong with its judge score (figure 2)
   - one-chain, vote and Best-of-N accuracy, and the "correct answer present" ceiling (figure 3)
   - tokens generated per chain and tokens read by the judge (figure 4)
   - the judge-miss count, and one specimen problem where the top-rated chain is wrong and a lower-rated chain is right, with its chains' text and ratings (section 5)
4. **Loader.** Extend `web/src/lib/page08.ts` gates for the new fields: every row has 16 chains, column 1 is the top score, and the bars agree with the per-problem data.
5. **Notebook.** Check `repoNotebookIsTheShippedOne` before editing `page_08_best_of_n.ipynb`. The notebook is large, so edit it by JSON parse-modify-dump, not by reading the whole file.

## Order of work

1. Integrate page 7's new chains (Linux branch).
2. Score them with the verifier and export the new fields.
3. Section 1 cleanup: the heading and the old paragraph.
4. Figure 2 heat map.
5. Figure 3 comparison bars.
6. Figure 4 cost.
7. Section 5: mark the judge's misses on figure 2, then figure 5.
8. Retire what is no longer drawn: the `SpecimenPanel` and curve panel, `PairedFigure` if replaced, `JudgeFigure` (the five-judge ladder), their tests, and any `page08.ts` fields nothing reads.
