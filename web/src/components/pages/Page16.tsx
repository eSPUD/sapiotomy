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
 * SECTION 2 IS THE CONCEPT CHECK. Twelve questions, one per page, every one
 * about a mechanism rather than a magnitude: which failure a second pass can
 * reach, why a vote needs disagreement, why coverage is not accuracy, what a
 * run is entitled to claim at p = 0.45. The numbers in the stems are
 * interpolated from the measured modules, so a re-run cannot leave a question
 * quoting a figure the deck no longer draws. Each question resolves as it is
 * answered and says which page it came from, so a miss is a pointer rather than
 * a mark.
 *
 * SECTION 3 IS WHAT THE DECK DID NOT SETTLE, and it is deliberately last. Two
 * items, both of them live: every accuracy number here is discounted by
 * contamination we cannot size, and page 15's closing question about whether
 * the chain is the real reason is not answered anywhere in these sixteen pages.
 * The deck used to have a page for the second one; it was cut, and the honest
 * move is to say the question is open rather than to quietly stop raising it.
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
  BANDS,
  BIGGER,
  CHECKABLE_SHARE,
  CROSSING,
  FORCED,
  ITEM_COUNT,
  JUDGES,
  LADDER,
  OTHER_AXIS,
  QUIZ,
  WRITER,
  pct,
} from "@/lib/page16";
import { ACTS, getPage } from "@/lib/pages";
import { PAGE5 } from "@/lib/page05";
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
    <section className="rounded-lg border border-grid bg-surface p-4">
      <h3 className="flex gap-3 text-sm font-semibold text-ink">
        <span className="font-mono text-ink-muted">{n}.</span>
        <span>{title}</span>
      </h3>
      <div className="mt-2 pl-7 text-sm text-ink-muted">{children}</div>
    </section>
  );
}

const PAGE_N = 16;

/* ------------------------------------------------------------- the ladder */

const W = 760;
const ROW = 28;
const BAND_H = 26;
// Top margin carries the column headers; left fits the longest rung label
// whole; right fits three fixed columns (accuracy, bill, page).
const M = { top: 22, right: 118, bottom: 36, left: 284 };
const IW = W - M.left - M.right;
const H = LADDER.length * ROW + BANDS.length * BAND_H + M.top + M.bottom;
const IH = H - M.top - M.bottom;

const x = (v: number) => v * IW;

/** The two right-hand columns, at fixed offsets so they read as a table. */
const COL_ACC = IW + 14;
const COL_PAGE = IW + 62;

/** Row tops, precomputed once so band headers and rungs cannot drift apart. */
const LAYOUT = (() => {
  const rows: { rung: (typeof LADDER)[number]; y: number }[] = [];
  const headers: { band: (typeof BANDS)[number]; y: number }[] = [];
  let y = 0;
  for (const band of BANDS) {
    headers.push({ band, y });
    y += BAND_H;
    for (const rung of LADDER.filter((r) => r.band === band.key)) {
      rows.push({ rung, y });
      y += ROW;
    }
  }
  return { rows, headers, height: y };
})();

/**
 * The toolbox on one axis, floor to ceiling, in three bands.
 *
 * Bars are the rungs the deck measured; the coverage rung is hollow because it
 * is not a technique, it is what a perfect selector would have reached, and the
 * gap between it and the best solid bar is filled rather than left for the
 * reader to measure by eye.
 *
 * Two things here are not decoration. The bill column is why the last band is
 * worth drawing: two rungs tie at the same accuracy and one of them costs a
 * seventh of the other, which is page 11's finding read straight off a row.
 * And page 9's rung carries a baseline tick, because its run is not the others'
 * and the only honest reading of it is the distance from that tick.
 */
function Ladder() {
  const solid = LADDER.filter((r) => !r.ceiling && r.band !== "elsewhere");
  const best = Math.max(...solid.map((r) => r.accuracy));
  const ceiling = LADDER.find((r) => r.ceiling);
  return (
    <ChartFrame
      title={`What each lever scored on the same ${ITEM_COUNT} problems, in three groups. ${BANDS.map(
        (b) =>
          `${b.title}: ${LADDER.filter((r) => r.band === b.key)
            .map(
              (r) =>
                `${r.label}, ${pct(r.accuracy)}${
                  // Spoken without its baseline, page 9's rung is a bare 58%
                  // sitting under page 8's 60%, which is the exact misreading
                  // the tick on the bar exists to prevent for sighted readers.
                  r.baseline !== undefined
                    ? `, up from ${pct(r.baseline)} on that run's own vote`
                    : ""
                }`,
            )
            .join("; ")}`,
      ).join(". ")}. The steps get smaller as you go, a wide gap is left between the best selector and the answers that were generated and not picked, and the last group ties the best selector's accuracy for a fraction of its bill.`}
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

      <text x={COL_ACC} y={-8} className="fill-ink-muted text-[9px] uppercase tracking-wide">
        score
      </text>
      <text x={COL_PAGE} y={-8} className="fill-ink-muted text-[9px] uppercase tracking-wide">
        from
      </text>

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

      {/* Where the best selector and the bigger model tie. */}
      <line
        x1={x(CROSSING)}
        x2={x(CROSSING)}
        y1={0}
        y2={IH}
        strokeDasharray="4 3"
        className="stroke-correct"
        strokeWidth={1.5}
      />

      {LAYOUT.headers.map(({ band, y }) => (
        <text
          key={band.key}
          x={-10}
          y={y + BAND_H - 8}
          textAnchor="end"
          className="fill-ink-muted text-[10px] font-semibold uppercase tracking-wide"
        >
          {band.title}
        </text>
      ))}

      {LAYOUT.rows.map(({ rung: r, y }) => {
        const h = ROW - 10;
        const base = r.baseline ?? 0;
        return (
          <g key={r.label}>
            <text
              x={-10}
              y={y + h - 2}
              textAnchor="end"
              className={`text-[11px] ${r.ceiling ? "fill-ink-muted italic" : "fill-ink"}`}
            >
              {r.label}
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
                  y={y + h - 2}
                  textAnchor="end"
                  className="fill-canvas text-[10px] font-semibold"
                >
                  {pct(base)}
                </text>
              </>
            ) : null}

            <text
              x={COL_ACC}
              y={y + h - 2}
              className={`text-[11px] font-semibold tabular-nums ${
                r.ceiling ? "fill-wrong" : "fill-ink"
              }`}
            >
              {pct(r.accuracy)}
            </text>
            <text x={COL_PAGE} y={y + h - 2} className="fill-ink-muted text-[10px]">
              page {r.page}
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
  const floor = LADDER[0];
  const baseline = LADDER.find((r) => r.label.includes("greedy"))!;
  const best = LADDER.filter((r) => !r.ceiling && r.band !== "elsewhere").reduce((a, b) =>
    b.accuracy > a.accuracy ? b : a,
  );
  // The two rows the closing paragraph reads off the bill column. Both are
  // asserted present in page16.test.ts: the paragraph is meaningless without them.
  const bestBill = best.bill ?? 0;
  const biggerBill = LADDER.find((r) => r.band === "elsewhere")!.bill ?? 0;

  return (
    <article className="flex flex-col gap-6">
      <p className="text-xs uppercase tracking-wide text-ink-muted">
        Act {page.act} · {ACTS[page.act].title}
      </p>
      <h1 className="text-3xl font-bold text-ink">
        <span className="font-mono text-ink-muted">{page.n}. </span>
        {page.title}
      </h1>
      <p className="max-w-2xl text-lg text-ink-muted">
        The past fifteen pages are a small but mighty snapshot of what inference-time scaling is
        under the hood. Reasoning turned out to be{" "}
        <strong className="text-ink">one knob that can be turned many different ways</strong>, and
        that can even be moved from one axis to another. Here is every lever on the first axis,
        measured on the same problems the pages showed you. Then twelve questions, to see whether
        the mechanisms landed rather than whether the numbers stuck.
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

        <p className="max-w-2xl text-sm text-ink-muted">
          Read it top to bottom as steps that keep getting smaller. Writing the reasoning at all is
          the largest single move on the chart, and a chain cut off at{" "}
          {LADDER[1].label.replace(/^one chain, cut off at /, "")} scores exactly what no chain at
          all scores, which is the cheapest way to see that the tokens are not a description of the
          computation, they are the computation.
        </p>
        <p className="max-w-2xl text-sm text-ink-muted">
          Then sampling. Sixteen chains buy nothing until they are allowed to disagree; voting on
          the disagreement buys real points; putting a trained judge in front of the vote buys a
          few more that this run could not separate from noise. Grading every step of the working
          rather than the answer, page 9&apos;s lever, moved one problem in {ITEM_COUNT} and is
          drawn against its own vote for that reason.
        </p>
        <p className="max-w-2xl text-sm text-ink-muted">
          Then the step that never comes. On {pct(ceiling.accuracy)} of these problems at least one
          of the sixteen chains was right and the best rule we tested kept {pct(best.accuracy)}.
          The shaded band is the answer sitting in the pile, generated and thrown away.
        </p>
        <p className="max-w-2xl text-sm text-ink-muted">
          Then the last band, which is on the chart to be read against the one above it. Two rungs
          tie at {pct(CROSSING)}, and the axis cannot show what separates them, so here it is in
          measured compute: reaching {pct(CROSSING)} by sampling sixteen chains and having a
          trained judge pick costs about {Math.round(bestBill)} greedy chains, and reaching it with
          a model twice the size costs about {biggerBill.toFixed(1)}. That is page 11&apos;s
          finding, and it is the knob moving off this axis onto another one.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold text-ink">
          1b. What to take with you
          <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
            five things the chart is evidence for
          </span>
        </h2>
        <p className="max-w-2xl text-ink">
          Read as a set, the rungs say more than any one of them does alone. Five things worth
          keeping, and one of them is the reason the chart has a last band at all.
        </p>

        <div className="flex max-w-2xl flex-col gap-4">
          <Takeaway n={1} title="Letting the model reason wins, and it wins every time">
            <p>
              It is the largest move on the chart and nothing after it is close: {pct(floor.accuracy)}{" "}
              when the model must answer on the spot, {pct(baseline.accuracy)} when it is allowed
              to write its working first, on the same problems, {PAGE5.figure2.suppression.fixed}{" "}
              fixed against {PAGE5.figure2.suppression.broken} broken. If you do one thing, do this
              one.
            </p>
            <p className="mt-2">
              <strong>More of it is a different claim.</strong> Refusing to let the chain stop and
              making it carry on cost {FORCED.tokenMultiple.toFixed(1)} times the tokens and turned{" "}
              {FORCED.turnedRight} answers right against {FORCED.turnedWrong} turned wrong. That is
              churn, not progress. Reasoning is worth having; being made to do more of it, with
              nothing new to go on, is not.
            </p>
          </Takeaway>

          <Takeaway n={2} title="The answer is usually already in the pile">
            <p>
              On {pct(ceiling.accuracy)} of these problems at least one of sixteen sampled chains
              was right, and the best rule we tested kept {pct(best.accuracy)}. That{" "}
              {Math.round((ceiling.accuracy - best.accuracy) * 100)}-point band is not a generation
              problem, and more sampling does not touch it. Everything hard about answer-time
              compute is downstream of a solved problem: the model found it, and we threw it away.
            </p>
          </Takeaway>

          <Takeaway n={3} title="So the judge is the bottleneck, and judges can barely read">
            <p>
              A judge that reads a chain is reading mostly prose. Page 9 graded real working twice
              and an arithmetic checker could adjudicate {pct(CHECKABLE_SHARE, 1)} of the steps;
              the rest state nothing a machine can compute. And page 15 turned the one knob that
              makes candidates worth judging: as sampling temperature rises, every model asked to
              judge decays, the worst by {JUDGES.worstFallPts.toFixed(0)} points. Only the model{" "}
              <strong>trained to score</strong> holds its line.
            </p>
            <p className="mt-2">
              So you want a trained judge. The catch is how you spend one: best-of-N is the way,
              and best-of-{JUDGES.depth} cost about {Math.round(bestBill)} greedy chains to reach{" "}
              {pct(CROSSING)}, which a model twice the size reached for about{" "}
              {biggerBill.toFixed(1)}. A better judge is the right lever and it is priced like a
              bigger model.
            </p>
          </Takeaway>

          <Takeaway n={4} title="Which is what adaptive compute is for, and it is not free either">
            <p>
              If a flat sixteen chains for every problem is the wrong shape, spend by difficulty:
              one chain where one will do, the whole pile where it will not. That is the direction
              this deck points, and it is the honest answer to takeaway 3.
            </p>
            <p className="mt-2">
              <strong>It is also the thing we could not demonstrate.</strong> Page 15 gave one form
              of it an oracle, the best stopping point per problem chosen with hindsight. It
              reached {pct(ADAPTIVE_NULL.oracle)} for about {ADAPTIVE_NULL.oracleTokens} tokens,
              and plain resampling reached the same {pct(ADAPTIVE_NULL.sampling)} for the same
              money. Knowing where to spend is worth something only if you can know it in advance,
              and nothing we tested could.
            </p>
          </Takeaway>

          <Takeaway n={5} title="And you pay for every node you look at">
            <p>
              Search is the elaborate version of takeaway 3: branch, score the partial lines, prune
              the poor ones, back up. Pruning is what you do with a node <em>after</em> paying for
              it, so the bill counts everything you looked at and threw away. That is why a smarter
              search is not automatically cheaper than sampling sixteen chains flat.
            </p>
            <p className="mt-2">
              It is the one lever with no bar on the chart, because we never ran it here. Page
              10&apos;s tree is written by hand and its published bars are Yao et al.&apos;s on
              Game of 24 and crosswords, which are not these problems, and the arm that would
              measure it ships unrun. Worth knowing what it would take: a {BIGGER} judge in memory
              beside the {WRITER} writer, which is both models at once rather than a cheaper one.
            </p>
          </Takeaway>

          <div className="rounded-lg border-l-4 border-wrong bg-surface p-4 text-sm text-ink">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              and the one that is not on this axis at all
            </p>
            <p className="mt-2">
              <strong>{OTHER_AXIS.label}</strong> is our {OTHER_AXIS.ours.label} after someone else
              fine-tuned it on {OTHER_AXIS.teacher.samplesK}K reasoning traces from{" "}
              {OTHER_AXIS.teacher.label}. It scores {pct(OTHER_AXIS.math500, 1)} on MATH-500. Our
              copy of the same base model, greedy, scores {pct(OTHER_AXIS.ours.hard)}. Nothing on
              the chart above moves a model that far.
            </p>
            <p className="mt-2">
              It is deliberately not a bar up there, because it is not measured on the same thing.
              That number is the whole of MATH-500, all five difficulty levels; our hundred
              problems are {OTHER_AXIS.ours.hardLevels} only, the hard end, on our harness. We can
              size the difference rather than wave at it: the same three checkpoints score{" "}
              {OTHER_AXIS.bandGapPts.min} to {OTHER_AXIS.bandGapPts.max} points higher on{" "}
              {OTHER_AXIS.ours.easyLevels} than on {OTHER_AXIS.ours.hardLevels}, with nothing
              changed but the mix of problems. Our own 1.5B goes from {pct(OTHER_AXIS.ours.hard)}{" "}
              to {pct(OTHER_AXIS.ours.easy)} that way.
            </p>
            <p className="mt-2 text-ink-muted">
              So a large piece of that gap is the test and the rest is the distillation, and this
              deck cannot tell you the split. That is not a footnote about one number. It is what a
              score is: a reading taken at a setting, and the setting travels with it or the number
              means nothing.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold text-ink">
          2. Twelve questions
          <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
            concepts, not numbers
          </span>
        </h2>
        <p className="max-w-2xl text-ink">
          One per page, in the deck&apos;s order. Each answers itself as soon as you pick, and says
          which page it came from. Nothing here needs a number memorised: where a figure appears it
          is the setting the question is asked in, not the thing being asked.
        </p>
        <Quiz questions={QUIZ} onAnswer={() => recordInteraction(PAGE_N)} />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold text-ink">3. What this deck did not settle</h2>
        <p className="max-w-2xl text-ink">
          Two things are open, and both of them reach backwards over everything above.
        </p>
        <div className="flex max-w-2xl flex-col gap-4">
          <div className="rounded-lg border-l-4 border-wrong bg-wrong/10 p-4 text-sm text-ink">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              every number is discounted
            </p>
            <p className="mt-2">
              A benchmark is published text and published text is what the next model trains on, so
              a score can be reciting the test rather than reasoning through it. On problems
              released after these models trained, reasoning models scored 7 to 30 points below
              their older-year averages. That discounts the ladder above and the frontier scores of
              Act 3 alike, and it does not tell you by how much.{" "}
              <span className="text-ink-muted">Page 15 sizes it.</span>
            </p>
          </div>
          <div className="rounded-lg border-l-4 border-compute bg-surface p-4 text-sm text-ink">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              and the chain may not be the reason
            </p>
            <p className="mt-2">
              Every lever above reads the chain and takes it for what it says it is: the working
              that produced the answer. Whether that is true is a separate question, and this deck
              does not answer it. It is worth knowing that{" "}
              {pct(PAGE17.readable.shareUnjudged, 0)} of the steps in real chains state nothing a
              checker can compute, so for most of the text there is nothing to hold it to from the
              inside.
            </p>
          </div>
        </div>
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
