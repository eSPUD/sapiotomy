/**
 * Display helpers shared by every page that draws a measured trace.
 *
 * These live here rather than in a page's own module for the reason
 * `notebooks/README.md` gives for extracting `harness.py`: two copies of one
 * derivation drift, and the failure mode is silent corruption of the text that
 * then goes on the screen. Page 5 was the first consumer and re-exports them
 * for its existing callers; page 6 imports them directly.
 */

/**
 * Display-only tidying of the model's own LaTeX so a maths trace reads as
 * maths on a page with no formula renderer. This changes how the trace LOOKS
 * and never what it says: delimiters go, a handful of macros become the symbol
 * they stand for, and anything unrecognised is left exactly as the model wrote
 * it. The untouched trace ships in `traces.jsonl` beside the notebook.
 */
/**
 * A fraction or a root loses its braces on the way to plain text, and with them
 * the grouping the braces were doing. `\frac{\sqrt{ab+a}}{\sqrt{ab-b}}` flattened
 * naively reads `√ab + a/√ab - b`, which is a different expression from the one
 * the model wrote. So an argument that is not a single term keeps a bracket.
 */
const isOneTerm = (x: string): boolean => {
  if (!/[+\-−=<>\s]/.test(x)) return true;
  // Already bracketed as a whole, e.g. `√(ab + a)` or `(x + 1)`: no second pair.
  const inner = x.replace(/^√/, "");
  if (!inner.startsWith("(") || !inner.endsWith(")")) return false;
  let depth = 0;
  for (let i = 0; i < inner.length; i++) {
    if (inner[i] === "(") depth += 1;
    else if (inner[i] === ")") {
      depth -= 1;
      if (depth === 0) return i === inner.length - 1;
    }
  }
  return false;
};
const group = (x: string): string => (isOneTerm(x) ? x : `(${x})`);

/**
 * The three macros that wrap an argument in braces. Each pass resolves the
 * innermost level, because the brace class cannot match across a nested pair;
 * `tidyMath` runs them to a fixed point so `\boxed{\frac{3\sqrt{3}}{4}}` comes
 * out as `3√3/4` rather than as most of itself.
 */
const unwrapOnce = (s: string): string =>
  s
    .replace(/\\boxed\{([^{}]*)\}/g, "$1")
    .replace(/\\[dt]?frac\{([^{}]*)\}\{([^{}]*)\}/g, (_, a: string, b: string) =>
      `${group(a)}/${group(b)}`,
    )
    .replace(/\\sqrt\{([^{}]*)\}/g, (_, a: string) => `√${group(a)}`);

/** More levels than any trace in the deck carries, and a guard against a cycle. */
const MAX_NESTING = 8;

export function tidyMath(text: string): string {
  let out = text.replace(/\\displaystyle\s*/g, "");
  for (let i = 0; i < MAX_NESTING; i++) {
    const next = unwrapOnce(out);
    if (next === out) break;
    out = next;
  }
  return out
    .replace(/\\(left|right|,|!|;|quad|qquad)/g, " ")
    // Escaped punctuation is the character itself. `\$` stays out of this: the
    // next rule strips `$` as a maths delimiter and would eat it.
    .replace(/\\([&%#_])/g, "$1")
    // These models write markdown headings into a maths trace. The asterisks
    // are formatting the page has no renderer for, so they come out as the
    // words they were wrapping; a lone `**` is left alone in case it is an
    // exponent the model actually wrote.
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\\cdot/g, "·")
    .replace(/\\times/g, "×")
    .replace(/\\div/g, "÷")
    .replace(/\\leq?\b/g, "≤")
    .replace(/\\geq?\b/g, "≥")
    .replace(/\\neq\b/g, "≠")
    .replace(/\\pm\b/g, "±")
    .replace(/\\[[\]()]/g, "")
    .replace(/\$+/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .trim();
}

/** Percentage points, from a fraction. */
export const pct = (fraction: number, decimals = 0): string =>
  `${(fraction * 100).toFixed(decimals)}%`;
