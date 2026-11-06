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
 *   histogram. Since 2026-11-05 that tally is the step's ONE figure (author): the
 *   temperature heat map and the shape stat (9.9 of 16 votes, 5.1 distinct
 *   answers) are cut, since step 3 says the same in aggregate. The chains are
 *   folded until a row is clicked, and clicking the open row folds it again; the
 *   arrows step only within the open answer. Each chain shows its opening and its
 *   ending with the middle folded, because chains run to 272 lines and the ending
 *   is what a reader is looking for. The run's `errors_are_diffuse` gate is FALSE
 *   at a 50% threshold, so no sentence may say wrong answers all disagree or that
 *   chains sharing a wrong answer made different mistakes. Do not bucket the
 *   singletons.
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
 *   · the temperature figures (section 2's heat map, section 3's lines and the bar
 *     figure under them) all read the temperature sweep, and say how many problems it
 *     covers (40 of the 100 until the 100-problem run lands). The bars are a count of
 *     answers, not an accuracy, and the caption must keep saying so.
 *   · Wang et al. is cited for the TECHNIQUE. No cite may carry one of our
 *     numbers.
 */

import { Fragment, useId, useRef, useState } from "react";
import { Handoff } from "@/components/Handoff";
import { ChartFrame } from "@/components/ChartFrame";
import { Cite, RefItem } from "@/components/Cite";
import { PageNav } from "@/components/PageNav";
import { NotebookDownload } from "@/components/NotebookDownload";
import { ACTS, getPage } from "@/lib/pages";
import {
  PAGE7,
  type SweepPoint,
  chainsFor,
  foldTrace,
  pLabel,
  pct,
  tidyMath,
  tokens,
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
const NOTEBOOK_SIZE = "7.5 MB";

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
/** One decimal for every temperature but zero, so 1.0 reads like its neighbours. */
const tLabel = (t: number) => (t === 0 ? "0" : t.toFixed(1));

/* Section 3 reads the same sweep: a line per temperature over the N axis. Temperature 0
   is one greedy chain copied, so its line is the flat baseline, not one of the voting
   lines. The page says how many problems the sweep covers (40 for now; 100 when the
   overnight extension lands), so the chart and its prose always describe the same run. */
const sweepLine = (t: number): SweepPoint[] => HM.curves[t.toFixed(1)];
/* Every temperature of the sweep, T = 0 included: its line is the greedy chain (16
   identical chains vote exactly as one does), so it lies on the dashed baseline. */
const SWEEP_TEMPS = HM.temperatures;
/** The temperatures section 3's band spans: every sampled one (T = 0 is the greedy line). */
const BAND_TEMPS = SWEEP_TEMPS.filter((t) => t > 0);
const GREEDY = sweepLine(0)[0].accuracy;
const SWEEP_PROBLEMS = HM.problems.length;
/* The bar figure's caption, read off the sweep: the temperatures tied with the best (the
   page says so rather than naming one winner), and one chain alone from the coolest
   sampled setting to the hottest. */
const SWEEP_BY_T = [...HM.summary].sort((a, b) => a.temperature - b.temperature);
const SWEEP_TIED = SWEEP_BY_T.filter(
  (d) =>
    Math.abs(d.vote_accuracy - Math.max(...SWEEP_BY_T.map((x) => x.vote_accuracy))) < 1e-9 &&
    d.temperature !== HM.best_temperature,
).map((d) => `T = ${tLabel(d.temperature)}`);
const COOL = SWEEP_BY_T.find((d) => d.temperature > 0)!;
/** The bar figure's scale: the tallest value, rounded up to a whole answer. */
const DISTINCT_TOP = Math.ceil(Math.max(...SWEEP_BY_T.map((d) => d.mean_distinct)));
const HOT = SWEEP_BY_T[SWEEP_BY_T.length - 1];

/** Cool to warm as temperature rises: the page's blue into its orange. */
const tempColour = (t: number) => {
  const hot = Math.max(...SWEEP_TEMPS);
  return `color-mix(in srgb, var(--compute) ${Math.round((t / hot) * 100)}%, var(--wrong))`;
};

/** Which temperature's line is highlighted. The best one is chosen to start. */
function TempPicker({ value, onChange }: { value: number; onChange: (t: number) => void }) {
  const name = useId();
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className="text-xs text-ink-muted">Temperature</span>
      <div role="radiogroup" aria-label="Temperature" className="flex flex-wrap gap-1">
        {SWEEP_TEMPS.map((t) => (
          <label key={t} className="cursor-pointer">
            <input
              type="radio"
              name={name}
              className="peer sr-only"
              checked={value === t}
              aria-label={`T = ${tLabel(t)}${t === HM.best_temperature ? ", the best" : ""}`}
              onChange={() => onChange(t)}
            />
            <span className="flex items-center gap-1 rounded border border-grid px-1.5 py-0.5 font-mono text-[11px] tabular-nums text-ink peer-focus-visible:ring-2 peer-focus-visible:ring-compute peer-checked:border-compute peer-checked:bg-compute peer-checked:text-canvas">
              <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: tempColour(t) }} />
              {tLabel(t)}
              {t === HM.best_temperature ? <span aria-hidden="true">★</span> : null}
            </span>
          </label>
        ))}
      </div>
    </div>
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
  temp,
}: {
  at: number;
  showLost: boolean;
  onAt: (i: number) => void;
  /** The highlighted temperature; every other one is drawn faint behind it. */
  temp: number;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const pts = sweepLine(temp);
  const ns = HM.n_axis;
  const sel = pts[at];
  const x = (n: number) => (Math.log2(n) / Math.log2(Math.max(...ns))) * IW;
  const y = (v: number) => IH - (v / 100) * IH;
  const pathOf = (line: SweepPoint[], get: (p: SweepPoint) => number) =>
    line.map((p, i) => `${i ? "L" : "M"}${x(p.n)},${y(get(p) * 100)}`).join(" ");
  const line = (get: (p: SweepPoint) => number) => pathOf(pts, get);
  const cold = GREEDY;
  const last = pts[pts.length - 1];
  // The band: at each N, the lowest and highest vote across the sampled temperatures.
  const bandLo = ns.map((_, i) => Math.min(...BAND_TEMPS.map((t) => sweepLine(t)[i].accuracy)));
  const bandHi = ns.map((_, i) => Math.max(...BAND_TEMPS.map((t) => sweepLine(t)[i].accuracy)));
  const bandPath =
    ns.map((n, i) => `${i ? "L" : "M"}${x(n)},${y(bandHi[i] * 100)}`).join(" ") +
    " " +
    [...ns]
      .map((n, i) => ({ n, i }))
      .reverse()
      .map(({ n, i }) => `L${x(n)},${y(bandLo[i] * 100)}`)
      .join(" ") +
    " Z";
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
      title={`Share of ${SWEEP_PROBLEMS} ${BENCHMARK} problems, ${LEVELS}, solved by ${PAGE7.primary.label} against the number of sampled chains, at ${HM.temperatures.length - 1} temperatures. One greedy chain solves ${pct(cold)} and stays there however many copies are made of it. At T = ${tLabel(temp)}, majority voting solves ${pct(last.accuracy)} over sixteen sampled chains; across every sampled temperature it solves ${pct(bandLo[bandLo.length - 1])} to ${pct(bandHi[bandHi.length - 1])}.${showLost ? ` At least one chain was right on ${pct(last.coverage)}, so ${pct(last.coverage - last.accuracy)} of problems had the right answer generated and discarded by the vote.` : ""}`}
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

      {/* Every sampled temperature (T = 0.1 to the hottest) as one band, lowest to
          highest accuracy at each N, instead of a faint line each: the band says "at any
          temperature, voting lands in here", and the picked temperature is the line drawn
          on top of it. Neutral, so it never reads as the vote's thrown-away band. */}
      <path data-testid="temperature-band" d={bandPath} className="fill-ink-faint" opacity={0.16} />
      <text
        x={x(ns[ns.length - 2])}
        y={y(bandHi[ns.length - 2] * 100) - 7}
        textAnchor="middle"
        className="fill-ink-muted text-[10px]"
      >
        every temperature, T = {tLabel(BAND_TEMPS[0])} to {tLabel(BAND_TEMPS[BAND_TEMPS.length - 1])}
      </text>
      <path
        data-testid={`sweep-line-${tLabel(temp)}`}
        d={line((p) => p.accuracy)}
        fill="none"
        className="stroke-compute"
        strokeWidth={2.4}
      />
      {pts.map((p) => (
        <circle key={p.n} cx={x(p.n)} cy={y(p.accuracy * 100)} r={3.4} className="fill-compute" />
      ))}
      {/* At T = 0 the highlighted line IS the greedy baseline, which is labelled already. */}
      {temp !== 0 ? (
        <text x={IW + 6} y={y(last.accuracy * 100) - 2} className="fill-compute-ink text-[10px] font-semibold">
          <tspan x={IW + 6} dy="0">majority voting</tspan>
          <tspan x={IW + 6} dy="11">T = {tLabel(temp)}</tspan>
        </text>
      ) : null}

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
const FHGT = 290;
const FMARGIN = { top: 30, right: 128, bottom: 46, left: 46 };
const FIW = FW - FMARGIN.left - FMARGIN.right;
const FIH = FHGT - FMARGIN.top - FMARGIN.bottom;

/** The three shared budgets get one hue, light to dark as the budget grows. */
const BUDGET_SHADE = [0.4, 0.68, 1];

/**
 * Step 4 as a fan: N chains sharing a fixed budget of 2,048, 4,096 or 8,192
 * tokens, B/N each, against the same chains each allowed to finish.
 *
 * Allowed to finish IS section 3's majority-voting line (the pile, which about 1%
 * of chains ever reach the cap of), so it is drawn in that line's colour and the
 * page quotes one number for sixteen chains, not two draws that differ by chance.
 * The three budgets are one hue, light to dark as the budget grows.
 *
 * At one chain no cap binds and all four lines start together, which is the
 * control that makes this one experiment rather than four. They fan apart as N
 * grows, and the order of the fan is the finding: the smaller the budget each
 * chain gets, the further the vote falls. The cause, the share of chains cut off
 * by their cap, is behind the widget's toggle (CutOffGrid) rather than drawn under
 * the axis, where four series of gauges would crowd the chart.
 *
 * The right-hand labels are spread so they never overlap; at N = 4 three of the
 * lines sit at the same height, which is a fact about the data, not a drawing
 * error, and the readers see the lines merge there.
 */
function ForkChart() {
  const budgets = F2.budgets;
  const finish = F2.uncapped.points;
  const ns = finish.map((p) => p.n);
  const top = Math.max(...ns);
  const x = (n: number) => (Math.log2(n) / Math.log2(top)) * FIW;
  const y = (share: number) => FIH - share * FIH;
  const path = (pts: { n: number; accuracy: number }[]) =>
    pts.map((p, i) => `${i ? "L" : "M"}${x(p.n)},${y(p.accuracy)}`).join(" ");

  // Right-hand labels at each line's last point, nudged apart to a minimum gap.
  const ends = [
    ...budgets.map((b, i) => ({
      key: `b${b.budget}`,
      text: `${tokens(b.budget)} shared`,
      y: y(b.points[b.points.length - 1].accuracy),
      shade: BUDGET_SHADE[i] ?? 1,
      finish: false,
    })),
    { key: "finish", text: "allowed to finish", y: y(finish[finish.length - 1].accuracy), shade: 1, finish: true },
  ].sort((a, b) => a.y - b.y);
  for (let i = 1; i < ends.length; i++) ends[i].y = Math.max(ends[i].y, ends[i - 1].y + 12);
  const lastFinish = finish[finish.length - 1];

  return (
    <ChartFrame
      title={`Share of ${M.items.n} problems solved against the number of chains, when the chains share a fixed budget of ${budgets.map((b) => tokens(b.budget)).join(", ")} tokens, and when each is allowed to finish. At one chain all four solve about ${pct(finish[0].accuracy)}. At ${top} chains, allowed to finish solves ${pct(lastFinish.accuracy)}; ${budgets.map((b) => `${tokens(b.budget)} shared solves ${pct(b.points[b.points.length - 1].accuracy)}`).join(", ")}.`}
      width={FW}
      height={FHGT}
      margin={FMARGIN}
      xLabel="# of sampled chains"
      yLabel="solved (%)"
    >
      {[0, 25, 50, 75, 100].map((t) => (
        <g key={t}>
          <line x1={0} x2={FIW} y1={FIH - (t / 100) * FIH} y2={FIH - (t / 100) * FIH} className="stroke-grid" strokeWidth={1} />
          <text x={-8} y={FIH - (t / 100) * FIH + 4} textAnchor="end" className="fill-ink-muted text-[10px]">
            {t}
          </text>
        </g>
      ))}
      {ns.map((n) => (
        <text key={n} x={x(n)} y={FIH + 16} textAnchor="middle" className="fill-ink-muted text-[10px] tabular-nums">
          {n}
        </text>
      ))}

      {budgets.map((b, i) => (
        <g key={b.budget} data-testid={`budget-line-${b.budget}`} strokeOpacity={BUDGET_SHADE[i] ?? 1}>
          <path d={path(b.points)} fill="none" className="stroke-wrong" strokeWidth={2.2} />
          {b.points.map((p) => (
            <circle key={p.n} cx={x(p.n)} cy={y(p.accuracy)} r={3.2} className="fill-wrong" fillOpacity={BUDGET_SHADE[i] ?? 1} />
          ))}
        </g>
      ))}
      {/* Drawn last: where the lines meet, the one the reader came from stays on top. */}
      <g data-testid="finish-line">
        <path d={path(finish)} fill="none" className="stroke-compute" strokeWidth={2.6} />
        {finish.map((p) => (
          <circle key={p.n} cx={x(p.n)} cy={y(p.accuracy)} r={3.6} className="fill-compute" />
        ))}
      </g>

      <text x={6} y={y(finish[0].accuracy) - 14} className="fill-ink-muted text-[10px]">
        at one chain no cap binds: all four start together
      </text>

      {ends.map((e) => (
        <text
          key={e.key}
          x={FIW + 8}
          y={e.y + 3}
          className={`text-[10px] font-semibold ${e.finish ? "fill-compute-ink" : "fill-wrong-ink"}`}
          fillOpacity={e.finish ? 1 : Math.max(e.shade, 0.55)}
        >
          {e.text}
        </text>
      ))}
    </ChartFrame>
  );
}

/**
 * Why the budget lines fall: the share of each budget's chains cut off by their cap
 * and made to commit mid-thought, at every N. Behind the widget's toggle. It is a
 * property of the run, not a score, so it is a small grid of gauges and not a line.
 */
function CutOffGrid() {
  const budgets = F2.budgets;
  const ns = budgets[0].points.map((p) => p.n);
  return (
    <div data-testid="cut-off-grid" className="flex flex-col gap-1.5 text-xs">
      <p className="text-ink-muted">Share of chains cut off by their cap before they finished:</p>
      <div className="grid max-w-md grid-cols-[6.5rem_repeat(3,minmax(0,1fr))] items-center gap-x-3 gap-y-1">
        <span />
        {ns.map((n) => (
          <span key={n} className="font-mono tabular-nums text-ink-muted">
            {n === 1 ? "1 chain" : `${n} chains`}
          </span>
        ))}
        {budgets.map((b, i) => (
          <Fragment key={b.budget}>
            <span className="font-semibold text-wrong-ink" style={{ opacity: Math.max(BUDGET_SHADE[i] ?? 1, 0.55) }}>
              {tokens(b.budget)} shared
            </span>
            {b.points.map((p) => (
              <span key={p.n} className="flex items-center gap-1.5">
                <span className="h-2 w-12 overflow-hidden rounded-sm bg-surface-raised ring-1 ring-grid">
                  <span className="block h-full bg-wrong/70" style={{ width: `${p.truncated_rate * 100}%` }} />
                </span>
                <span className="font-mono tabular-nums text-ink-muted">{pct(p.truncated_rate)}</span>
              </span>
            ))}
          </Fragment>
        ))}
      </div>
    </div>
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
  // Since 2026-11-05 nothing is open until the reader clicks a row (author: section 2
  // down to one figure, the tally); clicking the open row folds it again.
  const [problemIx, setProblemIx] = useState(0);
  const [open, setOpen] = useState<string | null>(null);
  const [chainIx, setChainIx] = useState(0);
  // Index into the measured N axis, not N itself. Opens at the top of the axis,
  // so the reader's first sight of the chart is the finished result the prose
  // above it quotes, and adding a voter is something they take away rather than
  // something they build up to.
  const [voterIx, setVoterIx] = useState(HM.n_axis.length - 1);
  // Section 3's highlighted temperature; it starts on the sweep's best.
  const [tempSel, setTempSel] = useState(HM.best_temperature);
  const voters = sweepLine(tempSel)[voterIx];
  // The headline: the best temperature's vote at 16 chains against one greedy chain.
  const bestTop = sweepLine(HM.best_temperature)[HM.n_axis.length - 1].accuracy;
  const gainPts = Math.round((bestTop - GREEDY) * 100);
  // The third line and its band, what the vote threw away, are drawn on request.
  const [showLost, setShowLost] = useState(false);
  // Section 4's cause, the share of chains cut off by their cap, is shown on request.
  const [showCut, setShowCut] = useState(false);
  // The closing paragraph's two cases: the smallest and largest budget at the most chains.
  const atTop = (b: (typeof F2.budgets)[number]) => ({
    budget: b.budget,
    ...b.points[b.points.length - 1],
  });
  const cutLow = atTop(F2.budgets[0]);
  const cutHigh = atTop(F2.budgets[F2.budgets.length - 1]);
  // The readout's baseline is the flat line the chart draws: one greedy chain.
  const cold = GREEDY;
  const pointsVsGreedy = (acc: number) => {
    const d = Math.round((acc - cold) * 100);
    return d === 0
      ? "level with one greedy chain"
      : `${Math.abs(d)} point${Math.abs(d) === 1 ? "" : "s"} ${d > 0 ? "above" : "below"} one greedy chain`;
  };

  const shown = F1.showcase[problemIx];
  const s = shown.problem;
  const openRow = open === null ? null : (s.ranked.find((r) => r.answer === open) ?? null);
  const rowChains = openRow ? chainsFor(s, openRow.answer) : [];
  const chain = rowChains[chainIx];
  const last = F2.hot.points[F2.hot.points.length - 1];
  // What one chain spends against what the pile spends. The gap between them is what
  // "just give one chain more" would have to beat, and page 6 measured that arm: the
  // chain does carry on when it is pushed, it just does not score any better for it.
  const oneChainTokens = F2.hot.points[0].mean_tokens;
  const pileTokens = last.mean_tokens;

  // Clicking a row opens its first chain; clicking the open row folds it again.
  const pick = (answer: string) => {
    recordInteraction(PAGE_N);
    setOpen((cur) => (cur === answer ? null : answer));
    setChainIx(0);
  };
  const step = (by: number) => {
    recordInteraction(PAGE_N);
    setChainIx((i) => Math.min(rowChains.length - 1, Math.max(0, i + by)));
  };
  const pickProblem = (i: number) => {
    recordInteraction(PAGE_N);
    setProblemIx(i);
    setOpen(null);
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
      {/* The download shares the top line with the act kicker, page 5's shape:
          the first thing on the page after the title row is the way to
          re-derive all of it. */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="text-xs font-eyebrow uppercase tracking-wide text-ink-muted">
          Act {page.act} · {ACTS[page.act].title}
        </p>
        <NotebookDownload href={NOTEBOOK_ZIP} size={NOTEBOOK_SIZE} />
      </div>
      <h1 className="text-3xl font-bold text-ink">
        <span className="font-mono text-ink-muted">{page.n}. </span>
        {page.title}
      </h1>
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

            {/* The chains stay folded until a row is clicked (author, 2026-11-05: section 2
                down to one figure, the tally). */}
            {openRow && chain ? (
            <div
              data-testid="chain-reader"
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
            ) : null}
          </section>
        </section>
        {/* The note's second sentence, that chains sharing a wrong answer got there by
            different mistakes, went with the cut: it was never checked, and on algebra 224
            fifteen chains make the same slip. */}
        <Note kicker="Read it as">
          <p>Each chain is one student, and each answer is a number on the board.</p>
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
            majority voting at {SWEEP_TEMPS.length} temperatures against greedy decoding, on{" "}
            {SWEEP_PROBLEMS === M.items.n ? `all ${M.items.n}` : `${SWEEP_PROBLEMS} of the ${M.items.n}`}{" "}
            {BENCHMARK} problems at {LEVELS}. <strong className="text-ink">One greedy chain</strong>{" "}
            is the baseline to beat.
          </p>
          {/* The widget is the chart and its controls. Every sentence that used to sit
              in here (the band note, the headline, two footnotes) is outside it now or
              gone: the figure has to carry the step on its own. */}
          <section
            aria-label="Accuracy against the number of chains"
            className="flex flex-col gap-4 rounded-lg border border-grid bg-surface p-4"
          >
            <TempPicker
              value={tempSel}
              onChange={(t) => {
                recordInteraction(PAGE_N);
                setTempSel(t);
              }}
            />
            <PileChart
              at={voterIx}
              temp={tempSel}
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
                {tempSel === 0 ? (
                  <>
                    At T = 0 every chain is the same greedy chain, so{" "}
                    {voters.n === 1 ? "one" : voters.n} of them solve{" "}
                    <strong className="font-mono">{pct(voters.accuracy)}</strong>, exactly what one
                    greedy chain does: there is nothing to vote on.
                  </>
                ) : voters.n === 1 ? (
                  <>
                    With one chain at T = {tLabel(tempSel)} there is no vote yet: that one sampled
                    chain solves{" "}
                    <strong className="font-mono">{pct(voters.accuracy)}</strong>,{" "}
                    {pointsVsGreedy(voters.accuracy)}.
                  </>
                ) : (
                  <>
                    With {voters.n} sampled chains at T = {tLabel(tempSel)}, majority voting solves{" "}
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
            One greedy chain solves <strong className="font-mono">{pct(GREEDY)}</strong>, which is{" "}
            <strong>{gainPts} points</strong> less than majority voting with {HM.n_chains} sampled
            chains at T = {tLabel(HM.best_temperature)}. Those {gainPts} points exist only
            because the chains disagree. At T = 0 every chain gives the same answer, so there is
            nothing to vote on; turn the temperature up and the answers start to differ. Here is by
            how much:
          </p>
          {/* The temperature sweep as a small figure, not a second boxed widget: the
              chart above is the step's one framed panel, and this is what the paragraph's
              "Here is by how much:" points at. Columns start at zero and are labelled
              with their values. It reads the same sweep as the chart above and the heat
              map, and the best temperature is drawn in the majority-voting colour. */}
          <figure
            aria-label={`Different answers among ${HM.n_chains} chains, by temperature`}
            className="flex max-w-md flex-col gap-1.5"
          >
            <p className="text-xs font-semibold font-eyebrow uppercase tracking-wide text-ink-muted">
              different answers among {HM.n_chains} chains, by temperature
            </p>
            {/* Columns, temperature left to right like an axis. Each is labelled with its
                value, so the scale only has to start at zero: it tops out at the tallest
                value rounded up, which keeps the figure free of empty space. */}
            <div className="flex h-28 items-end gap-1 border-b border-grid pb-px">
              {SWEEP_BY_T.map((d) => {
                const best = d.temperature === HM.best_temperature;
                return (
                  <div
                    key={d.temperature}
                    data-testid="diversity-bar"
                    data-value={d.mean_distinct}
                    className="flex h-full flex-1 flex-col items-center justify-end gap-0.5"
                    aria-label={`T = ${tLabel(d.temperature)}: ${d.mean_distinct.toFixed(1)} different answers`}
                  >
                    <span
                      className={`font-mono text-[10px] tabular-nums ${best ? "font-semibold text-compute-ink" : "text-ink"}`}
                    >
                      {d.mean_distinct.toFixed(1)}
                    </span>
                    <span
                      className={`w-full max-w-[1.75rem] rounded-t-sm ${best ? "bg-compute" : "bg-ink-faint/40"}`}
                      style={{ height: `${(d.mean_distinct / DISTINCT_TOP) * 82}%` }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex gap-1" aria-hidden="true">
              {SWEEP_BY_T.map((d) => (
                <span
                  key={d.temperature}
                  className={`flex-1 text-center font-mono text-[10px] tabular-nums ${
                    d.temperature === HM.best_temperature ? "font-semibold text-compute-ink" : "text-ink-muted"
                  }`}
                >
                  {tLabel(d.temperature)}
                </span>
              ))}
            </div>
            <p className="text-center text-[10px] text-ink-muted" aria-hidden="true">
              temperature (T)
            </p>
            <figcaption className="pt-1 text-xs text-ink-muted">
              Averaged over {SWEEP_PROBLEMS} problems; a count of answers, not an accuracy. More
              is not better: one chain alone falls from {pct(COOL.single_chain_accuracy)} at T ={" "}
              {tLabel(COOL.temperature)} to {pct(HOT.single_chain_accuracy)} at T ={" "}
              {tLabel(HOT.temperature)}, and the vote is best at T = {tLabel(HM.best_temperature)}
              {SWEEP_TIED.length ? `, tied with ${SWEEP_TIED.join(" and ")}` : ""}.
            </figcaption>
          </figure>
        </section>
        {/* Step 4. Starts a new grid row explicitly: step 3 has no margin note, so
            without this the section would flow into the note column. */}
        <section className="flex min-w-0 flex-col gap-3 lg:col-start-1">
          <h2 className="text-xl font-semibold text-ink">4. Sharing a fixed budget between chains</h2>
          <p className="text-ink-muted">
            Sixteen chains cost sixteen times the tokens. So what if you do not have sixteen times
            the budget? Below, a fixed budget of{" "}
            {F2.budgets
              .map((b) => tokens(b.budget))
              .map((b, i, all) => (i === 0 ? b : i === all.length - 1 ? ` or ${b}` : `, ${b}`))
              .join("")}{" "}
            tokens is divided between the chains, and the same chains are also allowed to finish.
            At every point on the x axis the model gets the same number of chains; the only thing
            that changes between the lines is how many tokens each chain may use.
          </p>
          {/* The widget is the chart and its one toggle, as in step 3. */}
          <section
            aria-label="A fixed budget shared between chains"
            className="flex flex-col gap-3 rounded-lg border border-grid bg-surface p-4"
          >
            <ForkChart />
            {showCut ? <CutOffGrid /> : null}
            <button
              type="button"
              aria-pressed={showCut}
              onClick={() => {
                recordInteraction(PAGE_N);
                setShowCut((v) => !v);
              }}
              className="inline-flex items-center gap-1.5 self-start rounded border border-compute bg-compute/10 px-2.5 py-1 text-xs font-semibold text-compute transition-colors hover:bg-compute hover:text-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-compute focus-visible:ring-offset-1"
            >
              <span aria-hidden="true">{showCut ? "▾" : "▸"}</span>
              {showCut ? "Hide how many chains were cut off" : "Show how many chains were cut off"}
            </button>
          </section>
          <p className="text-ink">
            Dividing a budget does two things at once. One, it adds chains, and two, it shortens
            every one of them. The shortening is the one that lands. At {cutLow.n} chains,{" "}
            {tokens(cutLow.budget)} tokens leaves each chain only {tokens(cutLow.chain_budget)}, and{" "}
            {pct(cutLow.truncated_rate)} of them are cut off before they finish; even{" "}
            {tokens(cutHigh.budget)} tokens leaves {tokens(cutHigh.chain_budget)} each, and{" "}
            {pct(cutHigh.truncated_rate)} are cut off. The vote is counting fragments of arguments
            rather than arguments.{" "}
            <strong className="text-ink">Splitting is not what fails, capping is.</strong> Let the
            same chains run to their own end and the vote indeed works, at {tokens(pileTokens)}{" "}
            tokens for {last.n} chains vs {tokens(oneChainTokens)} for one. There are two ways of
            spending here, divide one budget, or let every chain finish. The second one is the
            winner.
          </p>
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
