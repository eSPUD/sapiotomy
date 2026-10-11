"use client";

/**
 * Page 9, "Outcome vs Process Supervision" — measured, not authored.
 *
 * Page 8 ended on what the judge is actually reading. Here is the answer, and it
 * is a fork: grade the final answer, or grade every step.
 *
 * The specimens are real chains, chipped as measured, drawn from page 7's pile;
 * `@/lib/page09` refuses to load a run that failed the notebook's gates, so a
 * label on this page is always one a grader that actually ran produced.
 *
 * Lucky and Broken are one legible problem: the GCD of 3339, 2961 and 1491. Its
 * steps are one-line Euclidean divisions a reader can check by hand, and the
 * break is a single arithmetic slip (`2961 = 378 * 7 + 105`, when 378 * 7 is
 * 2646, so the remainder is 315). The Lucky chain makes that slip and still lands
 * on 21; the Broken chain makes it and lands on 3. Same division, opposite luck.
 * That pairing replaces a brute-force parenthesisation whose only false step was
 * buried inside a fourteen-way enumeration nobody could mark. Clean stays its own
 * cleaner problem.
 *
 * The PRM misses the slip on both chains: it scores the proven-false line above
 * its threshold and calls it sound. That is not a bug to hide, it is the page's
 * point with a number on it. The checker's underline is a fact; the PRM's chip is
 * an opinion, and here the opinion is the one that is wrong.
 *
 * The four beats:
 *   1. WHAT CAN BE GRADED AT ALL. Three conditions on a gradable step: a fact to
 *      be right about, a right answer that can still hide a wrong step, and a unit
 *      big enough to carry a claim. Then the two instruments and their opposite
 *      reach.
 *   2. FIND THE BREAK. One question, one click, re-answerable: which line goes
 *      wrong, or does nothing? The reveal underlines what the checker proved,
 *      chips what the PRM opined, and lets the reader grade again.
 *   3. WHAT STEP GRADING BUYS. One figure, framed on the PRM: how many right
 *      answers each grader can catch bad reasoning inside. A rate, and nothing
 *      else.
 *   4. WHERE THE CHAIN BREAKS. The other question about the same chains: not how
 *      often a break is findable but where it falls and how many there are. The
 *      median position in a line, then the break-count spike as a figure.
 *
 * Run conditions (decoding, dates, segmentation) are the notebook's to state,
 * and so is the PRM's measured reliability. Page 15's audit-surface beat (the
 * 5.8% sliver, with the PRM's AUC, recall and specificity drawn inside it) was
 * moved here on 2026-08-10 and cut from the deck the same day. It was a real
 * claim and it did not fit: beat 3 is one figure with three qualifications
 * already, and a second bar restating step 1's split pushed the beat past what
 * a reader will carry. The AUC rule below survived the attempt intact.
 *
 * The margins hold only what a reader looking at the thing beside them cannot
 * work out: how to read a step with no underline. A limit on a figure is not a
 * margin note, it is a caption, so the PRM's fitted cut-off and the checker's
 * denominator both sit under the bars they qualify.
 *
 * Lightman et al. 2023 is cited for the technique and priority; the numbers on
 * screen are our own. Its References note sits beside beat 1, the beat that
 * carries the inline marker, per the house rule on pages 3-8. It used to sit
 * beside beat 3, two screens below the only Cite on the page, where a reader
 * following the marker had nothing to find.
 */

import { useState } from "react";
import { Handoff } from "@/components/Handoff";
import { ChartFrame } from "@/components/ChartFrame";
import { Cite, RefItem } from "@/components/Cite";
import { PageNav } from "@/components/PageNav";
import { NotebookDownload } from "@/components/NotebookDownload";
import { PAGE9, pct, tidyMath, type Specimen } from "@/lib/page09";
import { ACTS, getPage } from "@/lib/pages";
import { useStore } from "@/store/useStore";

const PAGE_N = 9;
const NOTEBOOK_ZIP = "/notebooks/page-09-outcome-vs-process.zip";
const NOTEBOOK_SIZE = "1.6 MB";

/** Reference numbers, in order of first appearance on the page. */
const REF = {
  lightman: 1,
} as const;

type Mode = "outcome" | "process";
/** The reader's single answer: the index of the line that breaks, or none. */
type Pick = number | "none";

/** Presentation only: what each measured role is called on screen. */
const ROLES: { key: string; label: string; kind: string; specimen: Specimen }[] = [
  {
    key: "lucky",
    label: "Lucky",
    kind: "right answer, false step",
    specimen: PAGE9.lucky,
  },
  {
    key: "broken",
    label: "Broken",
    kind: "wrong answer, one break",
    specimen: PAGE9.broken,
  },
  {
    key: "clean",
    label: "Clean",
    kind: "right answer, nothing false",
    specimen: PAGE9.clean,
  },
];

/** A margin note that sits beside its section and scrolls with the page. */
function Note({ kicker, children }: { kicker: string; children: React.ReactNode }) {
  return (
    <aside className="flex flex-col gap-2 text-sm text-ink-muted lg:pt-9">
      <p className="text-xs font-semibold font-eyebrow uppercase tracking-wide text-ink-muted">{kicker}</p>
      {children}
    </aside>
  );
}

/**
 * Split a step around the exact words the checker recomputed, so the reveal can
 * underline the claim in place rather than restating it underneath. The claim is
 * a verbatim substring of the step, and the split runs on the RAW text so
 * `tidyMath` never has to survive being applied twice to the same characters. If
 * a future run breaks the substring guarantee this returns null and the step
 * renders whole and unmarked, which loses the underline rather than dropping text.
 */
function splitOnClaim(text: string, claim: string | null) {
  if (!claim) return null;
  const at = text.indexOf(claim);
  if (at < 0) return null;
  const before = text.slice(0, at);
  const after = text.slice(at + claim.length);
  return {
    before: tidyMath(before),
    claim: tidyMath(claim),
    after: tidyMath(after),
    gapBefore: /\n\s*$/.test(before) ? "\n" : " ",
    gapAfter: /^\s*\n/.test(after) ? "\n" : " ",
  };
}


/* The break-count histogram, sized to sit inline under beat two's paragraph. */
const B_W = 400;
const B_H = 168;
const B_M = { top: 20, right: 12, bottom: 40, left: 34 };
const B_IW = B_W - B_M.left - B_M.right;
const B_IH = B_H - B_M.top - B_M.bottom;

/**
 * How many false steps a wrong chain actually contains, which the median share-sound
 * figure above cannot show. The median is a statement about WHERE the break falls;
 * this is a statement about HOW MANY there are, and the two answer different
 * questions about the same 44 chains.
 *
 * The shape is the argument: the distribution is not a spread around a typical value,
 * it is a spike. Nearly three chains in four go wrong in exactly one place, which is
 * the fact that makes step-level grading worth its cost at all: if a wrong chain were
 * wrong throughout, there would be nothing for a step grader to localise and outcome
 * grading would lose nothing by throwing the chain away whole.
 *
 * `breaksPerChain` and `shareWithOneFalseStep` were both loaded by lib/page09.ts and
 * drawn nowhere until this figure. n is small (44) and printed on the figure rather
 * than left to the caption, because a five-bar chart invites more confidence than 44
 * chains can pay for.
 */
function BreakCounts() {
  const loc = PAGE9.localisation;
  const bins = Object.entries(loc.breaksPerChain)
    .map(([k, count]) => ({ n: Number(k), count }))
    .sort((a, b) => a.n - b.n);
  const total = bins.reduce((sum, b) => sum + b.count, 0);
  const peak = Math.max(...bins.map((b) => b.count));
  const bw = B_IW / bins.length;

  return (
    <ChartFrame
      title={`How many false steps each of the ${total} localisable wrong chains contains. ${bins
        .map((b) => `${b.count} chain${b.count === 1 ? "" : "s"} with ${b.n} false step${b.n === 1 ? "" : "s"}`)
        .join(", ")}. Most wrong chains go wrong in exactly one place.`}
      width={B_W}
      height={B_H}
      margin={B_M}
      xLabel="false steps in the chain"
      yLabel="chains"
    >
      {bins.map((b, i) => {
        const h = (b.count / peak) * B_IH;
        const hot = b.n === 1;
        return (
          <g key={b.n}>
            <rect
              x={i * bw + bw * 0.18}
              y={B_IH - h}
              width={bw * 0.64}
              height={h}
              className={hot ? "fill-compute" : "fill-ink opacity-30"}
            />
            <text
              x={i * bw + bw / 2}
              y={B_IH - h - 5}
              textAnchor="middle"
              className={`text-[11px] font-semibold ${hot ? "fill-compute-ink" : "fill-ink-muted"}`}
            >
              {b.count}
            </text>
            <text
              x={i * bw + bw / 2}
              y={B_IH + 15}
              textAnchor="middle"
              className="fill-ink-muted text-[11px]"
            >
              {b.n}
            </text>
          </g>
        );
      })}
      <text x={B_IW} y={10} textAnchor="end" className="fill-ink-muted text-[10px]">
        n = {total} chains
      </text>
    </ChartFrame>
  );
}

export function Page9() {
  const page = getPage(PAGE_N)!;
  const recordInteraction = useStore((s) => s.recordInteraction);

  const [roleKey, setRoleKey] = useState(ROLES[0].key);
  const [mode, setMode] = useState<Mode>("outcome");
  const [picks, setPicks] = useState<Record<string, Pick | undefined>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const role = ROLES.find((r) => r.key === roleKey)!;
  const trace = role.specimen;
  const myPick = picks[roleKey];
  const hasPicked = myPick !== undefined;
  const isRevealed = revealed[roleKey] ?? false;

  // Picks toggle, so a reader can clear one and try another before revealing.
  const pick = (p: Pick) => {
    recordInteraction(PAGE_N);
    setPicks((prev) => ({ ...prev, [roleKey]: prev[roleKey] === p ? undefined : p }));
  };

  // "Grade again" drops the reveal without wiping the pick, so the reader can
  // point at a different line and settle it against the checker as often as they like.
  const gradeAgain = () => {
    recordInteraction(PAGE_N);
    setRevealed((r) => ({ ...r, [roleKey]: false }));
  };

  // The break, and whether the reader put a finger on it. A chain with nothing
  // provably false has "none" for its answer, which is a real answer.
  const breakAt = trace.firstFalse;
  const foundIt = breakAt !== null ? myPick === breakAt : myPick === "none";
  const breakStep = breakAt !== null ? trace.steps[breakAt] : null;
  // The PRM missed the break when it scored the proven-false line as sound.
  const prmMissedBreak =
    breakStep !== null && breakStep.prm !== null && breakStep.prmVerdict !== "false";

  const nRead = trace.steps.filter((s) => s.check !== "unknown").length;
  const prmScored = trace.steps.filter((s) => s.prmVerdict !== null).length;
  // Steps the checker did not prove false. NOT the same as sound: most of them it
  // never read. And not `firstFalse` either, which is an index, not a count.
  const nNotDisproved = trace.steps.length - trace.nFalse;
  // These specimens all score above the PRM's cut on every line, so the reveal has
  // to say so rather than let a reader generalise a grader that never disagrees.
  const prmFlagsNothing = prmScored > 0 && trace.steps.every((s) => s.prmVerdict !== "false");
  const allSpecimensQuiet = ROLES.every((r) =>
    r.specimen.steps.every((s) => s.prmVerdict !== "false"),
  );

  const det = PAGE9.detection;
  const loc = PAGE9.localisation;
  const prm = PAGE9.graders.prm;
  const share = PAGE9.graders.shareUnjudged;

  const fmtRate = (r: number) => (r === 0 ? "0%" : r < 0.05 ? pct(r, 2) : pct(r, 1));
  // The two instruments that actually read the working, both named. The outcome
  // grader is deliberately NOT a bar: it compares only the final answer to the known
  // one, so nothing reads a step and its 0 is true by construction rather than
  // measured, and it is not a model to name. The caption states it as the baseline.
  const prmName = prm ? prm.id.split("/").pop()! : "a process reward model";
  const graders = [
    {
      key: "checker",
      label: "Arithmetic checker",
      reach: "deterministic, re-checkable by hand",
      rate: det.rate,
      tone: "bg-correct/70",
    },
    ...(det.prm && prm
      ? [
          {
            key: "prm",
            label: prmName,
            reach: `trained reward model, ${prm.quantisation}`,
            rate: det.prm.rate,
            tone: "bg-compute",
          },
        ]
      : []),
  ];
  const maxRate = Math.max(...graders.map((g) => g.rate)) || 1;

  return (
    <article className="flex flex-col gap-6">
      {/* The download shares the top line with the act kicker, page 5's shape:
          the first thing on the page after the title row is the way to
          re-derive all of it. Full run conditions (decoding, dates, step
          segmentation) are the notebook's to state. */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="text-xs font-eyebrow uppercase tracking-wide text-ink-muted">
          Act {page.act} · {ACTS[page.act].title}
        </p>
        <NotebookDownload href={NOTEBOOK_ZIP} size={NOTEBOOK_SIZE} />
      </div>
      <h1 className="text-3xl font-bold text-ink">
        <span className="font-mono text-ink-muted">{page.n}. </span>
        {page.title}
      </h1>

      <p className="text-lg text-ink-muted">
        Two ways to grade a student: mark the final answer, or mark{" "}
        <strong className="text-ink">every line of the working</strong>. Where they disagree is
        where the interesting failures live. Every maths teacher who said{" "}
        <em>&ldquo;show your work&rdquo;</em> was defending the second one, and they were right: a
        correct answer reached by a broken method is a trap, and nobody can tell from the answer
        alone.
      </p>

      {/* Page 3's grid: every beat sits in the content column with its margin note
          (or an empty cell) beside it, so nothing runs under the sidenote rail. */}
      <div className="grid gap-x-8 gap-y-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
        {/* Step 1 — the three conditions on a gradable step, then the two instruments. */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">1. What can be graded at all</h2>
          <p className="text-ink-muted">
            Three things have to hold before grading a step means anything.
          </p>
          <ul className="flex flex-col gap-2 text-ink-muted">
            <li>
              <strong className="text-ink">There has to be a fact.</strong> A proof has one at every
              line; a poem has none mid-stanza. Grade the process where the domain has absolutes,
              and grade the outcome where it has taste.
            </li>
            <li>
              <strong className="text-ink">A right answer can be reached by a wrong step.</strong>{" "}
              Arithmetic that slips and still lands right, the way a long multiplication can, is
              exactly what an outcome grader waves through and only a step grader catches.
            </li>
            <li>
              <strong className="text-ink">The unit is the step, not the word.</strong> No word is
              false on its own, because the claim does not exist until the line is finished, so a
              grader scores slices big enough to be checkable rather than tokens.
            </li>
          </ul>
          <p className="text-ink-muted">
            Below, two instruments read these chains with opposite reach. An{" "}
            <strong className="text-ink">arithmetic checker</strong> recomputes only the{" "}
            <strong className="text-ink">
              {pct(1 - share, 1)} of {PAGE9.graders.stepsTotal.toLocaleString()}
            </strong>{" "}
            steps that are closed-form numeric and{" "}
            <span className="rounded-sm bg-correct/15 px-1 underline decoration-correct decoration-2 underline-offset-4">
              underlines what it proves
            </span>
            ; the other {pct(share)} state nothing it can compute. A{" "}
            <strong className="text-ink">process reward model</strong>
            <Cite n={REF.lightman} /> takes the opposite trade: nothing goes unscored, but a score
            is a judgment call where the checker&apos;s label is deterministic arithmetic.
          </p>
        </section>

        {/* House style, pages 3-8: the reference sits beside the step that cites
            it. The marker is in this beat, so the entry is too. */}
        <Note kicker="References">
          <p>Cited for the technique. The numbers here are our own model&apos;s, not theirs.</p>
          <RefItem n={REF.lightman} href="https://arxiv.org/abs/2305.20050" preprint>
            Lightman et al. 2023, <em>Let&apos;s Verify Step by Step</em> (arXiv 2305.20050).
          </RefItem>
        </Note>

        {/* Step 2 — grade it yourself */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            2. Find the break
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              real chains · {PAGE9.run.model.split("/").pop()} · graded twice
            </span>
          </h2>

          {/* trace picker */}
          <div className="flex flex-wrap gap-2">
            {ROLES.map((r) => (
              <button
                key={r.key}
                type="button"
                aria-pressed={roleKey === r.key}
                onClick={() => {
                  setRoleKey(r.key);
                  recordInteraction(PAGE_N);
                }}
                className={`rounded px-3 py-1.5 text-sm ${
                  roleKey === r.key
                    ? "bg-compute text-ink"
                    : "border border-grid bg-surface text-ink-muted"
                }`}
              >
                {r.label}
                <span className="ml-2 text-xs">{r.kind}</span>
              </button>
            ))}
          </div>

          <section
            aria-label="A sampled solution, graded two ways"
            className="flex flex-col rounded-lg border-l-4 border-compute bg-surface"
          >
            <div className="flex flex-col gap-4 p-4">
              <p className="text-sm text-ink-muted">
                <span className="font-mono text-xs">problem · </span>
                {tidyMath(trace.question)}
              </p>

              {/* grading mode */}
              <div className="flex flex-wrap gap-2" role="group" aria-label="Grading style">
                {(
                  [
                    { key: "outcome", label: "Outcome view", sub: "one verdict, at the end" },
                    { key: "process", label: "Process view", sub: "a verdict per step" },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    aria-pressed={mode === m.key}
                    onClick={() => {
                      setMode(m.key);
                      recordInteraction(PAGE_N);
                    }}
                    className={`flex flex-col rounded px-3 py-1.5 text-left text-sm ${
                      mode === m.key
                        ? "bg-compute text-ink"
                        : "border border-grid bg-surface-raised text-ink-muted"
                    }`}
                  >
                    <span className="font-semibold">{m.label}</span>
                    <span className="text-xs">{m.sub}</span>
                  </button>
                ))}
              </div>

              {mode === "outcome" ? (
                <p className="rounded-lg border border-dashed border-grid bg-surface-raised p-3 text-sm text-ink">
                  <strong>An outcome grader reads one thing: the answer.</strong> The working is
                  redacted below because that is exactly what this grader sees of it. Switch to{" "}
                  <strong>Process view</strong> to read the working and find the line that breaks.
                </p>
              ) : !isRevealed ? (
                <p className="rounded-lg border border-dashed border-grid bg-surface-raised p-3 text-sm text-ink">
                  <strong>You be the process grader. Which line goes wrong?</strong> Pick one, or
                  say the chain holds. That is the question a step grader answers and an outcome
                  grader cannot.
                </p>
              ) : null}

              {/* the trace */}
              <ol className="flex flex-col gap-2">
                {trace.steps.map((step, i) => {
                  const showProcess = mode === "process";
                  const shown = showProcess && isRevealed;
                  const parts = shown ? splitOnClaim(step.text, step.claim) : null;
                  return (
                    <li
                      key={i}
                      className={`flex flex-col gap-1.5 rounded-lg border-l-4 p-3 ${
                        shown && step.check === "false"
                          ? "border-wrong bg-wrong/10"
                          : "border-grid bg-surface-raised"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 font-mono text-xs text-compute-ink">{i + 1}</span>
                        {mode === "outcome" ? (
                          <span className="flex flex-1 items-center gap-2">
                            <span
                              aria-hidden="true"
                              className="block h-3 rounded-sm bg-grid"
                              style={{ width: `${Math.min(92, 28 + step.text.length * 0.4)}%` }}
                            />
                            <span className="sr-only">
                              Step {i + 1} is redacted in the outcome view; the outcome grader
                              does not read it. Switch to the process view to read it.
                            </span>
                          </span>
                        ) : parts ? (
                          <span className="flex-1 whitespace-pre-wrap text-sm text-ink">
                            {parts.before}
                            {parts.before ? parts.gapBefore : null}
                            <mark
                              className={`rounded-sm bg-transparent px-1 underline decoration-2 underline-offset-4 ${
                                step.check === "true"
                                  ? "bg-correct/15 text-ink decoration-correct"
                                  : "bg-wrong/15 text-ink decoration-wrong"
                              }`}
                            >
                              {parts.claim}
                            </mark>
                            {parts.after ? parts.gapAfter : null}
                            {parts.after}
                          </span>
                        ) : (
                          <span className="flex-1 whitespace-pre-wrap text-sm text-ink">
                            {tidyMath(step.text)}
                          </span>
                        )}
                        {shown ? (
                          <span className="flex shrink-0 flex-col items-end gap-1">
                            {myPick === i ? (
                              <span className="rounded border border-compute px-2 py-0.5 text-xs text-compute-ink">
                                your pick
                              </span>
                            ) : null}
                            {/* fact: solid chip, and ONLY where there is a fact. */}
                            {step.check !== "unknown" ? (
                              <span
                                className={`rounded px-2 py-0.5 text-xs font-semibold ${
                                  step.check === "true"
                                    ? "bg-correct/25 text-correct-ink"
                                    : "bg-wrong/25 text-wrong-ink"
                                }`}
                              >
                                {step.check === "true" ? "checked: true" : "checked: FALSE"}
                              </span>
                            ) : null}
                            {/* opinion: outlined chip, present on EVERY step */}
                            {step.prm !== null && step.prmVerdict !== null ? (
                              <span
                                className={`rounded border px-2 py-0.5 text-xs ${
                                  step.prmVerdict === "true"
                                    ? "border-correct/50 text-correct-ink"
                                    : "border-wrong/50 text-wrong-ink"
                                }`}
                              >
                                PRM {step.prm.toFixed(2)} ·{" "}
                                {step.prmVerdict === "true" ? "sound" : "flags it"}
                              </span>
                            ) : null}
                          </span>
                        ) : showProcess ? (
                          <button
                            type="button"
                            aria-pressed={myPick === i}
                            aria-label={`Mark step ${i + 1} as the line that goes wrong`}
                            onClick={() => pick(i)}
                            className={`shrink-0 rounded px-2 py-0.5 text-xs ${
                              myPick === i
                                ? "bg-wrong text-ink"
                                : "border border-grid text-ink-muted"
                            }`}
                          >
                            breaks here
                          </button>
                        ) : (
                          <span className="shrink-0 text-xs text-ink-muted">not read</span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>

              {mode === "process" && !isRevealed ? (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    aria-pressed={myPick === "none"}
                    onClick={() => pick("none")}
                    className={`rounded px-3 py-1.5 text-sm ${
                      myPick === "none"
                        ? "bg-correct text-ink"
                        : "border border-grid text-ink-muted"
                    }`}
                  >
                    Nothing here breaks
                  </button>
                  <button
                    type="button"
                    disabled={!hasPicked}
                    onClick={() => {
                      setRevealed((r) => ({ ...r, [roleKey]: true }));
                      recordInteraction(PAGE_N);
                    }}
                    className="rounded bg-compute px-4 py-2 text-sm font-semibold text-ink disabled:opacity-50"
                  >
                    {hasPicked ? "Reveal what the graders found ▸" : "Pick a line first"}
                  </button>
                </div>
              ) : null}

              {mode === "process" && isRevealed ? (
                <div className="flex flex-col gap-2 text-sm text-ink-muted">
                  <p>
                    <strong className={foundIt ? "text-correct-ink" : "text-ink"}>
                      {breakAt !== null
                        ? foundIt
                          ? `You pointed at line ${breakAt + 1}, and that is the line the checker proves false.`
                          : myPick === "none"
                            ? `You passed the chain, but the checker proves line ${breakAt + 1} false.`
                            : `You pointed at line ${(myPick as number) + 1}; the checker proves line ${breakAt + 1} false.`
                        : myPick === "none"
                          ? "Nothing here is provably false, and you said so."
                          : `You flagged line ${(myPick as number) + 1}, and the checker proves nothing false here.`}
                    </strong>{" "}
                    {breakAt === null
                      ? "Which is not the same as proving it sound: the checker reads only arithmetic, and this chain gave it nothing to disprove."
                      : `One line, named. That is the whole of what an outcome grader cannot tell you: it saw only the final answer${trace.outcomeCorrect ? ", which here happened to be right" : ""}.`}
                  </p>
                  {breakStep && prmScored > 0 ? (
                    prmMissedBreak ? (
                      <p>
                        And the PRM missed it. It scored every line, rated the broken one{" "}
                        <strong className="text-ink">{breakStep.prm!.toFixed(2)}</strong>
                        {prm ? ` (above its ${prm.threshold.toFixed(2)} cut)` : ""} and called it
                        sound. Here the checker&apos;s proof is right and the PRM&apos;s opinion is
                        wrong, which is the whole difference between a fact and a score.
                      </p>
                    ) : (
                      <p>
                        The PRM flagged it too, and nothing goes unscored, so it also has a verdict
                        on every sound line above. Those are judgment calls; only the underline is
                        arithmetic.
                      </p>
                    )
                  ) : null}
                  {prmFlagsNothing && det.prm ? (
                    <p>
                      The PRM flagged no line here.{" "}
                      {allSpecimensQuiet
                        ? "Every step of all three chains scores above its cut, so nothing you can click on this page shows it disagreeing."
                        : "Every step of this chain scores above its cut."}{" "}
                      Over the run it does disagree, flagging a step in{" "}
                      <strong className="text-ink">{pct(det.prm.rate, 1)}</strong> of the right
                      answers. That is the bar in the next beat, and these three chains sit at the
                      quiet end of it.
                    </p>
                  ) : null}
                  <button
                    type="button"
                    onClick={gradeAgain}
                    className="self-start rounded border border-grid px-3 py-1.5 text-xs text-ink-muted hover:text-ink"
                  >
                    ↺ Grade another line
                  </button>
                </div>
              ) : null}

              {/* the verdict */}
              <div className="flex flex-col gap-2 border-t border-dashed border-grid pt-3">
                <p className="text-sm text-ink">
                  <span className="font-mono text-ink-muted">final answer → </span>
                  <strong className={trace.outcomeCorrect ? "text-correct-ink" : "text-wrong-ink"}>
                    {trace.answer ? tidyMath(trace.answer) : "not extracted"}
                  </strong>
                  <span className="text-ink-muted">
                    {" "}
                    (truth: {tidyMath(trace.groundTruth)})
                  </span>
                </p>
                {mode === "outcome" ? (
                  <div
                    className={`rounded-lg border-l-4 p-3 text-sm ${
                      trace.outcomeCorrect
                        ? "border-correct bg-correct/15"
                        : "border-wrong bg-wrong/15"
                    }`}
                  >
                    <p className="text-ink">
                      <span
                        className={`font-semibold ${
                          trace.outcomeCorrect ? "text-correct-ink" : "text-wrong-ink"
                        }`}
                      >
                        {trace.outcomeCorrect
                          ? "👍 Outcome grader: pass."
                          : "👎 Outcome grader: fail."}
                      </span>{" "}
                      {trace.outcomeCorrect
                        ? trace.nFalse > 0
                          ? `It reads the last line and stops. It cannot see the ${trace.nFalse} step${trace.nFalse === 1 ? "" : "s"} below that the checker proves false.`
                          : "It reads the last line and stops, and here it happens to be right about the whole chain."
                        : nNotDisproved > 0
                          ? `All ${trace.steps.length} steps are condemned together, including the ${nNotDisproved} the checker never disproved.`
                          : `All ${trace.steps.length} steps are condemned together, one verdict for the lot.`}
                    </p>
                  </div>
                ) : isRevealed ? (
                  <div className="rounded-lg border-l-4 border-compute bg-surface-raised p-3 text-sm">
                    <p className="text-ink">
                      <span className="font-semibold text-compute-ink">Process grader:</span>{" "}
                      {breakAt !== null
                        ? `${
                            breakAt === 0
                              ? "the break is the first line"
                              : `nothing in the ${breakAt} line${breakAt === 1 ? "" : "s"} before the break was disproved`
                          }, so this chain needs one line fixed rather than the whole of it thrown away. ${trace.outcomeCorrect ? "And the outcome grader passed it, break and all." : ""}`
                        : "nothing here is provably false, and the PRM agrees. That is the case that needs no argument, and the reason a clean chain is worth showing beside the other two."}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <div className="rounded-lg border-l-4 border-wrong bg-surface p-4 text-base text-ink">
            <strong className="text-lg">A right answer is not a right chain.</strong> The{" "}
            <em>Lucky</em> chain reaches the right answer through a division the checker proves
            false and the PRM waves through. An outcome grader passes it, page 12&apos;s filter
            would fine-tune on it, and only a step grader can point at the line to fix. How often
            does that happen? The next beat measures it, and the honest answer is smaller than the
            story wants.
          </div>
        </section>

        {/* One reading key, and nothing else. The run conditions and the PRM's
            measured reliability are the notebook's to state; the fitted cut is
            a limit on the bars, so it sits in the figure's caption where the
            bars are. What a reader of this trace cannot work out unaided is
            what the absence of an underline means. */}
        <Note kicker="The underline">
          <p>Nothing underlined means nothing computable, not nothing wrong.</p>
        </Note>

        {/* Step 3 — what step-grading buys, one figure framed on the PRM */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            3. What step grading buys
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              measured · {PAGE9.run.chains.toLocaleString()} chains
            </span>
          </h2>

          <figure className="m-0 flex flex-col gap-3 rounded-lg border-l-4 border-compute bg-surface p-4">
            <figcaption className="text-sm font-semibold text-ink">
              How often a right answer hides a false step, measured two ways
            </figcaption>
            <div
              className="flex flex-col gap-2"
              role="img"
              aria-label={`Of the right answers this model gave, a false step is provable by the deterministic arithmetic checker in ${fmtRate(det.rate)}${det.prm ? ` and flagged by ${prmName} in ${fmtRate(det.prm.rate)}` : ""}. An outcome grader, which reads only the final answer, catches none of them.`}
            >
              {graders.map((g) => (
                <div key={g.key} className="flex items-center gap-3 text-sm">
                  <span className="w-36 shrink-0 leading-tight">
                    <span className="text-ink">{g.label}</span>
                    <span className="block text-xs text-ink-muted">{g.reach}</span>
                  </span>
                  <div className="h-5 flex-1 rounded bg-surface-raised">
                    <div
                      className={`h-5 rounded ${g.tone}`}
                      style={{ width: `${Math.max(g.rate === 0 ? 0 : 3, (g.rate / maxRate) * 100)}%` }}
                    />
                  </div>
                  <span className="w-14 shrink-0 text-right font-mono tabular-nums text-ink">
                    {fmtRate(g.rate)}
                  </span>
                </div>
              ))}
            </div>
            {/* One entry per bar, plus the baseline that is not drawn as one. This
                used to be a single paragraph carrying all three graders and every
                qualification at once, which at this size nobody read. The content is
                the same and none of it moved to a margin, because a limit on a figure
                is a caption; it is the shape that changed, and the jargon went. */}
            <dl className="flex flex-col gap-2 text-sm text-ink-muted">
              <div>
                <dt className="inline font-semibold text-ink">Outcome grader, 0%. </dt>
                <dd className="inline">
                  It compares the final answer to the known one and never opens the working, so it
                  catches none of this by construction. The question is what reading the steps
                  adds.
                </dd>
              </div>
              <div>
                <dt className="inline font-semibold text-ink">
                  Checker, {pct(det.rate, 2)}. A floor, not a rate.{" "}
                </dt>
                <dd className="inline">
                  It counts chains, and many chains are the same problem sampled again. By problem
                  it is <strong className="text-ink">{pct(det.problemRate, 1)}</strong>,{" "}
                  {det.nProblems} of the {det.nProblemsWithARightChain} problems that produced a
                  right answer.
                </dd>
              </div>
              <div>
                <dt className="inline font-semibold text-ink">
                  What it could read, {det.nRightReachable} of {det.nRightChains}.{" "}
                </dt>
                <dd className="inline">
                  It reads arithmetic and nothing else, so{" "}
                  {det.nRightChains - det.nRightReachable} of those right chains are silence
                  rather than evidence. Over the ones it did read the rate is{" "}
                  <strong className="text-ink">{pct(det.reachableRate, 2)}</strong>. Either way it
                  undercounts.
                </dd>
              </div>
              {det.prm && prm ? (
                <div>
                  <dt className="inline font-semibold text-ink">
                    {prmName}, {pct(det.prm.rate, 1)}. An opinion, not a proof.{" "}
                  </dt>
                  <dd className="inline">
                    <strong className="text-ink">Its cut is fitted, not held out</strong>: the{" "}
                    {prm.threshold.toFixed(2)} that turns a score into a verdict was picked to
                    match the checker&apos;s own labels, so these are not two independent readings
                    of the same thing. On Lucky, above, it missed the slip.
                  </dd>
                </div>
              ) : null}
            </dl>
          </figure>
        </section>

        <div aria-hidden="true" />

        {/* Step 4 — where the break falls, and how many there are. Beat 3 answers
            "how often", which is a rate; this answers "where" and "how many",
            which are shape. They rode in one section until 2026-08-11, and the
            figure below arrived two qualifications deep into another beat's
            caption with no heading of its own to be read under. */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            4. Where the chain breaks
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              measured · {loc.nLocalisable} localisable chains
            </span>
          </h2>

          <p className="text-sm text-ink-muted">
            <strong className="text-ink">What the judge catches, it can place.</strong> On the{" "}
            {loc.nLocalisable} wrong chains with a findable break, the median chain ran{" "}
            <strong className="text-ink">{pct(loc.medianShareSound ?? 0)}</strong> of its length
            before the line that breaks; outcome grading throws all of it away.{" "}
            {!loc.survivesSegmentation && loc.spreadPts !== null ? (
              <>
                Read it as a direction, not a digit: on a smaller re-cut sample the four ways of
                ending a step put that median across {Math.round(loc.spreadPts)} points, from{" "}
                {pct(loc.subsample.low)} to {pct(loc.subsample.high)}, and none of them landed on
                the figure quoted here.
              </>
            ) : null}
          </p>

          {/* The median says where the break falls. This says how many there are, and
              the spike is what makes localising worth doing at all. */}
          <section
            aria-label="How many false steps each localisable wrong chain contains"
            className="flex flex-col gap-2 rounded-lg border border-grid bg-surface p-4"
          >
            <BreakCounts />
            <p className="text-sm text-ink-muted">
              And it usually breaks <strong className="text-ink">once</strong>. Of those{" "}
              {loc.nLocalisable} chains,{" "}
              <strong className="text-ink">{loc.breaksPerChain["1"]}</strong> contain exactly one
              false step
              {loc.shareWithOneFalseStep !== null ? (
                <> ({pct(loc.shareWithOneFalseStep, 0)} of them)</>
              ) : null}
              . That is the fact the median cannot carry, and it is the whole case for grading
              steps: a chain that goes wrong in one place has a place to find, while a chain that
              was wrong throughout would give a step grader nothing to localise and would cost
              outcome grading nothing to discard whole. Read the shape and not the digits, and
              read it at its true reach: {loc.nLocalisable} of {loc.nWrong.toLocaleString()} wrong
              chains ({pct(loc.nLocalisable / loc.nWrong, 0)}) have a findable break at all, so
              this is the shape of the ones we can place, not of wrong chains in general.
            </p>
          </section>
        </section>

        <div aria-hidden="true" />

        {/* The hand-off, in the content column so it does not run under the notes. */}
        <Handoff className="min-w-0">
          A step-level grader can do what the others cannot: judge a chain{" "}
          <em>while it is still being written</em>. Once you can score a half-finished chain, you
          need not finish the ones going badly.{" "}
          <em className="text-ink-muted">
            You can branch, look ahead, and back out. Turn the page.
          </em>
        </Handoff>
        <div aria-hidden="true" />
      </div>

      <PageNav n={PAGE_N} />
    </article>
  );
}
