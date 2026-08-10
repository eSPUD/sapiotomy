/**
 * Page 15 section 3, "what the window costs": the price of a harder rung, in
 * tokens, measured.
 *
 * No new generation. Every number here is read out of
 * `web/data/page-11-derived.json`, the same committed file page 11 draws, and
 * this module recomputes nothing except the two comparisons the figure is
 * about (a ratio and a difference). The boundary is the deck's standing one:
 * the notebook writes logs, the page reads them.
 *
 * WHAT THE PAIRING IS. Page 11's run swept two MATH-500 difficulty bands on one
 * family under identical settings: greedy, cap 2048, one grader, one seed. The
 * hard band (levels 4 and 5, n = 100) comes from page 6's run and is gate-1
 * verified; the easy band (levels 1 to 3, n = 50) was generated fresh by page
 * 11's arm A. Pairing a model's two greedy points therefore moves exactly ONE
 * coordinate: which problems were asked. That is the whole reason this figure
 * is allowed on this page. A cross-benchmark token ladder (MATH-500 to AIME to
 * FrontierMath) would move the prompt, the grader, the answer format and the
 * item count at once, which is precisely what section 1 spends its length
 * teaching the reader to refuse.
 *
 * WHAT PAGE 11 DOES WITH THE SAME RUN, so this is not a reprint: page 11 plots
 * accuracy against inference FLOPs to ask whether a small model that thinks can
 * cross a big one, and its two bands are a TOGGLE, a robustness check on that
 * crossing. This module reads the raw token counts underneath that FLOPs
 * price, pairs the bands rather than switching between them, and derives the
 * easy-to-hard ratio, which no page draws today.
 *
 * The specialist arm (`Qwen2.5-Math-1.5B-Instruct`) is measured on the easy
 * band only and has no hard-band counterpart, so it cannot be paired and is
 * dropped by the inner join below. Three arrows with no holes beats four with a
 * gap; `EXCLUDED_UNPAIRED` records why, so the omission is a stated fact rather
 * than a silent filter.
 *
 * The gates at the bottom are load-time and throw, following `lib/page11.ts`:
 * if the direction of either claim ever inverts in the data, this page fails
 * the build instead of drawing a plausible lie.
 */
import rawDerived from "@data/page-11-derived.json";

export class Page15PriceError extends Error {}

/* --------------------------------------------------------------- raw shape */

interface RawFamilyGreedy {
  model_id: string;
  label: string;
  params: number;
  accuracy: number;
  mean_tokens: number;
}
interface RawArmPoint {
  model_id: string;
  kind: "greedy" | "vote";
  accuracy: number;
  mean_tokens: number;
  n_items: number;
  params: number;
}
interface RawDerived {
  manifest: {
    run_mode: string;
    items: {
      hard: { levels: number[]; n: number };
      easy: { levels: number[]; n: number };
    };
  };
  claims: { gate1_reproduced: boolean };
  family: { n_items: number; greedy: RawFamilyGreedy[] };
  arms: { easy: RawArmPoint[] };
}

const RAW = rawDerived as unknown as RawDerived;

/* ------------------------------------------------------------ public shape */

/** One model's two readings, easy band and hard band, and the move between. */
export interface PricePair {
  label: string;
  params: number;
  /** MATH-500 levels 1 to 3 */
  easy: { accuracy: number; meanTokens: number; nItems: number };
  /** MATH-500 levels 4 and 5 */
  hard: { accuracy: number; meanTokens: number; nItems: number };
  /** hard tokens as a multiple of easy tokens: the price of the harder rung */
  tokenRatio: number;
  /** accuracy lost going to the harder band, in percentage points */
  accuracyDropPts: number;
}

const label = (modelId: string) => `Qwen2.5-${modelId.split("-")[1]}`;

/* ------------------------------------------------ the pairing (inner join) */

const easyGreedy = RAW.arms.easy.filter((p) => p.kind === "greedy");
const hardByModel = new Map(RAW.family.greedy.map((g) => [g.model_id, g]));

const pairs: PricePair[] = easyGreedy
  .flatMap((e) => {
    const h = hardByModel.get(e.model_id);
    if (!h) return [];
    return [
      {
        label: h.label ?? label(e.model_id),
        params: e.params,
        easy: { accuracy: e.accuracy, meanTokens: e.mean_tokens, nItems: e.n_items },
        hard: {
          accuracy: h.accuracy,
          meanTokens: h.mean_tokens,
          nItems: RAW.family.n_items,
        },
        tokenRatio: h.mean_tokens / e.mean_tokens,
        accuracyDropPts: (e.accuracy - h.accuracy) * 100,
      },
    ];
  })
  .sort((a, b) => a.params - b.params);

/** Measured on one band only, so unpairable, and named rather than hidden. */
const EXCLUDED_UNPAIRED = easyGreedy
  .filter((e) => !hardByModel.has(e.model_id))
  .map((e) => label(e.model_id));

/* --------------------------------------------------- the load-time gates */

function assert(ok: boolean, why: string): void {
  if (!ok) throw new Page15PriceError(why);
}

assert(RAW.manifest.run_mode === "FULL", "page 15's price figure needs page 11's FULL run");
assert(RAW.claims.gate1_reproduced === true, "gate 1 did not reproduce pages 6/7/8's numbers");
assert(pairs.length >= 3, `only ${pairs.length} models are measured on both bands; the figure needs 3`);

/* The claim, checked as an arithmetic property of the plotted points rather
   than trusted from prose: on EVERY model the harder band must cost more
   tokens and return less accuracy. Either sign inverting means the sentence
   this section teaches is false on this run, and the page must not ship it. */
for (const p of pairs) {
  assert(
    p.hard.meanTokens > p.easy.meanTokens,
    `${p.label} spends no more on the hard band (${p.hard.meanTokens} vs ${p.easy.meanTokens} tokens)`,
  );
  assert(
    p.hard.accuracy < p.easy.accuracy,
    `${p.label} does not lose accuracy on the hard band (${p.hard.accuracy} vs ${p.easy.accuracy})`,
  );
}

const ratios = pairs.map((p) => p.tokenRatio);
const drops = pairs.map((p) => p.accuracyDropPts);

export const PAGE15_PRICE = {
  pairs,
  excludedUnpaired: EXCLUDED_UNPAIRED,
  bands: {
    easy: { levels: "levels 1 to 3", n: RAW.manifest.items.easy.n },
    hard: { levels: "levels 4 and 5", n: RAW.manifest.items.hard.n },
  },
  /** the span the copy quotes, so prose and figure cannot drift */
  ratioRange: { lo: Math.min(...ratios), hi: Math.max(...ratios) },
  dropRange: { lo: Math.min(...drops), hi: Math.max(...drops) },
  /** the run these readings come from, named on the page beside the figure */
  source: "page 11's measured run: greedy, cap 2048, one family, one grader",
} as const;

export type Page15Price = typeof PAGE15_PRICE;
