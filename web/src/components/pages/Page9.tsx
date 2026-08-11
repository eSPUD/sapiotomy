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
 * The three beats:
 *   1. WHAT CAN BE GRADED AT ALL. Three conditions on a gradable step: a fact to
 *      be right about, a right answer that can still hide a wrong step, and a unit
 *      big enough to carry a claim. Then the two instruments and their opposite
 *      reach.
 *   2. FIND THE BREAK. One question, one click, re-answerable: which line goes
 *      wrong, or does nothing? The reveal underlines what the checker proved,
 *      chips what the PRM opined, and lets the reader grade again.
 *   3. WHAT STEP GRADING BUYS. How many right answers each grader can catch bad
 *      reasoning inside, then where the PRM's own quality figures were taken.
 *      Localisation and the null selector rung follow in a line each.
 *
 * Run conditions (decoding, dates, segmentation) are the notebook's to state.
 * The PRM's measured reliability used to be as well, and that rule was right
 * while the numbers arrived flat: an AUC beside the bars gave a reader nothing
 * to do with it. Beat 3 now says WHERE it was measured, on the 5.8% of steps the
 * checker can read, which turns the same three numbers into a limit the reader
 * can act on. That claim came from page 15 on 2026-08-10 and the numbers came
 * with it. The margins hold only what a reader looking at the thing beside them
 * cannot work out: how to read a step with no underline. A limit on a figure is
 * not a margin note, it is a caption, so the PRM's fitted cut-off and the
 * checker's denominator both sit under the bars they qualify.
 *
 * Lightman et al. 2023 is cited for the technique and priority; the numbers on
 * screen are our own.
 */

import { useState } from "react";
import { ChartFrame } from "@/components/ChartFrame";
import { Cite, RefItem } from "@/components/Cite";
import { PageNav } from "@/components/PageNav";
import { PAGE9, pct, tidyMath, type Specimen } from "@/lib/page09";
import { ACTS, getPage } from "@/lib/pages";
import { useStore } from "@/store/useStore";

const PAGE_N = 9;
const NOTEBOOK_ZIP = "/notebooks/page-09-outcome-vs-process.zip";

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
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{kicker}</p>
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

/* ------------------------------------------------- where the PRM was audited */

const A_W = 640;
const A_H = 168;
const A_M = { top: 40, right: 16, bottom: 44, left: 16 };
const A_IW = A_W - A_M.left - A_M.right;

/**
 * Where the process reward model's quality figures were taken. One bar, every
 * step of the graded run, split at what the arithmetic checker can adjudicate.
 *
 * This arrived from page 15 on 2026-08-10, and the split it draws is the one
 * step 1 already states in prose. That is not a repeat: step 1 uses the split to
 * introduce the two instruments' reach, and here it does a different job, which
 * is to say how much of the grader we were ever able to check. The figure exists
 * because the sliver has to be seen at true width to land: a sentence reading
 * "5.8%" is a number, and a strip this thin beside the rest of the bar is an
 * argument. The AUC is drawn INSIDE the sliver rather than beside the bar,
 * because where it was measured is the whole claim.
 */
function AuditSurface({ prm }: { prm: NonNullable<typeof PAGE9.graders.prm> }) {
  const g = PAGE9.graders;
  const share = 1 - g.shareUnjudged;
  const w = Math.max(share * A_IW, 3);
  return (
    <ChartFrame
      title={`Of ${g.stepsTotal.toLocaleString()} steps, the arithmetic checker can adjudicate ${g.stepsJudged.toLocaleString()}, or ${pct(share, 1)}. The reward model scores all ${g.stepsTotal.toLocaleString()} and is silent on none, so the remaining ${pct(g.shareUnjudged, 1)} is what nothing independent can check it against. Its AUC of ${prm.auc.toFixed(2)} was measured inside that ${pct(share, 1)}.`}
      width={A_W}
      height={A_H}
      margin={A_M}
    >
      <rect x={0} y={0} width={A_IW} height={44} className="fill-ink opacity-[0.07]" />
      <rect x={0} y={0} width={w} height={44} className="fill-correct" />

      {/* The leader has to come from outside: nothing legible fits in the sliver. */}
      <line x1={w / 2} x2={w / 2} y1={-14} y2={0} className="stroke-correct" strokeWidth={1} />
      <text x={w / 2 - 2} y={-20} className="fill-ink text-[11px] font-semibold">
        {pct(share, 1)} checkable
      </text>
      <text x={A_IW - 4} y={26} textAnchor="end" className="fill-ink text-[12px] font-semibold">
        {pct(g.shareUnjudged, 1)}: the reward model scores these, nothing independent checks it
      </text>

      <path
        d={`M0,58 L0,66 L${w},66 L${w},58`}
        fill="none"
        className="stroke-ink-muted"
        strokeWidth={1}
      />
      <text x={0} y={82} className="fill-ink-muted text-[11px]">
        its AUC of {prm.auc.toFixed(2)}, its recall of {pct(prm.recallOnFalse, 0)} and its
        specificity of {pct(prm.specificityOnTrue, 0)} were all measured in here
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
  const sel = PAGE9.selection;
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
        <p className="text-xs uppercase tracking-wide text-ink-muted">
          Act {page.act} · {ACTS[page.act].title}
        </p>
        <a
          className="rounded border border-grid px-2 py-1 text-xs text-ink-muted hover:text-ink"
          href={NOTEBOOK_ZIP}
          download
        >
          notebook + {PAGE9.run.chains.toLocaleString()} graded chains ↓
        </a>
      </div>
      <h1 className="text-3xl font-bold text-ink">
        <span className="font-mono text-ink-muted">{page.n}. </span>
        {page.title}
      </h1>

      <div className="flex min-w-0 flex-col gap-8">
        <p className="text-lg text-ink-muted">
          Two ways to grade a student: mark the final answer, or mark{" "}
          <strong className="text-ink">every line of the working</strong>. Where they disagree is
          where the interesting failures live. Every maths teacher who said{" "}
          <em>&ldquo;show your work&rdquo;</em> was defending the second one, and they were right: a
          correct answer reached by a broken method is a trap, and nobody can tell from the answer
          alone.
        </p>

        {/* Step 1 — the three conditions on a gradable step, then the two instruments. */}
        <section className="flex flex-col gap-3">
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
            <Cite n={REF.lightman} /> takes the opposite trade: it scores every step and is silent on
            none, but a score is an opinion where the checker&apos;s label is a fact.
          </p>
        </section>

        {/* Step 2 — grade it yourself */}
        <div className="grid gap-x-8 gap-y-4 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
          <section className="flex flex-col gap-3">
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
                      ? "bg-compute text-canvas"
                      : "border border-grid bg-surface text-ink-muted"
                  }`}
                >
                  {r.label}
                  <span className="ml-2 text-xs opacity-80">{r.kind}</span>
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
                          ? "bg-compute text-canvas"
                          : "border border-grid bg-surface-raised text-ink-muted"
                      }`}
                    >
                      <span className="font-semibold">{m.label}</span>
                      <span className="text-xs opacity-80">{m.sub}</span>
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
                          <span className="mt-0.5 font-mono text-xs text-compute">{i + 1}</span>
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
                                <span className="rounded border border-compute px-2 py-0.5 text-xs text-compute">
                                  your pick
                                </span>
                              ) : null}
                              {/* fact: solid chip, and ONLY where there is a fact. */}
                              {step.check !== "unknown" ? (
                                <span
                                  className={`rounded px-2 py-0.5 text-xs font-semibold ${
                                    step.check === "true"
                                      ? "bg-correct/25 text-correct"
                                      : "bg-wrong/25 text-wrong"
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
                                      ? "border-correct/50 text-correct"
                                      : "border-wrong/50 text-wrong"
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
                                  ? "bg-wrong text-canvas"
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
                          ? "bg-correct text-canvas"
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
                      className="rounded bg-compute px-4 py-2 text-sm font-semibold text-canvas disabled:opacity-50"
                    >
                      {hasPicked ? "Reveal what the graders found ▸" : "Pick a line first"}
                    </button>
                  </div>
                ) : null}

                {mode === "process" && isRevealed ? (
                  <div className="flex flex-col gap-2 text-sm text-ink-muted">
                    <p>
                      <strong className={foundIt ? "text-correct" : "text-ink"}>
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
                          The PRM flagged it too, and it is silent on none, so it also has a verdict
                          on every sound line above. Those are opinions; only the underline is a
                          proof.
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
                    <strong className={trace.outcomeCorrect ? "text-correct" : "text-wrong"}>
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
                            trace.outcomeCorrect ? "text-correct" : "text-wrong"
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
                        <span className="font-semibold text-compute">Process grader:</span>{" "}
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

            {/* The specimens cannot be typical, and the next beat's numbers are
                unreadable if the reader assumes they are. Section 10 picks by
                ROLE, and "a right answer with a false step in it" can only be
                filled by a chain the checker could read, so the three shown here
                are drawn from the gradable tail by construction. Stated in the
                step body rather than the provenance note (house rule, pages
                3-8): a reader who hand-grades three half-checkable chains and
                then meets 5.8% has no way to reconcile the two, and the mismatch
                reads as the page contradicting itself. */}
            <div className="rounded-lg border border-dashed border-grid bg-surface p-4 text-sm text-ink-muted">
              <strong className="text-ink">These three are not a sample.</strong> They were picked
              to fill roles, and a role like &ldquo;right answer, false step&rdquo; can only be
              filled by a chain the checker could read, so all three come from the gradable end of
              the pile. Across them the checker judged{" "}
              <strong className="font-mono text-ink">
                {PAGE9.specimenReach.stepsCheckable} of {PAGE9.specimenReach.stepsTotal}
              </strong>{" "}
              steps ({pct(PAGE9.specimenReach.shareCheckable)}); across all{" "}
              {PAGE9.run.chains.toLocaleString()} chains it judged{" "}
              <strong className="font-mono text-ink">{pct(1 - share, 1)}</strong>. Grading three
              chains by hand here will leave you with a rosier sense of how much of a chain can be
              checked than the run supports, which is what the next beat has to correct.
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
        </div>

        {/* Step 3 — what step-grading buys, one figure framed on the PRM */}
        <div className="grid gap-x-8 gap-y-4 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
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

            {/* Arrived from page 15 on 2026-08-10, where it was the second half of a
                verifier beat. It belongs here: it qualifies the PRM bar directly
                above it, and this page owns the measurement. */}
            {prm ? (
              <>
                <p className="text-sm text-ink-muted">
                  Which leaves the harder question about the bar on the right. A score is an
                  opinion, so how good is this one, and how much of the chain did we ever get to
                  find out on?
                </p>
                <figure
                  aria-label="What share of the graded steps an independent checker can adjudicate"
                  className="m-0 flex flex-col gap-3 rounded-lg border border-grid bg-surface p-4"
                >
                  <AuditSurface prm={prm} />
                </figure>
                <p className="text-sm text-ink-muted">
                  The reward model scores every one of these{" "}
                  {PAGE9.graders.stepsTotal.toLocaleString()} steps and is silent on none, which is
                  the job it was trained for. The checker is the one that declines: it adjudicates{" "}
                  {PAGE9.graders.stepsJudged.toLocaleString()}, because its rule is arithmetic on
                  both sides and the rest state something else, <em>by symmetry</em> or{" "}
                  <em>consider the cases</em> or a claim about where the working has got to. So the
                  sliver is not the grader&apos;s blind spot. It is the only ground truth we have to
                  audit the grader against, and every number that makes it look trustworthy was
                  taken inside it. Its reliability on the other{" "}
                  {pct(PAGE9.graders.shareUnjudged, 1)} is unmeasured, and those are the prose steps
                  least like the ones it was scored on, so read the figures above as the optimistic
                  end.
                </p>
              </>
            ) : null}

            <p className="text-sm text-ink-muted">
              <strong className="text-ink">And what it catches, it can place.</strong> On the{" "}
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

            {sel && !sel.helps ? (
              <p className="text-sm text-ink-muted">
                Turned the other way, as a filter to pick winners rather than to find errors, the
                checker earns nothing: dropping candidates with a false step moved the vote on{" "}
                {sel.nChanged} problem in {sel.nProblems}. That is a null result, and the honest one
                at this reach.
              </p>
            ) : null}
          </section>

          <Note kicker="References">
            <p>Cited for the technique. The numbers here are our own model&apos;s, not theirs.</p>
            <RefItem n={REF.lightman} href="https://arxiv.org/abs/2305.20050" preprint>
              Lightman et al. 2023, <em>Let&apos;s Verify Step by Step</em> (arXiv 2305.20050).
            </RefItem>
          </Note>
        </div>

        <div className="rounded-lg border-l-4 border-compute bg-surface p-4 text-ink">
          A step-level grader can do what the others cannot: judge a chain{" "}
          <em>while it is still being written</em>. Once you can score a half-finished chain, you
          need not finish the ones going badly.{" "}
          <em className="text-ink-muted">
            You can branch, look ahead, and back out. Turn the page.
          </em>
        </div>
      </div>

      <PageNav n={PAGE_N} />
    </article>
  );
}
