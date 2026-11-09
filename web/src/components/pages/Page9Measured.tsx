"use client";

/**
 * Page 9's two measured beats, both drawn from the scored traces in
 * `web/data/page-09-best-of-n.json`.
 *
 *   3. VOTE, VERIFIER, PROCESS. One chain, the vote and the judges, on the same chains.
 *      The ORM bar draws itself once `bars.orm` is filled in.
 *   4. WHERE THE CHAIN BREAKS. How much of a chain follows its first low-scored step,
 *      wrong chains over right ones, so the false alarms stay on the figure.
 *
 * The cards hold only the figure, its dial and its readouts. The prose sits outside.
 */

import { useState } from "react";
import { ChartFrame } from "@/components/ChartFrame";
import { BEST_OF_N, PAGE9, pct } from "@/lib/page09";

/** A bar with rounded data-end corners, sitting square on its baseline. */
function barPath(x: number, y: number, w: number, h: number) {
  const r = Math.min(4, h, w / 2);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

const count = (share: number) => Math.round(share * BEST_OF_N.nProblems);

/* ---------------------------------------------------------- section 3's bars */

const P_W = 480;
const P_H = 240;
const P_M = { top: 22, right: 12, bottom: 36, left: 44 };
const P_IW = P_W - P_M.left - P_M.right;
const P_IH = P_H - P_M.top - P_M.bottom;

function PickAccuracy() {
  const { bars } = BEST_OF_N;
  const rows = [
    { key: "one_chain", label: "One chain", value: bars.one_chain },
    { key: "vote", label: "Vote of 16", value: bars.vote },
    ...(bars.orm === null ? [] : [{ key: "orm", label: "ORM picks of 16", value: bars.orm }]),
    { key: "prm", label: "PRM picks of 16", value: bars.prm },
  ];
  const slot = P_IW / rows.length;

  return (
    <ChartFrame
      title={`How often each judge lands on the right answer: ${rows
        .map((r) => `${r.label} ${pct(r.value)}`)
        .join(", ")}.`}
      width={P_W}
      height={P_H}
      margin={P_M}
      yLabel="problems right"
    >
      {[0, 25, 50, 75, 100].map((tick) => (
        <g key={tick}>
          <line x1={0} x2={P_IW} y1={P_IH * (1 - tick / 100)} y2={P_IH * (1 - tick / 100)} className="stroke-grid" />
          <text x={-6} y={P_IH * (1 - tick / 100) + 4} textAnchor="end" className="fill-ink-muted text-[11px]">
            {tick}%
          </text>
        </g>
      ))}
      {rows.map((r, i) => {
        const h = r.value * P_IH;
        const w = slot * 0.56;
        const x = i * slot + (slot - w) / 2;
        return (
          <g key={r.key}>
            <path
              d={barPath(x, P_IH - h, w, h)}
              data-h={h}
              className={r.key === "prm" ? "fill-compute" : "fill-ink opacity-30"}
            />
            <text x={x + w / 2} y={P_IH - h - 6} textAnchor="middle" className="fill-ink text-xs font-semibold">
              {pct(r.value)}
            </text>
            <text x={x + w / 2} y={P_IH + 18} textAnchor="middle" className="fill-ink-muted text-[11px]">
              {r.label}
            </text>
          </g>
        );
      })}
    </ChartFrame>
  );
}

export function DoesItPickBetter() {
  const { bars, disagreements: d, rules, temperature, nProblems, prmName, leadByTemperature } = BEST_OF_N;
  const lead = leadByTemperature.map(count);

  return (
    <section className="flex min-w-0 flex-col gap-3">
      <h2 className="text-xl font-semibold text-ink">
        3. Vote, verifier, process
        <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
          measured · {nProblems} problems
        </span>
      </h2>
      <p className="text-ink-muted">
        Each judge gets the same 16 solutions to each problem and keeps one. {prmName} keeps the
        solution with the strongest weakest step. One chain is greedy; the 16 are sampled at
        temperature {temperature.toFixed(1)}, where the vote does best.
      </p>

      <figure className="m-0 rounded-lg border border-grid bg-surface p-4">
        <PickAccuracy />
      </figure>

      <p className="text-ink-muted">
        The PRM solves <strong className="text-ink">{count(bars.prm)}</strong> of {nProblems}{" "}
        problems{bars.orm === null ? " and" : `, the ORM solves ${count(bars.orm)} and`} the vote
        solves {count(bars.vote)}. A vote can only pick the most common
        answer, while the PRM can pick a less common one if its steps score higher. The PRM solves{" "}
        {d.prm_only} problems the vote misses, and the vote solves{" "}
        {d.vote_only === 0 ? "none" : d.vote_only} that the PRM misses. Of those {d.prm_only},{" "}
        {d.prm_only_on_a_tied_vote} are tied votes, which count as wrong. The PRM leads by{" "}
        {Math.min(...lead)} to {Math.max(...lead)} problems at every sampled temperature. Scoring by
        the last step solves {count(rules.last_step)}, and by the product of steps{" "}
        {count(rules.product_of_steps)}.
      </p>
    </section>
  );
}

/* --------------------------------------------------------- section 4's figure */

const B_W = 560;
const B_H = 300;
const B_M = { top: 12, right: 24, bottom: 42, left: 44 };
const B_IW = B_W - B_M.left - B_M.right;
const B_IH = B_H - B_M.top - B_M.bottom;
const BAND_GAP = 14;
const BAND_H = (B_IH - BAND_GAP) / 2;
const SLOT = B_IW / 11.7; // the "no low step" bar, a gap of 0.7, then ten bins
const BINS_X = SLOT * 1.7;

const GROUPS = [
  { key: "wrong", label: "Wrong or no answer", fill: "fill-wrong" },
  { key: "right", label: "Right answer", fill: "fill-correct" },
] as const;

// One scale for every cut, so moving the dial moves the bars and not the axis.
const MAX_SHARE = Math.max(
  ...Object.values(BEST_OF_N.breaks.byCut).flatMap((groups) =>
    GROUPS.flatMap(({ key }) => {
      const g = groups[key];
      return [g.no_low_step, ...g.bins].map((n) => n / g.chains);
    }),
  ),
);

function FirstLowStep({ cut }: { cut: string }) {
  const groups = BEST_OF_N.breaks.byCut[cut];
  return (
    <ChartFrame
      title={`At a cut of ${cut}, a low step appears in ${pct(groups.wrong.share_with_low_step)} of chains with a wrong or no answer and ${pct(groups.right.share_with_low_step)} of chains with a right answer.`}
      width={B_W}
      height={B_H}
      margin={B_M}
      xLabel="share of the chain written after its first low step"
      yLabel="share of chains"
    >
      {GROUPS.map(({ key, label, fill }, band) => {
        const g = groups[key];
        const top = band * (BAND_H + BAND_GAP);
        const base = top + BAND_H;
        const barH = (n: number) => (n / g.chains / MAX_SHARE) * (BAND_H - 14);
        const noLow = barH(g.no_low_step);
        return (
          <g key={key} data-group={key}>
            {[0, 0.5].map((tick) => {
              const y = base - (tick / MAX_SHARE) * (BAND_H - 14);
              return (
                <g key={tick}>
                  <line x1={0} x2={B_IW} y1={y} y2={y} className="stroke-grid" />
                  <text x={-6} y={y + 4} textAnchor="end" className="fill-ink-muted text-[11px]">
                    {tick * 100}%
                  </text>
                </g>
              );
            })}
            <text x={B_IW - 6} y={top + 14} textAnchor="end" className="fill-ink text-xs font-semibold">
              {label}, {g.chains.toLocaleString()} chains
            </text>

            <path
              d={barPath(1, base - noLow, SLOT - 2, noLow)}
              data-h={noLow}
              data-bar="no-low"
              className="fill-ink opacity-30"
            />
            <text x={SLOT / 2} y={base - noLow - 4} textAnchor="middle" className="fill-ink text-[11px]">
              {pct(g.no_low_step / g.chains)}
            </text>
            <rect x={0} y={top} width={SLOT} height={BAND_H} fill="transparent">
              <title>{`${label}: ${g.no_low_step} chains with no low step`}</title>
            </rect>

            {g.bins.map((n, i) => {
              const h = barH(n);
              const x = BINS_X + i * SLOT;
              return (
                <g key={i}>
                  <path d={barPath(x + 1, base - h, SLOT - 2, h)} data-h={h} data-bar="bin" className={fill} />
                  <rect x={x} y={top} width={SLOT} height={BAND_H} fill="transparent">
                    <title>{`${label}: ${n} chains with ${i * 10} to ${(i + 1) * 10}% of the chain after it`}</title>
                  </rect>
                </g>
              );
            })}
          </g>
        );
      })}
      <text x={SLOT / 2} y={B_IH + 14} textAnchor="middle" className="fill-ink-muted text-[11px]">
        no low step
      </text>
      {[0, 20, 40, 60, 80, 100].map((tick) => (
        <text
          key={tick}
          x={BINS_X + (tick / 10) * SLOT}
          y={B_IH + 14}
          textAnchor="middle"
          className="fill-ink-muted text-[11px]"
        >
          {tick}%
        </text>
      ))}
    </ChartFrame>
  );
}

export function WhereTheChainBreaks() {
  const { byCut, mainCut } = BEST_OF_N.breaks;
  const [cut, setCut] = useState<string>(mainCut);
  const main = byCut[mainCut];
  const total = main.wrong.chains + main.right.chains;
  const provenFalse = (s: typeof PAGE9.lucky) => s.steps[s.firstFalse ?? 0].prm!.toFixed(2);

  return (
    <section className="flex min-w-0 flex-col gap-3">
      <h2 className="text-xl font-semibold text-ink">
        4. Where the chain breaks
        <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
          measured · {total.toLocaleString()} chains
        </span>
      </h2>
      <p className="text-ink-muted">
        For each chain, we find the first step the PRM scores below the threshold, and measure how
        much of the chain comes after it.
      </p>

      <figure className="m-0 flex flex-col gap-3 rounded-lg border border-grid bg-surface p-4">
        <div role="radiogroup" aria-label="Low step cut" className="flex flex-wrap items-center gap-1.5 text-sm">
          <span className="text-ink-muted">A low step scores below</span>
          {Object.keys(byCut).map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={c === cut}
              onClick={() => setCut(c)}
              className={`rounded border px-1.5 py-0.5 text-xs tabular-nums ${
                c === cut ? "border-compute bg-compute font-semibold text-ink" : "border-grid text-ink-muted hover:text-ink"
              }`}
            >
              {Number(c).toFixed(2)}
            </button>
          ))}
        </div>
        <FirstLowStep cut={cut} />
        <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2" aria-live="polite">
          {GROUPS.map(({ key, label }) => (
            <div key={key}>
              <dt className="font-semibold text-ink">{label}</dt>
              <dd className="text-ink-muted">
                <span className="font-mono tabular-nums text-ink">{pct(byCut[cut][key].share_with_low_step)}</span> have
                a low step,{" "}
                <span className="font-mono tabular-nums text-ink">{pct(byCut[cut][key].tokens_after)}</span> of tokens
                come after it
              </dd>
            </div>
          ))}
        </dl>
      </figure>

      <p className="text-ink-muted">
        At a score threshold of {Number(mainCut).toFixed(2)},{" "}
        <strong className="text-ink">{pct(main.wrong.share_with_low_step)}</strong> of wrong chains
        have a step below it, and <strong className="text-ink">{pct(main.wrong.tokens_after)}</strong>{" "}
        of their tokens come after that step. Among right chains,{" "}
        {pct(main.right.share_with_low_step)} have a step below it too, so a low score does not
        always mean a wrong chain.
      </p>
      <p className="text-ink-muted">
        Take two steps that arithmetic proves false, one in a wrong chain and one in a right chain.
        The PRM scores them {provenFalse(PAGE9.broken)} and {provenFalse(PAGE9.lucky)}, both above
        the threshold, so it misses errors too.
      </p>
      <p className="text-ink-muted">
        We know that a wrong step leads to a wrong solution, and a judge only catches it after the
        chain has been generated and the problem is considered finished. But what if the model could
        check its own reasoning at answer time?
      </p>
    </section>
  );
}
