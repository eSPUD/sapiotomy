"use client";

/**
 * Page 19, "The Frontier: Latent Reasoning, Adaptive Compute, and Agents".
 * The close of the story. Every technique so far thought out loud, one token
 * at a time, on a fixed budget. Step 1 shows thinking without words (Coconut,
 * data/coconut.json, verbatim table numbers) and the monitorability price of
 * silence. Steps 2 and 3 are compact: budgets that flex with difficulty
 * (Snell et al., s1) and reasoning fused with action (ReAct, o1 at the IOI).
 * Step 4 is the capstone: lib/reasoner.ts composes every technique in the app
 * into one panel with accuracy, cost, latency and monitorability readouts.
 */

import { useState } from "react";
import { CitationBadge } from "@/components/CitationBadge";
import { Cite, RefItem } from "@/components/Cite";
import { PageNav } from "@/components/PageNav";
import { Slider } from "@/components/Slider";
import { Toggle } from "@/components/Toggle";
import type { Citation } from "@/lib/data";
import { ACTS, getPage } from "@/lib/pages";
import { curves } from "@/lib/curves";
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
const REF = { coconut: 1, codi: 2, pause: 3, snell: 4, s1: 5, react: 6, ioi: 7 } as const;

const REACT_CITATION: Citation = {
  ref: "Yao et al. 2023",
  url: "https://arxiv.org/abs/2210.03629",
  venue: "ICLR 2023",
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
  const s1 = curves.budgetForcing;

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
        meter. That was the point — you could read every thought and count every token. The
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
              the model&apos;s last hidden state — the thought — is fed straight back in as the
              next input, so reasoning runs as vectors and is never decoded into text. Freed from
              saying one thing at a time, a continuous thought can hold{" "}
              <strong>several candidate paths at once</strong> and drop them as evidence arrives —
              a built-in breadth-first search, where a written chain must gamble on a single line.
              <Cite n={REF.coconut} />
            </p>
            <div
              className="flex flex-col gap-3"
              role="img"
              aria-label={`Accuracy of the same model thinking in words versus in latent space. ProsQA, a planning-heavy task: ${cc.prosqaCot} percent in words with ${cc.prosqaCotTokens} thought tokens, ${cc.prosqaCoconut} percent in latent space with ${cc.prosqaCoconutTokens} tokens. GSM8K, grade-school math: ${cc.gsm8kCot} percent in words with ${cc.gsm8kCotTokens} tokens, ${cc.gsm8kCoconut} percent in latent space with ${cc.gsm8kCoconutTokens} tokens.`}
            >
              <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold text-ink">ProsQA — planning-heavy questions</p>
                <Bar label={`in words · ${cc.prosqaCotTokens} thought tokens`} value={cc.prosqaCot} tone="bg-grid" />
                <Bar label={`in latent space · ${cc.prosqaCoconutTokens} tokens`} value={cc.prosqaCoconut} tone="bg-compute" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold text-ink">GSM8K — grade-school math</p>
                <Bar label={`in words · ${cc.gsm8kCotTokens} thought tokens`} value={cc.gsm8kCot} tone="bg-grid" />
                <Bar label={`in latent space · ${cc.gsm8kCoconutTokens} tokens`} value={cc.gsm8kCoconut} tone="bg-compute" />
              </div>
            </div>
            <p className="text-sm text-ink-muted">
              The trade reads both ways: where planning dominates, silent thought jumps{" "}
              {cc.prosqaCot}% → {cc.prosqaCoconut}% on less than a third of the thinking tokens;
              on grade-school math it gives back {mathDrop} points. Better exploration and cheaper
              tokens — not uniformly better reasoning.
            </p>
            <div className="rounded border-l-4 border-wrong bg-wrong/10 p-3 text-sm text-ink">
              The price is the transcript. Page 17 asked whether the written chain even tells the
              truth; a latent chain removes the question by removing the page —{" "}
              <strong>there is nothing to read, faithful or not</strong>. Efficiency and
              monitorability are pulling in opposite directions, and much of this line of work
              (self-distilled latent thought,
              <Cite n={REF.codi} /> pause tokens
              <Cite n={REF.pause} />) is still preprint-stage research.
            </div>
          </div>
        </section>

        <Note kicker="References">
          <RefItem n={REF.coconut}>
            Hao et al. 2024, <em>Training Large Language Models to Reason in a Continuous Latent
            Space</em> (Coconut).
          </RefItem>
          <RefItem n={REF.codi}>
            Shen et al. 2025, <em>CODI</em>.
          </RefItem>
          <RefItem n={REF.pause}>
            Goyal et al. 2024, pause tokens.
          </RefItem>
        </Note>

        {/* Step 2 — adaptive compute */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">2. Budgets that flex</h2>
          <div className="flex flex-col gap-3 rounded-lg border border-grid bg-surface p-4">
            <p className="text-ink">
              Act 2 spent the same budget on every question. Difficulty was the hidden variable all
              along: estimate it first, then match the method and the budget to it — brief
              sequential thought for easy prompts, wide search for hard ones. That{" "}
              <strong>compute-optimal allocation</strong> is over{" "}
              {snell.fit!.params.efficiencyVsBestOfN}× more efficient than uniform best-of-N,
              enough for a small model to out-think one {snell.fit!.params.largerModelFactor}×
              larger on a matched budget.
              <Cite n={REF.snell} /> Budget forcing is the same idea as a hand-held knob:
              appending &ldquo;Wait&rdquo; stretches thinking from {s1.fit!.params.start}% to{" "}
              {s1.fit!.params.end}% on AIME24 before the curve flattens.
              <Cite n={REF.s1} /> Deployed models now ship exactly this dial, sold as{" "}
              <em>reasoning effort</em>.
            </p>
          </div>
        </section>

        <Note kicker="References">
          <RefItem n={REF.snell}>
            Snell et al. 2024, <em>Scaling LLM Test-Time Compute Optimally</em>.
          </RefItem>
          <RefItem n={REF.s1}>
            Muennighoff et al. 2025, <em>s1: Simple Test-Time Scaling</em>.
          </RefItem>
        </Note>

        {/* Step 3 — agents */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">3. Thinking that acts</h2>
          <div className="flex flex-col gap-3 rounded-lg border border-grid bg-surface p-4">
            <p className="text-ink">
              Reasoning also stops being a closed monologue. ReAct interleaves thought with
              action: think a step, call a tool, read what comes back, think again — so a chain
              can fetch facts it never memorized and test guesses against the world instead of
              itself.
              <Cite n={REF.react} />
            </p>
            <p className="rounded border border-dashed border-grid bg-surface-raised p-2 text-center font-mono text-sm text-ink">
              thought → action → observation → thought …
            </p>
            <p className="text-ink">
              Pushed to the limit, the whole toolbox fuses into an agent: at the 2024 International
              Olympiad in Informatics, an o1-based system ran hand-engineered test-time strategies
              — thousands of sampled programs, clustered, tested and ranked before submitting.
              Every selection trick from this act, aimed at one contest. Its RL-trained successors
              then matched that <em>without</em> the scaffold: the strategy was learned, not
              engineered.
              <Cite n={REF.ioi} />
            </p>
          </div>
        </section>

        <Note kicker="References">
          <RefItem n={REF.react}>
            Yao et al. 2023, <em>ReAct: Synergizing Reasoning and Acting in Language Models</em>.
          </RefItem>
          <RefItem n={REF.ioi}>
            OpenAI 2025, <em>Competitive Programming with Large Reasoning Models</em>.
          </RefItem>
        </Note>

        {/* Step 4 — the capstone panel */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            4. Build a reasoner
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              illustrative composite · not a live model
            </span>
          </h2>
          <div className="flex flex-col gap-4 rounded-lg border-l-4 border-compute bg-surface p-4">
            <p className="text-ink">
              Every lever below is a page you have played. Compose a reasoning system and read the
              four numbers this whole story has been trading against each other.
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
              </div>

              {/* readouts */}
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-2">
                  <Stat
                    label="suite accuracy"
                    sub="mean over three families"
                    value={`${out.accuracy.toFixed(1)}%`}
                    tone="text-correct"
                    aria={`suite accuracy: ${out.accuracy.toFixed(1)} percent`}
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
                    sub="parallel samples are free"
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
              magnitudes are pedagogical, and the arithmetic is pinned by the test suite.
            </p>
          </div>
        </section>

        <Note kicker="Try it">
          <p>Turn N up: the bill climbs, the latency does not — samples run in parallel.</p>
          <p>
            Then switch the medium to latent: the bill and the latency collapse, and so does the
            transcript.
          </p>
        </Note>
      </div>

      {/* Synthesis */}
      <div className="max-w-2xl rounded-lg border-l-4 border-compute bg-surface p-4 text-ink">
        Where the story lands: inference-time scaling opened a{" "}
        <strong>second, durable axis of progress</strong> — accuracy bought at the point of use
        rather than baked in at training time. Its bounds ran through every page of this act:{" "}
        <strong>economics</strong> (thinking is metered), <strong>verification</strong> (a
        selector is only as good as its judge), and <strong>interpretability</strong> (thinking
        you cannot read is thinking you cannot audit). The frontier above pushes on all three at
        once.
      </div>

      <div className="flex flex-wrap gap-2">
        <CitationBadge citation={coco.citation} />
        <CitationBadge citation={snell.citation} />
        <CitationBadge citation={s1.citation} />
        <CitationBadge citation={REACT_CITATION} />
      </div>
      <p className="text-xs text-ink-muted">
        Step 1&apos;s bars are verbatim from the Coconut results table (GPT-2-scale experiments;
        accuracy and thought-token counts). Step 4 is an illustrative composite, not a live model.
      </p>

      <PageNav n={PAGE_N} />
    </article>
  );
}
