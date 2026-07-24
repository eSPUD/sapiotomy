"use client";

/**
 * Page 5, "How to Reason" — Act 2 opens on page 4's open question: can we
 * guide a machine down a road? The first tool is the simplest: SHOW it one.
 * Few-shot chain-of-thought prompting (Wei et al. 2022) puts a worked,
 * step-by-step example in the prompt; the model imitates the shape of that
 * reasoning on the new question. The interactive quotes the paper's own
 * Figure-1 cafeteria problem: "Show your work" OFF replays the standard
 * blurt (27, wrong); ON walks the quoted chain to 9. The side panel redraws
 * the paper's flat-vs-steep scaling result from data/wei-cot-scaling.json:
 * standard prompting barely moves with model size; chain of thought turns
 * the same curve steep — and, honestly kept, HURTS at 8B (emergence).
 * No live model anywhere; the transcript is authored and cited, and the
 * chip says so.
 *
 * Layout rules (house): no pop-ups — both panels, the meaning band, and the
 * hand-off are on screen from first paint; the chain animates only when
 * asked, and reduced motion gets the whole chain at once.
 */

import { useEffect, useState } from "react";
import { CitationBadge } from "@/components/CitationBadge";
import { LineChart } from "@/components/LineChart";
import { PageNav } from "@/components/PageNav";
import { Toggle } from "@/components/Toggle";
import { COT_DEMO } from "@/lib/authored";
import { ACTS, getPage } from "@/lib/pages";
import { curves } from "@/lib/curves";
import { useStore } from "@/store/useStore";

const PAGE_N = 5;
const D = COT_DEMO;

/** Milliseconds a chain step lingers before the next appears. */
const STEP_MS = 700;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function Page5() {
  const page = getPage(PAGE_N)!;
  const recordInteraction = useStore((s) => s.recordInteraction);

  const scaling = curves.weiCotScaling;
  const sp = scaling.fit!.params;
  const cot = curves.chainOfThought;
  const cp = cot.fit!.params;

  const standardCurve = [
    { x: 8, y: sp.palm8Standard },
    { x: 62, y: sp.palm62Standard },
    { x: 540, y: sp.palm540Standard },
  ];
  const cotCurve = [
    { x: 8, y: sp.palm8Cot },
    { x: 62, y: sp.palm62Cot },
    { x: 540, y: sp.palm540Cot },
  ];

  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    setReducedMotion(prefersReducedMotion());
  }, []);

  const [showWork, setShowWork] = useState(false);
  const [asked, setAsked] = useState(false);
  const [stepShown, setStepShown] = useState(0);
  const [announcement, setAnnouncement] = useState("");

  const chainDone = stepShown >= D.steps.length;

  const ask = () => {
    recordInteraction(PAGE_N);
    setAsked(true);
    if (showWork) {
      setStepShown(reducedMotion ? D.steps.length : 0);
      setAnnouncement(
        reducedMotion
          ? `With its work shown, the model walks the chain and answers 9 — the right count.`
          : "The model is showing its work.",
      );
    } else {
      setAnnouncement(`Without room to think, the model blurts ${D.blurt} Wrong.`);
    }
  };

  const flip = (checked: boolean) => {
    recordInteraction(PAGE_N);
    setShowWork(checked);
    if (asked) {
      if (checked) {
        setStepShown(reducedMotion ? D.steps.length : 0);
        setAnnouncement(
          reducedMotion
            ? "With its work shown, the model walks the chain and answers 9."
            : "The model is showing its work.",
        );
      } else {
        setAnnouncement(`Back to the blurt: ${D.blurt} Wrong.`);
      }
    }
  };

  // Reveal the chain one step at a time once asked (motion allowed).
  useEffect(() => {
    if (!asked || !showWork || reducedMotion || stepShown >= D.steps.length) return;
    const t = setTimeout(() => setStepShown((s) => s + 1), STEP_MS);
    return () => clearTimeout(t);
  }, [asked, showWork, reducedMotion, stepShown]);

  // Announce the landing once the chain finishes streaming.
  useEffect(() => {
    if (!asked || !showWork || reducedMotion || stepShown !== D.steps.length) return;
    setAnnouncement("The chain lands on 9 — the right count.");
  }, [asked, showWork, reducedMotion, stepShown]);

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
        Act 1 ended on an open question: can we <strong>guide a machine down a road</strong>? The
        first tool is the simplest — <em>show it one</em>. Put a worked, step-by-step example in
        the prompt, and the model imitates the shape of that reasoning. Give it{" "}
        <strong>room to think on the page</strong> and watch what changes.
      </p>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <section
          aria-label="The show-your-work demo"
          className="flex flex-col overflow-hidden rounded-lg border border-grid bg-surface"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-grid px-4 py-2 text-xs text-ink-muted">
            <span>one word problem · two ways to answer</span>
            <span className="rounded-full border border-wrong/60 bg-wrong/15 px-2 py-0.5 text-wrong">
              authored, quoted from Wei et al. Fig. 1 · no live model
            </span>
          </div>
          <div className="flex flex-col gap-3 p-4">
            <p className="font-mono text-xs uppercase tracking-wide text-ink-muted">you →</p>
            <p className="text-ink">{D.question}</p>

            <div className="flex flex-wrap items-center gap-4 border-t border-dashed border-grid pt-3">
              <Toggle
                label="Show your work"
                checked={showWork}
                onChange={flip}
                offLabel="off · blurt"
                onLabel="on · chain"
              />
              <button
                type="button"
                onClick={ask}
                disabled={asked}
                className="rounded bg-compute px-4 py-2 text-sm font-semibold text-canvas disabled:opacity-50"
              >
                Ask the model ▸
              </button>
            </div>

            <p className="font-mono text-xs uppercase tracking-wide text-ink-muted">
              the model →
            </p>
            {!asked ? (
              <p className="rounded-lg border border-dashed border-grid bg-surface-raised p-3 text-sm text-ink-muted">
                Set the toggle, then ask. Flip it after asking to compare the two behaviours on
                the same question.
              </p>
            ) : showWork ? (
              <div className="rounded-lg border-l-4 border-compute bg-surface-raised p-3">
                <ol className="flex flex-col gap-2">
                  {D.steps.slice(0, stepShown).map((s, i) => (
                    <li key={i} className="text-sm text-ink motion-safe:animate-fade-in">
                      <span className="mr-2 font-mono text-xs text-compute">{i + 1}</span>
                      {s}
                    </li>
                  ))}
                </ol>
                {chainDone ? (
                  <p className="mt-3 border-t border-grid pt-3 text-ink">
                    <span className="font-semibold text-correct">✓ {D.answer}</span>{" "}
                    <span className="text-sm text-ink-muted">
                      Each line set up the next; the answer fell out of the walk.
                    </span>
                  </p>
                ) : (
                  <p className="mt-2 flex items-center gap-2 text-sm text-ink-muted">
                    <span aria-hidden="true" className="animate-pulse text-compute">
                      ▍
                    </span>
                    thinking on the page…
                  </p>
                )}
              </div>
            ) : (
              <div className="rounded-lg border-l-4 border-wrong bg-wrong/15 p-3">
                <p className="text-ink">{D.blurt}</p>
                <p className="mt-2 text-sm text-wrong">
                  ✗ One forward leap, no room to think — and it is {D.blurtNumber}, not{" "}
                  {D.answerNumber}. The right count is {D.start} − {D.used} + {D.bought} ={" "}
                  {D.answerNumber}.
                </p>
              </div>
            )}

            <p className="border-t border-grid pt-3 text-sm text-ink-muted">
              This is <strong className="text-ink">chain-of-thought prompting</strong>: the
              few-shot examples in the prompt each carry a worked chain, so the model answers the
              new question the same way — reasoning first, answer last.
            </p>
          </div>
        </section>

        <figure
          aria-label="Flat versus steep: the scaling curve with and without chain of thought"
          className="m-0 flex flex-col overflow-hidden rounded-lg border border-grid bg-surface"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-grid px-4 py-2 text-xs text-ink-muted">
            <span>the same models, with and without the road</span>
            <span className="rounded-full border border-compute/60 px-2 py-0.5 text-compute">
              Wei et al. 2022 · GSM8K · redrawn
            </span>
          </div>
          <div className="flex flex-col gap-3 p-4">
            <LineChart
              title={`GSM8K solve rate for the PaLM family at 8, 62 and 540 billion parameters, log x axis, redrawn from Wei et al. 2022: standard prompting stays flat at ${sp.palm8Standard}, ${sp.palm62Standard} and ${sp.palm540Standard} percent, while chain-of-thought prompting climbs steeply from ${sp.palm8Cot} through ${sp.palm62Cot} to ${sp.palm540Cot} percent.`}
              points={standardCurve}
              secondary={{ points: cotCurve, label: "chain-of-thought prompting" }}
              primaryLabel="standard prompting (the blurt)"
              dots={[
                { x: 540, y: sp.palm540Cot, label: `${sp.palm540Cot}%` },
                { x: 540, y: sp.palm540Standard, label: `${sp.palm540Standard}%` },
              ]}
              logX
              xDomain={[7, 700]}
              yDomain={[0, 65]}
              xLabel="model size (billions of parameters, log scale)"
              yLabel="GSM8K solve rate (%)"
              width={460}
              height={280}
            />
            <figcaption className="flex flex-col gap-2 text-sm text-ink">
              <p>
                <strong>Flat versus steep.</strong> Same models, same questions. Standard
                prompting crawls from {sp.palm8Standard}% to {sp.palm540Standard}% as PaLM grows
                8B → 540B. Hand the same models a worked chain and the curve turns steep:{" "}
                {sp.palm540Cot}% at 540B — <strong>+{(cp.chainOfThought - cp.standard).toFixed(1)} points</strong>{" "}
                from prompting alone, past the fine-tuned state of the art of {cp.priorSota}%.
              </p>
              <p className="text-ink-muted">
                Honest footnote: at 8B the chain <em>hurts</em> ({sp.palm8Cot}% vs{" "}
                {sp.palm8Standard}%). The road only helps a walker big enough to follow it — the
                paper calls the ability emergent.
              </p>
            </figcaption>
          </div>
        </figure>
      </div>

      <div className="rounded-lg border-l-4 border-compute bg-surface p-4 text-ink">
        <strong>Why it works:</strong> a chain lets the model spend its effort a line at a time —
        each step conditions on the steps already written, so hard problems get broken into
        pieces the model can actually land. The page is its scratch paper.{" "}
        <em className="text-ink-muted">
          Which raises the next dial: if a longer walk buys a better answer, what sets how long
          the model may walk? Turn the page.
        </em>
      </div>

      <div className="flex flex-wrap gap-2">
        <CitationBadge citation={cot.citation} />
        <CitationBadge citation={scaling.citation} />
      </div>
      <p className="text-xs text-ink-muted">
        the word problem, the wrong blurt ({D.blurtNumber}), and the worked chain are quoted from
        Figure 1 of Wei et al. 2022 (arXiv:2201.11903); no live model runs on this page · the
        flat-vs-steep chart redraws the paper&apos;s per-scale GSM8K results for the PaLM family
        (appendix table, drawn as its Figure 4), not the paper&apos;s image · the +
        {(cp.chainOfThought - cp.standard).toFixed(1)}-point gain and the {cp.priorSota}% prior
        state of the art are the paper&apos;s own numbers
      </p>

      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>
      <PageNav n={PAGE_N} />
    </article>
  );
}
