"use client";

/**
 * Page 18, "Can We Trust the Thoughts?" — the safety hinge of Act 3. Act 2
 * spent ten pages buying longer visible reasoning; this page asks what the
 * trace is evidence OF.
 *
 * It opens on our own measurement, not the literature. Page 9's run cut 1,580
 * real chains into 18,772 written steps, and in 1,062 of those chains (67.2%)
 * the arithmetic checker found nothing it could check at all. The chain figure
 * leads because it is the image and this page is about the trace as an object
 * of evidence; the step-level 94.2% follows as the measurement behind it, and
 * a test pins that order. Dropping the step share would invite "so a third of
 * chains are checkable", which overstates it badly: the reachable third
 * averages barely two checkable steps each.
 *
 * Starting there means Chen et al. arrive as the SHARPER problem (a step that
 * is absent) rather than as the page's premise. The distinction is
 * load-bearing and the copy states it: page 9 measured a limit of our
 * INSTRUMENT (arithmetic is checkable, algebra and method are not); this page
 * is about a limit of the TRACE (it can omit what moved the answer). A false
 * step and an absent influence are different claims and must not be blurred.
 *
 * Then three steps: (1) a faithfulness probe — plant a hint,
 * watch the answer move and the trace stay quiet, with admission rates pinned
 * to Chen et al. 2025 (Claude 3.7 Sonnet 25%, DeepSeek-R1 39%); (2)
 * monitorability — Baker et al. 2025's monitor reading the CoT catches ~95%
 * of reward hacks against ~60% from actions alone; (3) the trap — put
 * optimization pressure on the CoT itself and task reward keeps climbing
 * while monitor recall collapses (obfuscated reward hacking). The close is
 * the open-vs-hidden trace design tension and Korbak et al.'s "fragile
 * opportunity" recommendation.
 *
 * Step 1 closes on the measured half: two chains from page 11's specialist arm
 * whose boxed answer is not the value the chain just computed, with no hint
 * planted and nothing being concealed. They are the page's answer to its own
 * disclosure below, which is that everything else in step 1 is authored. They
 * are specimens and never rates; the only rates on this page stay Chen et al.'s.
 * Their provenance and the reason they landed here rather than on page 19 are in
 * docs/page_19_tool_use_probe.md §6.
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
/* The deck's first cross-page data import. Page 18's opening number is page
   9's measurement, so it reads from page 9's validated loader rather than
   restating a figure that could drift the next time that run is replaced. */
import { PAGE9, pct } from "@/lib/page09";
import { cotPressureRecall, cotPressureReward } from "@/lib/frontier";
import { bernoulli, createRng } from "@/lib/rng";
import { SPECIMENS, SPECIMEN_SOURCE, markExcerpt, type Specimen } from "@/lib/specimens";
import { tidyMath } from "@/lib/traceText";
import { useStore } from "@/store/useStore";

const PAGE_N = 18;
const P = FAITHFULNESS_PROBE;
const P9 = PAGE9;

/** Page 18's references, numbered in order of first appearance. */
const REF = { chen: 1, turpin: 2, baker: 3, korbak: 4 } as const;
const MAX_RUNS = 400;
const PRESSURES = Array.from({ length: 21 }, (_, i) => i / 2);

/** A margin note that sits beside its step and scrolls with the page. */
function Note({ kicker, children }: { kicker: string; children: React.ReactNode }) {
  return (
    <aside className="flex flex-col gap-2 text-sm text-ink-muted lg:pt-9">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{kicker}</p>
      {children}
    </aside>
  );
}

/**
 * One measured chain whose answer is not the value it just computed.
 *
 * The marked span is the chain's own arithmetic, so the card can put it beside
 * the answer and let the reader do the comparison. Nothing is paraphrased:
 * `specimens.ts` refuses to load a span that is not verbatim in the trace, and
 * `specimens.test.ts` matches the trace against the published bundle.
 */
function ContradictionCard({ specimen }: { specimen: Specimen }) {
  const runs = markExcerpt(specimen, tidyMath);

  return (
    <figure
      aria-label={`A measured chain whose answer contradicts its own working, ${specimen.problemId}`}
      className="m-0 flex flex-col gap-2 rounded-lg border border-grid bg-canvas p-3"
    >
      <figcaption className="font-mono text-xs text-ink-muted">
        MATH-500 {specimen.subject.toLowerCase()}, level {specimen.level}
      </figcaption>

      <p className="whitespace-pre-wrap border-l-2 border-grid pl-3 text-sm leading-relaxed text-ink">
        <span className="text-ink-muted">… </span>
        {runs.map((run, i) =>
          run.mark ? (
            <mark key={i} className="rounded bg-compute/20 px-1 font-semibold text-ink" >
              {run.text}
            </mark>
          ) : (
            <span key={i}>{run.text}</span>
          ),
        )}
      </p>

      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 text-sm">
        <span className="text-wrong">
          it answered <span className="font-mono">{tidyMath(specimen.answer ?? "")}</span>
        </span>
        <span className="text-correct">
          the answer is <span className="font-mono">{tidyMath(specimen.groundTruth)}</span>
        </span>
      </div>
    </figure>
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
  const [showWhy, setShowWhy] = useState(false);

  // Step 2 — what the monitor is allowed to read.
  const [readsThoughts, setReadsThoughts] = useState(false);

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

      {/* The measured lead-in, and the reason this page is not a literature
          page. Everything below it is other people's numbers; this is ours,
          and it sets the floor the borrowed numbers then push past. */}
      <section className="flex max-w-2xl flex-col gap-2 rounded-lg border-l-4 border-correct bg-surface p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          before the literature, our own run
        </p>
        <p className="text-ink">
          Page 9 cut {P9.run.chains.toLocaleString()} real chains from{" "}
          {P9.run.model.split("/").pop()} into{" "}
          {P9.graders.stepsTotal.toLocaleString()} written steps and tried to check them one by one.
          In{" "}
          <strong className="font-mono text-wrong">
            {P9.detection.nChainsUnreadable.toLocaleString()} of those chains,{" "}
            {pct(P9.detection.shareChainsUnreadable, 1)}
          </strong>
          , it found nothing it could check at all. Not one step. That is not the checker failing:
          the median chain of visible reasoning is plans (&ldquo;use the Euclidean
          algorithm&rdquo;), transitions, and symbolic algebra, and the checker refuses those on
          sight so that every label it does hand back is a fact you can redo by hand. Step by step
          across the whole pile, <strong className="font-mono">{pct(P9.graders.shareUnjudged, 1)}</strong>{" "}
          came back <em>unknown</em>.
        </p>
        <p className="text-sm text-ink-muted">
          Keep the two limits apart, because the rest of this page depends on it. That{" "}
          {pct(P9.graders.shareUnjudged, 1)} is a limit of{" "}
          <strong className="text-ink">our instrument</strong>: arithmetic is checkable, algebra and
          method are not, and a broader grader would shrink it. What follows is a limit of the{" "}
          <strong className="text-ink">trace itself</strong>, and no grader shrinks it. Page 9 asked
          whether a step is <em>wrong</em>. This page asks whether the steps are the{" "}
          <em>reason</em>.
        </p>
      </section>

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
              No checker can run this one, because there is no false step to catch. The experiment
              instead: ask a question clean, then ask again with a <strong>hint</strong> slipped
              into the prompt, here an answer tag the model was never meant to see.
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
                <div className="mt-1 flex flex-col gap-2">
                  <p>
                    <strong className="text-wrong">Unfaithful:</strong> not a word about the tag,
                    and the story it tells instead sounds like expertise. Reading the trace alone,
                    this passes for honest reasoning.
                  </p>
                  {/* The page's sharpest point, and it lands only if the reader
                      reaches for it first. Told as prose it is a sentence in a
                      box; asked as a question it is the reader noticing that
                      the verdict above needed evidence the monitor never had. */}
                  {showWhy ? (
                    <p className="rounded border-l-4 border-compute bg-compute/10 p-2">
                      Only by comparing it with the clean run. Same question, no tag, and the model
                      answered {P.correct}. The word <em>unfaithful</em> is a claim about two runs,
                      and this panel has both.{" "}
                      <strong>
                        A monitor in production has one. So do you, every time you read a chain of
                        thought and find it convincing.
                      </strong>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setShowWhy(true);
                        recordInteraction(PAGE_N);
                      }}
                      className="self-start rounded border border-grid bg-surface-raised px-3 py-1.5 text-sm text-ink"
                    >
                      Then how do we know it is unfaithful? ▸
                    </button>
                  )}
                </div>
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

          {/* The measured half of step 1. The probe above is authored and says so;
              these two chains are not, and they cost nothing to show because page
              11's run already published them. */}
          <div className="flex flex-col gap-3 rounded-lg border-l-4 border-compute bg-surface p-4">
            <p className="text-sm font-semibold text-ink">The probe above is authored. This is not.</p>
            <p className="text-sm text-ink">
              Planting a hint is the clean way to ask the question, and answering it needs a control
              run. Here is the untidy version, out of this deck&apos;s own measurements: two chains
              from page 11&apos;s run in which the model computes a value and then hands back a
              different one. No hint, no pressure, nothing planted. The reasoning and the answer
              simply came apart.
            </p>

            {[SPECIMENS.contradictsChainSum, SPECIMENS.contradictsChainGeometry].map((s) => (
              <ContradictionCard key={s.role} specimen={s} />
            ))}

            <p className="text-sm text-ink">
              Neither chain is concealing a motive, and that is the part to carry into the next
              step. Unfaithfulness does not require one. If a trace can disagree with its own answer
              for free, then reading the trace tells you what the model wrote, which is not the same
              as what the model did.
            </p>
            <p className="text-xs text-ink-muted">
              Two chains of the 2,550 {SPECIMEN_SOURCE.modelLabel} wrote in page 11&apos;s run,
              copied unedited and chosen for what they show. Specimens of a failure mode, not a
              measurement of how often it happens: this page&apos;s only rates are Chen et
              al.&apos;s.
            </p>
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
            <Toggle
              label="What the monitor may read"
              checked={readsThoughts}
              offLabel="actions & outputs"
              onLabel="and the thoughts"
              onChange={(v) => {
                setReadsThoughts(v);
                recordInteraction(PAGE_N);
              }}
            />
            <div
              className="flex flex-col gap-2"
              role="img"
              aria-label={`Share of systemic reward hacks caught: a monitor reading only the agent's actions and outputs catches ${actionRecall} percent; a monitor also reading the chain of thought catches ${cotRecall} percent. The monitor currently reads ${readsThoughts ? "the thoughts as well" : "actions and outputs only"}.`}
            >
              {[
                { key: "actions", label: "reads actions & outputs only", value: actionRecall },
                { key: "thoughts", label: "reads the thoughts as well", value: cotRecall },
              ].map((b) => {
                const live = readsThoughts === (b.key === "thoughts");
                return (
                  <div key={b.key} className="flex items-center gap-2 text-sm">
                    <span className={`w-56 shrink-0 ${live ? "text-ink" : "text-ink-muted"}`}>
                      {b.label}
                    </span>
                    <div className="h-5 flex-1 rounded bg-surface-raised">
                      <div
                        className={`h-5 rounded ${live ? "bg-correct" : "bg-grid"}`}
                        style={{ width: `${b.value}%` }}
                      />
                    </div>
                    <span className="w-12 shrink-0 text-right font-mono tabular-nums text-ink">
                      {b.value}%
                    </span>
                  </div>
                );
              })}
            </div>
            <p role="status" className="text-sm text-ink">
              Of 100 <strong>systemic reward hacks</strong>, this monitor catches{" "}
              <strong className="font-mono">{readsThoughts ? cotRecall : actionRecall}</strong> and
              misses{" "}
              <strong className="font-mono text-wrong">
                {100 - (readsThoughts ? cotRecall : actionRecall)}
              </strong>
              . {readsThoughts
                ? "The extra catches are the ones the agent announced in its thoughts and then hid in its code."
                : "Turn the thoughts on and watch where the misses go."}
            </p>
            <p className="text-sm text-ink-muted">
              That gap is <strong className="text-ink">monitorability</strong>: the trace does not
              have to be perfectly faithful to be a working alarm, it only has to keep verbalizing
              intent. Note the scope. These are the <em>systemic</em> reward hacks in Baker et
              al.&apos;s setting, not misbehavior in general, and a monitor that catches{" "}
              {cotRecall}% of one category is not a monitor that catches {cotRecall}% of everything.
              Even so, an alarm this good is the &ldquo;new and fragile opportunity&rdquo; a joint
              position paper from OpenAI, Google DeepMind, and Anthropic urges the field to
              preserve.
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

      {/* Handoff to 19 */}
      <div className="max-w-2xl rounded-lg border-l-4 border-compute bg-surface p-4 text-ink">
        Every page since 5 has assumed the thinking is written down, which is what made all of this
        arguable in the first place: a chain you can read is a chain you can check, price and
        police.{" "}
        <em className="text-ink-muted">
          The frontier is busy removing that assumption. Next: what is left to read when the
          thinking stops being words.
        </em>
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
