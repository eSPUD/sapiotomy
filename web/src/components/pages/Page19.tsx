"use client";

/**
 * Page 19, "The Frontier: Latent Reasoning, Adaptive Compute, and Agents".
 * The close of the story, and the page that has to pay page 2's debt.
 *
 * Step 1 shows thinking without words (Coconut, data/coconut.json, verbatim
 * table numbers) and the monitorability price of silence. Step 2 is the
 * capstone: lib/reasoner.ts composes every technique in the app into one panel
 * with accuracy, cost, latency and monitorability readouts, and no lever in it
 * is free. The close puts page 2's own question back in front of the reader
 * and answers it in halves.
 *
 * Two sections were cut here and the reasons are worth keeping. A "budgets
 * that flex" step re-taught page 11's difficulty-aware allocation and page 6's
 * budget forcing, reprinting both of their numbers, and opened by asserting
 * that "Act 2 spent the same budget on every question", which is the opposite
 * of what page 11 does. The adaptive idea now lives where the reader can
 * operate it, as a lever in the capstone with a cost. A "thinking that acts"
 * step was two prose paragraphs; it moved into the close, where the tool-use
 * beat stops being a survey item and becomes the answer to the half of page
 * 2's failure that no amount of thinking can reach.
 *
 * The close is the loop, so do not let it drift back into a summary: it names
 * page 2's question, splits the verdict, and answers page 1's stake in page
 * 1's own words.
 *
 * The tool-use beat carries the deck's one measured object outside Act 2:
 * `FabricatedToolCard`, a chain from page 11's specialist arm that says it will
 * use "computational tools", has none, and supplies their output from its own
 * weights. It is a specimen and never a rate, which the card says on itself.
 * The failure is ours and the repair is cited, and that asymmetry is deliberate:
 * a GPU probe that would have shown the repair was scoped and rejected, because
 * a Python interpreter on MATH-500 demonstrates computation while the half of
 * page 2 this close cannot settle needs retrieval. Reasons in full, so the
 * question is not reopened by accident: docs/page_19_tool_use_probe.md §3.
 *
 * The beat's copy scopes the claim to what the deck can support. It is not a
 * calculator story: page 9 measured that and found a provable false arithmetic
 * step in 0.67% of the chains that reached the right answer. What an interpreter
 * buys is exhaustion in place of guessing, and it is the first selector in the
 * story that is not the model asking itself again.
 */

import { useState } from "react";
import { Cite, RefItem } from "@/components/Cite";
import { PageNav } from "@/components/PageNav";
import { Slider } from "@/components/Slider";
import { Toggle } from "@/components/Toggle";
import { ACTS, getPage } from "@/lib/pages";
import { curves } from "@/lib/curves";
import { SPECIMENS, SPECIMEN_SOURCE, markExcerpt } from "@/lib/specimens";
import { tidyMath } from "@/lib/traceText";
import {
  FAMILY_LABELS,
  PRESETS,
  reasonerOutcome,
  type FamilyKey,
  type Medium,
  type ReasonerConfig,
  type Selection,
} from "@/lib/reasoner";
import { useStore } from "@/store/useStore";

const PAGE_N = 19;

/** Page 19's references, numbered in order of first appearance. */
const REF = { coconut: 1, codi: 2, pause: 3, snell: 4, react: 5, ioi: 6 } as const;

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
 * The close's one measured object: a chain that asks for a tool it has not got.
 *
 * Everything drawn here is copied from `trace-specimens.json`, which `specimens.ts`
 * will not load unless the shown span is a verbatim substring of the trace and
 * `specimens.test.ts` has matched that trace against the published bundle. The
 * card states its own sample size, because one chain is a specimen and the page
 * must not be read as measuring a rate.
 */
function FabricatedToolCard() {
  const s = SPECIMENS.fabricatedTool;
  const runs = markExcerpt(s, tidyMath);

  return (
    <figure
      aria-label="A measured chain reaching for a tool it does not have"
      className="flex flex-col gap-3 rounded-lg border border-wrong/60 bg-canvas p-4"
    >
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          one measured chain, {SPECIMEN_SOURCE.modelLabel}
        </span>
        <span className="font-mono text-xs text-ink-muted">
          MATH-500 {s.subject.toLowerCase()}, level {s.level}
        </span>
      </figcaption>

      <p className="text-sm text-ink-muted">{tidyMath(s.question)}</p>

      <p className="whitespace-pre-wrap border-l-2 border-grid pl-3 text-sm leading-relaxed text-ink">
        <span className="text-ink-muted">… </span>
        {runs.map((run, i) =>
          run.mark ? (
            <mark key={i} className="rounded bg-wrong/20 px-1 font-semibold text-wrong">
              {run.text}
            </mark>
          ) : (
            <span key={i}>{run.text}</span>
          ),
        )}
      </p>

      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 text-sm">
        <span className="text-wrong">
          it answered <span className="font-mono">{tidyMath(s.answer ?? "")}</span>
        </span>
        <span className="text-correct">
          the answer is <span className="font-mono">{tidyMath(s.groundTruth)}</span>
        </span>
      </div>

      <p className="text-xs text-ink-muted">
        One chain of the 2,550 this model wrote in page 11&apos;s run, chosen for what it shows and
        not for what it averages. Greedy, no tools available to it. The whole trace is{" "}
        <span className="font-mono">{s.problemId}</span> in that page&apos;s download.
      </p>
    </figure>
  );
}

/** One accuracy bar: fixed identity hues, the values carry the verdict. */
function Bar({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-44 shrink-0 text-ink-muted">{label}</span>
      <div className="h-5 flex-1 rounded bg-surface-raised">
        <div className={`h-5 rounded ${tone}`} style={{ width: `${value}%` }} />
      </div>
      <span className="w-14 shrink-0 text-right font-mono tabular-nums text-ink">
        {value.toFixed(1)}%
      </span>
    </div>
  );
}

/** One readout tile of the build-a-reasoner panel. */
function Stat({
  label,
  sub,
  value,
  tone,
  aria,
}: {
  label: string;
  sub: string;
  value: string;
  tone: string;
  aria: string;
}) {
  return (
    <div className="rounded-lg border border-grid bg-surface-raised p-3" role="status" aria-label={aria}>
      <p className={`font-mono text-3xl font-bold tabular-nums ${tone}`}>{value}</p>
      <p className="text-xs text-ink">{label}</p>
      <p className="text-xs text-ink-muted">{sub}</p>
    </div>
  );
}

const fmtX = (v: number) => (v >= 100 ? `${Math.round(v)}×` : `${v.toFixed(1)}×`);

export function Page19() {
  const page = getPage(PAGE_N)!;
  const recordInteraction = useStore((s) => s.recordInteraction);

  const coco = curves.coconut;
  const cc = coco.fit!.params;
  const snell = curves.computeOptimal;

  const [cfg, setCfg] = useState<ReasonerConfig>(() => ({
    ...PRESETS.find((p) => p.key === "cot")!.config,
  }));
  const out = reasonerOutcome(cfg);

  const change = (patch: Partial<ReasonerConfig>) => {
    setCfg((c) => ({ ...c, ...patch }));
    recordInteraction(PAGE_N);
  };

  const mathDrop = (cc.gsm8kCot - cc.gsm8kCoconut).toFixed(1);

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
        Every technique in this story thinks the same way: one word after another, out loud, on a
        meter. That was the point: you could read every thought and count every token. The
        frontier is pulling on all three walls at once:{" "}
        <strong className="text-ink">thoughts that never become words</strong>, budgets that{" "}
        <strong className="text-ink">flex with the problem</strong>, and reasoning that{" "}
        <strong className="text-ink">reaches out of the page to act</strong>.
      </p>

      <div className="grid gap-x-8 gap-y-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
        {/* Step 1 — latent reasoning */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">1. Thinking without words</h2>
          <div className="flex flex-col gap-4 rounded-lg border border-grid bg-surface p-4">
            <p className="text-ink">
              A chain of thought must commit to one word at every step. Coconut skips the words:
              the model&apos;s last hidden state, the thought itself, is fed straight back in as
              the next input, so reasoning runs as vectors and is never decoded into text. Freed
              from saying one thing at a time, a continuous thought can hold{" "}
              <strong>several candidate paths at once</strong> and drop them as evidence arrives, a
              built-in breadth-first search, where a written chain must gamble on a single line.
              <Cite n={REF.coconut} />
            </p>
            <div
              className="flex flex-col gap-3"
              role="img"
              aria-label={`Accuracy of the same GPT-2-scale model thinking in words versus in latent space. ProsQA, a planning-heavy task: ${cc.prosqaCot} percent in words with ${cc.prosqaCotTokens} thought tokens, ${cc.prosqaCoconut} percent in latent space with ${cc.prosqaCoconutTokens} tokens. GSM8K, grade-school math: ${cc.gsm8kCot} percent in words with ${cc.gsm8kCotTokens} tokens, ${cc.gsm8kCoconut} percent in latent space with ${cc.gsm8kCoconutTokens} tokens.`}
            >
              {/* The scale belongs here and not in the page footnote: these four
                  bars carry the argument, and a ~20-point planning gain read as
                  a frontier result would be a different and much larger claim. */}
              <p className="text-sm font-semibold text-ink">
                One GPT-2-scale model, two thinking media
              </p>
              <div className="flex flex-col gap-1">
                <p className="text-sm text-ink">ProsQA, planning-heavy questions</p>
                <Bar label={`in words · ${cc.prosqaCotTokens} thought tokens`} value={cc.prosqaCot} tone="bg-grid" />
                <Bar label={`in latent space · ${cc.prosqaCoconutTokens} tokens`} value={cc.prosqaCoconut} tone="bg-compute" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-sm text-ink">GSM8K, grade-school math</p>
                <Bar label={`in words · ${cc.gsm8kCotTokens} thought tokens`} value={cc.gsm8kCot} tone="bg-grid" />
                <Bar label={`in latent space · ${cc.gsm8kCoconutTokens} tokens`} value={cc.gsm8kCoconut} tone="bg-compute" />
              </div>
            </div>
            <p className="text-sm text-ink-muted">
              The trade reads both ways: where planning dominates, silent thought jumps{" "}
              {cc.prosqaCot}% → {cc.prosqaCoconut}% on less than a third of the thinking tokens;
              on grade-school math it gives back {mathDrop} points. Better exploration and cheaper
              tokens, not uniformly better reasoning, and measured at the scale in the figure&apos;s
              title rather than at the frontier.
            </p>
            <div className="rounded border-l-4 border-wrong bg-wrong/10 p-3 text-sm text-ink">
              The price is the transcript. Page 18 asked whether the written chain even tells the
              truth; a latent chain removes the question by removing the page.{" "}
              <strong>There is nothing to read, faithful or not.</strong> Efficiency and
              monitorability are pulling in opposite directions, and much of this line of work
              (self-distilled latent thought,
              <Cite n={REF.codi} /> pause tokens
              <Cite n={REF.pause} />) is still preprint-stage research.
            </div>
          </div>
        </section>

        <Note kicker="References">
          <RefItem n={REF.coconut} href="https://arxiv.org/abs/2412.06769">
            Hao et al. 2024, <em>Training Large Language Models to Reason in a Continuous Latent
            Space</em> (Coconut).
          </RefItem>
          <RefItem n={REF.codi} href="https://arxiv.org/abs/2502.21074">
            Shen et al. 2025, <em>CODI</em>.
          </RefItem>
          <RefItem n={REF.pause} href="https://arxiv.org/abs/2310.02226">
            Goyal et al. 2024, pause tokens.
          </RefItem>
        </Note>

        {/* Step 2 — the capstone panel */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            2. Build a reasoner
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              illustrative composite · not a live model
            </span>
          </h2>
          <div className="flex flex-col gap-4 rounded-lg border-l-4 border-compute bg-surface p-4">
            <p className="text-ink">
              Every lever below is a page you have played. Compose a reasoning system and read the
              four numbers this whole story has been trading against each other. None of the four
              is free, and <strong>no lever moves only one of them</strong>: that is the finding,
              and it is easier to feel here than to be told.
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-ink-muted">Presets:</span>
              {PRESETS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => {
                    setCfg({ ...p.config });
                    recordInteraction(PAGE_N);
                  }}
                  className="rounded border border-grid bg-surface-raised px-3 py-1.5 text-sm text-ink"
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* controls */}
              <div className="flex flex-col gap-3">
                <Toggle
                  label="Chain of thought"
                  checked={cfg.cot}
                  onChange={(v) => change({ cot: v })}
                />
                {cfg.cot ? (
                  <fieldset className="flex flex-col gap-1">
                    <legend className="text-sm text-ink-muted">Thinking medium</legend>
                    <div className="flex gap-2">
                      {(
                        [
                          ["language", "in words"],
                          ["latent", "in latent space"],
                        ] as [Medium, string][]
                      ).map(([m, label]) => (
                        <button
                          key={m}
                          type="button"
                          aria-pressed={cfg.medium === m}
                          onClick={() => change({ medium: m })}
                          className={`rounded px-3 py-1.5 text-sm ${
                            cfg.medium === m
                              ? "bg-compute text-canvas"
                              : "bg-surface-raised text-ink-muted"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                ) : null}
                <Slider
                  label="Samples (N)"
                  min={1}
                  max={16}
                  value={cfg.samples}
                  onChange={(v) => change({ samples: v })}
                />
                {cfg.samples > 1 ? (
                  <fieldset className="flex flex-col gap-1">
                    <legend className="text-sm text-ink-muted">Selection</legend>
                    <div className="flex gap-2">
                      {(
                        [
                          ["majority", "majority vote"],
                          ["verifier", "learned verifier"],
                        ] as [Selection, string][]
                      ).map(([s, label]) => (
                        <button
                          key={s}
                          type="button"
                          aria-pressed={cfg.selection === s}
                          onClick={() => change({ selection: s })}
                          className={`rounded px-3 py-1.5 text-sm ${
                            cfg.selection === s
                              ? "bg-compute text-canvas"
                              : "bg-surface-raised text-ink-muted"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                ) : null}
                {cfg.cot ? (
                  <Toggle
                    label="Tree search"
                    checked={cfg.search}
                    onChange={(v) => change({ search: v })}
                  />
                ) : null}
                <Toggle
                  label="Adaptive budget"
                  checked={cfg.adaptive}
                  onChange={(v) => change({ adaptive: v })}
                />
                <p className="text-xs text-ink-muted">
                  Adaptive spends by estimated difficulty instead of spending the same on every
                  prompt: over {snell.fit!.params.efficiencyVsBestOfN}× more efficient than uniform
                  best-of-N on easy and medium problems, and least useful on the hardest.
                  <Cite n={REF.snell} /> The estimate is the part that can be wrong, so it is
                  charged a point and a half of accuracy here.
                </p>
              </div>

              {/* readouts */}
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-2">
                  <Stat
                    label="suite accuracy"
                    sub="mean over three families"
                    value={`${Math.round(out.accuracy)}%`}
                    tone="text-correct"
                    aria={`suite accuracy: ${Math.round(out.accuracy)} percent`}
                  />
                  <Stat
                    label="compute bill"
                    sub="vs one direct answer"
                    value={fmtX(out.cost)}
                    tone="text-compute"
                    aria={`compute bill: ${out.cost} times one direct answer`}
                  />
                  <Stat
                    label="latency"
                    sub="assuming samples run at once"
                    value={fmtX(out.latency)}
                    tone="text-ink"
                    aria={`latency: ${out.latency} times one direct answer`}
                  />
                  <Stat
                    label="monitorability"
                    sub="how much you can read"
                    value={`${out.monitorability}`}
                    tone={out.monitorability < 40 ? "text-wrong" : "text-ink"}
                    aria={`monitorability: ${out.monitorability} of 100`}
                  />
                </div>
                <div
                  className="flex flex-col gap-1"
                  role="img"
                  aria-label={`Accuracy by problem family: quick arithmetic ${out.families.arithmetic} percent, competition math ${out.families.math} percent, multi-step planning ${out.families.planning} percent.`}
                >
                  {(Object.keys(FAMILY_LABELS) as FamilyKey[]).map((f) => (
                    <Bar key={f} label={FAMILY_LABELS[f]} value={out.families[f]} tone="bg-compute" />
                  ))}
                </div>
              </div>
            </div>
            <p className="text-xs text-ink-muted">
              Each lever moves the readouts in the direction its cited page reported; the
              magnitudes are pedagogical, and the arithmetic is pinned by the test suite. The bill
              counts every sample; the latency counts one, because the panel assumes N samples are
              drawn at the same time on N machines. Draw them one after another instead, as page
              16&apos;s invoice does, and latency tracks the bill.
            </p>
          </div>
        </section>

        <div className="flex flex-col gap-6">
          <Note kicker="Try it">
            <p>Turn N up: the bill climbs, the latency does not, because the samples run at once.</p>
            <p>
              Then switch the medium to latent: the bill and the latency collapse, and so does the
              transcript.
            </p>
            <p>
              Then look for a setting where nothing is given up. There isn&apos;t one.
            </p>
          </Note>
          <Note kicker="References">
            <RefItem n={REF.snell} href="https://arxiv.org/abs/2408.03314">
              Snell et al. 2024, <em>Scaling LLM Test-Time Compute Optimally</em>.
            </RefItem>
          </Note>
        </div>

        {/* The close: page 2's question, answered in halves */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">The question you were asked on page 2</h2>
          <div className="flex flex-col gap-3 rounded-lg border-l-4 border-compute bg-surface p-4 text-ink">
            <p>
              Who won the most recent World Cup. The answer came back wrong twice over: the record
              had moved after the model&apos;s training cutoff, and the question never said the
              men&apos;s tournament, though the answer assumed it. Act 2 was opened to pay that
              debt. Seventeen pages later, here is the bill it actually paid.
            </p>
            <div className="rounded-lg border-l-4 border-correct bg-surface-raised p-3">
              <p className="text-sm font-semibold text-ink">The misread question: settled.</p>
              <p className="mt-1 text-sm text-ink">
                This is exactly what thinking is for. The failure was a reflex answer to an
                ambiguous question, and every lever in this story is a way of not answering on
                reflex. A written chain can put &ldquo;which tournament?&rdquo; on the page where a
                blurt has nowhere to put it. That is page 1&apos;s distinction doing real work:
                recognizing an answer and constructing one are not the same act, and only the
                second one ever notices the question.
              </p>
            </div>
            <div className="rounded-lg border-l-4 border-wrong bg-surface-raised p-3">
              <p className="text-sm font-semibold text-ink">
                The record that moved: not settled, and not settleable.
              </p>
              <p className="mt-1 text-sm text-ink">
                No budget fixes this one. Longer chains, wider votes, better judges, deeper search
                and silent latent thought all rearrange what the weights already hold. None of them
                puts a fact in there that was never in there. Page 3 priced the obvious repair,
                retraining, and found a compounding bill, a finite stock of text and a lag of weeks.
              </p>
            </div>
            <p>
              Before the repair, the failure, and it is ours. Page 11 measured a maths specialist
              that beats a model four and a half times its size. Here it is nine hundred tokens
              into a factoring problem, out of ideas, reaching for something it does not have.
            </p>

            <FabricatedToolCard />

            <p>
              It names the tool and then supplies the tool&apos;s output from its own weights. Every
              one of those zeros is invented. Thinking longer cannot repair this, because more
              thinking is more of the thing that just failed. What settles it is the one lever that
              stops being a monologue. ReAct interleaves thought with action: think a step, call a
              tool, read what comes back, think again.
              <Cite n={REF.react} />
            </p>
            <p className="rounded border border-dashed border-grid bg-surface-raised p-2 text-center font-mono text-sm text-ink">
              thought → action → observation → thought …
            </p>
            <p>
              So a chain can fetch a fact it never memorized and test a guess against the world
              instead of against itself. Be precise about what that buys. It is not a calculator:
              page 9 put a checker on this deck&apos;s own chains and found a false arithmetic step
              in well under one percent of the ones that reached the right answer. What the
              specialist above lacks is not a way to add up. It is a way to stop guessing where it
              should be exhausting, and an interpreter is the first thing in this story that can
              settle a question without asking the model again. Note what that is and is not. It is
              not thinking harder; it is looking it up, and the thinking in this story is what
              decides when to look and what to do with the answer. Pushed to the limit the whole
              toolbox fuses into an
              agent: at the 2024 International Olympiad in Informatics, an o1-based system ran
              hand-engineered test-time strategies, thousands of sampled programs, clustered,
              tested and ranked before submitting. Every selection trick in Act 2, aimed at one
              contest. Its RL-trained successors then matched that <em>without</em> the scaffold,
              so the strategy was learned rather than engineered.
              <Cite n={REF.ioi} />
            </p>
            <p className="text-ink-muted">
              Now look back at the four readouts you were just trading, and notice which one the
              panel does not have. There is no dial for <em>knows the thing</em>. Nineteen pages of
              inference-time compute settle one half of page 2&apos;s failure completely and buy
              nothing at all on the other half, and that is the honest shape of the answer.
            </p>
          </div>
        </section>

        <Note kicker="References">
          <RefItem n={REF.react} href="https://arxiv.org/abs/2210.03629">
            Yao et al. 2023, <em>ReAct: Synergizing Reasoning and Acting in Language Models</em>.
          </RefItem>
          <RefItem n={REF.ioi} href="https://arxiv.org/abs/2502.06807" preprint>
            OpenAI 2025, <em>Competitive Programming with Large Reasoning Models</em>.
          </RefItem>
        </Note>
      </div>

      {/* What to carry out */}
      <div className="max-w-2xl rounded-lg border-l-4 border-compute bg-surface p-4 text-ink">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Three things to take with you
        </p>
        <ul className="mt-2 flex list-disc flex-col gap-2 pl-5">
          <li>
            <strong>A score is a reading, not a property.</strong> When the next headline lands,
            ask page 15&apos;s four questions: which model variant, which version of the test,
            whose harness, how much thinking.
          </li>
          <li>
            <strong>Ask what the gain cost.</strong> Nothing above moved accuracy alone. Bill,
            latency and readability are the other three columns of every result you will read, and
            they are usually missing from it.
          </li>
          <li>
            <strong>Treat the trace as a witness, not a recording.</strong> Page 18&apos;s dial is
            the reason: a chain optimized to look good is a chain that has learned to look good.
          </li>
        </ul>
        <p className="mt-3">
          Inference-time scaling opened a{" "}
          <strong>second, durable axis of progress</strong>, accuracy bought at the point of use
          rather than baked in at training time. It is bounded by economics, by verification and by
          what you can still read, and it does not reach the things the model never knew. Everything
          on this page is an attempt to move one of those four walls.
        </p>
      </div>

      <p className="text-xs text-ink-muted">
        Step 1&apos;s bars are verbatim from the Coconut results table, GPT-2-scale experiments,
        accuracy and thought-token counts. Step 2 is an illustrative composite, not a live model.
        The chain in the close is a single measured trace, copied unedited from page 11&apos;s run
        ({SPECIMEN_SOURCE.modelLabel}, greedy, cap {SPECIMEN_SOURCE.chainBudget},{" "}
        {SPECIMEN_SOURCE.items}) and published in full inside{" "}
        <span className="font-mono">{SPECIMEN_SOURCE.bundle.split("/").pop()}</span>. It is a
        specimen of a failure, not a measurement of how often it happens.
      </p>

      <PageNav n={PAGE_N} />
    </article>
  );
}
