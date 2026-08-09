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
 * beside its own margin note. Every step that carries a figure opens on a
 * sentence saying what the figure is a picture OF.
 *
 * THERE IS NO PROVENANCE PLATE, and one must not come back. The page used to
 * open on one above step 1 — "every figure below is one measurement of ours",
 * then a mono line of precision, top-p, run id and date. It read as a specimen
 * label from a lab the reader has not visited, and it front-loaded the apparatus
 * before the idea. The two facts a reader actually needs, WHICH MODEL and WHICH
 * PROBLEMS, now sit on the figures that are pictures of them: figure 1's
 * specimen card carries the benchmark and the specimen's level, step 3's heading
 * carries the item count, the benchmark and the model, and step 2's intro names
 * the model in prose. Everything else the run recorded is in the download on the
 * top line, which is the honest place for it.
 *
 *   Step 1 — no figure. The idea, in slips of paper: you do not know whose taste
 *   to trust, so you do not pick a taster. You collect everyone's favourite,
 *   drop them in a box and count. The load-bearing clause is that nobody had to
 *   be right alone, the crowd only had to be wrong in UNCORRELATED ways, which
 *   is the mechanism the whole page then measures and the reason step 3's T = 0
 *   line is flat. Name the technique here, and cite Wang in the margin beside
 *   it, where the TECHNIQUE is the subject.
 *
 *   Step 2 — figure 1, the pile. One problem, 16 chains, tallied into a ranked
 *   histogram. Truth concentrates (the modal answer holds 9.9 of 16 votes on
 *   average) and the tail is real (41% of answer classes appear exactly once).
 *   Lead with the CONCENTRATION: the run's `errors_are_diffuse` gate is FALSE at
 *   a 50% threshold, so "wrong answers all disagree" overstates it. Opening a bar
 *   shows the chains that landed there, and two chains agreeing on a wrong answer
 *   usually made different mistakes. Do not bucket the singletons.
 *
 *   Step 3 — figure 2, what the vote buys. Accuracy against N, built by
 *   subsampling one pile so chain length is fixed. Its three lines each get a
 *   name in the intro, because none of them is self-evident: "the vote" is what
 *   counting returns, "in the pile" is how often the right answer was on SOME
 *   slip whether or not counting picked it (so the gap between them is what the
 *   rule discards, and it is page 8's ceiling arriving early), and T = 0 turns
 *   sampling off. The temperature-0 line is FLAT by construction and that is the
 *   page's cleanest proof that the vote needs diversity. THE DIP AT N=2 IS REAL
 *   AND MUST BE EXPLAINED, not smoothed: with two chains a disagreement is a
 *   tie, a tie is not a vote, and 52% of N=2 votes tie.
 *
 *   Step 4 — the split, and it is the honest half. At a FIXED budget, splitting
 *   loses: 46% / 35% / 8% at N = 1 / 4 / 16. `splitting_a_fixed_budget_pays` is
 *   false and the page says so, but says WHY, because "splitting loses" alone
 *   reads as "voting loses", which step 3 disproves. The cause is the cap: the
 *   cut-off column runs 1% / 55% / 100%, so at N=16 every chain is force-answered
 *   mid-thought and page 6 measured a chain that short at 7% alone. The table
 *   groups its headers because that column is a property of the run and not a
 *   score, and three bare percentages in a row invite reading it as one.
 *   The N=1 row is the control: the cap barely binds, so both runs ARE the same
 *   run and report the same 46%.
 *
 *   Step 5 — one number, no figure: 23% of problems where the model produced the
 *   right answer and the vote threw it away. That is page 8's whole subject and
 *   it is deliberately not drawn here (see docs/page_8_refactor.md).
 *
 * The apparatus is in the margin, one note per step, not in a footer. The
 * three-paragraph tail this page used to end on was doing the notebook's job: a
 * reader who wants the method downloads the run. A note may say what a reader
 * cannot work out from the figure beside it, and nothing else.
 *
 * Load-bearing and easy to lose:
 *   · the diversity readout is measured on 30 items, not 100. It is a count of
 *     answers, not an accuracy, and the label must keep saying so.
 *   · Wang et al. is cited for the TECHNIQUE. No cite may carry one of our
 *     numbers.
 */

import { useState } from "react";
import { ChartFrame } from "@/components/ChartFrame";
import { Cite, RefItem } from "@/components/Cite";
import { PageNav } from "@/components/PageNav";
import { ACTS, getPage } from "@/lib/pages";
import { PAGE7, chainsFor, pLabel, pct, tidyMath, tokens } from "@/lib/page07";
import { useStore } from "@/store/useStore";

const PAGE_N = 7;
const F1 = PAGE7.figure1;
const F2 = PAGE7.figure2;
const H = PAGE7.handoff;
const M = PAGE7.manifest;

const NOTEBOOK_ZIP = "/notebooks/page-07-frequency-voting.zip";
const NOTEBOOK_SIZE = "3.1 MB";

/* The instrument used to sit in a provenance plate above step 1, which read as a
   specimen label from a lab the reader has not visited. What a reader needs is
   which model and which problems, and they need it beside the figure that is a
   picture of them: figure 1's specimen card and figure 2's heading. The rest of
   the apparatus — precision, top-p, run id, date, the item hash — is in the
   download on the top line. */
const BENCHMARK = "MATH-500";
const LEVELS = "levels 4 and 5";

/** Cited for the technique. Every number on this page is ours. */
const REF = { wang: 1 } as const;

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
const MARGIN = { top: 26, right: 104, bottom: 46, left: 46 };
const IW = W - MARGIN.left - MARGIN.right;
const IH = HGT - MARGIN.top - MARGIN.bottom;

/**
 * The page's main figure, and the one a reader can most easily misread.
 *
 * Three lines, and the SPACE BETWEEN TWO OF THEM is the point:
 *   · the flat one is bare chain of thought, one greedy chain, and it is flat
 *     because sixteen copies of one chain is one chain;
 *   · the solid one is what the vote actually returns;
 *   · the dashed one is what the model PRODUCED — how often the right answer was
 *     somewhere among the chains, whether the vote found it or not.
 *
 * The band between the last two is what voting generated and discarded, which is
 * page 8's entire subject, so it is shaded and named rather than left for the
 * reader to infer. Earlier labels read "in the pile" / "the vote" / "T = 0",
 * which is the notebook's vocabulary and not a reader's.
 */
function PileChart() {
  const pts = F2.hot.points;
  const ns = pts.map((p) => p.n);
  const x = (n: number) => (Math.log2(n) / Math.log2(Math.max(...ns))) * IW;
  const y = (v: number) => IH - (v / 100) * IH;
  const line = (get: (p: (typeof pts)[number]) => number) =>
    pts.map((p, i) => `${i ? "L" : "M"}${x(p.n)},${y(get(p) * 100)}`).join(" ");
  const cold = F2.cold.points[0].accuracy;
  const last = pts[pts.length - 1];
  // The shaded band: coverage along the top, the vote back along the bottom.
  const band =
    pts.map((p, i) => `${i ? "L" : "M"}${x(p.n)},${y(p.coverage * 100)}`).join(" ") +
    " " +
    [...pts].reverse().map((p) => `L${x(p.n)},${y(p.accuracy * 100)}`).join(" ") +
    " Z";

  return (
    <ChartFrame
      title={`Share of ${M.items.n} ${BENCHMARK} problems, ${LEVELS}, solved by ${PAGE7.primary.label} against the number of chains the vote sees. One greedy chain solves ${pct(cold)} and stays there however many copies are made of it. The vote over sixteen sampled chains solves ${pct(last.accuracy)}. At least one chain was right on ${pct(last.coverage)}, so ${pct(last.coverage - last.accuracy)} of problems had the right answer generated and discarded by the vote.`}
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

      {/* what was generated and then discarded: page 8's whole subject */}
      <path d={band} className="fill-wrong opacity-10" />

      <path d={line((p) => p.coverage)} fill="none" className="stroke-wrong" strokeWidth={1.4} strokeDasharray="4 3" />
      <text x={IW + 6} y={y(last.coverage * 100) - 2} className="fill-wrong text-[10px]">
        <tspan x={IW + 6} dy="0">at least one</tspan>
        <tspan x={IW + 6} dy="11">chain is right</tspan>
      </text>

      <path d={line((p) => p.accuracy)} fill="none" className="stroke-compute" strokeWidth={2.4} />
      {pts.map((p) => (
        <circle key={p.n} cx={x(p.n)} cy={y(p.accuracy * 100)} r={3.4} className="fill-compute" />
      ))}
      <text x={IW + 6} y={y(last.accuracy * 100) - 2} className="fill-compute text-[10px] font-semibold">
        <tspan x={IW + 6} dy="0">the vote</tspan>
        <tspan x={IW + 6} dy="11">returns it</tspan>
      </text>

      <line x1={0} x2={IW} y1={y(cold * 100)} y2={y(cold * 100)} className="stroke-ink-muted" strokeWidth={1.4} strokeDasharray="2 3" />
      <text x={IW + 6} y={y(cold * 100) + 4} className="fill-ink-muted text-[10px]">
        <tspan x={IW + 6} dy="0">one greedy</tspan>
        <tspan x={IW + 6} dy="11">chain (T = 0)</tspan>
      </text>

      {/* name the band in the middle of the chart, where the eye already is */}
      <text
        x={x(pts[Math.max(pts.length - 2, 0)].n)}
        y={(y(last.coverage * 100) + y(last.accuracy * 100)) / 2}
        textAnchor="middle"
        className="fill-wrong text-[10px] font-semibold"
      >
        generated, then thrown away
      </text>

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
      {/* The download shares the top line with the act kicker, page 5's shape:
          the first thing on the page after the title row is the way to
          re-derive all of it. */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="text-xs uppercase tracking-wide text-ink-muted">
          Act {page.act} · {ACTS[page.act].title}
        </p>
        <a
          className="rounded border border-grid px-2 py-1 text-xs text-ink-muted hover:text-ink"
          href={NOTEBOOK_ZIP}
          download
        >
          Download the notebook, the harness and every chain (zip, {NOTEBOOK_SIZE}) ↓
        </a>
      </div>
      <h1 className="text-3xl font-bold text-ink">
        <span className="font-mono text-ink-muted">{page.n}. </span>
        {page.title}
      </h1>
      <p className="max-w-2xl text-lg text-ink-muted">
        Page 6 made <strong className="text-ink">one chain longer</strong>, and ran out of road. So
        stop asking once: ask the <em>same</em> question many times, and keep the answer that comes
        up <strong className="text-ink">most often</strong>.
      </p>

      <div className="grid gap-x-8 gap-y-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
        {/* Step 1 */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            1. Put it to a vote
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              the idea, before the measurement
            </span>
          </h2>
          <p className="text-ink">
            You are new in town and want the best pizza. You do not know whose taste to trust, so
            you do not pick a person: you hand out slips of paper, ask everyone to write down their
            favourite place, and drop them in a box. Then you count. One enthusiast&apos;s odd
            favourite gets one slip and stays there. The place that is actually good keeps turning
            up, on slips written by people who have nothing in common.
          </p>
          <p className="text-ink">
            Nobody had to be right on their own. The crowd only had to be wrong in{" "}
            <em>uncorrelated</em> ways, so the mistakes scatter and the good answer stacks. Done to
            a model, by sampling the same question many times and keeping the answer that comes up
            most, that is <strong>majority voting</strong>, or{" "}
            <strong>self-consistency</strong>.
            <Cite n={REF.wang} />
          </p>
        </section>
        <Note kicker="References">
          <RefItem n={REF.wang} href="https://arxiv.org/abs/2203.11171">
            Wang et al. 2022, <em>Self-Consistency Improves Chain of Thought Reasoning in Language
            Models</em> (ICLR 2023).
          </RefItem>
        </Note>

        {/* Step 2 */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            2. One box of slips
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              one problem · {F1.n_chains} chains · {s.distinct_answers} distinct answers
            </span>
          </h2>
          <p className="text-ink-muted">
            {/* Temperature glossed operationally, which is all this page is allowed to
                say: docs/page_7_refactor.md:225-234 keeps the mechanism, tokens and
                probability distributions, off this page and on page 10. */}
            Here is one box. The problem below went to {PAGE7.primary.label} {F1.n_chains} times
            with sampling turned on, which is what <strong className="text-ink">temperature</strong> does:
            at zero every chain comes back identical, and turning it up makes them disagree more.
            Every answer it came back with is tallied. Click a row to read the chains that landed
            there.
          </p>
          <section
            aria-label="One problem, sixteen chains, tallied"
            className="flex flex-col gap-4 rounded-lg border border-grid bg-surface p-4"
          >
            <p className="font-code text-sm leading-relaxed text-ink">{tidyMath(s.question)}</p>
            <p className="font-mono text-xs text-ink-muted">
              {BENCHMARK}, level {s.level} · the answer is {tidyMath(s.ground_truth)} · picked from{" "}
              {F1.n_candidates} problems that qualified
            </p>

            {/* The invitation is the last line of the step's intro, directly above this
                card. It used to be repeated here, near-verbatim. */}
            <Tally onOpen={pick} open={open} />

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
                    ? ", and they got there by different routes"
                    : ""}
                </p>
                {openChains.slice(0, 2).map((c) => (
                  <div key={c.sample_index} className="flex flex-col gap-1">
                    <p className="font-mono text-xs text-ink-muted">
                      chain {c.sample_index} · {tokens(c.own_tokens)} tokens
                      {c.truncated ? " · hit its cap and was made to commit" : ""}
                    </p>
                    <p className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded bg-surface-raised p-2 font-code text-xs leading-relaxed text-ink-muted">
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
        <Note kicker="Read it as">
          <p>
            One slip is one chain. Two chains landing on the same wrong answer usually got there by
            different mistakes, which is why the tail stays a scatter.
          </p>
        </Note>

        {/* Step 3 */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            3. What the vote buys
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              the same {M.items.n} {BENCHMARK} problems, {LEVELS} · {PAGE7.primary.label} · one
              pile, subsampled
            </span>
          </h2>
          <p className="text-ink-muted">
            {/* Named exactly as the chart names them. The intro used to say "The vote /
                In the pile / T = 0" while the chart said something else, so a reader
                scanning for a line called "T = 0" had to supply the equivalence. */}
            Now all {M.items.n} problems, with the box emptied at every size from one slip to{" "}
            {F1.n_chains}. Three lines below.{" "}
            <strong className="text-ink">The vote returns it</strong> is what counting gets: the
            answer most chains agreed on.{" "}
            <strong className="text-ink">At least one chain is right</strong> is how often the right
            answer was written on <em>some</em> slip, whether or not counting picked it, so the gap
            between the two is what the rule throws away.{" "}
            <strong className="text-ink">One greedy chain</strong> is the baseline: at T = 0
            sampling is off, which is <em>greedy decoding</em>, the setting pages 5 and 6 ran, and
            it makes all {F1.n_chains} chains the same chain.
          </p>
          <section
            aria-label="Accuracy against the number of chains"
            className="flex flex-col gap-4 rounded-lg border border-grid bg-surface p-4"
          >
            <PileChart />
            {/* The band was explained three times: here, in the intro, and by its own
                in-chart label. The intro now carries the definition and the chart names
                itself, so this is down to the one fact neither of them has. */}
            <p className="text-xs text-ink-muted">The band widens as you add chains.</p>
            <div className="rounded-lg border-l-4 border-compute bg-surface-raised px-3 py-2 text-ink">
              One chain of chain-of-thought, decoded greedily, solves{" "}
              <strong className="font-mono">{pct(F2.gain.bare_cot)}</strong>. The vote over{" "}
              {F1.n_chains} sampled chains solves{" "}
              <strong className="font-mono">{pct(F2.gain.vote)}</strong>:{" "}
              <strong>+{F2.gain.gain_pts.toFixed(0)} points</strong> ·{" "}
              {pLabel(F2.gain.p)}, exact McNemar over the {F2.gain.fixed + F2.gain.broken} problems
              where the two disagree ({F2.gain.fixed} fixed, {F2.gain.broken} broken).{" "}
              {/* The greedy contrast is the one the page is built on, but part of that
                  +12 is sampling rather than counting, and a reader who stops at this box
                  would credit it all to the vote. The decomposition is in the margin. */}
              <span className="text-ink-muted">
                Sampling alone is worth part of this, and the margin says how much.
              </span>
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
            <p className="text-xs text-ink-muted">
              How many <em>different</em> answers those {F2.diversity[0].n_chains} chains came back
              with, averaged per problem.
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
              accuracy. Disagreement is necessary and not sufficient: past T = {F2.hot.temperature}{" "}
              each chain gets worse faster than the vote recovers it.
            </p>
          </div>
        </section>
        <Note kicker="Try it">
          <p>Open a row in step 2 and read two chains that agreed on a wrong answer.</p>
          <p>
            A second contrast is measured and not drawn: against one <em>sampled</em> chain rather
            than a greedy one the same vote gains {F2.gainVsOneSample.pts.toFixed(0)} points at{" "}
            {pLabel(F2.gainVsOneSample.p)}, which does not resolve. Sampling is already worth
            something on its own.
          </p>
        </Note>

        {/* Step 4 */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            4. And what it costs
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              one budget of {tokens(M.split.budget_total)} tokens, split N ways
            </span>
          </h2>
          <p className="text-ink-muted">
            Sixteen chains cost sixteen times the tokens. So what if you do not have sixteen times
            the budget? The table below takes one fixed budget and divides it, against the same
            number of chains allowed to run as long as they like.
          </p>
          <section
            aria-label="The same budget split N ways"
            className="flex flex-col gap-3 rounded-lg border border-grid bg-surface p-4"
          >
            <table className="w-full text-sm">
              <caption className="pb-2 text-left text-xs text-ink-muted">
                The same number of chains, capped to share {tokens(M.split.budget_total)} tokens
                against allowed to run to their own end. <strong>Cut off</strong> is the share of
                that run&apos;s chains that reached their cap and were made to commit
                mid-thought, a property of the run rather than a score.
              </caption>
              <thead>
                <tr className="text-xs uppercase tracking-wide text-ink-muted">
                  <th className="py-1 text-left font-semibold" rowSpan={2}>
                    chains
                  </th>
                  <th
                    className="border-b border-l border-grid px-2 pb-1 text-center font-semibold text-wrong"
                    colSpan={2}
                  >
                    capped to share {tokens(M.split.budget_total)}
                  </th>
                  <th
                    className="border-b border-l border-grid px-2 pb-1 text-center font-semibold text-compute"
                    colSpan={2}
                  >
                    allowed to finish
                  </th>
                </tr>
                <tr className="border-b border-grid text-xs uppercase tracking-wide text-ink-muted">
                  <th className="border-l border-grid py-1 pl-2 text-right font-semibold">solved</th>
                  <th className="py-1 text-right font-semibold">cut off</th>
                  <th className="border-l border-grid py-1 pl-2 text-right font-semibold">solved</th>
                  <th className="py-1 text-right font-semibold">tokens</th>
                </tr>
              </thead>
              <tbody>
                {F2.split.map((sp) => {
                  const free = F2.hot.points.find((p) => p.n === sp.n);
                  return (
                    <tr key={sp.n} className="border-b border-grid/50">
                      <td className="py-1.5 font-mono tabular-nums text-ink">{sp.n}</td>
                      <td className="border-l border-grid py-1.5 pl-2 text-right font-mono tabular-nums text-wrong">
                        {pct(sp.accuracy)}
                      </td>
                      <td className="py-1.5 text-right font-mono tabular-nums text-ink-muted">
                        {pct(sp.truncated_rate)}
                      </td>
                      <td className="border-l border-grid py-1.5 pl-2 text-right font-mono tabular-nums text-compute">
                        {free ? pct(free.accuracy) : "n/a"}
                      </td>
                      <td className="py-1.5 text-right font-mono tabular-nums text-ink-muted">
                        {free ? tokens(free.mean_tokens) : "n/a"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="text-xs text-ink-muted">
              Read the first row as the control: at one chain the cap almost never binds, only{" "}
              {pct(F2.split[0].truncated_rate)} are cut off, and the two runs are the same run,
              which is why they report the same {pct(F2.split[0].accuracy)}. Everything that
              follows is the cap starting to bite.
            </p>
            <p className="text-ink">
              Dividing a budget adds chains <em>and</em> shortens them, and here the second swamps
              the first: at sixteen chains every one is cut off mid-thought, so the vote is pooling
              fragments.{" "}
              <strong className="text-ink">Splitting is not what fails; capping is.</strong> Read
              the last two columns instead. Let the chains finish and the vote works, at{" "}
              {tokens(pileTokens)} tokens against {tokens(oneChainTokens)} for one, and there is no
              cheaper way to buy it: page 6&apos;s chain stops on its own and will not take more.
            </p>
          </section>
        </section>
        <Note kicker="Read the cut-off column">
          <p>A capped row and a finished row at the same N are not the same experiment.</p>
        </Note>

        {/* Step 5 */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">5. What the vote threw away</h2>
          <div className="flex flex-col gap-3 rounded-lg border border-grid bg-surface p-4">
            <p className="text-lg text-ink">
              On <strong className="font-mono text-2xl text-wrong">{pct(H.thrown_away)}</strong> of
              these problems the model produced the right answer and the vote discarded it.
            </p>
            <p className="text-sm text-ink-muted">
              It was in the pile on {pct(H.coverage)} of problems; the vote returned it on{" "}
              {pct(H.plurality_accuracy)}. Counting can only return the answer that comes up most,
              and on {pct(H.tie_rate)} it could not even break a tie.
            </p>
            {/* Not "keeps the same candidates": page 8 generated its own pool,
                and its own derived.json says so in a field called
                same_candidates. What it did do is re-run this protocol and land
                here, which is the claim that survives the artifact. */}
            <p className="border-l-4 border-compute pl-3 text-base text-ink">
              <strong className="text-ink">The pile knows more than the count.</strong>{" "}
              <em>
                Page 8 re-runs this protocol, lands where this page landed, then changes one rule
                for picking one of the {H.n_chains}: stop counting, start judging.
              </em>
            </p>
          </div>
        </section>
        <Note kicker="Limits">
          <p>
            A tie returns no answer and grades wrong. Two chains count as agreeing when the grader
            says their answers are equivalent, so <span className="font-code">1/2</span> and{" "}
            <span className="font-code">0.5</span> are one bucket.
          </p>
          <p>
            Temperature was chosen by which value voted best on {F2.diversity[0].n_items} items, so
            it is fitted on a subset rather than held out.
          </p>
          <p>
            The page measures whether a chain landed on the right answer, never whether its
            reasoning was sound.
          </p>
        </Note>
      </div>

      <PageNav n={PAGE_N} />
    </article>
  );
}
