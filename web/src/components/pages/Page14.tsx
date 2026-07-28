"use client";

/**
 * Page 14, "Frontier Reasoners II: DeepSeek-R1, GRPO, and the 'Aha Moment'" —
 * the open-weight answer to the closed frontier. o1 proved RL-trained reasoning
 * works and hid how; in January 2025 DeepSeek published the recipe, the
 * training curve, and the weights (MIT license). The page's one idea: reward
 * ONLY verifiable right answers and the pausing / second-guessing /
 * self-correcting of this whole act emerges on its own — nobody writes it in.
 *
 * Step 1 is the recipe, GRPO, shown as the thing it actually is: the group of
 * sampled answers IS the baseline. Four sampled answers to page 1's 17 × 24, a
 * rule-based checker (= 408?), and each answer pushed by (its reward − the
 * group mean). Clicking a slot resamples it, so the reader can feel the two
 * properties that matter: the same right answer earns a smaller push in a
 * luckier group, and a group that is all-right or all-wrong teaches nothing.
 * No critic network anywhere — that is what made RL at this scale affordable.
 *
 * Step 2 is the training scrubber over R1-Zero (curves.deepseekTraining):
 * AIME pass@1 15.6 → 71.0 while average response length grows ~1k → ~9k
 * tokens, accuracy and thinking time climbing TOGETHER. The scratchpad below
 * the chart stages the paper's Table-3 trace: early = square once and stop;
 * mid = longer but strictly forward; past the aha step the verbatim "Wait,
 * wait. Wait. That's an aha moment I can flag here." interruption appears.
 * The paper places that trace only at "an intermediate version", so its slider
 * position here is an illustrative placement — said in the provenance line
 * under the trace, where Page 9 puts the same kind of caveat.
 *
 * Step 3 is the give-away: full R1's headline numbers (cold start + more RL),
 * then the six distilled dense models (curves.deepseekDistill, Table 5). The
 * bars double as the picker; teacher and o1-mini are fixed reference rows. The
 * accuracy/size trade is the interactive: pick a size, read AIME + MATH-500 +
 * how many times fewer parameters than the 671B teacher.
 *
 * Sidenotes follow the page-2 convention: numbered cites (Cite/RefItem)
 * beside the step that uses them, citation chips at the bottom, no footnotes.
 */

import { useState } from "react";
import { CitationBadge } from "@/components/CitationBadge";
import { Cite, RefItem } from "@/components/Cite";
import { LineChart } from "@/components/LineChart";
import { PageNav } from "@/components/PageNav";
import { Slider } from "@/components/Slider";
import { ACTS, getPage } from "@/lib/pages";
import { curves, interpolate } from "@/lib/curves";
import type { Citation } from "@/lib/data";
import { useStore } from "@/store/useStore";

const PAGE_N = 14;
const MAX_STEP = 8000;
/** Trace staging thresholds on the scrubber (illustrative placement — see the
    provenance line under the trace). */
const MID_STEP = 2500;
const AHA_STEP = 5000;

/** Page 14's references, numbered in order of first appearance. */
const REF = { r1: 1, grpo: 2 } as const;

const GRPO_CITATION: Citation = {
  ref: "Shao et al. 2024",
  url: "https://arxiv.org/abs/2402.03300",
  venue: "arXiv (preprint)",
  preprint: true,
};

/** Page 1's multiplication, sampled four times. Each slot's wrong answer is
    fixed so a resample is deterministic: right ↔ that slot's wrong. */
const RIGHT_ANSWER = "408";
const SLOT_WRONGS = ["398", "428", "308", "388"];

type Stage = "early" | "mid" | "aha";

/* The Table-3 trace, staged. OPEN and MID are the verbatim trace abridged;
   AHA is the famous passage verbatim, ellipses as printed. */
const TRACE_PROBLEM =
  "If a > 1, then the sum of the real solutions of √(a − √(a+x)) = x is equal to …";
const TRACE_OPEN = [
  "To solve the equation √(a − √(a+x)) = x, let's start by squaring both sides …",
  "(√(a − √(a+x)))² = x² ⟹ a − √(a+x) = x²",
];
const TRACE_MID = [
  "Rearrange to isolate the inner square root: √(a+x) = a − x², then square again: a + x = (a − x²)²",
  "Expanding and collecting terms: x⁴ − 2ax² − x + (a² − a) = 0 …",
];
const TRACE_AHA = [
  "Wait, wait. Wait. That's an aha moment I can flag here.",
  "Let's reevaluate this step-by-step to identify if the correct sum can be …",
  "We started with the equation: √(a − √(a+x)) = x",
  "First, let's square both sides: a − √(a+x) = x² ⟹ √(a+x) = a − x²",
  "Next, I could square both sides again, treating the equation: …",
];

const STAGE_CHIP: Record<Stage, string> = {
  early: "early in training",
  mid: "mid training",
  aha: "after the aha",
};
const STAGE_NOTE: Record<Stage, string> = {
  early: "One pass: square once, write an answer, stop. Nothing looks back.",
  mid: "Longer now — more algebra per attempt — but still strictly forward: whatever was written first, stands.",
  aha: "The trace interrupts itself mid-solution and starts over. Nobody trained that in; correct answers simply pay better, and re-checking finds more of them.",
};

interface Distill {
  size: number;
  label: string;
  mathKey: string;
  note: string;
}
const DISTILLS: Distill[] = [
  { size: 1.5, label: "Qwen-1.5B", mathKey: "math1p5", note: "On AIME it beats GPT-4o-0513 (9.3%) — from a model that fits on a phone." },
  { size: 7, label: "Qwen-7B", mathKey: "math7", note: "Most of the way to o1-mini (63.6%), at laptop scale." },
  { size: 8, label: "Llama-8B", mathKey: "math8", note: "A Llama base instead of Qwen: the same 800K traces teach a different family." },
  { size: 14, label: "Qwen-14B", mathKey: "math14", note: "Beats QwQ-32B-Preview (50.0%), the strongest open reasoning model of its day, at less than half the size." },
  { size: 32, label: "Qwen-32B", mathKey: "math32", note: "Within ~7 points of the 671B teacher." },
  { size: 70, label: "Llama-70B", mathKey: "math70", note: "Bigger is not automatically better: the 32B Qwen edges it on AIME." },
];

/** A margin note that sits beside its step and scrolls with the page. */
function Note({ kicker, children }: { kicker: string; children: React.ReactNode }) {
  return (
    <aside className="flex flex-col gap-2 text-sm text-ink-muted lg:pt-9">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{kicker}</p>
      {children}
    </aside>
  );
}

export function Page14() {
  const page = getPage(PAGE_N)!;
  const recordInteraction = useStore((s) => s.recordInteraction);
  const training = curves.deepseekTraining;
  const distill = curves.deepseekDistill;
  const { cons64, lengthStart, lengthEnd } = training.fit!.params;
  const P = distill.fit!.params;

  const [step, setStep] = useState(0);
  const [pickedSize, setPickedSize] = useState(14);
  const [rightSlots, setRightSlots] = useState([true, false, false, true]);

  /* — step 1: the group is the baseline — */
  const rewards: number[] = rightSlots.map((c) => (c ? 1 : 0));
  const mean = rewards.reduce((a, b) => a + b, 0) / rewards.length;
  const uniform = rewards.every((r) => r === rewards[0]);
  const resample = (i: number) => {
    setRightSlots((prev) => prev.map((c, k) => (k === i ? !c : c)));
    recordInteraction(PAGE_N);
  };

  /* — step 2: the scrubber — */
  const pass = interpolate(training, step);
  const length = Math.round(lengthStart + (lengthEnd - lengthStart) * (step / MAX_STEP));
  const stage: Stage = step >= AHA_STEP ? "aha" : step >= MID_STEP ? "mid" : "early";
  const chartPoints = training.points;

  /* — step 3: the distills — */
  const picked = DISTILLS.find((d) => d.size === pickedSize)!;
  const aimeOf = (size: number) => distill.points.find((p) => p.x === size)!.y;
  const paramRatio = Math.round(P.teacherParamsB / picked.size);

  const barAria = `AIME 2024 pass at 1: DeepSeek-R1 teacher ${P.r1Aime} percent, OpenAI o1-mini ${P.o1miniAime} percent, distilled models from ${aimeOf(1.5)} percent at 1.5B to ${aimeOf(32)} percent at 32B.`;

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
        OpenAI&apos;s o1 proved that RL-trained reasoning works — and hid the recipe. In January
        2025 the Chinese lab DeepSeek published it: paper, training curve, and MIT-licensed weights
        for <strong className="text-ink">R1</strong>, a model matching o1 on many reasoning
        benchmarks. The headline is what the recipe <em>leaves out</em>: no worked examples at all.{" "}
        <strong className="text-ink">
          Reward only verifiably correct final answers, and the pausing, checking, and backing-up
        </strong>{" "}
        you have spent this act building by hand emerges on its own.
        <Cite n={REF.r1} />
      </p>

      <div className="grid gap-x-8 gap-y-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
        {/* Step 1 — the recipe */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            1. The recipe: the group grades itself
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              GRPO · rule-based reward · no worked examples
            </span>
          </h2>

          <div className="flex flex-col gap-4 rounded-lg border-l-4 border-compute bg-surface p-4">
            <p className="text-ink">
              <strong>R1-Zero</strong> starts from a plain base model and deletes the usual
              supervised warm-up entirely. The reward is a program, not a network: did the final
              answer match? is the reasoning wrapped in the right tags? Sample a{" "}
              <strong>group</strong> of answers to one problem, score each with the rule, and push
              each one up or down by how far it beats <em>the group&apos;s own average</em>. That
              is <strong>Group Relative Policy Optimization</strong> — the group is the baseline,
              so there is no second &ldquo;critic&rdquo; model to train, which is what makes RL at
              this scale affordable.
              <Cite n={REF.grpo} />
            </p>

            <div className="flex flex-col gap-2 rounded-lg border border-dashed border-grid bg-surface-raised p-3">
              <p className="text-sm text-ink">
                <span className="font-mono text-ink-muted">problem → </span>
                <span className="font-mono font-semibold text-ink">17 × 24 = ?</span>
                <span className="ml-2 text-xs text-ink-muted">
                  the rule checks one thing: does the answer equal 408?
                </span>
              </p>
              <div className="grid gap-2 sm:grid-cols-4" role="group" aria-label="Four sampled answers">
                {rightSlots.map((right, i) => {
                  const adv = rewards[i] - mean;
                  return (
                    <button
                      key={i}
                      type="button"
                      aria-label={`Resample answer ${i + 1}`}
                      onClick={() => resample(i)}
                      className={`flex flex-col items-center gap-1 rounded-lg border-l-4 p-2 text-sm ${
                        right ? "border-correct bg-correct/10" : "border-wrong bg-wrong/10"
                      }`}
                    >
                      <span className="text-xs text-ink-muted">sample {i + 1}</span>
                      <span className="font-mono font-semibold text-ink">
                        {right ? RIGHT_ANSWER : SLOT_WRONGS[i]}
                      </span>
                      <span className={right ? "text-xs text-correct" : "text-xs text-wrong"}>
                        {right ? "✓ reward 1" : "✗ reward 0"}
                      </span>
                      <span
                        className={`font-mono text-xs font-semibold ${
                          adv > 0 ? "text-correct" : adv < 0 ? "text-wrong" : "text-ink-muted"
                        }`}
                      >
                        {adv > 0 ? "+" : ""}
                        {adv.toFixed(2)}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-sm text-ink-muted">
                group average: <span className="font-mono text-ink">{mean.toFixed(2)}</span> · each
                sample&apos;s push is its reward minus that average (GRPO then divides by the
                group&apos;s spread) · click an answer to resample it
              </p>
              {uniform ? (
                <p className="rounded border-l-4 border-compute bg-surface p-2 text-sm text-ink">
                  Every answer scored the same, so every push is{" "}
                  <span className="font-mono">0.00</span>: a problem the model already aces — or is
                  hopeless on — teaches it nothing. Learning lives where the group disagrees.
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <Note kicker="References">
          <RefItem n={REF.r1}>
            DeepSeek-AI 2025, <em>DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via
            Reinforcement Learning</em>.
          </RefItem>
          <RefItem n={REF.grpo}>
            Shao et al. 2024, <em>DeepSeekMath</em> (GRPO).
          </RefItem>
        </Note>

        {/* Step 2 — the scrubber */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            2. Scrub through R1-Zero&apos;s training
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              AIME 2024 · pass@1 · DeepSeek-AI 2025
            </span>
          </h2>

          <div className="flex flex-col gap-4 rounded-lg border-l-4 border-compute bg-surface p-4">
            <p className="text-ink">
              Nothing in the setup mentions reflection. Watch what the reward alone buys — and
              notice that accuracy and <em>thinking length</em> climb together: the model is
              learning to <strong>allocate itself more thinking time</strong>.
            </p>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="flex flex-col gap-4">
                <Slider
                  label="RL training step"
                  min={0}
                  max={MAX_STEP}
                  step={500}
                  value={step}
                  onChange={(v) => {
                    setStep(v);
                    recordInteraction(PAGE_N);
                  }}
                />
                <div>
                  <p className="font-mono text-5xl font-bold tabular-nums text-correct">
                    {pass.toFixed(1)}%
                  </p>
                  <p className="text-xs text-ink-muted">AIME 2024 pass@1</p>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="h-4 w-full rounded bg-surface-raised">
                    <div
                      className="h-4 rounded bg-compute"
                      style={{ width: `${(length / 10000) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-ink-muted">
                    avg response ≈{" "}
                    <span className="font-mono text-ink">{length.toLocaleString()}</span> tokens
                  </p>
                </div>
                <p className="text-sm text-ink-muted">
                  From 15.6% to 71.0% pass@1 with no supervised examples. Add page 7&apos;s
                  majority vote across 64 samples and it reaches{" "}
                  <strong className="text-ink">{cons64}%</strong> — level with OpenAI-o1-0912.
                  <Cite n={REF.r1} />
                </p>
              </div>
              <LineChart
                title="R1-Zero AIME 2024 pass@1 across RL training"
                points={chartPoints}
                xLabel="training step"
                yLabel="pass@1 (%)"
                yDomain={[0, 90]}
                xDomain={[0, MAX_STEP]}
                markerX={step}
              />
            </div>

            {/* the scratchpad */}
            <div className="flex flex-col gap-2 rounded-lg border border-dashed border-grid bg-surface-raised p-3">
              <p className="text-xs uppercase tracking-wide text-ink-muted">
                the model&apos;s scratchpad · {STAGE_CHIP[stage]}
              </p>
              <p className="text-sm text-ink-muted">{TRACE_PROBLEM}</p>
              <ol className="flex flex-col gap-1.5">
                {TRACE_OPEN.map((line, i) => (
                  <li key={`o${i}`} className="text-sm text-ink">
                    {line}
                  </li>
                ))}
                {stage !== "early"
                  ? TRACE_MID.map((line, i) => (
                      <li key={`m${i}`} className="text-sm text-ink">
                        {line}
                      </li>
                    ))
                  : null}
                {stage === "aha"
                  ? TRACE_AHA.map((line, i) => (
                      <li
                        key={`a${i}`}
                        className={
                          i === 0
                            ? "rounded border-l-4 border-correct bg-correct/10 p-2 text-sm font-semibold text-ink"
                            : "text-sm text-ink"
                        }
                      >
                        {line}
                        {i === 0 ? (
                          <span className="ml-2 rounded bg-correct/25 px-1.5 py-0.5 text-xs font-semibold text-correct">
                            the aha moment
                          </span>
                        ) : null}
                      </li>
                    ))
                  : null}
              </ol>
              <p className="border-t border-dashed border-grid pt-2 text-sm text-ink-muted">
                {STAGE_NOTE[stage]}
              </p>
            </div>
            <p className="text-xs text-ink-muted">
              the &ldquo;Wait, wait. Wait.&rdquo; passage is verbatim from Table 3 of DeepSeek-AI
              2025, where R1-Zero produced it unprompted at &ldquo;an intermediate version&rdquo;
              of training; the earlier stages are that same trace abridged, and where the aha lands
              on the slider is an illustrative placement — the paper gives the behaviour, not a
              step number
            </p>
          </div>
        </section>

        <Note kicker="Try it">
          <p>Drag past step {AHA_STEP.toLocaleString()}.</p>
          <p>
            Watch the scratchpad interrupt itself — and the length bar keep growing after the
            accuracy curve starts to flatten.
          </p>
        </Note>

        {/* Step 3 — the give-away */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            3. Then it was given away
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              Table 5 · ~800K samples · MIT license
            </span>
          </h2>

          <div className="flex flex-col gap-4 rounded-lg border-l-4 border-grid bg-surface p-4">
            <p className="text-ink">
              The released <strong>R1</strong> adds a small &ldquo;cold start&rdquo; of curated
              long traces before the RL — same recipe, better manners:
            </p>
            <div className="grid gap-2 sm:grid-cols-4">
              {[
                { v: `${P.r1Aime}%`, l: "AIME 2024" },
                { v: `${P.r1Math}%`, l: "MATH-500" },
                { v: `${P.r1Gpqa}%`, l: "GPQA Diamond" },
                { v: `${P.r1CfElo}`, l: `Codeforces Elo · ${P.r1CfPct}rd pct` },
              ].map((s) => (
                <div key={s.l} className="rounded-lg border border-grid bg-surface-raised p-3">
                  <p className="font-mono text-2xl font-bold tabular-nums text-ink">{s.v}</p>
                  <p className="text-xs text-ink-muted">{s.l}</p>
                </div>
              ))}
            </div>

            <p className="text-ink">
              Then the give-away, twice over: the weights, and the reasoning itself. R1 wrote{" "}
              <strong>~{P.samplesK}K reasoning traces</strong>, and six small dense models (Qwen
              and Llama bases, 1.5B–70B) were fine-tuned on them.
              <Cite n={REF.r1} /> No RL, no reward — the small
              models simply <em>imitate the big one&apos;s thinking</em>. Pick a size and read the
              accuracy/cost trade:
            </p>

            <div className="flex flex-col gap-2" role="img" aria-label={barAria}>
              {[
                { label: `R1 (teacher, ${P.teacherParamsB}B MoE)`, value: P.r1Aime, cls: "bg-correct" },
                { label: "OpenAI o1-mini", value: P.o1miniAime, cls: "bg-grid" },
              ].map((b) => (
                <div key={b.label} className="flex items-center gap-2 text-sm">
                  <span className="w-44 shrink-0 text-ink-muted">{b.label}</span>
                  <div className="h-5 flex-1 rounded bg-surface-raised">
                    <div className={`h-5 rounded ${b.cls}`} style={{ width: `${b.value}%` }} />
                  </div>
                  <span className="w-14 shrink-0 text-right font-mono tabular-nums text-ink">
                    {b.value.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              {DISTILLS.map((d) => {
                const active = d.size === pickedSize;
                return (
                  <button
                    key={d.label}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setPickedSize(d.size);
                      recordInteraction(PAGE_N);
                    }}
                    className={`flex items-center gap-2 rounded text-left text-sm ${
                      active ? "ring-1 ring-compute" : ""
                    }`}
                  >
                    <span className={`w-44 shrink-0 ${active ? "text-ink" : "text-ink-muted"}`}>
                      {d.label}
                    </span>
                    <span className="h-5 flex-1 rounded bg-surface-raised">
                      <span
                        className={`block h-5 rounded bg-compute ${active ? "" : "opacity-40"}`}
                        style={{ width: `${aimeOf(d.size)}%` }}
                      />
                    </span>
                    <span className="w-14 shrink-0 text-right font-mono tabular-nums text-ink">
                      {aimeOf(d.size).toFixed(1)}%
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="rounded-lg border-l-4 border-compute bg-surface-raised p-3 text-sm text-ink">
              <p>
                <strong>R1-Distill-{picked.label}</strong>: AIME{" "}
                <span className="font-mono">{aimeOf(picked.size).toFixed(1)}%</span> · MATH-500{" "}
                <span className="font-mono">{P[picked.mathKey].toFixed(1)}%</span> · ~
                <span className="font-mono">{paramRatio}×</span> fewer parameters than the teacher.
              </p>
              <p className="mt-1 text-ink-muted">{picked.note}</p>
            </div>
            <p className="text-xs text-ink-muted">
              size ratios compare total parameters; the {P.teacherParamsB}B teacher is a
              mixture-of-experts that activates ~{P.teacherActiveB}B per token
            </p>
          </div>
        </section>

        <Note kicker="References">
          <RefItem n={REF.r1}>
            DeepSeek-AI 2025, Tables 4–5. Distilled weights released under the MIT license.
          </RefItem>
        </Note>
      </div>

      <div className="flex flex-wrap gap-2">
        <CitationBadge citation={distill.citation} />
        <CitationBadge citation={GRPO_CITATION} />
      </div>
      <p className="text-xs text-ink-muted">
        Every benchmark number above is transcribed from DeepSeek-AI 2025 (Tables 3–5, Fig. 2–3)
        and pinned in the test suite; the training curve&apos;s intermediate points are
        interpolated along the reported 15.6% → 71.0% climb.
      </p>

      <PageNav n={PAGE_N} />
    </article>
  );
}
