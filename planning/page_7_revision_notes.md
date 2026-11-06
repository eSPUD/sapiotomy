# Page 7: revision notes (2026-11-05)

The author's thoughts after walking the page, to be discussed and made one at a time.
Nothing below is implemented yet. Already done on this branch, uncommitted: section 2 cut
to one figure (the tally; heat map and shape stat removed, chains folded until clicked).

## The arc

1. Section 1: how people do it (the classroom, four methods, one answer).
2. Section 2: how you make a model do it (sixteen different chains from one prompt).
3. Section 3: temperature, then how the vote fares against one plain chain.
4. Section 4: what it costs.
5. Section 5: reworked after 1 to 4 settle.

## Section 2: how you get sixteen different chains

**Author's idea.** Section 1 is the human approach; section 2 should show the model's: a
quick showcase of how the model was prompted to produce 16 different chains. The tally
figure stays, after it, as "below you can explore the results more deeply".

**What the run did** (from the notebook and `page-07-derived.json`):
- One chat turn, user role only, the problem rendered by `render_prompt` (not yet found in
  the notebook's own code; check where it lives before quoting the prompt on the page).
- The SAME prompt every time. The chains differ only because sampling is on: temperature T,
  top-p 0.95 held fixed "so temperature is the only diversity knob", a seed per problem,
  configuration and group, generated 8 at a time (`num_return_sequences = 8`).
- Each chain capped at 2,048 tokens.

**To discuss.**
- What the showcase is: the prompt once, then the same prompt fanned out into 16 chains
  (sampling on), each ending in an answer, feeding the tally? Or a Play animation like
  page 5's?
- Does temperature get introduced here (it is what makes the chains differ) or in
  section 3 as the author suggests? If here, section 3's bar chart could illustrate it.
- The forced commit at the cap (flagged: our rule is that a capped chain just stops). The
  showcase would put the procedure on the page, so this needs deciding first.

## Section 3: temperature first, then the vote against one chain

**Author's idea.** Move the bar chart that sits under the figure (different answers among
16 chains, by temperature) ABOVE the figure, to introduce temperature. The line chart
follows: "Raising the temperature, however, does not mean better results. Let's look at
how majority voting fares against pure chain of thought on MATH-500."

**What the data has** (`page-07-heatmap.json`, 40 problems, 12 temperatures):
- Distinct answers per temperature: 1.0 at T = 0, 4.0 at T = 0.1, rising with T.
- One chain alone falls as T rises: 50% at T = 0.1, 37% at T = 1.1.
- The vote peaks at T = 0.3 (60% at 16 chains), tied with T = 0.5; greedy is 40%.

**To discuss.**
- The bar chart's caption already carries the "more is not better" point; with the chart
  moved up it becomes the bridge sentence the author wrote.
- The 40-problem / 100-problem mix: section 3 is on 40, sections 4 and 5 on 100.
- "Show what the vote threw away" (the third line) lives in section 3 today and overlaps
  section 5.

## Section 4: cost, not a shared budget

**Author's idea.** Section 4 should be about the token difference and the cost of majority
voting against greedy decoding, not about dividing a fixed budget.

**What the data has.**
- Tokens per problem from the sweep curves (40 problems): greedy 642 tokens for one chain;
  at T = 0.3, 580 for one chain, 2,334 for 4, 4,689 for 8, 9,351 for 16.
- Wall-clock on the RTX 5080 (100 problems, `runs/page-07-section-3-timing/timing.json`):
  greedy, 100 chains, 69,320 tokens, 12.1 min; vote, 16 chains at T = 0.3, 1,600 chains,
  993,116 tokens, 37.1 min. 14x the tokens, 3x the time: batching soaks up most of it
  (95.5 against 445.9 tokens a second).
- Accuracy for that spend: 40% to 60% on the 40 problems.

**To discuss.**
- Tokens, time, or both? The tokens-versus-time gap (batching) is a real point and a
  surprising one.
- What happens to the shared-budget figure: cut, or kept as a short aside? Its finding
  ("the cap fails, not the split") is measured and is page 8's lead-in.
- Same denominator as section 3 (40) or the timing run's 100.

## Section 5

Rework after sections 2 to 4 settle. It currently says the right answer was in the pile on
78% of problems and the vote returned it on 55%, with ties on 10%.

## Standing flags on this page

- The notebook still forces a boxed answer on chains that hit the cap.
- The lede opens "Page 6 made one chain longer": refer to the idea, not the page number.
- The lede and section 1 predate the pattern refined on pages 1 to 5.
