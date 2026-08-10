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
import { BIGGER_MODEL, ITEM_COUNT, LADDER, QUIZ, pct } from "@/lib/page16";
import { ACTS, getPage } from "@/lib/pages";
import { PAGE17 } from "@/lib/page17";
import { useStore } from "@/store/useStore";

const PAGE_N = 16;

/* ------------------------------------------------------------- the ladder */

const W = 700;
const ROW = 34;
// The top margin carries the bigger model's caption. It cannot go under the
// axis with the tick labels: at 60% its rule lands between the 50 and 75
// ticks and the caption runs straight through both of them.
// The left margin has to fit the longest rung label whole ("16 sampled chains,
// trained verifier picks one" is the widest at 11px). Three of them were being
// clipped at 232, which reads as a broken chart rather than a long label.
const M = { top: 26, right: 132, bottom: 34, left: 256 };
const IW = W - M.left - M.right;
const H = LADDER.length * ROW + M.top + M.bottom;
const IH = H - M.top - M.bottom;

const x = (v: number) => v * IW;

/**
 * The toolbox on one axis, floor to ceiling.
 *
 * Bars are the rungs the deck measured; the coverage rung is drawn hollow
 * because it is not a technique, it is what a perfect selector would have
 * reached. The gap between it and the best solid bar is the page's one visual
 * claim, so it is filled rather than left for the reader to measure by eye, and
 * the bigger model's dashed rule crosses everything because that comparison is
 * the point of drawing them together at all.
 */
function Ladder() {
  const best = Math.max(...LADDER.filter((r) => !r.ceiling).map((r) => r.accuracy));
  const ceiling = LADDER.find((r) => r.ceiling);
  return (
    <ChartFrame
      title={`What each lever scored on the same ${ITEM_COUNT} problems. ${LADDER.map(
        (r) => `${r.label}: ${pct(r.accuracy)}`,
      ).join(". ")}. One greedy chain from the ${BIGGER_MODEL.label} reaches ${pct(
        BIGGER_MODEL.accuracy,
      )} for a fraction of the bill. The steps get smaller as you go, and a wide gap is left between the best selector and the answers that were generated and not picked.`}
      width={W}
      height={H}
      margin={M}
      xLabel={`accuracy on ${ITEM_COUNT} MATH-500 level 4 and 5 problems`}
    >
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <g key={t}>
          <line x1={x(t)} x2={x(t)} y1={0} y2={IH} className="stroke-grid" strokeWidth={1} />
          <text
            x={x(t)}
            y={IH + 16}
            textAnchor="middle"
            className="fill-ink-muted text-[10px]"
          >
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
        const h = ROW - 14;
        return (
          <g key={r.label}>
            <text
              x={-10}
              y={y + h - 3}
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
                className={r.accuracy === best ? "fill-compute" : "fill-ink opacity-40"}
              />
            )}
            <text
              x={x(r.accuracy) + 6}
              y={y + h - 3}
              className={`text-[11px] font-semibold tabular-nums ${
                r.ceiling ? "fill-wrong" : "fill-ink"
              }`}
            >
              {pct(r.accuracy)}
            </text>
            <text x={x(r.accuracy) + 44} y={y + h - 3} className="fill-ink-muted text-[10px]">
              page {r.page}
            </text>
          </g>
        );
      })}

      {/* Page 11's crossing. Drawn across every bar, because that is what it does. */}
      <line
        x1={x(BIGGER_MODEL.accuracy)}
        x2={x(BIGGER_MODEL.accuracy)}
        y1={-14}
        y2={IH}
        strokeDasharray="4 3"
        className="stroke-correct"
        strokeWidth={1.5}
      />
      <text
        x={x(BIGGER_MODEL.accuracy) - 6}
        y={-6}
        textAnchor="end"
        className="fill-correct text-[10px] font-semibold"
      >
        {BIGGER_MODEL.label}, one greedy chain
      </text>
    </ChartFrame>
  );
}

/* -------------------------------------------------------------------- page */

export function Page16() {
  const page = getPage(PAGE_N)!;
  const recordInteraction = useStore((s) => s.recordInteraction);
  const ceiling = LADDER.find((r) => r.ceiling)!;
  const best = LADDER.filter((r) => !r.ceiling).reduce((a, b) =>
    b.accuracy > a.accuracy ? b : a,
  );

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
        Fifteen pages turned one knob a dozen ways. Here is every lever on one axis, measured on
        the same problems, and then{" "}
        <strong className="text-ink">twelve questions</strong> that check whether the mechanisms
        landed rather than whether the numbers stuck.
      </p>

      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold text-ink">
          1. The whole toolbox, on one axis
          <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
            our runs · {ITEM_COUNT} problems · pages 5 to 11
          </span>
        </h2>
        <p className="max-w-2xl text-ink">
          Each page in Act 2 measured its own lever against its own baseline, so none of them
          could draw this. Now that all of them are behind you, they go on one axis.
        </p>
        <Ladder />
        <div className="grid gap-4 lg:grid-cols-2">
          <p className="text-sm text-ink-muted">
            Read it as a set of steps that keep getting smaller. Writing the reasoning at all is
            worth more than everything after it put together. Sampling sixteen chains is worth
            nothing until they are allowed to disagree. Voting on the disagreement is worth real
            points, and putting a trained judge in front of the vote is worth a few more that this
            run could not separate from noise.
          </p>
          <p className="text-sm text-ink-muted">
            Then the step that never comes. On {pct(ceiling.accuracy)} of these problems at least
            one of the sixteen chains was right, and the best rule we tested kept{" "}
            {pct(best.accuracy)}. That shaded band is the answer sitting in the pile, generated and
            thrown away. And the dashed line is the whole of Act 2 charged against a bigger model:{" "}
            {BIGGER_MODEL.label} writes one greedy chain, reaches {pct(BIGGER_MODEL.accuracy)}, and
            costs a fraction of what the sixteen-way vote cost to reach less.
          </p>
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
        <div className="grid gap-4 lg:grid-cols-2">
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
