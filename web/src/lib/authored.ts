/**
 * Authored, ILLUSTRATIVE content for Act 1 (not digitized from a paper).
 * Clearly separated from the cited curve data so the "no invented numbers"
 * discipline stays intact: these are hand-authored teaching examples and one
 * informal recorded test, and the UI labels them as such.
 *
 * House rules carried over from the approved prototypes (prototypes/slide-*):
 * no accuracy percentages anywhere in Act 1; the AI cost words (the two
 * machine names) never appear in Pages 1-3 copy or data; copy is em-dash-free.
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

// --- Page 2: The Machine's Two Speeds (instant blurts + the trace) --------
/**
 * The four instant answers reproduce an INFORMAL REAL TEST of DeepSeek-V3
 * (July 2026), recorded in notes_on_slides.md: the first three products come
 * back correct with no reasoning; 4502 × 6398 comes back 28,793,796, which is
 * wrong by exactly 10,000 (true product 28,803,796). Re-run and
 * provenance-log before shipping; the in-app chip says so.
 */
export interface BlurtRound {
  prompt: string;
  /** What the model answered instantly (verbatim from the informal test). */
  blurted: number;
  /** The true value, for the verdict line. */
  trueValue: number;
}

export const INSTANT_BLURTS: {
  model: string;
  testedOn: string;
  note: string;
  rounds: BlurtRound[];
} = {
  model: "DeepSeek-V3",
  testedOn: "July 2026",
  note: "Informal real test (notes_on_slides.md); re-run and provenance-log before shipping.",
  rounds: [
    { prompt: "2 + 2", blurted: 4, trueValue: 4 },
    { prompt: "17 × 24", blurted: 408, trueValue: 408 },
    { prompt: "350 × 638", blurted: 223300, trueValue: 223300 },
    { prompt: "4502 × 6398", blurted: 28793796, trueValue: 28803796 },
  ],
};

/**
 * HAND-AUTHORED PLACEHOLDER trace with illustrative pacing (labeled in the
 * UI); a shipping page swaps in a verbatim, provenance-logged run. Arithmetic
 * verified: 4502 × 6000 = 27,012,000; 4502 × 400 = 1,800,800; 4502 × 2 =
 * 9,004; 1,800,800 − 9,004 = 1,791,796; 27,012,000 + 1,791,796 = 28,803,796;
 * check split 4500 × 6398 + 2 × 6398 = 28,791,000 + 12,796 = 28,803,796.
 */
export const TRACE_4502: string[] = [
  "The user wants 4502 × 6398. First instinct says 28,793,796. On a number this size, instinct is exactly what just got burned; work it properly.",
  "Break it up: 4502 × 6398 = 4502 × 6000 + 4502 × 398.",
  "4502 × 6000 = 27,012,000.",
  "Now 4502 × 398. Easier as 4502 × 400 minus 4502 × 2.",
  "4502 × 400 = 1,800,800. And 4502 × 2 = 9,004.",
  "So 4502 × 398 = 1,800,800 − 9,004 = 1,791,796.",
  "Add the pieces: 27,012,000 + 1,791,796 = 28,803,796.",
  "Wait. That is not what instinct said. 28,803,796 against 28,793,796: the two differ by exactly 10,000. One of them slipped a digit. Check it by a different route.",
  "Different split: 4500 × 6398 = 28,791,000, and 2 × 6398 = 12,796.",
  "28,791,000 + 12,796 = 28,803,796. Both routes agree. The instinct was the one that slipped.",
  "So 4502 × 6398 = 28,803,796.",
];

export const TRACE_4502_ANSWER = 28803796;

// --- Page 3: Match Night (hypothetical; nothing here can go stale) --------
/**
 * The match is a HYPOTHETICAL: no real teams, no real facts, no real result.
 * The form guide is invented on purpose so a reader who has never watched
 * football has exactly as much to reason from as a fan, and so nothing on the
 * page dates. pastYear is a knob: any final far enough back that "I've got
 * nothing" stays common works; the page never states the winner.
 */
export const MATCH_NIGHT = {
  pastYear: 2010,
  formGuide: {
    favorite: [
      "won every match on the way here",
      "eleven goals scored, one conceded",
      "full squad fit",
      "five days' rest",
    ],
    underdog: [
      "knocked out the defending champions",
      "the tournament's in-form goalkeeper",
      "has trailed in every knockout match, and won each one",
      "four days' rest",
    ],
  },
  /** Index into formGuide.favorite of the line the injury news kills. */
  injuredLineIndex: 2,
  injuredLineReplacement: "star striker out",
};
