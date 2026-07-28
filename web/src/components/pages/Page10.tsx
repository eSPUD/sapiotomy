"use client";

/**
 * Page 10, "Searching Through Thoughts", as a next-word predictor.
 *
 * This is the thing a language model actually is: at every position it has a
 * few words it thinks might come next, each with a probability, and it picks
 * one. Take the likeliest word every time and you are doing greedy decoding,
 * which is a chain of thought with no way back. Keep several partial lines
 * alive and you are searching a tree of thoughts.
 *
 * The algorithm is on screen but is not the subject. There is no strategy
 * dropdown: the single dial is HOW MANY LINES IT KEEPS ALIVE, and 1 is greedy.
 * That is beam search, which is what Tree-of-Thoughts does at each level, and
 * it is the only control a reader needs to feel the trade.
 *
 * The figure is split in three:
 *   1. YOU write the line, tapping a word at a time. Take the top suggestion
 *      every time — as everyone does with autocomplete — and you get the
 *      likeliest line, which does not rhyme.
 *   2. THE MODEL writes it, with the keep-alive dial and the tree.
 *   3. WHAT SEARCH BUYS, measured — Yao et al. 2023.
 *
 * Authored distributions in NEXT_WORD_SPEC (lib/authored.ts), states derived in
 * lib/nextWord.ts, search in lib/thoughtSearch.ts. Measured and pinned in
 * act2nextword.test.ts: keeping 1 line scores 12 words and cannot rhyme;
 * keeping 2 scores 19 and finds "so I turned on the light".
 */

import { useMemo, useState } from "react";
import { CitationBadge } from "@/components/CitationBadge";
import { PageNav } from "@/components/PageNav";
import { Slider } from "@/components/Slider";
import { NEXT_WORD_SPEC } from "@/lib/authored";
import { ACTS, getPage } from "@/lib/pages";
import { curves } from "@/lib/curves";
import { buildNextWord, type NextWordSpec } from "@/lib/nextWord";
import { search, STRATEGIES, type SearchNode, type Strategy } from "@/lib/thoughtSearch";
import { useStore } from "@/store/useStore";

const PAGE_N = 10;
const NW_ = buildNextWord(NEXT_WORD_SPEC as unknown as NextWordSpec);
const SPEC = NW_.spec;

/* Tree geometry: fixed node size and pitch, so connectors are arithmetic. */
const NODE_W = 108;
const NODE_H = 24;
const PITCH = 32;
const COL = 136;
const PAD = 10;
const HEAD = 22;

const pct = (p: number) => `${Math.round(p * 100)}%`;

/** A margin note that sits beside its step and scrolls with the page. */
function Note({ kicker, children }: { kicker: string; children: React.ReactNode }) {
  return (
    <aside className="flex flex-col gap-2 text-sm text-ink-muted lg:pt-9">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{kicker}</p>
      {children}
    </aside>
  );
}

/** The couplet as written so far. */
function Line({
  words,
  tone,
}: {
  words: readonly string[];
  tone: "plain" | "good" | "bad";
}) {
  const last =
    tone === "good" ? "text-correct" : tone === "bad" ? "text-wrong" : "text-ink";
  return (
    <div className="flex flex-col gap-1">
      <p className="text-lg italic text-ink-muted">{SPEC.given}</p>
      <p className="text-lg text-ink">
        <span className="italic">{SPEC.lead}</span>{" "}
        {words.map((w, i) => (
          <span
            key={i}
            className={`italic ${i === SPEC.length - 1 ? `font-semibold ${last}` : ""}`}
          >
            {w}{" "}
          </span>
        ))}
        {Array.from({ length: SPEC.length - words.length }, (_, i) => (
          <span key={`b${i}`} className="text-ink-muted">
            ___{" "}
          </span>
        ))}
      </p>
    </div>
  );
}

export function Page10() {
  const page = getPage(PAGE_N)!;
  const recordInteraction = useStore((s) => s.recordInteraction);
  const cross = curves.totCrosswords;
  const { io, cot, totNoBacktrack, totNoPrune, tot } = cross.fit!.params;

  // Step 1 — the reader taps words.
  const [myState, setMyState] = useState(NW_.space.root);
  // Step 2 — which search, and for beam, how many lines it keeps alive.
  const [strategy, setStrategy] = useState<Strategy>("greedy");
  const [keep, setKeep] = useState(2);

  const mine = NW_.states[myState];
  const myChoices = NW_.choices(mine);
  const myDone = mine.words.length === SPEC.length;

  const trace = useMemo(
    () => search(NW_.space, strategy, { beamWidth: keep, maxNodes: 3000, rollouts: 80 }),
    [strategy, keep],
  );
  const meta = STRATEGIES.find((s) => s.key === strategy)!;

  /* Every line this run actually finished, likeliest first. Reading these is
     the point: they are sentences, not nodes. */
  const finishedLines = useMemo(() => {
    const seen = new Set<number>();
    return trace.nodes
      .filter((n) => {
        const st = NW_.states[n.thoughtId];
        if (st.words.length !== SPEC.length || seen.has(n.thoughtId)) return false;
        seen.add(n.thoughtId);
        return true;
      })
      .map((n) => NW_.states[n.thoughtId])
      .sort((a, b) => b.probability - a.probability);
  }, [trace]);

  /* Where the model ended up: the rhyming line, or the likeliest one it kept. */
  const endId = useMemo(() => {
    if (trace.solved) return trace.solutionThoughts.at(-1)!;
    const finished = trace.nodes
      .filter((n) => NW_.states[n.thoughtId].words.length === SPEC.length)
      .sort((a, b) => b.score - a.score);
    return finished.length ? finished[0].thoughtId : NW_.space.root;
  }, [trace]);
  const modelLine = NW_.states[endId];

  const layout = useMemo(() => {
    const byId = new Map(trace.nodes.map((n) => [n.id, n]));
    const dropped = new Map<number, number>();
    for (const n of trace.nodes) {
      if (n.kept || n.parentId === null) continue;
      dropped.set(n.parentId, (dropped.get(n.parentId) ?? 0) + 1);
    }
    type Item =
      | { kind: "node"; key: string; depth: number; order: number; node: SearchNode }
      | { kind: "chip"; key: string; depth: number; order: number; parentId: number; count: number };
    const items: Item[] = [];
    for (const n of trace.nodes) {
      if (n.kept) items.push({ kind: "node", key: `n${n.id}`, depth: n.depth, order: n.order, node: n });
    }
    for (const [parentId, count] of dropped) {
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
      width: PAD * 2 + maxDepth * COL + NODE_W,
      height: HEAD + Math.max(...rows.values(), 1) * PITCH + PAD,
    };
  }, [trace]);

  const onPath = useMemo(() => new Set(trace.solutionPath), [trace]);
  const wordOf = (n: SearchNode) => {
    const w = NW_.states[n.thoughtId].words;
    return w.length ? w[w.length - 1] : SPEC.lead;
  };

  const aria = trace.solved
    ? `Word tree. ${meta.label} scored ${trace.thoughtsScored} words and finished on a rhyme: ${NW_.line(modelLine)}.`
    : `Word tree. ${meta.label} scored ${trace.thoughtsScored} words and finished on ${NW_.line(modelLine)}, which does not rhyme.`;

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
        A model writes one word at a time. At every word it has a few candidates and a hunch about
        how likely each is, and it picks one. Always pick the likeliest and you have a{" "}
        <strong className="text-ink">chain</strong>: a single line, written forward, with no way
        back. Keep a few unfinished lines alive instead and you have a{" "}
        <strong className="text-ink">tree</strong>.
      </p>

      <div className="grid gap-x-8 gap-y-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
        {/* Step 1 — the reader writes the line. */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">1. Finish the line</h2>
          <div className="flex flex-col gap-4 rounded-lg border border-grid bg-surface p-4">
            <p className="text-ink">
              Tap a word to add it. The finished line has to{" "}
              <strong>rhyme with &ldquo;{SPEC.rhymesWith}&rdquo;</strong>. That is the whole rule.
            </p>

            <Line
              words={mine.words}
              tone={myDone ? (mine.rhymed ? "good" : "bad") : "plain"}
            />

            {!myDone ? (
              <div className="flex flex-col gap-2">
                <p className="text-xs uppercase tracking-wide text-ink-muted">
                  what the model thinks comes next
                </p>
                <div className="flex flex-wrap gap-2">
                  {myChoices.map((c) => (
                    <button
                      key={c.word}
                      type="button"
                      onClick={() => {
                        setMyState(c.stateId);
                        recordInteraction(PAGE_N);
                      }}
                      className="flex items-baseline gap-2 rounded border border-grid bg-surface-raised px-3 py-1.5 text-sm text-ink hover:border-compute"
                    >
                      <span className="font-semibold">{c.word}</span>
                      <span className="font-mono text-xs text-compute">{pct(c.p)}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div
                className={`rounded-lg border-l-4 p-3 ${
                  mine.rhymed ? "border-correct bg-correct/15" : "border-wrong bg-wrong/15"
                }`}
                role="status"
              >
                <p className={`font-semibold ${mine.rhymed ? "text-correct" : "text-wrong"}`}>
                  {mine.rhymed
                    ? `✓ "${mine.words[SPEC.length - 1]}" rhymes with "${SPEC.rhymesWith}"`
                    : `✗ "${mine.words[SPEC.length - 1]}" does not rhyme with "${SPEC.rhymesWith}"`}
                </p>
                <p className="mt-1 text-sm text-ink">
                  This line is {pct(mine.probability)} likely overall.{" "}
                  {mine.rhymed
                    ? "There is exactly one rhyming line in the whole tree, and you found it."
                    : "Every word you picked was a reasonable next word. The line still cannot rhyme."}
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm text-ink-muted">
                {mine.words.length} of {SPEC.length} words
              </p>
              {mine.words.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setMyState(NW_.space.root)}
                  className="rounded border border-grid bg-surface-raised px-3 py-1 text-xs text-ink"
                >
                  Start over
                </button>
              ) : null}
            </div>
          </div>
        </section>

        <Note kicker="Try it">
          <p>Take the likeliest word every time, the way you would with autocomplete.</p>
          <p>That is what a chain of thought does.</p>
        </Note>

        {/* Step 2 — the model writes it, with the one dial that matters. */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">2. Let it keep more than one line</h2>
          <div className="flex flex-col gap-4 rounded-lg border border-grid bg-surface p-4">
            <p className="text-sm text-ink-muted">
              Same words, same probabilities. The only thing that changes is which unfinished
              lines the model carries forward, and how many. Greedy is exactly what you just did.
            </p>

            <div className="flex flex-col gap-2">
              <label htmlFor="strategy" className="text-sm text-ink-muted">
                Search strategy
              </label>
              <select
                id="strategy"
                value={strategy}
                onChange={(e) => {
                  setStrategy(e.target.value as Strategy);
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
                label="Lines kept alive (b)"
                min={1}
                max={5}
                value={keep}
                onChange={(v) => {
                  setKeep(v);
                  recordInteraction(PAGE_N);
                }}
              />
            ) : null}

            <div
              className="max-h-[24rem] overflow-auto rounded-lg border border-dashed border-grid bg-surface-raised p-2"
              role="img"
              aria-label={aria}
            >
              <svg
                viewBox={`0 0 ${layout.width} ${layout.height}`}
                width={layout.width}
                height={layout.height}
                className="max-w-none"
              >
                {Array.from({ length: SPEC.length + 1 }, (_, d) => (
                  <text key={d} x={PAD + d * COL} y={12} className="fill-ink-muted text-[9px]">
                    {d === 0 ? "so I" : `word ${d}`}
                  </text>
                ))}

                {layout.items.map((it) => {
                  const parentId = it.kind === "node" ? it.node.parentId : it.parentId;
                  if (parentId === null) return null;
                  const a = layout.pos.get(`n${parentId}`);
                  const b = layout.pos.get(it.key);
                  if (!a || !b) return null;
                  const x1 = a.x + NODE_W;
                  const y1 = a.y + NODE_H / 2;
                  const x2 = b.x;
                  const y2 = b.y + NODE_H / 2;
                  const mid = (x1 + x2) / 2;
                  const win = it.kind === "node" && onPath.has(it.node.id);
                  return (
                    <path
                      key={`e${it.key}`}
                      d={`M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`}
                      fill="none"
                      className={win ? "stroke-correct" : "stroke-grid"}
                      strokeWidth={win ? 2 : 1}
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
                          width={NODE_W}
                          height={NODE_H - 8}
                          rx={8}
                          className="fill-surface stroke-grid"
                          strokeWidth={1}
                          strokeDasharray="3 2"
                        />
                        <text x={p.x + NODE_W / 2} y={p.y + 16} textAnchor="middle" className="fill-ink-muted text-[9px]">
                          +{it.count} dropped
                        </text>
                      </g>
                    );
                  }
                  const n = it.node;
                  const tone =
                    n.parentId === null
                      ? "fill-ink"
                      : onPath.has(n.id)
                        ? "fill-correct"
                        : n.deadEnd
                          ? "fill-wrong"
                          : "fill-compute";
                  return (
                    <g key={it.key}>
                      <rect x={p.x} y={p.y} width={NODE_W} height={NODE_H} rx={5} className={tone} />
                      <text x={p.x + 7} y={p.y + 16} className="fill-canvas text-[10px]">
                        {wordOf(n)}
                      </text>
                      <text
                        x={p.x + NODE_W - 7}
                        y={p.y + 16}
                        textAnchor="end"
                        className="fill-canvas text-[9px]"
                        opacity={0.75}
                      >
                        {n.isGoal ? "✓" : pct(NW_.states[n.thoughtId].probability)}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
              <Key className="bg-ink" label="start" />
              <Key className="bg-correct" label="the rhyming line" />
              <Key className="bg-compute" label="kept alive" />
              <Key className="border border-dashed border-grid bg-surface" label="scored, then dropped" />
            </div>

            {/* The tree, read as sentences. This is the part that makes it legible. */}
            <div className="flex flex-col gap-1">
              <p className="text-xs uppercase tracking-wide text-ink-muted">
                lines it finished ({finishedLines.length} of 36)
              </p>
              <ul className="flex flex-col gap-0.5">
                {finishedLines.slice(0, 6).map((l) => (
                  <li key={l.id} className="flex items-baseline gap-2 text-sm">
                    <span className="w-10 shrink-0 text-right font-mono text-xs text-compute">
                      {pct(l.probability)}
                    </span>
                    <span className={`italic ${l.rhymed ? "font-semibold text-correct" : "text-ink"}`}>
                      {NW_.line(l)}
                    </span>
                    <span className="text-xs text-ink-muted">
                      {l.rhymed ? "rhymes" : "no rhyme"}
                    </span>
                  </li>
                ))}
                {finishedLines.length > 6 ? (
                  <li className="pl-12 text-xs text-ink-muted">
                    and {finishedLines.length - 6} more
                  </li>
                ) : null}
              </ul>
            </div>

            <div className="grid gap-2 sm:grid-cols-[auto_minmax(0,1fr)]">
              <div
                className="rounded-lg border border-grid bg-surface-raised p-3"
                role="status"
                aria-label={`The compute bill: ${trace.thoughtsScored} words scored`}
              >
                <p className="font-mono text-3xl font-bold tabular-nums text-compute">
                  {trace.thoughtsScored}
                </p>
                <p className="text-xs text-ink">words scored</p>
                <p className="text-xs text-ink-muted">the compute bill</p>
              </div>
              <div
                className={`rounded-lg border-l-4 p-3 ${
                  trace.solved ? "border-correct bg-correct/15" : "border-wrong bg-wrong/15"
                }`}
              >
                <p className={`font-semibold ${trace.solved ? "text-correct" : "text-wrong"}`}>
                  {trace.solved ? "✓ it rhymes" : "✗ no rhyme"}
                </p>
                <p className="mt-1 text-lg italic text-ink">{NW_.line(modelLine)}</p>
                <p className="mt-1 text-xs text-ink-muted">
                  {trace.solved
                    ? `The rhyming line is only ${pct(modelLine.probability)} likely. The likeliest line, at 13%, is the one that cannot rhyme, which is why following the likeliest word is not enough.`
                    : `This is the likeliest line in the whole tree, at ${pct(modelLine.probability)}. Being likeliest is not the same as being right.`}
                </p>
              </div>
            </div>
          </div>
        </section>

        <Note kicker="The dial">
          <p>One line kept alive is a chain of thought.</p>
          <p>Two is already a tree, and already costs more.</p>
        </Note>

        {/* Step 3 — what search buys, measured. */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">3. What search buys</h2>
          <figure className="m-0 flex flex-col gap-2 rounded-lg border border-grid bg-surface p-4">
            <p className="text-sm text-ink-muted">
              A couplet is a toy. Here is the same mechanism measured on a real task: GPT-4 filling
              5&times;5 crosswords, with and without the ability to back up. The two middle bars are
              the ones that matter, because they take the same search apart one piece at a time.
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
              barely above no reasoning at all, because one chain commits to its first guess just as
              your line did. Take the full search and switch off{" "}
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
            Yao et al. 2023, <em>Tree of Thoughts: Deliberate Problem Solving with Large Language
            Models</em>.
          </p>
        </Note>
      </div>

      <div className="flex flex-wrap gap-2">
        <CitationBadge citation={cross.citation} />
      </div>
      <p className="text-xs text-ink-muted">
        The words and their probabilities are written by hand. The search over them is real, and
        every count above is measured from it and pinned in the test suite.
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
