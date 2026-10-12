"use client";

/**
 * Page 4, "From Reasoning to Inference-Time Scaling", the Act 1 finale. Reasoning is how a
 * model can emulate System 2 thinking, and any one problem admits more than one
 * way to reason it through. The lede names the working-out (reasoning), then one
 * problem, 350 × 638, is solved three ways: standard long multiplication,
 * Japanese line multiplication, and Vedic multiplication. A dropdown picks the
 * method; a stepped, animated walkthrough drives it; every method lands on the
 * same 223,300. Step 2 lays the trade-offs side by side: each method costs work
 * of a different kind and has its own common tradeoffs. Step 3 generalises:
 * planning, diagnosis and debugging take the same shape (a start, a goal, steps
 * between, more than one route), so reasoning is not just mathematics. The closing box states
 * the page's claim in one sentence: reasoning is diverse pathfinding from prior
 * knowledge. The page ends on one shaded closing box, set upright (no italics).
 * House rules: no Act 2+ term is named here except in the closing box, which
 * defines inference-time scaling for the acts that follow; and nothing pops in: the cards and the closing box are on screen from first paint; only
 * the walkthrough animates, and only when asked.
 *
 * Layout: page 1's per-step grid. The intro paragraph runs full width above a
 * two-column grid; each numbered step (1. three ways to work out 350 × 638 ·
 * 2. the methods and their trade-offs) and the closing box is a left-hand cell
 * followed immediately by its own margin cell, so notes scroll with the step
 * they belong to. Step 1's margin holds the Try it note and, below it, the
 * page's one bibliographic cite (the Vedic method's source).
 *
 * All walkthrough numbers live in lib/authored MULT_METHODS and are recomputed
 * from the factors' digits by src/lib/act1.test.ts.
 */

import { useEffect, useId, useMemo, useState } from "react";
import { Handoff } from "@/components/Handoff";
import { RefItem } from "@/components/Cite";
import { PageNav } from "@/components/PageNav";
import { MULT_METHODS, type MultMethodKey } from "@/lib/authored";
import { ACTS, getPage } from "@/lib/pages";
import { useStore } from "@/store/useStore";

const PAGE_N = 4;

/** Step 3's everyday cases: the same start, goal and steps, outside mathematics. */
const REASONING_CASES = [
  {
    domain: "Planning",
    question: "When should you leave for a 10 a.m. flight?",
    start: "the drive takes 40 minutes, traffic doubles it at rush hour, and security takes 30.",
    routes: "work backwards from the gate, or forwards from leaving home. Both should land on the same time to go.",
  },
  {
    domain: "Diagnosis",
    question: "Why won't the car start?",
    start: "the lights come on, but the engine only clicks.",
    routes: "rule out the likeliest cause first, or the cheapest to check. Either way, each test narrows the list.",
  },
  {
    domain: "Debugging",
    question: "Why does the program crash on large inputs?",
    start: "it works on small inputs and fails on large ones.",
    routes: "trace the input forward through the code, or work back from the error. Each step keeps or rules out a suspect.",
  },
] as const;
const M = MULT_METHODS;
const P = M.problem;

/** Page 4's one reference, numbered in order of first appearance. */
const REF = { vedic: 1 } as const;

/** Milliseconds between auto-advanced steps when Play is pressed. */
const PLAY_MS = 900;

const fmt = (n: number) => n.toLocaleString("en-US");

/** A margin note that sits beside its step and scrolls with the page. */
function Note({ kicker, children }: { kicker: string; children: React.ReactNode }) {
  return (
    <aside className="flex flex-col gap-2 text-sm text-ink-muted">
      <p className="text-xs font-semibold font-eyebrow uppercase tracking-wide text-ink-muted">{kicker}</p>
      {children}
    </aside>
  );
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Steps per method: one per structured entry, plus the shared landing step. */
function maxStepOf(method: MultMethodKey): number {
  if (method === "standard") return M.standard.rows.length + 1;
  if (method === "lines") return M.lines.diagonals.length + 1;
  return M.vedic.columns.length + 1;
}

/** Narration for the current step (step 0 is the setup prompt). */
function narrationOf(method: MultMethodKey, step: number): string {
  if (step === 0) return "Press Next (or Play) to work it through.";
  const max = maxStepOf(method);
  if (step >= max) {
    const landing =
      method === "standard" ? M.standard.landing : method === "lines" ? M.lines.landing : M.vedic.landing;
    return `${landing} Same destination: ${P.display}.`;
  }
  if (method === "standard") return M.standard.rows[step - 1].say;
  if (method === "lines") return M.lines.diagonals[step - 1].say;
  return M.vedic.columns[step - 1].say;
}

/* ------------------------- standard: the school column ------------------------- */

function StandardPanel({ step }: { step: number }) {
  const done = step >= M.standard.rows.length + 1;
  return (
    <div className="flex flex-col items-center gap-1 py-2 font-mono text-lg text-ink">
      <div className="flex w-full max-w-[300px] flex-col items-stretch gap-1">
        <p className="text-right">{fmt(P.a)}</p>
        <p className="border-b border-ink pb-1 text-right">× {fmt(P.b)}</p>
        {M.standard.rows.map((r, i) => {
          const shown = step >= i + 1;
          const current = step === i + 1;
          return (
            <div
              key={r.partial}
              className={`flex items-baseline justify-between gap-4 ${
                shown ? (current ? "text-compute-ink" : "") : "text-ink-muted"
              }`}
            >
              <span className="text-xs text-ink-muted">
                {P.a} × {r.digit * r.placeValue}
              </span>
              <span>{shown ? fmt(r.partial) : "· · ·"}</span>
            </div>
          );
        })}
        <div
          className={`flex items-baseline justify-between gap-4 border-t border-ink pt-1 ${
            done ? "font-bold text-correct-ink" : "text-ink-muted"
          }`}
        >
          <span className="text-xs text-ink-muted">sum</span>
          <span>{done ? fmt(P.answer) : "· · ·"}</span>
        </div>
      </div>
    </div>
  );
}

/* ---------------------- lines: bundles, crossings, columns --------------------- */

/**
 * Geometry: A-digit bundles are slope −1 lines (x + y = c), B-digit bundles
 * slope +1 (x − y = d); a pair of intercepts meets at ((c+d)/2, (c−d)/2), so
 * clusters with the same place value share an x — the "columns" the method
 * counts. A zero digit draws one dashed ghost line and contributes nothing.
 */
const LG = { C0: 210, D0: -30, G: 84, S: 9, W: 348, H: 240 };

function interceptsFor(base: number, group: number, count: number): number[] {
  const center = base + group * LG.G;
  if (count === 0) return [center]; // the ghost line
  return Array.from({ length: count }, (_, t) => center + (t - (count - 1) / 2) * LG.S);
}

function LinesPanel({ step }: { step: number }) {
  const nDiag = M.lines.diagonals.length;
  const done = step >= nDiag + 1;
  // Column k = i + j (0 = ten-thousands, 4 = units); walkthrough goes units-first.
  const currentK = step >= 1 && step <= nDiag ? 5 - step : null;

  const { aLines, bLines, dots } = useMemo(() => {
    const aInts = P.aDigits.map((d, i) => interceptsFor(LG.C0, i, d));
    const bInts = P.bDigits.map((d, j) => interceptsFor(LG.D0, j, d));
    const dLo = LG.D0 - 46;
    const dHi = LG.D0 + 2 * LG.G + 46;
    const cLo = LG.C0 - 46;
    const cHi = LG.C0 + 2 * LG.G + 46;
    const aLines = aInts.flatMap((cs, i) =>
      cs.map((c) => ({
        ghost: P.aDigits[i] === 0,
        x1: (c + dLo) / 2,
        y1: (c - dLo) / 2,
        x2: (c + dHi) / 2,
        y2: (c - dHi) / 2,
      })),
    );
    const bLines = bInts.flatMap((ds, j) =>
      ds.map((d) => ({
        ghost: P.bDigits[j] === 0,
        x1: (cLo + d) / 2,
        y1: (cLo - d) / 2,
        x2: (cHi + d) / 2,
        y2: (cHi - d) / 2,
      })),
    );
    // Crossing dots, grouped by column k = i + j (ghost bundles contribute none).
    const dots: Record<number, { x: number; y: number }[]> = {};
    P.aDigits.forEach((ad, i) => {
      if (ad === 0) return;
      P.bDigits.forEach((bd, j) => {
        if (bd === 0) return;
        const k = i + j;
        dots[k] ??= [];
        for (const c of aInts[i]) {
          for (const d of bInts[j]) {
            dots[k].push({ x: (c + d) / 2, y: (c - d) / 2 });
          }
        }
      });
    });
    return { aLines, bLines, dots };
  }, []);

  const colX = (k: number) => (LG.C0 + LG.D0) / 2 + (k * LG.G) / 2;

  return (
    <div className="flex flex-col items-center gap-2 py-1">
      <svg
        viewBox={`0 0 ${LG.W} ${LG.H}`}
        width="100%"
        className="max-w-[420px]"
        role="img"
        aria-label={`Line multiplication of ${P.a} by ${P.b}: bundles of 3, 5 and a ghost line cross bundles of 6, 3 and 8; the crossings in each column count 0, 40, 39, 39 and 18, read right to left with carries to reach ${P.display}.`}
      >
        {currentK != null ? (
          <rect
            x={colX(currentK) - 19}
            y={4}
            width={38}
            height={LG.H - 30}
            rx={6}
            className="fill-compute/15"
          />
        ) : null}
        {[...aLines, ...bLines].map((l, i) => (
          <line
            key={i}
            x1={l.x1}
            y1={l.y1}
            x2={l.x2}
            y2={l.y2}
            className={l.ghost ? "stroke-ink-muted" : "stroke-ink"}
            strokeWidth={l.ghost ? 1 : 1.3}
            strokeDasharray={l.ghost ? "5 4" : undefined}
            opacity={l.ghost ? 0.5 : 0.75}
          />
        ))}
        {Object.entries(dots).map(([k, pts]) => {
          const kk = Number(k);
          const revealed = step >= 5 - kk; // units-first reveal order
          if (!revealed) return null;
          const isCurrent = currentK === kk;
          return pts.map((p, i) => (
            <circle
              key={`${k}-${i}`}
              cx={p.x}
              cy={p.y}
              r={isCurrent ? 3 : 2}
              className={isCurrent ? "fill-compute" : "fill-correct"}
            />
          ));
        })}
        {M.lines.diagonals.map((d, di) => {
          const kk = 4 - di;
          const revealed = step >= di + 1;
          return (
            <text
              key={d.place}
              x={colX(kk)}
              y={LG.H - 8}
              textAnchor="middle"
              className={`text-[13px] font-semibold ${
                revealed ? (currentK === kk ? "fill-compute-ink" : "fill-ink") : "fill-ink-muted"
              }`}
            >
              {revealed ? d.sum : "?"}
            </text>
          );
        })}
      </svg>
      <p className={`font-mono text-lg ${done ? "font-bold text-correct-ink" : "text-ink-muted"}`}>
        {done ? `carry the columns → ${P.display}` : "carry the columns → ?"}
      </p>
    </div>
  );
}

/* ---------------------- vedic: vertically and crosswise ------------------------ */

function VedicPanel({ step }: { step: number }) {
  const nCols = M.vedic.columns.length;
  const done = step >= nCols + 1;
  const col = step >= 1 && step <= nCols ? M.vedic.columns[step - 1] : null;
  // Highlighted digit indices (most-significant-first) for the current column.
  const active = useMemo(() => {
    if (!col) return { a: new Set<number>(), b: new Set<number>() };
    const u = M.vedic.columns.indexOf(col);
    const a = new Set<number>();
    const b = new Set<number>();
    for (let i = 0; i <= 2; i++) {
      const j = 4 - u - i;
      if (j >= 0 && j <= 2) {
        a.add(i);
        b.add(j);
      }
    }
    return { a, b };
  }, [col]);

  // Result readout, filled right to left; the last column writes "22".
  const written = M.vedic.columns.slice(0, Math.min(step, nCols)).map((c) => String(c.digit)).reverse().join("");
  const slots = ("······" + written).slice(-6).split("");

  const cell = (d: number, hot: boolean, key: string) => (
    <span
      key={key}
      className={`flex h-9 w-9 items-center justify-center rounded border font-mono text-lg ${
        hot ? "border-compute bg-compute/20 font-bold text-ink" : "border-grid text-ink"
      }`}
    >
      {d}
    </span>
  );

  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <div className="flex flex-col gap-1.5">
        <div className="flex gap-1.5">{P.aDigits.map((d, i) => cell(d, active.a.has(i), `a${i}`))}</div>
        <div className="flex gap-1.5">{P.bDigits.map((d, j) => cell(d, active.b.has(j), `b${j}`))}</div>
      </div>
      {col ? (
        <p className="font-mono text-sm text-ink">
          {col.pairs.map(([x, y]) => `${x}×${y}`).join(" + ")} = {col.sum}
          {col.carryIn > 0 ? ` · +carry ${col.carryIn} = ${col.sum + col.carryIn}` : ""}
          {col.carryOut > 0 ? (
            <span className="ml-2 rounded-full border border-compute px-2 py-0.5 text-xs text-compute-ink">
              carry {col.carryOut}
            </span>
          ) : null}
        </p>
      ) : (
        <p className="font-mono text-sm text-ink-muted">
          {done ? M.vedic.landing : "one column at a time, units first"}
        </p>
      )}
      <div className="flex gap-1.5" aria-hidden="true">
        {slots.map((s, i) => (
          <span
            key={i}
            className={`flex h-9 w-9 items-center justify-center rounded border font-mono text-lg ${
              s === "·" ? "border-dashed border-grid text-ink-muted" : "border-correct/60 bg-correct/15 font-bold text-ink"
            }`}
          >
            {s}
          </span>
        ))}
      </div>
      <p className={`font-mono text-lg ${done ? "font-bold text-correct-ink" : "sr-only"}`}>
        {done ? `= ${P.display}` : ""}
      </p>
    </div>
  );
}

/* --------------------------------- the page ----------------------------------- */

export function Page4() {
  const page = getPage(PAGE_N)!;
  const recordInteraction = useStore((s) => s.recordInteraction);
  const selectId = useId();

  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    setReducedMotion(prefersReducedMotion());
  }, []);

  const [method, setMethod] = useState<MultMethodKey>("standard");
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [touched, setTouched] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const maxStep = maxStepOf(method);
  const narration = narrationOf(method, step);
  const meta = M[method];

  const touch = () => {
    if (!touched) {
      setTouched(true);
      recordInteraction(PAGE_N);
    }
  };

  const pickMethod = (key: MultMethodKey) => {
    touch();
    setMethod(key);
    setStep(0);
    setPlaying(false);
    setAnnouncement(`Method: ${M[key].name}.`);
  };

  const go = (next: number) => {
    touch();
    setPlaying(false);
    const clamped = Math.min(maxStep, Math.max(0, next));
    setStep(clamped);
    setAnnouncement(narrationOf(method, clamped));
  };

  const play = () => {
    touch();
    setPlaying(true);
    setAnnouncement("Playing the walkthrough.");
  };

  // Auto-advance while playing (motion allowed only); stop at the landing.
  useEffect(() => {
    if (!playing || reducedMotion) return;
    if (step >= maxStep) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => {
      const nextStep = Math.min(maxStep, step + 1);
      setStep(nextStep);
      setAnnouncement(narrationOf(method, nextStep));
    }, PLAY_MS);
    return () => clearTimeout(t);
  }, [playing, reducedMotion, step, maxStep, method]);

  return (
    <article className="flex flex-col gap-6">
      <p className="text-xs font-eyebrow uppercase tracking-wide text-ink-muted">
        Act {page.act} · {ACTS[page.act].title}
      </p>
      <h1 className="text-3xl font-bold text-ink">
        <span className="font-mono text-ink-muted">{page.n}. </span>
        {page.title}
      </h1>
      {/* The lede names reasoning; step 2 owns the convergence and the trade-offs. */}
      {/* Held to the content column: the margin is the notes column (15rem) plus the
          grid's column gap (2rem), so its right edge meets the body text's. */}
      <p className="text-lg text-ink-muted lg:mr-[17rem]">
        Working a problem out, instead of recognizing the answer, has a name:{" "}
        <strong className="text-ink">reasoning</strong>. If you&apos;ve ever compared answers with a
        classmate, you know there is rarely only one way to reason through a problem.
      </p>

      {/* Each step (left) sits beside its own note (right); the whole page scrolls. */}
      <div className="grid gap-x-8 gap-y-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
        {/* Step 1: work one method through */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">1. Three ways to work out 350 × 638</h2>
          {/* The opening statement frames the walkthrough; the Try it note gives the instruction. */}
          <p className="text-ink">
            The same multiplication can be worked out in very different ways. Here are three, each
            from a different tradition.
          </p>
          <section
            aria-label="Three ways to work out 350 × 638"
            className="flex flex-col gap-4 rounded-lg bg-surface p-4"
          >
            <div className="flex flex-wrap items-center gap-3">
              <label htmlFor={selectId} className="text-sm font-semibold text-ink">
                Method
              </label>
              <select
                id={selectId}
                value={method}
                onChange={(e) => pickMethod(e.target.value as MultMethodKey)}
                className="rounded border border-grid bg-canvas px-3 py-2 text-sm text-ink"
              >
                <option value="standard">{M.standard.name}</option>
                <option value="lines">{M.lines.name}</option>
                <option value="vedic">{M.vedic.name}</option>
              </select>
            </div>

            <div className="rounded-lg border border-grid bg-surface-raised px-3 py-2">
              {method === "standard" ? <StandardPanel step={step} /> : null}
              {method === "lines" ? <LinesPanel step={step} /> : null}
              {method === "vedic" ? <VedicPanel step={step} /> : null}
            </div>

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
                disabled={step >= maxStep}
                className="rounded bg-compute px-4 py-2 text-sm font-semibold text-ink disabled:opacity-50"
              >
                Next ▸
              </button>
              {!reducedMotion ? (
                <button
                  type="button"
                  onClick={play}
                  disabled={playing || step >= maxStep}
                  className="rounded border border-compute px-3 py-2 text-sm font-semibold text-compute-ink disabled:opacity-50"
                >
                  ▶ Play
                </button>
              ) : null}
              <span className="font-mono text-xs tabular-nums text-ink-muted">
                step {step} of {maxStep}
              </span>
            </div>

            <p className="min-h-[1.5rem] text-ink">
              {step >= maxStep ? <span aria-hidden="true" className="text-correct-ink">✓ </span> : null}
              {narration}
            </p>

          </section>
        </section>
        <div className="flex flex-col gap-6 lg:pt-9">
          <Note kicker="Try it">
            <p>Pick a method, work it through, then try another.</p>
          </Note>
          <Note kicker="References">
            <RefItem n={REF.vedic}>
              Bharati Krishna Tirtha, <em>Vedic Mathematics</em> (1965).
            </RefItem>
          </Note>
        </div>

        {/* Step 2: the three methods side by side */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            2. The methods and their trade-offs
          </h2>
          <section aria-label="The methods and their trade-offs" className="flex flex-col gap-3">
            {/* The opening statement: every road arrives, each at its own cost; the cards say what. */}
            <p className="text-ink">
              All three methods of reasoning through the problem land on the correct answer. Each
              trades one kind of effort for another, depending on what it asks you to already know.
            </p>
            <div className="grid items-stretch gap-3 md:grid-cols-3">
              {([M.standard, M.lines, M.vedic] as const).map((m) => (
                <div
                  key={m.key}
                  className="flex flex-col rounded-lg border-l-4 border-grid bg-surface p-4"
                >
                  <p className="text-xs font-semibold font-eyebrow uppercase tracking-wide text-ink-muted">
                    {m.name}
                  </p>
                  <p className="mt-2 text-sm text-ink-muted">
                    <strong className="text-wrong-ink">Trade-off:</strong> {m.limitation}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </section>
        <div aria-hidden="true" />

        {/* Step 3: the same shape outside mathematics. The multiplication was a stand-in:
            any problem worked out rather than recognised has a start (what you know), a
            goal, and steps between them, with more than one route. Three everyday cases,
            set like step 2's cards. */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">3. Reasoning beyond mathematics</h2>
          <p className="text-ink">
            The multiplication was a stand-in. Any problem you cannot answer on sight, but can work
            out from what you already know, has the same shape: a starting point, a goal, and steps
            in between, with more than one route from one to the other.
          </p>
          <section aria-label="Reasoning beyond mathematics" className="grid items-stretch gap-3 md:grid-cols-3">
            {REASONING_CASES.map((c) => (
              <div key={c.domain} className="flex flex-col gap-2 rounded-lg border-l-4 border-grid bg-surface p-4">
                <p className="text-xs font-semibold font-eyebrow uppercase tracking-wide text-ink-muted">
                  {c.domain}
                </p>
                <p className="text-sm font-semibold text-ink">{c.question}</p>
                <p className="text-sm text-ink-muted">
                  <strong className="text-ink">Start from:</strong> {c.start}
                </p>
                <p className="text-sm text-ink-muted">
                  <strong className="text-ink">Two routes:</strong> {c.routes}
                </p>
              </div>
            ))}
          </section>
          <p className="text-ink">
            In each, a quick guess can sound right and still be wrong. Working it through one
            checkable step at a time is what makes the answer worth trusting. Only the knowledge each
            step draws on changes; the shape of the work stays the same.
          </p>
          {/* Scopes the story, from the section's own premise (reasoning works from what
              you already know): page 2 closed the knowledge gap with a lookup, which no
              later page develops. Say so, and say why reasoning is the thread followed. */}
          <p className="text-ink">
            Reasoning works from what you already know, so it can spot a missing fact but not supply
            it. On page 2, closing the knowledge gap took a lookup in a current source, which is
            called retrieval. This story sets retrieval aside to follow reasoning, the part that fixed
            the bias and can work out problems nobody has solved yet.
          </p>
        </section>
        <div aria-hidden="true" />

        {/* The closing box: the page's claim, Act 1's open question, and the handoff to Act 2. */}
        <section className="flex min-w-0 flex-col gap-3">
          <Handoff>
            <p>
              There is more than one path from what we know to an answer, and reasoning is how we
              walk them. It pays off most on the hardest questions.
            </p>
            {/* The one place Act 1 names the term: defined here, used from Act 2 on. */}
            <p>
              Running a trained model to get an answer is called <strong>inference</strong>. Giving it
              more computation at that moment, to reason for longer, try more than one path, or check
              its work, is <strong>inference-time scaling</strong>: the model itself stays the same,
              and only the work spent on each answer grows.
            </p>
            <p>
              Act 1 ends on an open question:{" "}
              <strong>
                can a large language model learn to reason through a problem instead of answering on
                reflex?
              </strong>{" "}
              Act 2 builds that toolbox, one technique at a time, for getting a model to reason its
              way to an answer.
            </p>
          </Handoff>
        </section>
        {/* Beside the definition: the other names the same idea goes by, so a reader
            meeting them elsewhere knows they are one thing. */}
        <Note kicker="Also called">
          <p>
            You will also see inference-time scaling called <em>test-time scaling</em>,{" "}
            <em>test-time compute</em>, or <em>inference-time compute</em>. All name the same idea:
            spending more computation on each answer, not on training.
          </p>
          <p>
            Models built to do this are often called <em>reasoning models</em>, and the extra work
            they write out, <em>thinking</em> or <em>reasoning tokens</em>.
          </p>
        </Note>
      </div>

      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>
      <PageNav n={PAGE_N} />
    </article>
  );
}
