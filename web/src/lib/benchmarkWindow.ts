/**
 * Page 15's "why tests die" simulation: a benchmark as a measuring
 * instrument with a window.
 *
 * AUTHORED / ILLUSTRATIVE (page 18's discipline): difficulties, model
 * offsets and the logistic width are hand-picked teaching values, not
 * digitized from any paper. The claim the simulation carries is structural,
 * not numeric: a fixed test read against a rising frontier passes floor
 * (everyone fails, no signal) → window (scores spread, signal) → ceiling
 * (everyone passes, no signal). The page's caption anchors the structure to
 * historical, immutable facts; the simulation itself makes no claim about
 * where any real benchmark sits today, which is what lets the figure age
 * without rotting.
 */

export type WindowState = "floor" | "window" | "ceiling";

export interface WindowTest {
  key: string;
  /** Stylized, deliberately NOT a real benchmark's name. */
  label: string;
  difficulty: number;
}

/** Four tests, spaced like the real ladder (grade school → research frontier). */
export const WINDOW_TESTS: WindowTest[] = [
  { key: "grade", label: "a grade-school test", difficulty: 1.2 },
  { key: "competition", label: "a competition test", difficulty: 3.5 },
  { key: "phd", label: "a PhD-level test", difficulty: 5.8 },
  { key: "frontier", label: "a research-frontier test", difficulty: 8 },
];

/** A fixed population of five models around the frontier: laggards to leader. */
export const MODEL_OFFSETS = [-1.5, -0.75, 0, 0.6, 1.2];

/** Softness of a test's difficulty edge. */
export const WINDOW_WIDTH = 0.7;

/** All scores at or under this read as "everyone fails": no signal. */
export const FLOOR_PCT = 10;
/** All scores at or over this read as "everyone passes": no signal. */
export const CEILING_PCT = 90;

export function logistic(z: number): number {
  return 1 / (1 + Math.exp(-z));
}

/** One model's score (0–100) on one test. */
export function testScore(capability: number, difficulty: number, width = WINDOW_WIDTH): number {
  return 100 * logistic((capability - difficulty) / width);
}

/** The whole population's scores on one test, laggards first. */
export function populationScores(
  capability: number,
  difficulty: number,
  offsets: number[] = MODEL_OFFSETS,
  width = WINDOW_WIDTH,
): number[] {
  return offsets.map((o) => testScore(capability + o, difficulty, width));
}

/** Where the frontier sits relative to this test's window. */
export function windowState(scores: number[]): WindowState {
  if (scores.every((s) => s >= CEILING_PCT)) return "ceiling";
  if (scores.every((s) => s <= FLOOR_PCT)) return "floor";
  return "window";
}
