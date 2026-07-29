"use client";

/**
 * Page 17, "When Reasoning Breaks". Act 3's candour page: the compute knob has
 * a wrong side. Step 1 is verbatim published data (Huang et al., ICLR 2024,
 * Table 3): asked to re-check its own reasoning with no new information, a
 * model gets WORSE. Step 2 is an exact three-state chain (lib/frontier.ts,
 * unsolved -> correct <-> broken) the reader drives with a revision-pass
 * slider: genuine progress drains "unsolved" fast, then second-guessing leaks
 * "correct" into "broken" with almost no way back, so accuracy rises, peaks,
 * and falls — the reader hunts for the sweet spot and walks off the cliff. A
 * toggle puts an imperfect external verifier in front of every proposed change:
 * the cliff flattens into a plateau, capped below the perfect-verifier ceiling
 * by the bad edits it waves through (Stroebl et al.). Step 3 is the balance —
 * what still works, and why benchmark gains partly evaporate on fresh problems.
 */

import { useMemo, useState } from "react";
import { CitationBadge } from "@/components/CitationBadge";
import { Cite, RefItem } from "@/components/Cite";
import { LineChart } from "@/components/LineChart";
import { PageNav } from "@/components/PageNav";
import { Slider } from "@/components/Slider";
import { Toggle } from "@/components/Toggle";
import type { Citation } from "@/lib/data";
import { ACTS, getPage } from "@/lib/pages";
import { curves } from "@/lib/curves";
import { SELF_CORRECTION, selfCorrectionCurve } from "@/lib/frontier";
import { useStore } from "@/store/useStore";

const PAGE_N = 17;
const P = SELF_CORRECTION;

/** Page 17's references, numbered in order of first appearance. */
const REF = { huang: 1, zeng: 2, wang: 3, stroebl: 4, balachandran: 5 } as const;

const STROEBL: Citation = {
  ref: "Stroebl et al. 2024",
  url: "https://arxiv.org/abs/2411.17501",
  venue: "arXiv",
  preprint: true,
};

const ZENG: Citation = {
  ref: "Zeng et al. 2025",
  url: "https://arxiv.org/abs/2502.12215",
  venue: "ACL 2025",
  preprint: false,
};

const WANG: Citation = {
  ref: "Wang et al. 2025",
  url: "https://arxiv.org/abs/2501.18585",
  venue: "arXiv",
  preprint: true,
};

const BALACHANDRAN: Citation = {
  ref: "Balachandran et al. 2025",
  url: "https://arxiv.org/abs/2504.00294",
  venue: "arXiv",
  preprint: true,
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
              mistakes — no hints, no tools, just re-reading. Measured across two rounds of exactly
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
              it, so the review mostly re-approves the answer — and when the model does change
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
            2. Make it think more
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              exact three-state chain · no live model
            </span>
          </h2>
          <div className="flex flex-col gap-4 rounded-lg border-l-4 border-compute bg-surface p-4">
            <p className="text-sm text-ink">
              Every problem here is in one of three states: <strong>not solved yet</strong>,{" "}
              <strong>solved</strong>, or <strong>talked out of it</strong>. Each extra pass solves{" "}
              {P.solveProb * 100}% of the unsolved ones — but also second-guesses{" "}
              {P.breakProb * 100}% of finished answers into wrong ones, and repairs a broken answer
              only {P.fixProb * 100}% of the time (step 1&apos;s asymmetry).{" "}
              {P.unsolvable * 100}% of problems are out of reach at any budget.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Slider
                label="Extra revision passes"
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
                      The verifier rejects 9 in 10 bad edits, so the cliff flattens into a plateau —
                      held below the {ceiling.toFixed(0)}% ceiling by the edits it waves through.
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
                title="Accuracy versus extra revision passes, unaided and with an external verifier"
                points={unaided}
                secondary={verifier ? { points: checked, label: "verifier on" } : undefined}
                primaryLabel="unaided self-correction"
                xLabel="extra revision passes"
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
              than right ones while switching strategies ~4× as often — the model isn&apos;t
              thinking deeper, it&apos;s thrashing.
              <Cite n={REF.wang} /> And the rescue on the cyan curve is exactly as good as its
              judge: with an imperfect verifier, more resampling eventually <em>lowers</em> true
              accuracy as false positives pile up, so the plateau — not 100% — is the best the
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
          <aside className="flex flex-col gap-2 text-sm text-ink-muted">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              References
            </p>
            <RefItem n={REF.zeng} href="https://arxiv.org/abs/2502.12215">
              Zeng et al. 2025, <em>Revisiting the Test-Time Scaling of o1-like Models</em> (ACL
              2025).
            </RefItem>
            <RefItem n={REF.wang} href="https://arxiv.org/abs/2501.18585">
              Wang et al. 2025, <em>Thoughts Are All Over the Place</em>.
            </RefItem>
            <RefItem n={REF.stroebl} href="https://arxiv.org/abs/2411.17501">
              Stroebl et al. 2024, <em>Inference Scaling fLaws</em> — the verifier ceiling, from
              page 8.
            </RefItem>
          </aside>
        </div>

        {/* Step 3 — what still works */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">3. What still works</h2>
          <div className="flex flex-col gap-2 rounded-lg border border-grid bg-surface p-4 text-sm text-ink">
            <p>
              <strong>Feedback from outside the model.</strong> Self-correction fails <em>unaided</em>;
              give the reviser real information — a failing unit test, a calculator, a proof checker
              — and revision has something to push against.
            </p>
            <p>
              <strong>Verifiers, where answers are checkable.</strong> Selection with a judge (page
              8) still beats blind voting — up to the ceiling its reliability sets.
            </p>
            <p>
              <strong>Training, not prompting.</strong> The mid-chain &ldquo;wait, let me
              re-check&rdquo; that RL taught DeepSeek-R1 (page 16) was learned against verified
              rewards — not requested politely at inference time.
            </p>
            <p className="text-ink-muted">
              One last caveat: measure on fresh problems. On AIME 2025, released after these models
              trained, reasoning models scored 7–30 points below their 1983–2024 averages — and a
              conventional model fell from 40% to 1% — so part of every inference-time-scaling gain
              measured on old benchmarks is familiarity, not reasoning.
              <Cite n={REF.balachandran} />
            </p>
          </div>
        </section>

        <Note kicker="References">
          <RefItem n={REF.balachandran} href="https://arxiv.org/abs/2504.00294">
            Balachandran et al. 2025, <em>Inference-Time Scaling for Complex Tasks: Where We Stand
            and What Lies Ahead</em>.
          </RefItem>
        </Note>
      </div>

      <div className="flex flex-wrap gap-2">
        <CitationBadge citation={huang.citation} />
        <CitationBadge citation={ZENG} />
        <CitationBadge citation={WANG} />
        <CitationBadge citation={STROEBL} />
        <CitationBadge citation={BALACHANDRAN} />
      </div>
      <p className="text-xs text-ink-muted">
        the bar panels are verbatim Table 3 values from Huang et al. (ICLR 2024, arXiv:2310.01798)
        · the slider demo is an exact three-state chain, not a digitized curve: no paper fixes its
        transition rates, and the constants (solve 45%, break 10%, fix 3%, 15% out of reach,
        verifier reliability 90%) are authored so the shape matches the published directions —
        correct→wrong flips outnumber wrong→correct (Huang et al.), forced revision lowers weaker
        o1-style models&apos; accuracy and correct solutions run shorter than incorrect ones (Zeng
        et al. 2025, arXiv:2502.12215), wrong answers burn ~225% more tokens amid ~4× more strategy
        switches (Wang et al. 2025, arXiv:2501.18585), and an imperfect verifier caps — and can
        reverse — resampling gains (Stroebl et al. 2024, arXiv:2411.17501) · AIME 2025 drops are
        reported values from Balachandran et al. 2025 (arXiv:2504.00294) · every number in the demo
        is pinned by the test suite
      </p>

      <PageNav n={PAGE_N} />
    </article>
  );
}
