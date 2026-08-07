"use client";

/**
 * Page 5, "Chain of Thought: Reasoning Out Loud" — Act 2 opens on page 4's
 * question: can a machine be walked down a road? In 2026 the answer arrives
 * before the question does. A plain instruct model reasons on a hard maths
 * problem with nothing in the prompt asking it to, so the page cannot be about
 * summoning a chain. It is about what the chain is worth, measured the only way
 * left: by taking it away.
 *
 * EVERY NUMBER ON THIS PAGE IS OURS AND IS MEASURED. Nothing is redrawn from a
 * paper and nothing is authored. The source is one run of
 * `notebooks/page_05_how_to_reason.ipynb` — Qwen2.5-Instruct at bf16 (1.5B, 3B,
 * 7B; the 3B is the primary), MATH-500 levels 4 and 5, 100 paired items, greedy,
 * 900 generations. Its `derived.json` is committed verbatim to
 * `web/data/page-05-derived.json` and loaded through `@/lib/page05`, which reads
 * the run's `claims` gates BEFORE any number and throws if one is false. No
 * inference runs at demonstration time; the page replays committed logs.
 *
 * Layout: page 6's shell. One reading column of numbered steps, each beside its
 * own margin note that scrolls with it. Every step that carries a figure opens
 * with a sentence saying what the figure is a picture OF, because the numbers
 * are meaningless without their denominator: "43" is not a claim, "43 of the
 * same 100 problems" is.
 *
 *   Step 1 — no figure and no card, three sentences. What a chain of thought IS,
 *   told with the reader's OWN numbers: page 1's 17 × 24 and the three results
 *   they built it from, pulled live off `SYSTEMS.slow` so the callback cannot
 *   drift from the page it calls back to. The load-bearing clause is the last
 *   one, that for a model the chain is the thinking rather than a report of it,
 *   because it is the only claim in this step that is not measured and it is
 *   what makes reasoning something you can put a budget on. Resist re-narrating
 *   page 1 or page 4 here: the lede already has the road, and page 6 shows the
 *   chain being cut off two clicks later, so a forward-pointer is padding.
 *   Wei and Kojima are named in the margin, where the TECHNIQUE is the subject.
 *
 *   Step 2 — figure 1, the specimen. One problem, one model, one decoding
 *   setting, two prompts that differ only by a suffix. Tabs are ordered to match
 *   figure 2's bars and the reader lands on `bare`. A "see the full prompt"
 *   disclosure shows the exact strings, with the suffix highlighted, so the
 *   reader can confirm that nothing in the bare prompt asks for working. Prompt
 *   and trace are both set in `font-code`: they are listings of what a machine
 *   read and wrote, and the deck's serif makes a 573-token trace unreadable.
 *   The stepper (Back / Next / Play) walks the model's own output using the
 *   token ranges the notebook emitted, so the reveal stops at real token
 *   boundaries rather than faking a typewriter. The instruction condition is NOT
 *   a third tab: it is measured, and it is spent on page 12 (margin note).
 *
 *   Step 3 — figure 2, the page's headline. The McNemar 2x2 drawn as 100 cells,
 *   one per problem, with the gag on a switch. Flip it and 40 solved problems go
 *   out while 4 arrive. The four cell counts are fully determined by the two
 *   discordant counts and the two solve counts the notebook reports, so the
 *   picture is measurement; only the ARRANGEMENT of cells is ours, and the
 *   caption says so. Do not label a cell with a problem id: we do not ship
 *   per-item outcomes to the page.
 *
 *   Step 4 — figure 3, three checkpoints. The claim is the FLAT FLOOR, never
 *   scale: three points are not a scaling law, our trend has no sign flip, and
 *   emergence is page 11's subject. No size axis, no line through the points,
 *   and no caption that can be read as either. Section 1 of the spec.
 *
 *   Step 5 — 6 tokens against 573, and the handoff page 6 actually opens on.
 *
 * The apparatus lives in the margin, one note per step, not in a footer. The
 * three-paragraph footnote this page used to end on was doing the notebook's
 * job: a reader who wants the full method downloads the run. What survives in
 * the margin is only what a reader needs while looking at THAT figure, plus the
 * two things the claims contract requires on the page in words (the instruction
 * null as a bound, and why the exemplar rungs are absent).
 *
 * Load-bearing and easy to lose:
 *   · the notebook download is the whole point of the pipeline. The link carries
 *     the notebook, `harness.py` and all 900 traces, so a reader who doubts a
 *     figure re-derives it. Keep it above the fold.
 *   · the instruction null is a BOUND, never a zero, and never the word
 *     "nothing" unqualified (claims gate `instruction_null_bounded`).
 *   · chain share is a blurt detector and nothing more. It verifies the gag
 *     worked; it is not a measure of how much reasoning happened.
 *   · Wei et al. and Kojima et al. are cited for the TECHNIQUES they introduced.
 *     No cite may carry one of our numbers or sit where it implies the data came
 *     from a paper.
 */

import { useEffect, useMemo, useState } from "react";
import { ChartFrame } from "@/components/ChartFrame";
import { CitationBadge } from "@/components/CitationBadge";
import { PageNav } from "@/components/PageNav";
import type { Citation } from "@/lib/data";
import { ACTS, getPage } from "@/lib/pages";
import {
  PAGE5,
  SUPPRESSION_TABLE,
  pLabel,
  pct,
  solvedIn,
  tidyMath,
  type PairedClass,
} from "@/lib/page05";
import { SYSTEMS } from "@/lib/authored";
import { useStore } from "@/store/useStore";

const PAGE_N = 5;

/** Page 1's System 2 round, so the callback cannot drift from what it calls back to. */
const S2 = SYSTEMS.slow;
/** "17 × 20 = 340" → "340": the three results the reader watched themselves build. */
const S2_RESULTS = S2.steps.map((s) => s.slice(s.lastIndexOf("=") + 1).trim());
const F1 = PAGE5.figure1;
const F2 = PAGE5.figure2;
const F3 = PAGE5.figure3;
const CLOSE = PAGE5.close;
const M = PAGE5.manifest;

/** The download: notebook + harness + every generation the page rests on. */
const NOTEBOOK_ZIP = "/notebooks/page-05-how-to-reason.zip";
const NOTEBOOK_SIZE = "0.8 MB";

/** Milliseconds a chain step lingers before the next appears (Play). */
const STEP_MS = 700;

/** Cited for the technique. Every number on this page is ours. */
const WEI: Citation = {
  ref: "Wei et al. 2022",
  url: "https://arxiv.org/abs/2201.11903",
  venue: "NeurIPS 2022",
  preprint: false,
};
const KOJIMA: Citation = {
  ref: "Kojima et al. 2022",
  url: "https://arxiv.org/abs/2205.11916",
  venue: "NeurIPS 2022",
  preprint: false,
};

/** A margin note that sits beside its step and scrolls with the page. */
function Note({ kicker, children }: { kicker: string; children: React.ReactNode }) {
  return (
    <aside className="flex flex-col gap-2 text-sm text-ink-muted lg:pt-9">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{kicker}</p>
      {children}
    </aside>
  );
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** The date the run was made, for the provenance chip. */
const RUN_DATE = M.timestamp_utc.slice(0, 10);

const chip = "rounded-full border border-grid px-2 py-0.5 text-ink-muted";
const seg = (active: boolean) =>
  `rounded px-3 py-1.5 text-sm font-semibold ${
    active ? "bg-compute text-canvas" : "border border-grid bg-surface-raised text-ink-muted"
  }`;

/* ------------------------------------------------------------------ figure 1 */

/**
 * How much of the model's output has been revealed, against how much the gagged
 * run wrote on the same problem. The tick is the whole of the blurt: six tokens.
 */
function TokenMeter({ written, total, blurtTokens }: { written: number; total: number; blurtTokens: number }) {
  const w = Math.max(0, Math.min(1, written / total)) * 100;
  const tick = (blurtTokens / total) * 100;
  const showTick = blurtTokens < total;
  return (
    <div className="flex flex-col gap-1">
      <div className="relative h-2 w-full overflow-hidden rounded-sm border border-grid bg-surface-raised">
        <div
          className="h-full bg-compute motion-safe:transition-[width] motion-safe:duration-500"
          style={{ width: `${w}%` }}
        />
        {showTick ? (
          <div className="absolute inset-y-0 w-px bg-wrong" style={{ left: `${tick}%` }} />
        ) : null}
      </div>
      <p className="flex flex-wrap justify-between gap-x-3 font-mono text-xs tabular-nums text-ink-muted">
        <span>
          {written} of {total} tokens written
        </span>
        {showTick ? (
          <span className="text-wrong">the forbidden run stopped at {blurtTokens}</span>
        ) : null}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ figure 2 */

const cellTone = (cell: PairedClass, gagged: boolean): string => {
  if (solvedIn(cell, gagged)) return "border-correct bg-correct";
  if (gagged && cell === "chainOnly") return "border-wrong bg-wrong";
  return "border-grid bg-surface-raised";
};

/** The paired table as 100 problems. Flipping the gag moves 44 of them. */
function PairedGrid({ gagged }: { gagged: boolean }) {
  return (
    <div className="grid w-full grid-cols-10 gap-1.5" aria-hidden="true">
      {SUPPRESSION_TABLE.cells.map((cell, i) => (
        <span
          key={i}
          className={`aspect-square rounded-sm border motion-safe:transition-colors motion-safe:duration-500 ${cellTone(cell, gagged)}`}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ figure 3 */

const FLOOR_W = 660;
const FLOOR_H = 250;
const FLOOR_MARGIN = { top: 30, right: 30, bottom: 44, left: 122 };
const FLOOR_INNER_W = FLOOR_W - FLOOR_MARGIN.left - FLOOR_MARGIN.right;
const FLOOR_INNER_H = FLOOR_H - FLOOR_MARGIN.top - FLOOR_MARGIN.bottom;

/**
 * Three checkpoints, each bar split at the accuracy it keeps when it is
 * forbidden to reason. The shaded band is the claim: gagged, every model lands
 * in the same narrow strip, and the strip does not move with size. There is no
 * size axis and no line through the points, deliberately.
 */
function FloorChart() {
  const rows = F3.models;
  const maxBlurt = Math.max(...rows.map((m) => m.blurtAccuracy));
  const x = (v: number) => (v / 100) * FLOOR_INNER_W;
  const rowH = FLOOR_INNER_H / rows.length;
  const barH = 22;
  const crossX = x(F3.cross.ungagged_small_accuracy * 100);

  return (
    <ChartFrame
      title={`Share of 100 MATH-500 problems solved by three Qwen2.5-Instruct checkpoints, each bar split into the part it keeps when forbidden to reason and the part its reasoning adds. Forbidden to reason: ${rows.map((m) => `${m.label} ${pct(m.blurtAccuracy)}`).join(", ")}. Left alone: ${rows.map((m) => `${m.label} ${pct(m.bareAccuracy)}`).join(", ")}.`}
      width={FLOOR_W}
      height={FLOOR_H}
      margin={FLOOR_MARGIN}
      xLabel="share of the same 100 problems solved (%)"
    >
      {/* the floor: every gagged bar ends inside this strip */}
      <rect x={0} y={0} width={x(maxBlurt * 100)} height={FLOOR_INNER_H} className="fill-wrong opacity-10" />
      <line
        x1={x(maxBlurt * 100)}
        x2={x(maxBlurt * 100)}
        y1={0}
        y2={FLOOR_INNER_H}
        className="stroke-wrong"
        strokeWidth={1}
        strokeDasharray="3 3"
      />
      <text x={x(maxBlurt * 100) + 6} y={-10} className="fill-wrong text-[11px] font-semibold">
        the floor: forbidden to reason, all three land in here
      </text>

      {/* gridlines */}
      {[0, 25, 50, 75, 100].map((t) => (
        <g key={t}>
          <line x1={x(t)} x2={x(t)} y1={0} y2={FLOOR_INNER_H} className="stroke-grid" strokeWidth={1} />
          <text x={x(t)} y={FLOOR_INNER_H + 16} textAnchor="middle" className="fill-ink-muted text-[11px]">
            {t}
          </text>
        </g>
      ))}

      {/* the cross-model comparison, as a guide the eye can land on */}
      <line
        x1={crossX}
        x2={crossX}
        y1={0}
        y2={FLOOR_INNER_H}
        className="stroke-compute"
        strokeWidth={1}
        strokeDasharray="4 4"
      />

      {rows.map((m, i) => {
        const y = i * rowH + rowH / 2 - barH / 2;
        const kept = x(m.blurtAccuracy * 100);
        const added = x(m.bareAccuracy * 100) - kept;
        return (
          <g key={m.modelId}>
            <text x={-10} y={y + barH / 2 + 4} textAnchor="end" className="fill-ink text-xs">
              {m.label.replace("Qwen2.5-", "").replace("-Instruct", "")}
            </text>
            <text x={-10} y={y + barH / 2 + 17} textAnchor="end" className="fill-ink-muted text-[10px]">
              {m.quant}
            </text>
            <rect x={0} y={y} width={kept} height={barH} className="fill-wrong" />
            <rect x={kept} y={y} width={added} height={barH} className="fill-compute" />
            <text x={kept + added + 8} y={y + barH / 2 + 4} className="fill-ink text-xs tabular-nums">
              {pct(m.bareAccuracy)}
            </text>
            <text
              x={kept + added / 2}
              y={y + barH / 2 + 4}
              textAnchor="middle"
              className="fill-canvas text-[11px] font-semibold tabular-nums"
            >
              +{m.deltaPts}
            </text>
          </g>
        );
      })}
    </ChartFrame>
  );
}

/* -------------------------------------------------------------------- page */

export function Page5() {
  const page = getPage(PAGE_N)!;
  const recordInteraction = useStore((s) => s.recordInteraction);

  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    setReducedMotion(prefersReducedMotion());
  }, []);
  const [announce, setAnnounce] = useState("");

  // ---- Step 1: the specimen -------------------------------------------
  const bareIndex = useMemo(() => F1.tabs.findIndex((t) => t.condition === "bare"), []);
  const [tabIndex, setTabIndex] = useState(bareIndex);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  const tab = F1.tabs[tabIndex];
  const maxStep = tab.steps.length;
  const done = step >= maxStep;
  const written = step === 0 ? 0 : tab.steps[step - 1].tokenEnd;
  const gaggedTab = F1.tabs.find((t) => t.condition === "forced_blurt")!;
  /** Placeholder width for a step still to come, scaled by the tokens it holds. */
  const longestStep = Math.max(...tab.steps.map((s) => s.tokenEnd - s.tokenStart));
  const barPct = (tokens: number) => Math.max(14, Math.round((tokens / longestStep) * 90));

  const pickTab = (i: number) => {
    recordInteraction(PAGE_N);
    setTabIndex(i);
    setStep(0);
    setPlaying(false);
    setAnnounce(
      F1.tabs[i].condition === "bare"
        ? "Bare prompt: nothing in it asks for working. Press Next or Play to walk what the model wrote anyway."
        : "The same question with the working forbidden. Press Next to see the whole answer.",
    );
  };

  const go = (next: number) => {
    recordInteraction(PAGE_N);
    setPlaying(false);
    const clamped = Math.min(maxStep, Math.max(0, next));
    setStep(clamped);
    setAnnounce(
      clamped >= maxStep
        ? `${tab.correct ? "Correct" : "Wrong"}: the model answered ${tab.extractedAnswer} in ${tab.tokensGenerated} tokens, and the answer is ${F1.groundTruth}.`
        : clamped === 0
          ? "Back to the start of the output."
          : tidyMath(tab.steps[clamped - 1].text),
    );
  };

  useEffect(() => {
    if (!playing || reducedMotion) return;
    if (step >= maxStep) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setStep((s) => Math.min(maxStep, s + 1)), STEP_MS);
    return () => clearTimeout(t);
  }, [playing, reducedMotion, step, maxStep]);

  // ---- Step 2: the gag -------------------------------------------------
  const [gagged, setGagged] = useState(false);
  const T = SUPPRESSION_TABLE;
  const shown = gagged ? F2.blurt : F2.bare;

  const setGag = (on: boolean) => {
    recordInteraction(PAGE_N);
    setGagged(on);
    setAnnounce(
      on
        ? `Forbidden to reason, the model solves ${F2.blurt.nCorrect} of ${F2.blurt.n}: ${T.chainOnly} problems it had are gone and ${T.blurtOnly} it did not have arrive.`
        : `Left alone, the model solves ${F2.bare.nCorrect} of ${F2.bare.n}.`,
    );
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
      <p className="max-w-2xl text-lg text-ink-muted">
        Act 1 ended on a question: can a machine be <strong className="text-ink">walked down a
        road</strong>? A model you can download in 2026 walks it unasked, so the only way left to
        measure what the road is worth is to <strong className="text-ink">take it away</strong>.
      </p>

      {/* Provenance, as a specimen label rather than a banner: hairline rules,
          no fill, the instrument on one mono line, and the download carrying the
          page's own button vocabulary so it is the only lit thing here. It is
          the pipeline's whole claim, so it stays above the fold. */}
      <div className="flex flex-col gap-4 border-y border-grid py-4 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
        <div className="flex min-w-0 flex-col gap-2">
          <p className="text-sm text-ink">
            Every figure below is one measurement of ours, not a redrawing of anyone&apos;s. The
            notebook that made them opens in a replay mode that redraws every figure here from
            those traces, on no GPU, in about a minute.
          </p>
          <p className="font-mono text-xs leading-relaxed tabular-nums text-ink-muted">
            Qwen2.5-Instruct · 1.5B, 3B, 7B · bf16, greedy, {M.decoding.max_new_tokens}-token cap ·
            MATH-500 levels 4 and 5, n = {M.items.n} paired items · 900 generations · run{" "}
            {M.run_id} · {RUN_DATE}
          </p>
        </div>
        <a
          className="inline-flex shrink-0 items-start gap-2 self-start rounded border border-compute px-3 py-2 text-sm font-semibold leading-snug text-compute lg:max-w-[15rem]"
          href={NOTEBOOK_ZIP}
          download
        >
          <span aria-hidden="true">⤓</span>
          <span className="flex flex-col">
            Download the notebook, the harness and all 900 traces
            <span className="font-normal text-ink-muted">zip, {NOTEBOOK_SIZE}</span>
          </span>
        </a>
      </div>

      {/* Each step (left) sits beside its own note (right); the whole page scrolls. */}
      <div className="grid gap-x-8 gap-y-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
        {/* Step 1 — the definition. No figure: the reader needs the term before
            any measurement of it means anything, and the deck has already built
            both halves of it (page 1's two speeds, page 4's roads). */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            1. What a chain of thought is
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              the term, before the measurement
            </span>
          </h2>
          <p className="text-ink">
            Page 1 handed you <strong className="font-code">{S2.prompt}</strong> and you did not
            recognise the answer, you built it: {S2_RESULTS.join(", then ")}. A{" "}
            <strong>chain of thought</strong> is that building written down, a thread of steps
            running from the question to the goal. What is strange in a language model is that the
            thread is not a report of the thinking,{" "}
            <strong>it is the thinking</strong>: every step is text the model has to write before it
            can write the next one.
          </p>
        </section>
        <Note kicker="Cited for the technique">
          <p>
            Wei et al. 2022 put worked chains in the prompt. Kojima et al. 2022 found one appended
            sentence was often enough.
          </p>
          <p>Every number on this page is ours, not theirs.</p>
          <div className="flex flex-wrap gap-2">
            <CitationBadge citation={WEI} />
            <CitationBadge citation={KOJIMA} />
          </div>
        </Note>

        {/* Step 2 — figure 1 */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            2. A chain nobody asked for
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              one problem · one model · two prompts
            </span>
          </h2>
          <p className="text-ink-muted">
            Here is one, from a model you can download. Below is a single MATH-500 problem put twice
            to Qwen2.5-3B-Instruct, at the same decoding settings. The two prompts are the same
            string apart from what is appended at the end: the first stops at the question, the
            second adds an order to skip the working and answer. Pick a prompt and step through what
            the model actually wrote. Nothing in the first one asks for a chain, and{" "}
            {F1.tabs[bareIndex].tokensGenerated} tokens of chain arrive anyway.
          </p>
          <section
            aria-label="One problem, two prompts"
            className="flex flex-col gap-4 rounded-lg border border-grid bg-surface p-4"
          >
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className={chip}>Qwen2.5-3B-Instruct · bf16 · greedy</span>
              <span className={chip}>MATH-500 level {F1.level}</span>
              <span className={chip}>picked from {F1.nCandidates} problems that qualified</span>
            </div>

            {/* Prompt and trace are listings, so they get the one licensed
                non-serif face. A 573-token trace in the broadsheet serif is a
                wall; in mono the reader can see where a step starts and ends. */}
            <p className="font-code text-sm leading-relaxed text-ink">{tidyMath(F1.question)}</p>

            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Prompt">
              <span className="text-sm font-semibold text-ink">Prompt:</span>
              {F1.tabs.map((t, i) => (
                <button
                  key={t.condition}
                  type="button"
                  aria-pressed={i === tabIndex}
                  onClick={() => pickTab(i)}
                  className={seg(i === tabIndex)}
                >
                  {t.condition === "bare" ? "the question alone" : "working forbidden"}
                </button>
              ))}
            </div>

            <details className="group rounded border border-dashed border-grid bg-surface-raised p-3">
              <summary className="flex cursor-pointer list-none items-center gap-2 text-xs text-compute focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-compute">
                <span aria-hidden="true" className="font-mono transition-transform group-open:rotate-90">
                  ▸
                </span>
                see the full prompt
              </summary>
              <pre className="mt-2 whitespace-pre-wrap break-words font-code text-xs leading-relaxed text-ink-muted">
                {tab.promptBefore}
                {F1.promptStem}
                {tab.promptAfter ? <span className="bg-wrong/25 text-ink">{tab.promptAfter}</span> : null}
              </pre>
              <p className="mt-2 border-t border-dashed border-grid pt-2 text-xs text-ink-muted">
                {tab.promptAfter
                  ? "Highlighted: the whole of the manipulation."
                  : "The prompt ends there. Nothing in it asks for working."}
              </p>
            </details>

            {/* the model's own output, revealed at real token boundaries */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                what the model wrote back →
              </p>
              <div className="mt-1 flex flex-col gap-2 rounded-lg border-l-4 border-compute bg-surface-raised p-3">
                {/* Unrevealed steps stay on the page as bars scaled by how many
                    tokens they hold, so the length of what is coming is visible
                    before the first press. */}
                <ol className="flex flex-col gap-2">
                  {tab.steps.map((s, i) =>
                    i < step ? (
                      <li
                        key={i}
                        className="flex gap-2 font-code text-xs leading-relaxed text-ink motion-safe:animate-fade-in"
                      >
                        <span className="shrink-0 text-compute">{i + 1}</span>
                        <span className="whitespace-pre-wrap">{tidyMath(s.text)}</span>
                      </li>
                    ) : (
                      <li key={i} className="flex items-center gap-2" aria-hidden="true">
                        <span className="font-code text-xs text-ink-muted">{i + 1}</span>
                        <span
                          className="h-2 rounded-sm bg-grid"
                          style={{ width: `${barPct(s.tokenEnd - s.tokenStart)}%` }}
                        />
                      </li>
                    ),
                  )}
                </ol>
                {step === 0 ? (
                  <p className="flex items-center gap-2 text-sm text-ink-muted">
                    <span aria-hidden="true" className="animate-pulse text-compute">
                      ▍
                    </span>
                    press Next{reducedMotion ? "" : " or Play"} to walk what it wrote
                  </p>
                ) : null}
                <TokenMeter
                  written={written}
                  total={tab.tokensGenerated}
                  blurtTokens={gaggedTab.tokensGenerated}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => go(step - 1)}
                disabled={step === 0}
                className="rounded border border-grid bg-surface-raised px-3 py-2 text-sm text-ink disabled:opacity-50"
              >
                ◂ Back
              </button>
              <button
                type="button"
                onClick={() => go(step + 1)}
                disabled={done}
                className="rounded bg-compute px-4 py-2 text-sm font-semibold text-canvas disabled:opacity-50"
              >
                Next ▸
              </button>
              {!reducedMotion ? (
                <button
                  type="button"
                  onClick={() => {
                    recordInteraction(PAGE_N);
                    setPlaying(true);
                  }}
                  disabled={playing || done}
                  className="rounded border border-compute px-3 py-2 text-sm font-semibold text-compute disabled:opacity-50"
                >
                  ▶ Play
                </button>
              ) : null}
              <span className="font-mono text-xs tabular-nums text-ink-muted">
                step {step} of {maxStep}
              </span>
            </div>

            {done ? (
              <div
                className={`rounded-lg border-l-4 p-3 text-ink ${
                  tab.correct ? "border-correct bg-correct/15" : "border-wrong bg-wrong/15"
                }`}
              >
                <span className={`font-semibold ${tab.correct ? "text-correct" : "text-wrong"}`}>
                  {tab.correct ? "✓" : "✗"} it answered {tab.extractedAnswer}
                  {tab.correct ? "" : `, and the answer is ${F1.groundTruth}`}.
                </span>{" "}
                <span className="font-mono text-sm tabular-nums text-ink-muted">
                  {tab.tokensGenerated} tokens · {maxStep} {maxStep === 1 ? "step" : "steps"}
                </span>
              </div>
            ) : null}
          </section>
        </section>
        <Note kicker="One trace only">
          <p>
            This is a specimen, not evidence. It is one problem out of {F1.nCandidates} that
            qualified, and the evidence is the next two figures.
          </p>
          <p>Play walks the real token boundaries the run recorded, not a typewriter.</p>
        </Note>

        {/* Step 3 — figure 2 */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            3. What the chain is worth
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              the same {F2.bare.n} problems, both ways
            </span>
          </h2>
          <p className="text-ink-muted">
            One trace proves nothing, so both prompts were run across{" "}
            {F2.bare.n} problems from the same difficulty band. Below is that comparison: the model
            reasoning freely, against the same model forbidden to reason. Left alone it writes a
            median of {CLOSE.bare_median_tokens} tokens of working and solves{" "}
            <strong className="text-ink">{F2.bare.nCorrect} of the {F2.bare.n}</strong>. Gagged, it
            answers in {CLOSE.blurt_median_tokens} tokens and solves{" "}
            <strong className="text-ink">{F2.blurt.nCorrect}</strong>. Each square below is one of
            those {F2.bare.n} problems; the switch is the same suffix you just read.
          </p>
          <section
            aria-label="The cost of forbidding the working"
            className="flex flex-col gap-4 rounded-lg border border-grid bg-surface p-4"
          >
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="The gag">
              <span className="text-sm font-semibold text-ink">Qwen2.5-3B-Instruct:</span>
              <button type="button" aria-pressed={!gagged} onClick={() => setGag(false)} className={seg(!gagged)}>
                left alone
              </button>
              <button type="button" aria-pressed={gagged} onClick={() => setGag(true)} className={seg(gagged)}>
                forbidden to reason
              </button>
            </div>
            <p className="font-code text-xs text-ink-muted">
              {gagged
                ? `appended to the prompt:${M.conditions.forced_blurt}`
                : "appended to the prompt: nothing at all"}
            </p>

            {/* The grid is the figure and gets the card's width. An earlier
                build sized its track `auto`, which collapsed 100 problems into a
                110px smudge; keep it on an fr track. */}
            <div className="grid gap-5 sm:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] sm:items-center">
              <PairedGrid gagged={gagged} />
              <div className="flex flex-col gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    solved, of the same {shown.n} problems
                  </p>
                  <p className="font-mono text-5xl tabular-nums text-ink">{shown.nCorrect}</p>
                  <p className="font-mono text-xs tabular-nums text-ink-muted">
                    95% interval {pct(shown.ci[0])} to {pct(shown.ci[1])} · median{" "}
                    {shown.medianTokens} tokens written
                  </p>
                </div>
                <ul className="flex flex-col gap-1 text-xs text-ink-muted">
                  <li className="flex items-center gap-2">
                    <span className="h-3 w-3 shrink-0 rounded-sm border border-correct bg-correct" />
                    solved here
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-3 w-3 shrink-0 rounded-sm border border-wrong bg-wrong" />
                    solved when left alone, lost to the gag ({T.chainOnly})
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-3 w-3 shrink-0 rounded-sm border border-grid bg-surface-raised" />
                    unsolved either way ({T.neither}), plus the {T.blurtOnly} that only the gag gets
                    right
                  </li>
                </ul>
              </div>
            </div>

            <div
              className={`rounded-lg border-l-4 px-3 py-2 text-sm ${
                gagged ? "border-wrong bg-wrong/15" : "border-correct bg-correct/15"
              }`}
            >
              <p className={`font-semibold ${gagged ? "text-wrong" : "text-correct"}`}>
                {gagged
                  ? `✗ ${T.chainOnly} problems it had are gone. ${T.blurtOnly} it did not have arrive.`
                  : `✓ press "forbidden to reason" and watch ${T.chainOnly} of these go out.`}
              </p>
              <p className="text-ink">
                Forbidding the working costs {F2.suppression.deltaPts} points ·{" "}
                {pLabel(F2.suppression.p)}, exact McNemar over the {T.chainOnly + T.blurtOnly}{" "}
                problems where the two conditions disagree
              </p>
            </div>
          </section>
        </section>
        <Note kicker="How to read it">
          <p>Flip the gag and count the squares that change colour.</p>
          <p>
            One square is one problem and the counts are measured, but which square a problem sits
            in is arrangement, not data.
          </p>
          <p>
            Answers are extracted and graded by ch03&apos;s{" "}
            <a
              className="underline underline-offset-2"
              href="https://github.com/rasbt/reasoning-from-scratch"
              target="_blank"
              rel="noopener noreferrer"
            >
              reasoning-from-scratch
            </a>{" "}
            functions, used unchanged, so the grading is not ours to defend.
          </p>
        </Note>

        {/* Step 4 — figure 3 */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            4. The same test on two more checkpoints
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              three checkpoints · same {F2.bare.n} problems · same harness
            </span>
          </h2>
          <p className="text-ink-muted">
            A result from one checkpoint could be a quirk of that checkpoint, so the whole contrast
            was run again on the 1.5B and the 7B. Each bar below is one model&apos;s score on those
            same {F2.bare.n} problems, split in two: the left segment is what that model keeps when
            it is forbidden to reason, and the right segment is what the working adds on top. The
            thing to watch is where the left segments end, not where the bars do.
          </p>
          <section
            aria-label="The floor is flat"
            className="flex flex-col gap-4 rounded-lg border border-grid bg-surface p-4"
          >
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className={chip}>Qwen2.5-Instruct · 1.5B, 3B, 7B · all bf16</span>
              <span className={chip}>greedy · the same {F2.bare.n} problems</span>
            </div>
            <FloorChart />
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-muted">
              <span className="flex items-center gap-2">
                <span className="h-3 w-5 rounded-sm bg-wrong" /> solved with the working forbidden
              </span>
              <span className="flex items-center gap-2">
                <span className="h-3 w-5 rounded-sm bg-compute" /> added by the working
              </span>
              <span className="flex items-center gap-2">
                <span className="h-3 w-5 rounded-sm bg-wrong opacity-20" /> the floor: all three
                gagged bars end inside it
              </span>
              <span className="flex items-center gap-2">
                <span className="h-3 w-px bg-compute" /> the 1.5B, left alone
              </span>
            </div>
            <div className="rounded-lg border-l-4 border-compute bg-surface-raised px-3 py-2 text-ink">
              A 7B forbidden to reason solves{" "}
              <strong className="font-mono">{pct(F3.cross.gagged_large_accuracy)}</strong>. A 1.5B
              allowed to reason solves{" "}
              <strong className="font-mono">{pct(F3.cross.ungagged_small_accuracy)}</strong>. The
              working is worth more than {F3.cross.param_ratio.toFixed(1)} times the parameters ·{" "}
              {pLabel(F3.cross.p)}, {F3.cross.fixed} problems one way and {F3.cross.broken} the
              other.
            </div>
          </section>
          <p className="text-ink-muted">
            The right-hand ends fan out with size, the way you would expect. The left-hand ends do
            not: forbidden to reason, all three land in the same narrow strip, and that flat floor
            is the finding.
          </p>
        </section>
        <Note kicker="Limits">
          <p>
            Three checkpoints are not a scaling law, and nothing here is plotted against size.
          </p>
          <p>
            {pct(PAGE5.truncation.worst.rate)} of the {PAGE5.truncation.worst.condition} traces hit
            the token cap, which biases the headline {PAGE5.truncation.biases_headline}.
          </p>
          <p>
            &ldquo;Forbidden to reason&rdquo; is one phrasing and another would move the floor. And
            the run records whether working appeared and whether the answer landed, never whether
            the working was sound.
          </p>
        </Note>

        {/* Close */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">5. What the working cost</h2>
          <div className="flex flex-col gap-3 rounded-lg border border-grid bg-surface p-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="flex flex-col rounded-lg border-l-4 border-wrong bg-surface-raised px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  forbidden to reason
                </p>
                <p className="font-mono text-2xl tabular-nums text-ink">
                  {CLOSE.blurt_median_tokens} tokens
                </p>
                <p className="font-mono text-xs tabular-nums text-ink-muted">
                  {pct(CLOSE.blurt_accuracy)} solved
                </p>
              </div>
              <div className="flex flex-col rounded-lg border-l-4 border-compute bg-surface-raised px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-compute">
                  left alone
                </p>
                <p className="font-mono text-2xl tabular-nums text-ink">
                  {CLOSE.bare_median_tokens} tokens
                </p>
                <p className="font-mono text-xs tabular-nums text-ink-muted">
                  {pct(CLOSE.bare_accuracy)} solved
                </p>
              </div>
              <div className="flex flex-col rounded-lg border-l-4 border-grid bg-surface-raised px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  the trade
                </p>
                <p className="font-mono text-2xl tabular-nums text-ink">
                  ×{CLOSE.token_multiple}
                </p>
                <p className="font-mono text-xs tabular-nums text-ink-muted">
                  the tokens, for {CLOSE.suppression_pts} points
                </p>
              </div>
            </div>
            <p className="text-ink">
              You have done this. You told the model to skip the working and answer, and the answer
              got worse.{" "}
              <em className="text-ink-muted">
                Page 6 asks how much of that working it actually needed, and what happens when you
                cut it off mid-sentence.
              </em>
            </p>
          </div>
        </section>
        <Note kicker="Measured, not plotted">
          <p>
            A third prompt was run and is not drawn: adding &ldquo;Explain step by step.&rdquo; to a
            model that already reasons moved the score by {F2.instruction.deltaPts.toFixed(1)}{" "}
            points,{" "}
            {F2.instruction.fixed} problems fixed and {F2.instruction.broken} broken, ±
            {F2.instructionBoundPts.toFixed(1)} points. That is a bound and not a zero, it is a
            result about training rather than prompting, and page 12 opens on it.
          </p>
          <p>
            The worked-example rungs are off the ladder for a related reason: across our ablations
            they moved the <span className="font-code">{"\\boxed{}"}</span> answer-format rate far
            more than the score.
          </p>
        </Note>
      </div>

      <div aria-live="polite" className="sr-only">
        {announce}
      </div>
      <PageNav n={PAGE_N} />
    </article>
  );
}
