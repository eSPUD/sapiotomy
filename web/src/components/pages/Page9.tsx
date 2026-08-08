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
 * THE SECOND DEFECT, FIXED HERE. The measured version put a chip on every step
 * with three values — `checked: true`, `checked: FALSE`, and `can't check`. The
 * third was 94% of the run and 4 of the 6 steps in every specimen, so the payoff
 * of a six-mark interaction was a wall of grey shrugs, and the page had to
 * apologise for it three separate times before the reader reached it. Two things
 * were wrong. `can't check` is a fact about the INSTRUMENT'S REACH, not a verdict
 * on the step, and it was rendered in the slot where the reader looks for a
 * verdict. And the checker's silence is the most interesting honest fact on this
 * page — a symbolic checker can prove almost nothing about natural-language
 * reasoning — which the old layout spent three paragraphs excusing.
 *
 * So the grey chip is gone. Coverage is now a property of the TEXT: the reveal
 * underlines the exact claim the checker recomputed and leaves everything else
 * plain. Every chain draws the same silhouette — a couple of underlined
 * fragments in a page of untouched prose — and the reader learns the checker's
 * reach by looking, with no apology and no third grammatical register.
 *
 * The three beats, and what each is allowed to say:
 *
 *   1. WHAT CAN BE GRADED AT ALL. The two limits: grading needs a fact, and a
 *      step must be big enough to be wrong. This is where the reader meets the
 *      page's two instruments and their opposite reach — the checker proves
 *      little and is silent on the rest, the PRM opines on everything and proves
 *      nothing. Stated as a finding now, not as a warning about the figure.
 *
 *   2. FIND THE BREAK. One question, one click: which line goes wrong, or does
 *      nothing? That is the question process grading actually answers, it is the
 *      question 70% of localisable chains have a single answer to, and it does
 *      not force the reader to have an opinion on prose no instrument can score.
 *      The reveal underlines what the checker read, chips the two verdicts it
 *      reached, and keeps the PRM's outlined score on every step, so fact and
 *      opinion stay visibly different without a grey chip mediating.
 *
 *   3. WHAT STEP GRADING BUYS. Two measured numbers replacing a redrawn published
 *      bar chart. Detection leads with the PROOF and states its smallness — five
 *      chains in 747 — because a floor quoted as a rate is the overclaim this
 *      page exists to avoid; the PRM's larger number sits beside it as opinion.
 *      Localisation is quoted WITH its spread, because the notebook's
 *      `localisation_survives_segmentation` claim came back false: move the rule
 *      for where a step ends and the median moves 25 points. The selector rung
 *      came back null and is reported as null.
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
 * a verbatim substring of the step — the notebook writes it that way, and
 * `@/lib/page09` refuses to load a judged step without one — and the split runs
 * on the RAW text so `tidyMath` never has to survive being applied twice to the
 * same characters. If a future run breaks the substring guarantee this returns
 * null and the step renders whole and unmarked, which loses the underline rather
 * than dropping text on the floor.
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
    // `tidyMath` trims, so the joins the raw text was making have to be put back.
    // Every claim in the shipped run occupies a whole line; a mid-line one still
    // reads correctly because the gap is taken from the raw text, not assumed.
    gapBefore: /\n\s*$/.test(before) ? "\n" : " ",
    gapAfter: /^\s*\n/.test(after) ? "\n" : " ",
  };
}

export function Page9() {
  const page = getPage(PAGE_N)!;
  const recordInteraction = useStore((s) => s.recordInteraction);

  const [roleKey, setRoleKey] = useState(ROLES[0].key);
  const [mode, setMode] = useState<Mode>("outcome");
  const [picks, setPicks] = useState<Record<string, Pick>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const role = ROLES.find((r) => r.key === roleKey)!;
  const trace = role.specimen;
  const myPick = picks[roleKey];
  const hasPicked = myPick !== undefined;
  const isRevealed = revealed[roleKey] ?? false;

  const pick = (p: Pick) => {
    recordInteraction(PAGE_N);
    setPicks((prev) => ({ ...prev, [roleKey]: p }));
  };

  // The break, and whether the reader put a finger on it. A chain with nothing
  // provably false has "none" for its answer, which is a real answer rather than
  // an abstention: the clean specimen is the trap in that direction.
  const breakAt = trace.firstFalse;
  const foundIt = breakAt !== null ? myPick === breakAt : myPick === "none";

  // What each instrument could see of THIS chain, which is the sentence that
  // replaced the grey chip.
  const nRead = trace.steps.filter((s) => s.check !== "unknown").length;
  const prmScored = trace.steps.filter((s) => s.prmVerdict !== null).length;
  const prmFlagged = trace.steps.filter((s) => s.prmVerdict === "false").length;

  const det = PAGE9.detection;
  const loc = PAGE9.localisation;
  const sel = PAGE9.selection;
  const prm = PAGE9.graders.prm;

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
            Which is why the two instruments below have opposite reach. An{" "}
            <strong className="text-ink">arithmetic checker</strong> recomputes claims that are
            closed-form numeric on both sides and proves them true or false. It found one in{" "}
            <strong className="text-ink">
              {pct(1 - PAGE9.graders.shareUnjudged, 1)} of{" "}
              {PAGE9.graders.stepsTotal.toLocaleString()}
            </strong>{" "}
            steps: the other {pct(PAGE9.graders.shareUnjudged)} state nothing it can compute. That
            is the honest ceiling on proof here, and it is low. A{" "}
            <strong className="text-ink">process reward model</strong>
            <Cite n={REF.lightman} /> takes the opposite trade: it
            scores every step and is silent on none, but a score is an opinion where the
            checker&apos;s label is a fact.
          </p>
          <p className="text-ink-muted">
            So the figure below shows the checker&apos;s reach as reach:{" "}
            <span className="rounded-sm bg-correct/15 px-1 underline decoration-correct decoration-2 underline-offset-4">
              it underlines the words it recomputed
            </span>{" "}
            and leaves the rest of the chain plain. Plain is not approval. It is the instrument
            having nothing to say.
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
                    grader cannot, and it is the one thing the reveal will settle.
                  </p>
                ) : null}

                {/* the trace */}
                <ol className="flex flex-col gap-2">
                  {trace.steps.map((step, i) => {
                    const showProcess = mode === "process";
                    const shown = showProcess && isRevealed;
                    const parts = shown ? splitOnClaim(step.text, step.claim) : null;
                    // Only a REFUTED step is worth colouring whole, because that is
                    // the line the reader was hunting. A proven-true step carries its
                    // own underline and needs no second signal, and a step the checker
                    // never read must look like ordinary prose — colouring it would
                    // put the instrument's reach back into a verdict slot.
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
                          ) : parts ? (
                            /* The claim underlined WHERE IT SITS. A step can open with
                               two sound lines and break on the third, and marking the
                               whole step would point at the wrong words. */
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
                              {/* fact: solid chip, and ONLY where there is a fact. A
                                  step the checker never read gets no chip at all. */}
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
                    {/* The other real answer. A chain with nothing provably false is
                        one of the three specimens, so "no break" has to be a click
                        rather than the absence of one. */}
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
                            ? "Nothing in this chain is provably false, and you said so."
                            : `You flagged line ${(myPick as number) + 1}, and the checker proves nothing false in this chain.`}
                      </strong>{" "}
                      {breakAt === null
                        ? "Which is not the same as proving it sound."
                        : "One line, named. That is the whole of what an outcome grader cannot tell you."}
                    </p>
                    <p>
                      It read{" "}
                      <strong className="text-ink">
                        {nRead} of {trace.steps.length}
                      </strong>{" "}
                      lines here, underlined above: the {nRead === 1 ? "only one" : "only ones"}{" "}
                      stating something it could compute outright. It has nothing at all to say
                      about the other {trace.steps.length - nRead}. Across the run it could read{" "}
                      {pct(1 - PAGE9.graders.shareUnjudged, 1)} of{" "}
                      {PAGE9.graders.stepsTotal.toLocaleString()} steps.{" "}
                      {prmScored > 0 ? (
                        <>
                          The PRM was silent on none: it scored all{" "}
                          <strong className="text-ink">{prmScored}</strong> and flags{" "}
                          <strong className="text-ink">
                            {prmFlagged === 0 ? "none" : prmFlagged}
                          </strong>
                          . Those are opinions, and they are the only opinion on offer for the lines
                          the checker could not reach.
                        </>
                      ) : null}
                    </p>
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
                          : `All ${trace.steps.length} steps are condemned together, including the ${trace.firstFalse ?? 0} that were sound.`}
                      </p>
                    </div>
                  ) : isRevealed ? (
                    <div className="rounded-lg border-l-4 border-compute bg-surface-raised p-3 text-sm">
                      <p className="text-ink">
                        <span className="font-semibold text-compute">Process grader:</span>{" "}
                        {breakAt !== null
                          ? `the ${breakAt} line${breakAt === 1 ? "" : "s"} before the break ${breakAt === 1 ? "stands" : "stand"}, so this chain needs one line fixed rather than the whole of it thrown away. ${trace.outcomeCorrect ? "And the outcome grader passed it, break and all." : ""}`
                          : "nothing here is provably false, and the PRM agrees. That is the case that needs no argument, and the reason a clean chain is worth showing beside the other two."}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            </section>

            <div className="rounded-lg border-l-4 border-wrong bg-surface p-4 text-base text-ink">
              <strong className="text-lg">A right answer is not a right chain.</strong> The{" "}
              <em>Lucky</em> chain reaches the right answer with a step that is arithmetically
              false. An outcome grader passes it, page 12&apos;s filter would fine-tune on it, and
              only a step grader can say <em>which line</em> to fix. How often that happens is the
              next beat, and the honest answer is smaller than the story wants.
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
                Underlined claims come from a deterministic arithmetic checker that judges only what
                is closed-form numeric on both sides: verdicts a reader can recompute by hand.
                Nothing underlined means nothing computable, not nothing wrong.
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
                  steps, the friendliest ones, so treat it as an upper bound.
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
                  Detection: how often we can prove it
                </figcaption>
                <p className="text-sm text-ink-muted">
                  Of the{" "}
                  <strong className="text-ink">{det.nRightChains.toLocaleString()}</strong> chains
                  that reached the right answer, the checker proves a step false in{" "}
                  <strong className="text-ink">{det.nContaminated}</strong> of them (
                  {pct(det.rate, 2)}), spread over {det.nProblems} of{" "}
                  {det.nProblemsWithARightChain} problems.
                </p>
                <p className="text-sm text-ink-muted">
                  <strong className="text-ink">Read that as a floor, not a rate.</strong>{" "}
                  {det.nContaminated} chains is too few to estimate how common the trap is; what it
                  establishes is that the trap is real and that outcome grading cannot see it. The
                  checker only reads arithmetic, so every lucky chain that goes wrong in prose is
                  invisible to it, and this number can only move upward.
                </p>
                {det.prm ? (
                  <p className="text-sm text-ink-muted">
                    For scale, the process reward model, which also sees method, calls a step
                    unsound in <strong className="text-ink">{pct(det.prm.rate)}</strong> of the
                    same chains: an opinion rather than a proof, and the margin says what that
                    opinion was measured to be worth. It is quoted to bound the gap, not to
                    replace the {pct(det.rate, 2)}.
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
                checker as a <em>selector</em> (drop any candidate containing a false step, then
                vote on what survives) moved {pct(sel.majority)} to {pct(sel.filtered)} over{" "}
                {sel.nProblems} problems, changing the answer on {sel.nChanged}. That is a null
                result, and at this checker&apos;s reach it is the honest one: reading the working
                earns its keep by catching and locating errors, not by picking winners.
              </p>
            ) : null}
          </section>

          <Note kicker="References">
            <p>
              Cited for the technique and for priority: process supervision, and training a
              reward model on step labels rather than outcomes. The numbers on this page are our
              own, on our own model, and are not comparable to theirs.
            </p>
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
