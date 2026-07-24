/**
 * Authored, ILLUSTRATIVE content for Act 1 (not digitized from a paper).
 * Clearly separated from the cited curve data so the "no invented numbers"
 * discipline stays intact: these are hand-authored teaching examples, and the
 * UI labels them as such.
 *
 * House rules carried over from the approved prototypes (prototypes/slide-*):
 * no accuracy percentages anywhere in Act 1; the word "inference" never
 * appears in Pages 1-3 copy or data; "training" stays off Page 1 but is
 * central to Pages 2-3 after their refactors (docs/page_2_refactor.md,
 * docs/page_3_refactor.md); copy is em-dash-free.
 */

// --- Page 1: Think Fast, Think Slow (the game) ---------------------------
export interface GameRound {
  prompt: string;
  answer: number;
  /** Grouped display form, e.g. "223,300". */
  display: string;
}

export const GAME_ROUNDS: GameRound[] = [
  { prompt: "2 + 2", answer: 4, display: "4" },
  { prompt: "17 × 24", answer: 408, display: "408" },
  { prompt: "350 × 638", answer: 223300, display: "223,300" },
];

/**
 * The computer's playthrough of the game: a hand-scripted simulation of a
 * human player with ILLUSTRATIVE pacing (instant, then tens of seconds, then
 * minutes). Long rounds are time-compressed on screen behind a fast-forward
 * chip; these seconds are not measurements and the page says so.
 */
export interface ComputerMove {
  /** Index into GAME_ROUNDS. */
  round: number;
  typed: string;
  /** Illustrative wall-clock seconds for the round. */
  seconds: number;
}

export const COMPUTER_SCRIPT: ComputerMove[] = [
  { round: 0, typed: "4", seconds: 1 },
  { round: 1, typed: "408", seconds: 24 },
  { round: 2, typed: "223,300", seconds: 150 },
];

// --- Page 2: Two Systems (the "how many World Cups?" question) ------------
/**
 * The question is REAL and RECENT on purpose (docs/page_2_refactor.md): the
 * FIFA 2026 World Cup final is days old as this deck is built. A reader who
 * followed it counts Spain's titles instantly (System 1); a model whose memory
 * ends before the final counts off stale data and lands exactly one short — it
 * never saw the newest win.
 *
 * !! PLACEHOLDER FACT !! The trap needs Spain to have actually WON the 2026
 * final (their 2nd title, after the real 2010 win). This was authored by a tool
 * whose own training ALSO ends before the final — the page's failure mode, live.
 * Before shipping: verify the 2026 result. If Spain won, `trueCount` is 2 and it
 * ships as-is; if someone else won, swap `country`/`wins` to the real 2026 winner
 * and their true total (the machine still undercounts by one). Chip + footer flag
 * this until confirmed.
 *
 * The machine's reply is an authored EXAMPLE of the ideal System-1 blurt: a flat,
 * confident count off its frozen memory (2010 only -> "one"), wrong by omission.
 * The planned live route swaps it for a real completion from a small open model
 * with no web search; the swap point is fetchMachineReply() in Page2.tsx.
 */
export const SPAIN_WORLD_CUPS = {
  question: "How many World Cups has Spain won?",
  country: "Spain",
  /** Spain's titles as of the 2026 final. 2010 is real; 2026 is the flagged,
   *  verify-before-shipping part — the trap needs Spain to have won it. */
  wins: [2010, 2026],
  /** The answer a reader who kept up would give. */
  trueCount: 2,
  /** The most recent title — so recent the model was sealed before it. */
  latestYear: 2026,
  machine: {
    label: "a small open model",
    cutoffLabel: "memory sealed early 2025",
    constraintLabel: "no web search",
    /** The wins inside the model's frozen memory: everything before the seal. */
    knownWins: [2010],
    /** trueCount - 1: it counts only what it was trained on, missing 2026. */
    answer: 1,
    /**
     * System 1 - the pop: a confident count off the one title it knows, stated
     * as fact and short by one. No hedging — the page's reveal explains why.
     */
    reply: ["One. Spain won it in 2010."],
  },
  /**
   * Page 4, "The Third Option": the SAME question answered in thinking mode.
   * The trace never invents the 2026 title — it recognizes the gap (a recent,
   * post-cutoff result it may be missing), decides not to answer from memory,
   * and checks before committing. That recognition is the whole point: a model
   * that answers on reflex never reaches for the check, even when it could.
   * Authored placeholder EXAMPLE; a live reasoning model replaces it later.
   * (Currently unused by any page: the old Page 4 that rendered it was replaced
   * by "Reasoning in Multiplication". Kept, with its guard test, for the
   * planned live-model return.) It names the newest year the blurt omits
   * (2026) and lands on the true count.
   */
  thinking: {
    steps: [
      "Let me not answer on reflex. This asks for a count of titles — and a count like that can change whenever there's a new final.",
      "The newest possibility is recent. My training was sealed in early 2025, so a 2026 result would fall after my cutoff — I could be a title behind.",
      "So I shouldn't count from memory alone. Before I commit, let me check a current source.",
      "The record: Spain won in 2010, and again in 2026.",
    ],
    /** The count it lands on once it has looked — the true total, not the blurt. */
    answer: "Two.",
  },
} as const;

// --- Page 4: Reasoning in Multiplication (three roads, one destination) ----
/**
 * Page 1's hardest round (GAME_ROUNDS[2], 350 × 638) solved three ways:
 * standard long multiplication, Japanese line multiplication, and Indian
 * Vedic (the Urdhva-Tiryagbhyam sutra, "vertically and crosswise"). Every
 * number below is DERIVED from the two factors; src/lib/act1.test.ts
 * recomputes each step from the digits, so a typo here fails the tests,
 * never ships. No external citation needed: this is self-verifiable
 * arithmetic, authored as a teaching example.
 *
 * A deliberate beat: the line method's five diagonals and the Vedic method's
 * five columns are the SAME five sums (0, 40, 39, 39, 18), reached by
 * different journeys. Copy in this block stays em-dash-free (house rule) and,
 * like the rest of Act 1, never says the deck's Act 2+ jargon.
 */

export interface MultProblem {
  a: number;
  b: number;
  /** Most-significant digit first. */
  aDigits: readonly number[];
  bDigits: readonly number[];
  answer: number;
  display: string;
}

/** One row of standard long multiplication: a × (digit × placeValue). */
export interface StandardRow {
  say: string;
  digit: number;
  placeValue: number;
  partial: number;
}

/** One place-value column: the digit pairs [aDigit, bDigit] that land on it. */
export interface ColumnStep {
  say: string;
  place: string;
  placeValue: number;
  pairs: readonly (readonly [number, number])[];
  sum: number;
}

/** A Vedic column additionally carries as it goes and writes result digits. */
export interface VedicColumn extends ColumnStep {
  carryIn: number;
  /** What gets written this column (the last column writes everything left). */
  digit: number;
  carryOut: number;
}

export const MULT_METHODS = {
  problem: {
    a: 350,
    b: 638,
    aDigits: [3, 5, 0],
    bDigits: [6, 3, 8],
    answer: GAME_ROUNDS[2].answer,
    display: GAME_ROUNDS[2].display,
  } as MultProblem,

  standard: {
    key: "standard",
    name: "Standard long multiplication",
    origin: "the school algorithm: one partial product per digit, then add",
    limitation:
      "General at any size, but slow: every digit pair gets touched, and every carry is a chance for a digit to slip.",
    rows: [
      { say: "Multiply by the units digit: 350 × 8.", digit: 8, placeValue: 1, partial: 2800 },
      { say: "Multiply by the tens digit: 350 × 30.", digit: 3, placeValue: 10, partial: 10500 },
      { say: "Multiply by the hundreds digit: 350 × 600.", digit: 6, placeValue: 100, partial: 210000 },
    ] as readonly StandardRow[],
    landing: "Add the three partial products.",
  },

  lines: {
    key: "lines",
    name: "Japanese line multiplication",
    origin: "a visual method often taught in East Asia: draw each digit as a bundle of lines, count the crossings",
    limitation:
      "No times tables needed, but big digits mean counting dozens of crossings (5 × 8 alone is 40), and a zero needs a ghost line.",
    diagonals: [
      { say: "Units column: the 0-bundle is a ghost line, so 0 crossings.", place: "units", placeValue: 1, pairs: [[0, 8]], sum: 0 },
      { say: "Tens column: 5 lines cross 8 lines. Count them all: 40 crossings.", place: "tens", placeValue: 10, pairs: [[5, 8], [0, 3]], sum: 40 },
      { say: "Hundreds column: three clusters land here. 24 + 15 + 0 = 39 crossings.", place: "hundreds", placeValue: 100, pairs: [[3, 8], [5, 3], [0, 6]], sum: 39 },
      { say: "Thousands column: two clusters. 9 + 30 = 39 crossings.", place: "thousands", placeValue: 1000, pairs: [[3, 3], [5, 6]], sum: 39 },
      { say: "Ten-thousands column: 3 lines cross 6 lines. 18 crossings.", place: "ten-thousands", placeValue: 10000, pairs: [[3, 6]], sum: 18 },
    ] as readonly ColumnStep[],
    landing: "Read the columns right to left, carrying: 0, 40, 39, 39, 18.",
  },

  vedic: {
    key: "vedic",
    name: "Indian Vedic (Urdhva-Tiryagbhyam)",
    origin: "the 'vertically and crosswise' sutra: one pass, one result digit per column",
    limitation:
      "The fastest road, but the crosswise pattern must be memorized for each size, and the carries stack up in your head.",
    columns: [
      { say: "Units, vertically: 0 × 8 = 0. Write 0.", place: "units", placeValue: 1, pairs: [[0, 8]], sum: 0, carryIn: 0, digit: 0, carryOut: 0 },
      { say: "Tens, crosswise: 5 × 8 + 0 × 3 = 40. Write 0, carry 4.", place: "tens", placeValue: 10, pairs: [[5, 8], [0, 3]], sum: 40, carryIn: 0, digit: 0, carryOut: 4 },
      { say: "Hundreds, three ways: 3 × 8 + 5 × 3 + 0 × 6 = 39, plus the carry makes 43. Write 3, carry 4.", place: "hundreds", placeValue: 100, pairs: [[3, 8], [5, 3], [0, 6]], sum: 39, carryIn: 4, digit: 3, carryOut: 4 },
      { say: "Thousands, crosswise: 3 × 3 + 5 × 6 = 39, plus the carry makes 43. Write 3, carry 4.", place: "thousands", placeValue: 1000, pairs: [[3, 3], [5, 6]], sum: 39, carryIn: 4, digit: 3, carryOut: 4 },
      { say: "Ten-thousands, vertically: 3 × 6 = 18, plus the carry makes 22. Write it all.", place: "ten-thousands", placeValue: 10000, pairs: [[3, 6]], sum: 18, carryIn: 4, digit: 22, carryOut: 0 },
    ] as readonly VedicColumn[],
    landing: "The digits, assembled right to left.",
  },
} as const;

export type MultMethodKey = "standard" | "lines" | "vedic";
