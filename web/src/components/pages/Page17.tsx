"use client";

/**
 * Page 17, "When Reasoning Breaks". Act 3's candour page: the compute knob has
 * a wrong side. Three failure modes, in the order the title names them.
 *
 * Step 1 is verbatim published data (Huang et al., ICLR 2024, Table 3): asked
 * to re-check its own reasoning with no new information, a model gets WORSE.
 *
 * Step 2 is an exact three-state chain (lib/frontier.ts, unsolved -> correct
 * <-> broken) the reader drives with a pass slider. THE TWO STEPS MUST NOT BE
 * CONFLATED, and the copy is written to keep them apart: step 1 measured a
 * re-read, which cannot solve anything new, while each pass here also makes a
 * fresh attempt at what is still unsolved, which is what supplies solveProb =
 * 0.45. Without that sentence a reader drags the slider, watches unaided
 * accuracy climb 24 points, and concludes step 1 was overstated. Both halves
 * of each pass are drawn from the published directions: fresh work solves,
 * revisiting breaks more than it repairs. Genuine progress drains "unsolved"
 * fast, then second-guessing leaks "correct" into "broken" with almost no way
 * back, so accuracy rises, peaks, and falls. A toggle puts an imperfect
 * external verifier in front of every proposed change: the cliff flattens
 * into a plateau, capped below the perfect-verifier ceiling both by the bad
 * edits it waves through and by the genuine repairs it blocks (Stroebl et al.).
 *
 * Step 3 is overthinking, the third mode the title promises and the one this
 * page carried as two sentences of prose until data/overthinking.json was
 * finally drawn: the same knob, past its peak, and easy problems cross that
 * peak sooner than hard ones. The shape is authored to the preprints'
 * qualitative finding and says so on screen.
 *
 * Step 4 is the balance: what still works, and the contamination caveat, which
 * discounts every accuracy number in Acts 2 and 3 and is therefore a callout
 * rather than a trailing muted line.
 */

import { useMemo, useState } from "react";
import { Cite, RefItem } from "@/components/Cite";
import { LineChart } from "@/components/LineChart";
import { PageNav } from "@/components/PageNav";
import { Slider } from "@/components/Slider";
import { Toggle } from "@/components/Toggle";
import { ACTS, getPage } from "@/lib/pages";
import { curves } from "@/lib/curves";
import { inverseU, SELF_CORRECTION, selfCorrectionCurve } from "@/lib/frontier";
import { useStore } from "@/store/useStore";

const PAGE_N = 17;
const P = SELF_CORRECTION;

/** Page 17's references, numbered in order of first appearance. */
const REF = { huang: 1, zeng: 2, wang: 3, stroebl: 4, overthinking: 5, balachandran: 6 } as const;

/** A margin note that sits beside its step and scrolls with the page. */
function Note({ kicker, children }: { kicker: string; children: React.ReactNode }) {
  return (
    <aside className="flex flex-col gap-2 text-sm text-ink-muted lg:pt-9">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{kicker}</p>
      {children}
    </aside>
  );
}

/** One model × benchmark panel of the Huang et al. Table 3 bars. */
function SelfCorrectPanel({
  heading,
  rows,
}: {
  heading: string;
  rows: { label: string; value: number; broke: boolean }[];
}) {
  return (
    <div
      className="flex flex-col gap-2 rounded-lg border border-grid bg-surface-raised p-3"
      role="img"
      aria-label={`${heading}: ${rows.map((r) => `${r.label} ${r.value} percent`).join(", ")}`}
    >
      <p className="text-sm font-semibold text-ink">{heading}</p>
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-2 text-sm">
          <span className="w-28 shrink-0 text-ink-muted">{r.label}</span>
          <div className="h-5 flex-1 rounded bg-surface">
            <div
              className={`h-5 rounded ${r.broke ? "bg-wrong" : "bg-correct"}`}
              style={{ width: `${r.value}%` }}
            />
          </div>
          <span className="w-12 shrink-0 text-right font-mono tabular-nums text-ink">
            {r.value.toFixed(1)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function Page17() {
  const page = getPage(PAGE_N)!;
  const recordInteraction = useStore((s) => s.recordInteraction);
  const huang = curves.selfCorrection;
  const h = huang.fit!.params;

  const [passes, setPasses] = useState(0);
  const [verifier, setVerifier] = useState(false);

  const unaided = useMemo(
    () => selfCorrectionCurve(P.maxSteps, { ...P, reliability: null }),
    [],
  );
  const checked = useMemo(() => selfCorrectionCurve(P.maxSteps, { ...P }), []);
  const peak = useMemo(() => unaided.reduce((a, p) => (p.y > a.y ? p : a)), [unaided]);
  const ceiling = (1 - P.unsolvable) * 100;

  const acc = (verifier ? checked : unaided)[passes].y;
  const pastPeak = !verifier && passes > peak.x;
  const atPeak = !verifier && passes === peak.x;

  // Step 3's pair: ONE authored inverse-U evaluated at two peak positions, so
  // the only thing the figure asserts is the order of the two thresholds,
  // which is what the preprints report. Past zero the arm stops rather than
  // running along the floor: inverseU clamps at 0, and a flat floor drawn
  // across a decade of x would be an artifact of Math.max presented as a
  // finding (page 13 has the same failure mode on its x1 curve).
  const ot = curves.overthinking.fit!.params;
  const overthinking = useMemo(() => {
    const arm = (peakX: number, peakAcc: number) => {
      const pts: { x: number; y: number }[] = [];
      for (let i = 0; i <= 48; i++) {
        const x = i / 4;
        const y = inverseU(x, peakX, peakAcc, ot.curvature);
        if (y > 0) pts.push({ x, y });
      }
      return pts;
    };
    return {
      easy: arm(ot.easyPeak, ot.easyPeakAcc),
      hard: arm(ot.hardPeak, ot.hardPeakAcc),
    };
  }, [ot.curvature, ot.easyPeak, ot.easyPeakAcc, ot.hardPeak, ot.hardPeakAcc]);

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
        For sixteen pages the dial has mostly pointed one way: more samples, deeper search, longer
        chains, more accuracy. This page is the fine print. Left alone, models{" "}
        <strong className="text-ink">cannot reliably fix their own mistakes</strong>, thinking
        longer can <strong className="text-ink">subtract</strong> accuracy, and the verifiers doing
        the rescuing are fallible themselves.
      </p>

      <div className="grid gap-x-8 gap-y-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
        {/* Step 1 — intrinsic self-correction fails */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            1. Marking its own homework
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              verbatim published numbers
            </span>
          </h2>
          <div className="flex flex-col gap-3 rounded-lg border border-grid bg-surface p-4">
            <p className="text-sm text-ink">
              The obvious fix for a wrong answer is to ask the model to look it over and correct any
              mistakes: no hints, no tools, just re-reading. Measured across two rounds of exactly
              that, accuracy goes <strong>down</strong>:
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <SelfCorrectPanel
                heading="GPT-4 · GSM8K"
                rows={[
                  { label: "first answer", value: h.gpt4Gsm8k0, broke: false },
                  { label: "after 1 round", value: h.gpt4Gsm8k1, broke: true },
                  { label: "after 2 rounds", value: h.gpt4Gsm8k2, broke: true },
                ]}
              />
              <SelfCorrectPanel
                heading="GPT-3.5 · CommonSenseQA"
                rows={[
                  { label: "first answer", value: h.gpt35Csqa0, broke: false },
                  { label: "after 1 round", value: h.gpt35Csqa1, broke: true },
                  { label: "after 2 rounds", value: h.gpt35Csqa2, broke: true },
                ]}
              />
            </div>
            <p className="text-sm text-ink-muted">
              The reason is structural: the same weights that produced the error are asked to find
              it, so the review mostly re-approves the answer, and when the model does change
              something, it flips correct answers to wrong{" "}
              <em>more often than the reverse</em>.
              <Cite n={REF.huang} /> Nothing new enters the system; &ldquo;are you
              sure?&rdquo; just adds noise, and on CommonSenseQA one round of it cost GPT-3.5 half
              its score.
            </p>
          </div>
        </section>

        <Note kicker="References">
          <RefItem n={REF.huang} href="https://arxiv.org/abs/2310.01798">
            Huang et al. 2024, <em>Large Language Models Cannot Self-Correct Reasoning Yet</em>{" "}
            (ICLR 2024), Table 3. &ldquo;Round&rdquo; = the model is shown its own answer and asked
            to review and revise it, with no external feedback.
          </RefItem>
        </Note>

        {/* Step 2 — the sweet spot and the cliff */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            2. Attempting again, not re-reading
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              exact three-state chain · no live model
            </span>
          </h2>
          <div className="flex flex-col gap-4 rounded-lg border-l-4 border-compute bg-surface p-4">
            <p className="text-sm text-ink">
              Step 1 held the model to a re-read, which is why nothing new could be solved. Loosen
              that. Every problem here is in one of three states: <strong>not solved yet</strong>,{" "}
              <strong>solved</strong>, or <strong>talked out of it</strong>, and each extra pass
              does two things at once. It makes a <strong>fresh attempt</strong> at the ones still
              unsolved, new working rather than a review of the old answer, and that is what solves{" "}
              {P.solveProb * 100}% of them. It also <strong>revisits</strong> the ones already
              answered, second-guessing {P.breakProb * 100}% of finished answers into wrong ones and
              repairing a broken answer only {P.fixProb * 100}% of the time. The second half of that
              sentence is step 1&apos;s asymmetry; the first half is the part step 1 never offered
              the model. {P.unsolvable * 100}% of problems are out of reach at any budget.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Slider
                label="Extra passes, each a fresh attempt"
                min={0}
                max={P.maxSteps}
                value={passes}
                onChange={(v) => {
                  setPasses(v);
                  recordInteraction(PAGE_N);
                }}
              />
              <Toggle
                label="External verifier reviews every change"
                checked={verifier}
                onChange={(v) => {
                  setVerifier(v);
                  recordInteraction(PAGE_N);
                }}
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div
                className={`flex flex-col justify-center rounded-lg border p-4 ${
                  pastPeak ? "border-wrong bg-wrong/10" : "border-grid bg-surface-raised"
                }`}
              >
                <p className="text-sm text-ink-muted">
                  {verifier ? "Accuracy, verifier reviewing:" : "Accuracy, unaided:"}
                </p>
                <p
                  className={`font-mono text-3xl font-bold tabular-nums ${
                    pastPeak ? "text-wrong" : verifier ? "text-compute" : "text-correct"
                  }`}
                >
                  {acc.toFixed(1)}%
                </p>
                <p className="mt-1 text-sm">
                  {verifier ? (
                    <span className="text-ink-muted">
                      The verifier rejects 9 in 10 bad edits, so the cliff flattens into a plateau.
                      It is held below the {ceiling.toFixed(0)}% ceiling twice over: by the bad
                      edits it waves through, and by the 1 in 10 genuine repairs it blocks.
                    </span>
                  ) : atPeak ? (
                    <span className="text-correct">
                      The sweet spot: solving and second-guessing exactly balance.
                    </span>
                  ) : pastPeak ? (
                    <span className="text-wrong">
                      Past the peak ({peak.y.toFixed(0)}% at {peak.x} passes): nearly everything
                      solvable is solved, so extra passes mostly break finished answers.
                    </span>
                  ) : (
                    <span className="text-ink-muted">
                      Still climbing: unsolved problems are being finished faster than finished ones
                      are being broken.
                    </span>
                  )}
                </p>
              </div>
              <LineChart
                title="Accuracy versus extra passes, unaided and with an external verifier"
                points={unaided}
                secondary={verifier ? { points: checked, label: "verifier on" } : undefined}
                primaryLabel="unaided"
                xLabel="extra passes"
                yLabel="accuracy (%)"
                yDomain={[0, 100]}
                xDomain={[0, P.maxSteps]}
                markerX={passes}
                markerDelta={verifier}
                referenceY={verifier ? ceiling : undefined}
                referenceLabel={verifier ? "ceiling if the verifier never erred" : undefined}
              />
            </div>
            <p className="text-sm text-ink-muted">
              Both ends of this curve are measured in the wild. On o1-style models, correct
              solutions are consistently <em>shorter</em> than incorrect ones, and forcing extra
              revision rounds steadily lowers the accuracy of weaker models.
              <Cite n={REF.zeng} /> On hard AIME problems, wrong answers burn ~225% more tokens
              than right ones while switching strategies ~4× as often: the model isn&apos;t
              thinking deeper, it&apos;s thrashing.
              <Cite n={REF.wang} /> And the rescue on the cyan curve is exactly as good as its
              judge. With an imperfect verifier, more resampling eventually <em>lowers</em> true
              accuracy as false positives pile up, so the plateau, not 100%, is the best the
              toggle can buy.
              <Cite n={REF.stroebl} />
            </p>
          </div>
        </section>

        <div className="flex flex-col gap-6">
          <Note kicker="Try it">
            <p>
              Verifier off: find the sweet spot, then keep going and watch the cliff. Verifier on:
              ask what sets the new ceiling.
            </p>
          </Note>
          <Note kicker="References">
            <RefItem n={REF.zeng} href="https://arxiv.org/abs/2502.12215">
              Zeng et al. 2025, <em>Revisiting the Test-Time Scaling of o1-like Models</em> (ACL
              2025).
            </RefItem>
            <RefItem n={REF.wang} href="https://arxiv.org/abs/2501.18585" preprint>
              Wang et al. 2025, <em>Thoughts Are All Over the Place</em>.
            </RefItem>
            <RefItem n={REF.stroebl} href="https://arxiv.org/abs/2411.17501" preprint>
              Stroebl et al. 2024, <em>Inference Scaling fLaws</em>: the verifier ceiling, from
              page 8.
            </RefItem>
          </Note>
        </div>

        {/* Step 3 — overthinking: the peak is a property of the problem */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            3. The peak is not where you set it
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              authored shape · direction from the preprints
            </span>
          </h2>
          <div className="flex flex-col gap-3 rounded-lg border border-grid bg-surface p-4">
            <p className="text-sm text-ink">
              Step 2&apos;s curve had one peak, which invites the obvious next question: find it,
              set the budget there, done. It does not work, because the peak is not a property of
              the model. It is a property of the problem.
            </p>
            <LineChart
              title="Accuracy versus thinking length, easy problems against hard ones"
              points={overthinking.easy}
              secondary={{ points: overthinking.hard, label: "hard problems" }}
              primaryLabel="easy problems"
              xLabel="thinking length (arbitrary units)"
              yLabel="accuracy (%)"
              yDomain={[0, 100]}
              xDomain={[0, 12]}
              dots={[
                { x: ot.easyPeak, y: ot.easyPeakAcc, label: `peak at ${ot.easyPeak}` },
                { x: ot.hardPeak, y: ot.hardPeakAcc, label: `peak at ${ot.hardPeak}` },
              ]}
            />
            <p className="text-sm text-ink-muted">
              Easy problems reach their best answer early and are then talked out of it. Hard
              problems are still gaining where the easy ones have already been ruined. That gap is
              the <strong className="text-ink">overthinking threshold</strong>, and the easy half of
              a test set crosses it first.
              <Cite n={REF.overthinking} /> So one budget applied to a whole test set is wrong in
              two directions at once: too long for the easy problems, too short for the hard ones.
              Page 11&apos;s difficulty bands were an answer to this figure before the figure was
              drawn.
            </p>
          </div>
        </section>

        <Note kicker="References">
          <RefItem n={REF.overthinking} href={curves.overthinking.citation.url} preprint>
            The 2025 overthinking and inverse-scaling-in-test-time-compute preprints: past a point,
            longer reasoning reduces accuracy, and easy problems cross that point sooner than hard
            ones.
          </RefItem>
        </Note>

        {/* Step 4 — what still works */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">4. What still works</h2>
          <div className="flex flex-col gap-2 rounded-lg border border-grid bg-surface p-4 text-sm text-ink">
            <p>
              <strong>Feedback from outside the model.</strong> Self-correction fails <em>unaided</em>;
              give the reviser real information, a failing unit test, a calculator, a proof checker,
              and revision has something to push against.
            </p>
            <p>
              <strong>Verifiers, where answers are checkable.</strong> Selection with a judge (page
              8) still beats blind voting, up to the ceiling its reliability sets.
            </p>
            <p>
              <strong>Training, not prompting.</strong> The mid-chain &ldquo;wait, let me
              re-check&rdquo; that RL taught DeepSeek-R1 (page 14) was learned against verified
              rewards, not requested politely at inference time.
            </p>
          </div>
          <div className="rounded-lg border-l-4 border-wrong bg-wrong/10 p-4 text-sm text-ink">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              And one caveat that reaches backwards
            </p>
            <p className="mt-2">
              <strong>Every accuracy number in this story was measured on problems the model may
              already have seen.</strong> On AIME 2025, released after these models trained,
              reasoning models scored 7 to 30 points below their 1983 to 2024 averages, and a
              conventional model fell from 40% to 1%.
              <Cite n={REF.balachandran} /> Part of every inference-time-scaling gain measured on an
              older benchmark is familiarity rather than reasoning. That discounts the levers of Act
              2 and the frontier scores of Act 3 alike; it does not tell you by how much, which is
              the uncomfortable part.
            </p>
          </div>
        </section>

        <Note kicker="References">
          <RefItem n={REF.balachandran} href="https://arxiv.org/abs/2504.00294" preprint>
            Balachandran et al. 2025, <em>Inference-Time Scaling for Complex Tasks: Where We Stand
            and What Lies Ahead</em>.
          </RefItem>
        </Note>
      </div>

      {/* Handoff to 18 */}
      <div className="max-w-2xl rounded-lg border-l-4 border-compute bg-surface p-4 text-ink">
        Notice what every repair on this page assumed. The verifier reads the chain, the reviser
        reads the chain, and the reader reads the chain, and all three take it for what it says it
        is: the working that produced the answer.{" "}
        <em className="text-ink-muted">
          Suppose it isn&apos;t. Next: whether the written chain is the real reason at all.
        </em>
      </div>

      <p className="text-xs text-ink-muted">
        the bar panels are verbatim Table 3 values<Cite n={REF.huang} /> · the slider demo is an
        exact three-state chain, not a digitized curve: no paper fixes its transition rates, and the
        constants (solve 45%, break 10%, fix 3%, 15% out of reach, verifier reliability 90%) are
        authored so the shape matches the published directions: correct→wrong flips outnumber
        wrong→correct,<Cite n={REF.huang} /> forced revision lowers weaker o1-style models&apos;
        accuracy and correct solutions run shorter than incorrect ones,<Cite n={REF.zeng} /> wrong
        answers burn ~225% more tokens amid ~4× more strategy switches,<Cite n={REF.wang} /> and an
        imperfect verifier caps, and can reverse, resampling gains<Cite n={REF.stroebl} /> · step
        3&apos;s two curves are one authored inverse-U (data/overthinking.json) evaluated at two
        peak positions, so what the figure asserts is the ORDER of the two thresholds, which the
        preprints report,<Cite n={REF.overthinking} /> not the depth of either fall; each arm stops
        where it reaches zero rather than running along the floor, which would be an artifact of the
        clamp · AIME 2025 drops are reported values<Cite n={REF.balachandran} /> · every number on
        this page is pinned by the test suite
      </p>

      <PageNav n={PAGE_N} />
    </article>
  );
}
