"use client";

import type { Ballot } from "@/lib/sim";

/**
 * Renders a ballot tally as labelled bars. The correct answer is always marked
 * with text ("correct"), never colour alone (accessibility invariant); the
 * plurality winner is outlined.
 */
export function BallotHistogram({ ballot }: { ballot: Ballot }) {
  const { tally } = ballot;
  const total = tally.reduce((a, b) => a + b, 0) || 1;
  const labels = tally.map((_, i) => (i === 0 ? "Answer A (correct)" : `Answer ${String.fromCharCode(65 + i)}`));

  return (
    <div className="flex flex-col gap-2" role="img" aria-label={ballotDescription(ballot, labels)}>
      {tally.map((count, i) => {
        const isCorrect = i === 0;
        const isWinner = i === ballot.winner && total > 0;
        return (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="w-36 shrink-0 text-ink-muted">{labels[i]}</span>
            <div className="relative h-5 flex-1 rounded bg-surface-raised">
              <div
                className={`h-5 rounded ${isCorrect ? "bg-correct" : "bg-grid"} ${
                  isWinner ? "ring-2 ring-compute" : ""
                }`}
                style={{ width: `${(count / total) * 100}%` }}
              />
            </div>
            <span className="w-16 shrink-0 text-right font-mono text-ink">
              {count}
              {isWinner ? " ✓" : ""}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function ballotDescription(ballot: Ballot, labels: string[]): string {
  const outcome = ballot.correctIsPlurality
    ? "the correct answer wins the vote"
    : `a wrong answer (${labels[ballot.winner]}) wins the vote`;
  return `Ballot tally: ${ballot.tally.join(", ")}. ${outcome}.`;
}
