"use client";

/**
 * PROTOTYPES, not page copy. Three candidate animations for page 13 section 1's
 * generate, reward, reinforce loop, mounted together at the bottom of Page13
 * for review (2026-11-04). The whole experiment lives in this file plus one
 * marked block in Page13.tsx:
 *   - drop all three: delete this file and the PROTOTYPES block in Page13.tsx
 *   - keep one: move that component into Page13.tsx's section 1, delete the rest
 *
 *   A. FanLoop            one model, a fan of eight chains, every chain scored,
 *                         every chain folded back as a push; the model's ring
 *                         gets greener each lap
 *   B. HillLoop           the model as one curve over ways of answering; samples
 *                         drop, get scored, and the curve's mass slides toward
 *                         the right region
 *   C. FanLoop grow       A with chains that lengthen each lap (thinking longer)
 *   D. LoopSlides         slide-style, four beats a reader clicks through, on a
 *                         MEASURED group: page 7's 16 chains for the gcd/lcm
 *                         problem (Qwen2.5-3B, T 0.3), where 1 chain is right
 *                         and the vote picks 40. Pushes are computed from those
 *                         rewards, not authored.
 *   E. LoopStepped (Page13LoopStepped.tsx): A's fan on measured groups, stepped.
 *
 * Every number here is authored for illustration (lap counts, ring shares,
 * curve weights). C's ~1k and ~9k token endpoints are R1-Zero's reported
 * response lengths; the laps between are drawn, not measured.
 *
 * Time is driven by one rAF clock per figure, paused while the figure is off
 * screen. Under prefers-reduced-motion each figure shows one fixed frame.
 */

import { useEffect, useRef, useState } from "react";
import { PAGE7, tidyMath } from "@/lib/page07";
import { E_PROBLEMS, LoopStepped } from "./Page13LoopStepped";

/* ---------------------------------------------------------------------------
 * Shared
 * ------------------------------------------------------------------------- */

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => {
  const c = clamp01(t);
  return c < 0.5 ? 2 * c * c : 1 - (-2 * c + 2) ** 2 / 2;
};
/** Progress of `t` through the window [a, b), eased, clamped. */
const span = (t: number, a: number, b: number) => ease((t - a) / (b - a));

/**
 * Elapsed ms, modulo `total`, ticking only while the figure is on screen.
 * Under reduced motion it returns `still` and never ticks.
 */
function useLoopClock(total: number, still: number) {
  const ref = useRef<SVGSVGElement | null>(null);
  const [t, setT] = useState(still);
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let last = 0;
    let acc = 0;
    let visible = true;
    const tick = (now: number) => {
      if (last && visible) acc = (acc + (now - last)) % total;
      last = now;
      if (visible) setT(acc);
      raf = requestAnimationFrame(tick);
    };
    let io: IntersectionObserver | undefined;
    if (ref.current && typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
      });
      io.observe(ref.current);
    }
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      io?.disconnect();
    };
  }, [total]);
  return { ref, t };
}

/** A stage label above the figure, lit while its phase runs. */
function StageLabel({
  x,
  y,
  text,
  hot,
}: {
  x: number;
  y: number;
  text: string;
  hot: boolean;
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      className={
        hot
          ? "fill-compute-ink text-[12px] font-eyebrow font-semibold uppercase tracking-wide"
          : "fill-ink-muted text-[12px] font-eyebrow uppercase tracking-wide"
      }
    >
      {text}
    </text>
  );
}

/* ---------------------------------------------------------------------------
 * A and C: the fan
 * ------------------------------------------------------------------------- */

const G = 8;
/** Which of the eight chains come back right, lap by lap: 1, 3, 5, 7 of 8. */
const FAN_RIGHT: number[][] = [
  [2],
  [0, 2, 5],
  [0, 2, 3, 5, 6],
  [0, 1, 2, 3, 5, 6, 7],
];
/** The model's chance of a right chain before each lap, and after the last. */
const FAN_P = [1 / 8, 3 / 8, 5 / 8, 7 / 8, 0.95];
/** C only: answer length per lap. Endpoints are R1-Zero's; the middle is drawn. */
const FAN_TOKENS = ["~1k", "~3.5k", "~6k", "~9k"];

/* phase windows within one lap (ms) */
const F = {
  fan: [0, 1100],
  reward: [1100, 1700],
  sort: [1700, 2600],
  ret: [3100, 4000],
  ring: [4000, 4700],
  lap: 5100,
} as const;

const MODEL: [number, number] = [70, 160];
const RING_R = 30;
const PANEL = { x0: 470, x1: 630, y1: 92, y0: 222 };
const laneY = (r: number) => lerp(PANEL.y0, PANEL.y1, r);

function FanLoop({ grow = false }: { grow?: boolean }) {
  const total = F.lap * FAN_RIGHT.length;
  const { ref, t } = useLoopClock(total, F.lap + 2900);
  const lap = Math.floor(t / F.lap);
  const lt = t - lap * F.lap;
  const right = new Set(FAN_RIGHT[lap]);
  const k = right.size;
  const mean = k / G;

  const fanP = span(lt, ...F.fan);
  const rewardP = span(lt, ...F.reward);
  const sortP = span(lt, ...F.sort);
  const retP = span(lt, ...F.ret);
  const ringP = span(lt, ...F.ring);
  const fade = 1 - span(lt, F.ret[0], F.ret[0] + 400);

  const endX = grow ? lerp(200, 420, lap / (FAN_RIGHT.length - 1)) : 330;
  const startX = MODEL[0] + RING_R + 6;
  const ends = Array.from(
    { length: G },
    (_, i) => [endX, 46 + (i * 228) / (G - 1)] as [number, number],
  );
  const colX = (i: number) =>
    PANEL.x0 + ((i + 0.5) * (PANEL.x1 - PANEL.x0)) / G;

  const p = lerp(FAN_P[lap], FAN_P[lap + 1], ringP);
  const circ = 2 * Math.PI * RING_R;

  /* the return wire: from under the panel, round the bottom, into the model */
  const RET = {
    p0: [550, 246],
    p1: [520, 296],
    p2: [80, 296],
    p3: [MODEL[0], MODEL[1] + RING_R + 8],
  } as const;
  const retAt = (s: number): [number, number] => {
    const u = 1 - s;
    const a = u * u * u,
      b = 3 * u * u * s,
      c = 3 * u * s * s,
      d = s * s * s;
    return [
      a * RET.p0[0] + b * RET.p1[0] + c * RET.p2[0] + d * RET.p3[0],
      a * RET.p0[1] + b * RET.p1[1] + c * RET.p2[1] + d * RET.p3[1],
    ];
  };
  const retD = `M${RET.p0[0]} ${RET.p0[1]} C ${RET.p1[0]} ${RET.p1[1]} ${RET.p2[0]} ${RET.p2[1]} ${RET.p3[0]} ${RET.p3[1]}`;
  const inRet = lt >= F.ret[0] && lt < F.ret[1];
  const [px, py] = retAt(retP);

  const phase =
    lt < F.fan[1]
      ? "generate"
      : lt < F.reward[1]
        ? "reward"
        : lt < F.ret[0]
          ? "group"
          : "reinforce";

  const label = `${grow ? "Prototype C" : "Prototype A"}: the reinforcement learning loop as a fan. The model, drawn as a ring whose green share is its chance of writing a right chain, sends out eight chains for one problem${
    grow ? ", and the chains grow longer every lap" : ""
  }. Each chain ends in a reward, 1 or 0. Every chain, right or wrong, then moves into a group panel where a dashed line marks the group mean; right chains push up from the mean, wrong chains push down. The pushes flow back into the model and its green share grows. Lap ${lap + 1} of 4: ${k} of 8 right.`;

  return (
    <svg
      ref={ref}
      viewBox="0 0 690 326"
      role="img"
      aria-label={label}
      className="mx-auto w-full max-w-[690px]"
    >
      <StageLabel
        x={150}
        y={22}
        text="generate ×8"
        hot={phase === "generate"}
      />
      <StageLabel
        x={Math.max(endX + 14, 300)}
        y={22}
        text="reward"
        hot={phase === "reward"}
      />
      <StageLabel
        x={(PANEL.x0 + PANEL.x1) / 2}
        y={22}
        text="reinforce"
        hot={phase === "group" || phase === "reinforce"}
      />

      {/* the return wire and its travelling push */}
      <path
        d={retD}
        fill="none"
        strokeWidth={1.6}
        strokeDasharray="5 4"
        className="stroke-ink-muted"
      />
      <text
        x={310}
        y={316}
        textAnchor="middle"
        className="fill-ink-muted text-[11px]"
      >
        ↺ every push, right or wrong, updates the same model
      </text>
      {inRet ? (
        <g>
          <circle cx={px} cy={py} r={6} className="fill-correct" />
          <circle
            cx={px + 14 * (1 - retP)}
            cy={py - 2}
            r={5}
            className="fill-wrong"
          />
        </g>
      ) : null}

      {/* the fan of chains */}
      <g opacity={lt < F.sort[0] ? 1 : lerp(1, 0.18, sortP)}>
        {ends.map(([ex, ey], i) => (
          <path
            key={i}
            d={`M${startX} ${MODEL[1]} C ${startX + 70} ${MODEL[1]} ${ex - 80} ${ey} ${ex} ${ey}`}
            fill="none"
            pathLength={1}
            strokeDasharray="1 2"
            strokeDashoffset={1 - fanP}
            strokeWidth={1.8}
            className={
              rewardP > 0
                ? right.has(i)
                  ? "stroke-correct"
                  : "stroke-wrong"
                : "stroke-ink-muted"
            }
            style={{
              strokeOpacity: rewardP > 0 ? lerp(0.5, 0.9, rewardP) : 0.6,
            }}
          />
        ))}
      </g>

      {/* the group panel */}
      <g opacity={lerp(0.35, 1, sortP)}>
        {[1, 0].map((r) => (
          <g key={r}>
            <line
              x1={PANEL.x0}
              x2={PANEL.x1}
              y1={laneY(r)}
              y2={laneY(r)}
              className="stroke-grid"
              strokeWidth={0.75}
            />
            <text
              x={PANEL.x0 - 8}
              y={laneY(r)}
              dy="0.32em"
              textAnchor="end"
              className="fill-ink-muted font-mono text-[11px]"
            >
              {r}
            </text>
          </g>
        ))}
        <line
          x1={PANEL.x0}
          x2={PANEL.x1}
          y1={laneY(mean)}
          y2={laneY(mean)}
          className="stroke-ink"
          strokeWidth={1}
          strokeDasharray="4 3"
          opacity={sortP}
        />
        <text
          x={PANEL.x1 + 6}
          y={laneY(mean)}
          dy="0.32em"
          className="fill-ink text-[10px] font-semibold"
          opacity={sortP}
        >
          mean
        </text>
      </g>

      {/* the eight chains' ends: scored at the fan, then carried into the panel */}
      {ends.map(([ex, ey], i) => {
        const ok = right.has(i);
        const tx = colX(i);
        const ty = laneY(ok ? 1 : 0);
        const cx = lerp(ex, tx, sortP);
        const cy = lerp(ey, ty, sortP);
        const shown = fanP >= 1;
        const yFrom = laneY(mean) + (ok ? -2 : 2);
        const yTo = ty + (ok ? 9 : -9);
        const arrowP = span(lt, F.sort[1] - 200, F.sort[1] + 300) * fade;
        return (
          <g key={i} opacity={shown ? fade : 0}>
            {arrowP > 0 ? (
              <g
                className={
                  ok ? "stroke-correct fill-correct" : "stroke-wrong fill-wrong"
                }
                opacity={arrowP}
              >
                <line
                  x1={tx}
                  x2={tx}
                  y1={yFrom}
                  y2={lerp(yFrom, yTo + (ok ? 4 : -4), arrowP)}
                  strokeWidth={2}
                />
                {arrowP > 0.9 ? (
                  <polygon
                    points={`${tx},${yTo} ${tx - 3.5},${yTo + (ok ? 6 : -6)} ${tx + 3.5},${yTo + (ok ? 6 : -6)}`}
                    stroke="none"
                  />
                ) : null}
              </g>
            ) : null}
            <circle
              cx={cx}
              cy={cy}
              r={6}
              className={
                rewardP > 0
                  ? `${ok ? "fill-correct" : "fill-wrong"} stroke-canvas`
                  : "fill-ink-muted stroke-canvas"
              }
              strokeWidth={1.5}
            />
            {sortP < 0.5 ? (
              <text
                x={cx + 11}
                y={cy}
                dy="0.32em"
                className={`font-mono text-[11px] font-semibold ${ok ? "fill-correct-ink" : "fill-wrong-ink"}`}
                opacity={rewardP * (1 - sortP * 2)}
              >
                {ok ? "1" : "0"}
              </text>
            ) : null}
          </g>
        );
      })}

      {/* the model: a ring whose green share is its chance of a right chain */}
      <circle
        cx={MODEL[0]}
        cy={MODEL[1]}
        r={RING_R}
        fill="none"
        strokeWidth={9}
        className="stroke-grid"
      />
      <circle
        cx={MODEL[0]}
        cy={MODEL[1]}
        r={RING_R}
        fill="none"
        strokeWidth={9}
        className="stroke-correct"
        strokeDasharray={`${(p * circ).toFixed(2)} ${circ.toFixed(2)}`}
        transform={`rotate(-90 ${MODEL[0]} ${MODEL[1]})`}
      />
      <text
        x={MODEL[0]}
        y={MODEL[1]}
        dy="0.32em"
        textAnchor="middle"
        className="fill-ink font-mono text-[13px] font-semibold"
      >
        {Math.round(p * 100)}%
      </text>
      <text
        x={MODEL[0]}
        y={MODEL[1] - RING_R - 26}
        textAnchor="middle"
        className="fill-ink text-[12px] font-semibold"
      >
        model
      </text>
      <text
        x={MODEL[0]}
        y={MODEL[1] - RING_R - 12}
        textAnchor="middle"
        className="fill-ink-muted text-[10px]"
      >
        chance a chain is right
      </text>

      {/* readouts */}
      <text
        x={PANEL.x1}
        y={50}
        textAnchor="end"
        className="fill-ink-muted text-[11px]"
      >
        lap {lap + 1} of 4 ·{" "}
        <tspan className="fill-ink font-semibold">{k} of 8 right</tspan>
      </text>
      {grow ? (
        <text
          x={PANEL.x1}
          y={66}
          textAnchor="end"
          className="fill-compute-ink text-[11px] font-semibold"
        >
          each chain {FAN_TOKENS[lap]} tokens
        </text>
      ) : null}
    </svg>
  );
}

/* ---------------------------------------------------------------------------
 * B: the shifting hill
 * ------------------------------------------------------------------------- */

/** Weight on the right-answer bump, lap by lap, and after the last lap. */
const HILL_W = [0.15, 0.4, 0.65, 0.85, 0.93];
const WRONG_BUMP = { mu: 0.34, sd: 0.11 };
const RIGHT_BUMP = { mu: 0.72, sd: 0.045 };
const RIGHT_REGION = [0.6, 0.84] as const;

/** Abramowitz and Stegun 7.1.26. */
function erf(x: number) {
  const s = Math.sign(x);
  const a = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * a);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) *
      t +
      0.254829592) *
      t *
      Math.exp(-a * a);
  return s * y;
}
const pdf = (x: number, mu: number, sd: number) =>
  Math.exp(-0.5 * ((x - mu) / sd) ** 2) / (sd * Math.sqrt(2 * Math.PI));
const cdf = (x: number, mu: number, sd: number) =>
  0.5 * (1 + erf((x - mu) / (sd * Math.SQRT2)));
const mixPdf = (x: number, w: number) =>
  (1 - w) * pdf(x, WRONG_BUMP.mu, WRONG_BUMP.sd) +
  w * pdf(x, RIGHT_BUMP.mu, RIGHT_BUMP.sd);
const mixCdf = (x: number, w: number) =>
  (1 - w) * cdf(x, WRONG_BUMP.mu, WRONG_BUMP.sd) +
  w * cdf(x, RIGHT_BUMP.mu, RIGHT_BUMP.sd);
/** Eight stratified draws from the model: the quantiles (i + ½) / 8. */
function draws(w: number) {
  return Array.from({ length: G }, (_, i) => {
    const q = (i + 0.5) / G;
    let lo = 0;
    let hi = 1;
    for (let n = 0; n < 40; n++) {
      const mid = (lo + hi) / 2;
      if (mixCdf(mid, w) < q) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  });
}
const DRAWS = HILL_W.slice(0, 4).map(draws);
const isRight = (x: number) => x >= RIGHT_REGION[0] && x <= RIGHT_REGION[1];

const H = {
  drop: [0, 1500],
  score: [1500, 2100],
  push: [2100, 3000],
  morph: [3000, 4100],
  lap: 4600,
} as const;
const PLOT = { x0: 50, x1: 640, base: 256, top: 90 };
const HILL_MAX = Math.max(
  ...HILL_W.map((w) =>
    Math.max(...Array.from({ length: 200 }, (_, i) => mixPdf(i / 199, w))),
  ),
);

function HillLoop() {
  const total = H.lap * 4;
  const { ref, t } = useLoopClock(total, H.lap + 2800);
  const lap = Math.floor(t / H.lap);
  const lt = t - lap * H.lap;
  const xs = DRAWS[lap];
  const k = xs.filter(isRight).length;

  const scoreP = span(lt, ...H.score);
  const pushP = span(lt, ...H.push);
  const morphP = span(lt, ...H.morph);
  const w = lerp(HILL_W[lap], HILL_W[lap + 1], morphP);
  const tickFade = 1 - span(lt, H.morph[0] + 200, H.morph[1]);

  const sx = (x: number) => lerp(PLOT.x0, PLOT.x1, x);
  const sy = (d: number) => lerp(PLOT.base, PLOT.top, d / HILL_MAX);
  const N = 160;
  const pts = Array.from({ length: N + 1 }, (_, i) => {
    const x = i / N;
    return `${sx(x).toFixed(1)},${sy(mixPdf(x, w)).toFixed(1)}`;
  });
  const area = `M${sx(0)},${PLOT.base} L${pts.join(" L")} L${sx(1)},${PLOT.base} Z`;
  const line = `M${pts.join(" L")}`;

  const phase =
    lt < H.drop[1] ? "generate" : lt < H.score[1] ? "reward" : "reinforce";

  const label = `Prototype B: the reinforcement learning loop as a shifting hill. The model is drawn as one curve over the ways it could answer a problem, with the region of right answers shaded. Eight samples drop from the curve as ticks; ticks in the shaded region score 1 and the rest score 0. Right samples push the curve up where they landed, wrong samples push it down, and the curve's mass slides toward the right region. Lap ${lap + 1} of 4: ${k} of 8 right.`;

  return (
    <svg
      ref={ref}
      viewBox="0 0 690 320"
      role="img"
      aria-label={label}
      className="mx-auto w-full max-w-[690px]"
    >
      <StageLabel
        x={180}
        y={22}
        text="generate ×8"
        hot={phase === "generate"}
      />
      <StageLabel x={345} y={22} text="reward" hot={phase === "reward"} />
      <StageLabel x={510} y={22} text="reinforce" hot={phase === "reinforce"} />

      {/* the right-answer region */}
      <rect
        x={sx(RIGHT_REGION[0])}
        y={PLOT.top - 22}
        width={sx(RIGHT_REGION[1]) - sx(RIGHT_REGION[0])}
        height={PLOT.base - PLOT.top + 22}
        className="fill-correct"
        opacity={0.1}
      />
      <text
        x={(sx(RIGHT_REGION[0]) + sx(RIGHT_REGION[1])) / 2}
        y={PLOT.top - 32}
        textAnchor="middle"
        className="fill-correct-ink text-[11px] font-semibold"
      >
        right answers · reward 1
      </text>
      <text
        x={sx(0.3)}
        y={PLOT.top - 32}
        textAnchor="middle"
        className="fill-wrong-ink text-[11px] font-semibold"
      >
        wrong answers · reward 0
      </text>

      {/* the model */}
      <path d={area} className="fill-compute" opacity={0.14} />
      <path d={line} fill="none" strokeWidth={2} className="stroke-compute" />
      <line
        x1={PLOT.x0}
        x2={PLOT.x1}
        y1={PLOT.base}
        y2={PLOT.base}
        className="stroke-ink-muted"
        strokeWidth={1}
      />
      <text
        x={(PLOT.x0 + PLOT.x1) / 2}
        y={PLOT.base + 46}
        textAnchor="middle"
        className="fill-ink-muted text-[11px]"
      >
        ways the model could answer this problem (abstract)
      </text>
      <text
        x={PLOT.x0}
        y={PLOT.top + 20}
        className="fill-ink text-[12px] font-semibold"
      >
        model
      </text>
      <text
        x={PLOT.x0}
        y={PLOT.top + 34}
        className="fill-ink-muted text-[10px]"
      >
        how often it writes each kind of answer
      </text>

      {/* the eight samples */}
      {xs.map((x, i) => {
        const ok = isRight(x);
        const dropP = span(lt, H.drop[0] + i * 140, H.drop[0] + i * 140 + 420);
        const cx = sx(x);
        const tipY = lerp(PLOT.base - 40, PLOT.base, dropP);
        const curveY = sy(mixPdf(x, w));
        const len = 20 * pushP;
        return (
          <g key={i} opacity={dropP > 0 ? tickFade : 0}>
            <line
              x1={cx}
              x2={cx}
              y1={tipY - 14}
              y2={tipY}
              strokeWidth={2.5}
              className={
                scoreP > 0
                  ? ok
                    ? "stroke-correct"
                    : "stroke-wrong"
                  : "stroke-ink"
              }
            />
            <text
              x={cx}
              y={PLOT.base + 16}
              textAnchor="middle"
              className={`font-mono text-[11px] font-semibold ${ok ? "fill-correct-ink" : "fill-wrong-ink"}`}
              opacity={scoreP}
            >
              {ok ? "1" : "0"}
            </text>
            {pushP > 0 ? (
              <g
                className={
                  ok ? "stroke-correct fill-correct" : "stroke-wrong fill-wrong"
                }
                opacity={pushP}
              >
                <line
                  x1={cx}
                  x2={cx}
                  y1={curveY}
                  y2={curveY + (ok ? -len : len)}
                  strokeWidth={2}
                />
                <polygon
                  points={`${cx},${curveY + (ok ? -len - 6 : len + 6)} ${cx - 3.5},${curveY + (ok ? -len : len)} ${cx + 3.5},${curveY + (ok ? -len : len)}`}
                  stroke="none"
                />
              </g>
            ) : null}
          </g>
        );
      })}

      <text
        x={PLOT.x1}
        y={312}
        textAnchor="end"
        className="fill-ink-muted text-[11px]"
      >
        lap {lap + 1} of 4 ·{" "}
        <tspan className="fill-ink font-semibold">{k} of 8 right</tspan>
      </text>
    </svg>
  );
}

/* ---------------------------------------------------------------------------
 * D: the loop as slides, on page 7's measured group of sixteen
 * ------------------------------------------------------------------------- */

const D_PROBLEM_ID = "test/number_theory/820.json";
const D_PROBLEM = PAGE7.figure1.problems.find(
  (p) => p.problem_id === D_PROBLEM_ID,
);
/** The two chains beat 2 opens up: the lone right one, and one of the four the vote backs. */
const D_OPEN = [
  { index: 4, from: "There are 4 primes" },
  { index: 0, from: "However, since" },
];

/** The tail of a trace from its last `marker`, tidied for a page with no maths renderer. */
function excerpt(trace: string, marker: string) {
  const at = trace.lastIndexOf(marker);
  const tail = at >= 0 ? trace.slice(at) : trace.slice(-420);
  return tidyMath(tail)
    .replace(/\n{2,}/g, "\n")
    .trim();
}

const BEATS = [
  {
    key: "generate",
    title: "Generate",
    line: "One problem, sixteen chains from the same model.",
  },
  {
    key: "reward",
    title: "Reward",
    line: "A program reads each chain's final answer: 1 if it matches the key, 0 if not.",
  },
  {
    key: "reinforce",
    title: "Reinforce",
    line: "Each chain's push is its reward measured against the group's average.",
  },
  {
    key: "repeat",
    title: "Repeat",
    line: "The model is nudged, and the next problem gets a fresh group.",
  },
] as const;

const fmtSigned = (v: number) =>
  `${v > 0 ? "+" : "−"}${Math.abs(v).toFixed(2)}`;

function LoopSlides() {
  const [beat, setBeat] = useState(0);
  if (!D_PROBLEM)
    return (
      <p className="text-sm text-wrong-ink">
        Page 7 does not bundle {D_PROBLEM_ID}.
      </p>
    );

  const chains = [...D_PROBLEM.chains].sort(
    (a, b) => a.sample_index - b.sample_index,
  );
  const rewards: number[] = chains.map((c) => (c.correct ? 1 : 0));
  const n = rewards.length;
  const mean = rewards.reduce((a, b) => a + b, 0) / n;
  const sd = Math.sqrt(rewards.reduce((a, r) => a + (r - mean) ** 2, 0) / n);
  const push = rewards.map((r) => (sd > 0 ? (r - mean) / sd : 0));
  const maxPush = Math.max(...push.map(Math.abs));
  const kRight = rewards.filter((r) => r === 1).length;
  const plurality = D_PROBLEM.plurality_answer;
  const pluralityVotes =
    D_PROBLEM.ranked.find((r) => r.answer === plurality)?.votes ?? 0;
  const rightAnswer = D_PROBLEM.ground_truth;

  const showReward = beat >= 1;
  const showPush = beat >= 2;
  const dim = beat >= 3;

  return (
    <div className="flex flex-col gap-4">
      {/* beat chips, clickable like a slide sorter */}
      <ol className="m-0 flex list-none flex-wrap gap-2 p-0" aria-label="Beats">
        {BEATS.map((b, i) => (
          <li key={b.key}>
            <button
              type="button"
              onClick={() => setBeat(i)}
              aria-current={i === beat ? "step" : undefined}
              className={`rounded-full border px-3 py-1 text-xs font-eyebrow uppercase tracking-wide ${
                i === beat
                  ? "border-compute bg-compute/15 font-semibold text-compute-ink"
                  : i < beat
                    ? "border-grid text-ink"
                    : "border-grid text-ink-muted"
              }`}
            >
              {i + 1}. {b.title}
            </button>
          </li>
        ))}
      </ol>

      <p className="text-base font-semibold text-ink" aria-live="polite">
        {BEATS[beat].line}
      </p>

      {/* the prompt, then an arrow into the group */}
      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        <div className="rounded-lg border border-grid bg-surface-raised p-3 sm:max-w-[16rem]">
          <p className="text-[10px] font-eyebrow uppercase tracking-wide text-ink-muted">
            the problem
          </p>
          <p className="text-sm text-ink">{tidyMath(D_PROBLEM.question)}</p>
          <p
            className={`mt-1 text-xs motion-safe:transition-opacity motion-safe:duration-300 ${
              showReward ? "text-correct-ink opacity-100" : "opacity-0"
            }`}
          >
            answer key:{" "}
            <span className="font-mono font-semibold">{rightAnswer}</span>
          </p>
        </div>
        <span
          className="shrink-0 self-center text-xl text-ink-muted"
          aria-hidden="true"
        >
          <span className="hidden sm:inline">→</span>
          <span className="sm:hidden">↓</span>
        </span>

        {/* the sixteen chains */}
        <div
          className={`grid flex-1 grid-cols-4 gap-x-1.5 gap-y-7 pt-5 motion-safe:transition-opacity motion-safe:duration-500 ${dim ? "opacity-40" : ""}`}
          role="list"
          aria-label={`${n} chains`}
        >
          {chains.map((c, i) => {
            const ok = rewards[i] === 1;
            const p = push[i];
            const size = 13 + 19 * (Math.abs(p) / maxPush);
            return (
              <div
                key={c.sample_index}
                role="listitem"
                className={`relative flex flex-col items-center rounded border px-1 pb-1 pt-4 motion-safe:transition-colors motion-safe:duration-300 ${
                  showReward
                    ? ok
                      ? "border-correct bg-correct/10"
                      : "border-wrong/60 bg-wrong/5"
                    : "border-grid bg-surface-raised"
                }`}
                style={{
                  transitionDelay:
                    showReward && !showPush ? `${i * 40}ms` : "0ms",
                }}
              >
                {/* the push, above the tile */}
                <span
                  className={`absolute bottom-full -mb-1.5 left-1/2 -translate-x-1/2 rounded bg-canvas px-1 font-mono font-bold leading-none motion-safe:transition-all motion-safe:duration-500 ${
                    ok ? "text-correct-ink" : "text-wrong-ink"
                  } ${showPush ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}
                  style={{
                    fontSize: `${size}px`,
                    transitionDelay: showPush ? `${i * 35}ms` : "0ms",
                  }}
                  aria-hidden={!showPush}
                >
                  {p > 0 ? "+" : "−"}
                </span>
                <span className="text-[9px] font-eyebrow uppercase tracking-wide text-ink-muted">
                  chain {i + 1}
                </span>
                <span className="font-mono text-sm font-semibold text-ink">
                  {tidyMath(c.extracted_answer ?? "none")}
                </span>
                <span
                  className={`font-mono text-[10px] motion-safe:transition-opacity motion-safe:duration-300 ${
                    showPush
                      ? ok
                        ? "text-correct-ink"
                        : "text-wrong-ink"
                      : showReward
                        ? ok
                          ? "text-correct-ink"
                          : "text-wrong-ink"
                        : ""
                  } ${showReward ? "opacity-100" : "opacity-0"}`}
                >
                  {showPush ? fmtSigned(p) : `reward ${rewards[i]}`}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* the beat's own panel, held to one height so the page does not jump */}
      <div className="min-h-[10.5rem]">
        {beat === 0 ? (
          <p className="text-sm text-ink-muted">
            Sixteen samples of the same model on the same problem, and they land
            on {D_PROBLEM.distinct_answers} different answers. {pluralityVotes}{" "}
            of them say {plurality}.
          </p>
        ) : null}

        {beat === 1 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {D_OPEN.map(({ index, from }) => {
              const c = chains[index];
              const ok = rewards[index] === 1;
              return (
                <div
                  key={index}
                  className={`flex flex-col gap-1 rounded-lg border-l-4 bg-surface-raised p-3 ${ok ? "border-correct" : "border-wrong"}`}
                >
                  <p className="text-xs font-semibold text-ink">
                    chain {index + 1} ·{" "}
                    <span
                      className={ok ? "text-correct-ink" : "text-wrong-ink"}
                    >
                      answers {tidyMath(c.extracted_answer ?? "none")}, reward{" "}
                      {rewards[index]}
                    </span>
                  </p>
                  <pre className="m-0 max-h-48 overflow-auto whitespace-pre-wrap font-mono text-[11px] leading-snug text-ink-muted">
                    …{excerpt(c.trace, from)}
                  </pre>
                </div>
              );
            })}
            <p className="text-xs text-ink-muted sm:col-span-2">
              The reward reads only the final answer. How the chain got there is
              never graded.
            </p>
          </div>
        ) : null}

        {beat === 2 ? (
          <div className="flex flex-col gap-1 rounded-lg border-l-4 border-compute bg-surface-raised p-3 text-sm text-ink">
            <p>
              {kRight} of {n} right, so the group&apos;s average reward is{" "}
              <span className="font-mono">{mean.toFixed(3)}</span>. The right
              chain is far above it and gets{" "}
              <span className="font-mono font-semibold text-correct-ink">
                {fmtSigned(Math.max(...push))}
              </span>
              ; each wrong chain sits just below it and gets{" "}
              <span className="font-mono font-semibold text-wrong-ink">
                {fmtSigned(Math.min(...push))}
              </span>
              .
            </p>
            <p className="text-ink-muted">
              A majority vote would have answered {plurality}. Training pushes
              hardest on the one chain the vote outnumbered.
            </p>
          </div>
        ) : null}

        {beat === 3 ? (
          <div className="flex flex-col gap-1 rounded-lg border-l-4 border-compute bg-surface-raised p-3 text-sm text-ink">
            <p>
              <span className="text-lg" aria-hidden="true">
                ↺{" "}
              </span>
              The same model, nudged toward what chain {D_OPEN[0].index + 1} did
              and away from the other {n - kRight}. Then a new problem, a new
              group of {n}, and the same three steps.
            </p>
            <p className="text-ink-muted">
              A group where every chain scores the same gets no push at all:
              there is nothing to tell apart.
            </p>
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setBeat((b) => Math.max(0, b - 1))}
          disabled={beat === 0}
          className="rounded border border-grid bg-surface-raised px-3 py-1 text-sm text-ink disabled:opacity-40"
        >
          ← Back
        </button>
        <span className="font-mono text-xs text-ink-muted">
          {beat + 1} / {BEATS.length}
        </span>
        <button
          type="button"
          onClick={() => setBeat((b) => (b + 1) % BEATS.length)}
          className="rounded border border-compute bg-compute/15 px-3 py-1 text-sm font-semibold text-ink"
        >
          {beat === BEATS.length - 1 ? "↺ Start over" : "Next →"}
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * The review block
 * ------------------------------------------------------------------------- */

function Proto({
  tag,
  title,
  children,
  caption,
}: {
  tag: string;
  title: string;
  children: React.ReactNode;
  caption: string;
}) {
  return (
    <figure className="m-0 flex flex-col gap-3 rounded-lg border border-grid bg-surface p-4">
      <p className="text-sm font-semibold text-ink">
        <span className="font-mono text-compute-ink">{tag}.</span> {title}
      </p>
      {children}
      <figcaption className="text-xs text-ink-muted">{caption}</figcaption>
    </figure>
  );
}

export function LoopPrototypes() {
  return (
    <section
      className="flex min-w-0 flex-col gap-4 rounded-lg border-2 border-dashed border-compute p-4"
      data-testid="loop-prototypes"
    >
      <div className="flex flex-col gap-1">
        <p className="text-xs font-eyebrow uppercase tracking-wide text-compute-ink">
          Prototypes · for review, not page copy
        </p>
        <h2 className="text-xl font-semibold text-ink">
          Five animations for the loop in section 1
        </h2>
        <p className="text-sm text-ink-muted">
          A to C: each lap is one problem, eight chains, every chain scored and
          every chain fed back; the counts (1, 3, 5, then 7 of 8 right) are
          drawn for illustration, not measured. D and E run on measured chains.
        </p>
      </div>
      <Proto
        tag="A"
        title="Fan out, fold back"
        caption="The ring is the model's chance of writing a right chain. Nothing is cut at the reward: wrong chains fold back too, pushing down from the group mean."
      >
        <FanLoop />
      </Proto>
      <Proto
        tag="B"
        title="The shifting hill"
        caption="The model as one curve over ways of answering. Samples that land in the shaded region score 1; the curve's mass slides toward them. Same model, reweighted."
      >
        <HillLoop />
      </Proto>
      <Proto
        tag="C"
        title="Fan out, fold back, chains growing"
        caption="A, with chains that lengthen every lap. ~1k and ~9k tokens are R1-Zero's reported start and end lengths; the laps between are drawn."
      >
        <FanLoop grow />
      </Proto>
      <Proto
        tag="D"
        title="Slides, on a measured group of sixteen"
        caption={`Page 7's 16 chains from ${PAGE7.primary.label} at temperature 0.3 on one MATH problem, rewards from its answer key, pushes computed from those rewards as GRPO does (reward minus the group mean, over the group's spread). Click through the beats.`}
      >
        <LoopSlides />
      </Proto>
      <Proto
        tag="E"
        title="A's fan on D's measured groups, stepped"
        caption={`Page 7's chains from ${PAGE7.primary.label} at temperature 0.3, ${E_PROBLEMS.length} of the problems it bundles. Rewards come from each answer key; each push is reward minus the group's average. It plays on its own; click a step to hold on it, or use the arrows for another problem.`}
      >
        <LoopStepped />
      </Proto>
    </section>
  );
}
