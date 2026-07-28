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
  { n: 11, slug: "test-time-compute-scaling-law", title: "The Keystone: The Test-Time Compute Scaling Law", act: 2, concept: "Parameters and thinking time spend the same FLOPs: matched budget for budget, a small model that thinks can beat a 14x larger one — except on the hardest problems.", milestone: "M4" },
  { n: 12, slug: "star-self-improvement", title: "Teaching Models to Reason: STaR and Self-Improvement", act: 2, concept: "Generate rationales, keep only the ones that reach the right answer, fine-tune on them, repeat: the model becomes its own teacher — for exactly as long as an external check filters what it studies.", milestone: "M4" },
  { n: 13, slug: "frontier-reasoners-o1", title: "Frontier Reasoners I: o1, o3, and the Two-Axis Scaling Curve", act: 2, concept: "The first commercial model trained by RL to reason in a long private chain: accuracy climbs log-linearly with train-time RL compute and with test-time thinking, and the chain itself is hidden.", milestone: "M5" },
  { n: 14, slug: "frontier-reasoners-deepseek-r1", title: "Frontier Reasoners II: DeepSeek-R1, GRPO, and the “Aha Moment”", act: 2, concept: "Open weights answer the black box: reward only verifiable right answers (GRPO) and the pausing and self-correcting emerge on their own — then get distilled into models 1.5B–70B.", milestone: "M4" },
  { n: 15, slug: "the-scoreboard", title: "The Scoreboard: Benchmarks That Track Reasoning", act: 3, concept: "Every reasoning claim arrives as a benchmark score; each benchmark has a shelf life, and the headline number depends on the harness and the compute behind it.", milestone: "M5" },
  { n: 16, slug: "bill-comes-due", title: "The Bill Comes Due: Economics and Diminishing Returns", act: 3, concept: "Thinking longer is metered: when does spending compute at answer time beat retraining, and where does it become uneconomical?", milestone: "M5" },
  { n: 17, slug: "when-reasoning-breaks", title: "When Reasoning Breaks: Self-Correction, Verifier Reliability, Overthinking", act: 3, concept: "More thinking can make things worse: unaided self-correction degrades answers, longer reasoning can subtract, and the verifiers doing the rescuing are fallible themselves.", milestone: "M5" },
  { n: 18, slug: "trust-the-thoughts", title: "Can We Trust the Thoughts? Faithfulness, Monitorability, and Safety", act: 3, concept: "The visible chain of thought may not be the real reason for the answer, and optimizing the trace teaches models to hide misbehavior instead of dropping it.", milestone: "M5" },
  { n: 19, slug: "the-frontier", title: "The Frontier: Latent Reasoning, Adaptive Compute, and Agents", act: 3, concept: "Beyond token-by-token thought: silent latent reasoning, budgets that flex with difficulty, and reasoning that acts — plus what each costs in readability.", milestone: "M5" },
  { n: 20, slug: "you-be-the-judge", title: "You Be the Judge (The Illusion of Thinking Debate)", act: 3, concept: "Accuracy 'collapse' vs. the token-limit/evaluation rebuttal.", milestone: "M5" },
  { n: 21, slug: "grand-sandbox", title: "The Grand Sandbox + Your Toolkit", act: 3, concept: "All levers together, plus a pre/post quiz.", milestone: "M6" },
];

export function getPage(n: number): PageMeta | undefined {
  return PAGES.find((p) => p.n === n);
}

export function pageHref(n: number): string {
  return `/p/${n}`;
}
