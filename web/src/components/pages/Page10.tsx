"use client";

/**
 * Page 10, "Searching Through Thoughts". Page 7 ran many reasoning chains in
 * parallel; page 9 learned to grade a chain while it is still being written.
 * Put those together and the chain becomes a TREE: branch, evaluate, prune, and
 * when a branch dies, back up and try another.
 *
 * Step 1 is a live search (lib/thoughtSearch.ts) over an authored puzzle
 * (ACROSTIC_SPEC in lib/authored.ts, states derived in lib/crossword.ts). The
 * rule is one sentence: three answers stack, and the shaded column must read
 * down as the answer to a fourth clue. A thought is one line of the model's
 * chain — a clue it picked and the answer it wrote — and a state is the grid.
 *
 * The trap is exactly one clue. "Add up" is SUM for anybody, and the model
 * agrees; it is also wrong, because the column needs a T. Writing the best
 * answer to all three clues gives SUM/INN/PEN and a column reading SIP: a real
 * word, and not a gratuity. Measured (act2crossword.test.ts): greedy and beams
 * of 1 and 2 fail, a beam of 3 is the cheapest that works, MCTS is cheapest of
 * all, breadth-first pays double greedy.
 *
 * Step 2 is Yao et al. 2023 (data/tot-crosswords.json), 5x5 mini crosswords
 * with GPT-4, Table 3. The two ablation bars isolate the mechanism the reader
 * just operated rather than merely reporting that search scored higher.
 */

import { useMemo, useState } from "react";
import { CitationBadge } from "@/components/CitationBadge";
import { PageNav } from "@/components/PageNav";
import { Slider } from "@/components/Slider";
import { ACROSTIC_PLAIN_COT, ACROSTIC_SPEC } from "@/lib/authored";
import { ACTS, getPage } from "@/lib/pages";
import { curves } from "@/lib/curves";
import { buildAcrostic, type AcrosticSpec } from "@/lib/crossword";
import { search, STRATEGIES, type SearchNode, type Strategy } from "@/lib/thoughtSearch";
import { useStore } from "@/store/useStore";

const PAGE_N = 10;
const A = buildAcrostic(ACROSTIC_SPEC as unknown as AcrosticSpec);
const ROWS = A.spec.rows.length;

/* Tree geometry. Fixed node size and pitch, so connectors are arithmetic. */
const NW = 76;
const NH = 24;
const PITCH = 32;
const COL = 104;
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

/** The model's confidence in one answer, as dots. */
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

/** The grid: three stacked answers, with the first column shaded. */
function Grid({ words, tone }: { words: readonly (string | null)[]; tone: "plain" | "good" | "bad" }) {
  const colTone =
    tone === "good"
      ? "border-correct bg-correct/25 text-correct"
      : tone === "bad"
        ? "border-wrong bg-wrong/25 text-wrong"
        : "border-compute bg-compute/15 text-ink";
  return (
    <div className="inline-flex flex-col gap-0.5">
      {words.map((w, r) => (
        <div key={r} className="flex gap-0.5">
          {Array.from({ length: 3 }, (_, c) => (
            <div
              key={c}
              className={`flex h-8 w-8 items-center justify-center border font-mono text-sm font-semibold ${
                c === 0 ? colTone : "border-grid bg-surface-raised text-ink"
              }`}
            >
              {w ? w[c] : ""}
            </div>
          ))}
        </div>
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
  const [beamWidth, setBeamWidth] = useState(3);
  const [showCot, setShowCot] = useState(false);

  const trace = useMemo(
    () => search(A.space, strategy, { beamWidth, maxNodes: 3000, rollouts: 80 }),
    [strategy, beamWidth],
  );
  const meta = STRATEGIES.find((s) => s.key === strategy)!;

  /* Where the search ended up: the answer, or the best full grid it settled on. */
  const finalId = useMemo(() => {
    if (trace.solved) return A.space.goal;
    if (trace.deadEndReached !== null) return trace.deadEndReached;
    const dead = trace.nodes.filter((n) => n.deadEnd && n.kept).sort((a, b) => b.score - a.score);
    return dead.length ? dead[0].thoughtId : A.space.root;
  }, [trace]);
  const finalState = A.states[finalId];

  /* Kept thoughts become labelled boxes; thoughts a strategy scored and then
     dropped collapse into one "+N pruned" chip under the parent that proposed
     them, so the tree stays readable while the counter reports every thought. */
  const layout = useMemo(() => {
    const byId = new Map(trace.nodes.map((n) => [n.id, n]));
    const pruned = new Map<number, number>();
    for (const n of trace.nodes) {
      if (n.kept || n.parentId === null) continue;
      pruned.set(n.parentId, (pruned.get(n.parentId) ?? 0) + 1);
    }
    type Item =
      | { kind: "node"; key: string; depth: number; order: number; node: SearchNode }
      | { kind: "chip"; key: string; depth: number; order: number; parentId: number; count: number };
    const items: Item[] = [];
    for (const n of trace.nodes) {
      if (n.kept) items.push({ kind: "node", key: `n${n.id}`, depth: n.depth, order: n.order, node: n });
    }
    for (const [parentId, count] of pruned) {
      const p = byId.get(parentId)!;
      items.push({ kind: "chip", key: `c${parentId}`, depth: p.depth + 1, order: p.order + 0.5, parentId, count });
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
      width: PAD * 2 + maxDepth * COL + NW,
      height: HEAD + Math.max(...rows.values(), 1) * PITCH + PAD,
    };
  }, [trace]);

  const solutionSet = useMemo(() => new Set(trace.solutionPath), [trace]);
  const byNodeId = useMemo(() => new Map(trace.nodes.map((n) => [n.id, n])), [trace]);

  /* The answer THIS node wrote. Grids are deduplicated, so `placed` records
     whichever write first reached the grid, which is not necessarily the write
     on this branch — diff against the parent instead. */
  const wordOf = (n: SearchNode) => {
    if (n.parentId === null) return "empty";
    const before = A.states[byNodeId.get(n.parentId)!.thoughtId].words;
    const after = A.states[n.thoughtId].words;
    const i = after.findIndex((w, k) => w !== before[k]);
    return i >= 0 ? after[i]! : "";
  };

  const colText = A.columnText(finalState);
  const aria = trace.solved
    ? `Search tree. The ${meta.label} strategy scored ${trace.thoughtsScored} thoughts and finished the puzzle.`
    : `Search tree. The ${meta.label} strategy scored ${trace.thoughtsScored} thoughts and ended with a shaded column reading ${colText}, which does not answer the clue.`;

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
        A chain of thought is a line: one thought after another, no way back. That is fine until a
        thought that looked right turns out to have ruled out the answer. Let the model branch
        instead, keep several partial answers alive and score them as it goes, and the line becomes
        a <strong className="text-ink">tree</strong>:{" "}
        <strong className="text-ink">branch, evaluate, prune, backtrack</strong>.
      </p>

      <div className="grid gap-x-8 gap-y-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
        {/* Step 1 — the live search */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">1. Fill in three answers</h2>

          <div className="flex flex-col gap-4 rounded-lg border border-grid bg-surface p-4">
            <p className="text-ink">
              Three answers stack. The <strong>shaded column</strong> then has to read downward as
              the answer to a fourth clue. That is the whole rule.
            </p>

            <div className="flex flex-wrap items-start gap-6">
              <div className="flex shrink-0 flex-col gap-1">
                <Grid words={[null, null, null]} tone="plain" />
                <p className="text-xs text-ink-muted">
                  shaded column: <span className="text-ink">{A.spec.down.clue}</span>
                </p>
              </div>
              <ul className="flex min-w-0 flex-1 flex-col gap-2">
                {A.spec.rows.map((r) => (
                  <li key={r.n} className="flex flex-col gap-0.5">
                    <span className="text-sm text-ink">
                      <span className="mr-2 font-mono text-xs text-ink-muted">{r.n}</span>
                      {r.clue}
                    </span>
                    {[...r.candidates]
                      .sort((a, b) => b.confidence - a.confidence)
                      .map((c) => (
                        <span key={c.word} className="flex flex-wrap items-baseline gap-2 pl-6 text-sm">
                          <Dots score={c.confidence} />
                          <span className="font-mono font-semibold text-ink">{c.word}</span>
                          <span className="text-xs text-ink-muted">{c.note}</span>
                        </span>
                      ))}
                  </li>
                ))}
              </ul>
            </div>

            <p className="rounded border-l-4 border-compute bg-surface-raised p-3 text-sm text-ink">
              The dots are how sure the model is that an answer fits <em>its own clue</em>. That is
              the only thing it judges. It does not look at the shaded column until the grid is
              full, which is exactly what a chain of thought does: it writes the best next thing and
              finds out later.
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
              className="max-h-[26rem] overflow-auto rounded-lg border border-dashed border-grid bg-surface-raised p-2"
              role="img"
              aria-label={aria}
            >
              <svg
                viewBox={`0 0 ${layout.width} ${layout.height}`}
                width={layout.width}
                height={layout.height}
                className="max-w-none"
              >
                {Array.from({ length: ROWS + 1 }, (_, d) => (
                  <text key={d} x={PAD + d * COL} y={12} className="fill-ink-muted text-[9px]">
                    {d === 0 ? "start" : `${d} written`}
                  </text>
                ))}

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
                        <text x={p.x + NW / 2} y={p.y + 16} textAnchor="middle" className="fill-ink-muted text-[9px]">
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
                      <text x={p.x + 8} y={p.y + 16} className="fill-canvas text-[10px]">
                        {wordOf(n)}
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
              <Key className="bg-wrong" label="column reads wrong" />
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
                className={`flex flex-wrap items-center gap-4 rounded-lg border-l-4 p-3 ${
                  trace.solved ? "border-correct bg-correct/15" : "border-wrong bg-wrong/15"
                }`}
              >
                <Grid words={finalState.words} tone={trace.solved ? "good" : "bad"} />
                <div className="min-w-0 flex-1">
                  {trace.solved ? (
                    <>
                      <p className="font-semibold text-correct">
                        ✓ the column reads {colText}
                      </p>
                      <p className="mt-1 text-sm text-ink">
                        &ldquo;{A.spec.down.clue}&rdquo; is {A.spec.down.answer}.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-wrong">
                        ✗ the column reads {colText}
                      </p>
                      <p className="mt-1 text-sm text-ink">
                        {colText} is a word. The clue asked for a{" "}
                        {A.spec.down.clue.toLowerCase()}.
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
                    {ACROSTIC_PLAIN_COT.steps.map((s, i) => (
                      <li key={i} className="text-sm text-ink">
                        <span className="mr-2 font-mono text-xs text-compute">{i + 1}</span>
                        {s}
                      </li>
                    ))}
                  </ol>
                  <p className="mt-2 text-sm text-wrong">✗ {ACROSTIC_PLAIN_COT.answer}</p>
                  <p className="mt-1 text-xs text-ink-muted">
                    This is greedy with the scoring taken away, and it lands in the same grid,
                    because greedy is a chain of thought that keeps score. Neither can undo SUM.
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-6">
          <Note kicker="Try it">
            <p>Greedy first, then Beam at width 3.</p>
            <p>Watch the counter. That is the bill.</p>
          </Note>
          <Note kicker="Authored, not live">
            <p>The puzzle and its confidence scores are written by hand.</p>
            <p>The search over them is real.</p>
          </Note>
        </div>

        {/* Step 2 — what search buys */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">2. What search buys</h2>
          <figure className="m-0 flex flex-col gap-2 rounded-lg border border-grid bg-surface p-4">
            <p className="text-sm text-ink-muted">
              You just did three clues by hand. Here is GPT-4 on a 5&times;5 crossword, with and
              without the ability to back up. The two middle bars are the ones that matter, because
              they take the same search apart one piece at a time.
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
              <strong className="text-ink">pruning</strong> and it drops to {totNoPrune}%. Switch
              off <strong className="text-ink">backtracking</strong> instead and it collapses to{" "}
              {totNoBacktrack}%, almost back to plain chain of thought. That is the whole argument in
              two bars:{" "}
              <em>what search buys is not more thinking, it is the ability to take a thought back</em>
              . It is also the more expensive half, which is the trade the rest of this act is about.
            </p>
          </figure>
        </section>

        <Note kicker="References">
          <p>
            Yao et al. 2023, <em>Tree of Thoughts</em> (NeurIPS 2023), Table 3 &mdash; 20 puzzles.
          </p>
        </Note>
      </div>

      <div className="flex flex-wrap gap-2">
        <CitationBadge citation={cross.citation} />
      </div>
      <p className="text-xs text-ink-muted">
        Every count above is measured from the search running in your browser, and pinned in the
        test suite.
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
