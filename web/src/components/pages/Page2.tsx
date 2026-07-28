"use client";

/**
 * Page 2, "The Knowledge Gap". One question: how many FIFA World Cups has Spain
 * won? It looks like a plain lookup, but the record moved after the model's
 * training cutoff, so the machine's memory is stale. It blurts a confident
 * recall off a memory sealed before the 2026 final and lands one short. The
 * point of the page is the GAP itself: the model does not need to think harder
 * (thinking never invents a fact it was never shown); it needs the missing fact.
 * Fetching that fact at answer time is retrieval-augmented generation (RAG;
 * Lewis et al., 2020). The explicit contrast this page plants: retrieval adds
 * facts; inference-time scaling (Pages 4+) adds thinking. Two different gaps.
 *
 * Layout: the page's rule was always "nothing pops, everything on screen from
 * first paint", so the two roads are simply drawn in full — a static contrast,
 * no stepper. The sealed-memory road ends one short (✗ One); the retrieval road
 * fetches the fact (✓ Two).
 */

import { Fragment, useState } from "react";
import { PageNav } from "@/components/PageNav";
import { SPAIN_WORLD_CUPS } from "@/lib/authored";
import { ACTS, getPage } from "@/lib/pages";
import { useStore } from "@/store/useStore";

const PAGE_N = 2;
const WC = SPAIN_WORLD_CUPS;

const TWO = WC.trueCount === 2 ? "Two" : String(WC.trueCount);

/** The retrieval road, node by node. It fetches a current source, so its answer
 *  is the true count regardless of any training cutoff. */
const RETRIEVAL_NODES = ["the question", "“changed since the cutoff?”", "fetch a current source", `“${TWO}.”`] as const;
/** The recall road's fixed prefix; its last two nodes depend on the cutoff. */
const RECALL_PREFIX = ["the question", "reach into memory"] as const;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const NUM_WORDS = ["Zero", "One", "Two", "Three", "Four", "Five", "Six"];

/** A cutoff is a month, encoded as years*12 + month(0-11), so it slides smoothly. */
const monthIndex = (year: number, month0: number) => year * 12 + month0;
const CUTOFF_MIN = monthIndex(2007, 0); // Jan 2007 (before any Spain title)
const CUTOFF_MAX = monthIndex(2027, 11); // Dec 2027 (past the 2026 final)
const CUTOFF_DEFAULT = monthIndex(2025, 0); // Jan 2025 — the machine's real seal
/** Each of Spain's titles is decided at its July final (2010-07, 2026-07). */
const WIN_FINALS = WC.wins.map((y) => monthIndex(y, 6));
const fmtCutoff = (i: number) => `${MONTHS[((i % 12) + 12) % 12]} ${Math.floor(i / 12)}`;
const numWord = (n: number) => NUM_WORDS[n] ?? String(n);

/**
 * One road: a row of nodes joined by arrows, drawn in full. The endpoint takes a
 * verdict tone (wrong/correct); the rest are neutral compute-toned steps.
 */
function PathRow({
  label,
  labelClass,
  nodes,
  endTone,
  endMark,
  note,
}: {
  label: string;
  labelClass: string;
  nodes: readonly string[];
  endTone: "wrong" | "correct";
  endMark: string;
  note: string;
}) {
  return (
    <div
      className="flex flex-wrap items-center gap-x-2 gap-y-1.5"
      role="group"
      aria-label={`${label} path: ${nodes.join(", then ")}`}
    >
      <span className={`w-full text-xs font-semibold uppercase tracking-wide sm:w-40 ${labelClass}`}>
        {label}
      </span>
      {nodes.map((n, i) => {
        const isEnd = i === nodes.length - 1;
        const toneClass = isEnd
          ? endTone === "wrong"
            ? "border-wrong/60 bg-wrong/15 text-ink"
            : "border-correct/60 bg-correct/15 text-ink"
          : "border-compute/40 bg-surface-raised text-ink";
        return (
          <Fragment key={i}>
            {i > 0 ? (
              <span aria-hidden="true" className="text-ink-muted">
                →
              </span>
            ) : null}
            <span className={`rounded border px-2 py-1 text-xs ${toneClass}`}>
              {isEnd ? `${endMark} ${n}` : n}
            </span>
          </Fragment>
        );
      })}
      <span className="text-xs text-ink-muted">· {note}</span>
    </div>
  );
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
  const recordInteraction = useStore((s) => s.recordInteraction);

  // The reader sets the model's training cutoff; sealed memory can only recall
  // titles decided on or before it. Retrieval is unaffected.
  const [cutoff, setCutoff] = useState(CUTOFF_DEFAULT);
  const recallCount = WIN_FINALS.filter((f) => f <= cutoff).length;
  const recallWord = numWord(recallCount);
  const gap = WC.trueCount - recallCount;
  const cutoffText = fmtCutoff(cutoff);
  const recallNodes = [...RECALL_PREFIX, `sealed ${cutoffText}`, `“${recallWord}.”`];
  const gapNote =
    gap <= 0 ? "caught up — the gap closes" : `${gap === 1 ? "one" : gap} short — the knowledge gap`;

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
        No mental math this time. One plain question of record:{" "}
        <strong>how many FIFA World Cups has Spain won?</strong> It looks like a lookup. But a model
        learns everything it knows before a fixed <strong>training cutoff</strong>, and the record
        moved after that. Here the same question takes two very different roads.
      </p>

      {/* Each step (left) sits beside its own note (right); the whole page scrolls. */}
      <div className="grid gap-x-8 gap-y-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
        {/* Step 1 */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">1. One question, two roads</h2>

          <section
            aria-label="One question, two roads"
            className="flex flex-col overflow-hidden rounded-lg border border-grid bg-surface"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-grid px-4 py-2 text-xs text-ink-muted">
              <span>one question · two roads</span>
            </div>

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
                <p className="text-sm text-ink-muted">
                  A model sealed in <strong className="text-ink">{cutoffText}</strong> knows{" "}
                  <strong className="text-ink">{recallWord.toLowerCase()}</strong> of Spain&apos;s{" "}
                  {WC.trueCount} titles, so from memory it answers{" "}
                  <strong className="text-ink">&ldquo;{recallWord}.&rdquo;</strong>
                </p>
              </div>

              <div className="flex flex-col gap-3 rounded-lg border border-dashed border-grid bg-surface-raised p-3">
                <p className="text-xs text-ink-muted">
                  the machine: memory sealed {cutoffText} · {WC.machine.constraintLabel}
                </p>
                <PathRow
                  label="sealed memory · recall"
                  labelClass="text-wrong"
                  nodes={recallNodes}
                  endTone={gap <= 0 ? "correct" : "wrong"}
                  endMark={gap <= 0 ? "✓" : "✗"}
                  note={gapNote}
                />
                <PathRow
                  label="retrieval · fetch"
                  labelClass="text-correct"
                  nodes={RETRIEVAL_NODES}
                  endTone="correct"
                  endMark="✓"
                  note="fetches the current count"
                />
              </div>
            </div>
          </section>
        </section>
        <Note kicker="Read it">
          <p>Both roads start on the same question and run left to right.</p>
          <p>
            Slide the training cutoff to change what sealed memory knows: recall only counts titles
            won on or before it. Retrieval fetches a current source, so it is unaffected.
          </p>
        </Note>

        {/* Step 2 */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">2. Why recall fell short</h2>
          <div className="rounded-lg border-l-4 border-compute bg-surface p-4 text-ink">
            <p>
              <strong>It only looks like a lookup.</strong> The count may pop. But a bare recall is
              exactly the trap the machine fell into: it counted off a memory sealed before this
              summer, <strong>{WC.trueCount}</strong> titles reported as{" "}
              <strong>{WC.machine.answer === 1 ? "one" : WC.machine.answer}</strong>.
            </p>
            <p className="mt-2 text-ink-muted">
              Answering it <em>well</em> means noticing the record can change, asking{" "}
              <em>&ldquo;won it recently? I&apos;d better check,&rdquo;</em> and going to get the
              fresh fact, the move the machine skipped.
            </p>
          </div>
        </section>
        <div aria-hidden="true" />

        {/* Step 3 */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">3. Two gaps, not one</h2>

          {/* the gap is knowledge, and retrieval fills it (RAG) */}
          <div className="rounded-lg border-l-4 border-correct bg-surface p-4 text-ink">
            <p>
              <strong>The gap is knowledge, not thinking.</strong> Thinking harder never conjures a
              fact the model was never shown; it simply needed the <em>fact itself</em>. Fetch it
              from a current source at answer time and you have{" "}
              <strong>retrieval-augmented generation</strong> (RAG): retrieve the relevant document,
              then answer <span className="text-ink-muted">[Lewis et al., 2020]</span>. Retrieval{" "}
              <strong>adds facts</strong>.
            </p>
          </div>

          {/* the explicit contrast this page plants */}
          <div className="rounded-lg border border-compute bg-surface-raised p-4 text-ink">
            <p className="text-lg">
              <strong>Retrieval adds facts. Inference-time scaling adds thinking.</strong>
            </p>
            <p className="mt-2 text-ink-muted">
              Two different gaps. Retrieval, and the retraining the next page tries, both close the{" "}
              <strong className="text-ink">knowledge gap</strong> you just saw. But other problems
              hand the model every fact it needs and still demand real work to reach the answer: a{" "}
              <strong className="text-ink">reasoning gap</strong> no fetch can fill. That gap is
              where this story turns from Page 4 on.
            </p>
          </div>

          <p className="text-ink">
            <em>
              So there are two ways to hand the model the fact it lacked: fetch it at answer time
              (retrieval, above), or bake it into the weights, what if we simply{" "}
              <strong>trained it on data that includes that final</strong>? That retraining fix is
              the next page. Both only add facts; teaching the model to <strong>think</strong> is
              the harder problem this whole story is headed toward.
            </em>
          </p>
        </section>
        <Note kicker="References">
          <p>
            Lewis et al., &ldquo;Retrieval-Augmented Generation for Knowledge-Intensive NLP
            Tasks&rdquo; (NeurIPS 2020).
          </p>
          <p>
            Framing: Kahneman, <em>Thinking, Fast and Slow</em> (2011).
          </p>
        </Note>
      </div>

      <p className="text-xs text-ink-muted">
        the question is real and recent on purpose · Spain&apos;s 2010 title is real, but the 2026
        win (and so the count of two) is an authored placeholder; verify the final&apos;s result
        before shipping · the machine&apos;s reply is an authored example of a confident stale-memory
        miss; a live open model with no web search replaces it later
      </p>

      <PageNav n={PAGE_N} />
    </article>
  );
}
