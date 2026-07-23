/**
 * The 19-page route map for *The Story of Inference-Time Scaling*.
 *
 * Three Acts (Nicky Case's "this happens, THEREFORE that, BUT that…"):
 *   Act 1 — Building Intuition (pages 1–4)
 *   Act 2 — The Toolbox       (pages 5–12)
 *   Act 3 — Frontier & Caveats(pages 13–19)
 *
 * Titles/concepts are drawn from InferenceTimeScaling_Explainable.md §C.
 * Routes are stubs in M0; each page is built in a later milestone.
 */
export type Act = 1 | 2 | 3;

export interface PageMeta {
  n: number;
  slug: string;
  title: string;
  act: Act;
  concept: string;
  /** Milestone in which this page's simulation is built. */
  milestone: string;
}

export const ACTS: Record<Act, { title: string; range: string }> = {
  1: { title: "Building Intuition", range: "Pages 1–4" },
  2: { title: "The Toolbox", range: "Pages 5–12" },
  3: { title: "Frontier & Caveats", range: "Pages 13–19" },
};

export const PAGES: PageMeta[] = [
  { n: 1, slug: "think-fast-think-slow", title: "Think Fast, Think Slow", act: 1, concept: "Feel your own two speeds: the size of the problem sets the thinking time.", milestone: "S1" },
  { n: 2, slug: "two-systems", title: "Two Systems", act: 1, concept: "A question that looks like a lookup: the reader recalls it instantly; a machine whose memory predates the fact cannot, and thinking harder does not create the fact.", milestone: "S1" },
  { n: 3, slug: "daily-training", title: "Daily Training?", act: 1, concept: "Pricing the obvious fix: one cited per-run cost times a year of daily retraining is an impossible bill.", milestone: "S1" },
  { n: 4, slug: "the-third-option", title: "The Third Option", act: 1, concept: "Not answering from memory (p2) and not retraining (p3), but spending compute at answer time: thinking. The reveal and naming of inference-time scaling, and the setup for Act 2's toolbox.", milestone: "S1" },
  { n: 5, slug: "majority-vote", title: "The Majority Vote (Self-Consistency)", act: 2, concept: "Sample many chains, take the most common answer.", milestone: "M1" },
  { n: 6, slug: "voting-not-enough", title: "When Voting Isn't Enough", act: 2, concept: "Majority vote plateaus when the right answer is rare.", milestone: "M3" },
  { n: 7, slug: "best-of-n", title: "Best-of-N with a Verifier", act: 2, concept: "Generate N candidates; a verifier picks the best.", milestone: "M3" },
  { n: 8, slug: "grading-steps", title: "Grading the Steps (Process vs. Outcome Rewards)", act: 2, concept: "PRM grades each step; ORM grades only the final answer.", milestone: "M3" },
  { n: 9, slug: "maze-explorer", title: "The Maze Explorer (Tree Search)", act: 2, concept: "Tree-of-Thoughts: branch, evaluate, prune, backtrack.", milestone: "M4" },
  { n: 10, slug: "alphago", title: "Interlude: How AlphaGo Thought", act: 2, concept: "Monte Carlo Tree Search as the ancestor of test-time search.", milestone: "M4" },
  { n: 11, slug: "scaling-curve-lab", title: "The Scaling-Curve Lab (Log-Linear Coverage)", act: 2, concept: "Coverage grows roughly log-linearly with samples.", milestone: "M4" },
  { n: 12, slug: "allocation-game", title: "The Allocation Game (Compute-Optimal Scaling)", act: 2, concept: "How you spend a fixed compute budget matters.", milestone: "M4" },
  { n: 13, slug: "wait-button", title: "The 'Wait' Button (Budget Forcing)", act: 3, concept: "Force more thinking by appending 'Wait'.", milestone: "M5" },
  { n: 14, slug: "rl-training-curve", title: "Reasoning Models & the RL Training Curve", act: 3, concept: "RL teaches models to reason; the curve climbs as thinking lengthens.", milestone: "M5" },
  { n: 15, slug: "cost-of-thinking", title: "The Cost of Thinking (Economics Dashboard)", act: 3, concept: "Extra inference compute costs real money.", milestone: "M5" },
  { n: 16, slug: "overthinking", title: "When More Thinking Hurts (Overthinking)", act: 3, concept: "Beyond a point, longer reasoning can reduce accuracy.", milestone: "M5" },
  { n: 17, slug: "faithfulness", title: "Do the Thoughts Tell the Truth? (Faithfulness)", act: 3, concept: "Stated chain-of-thought may not reflect real reasoning.", milestone: "M5" },
  { n: 18, slug: "you-be-the-judge", title: "You Be the Judge (The Illusion of Thinking Debate)", act: 3, concept: "Accuracy 'collapse' vs. the token-limit/evaluation rebuttal.", milestone: "M5" },
  { n: 19, slug: "grand-sandbox", title: "The Grand Sandbox + Your Toolkit", act: 3, concept: "All levers together, plus a pre/post quiz.", milestone: "M6" },
];

export function getPage(n: number): PageMeta | undefined {
  return PAGES.find((p) => p.n === n);
}

export function pageHref(n: number): string {
  return `/p/${n}`;
}
