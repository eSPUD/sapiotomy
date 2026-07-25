"use client";

/**
 * Page 10, "Searching Through Thoughts" — every tool so far has treated a
 * reasoning chain as a line. Page 7 ran many lines in parallel; page 9 learned
 * to grade a line while it is still being written. Put those together and the
 * line becomes a TREE: branch, evaluate, prune, and when a branch dies, back up
 * and try another.
 *
 * The single road of slides 4-7 ("a road to a destination", "a traveller on a
 * good road takes a wrong turn") forks here into a NETWORK. The interactive runs
 * a real routing search (lib/routing.ts) over an authored road map (lib/authored
 * ROUTE_MAP): a town is a state, a road is a move, and the searcher's evaluator
 * is the straight-line "miles to go" a GPS shows — informative but blind to
 * water. Nothing is animated theatre: the strategy dropdown genuinely re-runs
 * the search, the map shows the towns that strategy actually scored, and the
 * counter is the real number of towns examined. The instance is tuned (see
 * src/lib/act2routing.test.ts) so the strategies disagree: greedy and a beam of
 * 1 drive into the bridgeless Ferry Landing peninsula and strand; depth-first,
 * breadth-first, wider beams and MCTS all reach Easton, at very different
 * prices, because the only crossing is far to the north — the true route must
 * first head AWAY from the destination, exactly the move a straight-line guess
 * hates.
 *
 * The "solve with plain CoT" button is the contrast: one confident drive that
 * always closes the straight-line gap, reaches the town nearest the destination,
 * and cannot turn around.
 *
 * Step 2 is anchored to Yao et al. 2023 (data/tree-of-thoughts.json): Game of 24
 * with GPT-4, input-output 7.3%, chain-of-thought 4.0%, CoT+self-consistency
 * 9.0%, Tree-of-Thoughts 45% at b=1 rising to 74% at b=5. The map is the
 * mechanism shown where a reader can see it; the chart is that mechanism
 * measured, on the task the paper used.
 */

import { useMemo, useState } from "react";
import { CitationBadge } from "@/components/CitationBadge";
import { PageNav } from "@/components/PageNav";
import { Slider } from "@/components/Slider";
import { ROUTE_MAP } from "@/lib/authored";
import { ACTS, getPage } from "@/lib/pages";
import { curves, interpolate } from "@/lib/curves";
import {
  milesToGo,
  search,
  STRATEGIES,
  type RouteMap,
  type RouteNode,
  type Strategy,
} from "@/lib/routing";
import { useStore } from "@/store/useStore";

const PAGE_N = 10;
const M = ROUTE_MAP as RouteMap;

/** Map coordinates (0-100, y = north) → SVG user units (y flipped). */
const SCALE = 6;
const SX = (x: number) => x * SCALE;
const SY = (y: number) => (96 - y) * SCALE;

const townById = (id: number) => M.towns[id];

export function Page10() {
  const page = getPage(PAGE_N)!;
  const recordInteraction = useStore((s) => s.recordInteraction);
  const data = curves.treeOfThoughts;
  const { io, cot, cotSc } = data.fit!.params;

  const [strategy, setStrategy] = useState<Strategy>("greedy");
  const [beamWidth, setBeamWidth] = useState(3);
  const [showCot, setShowCot] = useState(false);

  const trace = useMemo(
    () => search(M, strategy, { beamWidth, maxNodes: 400, rollouts: 80 }),
    [strategy, beamWidth],
  );

  const meta = STRATEGIES.find((s) => s.key === strategy)!;
  const totAccuracy = interpolate(data, beamWidth);
  const greedyStrand = useMemo(() => search(M, "greedy", { maxNodes: 400 }).townsExamined, []);

  // town id → the node representing the search's arrival there (one per town).
  const nodeByTown = useMemo(() => {
    const m = new Map<number, RouteNode>();
    for (const n of trace.nodes) if (!m.has(n.townId)) m.set(n.townId, n);
    return m;
  }, [trace]);
  const nodeById = useMemo(() => new Map(trace.nodes.map((n) => [n.id, n])), [trace]);
  const routeSet = useMemo(() => new Set(trace.routeTowns), [trace]);

  // Edges the search actually drove (kept child ← its parent), minus the route.
  const drivenEdges = trace.nodes
    .filter((n) => n.parentId !== null && n.kept && !(routeSet.has(n.townId) && trace.solved))
    .map((n) => [nodeById.get(n.parentId!)!.townId, n.townId] as const);
  const routeEdges = trace.routeTowns.slice(1).map((t, i) => [trace.routeTowns[i], t] as const);

  const trap = trace.deadEndReached;
  const trapMiles = trap !== null ? Math.round(milesToGo(M, trap)) : 0;

  const aria = trace.solved
    ? `Road map. The ${meta.label} strategy examined ${trace.townsExamined} towns and found a route from ${townById(M.origin).name} to ${townById(M.destination).name}: ${trace.routeSteps.join(", ")}.`
    : `Road map. The ${meta.label} strategy examined ${trace.townsExamined} towns and stranded at ${trap !== null ? townById(trap).name : "a dead end"}, which has no bridge across the bay.`;

  const townStatus = (id: number): "origin" | "dest" | "route" | "kept" | "dead" | "pruned" | "unseen" => {
    if (id === M.origin) return "origin";
    if (id === M.destination) return "dest";
    const n = nodeByTown.get(id);
    if (!n) return "unseen";
    if (routeSet.has(id)) return "route";
    if (n.deadEnd) return "dead";
    if (n.kept) return "kept";
    return "pruned";
  };

  const dotFill: Record<ReturnType<typeof townStatus>, string> = {
    origin: "fill-ink",
    dest: trace.solved ? "fill-correct" : "fill-ink-muted",
    route: "fill-correct",
    kept: "fill-compute",
    dead: "fill-wrong",
    pruned: "fill-surface-raised stroke-grid",
    unseen: "fill-surface stroke-grid",
  };
  const dotR: Record<ReturnType<typeof townStatus>, number> = {
    origin: 8,
    dest: 8,
    route: 7,
    kept: 6,
    dead: 7,
    pruned: 5,
    unseen: 4,
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

      {/* Left = the numbered walk-through · Right = instructions + references */}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_15rem]">
        {/* LEFT COLUMN */}
        <div className="flex min-w-0 flex-col gap-8">
          <p className="text-lg text-ink-muted">
            Slides ago, a chain of thought was a single road to a destination. Real problems are not
            one road, they are a <strong className="text-ink">map</strong>: several turns look
            reasonable and you cannot tell which is which until you drive a little way down each. You
            already know the trade from job-hunting, where you can apply everywhere and judge later,
            or pour everything into two roles and start over if they fall through. Those bets are{" "}
            <strong className="text-ink">breadth-first</strong> and{" "}
            <strong className="text-ink">depth-first</strong>. Give a model the same choice over its
            own partial thoughts and you get <strong className="text-ink">Tree of Thoughts</strong>:
            branch, evaluate, prune, backtrack.
          </p>

          {/* Step 1 — the live search */}
          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-semibold text-ink">
              1. Search the map
              <span className="ml-2 align-middle text-sm font-normal text-ink-muted">
                drive from {townById(M.origin).name} to {townById(M.destination).name} · live
                search, real town counts
              </span>
            </h2>
            <section
              aria-label="The explorable road map"
              className="flex flex-col rounded-lg border-l-4 border-compute bg-surface"
            >
              <div className="flex flex-col gap-4 p-4">
                {/* strategy picker */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="strategy" className="text-sm text-ink-muted">
                    Search strategy
                  </label>
                  <select
                    id="strategy"
                    value={strategy}
                    onChange={(e) => {
                      setStrategy(e.target.value as Strategy);
                      setShowCot(false);
                      recordInteraction(PAGE_N);
                    }}
                    className="rounded border border-grid bg-surface-raised px-3 py-2 text-sm text-ink"
                  >
                    {STRATEGIES.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-sm text-ink-muted">{meta.blurb}</p>
                </div>

                {strategy === "beam" ? (
                  <Slider
                    label="Beam width (b)"
                    min={1}
                    max={5}
                    value={beamWidth}
                    onChange={(v) => {
                      setBeamWidth(v);
                      recordInteraction(PAGE_N);
                    }}
                  />
                ) : null}

                {/* the map */}
                <div
                  className="rounded-lg border border-dashed border-grid bg-surface-raised p-2"
                  role="img"
                  aria-label={aria}
                >
                  <svg viewBox="0 0 600 540" width="100%" className="max-w-full">
                    {/* the bay: the water Ferry Landing can't cross */}
                    <rect
                      x={SX(78)}
                      y={SY(72)}
                      width={SX(86) - SX(78)}
                      height={SY(20) - SY(72)}
                      rx={10}
                      className="fill-compute"
                      opacity={0.1}
                    />
                    <text
                      x={SX(82)}
                      y={SY(46)}
                      textAnchor="middle"
                      className="fill-compute text-[11px]"
                      opacity={0.7}
                    >
                      bay
                    </text>

                    {/* every road, faint */}
                    {M.roads.map(([a, b], i) => (
                      <line
                        key={`r${i}`}
                        x1={SX(townById(a).x)}
                        y1={SY(townById(a).y)}
                        x2={SX(townById(b).x)}
                        y2={SY(townById(b).y)}
                        className="stroke-grid"
                        strokeWidth={1.2}
                      />
                    ))}

                    {/* roads the search drove */}
                    {drivenEdges.map(([a, b], i) => (
                      <line
                        key={`d${i}`}
                        x1={SX(townById(a).x)}
                        y1={SY(townById(a).y)}
                        x2={SX(townById(b).x)}
                        y2={SY(townById(b).y)}
                        className="stroke-compute"
                        strokeWidth={2}
                      />
                    ))}

                    {/* the found route */}
                    {routeEdges.map(([a, b], i) => (
                      <line
                        key={`p${i}`}
                        x1={SX(townById(a).x)}
                        y1={SY(townById(a).y)}
                        x2={SX(townById(b).x)}
                        y2={SY(townById(b).y)}
                        className="stroke-correct"
                        strokeWidth={3.5}
                      />
                    ))}

                    {/* the crow-flies lie: close in a straight line, no bridge */}
                    {!trace.solved && trap !== null ? (
                      <>
                        <line
                          x1={SX(townById(trap).x)}
                          y1={SY(townById(trap).y)}
                          x2={SX(townById(M.destination).x)}
                          y2={SY(townById(M.destination).y)}
                          className="stroke-wrong"
                          strokeWidth={1.2}
                          strokeDasharray="5 4"
                        />
                        <text
                          x={(SX(townById(trap).x) + SX(townById(M.destination).x)) / 2}
                          y={(SY(townById(trap).y) + SY(townById(M.destination).y)) / 2 - 4}
                          textAnchor="middle"
                          className="fill-wrong text-[11px]"
                        >
                          {trapMiles} mi · no bridge
                        </text>
                      </>
                    ) : null}

                    {/* towns */}
                    {M.towns.map((t) => {
                      const st = townStatus(t.id);
                      const emphasised = st === "origin" || st === "dest" || st === "route" || st === "dead";
                      return (
                        <g key={t.id}>
                          <circle
                            cx={SX(t.x)}
                            cy={SY(t.y)}
                            r={dotR[st]}
                            className={dotFill[st]}
                            strokeWidth={st === "pruned" || st === "unseen" ? 1 : 0}
                            opacity={st === "unseen" ? 0.5 : 1}
                          />
                          <text
                            x={SX(t.x)}
                            y={SY(t.y) - dotR[st] - 3}
                            textAnchor="middle"
                            className={`text-[10px] ${emphasised ? "fill-ink" : "fill-ink-muted"}`}
                          >
                            {t.name}
                            {t.id === M.origin ? " ▸" : ""}
                          </text>
                        </g>
                      );
                    })}
                  </svg>

                  {/* legend */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 px-1 pt-1 text-xs text-ink-muted">
                    <Key className="bg-ink" label="start" />
                    <Key className="bg-correct" label="route found" />
                    <Key className="bg-compute" label="examined" />
                    <Key className="bg-wrong" label="dead end (no bridge)" />
                    <Key className="border border-grid bg-surface-raised" label="pruned" />
                  </div>
                </div>

                {/* The bill, the verdict and why it went that way, in one row. */}
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[auto_minmax(0,1fr)_minmax(0,1.4fr)]">
                  <div className="rounded-lg border border-grid bg-surface-raised p-3">
                    <p className="font-mono text-3xl font-bold tabular-nums text-compute">
                      {trace.townsExamined}
                    </p>
                    <p className="text-xs text-ink">towns examined</p>
                    <p className="text-xs text-ink-muted">the compute bill</p>
                  </div>
                  <div
                    className={`rounded-lg border-l-4 p-3 ${
                      trace.solved ? "border-correct bg-correct/15" : "border-wrong bg-wrong/15"
                    }`}
                  >
                    {trace.solved ? (
                      <>
                        <p className="font-semibold text-correct">
                          ✓ arrived · {trace.routeMiles} mi
                        </p>
                        <p className="mt-1 font-mono text-xs text-ink">
                          {trace.routeSteps.join("  →  ")}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-semibold text-wrong">
                          ✗ stranded at {trap !== null ? townById(trap).name : "a dead end"}
                        </p>
                        <p className="mt-1 text-xs text-ink-muted">
                          A route exists; this strategy drove into a bridgeless spur and had no way
                          back. Its evaluator liked the road that looked closest, and it could not
                          reconsider.
                        </p>
                      </>
                    )}
                  </div>
                  <div className="rounded-lg border-l-4 border-compute bg-surface-raised p-3 text-xs text-ink">
                    The evaluator is identical for every strategy: straight-line miles to Easton, the
                    number a GPS shows. It is <em>wrong</em> about the first move — Ferry Landing is
                    closest as the crow flies, but there is no bridge. Greedy believes it and strands
                    after <span className="font-mono">{greedyStrand}</span> towns. Search is what
                    makes a fallible evaluator survivable.
                  </div>
                </div>

                {/* the plain-CoT contrast */}
                <div className="border-t border-dashed border-grid pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCot((s) => !s);
                      recordInteraction(PAGE_N);
                    }}
                    aria-expanded={showCot}
                    className="rounded border border-grid bg-surface-raised px-3 py-1.5 text-sm text-ink"
                  >
                    {showCot ? "Hide plain chain-of-thought" : "Solve with plain CoT instead ▸"}
                  </button>
                  {showCot ? (
                    <div className="mt-3 rounded-lg border-l-4 border-wrong bg-wrong/10 p-3">
                      <p className="mb-2 text-xs uppercase tracking-wide text-ink-muted">
                        one drive · 1 town examined · no branching
                      </p>
                      <ol className="flex flex-col gap-1">
                        {ROUTE_MAP.plainCot.steps.map((s, i) => (
                          <li key={i} className="text-sm text-ink">
                            <span className="mr-2 font-mono text-xs text-compute">{i + 1}</span>
                            {s}
                          </li>
                        ))}
                      </ol>
                      <p className="mt-2 text-sm text-wrong">✗ {ROUTE_MAP.plainCot.answer}</p>
                      <p className="mt-1 text-xs text-ink-muted">
                        The drive was not stupid; it reached the town nearest Easton. It just had no
                        way to undo a turn it made four towns earlier. That is the thing search buys,
                        and the reason it costs more than one town.
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            </section>
          </section>

          {/* Step 2 — what search buys */}
          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-semibold text-ink">
              2. What search buys
              <span className="ml-2 align-middle text-sm font-normal text-ink-muted">
                Yao et al. 2023 · Game of 24 · GPT-4
              </span>
            </h2>
            <figure className="m-0 flex flex-col gap-2 rounded-lg border-l-4 border-grid bg-surface p-4">
              <p className="text-sm text-ink-muted">
                The map above is the <em>mechanism</em> — branch, evaluate, prune, backtrack — shown
                where you can watch it. Here is that mechanism <em>measured</em>, on the task the
                paper used (Game of 24 with GPT-4):
              </p>
              <div
                className="flex flex-col gap-2"
                role="img"
                aria-label={`Game of 24 solve rate with GPT-4: input-output prompting ${io} percent, chain-of-thought ${cot} percent, chain-of-thought with self-consistency ${cotSc} percent, Tree of Thoughts ${totAccuracy.toFixed(0)} percent at breadth ${beamWidth}.`}
              >
                {[
                  { label: "Input-output prompting", value: io, tone: "bg-grid" },
                  { label: "Chain of thought", value: cot, tone: "bg-grid" },
                  { label: "CoT + self-consistency", value: cotSc, tone: "bg-compute" },
                  {
                    label: `Tree of Thoughts (b = ${beamWidth})`,
                    value: totAccuracy,
                    tone: "bg-correct",
                  },
                ].map((b) => (
                  <div key={b.label} className="flex items-center gap-2 text-sm">
                    <span className="w-40 shrink-0 text-ink-muted">{b.label}</span>
                    <div className="h-5 flex-1 rounded bg-surface-raised">
                      <div className={`h-5 rounded ${b.tone}`} style={{ width: `${b.value}%` }} />
                    </div>
                    <span className="w-12 shrink-0 text-right font-mono tabular-nums text-ink">
                      {b.value.toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-ink-muted">
                Chain of thought solves <strong className="text-ink">{cot}%</strong> of these; voting
                over many chains only reaches {cotSc}%, because every chain commits to its first
                move. Searching the tree reaches <strong className="text-correct">74%</strong> at
                b = 5. It is the same trade this Act has circled throughout, and the same one you
                just drove on the map: <em>search buys reliability with compute, and the strategy is
                only where you choose to spend</em> — breadth-first refuses to prune and visits every
                town; MCTS finds the same route for a fraction of the bill.
              </p>
            </figure>
          </section>
        </div>

        {/* RIGHT COLUMN — instructions + references */}
        <aside className="flex flex-col gap-6 border-t border-grid pt-6 lg:sticky lg:top-24 lg:self-start lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <div className="flex flex-col gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              How to read this page
            </h2>
            <ul className="flex flex-col gap-2 text-sm text-ink-muted">
              <li>
                Try <strong className="text-ink">Greedy</strong> first, then{" "}
                <strong className="text-ink">Beam</strong> at width 2. Greedy strands at Ferry
                Landing; the beam gets across.
              </li>
              <li>Watch the towns-examined counter as you switch. That is the compute bill.</li>
              <li>
                &ldquo;Solve with plain CoT instead&rdquo; is the contrast: one drive, one town, no
                way back.
              </li>
              <li>
                <kbd className="rounded border border-grid bg-surface px-1 font-mono text-[11px] text-ink">←</kbd>{" "}
                <kbd className="rounded border border-grid bg-surface px-1 font-mono text-[11px] text-ink">→</kbd>{" "}
                move between pages.
              </li>
            </ul>
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              References
            </h2>
            <p className="text-sm text-ink-muted">
              Yao et al. 2023, Tree of Thoughts (Game of 24, GPT-4). The map, the routes and the
              counter are a real search running in your browser, not a recording. Links at the foot.
            </p>
          </div>
        </aside>
      </div>

      <div className="flex flex-wrap gap-2">
        <CitationBadge citation={data.citation} />
      </div>
      <p className="text-xs text-ink-muted">
        the map, the routes and the towns-examined counter are produced by a real routing search in
        src/lib/routing.ts, run live in your browser; every number on the map is a measurement of
        that code, and the strategy outcomes are re-asserted in the test suite · the searcher&apos;s
        evaluator is the straight-line distance to the destination, deliberately blind to water
        (Ferry Landing is closest as the crow flies but has no bridge), standing in for a
        model&apos;s value judgement; a structural check labels dead-end spurs and is never consulted
        by a strategy · the solve-rate chart is verbatim from Yao et al. 2023, &ldquo;Tree of
        Thoughts&rdquo; (arXiv:2305.10601, NeurIPS 2023): Game of 24 with GPT-4, input-output {io}%,
        chain-of-thought {cot}%, CoT with self-consistency {cotSc}%, Tree-of-Thoughts 45% at b = 1
        and 74% at b = 5, with b = 2 to 4 interpolated along the published monotonic increase
      </p>

      <PageNav n={PAGE_N} />
    </article>
  );
}

/** A small legend swatch + label. */
function Key({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`inline-block h-3 w-3 rounded-full ${className}`} aria-hidden="true" />
      {label}
    </span>
  );
}
