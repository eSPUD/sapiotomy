/**
 * The 21-page route map for *The Story of Inference-Time Scaling*.
 *
 * Three Acts (Nicky Case's "this happens, THEREFORE that, BUT that…"):
 *   Act 1 — Building Intuition (pages 1–4)
 *   Act 2 — The Toolbox       (pages 5–14)
 *   Act 3 — Frontier & Caveats(pages 15–21)
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
  2: { title: "The Toolbox", range: "Pages 5–14" },
  3: { title: "Frontier & Caveats", range: "Pages 15–21" },
};

export const PAGES: PageMeta[] = [
  { n: 1, slug: "think-fast-think-slow", title: "Think Fast, Think Slow", act: 1, concept: "Feel your own two speeds: the size of the problem sets the thinking time.", milestone: "S1" },
  { n: 2, slug: "two-systems", title: "Two Systems", act: 1, concept: "A question that looks like a lookup: the reader recalls it instantly; a machine whose memory predates the fact cannot, and thinking harder does not create the fact.", milestone: "S1" },
  { n: 3, slug: "daily-training", title: "Training Daily?", act: 1, concept: "The obvious fix hits two walls: the bill for daily retraining compounds, and the stock of quality training data runs out.", milestone: "S1" },
  { n: 4, slug: "reasoning-in-multiplication", title: "Reasoning: Diverse Pathfinding", act: 1, concept: "Three cultures, three roads, one answer: reasoning as diverse pathfinding from prior knowledge, and the open question that hands Act 1 to the toolbox.", milestone: "S1" },
  { n: 5, slug: "how-to-reason", title: "How to Reason", act: 2, concept: "Show the model a worked road: few-shot chain-of-thought turns blurted answers into step-by-step ones, and a flat scaling curve turns steep.", milestone: "S2" },
  { n: 6, slug: "thinking-longer", title: "Thinking Longer", act: 2, concept: "Tokens are the compute: a budget on reasoning tokens directly sets how long a model may think (the simplest form of inference-time scaling).", milestone: "S2" },
  { n: 7, slug: "frequency-voting", title: "Frequency Voting", act: 2, concept: "Why democracy works at scale: sample many independent reasoning paths and take the majority answer, but only if the paths are actually different.", milestone: "M1" },
  { n: 8, slug: "best-of-n-verifiers", title: "Best-of-N and Verifiers: Generate, Then Select", act: 2, concept: "The majority can be confidently wrong and the right answer can be the rarest one, so let a judge score every path and pick the winner, as long as the judge is any good.", milestone: "M3" },
  { n: 9, slug: "process-supervision", title: "Outcome vs Process Supervision", act: 2, concept: "Grade the final answer, or grade every step: only the second catches 'right answer, wrong reasoning', and only where there is a fact to be right about.", milestone: "M3" },
  { n: 10, slug: "searching-thoughts", title: "Searching Through Thoughts", act: 2, concept: "Reasoning as a maze: branch, evaluate, prune, backtrack. And pay for every node you look at.", milestone: "M4" },
  { n: 11, slug: "maze-explorer", title: "The Maze Explorer (Tree Search)", act: 2, concept: "Tree-of-Thoughts: branch, evaluate, prune, backtrack.", milestone: "M4" },
  { n: 12, slug: "alphago", title: "Interlude: How AlphaGo Thought", act: 2, concept: "Monte Carlo Tree Search as the ancestor of test-time search.", milestone: "M4" },
  { n: 13, slug: "scaling-curve-lab", title: "The Scaling-Curve Lab (Log-Linear Coverage)", act: 2, concept: "Coverage grows roughly log-linearly with samples.", milestone: "M4" },
  { n: 14, slug: "allocation-game", title: "The Allocation Game (Compute-Optimal Scaling)", act: 2, concept: "How you spend a fixed compute budget matters.", milestone: "M4" },
  { n: 15, slug: "wait-button", title: "The 'Wait' Button (Budget Forcing)", act: 3, concept: "Force more thinking by appending 'Wait'.", milestone: "M5" },
  { n: 16, slug: "bill-comes-due", title: "The Bill Comes Due: Economics and Diminishing Returns", act: 3, concept: "Thinking longer is metered: when does spending compute at answer time beat retraining, and where does it become uneconomical?", milestone: "M5" },
  { n: 17, slug: "cost-of-thinking", title: "The Cost of Thinking (Economics Dashboard)", act: 3, concept: "Extra inference compute costs real money.", milestone: "M5" },
  { n: 18, slug: "overthinking", title: "When More Thinking Hurts (Overthinking)", act: 3, concept: "Beyond a point, longer reasoning can reduce accuracy.", milestone: "M5" },
  { n: 19, slug: "faithfulness", title: "Do the Thoughts Tell the Truth? (Faithfulness)", act: 3, concept: "Stated chain-of-thought may not reflect real reasoning.", milestone: "M5" },
  { n: 20, slug: "you-be-the-judge", title: "You Be the Judge (The Illusion of Thinking Debate)", act: 3, concept: "Accuracy 'collapse' vs. the token-limit/evaluation rebuttal.", milestone: "M5" },
  { n: 21, slug: "grand-sandbox", title: "The Grand Sandbox + Your Toolkit", act: 3, concept: "All levers together, plus a pre/post quiz.", milestone: "M6" },
];

export function getPage(n: number): PageMeta | undefined {
  return PAGES.find((p) => p.n === n);
}

export function pageHref(n: number): string {
  return `/p/${n}`;
}
