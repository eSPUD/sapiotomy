/**
 * The 20-page route map for *The Story of Inference-Time Scaling*.
 *
 * Three Acts (Nicky Case's "this happens, THEREFORE that, BUT that…"):
 *   Act 1 — Building Intuition (pages 1–5)
 *   Act 2 — The Toolbox       (pages 6–13)
 *   Act 3 — Frontier & Caveats(pages 14–20)
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
  1: { title: "Building Intuition", range: "Pages 1–5" },
  2: { title: "The Toolbox", range: "Pages 6–13" },
  3: { title: "Frontier & Caveats", range: "Pages 14–20" },
};

export const PAGES: PageMeta[] = [
  { n: 1, slug: "think-fast-think-slow", title: "Think Fast, Think Slow", act: 1, concept: "Feel your own two speeds: the size of the problem sets the thinking time.", milestone: "S1" },
  { n: 2, slug: "machines-two-speeds", title: "The Machine's Two Speeds", act: 1, concept: "Instant answers crack silently as problems grow; thinking catches them.", milestone: "S1" },
  { n: 3, slug: "match-night", title: "Match Night", act: 1, concept: "Thinking sharpens some answers and buys nothing on others; a fixed fact is memory or nothing.", milestone: "S1" },
  { n: 4, slug: "two-machines", title: "Two Machines", act: 1, concept: "The two ways of having answers get their proper names, and their bills point the money at thinking.", milestone: "S1" },
  { n: 5, slug: "ask-many-times", title: "What If We Ask Many Times?", act: 1, concept: "Repeated sampling and coverage.", milestone: "M2" },
  { n: 6, slug: "majority-vote", title: "The Majority Vote (Self-Consistency)", act: 2, concept: "Sample many chains, take the most common answer.", milestone: "M1" },
  { n: 7, slug: "voting-not-enough", title: "When Voting Isn't Enough", act: 2, concept: "Majority vote plateaus when the right answer is rare.", milestone: "M3" },
  { n: 8, slug: "best-of-n", title: "Best-of-N with a Verifier", act: 2, concept: "Generate N candidates; a verifier picks the best.", milestone: "M3" },
  { n: 9, slug: "grading-steps", title: "Grading the Steps (Process vs. Outcome Rewards)", act: 2, concept: "PRM grades each step; ORM grades only the final answer.", milestone: "M3" },
  { n: 10, slug: "maze-explorer", title: "The Maze Explorer (Tree Search)", act: 2, concept: "Tree-of-Thoughts: branch, evaluate, prune, backtrack.", milestone: "M4" },
  { n: 11, slug: "alphago", title: "Interlude: How AlphaGo Thought", act: 2, concept: "Monte Carlo Tree Search as the ancestor of test-time search.", milestone: "M4" },
  { n: 12, slug: "scaling-curve-lab", title: "The Scaling-Curve Lab (Log-Linear Coverage)", act: 2, concept: "Coverage grows roughly log-linearly with samples.", milestone: "M4" },
  { n: 13, slug: "allocation-game", title: "The Allocation Game (Compute-Optimal Scaling)", act: 2, concept: "How you spend a fixed compute budget matters.", milestone: "M4" },
  { n: 14, slug: "wait-button", title: "The 'Wait' Button (Budget Forcing)", act: 3, concept: "Force more thinking by appending 'Wait'.", milestone: "M5" },
  { n: 15, slug: "rl-training-curve", title: "Reasoning Models & the RL Training Curve", act: 3, concept: "RL teaches models to reason; the curve climbs as thinking lengthens.", milestone: "M5" },
  { n: 16, slug: "cost-of-thinking", title: "The Cost of Thinking (Economics Dashboard)", act: 3, concept: "Extra inference compute costs real money.", milestone: "M5" },
  { n: 17, slug: "overthinking", title: "When More Thinking Hurts (Overthinking)", act: 3, concept: "Beyond a point, longer reasoning can reduce accuracy.", milestone: "M5" },
  { n: 18, slug: "faithfulness", title: "Do the Thoughts Tell the Truth? (Faithfulness)", act: 3, concept: "Stated chain-of-thought may not reflect real reasoning.", milestone: "M5" },
  { n: 19, slug: "you-be-the-judge", title: "You Be the Judge (The Illusion of Thinking Debate)", act: 3, concept: "Accuracy 'collapse' vs. the token-limit/evaluation rebuttal.", milestone: "M5" },
  { n: 20, slug: "grand-sandbox", title: "The Grand Sandbox + Your Toolkit", act: 3, concept: "All levers together, plus a pre/post quiz.", milestone: "M6" },
];

export function getPage(n: number): PageMeta | undefined {
  return PAGES.find((p) => p.n === n);
}

export function pageHref(n: number): string {
  return `/p/${n}`;
}
