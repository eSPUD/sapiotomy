/**
 * The 15-page route map for *The Story of Inference-Time Scaling*.
 *
 * Three Acts (Nicky Case's "this happens, THEREFORE that, BUT that…"):
 *   Act 1 — Building Intuition (pages 1–4)
 *   Act 2 — The Toolbox       (pages 5–11)
 *   Act 3 — Frontier & Caveats(pages 12–15)
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
 * model on it). Both are recorded in the old 19-page numbering.
 *
 * The deck ends at 15 (16 until the 2026-11-04 merge). Six pages have been
 * cut. On 2026-07-30, 20 ("You Be the Judge", the Illusion-of-Thinking debate)
 * and 21 ("The Grand Sandbox + Your Toolkit"); both sat off the end, so no
 * survivor moved. On 2026-08-10, four
 * more: 15 ("The Scoreboard"), 16 ("The Bill Comes Due"), 18 ("Can We Trust the
 * Thoughts?") and 19 ("The Frontier"). That cut took a bite out of the middle of
 * Act 3, so its one survivor did move: old 17 ("When Reasoning Breaks") is now
 * 15. Page 16 ("Wrap-Up") was written the same day to close the deck the cut
 * had left ending on a caveat: it is the only page that draws every lever on
 * one axis, plus a ten-question concept check.
 *
 * On 2026-11-04 pages 13 ("Frontier Reasoners I: o1, o3, and the Two-Axis
 * Scaling Curve") and 14 ("Frontier Reasoners II: DeepSeek-R1, GRPO, and the
 * 'Aha Moment'") were merged into one page 13, "Learned Reasoning: One Law,
 * Two Knobs", reordered around the concept rather than the calendar. Everything
 * after it moved down one: old 15 ("When Reasoning Breaks") is 14, old 16
 * ("Wrap-Up") is 15, and the glossary is 16. Every cross-page reference in the
 * app is written against the 1-15 numbering. Lib modules keep their older
 * names (page15Price.ts, page16.ts, page17.ts), as page17.ts already did after
 * the August cut; their headers say which page draws them now.
 *
 * Page 16 is the glossary (added 2026-09-27 as page 17, author): an appendix,
 * and only ever the glossary. It belongs to NO act (the author: never show it as part
 * of Act 3, on the landing page or anywhere else), so its entry has no `act`
 * and the type forbids one. The story is pages 1-15: `getPage` and
 * `STORY_PAGES` return story pages only, analytics count only those, and the
 * glossary is reached through `GLOSSARY`. docs/ and planning/ predate
 * the cut and still speak in the old numbers.
 *
 * Titles/concepts are drawn from InferenceTimeScaling_Explainable.md §C.
 * Routes are stubs in M0; each page is built in a later milestone.
 */
export type Act = 1 | 2 | 3;

interface PageBase {
  n: number;
  slug: string;
  title: string;
  concept: string;
  /** Milestone in which this page's simulation is built. */
  milestone: string;
}

/** Pages 1-15: each sits in exactly one act. */
export interface StoryPage extends PageBase {
  act: Act;
  appendix?: undefined;
}

/** The glossary: after the story and outside every act, so it has no act. */
export interface AppendixPage extends PageBase {
  act?: undefined;
  appendix: true;
}

export type PageMeta = StoryPage | AppendixPage;

export const ACTS: Record<Act, { title: string; range: string }> = {
  1: { title: "Building Intuition", range: "Pages 1–4" },
  2: { title: "The Toolbox", range: "Pages 5–11" },
  3: { title: "Frontier & Caveats", range: "Pages 12–15" },
};

export const PAGES: PageMeta[] = [
  { n: 1, slug: "think-fast-think-slow", title: "Think Fast, Think Slow", act: 1, concept: "Feel your own two speeds: the size of the problem sets the thinking time.", milestone: "S1" },
  { n: 2, slug: "knowledge-gap", title: "Thinking in Reality", act: 1, concept: "One question, answered on reflex, fails twice: the record moved after the training cutoff, and the question was read as the men's tournament when it never said so. A System 2 pass catches the second outright and flags the first.", milestone: "S1" },
  { n: 3, slug: "daily-training", title: "Training-Time Scaling", act: 1, concept: "Retraining daily hits a compounding bill and a finite stock of text, lags by weeks and cannot be aimed at one fact. And none of it touches the bias, which was never about what the model had read.", milestone: "S1" },
  { n: 4, slug: "reasoning-in-multiplication", title: "From Reasoning to Inference-Time Scaling", act: 1, concept: "Three cultures, three roads, one answer: reasoning as diverse pathfinding from prior knowledge, and the open question that hands Act 1 to the toolbox.", milestone: "S1" },
  { n: 5, slug: "how-to-reason", title: "Reasoning in steps", act: 2, concept: "A chain of thought is System 2 written down. A base model can be shown how, with worked examples in the prompt; an instruct model writes one unasked, and taking it away shows what it is worth.", milestone: "S2" },
  { n: 6, slug: "thinking-longer", title: "Thinking Longer", act: 2, concept: "Tokens are the compute: a budget on reasoning tokens directly sets how long a model may think (the simplest form of inference-time scaling).", milestone: "S2" },
  { n: 7, slug: "frequency-voting", title: "Frequency Voting", act: 2, concept: "Why democracy works at scale: sample many independent reasoning paths and take the majority answer, but only if the paths are actually different.", milestone: "M1" },
  { n: 8, slug: "best-of-n-verifiers", title: "Best-of-N and Verifiers: Generate, Then Select", act: 2, concept: "The majority can be confidently wrong and the right answer can be the rarest one, so let a judge score every path and pick the winner, as long as the judge is any good.", milestone: "M3" },
  { n: 9, slug: "process-supervision", title: "Best-of-N: Select by Process", act: 2, concept: "Grade the final answer, or grade every step: reading the steps can tell a wrong answer from a right one without an answer key.", milestone: "M3" },
  { n: 10, slug: "searching-thoughts", title: "Searching Through Thoughts", act: 2, concept: "Reasoning as a maze: branch, evaluate, prune, backtrack. And pay for every node you look at.", milestone: "M4" },
  { n: 11, slug: "test-time-compute-scaling-law", title: "The Keystone: The Test-Time Compute Scaling Law", act: 2, concept: "Parameters and test-time compute spend the same FLOPs. Measured on our own instrument, no amount of sampling and voting out-buys a bigger model at a matched bill: the answer is in the pile, but no answer-time rule reliably picks it.", milestone: "M4" },
  { n: 12, slug: "star-self-improvement", title: "Teaching Models to Reason: STaR and Self-Improvement", act: 3, concept: "Generate rationales, keep only the ones that reach the right answer, fine-tune on them, repeat: the model becomes its own teacher — for exactly as long as an external check filters what it studies.", milestone: "M4" },
  { n: 13, slug: "learned-reasoning", title: "Learned Reasoning: One Law, Two Knobs", act: 3, concept: "RL on verifiable problems builds reasoning into the weights and lifts the compute curve; thinking at answer time slides along it; and the lifted curve is portable, distilled into weights anyone can download.", milestone: "M5" },
  { n: 14, slug: "when-reasoning-breaks", title: "When Reasoning Breaks: Self-Correction, Verifier Reliability, Overthinking", act: 3, concept: "More thinking can make things worse: unaided self-correction degrades answers, longer reasoning can subtract, and the verifiers doing the rescuing are fallible themselves.", milestone: "M5" },
  { n: 15, slug: "wrap-up", title: "Wrap-Up: What You Now Know", act: 3, concept: "Every lever in the deck on one axis for the first time, measured on the same hundred problems, and ten questions that check the mechanisms rather than the magnitudes.", milestone: "M5" },
  { n: 16, slug: "glossary", title: "Glossary", concept: "The terms the deck uses, defined once.", milestone: "—", appendix: true },
];

/** The story proper: every page but the glossary appendix. */
export const STORY_PAGES: StoryPage[] = PAGES.filter((p): p is StoryPage => !p.appendix);

/** The glossary, page 16: the last page, in no act. */
export const GLOSSARY: AppendixPage = PAGES.find((p): p is AppendixPage => p.appendix === true)!;

/** A story page by number. The glossary is not one: use GLOSSARY. */
export function getPage(n: number): StoryPage | undefined {
  return STORY_PAGES.find((p) => p.n === n);
}

export function pageHref(n: number): string {
  return `/p/${n}`;
}
