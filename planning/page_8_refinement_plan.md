# Page 8 refinement plan: Best-of-N

**Status:** plan. The intro and figure 1 are built (branch `dev/page-8-refinement`). The rest is built on page 7's temperature sweep now, and widened when page 7's 100-problem run lands.
**Opened:** 2026-10-11. **Revised:** 2026-10-11, the 40-problem version and no cost figure.
**Trigger:** page 7's temperature sweep is integrated (12 temperatures × 16 chains × 40 randomly drawn problems, `notebooks/runs/page-07-temperature-sweep.zip`), so the 40-problem version starts now.
**Two stages.** Now: every measured figure is drawn on the sweep's 40 problems. Later: page 7 is running a 100-problem version; when it completes, page 8 re-scores those chains and rebuilds the same figures on them. Nothing on the page changes shape between the two, only the problem count.
**Supersedes:** `docs/page_8_refactor.md`, `docs/page_8_measured_payoff.md` and `docs/page_8_best_of_n_experiment.md` for what the page shows. Those stay as history of the measurement.

## What the page shows

1. What Best-of-N is, in simple terms. An intro with little prose.
2. The Best-of-N process, visualised.
3. How Best-of-N compares with majority voting.
4. What Best-of-N costs, in one sentence.
5. What a judge is worth.

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

### Section 2. Best-of-N on 40 problems

**Figure 2: heat map, 40 problems × 16 chains.** (100 problems once page 7's 100-problem run lands.) This replaces the old figure 2. Both of its panels are retired: the one-problem dot plot and the accuracy-against-N curves.

- **Rows:** the sweep's 40 MATH-500 problems, ordered by how many of their 16 chains are correct.
- **Columns:** each problem's 16 chains, sorted by judge score, highest on the left. Column 1 is the chain Best-of-N keeps.
- **Cells:** one chain each, correct or wrong. Click a cell to read the chain, as on page 7.
- **Reading it:** the map falls into bands. All correct is easy problems. All wrong means there is nothing for the judge to find. In the mixed middle, whether column 1 is correct is whether the judge found the right chain.

**How it relates to page 7's heat map.** Page 7's map is problems × temperatures, and each cell packs 16 chains into one ratio and the vote's result. Page 8's map is problems × chains at one temperature, so one row here is one cell of page 7's T = 0.3 column opened into its 16 chains. On the 40-problem version that is literally true: the rows are page 7's rows. The caption says so in one line. Both maps use the same colours.

### Section 3. Chain of thought vs majority vote vs Best-of-N

**Figure 3: three bars on the same 40 problems and the same chains.**

- **Bars:** one chain (chain of thought), majority vote over 16, and Best-of-N over 16 with the trained verifier.
- **Ceiling line:** "a correct answer is among the 16", the most any selection rule can reach.
- **Temperature:** page 7's headline temperature, fixed before looking at page 8's results. Do not pick the temperature where voting or Best-of-N did best.
- **Honesty:** if the vote-against-Best-of-N gap does not resolve, the chart shows the two as level and the text says so. The old run had Best-of-N about 4 points ahead on 100 problems at p = 0.45, which is not a difference; on 40 problems a gap is even less likely to resolve, so the text must be written to survive either outcome.

This replaces the current "What each rule fixed, and what it broke" figure. Its fixed/broken counts may survive as the detail under the bars.

Temperature is not a topic on this page. Page 7 owns it. One sentence carries the link: Best-of-N needs different chains for the same reason voting does, because at temperature 0 the judge has 16 copies to choose from.

### Section 4. The cost (no figure)

**Built 2026-10-11 as one sentence under figure 3, in section 3; section 4 is now what a judge is worth.** No figure. One sentence: Best-of-N pays what page 7's majority vote pays, N chains, plus a verifier model reading each of them once. The verifier here is a 1.5B model reading a 3B model's chains. Where it helps, the sentence can give the number of chains and that the verifier reads but does not write. Nothing is measured for this section.

### Section 5. What a judge is worth (cannot be omitted; stays in the 40-problem version)

**On the page as section 4.** The prose outside its figure is cut to what reading the figure needs: five judges scored the same chains, and which one is the trained verifier.

Page 7 shows that the most common answer is not always right. This section shows the same for Best-of-N: the chain the judge rates highest is not always right. It must stay small. No new chart types.

- **Point back at figure 2.** A row with a correct chain somewhere but a wrong chain in column 1 is a problem where the judge kept the wrong chain. Figure 2 marks those rows. The text gives one count: on X of the Y problems where a right chain was in the pile, the judge kept a wrong one.
- **Figure 4: one real miss, drawn like figure 1.** One problem from the new chains where the judge rated a wrong chain highest while a correct chain sat lower. A few chain cards with their ratings, figure 1's layout, except the kept card is wrong. Measured, so it carries the model and benchmark like the other measured figures.
- **The five-judge ladder leaves the page.** Its finding stays as one sentence: what a judge can solve does not predict what it can select; what it was trained for does. The full comparison stays in the download.
- **Not drawn:** a problem where the judge is wrong and the right answer was also the most common. It makes the same point twice.

## Data

1. **Chains.** Use page 7's new chains so all three bars read the same candidates. The current file records `same_candidates: false` against page 7.
2. **Scoring.** Score the sweep's chains at the headline temperature (T = 0.3) with the trained verifier: 40 × 16 = 640 judge reads. At T = 0.3 the sweep reused page 7's pile, so these are the pile's chains for those 40 problems. Scoring all 12 temperatures (7,680 reads) is optional; it would only check that the bars keep their order at other temperatures, and that belongs in the download, not on the page. When the 100-problem run lands, score its T = 0.3 chains the same way and re-run the builder.
   - Script: `notebooks/page_08_pile_scores.py` (GPU; reuses the notebook's own `ValueHeadRM` and `reward_score`; `--check K` re-scores K chains page 8 already published and compares).
   - Builder: `notebooks/page_08_pile_site_data.py` (no GPU; refuses to write unless its vote, chain accuracy and ceiling match page 7's).
   - Needs `Skywork/Skywork-o1-Open-PRM-Qwen-2.5-1.5B` downloaded (about 3 GB), and a free GPU.
3. **Export** these fields to `web/data/page-08-pile.json` (the builder's file, kept apart from the notebook's `page-08-derived.json` the way page 7 keeps `page-07-heatmap.json`), with chain text split per problem under `web/data/page-08-chains/` and loaded when a reader opens a chain:
   - per problem: its 16 chains, each correct/wrong with its judge score (figure 2)
   - one-chain, vote and Best-of-N accuracy, and the "correct answer present" ceiling (figure 3), recomputed from page 7's chains, never typed in
   - the judge-miss count, and one specimen problem where the top-rated chain is wrong and a lower-rated chain is right, with its chains' text and ratings (section 5)
4. **Loader.** Extend `web/src/lib/page08.ts` gates for the new fields: every row has 16 chains, column 1 is the top score, and the bars agree with the per-problem data.
5. **Notebook.** Check `repoNotebookIsTheShippedOne` before editing `page_08_best_of_n.ipynb`. The notebook is large, so edit it by JSON parse-modify-dump, not by reading the whole file.

## Order of work

1. Integrate page 7's temperature sweep. Done (merged into this branch).
2. Download the Skywork weights, score the sweep's 640 T = 0.3 chains, and build the data file.
3. Section 1 cleanup: the heading and the old paragraph.
4. Figure 2 heat map.
5. Figure 3 comparison bars.
6. Section 4: the cost sentence.
7. Section 5: mark the judge's misses on figure 2, then figure 4.
8. When page 7's 100-problem run lands: score its T = 0.3 chains, re-run the builder, and update the counts in the prose.
9. Retire what is no longer drawn: the `SpecimenPanel` and curve panel, `PairedFigure` if replaced, `JudgeFigure` (the five-judge ladder), their tests, and any `page08.ts` fields nothing reads.
