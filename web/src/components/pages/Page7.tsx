"use client";

/**
 * Page 7, "Frequency Voting" — page 6 made one chain longer. This page runs the
 * chain many times and keeps the answer the most chains agree on.
 *
 * EVERY NUMBER ON THIS PAGE IS OURS AND IS MEASURED. Nothing is redrawn from a
 * paper and nothing is simulated. The source is one run of
 * `notebooks/page_07_frequency_voting.ipynb` — Qwen2.5-3B-Instruct at bf16,
 * MATH-500 levels 4 and 5, the same 100 paired items pages 5 and 6 use, 16
 * sampled chains per problem, 5,920 generations. Its `derived.json` is committed
 * verbatim to `web/data/page-07-derived.json` and loaded through `@/lib/page07`,
 * which reads the run's `claims` gates BEFORE any number and throws if a
 * blocking one is false. No inference runs at demonstration time.
 *
 * WHAT THE OLD PAGE DID THAT THIS ONE MUST NOT. The previous build simulated the
 * vote with `CHAMBER_MODEL` (a Monte Carlo tuned to land on Wang et al.'s
 * published GSM8K curve) over four hand-authored "misreadings" in
 * `SAMPLING_CHAMBER`, and its temperature dial was explicitly modelled because
 * temperature appears in no reported number. All three are gone. Do not
 * reintroduce `lib/sim` or `lib/authored` here.
 *
 * THE HEADLINE, AND THE TRAP IN IT. Bare chain of thought is ONE GREEDY CHAIN —
 * page 5's `bare` condition, page 6's top rung, 43% on these items. The vote over
 * 16 sampled chains solves 55%: +12 points, p = 0.0075. Against one SAMPLED
 * chain the same vote gains only 4 points and does not resolve (p = 0.39),
 * because sampling at T=0.3 is already worth something on its own. The page
 * quotes the greedy contrast because that is what "improves on chain of thought"
 * means here, and the footnote carries the other one. Never quote the 12 and the
 * sampled baseline in the same breath.
 *
 * Layout: pages 5 and 6's shell. One reading column of numbered steps, each
 * beside its own margin note.
 *
 *   Step 1 — figure 1, the pile. One problem, 16 chains, tallied into a ranked
 *   histogram. Truth concentrates (the modal answer holds 9.9 of 16 votes on
 *   average) and the tail is real (41% of answer classes appear exactly once).
 *   Lead with the CONCENTRATION: the run's `errors_are_diffuse` gate is FALSE at
 *   a 50% threshold, so "wrong answers all disagree" overstates it. Opening a bar
 *   shows the chains that landed there, and two chains agreeing on a wrong answer
 *   usually made different mistakes. Do not bucket the singletons.
 *
 *   Step 2 — figure 2, what the vote buys. Accuracy against N, built by
 *   subsampling one pile so chain length is fixed. The temperature-0 line is FLAT
 *   by construction and that is the page's cleanest proof that the vote needs
 *   diversity. THE DIP AT N=2 IS REAL AND MUST BE EXPLAINED, not smoothed: with
 *   two chains a disagreement is a tie, a tie is not a vote, and 52% of N=2 votes
 *   tie. The coverage line is page 8's ceiling arriving early.
 *
 *   Step 3 — the split, and it is the honest half. At a FIXED budget, splitting
 *   loses: N=1 51%, N=4 35%, N=16 8%. `splitting_a_fixed_budget_pays` is false
 *   and the page says so. Voting buys accuracy; the budget comes from somewhere.
 *
 *   Step 4 — one number, no figure: 23% of problems where the model produced the
 *   right answer and the vote threw it away. That is page 8's whole subject and
 *   it is deliberately not drawn here (see docs/page_8_refactor.md).
 *
 * Load-bearing and easy to lose:
 *   · the diversity readout is measured on 30 items, not 100. It is a count of
 *     answers, not an accuracy, and the label must keep saying so.
 *   · Wang et al. is cited for the TECHNIQUE. No cite may carry one of our
 *     numbers.
 */

import { useState } from "react";
import { ChartFrame } from "@/components/ChartFrame";
import { CitationBadge } from "@/components/CitationBadge";
import { PageNav } from "@/components/PageNav";
import type { Citation } from "@/lib/data";
import { ACTS, getPage } from "@/lib/pages";
import { PAGE7, chainsFor, pLabel, pct, tidyMath, tokens } from "@/lib/page07";
import { useStore } from "@/store/useStore";

const PAGE_N = 7;
const F1 = PAGE7.figure1;
const F2 = PAGE7.figure2;
const H = PAGE7.handoff;
const M = PAGE7.manifest;

const NOTEBOOK_ZIP = "/notebooks/page-07-frequency-voting.zip";
const NOTEBOOK_SIZE = "3.2 MB";
const RUN_DATE = M.timestamp_utc.slice(0, 10);

/** Cited for the technique. Every number on this page is ours. */
const WANG: Citation = {
  ref: "Wang et al. 2022",
  url: "https://arxiv.org/abs/2203.11171",
  venue: "ICLR 2023",
  preprint: false,
};

const chip = "rounded-full border border-grid px-2 py-0.5 text-ink-muted";

function Note({ kicker, children }: { kicker: string; children: React.ReactNode }) {
  return (
    <aside className="flex flex-col gap-2 text-sm text-ink-muted lg:pt-9">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{kicker}</p>
      {children}
    </aside>
  );
}

/* ------------------------------------------------------------------ figure 1 */

/**
 * The pile as a ranked tally. One row per distinct answer, the correct one
 * marked, and the singletons kept as their own rows because that row IS the
 * argument.
 */
function Tally({ onOpen, open }: { onOpen: (a: string) => void; open: string | null }) {
  const s = F1.specimen;
  const max = s.ranked[0]?.votes ?? 1;
  return (
    <ol className="flex flex-col gap-1">
      {s.ranked.map((row) => {
        const isOpen = open === row.answer;
        return (
          <li key={row.answer}>
            <button
              type="button"
              onClick={() => onOpen(row.answer)}
              aria-expanded={isOpen}
              className={`flex w-full items-center gap-2 rounded px-1 py-0.5 text-left hover:bg-surface-raised ${
                isOpen ? "bg-surface-raised" : ""
              }`}
            >
              <span
                className={`w-24 shrink-0 truncate font-mono text-xs ${
                  row.correct ? "text-correct" : "text-ink-muted"
                }`}
                title={row.answer}
              >
                {tidyMath(row.answer)}
              </span>
              <span className="flex h-4 min-w-0 flex-1 items-center">
                <span
                  className={`h-3 rounded-sm ${row.correct ? "bg-correct" : "bg-grid"}`}
                  style={{ width: `${Math.max(2, (row.votes / max) * 100)}%` }}
                />
              </span>
              <span className="w-6 shrink-0 text-right font-mono text-xs tabular-nums text-ink-muted">
                {row.votes}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/* ------------------------------------------------------------------ figure 2 */

const W = 620;
const HGT = 280;
const MARGIN = { top: 26, right: 96, bottom: 46, left: 46 };
const IW = W - MARGIN.left - MARGIN.right;
const IH = HGT - MARGIN.top - MARGIN.bottom;

/** Accuracy against N, one pile subsampled. Log-2 x, because N doubles. */
function PileChart() {
  const pts = F2.hot.points;
  const ns = pts.map((p) => p.n);
  const x = (n: number) =>
    (Math.log2(n) / Math.log2(Math.max(...ns))) * IW;
  const y = (v: number) => IH - (v / 100) * IH;
  const line = (get: (p: (typeof pts)[number]) => number) =>
    pts.map((p, i) => `${i ? "L" : "M"}${x(p.n)},${y(get(p) * 100)}`).join(" ");
  const cold = F2.cold.points[0].accuracy;

  return (
    <ChartFrame
      title={`Share of 100 MATH-500 problems solved against the number of chains the vote sees, at temperature ${F2.hot.temperature}. One chain ${pct(pts[0].accuracy)}, sixteen chains ${pct(pts[pts.length - 1].accuracy)}. The right answer is somewhere in the pile on ${pct(pts[pts.length - 1].coverage)}. At temperature zero every chain is identical and the line is flat at ${pct(cold)}.`}
      width={W}
      height={HGT}
      margin={MARGIN}
      xLabel="chains the vote may see"
      yLabel="solved (%)"
    >
      {[0, 25, 50, 75, 100].map((t) => (
        <g key={t}>
          <line x1={0} x2={IW} y1={y(t)} y2={y(t)} className="stroke-grid" strokeWidth={1} />
          <text x={-8} y={y(t) + 4} textAnchor="end" className="fill-ink-muted text-[10px]">
            {t}
          </text>
        </g>
      ))}
      {ns.map((n) => (
        <text key={n} x={x(n)} y={IH + 16} textAnchor="middle" className="fill-ink-muted text-[10px]">
          {n}
        </text>
      ))}

      {/* the ceiling: the right answer was generated */}
      <path d={line((p) => p.coverage)} fill="none" className="stroke-wrong" strokeWidth={1.4} strokeDasharray="4 3" />
      <text x={IW + 6} y={y(pts[pts.length - 1].coverage * 100) + 4} className="fill-wrong text-[10px]">
        in the pile
      </text>

      {/* temperature zero: N copies of one greedy chain */}
      <line x1={0} x2={IW} y1={y(cold * 100)} y2={y(cold * 100)} className="stroke-ink-muted" strokeWidth={1.4} strokeDasharray="2 3" />
      <text x={IW + 6} y={y(cold * 100) + 4} className="fill-ink-muted text-[10px]">
        T = 0
      </text>

      {/* the vote */}
      <path d={line((p) => p.accuracy)} fill="none" className="stroke-compute" strokeWidth={2.4} />
      {pts.map((p) => (
        <circle key={p.n} cx={x(p.n)} cy={y(p.accuracy * 100)} r={3.4} className="fill-compute" />
      ))}
      <text x={IW + 6} y={y(pts[pts.length - 1].accuracy * 100) + 4} className="fill-compute text-[10px] font-semibold">
        the vote
      </text>

      {/* the dip at N=2 is the tie rule, not noise */}
      {pts[1] ? (
        <text x={x(pts[1].n)} y={y(pts[1].accuracy * 100) + 18} textAnchor="middle" className="fill-ink-muted text-[10px]">
          ties
        </text>
      ) : null}
    </ChartFrame>
  );
}

/* -------------------------------------------------------------------- page */

export function Page7() {
  const page = getPage(PAGE_N)!;
  const recordInteraction = useStore((s) => s.recordInteraction);
  const [open, setOpen] = useState<string | null>(null);

  const s = F1.specimen;
  const openChains = open ? chainsFor(s, open) : [];
  const openRow = open ? s.ranked.find((r) => r.answer === open) : null;
  const last = F2.hot.points[F2.hot.points.length - 1];
  // What one chain spends against what the pile spends. The gap between them is why
  // "just give one chain more" is not on the table: the chain ends on its own.
  const oneChainTokens = F2.hot.points[0].mean_tokens;
  const pileTokens = last.mean_tokens;

  const pick = (answer: string) => {
    recordInteraction(PAGE_N);
    setOpen((cur) => (cur === answer ? null : answer));
  };

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
        Page 6 made <strong className="text-ink">one chain longer</strong>. This page runs the chain{" "}
        <strong className="text-ink">many times</strong> and keeps the answer the most chains agree
        on. One friend gives you one opinion and all their quirks; ask everyone and the quirks
        scatter while the best answer keeps collecting votes.
      </p>

      <div className="flex flex-col gap-2 rounded-lg border border-grid bg-surface p-4">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className={chip}>Qwen2.5-3B-Instruct · bf16</span>
          <span className={chip}>
            sampled at T = {F2.hot.temperature} · top-p {M.decoding.top_p}
          </span>
          <span className={chip}>
            MATH-500 levels 4 and 5 · n = {M.items.n} paired items
          </span>
          <span className={chip}>{F1.n_chains} chains each · {RUN_DATE}</span>
        </div>
        <p className="text-sm text-ink">
          Every figure below is one measurement of ours, on the same items pages 5 and 6 use.{" "}
          <a className="font-semibold text-compute underline underline-offset-2" href={NOTEBOOK_ZIP} download>
            Download the notebook, the harness and all 5,920 chains ({NOTEBOOK_SIZE})
          </a>
          . It opens in a replay mode that redraws every figure here from those chains, on no GPU.
        </p>
      </div>

      <div className="grid gap-x-8 gap-y-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
        {/* Step 1 */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            1. Ask the same question sixteen times
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              one problem · {F1.n_chains} chains · {s.distinct_answers} distinct answers
            </span>
          </h2>
          <section
            aria-label="One problem, sixteen chains, tallied"
            className="flex flex-col gap-4 rounded-lg border border-grid bg-surface p-4"
          >
            <p className="text-lg text-ink">{tidyMath(s.question)}</p>
            <p className="font-mono text-xs text-ink-muted">
              the answer is {tidyMath(s.ground_truth)} · picked from {F1.n_candidates} problems that
              qualified
            </p>

            <Tally onOpen={pick} open={open} />

            <p className="text-xs text-ink-muted">
              Click a row to read the chains that landed on it.
            </p>

            {openRow ? (
              <div
                className={`flex flex-col gap-3 rounded-lg border-l-4 p-3 ${
                  openRow.correct ? "border-correct bg-correct/10" : "border-wrong bg-wrong/10"
                }`}
              >
                <p className="text-sm text-ink">
                  <strong className={openRow.correct ? "text-correct" : "text-wrong"}>
                    {tidyMath(openRow.answer)}
                  </strong>{" "}
                  · {openRow.votes} of {F1.n_chains} chains ·{" "}
                  {openRow.correct ? "correct" : "wrong"}
                  {!openRow.correct && openRow.votes > 1
                    ? " — and they got there by different routes"
                    : ""}
                </p>
                {openChains.slice(0, 2).map((c) => (
                  <div key={c.sample_index} className="flex flex-col gap-1">
                    <p className="font-mono text-xs text-ink-muted">
                      chain {c.sample_index} · {tokens(c.own_tokens)} tokens
                      {c.truncated ? " · hit its cap and was made to commit" : ""}
                    </p>
                    <p className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded bg-surface-raised p-2 text-xs leading-relaxed text-ink-muted">
                      {tidyMath(c.trace)}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </section>
          <p className="text-sm text-ink-muted">
            The winning answer holds {F1.shape.mean_top_votes.toFixed(1)} of {F1.shape.n_chains}{" "}
            votes on average across all {M.items.n} problems, against{" "}
            {F1.shape.mean_distinct.toFixed(1)} distinct answers. Agreement concentrates; the rest
            is a scatter of near-misses, {pct(F1.shape.singleton_share)} of which are said exactly
            once.
          </p>
        </section>
        <Note kicker="References">
          <p>Cited for the technique. Every number on this page is ours.</p>
          <p>
            Wang et al. 2022, <em>Self-Consistency Improves Chain of Thought Reasoning</em>:
            sampling many chains and keeping what recurs.
          </p>
        </Note>

        {/* Step 2 */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            2. What the vote buys
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              the same {M.items.n} problems · one pile, subsampled
            </span>
          </h2>
          <section
            aria-label="Accuracy against the number of chains"
            className="flex flex-col gap-4 rounded-lg border border-grid bg-surface p-4"
          >
            <PileChart />
            <div className="rounded-lg border-l-4 border-compute bg-surface-raised px-3 py-2 text-ink">
              One chain of chain-of-thought, decoded greedily, solves{" "}
              <strong className="font-mono">{pct(F2.gain.bare_cot)}</strong>. The vote over{" "}
              {F1.n_chains} sampled chains solves{" "}
              <strong className="font-mono">{pct(F2.gain.vote)}</strong>:{" "}
              <strong>+{F2.gain.gain_pts.toFixed(0)} points</strong> ·{" "}
              {pLabel(F2.gain.p)}, exact McNemar over the {F2.gain.fixed + F2.gain.broken} problems
              where the two disagree ({F2.gain.fixed} fixed, {F2.gain.broken} broken).
            </div>
            <div className="grid gap-3 text-xs text-ink-muted sm:grid-cols-2">
              <p>
                <strong className="text-ink">The flat line is the point.</strong> At temperature 0
                every chain is the same chain, so the vote is one voter answering{" "}
                {F1.n_chains} times and nothing is gained. Diversity is the whole mechanism.
              </p>
              <p>
                <strong className="text-ink">The dip at N = 2 is the tie rule.</strong> Two chains
                that disagree are a tie, and a tie returns no answer, so it grades wrong.{" "}
                {pct(F2.hot.points[1]?.tie_rate ?? 0)} of two-chain votes tie; by sixteen it is{" "}
                {pct(last.tie_rate)}.
              </p>
            </div>
          </section>
          <div className="flex flex-col gap-2 rounded-lg border border-grid bg-surface p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              distinct answers among {F2.diversity[0].n_chains} chains, by temperature
            </p>
            <div className="flex flex-wrap items-end gap-3">
              {[...F2.diversity]
                .sort((a, b) => a.temperature - b.temperature)
                .map((d) => (
                  <div key={d.temperature} className="flex flex-col items-center gap-1">
                    <span className="font-mono text-lg tabular-nums text-ink">
                      {d.mean_distinct.toFixed(1)}
                    </span>
                    <span className="font-mono text-[10px] text-ink-muted">T {d.temperature}</span>
                  </div>
                ))}
            </div>
            <p className="text-xs text-ink-muted">
              Measured on {F2.diversity[0].n_items} items. This is a count of answers, not an
              accuracy: turning the dial up makes the chains differ, which is necessary and not
              sufficient — past T = {F2.hot.temperature} each chain gets worse faster than the vote
              recovers it.
            </p>
          </div>
        </section>
        <Note kicker="Try it">
          <p>Open a row in step 1 and read two chains that agreed on a wrong answer.</p>
        </Note>

        {/* Step 3 */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            3. And what it costs
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              one budget of {tokens(M.split.budget_total)} tokens, split N ways
            </span>
          </h2>
          <section
            aria-label="The same budget split N ways"
            className="flex flex-col gap-3 rounded-lg border border-grid bg-surface p-4"
          >
            <table className="w-full text-sm">
              <caption className="pb-2 text-left text-xs text-ink-muted">
                The same number of chains, capped to share {tokens(M.split.budget_total)} tokens
                against allowed to finish. Read the cut-off column before concluding anything
                about the vote.
              </caption>
              <thead>
                <tr className="border-b border-grid text-xs uppercase tracking-wide text-ink-muted">
                  <th className="py-1 text-left font-semibold">chains</th>
                  <th className="py-1 text-right font-semibold">capped</th>
                  <th className="py-1 text-right font-semibold">cut off</th>
                  <th className="py-1 text-right font-semibold">allowed to finish</th>
                  <th className="py-1 text-right font-semibold">tokens</th>
                </tr>
              </thead>
              <tbody>
                {F2.split.map((sp) => {
                  const free = F2.hot.points.find((p) => p.n === sp.n);
                  return (
                    <tr key={sp.n} className="border-b border-grid/50">
                      <td className="py-1.5 font-mono tabular-nums text-ink">{sp.n}</td>
                      <td className="py-1.5 text-right font-mono tabular-nums text-wrong">
                        {pct(sp.accuracy)}
                      </td>
                      <td className="py-1.5 text-right font-mono tabular-nums text-ink-muted">
                        {pct(sp.truncated_rate)}
                      </td>
                      <td className="py-1.5 text-right font-mono tabular-nums text-compute">
                        {free ? pct(free.accuracy) : "—"}
                      </td>
                      <td className="py-1.5 text-right font-mono tabular-nums text-ink-muted">
                        {free ? tokens(free.mean_tokens) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="text-ink">
              Dividing a fixed budget does two things at once: it adds chains{" "}
              <em>and</em> it shortens them. On this band the second swamps the first. At sixteen
              chains every one is cut off mid-thought, and page 6 measured a chain that short at
              7% on its own — the vote is being asked to pool fragments.{" "}
              <strong className="text-ink">Splitting is not what fails here; capping is.</strong>
            </p>
            <p className="text-ink">
              Which is why the honest comparison is the last two columns, at the same number of
              chains. Let them finish and the vote works. That costs more —{" "}
              {tokens(pileTokens)} tokens against {tokens(oneChainTokens)} for one chain — and{" "}
              <strong className="text-ink">there is no cheaper way to buy it</strong>, because
              page 6&apos;s chain stops on its own at this cap and will not take more. Sideways is
              the only direction left.
            </p>
          </section>
        </section>
        <div aria-hidden="true" />

        {/* Step 4 */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">4. What the vote threw away</h2>
          <div className="flex flex-col gap-3 rounded-lg border border-grid bg-surface p-4">
            <p className="text-lg text-ink">
              On <strong className="font-mono text-2xl text-wrong">{pct(H.thrown_away)}</strong> of
              these problems the model produced the right answer and the vote discarded it.
            </p>
            <p className="text-sm text-ink-muted">
              The right answer was somewhere in the pile on {pct(H.coverage)} of problems. The vote
              returned it on {pct(H.plurality_accuracy)}. Counting can only ever return the answer
              that comes up most, and the right answer is sometimes rare — on{" "}
              {pct(H.tie_rate)} of problems the vote could not even break a tie.{" "}
              <em>
                Page 8 keeps the same {H.n_chains} candidates and changes only the rule for picking
                one: stop counting, start judging.
              </em>
            </p>
          </div>
        </section>
        <div aria-hidden="true" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-ink-muted">
          Technique cited. The measurements on this page are ours:
        </span>
        <CitationBadge citation={WANG} />
      </div>

      <div className="flex flex-col gap-2 text-xs text-ink-muted">
        <p>
          run <span className="font-mono">{M.run_id}</span>, {RUN_DATE} · Qwen2.5-3B-Instruct at
          bf16, sampled at temperature {F2.hot.temperature} with top-p {M.decoding.top_p}, a{" "}
          {tokens(M.pile.chain_cap)}-token cap per chain and a forced commitment for any chain that
          reached it; MATH-500 levels 4 and 5 at n = {M.items.n} paired items, the same draw pages 5
          and 6 use. Answers are extracted and graded by ch03&apos;s{" "}
          <a
            className="underline underline-offset-2"
            href="https://github.com/rasbt/reasoning-from-scratch"
            target="_blank"
            rel="noopener noreferrer"
          >
            reasoning-from-scratch
          </a>{" "}
          functions, used unchanged, so the grading is not ours to defend. Two chains count as
          agreeing when that same grader says their answers are equivalent, so{" "}
          <span className="font-mono">1/2</span> and <span className="font-mono">0.5</span> are one
          bucket rather than two. A tie returns no answer and grades wrong.
        </p>
        <p>
          The N axis is one pile of {F1.n_chains} chains, subsampled {M.pile.n_resamples} times per
          problem at each N, so the chain length is fixed and the only thing changing is how many
          candidates the vote sees. Intervals and the paired test are over the {M.items.n} items,
          which are the independent unit. A second contrast was measured and is not plotted: against
          one <em>sampled</em> chain rather than a greedy one, the same vote gains{" "}
          {F2.gainVsOneSample.pts.toFixed(0)} points at {pLabel(F2.gainVsOneSample.p)}, which does
          not resolve. Sampling at this temperature is already worth a few points on its own, and
          the headline above is the vote against chain of thought as pages 5 and 6 measured it.
        </p>
        <p>
          Limits: one model, one benchmark, one language. Temperature was chosen by which value
          voted best on {F2.diversity[0].n_items} items, so it is fitted on a subset rather than
          held out. Sampling is seeded per group of chains, and floating-point reduction order
          shifts with batch size and hardware, so re-deriving reproduces the shape and the ranking
          rather than every digit. The page measures whether a chain landed on the right answer,
          never whether its reasoning was sound.
        </p>
      </div>

      <PageNav n={PAGE_N} />
    </article>
  );
}
