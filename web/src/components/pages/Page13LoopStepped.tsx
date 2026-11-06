"use client";

/**
 * Page 13 section 1's loop figure: a fan of one problem's chains, scored and
 * folded back into the model, on page 7's measured groups and stepped by the
 * reader (Generate, Reward, Reinforce, Repeat), with Back/Next, beat chips and
 * a play mode. It steps through every problem page 7 bundles, in its order.
 * The push is reward minus the group's average, the rule section 1's group
 * chart uses. The model shows no percentage: nothing here measures one update.
 */

import { Fragment, useEffect, useRef, useState } from "react";
import { PAGE7, tidyMath } from "@/lib/page07";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => {
  const c = clamp01(t);
  return c < 0.5 ? 2 * c * c : 1 - (-2 * c + 2) ** 2 / 2;
};
/** Progress of `t` through the window [a, b), eased, clamped. */
const span = (t: number, a: number, b: number) => ease((t - a) / (b - a));

/* ---------------------------------------------------------------------------
 * E: A's fan on D's measured groups, stepped by the reader
 * ------------------------------------------------------------------------- */

/**
 * Every problem page 7 bundles, in its order, so the opening group is page 7's
 * own specimen rather than one picked here (no pinned specimens). One rule
 * drops a problem: a chain whose answer reads the same as the key once both are
 * tidied but is labelled wrong is a grading error in the run, and the figure
 * would draw a false 0. On the shipped run that drops
 * test/precalculus/398.json (three chains write the key's matrix with \frac,
 * the key writes it with a slash, all three marked wrong).
 */
const sameAnswer = (a: string, b: string) =>
  tidyMath(a).replace(/\s+/g, "") === tidyMath(b).replace(/\s+/g, "");
export const E_PROBLEMS = PAGE7.figure1.problems
  .filter(
    (p) =>
      !p.chains.some((c) => !c.correct && sameAnswer(c.extracted_answer, p.ground_truth)),
  )
  .map((p) => {
    const chains = [...p.chains].sort((a, b) => a.sample_index - b.sample_index);
    const rewards: number[] = chains.map((c) => (c.correct ? 1 : 0));
    const n = rewards.length;
    const k = rewards.reduce((a, b) => a + b, 0);
    return {
      id: p.problem_id,
      question: tidyMath(p.question),
      key: tidyMath(p.ground_truth),
      answers: chains.map((c) => tidyMath(c.extracted_answer || "none")),
      rewards,
      n,
      k,
      /** The push is reward minus the group's average: the luck dial's rule. */
      mean: k / n,
      distinct: p.distinct_answers,
      plurality: p.tie ? null : p.plurality_answer,
      pluralityRight: p.plurality_correct,
      topVotes: p.ranked[0]?.votes ?? 0,
    };
  });

/** How long each beat's own change takes to play, ms. */
const E_DUR = [1300, 1000, 1500, 1500];
/** How long play mode pauses on a finished beat before the next, ms. */
const E_HOLD = 1800;

const E_BEATS = ["Generate", "Reward", "Reinforce", "Repeat"] as const;

/** The loop's three stations, which double as the first three beats' controls; ↺ is Repeat. */
const E_CARDS = [
  { tone: "border-ink", title: "generate ×k", sub: "several chains for every problem" },
  { tone: "border-correct", title: "reward", sub: "the answer key scores each one, 1 or 0" },
  {
    tone: "border-compute",
    title: "reinforce",
    sub: "toward the high scores, away from the low, on the current model",
  },
] as const;

const E_MODEL: [number, number] = [56, 140];
const E_R = 24;
const E_FAN_X = 290;
const E_PANEL = { x0: 500, x1: 690, y1: 62, y0: 214 };
const eLane = (r: number) => lerp(E_PANEL.y0, E_PANEL.y1, r);
const E_RET = {
  p0: [595, 230],
  p1: [565, 290],
  p2: [70, 290],
  p3: [E_MODEL[0], E_MODEL[1] + E_R + 6],
} as const;
const eRetAt = (u: number): [number, number] => {
  const v = 1 - u;
  const a = v * v * v,
    b = 3 * v * v * u,
    c = 3 * v * u * u,
    d = u * u * u;
  return [
    a * E_RET.p0[0] + b * E_RET.p1[0] + c * E_RET.p2[0] + d * E_RET.p3[0],
    a * E_RET.p0[1] + b * E_RET.p1[1] + c * E_RET.p2[1] + d * E_RET.p3[1],
  ];
};
const E_RET_D = `M${E_RET.p0[0]} ${E_RET.p0[1]} C ${E_RET.p1[0]} ${E_RET.p1[1]} ${E_RET.p2[0]} ${E_RET.p2[1]} ${E_RET.p3[0]} ${E_RET.p3[1]}`;

/** An answer short enough to sit at the end of a chain. */
const shortAnswer = (a: string) => (a.length > 12 ? `${a.slice(0, 11)}…` : a);
const fmtPush = (v: number) => `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(2)}`;

type EProblem = (typeof E_PROBLEMS)[number];

/** The beat's headline and its one line read off this group's labels. */
function eCopy(P: EProblem, beat: number): [string, string] {
  const { n, k, mean } = P;
  const mixed = k > 0 && k < n;
  if (beat === 0)
    return [
      `One problem, ${n} chains from the same model.`,
      `They land on ${P.distinct} different answers.`,
    ];
  if (beat === 1)
    return [
      "A program checks each final answer against the key: 1 if it matches, 0 if not.",
      `${k} of ${n} right. ${
        P.plurality === null
          ? `A majority vote ties at ${P.topVotes} votes.`
          : `A majority vote picks ${shortAnswer(tidyMath(P.plurality))} (${P.topVotes} of ${n}), ${
              P.pluralityRight ? "the right answer" : "a wrong one"
            }.`
      }`,
    ];
  if (beat === 2)
    return [
      "Each chain's push is its reward minus the group's average.",
      mixed
        ? `The average is ${mean.toFixed(2)}, so each right chain gets ${fmtPush(1 - mean)} and each wrong chain ${fmtPush(-mean)}.${
            P.pluralityRight ? "" : " The vote missed the right answer; training pushes hardest on it."
          }`
        : `Every chain scored ${k === 0 ? 0 : 1}, so every push is 0: nothing to tell apart.`,
    ];
  return [
    "The pushes update the same model, and the next problem gets a fresh group.",
    mixed
      ? `Toward what the ${k === 1 ? "right chain" : `${k} right chains`} did, away from the other ${n - k}.`
      : "This group moves nothing: no chain stood out.",
  ];
}

export function LoopStepped() {
  const [view, setView] = useState({ problem: 0, beat: 0 });
  /** Continuous position: beat b plays s from b to b + 1. */
  const [s, setS] = useState(1);
  /* Always on: it plays whenever it is on screen, until the reader pauses it. */
  const [playing, setPlaying] = useState(true);
  const [visible, setVisible] = useState(false);
  const root = useRef<HTMLDivElement | null>(null);
  const mounted = useRef(false);

  useEffect(() => {
    // Reduced motion: start paused; the reader steps it with the cards and arrows.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) setPlaying(false);
    const el = root.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    const from = view.beat;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setS(from + 1);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = clamp01((now - t0) / E_DUR[from]);
      setS(from + p);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    setS(from);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [view]);

  /* Each beat holds, then the next; after Repeat comes the next problem. */
  useEffect(() => {
    if (!playing || !visible || s < view.beat + 1 || E_PROBLEMS.length === 0) return;
    const id = setTimeout(
      () =>
        setView((v) =>
          v.beat < E_BEATS.length - 1
            ? { problem: v.problem, beat: v.beat + 1 }
            : { problem: (v.problem + 1) % E_PROBLEMS.length, beat: 0 },
        ),
      E_HOLD,
    );
    return () => clearTimeout(id);
  }, [playing, visible, s, view]);

  const choose = (problem: number) => setView({ problem, beat: 0 });

  if (E_PROBLEMS.length === 0)
    return <p className="text-sm text-wrong-ink">Page 7 bundles no usable group.</p>;

  const P = E_PROBLEMS[view.problem];
  const { n, k, mean, rewards } = P;
  const [headline, detail] = eCopy(P, view.beat);
  const mixed = k > 0 && k < n;

  /* stage progress, all read off s */
  const fanFade = lerp(1, 0.15, span(s, 2, 2.3));
  const labelFade = 1 - span(s, 2, 2.25);
  const keyP = span(s, 1, 1.3);
  const panelP = lerp(0.3, 1, span(s, 2, 2.3));
  const meanP = span(s, 2.45, 2.65);
  const arrowP = span(s, 2.6, 2.95);
  const panelFade = 1 - span(s, 3, 3.25);
  const travel = span(s, 3.15, 3.75);
  const pulse = Math.sin(Math.PI * clamp01((s - 3.7) / 0.3));
  const nudgedP = span(s, 3.75, 3.95);

  const startX = E_MODEL[0] + E_R + 6;
  const ends = Array.from(
    { length: n },
    (_, i) => [E_FAN_X, 26 + (i * 228) / (n - 1)] as [number, number],
  );
  const colX = (i: number) =>
    E_PANEL.x0 + ((i + 0.5) * (E_PANEL.x1 - E_PANEL.x0)) / n;
  const yMean = eLane(mean);

  const label = `The reinforcement learning loop, ${E_BEATS[view.beat]}: ${headline} ${detail} The model sends ${n} chains to one problem; each chain ends in its answer. At the reward each chain turns green for reward 1 or red for reward 0. At the reinforce step every chain drops into a panel with a lane for reward 1, a lane for reward 0 and a dashed line at the group's average, and its push is an arrow from the average to its lane. At the repeat step the pushes travel back into the model.`;

  return (
    <div ref={root} className="flex flex-col gap-3">
      {/* The loop's stations are the beat controls: the current beat's card lights up. */}
      <div
        className="flex flex-col items-stretch gap-1 sm:flex-row sm:items-center"
        role="group"
        aria-label="The reinforcement learning loop: generate several chains for every problem, the answer key scores each one 1 or 0, and the current model is pushed toward the high scores and away from the low ones. The loop repeats. Choose a step to show it."
      >
        {E_CARDS.map((c, i) => (
          <Fragment key={c.title}>
            {i > 0 ? (
              <span className="shrink-0 self-center text-ink-muted" aria-hidden="true">
                →
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => {
                setPlaying(false);
                setView((v) => ({ problem: v.problem, beat: i }));
              }}
              aria-current={i === view.beat ? "step" : undefined}
              className={`relative min-w-0 flex-1 rounded-lg border-l-4 p-2.5 text-left motion-safe:transition-all motion-safe:duration-300 ${c.tone} ${
                i === view.beat
                  ? "z-10 bg-compute/25 opacity-100 shadow-lg ring-2 ring-compute motion-safe:-translate-y-1 motion-safe:scale-105"
                  : "bg-surface-raised opacity-60 hover:bg-compute/5 hover:opacity-100"
              }`}
            >
              <span className="block text-sm font-semibold text-ink">{c.title}</span>
              <span className="block text-xs text-ink-muted">{c.sub}</span>
            </button>
          </Fragment>
        ))}
        <button
          type="button"
          onClick={() => {
            setPlaying(false);
            setView((v) => ({ problem: v.problem, beat: 3 }));
          }}
          aria-current={view.beat === 3 ? "step" : undefined}
          aria-label="repeat: the pushes update the same model"
          title="repeat"
          className={`shrink-0 self-center rounded-full px-2 py-1 text-lg leading-none motion-safe:transition-all motion-safe:duration-300 ${
            view.beat === 3
              ? "bg-compute/25 text-compute-ink shadow-lg ring-2 ring-compute motion-safe:-translate-y-1 motion-safe:scale-110"
              : "text-ink-muted opacity-60 hover:text-ink hover:opacity-100"
          }`}
        >
          ↺
        </button>
      </div>

      <p className="sr-only" aria-live="polite">
        {headline} {detail}
      </p>

      <p className="rounded-lg border border-grid bg-surface-raised px-3 py-2 text-sm text-ink">
        <span className="mr-2 text-[10px] font-eyebrow uppercase tracking-wide text-ink-muted">
          the problem
        </span>
        {P.question}
      </p>

      <svg viewBox="0 0 720 300" role="img" aria-label={label} className="mx-auto w-full max-w-[600px]">
        {/* the return wire */}
        <path
          d={E_RET_D}
          fill="none"
          strokeWidth={1.6}
          strokeDasharray="5 4"
          className="stroke-ink-muted"
          opacity={0.7}
        />
        <text x={330} y={296} textAnchor="middle" className="fill-ink-muted text-[11px]">
          ↺ every push, right or wrong, updates the same model
        </text>
        {travel > 0 && travel < 1 && mixed
          ? [1, 0].map((r) => {
              const [px, py] = eRetAt(clamp01(travel - (r ? 0 : 0.06)));
              return (
                <circle
                  key={r}
                  cx={px}
                  cy={py}
                  r={r ? 7 : 4}
                  className={r ? "fill-correct" : "fill-wrong"}
                />
              );
            })
          : null}

        {/* the answer key */}
        <text
          x={E_FAN_X + 10}
          y={12}
          className="fill-correct-ink font-mono text-[12px] font-semibold"
          opacity={keyP * labelFade}
        >
          answer key: {shortAnswer(P.key)}
        </text>

        {/* the fan */}
        <g opacity={fanFade}>
          {ends.map(([ex, ey], i) => {
            const a = i * 0.03;
            const drawP = span(s, a, a + 0.55);
            const scored = s >= 1.05 + i * 0.035;
            const ok = rewards[i] === 1;
            return (
              <path
                key={i}
                d={`M${startX} ${E_MODEL[1]} C ${startX + 70} ${E_MODEL[1]} ${ex - 80} ${ey} ${ex} ${ey}`}
                fill="none"
                pathLength={1}
                strokeDasharray="1 2"
                strokeDashoffset={1 - drawP}
                strokeWidth={ok && scored ? 2.4 : 1.5}
                className={scored ? (ok ? "stroke-correct" : "stroke-wrong") : "stroke-ink-muted"}
                style={{ strokeOpacity: scored ? (ok ? 0.95 : 0.45) : 0.55 }}
              />
            );
          })}
        </g>

        {/* the group panel */}
        <g opacity={panelP * (s < 3 ? 1 : lerp(1, 0.3, span(s, 3, 3.3)))}>
          {[1, 0].map((r) => (
            <g key={r}>
              <line
                x1={E_PANEL.x0}
                x2={E_PANEL.x1}
                y1={eLane(r)}
                y2={eLane(r)}
                className="stroke-grid"
                strokeWidth={0.75}
              />
              <text
                x={E_PANEL.x0 - 8}
                y={eLane(r)}
                dy="0.32em"
                textAnchor="end"
                className="fill-ink-muted font-mono text-[11px]"
              >
                reward {r}
              </text>
            </g>
          ))}
        </g>
        <g opacity={meanP * panelFade}>
          <line
            x1={E_PANEL.x0}
            x2={E_PANEL.x1}
            y1={yMean}
            y2={yMean}
            className="stroke-ink"
            strokeWidth={1}
            strokeDasharray="4 3"
          />
          <text
            x={E_PANEL.x0 - 8}
            y={yMean + (mean === 0 ? 16 : mean === 1 ? -16 : mean < 0.12 ? -10 : mean > 0.88 ? 10 : 0)}
            dy="0.32em"
            textAnchor="end"
            className="fill-ink text-[11px] font-semibold"
          >
            average {mean.toFixed(2)}
          </text>
        </g>
        {mixed ? (
          <g opacity={arrowP * panelFade} className="font-mono text-[12px] font-bold">
            <text x={E_PANEL.x1} y={eLane(1) - 16} textAnchor="end" className="fill-correct-ink">
              push {fmtPush(1 - mean)}
            </text>
            <text x={E_PANEL.x1} y={eLane(0) + 18} textAnchor="end" className="fill-wrong-ink">
              push {fmtPush(-mean)}
            </text>
          </g>
        ) : (
          <text
            x={(E_PANEL.x0 + E_PANEL.x1) / 2}
            y={(E_PANEL.y0 + E_PANEL.y1) / 2}
            textAnchor="middle"
            className="fill-ink text-[12px] font-semibold"
            opacity={arrowP * panelFade}
          >
            no push: all {n} scored {k === 0 ? 0 : 1}
          </text>
        )}

        {/* the chains' ends: scored at the fan, then carried into the panel */}
        {ends.map(([ex, ey], i) => {
          const a = i * 0.03;
          const shown = span(s, a + 0.45, a + 0.6);
          const scored = s >= 1.05 + i * 0.035;
          const ok = rewards[i] === 1;
          const moveP = span(s, 2 + i * 0.012, 2.4 + i * 0.012);
          const tx = colX(i);
          const ty = eLane(ok ? 1 : 0);
          const cx = lerp(ex, tx, moveP);
          const cy = lerp(ey, ty, moveP);
          const ans = shortAnswer(P.answers[i]);
          const isVote = P.plurality !== null && P.answers[i] === tidyMath(P.plurality);
          const yFrom = yMean + (ok ? -2 : 2);
          const yTo = ty + (ok ? 7 : -7);
          const len = Math.abs(yTo - yFrom);
          return (
            <g key={i} opacity={shown * panelFade}>
              {arrowP > 0 && mixed ? (
                <g
                  className={ok ? "stroke-correct fill-correct" : "stroke-wrong fill-wrong"}
                  opacity={arrowP}
                >
                  <line
                    x1={tx}
                    x2={tx}
                    y1={yFrom}
                    y2={lerp(yFrom, yTo + (ok && len > 7 ? 5 : !ok && len > 7 ? -5 : 0), arrowP)}
                    strokeWidth={ok ? 2.4 : 1.6}
                  />
                  {arrowP > 0.9 && len > 7 ? (
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
                r={ok && scored ? 6 : 5}
                className={
                  scored
                    ? `${ok ? "fill-correct" : "fill-wrong"} stroke-canvas`
                    : "fill-ink-muted stroke-canvas"
                }
                strokeWidth={1.5}
              />
              <g opacity={labelFade}>
                <text
                  x={ex + 10}
                  y={ey}
                  dy="0.32em"
                  className={`font-mono text-[11px] ${
                    scored ? (ok ? "fill-correct-ink font-bold" : "fill-wrong-ink") : "fill-ink"
                  }`}
                >
                  {ans}
                </text>
                {isVote ? (
                  <text
                    x={ex + 16 + ans.length * 6.7}
                    y={ey}
                    dy="0.32em"
                    className="fill-ink-muted text-[10px] font-semibold uppercase tracking-wide"
                    opacity={keyP}
                  >
                    ◂ vote
                  </text>
                ) : null}
              </g>
            </g>
          );
        })}

        {/* the model */}
        <circle
          cx={E_MODEL[0]}
          cy={E_MODEL[1]}
          r={E_R + 6 * pulse}
          className="fill-compute"
          opacity={0.12 * pulse}
        />
        <circle
          cx={E_MODEL[0]}
          cy={E_MODEL[1]}
          r={E_R}
          strokeWidth={3 + 3 * pulse}
          className="fill-surface stroke-compute"
        />
        <text
          x={E_MODEL[0]}
          y={E_MODEL[1]}
          dy="0.32em"
          textAnchor="middle"
          className="fill-ink text-[12px] font-semibold"
        >
          model
        </text>
        <text
          x={E_MODEL[0]}
          y={E_MODEL[1] - E_R - 12}
          textAnchor="middle"
          className="fill-compute-ink text-[11px] font-semibold"
          opacity={nudgedP}
        >
          {mixed ? "nudged" : "unchanged"}
        </text>
      </svg>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          aria-pressed={!playing}
          className="rounded border border-grid bg-surface-raised px-3 py-1 text-sm text-ink"
        >
          {playing ? "❚❚ Pause" : "▶ Play"}
        </button>
        <div className="flex items-center gap-2 text-sm text-ink-muted">
          <span aria-live="polite">
            problem {view.problem + 1} of {E_PROBLEMS.length}
          </span>
          <button
            type="button"
            onClick={() => choose((view.problem - 1 + E_PROBLEMS.length) % E_PROBLEMS.length)}
            aria-label="previous problem"
            className="rounded border border-grid bg-surface-raised px-2.5 py-1 text-ink"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => choose((view.problem + 1) % E_PROBLEMS.length)}
            aria-label="next problem"
            className="rounded border border-grid bg-surface-raised px-2.5 py-1 text-ink"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}
