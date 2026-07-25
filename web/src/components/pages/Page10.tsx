"use client";

/**
 * Page 10, "Searching Through Thoughts" — every tool so far has treated a
 * reasoning chain as a line. Page 7 ran many lines in parallel; page 9 learned
 * to grade a line while it is still being written. Put those together and the
 * line becomes a TREE: branch, evaluate, prune, and when a branch dies, back up
 * and try another.
 *
 * The interactive runs a real Game-of-24 search (lib/game24.ts) on 2, 5, 6, 6.
 * Nothing here is animated theatre — the strategy dropdown genuinely re-runs the
 * search, the tree shows the states that strategy actually scored, and the
 * compute counter is the real number of evaluator calls. That matters because
 * the page's claim is a claim about cost: greedy dead-ends for 46 nodes,
 * breadth-first brute-forces the answer for 474, MCTS finds it for 68. Those
 * are measurements, asserted in src/lib/act2search.test.ts.
 *
 * The instance was chosen (see lib/authored GAME24) so the strategies actually
 * disagree — greedy and beam-of-1 fail, everything else succeeds at very
 * different prices. The "solve with plain CoT" button is the contrast: one
 * cheap chain that commits to a good-looking first move, gets to within one
 * unused number of the answer, and cannot back out.
 *
 * Anchored to Yao et al. 2023 (data/tree-of-thoughts.json): Game of 24 with
 * GPT-4, input-output prompting 7.3%, chain-of-thought 4.0%, CoT with
 * self-consistency 9.0%, Tree-of-Thoughts 45% at b=1 rising to 74% at b=5.
 */

import { useMemo, useState } from "react";
import { CitationBadge } from "@/components/CitationBadge";
import { PageNav } from "@/components/PageNav";
import { Slider } from "@/components/Slider";
import { GAME24 } from "@/lib/authored";
import { ACTS, getPage } from "@/lib/pages";
import { curves, interpolate } from "@/lib/curves";
import { fmt, search, STRATEGIES, type SearchNode, type Strategy } from "@/lib/game24";
import { useStore } from "@/store/useStore";

const PAGE_N = 10;
const G = GAME24;

/** Nodes drawn per depth — the tree is real, the drawing is topped off. */
const DRAW_PER_DEPTH = 6;

export function Page10() {
  const page = getPage(PAGE_N)!;
  const recordInteraction = useStore((s) => s.recordInteraction);
  const data = curves.treeOfThoughts;
  const { io, cot, cotSc } = data.fit!.params;

  const [strategy, setStrategy] = useState<Strategy>("greedy");
  const [beamWidth, setBeamWidth] = useState(3);
  const [showCot, setShowCot] = useState(false);

  const trace = useMemo(
    () =>
      search([...G.numbers], G.target, strategy, {
        beamWidth,
        maxNodes: 3000,
        rollouts: 60,
      }),
    [strategy, beamWidth],
  );

  const meta = STRATEGIES.find((s) => s.key === strategy)!;
  const totAccuracy = interpolate(data, beamWidth);

  // Group the evaluated nodes by depth for the drawing: everything the searcher
  // kept, then the best-scoring of what it pruned, capped so the tree stays
  // legible. The count of what is left out is shown rather than swallowed.
  const drawn = useMemo(() => {
    const byDepth: SearchNode[][] = [[], [], [], []];
    for (const n of trace.nodes) {
      if (n.depth <= 3) byDepth[n.depth].push(n);
    }
    return byDepth.map((level, d) => {
      if (d === 0) return { shown: level, hidden: 0 };
      const kept = level.filter((n) => n.kept || n.isSolution);
      const rest = level
        .filter((n) => !n.kept && !n.isSolution)
        .sort((a, b) => b.score - a.score);
      const shown = [...kept, ...rest].slice(0, DRAW_PER_DEPTH);
      return { shown, hidden: level.length - shown.length };
    });
  }, [trace]);

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
            Real problems are not corridors, they are <strong className="text-ink">mazes</strong>:
            several moves look reasonable and you cannot tell which is which until you walk a little
            way down each. You already know the trade from job-hunting, where you can apply
            everywhere and judge later, or pour everything into two roles and start over if they
            fall through. Those bets are called{" "}
            <strong className="text-ink">breadth-first</strong> and{" "}
            <strong className="text-ink">depth-first</strong>. Give a model the same choice over its
            own partial thoughts and you get <strong className="text-ink">Tree of Thoughts</strong>:
            branch, evaluate, prune, backtrack.
          </p>

          {/* Step 1 — the live search */}
          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-semibold text-ink">
              1. Search the tree
              <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
                use {G.numbers.join(", ")} once each to make {G.target} · live search, real node
                counts
              </span>
            </h2>
            <section
              aria-label="The explorable search tree"
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

            {/* the tree */}
            <div
              className="flex flex-col gap-3 rounded-lg border border-dashed border-grid bg-surface-raised p-3"
              role="img"
              aria-label={`Search tree for the ${meta.label} strategy. It evaluated ${trace.nodesEvaluated} states and ${
                trace.solved ? "found a solution" : "did not find a solution"
              }.`}
            >
              {drawn.map((level, d) => (
                <div key={d} className="flex flex-col gap-1">
                  <p className="text-xs uppercase tracking-wide text-ink-muted">
                    {d === 0 ? "start" : `move ${d}`}
                    {d > 0 && level.hidden > 0 ? (
                      <span className="ml-2 normal-case text-ink-muted">
                        (+{level.hidden} more evaluated, not drawn)
                      </span>
                    ) : null}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {level.shown.map((node) => {
                      const onPath = trace.solutionPath.includes(node.id);
                      const dead = !node.solvable;
                      return (
                        <span
                          key={node.id}
                          title={`${node.expr ?? "start"} · evaluator score ${node.score.toFixed(2)}${
                            dead ? " · dead end" : ""
                          }`}
                          className={`flex flex-col rounded-sm border px-2 py-1 text-xs ${
                            node.isSolution
                              ? "border-correct bg-correct/25 text-correct"
                              : onPath
                                ? "border-correct bg-correct/10 text-ink"
                                : node.kept
                                  ? "border-compute bg-surface text-ink"
                                  : "border-dashed border-grid bg-surface text-ink-muted"
                          }`}
                        >
                          <span className="font-mono tabular-nums">
                            {node.nums.map(fmt).join(" ")}
                          </span>
                          <span className="flex items-center gap-1 font-mono text-[10px]">
                            <span>{node.expr ?? "root"}</span>
                          </span>
                          <span className="text-[10px]">
                            score {node.score.toFixed(2)}
                            {dead ? " · dead end" : ""}
                            {node.kept && !onPath ? " · kept" : ""}
                            {!node.kept ? " · pruned" : ""}
                          </span>
                        </span>
                      );
                    })}
                    {level.shown.length === 0 ? (
                      <span className="text-xs text-ink-muted">
                        never reached: the search stopped above this depth
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            {/* The bill, the verdict and why it went that way, in one row: all
                three answer "what did this run cost, and did it work". */}
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[auto_minmax(0,1fr)_minmax(0,1.4fr)]">
              <div className="rounded-lg border border-grid bg-surface-raised p-3">
                <p className="font-mono text-3xl font-bold tabular-nums text-compute">
                  {trace.nodesEvaluated}
                </p>
                <p className="text-xs text-ink">states scored</p>
                <p className="text-xs text-ink-muted">the compute bill</p>
              </div>
              <div
                className={`rounded-lg border-l-4 p-3 ${
                  trace.solved ? "border-correct bg-correct/15" : "border-wrong bg-wrong/15"
                }`}
              >
                {trace.solved ? (
                  <>
                    <p className="font-semibold text-correct">✓ solved</p>
                    <p className="mt-1 font-mono text-xs text-ink">
                      {trace.solutionMoves.join("  →  ")}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-wrong">✗ no solution found</p>
                    <p className="mt-1 text-xs text-ink-muted">
                      A solution exists; this strategy pruned it away. Its evaluator liked the
                      wrong branch, and it had no way back.
                    </p>
                  </>
                )}
              </div>
              <div className="rounded-lg border-l-4 border-compute bg-surface-raised p-3 text-xs text-ink">
                The evaluator is identical for every strategy, and it is <em>wrong</em> about the
                best opening move. Greedy believes it and dead-ends after{" "}
                <span className="font-mono">
                  {search([...G.numbers], G.target, "greedy", { maxNodes: 3000 }).nodesEvaluated}
                </span>{" "}
                wasted states: not too little searching, just no way to reconsider. Search is what
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
                    one chain · 1 state scored · no branching
                  </p>
                  <ol className="flex flex-col gap-1">
                    {G.plainCot.steps.map((s, i) => (
                      <li key={i} className="text-sm text-ink">
                        <span className="mr-2 font-mono text-xs text-compute">{i + 1}</span>
                        {s}
                      </li>
                    ))}
                  </ol>
                  <p className="mt-2 text-sm text-wrong">
                    ✗ {G.plainCot.answer}
                  </p>
                  <p className="mt-1 text-xs text-ink-muted">
                    The chain was not stupid; it got to within one unused number of the answer.
                    It just had no way to undo a decision it made four steps earlier. That is the
                    thing search buys, and the reason it costs more than one state.
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
              <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
                Yao et al. 2023 · Game of 24 · GPT-4
              </span>
            </h2>
          <figure className="m-0 flex flex-col gap-2 rounded-lg border-l-4 border-grid bg-surface p-4">
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
              over many chains only reaches {cotSc}%, because every chain commits to its first move.
              Searching the tree reaches <strong className="text-correct">74%</strong> at b = 5.
              Breadth-first gets there by refusing to prune anything and pays roughly six times what
              MCTS pays for the same answer. That is the trade this Act has circled throughout:
              search buys reliability with compute, and the strategy is just{" "}
              <em>where you choose to spend</em>.
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
                <strong className="text-ink">Beam</strong> at width 2. Greedy dead-ends; the beam
                finds it.
              </li>
              <li>Watch the states-scored counter as you switch. That is the compute bill.</li>
              <li>
                &ldquo;Solve with plain CoT instead&rdquo; is the contrast: one chain, one state, no
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
              Yao et al. 2023, Tree of Thoughts (Game of 24, GPT-4). The tree, scores and counter
              are a real search running in your browser, not a recording. Links at the foot.
            </p>
          </div>
        </aside>
      </div>

      <div className="flex flex-wrap gap-2">
        <CitationBadge citation={data.citation} />
      </div>
      <p className="text-xs text-ink-muted">
        the tree, the scores and the compute counter are produced by a real Game-of-24 search in
        src/lib/game24.ts, run live in your browser; every number on this page is a measurement of
        that code, and the strategy outcomes are re-asserted in the test suite · the searcher&apos;s
        evaluator is deliberately imperfect (exact for one or two remaining numbers, an eyeballed
        sum-or-product guess above that), standing in for a model&apos;s value judgement; an exact
        solver is used only to label dead ends and is never consulted by a strategy · the solve-rate
        chart is verbatim from Yao et al. 2023, &ldquo;Tree of Thoughts&rdquo; (arXiv:2305.10601,
        NeurIPS 2023): Game of 24 with GPT-4, input-output {io}%, chain-of-thought {cot}%, CoT with
        self-consistency {cotSc}%, Tree-of-Thoughts 45% at b = 1 and 74% at b = 5, with b = 2 to 4
        interpolated along the published monotonic increase
      </p>

      <PageNav n={PAGE_N} />
    </article>
  );
}
