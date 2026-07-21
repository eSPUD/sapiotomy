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

// --- Page 2: Two Systems (the World Cup question) -------------------------
/**
 * The question is REAL and RECENT on purpose (docs/page_2_refactor.md): the
 * FIFA 2026 World Cup final is days old as this deck is being built, so a
 * reader recalls the winner instantly while a model whose training data ends
 * earlier cannot.
 *
 * !! PLACEHOLDER ANSWER KEY !! `winnerIndex` was authored by a tool whose own
 * training data ALSO ends before the final (the page's failure mode, live):
 * verify the real winner, fix `winnerIndex` and, if needed, the options list
 * before shipping. The in-app chip and the page footer flag this until then.
 *
 * The machine's reply is an authored EXAMPLE of the ideal honest failure
 * ("not trained on that data"). The planned live route swaps it for a real
 * completion from a small open model with no web search; the swap point is
 * fetchMachineReply() in components/pages/Page2.tsx.
 */
export const WORLD_CUP_2026 = {
  question: "Who won the FIFA 2026 World Cup?",
  /** Four plausible names, alphabetical so the order implies no ranking. */
  options: ["Argentina", "England", "France", "Spain"],
  /** TODO(ship): verify against the real result; see the block comment. */
  winnerIndex: 3,
  machine: {
    label: "a small open model",
    cutoffLabel: "memory sealed early 2025",
    constraintLabel: "no web search",
  },
  /** Authored example of the ideal reply: the model owns the gap in its data. */
  exampleReply: [
    "Straight answer: I don't know, and I can't.",
    "My training data ends in early 2025, and that final was played after the cutoff, so I was not trained on the result. I have no web search, so I cannot look it up. And I cannot reason my way to it either: a match result is not derivable from anything I do hold. There is nothing to work from.",
    "Any of those four names would be a coin flip dressed up as an answer. As far as my memory is concerned, that final has not been played yet.",
  ],
} as const;
