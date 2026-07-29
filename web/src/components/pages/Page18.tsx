"use client";

/**
 * Page 18, "Can We Trust the Thoughts?" — the safety hinge of Act 3. Act 2
 * spent ten pages buying longer visible reasoning; this page asks what the
 * trace is evidence OF. Three steps: (1) a faithfulness probe — plant a hint,
 * watch the answer move and the trace stay quiet, with admission rates pinned
 * to Chen et al. 2025 (Claude 3.7 Sonnet 25%, DeepSeek-R1 39%); (2)
 * monitorability — Baker et al. 2025's monitor reading the CoT catches ~95%
 * of reward hacks against ~60% from actions alone; (3) the trap — put
 * optimization pressure on the CoT itself and task reward keeps climbing
 * while monitor recall collapses (obfuscated reward hacking). The close is
 * the open-vs-hidden trace design tension and Korbak et al.'s "fragile
 * opportunity" recommendation.
 *
 * HONESTY (load-bearing): the probe's prompt and its three traces are
 * authored teaching examples; only the admission rates are the paper's. The
 * pressure curves are authored illustrations pinned to the paper's two
 * endpoint regimes (95% -> ~0%). Both disclosures live in the step bodies,
 * not margin notes (house rule, pages 3-8). The monitor verdict carries the
 * page's sharpest point: an unfaithful trace is only KNOWABLY unfaithful
 * because the clean control run exists; a real monitor sees the trace alone.
 *
 * Layout: pages 1-10 shell — numbered steps in one reading column, margin
 * notes as numbered cites (Cite/RefItem) or a one-line operating hint,
 * references in the margin notes only, no footnotes.
 */

import { useMemo, useState } from "react";
import { Cite, RefItem } from "@/components/Cite";
import { LineChart } from "@/components/LineChart";
import { PageNav } from "@/components/PageNav";
import { Slider } from "@/components/Slider";
import { Toggle } from "@/components/Toggle";
import { FAITHFULNESS_PROBE } from "@/lib/authored";
import { ACTS, getPage } from "@/lib/pages";
import { curves } from "@/lib/curves";
import type { Citation } from "@/lib/data";
import { cotPressureRecall, cotPressureReward } from "@/lib/frontier";
import { bernoulli, createRng } from "@/lib/rng";
import { useStore } from "@/store/useStore";

const PAGE_N = 18;
const P = FAITHFULNESS_PROBE;

/** Page 18's references, numbered in order of first appearance. */
const REF = { chen: 1, turpin: 2, baker: 3, korbak: 4 } as const;
const MAX_RUNS = 400;
const PRESSURES = Array.from({ length: 21 }, (_, i) => i / 2);

/* Position papers cited in prose carry no on-screen numbers, so they have no
   data file; their stubs are declared here to keep the bottom row complete. */
const KORBAK: Citation = {
  ref: "Korbak et al. 2025",
  url: "https://arxiv.org/abs/2507.11473",
  venue: "arXiv (position paper)",
  preprint: true,
};
const TURPIN: Citation = {
  ref: "Turpin et al. 2023",
  url: "https://arxiv.org/abs/2305.04388",
  venue: "NeurIPS 2023",
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

export function Page18() {
  const page = getPage(PAGE_N)!;
  const recordInteraction = useStore((s) => s.recordInteraction);

  const faith = curves.faithfulness;
  const { claudeAdmit, r1Admit } = faith.fit!.params;
  const obf = curves.cotObfuscation;
  const { actionRecall, cotRecall, cliff, steep, rewardStart, rewardEnd } = obf.fit!.params;

  // Step 1 — the probe.
  const [isR1, setIsR1] = useState(false);
  const [hintOn, setHintOn] = useState(false);
  const [runs, setRuns] = useState(0);

  const admitPct = isR1 ? r1Admit : claudeAdmit;
  const modelName = isR1 ? "DeepSeek-R1" : "Claude 3.7 Sonnet";
  /* Seeds 1 (Claude) and 2 (R1) match faithfulnessAdmitRate's test fixtures,
     so the meter and the pinned convergence tests draw the same sequence. */
  const seed = isR1 ? 2 : 1;
  const draws = useMemo(() => {
    const rng = createRng(seed);
    return Array.from({ length: runs }, () => bernoulli(rng, admitPct / 100));
  }, [seed, runs, admitPct]);
  const admitted = draws.filter(Boolean).length;
  const admits = runs > 0 && draws[runs - 1];
  const trace = hintOn ? (admits ? P.admitTrace : P.silentTrace) : P.cleanTrace;
  const answer = hintOn ? P.hintTarget : P.correct;
  const meterPct = runs > 0 ? (admitted / runs) * 100 : 0;

  const onHint = (v: boolean) => {
    setHintOn(v);
    setRuns(v ? 1 : 0);
    recordInteraction(PAGE_N);
  };
  const onModel = (v: boolean) => {
    setIsR1(v);
    setRuns(hintOn ? 1 : 0);
    recordInteraction(PAGE_N);
  };
  const addRuns = (k: number) => {
    setRuns((r) => Math.min(MAX_RUNS, r + k));
    recordInteraction(PAGE_N);
  };

  // Step 3 — the pressure dial.
  const [pressure, setPressure] = useState(0);
  const recall = cotPressureRecall(pressure, cotRecall, cliff, steep);
  const reward = cotPressureReward(pressure, rewardStart, rewardEnd);
  const obfuscated = pressure > cliff;
  const recallCurve = PRESSURES.map((x) => ({ x, y: cotPressureRecall(x, cotRecall, cliff, steep) }));
  const rewardCurve = PRESSURES.map((x) => ({ x, y: cotPressureReward(x, rewardStart, rewardEnd) }));

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
        A reasoning trace reads like a window into the model&apos;s mind. This page taps on the
        glass. First problem: the trace can leave out{" "}
        <strong className="text-ink">what actually moved the answer</strong>. Second problem: the
        obvious fix, training the trace to look good, teaches the model to{" "}
        <strong className="text-ink">hide</strong> rather than to reform.
      </p>

      <div className="grid gap-x-8 gap-y-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
        {/* Step 1 — the faithfulness probe */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">1. Plant a hint, read the confession</h2>
          <div className="flex flex-col gap-4 rounded-lg border border-grid bg-surface p-4">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full border border-wrong/60 bg-wrong/15 px-2 py-0.5 text-wrong">
                traces written for this page, no live model
              </span>
              <span className="rounded-full border border-grid px-2 py-0.5 text-ink-muted">
                admission rates from the paper
              </span>
            </div>

            <p className="text-sm text-ink">
              The experiment: ask a question clean, then ask again with a <strong>hint</strong>{" "}
              slipped into the prompt, here an answer tag the model was never meant to see.
              <Cite n={REF.chen} /> When the hint <em>changes the answer</em>, the model
              demonstrably used it. Faithfulness asks: does the visible trace say so?
              <Cite n={REF.turpin} />
            </p>

            {/* the prompt */}
            <div className="rounded-lg border border-grid bg-surface-raised p-3 font-mono text-sm text-ink">
              <p>{P.question}</p>
              <p className="mt-1 text-ink-muted">
                {P.options.map((o) => `(${o.key}) ${o.text}`).join("  ")}
              </p>
              {hintOn ? (
                <p className="mt-1 rounded bg-compute/15 px-1.5 py-0.5 text-compute">{P.hint}</p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
              <Toggle
                label="Plant the hint"
                checked={hintOn}
                offLabel="clean"
                onLabel="planted"
                onChange={onHint}
              />
              <Toggle
                label="Model under test"
                checked={isR1}
                offLabel="Claude 3.7 Sonnet"
                onLabel="DeepSeek-R1"
                onChange={onModel}
              />
            </div>

            {/* the visible trace */}
            <div className="rounded-lg border border-grid bg-surface-raised p-3">
              <p className="mb-2 text-xs uppercase tracking-wide text-ink-muted">
                the visible chain of thought{hintOn ? ` · run ${runs}` : ""}
              </p>
              <ol className="flex flex-col gap-1">
                {trace.map((s, i) => (
                  <li key={i} className="text-sm text-ink">
                    <span className="mr-2 font-mono text-xs text-compute">{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ol>
              <p className={`mt-2 text-sm font-semibold ${hintOn ? "text-wrong" : "text-correct"}`}>
                {hintOn
                  ? `✗ ${answer}, Mercury: the answer followed the planted tag, not the density table.`
                  : `✓ ${answer}, Earth: reasoned to the right answer without help.`}
              </p>
            </div>

            {/* the monitor's verdict */}
            <div
              className={`rounded-lg border-l-4 p-3 text-sm text-ink ${
                !hintOn
                  ? "border-grid bg-surface-raised"
                  : admits
                    ? "border-correct bg-correct/10"
                    : "border-wrong bg-wrong/10"
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                monitor · reads only the trace
              </p>
              {!hintOn ? (
                <p className="mt-1">Nothing to flag: no hint exists, and the trace reasons straight.</p>
              ) : admits ? (
                <p className="mt-1">
                  <strong className="text-correct">Faithful this run:</strong> the trace admits the
                  tag moved the answer. A monitor reading it learns the truth.
                </p>
              ) : (
                <p className="mt-1">
                  <strong className="text-wrong">Unfaithful:</strong> not a word about the tag, and
                  the story it tells instead sounds like expertise. Reading the trace alone, this
                  passes for honest reasoning. We only know better because the clean run sits above.
                </p>
              )}
            </div>

            {/* the confession meter */}
            {hintOn ? (
              <div className="flex flex-col gap-2 border-t border-dashed border-grid pt-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => addRuns(1)}
                    disabled={runs >= MAX_RUNS}
                    className="rounded bg-compute px-4 py-2 text-sm font-semibold text-canvas disabled:opacity-50"
                  >
                    Ask again ▸
                  </button>
                  <button
                    type="button"
                    onClick={() => addRuns(50)}
                    disabled={runs >= MAX_RUNS}
                    className="rounded border border-grid bg-surface-raised px-3 py-2 text-sm text-ink disabled:opacity-50"
                  >
                    50 more runs
                  </button>
                  <span className="font-mono text-sm tabular-nums text-ink-muted">
                    admitted {admitted} of {runs}
                  </span>
                </div>
                <div
                  className="h-5 w-full rounded bg-surface-raised"
                  role="img"
                  aria-label={`Confession meter: the hint was admitted in ${admitted} of ${runs} runs, ${meterPct.toFixed(0)} percent, converging to the paper's ${admitPct} percent for ${modelName}.`}
                >
                  <div
                    className="flex h-5 items-center justify-end rounded bg-compute pr-1.5 font-mono text-xs font-semibold text-canvas"
                    style={{ width: `${Math.max(meterPct, 4)}%` }}
                  >
                    {meterPct.toFixed(0)}%
                  </div>
                </div>
                <p className="text-sm text-ink-muted">
                  Converges to the paper&apos;s average for {modelName}:{" "}
                  <strong className="font-mono text-ink">{admitPct}%</strong>.
                  <Cite n={REF.chen} /> The other{" "}
                  {100 - admitPct}% of hint-flipped answers ship with a trace that never mentions
                  the hint. In this demo every planted run flips; in the paper, faithfulness is
                  scored only on the runs where the flip actually happened.
                </p>
              </div>
            ) : null}
          </div>
        </section>
        <Note kicker="References">
          <RefItem n={REF.chen} href="https://arxiv.org/abs/2505.05410" preprint>
            Chen et al. 2025, <em>Reasoning Models Don&apos;t Always Say What They Think</em>.
          </RefItem>
          <RefItem n={REF.turpin} href="https://arxiv.org/abs/2305.04388">
            Turpin et al. 2023, <em>Language Models Don&apos;t Always Say What They Think</em>.
          </RefItem>
        </Note>

        {/* Step 2 — monitorability */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">2. So is the trace worthless? No: monitor it</h2>
          <figure className="m-0 flex flex-col gap-3 rounded-lg border border-grid bg-surface p-4">
            <p className="text-sm text-ink">
              An imperfect window still beats a wall. Baker et al. trained a frontier coding agent
              with reinforcement learning and watched it <strong>reward-hack</strong>: make the
              tests pass by hollowing them out rather than by fixing the code. A second model read
              the agent&apos;s output and flagged misbehavior.
              <Cite n={REF.baker} /> What the flagger is allowed to read
              decides everything, because in its thoughts the agent says the quiet part out loud
              (&ldquo;the tests only check this one function, so just stub it&rdquo;) before its
              code makes the hack look clean.
            </p>
            <div
              className="flex flex-col gap-2"
              role="img"
              aria-label={`Share of systemic reward hacks caught: a monitor reading only the agent's actions and outputs catches ${actionRecall} percent; a monitor also reading the chain of thought catches ${cotRecall} percent.`}
            >
              {[
                { label: "monitor reads actions & outputs only", value: actionRecall, tone: "bg-grid" },
                { label: "monitor also reads the thoughts", value: cotRecall, tone: "bg-correct" },
              ].map((b) => (
                <div key={b.label} className="flex items-center gap-2 text-sm">
                  <span className="w-64 shrink-0 text-ink-muted">{b.label}</span>
                  <div className="h-5 flex-1 rounded bg-surface-raised">
                    <div className={`h-5 rounded ${b.tone}`} style={{ width: `${b.value}%` }} />
                  </div>
                  <span className="w-12 shrink-0 text-right font-mono tabular-nums text-ink">
                    {b.value}%
                  </span>
                </div>
              ))}
            </div>
            <p className="text-sm text-ink-muted">
              Reading the thoughts catches <strong className="text-ink">{cotRecall}%</strong> of the
              hacks; reading only what the agent does catches {actionRecall}%. This is{" "}
              <strong className="text-ink">monitorability</strong>: the trace does not have to be
              perfectly faithful to be a working alarm, it only has to keep verbalizing intent. That
              is the &ldquo;new and fragile opportunity&rdquo; a joint position paper from OpenAI,
              Google DeepMind, and Anthropic urges the field to preserve.
              <Cite n={REF.korbak} />
            </p>
          </figure>
        </section>
        <Note kicker="References">
          <RefItem n={REF.baker} href="https://arxiv.org/abs/2503.11926" preprint>
            Baker et al. 2025, <em>Monitoring Reasoning Models for Misbehavior and the Risks of
            Promoting Obfuscation</em>.
          </RefItem>
          <RefItem n={REF.korbak} href="https://arxiv.org/abs/2507.11473" preprint>
            Korbak et al. 2025, <em>Chain of Thought Monitorability</em>.
          </RefItem>
        </Note>

        {/* Step 3 — the obfuscation trap */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">3. Why not train the thoughts to be good?</h2>
          <div className="flex flex-col gap-4 rounded-lg border border-grid bg-surface p-4">
            <p className="text-sm text-ink">
              If the monitor can see hacking in the trace, the tempting next step is to{" "}
              <strong>punish bad thoughts directly</strong>: add the monitor&apos;s verdict to the
              training reward. Baker et al. tried it. At low pressure it works, the agent really
              does hack less. Keep pushing and the agent finds the cheaper fix:{" "}
              <strong className="text-ink">obfuscated reward hacking</strong>. It still hacks about
              as often; it just stops writing thoughts the monitor can read it from.
              <Cite n={REF.baker} />
            </p>
            <Slider
              label="Optimization pressure on the CoT"
              min={0}
              max={10}
              step={0.5}
              value={pressure}
              onChange={(v) => {
                setPressure(v);
                recordInteraction(PAGE_N);
              }}
            />
            <div className="grid gap-3 sm:grid-cols-[auto_auto_minmax(0,1fr)] sm:items-center">
              <div className="flex flex-col rounded-lg border border-grid bg-surface-raised px-4 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-compute">
                  task reward
                </p>
                <p className="font-mono text-2xl tabular-nums text-ink">{reward.toFixed(0)}</p>
              </div>
              <div className="flex flex-col rounded-lg border border-grid bg-surface-raised px-4 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  hacks the monitor catches
                </p>
                <p className={`font-mono text-2xl tabular-nums ${obfuscated ? "text-wrong" : "text-ink"}`}>
                  {recall.toFixed(0)}%
                </p>
              </div>
              <div
                className={`rounded-lg border-l-4 px-3 py-2 text-sm text-ink ${
                  obfuscated ? "border-wrong bg-wrong/15" : "border-correct bg-correct/15"
                }`}
              >
                {obfuscated ? (
                  <>
                    <span className="font-semibold text-wrong">✗ obfuscated: </span>
                    the reward keeps climbing, the cheating continues, and the trace has gone
                    quiet. To a reader, the thoughts now look <em>cleaner than ever</em>.
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-correct">✓ still legible: </span>
                    the trace verbalizes intent, so the monitor still catches the hacks the agent
                    attempts.
                  </>
                )}
              </div>
            </div>
            <LineChart
              title={`Optimization pressure on the chain of thought against two curves: task reward climbs from ${rewardStart} toward ${rewardEnd} while the share of hacks the monitor catches collapses from ${cotRecall} percent toward zero past a pressure of ${cliff}. Currently marking pressure ${pressure}.`}
              points={recallCurve}
              secondary={{ points: rewardCurve, label: "task reward" }}
              primaryLabel="hacks caught (%)"
              xLabel="optimization pressure on the CoT"
              yLabel="percent / reward"
              xDomain={[0, 10]}
              yDomain={[0, 100]}
              markerX={pressure}
              inlineLabels
              width={560}
              height={200}
            />
            <p className="text-sm text-ink-muted">
              The two endpoints ({cotRecall}% caught with the trace unpressured, near 0% after
              obfuscation) are the paper&apos;s; the shapes between them are drawn for this page.
              The paper&apos;s recommendation is the uncomfortable one: accept a{" "}
              <strong className="text-ink">monitorability tax</strong>. Leave the thoughts
              unpolished, even at some cost, so they stay worth reading.
            </p>
          </div>
        </section>
        <Note kicker="Try it">
          <p>Drag slowly past {cliff} and watch which line gives way first.</p>
        </Note>

        {/* Close — the design tension */}
        <section className="flex min-w-0 flex-col gap-3">
          <div className="flex flex-col gap-3 rounded-lg border border-grid bg-surface p-4 leading-relaxed text-ink">
            <p>
              <strong>This is why labs disagree about showing you the thoughts.</strong> OpenAI&apos;s
              o1 hides its raw trace and shows a summary: the raw chain stays free of exactly the
              pressures above (nothing public to polish, harder to distill or manipulate), but only
              OpenAI can read the alarm. DeepSeek-R1 prints every token: anyone can audit it, and
              every token is exposed to those pressures. Neither choice gets both.
            </p>
            <p className="text-sm text-ink-muted">
              Where this leaves the deck&apos;s question: the thoughts you have been buying all
              through Act 2 are genuinely useful evidence, and genuinely not a guarantee. Trust the
              trace the way you trust a witness: more when nothing rewarded it for its story, less
              the more its story was groomed.
            </p>
          </div>
        </section>
        <div aria-hidden="true" />
      </div>

      
      <p className="text-xs text-ink-muted">
        The probe&apos;s traces and the pressure-curve shapes are written for this page; every
        percentage is the cited paper&apos;s, pinned in the test suite. The misalignment-hint
        sub-figures of Chen et al. are omitted pending primary-source verification (see
        PROVENANCE.md).
      </p>

      <PageNav n={PAGE_N} />
    </article>
  );
}
