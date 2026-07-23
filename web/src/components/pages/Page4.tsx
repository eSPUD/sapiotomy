"use client";

/**
 * Page 4, "The Third Option" — the Act 1 finale and the reveal of the whole
 * deck's subject. Pages 2–3 laid out two dead ends: answer from a frozen memory
 * and land one short (p2), or retrain so the memory is never stale and drown in
 * an impossible bill (p3). This page offers the third option: leave training
 * alone and change what happens at ANSWER time. On the exact World-Cup question
 * from p2, a toggle contrasts the two behaviours:
 *   INSTANT   — one forward pass, the confident wrong blurt from p2.
 *   THINKING  — the model spends compute before committing: it questions what it
 *               knows, notices the post-cutoff gap, and checks before answering.
 *
 * The novel through-line: the p2 model didn't fail only for want of data — it
 * failed because it never PAUSED. Thinking's contribution is the recognition
 * that it needs to look; a tool is useless to a model that never realizes it
 * should reach for one. That recognition, bought with compute at answer time,
 * is inference-time scaling. The page names it here (Act 1's payoff) and hands
 * to Act 2 the question it opens: once a model can spend that compute, how
 * should it spend it? Checking a fact is only the start — sample and vote,
 * generate and verify, search over reasoning. That is the toolbox.
 *
 * The thinking trace is an authored placeholder (see lib/authored), flagged like
 * p2's blurt; a live reasoning model replaces it later. No new data curves here.
 */

import { useEffect, useState } from "react";
import { PageNav } from "@/components/PageNav";
import { SPAIN_WORLD_CUPS } from "@/lib/authored";
import { ACTS, getPage } from "@/lib/pages";
import { useStore } from "@/store/useStore";

const PAGE_N = 4;
const WC = SPAIN_WORLD_CUPS;

/** Milliseconds a thinking step lingers before the next one appears. */
const STEP_MS = 750;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

type Mode = "idle" | "instant" | "thinking";

export function Page4() {
  const page = getPage(PAGE_N)!;
  const recordInteraction = useStore((s) => s.recordInteraction);

  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    setReducedMotion(prefersReducedMotion());
  }, []);

  const [mode, setMode] = useState<Mode>("idle");
  const [stepShown, setStepShown] = useState(0);
  const [touched, setTouched] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const steps = WC.thinking.steps;
  const thinkingDone = mode === "thinking" && stepShown >= steps.length;

  // "Compute" the reader can see: instant is a single pass; thinking is the
  // whole trace plus the answer. The number IS the point of the page.
  const instantSteps = 1;
  const thinkingSteps = steps.length + 1;

  const chooseInstant = () => {
    if (!touched) {
      setTouched(true);
      recordInteraction(PAGE_N);
    }
    setMode("instant");
    setStepShown(0);
    setAnnouncement(
      `Instant mode: one forward pass. The model answers ${WC.machine.answer} — wrong by one, the same miss as page 2.`,
    );
  };

  const chooseThinking = () => {
    if (!touched) {
      setTouched(true);
      recordInteraction(PAGE_N);
    }
    setMode("thinking");
    if (reducedMotion) {
      setStepShown(steps.length);
      setAnnouncement(
        `Thinking mode: ${thinkingSteps} steps. The model notices its memory may be stale, checks, and answers ${WC.thinking.answer.replace(/\.$/, "")} — the right count.`,
      );
    } else {
      setStepShown(0);
      setAnnouncement("Thinking mode: the model reasons before answering.");
    }
  };

  // Reveal the thinking steps one at a time.
  useEffect(() => {
    if (mode !== "thinking" || reducedMotion || stepShown >= steps.length) return;
    const t = setTimeout(() => setStepShown((s) => s + 1), STEP_MS);
    return () => clearTimeout(t);
  }, [mode, reducedMotion, stepShown, steps.length]);

  // Announce the landing once the trace finishes streaming.
  useEffect(() => {
    if (mode !== "thinking" || reducedMotion || stepShown !== steps.length) return;
    setAnnouncement(
      `The model checked, then answered ${WC.thinking.answer.replace(/\.$/, "")} — the right count. It recognized the gap; it did not invent the fact.`,
    );
  }, [mode, reducedMotion, stepShown, steps.length]);

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
        Two dead ends so far. <strong className="text-ink">Answer from memory</strong> and the
        machine lands one short (page 2). <strong className="text-ink">Retrain it daily</strong> so
        the memory is never stale, and the bill is impossible (page 3). There is a third option, and
        it touches neither the training data nor the model: change what happens at{" "}
        <strong className="text-ink">answer time</strong>.
      </p>

      <section
        aria-label="The same question, answered two ways"
        className="overflow-hidden rounded-lg border border-grid bg-surface"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-grid px-4 py-2 text-xs text-ink-muted">
          <span>the same question as page 2 · now you choose how it answers</span>
          <span className="rounded-full border border-wrong/60 bg-wrong/15 px-2 py-0.5 text-wrong">
            example trace, authored · live reasoning model to follow
          </span>
        </div>
        <div className="flex flex-col gap-4 p-4">
          <p className="text-lg text-ink">{WC.question}</p>

          <div
            role="group"
            aria-label="Answer mode"
            className="inline-flex w-fit rounded-lg border border-grid bg-canvas p-1"
          >
            <button
              type="button"
              onClick={chooseInstant}
              aria-pressed={mode === "instant"}
              className={`rounded px-3 py-1.5 text-sm font-semibold transition-colors ${
                mode === "instant" ? "bg-wrong text-canvas" : "text-ink-muted hover:text-ink"
              }`}
            >
              Answer instantly
            </button>
            <button
              type="button"
              onClick={chooseThinking}
              aria-pressed={mode === "thinking"}
              className={`rounded px-3 py-1.5 text-sm font-semibold transition-colors ${
                mode === "thinking" ? "bg-compute text-canvas" : "text-ink-muted hover:text-ink"
              }`}
            >
              Let it think
            </button>
          </div>

          {mode === "idle" ? (
            <p className="rounded-lg border border-dashed border-grid bg-surface-raised p-4 text-sm text-ink-muted">
              Same model, same question. Pick <strong className="text-ink">Answer instantly</strong>{" "}
              to replay page 2&apos;s reflex — or <strong className="text-ink">Let it think</strong>{" "}
              to spend a little compute before it commits.
            </p>
          ) : null}

          {mode === "instant" ? (
            <div className="rounded-lg border-l-4 border-wrong bg-wrong/15 p-4">
              <p className="font-mono text-xs uppercase tracking-wide text-ink-muted">
                the machine → <span className="text-wrong">one forward pass</span>
              </p>
              <p className="mt-2 text-ink">{WC.machine.reply.join(" ")}</p>
              <p className="mt-3 text-sm text-wrong">
                ✗ {WC.machine.answer}, wrong by one — the exact miss from page 2. It never paused to
                ask whether its memory was current.{" "}
                <span className="text-ink-muted">
                  ({instantSteps} step of &ldquo;thinking&rdquo;.)
                </span>
              </p>
            </div>
          ) : null}

          {mode === "thinking" ? (
            <div className="rounded-lg border-l-4 border-compute bg-surface-raised p-4">
              <p className="font-mono text-xs uppercase tracking-wide text-ink-muted">
                the machine → <span className="text-compute">thinking first</span>
              </p>
              <ol className="mt-2 flex flex-col gap-2">
                {steps.slice(0, stepShown).map((s, i) => (
                  <li key={i} className="text-sm text-ink-muted motion-safe:animate-fade-in">
                    <span className="mr-2 font-mono text-xs text-compute">{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ol>
              {thinkingDone ? (
                <p className="mt-3 border-t border-grid pt-3 text-ink">
                  <span className="font-semibold text-correct">✓ {WC.thinking.answer}</span>{" "}
                  <span className="text-sm text-ink-muted">
                    the right count — reached only because it stopped to check.{" "}
                    ({thinkingSteps} steps of thinking.)
                  </span>
                </p>
              ) : (
                <p className="mt-3 flex items-center gap-2 text-sm text-ink-muted">
                  <span aria-hidden="true" className="animate-pulse text-compute">
                    ▍
                  </span>
                  thinking…
                </p>
              )}
            </div>
          ) : null}
        </div>
      </section>

      <div className="rounded-lg border-l-4 border-compute bg-surface p-4 text-ink">
        <p className="text-xs font-semibold uppercase tracking-wide text-compute">the idea</p>
        <p className="mt-2 max-w-3xl">
          Instant mode is one forward pass — the model commits to its first instinct. Thinking mode
          spends <strong>more compute before answering</strong>: it questions what it knows, notices
          the gap, and acts on it. That is <strong>inference-time scaling</strong> — buying a better
          answer with compute at <em>answer</em> time, instead of with a bigger training bill.
        </p>
        <p className="mt-2 max-w-3xl text-sm text-ink-muted">
          And notice what thinking did <em>not</em> do: it never conjured the 2026 result out of
          thin air. Page 2 was right — thinking cannot invent a fact the model never saw. What it
          bought was the <strong className="text-ink">recognition</strong> that it needed to look. A
          tool is useless to a model that never realizes it should reach for one; the recognition is
          the scaling.
        </p>
      </div>

      <div className="grid items-stretch gap-3 lg:grid-cols-3">
        <div className="flex flex-col rounded-lg border-l-4 border-wrong bg-surface p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-wrong">
            option 1 · answer from memory (page 2)
          </p>
          <p className="mt-1 text-sm text-ink">
            <strong>Free</strong>, and one forward pass over whatever is already in the weights. It
            lands one short the moment the fact is newer than the model.
          </p>
        </div>
        <div className="flex flex-col rounded-lg border-l-4 border-wrong bg-surface p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-wrong">
            option 2 · retrain (page 3)
          </p>
          <p className="mt-1 text-sm text-ink">
            One giant bill, paid <strong>up front</strong>, to bake every fact into the weights —
            whether or not any question ever needs them.
          </p>
        </div>
        <div className="flex flex-col rounded-lg border-l-4 border-compute bg-surface p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-compute">
            option 3 · think (this page)
          </p>
          <p className="mt-1 text-sm text-ink">
            A little more compute <strong>per hard question</strong>, paid only when a question is
            actually hard. Nothing is baked in; the effort moves to answer time.
          </p>
        </div>
      </div>

      <p className="max-w-2xl text-ink">
        <em>
          So the fix was never more data — it was more <strong>thinking</strong>, spent at the
          moment of the question. Which opens the question all of Act 2 is about: once a model can
          spend that compute, <strong>how should it spend it?</strong> Checking a fact is only the
          start. It can sample many answers and keep the consensus, generate rival attempts and let
          a verifier pick the best, or search across whole chains of reasoning and backtrack. Those
          levers — and when each one pays off — are the toolbox.
        </em>
      </p>

      <p className="text-xs text-ink-muted">
        the same authored World-Cup question as page 2 · the &ldquo;thinking&rdquo; trace is an
        authored example of the ideal reasoning behaviour — recognize a post-cutoff gap, decline to
        answer from memory, check, then count; a live reasoning model replaces it later · it names
        the 2026 title the instant blurt omits and lands on the true count of {WC.trueCount} ·
        &ldquo;inference-time scaling&rdquo; is the name for trading answer-time compute for accuracy,
        the subject of the rest of this deck
      </p>

      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>
      <PageNav n={PAGE_N} />
    </article>
  );
}
