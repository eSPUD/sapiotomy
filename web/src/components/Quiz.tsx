"use client";

import { useState } from "react";
import { QUIZ, scoreQuiz } from "@/lib/quiz";

export interface QuizProps {
  /** "pre" hides correctness; "post" reveals answers. */
  mode: "pre" | "post";
  onComplete: (score: number) => void;
}

export function Quiz({ mode, onComplete }: QuizProps) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const allAnswered = QUIZ.every((q) => answers[q.id] !== undefined);

  return (
    <div className="flex flex-col gap-4">
      {QUIZ.map((q) => (
        <fieldset key={q.id} className="rounded-lg border border-grid bg-surface p-4">
          <legend className="px-1 text-xs uppercase tracking-wide text-ink-muted">{q.objective}</legend>
          <p className="mb-2 text-sm font-medium text-ink">{q.prompt}</p>
          <div className="flex flex-col gap-1.5">
            {q.options.map((opt, i) => {
              const chosen = answers[q.id] === i;
              const reveal = submitted && mode === "post";
              const isCorrect = i === q.correctIndex;
              return (
                <label
                  key={i}
                  className={`flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm ${
                    reveal && isCorrect
                      ? "bg-correct/15 text-correct"
                      : reveal && chosen && !isCorrect
                        ? "bg-wrong/15 text-wrong"
                        : "text-ink"
                  }`}
                >
                  <input
                    type="radio"
                    name={q.id}
                    checked={chosen}
                    disabled={submitted}
                    onChange={() => setAnswers((a) => ({ ...a, [q.id]: i }))}
                    className="accent-compute"
                  />
                  {opt}
                  {reveal && isCorrect ? " ✓" : ""}
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}
      <button
        type="button"
        disabled={!allAnswered || submitted}
        onClick={() => {
          setSubmitted(true);
          onComplete(scoreQuiz(answers));
        }}
        className="w-fit rounded bg-compute px-4 py-2 text-sm font-semibold text-canvas disabled:opacity-50"
      >
        {submitted ? "Submitted" : mode === "pre" ? "Submit predictions" : "Submit answers"}
      </button>
    </div>
  );
}
