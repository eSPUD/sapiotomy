/**
 * A McNemar 2x2 written as one square per problem.
 *
 * Page 5 invented this figure for the suppression contrast and it turned out to
 * be the deck's clearest way of saying "a net near zero is not nothing
 * happened": the two discordant counts are the picture, and the reader counts
 * squares rather than reading a delta. Page 6's extension arm needs exactly
 * that sentence, so the arithmetic and the grid live here rather than being
 * copied.
 *
 * `fixed` and `broken` are the discordant counts the notebook reports, and the
 * two concordant counts follow from them and the two solve counts, so the grid
 * is fully determined by measurement. WHICH problem sits in which square is
 * arrangement and not data, and every caption using this says so.
 */

export class PairedTableError extends Error {}

/**
 * The four outcome classes, named from the baseline's point of view:
 * `beforeOnly` is solved before the change and lost to it, `afterOnly` is
 * solved only after it.
 */
export type PairedClass = "both" | "beforeOnly" | "afterOnly" | "neither";

export interface PairedTable {
  both: number;
  beforeOnly: number;
  afterOnly: number;
  neither: number;
  n: number;
  /** One entry per problem, grouped by class in the order above. */
  cells: PairedClass[];
}

/**
 * @param n         problems in the paired set
 * @param before    how many the baseline condition solved
 * @param after     how many the changed condition solved
 * @param discordant the notebook's counts, where `fixed` is what the change
 *                   rescued and `broken` is what it cost
 */
export function pairedTable(
  n: number,
  before: number,
  after: number,
  discordant: { fixed: number; broken: number },
): PairedTable {
  const { fixed, broken } = discordant;
  const both = before - broken;
  const neither = n - fixed - broken - both;
  if (both < 0 || neither < 0 || both !== after - fixed) {
    throw new PairedTableError(
      `the paired counts (${fixed} fixed, ${broken} broken) do not reconcile with ` +
        `${before} solved before and ${after} after, of ${n}`,
    );
  }
  const cells: PairedClass[] = [
    ...Array<PairedClass>(both).fill("both"),
    ...Array<PairedClass>(broken).fill("beforeOnly"),
    ...Array<PairedClass>(fixed).fill("afterOnly"),
    ...Array<PairedClass>(neither).fill("neither"),
  ];
  return { both, beforeOnly: broken, afterOnly: fixed, neither, n, cells };
}

/**
 * Is this problem solved in the given condition? Reads straight off the class.
 * The condition is spelled rather than a boolean, because "solvedIn(cell, true)"
 * at a call site is exactly the sort of thing that gets inverted.
 */
export function solvedIn(cell: PairedClass, which: "before" | "after"): boolean {
  if (cell === "both") return true;
  if (cell === "neither") return false;
  return which === "after" ? cell === "afterOnly" : cell === "beforeOnly";
}
