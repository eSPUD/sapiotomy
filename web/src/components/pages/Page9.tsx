"use client";

/**
 * Page 9, "Best-of-N: Select by Process" — measured, not authored.
 *
 * Page 8 ended on what the judge is actually reading. Here is the answer, and it
 * is a fork: grade the final answer, or grade every step.
 *
 * The measured beats read real chains drawn from page 7's pile; `@/lib/page09`
 * refuses to load a run that failed the notebook's gates, so a number on this
 * page is always one a grader that actually ran produced. The "Find the break"
 * chain viewer (Lucky, Broken and Clean specimens) was cut on 2026-11-07.
 *
 * The beats:
 *   1. OUTCOME OR PROCESS? What reading the steps lets a judge do: tell a wrong
 *      answer from a right one by its reasoning, with no answer key. Then two
 *      solutions as an ORM sees them and as a PRM sees them (illustrative
 *      scores, in Page9OutcomeVsProcess.tsx). Only what each judge looks at.
 *   2. HOW DOES A PRM PICK? How step scores become one pick, then the select-by-process
 *      figure (illustrative scores, in Page9SelectByProcess.tsx).
 *   3. WHAT STEP GRADING BUYS. One figure, framed on the PRM: how many right
 *      answers each grader can catch bad reasoning inside. A rate, and nothing
 *      else.
 *   4. WHERE THE CHAIN BREAKS. The other question about the same chains: not how
 *      often a break is findable but where it falls and how many there are. The
 *      median position in a line, then the break-count spike as a figure.
 *
 * Run conditions (decoding, dates, segmentation) are the notebook's to state,
 * and so is the PRM's measured reliability. Page 15's audit-surface beat (the
 * 5.8% sliver, with the PRM's AUC, recall and specificity drawn inside it) was
 * moved here on 2026-08-10 and cut from the deck the same day. It was a real
 * claim and it did not fit: the rate beat is one figure with three
 * qualifications already, and a second bar restating the checker's split pushed
 * the beat past what a reader will carry.
 *
 * A limit on a figure is not a margin note, it is a caption, so the PRM's fitted
 * cut-off and the checker's denominator both sit under the bars they qualify.
 *
 * Below the page sits a draft: the old opening beat, "What can be graded at
 * all", kept whole until it is rebuilt. Lightman et al. 2023 is cited there for
 * the technique, and its References note sits beside it, per the house rule on
 * pages 3-8 that a reference sits beside the beat carrying its marker.
 */

import { Handoff } from "@/components/Handoff";
import { ChartFrame } from "@/components/ChartFrame";
import { Cite, RefItem } from "@/components/Cite";
import { PageNav } from "@/components/PageNav";
import { NotebookDownload } from "@/components/NotebookDownload";
import { WhatIsAPrm } from "./Page9SelectByProcess";
import { OutcomeOrProcess } from "./Page9OutcomeVsProcess";
import { PAGE9, pct } from "@/lib/page09";
import { ACTS, getPage } from "@/lib/pages";

const PAGE_N = 9;
const NOTEBOOK_ZIP = "/notebooks/page-09-outcome-vs-process.zip";
const NOTEBOOK_SIZE = "1.6 MB";

/** Reference numbers, in order of first appearance on the page. */
const REF = {
  lightman: 1,
} as const;

/** A margin note that sits beside its section and scrolls with the page. */
function Note({ kicker, children }: { kicker: string; children: React.ReactNode }) {
  return (
    <aside className="flex flex-col gap-2 text-sm text-ink-muted lg:pt-9">
      <p className="text-xs font-semibold font-eyebrow uppercase tracking-wide text-ink-muted">{kicker}</p>
      {children}
    </aside>
  );
}

/* The break-count histogram, sized to sit inline under beat two's paragraph. */
const B_W = 400;
const B_H = 168;
const B_M = { top: 20, right: 12, bottom: 40, left: 34 };
const B_IW = B_W - B_M.left - B_M.right;
const B_IH = B_H - B_M.top - B_M.bottom;

/**
 * How many false steps a wrong chain actually contains, which the median share-sound
 * figure above cannot show. The median is a statement about WHERE the break falls;
 * this is a statement about HOW MANY there are, and the two answer different
 * questions about the same 44 chains.
 *
 * The shape is the argument: the distribution is not a spread around a typical value,
 * it is a spike. Nearly three chains in four go wrong in exactly one place, which is
 * the fact that makes step-level grading worth its cost at all: if a wrong chain were
 * wrong throughout, there would be nothing for a step grader to localise and outcome
 * grading would lose nothing by throwing the chain away whole.
 *
 * `breaksPerChain` and `shareWithOneFalseStep` were both loaded by lib/page09.ts and
 * drawn nowhere until this figure. n is small (44) and printed on the figure rather
 * than left to the caption, because a five-bar chart invites more confidence than 44
 * chains can pay for.
 */
function BreakCounts() {
  const loc = PAGE9.localisation;
  const bins = Object.entries(loc.breaksPerChain)
    .map(([k, count]) => ({ n: Number(k), count }))
    .sort((a, b) => a.n - b.n);
  const total = bins.reduce((sum, b) => sum + b.count, 0);
  const peak = Math.max(...bins.map((b) => b.count));
  const bw = B_IW / bins.length;

  return (
    <ChartFrame
      title={`How many false steps each of the ${total} localisable wrong chains contains. ${bins
        .map((b) => `${b.count} chain${b.count === 1 ? "" : "s"} with ${b.n} false step${b.n === 1 ? "" : "s"}`)
        .join(", ")}. Most wrong chains go wrong in exactly one place.`}
      width={B_W}
      height={B_H}
      margin={B_M}
      xLabel="false steps in the chain"
      yLabel="chains"
    >
      {bins.map((b, i) => {
        const h = (b.count / peak) * B_IH;
        const hot = b.n === 1;
        return (
          <g key={b.n}>
            <rect
              x={i * bw + bw * 0.18}
              y={B_IH - h}
              width={bw * 0.64}
              height={h}
              className={hot ? "fill-compute" : "fill-ink opacity-30"}
            />
            <text
              x={i * bw + bw / 2}
              y={B_IH - h - 5}
              textAnchor="middle"
              className={`text-[11px] font-semibold ${hot ? "fill-compute-ink" : "fill-ink-muted"}`}
            >
              {b.count}
            </text>
            <text
              x={i * bw + bw / 2}
              y={B_IH + 15}
              textAnchor="middle"
              className="fill-ink-muted text-[11px]"
            >
              {b.n}
            </text>
          </g>
        );
      })}
      <text x={B_IW} y={10} textAnchor="end" className="fill-ink-muted text-[10px]">
        n = {total} chains
      </text>
    </ChartFrame>
  );
}

export function Page9() {
  const page = getPage(PAGE_N)!;

  const det = PAGE9.detection;
  const loc = PAGE9.localisation;
  const prm = PAGE9.graders.prm;
  const share = PAGE9.graders.shareUnjudged;

  const fmtRate = (r: number) => (r === 0 ? "0%" : r < 0.05 ? pct(r, 2) : pct(r, 1));
  // The two instruments that actually read the working, both named. The outcome
  // grader is deliberately NOT a bar: it compares only the final answer to the known
  // one, so nothing reads a step and its 0 is true by construction rather than
  // measured, and it is not a model to name. The caption states it as the baseline.
  const prmName = prm ? prm.id.split("/").pop()! : "a process reward model";
  const graders = [
    {
      key: "checker",
      label: "Arithmetic checker",
      reach: "deterministic, re-checkable by hand",
      rate: det.rate,
      tone: "bg-correct/70",
    },
    ...(det.prm && prm
      ? [
          {
            key: "prm",
            label: prmName,
            reach: `trained reward model, ${prm.quantisation}`,
            rate: det.prm.rate,
            tone: "bg-compute",
          },
        ]
      : []),
  ];
  const maxRate = Math.max(...graders.map((g) => g.rate)) || 1;

  return (
    <article className="flex flex-col gap-6">
      <p className="text-xs font-eyebrow uppercase tracking-wide text-ink-muted">
        Act {page.act} · {ACTS[page.act].title}
      </p>
      {/* The notebook sits right beside the page title: the way to re-derive
          the page, where the page is named. */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h1 className="text-3xl font-bold text-ink">
          <span className="font-mono text-ink-muted">{page.n}. </span>
          {page.title}
        </h1>
        <NotebookDownload href={NOTEBOOK_ZIP} size={NOTEBOOK_SIZE} />
      </div>

      {/* Held to the content column: the margin is the notes column (15rem) plus the
          grid's column gap (2rem), so its right edge meets the body text's. */}
      <p className="text-lg text-ink-muted lg:mr-[17rem]">
        A vote judges solutions by how often their answer comes up. A verifier judges the outcome,
        scoring the finished solution as a whole. A third way is to judge the <strong className="text-ink">process</strong>
        : the steps the model took to reach the answer. But accuracy is decided by the final answer,
        so why judge the steps?
      </p>

      {/* Page 3's grid: every beat sits in the content column with its margin note
          (or an empty cell) beside it, so nothing runs under the sidenote rail. */}
      <div className="grid gap-x-8 gap-y-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
        {/* Step 1 — outcome or process: one solution graded by an ORM and by a PRM. */}
        <OutcomeOrProcess />
        <div aria-hidden="true" />

        {/* Step 2 — what a PRM is, then the select-by-process figure. */}
        <WhatIsAPrm />
        <div aria-hidden="true" />

        {/* Step 3 — what step-grading buys, one figure framed on the PRM */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            3. What step grading buys
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              measured · {PAGE9.run.chains.toLocaleString()} chains
            </span>
          </h2>

          <figure className="m-0 flex flex-col gap-3 rounded-lg border-l-4 border-compute bg-surface p-4">
            <figcaption className="text-sm font-semibold text-ink">
              How often a right answer hides a false step, measured two ways
            </figcaption>
            <div
              className="flex flex-col gap-2"
              role="img"
              aria-label={`Of the right answers this model gave, a false step is provable by the deterministic arithmetic checker in ${fmtRate(det.rate)}${det.prm ? ` and flagged by ${prmName} in ${fmtRate(det.prm.rate)}` : ""}. An answer-key check, which compares only the final answer with the known one, catches none of them.`}
            >
              {graders.map((g) => (
                <div key={g.key} className="flex items-center gap-3 text-sm">
                  <span className="w-36 shrink-0 leading-tight">
                    <span className="text-ink">{g.label}</span>
                    <span className="block text-xs text-ink-muted">{g.reach}</span>
                  </span>
                  <div className="h-5 flex-1 rounded bg-surface-raised">
                    <div
                      className={`h-5 rounded ${g.tone}`}
                      style={{ width: `${Math.max(g.rate === 0 ? 0 : 3, (g.rate / maxRate) * 100)}%` }}
                    />
                  </div>
                  <span className="w-14 shrink-0 text-right font-mono tabular-nums text-ink">
                    {fmtRate(g.rate)}
                  </span>
                </div>
              ))}
            </div>
            {/* One entry per bar, plus the baseline that is not drawn as one. This
                used to be a single paragraph carrying all three graders and every
                qualification at once, which at this size nobody read. The content is
                the same and none of it moved to a margin, because a limit on a figure
                is a caption; it is the shape that changed, and the jargon went. */}
            <dl className="flex flex-col gap-2 text-sm text-ink-muted">
              <div>
                <dt className="inline font-semibold text-ink">Answer-key check, 0%. </dt>
                <dd className="inline">
                  It compares the final answer to the known one and never opens the working, so it
                  catches none of this by construction. The question is what reading the steps
                  adds.
                </dd>
              </div>
              <div>
                <dt className="inline font-semibold text-ink">
                  Checker, {pct(det.rate, 2)}. A floor, not a rate.{" "}
                </dt>
                <dd className="inline">
                  It counts chains, and many chains are the same problem sampled again. By problem
                  it is <strong className="text-ink">{pct(det.problemRate, 1)}</strong>,{" "}
                  {det.nProblems} of the {det.nProblemsWithARightChain} problems that produced a
                  right answer.
                </dd>
              </div>
              <div>
                <dt className="inline font-semibold text-ink">
                  What it could read, {det.nRightReachable} of {det.nRightChains}.{" "}
                </dt>
                <dd className="inline">
                  It reads arithmetic and nothing else, so{" "}
                  {det.nRightChains - det.nRightReachable} of those right chains are silence
                  rather than evidence. Over the ones it did read the rate is{" "}
                  <strong className="text-ink">{pct(det.reachableRate, 2)}</strong>. Either way it
                  undercounts.
                </dd>
              </div>
              {det.prm && prm ? (
                <div>
                  <dt className="inline font-semibold text-ink">
                    {prmName}, {pct(det.prm.rate, 1)}. An opinion, not a proof.{" "}
                  </dt>
                  <dd className="inline">
                    <strong className="text-ink">Its cut is fitted, not held out</strong>: the{" "}
                    {prm.threshold.toFixed(2)} that turns a score into a verdict was picked to
                    match the checker&apos;s own labels, so these are not two independent readings
                    of the same thing.
                  </dd>
                </div>
              ) : null}
            </dl>
          </figure>
        </section>

        <div aria-hidden="true" />

        {/* Step 4 — where the break falls, and how many there are. Beat 3 answers
            "how often", which is a rate; this answers "where" and "how many",
            which are shape. They rode in one section until 2026-08-11, and the
            figure below arrived two qualifications deep into another beat's
            caption with no heading of its own to be read under. */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            4. Where the chain breaks
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              measured · {loc.nLocalisable} localisable chains
            </span>
          </h2>

          <p className="text-sm text-ink-muted">
            <strong className="text-ink">What the judge catches, it can place.</strong> On the{" "}
            {loc.nLocalisable} wrong chains with a findable break, the median chain ran{" "}
            <strong className="text-ink">{pct(loc.medianShareSound ?? 0)}</strong> of its length
            before the line that breaks; outcome grading throws all of it away.{" "}
            {!loc.survivesSegmentation && loc.spreadPts !== null ? (
              <>
                Read it as a direction, not a digit: on a smaller re-cut sample the four ways of
                ending a step put that median across {Math.round(loc.spreadPts)} points, from{" "}
                {pct(loc.subsample.low)} to {pct(loc.subsample.high)}, and none of them landed on
                the figure quoted here.
              </>
            ) : null}
          </p>

          {/* The median says where the break falls. This says how many there are, and
              the spike is what makes localising worth doing at all. */}
          <section
            aria-label="How many false steps each localisable wrong chain contains"
            className="flex flex-col gap-2 rounded-lg border border-grid bg-surface p-4"
          >
            <BreakCounts />
            <p className="text-sm text-ink-muted">
              And it usually breaks <strong className="text-ink">once</strong>. Of those{" "}
              {loc.nLocalisable} chains,{" "}
              <strong className="text-ink">{loc.breaksPerChain["1"]}</strong> contain exactly one
              false step
              {loc.shareWithOneFalseStep !== null ? (
                <> ({pct(loc.shareWithOneFalseStep, 0)} of them)</>
              ) : null}
              . That is the fact the median cannot carry, and it is the whole case for grading
              steps: a chain that goes wrong in one place has a place to find, while a chain that
              was wrong throughout would give a step grader nothing to localise and would cost
              outcome grading nothing to discard whole. Read the shape and not the digits, and
              read it at its true reach: {loc.nLocalisable} of {loc.nWrong.toLocaleString()} wrong
              chains ({pct(loc.nLocalisable / loc.nWrong, 0)}) have a findable break at all, so
              this is the shape of the ones we can place, not of wrong chains in general.
            </p>
          </section>
        </section>

        <div aria-hidden="true" />

        {/* The hand-off, in the content column so it does not run under the notes. */}
        <Handoff className="min-w-0">
          A step-level grader can do what the others cannot: judge a chain{" "}
          <em>while it is still being written</em>. Once you can score a half-finished chain, you
          need not finish the ones going badly.{" "}
          <em className="text-ink-muted">
            You can branch, look ahead, and back out. Turn the page.
          </em>
        </Handoff>
        <div aria-hidden="true" />
      </div>

      {/* Draft: the old opening beat, moved below the page until it is rebuilt.
          "There has to be a fact" becomes a PRM drawback in a later beat. Same
          grid as above, so its References note keeps its place beside it. */}
      <div className="grid gap-x-8 gap-y-8 border-t border-dashed border-grid pt-6 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">Draft: what can be graded at all</h2>
          <p className="text-ink-muted">
            Three things have to hold before grading a step means anything.
          </p>
          <ul className="flex flex-col gap-2 text-ink-muted">
            <li>
              <strong className="text-ink">There has to be a fact.</strong> A proof has one at every
              line; a poem has none mid-stanza. Grade the process where the domain has absolutes,
              and grade the outcome where it has taste.
            </li>
            <li>
              <strong className="text-ink">A right answer can be reached by a wrong step.</strong>{" "}
              Arithmetic that slips and still lands right, the way a long multiplication can, is
              exactly what an outcome grader waves through and only a step grader catches.
            </li>
            <li>
              <strong className="text-ink">The unit is the step, not the word.</strong> No word is
              false on its own, because the claim does not exist until the line is finished, so a
              grader scores slices big enough to be checkable rather than tokens.
            </li>
          </ul>
          <p className="text-ink-muted">
            Below, two instruments read these chains with opposite reach. An{" "}
            <strong className="text-ink">arithmetic checker</strong> recomputes only the{" "}
            <strong className="text-ink">
              {pct(1 - share, 1)} of {PAGE9.graders.stepsTotal.toLocaleString()}
            </strong>{" "}
            steps that are closed-form numeric and{" "}
            <span className="rounded-sm bg-correct/15 px-1 underline decoration-correct decoration-2 underline-offset-4">
              underlines what it proves
            </span>
            ; the other {pct(share)} state nothing it can compute. A{" "}
            <strong className="text-ink">process reward model</strong>
            <Cite n={REF.lightman} /> takes the opposite trade: nothing goes unscored, but a score
            is a judgment call where the checker&apos;s label is deterministic arithmetic.
          </p>
        </section>

        {/* House style, pages 3-8: the reference sits beside the step that cites
            it. The marker is in this beat, so the entry is too. */}
        <Note kicker="References">
          <p>Cited for the technique. The numbers here are our own model&apos;s, not theirs.</p>
          <RefItem n={REF.lightman} href="https://arxiv.org/abs/2305.20050">
            Lightman et al. 2023, <em>Let&apos;s Verify Step by Step</em> (arXiv 2305.20050).
          </RefItem>
        </Note>
      </div>

      <PageNav n={PAGE_N} />
    </article>
  );
}
