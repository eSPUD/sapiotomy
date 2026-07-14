/**
 * Authored, ILLUSTRATIVE content for Act 1 (not digitized from a paper).
 * Clearly separated from the cited curve data so the "no invented numbers"
 * discipline stays intact: these are hand-authored teaching examples, and the
 * UI labels them as such.
 */

// --- Page 1: Two Speeds of Thinking (System 1 vs System 2) ---------------
export interface MentalMathProblem {
  prompt: string;
  answer: number;
  /** Illustrative accuracy when answering by reflex vs. working it out. */
  fastAccuracy: number;
  slowAccuracy: number;
  kind: "system1" | "system2";
}

export const MENTAL_MATH: MentalMathProblem[] = [
  { prompt: "2 + 2", answer: 4, fastAccuracy: 0.99, slowAccuracy: 0.99, kind: "system1" },
  { prompt: "17 × 24", answer: 408, fastAccuracy: 0.15, slowAccuracy: 0.9, kind: "system2" },
];

// --- Page 4: Not Every Path Is Right (authored trace bank) ---------------
export interface ReasoningTrace {
  steps: string[];
  correct: boolean;
  /** Did the chain go wrong at or after its first step? */
  failsAfterFirstStep: boolean;
}

// Illustrates Yao et al. (2023): slightly more than 60% of chain-of-thought
// "thoughts" failed after their first step. The bank below is authored so that
// the majority of traces fail after step 1 (see act1 test).
export const TRACE_BANK: ReasoningTrace[] = [
  {
    steps: ["A dozen eggs = 12.", "Half a dozen = 8.", "So 12 + 8 = 20."],
    correct: false,
    failsAfterFirstStep: true,
  },
  {
    steps: ["A dozen eggs = 12.", "Half a dozen = 6.", "So 12 + 6 = 18."],
    correct: true,
    failsAfterFirstStep: false,
  },
  {
    steps: ["Start with 3 boxes.", "Each box has 4 pens.", "3 × 4 = 7 pens."],
    correct: false,
    failsAfterFirstStep: true,
  },
  {
    steps: ["Speed = 60 km/h.", "Time = 2 h.", "Distance = 60 × 2 = 120, minus 20 = 100."],
    correct: false,
    failsAfterFirstStep: true,
  },
  {
    steps: ["3 boxes.", "4 pens each.", "3 × 4 = 12 pens."],
    correct: true,
    failsAfterFirstStep: false,
  },
];

export const TRACE_BANK_STAT = {
  /** Yao et al. 2023: > 60% of thoughts failed after their first step. */
  reportedFailAfterStep1: 0.6,
  citation: {
    ref: "Yao et al. 2023",
    url: "https://arxiv.org/abs/2305.10601",
    venue: "NeurIPS 2023",
    preprint: false,
  },
};
