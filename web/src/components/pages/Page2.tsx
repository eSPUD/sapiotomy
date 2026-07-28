"use client";

/**
 * Page 2, "The Knowledge Gap". One question: how many World Cups has Spain won?
 * It looks like a plain lookup, but the record moved after the model's training
 * cutoff, so the machine's memory is stale. It blurts a confident recall off a
 * memory sealed before the 2026 final and lands one short. The point of the page
 * is the GAP itself: the model does not need to think harder (thinking never
 * invents a fact it was never shown); it needs the missing fact. Fetching that
 * fact at answer time is retrieval-augmented generation (RAG; Lewis et al.,
 * 2020). The explicit contrast this page plants: retrieval adds facts;
 * inference-time scaling (Pages 4+) adds thinking. Two different gaps.
 *
 * A Back/Next/Play stepper walks two roads from the same question in lockstep:
 * the sealed-memory recall (one short) and retrieval (fetch the fresh fact),
 * with a live narration line.
 *
 * Layout rule (hard): NOTHING pops or is gated. Every node of both paths, the
 * machine's actual reply, the analysis band, the teaser and the flag are ALL on
 * screen from the first paint — nodes not yet reached are dimmed, never hidden.
 * The reader's optional count only annotates; it reveals and hides nothing.
 */

import { Fragment, useEffect, useState } from "react";
import { PageNav } from "@/components/PageNav";
import { SPAIN_WORLD_CUPS } from "@/lib/authored";
import { ACTS, getPage } from "@/lib/pages";
import { useStore } from "@/store/useStore";

const PAGE_N = 2;
const WC = SPAIN_WORLD_CUPS;

/** Milliseconds between auto-advanced beats when Play is pressed. */
const PLAY_MS = 1100;

const TWO = WC.trueCount === 2 ? "Two" : String(WC.trueCount);

/** The two roads, node by node. Both start on the same question and walk in
 *  lockstep; only the last node carries a verdict tone. */
const RECALL_NODES = ["the question", "reach into memory", "sealed before the final", "“One.”"] as const;
const RETRIEVAL_NODES = ["the question", "“changed since the cutoff?”", "fetch a current source", `“${TWO}.”`] as const;
const MAX_STEP = RECALL_NODES.length; // 4

/** Narration for each beat (step 0 is the setup prompt). */
const BEATS: readonly string[] = [
  "Press Next, or Play, to walk both roads from the same question.",
  "The same question hits both. It looks like a plain fact to fetch.",
  "One road reaches straight into the model's trained memory. The other asks first: could this record have changed since the cutoff?",
  "The machine's memory was sealed before this summer's final. Retrieval goes to fetch a current source instead.",
  `Recall commits: “${WC.machine.reply[0]}” (one short). Retrieval fetched the missing fact, and lands on ${TWO}.`,
];

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Lenient count parse: a bare integer, or the number word for 0–6. */
function parseCount(raw: string): number | null {
  const s = raw.trim().toLowerCase();
  if (/^\d+$/.test(s)) return parseInt(s, 10);
  const words: Record<string, number> = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 };
  return s in words ? words[s] : null;
}

/**
 * One path: a row of nodes joined by arrows. Every node's text is always
 * present; nodes the stepper has not reached are dimmed (never hidden), the
 * current node is ringed, and the endpoint takes a verdict tone once reached.
 */
function PathRow({
  label,
  labelClass,
  nodes,
  endTone,
  endMark,
  note,
  step,
}: {
  label: string;
  labelClass: string;
  nodes: readonly string[];
  endTone: "wrong" | "correct";
  endMark: string;
  note: string;
  step: number;
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
        const reached = step >= i + 1;
        const current = step === i + 1;
        const isEnd = i === nodes.length - 1;
        // Reached/unreached is carried by text colour (ink vs ink-muted) and
        // background — never opacity, which would drop muted text below the
        // 4.5:1 contrast floor.
        const toneClass = !reached
          ? "border-grid bg-surface text-ink-muted"
          : isEnd
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
            <span
              className={`rounded border px-2 py-1 text-xs ${toneClass} ${
                current ? "ring-2 ring-compute" : ""
              }`}
            >
              {isEnd && reached ? `${endMark} ${n}` : n}
            </span>
          </Fragment>
        );
      })}
      <span className="text-xs text-ink-muted">· {note}</span>
    </div>
  );
}

export function Page2() {
  const page = getPage(PAGE_N)!;
  const recordInteraction = useStore((s) => s.recordInteraction);

  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    setReducedMotion(prefersReducedMotion());
  }, []);

  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [announce, setAnnounce] = useState("");

  // The reader's optional count — annotates only; reveals/hides nothing.
  const [guess, setGuess] = useState("");
  const [answered, setAnswered] = useState(false);
  const guessedRight = answered && parseCount(guess) === WC.trueCount;

  const go = (next: number) => {
    recordInteraction(PAGE_N);
    setPlaying(false);
    const clamped = Math.min(MAX_STEP, Math.max(0, next));
    setStep(clamped);
    setAnnounce(BEATS[clamped]);
  };

  const play = () => {
    recordInteraction(PAGE_N);
    setPlaying(true);
  };

  // Auto-advance the walkthrough while playing (motion only); stop at the end.
  useEffect(() => {
    if (!playing || reducedMotion) return;
    if (step >= MAX_STEP) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => {
      const next = Math.min(MAX_STEP, step + 1);
      setStep(next);
      setAnnounce(BEATS[next]);
    }, PLAY_MS);
    return () => clearTimeout(t);
  }, [playing, reducedMotion, step]);

  const submitGuess = () => {
    if (guess.trim().length === 0) return;
    recordInteraction(PAGE_N);
    setAnswered(true);
    setAnnounce(
      parseCount(guess) === WC.trueCount
        ? `You said ${WC.trueCount}, the record. If you followed the news it just popped.`
        : `You said ${guess.trim()}; the record here is ${WC.trueCount}.`,
    );
  };

  const done = step >= MAX_STEP;

  return (
    <article className="flex flex-col gap-5">
      <p className="text-xs uppercase tracking-wide text-ink-muted">
        Act {page.act} · {ACTS[page.act].title}
      </p>
      <h1 className="text-3xl font-bold text-ink">
        <span className="font-mono text-ink-muted">{page.n}. </span>
        {page.title}
      </h1>
      <p className="max-w-2xl text-lg text-ink-muted">
        No mental math this time. One plain question of record:{" "}
        <strong>how many World Cups has Spain won?</strong> It looks like a lookup. But a model
        learns everything it knows before a fixed <strong>training cutoff</strong>, and the record
        moved after that. Watch the same question take two very different roads.
      </p>

      {/* ================= the single focal stage ================= */}
      <section
        aria-label="One question, two paths"
        className="flex flex-col overflow-hidden rounded-lg border border-grid bg-surface"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-grid px-4 py-2 text-xs text-ink-muted">
          <span>one question · two paths · walk them</span>
          <span className="rounded-full border border-wrong/60 bg-wrong/15 px-2 py-0.5 text-wrong">
            2026 result: authored placeholder · verify before shipping
          </span>
        </div>

        <div className="flex flex-col gap-4 p-4">
          <p className="text-lg text-ink">{WC.question}</p>

          {/* reader's optional count — annotates, never gates */}
          <form
            className="flex flex-wrap items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              submitGuess();
            }}
          >
            <label htmlFor="wc-count" className="text-sm text-ink-muted">
              your count:
            </label>
            <input
              id="wc-count"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              aria-label="How many World Cups Spain has won"
              placeholder="a number"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              className="w-24 rounded border border-grid bg-canvas px-3 py-2 text-sm text-ink placeholder:text-ink-muted"
            />
            <button
              type="submit"
              disabled={guess.trim().length === 0 || answered}
              className="rounded bg-compute px-3 py-2 text-sm font-semibold text-canvas disabled:opacity-50"
            >
              Answer
            </button>
            <span className="text-sm text-ink-muted">
              {!answered ? (
                "puts your own count beside the machine's; no wrong turns for you"
              ) : guessedRight ? (
                <>
                  <span className="text-correct">✓ {TWO}.</span> If you followed the news it{" "}
                  <em>popped</em>: no steps, the count was simply there.
                </>
              ) : (
                <>
                  <span className="text-wrong">✗ you said {guess.trim()};</span> the record is{" "}
                  <strong className="text-ink">{TWO.toLowerCase()}</strong>; the title you never
                  saw can&apos;t be counted from memory.
                </>
              )}
            </span>
          </form>

          {/* the two paths, walked in lockstep — all nodes always on screen */}
          <div className="flex flex-col gap-3 rounded-lg border border-dashed border-grid bg-surface-raised p-3">
            <p className="text-xs text-ink-muted">
              the machine: {WC.machine.cutoffLabel} · {WC.machine.constraintLabel}
            </p>
            <PathRow
              label="sealed memory · recall"
              labelClass="text-wrong"
              nodes={RECALL_NODES}
              endTone="wrong"
              endMark="✗"
              note="stops one short — the knowledge gap"
              step={step}
            />
            <PathRow
              label="retrieval · fetch"
              labelClass="text-correct"
              nodes={RETRIEVAL_NODES}
              endTone="correct"
              endMark="✓"
              note="fetches the missing fact"
              step={step}
            />
          </div>

          {/* the driver */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => go(step - 1)}
              disabled={step === 0}
              className="rounded border border-grid bg-surface-raised px-3 py-2 text-sm text-ink disabled:opacity-50"
            >
              ◂ Back
            </button>
            <button
              type="button"
              onClick={() => go(step + 1)}
              disabled={step >= MAX_STEP}
              className="rounded bg-compute px-4 py-2 text-sm font-semibold text-canvas disabled:opacity-50"
            >
              Next ▸
            </button>
            {!reducedMotion ? (
              <button
                type="button"
                onClick={play}
                disabled={playing || step >= MAX_STEP}
                className="rounded border border-compute px-3 py-2 text-sm font-semibold text-compute disabled:opacity-50"
              >
                ▶ Play
              </button>
            ) : null}
            <span className="font-mono text-xs tabular-nums text-ink-muted">
              {`step ${step} of ${MAX_STEP}`}
            </span>
          </div>

          {/* live narration */}
          <p className="min-h-[1.5rem] border-t border-grid pt-3 text-ink">
            {done ? <span aria-hidden="true" className="text-correct">✓ </span> : null}
            {BEATS[step]}
          </p>
        </div>
      </section>

      {/* ================= the analysis (always on screen) ================= */}
      <div className="rounded-lg border-l-4 border-compute bg-surface p-4 text-ink">
        <p>
          <strong>It only looks like a lookup.</strong> The count may pop
          {answered ? <>, the way it may have for you</> : null}. But a bare recall is exactly the
          trap the machine fell into: it counted off a memory sealed before this summer,{" "}
          <strong>{WC.trueCount}</strong> titles reported as{" "}
          <strong>{WC.machine.answer === 1 ? "one" : WC.machine.answer}</strong>.
        </p>
        <p className="mt-2 text-ink-muted">
          Answering it <em>well</em> means noticing the record can change, asking{" "}
          <em>&ldquo;won it recently? I&apos;d better check,&rdquo;</em> and going to get the fresh
          fact, the move the machine skipped.
        </p>
      </div>

      {/* ===== the gap is knowledge, and retrieval fills it (RAG) ===== */}
      <div className="rounded-lg border-l-4 border-correct bg-surface p-4 text-ink">
        <p>
          <strong>The gap is knowledge, not thinking.</strong> Thinking harder never conjures a fact
          the model was never shown; it simply needed the <em>fact itself</em>. Fetch it from a
          current source at answer time and you have <strong>retrieval-augmented generation</strong>{" "}
          (RAG): retrieve the relevant document, then answer{" "}
          <span className="text-ink-muted">[Lewis et al., 2020]</span>. Retrieval{" "}
          <strong>adds facts</strong>.
        </p>
      </div>

      {/* ===== the explicit contrast this page plants ===== */}
      <div className="rounded-lg border border-compute bg-surface-raised p-4 text-ink">
        <p className="text-lg">
          <strong>Retrieval adds facts. Inference-time scaling adds thinking.</strong>
        </p>
        <p className="mt-2 text-ink-muted">
          Two different gaps. Retrieval, and the retraining the next page tries, both close the{" "}
          <strong className="text-ink">knowledge gap</strong> you just saw. But other problems hand
          the model every fact it needs and still demand real work to reach the answer: a{" "}
          <strong className="text-ink">reasoning gap</strong> no fetch can fill. That gap is where
          this story turns from Page 4 on.
        </p>
      </div>

      <p className="max-w-2xl text-ink">
        <em>
          So there are two ways to hand the model the fact it lacked: fetch it at answer time
          (retrieval, above), or bake it into the weights, what if we simply{" "}
          <strong>trained it on data that includes that final</strong>? That retraining fix is the
          next page. Both only add facts; teaching the model to <strong>think</strong> is the harder
          problem this whole story is headed toward.
        </em>
      </p>

      <p className="text-xs text-ink-muted">
        the question is real and recent on purpose · Spain&apos;s 2010 title is real, but the 2026
        win (and so the count of two) is an authored placeholder; verify the final&apos;s result
        before shipping · the machine&apos;s reply is an authored example of a confident stale-memory
        miss; a live open model with no web search replaces it later · retrieval framing: Lewis et
        al., &ldquo;Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks,&rdquo; NeurIPS
        2020
      </p>

      <div aria-live="polite" className="sr-only">
        {announce}
      </div>
      <PageNav n={PAGE_N} />
    </article>
  );
}
