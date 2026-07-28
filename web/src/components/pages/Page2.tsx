"use client";

/**
 * Page 2, "Answering Questions in the Real World". One question: how many FIFA World Cups has Spain
 * won? It looks like a plain lookup, but the record moved after the model's
 * training cutoff, so its memory is stale and it lands one short. A model's
 * knowledge is fixed at training time while the world keeps producing facts,
 * so the gap reopens continuously.
 *
 * Narrative spine (three steps), each a distinct failure:
 *   1. A training-cutoff slider (Jan 2017 to Dec 2026): sliding it changes which
 *      of Spain's titles sealed memory can recall, and so the answer it gives.
 *      That is the knowledge gap, a missing FACT.
 *   2. Bias, not staleness. The question never said MEN'S, and Spain's women won
 *      in 2023, BEFORE the cutoff. The model held that fact and still left it
 *      out, resolving an ambiguous question to the reading its training data
 *      talks about most (cf. stereotype-consistent coreference, Zhao et al.
 *      2018). The step 1 widget already showed the biased reading, so this step
 *      names it and shows the full record in a small card instead of re-running
 *      the control.
 *   3. What a System 2 pass would have done, as an authored trace. Rereading the
 *      question settles the BIAS outright (it needs no information the model
 *      lacks). It cannot close the knowledge GAP, since thinking never conjures
 *      an unseen fact, but it converts a confident wrong answer into a flagged
 *      one. The closing beat: nothing about the model changed, only that it
 *      spent effort before answering, which hands off to the rest of the deck.
 */

import { useState } from "react";
import { Cite, RefItem } from "@/components/Cite";
import { PageNav } from "@/components/PageNav";
import { System2Comic } from "@/components/pages/System2Comic";
import {
  SPAIN_ALL_TITLES,
  SPAIN_IDEAL_ANSWER,
  SPAIN_MACHINE_REPLIES,
  SPAIN_SYSTEM2_TRACE,
  SPAIN_WORLD_CUPS,
} from "@/lib/authored";
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
const fmtCutoff = (i: number) => `${MONTHS[((i % 12) + 12) % 12]} ${Math.floor(i / 12)}`;

/** Men's finals are played in July. Section 1 counts only the men's tournament,
 *  which is the reading the model silently assumes; section 2 is about that. */
const DEFAULT_READING_FINALS = SPAIN_ALL_TITLES.mens.map((y) => monthIndex(y, 6));

/** Page 2's references, numbered in order of first appearance. */
const REF = { winobias: 1 } as const;

/**
 * The cutoff explorer. `finals` decides which titles count as knowable and
 * `replies` is indexed by how many of them fall on or before the cutoff.
 */
function CutoffWidget({
  id,
  finals,
  replies,
  total,
}: {
  id: string;
  finals: readonly number[];
  replies: readonly string[];
  total: number;
}) {
  const recordInteraction = useStore((s) => s.recordInteraction);
  const [cutoff, setCutoff] = useState(CUTOFF_DEFAULT);
  const known = finals.filter((f) => f <= cutoff).length;
  const gap = total - known;
  const cutoffText = fmtCutoff(cutoff);

  return (
    <section
      aria-label="Training cutoff explorer"
      className="flex flex-col overflow-hidden rounded-lg border border-grid bg-surface"
    >
      <div className="flex flex-col gap-4 p-4">
        <p className="text-lg text-ink">{WC.question}</p>

        {/* the reader sets the model's training cutoff */}
        <div className="flex flex-col gap-2 rounded-lg border border-grid bg-surface-raised p-3">
          <label htmlFor={id} className="flex flex-wrap items-baseline gap-2 text-sm text-ink-muted">
            <span>training cutoff:</span>
            <span className="font-mono text-base font-semibold text-ink">{cutoffText}</span>
          </label>
          <input
            id={id}
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

        {/* what the model says, off a memory sealed at that cutoff */}
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
          <p className="text-lg text-ink">&ldquo;{replies[known]}&rdquo;</p>
        </div>
      </div>
    </section>
  );
}

/** The answer the model should have given, framed like the reply block in
 *  section 1 so the contrast with the biased one is immediate. */
function IdealAnswer() {
  return (
    <section
      aria-label="The ideal answer"
      className="flex flex-col gap-2 rounded-lg border border-correct/60 bg-canvas p-4"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          the ideal answer
        </p>
        <span className="rounded-full border border-correct/60 bg-correct/15 px-2 py-0.5 text-xs text-correct">
          ✓ all {SPAIN_ALL_TITLES.total} titles
        </span>
      </div>
      <p className="text-lg text-ink">&ldquo;{SPAIN_IDEAL_ANSWER}&rdquo;</p>
    </section>
  );
}

/** A line set apart from the running prose: the questions sections 1 and 2 end
 *  on, and the closing statement section 3 lands. */
function PullQuote({ children }: { children: React.ReactNode }) {
  return <p className="border-l-2 border-compute pl-4 text-lg italic text-ink">{children}</p>;
}

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
        On Page 1 the two systems were yours. A model has the same split: asked something it can
        answer from memory, it answers at once, and that reflex is usually right, which is what makes
        its failures easy to miss. Real questions age, and they are rarely as precise as they look.
        Here is one plain question of record, and two different ways it catches a model out.
      </p>

      {/* Each step (left) sits beside its own note (right); the whole page scrolls. */}
      <div className="grid gap-x-8 gap-y-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
        {/* Step 1 */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">1. Answering a question</h2>

          <CutoffWidget
            id="cutoff-default"
            finals={DEFAULT_READING_FINALS}
            replies={SPAIN_MACHINE_REPLIES}
            total={WC.trueCount}
          />

          <p className="text-ink">
            A model learns everything it knows before a fixed <strong>training cutoff</strong>, and
            the answer it gives depends on when it was trained. This creates a perpetual{" "}
            <strong>knowledge gap</strong> after the model is trained, as new data is created by the
            world.
          </p>

          <p className="text-ink">
            Based on the knowledge cutoff date, the model gives an answer without thinking it
            through. System 1 thinking leads to an incorrect response.
          </p>

          <PullQuote>Are knowledge gaps addressable by System 2 thinking?</PullQuote>
        </section>
        <Note kicker="Try it">
          <p>Slide the training cutoff to move the model&apos;s memory back and forth in time.</p>
        </Note>

        {/* Step 2 */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">2. Answering a question without bias</h2>

          <p className="text-ink">
            <strong>The question never said men&apos;s.</strong> Spain fields a team in both
            tournaments, and has won three FIFA World Cups between them:
          </p>

          <IdealAnswer />

          <p className="text-ink">
            Every answer above quietly counted only the men&apos;s tournament. That is a{" "}
            <strong>knowledge bias</strong>, and it is not the knowledge gap.
          </p>

          <p className="text-ink">
            The 2023 win happened <em>before</em> the cutoff, so the model held the fact the whole
            time and left it out anyway. Nothing was missing from its memory. Handed an ambiguous
            question, it resolved the ambiguity to whichever reading its training data talked about
            most, and never mentioned that it had chosen. That is what makes a knowledge bias
            different from a knowledge gap: the gap is about what the model was never shown, the
            bias about which part of what it holds it decides to use. Models do this in the small
            too: given a sentence that could refer to either of two people, they resolve it to the
            stereotype-consistent reading rather than flagging that the sentence is ambiguous.
            <Cite n={REF.winobias} />
          </p>

          <PullQuote>Are knowledge biases addressable by System 2 thinking?</PullQuote>
        </section>
        <Note kicker="References">
          <RefItem n={REF.winobias}>
            Zhao et al., &ldquo;Gender Bias in Coreference Resolution: Evaluation and Debiasing
            Methods&rdquo; (NAACL 2018).
          </RefItem>
        </Note>

        {/* Step 3 */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">3. Thinking it through</h2>

          <p className="text-ink">
            Both misses share a shape: the model answered <em>immediately</em> (System 1 thinking).
            It never reread the
            question, and it never weighed what it might not know. A System 2 pass does both before
            committing to anything.
          </p>

          <System2Comic />

          <p className="text-ink">
            Which lands on <strong>{SPAIN_SYSTEM2_TRACE.answer}</strong>
          </p>

          <p className="text-ink">
            Look at what each step bought. Step 1 settles the{" "}
            <strong>bias</strong> outright, and it needed no new information: the ambiguity was
            sitting in the question the whole time, and reading it carefully was enough. Step 2 does
            not close the <strong>knowledge gap</strong>, because thinking cannot conjure a fact the
            model was never shown. What it does is notice the boundary, which turns a confident
            wrong answer into a flagged one, and a flagged one into a reason to go look.
          </p>

          <PullQuote>
            Nothing about the model changed between the reflex and the trace. Same weights, same
            training data, same cutoff. The only difference is that it{" "}
            <strong>spent effort before answering</strong>. That effort is the subject of the rest
            of this story: what it buys, how to buy more of it, and where buying more stops helping.
          </PullQuote>
        </section>
      </div>

      <PageNav n={PAGE_N} />
    </article>
  );
}
