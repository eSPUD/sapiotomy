"use client";

/**
 * Page 9, "Outcome vs Process Supervision" — measured, not authored.
 *
 * Page 8 ended on what the judge is actually reading. Here is the answer, and it
 * is a fork: grade the final answer, or grade every step.
 *
 * THE DEFECT THIS PAGE EXISTED TO CARRY. The old version invited the reader to
 * mark each step and then revealed what it called "the PRM's labels". No PRM
 * produced them; they were hand-written `ok` booleans in `lib/authored.ts`. Every
 * other authored element in the deck is chipped as authored, and this one was not
 * merely unchipped — it was attributed to a system that never ran. Every label
 * revealed below now comes from a grader that did run, and `@/lib/page09` refuses
 * to load a run that failed the notebook's gates.
 *
 * The three beats, and what each is allowed to say:
 *
 *   1. GRADE IT YOURSELF. The mechanic is unchanged, because it was good: mark
 *      each step, then compare. What changed is that the chains are real, drawn
 *      from page 7's pile, and the reveal is a fact rather than an attribution.
 *      Three labels, not two — the third is the checker declining to judge, and
 *      showing it is the page's honesty about what a deterministic rule reaches.
 *      The reveal points at the CLAIM that was judged, not at the whole step: a
 *      step can open with two true lines and break on the third.
 *
 *   2. WHAT STEP GRADING BUYS. Two measured numbers replacing a redrawn published
 *      bar chart. Detection is quoted plainly; localisation is quoted WITH its
 *      spread, because the notebook's `localisation_survives_segmentation` claim
 *      came back false: move the rule for where a step ends and the median moves
 *      25 points. The selector rung came back null and is reported as null.
 *
 *   3. TWO LIMITS, THEN THE HANDOFF. The best prose on the old page, kept, and
 *      now standing on a measurement: 94% of the steps in this run were beyond
 *      the arithmetic checker entirely, which is the second limit arriving as
 *      data instead of as an argument.
 *
 * Lightman et al. 2023 stays, but its role changes. It is cited for the
 * technique and for priority; the numbers on screen are our own. The old page
 * redrew its 69.6 / 72.4 / 78.2 and called that the finding.
 */

import { useState } from "react";
import { CitationBadge } from "@/components/CitationBadge";
import { PageNav } from "@/components/PageNav";
import type { Citation } from "@/lib/data";
import { PAGE9, pct, tidyMath, type Specimen } from "@/lib/page09";
import { ACTS, getPage } from "@/lib/pages";
import { useStore } from "@/store/useStore";

const PAGE_N = 9;
const NOTEBOOK_ZIP = "/notebooks/page-09-outcome-vs-process.zip";

const LIGHTMAN: Citation = {
  ref: "Lightman et al. 2023",
  url: "https://arxiv.org/abs/2305.20050",
  venue: "arXiv",
  preprint: true,
};

type Mode = "outcome" | "process";
type Mark = "unmarked" | "ok" | "error";

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

export function Page9() {
  const page = getPage(PAGE_N)!;
  const recordInteraction = useStore((s) => s.recordInteraction);

  const [roleKey, setRoleKey] = useState(ROLES[0].key);
  const [mode, setMode] = useState<Mode>("outcome");
  const [marks, setMarks] = useState<Record<string, Mark[]>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const role = ROLES.find((r) => r.key === roleKey)!;
  const trace = role.specimen;
  const myMarks: Mark[] = marks[roleKey] ?? trace.steps.map(() => "unmarked");
  const isRevealed = revealed[roleKey] ?? false;
  const allMarked = myMarks.every((m) => m !== "unmarked");

  const setMark = (i: number, m: Mark) => {
    recordInteraction(PAGE_N);
    setMarks((prev) => {
      const next = [...(prev[roleKey] ?? trace.steps.map(() => "unmarked" as Mark))];
      next[i] = m;
      return { ...prev, [roleKey]: next };
    });
  };

  // Scored only over the steps the checker could judge. Marking a step the checker
  // declined is not a disagreement, it is a question it refused to answer, and
  // counting it either way would invent a score.
  const judged = trace.steps
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => s.check !== "unknown");
  const agreement = judged.filter(
    ({ s, i }) => myMarks[i] !== "unmarked" && (myMarks[i] === "ok") === (s.check === "true"),
  ).length;

  const det = PAGE9.detection;
  const loc = PAGE9.localisation;
  const sel = PAGE9.selection;
  const prm = PAGE9.graders.prm;

  return (
    <article className="flex flex-col gap-6">
      <p className="text-xs uppercase tracking-wide text-ink-muted">
        Act {page.act} · {ACTS[page.act].title}
      </p>
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

        {/* Step 1 — grade it yourself */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            1. Grade it yourself
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              real chains · {PAGE9.run.model.split("/").pop()} · labels from an arithmetic checker
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
                  <strong>Process view</strong> to read the steps and mark them yourself.
                </p>
              ) : !isRevealed ? (
                <p className="rounded-lg border border-dashed border-grid bg-surface-raised p-3 text-sm text-ink">
                  <strong>You be the process grader.</strong> Mark each step sound or broken, then
                  reveal what the checker found. It only judges arithmetic it can verify outright,
                  so expect it to decline on most of them — that limit is the point, not a gap.
                </p>
              ) : null}

              {/* the trace */}
              <ol className="flex flex-col gap-2">
                {trace.steps.map((step, i) => {
                  const showProcess = mode === "process";
                  const mine = myMarks[i];
                  const shown = showProcess && isRevealed;
                  const tone =
                    step.check === "true"
                      ? "border-correct bg-correct/10"
                      : step.check === "false"
                        ? "border-wrong bg-wrong/15"
                        : "border-grid bg-surface-raised";
                  return (
                    <li
                      key={i}
                      className={`flex flex-col gap-1.5 rounded-lg border-l-4 p-3 ${
                        shown ? tone : "border-grid bg-surface-raised"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 font-mono text-xs text-compute">{i + 1}</span>
                        {/* Outcome view REDACTS the working. The grader cannot read
                            it, so neither can you until you switch views. */}
                        {mode === "outcome" ? (
                          <span className="flex flex-1 items-center gap-2">
                            <span
                              aria-hidden="true"
                              className="block h-3 rounded-sm bg-grid"
                              style={{ width: `${Math.min(92, 28 + step.text.length * 0.4)}%` }}
                            />
                            <span className="sr-only">
                              Step {i + 1} is redacted in the outcome view; the outcome grader does
                              not read it. Switch to the process view to read it.
                            </span>
                          </span>
                        ) : (
                          <span className="flex-1 whitespace-pre-wrap text-sm text-ink">
                            {tidyMath(step.text)}
                          </span>
                        )}
                        {shown ? (
                          <span
                            className={`shrink-0 rounded px-2 py-0.5 text-xs font-semibold ${
                              step.check === "true"
                                ? "bg-correct/25 text-correct"
                                : step.check === "false"
                                  ? "bg-wrong/25 text-wrong"
                                  : "bg-grid/40 text-ink-muted"
                            }`}
                          >
                            {step.check === "true"
                              ? "checked: true"
                              : step.check === "false"
                                ? "checked: FALSE"
                                : "nothing to check"}
                          </span>
                        ) : showProcess ? (
                          <span className="flex shrink-0 gap-1">
                            <button
                              type="button"
                              aria-pressed={mine === "ok"}
                              aria-label={`Mark step ${i + 1} sound`}
                              onClick={() => setMark(i, "ok")}
                              className={`rounded px-2 py-0.5 text-xs ${
                                mine === "ok"
                                  ? "bg-correct text-canvas"
                                  : "border border-grid text-ink-muted"
                              }`}
                            >
                              sound
                            </button>
                            <button
                              type="button"
                              aria-pressed={mine === "error"}
                              aria-label={`Mark step ${i + 1} broken`}
                              onClick={() => setMark(i, "error")}
                              className={`rounded px-2 py-0.5 text-xs ${
                                mine === "error"
                                  ? "bg-wrong text-canvas"
                                  : "border border-grid text-ink-muted"
                              }`}
                            >
                              broken
                            </button>
                          </span>
                        ) : (
                          <span className="shrink-0 text-xs text-ink-muted">not read</span>
                        )}
                      </div>
                      {/* The judged CLAIM, not the step. A step can open with two true
                          lines and break on the third, and highlighting the step would
                          point at the wrong words. */}
                      {shown && step.claim ? (
                        <p className="pl-6 font-mono text-xs text-ink-muted">
                          judged: {tidyMath(step.claim)}
                        </p>
                      ) : null}
                      {shown && step.prm !== null ? (
                        <p className="pl-6 text-xs text-ink-muted">
                          {prm?.id.split("/").pop()} scores this step{" "}
                          <strong className="text-ink">{step.prm.toFixed(2)}</strong>
                        </p>
                      ) : null}
                    </li>
                  );
                })}
              </ol>

              {mode === "process" && !isRevealed ? (
                <button
                  type="button"
                  disabled={!allMarked}
                  onClick={() => {
                    setRevealed((r) => ({ ...r, [roleKey]: true }));
                    recordInteraction(PAGE_N);
                  }}
                  className="self-start rounded bg-compute px-4 py-2 text-sm font-semibold text-canvas disabled:opacity-50"
                >
                  {allMarked ? "Reveal the checker's labels ▸" : "Mark every step first"}
                </button>
              ) : null}

              {mode === "process" && isRevealed ? (
                <p className="text-sm text-ink-muted">
                  The checker could judge{" "}
                  <strong className="text-ink">
                    {judged.length} of {trace.steps.length}
                  </strong>{" "}
                  steps, and you agreed with it on{" "}
                  <strong className="text-ink">
                    {agreement} of {judged.length}
                  </strong>
                  . It has no opinion about the rest, which is most of the chain.
                </p>
              ) : null}

              {/* the verdict */}
              <div className="flex flex-col gap-2 border-t border-dashed border-grid pt-3">
                <p className="text-sm text-ink">
                  <span className="font-mono text-ink-muted">final answer → </span>
                  <strong className={trace.outcomeCorrect ? "text-correct" : "text-wrong"}>
                    {trace.answer ?? "—"}
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
                        : `All ${trace.steps.length} steps are condemned together, including the ${trace.firstFalse ?? 0} that were sound.`}
                    </p>
                  </div>
                ) : isRevealed ? (
                  <div className="rounded-lg border-l-4 border-compute bg-surface-raised p-3 text-sm">
                    <p className="text-ink">
                      <span className="font-semibold text-compute">Process grader:</span>{" "}
                      {trace.firstFalse !== null
                        ? `the break is step ${trace.firstFalse + 1}. The ${trace.firstFalse} step${trace.firstFalse === 1 ? "" : "s"} before it stand, and a grader that reads the working can say so.`
                        : "nothing here is provably false. The two graders agree, which is the case that needs no argument."}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <div className="rounded-lg border-l-4 border-wrong bg-surface p-4 text-base text-ink">
            <strong className="text-lg">Right answer, broken method is a trap.</strong> The{" "}
            <em>Lucky</em> chain above reaches the right answer with a step that is arithmetically
            false. An outcome grader passes it, and page 12&apos;s filter would fine-tune on it. Only
            a step grader catches it, and only it can say <em>which line</em> to fix.
          </div>

          {/* Provenance for the traces above, kept with them rather than in a sidebar. */}
          <p className="text-xs text-ink-muted">
            these are real chains, not authored examples · sampled from{" "}
            {PAGE9.run.model.split("/").pop()} at T={PAGE9.run.temperature} and reused from page
            7&apos;s pile, so pages 6 to 9 describe one population · every label above is the
            arithmetic checker&apos;s, which judges only claims that are closed-form numeric on both
            sides, so a reader can verify any one of them by hand
            {prm
              ? ` · the per-step scores are ${prm.id.split("/").pop()} at ${prm.quantisation}, measured at AUC ${prm.auc.toFixed(2)} against the checker before being shown`
              : ""}
          </p>
        </section>

        {/* Step 2 — what step-grading buys */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            2. What step grading buys
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              measured · {PAGE9.run.chains.toLocaleString()} chains
            </span>
          </h2>

          <div className="grid gap-3 sm:grid-cols-2">
            <figure className="m-0 flex flex-col gap-2 rounded-lg border-l-4 border-wrong bg-surface p-4">
              <figcaption className="text-sm font-semibold text-ink">
                Detection: a right answer is not a right chain
              </figcaption>
              <p className="text-sm text-ink-muted">
                Of the{" "}
                <strong className="text-ink">{det.nRightChains.toLocaleString()}</strong> chains
                that reached the right answer, the checker proves a step false in{" "}
                <strong className="text-ink">{det.nContaminated}</strong> of them (
                {pct(det.rate, 2)}), spread over {det.nProblems} of{" "}
                {det.nProblemsWithARightChain} problems.
              </p>
              {det.prm ? (
                <p className="text-sm text-ink-muted">
                  That is a <em>floor</em>, because the checker only sees arithmetic. A process
                  reward model, which also sees method, calls a step unsound in{" "}
                  <strong className="text-ink">{pct(det.prm.rate)}</strong> of them — measured at
                  AUC {det.prm.auc.toFixed(2)} against the checker on the steps both can see.
                </p>
              ) : null}
              <p className="text-xs text-ink-muted">
                An outcome grader passes every one of these, and so would page 12&apos;s
                keep-what-was-right filter. This is that filter&apos;s contamination rate.
              </p>
            </figure>

            <figure className="m-0 flex flex-col gap-2 rounded-lg border-l-4 border-compute bg-surface p-4">
              <figcaption className="text-sm font-semibold text-ink">
                Localisation: how much gets thrown away
              </figcaption>
              <div
                className="flex flex-col gap-2"
                role="img"
                aria-label={`On a wrong chain with a findable break, outcome grading condemns 100 percent of the chain and process grading condemns ${Math.round((1 - (loc.medianShareSound ?? 0)) * 100)} percent.`}
              >
                {[
                  { label: "outcome", share: 1, tone: "bg-wrong" },
                  {
                    label: "process",
                    share: 1 - (loc.medianShareSound ?? 0),
                    tone: "bg-compute",
                  },
                ].map((b) => (
                  <div key={b.label} className="flex items-center gap-2 text-sm">
                    <span className="w-16 shrink-0 text-ink-muted">{b.label}</span>
                    <div className="h-5 flex-1 rounded bg-surface-raised">
                      <div className={`h-5 rounded ${b.tone}`} style={{ width: `${b.share * 100}%` }} />
                    </div>
                    <span className="w-12 shrink-0 text-right font-mono tabular-nums text-ink">
                      {pct(b.share)}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-ink-muted">
                On the {loc.nLocalisable} wrong chains where the break is findable, the first{" "}
                <strong className="text-ink">{pct(loc.medianShareSound ?? 0)}</strong> of the chain
                was sound. Outcome grading throws all of it away.
              </p>
              {/* The notebook's `localisation_survives_segmentation` claim is FALSE, so
                  this number may not be quoted alone. */}
              {!loc.survivesSegmentation && loc.spreadPts !== null ? (
                <p className="text-xs text-ink-muted">
                  Read that figure with its width: it depends on where you judge a step to end, and
                  moving that rule moves it by up to{" "}
                  <strong className="text-ink">{Math.round(loc.spreadPts)} points</strong>. The
                  direction is solid; the digit is not.
                </p>
              ) : null}
              <p className="text-xs text-ink-muted">
                {pct(loc.shareWithOneFalseStep ?? 0)} of those chains break in exactly one place,
                so &ldquo;the break is a line&rdquo; is the common case rather than the rule.
              </p>
            </figure>
          </div>

          {/* The null result, reported as one. */}
          {sel && !sel.helps ? (
            <p className="rounded-lg border-l-4 border-grid bg-surface p-4 text-sm text-ink">
              <strong>And one thing it does not buy, on this evidence.</strong> Using the checker as
              a <em>selector</em> — drop any candidate containing a false step, then vote on what
              survives — moved {pct(sel.majority)} to {pct(sel.filtered)} over {sel.nProblems}{" "}
              problems, changing the answer on {sel.nChanged}. That is a null result, and at this
              checker&apos;s reach it is the honest one: reading the working earns its keep by
              catching and locating errors, not by picking winners.
            </p>
          ) : null}

          <figcaption className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
            <CitationBadge citation={LIGHTMAN} />
            <span>
              cited for the technique and for priority — process supervision, and training a reward
              model on step labels rather than outcomes. The numbers above are our own, on our own
              model, and are not comparable to theirs.
            </span>
          </figcaption>
        </section>

        {/* Step 3 — the two limits */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">3. Two limits, then the handoff</h2>
          <p className="text-ink-muted">
            Both limits are the same rule read from two sides: you can only mark what can be right
            or wrong. Once the domain has no fact, or the slice is too small to hold one, there is
            nothing left to grade.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border-l-4 border-grid bg-surface p-4 text-base text-ink">
              <strong>Only where there is a fact.</strong> A step needs a truth value to grade. A
              poem has none mid-stanza, so grade the process where the domain has absolutes, the
              outcome where it has taste.
            </div>
            <div className="rounded-lg border-l-4 border-grid bg-surface p-4 text-base text-ink">
              <strong>A step must be big enough to be wrong.</strong> Grade a word at a time and
              there is nothing to mark: no word is false on its own, because the claim does not
              exist until the line is finished. A <strong>reasoning step</strong> is the smallest
              slice that states something checkable.{" "}
              <em>
                This run found the same floor from the other direction: the checker had to decline{" "}
                {pct(PAGE9.graders.shareUnjudged)} of {PAGE9.graders.stepsTotal.toLocaleString()}{" "}
                steps because they state nothing it can verify.
              </em>
            </div>
          </div>
          <div className="rounded-lg border-l-4 border-compute bg-surface p-4 text-ink">
            A step-level grader can do what the others cannot: judge a chain{" "}
            <em>while it is still being written</em>. Once you can score a half-finished chain, you
            need not finish the ones going badly.{" "}
            <em className="text-ink-muted">
              You can branch, look ahead, and back out. Turn the page.
            </em>
          </div>
        </section>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <CitationBadge citation={LIGHTMAN} />
        <a
          className="rounded border border-grid px-2 py-1 text-xs text-ink-muted hover:text-ink"
          href={NOTEBOOK_ZIP}
          download
        >
          notebook + {PAGE9.run.chains.toLocaleString()} graded chains ↓
        </a>
      </div>

      <p className="text-xs text-ink-muted">
        measured · {PAGE9.run.model} · {PAGE9.run.items} MATH-500 level 4-5 problems ·{" "}
        {PAGE9.run.chains.toLocaleString()} chains {PAGE9.run.decoding} at T=
        {PAGE9.run.temperature}, top-p {PAGE9.run.topP}, reused from page 7&apos;s pile ·{" "}
        {PAGE9.run.date} · only chains the model ended itself are graded, because a chain we cut at
        our own cap is our experiment rather than its reasoning; that filter kept{" "}
        {PAGE9.filter.kept.toLocaleString()} and dropped {PAGE9.filter.dropped}, so every figure
        here is conditional on the easier of the two populations · step labels come from a
        deterministic arithmetic checker that judges only closed-form numeric claims, so its
        verdicts are facts a reader can recompute rather than a model&apos;s opinion
        {prm
          ? ` · the process reward model is ${prm.id}, run at ${prm.quantisation} and admitted only after measuring it against that checker: AUC ${prm.auc.toFixed(2)}, specificity ${pct(prm.specificityOnTrue)} over ${prm.nStepsCompared.toLocaleString()} steps, at a threshold ${prm.thresholdSource} · that reliability was measured on arithmetic steps, which are the friendliest ones, so treat it as an upper bound`
          : " · no process reward model participated in this run"}{" "}
        · localisation is quoted with a spread because it moves with the rule for where a step ends;
        detection does not
      </p>

      <PageNav n={PAGE_N} />
    </article>
  );
}
