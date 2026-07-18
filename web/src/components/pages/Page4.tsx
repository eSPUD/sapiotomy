"use client";

import { useState } from "react";
import { CitationBadge } from "@/components/CitationBadge";
import { PageNav } from "@/components/PageNav";
import { ACTS, getPage } from "@/lib/pages";
import { curves } from "@/lib/curves";
import { useStore } from "@/store/useStore";

const PAGE_N = 4;

type Choice = "factory" | "think";

/** Echo line for the verdict, keyed by "vote1-vote2". */
const ECHOES: Record<`${Choice}-${Choice}`, string> = {
  "factory-think": "You switched sides once you saw the bills.",
  "think-think": "You called it before the bills even landed.",
  "factory-factory":
    "You held out for the factory; the field read the same bills and went the other way.",
  "think-factory":
    "You defected to the factory at the last minute; the field went the other way.",
};

const STRIP = [
  {
    prob: "4502 × 6398",
    verdict: "thinking's job",
    note: "derivable fresh in seconds, for a fraction of a cent; no factory run needed",
  },
  {
    prob: "tonight's final",
    verdict: "only thinking arrives in time",
    note: "no run can bake in a result that does not exist yet",
  },
  {
    prob: "the 2010 final",
    verdict: "only the factory puts it in there",
    note: "no amount of thinking summons a fixed fact",
  },
];

function Tile({
  flipped,
  onFlip,
  front,
  back,
}: {
  flipped: boolean;
  onFlip: () => void;
  front: React.ReactNode;
  back: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={flipped}
      onClick={onFlip}
      className={`min-w-[15rem] flex-1 rounded-lg border p-4 text-left ${
        flipped
          ? "cursor-default border-compute bg-compute/15"
          : "border-grid bg-surface hover:border-compute"
      }`}
    >
      {flipped ? back : front}
    </button>
  );
}

function VoteRow({
  groupLabel,
  value,
  onVote,
}: {
  groupLabel: string;
  value: Choice | null;
  onVote: (c: Choice) => void;
}) {
  const opts: { key: Choice; text: string }[] = [
    { key: "factory", text: "Feed the factory" },
    { key: "think", text: "Buy more thinking" },
  ];
  return (
    <div role="group" aria-label={groupLabel} className="mt-2 flex flex-wrap gap-2">
      {opts.map((o) => {
        const selected = value === o.key;
        return (
          <button
            key={o.key}
            type="button"
            aria-pressed={selected}
            onClick={() => onVote(o.key)}
            className={`min-w-[10.5rem] flex-1 rounded border px-3 py-2 text-sm ${
              selected
                ? "border-compute bg-compute/40 font-semibold text-ink"
                : "border-grid bg-surface text-ink hover:border-compute"
            }`}
          >
            {o.text}
            {selected ? " ✓" : ""}
          </button>
        );
      })}
    </div>
  );
}

export function Page4() {
  const page = getPage(PAGE_N)!;
  const recordInteraction = useStore((s) => s.recordInteraction);

  const energy = curves.queryEnergy;
  const ep = energy.fit!.params;
  const trainCosts = curves.epochTrainingCosts;
  const tp = trainCosts.fit!.params;
  const prices = curves.epochInferencePrices;
  const pp = prices.fit!.params;

  // The four ladder rungs, in watt-hours, straight from the cited data points.
  const whAnswer = energy.points[0].y;
  const whYear = energy.points[1].y;
  const whWorldDay = energy.points[2].y;
  const whRun = energy.points[3].y;

  // Derived, and labeled derived on-page (inline for the 170B division; the ladder
  // arithmetic is labeled "(derived)" in the Sources and derivations disclosure):
  // run energy over answer energy, to the nearest 10 billion.
  const runAnswersBillions = Math.round(whRun / whAnswer / 1e10) * 10;
  const worldDaysPerRun = Math.round(whRun / whWorldDay);
  const homesPerWorldDay = (
    Math.round(whWorldDay / (ep.householdKWhPerDay * 1000) / 1000) * 1000
  ).toLocaleString("en-US");

  const rungs = [
    {
      what: "One answer",
      energy: `≈ ${whAnswer} Wh`,
      feel: "an LED bulb left on for a few minutes",
    },
    {
      what: "Your year of asking (say ten a day)",
      energy: `≈ ${(whYear / 1000).toFixed(1)} kWh`,
      feel: "roughly ninety phone charges",
    },
    {
      what: `The world's day of asking (≈ ${ep.answersPerDayBillions} billion answers, as reported in 2025)`,
      energy: `≈ ${Math.round(whWorldDay / 1e6)} MWh`,
      feel: `a day's electricity for about ${homesPerWorldDay} US homes`,
    },
    {
      what: "One frontier training run",
      energy: `≈ ${Math.round(whRun / 1e9)} GWh`,
      feel: `about ${worldDaysPerRun} days of the whole world asking; the factory bill equals two months of everyone's commutes`,
    },
  ];

  const [flippedA, setFlippedA] = useState(false);
  const [flippedB, setFlippedB] = useState(false);
  const [vote1, setVote1] = useState<Choice | null>(null);
  const [vote2, setVote2] = useState<Choice | null>(null);
  const [rung, setRung] = useState(0);
  const [announcement, setAnnouncement] = useState("");

  const bothFlipped = flippedA && flippedB;

  const flipTile = (which: "A" | "B") => {
    const already = which === "A" ? flippedA : flippedB;
    if (already) return;
    const otherFlipped = which === "A" ? flippedB : flippedA;
    if (which === "A") setFlippedA(true);
    else setFlippedB(true);
    recordInteraction(PAGE_N);
    setAnnouncement(
      otherFlipped
        ? "Named: training and inference. Next, an objection to answer, then the two bills."
        : `Named: ${which === "A" ? "Training" : "Inference"}.`,
    );
  };

  const castVote1 = (choice: Choice) => {
    if (vote1) return;
    setVote1(choice);
    recordInteraction(PAGE_N);
    setAnnouncement("Vote recorded. Now the two bills: energy first, then the money.");
  };

  const castVote2 = (choice: Choice) => {
    if (vote2) return;
    setVote2(choice);
    recordInteraction(PAGE_N);
    setAnnouncement(
      "The verdict: the marginal dollar moved to thinking. And the catch: long thinking burns far more than 0.3 watt-hours.",
    );
  };

  const announceRung = (level: number) => {
    const r = rungs[level - 1];
    setAnnouncement(`${r.what}: ${r.energy}. ${r.feel}.`);
  };

  const climb = () => {
    if (rung >= 4) return;
    const next = rung + 1;
    setRung(next);
    recordInteraction(PAGE_N);
    announceRung(next);
  };

  const descend = () => {
    if (rung <= 0) return;
    const next = rung - 1;
    setRung(next);
    recordInteraction(PAGE_N);
    if (next > 0) announceRung(next);
  };

  const echo = vote1 && vote2 ? ECHOES[`${vote1}-${vote2}`] : "";

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
        Page 3 ended on a split: some answers get rebuilt step by step, and some are either already
        in your head or nowhere. Those are two different machines for having answers. In AI, each
        has a proper name, and once you have the names you can do what the last page could not: ask
        what each machine <strong>costs</strong>. Time to meet them.
      </p>

      <section aria-label="The reveal" className="flex flex-col gap-3">
        <p className="max-w-2xl text-ink">
          Here are page 3&apos;s two shelves again. Each one is a machine.{" "}
          <strong>Flip each tile</strong> to learn what its machine is called in the world of AI.
        </p>
        <div className="flex flex-wrap gap-3">
          <Tile
            flipped={flippedA}
            onFlip={() => flipTile("A")}
            front={
              <>
                <span className="block text-sm text-ink-muted">Memorized</span>
                <span className="mt-0.5 block text-lg font-semibold text-ink">
                  &ldquo;I&apos;ve seen this one.&rdquo;
                </span>
                <span className="mt-1 block text-sm text-ink-muted">
                  The answer pops out whole. Zero steps, zero time. It only works for things that
                  have already crossed your path.
                </span>
                <span className="mt-2 block text-xs font-semibold text-compute">
                  Flip: name this machine ↺
                </span>
              </>
            }
            back={
              <>
                <span className="block text-sm text-ink-muted">in AI, memorizing is called</span>
                <span className="mt-0.5 block text-lg font-semibold text-compute">Training</span>
                <span className="mt-1 block text-sm text-ink-muted">
                  The factory step. Before you ever ask, the machine is shown a mountain of
                  examples, once, up front. That is how an answer gets in there.
                </span>
              </>
            }
          />
          <Tile
            flipped={flippedB}
            onFlip={() => flipTile("B")}
            front={
              <>
                <span className="block text-sm text-ink-muted">Understood</span>
                <span className="mt-0.5 block text-lg font-semibold text-ink">
                  &ldquo;I can rebuild it.&rdquo;
                </span>
                <span className="mt-1 block text-sm text-ink-muted">
                  Steps take time. But it works on things nobody has met yet: a fresh
                  multiplication, tonight&apos;s final.
                </span>
                <span className="mt-2 block text-xs font-semibold text-compute">
                  Flip: name this machine ↺
                </span>
              </>
            }
            back={
              <>
                <span className="block text-sm text-ink-muted">in AI, reasoning is called</span>
                <span className="mt-0.5 block text-lg font-semibold text-compute">Inference</span>
                <span className="mt-1 block text-sm text-ink-muted">
                  The answer-time step. The machine thinks it through right now, every time you
                  ask. The trace on page 2 was this machine on camera.
                </span>
              </>
            }
          />
        </div>
      </section>

      {bothFlipped ? (
        <>
          <div className="max-w-2xl rounded-lg border-l-4 border-compute bg-surface p-4 text-ink">
            In the world of AI, memorizing is called <strong>training</strong>, and reasoning is
            called <strong>inference</strong>. You have already watched both machines run: the
            blurt that cracked on page 2 was the memory machine reaching past what it had met, and
            missing; the trace that caught it was inference, on camera. Two machines, then. And
            each sends a very different bill.
          </div>

          <div className="max-w-2xl rounded-lg border border-grid bg-surface p-4">
            <p className="text-xs uppercase tracking-wide text-ink-muted">
              Fun fact: the human names came first
            </p>
            <p className="mt-1 text-ink">
              Psychologists call the pop <strong>System 1</strong> and the step-by-step grind{" "}
              <strong>System 2</strong>, names made famous by Daniel Kahneman&apos;s{" "}
              <em>Thinking, Fast and Slow</em>. Four names, one split: System 1 is to training
              roughly what System 2 is to inference. Hold it loosely; it is a map of the idea, not
              the territory.
            </p>
          </div>

          <section aria-label="The objection">
            <div className="max-w-2xl rounded-lg border border-grid bg-surface p-4">
              <p className="text-xs uppercase tracking-wide text-ink-muted">
                Before the bills: an objection
              </p>
              <p className="mt-1 text-ink">
                Here is the obvious pushback, and it deserves a straight answer.{" "}
                <em>
                  Training is when the machine actually gets smarter. Thinking at answer time just
                  runs whatever the factory already built. So if you had one budget to make answers
                  better, surely you feed the factory: build it bigger, show it more, bake more in.
                </em>
              </p>
              <p className="mt-3 text-lg text-ink">
                You hold the budget. Which machine do you feed?
              </p>
              <VoteRow
                groupLabel="First vote: which machine gets the budget"
                value={vote1}
                onVote={castVote1}
              />
              {vote1 ? (
                <p className="mt-3 text-sm text-ink">
                  Hold that vote. Before anyone spends real money, they read the bills. Let&apos;s
                  read them.
                </p>
              ) : null}
            </div>
          </section>
        </>
      ) : null}

      {vote1 ? (
        <section aria-label="The two bills" className="flex flex-col gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-muted">
              The two bills, priced the way climate taught you
            </p>
            <p className="mt-1 max-w-2xl text-ink">
              Not in dollars first: in what they <strong>burn</strong>. The shape of this is one
              you already know from CO<sub>2</sub> math, because it is the same shape:{" "}
              <strong>build once, big and visible; use forever, tiny and everywhere.</strong>
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="min-w-[16rem] flex-1 rounded-lg border border-grid bg-surface p-4">
              <p className="text-sm text-ink-muted">Training burns like building the factory</p>
              <p className="mt-0.5 font-mono text-lg font-semibold tabular-nums text-ink">
                ≈ {ep.runGWh} GWh, once
              </p>
              <p className="mt-1 text-sm text-ink-muted">
                One GPT-4-class run is estimated around {ep.runGWh} gigawatt-hours of electricity
                (outside estimates run roughly {ep.runGWhLow} to {ep.runGWhHigh}). One
                concentrated, visible burn, paid before the first question is ever asked.{" "}
                <span className="rounded-full bg-wrong/15 px-2 py-0.5 text-xs font-semibold text-wrong">
                  estimate
                </span>
              </p>
            </div>
            <div className="min-w-[16rem] flex-1 rounded-lg border border-grid bg-surface p-4">
              <p className="text-sm text-ink-muted">Inference burns like the commute</p>
              <p className="mt-0.5 font-mono text-lg font-semibold tabular-nums text-ink">
                ≈ {ep.whShortAnswer} Wh, per answer
              </p>
              <p className="mt-1 text-sm text-ink-muted">
                A typical short answer costs about a third of a watt-hour, less electricity than an
                LED bulb burns in a few minutes. Invisible, per trip.{" "}
                <span className="rounded-full border border-grid px-2 py-0.5 text-xs text-ink-muted">
                  Epoch AI estimate
                </span>
              </p>
            </div>
          </div>

          <p className="max-w-2xl text-sm text-ink-muted">
            Divide one by the other and a single run is roughly{" "}
            <strong className="text-ink">{runAnswersBillions} billion answers&apos;</strong> worth
            of energy. (Derived from the two estimates above, so hold it loosely.)
          </p>

          <div className="rounded-lg border border-grid bg-surface p-4">
            <h2 className="text-sm font-semibold text-ink">Climb the scale</h2>
            <p className="text-xs text-ink-muted">
              from one answer to one training run, four rungs
            </p>
            {rungs.slice(0, rung).map((r) => (
              <div key={r.what} className="mt-2 border-t border-grid pt-2">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <span className="text-sm font-semibold text-ink">{r.what}</span>
                  <span className="font-mono text-sm tabular-nums text-compute">{r.energy}</span>
                </div>
                <p className="text-xs text-ink-muted">{r.feel}</p>
              </div>
            ))}
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={climb}
                disabled={rung >= 4}
                className="rounded bg-compute px-4 py-2 text-sm font-semibold text-canvas disabled:opacity-50"
              >
                {rung >= 4 ? "Top of the ladder" : "Climb a rung ▲"}
              </button>
              <button
                type="button"
                onClick={descend}
                disabled={rung <= 0}
                className="rounded bg-surface-raised px-3 py-1.5 text-sm text-ink disabled:opacity-50"
              >
                Back down ▾
              </button>
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-ink-muted">
              And the money is not standing still
            </p>
            <p className="mt-1 max-w-2xl text-ink">
              Energy gives the bills their shape. The dollars give them their{" "}
              <strong>direction</strong>, and the two prices are sprinting opposite ways.{" "}
              <strong>Epoch AI</strong>, a research group that measures the numbers behind AI,
              tracks both rates:
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-grid bg-surface p-4">
              <h3 className="text-sm font-semibold text-ink">One frontier training run</h3>
              <p className="text-xs text-ink-muted">
                the factory bill: build the machine that knows things
              </p>
              <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-compute">
                ×{tp.perYear} every year ↗
              </p>
              <p className="mt-2 text-sm text-ink-muted">
                measured across a decade of frontier runs (95% CI ×{tp.ci95Low.toFixed(1)} to ×
                {tp.ci95High.toFixed(1)}); on this trend the largest runs pass{" "}
                <strong className="text-ink">
                  ${tp.projectionBillionUSD} billion by {tp.projectionYear}
                </strong>{" "}
                (Epoch&apos;s projection). A bill that multiplies every year is not a bill anyone
                pays forever.
              </p>
            </div>
            <div className="rounded-lg border border-grid bg-surface p-4">
              <h3 className="text-sm font-semibold text-ink">One answer at a fixed quality bar</h3>
              <p className="text-xs text-ink-muted">
                the thinking bill: the same answer, cheaper every year
              </p>
              <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-compute">
                ÷{pp.perYearGPQA} every year ↘
              </p>
              <p className="mt-2 text-sm text-ink-muted">
                the price of matching a fixed score on PhD-level science questions; across
                Epoch&apos;s benchmarks the fall runs{" "}
                <strong className="text-ink">
                  ÷{pp.rangeLow} to ÷{pp.rangeHigh} per year, median ÷{pp.median}
                </strong>
                , steepening to a median of{" "}
                <strong className="text-ink">÷{pp.medianSinceJan2024} per year</strong> since early
                2024.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <CitationBadge citation={trainCosts.citation} />
            <CitationBadge citation={prices.citation} />
            <CitationBadge citation={energy.citation} />
          </div>
          <p className="text-xs text-ink-muted">
            rates: Epoch AI (
            <a href="#sources" className="text-compute underline underline-offset-2">
              sources
            </a>
            ) · both are measured trends, quoted as rates; no dollar meter on this page, and the
            only dollar figure is Epoch&apos;s own projection
          </p>

          <div className="max-w-2xl rounded-lg border border-grid bg-surface p-4">
            <p className="text-xs uppercase tracking-wide text-ink-muted">
              Same question, bills on the table
            </p>
            <p className="mt-3 text-lg text-ink">
              One budget. One machine gets the marginal dollar. Which machine do you feed?
            </p>
            <VoteRow
              groupLabel="Second vote: which machine gets the budget"
              value={vote2}
              onVote={castVote2}
            />
          </div>
        </section>
      ) : null}

      {vote2 ? (
        <section aria-label="The verdict" className="flex flex-col gap-4">
          <div className="max-w-2xl rounded-lg border-l-4 border-compute bg-surface p-4 text-ink">
            <strong>{echo}</strong> Here is how the field itself voted, with its wallet:{" "}
            <strong>the marginal dollar moved to thinking.</strong> The factory bill multiplies by{" "}
            {tp.perYear} every year and cannot do that forever; the thinking bill is tiny per
            answer and collapsing. When one meter runs away and the other falls through the floor,
            the next dollar goes to the falling one.
          </div>

          <p className="max-w-2xl text-ink">
            But keep both machines bolted down. Three problems you have already met:
          </p>
          <div
            role="group"
            aria-label="Three problems, two machines, one line each"
            className="rounded-lg border border-grid bg-surface px-4 py-1"
          >
            {STRIP.map((row) => (
              <div key={row.prob} className="border-t border-grid py-2.5 first:border-t-0">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="min-w-[8rem] font-mono text-sm font-semibold text-ink">
                    {row.prob}
                  </span>
                  <span className="text-sm font-semibold text-compute">{row.verdict}</span>
                </div>
                <p className="text-xs text-ink-muted">{row.note}</p>
              </div>
            ))}
          </div>

          <div className="max-w-2xl rounded-lg border-l-4 border-wrong bg-wrong/15 p-4 text-ink">
            <strong>Now the catch, and it gets a whole page of its own.</strong> That{" "}
            {ep.whShortAnswer} Wh buys a <em>short</em> answer, around 500 tokens. Long questions
            and long thinking run {ep.whLongQueryLow} to {ep.whLongQueryHigh} watt-hours and
            beyond, and this story is literally about making machines think longer. Climate math
            was never dominated by the rare big builds; it is dominated by billions of small
            trips. And the field just decided, with its wallet, to make every trip longer.
          </div>

          <p className="max-w-2xl text-ink">
            <em>More time per answer, more money per answer... more problems per answer? Next page.</em>
          </p>

          <details id="sources" className="max-w-2xl rounded-lg border border-grid bg-surface p-4">
            <summary className="cursor-pointer text-sm font-semibold text-ink">
              Sources and derivations
            </summary>
            <ul className="mt-2 flex list-disc flex-col gap-2 pl-5 text-sm text-ink-muted">
              <li>
                <strong className="text-ink">Training-run costs:</strong> Epoch AI,{" "}
                <a
                  href={trainCosts.citation.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-compute underline underline-offset-2"
                >
                  How much does it cost to train frontier AI models?
                </a>{" "}
                (Cottier et al., 2024): frontier training costs grew{" "}
                <strong className="text-ink">×{tp.perYear} per year</strong> since 2016 (95% CI ×
                {tp.ci95Low.toFixed(1)} to ×{tp.ci95High.toFixed(1)}); the largest runs projected
                to pass{" "}
                <strong className="text-ink">
                  ${tp.projectionBillionUSD}B by {tp.projectionYear}
                </strong>
                ; cost split: hardware 47 to 67%, R&amp;D staff 29 to 49%,{" "}
                <strong className="text-ink">energy only 2 to 6%</strong>.
              </li>
              <li>
                <strong className="text-ink">Answer prices:</strong> Epoch AI,{" "}
                <a
                  href={prices.citation.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-compute underline underline-offset-2"
                >
                  LLM inference price trends
                </a>
                : the price of matching GPT-4&apos;s score on PhD-level science questions (GPQA)
                fell <strong className="text-ink">÷{pp.perYearGPQA} per year</strong>; across
                benchmarks and thresholds the fall ranges{" "}
                <strong className="text-ink">
                  ÷{pp.rangeLow} to ÷{pp.rangeHigh} per year, median ÷{pp.median}
                </strong>
                , steepening to a median of{" "}
                <strong className="text-ink">÷{pp.medianSinceJan2024} per year</strong> from
                January 2024 onward.
              </li>
              <li>
                <strong className="text-ink">Energy per answer:</strong> Epoch AI,{" "}
                <a
                  href={energy.citation.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-compute underline underline-offset-2"
                >
                  How much energy does ChatGPT use?
                </a>
                : ≈ <strong className="text-ink">{ep.whShortAnswer} Wh</strong> for a typical
                short (~500 token) text answer; long inputs can push a single query to{" "}
                <strong className="text-ink">
                  {ep.whLongQueryLow} to {ep.whLongQueryHigh}+ Wh
                </strong>
                ; a US household uses ≈ {ep.householdKWhPerDay} kWh per day. The LED comparison is
                theirs.
              </li>
              <li>
                <strong className="text-ink">Energy per run:</strong> outside estimates for a
                GPT-4-class run cluster around{" "}
                <strong className="text-ink">
                  {ep.runGWhLow} to {ep.runGWhHigh} GWh
                </strong>{" "}
                (see Epoch AI&apos;s{" "}
                <a
                  href="https://epoch.ai/topics/energy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-compute underline underline-offset-2"
                >
                  energy hub
                </a>
                ); this page uses ≈ {ep.runGWh} GWh and marks it an estimate.
              </li>
              <li>
                <strong className="text-ink">Ladder arithmetic (derived):</strong> 10 answers/day
                × 365 × {ep.whShortAnswer} Wh ≈ {(whYear / 1000).toFixed(1)} kWh ≈ 90 phone
                charges at ~{ep.phoneChargeWh} Wh each. {ep.answersPerDayBillions} billion
                answers/day (OpenAI figure as reported by press, mid-2025) × {ep.whShortAnswer} Wh
                ≈ {Math.round(whWorldDay / 1e6)} MWh ≈ {homesPerWorldDay} households ×{" "}
                {ep.householdKWhPerDay} kWh. {ep.runGWh} GWh ÷ {Math.round(whWorldDay / 1e6)} MWh
                ≈ {worldDaysPerRun} days; {ep.runGWh} GWh ÷ {ep.whShortAnswer} Wh ≈{" "}
                {runAnswersBillions} billion answers.
              </li>
              <li>
                <strong className="text-ink">
                  CO<sub>2</sub> stays an analogy.
                </strong>{" "}
                Converting Wh to grams needs a grid-mix assumption this page cannot cite cleanly,
                so it makes no gram claims; energy is the data, climate is the shape.
              </li>
            </ul>
          </details>

          <p className="text-xs text-ink-muted">
            nothing on this page is a price quote or a benchmark; the cited rates are the point ·
            framing: Kahneman, <em>Thinking, Fast and Slow</em>
          </p>
        </section>
      ) : null}

      <PageNav n={PAGE_N} />
      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>
    </article>
  );
}
