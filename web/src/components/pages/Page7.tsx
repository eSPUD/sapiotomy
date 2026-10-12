"use client";

/**
 * Page 7, "Frequency Voting" — page 6 made one chain longer. This page runs the
 * chain many times and keeps the answer the most chains agree on.
 *
 * EVERY NUMBER ON THIS PAGE IS OURS AND IS MEASURED. Nothing is redrawn from a
 * paper and nothing is simulated. The source is one run of
 * `notebooks/page_07_frequency_voting.ipynb` — Qwen2.5-3B-Instruct at bf16,
 * MATH-500 levels 4 and 5, the same 100 paired items pages 5 and 6 use, 16
 * sampled chains per problem, 5,920 generations. Its `derived.json` is committed
 * verbatim to `web/data/page-07-derived.json` and loaded through `@/lib/page07`,
 * which reads the run's `claims` gates BEFORE any number and throws if a
 * blocking one is false. No inference runs at demonstration time.
 *
 * WHAT THE OLD PAGE DID THAT THIS ONE MUST NOT. The previous build simulated the
 * vote with `CHAMBER_MODEL` (a Monte Carlo tuned to land on Wang et al.'s
 * published GSM8K curve) over four hand-authored "misreadings" in
 * `SAMPLING_CHAMBER`, and its temperature dial was explicitly modelled because
 * temperature appears in no reported number. All three are gone. Do not
 * reintroduce `lib/sim` or `lib/authored` here.
 *
 * THE HEADLINE, AND THE TRAP IN IT. Bare chain of thought is ONE GREEDY CHAIN —
 * page 5's `bare` condition, page 6's top rung, 43% on these items. The vote over
 * 16 sampled chains solves 55%: +12 points, p = 0.0075. Against one SAMPLED
 * chain the same vote gains only 4 points and does not resolve (p = 0.39),
 * because sampling at T=0.3 is already worth something on its own. The page
 * leads on the greedy contrast because that is what "improves on chain of
 * thought" means here, and the sampled contrast is the guard on it: a reader
 * who takes the 12 without it credits all of it to counting. The guard was a
 * margin note, then a sentence beside the +12; since 2026-10-11 the FIGURE
 * carries it. Figure 2's vote line starts at one sampled chain, above the flat
 * greedy line before any vote is taken, and the readout at one chain says so.
 * The p = 0.39 that says the rest does not resolve is in the download. Keep the
 * vote line starting at N = 1 and keep that readout, or the guard is gone.
 *
 * Layout: pages 5 and 6's shell. One reading column of numbered steps, each
 * beside its own margin note. Every step that carries a figure opens on a
 * sentence saying what the figure is a picture OF.
 *
 * THERE IS NO PROVENANCE PLATE, and one must not come back. The page used to
 * open on one above step 1 — "every figure below is one measurement of ours",
 * then a mono line of precision, top-p, run id and date. It read as a specimen
 * label from a lab the reader has not visited, and it front-loaded the apparatus
 * before the idea. The two facts a reader actually needs, WHICH MODEL and WHICH
 * PROBLEMS, now sit on the figures that are pictures of them: figure 1's
 * specimen card carries the benchmark and the specimen's level, step 3's intro
 * carries the item count, the benchmark and the levels, and step 2's intro names
 * the model in prose. Everything else the run recorded is in the download on the
 * top line, which is the honest place for it.
 *
 *   Step 1 — the idea, as a classroom solving the chickens-and-cows puzzle:
 *   sixteen of twenty-five students reach 4 by four different methods, the nine
 *   misses scatter across six numbers. Its one figure is the four methods behind
 *   the most common answer, worked, each card carrying its head count and ending
 *   on the same answer; it is an illustration, the only thing on the page that is
 *   not measured. That is Wang's intuition (many
 *   ways of thinking, one correct answer). The load-bearing clause is that
 *   agreement only counts when the methods are DIFFERENT ("if everyone had
 *   copied one student's working, you'd only have one answer, which could
 *   be right or wrong"), which is
 *   the mechanism the whole page then
 *   measures and the reason step 3's T = 0 line is flat. Name the technique
 *   here, and cite Wang in the margin beside it, where the TECHNIQUE is the
 *   subject.
 *
 *   Step 2 — figure 1, the pile. Two problems, the vote coming out right and the
 *   vote tying with the truth among the chains (the author cut a third, the vote
 *   coming out wrong, on 2026-10-11), each with 16 chains tallied into a ranked
 *   histogram. A row click opens that answer's chains and
 *   never closes the reader; the arrows step only within the open answer, so
 *   every chain, wrong ones included, is a row click and some arrow presses away.
 *   Each chain shows its opening and its ending with the middle folded, because
 *   chains run to 272 lines and the ending is what a reader is looking for. Truth concentrates (the modal answer holds 9.9 of 16 votes on
 *   average) and the tail is real (41% of answer classes appear exactly once).
 *   Lead with the CONCENTRATION: the run's `errors_are_diffuse` gate is FALSE at
 *   a 50% threshold, so "wrong answers all disagree" overstates it. Opening a bar
 *   shows the chains that landed there, and two chains agreeing on a wrong answer
 *   usually made different mistakes. Do not bucket the singletons.
 *
 *   Step 3 — figure 2, what the vote buys. Accuracy against N, built by
 *   subsampling one pile so chain length is fixed. The figure opens on two lines,
 *   the vote rising off the flat greedy chain, and the intro names both. The
 *   third, "at least one chain is right", and the band between it and the vote
 *   (what the rule discards, page 8's ceiling arriving early) are behind a
 *   toggle. The widget holds the chart, its slider, a one-sentence readout and
 *   that toggle, and nothing else: the figure carries the step. The temperature-0
 *   line is FLAT by construction and that is the page's cleanest proof that the
 *   vote needs diversity: sixteen identical chains are step 1's class that
 *   "copied one student's working". THE DIP AT N=2 IS REAL AND MUST
 *   BE EXPLAINED, not smoothed: with two chains a disagreement is a tie, a tie is
 *   not a vote, and 52% of N=2 votes tie.
 *
 *   Step 4 — the split, and it is the honest half. At a FIXED budget, splitting
 *   loses: 46% / 35% / 8% at N = 1 / 4 / 16. `splitting_a_fixed_budget_pays` is
 *   false and the page says so, but says WHY, because "splitting loses" alone
 *   reads as "voting loses", which step 3 disproves. The cause is the cap: the
 *   cut-off column runs 1% / 55% / 100%, so at N=16 every chain is force-answered
 *   mid-thought and page 6 measured a chain that short at 7% alone. The table
 *   groups its headers because that column is a property of the run and not a
 *   score, and three bare percentages in a row invite reading it as one.
 *   The N=1 row is the control: the cap barely binds, so both runs ARE the same
 *   run and report the same 46%.
 *
 *   Step 5 — one number, no figure: 23% of problems where the model produced the
 *   right answer and the vote threw it away. That is page 8's whole subject and
 *   it is deliberately not drawn here (see docs/page_8_refactor.md).
 *
 * The apparatus is in the margin, not in a footer. The three-paragraph tail this
 * page used to end on was doing the notebook's job: a reader who wants the
 * method downloads the run. A note may say what a reader cannot work out from
 * the figure beside it, and nothing else.
 *
 * NOT every step has a note, and steps 3, 4 and 5 must not grow one back. Their
 * notes were guards on how to read a figure — how much of the +12 is counting,
 * and that the fork is two lines rather than two experiments — which is the
 * reader's first question about the figure and not a footnote to it. Both are
 * now in the reading column: step 3's follows its headline sentence, step 4's sets
 * up its chart before the reader sees it. A section with no note beside it MUST
 * carry `lg:col-start-1`, or the next one flows into the note column.
 *
 * Load-bearing and easy to lose:
 *   · the diversity readout is measured on 30 items, not 100. It is a count of
 *     answers, not an accuracy, and the label must keep saying so.
 *   · Wang et al. is cited for the TECHNIQUE. No cite may carry one of our
 *     numbers.
 */

import { useId, useRef, useState } from "react";
import { Handoff } from "@/components/Handoff";
import { ChartFrame } from "@/components/ChartFrame";
import { Cite, RefItem } from "@/components/Cite";
import { PageNav } from "@/components/PageNav";
import { NotebookDownload } from "@/components/NotebookDownload";
import { ACTS, getPage } from "@/lib/pages";
import {
  PAGE7,
  chainsFor,
  foldTrace,
  pLabel,
  pct,
  tidyMath,
  tokens,
  type HeatCell,
  type Problem,
  type ShowcaseOutcome,
  type SpecimenChain,
} from "@/lib/page07";
import { useStore } from "@/store/useStore";

const PAGE_N = 7;
const F1 = PAGE7.figure1;
const F2 = PAGE7.figure2;
const H = PAGE7.handoff;
const M = PAGE7.manifest;

const NOTEBOOK_ZIP = "/notebooks/page-07-frequency-voting.zip";
const NOTEBOOK_SIZE = "3.1 MB";

/* The instrument used to sit in a provenance plate above step 1, which read as a
   specimen label from a lab the reader has not visited. What a reader needs is
   which model and which problems, and they need it beside the figure that is a
   picture of them: figure 1's specimen card and figure 2's intro. The rest of
   the apparatus — precision, top-p, run id, date, the item hash — is in the
   download on the top line. */
const BENCHMARK = "MATH-500";
const LEVELS = "levels 4 and 5";
/** Figure 2's x axis, and the control that moves along it. */
const N_LABEL = "# of sampled chains";

/** Cited for the technique. Every number on this page is ours. */
const REF = { wang: 1 } as const;

/* Step 1's figure: the four methods the 16 students who said 4 used on the farmyard
   puzzle (10 heads, 28 legs), each worked in a few lines. The per-method head counts
   are illustrative and must sum to the prose's "Sixteen say 4". */
const FARMYARD_METHODS: { name: string; students: number; lines: string[] | string[][] }[] = [
  {
    name: "Guess and check",
    students: 5,
    lines: ["5 cows, 5 chickens", "20 + 10 = 30 legs, too many", "4 cows, 6 chickens", "16 + 12 = 28 legs ✓"],
  },
  {
    // A table's lines are its rows, header first.
    name: "A table",
    students: 4,
    lines: [
      ["cows", "chickens", "legs"],
      ["1", "9", "22"],
      ["2", "8", "24"],
      ["3", "7", "26"],
      ["4", "6", "28 ✓"],
    ],
  },
  {
    name: "Two equations",
    students: 4,
    lines: ["c + h = 10", "4c + 2h = 28", "take away 2 × the first:", "2c = 8, so c = 4"],
  },
  {
    name: "Everyone on two legs",
    students: 3,
    lines: ["10 animals × 2 legs = 20", "28 − 20 = 8 legs left over", "each cow has 2 of them", "8 ÷ 2 = 4"],
  },
];

/** The students who said 4: the four methods' head counts together. */
const FARMYARD_RIGHT = FARMYARD_METHODS.reduce((n, m) => n + m.students, 0);

/* The pile's temperature is the best the sweep found, but it is not the only one:
   the run votes to the same accuracy at more than one setting. Both places that
   talk about the sweep have to say so, so the tie is read out of the data here
   rather than named in prose. */
const BEST_VOTE = Math.max(...F2.diversity.map((d) => d.plurality_accuracy));
const TIED_WITH_HOT = [...F2.diversity]
  .sort((a, b) => a.temperature - b.temperature)
  .filter(
    (d) =>
      Math.abs(d.plurality_accuracy - BEST_VOTE) < 1e-9 && d.temperature !== F2.hot.temperature,
  )
  .map((d) => `T = ${d.temperature}`)
  .join(" and ");

function Note({ kicker, children }: { kicker: string; children: React.ReactNode }) {
  return (
    <aside className="flex flex-col gap-2 text-sm text-ink-muted lg:pt-9">
      <p className="text-xs font-semibold font-eyebrow uppercase tracking-wide text-ink-muted">{kicker}</p>
      {children}
    </aside>
  );
}

/* ------------------------------------------------------------- step 1 figure */

/** The four routes behind the class's most common answer. Framed like step 2's card:
    the puzzle on top (the prose above only points at it), then one card per method,
    each with its head count and ending on the same answer. */
function FarmyardMethods() {
  return (
    <section
      aria-label="Four ways to the same answer"
      className="flex flex-col gap-4 rounded-lg border border-grid bg-surface p-4"
    >
      <p className="font-code text-sm leading-relaxed text-ink">
        A farmyard has chickens and cows, with 10 heads and 28 legs between them. How many
        cows?
      </p>
      <p className="text-sm text-ink">
        <strong>4 cows</strong> was the most common answer that {FARMYARD_RIGHT} of the 25
        students arrived at. Between them, they used four different reasoning approaches.
      </p>
      <div className="grid items-stretch gap-3 sm:grid-cols-2">
        {FARMYARD_METHODS.map((m) => (
          <div
            key={m.name}
            className="flex flex-col gap-2 rounded-lg border-l-4 border-correct bg-surface-raised p-4"
          >
            <p className="flex items-baseline justify-between gap-2 text-xs font-semibold font-eyebrow uppercase tracking-wide text-ink-muted">
              <span>{m.name}</span>
              <span className="font-mono font-normal normal-case tabular-nums">
                {m.students} students
              </span>
            </p>
            {typeof m.lines[0] === "string" ? (
              <div className="flex flex-col gap-0.5 font-mono text-sm text-ink">
                {(m.lines as string[]).map((l) => (
                  <p key={l}>{l}</p>
                ))}
              </div>
            ) : (
              <table className="w-fit font-mono text-sm text-ink">
                <thead>
                  <tr>
                    {(m.lines as string[][])[0].map((h) => (
                      <th key={h} scope="col" className="pr-4 text-left font-normal text-ink-muted">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(m.lines as string[][]).slice(1).map((r) => (
                    <tr key={r[0]}>
                      {r.map((c, i) => (
                        <td key={i} className="pr-4">
                          {c}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <p className="mt-auto border-t border-grid pt-2 font-mono text-sm font-bold text-correct-ink">
              Answer = 4 cows
            </p>
          </div>
        ))}
      </div>
      {/* Every other figure on the page is measured, so this one says it is not. */}
      <p className="font-mono text-xs text-ink-muted">
        This is an illustrative example.
      </p>
    </section>
  );
}

/* ------------------------------------------------------------------ figure 1 */

const OUTCOME_LABEL: Record<ShowcaseOutcome, string> = {
  right: "the vote is right",
  tie: "the vote ties",
};

/** The two problems: the vote coming out right, and the vote tying. Page 6's radio idiom. */
function ProblemPicker({ value, onChange }: { value: number; onChange: (i: number) => void }) {
  const name = useId();
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className="text-sm text-ink-muted">Pick a problem</span>
      <div role="radiogroup" aria-label="Pick a problem" className="flex flex-wrap gap-1">
        {F1.showcase.map(({ outcome }, i) => (
          <label key={outcome} className="cursor-pointer">
            <input
              type="radio"
              name={name}
              className="peer sr-only"
              checked={value === i}
              aria-label={OUTCOME_LABEL[outcome]}
              onChange={() => onChange(i)}
            />
            <span className="block rounded border border-grid px-2 py-0.5 text-xs text-ink peer-focus-visible:ring-2 peer-focus-visible:ring-compute peer-checked:border-compute peer-checked:bg-compute peer-checked:text-canvas">
              {OUTCOME_LABEL[outcome]}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

/** The row a problem opens on: its correct answer, or the top row if none is right. */
const firstOpen = (p: Problem): string => (p.ranked.find((r) => r.correct) ?? p.ranked[0]).answer;

/** How this problem's vote came out, read off the run, for the specimen card. */
function outcomeLine(outcome: ShowcaseOutcome, p: Problem): string {
  const top = p.ranked[0];
  const chains = (n: number) => (n === 1 ? "1 chain" : `${n} chains`);
  const truth = p.ranked.find((r) => r.correct)?.votes ?? 0;
  if (outcome === "right") {
    return `the vote returns ${tidyMath(top.answer)} on ${top.votes} of ${p.chains.length} chains and it is right · picked from ${F1.n_candidates} problems that qualified`;
  }
  const tied = p.ranked.filter((r) => r.votes === top.votes).length;
  return `${tied} answers tie at ${chains(top.votes)} each, so the vote returns nothing · the right answer came back from ${chains(truth)}`;
}

/**
 * One chain, folded to its opening and its ending. The ending is where the chain
 * commits to its answer, which is what a reader comparing wrong chains is looking
 * for; the reasoning in between is one click away rather than a scroll.
 */
function ChainText({ chain }: { chain: SpecimenChain }) {
  const [unfolded, setUnfolded] = useState(false);
  const { head, middle, tail } = foldTrace(tidyMath(chain.trace));
  const para = (p: string, i: number) => (
    <p key={i} className="whitespace-pre-wrap font-code">
      {p}
    </p>
  );
  const fold = (label: string) => (
    <button
      type="button"
      aria-expanded={unfolded}
      onClick={() => setUnfolded((u) => !u)}
      className="inline-flex items-center gap-1.5 self-start rounded border border-compute bg-compute/10 px-2.5 py-1 text-xs font-semibold text-compute transition-colors hover:bg-compute hover:text-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-compute focus-visible:ring-offset-1"
    >
      <span aria-hidden="true">{unfolded ? "▾" : "▸"}</span>
      {label}
    </button>
  );
  return (
    <div
      data-testid="chain-trace"
      data-chain={chain.sample_index}
      className="flex max-h-[32rem] flex-col gap-3 overflow-y-auto rounded bg-surface-raised p-2 text-xs leading-relaxed text-ink-muted"
    >
      {head.map(para)}
      {middle.length > 0
        ? unfolded
          ? [
              ...middle.map((p, i) => para(p, head.length + i)),
              <div key="fold">{fold("Hide reasoning traces")}</div>,
            ]
          : fold("Show reasoning traces")
        : null}
      {tail.map((p, i) => para(p, head.length + middle.length + i))}
    </div>
  );
}

/**
 * The pile as a ranked tally. One row per distinct answer, the correct one
 * marked, and the singletons kept as their own rows because that row IS the
 * argument. The open row is the one the chain being read landed on, so clicking
 * it again leaves it open: a row is a place in the tally, not a switch.
 */
function Tally({
  problem,
  onOpen,
  open,
}: {
  problem: Problem;
  onOpen: (a: string) => void;
  open: string | null;
}) {
  const s = problem;
  const max = s.ranked[0]?.votes ?? 1;
  return (
    <ol aria-label="Answers to this problem" className="flex flex-col gap-1">
      {s.ranked.map((row) => {
        const isOpen = open === row.answer;
        return (
          <li key={row.answer}>
            <button
              type="button"
              onClick={() => onOpen(row.answer)}
              aria-expanded={isOpen}
              className={`flex w-full items-center gap-2 rounded px-1 py-0.5 text-left hover:bg-surface-raised ${
                isOpen ? "bg-surface-raised" : ""
              }`}
            >
              <span
                className={`w-24 shrink-0 truncate font-mono text-xs ${
                  row.correct ? "text-correct-ink" : "text-ink-muted"
                }`}
                title={row.answer}
              >
                {tidyMath(row.answer)}
              </span>
              <span className="flex h-4 min-w-0 flex-1 items-center">
                <span
                  className={`h-3 rounded-sm ${row.correct ? "bg-correct" : "bg-grid"}`}
                  style={{ width: `${Math.max(2, (row.votes / max) * 100)}%` }}
                />
              </span>
              <span className="w-6 shrink-0 text-right font-mono text-xs tabular-nums text-ink-muted">
                {row.votes}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/* --------------------------------------------------------- the heat map */

const HM = F1.heatmap;
const OUTCOME_SAYS: Record<HeatCell["outcome"], string> = {
  right: "the vote is right",
  wrong: "the vote is wrong",
  tie: "the vote ties",
};

/**
 * The fill for one cell. Hue says how the vote came out: Cactus where it is right,
 * Sky where it is not (wrong or tied, which the readout tells apart). Strength says how
 * many chains are right, from a 30% tint at none to the full hue at all of them, so a
 * cell with no right chain still shows its hue: at 12% the two hues read as one grey.
 * Ink stays AA on both hues at full.
 */
const heatFill = (c: HeatCell) =>
  `color-mix(in srgb, var(${c.outcome === "right" ? "--correct" : "--wrong"}) ${Math.round(
    30 + (70 * c.n_correct) / HM.n_chains,
  )}%, transparent)`;

/**
 * Every problem of the temperature sweep at every temperature: a row per problem, a
 * column per temperature. The ratio is its chains right over its chains run; the colour
 * is whether the vote is. A table, so it reads as one without a separate table view.
 */
function TemperatureHeatmap() {
  const [at, setAt] = useState<{ q: number; j: number } | null>(null);
  const shown = at ? HM.problems[at.q].cells[at.j] : null;
  const legend = (outcome: HeatCell["outcome"], label: string) => (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-ink-muted">{label}</span>
      <span className="flex gap-px" aria-hidden="true">
        {Array.from({ length: HM.n_chains + 1 }, (_, k) => (
          <span
            key={k}
            className="flex h-4 w-4 items-center justify-center rounded-sm font-mono text-[10px] tabular-nums text-ink"
            style={{ background: heatFill({ temperature: 0, n_correct: k, outcome }) }}
          >
            {k}
          </span>
        ))}
      </span>
    </div>
  );
  // Compact: fixed narrow columns rather than the full width, and the legend and
  // readout beside the table from sm up (above it on a phone, first in reading order).
  return (
    <section
      aria-label="Chains right and the vote, at every temperature"
      className="flex flex-col gap-4 rounded-lg border border-grid bg-surface p-4 sm:flex-row-reverse sm:justify-end sm:gap-6"
    >
      <div className="flex flex-col gap-2 sm:w-48">
        {legend("right", "the vote is right")}
        {legend("wrong", "the vote is wrong or ties")}
        <p className="text-xs text-ink-muted">Each cell reads chains right / chains run.</p>
        {/* The hover readout; it holds its lines so the panel does not jump. */}
        <p aria-hidden="true" className="min-h-[3rem] font-mono text-xs text-ink">
          {shown && at
            ? `problem ${at.q + 1} · T = ${shown.temperature} · ${shown.n_correct} of ${HM.n_chains} chains right · ${OUTCOME_SAYS[shown.outcome]}`
            : ""}
        </p>
      </div>
      <table
        className="w-auto shrink-0 border-separate self-start font-mono text-[10px] tabular-nums"
        style={{ borderSpacing: "1px" }}
        onMouseLeave={() => setAt(null)}
      >
        <caption className="sr-only">
          Chains right out of {HM.n_chains}, and the vote, for {HM.problems.length} problems at{" "}
          {HM.temperatures.length} temperatures
        </caption>
        <thead>
          <tr>
            <th scope="col" className="pb-1 pr-1 text-left align-bottom font-normal text-ink-muted">
              problem
            </th>
            {HM.temperatures.map((t) => (
              <th key={t} scope="col" className="w-9 pb-1 align-bottom font-normal text-ink-muted">
                {/* Set vertically, reading bottom to top. */}
                <span className="inline-block rotate-180 whitespace-nowrap [writing-mode:vertical-rl]">
                  T = {t}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {HM.problems.map((p, q) => (
            <tr key={p.problem_id}>
              <th scope="row" className="text-left font-normal text-ink-muted">
                {q + 1}
              </th>
              {p.cells.map((c, j) => (
                <td
                  key={c.temperature}
                  onMouseEnter={() => setAt({ q, j })}
                  className={`h-4 w-9 rounded-sm text-center leading-none text-ink ${
                    at?.q === q && at.j === j ? "outline outline-2 outline-ink" : ""
                  }`}
                  style={{ background: heatFill(c) }}
                >
                  {c.n_correct}/{HM.n_chains}
                  <span className="sr-only"> chains right, {OUTCOME_SAYS[c.outcome]}</span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" className="pt-1 text-left font-normal text-ink-muted">
              vote right
            </th>
            {HM.temperatures.map((t, j) => (
              <td key={t} className="pt-1 text-center text-correct-ink">
                {HM.problems.filter((p) => p.cells[j].outcome === "right").length}/
                {HM.problems.length}
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </section>
  );
}

/* ------------------------------------------------------------------ figure 2 */

const W = 620;
const HGT = 280;
const MARGIN = { top: 26, right: 104, bottom: 46, left: 46 };
const IW = W - MARGIN.left - MARGIN.right;
const IH = HGT - MARGIN.top - MARGIN.bottom;

/**
 * The page's main figure, and the one a reader can most easily misread.
 *
 * It opens on TWO lines, the vote rising off the flat greedy chain, because that
 * is the step's claim. The third line and the band between it and the vote are
 * behind `showLost`: they are what the vote threw away, which is step 5's and
 * page 8's subject, and drawn from the start they made the reader decode three
 * lines and a band before the one comparison the step is about.
 *
 * With all three drawn, the SPACE BETWEEN TWO OF THEM is the point:
 *   · the flat one is bare chain of thought, one greedy chain, and it is flat
 *     because sixteen copies of one chain is one chain;
 *   · the solid one is what the vote actually returns;
 *   · the dashed one is what the model PRODUCED — how often the right answer was
 *     somewhere among the chains, whether the vote found it or not.
 *
 * The band between the last two is what voting generated and discarded, which is
 * page 8's entire subject, so it is shaded and named rather than left for the
 * reader to infer. Earlier labels read "in the pile" / "the vote" / "T = 0",
 * which is the notebook's vocabulary and not a reader's.
 */
/**
 * The reader sets N.
 *
 * This is the one page in the act whose subject is what happens as you add
 * voters, and until now the three charts were static: a reader who wanted to
 * know whether the vote still beats one chain at N = 4 had to read it off a
 * line. The axis was always measured. `manifest.pile.n_axis` is [1, 2, 4, 8,
 * 16] and every point is the mean over 64 random N-subsets of the same pile
 * (`axis_rule`), so moving the handle re-reads the run rather than modelling
 * anything.
 *
 * The handle steps in index, not in N: the axis is log-spaced and the reader
 * should get one measured point per step, never an interpolated one.
 *
 * The control is ON the chart: a rule the reader drags along the x axis, page 6's
 * BudgetLine idiom. It used to be a separate slider under the chart whose tick
 * labels were its indices (0 to 4) while the axis above read 1 to 16, so the two
 * disagreed about the one thing they both showed. Grab anywhere on the plot; the
 * rule snaps to a measured N. The handle is the keyboard target (arrows, Home,
 * End), and KeyboardNav leaves a focused role="slider" alone.
 */
function PileChart({
  at,
  showLost,
  onAt,
}: {
  at: number;
  showLost: boolean;
  onAt: (i: number) => void;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const pts = F2.hot.points;
  const ns = pts.map((p) => p.n);
  const sel = pts[at];
  const x = (n: number) => (Math.log2(n) / Math.log2(Math.max(...ns))) * IW;
  const y = (v: number) => IH - (v / 100) * IH;
  const line = (get: (p: (typeof pts)[number]) => number) =>
    pts.map((p, i) => `${i ? "L" : "M"}${x(p.n)},${y(get(p) * 100)}`).join(" ");
  const cold = F2.cold.points[0].accuracy;
  const last = pts[pts.length - 1];
  // Snap a pointer to the nearest measured N, through the svg's own coordinates,
  // because the chart scales to fit its column.
  const onPointer = (e: React.PointerEvent<SVGRectElement>) => {
    if (e.type === "pointerdown") e.currentTarget.setPointerCapture?.(e.pointerId);
    else if (!(e.buttons & 1)) return;
    const svg = svgRef.current;
    if (!svg) return;
    const r = svg.getBoundingClientRect();
    const local = (e.clientX - r.left) / ((r.width || W) / W) - MARGIN.left;
    let best = 0;
    for (let i = 1; i < ns.length; i++) {
      if (Math.abs(x(ns[i]) - local) < Math.abs(x(ns[best]) - local)) best = i;
    }
    if (best !== at) onAt(best);
  };
  const onKey = (e: React.KeyboardEvent<SVGGElement>) => {
    const by: Record<string, number> = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 };
    let next: number | null = null;
    if (e.key in by) next = at + by[e.key];
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = ns.length - 1;
    if (next === null) return;
    e.preventDefault();
    next = Math.min(ns.length - 1, Math.max(0, next));
    if (next !== at) onAt(next);
  };
  // The shaded band: coverage along the top, the vote back along the bottom.
  const band =
    pts.map((p, i) => `${i ? "L" : "M"}${x(p.n)},${y(p.coverage * 100)}`).join(" ") +
    " " +
    [...pts].reverse().map((p) => `L${x(p.n)},${y(p.accuracy * 100)}`).join(" ") +
    " Z";

  return (
    <ChartFrame
      title={`Share of ${M.items.n} ${BENCHMARK} problems, ${LEVELS}, solved by ${PAGE7.primary.label} against the number of sampled chains. One greedy chain solves ${pct(cold)} and stays there however many copies are made of it. Majority voting solves ${pct(last.accuracy)} over sixteen sampled chains.${showLost ? ` At least one chain was right on ${pct(last.coverage)}, so ${pct(last.coverage - last.accuracy)} of problems had the right answer generated and discarded by the vote.` : ""}`}
      width={W}
      height={HGT}
      margin={MARGIN}
      xLabel={N_LABEL}
      yLabel="solved (%)"
      role="group"
      svgRef={svgRef}
    >
      {[0, 25, 50, 75, 100].map((t) => (
        <g key={t}>
          <line x1={0} x2={IW} y1={y(t)} y2={y(t)} className="stroke-grid" strokeWidth={1} />
          <text x={-8} y={y(t) + 4} textAnchor="end" className="fill-ink-muted text-[10px]">
            {t}
          </text>
        </g>
      ))}
      {ns.map((n) => (
        <text key={n} x={x(n)} y={IH + 16} textAnchor="middle" className="fill-ink-muted text-[10px]">
          {n}
        </text>
      ))}

      {/* what was generated and then discarded: page 8's whole subject */}
      {showLost ? (
        <g data-testid="thrown-away">
          <path d={band} className="fill-wrong opacity-10" />
          <path d={line((p) => p.coverage)} fill="none" className="stroke-wrong" strokeWidth={1.4} strokeDasharray="4 3" />
          <text x={IW + 6} y={y(last.coverage * 100) - 2} className="fill-wrong-ink text-[10px]">
            <tspan x={IW + 6} dy="0">at least one</tspan>
            <tspan x={IW + 6} dy="11">chain is right</tspan>
          </text>
          {/* name the band in the middle of the chart, where the eye already is */}
          <text
            x={x(pts[Math.max(pts.length - 2, 0)].n)}
            y={(y(last.coverage * 100) + y(last.accuracy * 100)) / 2}
            textAnchor="middle"
            className="fill-wrong-ink text-[10px] font-semibold"
          >
            generated, then thrown away
          </text>
        </g>
      ) : null}

      <path d={line((p) => p.accuracy)} fill="none" className="stroke-compute" strokeWidth={2.4} />
      {pts.map((p) => (
        <circle key={p.n} cx={x(p.n)} cy={y(p.accuracy * 100)} r={3.4} className="fill-compute" />
      ))}
      <text x={IW + 6} y={y(last.accuracy * 100) - 2} className="fill-compute-ink text-[10px] font-semibold">
        <tspan x={IW + 6} dy="0">majority</tspan>
        <tspan x={IW + 6} dy="11">voting</tspan>
      </text>

      <line x1={0} x2={IW} y1={y(cold * 100)} y2={y(cold * 100)} className="stroke-ink-muted" strokeWidth={1.4} strokeDasharray="2 3" />
      <text x={IW + 6} y={y(cold * 100) + 4} className="fill-ink-muted text-[10px]">
        <tspan x={IW + 6} dy="0">one greedy</tspan>
        <tspan x={IW + 6} dy="11">chain (T = 0)</tspan>
      </text>

      {pts[1] ? (
        <text x={x(pts[1].n)} y={y(pts[1].accuracy * 100) + 18} textAnchor="middle" className="fill-ink-muted text-[10px]">
          ties
        </text>
      ) : null}

      {/* Grab anywhere on the plot rather than having to hit the rule. It sits over
          the marks, so a drag that starts on a datum still moves N. */}
      <rect
        x={0}
        y={0}
        width={IW}
        height={IH}
        fill="transparent"
        className="cursor-ew-resize"
        onPointerDown={onPointer}
        onPointerMove={onPointer}
      />
      {/* The reader's position on the axis, and the control that moves it. Drawn last
          so it sits above the band and both lines; a rule plus rings, so it reads as
          "here" and not as another quantity. */}
      <g
        role="slider"
        tabIndex={0}
        aria-label={N_LABEL}
        aria-valuemin={ns[0]}
        aria-valuemax={ns[ns.length - 1]}
        aria-valuenow={sel.n}
        aria-valuetext={sel.n === 1 ? "1 sampled chain" : `${sel.n} sampled chains`}
        onKeyDown={onKey}
        className="cursor-ew-resize focus:outline-none [&:focus-visible>rect]:stroke-ink [&:focus-visible>rect]:stroke-2"
        data-testid="voters-marker"
      >
        <line x1={x(sel.n)} x2={x(sel.n)} y1={-6} y2={IH} className="stroke-compute" strokeWidth={1.5} />
        {showLost ? (
          <circle cx={x(sel.n)} cy={y(sel.coverage * 100)} r={5} className="fill-none stroke-wrong" strokeWidth={2} />
        ) : null}
        <circle cx={x(sel.n)} cy={y(sel.accuracy * 100)} r={5} className="fill-none stroke-compute" strokeWidth={2} />
        {/* The handle says "this moves", and it is the focus target, so keyboard and
            pointer readers look at one object. */}
        <rect x={x(sel.n) - 5} y={-14} width={10} height={10} rx={2} className="fill-compute" />
        <text
          x={sel.n === ns[ns.length - 1] ? x(sel.n) - 9 : x(sel.n) + 9}
          y={-5}
          textAnchor={sel.n === ns[ns.length - 1] ? "end" : "start"}
          className="fill-compute text-[10px] font-semibold tabular-nums"
        >
          {sel.n === 1 ? "1 chain" : `${sel.n} chains`}
        </text>
      </g>
    </ChartFrame>
  );
}

/* ------------------------------------------------------------------ figure 3 */

const FW = 620;
const FHGT = 320;
const FMARGIN = { top: 30, right: 116, bottom: 84, left: 46 };
const FIW = FW - FMARGIN.left - FMARGIN.right;
const FIH = FHGT - FMARGIN.top - FMARGIN.bottom;

/**
 * Step 4 as a fork rather than a table.
 *
 * What this replaces was a five-column table under a two-decker header: capped
 * solved, capped cut off, free solved, free tokens, all at three values of N.
 * The finding lives in the difference between two of those columns, and a
 * reader had to hold two numbers per row in their head and subtract. It also
 * hid the one fact that makes the panel an argument rather than two
 * experiments: at N = 1 the two runs ARE the same run, so the two series start
 * from a single point.
 *
 * So: one shared origin and two lines leaving it in opposite directions. The
 * gap between them at N = 16 is the whole claim, and it is a distance rather
 * than a subtraction. Underneath, on the same x positions, the share of chains
 * that hit the cap before finishing, because that is the CAUSE of the lower
 * line and the figure should not make the reader take it on trust: the fall
 * tracks the fill, 1% to 55% to 100%.
 *
 * The cost sits in the right-hand labels, since the step's title is a question
 * about cost and the answer is that finishing is dear and there is no cheaper
 * version of it.
 */
function ForkChart() {
  const capped = F2.split;
  const ns = capped.map((sp) => sp.n);
  const top = Math.max(...ns);
  const x = (n: number) => (Math.log2(n) / Math.log2(top)) * FIW;
  const y = (v: number) => FIH - (v / 100) * FIH;
  const free = (n: number) => F2.hot.points.find((p) => p.n === n);

  const path = (get: (n: number) => number | undefined) =>
    capped
      .map((sp, i) => {
        const v = get(sp.n);
        return v === undefined ? "" : `${i ? "L" : "M"}${x(sp.n)},${y(v * 100)}`;
      })
      .join(" ");

  const lastN = ns[ns.length - 1];
  const lastFree = free(lastN);
  const lastCapped = capped[capped.length - 1];
  const firstFree = free(ns[0]);

  // The cut-off gauge: a fixed track filled by the share that hit the cap.
  const TRACK = 58;
  const GAUGE_Y = FIH + 24;
  const GAUGE_H = 11;

  return (
    <ChartFrame
      title={`The same budget of ${tokens(M.split.budget_total)} tokens split N ways, against the same number of chains allowed to run to their own end. At one chain the cap almost never binds and the two are the same run, both solving ${pct(capped[0].accuracy)}. Splitting the fixed budget ${lastN} ways drops it to ${pct(lastCapped.accuracy)}, with ${pct(lastCapped.truncated_rate)} of chains cut off before they finish. The same ${lastN} chains allowed to finish solve ${pct(lastFree?.accuracy ?? 0)} for ${tokens(lastFree?.mean_tokens ?? 0)} tokens.`}
      width={FW}
      height={FHGT}
      margin={FMARGIN}
      xLabel="chains"
      yLabel="solved (%)"
    >
      {[0, 25, 50, 75, 100].map((t) => (
        <g key={t}>
          <line x1={0} x2={FIW} y1={y(t)} y2={y(t)} className="stroke-grid" strokeWidth={1} />
          <text x={-8} y={y(t) + 4} textAnchor="end" className="fill-ink-muted text-[10px]">
            {t}
          </text>
        </g>
      ))}

      {/* The fork itself, shaded, so the claim is an area and not an inference */}
      <path
        d={`${path((n) => free(n)?.accuracy)} ${[...capped]
          .reverse()
          .map((sp) => `L${x(sp.n)},${y(sp.accuracy * 100)}`)
          .join(" ")} Z`}
        className="fill-wrong opacity-[0.07]"
      />

      <path d={path((n) => free(n)?.accuracy)} fill="none" className="stroke-compute" strokeWidth={2.4} />
      <path d={path((n) => capped.find((sp) => sp.n === n)?.accuracy)} fill="none" className="stroke-wrong" strokeWidth={2.4} />

      {capped.map((sp) => {
        const f = free(sp.n);
        return (
          <g key={sp.n}>
            {f ? <circle cx={x(sp.n)} cy={y(f.accuracy * 100)} r={3.4} className="fill-compute" /> : null}
            <circle cx={x(sp.n)} cy={y(sp.accuracy * 100)} r={3.4} className="fill-wrong" />
          </g>
        );
      })}

      {/* The shared origin is the control and the reason this is one experiment */}
      {firstFree ? (
        <text x={6} y={y(firstFree.accuracy * 100) - 18} className="fill-ink-muted text-[10px]">
          at one chain the cap never binds: both lines are the same run
        </text>
      ) : null}

      <text x={FIW + 8} y={y((lastFree?.accuracy ?? 0) * 100) - 3} className="fill-compute-ink text-[10px] font-semibold">
        <tspan x={FIW + 8} dy="0">allowed to finish</tspan>
        <tspan x={FIW + 8} dy="11" className="fill-ink-muted font-normal">
          {tokens(lastFree?.mean_tokens ?? 0)} tokens
        </tspan>
      </text>
      <text x={FIW + 8} y={y(lastCapped.accuracy * 100) + 3} className="fill-wrong-ink text-[10px] font-semibold">
        <tspan x={FIW + 8} dy="0">capped to share</tspan>
        <tspan x={FIW + 8} dy="11" className="fill-ink-muted font-normal">
          {tokens(M.split.budget_total)} tokens
        </tspan>
      </text>

      {/* x ticks sit above the gauge so each count labels both at once */}
      {capped.map((sp) => (
        <text key={sp.n} x={x(sp.n)} y={FIH + 15} textAnchor="middle" className="fill-ink-muted text-[10px] tabular-nums">
          {sp.n}
        </text>
      ))}

      {/* the cause of the lower line, on the same x positions as the effect */}
      <text x={-8} y={GAUGE_Y + GAUGE_H - 1} textAnchor="end" className="fill-ink-muted text-[9px]">
        cut off
      </text>
      {capped.map((sp) => (
        <g key={`gauge-${sp.n}`}>
          <rect
            x={x(sp.n) - TRACK / 2}
            y={GAUGE_Y}
            width={TRACK}
            height={GAUGE_H}
            rx={2}
            className="fill-surface-raised stroke-grid"
            strokeWidth={1}
          />
          <rect
            x={x(sp.n) - TRACK / 2}
            y={GAUGE_Y}
            width={TRACK * sp.truncated_rate}
            height={GAUGE_H}
            rx={2}
            className="fill-wrong opacity-70"
          />
          <text
            x={x(sp.n)}
            y={GAUGE_Y + GAUGE_H + 12}
            textAnchor="middle"
            className="fill-ink-muted text-[10px] tabular-nums"
          >
            {pct(sp.truncated_rate)}
          </text>
        </g>
      ))}
    </ChartFrame>
  );
}

/* -------------------------------------------------------------------- page */

export function Page7() {
  const page = getPage(PAGE_N)!;
  const recordInteraction = useStore((s) => s.recordInteraction);
  // Which of the two problems, which answer to it is open, and which of that answer's
  // chains is being read. A problem opens on its CORRECT answer's first chain, so the
  // reader starts on a right solution, even when the vote did not return it; every
  // other answer is a row click away. The arrows only ever step within the open
  // answer: "64" has eight chains to read, "128" has two.
  const [problemIx, setProblemIx] = useState(0);
  const [open, setOpen] = useState(firstOpen(F1.showcase[0].problem));
  const [chainIx, setChainIx] = useState(0);
  // Index into the measured N axis, not N itself. Opens at the top of the axis,
  // so the reader's first sight of the chart is the finished result the prose
  // above it quotes, and adding a voter is something they take away rather than
  // something they build up to.
  const [voterIx, setVoterIx] = useState(F2.hot.points.length - 1);
  const voters = F2.hot.points[voterIx];
  // The third line and its band, what the vote threw away, are drawn on request.
  const [showLost, setShowLost] = useState(false);
  // The readout's baseline is the flat line the chart draws: one greedy chain.
  const cold = F2.cold.points[0].accuracy;
  const pointsVsGreedy = (acc: number) => {
    const d = Math.round((acc - cold) * 100);
    return d === 0
      ? "level with one greedy chain"
      : `${Math.abs(d)} point${Math.abs(d) === 1 ? "" : "s"} ${d > 0 ? "above" : "below"} one greedy chain`;
  };

  const shown = F1.showcase[problemIx];
  const s = shown.problem;
  const openRow = s.ranked.find((r) => r.answer === open) ?? s.ranked[0];
  const rowChains = chainsFor(s, openRow.answer);
  const chain = rowChains[chainIx];
  const last = F2.hot.points[F2.hot.points.length - 1];
  // What one chain spends against what the pile spends. The gap between them is what
  // "just give one chain more" would have to beat, and page 6 measured that arm: the
  // chain does carry on when it is pushed, it just does not score any better for it.
  const oneChainTokens = F2.hot.points[0].mean_tokens;
  const pileTokens = last.mean_tokens;

  // Clicking a row opens its first chain, unless that row is already open, in which
  // case nothing moves: a second click must not close it or lose the reader's place.
  const pick = (answer: string) => {
    recordInteraction(PAGE_N);
    if (answer === openRow.answer) return;
    setOpen(answer);
    setChainIx(0);
  };
  const step = (by: number) => {
    recordInteraction(PAGE_N);
    setChainIx((i) => Math.min(rowChains.length - 1, Math.max(0, i + by)));
  };
  const pickProblem = (i: number) => {
    recordInteraction(PAGE_N);
    setProblemIx(i);
    setOpen(firstOpen(F1.showcase[i].problem));
    setChainIx(0);
  };
  // The arrow keys step through the open answer while focus is in the card. Everywhere else
  // they turn the page (KeyboardNav), and a reader who has just clicked "next chain"
  // and reaches for the arrow key must not be sent to page 8.
  const onCardKey = (e: React.KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    e.stopPropagation();
    step(e.key === "ArrowRight" ? 1 : -1);
  };

  return (
    <article className="flex flex-col gap-6">
      <p className="text-xs font-eyebrow uppercase tracking-wide text-ink-muted">
        Act {page.act} · {ACTS[page.act].title}
      </p>
      {/* The notebook sits right beside the page title: the way to re-derive
          the page, where the page is named. */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h1 className="text-3xl font-bold text-ink">
          <span className="font-mono text-ink-muted">{page.n}. </span>
          {page.title}
        </h1>
        <NotebookDownload href={NOTEBOOK_ZIP} size={NOTEBOOK_SIZE} />
      </div>
      {/* Held to the content column: the margin is the notes column (15rem) plus the
          grid's column gap (2rem), so its right edge meets the body text's. */}
      <p className="text-lg text-ink-muted lg:mr-[17rem]">
        Page 6 made <strong className="text-ink">one chain longer</strong>, and ran out of road. So
        stop asking once: ask the <em>same</em> question many times, and keep the answer that comes
        up <strong className="text-ink">most often</strong>.
      </p>

      <div className="grid gap-x-8 gap-y-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
        {/* Step 1 */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">1. Many reasons, one answer</h2>
          <p className="text-ink">
            A teacher writes the puzzle below on the board. Twenty-five students solve it alone,
            each in their own way, and the teacher collects only the final answers. Sixteen say 4.
            The other nine are scattered across incorrect answers.
          </p>
          <FarmyardMethods />
          <p className="text-ink">
            When different methods land on the same answer, it&apos;s probably right, and the nine
            students who got it wrong couldn&apos;t even agree with each other. But if everyone had
            copied one student&apos;s working, you&apos;d only have one answer, which could be right
            or wrong. Asking a model the same question many times, letting it take different
            reasoning approaches and keeping the most common answer is <strong>majority voting</strong>, also called{" "}
            <strong>self-consistency</strong>.
            <Cite n={REF.wang} />
          </p>
        </section>
        <Note kicker="References">
          <RefItem n={REF.wang} href="https://arxiv.org/abs/2203.11171">
            Wang et al. 2022, <em>Self-Consistency Improves Chain of Thought Reasoning in Language
            Models</em> (ICLR 2023).
          </RefItem>
        </Note>

        {/* Step 2 */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">2. Sixteen answers to the same question</h2>
          <p className="text-ink-muted">
            {/* Temperature glossed operationally, which is all this page is allowed to
                say: docs/page_7_refactor.md:225-234 keeps the mechanism, tokens and
                probability distributions, off this page and on page 10. */}
            Now the model is the whole class. Here are two problems: on one the vote is right,
            and on the other it ties. Each one went to {PAGE7.primary.label} {F1.n_chains} times with sampling
            turned on, which is what <strong className="text-ink">temperature</strong> does.
            Temperature is a dial, written <span className="font-mono text-ink">T</span> on every
            chart on this page: at zero every chain comes back identical, and turning it up makes
            them disagree more.
            Every answer it came back with is tallied, like the answers on the board. Click a row to
            read the chains that landed there, wrong answers included, and use the arrows to step
            between them.
          </p>
          <ProblemPicker value={problemIx} onChange={pickProblem} />
          {/* onKeyDown: the arrow keys step chains while focus is in the card, rather
              than turning the page. */}
          <section
            aria-label={`One problem, ${F1.n_chains} chains, tallied`}
            onKeyDown={onCardKey}
            className="flex flex-col gap-4 rounded-lg border border-grid bg-surface p-4"
          >
            <p className="font-code text-sm leading-relaxed text-ink">{tidyMath(s.question)}</p>
            <p className="font-mono text-xs text-ink-muted">
              {BENCHMARK}, level {s.level} · the answer is {tidyMath(s.ground_truth)} ·{" "}
              {outcomeLine(shown.outcome, s)}
            </p>

            {/* The invitation is the last line of the step's intro, directly above this
                card. It used to be repeated here, near-verbatim. */}
            <Tally problem={s} onOpen={pick} open={open} />

            <div
              className={`flex flex-col gap-3 rounded-lg border-l-4 p-3 ${
                chain.correct ? "border-correct bg-correct/10" : "border-wrong bg-wrong/10"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-ink">
                  <strong className={openRow.correct ? "text-correct-ink" : "text-wrong-ink"}>
                    {tidyMath(openRow.answer)}
                  </strong>{" "}
                  · {openRow.votes} of {F1.n_chains} chains ·{" "}
                  {/* No claim about HOW a row's chains went wrong. "They got there by
                      different routes" used to be appended to every wrong row with more
                      than one chain, unchecked; on algebra 224 all fifteen chains that
                      say 7 make the same slip (they stop listing at 11). */}
                  {openRow.correct ? "correct" : "wrong"}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Previous chain"
                    disabled={chainIx === 0}
                    onClick={() => step(-1)}
                    className="h-7 w-7 rounded border border-grid bg-surface text-ink hover:bg-surface-raised disabled:opacity-40"
                  >
                    ‹
                  </button>
                  <span
                    aria-live="polite"
                    className="w-24 text-center font-mono text-xs tabular-nums text-ink"
                  >
                    chain {chainIx + 1} of {rowChains.length}
                  </span>
                  <button
                    type="button"
                    aria-label="Next chain"
                    disabled={chainIx === rowChains.length - 1}
                    onClick={() => step(1)}
                    className="h-7 w-7 rounded border border-grid bg-surface text-ink hover:bg-surface-raised disabled:opacity-40"
                  >
                    ›
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <p className="font-mono text-xs text-ink-muted">
                  {tokens(chain.own_tokens)} tokens
                  {chain.truncated ? " · hit its cap and was made to commit" : ""}
                </p>
                {/* Keyed on the chain so the next one opens folded again. */}
                <ChainText key={`${problemIx}-${chain.sample_index}`} chain={chain} />
              </div>
            </div>
          </section>
          <p className="text-sm text-ink-muted">
            The winning answer holds {F1.shape.mean_top_votes.toFixed(1)} of {F1.shape.n_chains}{" "}
            votes on average across all {M.items.n} problems, against{" "}
            {F1.shape.mean_distinct.toFixed(1)} distinct answers. Agreement concentrates; the rest
            is a scatter of near-misses, {pct(F1.shape.singleton_share)} of which are said exactly
            once.
          </p>
          <p className="text-ink-muted">
            Here is the vote on {HM.problems.length} of these problems at all{" "}
            {HM.temperatures.length} temperatures, {HM.n_chains} chains each.
          </p>
          <TemperatureHeatmap />
        </section>
        <Note kicker="Read it as">
          <p>
            Each chain is one student, and each answer is a number on the board. Two chains landing on the
            same wrong answer usually got there by different mistakes, which is why the tail stays a
            scatter.
          </p>
        </Note>

        {/* Step 3 */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">3. Greedy decoding against majority voting</h2>
          {/* Step 2 showed the vote on two problems; this asks how it compares with one
              plain chain at scale. Majority voting is not re-explained: step 1's analogy
              does that. The flat line's meaning (every greedy chain is the same chain) is
              said under the chart, where the headline leads into the temperature card. */}
          <p className="text-ink-muted">
            Just now, we saw majority voting on two separate problems, and how different
            reasoning across many chains of thought can lead to many different answers. But how
            does majority voting compare with a single, pure chain of thought? Below, we compare
            majority voting against greedy decoding on all {M.items.n} {BENCHMARK} problems at{" "}
            {LEVELS}. <strong className="text-ink">One greedy chain</strong> is the baseline to beat.
          </p>
          {/* The widget is the chart and its controls. Every sentence that used to sit
              in here (the band note, the headline, two footnotes) is outside it now or
              gone: the figure has to carry the step on its own. */}
          <section
            aria-label="Accuracy against the number of chains"
            className="flex flex-col gap-4 rounded-lg border border-grid bg-surface p-4"
          >
            <PileChart
              at={voterIx}
              showLost={showLost}
              onAt={(i) => {
                recordInteraction(PAGE_N);
                setVoterIx(i);
              }}
            />
            {/* Every value below is a measured point on the run's own N axis; the
                rule on the chart steps between them and never lands off one. */}
            <div className="flex flex-col gap-2">
              {/* One sentence, measured against the line the reader can see. It used
                  to compare against one SAMPLED chain, which the chart does not draw. */}
              <p aria-live="polite" className="text-sm text-ink">
                {voters.n === 1 ? (
                  <>
                    With one chain there is no vote yet: that one sampled chain solves{" "}
                    <strong className="font-mono">{pct(voters.accuracy)}</strong>,{" "}
                    {pointsVsGreedy(voters.accuracy)}.
                  </>
                ) : (
                  <>
                    With {voters.n} sampled chains, majority voting solves{" "}
                    <strong className="font-mono">{pct(voters.accuracy)}</strong>,{" "}
                    <strong>{pointsVsGreedy(voters.accuracy)}</strong>
                    {voters.accuracy < cold ? `: ${pct(voters.tie_rate)} of these votes tie.` : "."}
                  </>
                )}
                {showLost ? (
                  <span className="text-ink-muted">
                    {" "}
                    The right answer was among the chains on {pct(voters.coverage)}.
                  </span>
                ) : null}
              </p>
              <button
                type="button"
                aria-pressed={showLost}
                onClick={() => {
                  recordInteraction(PAGE_N);
                  setShowLost((v) => !v);
                }}
                className="inline-flex items-center gap-1.5 self-start rounded border border-compute bg-compute/10 px-2.5 py-1 text-xs font-semibold text-compute transition-colors hover:bg-compute hover:text-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-compute focus-visible:ring-offset-1"
              >
                <span aria-hidden="true">{showLost ? "▾" : "▸"}</span>
                {showLost ? "Hide what the vote threw away" : "Show what the vote threw away"}
              </button>
            </div>
          </section>
          {/* The headline, and the bridge into the temperature card below it. Its guard
              (some of the 12 is sampling, not counting) is carried by the figure: the vote
              line starts above the greedy line at one chain, and the readout there says
              so. See the file header. "Every chain gives the same answer" at T = 0 is the
              card's own first number, 1.0, and the tests hold it there. */}
          <p className="text-ink">
            One greedy chain solves <strong className="font-mono">{pct(F2.gain.bare_cot)}</strong>,
            which is <strong>{F2.gain.gain_pts.toFixed(0)} points</strong> less than majority voting
            with {F1.n_chains} sampled chains. Those {F2.gain.gain_pts.toFixed(0)} points exist only
            because the chains disagree. At T = 0 every chain gives the same answer, so there is
            nothing to vote on; turn the temperature up and the answers start to differ. Here is by
            how much:
          </p>
          {/* The temperature sweep as a small figure, not a second boxed widget: the
              chart above is the step's one framed panel, and this is what the paragraph's
              "Here is by how much:" points at. Bars run on a fixed 0 to n_chains scale,
              the most different answers that many chains can give, so a full bar would be
              every chain disagreeing. The pile's temperature is drawn in the majority-
              voting line's colour, because those are the chains the chart above votes on. */}
          <figure
            aria-label={`Different answers among ${F2.diversity[0].n_chains} chains, by temperature`}
            className="flex max-w-md flex-col gap-1.5"
          >
            <p className="text-xs font-semibold font-eyebrow uppercase tracking-wide text-ink-muted">
              different answers among {F2.diversity[0].n_chains} chains, by temperature
            </p>
            {[...F2.diversity]
              .sort((a, b) => a.temperature - b.temperature)
              .map((d) => {
                const pile = d.temperature === F2.hot.temperature;
                return (
                  <div
                    key={d.temperature}
                    data-testid="diversity-bar"
                    data-value={d.mean_distinct}
                    className="flex items-center gap-2 text-xs"
                  >
                    <span
                      className={`w-14 shrink-0 font-mono tabular-nums ${pile ? "font-semibold text-compute" : "text-ink-muted"}`}
                    >
                      T = {d.temperature}
                    </span>
                    <span className="flex h-3 flex-1 items-center">
                      <span
                        className={`h-full rounded-sm ${pile ? "bg-compute" : "bg-ink-faint/40"}`}
                        style={{ width: `${(d.mean_distinct / d.n_chains) * 100}%` }}
                      />
                      <span
                        className={`ml-1.5 font-mono tabular-nums ${pile ? "font-semibold text-compute" : "text-ink"}`}
                      >
                        {d.mean_distinct.toFixed(1)}
                      </span>
                    </span>
                  </div>
                );
              })}
            <figcaption className="pt-1 text-xs text-ink-muted">
              Averaged over {F2.diversity[0].n_items} problems; a count of answers, not an
              accuracy. More is not better: the vote comes out the same at T = {F2.hot.temperature}{" "}
              and {TIED_WITH_HOT}, and worse above that.
            </figcaption>
          </figure>
        </section>
        {/* Step 4. Starts a new grid row explicitly: step 3 has no margin note, so
            without this the section would flow into the note column. */}
        <section className="flex min-w-0 flex-col gap-3 lg:col-start-1">
          <h2 className="text-xl font-semibold text-ink">4. Sharing a fixed budget between chains</h2>
          <p className="text-ink-muted">
            Sixteen chains cost sixteen times the tokens. So what if you do not have sixteen times
            the budget? Below, one fixed budget of {tokens(M.split.budget_total)} tokens is divided
            between the chains, and the same chains are run again with no budget at all. Read it as
            two lines, not two experiments: at every point on the x axis the model gets the same
            number of chains, and the only thing that changes between the lines is whether it is
            allowed to finish them. They start as one run and end a long way apart.
          </p>
          <section
            aria-label="The same budget split N ways"
            className="flex flex-col gap-3 rounded-lg border border-grid bg-surface p-4"
          >
            <ForkChart />
            <p className="text-xs text-ink-muted">
              The gauge under each count is the share of that run&apos;s chains that hit the cap and
              were made to commit mid-thought, which is a property of the run rather than a score.
            </p>
            <p className="text-ink">
              Dividing a budget does two things at once. One, it adds chains, and two, it shortens
              every one of them. The shortening is the one that lands. At{" "}
              {F2.split[F2.split.length - 1].n} chains the budget leaves each with only{" "}
              {tokens(Math.round(M.split.budget_total / F2.split[F2.split.length - 1].n))} tokens.
              Every chain hits that ceiling before finishing, and the vote is counting fragments of
              arguments rather than arguments.{" "}
              <strong className="text-ink">Splitting is not what fails, capping is.</strong> Let the
              same chains run to their own end and the vote indeed works, at {tokens(pileTokens)}{" "}
              tokens for {last.n} chains vs {tokens(oneChainTokens)} for one. There are two ways of
              spending here, divide one budget, or let every chain finish. The second one is the
              winner.
            </p>
          </section>
        </section>
        {/* Step 5. Page 12's closing shape: prose at full width in the reading
            column, no card and no display number, and the limits brought in from
            the margin. They were three caveats in 9px grey beside the one claim
            they qualify, which is the wrong place for the honest half of a page. */}
        <section className="flex min-w-0 flex-col gap-3 lg:col-start-1">
          <h2 className="text-xl font-semibold text-ink">5. What the vote threw away</h2>
          <p className="text-ink">
            <strong className="text-ink">The pile knows more than the count.</strong> The right
            answer was somewhere in the {H.n_chains} chains on{" "}
            <strong className="text-ink">{pct(H.coverage)}</strong> of these problems. The vote
            returned it on <strong className="text-ink">{pct(H.plurality_accuracy)}</strong>. For
            the <strong className="text-ink">{pct(H.thrown_away)}</strong> in between, the model
            produced the right answer and the vote discarded it. This is because counting can only
            ever return the answer that comes up most, and on {pct(H.tie_rate)} of problems it could
            not even break a tie!
          </p>

          {/* Not "keeps the same candidates": page 8 generated its own pool, and
              its own derived.json says so in a field called same_candidates. What
              it did do is re-run this protocol and land here, which is the claim
              that survives the artifact. */}
          <Handoff>
            The counting rule is the weakest part of the method: it picks by popularity, and the
            popular answer is not always the right one when the right one is already among the
            chains. It also only ever looks at the answer, never at the reasoning that reached it, so a
            chain can agree with the majority for bad reasons and be counted anyway.{" "}
            <em>
              Page 8 re-runs this protocol, lands where this page landed, then changes one rule for
              picking one of the {H.n_chains}: stop counting, start judging.
            </em>
          </Handoff>
        </section>
      </div>

      <PageNav n={PAGE_N} />
    </article>
  );
}
