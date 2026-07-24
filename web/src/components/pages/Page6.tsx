"use client";

/**
 * Page 6, "Thinking Longer" — the deck's first naming of inference-time
 * compute. Page 5 showed the road (a chain on the page); this page puts a
 * meter on it: every reasoning token is a unit of computation spent before
 * committing, so a budget on tokens directly sets the bar for how long the
 * model may think. The interactive is an authored five-step chain
 * (lib/authored THINK_BUDGET, 47 x 63 - 29 x 41 = 1,772) whose token costs
 * are its word counts: drag the compute budget from 0 to the cap and watch
 * the answer flip wrong -> right while a "serial computation depth" meter
 * fills. System 1 vs System 2 carries over from Act 1: blurting takes no
 * time; showing your work takes focus and time — for a model, that focus-
 * and-time currency IS tokens. The measured version of the trade is the
 * cited s1 result (budget forcing, 50% -> 57% on AIME24), teased here and
 * treated fully on page 15.
 *
 * The demonstration is authored and flagged; no live model. Theory grounding
 * cited in the footer: Kojima et al. 2022 (zero-shot "Let's think step by
 * step"), Feng et al. 2023 and Merrill & Sabharwal 2024 (chain length
 * extends the serial computation a transformer can perform).
 */

import { useRef, useState } from "react";
import { CitationBadge } from "@/components/CitationBadge";
import { PageNav } from "@/components/PageNav";
import { Slider } from "@/components/Slider";
import { THINK_BUDGET } from "@/lib/authored";
import { ACTS, getPage } from "@/lib/pages";
import { curves } from "@/lib/curves";
import { useStore } from "@/store/useStore";

const PAGE_N = 6;
const T = THINK_BUDGET;
const TOKEN_CAP = T.steps.reduce((n, s) => n + s.tokens, 0);

export function Page6() {
  const page = getPage(PAGE_N)!;
  const recordInteraction = useStore((s) => s.recordInteraction);

  const bf = curves.budgetForcing;
  const bp = bf.fit!.params;

  const [budget, setBudget] = useState(0);
  const [announcement, setAnnouncement] = useState("");
  const touchedRef = useRef(false);
  const landedRef = useRef(false);

  // Steps afford in order; a step runs only if its whole cost fits.
  let spent = 0;
  let depth = 0;
  for (const s of T.steps) {
    if (spent + s.tokens <= budget) {
      spent += s.tokens;
      depth += 1;
    } else {
      break;
    }
  }
  const done = depth >= T.steps.length;

  const onBudget = (v: number) => {
    if (!touchedRef.current) {
      touchedRef.current = true;
      recordInteraction(PAGE_N);
    }
    setBudget(v);
    if (!landedRef.current && v >= TOKEN_CAP) {
      landedRef.current = true;
      setAnnouncement(
        `Budget ${TOKEN_CAP} tokens: the chain completes at depth ${T.steps.length} and the answer flips to ${T.display} — correct.`,
      );
    } else if (v === 0) {
      setAnnouncement(`Budget zero: the model blurts ${T.blurt} — wrong.`);
    }
  };

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
        A chain is written one token at a time, and <strong>every token is computation</strong> the
        model spends before committing. So the dial is blunt and direct: cap the tokens and you
        have set the bar for how long the model may think. More tokens, more serial computation —
        and a higher chance the answer lands.
      </p>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <section
          aria-label="The compute-budget demo"
          className="flex flex-col overflow-hidden rounded-lg border border-grid bg-surface"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-grid px-4 py-2 text-xs text-ink-muted">
            <span>one hard product · a budget on its thinking</span>
            <span className="rounded-full border border-wrong/60 bg-wrong/15 px-2 py-0.5 text-wrong">
              authored chain · token costs are its word counts · no live model
            </span>
          </div>
          <div className="flex flex-col gap-4 p-4">
            <p className="text-lg text-ink">{T.question}</p>

            <Slider
              label="Compute budget"
              min={0}
              max={TOKEN_CAP}
              value={budget}
              onChange={onBudget}
              suffix=" tokens"
            />

            <div className="flex flex-wrap items-center gap-3">
              <p className="text-xs uppercase tracking-wide text-ink-muted">
                serial computation depth
              </p>
              <div className="flex items-center gap-1" aria-hidden="true">
                {T.steps.map((s, i) => (
                  <span
                    key={i}
                    className={`h-3 w-7 rounded-sm ${i < depth ? "bg-compute" : "border border-grid bg-surface-raised"}`}
                  />
                ))}
              </div>
              <p className="font-mono text-sm tabular-nums text-ink">
                depth {depth} of {T.steps.length}
              </p>
              <p className="font-mono text-xs tabular-nums text-ink-muted">
                {spent} of {TOKEN_CAP} tokens spent
              </p>
            </div>

            <ol className="flex flex-col gap-1.5 border-t border-dashed border-grid pt-3">
              {T.steps.map((s, i) => {
                const afforded = i < depth;
                return (
                  <li
                    key={i}
                    className={`flex items-baseline gap-2 text-sm ${afforded ? "text-ink" : "text-ink-muted"}`}
                  >
                    <span className="font-mono text-xs text-compute">{i + 1}</span>
                    <span className="flex-1">{afforded ? s.text : "· · · (not yet afforded)"}</span>
                    <span className="font-mono text-xs tabular-nums text-ink-muted">
                      {s.tokens} tok
                    </span>
                  </li>
                );
              })}
            </ol>

            {done ? (
              <div className="rounded-lg border-l-4 border-correct bg-correct/15 p-3">
                <p className="text-ink">
                  <span className="font-semibold text-correct">✓ {T.display}.</span>{" "}
                  <span className="text-sm text-ink-muted">
                    The full chain fit the budget: five dependent steps, each conditioning on the
                    last, landed the answer.
                  </span>
                </p>
              </div>
            ) : depth === 0 ? (
              <div className="rounded-lg border-l-4 border-wrong bg-wrong/15 p-3">
                <p className="text-ink">
                  <span className="font-semibold text-wrong">✗ {T.blurt}.</span>{" "}
                  <span className="text-sm text-ink-muted">
                    Zero budget is System 1: one forward leap, a confident near-miss (a borrow
                    slipped in the subtraction it never wrote down).
                  </span>
                </p>
              </div>
            ) : (
              <div className="rounded-lg border-l-4 border-wrong bg-wrong/15 p-3">
                <p className="text-ink">
                  <span className="font-semibold text-wrong">✗ out of budget mid-chain.</span>{" "}
                  <span className="text-sm text-ink-muted">
                    The chain was cut after step {depth}; forced to commit early, the model&apos;s
                    guess is no better than the blurt: {T.blurt}.
                  </span>
                </p>
              </div>
            )}
          </div>
        </section>

        <div className="flex flex-col gap-4">
          <section aria-label="System 1 versus System 2, in tokens" className="flex flex-col gap-3">
            <div className="grid items-stretch gap-3 sm:grid-cols-2">
              <div className="flex flex-col rounded-lg border-l-4 border-grid bg-surface p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  System 1 · the blurt
                </p>
                <p className="mt-1 text-sm text-ink">
                  A handful of tokens: the answer and nothing else. Cheap, instant — and here,
                  wrong.
                </p>
                <p className="mt-2 font-mono text-sm text-ink-muted">
                  {T.blurt.trim().split(/\s+/).length} token · ✗
                </p>
              </div>
              <div className="flex flex-col rounded-lg border-l-4 border-compute bg-surface p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-compute">
                  System 2 · the chain
                </p>
                <p className="mt-1 text-sm text-ink">
                  The extra tokens you spend — and what they buy: each one is another unit of
                  serial computation toward the answer.
                </p>
                <p className="mt-2 font-mono text-sm text-ink-muted">{TOKEN_CAP} tokens · ✓</p>
              </div>
            </div>
            <div className="rounded-lg border-l-4 border-compute bg-surface p-4 text-ink">
              Just as when a person solves a problem: blurting takes no time, but showing your
              work step by step takes <strong>focus and time</strong>. The only difference for a
              model is the currency — its focus and time <strong>are tokens</strong>.
            </div>
          </section>

          <aside
            aria-label="The measured version of this trade"
            className="overflow-hidden rounded-lg border border-grid bg-surface"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-grid px-4 py-2 text-xs text-ink-muted">
              <span>the same dial, measured for real</span>
              <span className="rounded-full border border-compute/60 px-2 py-0.5 text-compute">
                s1-32B · AIME24 · Muennighoff et al. 2025
              </span>
            </div>
            <div className="flex flex-col gap-2 p-4">
              <p className="text-sm text-ink">
                This trade is not just a demo. Forcing a real model to think longer (by refusing
                to let it stop) moves competition-math accuracy from{" "}
                <strong className="font-mono">{bp.start}%</strong> to{" "}
                <strong className="font-mono">{bp.end}%</strong> — no retraining, only more
                thinking tokens.
              </p>
              <p className="text-sm text-ink-muted">
                The lever that does it — the &ldquo;Wait&rdquo; button — gets its own page (15).
              </p>
            </div>
          </aside>

          <div className="rounded-lg border-l-4 border-compute bg-surface p-4 text-ink">
            <strong>This is inference-time scaling in its simplest form:</strong> trade compute at
            answer time for accuracy. A smaller model that thinks can land answers a bigger
            blurt misses. The next pages explore methods that push the same trade further.
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <CitationBadge citation={bf.citation} />
      </div>
      <p className="text-xs text-ink-muted">
        the five-step chain is an authored demonstration; each step&apos;s token cost is its
        whitespace word count and every intermediate value is recomputed by the test suite · the
        50% → 57% budget-forcing result is Muennighoff et al. 2025 (s1-32B, AIME24), treated in
        full on page 15 · grounding: Kojima et al. 2022, &ldquo;Large Language Models are
        Zero-Shot Reasoners&rdquo; (NeurIPS 2022, arXiv:2205.11916) · theory: Feng et al. 2023
        (NeurIPS 2023, arXiv:2305.15408) and Merrill &amp; Sabharwal 2024 (ICLR 2024,
        arXiv:2310.07923) — longer chains extend the serial computation a transformer can perform
      </p>

      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>
      <PageNav n={PAGE_N} />
    </article>
  );
}
