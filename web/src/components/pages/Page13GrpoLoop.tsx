"use client";

/**
 * Page 13 section 1's loop graph, in page 12's grammar (StarLoop): node boxes,
 * a bowed wire, direction chevrons and a staged signal that dwells on each node
 * while it lights up. Three stations instead of STaR's four: generate, reward,
 * reinforce. The difference from STaR is carried by the signal. It leaves
 * generate as a group of chains, turns green or red at reward, and every chain
 * rides on to reinforce: there is no filter branch and nothing is dropped. One
 * signal then returns to generate.
 *
 * Driven by rAF over refs (no per-frame React render) and skipped under
 * prefers-reduced-motion, which leaves the static wire, chevrons and labels.
 */

import { useEffect, useRef } from "react";

type Pt = [number, number];
type Edge = { p0: Pt; p1: Pt; p2: Pt; p3: Pt };

function bezier(e: Edge, t: number): Pt {
  const u = 1 - t;
  const a = u * u * u,
    b = 3 * u * u * t,
    c = 3 * u * t * t,
    d = t * t * t;
  return [
    a * e.p0[0] + b * e.p1[0] + c * e.p2[0] + d * e.p3[0],
    a * e.p0[1] + b * e.p1[1] + c * e.p2[1] + d * e.p3[1],
  ];
}

/** A point on the edge, pushed `off` px sideways so a group rides side by side. */
function offsetAt(e: Edge, t: number, off: number): Pt {
  const [x, y] = bezier(e, t);
  const [x2, y2] = bezier(e, Math.min(1, t + 0.01));
  const [x1, y1] = bezier(e, Math.max(0, t - 0.01));
  const dx = x2 - x1,
    dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  return [x - (dy / len) * off, y + (dx / len) * off];
}

const edgeD = (e: Edge) =>
  `M${e.p0[0]} ${e.p0[1]} C ${e.p1[0]} ${e.p1[1]} ${e.p2[0]} ${e.p2[1]} ${e.p3[0]} ${e.p3[1]}`;

/** Node centres: a triangle, generate on top. */
const N_GEN: Pt = [240, 37];
const N_REWARD: Pt = [392, 233];
const N_REINFORCE: Pt = [88, 233];

/** generate → reward → reinforce → back, each edge bowed outward. */
const EDGES: Edge[] = [
  { p0: N_GEN, p1: [340, 45], p2: [404, 140], p3: N_REWARD },
  { p0: N_REWARD, p1: [330, 300], p2: [150, 300], p3: N_REINFORCE },
  { p0: N_REINFORCE, p1: [76, 140], p2: [140, 45], p3: N_GEN },
];

/** The group's rewards as the dots leave reward: two right, two wrong. */
const GROUP = [1, 0, 1, 0];
const SPREAD = 9;

const RECT_BASE = "fill-surface-raised stroke-grid";
const RECT_HOT = "fill-compute stroke-compute";
const TITLE_CLS = "fill-ink text-[13px] font-semibold";
const SUB_BASE = "fill-ink-muted text-[10px]";
const SUB_HOT = "fill-ink text-[10px]";

function Chevron({ e, cls = "fill-ink-muted" }: { e: Edge; cls?: string }) {
  const [mx, my] = bezier(e, 0.5);
  const deg = (Math.atan2(e.p3[1] - e.p0[1], e.p3[0] - e.p0[0]) * 180) / Math.PI;
  return (
    <path
      d="M0,0 L-8,-4 L-8,4 Z"
      transform={`translate(${mx.toFixed(1)} ${my.toFixed(1)}) rotate(${deg.toFixed(1)})`}
      className={cls}
    />
  );
}

const NODES = [
  { c: N_GEN, title: "generate ×G", sub: "a group of chains, one problem" },
  { c: N_REWARD, title: "reward", sub: "each answer vs. the key: 1 or 0" },
  { c: N_REINFORCE, title: "reinforce", sub: "toward ✓, away from ✗" },
];

export function GrpoLoop() {
  const dotRefs = useRef<(SVGCircleElement | null)[]>([]);
  const rectRefs = useRef<(SVGRectElement | null)[]>([]);
  const subRefs = useRef<(SVGTextElement | null)[]>([]);

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    // Phase durations (ms): dwell, travel, dwell, travel, dwell, travel.
    const D = [480, 760, 560, 860, 560, 700];
    const B = D.map((_, i) => D.slice(0, i + 1).reduce((a, b) => a + b, 0));
    const TOTAL = B[B.length - 1];
    let raf = 0;
    let start = 0;
    const tick = (now: number) => {
      if (!start) start = now;
      const e = (now - start) % TOTAL;
      const phase = B.findIndex((b) => e < b);
      const t = (e - (phase > 0 ? B[phase - 1] : 0)) / D[phase];
      const hot = phase % 2 === 0 ? phase / 2 : -1;
      for (let i = 0; i < NODES.length; i++) {
        rectRefs.current[i]?.setAttribute("class", i === hot ? RECT_HOT : RECT_BASE);
        subRefs.current[i]?.setAttribute("class", i === hot ? SUB_HOT : SUB_BASE);
      }
      dotRefs.current.forEach((el, k) => {
        if (!el) return;
        let p: Pt | null = null;
        let cls = "fill-compute";
        if (phase === 1) p = offsetAt(EDGES[0], t, (k - 1.5) * SPREAD);
        else if (phase === 3) {
          p = offsetAt(EDGES[1], t, (k - 1.5) * SPREAD);
          cls = GROUP[k] ? "fill-correct" : "fill-wrong";
        } else if (phase === 5 && k === 0) p = bezier(EDGES[2], t);
        if (!p) return void el.setAttribute("opacity", "0");
        el.setAttribute("cx", p[0].toFixed(2));
        el.setAttribute("cy", p[1].toFixed(2));
        el.setAttribute("class", cls);
        el.setAttribute("opacity", "1");
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <svg
      viewBox="0 0 480 312"
      role="img"
      aria-label="GRPO's loop. Generate a group of chains for one problem. Reward: each chain's answer is checked against the key and scores 1 or 0. Every chain, right or wrong, goes on to reinforce, where the model is pushed toward the right ones and away from the wrong ones. Nothing is dropped. The loop repeats."
      className="mx-auto w-full max-w-[480px]"
    >
      <g fill="none" strokeWidth={2} className="stroke-ink-muted">
        {EDGES.map((e, i) => (
          <path key={i} d={edgeD(e)} />
        ))}
      </g>
      {EDGES.map((e, i) => (
        <Chevron key={i} e={e} />
      ))}

      {/* edge labels */}
      <text x={420} y={112} textAnchor="middle" className="fill-ink-muted text-[11px]">
        ×G chains
      </text>
      <text x={240} y={304} textAnchor="middle" className="text-[11px] font-semibold">
        <tspan className="fill-correct-ink">✓ right</tspan>
        <tspan className="fill-ink-muted"> and </tspan>
        <tspan className="fill-wrong-ink">✗ wrong</tspan>
        <tspan className="fill-ink-muted">: every chain kept</tspan>
      </text>
      <text x={62} y={124} textAnchor="middle" className="fill-ink-muted text-[11px]">
        ↺ repeat
      </text>

      {/* the travelling signals; hidden while dwelling on a node */}
      {GROUP.map((_, k) => (
        <circle
          key={k}
          ref={(el) => {
            dotRefs.current[k] = el;
          }}
          cx={N_GEN[0]}
          cy={N_GEN[1]}
          r={5}
          opacity={0}
          className="fill-compute"
        />
      ))}

      {NODES.map((n, i) => (
        <g key={n.title}>
          <rect
            ref={(el) => {
              rectRefs.current[i] = el;
            }}
            x={n.c[0] - 76}
            y={n.c[1] - 23}
            width={152}
            height={46}
            rx={10}
            className={RECT_BASE}
          />
          <text x={n.c[0]} y={n.c[1] - 3} textAnchor="middle" className={TITLE_CLS}>
            {n.title}
          </text>
          <text
            ref={(el) => {
              subRefs.current[i] = el;
            }}
            x={n.c[0]}
            y={n.c[1] + 12}
            textAnchor="middle"
            className={SUB_BASE}
          >
            {n.sub}
          </text>
        </g>
      ))}
    </svg>
  );
}
