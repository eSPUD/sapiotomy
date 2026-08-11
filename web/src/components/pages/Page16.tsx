"use client";

/**
 * Page 16, "Wrap-Up: What You Now Know". The deck's last page, added the same
 * day pages 15, 16, 18 and 19 were cut and page 17 became 15.
 *
 * The trap a closing page falls into is retelling. Fifteen pages summarised in
 * order is a page nobody reads and nobody needs, because a reader who wants the
 * summary has the contents list. So this page does two things the deck could
 * not do earlier and could not do anywhere else.
 *
 * SECTION 1 IS THE ONE CHART THE DECK COULD NEVER DRAW. Every lever in Act 2
 * was measured on the same hundred MATH-500 level 4 and 5 problems, and each
 * page drew its own lever against its own baseline. Only now, with all of them
 * behind the reader, can they go on one axis: no chain at all, one chain,
 * sixteen identical chains, sixteen sampled chains voted, sixteen chains with a
 * trained judge picking, and then the coverage line above all of them. The
 * shape is the argument. The steps get smaller, and the last one does not
 * happen: there is a wide gap between what the generator found and what any
 * selector kept. A dashed rule marks where a model twice the size lands with
 * one greedy chain, which is page 11's crossing said in one line.
 *
 * The comparability is load-bearing and is enforced in `lib/page16.ts` rather
 * than promised here: the rungs come from one pool wherever a comparison is
 * being made, the two that do not are labelled with the page that measured
 * them, and the module refuses to build the ladder at all if those runs stop
 * agreeing about how many problems they saw.
 *
 * SECTION 2 IS THE CONCEPT CHECK. Ten questions, every one
 * about a mechanism rather than a magnitude: which failure a second pass can
 * reach, why a vote needs disagreement, why coverage is not accuracy, what a
 * run is entitled to claim at p = 0.45. The numbers in the stems are
 * interpolated from the measured modules, so a re-run cannot leave a question
 * quoting a figure the deck no longer draws. Each question resolves as it is
 * answered and says which page it came from, so a miss is a pointer rather than
 * a mark. The options are re-scrambled on every load and on every Start over
 * (Quiz.tsx), so position never becomes the tell.
 *
 * It was twelve questions, one per page, until 2026-08-10. Pages 8 and 11 lost
 * theirs, so it is ten and the one-per-page claim is gone from the copy with
 * them; if a question is ever added back, put it where its page falls in the
 * order, since the section still reads in the deck's order.
 *
 * THE PAGE NO LONGER CLOSES ON WHAT IT DID NOT SETTLE. Section 3 carried two
 * open items, the contamination discount and page 15's question about whether
 * the chain is the real reason, and was cut on 2026-08-10 by request. Two things
 * that outlived it and should not be quietly dropped as well: SUBMISSION.md
 * still says this page closes on those two items and still says the
 * contamination discount is stated on pages 15 AND 16, and the closing sentence
 * below still ends the deck on the chain not being shown to be the reason, which
 * is now the only place on this page that says so.
 *
 * NO NEW DATA. This page loads nothing of its own. If a number here disagrees
 * with the page it came from, the deck is contradicting itself in front of the
 * reader on its last page, which is why nothing below is retyped by hand.
 */

import { ChartFrame } from "@/components/ChartFrame";
import { PageNav } from "@/components/PageNav";
import { Quiz } from "@/components/Quiz";
import {
  ADAPTIVE_NULL,
  ITEM_COUNT,
  LADDER,
  NOTEBOOKS,
  QUIZ,
  WRITER,
  pct,
} from "@/lib/page16";
import { ACTS, getPage } from "@/lib/pages";
import { PAGE17 } from "@/lib/page17";
import { useStore } from "@/store/useStore";

/**
 * One numbered lesson. Numbered because they are read as a set and refer to
 * each other: takeaway 4 is the answer to takeaway 3, and takeaway 5 is the
 * elaborate version of it.
 */
function Takeaway({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-grid bg-surface p-3">
      <h3 className="flex gap-2.5 text-sm font-semibold text-ink">
        <span className="font-mono text-ink-muted">{n}.</span>
        <span>{title}</span>
      </h3>
      <p className="mt-1 pl-6 text-sm text-ink-muted">{children}</p>
    </section>
  );
}

const PAGE_N = 16;

/* ------------------------------------------------------------- the ladder */

const W = 700;
const ROW = 32;
// The deck's bar-chart grammar, kept from every other page that draws one: a
// label gutter wide enough for the longest row, and readouts that ride the end
// of their own bar. Not a table with columns, which is what this became for one
// revision and what pulled the eye off the bars.
const M = { top: 12, right: 56, bottom: 34, left: 272 };
const IW = W - M.left - M.right;
const H = LADDER.length * ROW + M.top + M.bottom;
const IH = H - M.top - M.bottom;

const x = (v: number) => v * IW;

/**
 * The toolbox on one axis, floor to ceiling.
 *
 * Bars are the rungs the deck measured; the coverage rung is hollow because it
 * is not a technique, it is what a perfect selector would have reached, and the
 * gap between it and the best solid bar is filled rather than left for the
 * reader to measure by eye.
 *
 * Two things here are not decoration. The dashed rule marks where the best
 * selector and a model twice the size land at the same accuracy, which is the
 * comparison the last row exists to make. And page 9's rung carries a baseline
 * tick on the bar, because its run is not the others' and the only honest
 * reading of it is the distance from that tick.
 *
 * The rungs are grouped in `LADDER` and the grouping is NOT drawn. Headings
 * over the groups turned a chart into a table of contents: they doubled the
 * chart's height, pushed the labels away from their bars and made the eye track
 * horizontally to find a score. The grouping still orders the rows, and the
 * prose under the chart names the three movements.
 */
function Ladder() {
  const solid = LADDER.filter((r) => !r.ceiling && r.band !== "elsewhere");
  const best = Math.max(...solid.map((r) => r.accuracy));
  const ceiling = LADDER.find((r) => r.ceiling);
  return (
    <ChartFrame
      title={`What each lever scored on the same ${ITEM_COUNT} problems. ${LADDER.map(
        (r) =>
          `${r.label}, ${pct(r.accuracy)}${
            // Spoken without its baseline, page 9's rung is a bare 58% sitting
            // under page 8's 60%, which is the exact misreading the tick on the
            // bar exists to prevent for sighted readers.
            r.baseline !== undefined
              ? `, up from ${pct(r.baseline)} on that run's own vote`
              : ""
          }`,
      ).join(". ")}. The steps get smaller as you go, and a wide gap is left between the best selector and the answers that were generated and not picked. Every chain on the chart was written by ${WRITER}.`}
      width={W}
      height={H}
      margin={M}
      xLabel={`accuracy on ${ITEM_COUNT} MATH-500 level 4 and 5 problems`}
    >
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <g key={t}>
          <line x1={x(t)} x2={x(t)} y1={0} y2={IH} className="stroke-grid" strokeWidth={1} />
          <text x={x(t)} y={IH + 16} textAnchor="middle" className="fill-ink-muted text-[10px]">
            {t * 100}
          </text>
        </g>
      ))}

      {/* What was generated and never picked: the one gap the page argues about. */}
      {ceiling ? (
        <rect
          x={x(best)}
          y={0}
          width={x(ceiling.accuracy) - x(best)}
          height={IH}
          className="fill-wrong opacity-[0.08]"
        />
      ) : null}

      {LADDER.map((r, i) => {
        const y = i * ROW + 6;
        const h = ROW - 12;
        const base = r.baseline ?? 0;
        return (
          <g key={r.label}>
            {/* Label and source in ONE right-aligned run, ending at the bar. The
                page tag used to sit in the plot at a fixed offset past the value,
                which collided with the value on every short bar. */}
            <text x={-10} y={y + h - 3} textAnchor="end" className="text-[11px]">
              <tspan className={r.ceiling ? "fill-ink-muted italic" : "fill-ink"}>{r.label}</tspan>
              <tspan className="fill-ink-muted"> · page {r.page}</tspan>
            </text>

            {r.ceiling ? (
              <rect
                x={0}
                y={y}
                width={x(r.accuracy)}
                height={h}
                fill="none"
                strokeDasharray="3 2"
                className="stroke-wrong"
                strokeWidth={1.5}
              />
            ) : (
              <rect
                x={0}
                y={y}
                width={x(r.accuracy)}
                height={h}
                className={
                  r.band === "elsewhere"
                    ? "fill-correct"
                    : r.accuracy === best
                      ? "fill-compute"
                      : "fill-ink opacity-40"
                }
              />
            )}

            {/* Page 9's run is not the others'. Its rung may only be read as the
                distance from its own vote, so that vote is drawn on the bar. */}
            {r.baseline !== undefined ? (
              <>
                <line
                  x1={x(base)}
                  x2={x(base)}
                  y1={y - 2}
                  y2={y + h + 2}
                  className="stroke-canvas"
                  strokeWidth={2}
                />
                <text
                  x={x(base) - 4}
                  y={y + h - 3}
                  textAnchor="end"
                  className="fill-canvas text-[10px] font-semibold"
                >
                  {pct(base)}
                </text>
              </>
            ) : null}

            {/* The readouts ride the bar rather than sitting in a column, so a
                row is read left to right in one move and the eye never leaves
                the bar it is reading. */}
            <text
              x={x(r.accuracy) + 6}
              y={y + h - 3}
              className={`text-[11px] font-semibold tabular-nums ${
                r.ceiling ? "fill-wrong" : "fill-ink"
              }`}
            >
              {pct(r.accuracy)}
            </text>
          </g>
        );
      })}
    </ChartFrame>
  );
}

/* -------------------------------------------------------------------- page */

export function Page16() {
  const page = getPage(PAGE_N)!;
  const recordInteraction = useStore((s) => s.recordInteraction);
  const ceiling = LADDER.find((r) => r.ceiling)!;
  const best = LADDER.filter((r) => !r.ceiling && r.band !== "elsewhere").reduce((a, b) =>
    b.accuracy > a.accuracy ? b : a,
  );

  return (
    <article className="flex flex-col gap-6">
      {/* Pages 5 to 10 each put their run's download here, beside the act kicker,
          and a reader who has come through Act 2 has learned to look here for it.
          This page draws five runs rather than one, so it carries five, but they
          belong in the same place rather than buried under the figure they source. */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="text-xs uppercase tracking-wide text-ink-muted">
          Act {page.act} · {ACTS[page.act].title}
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-ink-muted">the runs behind the chart:</span>
          {NOTEBOOKS.map((n) => (
            <a
              key={n.page}
              href={n.href}
              download
              aria-label={`Page ${n.page}: ${n.title}. Download the notebook and traces, zip, ${n.size}`}
              className="rounded border border-grid px-2 py-1 text-xs text-ink-muted hover:text-ink"
            >
              page {n.page} ({n.size}) ↓
            </a>
          ))}
        </div>
      </div>
      <h1 className="text-3xl font-bold text-ink">
        <span className="font-mono text-ink-muted">{page.n}. </span>
        {page.title}
      </h1>
      <p className="max-w-2xl text-lg text-ink-muted">
        The past fifteen pages are a small but mighty snapshot of what inference-time scaling is
        under the hood. Reasoning turned out to be{" "}
        <strong className="text-ink">one knob that can be turned many different ways</strong>, and
        that can even be moved from one axis to another. Here is every lever on the first axis,
        measured on the same problems the pages showed you. Then ten questions, to see whether the
        mechanisms landed rather than whether the numbers stuck.
      </p>

      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold text-ink">
          1. The whole toolbox, on one axis
          <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
            our runs · {ITEM_COUNT} problems · pages 5 to 11
          </span>
        </h2>
        <p className="max-w-2xl text-ink">
          Each page measured its own lever against its own baseline, so none of them could draw
          this. Now that all of them are behind you, they go on one axis, priced in the compute
          they actually spent.
        </p>
        <Ladder />

        {/* The chart's one caption. It replaces four paragraphs that restated
            every rung in prose: the rungs are legible, and what a reader cannot
            get from the picture is the SHAPE, which is what this says. The
            numbers those paragraphs carried are spent once, in the takeaways.

            The clause about a 128-token chain scoring what no chain scores went
            with the rung it described. Do not reinstate it: there is no longer a
            bar on this chart behind it. */}
        <p className="max-w-2xl border-l-2 border-grid pl-3 text-sm text-ink-muted">
          Read it top to bottom as steps that keep getting smaller. Writing the reasoning at all is
          the largest single move on the chart, and being made to write more of it is the only step
          that goes backwards.
        </p>

        {/* The one thing a reader needs in order to read the chart correctly, and
            nothing else. The downloads used to sit here and were moved to the top
            line on 2026-08-10: they are provenance, and a list of five zips between
            the chart and the conclusions interrupted the argument at its seam. */}
        <p className="max-w-2xl border-l-2 border-grid pl-3 text-sm text-ink-muted">
          <strong className="text-ink">Every chain above was written by {WRITER}.</strong> One model
          wrote all of it. What changes down the chart is how many chains it was allowed to write
          and what got to pick between them, never who was writing; where a judge appears it scores
          chains, it does not write them. The run behind each rung is linked at the top of this
          page, traces included, so any of them can be re-derived without a GPU.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {/* The conclusions carry NO figures and NO model names, deliberately. The
            chart directly above is where the numbers live, priced and sourced; a
            reader who wants one reads it off the rung. Restating them here made
            six dense paragraphs a reader had to decode a second time, right at the
            point where the deck should be handing over an idea rather than a
            table. Every claim below is still exactly what its rung shows, and the
            counterweights travel with their claims. Do not reintroduce percentages
            here as the page tightens: the ladder is the evidence, this is what it
            means. */}
        <h2 className="text-xl font-semibold text-ink">
          1b. Conclusions
          <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
            six things the chart is evidence for
          </span>
        </h2>
        <div className="flex max-w-2xl flex-col gap-3">
          <Takeaway n={1} title="Letting the model reason wins, every time">
            Ask for the answer on its own and it mostly gets it wrong. Let it write its working
            first, on the same problems, and it gets far more of them right. But making it write{" "}
            <em>more</em> working, when it has nothing new to go on, is a different thing: it costs
            a great deal more and turns about as many answers wrong as it turns right. Reasoning is
            worth having. It is not worth forcing.
          </Takeaway>

          <Takeaway n={2} title="The answer is usually already in the pile">
            Ask the same question many times and a right answer turns up far more often than any
            rule we tried managed to pick out. The gap between what was found and what was chosen is
            not a thinking problem, and sampling harder does not close it.
          </Takeaway>

          <Takeaway n={3} title="So the judge is the bottleneck, and judges can barely read">
            Something has to choose. An arithmetic checker can only mark the small part of a chain
            that is arithmetic, and the rest is prose it cannot read at all. Meanwhile the more
            variety you buy by sampling, the worse every model asked to judge gets, while a model{" "}
            <strong className="text-ink">trained to score</strong> holds steady. So you want a
            trained judge. But sampling and judging your way to what a bigger model reaches on its
            own costs many times more compute than simply using the bigger model.
          </Takeaway>

          <Takeaway n={4} title="Adaptive compute is where that points, not where it lands">
            Spend more on the hard questions and less on the easy ones, rather than the same on all
            of them. That is the obvious next move, and this deck could not make it pay: even
            picking the best stopping point for each question with hindsight bought no more per unit
            of compute than plain resampling. Knowing where to spend only helps if you can know it
            in advance.
          </Takeaway>

          <Takeaway n={5} title="And you pay for every node you look at">
            Branching through partial chains and cutting the bad ones sounds cheaper than it is. You
            pay for a branch before you can judge it, so pruning never refunds what looking cost. It
            has no bar here because this deck never ran it, and running it would mean holding a
            second, larger model in memory beside the one doing the writing.
          </Takeaway>

          <Takeaway n={6} title="And the biggest move in this story is not on this axis">
            The largest jump in the whole deck came from none of the levers on this chart. It came
            from taking a small model and training it on the reasoning of a much stronger one. It is
            not a bar here because it was not the same test: the published result covers every
            difficulty level and this chart is only the hardest ones, and our own models score
            noticeably higher on the easier mix. So part of that gap is the easier test and part is
            the training, and this deck cannot tell you how it splits.
          </Takeaway>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold text-ink">
          2. Ten questions
          <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
            concepts, not numbers
          </span>
        </h2>
        <p className="max-w-2xl text-ink">
          In the deck&apos;s order. Each answers itself as soon as you pick, and says which page it
          came from. The options are shuffled on every visit, so where an answer sat last time tells
          you nothing. Nothing here needs a number memorised: where a figure appears it is the
          setting the question is asked in, not the thing being asked.
        </p>
        <Quiz questions={QUIZ} onAnswer={() => recordInteraction(PAGE_N)} />
      </div>


      <div className="max-w-2xl rounded-lg border-l-4 border-compute bg-surface p-4 text-ink">
        The one sentence to leave with: a model can get dramatically better answers by thinking
        longer at answer time, the gains are real and measured and each one has a price and a
        ceiling, and every one of them is paid in text that nobody has yet shown is the reason for
        the answer.{" "}
        <em className="text-ink-muted">That is where the field is, and where you now are.</em>
      </div>

      <PageNav n={PAGE_N} />
    </article>
  );
}
