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
 *   1. WHAT CAN BE GRADED AT ALL. The two limits, moved ahead of the figure so
 *      the reveal needs no apology: grading needs a fact, and a step must be big
 *      enough to be wrong. This is where the reader meets the page's two graders
 *      and the asymmetry the figure will show — the checker proves little and
 *      declines the rest, the PRM opines on everything and proves nothing.
 *
 *   2. GRADE IT YOURSELF. The mechanic is unchanged, because it was good: mark
 *      each step, then compare. The chains are real, drawn from page 7's pile,
 *      and the reveal is a fact rather than an attribution. Every step now shows
 *      BOTH graders: the checker's three labels (true / FALSE / can't check —
 *      solid chips, because they are facts) and the PRM's score-plus-verdict on
 *      every step (outlined chips, because they are opinions). A checker refusal
 *      is not an approval, and the reveal copy says so, because reading "not
 *      wrong" as "right" was the natural mistake the old layout invited.
 *
 *   3. WHAT STEP GRADING BUYS. Two measured numbers replacing a redrawn published
 *      bar chart. Detection is quoted plainly; localisation is quoted WITH its
 *      spread, because the notebook's `localisation_survives_segmentation` claim
 *      came back false: move the rule for where a step ends and the median moves
 *      25 points. The selector rung came back null and is reported as null.
 *
 * The old footer paragraph is gone. What had to stay on the page (the checker's
 * rule, the natural-ending filter, the PRM's gate) lives in margin notes beside
 * the element it qualifies; the rest (dates, top-p, decoding, segmentation
 * cascade) is the notebook's to state.
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

/** A margin note that sits beside its section and scrolls with the page. */
function Note({ kicker, children }: { kicker: string; children: React.ReactNode }) {
  return (
    <aside className="flex flex-col gap-2 text-sm text-ink-muted lg:pt-9">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{kicker}</p>
      {children}
    </aside>
  );
}

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
  // The PRM, by contrast, has a verdict on every step, so it is compared on all
  // of them.
  const prmScored = trace.steps.filter((s) => s.prmVerdict !== null).length;
  const prmAgreement = trace.steps.filter(
    (s, i) =>
      s.prmVerdict !== null &&
      myMarks[i] !== "unmarked" &&
      (myMarks[i] === "ok") === (s.prmVerdict === "true"),
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

        {/* Step 1 — what grading a step even requires, ahead of the figure so the
            reveal's "can't check" labels arrive expected rather than as a gap. */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">1. What can be graded at all</h2>
          <p className="text-ink-muted">
            You can only mark what can be right or wrong. A step needs a fact to grade: a proof has
            one at every line, a poem has none mid-stanza, so grade the process where the domain
            has absolutes and the outcome where it has taste.
          </p>
          <p className="text-ink-muted">
            And a step must be <strong className="text-ink">big enough to be wrong</strong>. Grade
            a word at a time and there is nothing to mark: no word is false on its own, because the
            claim does not exist until the line is finished. A reasoning step is the smallest slice
            that states something checkable.
          </p>
          <p className="text-ink-muted">
            The figure below grades real chains twice, and the two graders sit on opposite sides of
            that rule. An <strong className="text-ink">arithmetic checker</strong> proves or
            refutes only claims it can compute outright, and declines the rest: in this run the
            checker had to decline {pct(PAGE9.graders.shareUnjudged)} of{" "}
            {PAGE9.graders.stepsTotal.toLocaleString()} steps, because they state nothing it can
            verify. A <strong className="text-ink">process reward model</strong> is the opposite
            trade: it scores every step and declines none, but a score is an opinion where the
            checker&apos;s label is a fact. Keep both in view — a step the checker leaves
            unlabelled is a step it could not judge, not a step it approved.
          </p>
        </section>

        {/* Step 2 — grade it yourself */}
        <div className="grid gap-x-8 gap-y-4 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-semibold text-ink">
              2. Grade it yourself
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
                    <strong>Process view</strong> to read the steps and mark them yourself.
                  </p>
                ) : !isRevealed ? (
                  <p className="rounded-lg border border-dashed border-grid bg-surface-raised p-3 text-sm text-ink">
                    <strong>You be the process grader.</strong> Mark each step sound or broken,
                    then reveal what the two graders found: the checker proves what it can and
                    declines the rest; the PRM has an opinion on every step.
                  </p>
                ) : null}

                {/* the trace */}
                <ol className="flex flex-col gap-2">
                  {trace.steps.map((step, i) => {
                    const showProcess = mode === "process";
                    const mine = myMarks[i];
                    const shown = showProcess && isRevealed;
                    // Only the checker's FACTS colour the step itself; the PRM's
                    // opinion colours nothing but its own outlined chip.
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
                                Step {i + 1} is redacted in the outcome view; the outcome grader
                                does not read it. Switch to the process view to read it.
                              </span>
                            </span>
                          ) : (
                            <span className="flex-1 whitespace-pre-wrap text-sm text-ink">
                              {tidyMath(step.text)}
                            </span>
                          )}
                          {shown ? (
                            <span className="flex shrink-0 flex-col items-end gap-1">
                              {/* fact: solid chip */}
                              <span
                                className={`rounded px-2 py-0.5 text-xs font-semibold ${
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
                                    : "can't check"}
                              </span>
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
                    {allMarked ? "Reveal what the graders found ▸" : "Mark every step first"}
                  </button>
                ) : null}

                {mode === "process" && isRevealed ? (
                  <p className="text-sm text-ink-muted">
                    The checker could prove{" "}
                    <strong className="text-ink">
                      {judged.length} of {trace.steps.length}
                    </strong>{" "}
                    steps, and you agreed with it on{" "}
                    <strong className="text-ink">
                      {agreement} of {judged.length}
                    </strong>
                    . Its refusals are not approvals: a step it left grey is unproven, not sound.{" "}
                    {prmScored > 0 ? (
                      <>
                        The PRM refused nothing — it scored all{" "}
                        <strong className="text-ink">{prmScored}</strong>, and its verdicts matched
                        your marks on <strong className="text-ink">{prmAgreement}</strong>.
                      </>
                    ) : null}
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
              <em>Lucky</em> chain above reaches the right answer with a step that is
              arithmetically false. An outcome grader passes it, and page 12&apos;s filter would
              fine-tune on it. Only a step grader catches it, and only it can say{" "}
              <em>which line</em> to fix.
            </div>
          </section>

          <div className="flex flex-col gap-6">
            <Note kicker="Provenance">
              <p>
                Real chains, not authored examples: sampled from{" "}
                {PAGE9.run.model.split("/").pop()} at T={PAGE9.run.temperature} and reused from
                page 7&apos;s pile, so pages 6 to 9 describe one population.
              </p>
              <p>
                Only chains the model ended itself are graded; that filter kept{" "}
                {PAGE9.filter.kept.toLocaleString()} and dropped {PAGE9.filter.dropped}, so every
                figure on this page is conditional on the easier population.
              </p>
              <p>
                Solid labels come from a deterministic arithmetic checker that judges only claims
                that are closed-form numeric on both sides — verdicts a reader can recompute by
                hand.
              </p>
            </Note>
            {prm ? (
              <Note kicker="The PRM">
                <p>
                  {prm.id} at {prm.quantisation}, admitted only after being measured against the
                  checker on the steps both can see: AUC {prm.auc.toFixed(2)}, specificity{" "}
                  {pct(prm.specificityOnTrue)} over {prm.nStepsCompared.toLocaleString()} steps.
                </p>
                <p>
                  Its sound / flags-it verdicts cut its score at {prm.threshold.toFixed(2)}, a
                  threshold {prm.thresholdSource}. That reliability was measured on arithmetic
                  steps, the friendliest ones — treat it as an upper bound.
                </p>
              </Note>
            ) : null}
          </div>
        </div>

        {/* Step 3 — what step-grading buys */}
        <div className="grid gap-x-8 gap-y-4 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-semibold text-ink">
              3. What step grading buys
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
                    That is a <em>floor</em>, because the checker only sees arithmetic. The
                    process reward model, which also sees method, calls a step unsound in{" "}
                    <strong className="text-ink">{pct(det.prm.rate)}</strong> of them: an opinion
                    rather than a proof, and the margin says what that opinion was measured to be
                    worth.
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
                        <div
                          className={`h-5 rounded ${b.tone}`}
                          style={{ width: `${b.share * 100}%` }}
                        />
                      </div>
                      <span className="w-12 shrink-0 text-right font-mono tabular-nums text-ink">
                        {pct(b.share)}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-ink-muted">
                  On the {loc.nLocalisable} wrong chains where the break is findable, the first{" "}
                  <strong className="text-ink">{pct(loc.medianShareSound ?? 0)}</strong> of the
                  chain was sound. Outcome grading throws all of it away.
                </p>
                {/* The notebook's `localisation_survives_segmentation` claim is FALSE, so
                    this number may not be quoted alone. */}
                {!loc.survivesSegmentation && loc.spreadPts !== null ? (
                  <p className="text-xs text-ink-muted">
                    Read that figure with its width: it depends on where you judge a step to end,
                    and moving that rule moves it by up to{" "}
                    <strong className="text-ink">{Math.round(loc.spreadPts)} points</strong>,
                    because it is a ratio of step positions. The detection rate beside it does not
                    move at all. The direction is solid here; the digit is not.
                  </p>
                ) : null}
                <p className="text-xs text-ink-muted">
                  {pct(loc.shareWithOneFalseStep ?? 0)} of those chains break in exactly one
                  place, so &ldquo;the break is a line&rdquo; is the common case rather than the
                  rule.
                </p>
              </figure>
            </div>

            {/* The null result, reported as one. */}
            {sel && !sel.helps ? (
              <p className="rounded-lg border-l-4 border-grid bg-surface p-4 text-sm text-ink">
                <strong>And one thing it does not buy, on this evidence.</strong> Using the
                checker as a <em>selector</em> — drop any candidate containing a false step, then
                vote on what survives — moved {pct(sel.majority)} to {pct(sel.filtered)} over{" "}
                {sel.nProblems} problems, changing the answer on {sel.nChanged}. That is a null
                result, and at this checker&apos;s reach it is the honest one: reading the working
                earns its keep by catching and locating errors, not by picking winners.
              </p>
            ) : null}
          </section>

          <Note kicker="References">
            <CitationBadge citation={LIGHTMAN} />
            <p>
              Cited for the technique and for priority — process supervision, and training a
              reward model on step labels rather than outcomes. The numbers on this page are our
              own, on our own model, and are not comparable to theirs.
            </p>
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

      <div className="flex flex-wrap items-center gap-2">
        <a
          className="rounded border border-grid px-2 py-1 text-xs text-ink-muted hover:text-ink"
          href={NOTEBOOK_ZIP}
          download
        >
          notebook + {PAGE9.run.chains.toLocaleString()} graded chains ↓
        </a>
        <span className="text-xs text-ink-muted">
          full run conditions — decoding, dates, step segmentation — live in the notebook
        </span>
      </div>

      <PageNav n={PAGE_N} />
    </article>
  );
}
