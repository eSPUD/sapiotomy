"use client";

/**
 * Page 15, "Wrap-Up: What You Now Know". The deck's last story page, added as
 * page 16 the same day pages 15, 16, 18 and 19 were cut and page 17 became 15;
 * the 2026-11-04 merge of pages 13 and 14 moved it to 15.
 *
 * The trap a closing page falls into is retelling. Fifteen pages summarised in
 * order is a page nobody reads and nobody needs, because a reader who wants the
 * summary has the contents list. So this page does two things the deck could
 * not do earlier and could not do anywhere else.
 *
 * SECTION 1 IS THE CHARTS THE DECK COULD NEVER DRAW. Each page drew its own
 * lever against its own baseline. Only now, with all of them behind the reader,
 * can they go side by side: the 3B base, the 3B-Instruct, and GRPO, with one
 * colour per category. The runs do not all share a problem set, which the
 * caption under the charts says. GRPO is a different model and benchmark, and
 * its figure says so.
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
 * If a number here disagrees with the page it came from, the deck is
 * contradicting itself in front of the reader on its last page, which is why
 * nothing below is retyped by hand.
 */

import { ChartFrame } from "@/components/ChartFrame";
import { Cite, RefItem } from "@/components/Cite";
import { Handoff } from "@/components/Handoff";
import { PageNav } from "@/components/PageNav";
import { Quiz } from "@/components/Quiz";
import {
  BASE_CHART,
  CATEGORIES,
  GRPO_CHART,
  GRPO_SCOPE,
  INSTRUCT_CHART,
  NOTEBOOKS,
  QUIZ,
  pct,
  type Bar,
  type Category,
} from "@/lib/page16";
import { PAGE5 } from "@/lib/page05";
import { ACTS, getPage } from "@/lib/pages";
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

const PAGE_N = 15;

/** Page 15's references, numbered in order of first appearance. */
const REF = { bitterLesson: 1 } as const;

/* ------------------------------------------------------------- the charts */

const W = 352;
const ROW = 30;
const M = { top: 8, right: 34, bottom: 34, left: 168 };
const IW = W - M.left - M.right;
const x = (v: number) => v * IW;

/**
 * One colour per category. Blue, clay and crimson stay apart under every form of
 * colour blindness; clay and the deck's cactus green do not. The neutral is the
 * untouched base model.
 */
const CATEGORY_FILL: Record<Category, string> = {
  base: "fill-ink opacity-40",
  fineTuned: "fill-wrong-bright",
  inference: "fill-compute",
  inferenceTraining: "fill-crimson",
};
const CATEGORY_OF = Object.fromEntries(CATEGORIES.map((c) => [c.key, c])) as Record<
  Category,
  (typeof CATEGORIES)[number]
>;

function Legend() {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-muted">
      {CATEGORIES.map((c) => (
        <li key={c.key} className="flex items-center gap-1.5">
          <svg width={12} height={12} aria-hidden="true">
            <rect width={12} height={12} className={CATEGORY_FILL[c.key]} />
          </svg>
          {c.label}
        </li>
      ))}
    </ul>
  );
}

/**
 * Horizontal bars on a shared 0 to 100 axis, so the charts have one scale.
 */
function BarChart({ name, bars }: { name: string; bars: Bar[] }) {
  const H = bars.length * ROW + M.top + M.bottom;
  const IH = bars.length * ROW;
  return (
    <ChartFrame
      title={`${name}: share of problems solved. ${bars
        .map(
          (b) =>
            `${b.label.replace("*", "")}, ${CATEGORY_OF[b.category].label}, ${pct(b.accuracy)}: ${b.detail}`,
        )
        .join(". ")}.`}
      width={W}
      height={H}
      margin={M}
      xLabel="% solved"
    >
      {[0, 25, 50, 75, 100].map((t) => (
        <g key={t}>
          <line x1={x(t / 100)} x2={x(t / 100)} y1={0} y2={IH} className="stroke-grid" strokeWidth={1} />
          <text x={x(t / 100)} y={IH + 14} textAnchor="middle" className="fill-ink-muted text-[10px]">
            {t}
          </text>
        </g>
      ))}

      {bars.map((b, i) => {
        const y = i * ROW + 6;
        const h = ROW - 12;
        return (
          <g key={b.label}>
            <title>{b.detail}</title>
            <text x={-8} y={y + h / 2 + 4} textAnchor="end" className="fill-ink text-[11px]">
              {b.label}
            </text>
            <rect
              x={0}
              y={y}
              width={x(b.accuracy)}
              height={h}
              className={CATEGORY_FILL[b.category]}
            />
            <text
              x={x(b.accuracy) + 4}
              y={y + h / 2 + 4}
              className="fill-ink text-[11px] font-semibold tabular-nums"
            >
              {pct(b.accuracy)}
            </text>
          </g>
        );
      })}
    </ChartFrame>
  );
}

/* -------------------------------------------------------------------- page */

export function Page15() {
  const page = getPage(PAGE_N)!;
  const recordInteraction = useStore((s) => s.recordInteraction);
  return (
    <article className="flex flex-col gap-6">
      <p className="text-xs font-eyebrow uppercase tracking-wide text-ink-muted">
        Act {page.act} · {ACTS[page.act].title}
      </p>
      {/* Pages 5 to 11 each put their run's download beside the page title, and a
          reader who has come through Act 2 has learned to look there. This page
          draws five runs rather than one, so it carries five, in the same place
          rather than buried under the figure they source. */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h1 className="text-3xl font-bold text-ink">
          <span className="font-mono text-ink-muted">{page.n}. </span>
          {page.title}
        </h1>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-ink-muted">the runs behind the charts:</span>
          {NOTEBOOKS.map((n) => (
            <a
              key={n.href}
              href={n.href}
              download
              aria-label={`Page ${n.page}: ${n.title}. ${
                n.format === "ipynb"
                  ? `Download the notebook, ipynb, ${n.size}`
                  : `Download the notebook and traces, zip, ${n.size}`
              }`}
              className="rounded border border-grid px-2 py-1 text-xs text-ink-muted hover:text-ink"
            >
              page {n.page}
              {n.format === "ipynb" ? `, ${n.title.toLowerCase()}` : ""} ({n.size}) ↓
            </a>
          ))}
        </div>
      </div>
      <p className="text-lg text-ink-muted">
        The past fourteen pages are a small but mighty snapshot of what inference-time scaling is
        under the hood. Reasoning turned out to be{" "}
        <strong className="text-ink">one knob that can be turned many different ways</strong>, and
        that can even be moved from one axis to another. Here is every lever on the first axis,
        measured on the problems the pages showed you. Then ten questions, to see whether the
        mechanisms landed rather than whether the numbers stuck.
      </p>

      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold text-ink">
          1. The whole toolbox, side by side
          <span className="ml-2 align-middle text-xs font-normal text-ink-muted">our runs</span>
        </h2>
        <p className="text-ink">
          Each page measured its own lever against its own baseline, so none of them could draw
          this. Now that all of them are behind you, they go side by side: the 3B base model, its
          Instruct version, and GRPO.
        </p>
        {/* Tagged for presentation mode (DemoMode), which spotlights the charts. */}
        <div data-demo="p15-s1" className="flex flex-col gap-3">
          <Legend />
          <div className="grid items-start gap-x-6 gap-y-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
            <figure className="flex min-w-0 max-w-lg flex-col gap-1">
              <figcaption className="text-sm font-semibold text-ink">3B base only</figcaption>
              <BarChart name="Qwen2.5-3B base model, MATH-500" bars={BASE_CHART} />
            </figure>
            <figure className="flex min-w-0 max-w-lg flex-col gap-1">
              <figcaption className="text-sm font-semibold text-ink">3B Instruct only</figcaption>
              <BarChart name="Qwen2.5-3B-Instruct, MATH-500" bars={INSTRUCT_CHART} />
            </figure>
            <figure className="flex min-w-0 max-w-lg flex-col gap-1">
              <figcaption className="text-sm font-semibold text-ink">
                Inference + training-time scaling
                <span className="mt-0.5 block text-xs font-normal text-ink-muted">{GRPO_SCOPE}</span>
              </figcaption>
              <BarChart name="GRPO on Qwen2.5-1.5B-Instruct, GSM8K" bars={GRPO_CHART} />
            </figure>
          </div>
        </div>
        <p className="border-l-2 border-grid pl-3 text-sm text-ink-muted">
          In the first chart, the two base-model bars share one run and the instruct bar is a
          separate run on {PAGE5.n} problems. In the second, every bar is the same 100 problems,
          except <strong className="text-ink">*thinking longer</strong>, which ran on a different
          100. The third chart is a smaller model on an easier benchmark, so compare its bars only
          with each other.
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
            six things the runs are evidence for
          </span>
        </h2>
        <div className="flex flex-col gap-3">
          <Takeaway n={1} title="Letting the model reason wins, every time">
            Ask for the answer on its own and it mostly gets it wrong. Let it write its working
            first, on the same problems, and it gets far more of them right. But making it write{" "}
            <em>more</em> working, when it has nothing new to go on, is a different thing: it costs
            a great deal more and turns about as many answers wrong as it turns right. Reasoning is
            worth having. It is not worth forcing.
          </Takeaway>

          <Takeaway n={2} title="The answer is usually already in the pile">
            Ask the same question many times and a right answer turns up more often than any
            rule we tried managed to pick out. The gap between what was found and what was chosen is
            not a thinking problem, and sampling harder does not close it.
          </Takeaway>

          <Takeaway n={3} title="So a trained judge helps, at the cost of a second model">
            Something has to choose among the chains. A majority vote only counts answers. On the
            same chains, a model <strong className="text-ink">trained to score</strong> them picks a
            right answer a little more often, and one that scores every step does a little better
            again. An arithmetic checker can mark only the small part of a chain that is arithmetic.
            The more variety you buy by sampling, the worse a model asked to judge gets, while a
            trained scorer holds steady. The price is running that second model over every chain.
            Matching what a bigger model reaches on its own this way costs many times more compute
            than simply using the bigger model.
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

          <Takeaway n={6} title="And training adds to what inference-time scaling buys">
            GRPO trains a model on whether its answers came out right. On the smaller model in the
            third chart it raised the score of a single chain, and a vote over the trained
            model&apos;s chains scored higher still. Published results show a larger gain when a
            small model is trained on the reasoning of a much stronger one. That is not a bar here
            because it was not our run: it is a published score, from another harness, on a model we
            did not test. Part of that gain is the training and part is those differences, and this
            deck cannot tell you how it splits.
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
        <p className="text-ink">
          In the deck&apos;s order. Each answers itself as soon as you pick, and says which page it
          came from. The options are shuffled on every visit, so where an answer sat last time tells
          you nothing. Nothing here needs a number memorised: where a figure appears it is the
          setting the question is asked in, not the thing being asked.
        </p>
        <Quiz questions={QUIZ} onAnswer={() => recordInteraction(PAGE_N)} />
      </div>


      {/* The story's last word, and presentation mode's last stop. */}
      <Handoff demo="p15-close">
        {/* Simplified by the author, 2026-11-09, from one long sentence: the same four
            claims (gains, a cost, a limit, the open question) and the same last line. The
            bittersweet lesson (author, 2026-11-09) is our framing of Sutton's essay: search
            and learning are the two methods it names, and this story is both. */}
        In short: letting a model think longer before it answers really does make its answers
        better. Call it a bittersweet lesson. Bitter, as Rich Sutton put it: the methods that win
        are the general ones that scale with computation, search and learning, not clever
        shortcuts built in by hand.
        <Cite n={REF.bitterLesson} /> Sweet: that computation can now be spent when a question is
        asked, not only in training. Every gain has a cost and a limit. And no one has yet shown
        that the reasoning a model writes out is what actually produces its answer.{" "}
        <em className="text-ink-muted">That is where the field stands today, and now so do you.</em>
      </Handoff>
      {/* The page's one reference, under the box that cites it. */}
      <aside className="flex flex-col gap-2 text-sm text-ink-muted">
        <p className="text-xs font-semibold font-eyebrow uppercase tracking-wide text-ink-muted">References</p>
        <RefItem n={REF.bitterLesson} href="http://www.incompleteideas.net/IncIdeas/BitterLesson.html">
          Rich Sutton, <em>The Bitter Lesson</em> (2019).
        </RefItem>
      </aside>

      <PageNav n={PAGE_N} />
    </article>
  );
}
