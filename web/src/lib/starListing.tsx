import type { ReactNode } from "react";

/**
 * STaR's Algorithm 1 compressed to ten lines — the code column only, shared
 * verbatim by page 12 (which annotates it) and page 13 (which diffs the
 * rumored frontier rewrite against it). The sharing is the point: page 13's
 * diff is only honest if the left-hand side is exactly what the reader ran on
 * page 12, so edit each page's annotations, never fork this column.
 */
export const STAR_LINES: { indent: number; code: ReactNode }[] = [
  {
    indent: 0,
    code: (
      <>
        M ← M<sub>0</sub>
      </>
    ),
  },
  { indent: 0, code: "loop: until accuracy plateaus" },
  { indent: 1, code: "kept ← ∅" },
  { indent: 1, code: "for (x, y) in problems:" },
  { indent: 2, code: "r, ŷ ← M(x)" },
  { indent: 2, code: "if ŷ = y: keep (x, r, y)" },
  { indent: 2, code: "else:" },
  { indent: 3, code: "r′, ŷ′ ← M(x, hint = y)" },
  { indent: 3, code: "if ŷ′ = y: keep (x, r′, y)" },
  {
    indent: 1,
    code: (
      <>
        M ← finetune(M<sub>0</sub>, kept)
      </>
    ),
  },
];
