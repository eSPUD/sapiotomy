"use client";

import type { PairedClass } from "@/lib/paired";

export interface PairedGridProps {
  /** One entry per problem, from `pairedTable`. */
  cells: PairedClass[];
  /** Border and fill classes for a square, given its outcome class. */
  tone: (cell: PairedClass) => string;
}

/**
 * A paired contrast as one square per problem, ten to a row.
 *
 * Page 5's figure 2, generalised so page 6's extension arm can use the same
 * picture: both pages need a reader to see that a net near zero is a lot of
 * movement cancelling, which a delta cannot show and a flat line actively
 * hides. Colour is the caller's business, because what counts as good news
 * differs between the two.
 *
 * `aria-hidden` deliberately: the counts are always in prose beside it, and a
 * screen reader given 100 unlabelled squares gets noise instead of the finding.
 */
export function PairedGrid({ cells, tone }: PairedGridProps) {
  return (
    <div className="grid w-full grid-cols-10 gap-1.5" aria-hidden="true">
      {cells.map((cell, i) => (
        <span
          key={i}
          className={`aspect-square rounded-sm border motion-safe:transition-colors motion-safe:duration-500 ${tone(cell)}`}
        />
      ))}
    </div>
  );
}
