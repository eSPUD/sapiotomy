"use client";

/**
 * Page 10, "Searching Through Thoughts". Page 7 ran many reasoning chains in
 * parallel; page 9 learned to grade a chain while it is still being written.
 * Put those together and the chain becomes a TREE: branch, evaluate, prune, and
 * when a branch dies, back up and try another.
 *
 * Step 1 is a live search (lib/thoughtSearch.ts) over an authored mini crossword
 * (CROSSWORD_SPEC in lib/authored.ts, lattice derived in lib/crossword.ts). A
 * THOUGHT is one line of the model's chain — "1-Across, 'Bottle top' — LID" —
 * so it is a pair of (which clue to answer next, which answer to write), and a
 * STATE is the grid so far. Nothing is animated theatre: the strategy picker
 * genuinely re-runs the search and the counter is the real number of thoughts
 * scored.
 *
 * The instance is tuned (see src/lib/act2crossword.test.ts) so the strategies
 * disagree: LID is the model's most confident answer anywhere on the board, and
 * it jams the grid. Greedy and beams of 1 to 3 commit to it and fail; a beam of
 * 4, depth-first, MCTS and breadth-first all finish, at very different prices.
 *
 * Step 2 is anchored to Yao et al. 2023 (data/tot-crosswords.json): 5x5 mini
 * crosswords with GPT-4, Table 3. Figure 1 is the same task one size down, so
 * the handoff is direct — and the two ablation bars isolate the mechanism the
 * reader just operated rather than merely reporting that search scored higher.
 */

import { Fragment, useMemo, useState } from "react";
import { CitationBadge } from "@/components/CitationBadge";
import { PageNav } from "@/components/PageNav";
import { Slider } from "@/components/Slider";
import { CROSSWORD_PLAIN_COT, CROSSWORD_SPEC } from "@/lib/authored";
import { ACTS, getPage } from "@/lib/pages";
import { curves } from "@/lib/curves";
import { buildCrossword, type CrosswordSpec, type EntrySpec } from "@/lib/crossword";
import { search, STRATEGIES, type SearchNode, type Strategy } from "@/lib/thoughtSearch";
import { useStore } from "@/store/useStore";

const PAGE_N = 10;
const XW = buildCrossword(CROSSWORD_SPEC as unknown as CrosswordSpec);
const N = XW.spec.size;

/* Tree geometry. Fixed node size and row pitch, so every connector is
   arithmetic and nothing needs measuring in the DOM. */
const NW = 84;
const NH = 24;
const PITCH = 32;
const COL = 108;
const PAD = 10;
const HEAD = 22;

/** A margin note that sits beside its step and scrolls with the page. */
function Note({ kicker, children }: { kicker: string; children: React.ReactNode }) {
  return (
    <aside className="flex flex-col gap-2 text-sm text-ink-muted lg:pt-9">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{kicker}</p>
      {children}
    </aside>
  );
}

/** The model's confidence, as dots. */
function Dots({ score }: { score: number }) {
  const filled = Math.round(score * 5);
  return (
    <span className="inline-flex gap-0.5" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className={`inline-block h-1.5 w-1.5 rounded-full ${i < filled ? "bg-compute" : "bg-grid"}`}
        />
      ))}
    </span>
  );
}

/**
 * The grid, with the cells of any clue-breaking entry called out. `labelled`
 * adds the entry names down the side and across the top, so "1A" and "2D" mean
 * something before the reader reaches the clue list.
 */
function Grid({
  cells,
  broken,
  labelled = false,
}: {
  cells: readonly (string | null)[];
  broken: Set<number>;
  labelled?: boolean;
}) {
  const cell = (c: string | null, i: number) => (
    <div
      key={i}
      className={`flex h-8 w-8 items-center justify-center border font-mono text-sm ${
        broken.has(i)
          ? "border-wrong bg-wrong/20 font-semibold text-wrong"
          : c
            ? "border-grid bg-surface-raised text-ink"
            : "border-grid bg-canvas text-ink-muted"
      }`}
    >
      {c ?? ""}
    </div>
  );

  if (!labelled) {
    return (
      <div className="inline-grid gap-0.5" style={{ gridTemplateColumns: `repeat(${N}, 2rem)` }}>
        {cells.map(cell)}
      </div>
    );
  }

  return (
    <div
      className="inline-grid gap-0.5"
      style={{ gridTemplateColumns: `1.75rem repeat(${N}, 2rem)` }}
    >
      <div aria-hidden="true" />
      {Array.from({ length: N }, (_, c) => (
        <div key={`d${c}`} className="text-center font-mono text-[10px] text-ink-muted">
          {c + 1}D
        </div>
      ))}
      {Array.from({ length: N }, (_, r) => (
        <Fragment key={`r${r}`}>
          <div className="flex h-8 items-center justify-end pr-1 font-mono text-[10px] text-ink-muted">
            {r + 1}A
          </div>
          {cells.slice(r * N, r * N + N).map((c, k) => cell(c, r * N + k))}
        </Fragment>
      ))}
    </div>
  );
}

export function Page10() {
  const page = getPage(PAGE_N)!;
  const recordInteraction = useStore((s) => s.recordInteraction);
  const cross = curves.totCrosswords;
  const { io, cot, totNoBacktrack, totNoPrune, tot } = cross.fit!.params;

  const [strategy, setStrategy] = useState<Strategy>("greedy");
  const [beamWidth, setBeamWidth] = useState(4);
  const [showCot, setShowCot] = useState(false);

  const trace = useMemo(
    () => search(XW.space, strategy, { beamWidth, maxNodes: 3000, rollouts: 80 }),
    [strategy, beamWidth],
  );
  const meta = STRATEGIES.find((s) => s.key === strategy)!;
  const entryById = useMemo(
    () => new Map(XW.spec.entries.map((e) => [e.id, e as EntrySpec])),
    [],
  );

  /* Where the search ended up: the solution, or the best dead end it kept. */
  const finalStateId = useMemo(() => {
    if (trace.solved) return XW.space.goal;
    if (trace.deadEndReached !== null) return trace.deadEndReached;
    const dead = trace.nodes.filter((n) => n.deadEnd && n.kept).sort((a, b) => b.score - a.score);
    return dead.length ? dead[0].thoughtId : XW.space.root;
  }, [trace]);

  const finalState = XW.states[finalStateId];
  const broken = XW.brokenEntries(finalState);
  const brokenCells = useMemo(() => {
    const s = new Set<number>();
    for (const e of broken) {
      for (let k = 0; k < N; k++) {
        s.add(e.dir === "across" ? e.index * N + k : k * N + e.index);
      }
    }
    return s;
  }, [broken]);

  /* Layout: kept thoughts become labelled boxes; the thoughts a strategy scored
     and then discarded are summarised as one "+N pruned" chip under the parent
     that proposed them, so the tree stays readable while the counter above it
     still reports every thought paid for. */
  const layout = useMemo(() => {
    const byId = new Map(trace.nodes.map((n) => [n.id, n]));
    const prunedByParent = new Map<number, number>();
    for (const n of trace.nodes) {
      if (n.kept || n.parentId === null) continue;
      prunedByParent.set(n.parentId, (prunedByParent.get(n.parentId) ?? 0) + 1);
    }
    type Item =
      | { kind: "node"; key: string; depth: number; order: number; node: SearchNode }
      | { kind: "chip"; key: string; depth: number; order: number; parentId: number; count: number };
    const items: Item[] = [];
    for (const n of trace.nodes) {
      if (n.kept) items.push({ kind: "node", key: `n${n.id}`, depth: n.depth, order: n.order, node: n });
    }
    for (const [parentId, count] of prunedByParent) {
      const p = byId.get(parentId)!;
      items.push({
        kind: "chip",
        key: `c${parentId}`,
        depth: p.depth + 1,
        order: p.order + 0.5,
        parentId,
        count,
      });
    }
    items.sort((a, b) => a.depth - b.depth || a.order - b.order);
    const rows = new Map<number, number>();
    const pos = new Map<string, { x: number; y: number }>();
    for (const it of items) {
      const r = rows.get(it.depth) ?? 0;
      rows.set(it.depth, r + 1);
      pos.set(it.key, { x: PAD + it.depth * COL, y: HEAD + r * PITCH });
    }
    const maxDepth = Math.max(...items.map((i) => i.depth), 0);
    return {
      items,
      pos,
      byId,
      width: PAD * 2 + maxDepth * COL + NW,
      height: HEAD + Math.max(...rows.values(), 1) * PITCH + PAD,
    };
  }, [trace]);

  const solutionSet = useMemo(() => new Set(trace.solutionPath), [trace]);

  /** The chain-of-thought line a node represents. */
  const lineOf = (n: SearchNode) => {
    const p = XW.states[n.thoughtId].placed;
    if (!p) return "the empty grid";
    const e = entryById.get(p.entryId)!;
    return `${p.entryId}, "${e.clue}" — ${p.word}`;
  };
  const labelOf = (n: SearchNode) => {
    const p = XW.states[n.thoughtId].placed;
    return p ? `${p.entryId} ${p.word}` : "empty";
  };

  const committed = trace.solved
    ? trace.solutionThoughts.slice(1).map((id) => XW.states[id].placed!)
    : [];

  const aria = trace.solved
    ? `Search tree. The ${meta.label} strategy scored ${trace.thoughtsScored} thoughts and finished the grid.`
    : `Search tree. The ${meta.label} strategy scored ${trace.thoughtsScored} thoughts and jammed, leaving ${broken.map((e) => `${e.id} reading ${XW.readEntry(finalState, e).join("")}`).join(", ")}.`;

  const bars = [
    { label: "Input-output prompting", value: io, tone: "bg-grid" },
    { label: "Chain of thought", value: cot, tone: "bg-grid" },
    { label: "Tree of Thoughts, no backtracking", value: totNoBacktrack, tone: "bg-wrong" },
    { label: "Tree of Thoughts, no pruning", value: totNoPrune, tone: "bg-compute" },
    { label: "Tree of Thoughts, full", value: tot, tone: "bg-correct" },
  ];

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
        A chain of thought is a line: one thought after another, each written on top of the last,
        with no way back. That is fine until a thought that looked right turns out to have ruled
        out the answer. Let the model branch instead, keep several partial answers alive and score
        them as it goes, and the line becomes a <strong className="text-ink">tree</strong>:{" "}
        <strong className="text-ink">branch, evaluate, prune, backtrack</strong>.
      </p>

      {/* Each step (left) sits beside its own note (right); the whole page scrolls. */}
      <div className="grid gap-x-8 gap-y-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
        {/* Step 1 — the live search */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">1. Solve a mini crossword</h2>

          <div className="flex flex-col gap-4 rounded-lg border border-grid bg-surface p-4">
            <p className="text-sm text-ink-muted">
              Every thought below is one line of the model&apos;s chain: a clue it picked, and the
              answer it wrote. It can answer the clues in any order, and it checks each answer
              against the letters already on the grid.
            </p>

            {/* The clues, and what the model would write for each. */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-6">
              <div className="shrink-0">
                <Grid cells={XW.states[XW.space.root].cells} broken={new Set()} labelled />
              </div>
              <ul className="flex min-w-0 flex-col gap-1">
                {XW.spec.entries.map((e) => (
                  <li key={e.id} className="flex flex-wrap items-baseline gap-x-2 text-sm">
                    <span className="w-8 shrink-0 font-mono text-xs text-ink-muted">{e.id}</span>
                    <span className="text-ink">{e.clue}</span>
                    {e.candidates.map((c) => (
                      <span key={c.word} className="inline-flex items-baseline gap-1">
                        <Dots score={c.confidence} />
                        <span className="font-mono text-xs font-semibold text-ink">{c.word}</span>
                      </span>
                    ))}
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-xs text-ink-muted">
              The dots are the model&apos;s confidence in each answer. It is the same evaluator for
              every strategy, and it is not stupid: <span className="font-mono">LID</span> really is
              the better answer to &ldquo;Bottle top&rdquo;, and{" "}
              <span className="font-mono">BED</span> to &ldquo;Camp bed&rdquo;. What it never checks
              is what an answer does to the clues it crosses.
            </p>

            {/* strategy picker */}
            <div className="flex flex-col gap-2 border-t border-dashed border-grid pt-3">
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
              className="max-h-[28rem] overflow-auto rounded-lg border border-dashed border-grid bg-surface-raised p-2"
              role="img"
              aria-label={aria}
            >
              <svg
                viewBox={`0 0 ${layout.width} ${layout.height}`}
                width={layout.width}
                height={layout.height}
                className="max-w-none"
              >
                {Array.from({ length: Math.round((layout.width - PAD * 2 - NW) / COL) + 1 }, (_, d) => (
                  <text key={d} x={PAD + d * COL} y={12} className="fill-ink-muted text-[9px]">
                    {d === 0 ? "start" : `${d} written`}
                  </text>
                ))}

                {/* connectors */}
                {layout.items.map((it) => {
                  const parentId = it.kind === "node" ? it.node.parentId : it.parentId;
                  if (parentId === null) return null;
                  const a = layout.pos.get(`n${parentId}`);
                  const b = layout.pos.get(it.key);
                  if (!a || !b) return null;
                  const x1 = a.x + NW;
                  const y1 = a.y + NH / 2;
                  const x2 = b.x;
                  const y2 = b.y + NH / 2;
                  const mid = (x1 + x2) / 2;
                  const onPath = it.kind === "node" && solutionSet.has(it.node.id);
                  return (
                    <path
                      key={`e${it.key}`}
                      d={`M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`}
                      fill="none"
                      className={onPath ? "stroke-correct" : "stroke-grid"}
                      strokeWidth={onPath ? 2 : 1}
                    />
                  );
                })}

                {/* nodes and pruned-summary chips */}
                {layout.items.map((it) => {
                  const p = layout.pos.get(it.key)!;
                  if (it.kind === "chip") {
                    return (
                      <g key={it.key}>
                        <rect
                          x={p.x}
                          y={p.y + 4}
                          width={NW}
                          height={NH - 8}
                          rx={8}
                          className="fill-surface stroke-grid"
                          strokeWidth={1}
                          strokeDasharray="3 2"
                        />
                        <text
                          x={p.x + NW / 2}
                          y={p.y + 16}
                          textAnchor="middle"
                          className="fill-ink-muted text-[9px]"
                        >
                          +{it.count} pruned
                        </text>
                      </g>
                    );
                  }
                  const n = it.node;
                  const tone =
                    n.parentId === null
                      ? "fill-ink"
                      : solutionSet.has(n.id)
                        ? "fill-correct"
                        : n.deadEnd
                          ? "fill-wrong"
                          : "fill-compute";
                  return (
                    <g key={it.key}>
                      <rect x={p.x} y={p.y} width={NW} height={NH} rx={5} className={tone} />
                      <text x={p.x + 7} y={p.y + 16} className="fill-canvas text-[10px]">
                        {labelOf(n)}
                      </text>
                      {n.isGoal ? (
                        <text x={p.x + NW - 7} y={p.y + 16} textAnchor="end" className="fill-canvas text-[10px]">
                          ✓
                        </text>
                      ) : n.deadEnd ? (
                        <text x={p.x + NW - 7} y={p.y + 16} textAnchor="end" className="fill-canvas text-[10px]">
                          ✗
                        </text>
                      ) : null}
                    </g>
                  );
                })}
              </svg>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
              <Key className="bg-ink" label="start" />
              <Key className="bg-correct" label="the answer" />
              <Key className="bg-compute" label="kept and expanded" />
              <Key className="bg-wrong" label="jammed" />
              <Key className="border border-dashed border-grid bg-surface" label="scored, then dropped" />
            </div>

            {/* The bill and the verdict. */}
            <div className="grid gap-2 sm:grid-cols-[auto_minmax(0,1fr)]">
              <div
                className="rounded-lg border border-grid bg-surface-raised p-3"
                role="status"
                aria-label={`The compute bill: ${trace.thoughtsScored} thoughts scored`}
              >
                <p className="font-mono text-3xl font-bold tabular-nums text-compute">
                  {trace.thoughtsScored}
                </p>
                <p className="text-xs text-ink">thoughts scored</p>
                <p className="text-xs text-ink-muted">the compute bill</p>
              </div>
              <div
                className={`flex flex-wrap items-start gap-4 rounded-lg border-l-4 p-3 ${
                  trace.solved ? "border-correct bg-correct/15" : "border-wrong bg-wrong/15"
                }`}
              >
                <Grid cells={finalState.cells} broken={brokenCells} />
                <div className="min-w-0 flex-1">
                  {trace.solved ? (
                    <>
                      <p className="font-semibold text-correct">✓ every clue answered</p>
                      <p className="mt-1 font-mono text-xs text-ink">
                        {committed.map((p) => `${p.entryId} ${p.word}`).join("  →  ")}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-wrong">✗ jammed</p>
                      <ul className="mt-1 flex flex-col gap-0.5">
                        {broken.map((e) => (
                          <li key={e.id} className="text-xs text-ink">
                            <span className="font-mono font-semibold">{e.id}</span> reads{" "}
                            <span className="font-mono font-semibold text-wrong">
                              {XW.readEntry(finalState, e).join("")}
                            </span>
                            . The clue is &ldquo;{e.clue}&rdquo;.
                          </li>
                        ))}
                      </ul>
                      <p className="mt-1 text-xs text-ink-muted">
                        Real words, every one. None of them answers its clue, and the grid is full,
                        so there is nothing left to write.
                      </p>
                    </>
                  )}
                </div>
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
                    one run · nothing scored · no branching
                  </p>
                  <ol className="flex flex-col gap-1">
                    {CROSSWORD_PLAIN_COT.steps.map((s, i) => (
                      <li key={i} className="text-sm text-ink">
                        <span className="mr-2 font-mono text-xs text-compute">{i + 1}</span>
                        {s}
                      </li>
                    ))}
                  </ol>
                  <p className="mt-2 text-sm text-wrong">✗ {CROSSWORD_PLAIN_COT.answer}</p>
                  <p className="mt-1 text-xs text-ink-muted">
                    This is the greedy run with the scoring taken away, and it lands in the same
                    place, because greedy is a chain of thought that keeps score. The chain cannot
                    undo <span className="font-mono">LID</span>, so it talks itself into the grid it
                    has. That is what search buys, and the reason it costs more than one run.
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-6">
          <Note kicker="Try it">
            <p>Greedy first, then Beam at width 4.</p>
            <p>Watch the thoughts-scored counter change. That is the bill.</p>
          </Note>
          <Note kicker="Authored, not live">
            <p>The grid, the clues and every confidence score are written by hand.</p>
            <p>
              The search over them is real: the picker re-runs it, and the counter is the true
              number of thoughts scored.
            </p>
            <p>
              Asked to do this live, a model recites a search algorithm it read in training, which
              is the one thing this figure is not about.
            </p>
          </Note>
        </div>

        {/* Step 2 — what search buys */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">2. What search buys</h2>
          <figure className="m-0 flex flex-col gap-2 rounded-lg border border-grid bg-surface p-4">
            <p className="text-sm text-ink-muted">
              You just did the 3&times;3 by hand. Here is GPT-4 on the 5&times;5, with and without the
              ability to back up. The two middle bars are the ones that matter, because they take
              the same search apart one piece at a time.
            </p>
            <div
              className="flex flex-col gap-2"
              role="img"
              aria-label={`Percentage of crossword words filled correctly by GPT-4: input-output prompting ${io} percent, chain of thought ${cot} percent, Tree of Thoughts without backtracking ${totNoBacktrack} percent, Tree of Thoughts without pruning ${totNoPrune} percent, full Tree of Thoughts ${tot} percent.`}
            >
              {bars.map((b) => (
                <div key={b.label} className="flex items-center gap-2 text-sm">
                  <span className="w-48 shrink-0 text-ink-muted">{b.label}</span>
                  <div className="h-5 flex-1 rounded bg-surface-raised">
                    <div className={`h-5 rounded ${b.tone}`} style={{ width: `${b.value}%` }} />
                  </div>
                  <span className="w-12 shrink-0 text-right font-mono tabular-nums text-ink">
                    {b.value.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
            <p className="text-sm text-ink-muted">
              Chain of thought fills <strong className="text-ink">{cot}%</strong> of the words,
              barely above no reasoning at all, because one chain commits to its first answer just
              as yours did. Take the full search and switch off{" "}
              <strong className="text-ink">pruning</strong> and it drops to {totNoPrune}%. Switch off{" "}
              <strong className="text-ink">backtracking</strong> instead and it collapses to{" "}
              {totNoBacktrack}%, almost back to plain chain of thought. That is the whole argument in
              two bars:{" "}
              <em>what search buys is not more thinking, it is the ability to take a thought back</em>
              . It is also the more expensive half, which is the trade the rest of this act is about.
            </p>
          </figure>
        </section>

        <Note kicker="References">
          <p>
            Yao et al. 2023, <em>Tree of Thoughts</em> (NeurIPS 2023), Table 3 &mdash; 5&times;5 mini
            crosswords, GPT-4.
          </p>
          <p>
            Bars are the percentage of words filled correctly, over 20 puzzles. At whole-puzzle
            level the same run solves 4 of 20, against 0 for input-output prompting.
          </p>
        </Note>
      </div>

      <div className="flex flex-wrap gap-2">
        <CitationBadge citation={cross.citation} />
      </div>
      <p className="text-xs text-ink-muted">
        the grid, the clues, the candidate answers and their confidence scores are authored teaching
        content, not a model transcript; the search across them, the pruning and the thoughts-scored
        counter are produced by a real search in src/lib/thoughtSearch.ts running live in your
        browser, and the outcome and cost of every strategy is re-asserted in the test suite (greedy
        and a beam of 1 score 16 thoughts and fail, a beam of 2 scores 19 and fails, a beam of 3
        scores 26 and fails, a beam of 4 scores 35 and succeeds, MCTS 30, depth-first 31,
        breadth-first 48) · a thought is one clue answered, the model may answer the clues in any
        order, and it checks a candidate only against the letters already on the grid — never
        against what that answer forecloses, which is the whole point · the tree draws the thoughts
        a strategy kept and summarises the ones it scored and dropped as &ldquo;+N pruned&rdquo;, so
        the counter is always the larger number · the crossword chart is verbatim from Yao et al.
        2023, &ldquo;Tree of Thoughts&rdquo; (arXiv:2305.10601, NeurIPS 2023), Table 3, word-success
        column: input-output {io}%, chain of thought {cot}%, Tree of Thoughts without backtracking{" "}
        {totNoBacktrack}%, without pruning {totNoPrune}%, full {tot}%
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
