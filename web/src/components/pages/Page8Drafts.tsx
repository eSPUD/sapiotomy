"use client";

/**
 * DRAFTS: candidate replacements for page 8's figure 2, the 40 × 16 heat map.
 *
 * Temporary. Everything lives in this one file and mounts at the very bottom of
 * the page, below the handoff. To remove it:
 *   1. delete this file and `Page8Drafts.test.tsx`;
 *   2. delete the two lines in `Page8.tsx` marked `DRAFTS`.
 * Nothing else on the page reads from here, and nothing here changes the page.
 *
 * Every draft reads the same 40 problems from `PILE8`. Specimens are drawn at
 * random from a stated pool with a seeded generator (seed 8), never picked.
 */

import { Fragment, useEffect, useMemo, useState } from "react";
import { ChartFrame } from "@/components/ChartFrame";
import { pct, tidyMath } from "@/lib/page08";
import { PILE8, loadChains, type PileRow } from "@/lib/page08Pile";

const ROWS = PILE8.rows;
const N = PILE8.nChains;
const SEED = 8;

/* ------------------------------------------------------------------ shared */

type Group = "all" | "some" | "none";
const groupOf = (r: PileRow): Group => (r.n_correct === N ? "all" : r.n_correct === 0 ? "none" : "some");
const GROUP_LABEL: Record<Group, string> = { all: "every chain right", some: "some right", none: "none right" };
const GROUPS: Group[] = ["all", "some", "none"];
const pool = (g: Group) => ROWS.filter((r) => groupOf(r) === g);

/** What happened to one problem under Best-of-N. */
type Outcome = "kept-right" | "kept-wrong" | "no-right";
const outcomeOf = (r: PileRow): Outcome =>
  r.n_correct === 0 ? "no-right" : r.chains[0].c ? "kept-right" : "kept-wrong";
const OUTCOME_LABEL: Record<Outcome, string> = {
  "kept-right": "kept chain right",
  "kept-wrong": "kept chain wrong, a right one was written",
  "no-right": "no right chain written",
};
/** Fill classes per outcome: `bg-*` for HTML, `fill-*` for SVG. */
const OUTCOME_BG: Record<Outcome, string> = { "kept-right": "bg-correct", "kept-wrong": "bg-wrong", "no-right": "bg-grid" };
const OUTCOME_SVG: Record<Outcome, string> = { "kept-right": "fill-correct", "kept-wrong": "fill-wrong", "no-right": "fill-grid" };

const mix = (v: string, p: number) => `color-mix(in srgb, ${v} ${p}%, transparent)`;
const chainFill = (right: boolean) => mix(right ? "var(--correct)" : "var(--wrong)", right ? 85 : 40);

const COUNTS = {
  all: pool("all").length,
  some: pool("some").length,
  none: pool("none").length,
  keptRight: pool("some").filter((r) => r.chains[0].c).length,
};
const keptWrong = COUNTS.some - COUNTS.keptRight;

/** mulberry32: a small seeded generator, so a draw is the same on every load. */
function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The k-th seeded draw of one problem from each group. */
function drawEach(k: number): PileRow[] {
  const rand = seeded(SEED + k);
  return GROUPS.map((g) => {
    const p = pool(g);
    return p[Math.floor(rand() * p.length)];
  });
}

function Legend({ items }: { items: { cls: string; label: string }[] }) {
  return (
    <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-xs text-ink-muted">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          <span aria-hidden="true" className={`h-3 w-3 rounded-sm ${i.cls}`} />
          {i.label}
        </li>
      ))}
    </ul>
  );
}

const OUTCOME_LEGEND = (["kept-right", "kept-wrong", "no-right"] as Outcome[]).map((o) => ({
  cls: OUTCOME_BG[o],
  label: OUTCOME_LABEL[o],
}));

/** One chain's text, loaded when asked for. */
function ChainText({ row, j }: { row: PileRow; j: number }) {
  const [text, setText] = useState<string | null>(null);
  const c = row.chains[j];
  useEffect(() => {
    let live = true;
    setText(null);
    loadChains(row.file).then((t) => {
      if (live) setText(t[String(c.i)] ?? "");
    });
    return () => {
      live = false;
    };
  }, [row.file, c.i]);
  return (
    <div className="rounded border border-grid bg-surface-raised p-3">
      <p className="text-xs text-ink-muted">
        {j === 0 ? "The kept chain" : `Rated ${j + 1} of ${N}`} · answer{" "}
        <span className={c.c ? "text-correct-ink" : "text-wrong-ink"}>{tidyMath(c.a ?? "none")}</span> · the
        right answer is {tidyMath(row.answer)} · the judge rated it {c.r}%
      </p>
      <p className="mt-2 max-h-56 overflow-y-auto whitespace-pre-wrap font-mono text-xs text-ink">
        {text === null ? "loading…" : tidyMath(text)}
      </p>
    </div>
  );
}

/** A problem's 16 chains as a ranked list, highest rating first, kept chain on top. */
function RankedChains({ row, onPick, picked }: { row: PileRow; onPick?: (j: number) => void; picked?: number | null }) {
  return (
    <ol className="m-0 flex list-none flex-col gap-0.5 p-0">
      {row.chains.map((c, j) => {
        const kept = j === 0;
        return (
          <li key={c.i}>
            <button
              type="button"
              onClick={() => onPick?.(j)}
              aria-label={`${kept ? "kept chain" : `chain rated ${j + 1} of ${N}`}: answer ${c.a ?? "none"}, rated ${c.r}%, ${c.c ? "right" : "wrong"}`}
              className={`flex w-full items-center gap-2 rounded px-1.5 py-0.5 text-left font-mono text-[11px] tabular-nums ${
                kept ? `border-2 ${c.c ? "border-correct bg-correct/10" : "border-wrong bg-wrong/10"}` : "border-2 border-transparent"
              } ${picked === j ? "outline outline-1 outline-ink" : ""}`}
            >
              <span className="w-8 shrink-0 text-ink-muted">{kept ? "kept" : j + 1}</span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-grid">
                <span className="block h-full rounded-full bg-compute" style={{ width: `${c.r}%` }} />
              </span>
              <span className="w-8 shrink-0 text-right text-ink">{c.r}%</span>
              <span className="w-16 shrink-0 truncate text-right text-ink" title={tidyMath(c.a ?? "none")}>
                {tidyMath(c.a ?? "none")}
              </span>
              <span aria-hidden="true" className={`w-3 shrink-0 ${c.c ? "text-correct-ink" : "text-wrong-ink"}`}>
                {c.c ? "✓" : "✗"}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/** One draft's frame: a letter, a name, what it is, then the figure. */
function Draft({ letter, name, idea, children }: { letter: string; name: string; idea: string; children: React.ReactNode }) {
  return (
    <section aria-label={`Draft ${letter}: ${name}`} className="flex min-w-0 flex-col gap-3">
      <h3 className="text-lg font-semibold text-ink">
        <span className="font-mono text-ink-muted">{letter}. </span>
        {name}
      </h3>
      <p className="text-sm text-ink-muted">{idea}</p>
      <figure className="m-0 flex min-w-0 flex-col gap-3 rounded-lg border-l-4 border-grid bg-surface p-4">
        {children}
      </figure>
    </section>
  );
}

/* --------------------------------------------- A. three real problems, cards */

function DraftCards() {
  const [k, setK] = useState(0);
  const [open, setOpen] = useState<{ q: string; j: number } | null>(null);
  const drawn = useMemo(() => drawEach(k), [k]);
  return (
    <Draft
      letter="A"
      name="Three real problems"
      idea="One problem drawn at random from each group, laid out like the demo above: its 16 chains, the judge's rating of each, and the chain Best-of-N keeps."
    >
      <div className="grid gap-4 lg:grid-cols-3">
        {drawn.map((row, g) => (
          <div key={row.id} className="flex min-w-0 flex-col gap-2 rounded-lg bg-surface-raised p-3">
            <p className="text-xs font-semibold font-eyebrow uppercase tracking-wide text-ink-muted">
              {GROUP_LABEL[GROUPS[g]]} · drawn from {pool(GROUPS[g]).length}
            </p>
            <p className="line-clamp-4 text-sm text-ink" title={tidyMath(row.question)}>
              {tidyMath(row.question)}
            </p>
            <p className="text-xs text-ink-muted">
              {row.n_correct} of {N} chains right · answer {tidyMath(row.answer)}
            </p>
            <RankedChains
              row={row}
              picked={open?.q === row.id ? open.j : null}
              onPick={(j) => setOpen(open?.q === row.id && open.j === j ? null : { q: row.id, j })}
            />
          </div>
        ))}
      </div>
      {open ? <ChainText row={ROWS.find((r) => r.id === open.q)!} j={open.j} /> : null}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => {
            setK((x) => x + 1);
            setOpen(null);
          }}
          className="rounded bg-compute px-3 py-1.5 text-sm font-semibold text-ink"
        >
          Draw three more
        </button>
        <span className="text-xs text-ink-muted">Click a chain to read it.</span>
      </div>
      <figcaption className="text-sm text-ink-muted">
        On the {COUNTS.some} problems where some chains are right, the kept chain is right on{" "}
        <strong className="text-ink">{COUNTS.keptRight}</strong>.
      </figcaption>
    </Draft>
  );
}

/* ------------------------------------------------ B. one bar per problem */

const BAR_W = 672;
const BAR_M = { top: 12, right: 12, bottom: 56, left: 52 };
const BAR_H = 240;

function DraftBars() {
  const innerW = BAR_W - BAR_M.left - BAR_M.right;
  const innerH = BAR_H - BAR_M.top - BAR_M.bottom;
  const gapAfter = new Set<number>();
  ROWS.forEach((r, q) => {
    if (q > 0 && groupOf(r) !== groupOf(ROWS[q - 1])) gapAfter.add(q);
  });
  const slots = ROWS.length + gapAfter.size;
  const step = innerW / slots;
  const xs: number[] = [];
  let s = 0;
  ROWS.forEach((_, q) => {
    if (gapAfter.has(q)) s += 1;
    xs.push(s * step);
    s += 1;
  });
  const y = (v: number) => innerH - (v / N) * innerH;
  return (
    <Draft
      letter="B"
      name="One bar per problem"
      idea="Each bar is one problem: how many of its 16 chains are right, tallest first. The mark under each bar says whether the kept chain was right."
    >
      <ChartFrame
        width={BAR_W}
        height={BAR_H}
        margin={BAR_M}
        yLabel={`chains right, of ${N}`}
        title={`${ROWS.length} problems as bars of how many of their ${N} chains are right, sorted tallest first, with a mark under each for whether the kept chain was right.`}
      >
        {[0, 8, 16].map((t) => (
          <g key={t}>
            <line x1={0} x2={innerW} y1={y(t)} y2={y(t)} className="stroke-grid" />
            <text x={-6} y={y(t) + 3} textAnchor="end" className="fill-ink-muted text-[10px]">
              {t}
            </text>
          </g>
        ))}
        {ROWS.map((r, q) => {
          const o = outcomeOf(r);
          const cx = xs[q] + step / 2;
          return (
            <g key={r.id}>
              <rect x={xs[q] + 1} y={y(r.n_correct)} width={step - 2} height={innerH - y(r.n_correct)} fill={chainFill(true)} />
              {o === "no-right" ? (
                <circle cx={cx} cy={innerH + 12} r={2} className="fill-grid" />
              ) : (
                <text x={cx} y={innerH + 16} textAnchor="middle" className={`text-[11px] ${o === "kept-right" ? "fill-correct-ink" : "fill-wrong-ink"}`}>
                  {o === "kept-right" ? "✓" : "✗"}
                </text>
              )}
            </g>
          );
        })}
        {GROUPS.map((g) => {
          const qs = ROWS.map((r, q) => (groupOf(r) === g ? q : -1)).filter((q) => q >= 0);
          if (!qs.length) return null;
          const x0 = xs[qs[0]];
          const x1 = xs[qs.at(-1)!] + step;
          return (
            <text key={g} x={(x0 + x1) / 2} y={innerH + 36} textAnchor="middle" className="fill-ink-muted text-[10px]">
              {GROUP_LABEL[g]} ({qs.length})
            </text>
          );
        })}
      </ChartFrame>
      <p className="text-xs text-ink-muted">✓ kept chain right · ✗ kept chain wrong · dot: no right chain to keep</p>
      <figcaption className="text-sm text-ink-muted">
        Where most chains are right the kept chain is right. All {keptWrong} misses sit where few are.
      </figcaption>
    </Draft>
  );
}

/* ------------------------------------------- C. where the 40 problems go */

function DraftSplit() {
  const parts = [
    { n: COUNTS.all, label: "every chain right", sub: "any pick works", cls: "bg-correct/50" },
    { n: COUNTS.keptRight, label: "judge found the right one", sub: "", cls: OUTCOME_BG["kept-right"] },
    { n: keptWrong, label: "judge missed it", sub: "", cls: OUTCOME_BG["kept-wrong"] },
    { n: COUNTS.none, label: "none right", sub: "nothing to find", cls: OUTCOME_BG["no-right"] },
  ];
  const total = ROWS.length;
  return (
    <Draft
      letter="C"
      name="Where the 40 problems go"
      idea="No chains at all: one bar of 40 problems, split by what the judge could do with each."
    >
      <div className="flex flex-col gap-1">
        <div className="flex text-xs text-ink-muted">
          <span style={{ width: `${(COUNTS.all / total) * 100}%` }} />
          <span
            className="border-x border-t border-ink-muted pb-0.5 text-center"
            style={{ width: `${(COUNTS.some / total) * 100}%` }}
          >
            some right: {COUNTS.some}
          </span>
        </div>
        <div className="flex h-10 overflow-hidden rounded" role="img" aria-label={parts.map((p) => `${p.label}: ${p.n}`).join(", ")}>
          {parts.map((p) => (
            <div
              key={p.label}
              className={`flex items-center justify-center border-r-2 border-surface font-mono text-sm font-semibold text-ink last:border-r-0 ${p.cls}`}
              style={{ width: `${(p.n / total) * 100}%` }}
            >
              {p.n}
            </div>
          ))}
        </div>
        <div className="flex text-[11px] leading-tight text-ink-muted">
          {parts.map((p) => (
            <span key={p.label} className="px-0.5 text-center" style={{ width: `${(p.n / total) * 100}%` }}>
              {p.label}
              {p.sub ? <span className="block opacity-80">{p.sub}</span> : null}
            </span>
          ))}
        </div>
      </div>
      <figcaption className="text-sm text-ink-muted">
        The judge only matters in the middle {COUNTS.some}. There it keeps a right chain on{" "}
        <strong className="text-ink">{COUNTS.keptRight}</strong>.
      </figcaption>
    </Draft>
  );
}

/* ------------------------------------- D. forty tiles, click one to open it */

function DraftTiles() {
  const [at, setAt] = useState<number | null>(null);
  const [pick, setPick] = useState<number | null>(null);
  const row = at === null ? null : ROWS[at];
  return (
    <Draft
      letter="D"
      name="Forty tiles"
      idea="One tile per problem, coloured by what Best-of-N got. Click a tile to see that problem's chains in the judge's order."
    >
      <Legend items={OUTCOME_LEGEND} />
      <div className="flex flex-wrap gap-4">
        {GROUPS.map((g) => (
          <div key={g} className="flex flex-col gap-1">
            <p className="text-xs text-ink-muted">
              {GROUP_LABEL[g]} ({pool(g).length})
            </p>
            <div className="flex max-w-[18rem] flex-wrap gap-1">
              {ROWS.map((r, q) =>
                groupOf(r) === g ? (
                  <button
                    key={r.id}
                    type="button"
                    aria-label={`problem ${q + 1}: ${OUTCOME_LABEL[outcomeOf(r)]}, ${r.n_correct} of ${N} chains right`}
                    onClick={() => {
                      setAt(at === q ? null : q);
                      setPick(null);
                    }}
                    className={`h-6 w-6 rounded ${OUTCOME_BG[outcomeOf(r)]} ${at === q ? "outline outline-2 outline-ink" : ""}`}
                  />
                ) : null,
              )}
            </div>
          </div>
        ))}
      </div>
      {row ? (
        <div className="flex flex-col gap-2 rounded-lg bg-surface-raised p-3">
          <p className="text-sm text-ink">{tidyMath(row.question)}</p>
          <p className="text-xs text-ink-muted">
            {row.n_correct} of {N} chains right · answer {tidyMath(row.answer)}
          </p>
          <div className="max-w-md">
            <RankedChains row={row} picked={pick} onPick={(j) => setPick(pick === j ? null : j)} />
          </div>
          {pick !== null ? <ChainText row={row} j={pick} /> : null}
        </div>
      ) : (
        <p className="text-xs text-ink-muted">Click a tile to open its problem.</p>
      )}
      <figcaption className="text-sm text-ink-muted">
        Of the {COUNTS.some} problems with some right chains, the kept chain is right on {COUNTS.keptRight}.
      </figcaption>
    </Draft>
  );
}

/* ---------------------------------- E. one problem, judged in front of you */

function DraftJudgeOne() {
  const [k, setK] = useState(0);
  const [ranked, setRanked] = useState(false);
  const row = useMemo(() => {
    const p = pool("some");
    return p[Math.floor(seeded(SEED * 100 + k)() * p.length)];
  }, [k]);
  // In the order the model wrote them, then in the judge's order.
  const order = ranked ? row.chains : [...row.chains].sort((a, b) => a.i - b.i);
  return (
    <Draft
      letter="E"
      name="Watch the judge sort one problem"
      idea="The demo's three steps on a real problem. The 16 chains appear in the order they were written; press Rank to sort them by the judge's rating and keep the top one. Drawn at random from the problems where some chains are right."
    >
      <p className="text-sm text-ink">{tidyMath(row.question)}</p>
      <p className="text-xs text-ink-muted">
        {row.n_correct} of {N} chains right · answer {tidyMath(row.answer)}
      </p>
      <ol className="m-0 grid list-none grid-cols-2 gap-1.5 p-0 sm:grid-cols-4">
        {order.map((c, j) => {
          const kept = ranked && j === 0;
          return (
            <li
              key={c.i}
              className={`flex flex-col gap-1 rounded p-2 motion-safe:transition-all ${
                kept ? `border-2 ${c.c ? "border-correct bg-correct/10" : "border-wrong bg-wrong/10"}` : "border-2 border-transparent bg-surface-raised"
              } ${ranked && !kept ? "opacity-60" : ""}`}
            >
              <span className="flex items-baseline justify-between font-mono text-xs">
                <span className="truncate text-ink">{tidyMath(c.a ?? "none")}</span>
                <span aria-hidden="true" className={c.c ? "text-correct-ink" : "text-wrong-ink"}>
                  {c.c ? "✓" : "✗"}
                </span>
              </span>
              {ranked ? (
                <span className="flex items-center gap-1">
                  <span className="h-1 flex-1 overflow-hidden rounded-full bg-grid">
                    <span className="block h-full bg-compute" style={{ width: `${c.r}%` }} />
                  </span>
                  <span className="font-mono text-[10px] text-ink-muted">{c.r}%</span>
                </span>
              ) : (
                <span className="text-[10px] text-ink-muted">chain {c.i + 1}</span>
              )}
            </li>
          );
        })}
      </ol>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setRanked(true)}
          disabled={ranked}
          className="rounded bg-compute px-3 py-1.5 text-sm font-semibold text-ink disabled:opacity-50"
        >
          Rank by the judge
        </button>
        <button
          type="button"
          onClick={() => {
            setK((x) => x + 1);
            setRanked(false);
          }}
          className="rounded border border-grid px-3 py-1.5 text-sm text-ink"
        >
          Another problem
        </button>
      </div>
      {ranked ? (
        <p aria-live="polite" className="text-sm text-ink">
          Best of {N} keeps <strong className="font-mono">{tidyMath(row.chains[0].a ?? "none")}</strong>, rated{" "}
          {row.chains[0].r}%. It is{" "}
          <strong className={row.chains[0].c ? "text-correct-ink" : "text-wrong-ink"}>
            {row.chains[0].c ? "right" : "wrong"}
          </strong>
          .
        </p>
      ) : null}
    </Draft>
  );
}

/* --------------------------- F. how far down the best right chain was rated */

const RANK_W = 672;
const RANK_M = { top: 16, right: 12, bottom: 40, left: 36 };
const RANK_H = 220;

function DraftRank() {
  // The judge's rank of the highest-rated right chain, on every problem that has one.
  const ranks = ROWS.filter((r) => r.n_correct > 0).map((r) => r.chains.findIndex((c) => c.c) + 1);
  const counts = Array.from({ length: N }, (_, k) => ranks.filter((x) => x === k + 1).length);
  const max = Math.max(...counts);
  const innerW = RANK_W - RANK_M.left - RANK_M.right;
  const innerH = RANK_H - RANK_M.top - RANK_M.bottom;
  const bw = innerW / N;
  const y = (v: number) => innerH - (v / max) * innerH;
  return (
    <Draft
      letter="F"
      name="Where the right chain ranked"
      idea={`On the ${ranks.length} problems with at least one right chain: where the judge ranked the best right one. Rank 1 means Best-of-N kept it.`}
    >
      <ChartFrame
        width={RANK_W}
        height={RANK_H}
        margin={RANK_M}
        xLabel="the judge's rank of the highest-rated right chain"
        title={`On ${ranks.length} problems with a right chain, the judge ranked one first on ${counts[0]}; on the rest it sat lower.`}
      >
        {counts.map((n, k) => (
          <g key={k}>
            {n > 0 ? (
              <rect
                x={k * bw + 3}
                y={y(n)}
                width={bw - 6}
                height={innerH - y(n)}
                className={k === 0 ? "fill-correct" : "fill-wrong"}
              />
            ) : null}
            {n > 0 ? (
              <text x={k * bw + bw / 2} y={y(n) - 4} textAnchor="middle" className="fill-ink text-[11px] font-semibold">
                {n}
              </text>
            ) : null}
            <text x={k * bw + bw / 2} y={innerH + 14} textAnchor="middle" className="fill-ink-muted text-[10px]">
              {k === 0 ? "kept" : k + 1}
            </text>
          </g>
        ))}
      </ChartFrame>
      <figcaption className="text-sm text-ink-muted">
        {counts[0]} of {ranks.length} times the judge put a right chain first ({COUNTS.all} of them had
        nothing but right chains). When it missed, the best right chain sat between rank{" "}
        {Math.min(...ranks.filter((x) => x > 1))} and {Math.max(...ranks)}.
      </figcaption>
    </Draft>
  );
}

/* ------------------------------ H. the judge's ratings, right against wrong */

const RAT_W = 672;
const RAT_M = { top: 12, right: 16, bottom: 40, left: 120 };
const RAT_H = 170;

function DraftRatings() {
  const some = pool("some");
  const chains = some.flatMap((r) => r.chains.map((c) => ({ ...c, id: r.id })));
  const right = chains.filter((c) => c.c);
  const wrong = chains.filter((c) => !c.c);
  const median = (xs: number[]) => {
    const s = [...xs].sort((a, b) => a - b);
    return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
  };
  const innerW = RAT_W - RAT_M.left - RAT_M.right;
  const innerH = RAT_H - RAT_M.top - RAT_M.bottom;
  const x = (r: number) => (r / 100) * innerW;
  const rand = seeded(SEED);
  const lanes = [
    { label: `right chains (${right.length})`, cs: right, fill: chainFill(true), y: innerH * 0.28 },
    { label: `wrong chains (${wrong.length})`, cs: wrong, fill: chainFill(false), y: innerH * 0.72 },
  ];
  return (
    <Draft
      letter="H"
      name="What the judge's number says"
      idea={`Every chain on the ${some.length} problems where some chains are right, placed by the judge's rating. Right chains on top, wrong ones below; the line is each row's middle rating.`}
    >
      <ChartFrame
        width={RAT_W}
        height={RAT_H}
        margin={RAT_M}
        xLabel="the judge's rating"
        title={`The judge's ratings of ${right.length} right and ${wrong.length} wrong chains. Right chains have a middle rating of ${median(right.map((c) => c.r))}%, wrong ones ${median(wrong.map((c) => c.r))}%.`}
      >
        {[0, 25, 50, 75, 100].map((t) => (
          <g key={t}>
            <line x1={x(t)} x2={x(t)} y1={0} y2={innerH} className="stroke-grid" />
            <text x={x(t)} y={innerH + 14} textAnchor="middle" className="fill-ink-muted text-[10px]">
              {t}%
            </text>
          </g>
        ))}
        {lanes.map((l) => (
          <g key={l.label}>
            <text x={-8} y={l.y + 4} textAnchor="end" className="fill-ink text-[11px]">
              {l.label}
            </text>
            {l.cs.map((c, k) => (
              <circle key={`${c.id}-${c.i}-${k}`} cx={x(c.r)} cy={l.y + (rand() - 0.5) * innerH * 0.32} r={2.5} fill={l.fill} />
            ))}
            <line
              x1={x(median(l.cs.map((c) => c.r)))}
              x2={x(median(l.cs.map((c) => c.r)))}
              y1={l.y - innerH * 0.2}
              y2={l.y + innerH * 0.2}
              className="stroke-ink"
              strokeWidth={2}
            />
          </g>
        ))}
      </ChartFrame>
      <figcaption className="text-sm text-ink-muted">
        The judge rates right chains higher, but the two rows overlap. Where they overlap, a wrong chain can
        come out on top.
      </figcaption>
    </Draft>
  );
}

/* -------------------------------------------------------------------- mount */

/** All the drafts, under one heading, for the very bottom of the page. */
export function Page8Drafts() {
  return (
    <section
      aria-label="Drafts for figure 2"
      className="flex flex-col gap-8 rounded-lg border-2 border-dashed border-grid p-4 sm:p-6"
    >
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-ink">Drafts: replacements for figure 2&apos;s heat map</h2>
        <p className="text-sm text-ink-muted">
          The remaining ways to show the same {ROWS.length} problems. Temporary: pick one, and the rest go. Shared
          numbers: {COUNTS.all} all right, {COUNTS.some} some right, {COUNTS.none} none right; the kept chain is
          right on {COUNTS.keptRight} of the {COUNTS.some}. Best-of-{N} solves {pct(PILE8.bars.best_of_n, 1)}.
        </p>
      </div>
      {[DraftCards, DraftBars, DraftSplit, DraftTiles, DraftJudgeOne, DraftRank, DraftRatings].map(
        (D, k) => (
          <Fragment key={k}>
            <D />
          </Fragment>
        ),
      )}
    </section>
  );
}

export default Page8Drafts;
