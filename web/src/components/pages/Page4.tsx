"use client";

/**
 * Page 4, "Reasoning: Diverse Pathfinding" — the Act 1 finale. It catches page 3's
 * pivot (spend the effort when the question arrives, not up front) and names
 * that working-out: reasoning. Page 1's 17 × 24 is recalled, then escalated to
 * a bigger instance, 350 × 638, solved three ways: standard long
 * multiplication, Japanese line multiplication, and Indian Vedic
 * (Urdhva-Tiryagbhyam). A dropdown picks the road; a stepped, animated
 * walkthrough drives it; every road lands on the same 223,300. The meaning:
 * journeys differ, destinations do not, and every method has its own
 * limitations — reasoning is inherently diverse pathfinding from prior
 * knowledge. Act 1 then closes on open questions (can we guide a machine down
 * different roads? why can't it chart its own?) that hand off to Act 2's
 * toolbox. House rules: the Act 2+ jargon is never named here (the /inference/
 * test ban now covers all of Act 1), and nothing pops in — the meaning band
 * and the finale are on screen from first paint; only the walkthrough
 * animates, and only when asked.
 *
 * Layout: page 1's per-step grid. The intro paragraph runs full width above a
 * two-column grid; each numbered step (1. walk a road · 2. three roads, three
 * tolls · 3. where this leaves us) is a left-hand cell followed immediately by
 * its own margin cell, so notes scroll with the step they belong to. There is
 * no sticky instructions rail and no "how to read this page" list: the controls
 * narrate themselves (button labels, the "step N of M" counter, the live
 * narration line) and PageNav carries page-to-page movement. The page's one
 * bibliographic cite — the Vedic sutra's source — sits in step 1's margin as a
 * bare reference note and appears nowhere else.
 *
 * All walkthrough numbers live in lib/authored MULT_METHODS and are recomputed
 * from the factors' digits by src/lib/act1.test.ts.
 */

import { useEffect, useId, useMemo, useState } from "react";
import { RefItem } from "@/components/Cite";
import { PageNav } from "@/components/PageNav";
import { GAME_ROUNDS, MULT_METHODS, type MultMethodKey } from "@/lib/authored";
import { ACTS, getPage } from "@/lib/pages";
import { useStore } from "@/store/useStore";

const PAGE_N = 4;
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
    <aside className="flex flex-col gap-2 text-sm text-ink-muted lg:pt-9">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{kicker}</p>
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
  if (step === 0) return "Press Next (or Play) to walk the road.";
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
                shown ? (current ? "text-compute" : "") : "text-ink-muted"
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
            done ? "font-bold text-correct" : "text-ink-muted"
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
                revealed ? (currentK === kk ? "fill-compute" : "fill-ink") : "fill-ink-muted"
              }`}
            >
              {revealed ? d.sum : "?"}
            </text>
          );
        })}
      </svg>
      <p className={`font-mono text-lg ${done ? "font-bold text-correct" : "text-ink-muted"}`}>
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
            <span className="ml-2 rounded-full border border-compute px-2 py-0.5 text-xs text-compute">
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
      <p className={`font-mono text-lg ${done ? "font-bold text-correct" : "sr-only"}`}>
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
    setAnnouncement(`Method: ${M[key].name}. ${M[key].origin}.`);
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
      <p className="text-xs uppercase tracking-wide text-ink-muted">
        Act {page.act} · {ACTS[page.act].title}
      </p>
      <h1 className="text-3xl font-bold text-ink">
        <span className="font-mono text-ink-muted">{page.n}. </span>
        {page.title}
      </h1>
      {/* The lede poses the walk; step 2 owns the convergence. It used to give away
          "three cultures built three roads to the same 223,300" here, and then step 2's
          verdict box and step 3 said it again. */}
      <p className="max-w-2xl text-lg text-ink-muted">
        Working a problem out instead of looking it up has a name:{" "}
        <strong className="text-ink">reasoning</strong>. And here is the surprise: it is never one
        fixed procedure. Page 1 gave you{" "}
        <strong className="font-mono text-ink">{GAME_ROUNDS[1].prompt}</strong> and one way to build
        it. Take a bigger one, <strong className="font-mono text-ink">{P.a} × {P.b}</strong>, and
        three cultures worked it three different ways, each a real method with its own strengths and
        weaknesses. Pick one below, walk it to the end, then try another and compare what they cost.
      </p>

      {/* Each step (left) sits beside its own note (right); the whole page scrolls. */}
      <div className="grid gap-x-8 gap-y-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
        {/* Step 1 — walk one road */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            1. Pick a road and walk it
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              one problem · three methods · authored walkthroughs
            </span>
          </h2>
          <section
            aria-label="One problem, three roads"
            className="flex flex-col gap-4 rounded-lg border-l-4 border-compute bg-surface p-4"
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
              <span className="text-sm text-ink-muted">{meta.origin}</span>
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
                className="rounded bg-compute px-4 py-2 text-sm font-semibold text-canvas disabled:opacity-50"
              >
                Next ▸
              </button>
              {!reducedMotion ? (
                <button
                  type="button"
                  onClick={play}
                  disabled={playing || step >= maxStep}
                  className="rounded border border-compute px-3 py-2 text-sm font-semibold text-compute disabled:opacity-50"
                >
                  ▶ Play
                </button>
              ) : null}
              <span className="font-mono text-xs tabular-nums text-ink-muted">
                step {step} of {maxStep}
              </span>
            </div>

            <p className="min-h-[1.5rem] text-ink">
              {step >= maxStep ? <span aria-hidden="true" className="text-correct">✓ </span> : null}
              {narration}
            </p>

            <p className="border-t border-grid pt-3 text-sm text-ink-muted">
              <strong className="text-wrong">The limit of this road:</strong> {meta.limitation}
            </p>
          </section>
        </section>
        <Note kicker="References">
          <RefItem n={REF.vedic}>
            Bharati Krishna Tirtha, <em>Vedic Mathematics</em> (1965).
          </RefItem>
        </Note>

        {/* Step 2 — the three roads side by side */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            2. Three roads, three tolls
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              what each method is good at, and what it costs
            </span>
          </h2>
          <section aria-label="Three journeys, one destination" className="flex flex-col gap-3">
            <div className="grid items-stretch gap-3 md:grid-cols-3">
              {([M.standard, M.lines, M.vedic] as const).map((m) => (
                <div
                  key={m.key}
                  className="flex flex-col rounded-lg border-l-4 border-grid bg-surface p-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    {m.name}
                  </p>
                  <p className="mt-1 text-sm text-ink">{m.origin}.</p>
                  <p className="mt-2 text-sm text-ink-muted">
                    <strong className="text-wrong">limit:</strong> {m.limitation}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-sm text-ink-muted">
              There are many different ways to do multiplication. We showcase only three here.
            </p>
            <div className="rounded-lg border-l-4 border-compute bg-surface p-4 text-ink">
              Three journeys, one destination: <strong className="font-mono">{P.display}</strong>.
              The road changes; the answer does not, and each road pays its own toll.{" "}
              <strong>Reasoning is inherently diverse pathfinding from prior knowledge.</strong>
            </div>
          </section>
        </section>
        <div aria-hidden="true" />

        {/* Step 3 — the handoff out of Act 1 */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">3. Where this leaves us</h2>
          <div className="rounded-lg border-l-4 border-compute bg-surface p-4 text-ink">
            <em>
              Every culture that needed to multiply built its own road from what it already knew:
              schoolbook columns, line bundles, a memorized sutra. Which leaves Act 1&apos;s open
              questions: can we <strong>guide a machine down different roads</strong> to the same
              destination? And why can&apos;t it <strong>chart its own road</strong> (derive its own
              way to an answer)? Act 2 opens that toolbox.
            </em>
          </div>
        </section>
        <div aria-hidden="true" />
      </div>

      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>
      <PageNav n={PAGE_N} />
    </article>
  );
}
