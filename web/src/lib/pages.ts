/**
 * The 19-page route map for *The Story of Inference-Time Scaling*.
 *
 * Three Acts (Nicky Case's "this happens, THEREFORE that, BUT that…"):
 *   Act 1 — Building Intuition (pages 1–4)
 *   Act 2 — The Toolbox       (pages 5–11)
 *   Act 3 — Frontier & Caveats(pages 12–19)
 *
 * The seam is 11|12, set by review 2026-07-30 against the act definitions the
 * author states: Act 2 is "thinking longer, the searching algorithms, more
 * adaptive thinking"; Act 3 is "teaching models to use these algorithms
 * natively, what the frontier did, how to measure inference-time scaling, and
 * the drawbacks of thinking". So page 11 (The Keystone) CLOSES Act 2 — its
 * difficulty-aware budget bands are the adaptive-thinking payoff and it prices
 * the search quality page 10 built, with no trained model anywhere on it — and
 * page 12 (STaR) OPENS Act 3, the first page where the model teaches itself.
 * Two earlier boundaries were wrong and are recorded so they are not restored:
 * 5–12/13–19 (shipped, put STaR in the toolbox) and 5–10/11–19 (planning/
 * act3_plan.md, which weights page 11's two-axis setup for page 13 over its
 * own adaptive-allocation content and opens Act 3 on a page with no frontier
 * model on it).
 *
 * The deck ends at 19. Two pages were cut on 2026-07-30: 20 ("You Be the
 * Judge", the Illusion-of-Thinking debate) and 21 ("The Grand Sandbox + Your
 * Toolkit"). Do not renumber the survivors to fill the gap; the 1-19 numbering
 * is what every cross-page reference in the deck is written against.
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
  2: { title: "The Toolbox", range: "Pages 5–11" },
  3: { title: "Frontier & Caveats", range: "Pages 12–19" },
};

export const PAGES: PageMeta[] = [
  { n: 1, slug: "think-fast-think-slow", title: "Think Fast, Think Slow", act: 1, concept: "Feel your own two speeds: the size of the problem sets the thinking time.", milestone: "S1" },
  { n: 2, slug: "knowledge-gap", title: "Thinking in Reality", act: 1, concept: "One question, answered on reflex, fails twice: the record moved after the training cutoff, and the question was read as the men's tournament when it never said so. A System 2 pass catches the second outright and flags the first.", milestone: "S1" },
  { n: 3, slug: "daily-training", title: "Training-Time Scaling", act: 1, concept: "Retraining daily hits a compounding bill and a finite stock of text, lags by weeks and cannot be aimed at one fact. And none of it touches the bias, which was never about what the model had read.", milestone: "S1" },
  { n: 4, slug: "reasoning-in-multiplication", title: "Reasoning: Diverse Pathfinding", act: 1, concept: "Three cultures, three roads, one answer: reasoning as diverse pathfinding from prior knowledge, and the open question that hands Act 1 to the toolbox.", milestone: "S1" },
  { n: 5, slug: "how-to-reason", title: "Chain of Thought: Reasoning Out Loud", act: 2, concept: "A chain of thought is System 2 written down: a thread of steps from the question to the goal, and for a model the thread is the output rather than a report of it. A 2026 instruct model writes one unasked, so what it is worth gets measured by taking it away.", milestone: "S2" },
  { n: 6, slug: "thinking-longer", title: "Thinking Longer", act: 2, concept: "Tokens are the compute: a budget on reasoning tokens directly sets how long a model may think (the simplest form of inference-time scaling).", milestone: "S2" },
  { n: 7, slug: "frequency-voting", title: "Frequency Voting", act: 2, concept: "Why democracy works at scale: sample many independent reasoning paths and take the majority answer, but only if the paths are actually different.", milestone: "M1" },
  { n: 8, slug: "best-of-n-verifiers", title: "Best-of-N and Verifiers: Generate, Then Select", act: 2, concept: "The majority can be confidently wrong and the right answer can be the rarest one, so let a judge score every path and pick the winner, as long as the judge is any good.", milestone: "M3" },
  { n: 9, slug: "process-supervision", title: "Outcome vs Process Supervision", act: 2, concept: "Grade the final answer, or grade every step: only the second catches 'right answer, wrong reasoning', and only where there is a fact to be right about.", milestone: "M3" },
  { n: 10, slug: "searching-thoughts", title: "Searching Through Thoughts", act: 2, concept: "Reasoning as a maze: branch, evaluate, prune, backtrack. And pay for every node you look at.", milestone: "M4" },
  { n: 11, slug: "test-time-compute-scaling-law", title: "The Keystone: The Test-Time Compute Scaling Law", act: 2, concept: "Parameters and thinking time spend the same FLOPs: matched budget for budget, a small model that thinks can beat a 14x larger one — except on the hardest problems.", milestone: "M4" },
  { n: 12, slug: "star-self-improvement", title: "Teaching Models to Reason: STaR and Self-Improvement", act: 3, concept: "Generate rationales, keep only the ones that reach the right answer, fine-tune on them, repeat: the model becomes its own teacher — for exactly as long as an external check filters what it studies.", milestone: "M4" },
  { n: 13, slug: "frontier-reasoners-o1", title: "Frontier Reasoners I: o1, o3, and the Two-Axis Scaling Curve", act: 3, concept: "The first commercial model trained by RL to reason in a long private chain: accuracy climbs log-linearly with train-time RL compute and with test-time thinking, and the chain itself is hidden.", milestone: "M5" },
  { n: 14, slug: "frontier-reasoners-deepseek-r1", title: "Frontier Reasoners II: DeepSeek-R1, GRPO, and the “Aha Moment”", act: 3, concept: "Open weights answer the black box: reward only verifiable right answers (GRPO) and the pausing and self-correcting emerge on their own — then get distilled into models 1.5B–70B.", milestone: "M4" },
  { n: 15, slug: "the-scoreboard", title: "The Scoreboard: Benchmarks That Track Reasoning", act: 3, concept: "A score is not a property of a model: it is a point with four coordinates (model variant, test version, harness, thinking budget), and the headline drops the coordinates. And a benchmark is an instrument with a window: born at the floor, dead at the ceiling, which is why the goalposts must keep moving.", milestone: "M5" },
  { n: 16, slug: "bill-comes-due", title: "The Bill Comes Due: Economics and Diminishing Returns", act: 3, concept: "Thinking longer is metered: when does spending compute at answer time beat retraining, and where does it become uneconomical?", milestone: "M5" },
  { n: 17, slug: "when-reasoning-breaks", title: "When Reasoning Breaks: Self-Correction, Verifier Reliability, Overthinking", act: 3, concept: "More thinking can make things worse: unaided self-correction degrades answers, longer reasoning can subtract, and the verifiers doing the rescuing are fallible themselves.", milestone: "M5" },
  { n: 18, slug: "trust-the-thoughts", title: "Can We Trust the Thoughts? Faithfulness, Monitorability, and Safety", act: 3, concept: "The visible chain of thought may not be the real reason for the answer, and optimizing the trace teaches models to hide misbehavior instead of dropping it.", milestone: "M5" },
  { n: 19, slug: "the-frontier", title: "The Frontier: Latent Reasoning, Adaptive Compute, and Agents", act: 3, concept: "Beyond token-by-token thought: silent latent reasoning, budgets that flex with difficulty, and reasoning that acts — plus what each costs in readability.", milestone: "M5" },
];

export function getPage(n: number): PageMeta | undefined {
  return PAGES.find((p) => p.n === n);
}

export function pageHref(n: number): string {
  return `/p/${n}`;
}
