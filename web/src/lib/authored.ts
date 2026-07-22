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
} as const;
