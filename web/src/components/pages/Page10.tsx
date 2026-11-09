"use client";

/**
 * Page 10, "Searching Through Thoughts", as a next-word predictor.
 *
 * This is the thing a language model actually is: at every position it has a
 * few words it thinks might come next, each with a probability, and it picks
 * one. Take the likeliest word every time and you are doing greedy decoding —
 * a chain of thought, one line, no way back. Everything else on this page is
 * best-of-N (page 8) with the judge moved inside the loop: a verifier scores
 * partial lines while they are still being written (page 9), and the search
 * decides which lines to extend.
 *
 * THE FIGURE IS ONE FIXED TREE, REPLAYED IN TIME. All 29 words and every edge
 * are always on screen. Picking a strategy loads its real trace; pressing play
 * steps through it, lighting each word in the order the verifier scored it,
 * with the line currently being tried drawn bright. Time is the only channel
 * that makes the strategies' signatures legible: breadth-first washes across
 * one column at a time, depth-first dives and visibly retreats, beam advances
 * b tracks in lockstep, greedy is a single dart. A caption narrates the
 * marquee moves ("backed up to 'turned'") as they happen.
 *
 * MCTS is animated by TRIAL, not by scoring order — the engine records each
 * rollout's path (SearchTrace.rollouts) precisely so this page can show whole
 * lines being tried and attention narrowing, which is what MCTS actually does.
 * Scoring order alone would animate it as a false breadth-ish sweep.
 *
 * Steps: 1. YOU finish the line, tapping one word at a time. 2. Five buttons,
 * one play button, the same tree. 3. What search buys, measured — Yao et al.
 * 2023 (data/tot-crosswords.json).
 *
 * Every number is measured and pinned in act2nextword.test.ts: greedy scores
 * 9 of 29 words and cannot rhyme; beam-2 and MCTS score 14 and find the rhyme,
 * depth-first 18, breadth-first 23.
 */

import { useEffect, useMemo, useState } from "react";
import { Handoff } from "@/components/Handoff";
import { Cite, RefItem } from "@/components/Cite";
import { PageNav } from "@/components/PageNav";
import { Slider } from "@/components/Slider";
import { NEXT_WORD_SPEC } from "@/lib/authored";
import { ACTS, getPage } from "@/lib/pages";
import { curves } from "@/lib/curves";
import { buildNextWord, type NextWordSpec } from "@/lib/nextWord";
import { search, STRATEGIES, type Strategy } from "@/lib/thoughtSearch";
import { useStore } from "@/store/useStore";

const PAGE_N = 10;

/**
 * The one page in Act 2 whose download is not a run.
 *
 * Pages 5 to 9 each ship the measurement their claims rest on. This page has
 * none: the tree is hand-authored and the bars are Yao et al.'s. The arm that
 * would give it one is written and packaged here unrun, so the label has to
 * promise the notebook and not a result.
 *
 * That disclosure is a standing line under the intro, not a margin note. As a
 * note beside step 3 it arrived after both figures it governs, next to the one
 * it says least about; it has to be read before the first tap, and it is what
 * the unrun download beside the title is promising. It must stay in the reading
 * column and above step 1.
 */
const NOTEBOOK_ZIP = "/notebooks/page-10-search-arm.zip";
const NW_ = buildNextWord(NEXT_WORD_SPEC as unknown as NextWordSpec);
const SPEC = NW_.spec;

/* Tree geometry: fixed node size and pitch, so connectors are arithmetic. */
const NODE_W = 96;
const NODE_H = 22;
const PITCH = 27;
const COL = 122;
const PAD = 8;
const HEAD = 20;

const pct = (p: number) => `${Math.round(p * 100)}%`;
/** Every word in the whole tree — the denominator of the compute bill. */
const TREE_WORDS = NW_.states.length - 1;

/** Reference numbers, in order of first appearance on the page. */
const REF = {
  degen: 1,
  tot: 2,
} as const;

/* The tree never changes, so lay it out once: every state gets a row within
   its column, children grouped under their parent's subtree. */
const LAYOUT = (() => {
  const pos = new Map<number, { x: number; y: number }>();
  const rows = new Map<number, number>();
  const byDepth = [...NW_.states].sort(
    (a, b) => a.words.length - b.words.length || a.id - b.id,
  );
  for (const s of byDepth) {
    const d = s.words.length;
    const r = rows.get(d) ?? 0;
    rows.set(d, r + 1);
    pos.set(s.id, { x: PAD + d * COL, y: HEAD + r * PITCH });
  }
  return {
    pos,
    width: PAD * 2 + SPEC.length * COL + NODE_W,
    height: HEAD + Math.max(...rows.values()) * PITCH + PAD,
  };
})();

/** Parent of a state in the fixed tree: the state holding all but its last word. */
const PARENT = (() => {
  const byWords = new Map(NW_.states.map((s) => [s.words.join(" "), s.id]));
  const m = new Map<number, number>();
  for (const s of NW_.states) {
    if (s.words.length === 0) continue;
    m.set(s.id, byWords.get(s.words.slice(0, -1).join(" "))!);
  }
  return m;
})();

/** A margin note that sits beside its step and scrolls with the page. */
function Note({ kicker, children }: { kicker: string; children: React.ReactNode }) {
  return (
    <aside className="flex flex-col gap-2 text-sm text-ink-muted lg:pt-9">
      <p className="text-xs font-semibold font-eyebrow uppercase tracking-wide text-ink-muted">{kicker}</p>
      {children}
    </aside>
  );
}

/** The couplet as written so far. */
function Line({ words, tone }: { words: readonly string[]; tone: "plain" | "good" | "bad" }) {
  const last = tone === "good" ? "text-correct-ink" : tone === "bad" ? "text-wrong-ink" : "text-ink";
  return (
    <div className="flex flex-col gap-1">
      <p className="text-lg italic text-ink-muted">{SPEC.given}</p>
      <p className="text-lg text-ink">
        <span className="italic">{SPEC.lead}</span>{" "}
        {words.map((w, i) => (
          <span key={i} className={`italic ${i === SPEC.length - 1 ? `font-semibold ${last}` : ""}`}>
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
  const degen = curves.neuralDegeneration;
  const { greedy: degenGreedy, human: degenHuman } = degen.fit!.params;

  // Step 1 — the reader taps words.
  const [myState, setMyState] = useState(NW_.space.root);
  // Step 2 — which strategy, its beam width, and where the replay is up to.
  const [strategy, setStrategy] = useState<Strategy>("greedy");
  const [keep, setKeep] = useState(2);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  const mine = NW_.states[myState];
  const myChoices = NW_.choices(mine);
  const myDone = mine.words.length === SPEC.length;

  const trace = useMemo(
    () => search(NW_.space, strategy, { beamWidth: keep, maxNodes: 3000, rollouts: 80 }),
    [strategy, keep],
  );
  const meta = STRATEGIES.find((s) => s.key === strategy)!;

  /* The replay. One step = one word scored — except MCTS, where one step = one
     whole trial, because that is the unit MCTS actually thinks in. */
  const isMcts = strategy === "mcts";
  const totalSteps = isMcts ? (trace.rollouts?.length ?? 0) : trace.thoughtsScored;
  const done = totalSteps > 0 && step >= totalSteps;

  useEffect(() => {
    setStep(0);
    setPlaying(false);
  }, [strategy, keep]);

  /* Discrete ticks, no in-between motion, so this doubles as a stepper under
     reduced motion. MCTS ticks slower: a whole line lights up per step. */
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(
      () => setStep((s) => Math.min(s + 1, totalSteps)),
      isMcts ? 900 : 380,
    );
    return () => clearInterval(id);
  }, [playing, totalSteps, isMcts]);

  useEffect(() => {
    if (step >= totalSteps) setPlaying(false);
  }, [step, totalSteps]);

  /* thought id → the order the verifier scored it (each is scored once). */
  const visited = useMemo(() => {
    const m = new Map<number, number>();
    for (const n of trace.nodes) {
      if (n.parentId === null) continue;
      if (!m.has(n.thoughtId)) m.set(n.thoughtId, n.order);
    }
    return m;
  }, [trace]);
  const nodeByOrder = useMemo(() => {
    const m = new Map<number, number>();
    for (const [thoughtId, order] of visited) m.set(order, thoughtId);
    return m;
  }, [visited]);

  /** Words scored so far at this point of the replay — the live bill. */
  const scoredCount = isMcts
    ? step === 0
      ? 0
      : (trace.rolloutScored?.[step - 1] ?? 0)
    : step;

  /* The line being tried right now, drawn bright. */
  const activePath = useMemo(() => {
    const ids = new Set<number>();
    if (step === 0 || done) return ids;
    if (isMcts) {
      for (const id of trace.rollouts?.[step - 1] ?? []) ids.add(id);
      return ids;
    }
    let cur = nodeByOrder.get(step);
    while (cur !== undefined && cur !== NW_.space.root) {
      ids.add(cur);
      cur = PARENT.get(cur);
    }
    return ids;
  }, [step, done, isMcts, trace, nodeByOrder]);

  /* The line the run committed to: the rhyme if found, else its likeliest
     finished line — lit green or red once the replay ends. */
  const endId = useMemo(() => {
    if (trace.solved) return trace.solutionThoughts.at(-1)!;
    const finished = trace.nodes
      .filter((n) => NW_.states[n.thoughtId].words.length === SPEC.length)
      .sort((a, b) => b.score - a.score);
    return finished.length ? finished[0].thoughtId : NW_.space.root;
  }, [trace]);
  const modelLine = NW_.states[endId];
  const endPath = useMemo(() => {
    const ids = new Set<number>();
    let cur: number | undefined = endId;
    while (cur !== undefined && cur !== NW_.space.root) {
      ids.add(cur);
      cur = PARENT.get(cur);
    }
    return ids;
  }, [endId]);

  /* The caption: the line under trial, plus a note at the marquee moments —
     the DFS backtrack, the BFS column sweep, the beam cut, the MCTS trial. */
  const caption = useMemo(() => {
    if (totalSteps === 0 || step === 0) {
      return { line: null as string | null, note: "Press play to watch it search." };
    }
    if (isMcts) {
      const pathIds = trace.rollouts?.[step - 1];
      if (!pathIds) return { line: null, note: null };
      const end = NW_.states[pathIds[pathIds.length - 1]];
      const full = end.words.length === SPEC.length;
      return {
        line: NW_.line(end),
        note: full
          ? end.rhymed
            ? `trial ${step}: it rhymes — stop`
            : `trial ${step}: finished the line — no rhyme, try elsewhere`
          : `trial ${step}: ran out of new words`,
      };
    }
    const thoughtId = nodeByOrder.get(step);
    /* One render can arrive with the previous strategy's step before the
       reset effect fires; there is no such node in the new trace. */
    if (thoughtId === undefined) return { line: null, note: null };
    const st = NW_.states[thoughtId];
    const prevId = nodeByOrder.get(step - 1);
    let note: string | null = null;
    if (prevId !== undefined) {
      const prev = NW_.states[prevId];
      const parentCur = PARENT.get(thoughtId)!;
      const parentPrev = PARENT.get(prevId);
      const newBatch = parentCur !== parentPrev && parentCur !== prevId;
      const parentWords = NW_.states[parentCur].words;
      if (strategy === "dfs" && newBatch && parentWords.length < prev.words.length) {
        note = `✗ that line can't rhyme — backed up to "${parentWords[parentWords.length - 1] ?? SPEC.lead}"`;
      } else if (strategy === "bfs" && st.words.length > prev.words.length) {
        note = `word ${prev.words.length} scored for every line — extending them all`;
      } else if (strategy === "beam" && st.words.length > prev.words.length) {
        note = `kept the ${keep} likeliest line${keep === 1 ? "" : "s"}, dropped the rest`;
      } else if (strategy === "greedy" && st.words.length > prev.words.length) {
        note = "committed to the likeliest word — scoring what can follow";
      }
    }
    return { line: NW_.line(st), note };
  }, [step, totalSteps, isMcts, trace, nodeByOrder, strategy, keep]);

  const aria = trace.solved
    ? `Word tree replay. ${meta.label} scores ${trace.thoughtsScored} of ${TREE_WORDS} words and finishes on a rhyme: ${NW_.line(modelLine)}.`
    : `Word tree replay. ${meta.label} scores ${trace.thoughtsScored} of ${TREE_WORDS} words and finishes on ${NW_.line(modelLine)}, which does not rhyme.`;

  const bars = [
    { label: "Input-output prompting", value: io, tone: "bg-grid" },
    { label: "Chain of thought", value: cot, tone: "bg-grid" },
    { label: "Tree of Thoughts, no backtracking", value: totNoBacktrack, tone: "bg-wrong" },
    { label: "Tree of Thoughts, no pruning", value: totNoPrune, tone: "bg-compute" },
    { label: "Tree of Thoughts, full", value: tot, tone: "bg-correct" },
  ];

  return (
    <article className="flex flex-col gap-6">
      <p className="text-xs font-eyebrow uppercase tracking-wide text-ink-muted">
        Act {page.act} · {ACTS[page.act].title}
      </p>
      {/* Pages 5 to 9 put the way to re-derive the page beside its title. This
          page keeps the position and changes the promise, because there is no
          run here to re-derive. */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h1 className="text-3xl font-bold text-ink">
          <span className="font-mono text-ink-muted">{page.n}. </span>
          {page.title}
        </h1>
        <a
          className="rounded border border-grid px-2 py-1 text-xs text-ink-muted hover:text-ink"
          href={NOTEBOOK_ZIP}
          download
        >
          the search arm, written and not run ↓
        </a>
      </div>
      {/* Held to the content column: the margin is the notes column (15rem) plus the
          grid's column gap (2rem), so its right edge meets the body text's. */}
      <p className="text-lg text-ink-muted lg:mr-[17rem]">
        A model writes one word at a time. At every word it has a few candidates and a hunch about
        how likely each is, and it picks one. Always pick the likeliest and you have a{" "}
        <strong className="text-ink">chain</strong>: a single line, written forward, with no way
        back. Keep a few unfinished lines alive instead and you have a{" "}
        <strong className="text-ink">tree</strong>.
      </p>
      {/* The provenance, in the reading column and above every figure it governs.
          It used to be a margin note beside step 3, which put it after both figures
          and beside the one it says least about. It sits here because it is the
          caveat the reader needs before the first tap, and because it is what the
          unrun download beside the title is promising. */}
      <p className="text-ink-muted">
        <strong className="text-ink">Nothing here is a measurement of ours.</strong> Pages 5 to 9
        each ship the run their numbers come from. This page ships none. The 29-word tree below is
        written by hand, chosen so the five behaviours are legible, and the crossword bars in step 3
        are Yao et al.&apos;s.
      </p>

      <div className="grid gap-x-8 gap-y-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
        {/* Step 1 — the reader writes the line. */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">1. Finish the line</h2>
          {/* Pages 5 to 9 keep the invitation as the last line of the intro, directly
              above the figure it invites the reader into. It used to sit inside the box. */}
          <p className="text-ink-muted">
            Be the model for four words. Below is a couplet missing the end of its second line,
            with the words the model thinks could come next and its hunch about each. Tap a word to
            add it. The finished line has to{" "}
            <strong className="text-ink">rhyme with &ldquo;{SPEC.rhymesWith}&rdquo;</strong>. That
            is the whole rule.
          </p>
          <section
            aria-label="A couplet with four words missing, and the model's candidates for each"
            className="flex flex-col gap-4 rounded-lg border border-grid bg-surface p-4"
          >
            <Line words={mine.words} tone={myDone ? (mine.rhymed ? "good" : "bad") : "plain"} />

            {!myDone ? (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-eyebrow uppercase tracking-wide text-ink-muted">
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
                      className="flex items-baseline gap-2 rounded border border-grid bg-surface-raised px-3 py-1.5 text-sm text-ink hover:border-chrome"
                    >
                      <span className="font-semibold">{c.word}</span>
                      <span className="font-mono text-xs text-compute-ink">{pct(c.p)}</span>
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
                <p className={`font-semibold ${mine.rhymed ? "text-correct-ink" : "text-wrong-ink"}`}>
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
          </section>
          <p className="text-sm text-ink-muted">
            The trap is not a toy. Run for real on GPT-2, always-take-the-likeliest-word gets stuck
            repeating a phrase in {degenGreedy}% of its continuations.
            <Cite n={REF.degen} /> Human text: {degenHuman}%.
          </p>
        </section>

        <div className="flex flex-col gap-6">
          <Note kicker="Try it">
            <p>Take the likeliest word every time, the way you would with autocomplete.</p>
            <p>That is what a chain of thought does.</p>
          </Note>
          <Note kicker="References">
            <RefItem n={REF.degen} href="https://arxiv.org/abs/1904.09751">
              Holtzman et al. 2020, <em>The Curious Case of Neural Text Degeneration</em> (ICLR
              2020).
            </RefItem>
          </Note>
        </div>

        {/* Step 2 — five strategies replayed over one fixed tree. */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">2. Watch it search the same tree</h2>
          <p className="text-ink-muted">
            Greedy is what you just did: a chain of thought, no checking, no way back. The other
            four are <strong className="text-ink">best-of-N with the judge moved inside the
            loop</strong>, and here the judge is the model&rsquo;s own confidence: it rates
            unfinished lines while they are being written, and the search decides which to extend.
            Nothing on this page checks whether a line can still rhyme. Pick one and press play; the
            shape of the lit-up region is the strategy.
          </p>
          <section
            aria-label="The same fixed tree of words, replayed under each search strategy"
            className="flex flex-col gap-4 rounded-lg border border-grid bg-surface p-4"
          >
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Search strategy">
              {STRATEGIES.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  aria-pressed={strategy === s.key}
                  onClick={() => {
                    setStrategy(s.key);
                    recordInteraction(PAGE_N);
                  }}
                  className={`rounded border px-3 py-1.5 text-sm ${
                    strategy === s.key
                      ? "border-compute bg-compute font-semibold text-ink"
                      : "border-grid bg-surface-raised text-ink hover:border-chrome"
                  }`}
                >
                  {s.key === "greedy" ? "Greedy (chain of thought)" : s.label}
                </button>
              ))}
            </div>
            <p className="text-sm text-ink-muted">{meta.blurb}</p>

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

            {/* the replay controls */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (!playing && done) setStep(0);
                  setPlaying((p) => !p);
                  recordInteraction(PAGE_N);
                }}
                className="rounded bg-chrome px-4 py-1.5 text-sm font-semibold text-canvas"
              >
                {playing ? "Pause" : done ? "Replay" : "Play"}
              </button>
              <button
                type="button"
                disabled={done}
                onClick={() => {
                  setPlaying(false);
                  setStep((s) => Math.min(s + 1, totalSteps));
                  recordInteraction(PAGE_N);
                }}
                className="rounded border border-grid bg-surface-raised px-3 py-1.5 text-sm text-ink disabled:opacity-50"
              >
                Next {isMcts ? "trial" : "step"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setPlaying(false);
                  setStep(totalSteps);
                }}
                className="rounded border border-grid bg-surface-raised px-3 py-1.5 text-sm text-ink"
              >
                Skip to end
              </button>
              <input
                type="range"
                min={0}
                max={totalSteps}
                value={step}
                aria-label="Search step"
                onChange={(e) => {
                  setPlaying(false);
                  setStep(Number(e.target.value));
                }}
                className="min-w-[8rem] flex-1 accent-chrome"
              />
              <span className="font-mono text-xs tabular-nums text-ink-muted">
                {isMcts ? `trial ${step}/${totalSteps}` : `${step}/${totalSteps}`}
              </span>
            </div>

            {/* The one fixed tree; the replay only changes what is lit. It used to
                carry its own dashed frame and raised plane, because the box around it
                meant "this step" and the tree needed delimiting from the prose sharing
                that box. The box means "this figure" now, so the tree sits on it: an
                unvisited node is fill-surface over stroke-grid and reads as hollow
                against the same surface, which is what it is. */}
            <div className="overflow-x-auto" role="img" aria-label={aria}>
              <svg
                viewBox={`0 0 ${LAYOUT.width} ${LAYOUT.height}`}
                width={LAYOUT.width}
                height={LAYOUT.height}
                className="max-w-none"
              >
                {Array.from({ length: SPEC.length + 1 }, (_, d) => (
                  <text key={d} x={PAD + d * COL} y={12} className="fill-ink-muted text-[9px]">
                    {d === 0 ? "start" : `word ${d}`}
                  </text>
                ))}

                {/* every edge, always */}
                {NW_.states.map((s) => {
                  if (s.words.length === 0) return null;
                  const from = LAYOUT.pos.get(PARENT.get(s.id)!)!;
                  const to = LAYOUT.pos.get(s.id)!;
                  const x1 = from.x + NODE_W;
                  const y1 = from.y + NODE_H / 2;
                  const x2 = to.x;
                  const y2 = to.y + NODE_H / 2;
                  const mid = (x1 + x2) / 2;
                  const seen = (visited.get(s.id) ?? Infinity) <= scoredCount;
                  const active = activePath.has(s.id);
                  const onEnd = done && endPath.has(s.id);
                  return (
                    <path
                      key={`e${s.id}`}
                      d={`M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`}
                      fill="none"
                      className={
                        onEnd
                          ? trace.solved
                            ? "stroke-correct"
                            : "stroke-wrong"
                          : active
                            ? "stroke-compute"
                            : seen
                              ? "stroke-ink-muted"
                              : "stroke-grid"
                      }
                      strokeWidth={onEnd ? 3 : active ? 2.5 : seen ? 1.5 : 1}
                      opacity={onEnd || active ? 1 : seen ? 0.7 : 0.5}
                    />
                  );
                })}

                {/* every node, always; lit as the replay reaches it */}
                {NW_.states.map((s) => {
                  const p = LAYOUT.pos.get(s.id)!;
                  const root = s.words.length === 0;
                  const order = visited.get(s.id);
                  const seen = (order ?? Infinity) <= scoredCount;
                  const active = activePath.has(s.id);
                  const onEnd = done && endPath.has(s.id);
                  const fill = root
                    ? "fill-ink"
                    : onEnd
                      ? trace.solved
                        ? "fill-correct"
                        : "fill-wrong"
                      : seen
                        ? "fill-compute"
                        : "fill-surface";
                  const ink = root ? "fill-canvas" : onEnd || seen ? "fill-ink" : "fill-ink-muted";
                  return (
                    <g key={s.id} opacity={root || seen || onEnd ? 1 : 0.55}>
                      <rect
                        x={p.x}
                        y={p.y}
                        width={NODE_W}
                        height={NODE_H}
                        rx={5}
                        className={`${fill} ${active ? "stroke-ink" : root || seen || onEnd ? "" : "stroke-grid"}`}
                        strokeWidth={active ? 2 : root || seen || onEnd ? 0 : 1}
                      />
                      {seen && !root ? (
                        <text
                          x={p.x + 5}
                          y={p.y + 15}
                          className={`${ink} font-mono text-[8px]`}
                          opacity={0.85}
                        >
                          {order}
                        </text>
                      ) : null}
                      <text x={p.x + (root ? 8 : 20)} y={p.y + 15} className={`${ink} text-[10px]`}>
                        {root ? SPEC.lead : s.words[s.words.length - 1]}
                      </text>
                      <text
                        x={p.x + NODE_W - 5}
                        y={p.y + 15}
                        textAnchor="end"
                        className={`${ink} text-[8px]`}
                        opacity={0.75}
                      >
                        {root ? "" : s.rhymed ? "✓" : pct(s.probability)}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* the bill, live, and the caption or the verdict */}
            <div className="grid gap-2 sm:grid-cols-[auto_minmax(0,1fr)]">
              <div
                className="rounded-lg border border-grid bg-surface-raised p-3"
                role="status"
                aria-label={`The compute bill: ${scoredCount} of ${TREE_WORDS} words scored`}
              >
                <p className="font-mono text-3xl font-bold tabular-nums text-compute-ink">
                  {scoredCount}
                  <span className="text-base font-normal text-ink-muted"> / {TREE_WORDS}</span>
                </p>
                <p className="text-xs text-ink">words the model rated</p>
                <p className="text-xs text-ink-muted">the compute bill</p>
              </div>
              {done ? (
                <div
                  className={`rounded-lg border-l-4 p-3 ${
                    trace.solved ? "border-correct bg-correct/15" : "border-wrong bg-wrong/15"
                  }`}
                >
                  <p className={`font-semibold ${trace.solved ? "text-correct-ink" : "text-wrong-ink"}`}>
                    {trace.solved ? "✓ it rhymes" : "✗ no rhyme"}
                  </p>
                  <p className="mt-1 text-lg italic text-ink">{NW_.line(modelLine)}</p>
                  <p className="mt-1 text-xs text-ink-muted">
                    {trace.solved
                      ? `The rhyming line is only ${pct(modelLine.probability)} likely. The likelier lines it passed over cannot rhyme, which is why following the likeliest word is not enough.`
                      : `This is the likeliest line in the whole tree, at ${pct(modelLine.probability)}. Being likeliest is not the same as being right.`}
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border-l-4 border-chrome bg-surface-raised p-3">
                  {caption.line ? (
                    <p className="text-lg italic text-ink">{caption.line}</p>
                  ) : null}
                  {caption.note ? (
                    <p className="mt-1 text-sm text-ink-muted">{caption.note}</p>
                  ) : null}
                </div>
              )}
            </div>
          </section>
          <p className="text-sm text-ink-muted">
            The words and their probabilities are written by hand. The search over them is real, and
            the replay is its actual trace.
          </p>
        </section>

        <Note kicker="Reading the replay">
          <p>Boxes light up in the order the model rates them; the number is that order.</p>
          <p>The bright path is the line it is trying right now.</p>
        </Note>

        {/* Step 3 — what search buys, measured. */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">3. What search buys</h2>
          <p className="text-ink-muted">
            Running these five head-to-head on a real model is out of reach here. Once a step is a
            sentence rather than a word, breadth-first has to keep every line a model could write
            next, depth-first cannot tell a line is doomed without finishing it, and MCTS needs
            thousands of finished lines per question; only greedy and beam stay practical. That is
            a limit of the hardware, not a verdict on the algorithms. The closest measurement takes
            the same branch, score, backtrack machinery apart piece by piece on a real word task:
            GPT-4 filling 5&times;5 crosswords, with and without the ability to back up.
            <Cite n={REF.tot} /> The two bars with a piece switched off are the ones that matter.
          </p>
          <section
            aria-label="GPT-4 filling 5×5 crosswords, with pieces of the search switched off"
            className="flex flex-col gap-2 rounded-lg border border-grid bg-surface p-4"
          >
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
          </section>
          <p className="text-sm text-ink-muted">
            Chain of thought fills <strong className="text-ink">{cot}%</strong> of the words, barely
            above no reasoning at all, because one chain commits to its first answer just as yours
            did. Take the full search and switch off{" "}
            <strong className="text-ink">pruning</strong> and it drops to {totNoPrune}%. Switch off{" "}
            <strong className="text-ink">backtracking</strong> instead and it collapses to{" "}
            {totNoBacktrack}%, almost back to plain chain of thought. That is the whole argument in
            two bars:{" "}
            <em>what search buys is not more thinking, it is the ability to take a thought back</em>.
            What that costs is the trade the rest of this act is about.
          </p>
        </section>

        {/* One note in this cell now: the "No run of our own" note that used to sit
            above it is the standing line under the intro. The wrapper stays so the
            cell keeps step 1's shape if a second note ever returns. */}
        <div className="flex flex-col gap-6">
          <Note kicker="References">
            <RefItem n={REF.tot} href="https://arxiv.org/abs/2305.10601">
              Yao et al. 2023, <em>Tree of Thoughts: Deliberate Problem Solving with Large Language
              Models</em> (NeurIPS 2023).
            </RefItem>
          </Note>
        </div>

        {/* Every page from 5 to 9 hands the next one a question; this one used to
            end inside a caption, then inside step 3. It sits in the grid's content
            column on its own row, page 3's shape for a handoff, so it reads as the
            page's last word rather than the last word of its last step and still
            keeps the measure. The seam page 11 opens on is the price, in the one
            currency both sides of it are denominated in. */}
        <Handoff className="lg:col-start-1">
          <em>
            Everything on pages 5 to 10 spends the same thing: arithmetic at answer time, bought by
            the token and paid for once per question. Parameters are bought with the same currency,
            in bulk, before any question arrives. So which is the better buy at a matched bill? Turn
            the page.
          </em>
        </Handoff>
      </div>

      <PageNav n={PAGE_N} />
    </article>
  );
}
