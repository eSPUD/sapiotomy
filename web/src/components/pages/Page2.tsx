"use client";

/**
 * Page 2, "Knowing What You Know". One question: how many FIFA World Cups has Spain
 * won? It looks like a plain lookup, but the record moved after the model's
 * training cutoff, so its memory is stale and it lands one short. A model's
 * knowledge is fixed at training time while the world keeps producing facts,
 * so the gap reopens continuously.
 *
 * Narrative spine (two steps):
 *   1. A training-cutoff slider (Jan 2017 to Dec 2026): sliding it changes which
 *      of Spain's titles sealed memory can recall, and so the answer it gives.
 *      That is the knowledge gap, a missing FACT.
 *   2. The second, quieter miss: the model never judged that it might be stale.
 *      MetaTool (Huang et al., ICLR 2024) benchmarked exactly this "tool usage
 *      awareness" and found most models struggle to recognize their own
 *      capability boundaries. The judgment was supplied from OUTSIDE, three
 *      ways: prompting (ReAct, Yao et al. 2022), fine-tuning (Toolformer,
 *      Schick et al. 2023), and human-designed workflow (Qu et al. 2025 survey).
 *      Note for anyone revisiting the claim: Toolformer is the strongest partial
 *      counterexample, since it does learn to choose tools for itself. The
 *      precise claim the page makes is the narrow one, that the judgment was
 *      engineered in rather than spontaneously present, which is what MetaTool
 *      measured in models lacking that engineering.
 *      Closes on the bridge to the reasoning gap: a model that does not know
 *      when to look something up, does it know when to think harder?
 */

import { useState } from "react";
import { Cite, RefItem } from "@/components/Cite";
import { PageNav } from "@/components/PageNav";
import { SPAIN_MACHINE_REPLIES, SPAIN_WORLD_CUPS } from "@/lib/authored";
import { ACTS, getPage } from "@/lib/pages";
import { useStore } from "@/store/useStore";

const PAGE_N = 2;
const WC = SPAIN_WORLD_CUPS;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** A cutoff is a month, encoded as years*12 + month(0-11), so it slides smoothly. */
const monthIndex = (year: number, month0: number) => year * 12 + month0;
const CUTOFF_MIN = monthIndex(2017, 0); // Jan 2017 (the 2010 title is always known)
const CUTOFF_MAX = monthIndex(2026, 11); // Dec 2026 (past the July final)
const CUTOFF_DEFAULT = monthIndex(2025, 0); // Jan 2025 — the machine's real seal
/** Each of Spain's titles is decided at its July final (2010-07, 2026-07). */
const WIN_FINALS = WC.wins.map((y) => monthIndex(y, 6));
const fmtCutoff = (i: number) => `${MONTHS[((i % 12) + 12) % 12]} ${Math.floor(i / 12)}`;

/** Page 2's references, numbered in order of first appearance. */
const REF = { metatool: 1, react: 2, toolformer: 3, survey: 4 } as const;

/** A margin note that sits beside its step and scrolls with the page.
 *  (Same shell as Page 1, so Act 1 reads as one layout.) */
function Note({ kicker, children }: { kicker: string; children: React.ReactNode }) {
  return (
    <aside className="flex flex-col gap-2 text-sm text-ink-muted lg:pt-9">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{kicker}</p>
      {children}
    </aside>
  );
}

export function Page2() {
  const page = getPage(PAGE_N)!;
  const recordInteraction = useStore((s) => s.recordInteraction);

  // The reader sets the model's training cutoff; sealed memory can only recall
  // titles decided on or before it. Retrieval is unaffected.
  const [cutoff, setCutoff] = useState(CUTOFF_DEFAULT);
  const recallCount = WIN_FINALS.filter((f) => f <= cutoff).length;
  const gap = WC.trueCount - recallCount;
  const cutoffText = fmtCutoff(cutoff);

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
        A model learns everything it knows before a fixed <strong>training cutoff</strong>, and the
        answer it gives depends on when it was trained. This creates a perpetual{" "}
        <strong>knowledge gap</strong> after the model is trained, as new data is created by the
        world.
      </p>

      {/* Each step (left) sits beside its own note (right); the whole page scrolls. */}
      <div className="grid gap-x-8 gap-y-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
        {/* Step 1 */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">1. Knowing the answer</h2>

          <section
            aria-label="Training cutoff explorer"
            className="flex flex-col overflow-hidden rounded-lg border border-grid bg-surface"
          >
            <div className="flex flex-col gap-4 p-4">
              <p className="text-lg text-ink">{WC.question}</p>

              {/* the reader sets the model's training cutoff */}
              <div className="flex flex-col gap-2 rounded-lg border border-grid bg-surface-raised p-3">
                <label
                  htmlFor="cutoff"
                  className="flex flex-wrap items-baseline gap-2 text-sm text-ink-muted"
                >
                  <span>training cutoff:</span>
                  <span className="font-mono text-base font-semibold text-ink">{cutoffText}</span>
                </label>
                <input
                  id="cutoff"
                  type="range"
                  min={CUTOFF_MIN}
                  max={CUTOFF_MAX}
                  step={1}
                  value={cutoff}
                  onChange={(e) => {
                    setCutoff(Number(e.target.value));
                    recordInteraction(PAGE_N);
                  }}
                  aria-label="Training cutoff month and year"
                  aria-valuetext={cutoffText}
                  className="w-full accent-compute"
                />
              </div>

              {/* what the model actually says, off a memory sealed at that cutoff */}
              <div className="flex flex-col gap-2 rounded-lg border border-grid bg-canvas p-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    the model answers
                  </p>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs ${
                      gap <= 0
                        ? "border-correct/60 bg-correct/15 text-correct"
                        : "border-wrong/60 bg-wrong/15 text-wrong"
                    }`}
                  >
                    {gap <= 0 ? "✓ current" : `✗ ${gap === 1 ? "one" : gap} short`}
                  </span>
                </div>
                <p className="text-lg text-ink">
                  &ldquo;{SPAIN_MACHINE_REPLIES[recallCount]}&rdquo;
                </p>
              </div>
            </div>
          </section>
        </section>
        <Note kicker="Try it">
          <p>Slide the training cutoff to move the model&apos;s memory back and forth in time.</p>
        </Note>

        {/* Step 2 */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            2. Knowing what you know is correct or incorrect
          </h2>

          {/* the deeper miss: it never reached for the fix */}
          <p className="text-ink">
            <strong>Retrieval only helps if something decides to retrieve.</strong> The machine never
            weighed its own memory and concluded it might be stale. It simply answered. That is a
            second, quieter miss: not the absent fact, but the absent judgment that a fact was
            missing. Asked directly whether models recognize the boundary of what they know and call
            for outside help, the MetaTool benchmark found most struggle to do so.
            <Cite n={REF.metatool} />
          </p>

          {/* the judgment was supplied from outside: three mechanisms */}
          <p className="text-ink">
            <strong>So the judgment was supplied from outside.</strong> Three ways, none of them the
            model&apos;s own idea:
          </p>
          <dl className="flex flex-col gap-2">
            <div>
              <dt className="font-semibold text-ink">Prompting: show the pattern.</dt>
              <dd className="text-ink-muted">
                ReAct interleaves reasoning with actions that query an external source, taught by a
                handful of worked examples.
                <Cite n={REF.react} />
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-ink">Fine-tuning: train it in.</dt>
              <dd className="text-ink-muted">
                Toolformer lets a model annotate text with candidate API calls, keeps only the calls
                that help it predict what comes next, then fine-tunes on those.
                <Cite n={REF.toolformer} />
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-ink">Workflow: build the pipeline around it.</dt>
              <dd className="text-ink-muted">
                Surveys of tool learning organize the field as human-designed stages: plan the task,
                select the tool, call it, compose the reply.
                <Cite n={REF.survey} />
              </dd>
            </div>
          </dl>

          <p className="text-ink">
            Which sharpens the question this story is really about. A model that does not reliably
            know when to look something up: does it know when to <strong>think harder</strong>?
          </p>
        </section>
        <Note kicker="References">
          <RefItem n={REF.metatool}>
            Huang et al., &ldquo;MetaTool: Benchmarking LLMs on Tool Usage Awareness&rdquo; (ICLR
            2024).
          </RefItem>
          <RefItem n={REF.react}>
            Yao et al., &ldquo;ReAct: Synergizing Reasoning and Acting in Language Models&rdquo;
            (2022).
          </RefItem>
          <RefItem n={REF.toolformer}>
            Schick et al., &ldquo;Toolformer: Language Models Can Teach Themselves to Use
            Tools&rdquo; (NeurIPS 2023).
          </RefItem>
          <RefItem n={REF.survey}>
            Qu et al., &ldquo;Tool Learning with Large Language Models: A Survey&rdquo; (2025).
          </RefItem>
        </Note>
      </div>

      <PageNav n={PAGE_N} />
    </article>
  );
}
