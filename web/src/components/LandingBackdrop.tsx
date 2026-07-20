import { createRng } from "@/lib/rng";

/**
 * Abstract backdrop for the landing page — an illustration of inference-time
 * scaling: many faint reasoning paths branch out (sampling / tree search),
 * most fade, one lights up and converges on a bright answer, while a rising
 * log-linear "scaling curve" sweeps beneath (each doubling of thinking buys a
 * roughly constant bump). Purely decorative: aria-hidden, non-interactive.
 *
 * Geometry is generated with a SEEDED RNG at module load, so the server and the
 * client render identical SVG (no hydration mismatch) and it never shifts.
 */
const W = 900;
const H = 560;

function cubic(x1: number, y1: number, x2: number, y2: number): string {
  const dx = (x2 - x1) * 0.5;
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}

const geom = (() => {
  const rng = createRng(20240803);
  const origin = { x: 80, y: 300 };
  const midX = 430;
  const leafX = 840;

  const mids = Array.from({ length: 5 }, (_, i) => ({
    x: midX + (rng() - 0.5) * 40,
    y: 90 + i * 90 + (rng() - 0.5) * 30,
  }));

  const winMid = 2; // the middle branch wins
  const answer = { x: leafX, y: 300 };

  const leaves: { x: number; y: number; mid: number; win: boolean }[] = [];
  mids.forEach((m, mi) => {
    const count = 2 + Math.floor(rng() * 2); // 2–3 leaves per mid
    for (let k = 0; k < count; k++) {
      const win = mi === winMid && k === 0;
      leaves.push({
        x: leafX + (rng() - 0.5) * 30,
        y: win ? answer.y : m.y + (k - (count - 1) / 2) * 46 + (rng() - 0.5) * 20,
        mid: mi,
        win,
      });
    }
  });

  // Rising log-linear scaling curve across the bottom.
  const curve = Array.from({ length: 40 }, (_, i) => {
    const t = i / 39;
    const x = 60 + t * (W - 120);
    const y = H - 70 - Math.log10(1 + t * 9) * 150; // log growth
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

  // Faint sampling flecks scattered through the field.
  const flecks = Array.from({ length: 46 }, () => ({
    x: 120 + rng() * (W - 220),
    y: 60 + rng() * (H - 160),
    r: 1 + rng() * 1.6,
    hot: rng() > 0.82,
  }));

  return { origin, mids, leaves, answer, winMid, curve, flecks };
})();

export function LandingBackdrop() {
  const { origin, mids, leaves, answer, winMid, curve, flecks } = geom;
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <radialGradient id="answerGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--correct)" stopOpacity="0.35" />
          <stop offset="60%" stopColor="var(--correct)" stopOpacity="0.06" />
          <stop offset="100%" stopColor="var(--correct)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="promptGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--compute)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--compute)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* soft glows */}
      <rect x={answer.x - 220} y={answer.y - 220} width={440} height={440} fill="url(#answerGlow)" className="animate-drift" />
      <rect x={origin.x - 160} y={origin.y - 160} width={320} height={320} fill="url(#promptGlow)" />

      {/* scaling-law curve */}
      <polyline points={curve} fill="none" className="stroke-compute" strokeOpacity={0.22} strokeWidth={2} strokeDasharray="2 6" />

      {/* origin -> mids */}
      {mids.map((m, i) => (
        <path
          key={`o${i}`}
          d={cubic(origin.x, origin.y, m.x, m.y)}
          fill="none"
          className={i === winMid ? "stroke-correct" : "stroke-compute"}
          strokeOpacity={i === winMid ? 0.7 : 0.28}
          strokeWidth={i === winMid ? 2.4 : 1.4}
        />
      ))}

      {/* mids -> leaves */}
      {leaves.map((l, i) => (
        <path
          key={`l${i}`}
          d={cubic(mids[l.mid].x, mids[l.mid].y, l.x, l.y)}
          fill="none"
          className={l.win ? "stroke-correct" : "stroke-grid"}
          strokeOpacity={l.win ? 0.8 : 0.5}
          strokeWidth={l.win ? 2.4 : 1}
        />
      ))}

      {/* sampling flecks */}
      {flecks.map((f, i) => (
        <circle key={`f${i}`} cx={f.x} cy={f.y} r={f.r} className={f.hot ? "fill-correct" : "fill-ink"} opacity={f.hot ? 0.5 : 0.12} />
      ))}

      {/* mid nodes */}
      {mids.map((m, i) => (
        <circle key={`mn${i}`} cx={m.x} cy={m.y} r={i === winMid ? 6 : 4} className={i === winMid ? "fill-correct" : "fill-compute"} opacity={i === winMid ? 0.9 : 0.5} />
      ))}

      {/* dead-end leaf nodes */}
      {leaves.filter((l) => !l.win).map((l, i) => (
        <circle key={`ln${i}`} cx={l.x} cy={l.y} r={3} className="fill-ink" opacity={0.18} />
      ))}

      {/* prompt node */}
      <circle cx={origin.x} cy={origin.y} r={9} className="fill-ink" opacity={0.85} />

      {/* the answer: bright, pulsing */}
      <circle cx={answer.x} cy={answer.y} r={22} className="fill-correct animate-pulse" opacity={0.18} />
      <circle cx={answer.x} cy={answer.y} r={9} className="fill-correct" />
    </svg>
  );
}
