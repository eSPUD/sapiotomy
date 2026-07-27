"use client";

/**
 * Page 10, "Searching Through Thoughts" — every tool so far has treated a
 * reasoning chain as a line. Page 7 ran many lines in parallel; page 9 learned
 * to grade a line while it is still being written. Put those together and the
 * line becomes a TREE: branch, evaluate, prune, and when a branch dies, back up
 * and try another.
 *
 * Step 1 is a live search (lib/thoughtSearch.ts) over an authored thought space
 * (THOUGHT_SPACE_SPEC in lib/authored.ts). Sixteen words must split into four
 * groups of four; a thought is one committed group, a state is the set of groups
 * committed so far, and the evaluator is the model's own confidence in how tight
 * each category sounds. Nothing is animated theatre: the strategy picker
 * genuinely re-runs the search, the tree shows the states that strategy actually
 * scored, and the counter is the real number of thoughts examined.
 *
 * The instance is tuned (see src/lib/act2thoughts.test.ts) so the strategies
 * disagree: "Flowers — ROSE LILY VIOLET IRIS" sounds tighter than the correct
 * "Flowers that are also girls' names — ROSE LILY VIOLET HEATHER", so greedy and
 * a beam of 1 or 2 commit to it and strand; a beam of 3, depth-first, MCTS and
 * breadth-first all get there, at very different prices. IRIS belongs to the eye,
 * and the failure is a positive discovery rather than an absence.
 *
 * Step 2 is anchored to Yao et al. 2023 (data/tot-crosswords.json): 5x5 mini
 * crosswords with GPT-4, Table 3. The two ablation bars are the point — turning
 * pruning off and turning backtracking off are what isolate the mechanism the
 * reader just operated, rather than merely reporting that search scored higher.
 */

import { useMemo, useState } from "react";
import { CitationBadge } from "@/components/CitationBadge";
import { PageNav } from "@/components/PageNav";
import { Slider } from "@/components/Slider";
import { THOUGHT_PLAIN_COT, THOUGHT_SPACE_SPEC } from "@/lib/authored";
import { ACTS, getPage } from "@/lib/pages";
import { curves } from "@/lib/curves";
import {
  buildThoughtSpace,
  search,
  STRATEGIES,
  type SearchNode,
  type Strategy,
  type ThoughtSpaceSpec,
} from "@/lib/thoughtSearch";
import { useStore } from "@/store/useStore";

const PAGE_N = 10;
const SPACE = buildThoughtSpace(THOUGHT_SPACE_SPEC as unknown as ThoughtSpaceSpec);

/* Tree geometry. Fixed node size and row pitch, so every connector is
   arithmetic and nothing needs to be measured in the DOM. */
const NW = 108;
const NH = 26;
const PITCH = 34;
const COL = 132;
const PAD = 14;
const HEAD = 26;
const SVG_W = PAD * 2 + COL * 4 + NW;

/** A margin note that sits beside its step and scrolls with the page. */
function Note({ kicker, children }: { kicker: string; children: React.ReactNode }) {
  return (
    <aside className="flex flex-col gap-2 text-sm text-ink-muted lg:pt-9">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{kicker}</p>
      {children}
    </aside>
  );
}

/** The evaluator's 0-5 rating, as dots. */
function Dots({ score }: { score: number }) {
  const filled = Math.round(score * 5);
  return (
    <span className="inline-flex gap-0.5" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className={`inline-block h-1.5 w-1.5 rounded-full ${
            i < filled ? "bg-compute" : "bg-grid"
          }`}
        />
      ))}
    </span>
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
    () => search(SPACE, strategy, { beamWidth, maxNodes: 400, rollouts: 80 }),
    [strategy, beamWidth],
  );

  const meta = STRATEGIES.find((s) => s.key === strategy)!;

  /* Where the search visibly ran aground. Greedy records it directly; a beam
     simply runs out of live branches, so fall back to the best dead end it
     actually kept. */
  const stranded = useMemo(() => {
    if (trace.solved) return null;
    if (trace.deadEndReached !== null) return trace.deadEndReached;
    const dead = trace.nodes
      .filter((n) => n.deadEnd && n.kept)
      .sort((a, b) => b.score - a.score);
    return dead.length ? dead[0].thoughtId : null;
  }, [trace]);

  /* Layout: one column per depth, rows in the order the searcher scored them. */
  const laid = useMemo(() => {
    const rows = new Map<number, number>();
    const pos = new Map<number, { x: number; y: number }>();
    const ordered = [...trace.nodes].sort((a, b) => a.order - b.order);
    for (const n of ordered) {
      const r = rows.get(n.depth) ?? 0;
      rows.set(n.depth, r + 1);
      pos.set(n.id, { x: PAD + n.depth * COL, y: HEAD + r * PITCH });
    }
    const maxRow = Math.max(...rows.values(), 1);
    return { pos, height: HEAD + maxRow * PITCH + PAD };
  }, [trace]);

  const byId = useMemo(() => new Map(trace.nodes.map((n) => [n.id, n])), [trace]);
  const solutionSet = useMemo(() => new Set(trace.solutionPath), [trace]);

  /** The group this node committed, relative to its parent in the trace. */
  const addedGroup = (n: SearchNode) => {
    if (n.parentId === null) return null;
    const before = SPACE.thoughts[byId.get(n.parentId)!.thoughtId].groups;
    const after = SPACE.thoughts[n.thoughtId].groups;
    const id = after.find((g) => !before.includes(g));
    return id === undefined ? null : SPACE.groups[id];
  };

  const nodeTone = (n: SearchNode) => {
    if (n.parentId === null) return { fill: "fill-ink", text: "fill-canvas" };
    if (solutionSet.has(n.id)) return { fill: "fill-correct", text: "fill-canvas" };
    if (n.deadEnd && n.kept) return { fill: "fill-wrong", text: "fill-canvas" };
    if (n.kept) return { fill: "fill-compute", text: "fill-canvas" };
    return { fill: "fill-surface-raised", text: "fill-ink-muted" };
  };

  const strandedLoose = stranded !== null ? SPACE.thoughts[stranded].loose : [];
  const strandedGroups = stranded !== null ? SPACE.thoughts[stranded].groups : [];

  const aria = trace.solved
    ? `Search tree. The ${meta.label} strategy scored ${trace.thoughtsScored} thoughts and sorted all sixteen words: ${trace.solutionGroups.map((g) => SPACE.groups[g].label).join(", ")}.`
    : `Search tree. The ${meta.label} strategy scored ${trace.thoughtsScored} thoughts and stranded, leaving ${strandedLoose.join(", ")} with nowhere to go.`;

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
        A chain of thought is a line: one idea after another, no way back. Real problems are not a
        line. Several next steps look reasonable, and you cannot tell which is which until you
        follow one a little way. Give a model the choice over its own partial thoughts and the line
        becomes a <strong className="text-ink">tree</strong>:{" "}
        <strong className="text-ink">branch, evaluate, prune, backtrack</strong>.
      </p>

      {/* Each step (left) sits beside its own note (right); the whole page scrolls. */}
      <div className="grid gap-x-8 gap-y-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
        {/* Step 1 — the live search */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">1. Sort sixteen words</h2>

          <div className="flex flex-col gap-4 rounded-lg border border-grid bg-surface p-4">
            <div>
              <p className="text-sm text-ink">{SPACE.prompt}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {SPACE.words.map((w) => (
                  <span
                    key={w}
                    className="rounded border border-grid bg-surface-raised px-2 py-1 font-mono text-xs text-ink"
                  >
                    {w}
                  </span>
                ))}
              </div>
            </div>

            {/* The seven thoughts. The reader rates them before the search does. */}
            <div className="flex flex-col gap-1.5 border-t border-dashed border-grid pt-3">
              <p className="text-xs uppercase tracking-wide text-ink-muted">
                The groupings the model proposed, and how sure it is of each
              </p>
              <ul className="flex flex-col gap-1">
                {[...SPACE.groups]
                  .sort((a, b) => b.confidence - a.confidence)
                  .map((g) => (
                    <li key={g.id} className="flex flex-wrap items-baseline gap-x-2 text-sm">
                      <Dots score={g.confidence} />
                      <span className="font-semibold text-ink">{g.label}</span>
                      <span className="font-mono text-xs text-ink">{g.words.join(" · ")}</span>
                      <span className="text-xs text-ink-muted">{g.rationale}</span>
                    </li>
                  ))}
              </ul>
            </div>

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
              className="overflow-x-auto rounded-lg border border-dashed border-grid bg-surface-raised p-2"
              role="img"
              aria-label={aria}
            >
              <svg
                viewBox={`0 0 ${SVG_W} ${laid.height}`}
                width="100%"
                className="min-w-[560px] max-w-full"
              >
                {[0, 1, 2, 3, 4].map((d) => (
                  <text
                    key={d}
                    x={PAD + d * COL}
                    y={14}
                    className="fill-ink-muted text-[9px]"
                  >
                    {d === 0 ? "start" : `${d} group${d > 1 ? "s" : ""}`}
                  </text>
                ))}

                {/* connectors */}
                {trace.nodes.map((n) => {
                  if (n.parentId === null) return null;
                  const a = laid.pos.get(n.parentId)!;
                  const b = laid.pos.get(n.id)!;
                  const x1 = a.x + NW;
                  const y1 = a.y + NH / 2;
                  const x2 = b.x;
                  const y2 = b.y + NH / 2;
                  const mid = (x1 + x2) / 2;
                  return (
                    <path
                      key={`e${n.id}`}
                      d={`M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`}
                      fill="none"
                      className={solutionSet.has(n.id) ? "stroke-correct" : "stroke-grid"}
                      strokeWidth={solutionSet.has(n.id) ? 2 : 1}
                    />
                  );
                })}

                {/* nodes */}
                {trace.nodes.map((n) => {
                  const p = laid.pos.get(n.id)!;
                  const tone = nodeTone(n);
                  const g = addedGroup(n);
                  return (
                    <g key={n.id}>
                      <rect
                        x={p.x}
                        y={p.y}
                        width={NW}
                        height={NH}
                        rx={5}
                        className={tone.fill}
                        stroke={n.kept ? "none" : "currentColor"}
                        strokeWidth={n.kept ? 0 : 1}
                        opacity={n.kept ? 1 : 0.55}
                      />
                      <text
                        x={p.x + 8}
                        y={p.y + 17}
                        className={`${tone.text} text-[10px]`}
                      >
                        {g ? g.short : "16 words"}
                      </text>
                      {n.isGoal ? (
                        <text x={p.x + NW - 8} y={p.y + 17} textAnchor="end" className="fill-canvas text-[10px]">
                          ✓
                        </text>
                      ) : n.deadEnd && n.kept ? (
                        <text x={p.x + NW - 8} y={p.y + 17} textAnchor="end" className="fill-canvas text-[10px]">
                          ✗
                        </text>
                      ) : null}
                    </g>
                  );
                })}
              </svg>

              {/* legend */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 px-1 pt-1 text-xs text-ink-muted">
                <Key className="bg-ink" label="start" />
                <Key className="bg-correct" label="the answer" />
                <Key className="bg-compute" label="kept and expanded" />
                <Key className="bg-wrong" label="dead end" />
                <Key className="border border-grid bg-surface-raised" label="pruned" />
              </div>
            </div>

            {/* The bill, the verdict, and why it went that way. */}
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[auto_minmax(0,1fr)]">
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
                className={`rounded-lg border-l-4 p-3 ${
                  trace.solved ? "border-correct bg-correct/15" : "border-wrong bg-wrong/15"
                }`}
              >
                {trace.solved ? (
                  <>
                    <p className="font-semibold text-correct">✓ all sixteen words placed</p>
                    <ol className="mt-1 flex flex-col gap-0.5">
                      {trace.solutionGroups.map((id) => (
                        <li key={id} className="text-xs text-ink">
                          <span className="font-semibold">{SPACE.groups[id].label}</span>{" "}
                          <span className="font-mono text-ink-muted">
                            {SPACE.groups[id].words.join(" · ")}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-wrong">✗ stranded</p>
                    <p className="mt-1 text-xs text-ink">
                      Committed{" "}
                      {strandedGroups.map((id, i) => (
                        <span key={id}>
                          {i > 0 ? ", then " : ""}
                          <span className="font-semibold">{SPACE.groups[id].label}</span>
                        </span>
                      ))}
                      . That leaves:
                    </p>
                    <p className="mt-1 flex flex-wrap gap-1">
                      {strandedLoose.map((w) => (
                        <span
                          key={w}
                          className="rounded border border-wrong bg-surface px-1.5 py-0.5 font-mono text-xs text-ink"
                        >
                          {w}
                        </span>
                      ))}
                    </p>
                    <p className="mt-1 text-xs text-ink-muted">
                      Four words that share nothing. Three of them are a real group missing its
                      fourth, and that fourth is already spent.
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="rounded-lg border-l-4 border-compute bg-surface-raised p-3 text-xs text-ink">
              The evaluator is identical for every strategy, and it is not stupid: it rates how{" "}
              <em>tight</em> a category sounds, and marks down anything that needs a qualifier. So
              it puts <span className="font-semibold">Flowers</span> above{" "}
              <span className="font-semibold">Flowers that are also girls&apos; names</span>, which
              is the right call on the evidence it is allowed to see. What it never checks is
              whether a group strands the words it leaves behind. Search is what makes a fallible
              evaluator survivable.
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
                    one run · 0 thoughts scored · no branching
                  </p>
                  <ol className="flex flex-col gap-1">
                    {THOUGHT_PLAIN_COT.steps.map((s, i) => (
                      <li key={i} className="text-sm text-ink">
                        <span className="mr-2 font-mono text-xs text-compute">{i + 1}</span>
                        {s}
                      </li>
                    ))}
                  </ol>
                  <p className="mt-2 text-sm text-wrong">✗ {THOUGHT_PLAIN_COT.answer}</p>
                  <p className="mt-1 text-xs text-ink-muted">
                    It was not stupid; its first three groups are the three the evaluator liked
                    best. It just had no way to undo a choice it made three steps earlier, so it
                    invented a category rather than stop. That is the thing search buys, and the
                    reason it costs more than one run.
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-6">
          <Note kicker="Try it">
            <p>Greedy first, then Beam at width 3.</p>
            <p>Watch the thoughts-scored counter change. That is the bill.</p>
          </Note>
          <Note kicker="Authored, not live">
            <p>The sixteen words, every grouping and every confidence score are written by hand.</p>
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
              You just watched the mechanism. Here it is measured, on a task nobody needs explained:
              GPT-4 filling 5&times;5 crosswords. The two middle bars are the ones that matter, because
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
              barely above no reasoning at all, because one chain commits to its first guess. Take
              the full search and switch off <strong className="text-ink">pruning</strong> and it
              drops to {totNoPrune}%. Switch off <strong className="text-ink">backtracking</strong>{" "}
              instead and it collapses to {totNoBacktrack}%, almost back to plain chain of thought.
              That is the whole argument in two bars:{" "}
              <em>
                what search buys is not more thinking, it is the ability to take a thought back
              </em>
              . It is also the more expensive half, which is the trade the rest of this act is
              about.
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
        the thought tree, the groupings and their confidence scores are authored teaching content,
        not a model transcript; the search across them, the pruning and the thoughts-scored counter
        are produced by a real search in src/lib/thoughtSearch.ts running live in your browser, and
        the outcome and cost of every strategy is re-asserted in the test suite (greedy and a beam
        of 1 score 11 thoughts and fail, a beam of 2 scores 15 and fails, a beam of 3 and MCTS each
        score 21 and succeed, depth-first 23, breadth-first 31) · the searcher&apos;s evaluator is
        the mean of its committed groups&apos; confidences, deliberately blind to what a group
        strands; a structural check labels dead ends and is never consulted by a strategy · the
        crossword chart is verbatim from Yao et al. 2023, &ldquo;Tree of Thoughts&rdquo;
        (arXiv:2305.10601, NeurIPS 2023), Table 3, word-success column: input-output {io}%, chain of
        thought {cot}%, Tree of Thoughts without backtracking {totNoBacktrack}%, without pruning{" "}
        {totNoPrune}%, full {tot}%
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
