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
import { NotebookDownload } from "@/components/NotebookDownload";
import { Slider } from "@/components/Slider";
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

/* The pile's temperature is the best the sweep found, but it is not the only one:
   the run votes to the same accuracy at more than one setting. Both places that
   talk about the sweep have to say so, so the tie is read out of the data here
   rather than named in prose. */
const BEST_VOTE = Math.max(...F2.diversity.map((d) => d.plurality_accuracy));
const TIED_WITH_HOT = [...F2.diversity]
  .sort((a, b) => a.temperature - b.temperature)
  .filter(
    (d) =>
      Math.abs(d.plurality_accuracy - BEST_VOTE) < 1e-9 && d.temperature !== F2.hot.temperature,
  )
  .map((d) => `T = ${d.temperature}`)
  .join(" and ");

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
/**
 * The reader sets N.
 *
 * This is the one page in the act whose subject is what happens as you add
 * voters, and until now the three charts were static: a reader who wanted to
 * know whether the vote still beats one chain at N = 4 had to read it off a
 * line. The axis was always measured. `manifest.pile.n_axis` is [1, 2, 4, 8,
 * 16] and every point is the mean over 64 random N-subsets of the same pile
 * (`axis_rule`), so moving the handle re-reads the run rather than modelling
 * anything.
 *
 * The handle steps in index, not in N: the axis is log-spaced and the reader
 * should get one measured point per step, never an interpolated one.
 */
function PileChart({ at }: { at: number }) {
  const pts = F2.hot.points;
  const ns = pts.map((p) => p.n);
  const sel = pts[at];
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
      title={`Share of ${M.items.n} ${BENCHMARK} problems, ${LEVELS}, solved by ${PAGE7.primary.label} against the number of chains the vote sees. One greedy chain solves ${pct(cold)} and stays there however many copies are made of it. The vote returns the answer on ${pct(last.accuracy)} over sixteen sampled chains. At least one chain was right on ${pct(last.coverage)}, so ${pct(last.coverage - last.accuracy)} of problems had the right answer generated and discarded by the vote.`}
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
        <tspan x={IW + 6} dy="0">the vote returns</tspan>
        <tspan x={IW + 6} dy="11">the answer</tspan>
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

      {/* The reader's position on the axis. Drawn last so it sits above the band
          and both lines, and drawn as a rule plus two rings rather than a
          highlight, so it reads as "here" and not as a sixth quantity. */}
      <line
        x1={x(sel.n)}
        x2={x(sel.n)}
        y1={0}
        y2={IH}
        className="stroke-ink"
        strokeWidth={1}
        strokeDasharray="3 3"
        data-testid="voters-marker"
      />
      <circle cx={x(sel.n)} cy={y(sel.coverage * 100)} r={5} className="fill-none stroke-wrong" strokeWidth={2} />
      <circle cx={x(sel.n)} cy={y(sel.accuracy * 100)} r={5} className="fill-none stroke-compute" strokeWidth={2} />
      <text
        x={x(sel.n)}
        y={-8}
        textAnchor="middle"
        className="fill-ink text-[10px] font-semibold"
      >
        {sel.n === 1 ? "1 chain" : `${sel.n} chains`}
      </text>
    </ChartFrame>
  );
}

/* ------------------------------------------------------------------ figure 3 */

const FW = 620;
const FHGT = 320;
const FMARGIN = { top: 30, right: 116, bottom: 84, left: 46 };
const FIW = FW - FMARGIN.left - FMARGIN.right;
const FIH = FHGT - FMARGIN.top - FMARGIN.bottom;

/**
 * Step 4 as a fork rather than a table.
 *
 * What this replaces was a five-column table under a two-decker header: capped
 * solved, capped cut off, free solved, free tokens, all at three values of N.
 * The finding lives in the difference between two of those columns, and a
 * reader had to hold two numbers per row in their head and subtract. It also
 * hid the one fact that makes the panel an argument rather than two
 * experiments: at N = 1 the two runs ARE the same run, so the two series start
 * from a single point.
 *
 * So: one shared origin and two lines leaving it in opposite directions. The
 * gap between them at N = 16 is the whole claim, and it is a distance rather
 * than a subtraction. Underneath, on the same x positions, the share of chains
 * that hit the cap before finishing, because that is the CAUSE of the lower
 * line and the figure should not make the reader take it on trust: the fall
 * tracks the fill, 1% to 55% to 100%.
 *
 * The cost sits in the right-hand labels, since the step's title is a question
 * about cost and the answer is that finishing is dear and there is no cheaper
 * version of it.
 */
function ForkChart() {
  const capped = F2.split;
  const ns = capped.map((sp) => sp.n);
  const top = Math.max(...ns);
  const x = (n: number) => (Math.log2(n) / Math.log2(top)) * FIW;
  const y = (v: number) => FIH - (v / 100) * FIH;
  const free = (n: number) => F2.hot.points.find((p) => p.n === n);

  const path = (get: (n: number) => number | undefined) =>
    capped
      .map((sp, i) => {
        const v = get(sp.n);
        return v === undefined ? "" : `${i ? "L" : "M"}${x(sp.n)},${y(v * 100)}`;
      })
      .join(" ");

  const lastN = ns[ns.length - 1];
  const lastFree = free(lastN);
  const lastCapped = capped[capped.length - 1];
  const firstFree = free(ns[0]);

  // The cut-off gauge: a fixed track filled by the share that hit the cap.
  const TRACK = 58;
  const GAUGE_Y = FIH + 24;
  const GAUGE_H = 11;

  return (
    <ChartFrame
      title={`The same budget of ${tokens(M.split.budget_total)} tokens split N ways, against the same number of chains allowed to run to their own end. At one chain the cap almost never binds and the two are the same run, both solving ${pct(capped[0].accuracy)}. Splitting the fixed budget ${lastN} ways drops it to ${pct(lastCapped.accuracy)}, with ${pct(lastCapped.truncated_rate)} of chains cut off before they finish. The same ${lastN} chains allowed to finish solve ${pct(lastFree?.accuracy ?? 0)} for ${tokens(lastFree?.mean_tokens ?? 0)} tokens.`}
      width={FW}
      height={FHGT}
      margin={FMARGIN}
      xLabel="chains"
      yLabel="solved (%)"
    >
      {[0, 25, 50, 75, 100].map((t) => (
        <g key={t}>
          <line x1={0} x2={FIW} y1={y(t)} y2={y(t)} className="stroke-grid" strokeWidth={1} />
          <text x={-8} y={y(t) + 4} textAnchor="end" className="fill-ink-muted text-[10px]">
            {t}
          </text>
        </g>
      ))}

      {/* The fork itself, shaded, so the claim is an area and not an inference */}
      <path
        d={`${path((n) => free(n)?.accuracy)} ${[...capped]
          .reverse()
          .map((sp) => `L${x(sp.n)},${y(sp.accuracy * 100)}`)
          .join(" ")} Z`}
        className="fill-wrong opacity-[0.07]"
      />

      <path d={path((n) => free(n)?.accuracy)} fill="none" className="stroke-compute" strokeWidth={2.4} />
      <path d={path((n) => capped.find((sp) => sp.n === n)?.accuracy)} fill="none" className="stroke-wrong" strokeWidth={2.4} />

      {capped.map((sp) => {
        const f = free(sp.n);
        return (
          <g key={sp.n}>
            {f ? <circle cx={x(sp.n)} cy={y(f.accuracy * 100)} r={3.4} className="fill-compute" /> : null}
            <circle cx={x(sp.n)} cy={y(sp.accuracy * 100)} r={3.4} className="fill-wrong" />
          </g>
        );
      })}

      {/* The shared origin is the control and the reason this is one experiment */}
      {firstFree ? (
        <text x={6} y={y(firstFree.accuracy * 100) - 18} className="fill-ink-muted text-[10px]">
          at one chain the cap never binds: both lines are the same run
        </text>
      ) : null}

      <text x={FIW + 8} y={y((lastFree?.accuracy ?? 0) * 100) - 3} className="fill-compute text-[10px] font-semibold">
        <tspan x={FIW + 8} dy="0">allowed to finish</tspan>
        <tspan x={FIW + 8} dy="11" className="fill-ink-muted font-normal">
          {tokens(lastFree?.mean_tokens ?? 0)} tokens
        </tspan>
      </text>
      <text x={FIW + 8} y={y(lastCapped.accuracy * 100) + 3} className="fill-wrong text-[10px] font-semibold">
        <tspan x={FIW + 8} dy="0">capped to share</tspan>
        <tspan x={FIW + 8} dy="11" className="fill-ink-muted font-normal">
          {tokens(M.split.budget_total)} tokens
        </tspan>
      </text>

      {/* x ticks sit above the gauge so each count labels both at once */}
      {capped.map((sp) => (
        <text key={sp.n} x={x(sp.n)} y={FIH + 15} textAnchor="middle" className="fill-ink-muted text-[10px] tabular-nums">
          {sp.n}
        </text>
      ))}

      {/* the cause of the lower line, on the same x positions as the effect */}
      <text x={-8} y={GAUGE_Y + GAUGE_H - 1} textAnchor="end" className="fill-ink-muted text-[9px]">
        cut off
      </text>
      {capped.map((sp) => (
        <g key={`gauge-${sp.n}`}>
          <rect
            x={x(sp.n) - TRACK / 2}
            y={GAUGE_Y}
            width={TRACK}
            height={GAUGE_H}
            rx={2}
            className="fill-surface-raised stroke-grid"
            strokeWidth={1}
          />
          <rect
            x={x(sp.n) - TRACK / 2}
            y={GAUGE_Y}
            width={TRACK * sp.truncated_rate}
            height={GAUGE_H}
            rx={2}
            className="fill-wrong opacity-70"
          />
          <text
            x={x(sp.n)}
            y={GAUGE_Y + GAUGE_H + 12}
            textAnchor="middle"
            className="fill-ink-muted text-[10px] tabular-nums"
          >
            {pct(sp.truncated_rate)}
          </text>
        </g>
      ))}
    </ChartFrame>
  );
}

/* -------------------------------------------------------------------- page */

export function Page7() {
  const page = getPage(PAGE_N)!;
  const recordInteraction = useStore((s) => s.recordInteraction);
  const [open, setOpen] = useState<string | null>(null);
  // Index into the measured N axis, not N itself. Opens at the top of the axis,
  // so the reader's first sight of the chart is the finished result the prose
  // above it quotes, and adding a voter is something they take away rather than
  // something they build up to.
  const [voterIx, setVoterIx] = useState(F2.hot.points.length - 1);
  const voters = F2.hot.points[voterIx];
  const oneChain = F2.hot.points[0];

  const s = F1.specimen;
  const openChains = open ? chainsFor(s, open) : [];
  const openRow = open ? s.ranked.find((r) => r.answer === open) : null;
  const last = F2.hot.points[F2.hot.points.length - 1];
  // What one chain spends against what the pile spends. The gap between them is what
  // "just give one chain more" would have to beat, and page 6 measured that arm: the
  // chain does carry on when it is pushed, it just does not score any better for it.
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
        <NotebookDownload href={NOTEBOOK_ZIP} size={NOTEBOOK_SIZE} />
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
            with sampling turned on, which is what <strong className="text-ink">temperature</strong>{" "}
            does. Temperature is a dial, written <span className="font-mono text-ink">T</span> on
            every chart on this page: at zero every chain comes back identical, and turning it up
            makes them disagree more.
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
            That was one problem. Now all {M.items.n} of them, with the box holding{" "}
            {F2.hot.points
              .map((p) => p.n)
              .slice(0, -1)
              .join(", ")}{" "}
            and finally {F2.hot.points[F2.hot.points.length - 1].n} slips. The chart below draws
            three lines, and each one answers a different question.
          </p>
          {/* Named exactly as the chart names them. The intro used to say "The vote /
              In the pile / T = 0" while the chart said something else, so a reader
              scanning for a line called "T = 0" had to supply the equivalence. */}
          <p className="text-ink-muted">
            <strong className="text-ink">The vote returns the answer</strong> is what counting
            actually gets you: the answer the most chains agreed on.{" "}
            <strong className="text-ink">At least one chain is right</strong> is the easier
            question. Did the right answer turn up on any slip in the box, whether or not counting
            picked it? The gap between those two lines is the right answer being written down and
            then thrown away. <strong className="text-ink">One greedy chain</strong> is the baseline
            to beat: at T = 0, with the temperature dial turned all the way down, sampling is off,
            which is <em>pure chain-of-thought</em>, also known as <em>greedy decoding</em>. That is
            what pages 5 and 6 ran, and it makes all {F1.n_chains} chains the same chain.
          </p>
          <section
            aria-label="Accuracy against the number of chains"
            className="flex flex-col gap-4 rounded-lg border border-grid bg-surface p-4"
          >
            <PileChart at={voterIx} />
            {/* The act's one page about adding voters, with a control that adds
                one. Every value below is a measured point on the run's own N
                axis; the handle steps between them and never lands off one. */}
            <div className="flex flex-col gap-2">
              <Slider
                label="chains the vote may see"
                min={0}
                max={F2.hot.points.length - 1}
                step={1}
                value={voterIx}
                ticks={F2.hot.points.map((_, i) => i)}
                format={(i) => `${F2.hot.points[i].n}`}
                onChange={(i) => {
                  recordInteraction(PAGE_N);
                  setVoterIx(i);
                }}
              />
              <p aria-live="polite" className="text-sm text-ink">
                On {voters.n === 1 ? "one chain" : `${voters.n} chains`}, the vote returns the
                answer on <strong className="font-mono">{pct(voters.accuracy)}</strong>{" "}
                {voters.n === 1 ? (
                  <>
                    of problems, which is where the count starts. One sampled chain is not a vote
                    yet.
                  </>
                ) : voters.accuracy > oneChain.accuracy ? (
                  <>
                    of problems, <strong>{pct(voters.accuracy - oneChain.accuracy)} above</strong>{" "}
                    one sampled chain.
                  </>
                ) : (
                  <>
                    of problems, <strong>{pct(oneChain.accuracy - voters.accuracy)} below</strong>{" "}
                    one sampled chain: the tie rule is still costing more than the count is
                    buying.
                  </>
                )}{" "}
                <span className="text-ink-muted">
                  The right answer was somewhere in the box on {pct(voters.coverage)}, so{" "}
                  {pct(voters.coverage - voters.accuracy)} of problems had it written down and
                  thrown away. {pct(voters.tie_rate)} of these votes tie. The bill is{" "}
                  {tokens(voters.mean_tokens)} tokens a problem.
                </span>
              </p>
            </div>
            {/* The band was explained three times: here, in the intro, and by its own
                in-chart label. The intro now carries the definition and the chart names
                itself, so this is down to the one fact neither of them has. */}
            <p className="text-xs text-ink-muted">The band widens as you add chains.</p>
            <div className="rounded-lg border-l-4 border-compute bg-surface-raised px-3 py-2 text-ink">
              One chain of chain-of-thought, decoded greedily, solves{" "}
              <strong className="font-mono">{pct(F2.gain.bare_cot)}</strong>. The vote over{" "}
              {F1.n_chains} sampled chains solves{" "}
              <strong className="font-mono">{pct(F2.gain.vote)}</strong>:{" "}
              <strong>+{F2.gain.gain_pts.toFixed(0)} points</strong>.{" "}
              {/* "exact McNemar" was the whole justification, and it is a name most
                  readers do not have. The test is simple enough to just describe: throw
                  away the problems both methods score the same, then ask whether the
                  ones left over split evenly. The name stays, in the position of a
                  citation rather than an argument. */}
              <span className="text-ink-muted">
                The two methods score the same on most of these problems, so the test looks only at
                the {F2.gain.fixed + F2.gain.broken} where they differ: the vote wins{" "}
                {F2.gain.fixed} of those and loses {F2.gain.broken}. A split that lopsided is
                unlikely to be luck ({pLabel(F2.gain.p)}, exact McNemar). Part of the gain is
                sampling rather than counting, and the margin says how much.
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
              accuracy. Disagreement is necessary and not sufficient: the vote comes out the same
              at T = {F2.hot.temperature} and {TIED_WITH_HOT}, and past that each chain gets worse
              faster than the vote recovers it.
            </p>
          </div>
        </section>
        {/* The honesty guard on the +12, down to the one measurement the chart cannot
            show. The callout beside the chart already names the greedy baseline and
            says part of the gain is sampling, so repeating either here was three
            sentences of throat-clearing in front of the number that matters. */}
        <Note kicker="How much of that is the counting">
          <p>
            Read the +{F2.gain.gain_pts.toFixed(0)} as sampling plus counting. Against one{" "}
            <em>sampled</em> chain rather than a greedy one, the vote gains{" "}
            {F2.gainVsOneSample.pts.toFixed(0)} points, which this run cannot tell from chance ({pLabel(F2.gainVsOneSample.p)}).
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
            the budget? Below, one fixed budget of {tokens(M.split.budget_total)} tokens is divided
            between the chains, and the same chains are run again with no budget at all. The two
            lines start as one run and end a long way apart.
          </p>
          <section
            aria-label="The same budget split N ways"
            className="flex flex-col gap-3 rounded-lg border border-grid bg-surface p-4"
          >
            <ForkChart />
            <p className="text-xs text-ink-muted">
              The gauge under each count is the share of that run&apos;s chains that hit the cap and
              were made to commit mid-thought, which is a property of the run rather than a score.
            </p>
            <p className="text-ink">
              Dividing a budget does two things at once. One, it adds chains, and two, it shortens
              every one of them. The shortening is the one that lands. At{" "}
              {F2.split[F2.split.length - 1].n} chains the budget leaves each with only{" "}
              {tokens(Math.round(M.split.budget_total / F2.split[F2.split.length - 1].n))} tokens.
              Every chain hits that ceiling before finishing, and the vote is counting fragments of
              arguments rather than arguments.{" "}
              <strong className="text-ink">Splitting is not what fails, capping is.</strong> Let the
              same chains run to their own end and the vote indeed works, at {tokens(pileTokens)}{" "}
              tokens for {last.n} chains vs {tokens(oneChainTokens)} for one. There are two ways of
              spending here, divide one budget, or let every chain finish. The second one is the
              winner.
            </p>
          </section>
        </section>
        <Note kicker="Read it as">
          <p>
            Two lines, not two experiments. At every point on the x axis the model gets the same
            number of chains, and the only thing that changes between the lines is whether it is
            allowed to finish them.
          </p>
        </Note>

        {/* Step 5. Page 12's closing shape: prose at full width in the reading
            column, no card and no display number, and the limits brought in from
            the margin. They were three caveats in 9px grey beside the one claim
            they qualify, which is the wrong place for the honest half of a page. */}
        <section className="flex min-w-0 flex-col gap-3 lg:col-start-1">
          <h2 className="text-xl font-semibold text-ink">5. What the vote threw away</h2>
          <p className="text-ink">
            <strong className="text-ink">The pile knows more than the count.</strong> The right
            answer was somewhere in the {H.n_chains} chains on{" "}
            <strong className="text-ink">{pct(H.coverage)}</strong> of these problems. The vote
            returned it on <strong className="text-ink">{pct(H.plurality_accuracy)}</strong>. For
            the <strong className="text-ink">{pct(H.thrown_away)}</strong> in between, the model
            produced the right answer and the vote discarded it. This is because counting can only
            ever return the answer that comes up most, and on {pct(H.tie_rate)} of problems it could
            not even break a tie!
          </p>

          {/* Not "keeps the same candidates": page 8 generated its own pool, and
              its own derived.json says so in a field called same_candidates. What
              it did do is re-run this protocol and land here, which is the claim
              that survives the artifact. */}
          <div className="rounded-lg border-l-4 border-compute bg-surface p-4 text-ink">
            The counting rule is the weakest part of the method: it picks by popularity, and the
            popular answer is not always the right one when the right one is already sitting in the
            box. It also only ever looks at the answer, never at the reasoning that reached it, so a
            chain can agree with the majority for bad reasons and be counted anyway.{" "}
            <em>
              Page 8 re-runs this protocol, lands where this page landed, then changes one rule for
              picking one of the {H.n_chains}: stop counting, start judging.
            </em>
          </div>
        </section>
      </div>

      <PageNav n={PAGE_N} />
    </article>
  );
}
