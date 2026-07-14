/**
 * Pre/post conceptual quiz for Page 20. Questions target the learning
 * objectives: log-axis reading, verifier-vs-vote, and overthinking.
 */
export interface QuizQuestion {
  id: string;
  objective: string;
  prompt: string;
  options: string[];
  correctIndex: number;
}

export const QUIZ: QuizQuestion[] = [
  {
    id: "log-axis",
    objective: "Read a log-linear coverage curve",
    prompt:
      "Coverage grows log-linearly with samples. Going from 10 → 100 samples gave +17 points. Roughly what does 100 → 1000 samples buy?",
    options: ["About +17 points again", "About +170 points", "Nothing — it has saturated", "It goes down"],
    correctIndex: 0,
  },
  {
    id: "verifier-vs-vote",
    objective: "Explain why a verifier can beat majority voting",
    prompt: "Why can best-of-N with a good verifier beat majority voting?",
    options: [
      "It generates more samples",
      "It can pick a correct answer even when it is a minority",
      "It makes the model larger",
      "It always uses chain-of-thought",
    ],
    correctIndex: 1,
  },
  {
    id: "overthinking",
    objective: "Reason about the overthinking regime",
    prompt: "On an easy problem, steadily increasing the thinking length will…",
    options: [
      "Always increase accuracy",
      "Never change accuracy",
      "Increase accuracy, then decrease it past a peak",
      "Immediately decrease accuracy",
    ],
    correctIndex: 2,
  },
];

export function scoreQuiz(answers: Record<string, number>): number {
  return QUIZ.reduce((score, q) => score + (answers[q.id] === q.correctIndex ? 1 : 0), 0);
}

export interface ResourceLink {
  label: string;
  url: string;
}

export const RESOURCES: ResourceLink[] = [
  { label: "Wei et al. 2022 — Chain-of-Thought Prompting", url: "https://arxiv.org/abs/2201.11903" },
  { label: "Wang et al. 2022 — Self-Consistency", url: "https://arxiv.org/abs/2203.11171" },
  { label: "Lightman et al. 2023 — Let's Verify Step by Step", url: "https://arxiv.org/abs/2305.20050" },
  { label: "Yao et al. 2023 — Tree of Thoughts", url: "https://arxiv.org/abs/2305.10601" },
  { label: "Snell et al. 2024 — Scaling Test-Time Compute", url: "https://arxiv.org/abs/2408.03314" },
  { label: "Brown et al. 2024 — Large Language Monkeys", url: "https://arxiv.org/abs/2407.21787" },
  { label: "DeepSeek-R1 2025", url: "https://arxiv.org/abs/2501.12948" },
  { label: "Muennighoff et al. 2025 — s1 (preprint)", url: "https://arxiv.org/abs/2501.19393" },
  { label: "Anthropic 2025 — Reasoning models don't always say what they think (preprint)", url: "https://arxiv.org/abs/2505.05410" },
  { label: "Shojaee et al. 2025 — The Illusion of Thinking (preprint)", url: "https://arxiv.org/abs/2506.06941" },
];
