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
 * The macros that wrap an argument in braces. Each pass resolves the innermost
 * level, because the brace class cannot match across a nested pair; `tidyMath`
 * runs them to a fixed point so `\boxed{\frac{3\sqrt{3}}{4}}` comes out as
 * `3√3/4` rather than as most of itself.
 *
 * The font-selection group is here rather than in `SYMBOLS` for the same
 * reason: `\text{ and }` has to give up its braces along with its name, or the
 * page prints the punctuation of a macro it has already stripped.
 */
const unwrapOnce = (s: string): string =>
  s
    .replace(/\\(?:boxed|text|textbf|textit|mathbf|mathrm|mathit|operatorname|mathop)\{([^{}]*)\}/g, "$1")
    .replace(/\\[dt]?frac\{([^{}]*)\}\{([^{}]*)\}/g, (_, a: string, b: string) =>
      `${group(a)}/${group(b)}`,
    )
    .replace(/\\sqrt\{([^{}]*)\}/g, (_, a: string) => `√${group(a)}`);

/** More levels than any trace in the deck carries, and a guard against a cycle. */
const MAX_NESTING = 8;

/**
 * Every argument-free macro the deck's traces actually contain, resolved
 * through ONE table rather than through a chain of ordered replacements.
 *
 * The chain had a standing hazard, and it bit once already: `\pm` is a prefix
 * of `\pmod`, so running the shorter rule first turned a modulus into "±od",
 * and every macro added afterwards was another chance to reintroduce that bug.
 * Matching `\` plus a maximal run of letters and then looking the name up
 * removes the ordering question altogether, and it keeps the promise this
 * module is built on: a name that is not in the table is not a name we know, so
 * it goes to the page exactly as the model wrote it.
 *
 * `\pmod` still needs its own rule below, because it takes an argument.
 */
const SYMBOLS: Record<string, string> = {
  // spacing and delimiters, which are typesetting rather than content
  left: " ",
  right: " ",
  quad: " ",
  qquad: " ",
  displaystyle: "",
  // relations
  equiv: "≡",
  approx: "≈",
  neq: "≠",
  ne: "≠",
  leq: "≤",
  le: "≤",
  geq: "≥",
  ge: "≥",
  ll: "≪",
  gg: "≫",
  implies: "⇒",
  Rightarrow: "⇒",
  Leftarrow: "⇐",
  iff: "⇔",
  Leftrightarrow: "⇔",
  to: "→",
  rightarrow: "→",
  mapsto: "↦",
  in: "∈",
  notin: "∉",
  subset: "⊂",
  subseteq: "⊆",
  cup: "∪",
  cap: "∩",
  emptyset: "∅",
  // operators
  cdot: "·",
  cdotp: "·",
  times: "×",
  div: "÷",
  pm: "±",
  mp: "∓",
  sum: "∑",
  prod: "∏",
  int: "∫",
  infty: "∞",
  // geometry, which MATH-500's prealgebra and geometry items lean on hard
  angle: "∠",
  triangle: "△",
  circ: "∘",
  degree: "°",
  parallel: "∥",
  perp: "⊥",
  prime: "′",
  // ellipses
  ldots: "…",
  cdots: "…",
  dots: "…",
  vdots: "⋮",
  // Greek. The page's own reason for this table: a reader who has done calculus
  // and met λ as a Lagrange multiplier still cannot read "\lambda" on a screen,
  // and MATH-500 writes it 156 times in page 6's bundled traces alone.
  alpha: "α",
  beta: "β",
  gamma: "γ",
  delta: "δ",
  epsilon: "ε",
  varepsilon: "ε",
  zeta: "ζ",
  eta: "η",
  theta: "θ",
  vartheta: "ϑ",
  iota: "ι",
  kappa: "κ",
  lambda: "λ",
  mu: "μ",
  nu: "ν",
  xi: "ξ",
  pi: "π",
  rho: "ρ",
  sigma: "σ",
  tau: "τ",
  upsilon: "υ",
  phi: "φ",
  varphi: "φ",
  chi: "χ",
  psi: "ψ",
  omega: "ω",
  Gamma: "Γ",
  Delta: "Δ",
  Theta: "Θ",
  Lambda: "Λ",
  Xi: "Ξ",
  Pi: "Π",
  Sigma: "Σ",
  Phi: "Φ",
  Psi: "Ψ",
  Omega: "Ω",
};

/**
 * Named functions, which are their own rendering: `\gcd(a,b)` is set upright in
 * LaTeX and reads as "gcd(a,b)" anywhere else. Kept apart from `SYMBOLS` only
 * because the value is always the name, so listing them twice would be a place
 * for a typo to hide.
 */
const FUNCTIONS = new Set([
  "gcd", "lcm", "min", "max", "sin", "cos", "tan", "sec", "csc", "cot",
  "arcsin", "arccos", "arctan", "sinh", "cosh", "tanh",
  "log", "ln", "exp", "deg", "det", "dim", "lim", "sup", "inf", "mod",
]);

/** Digits as they are set above and below the line, for `t^4` and `x_1`. */
const SUPERS = "⁰¹²³⁴⁵⁶⁷⁸⁹";
const SUBS = "₀₁₂₃₄₅₆₇₈₉";
const raise = (digits: string, glyphs: string) =>
  [...digits].map((d) => (d === "-" ? "⁻" : glyphs[Number(d)])).join("");

export function tidyMath(text: string): string {
  let out = text.replace(/\\displaystyle\s*/g, "");
  for (let i = 0; i < MAX_NESTING; i++) {
    const next = unwrapOnce(out);
    if (next === out) break;
    out = next;
  }
  return (
    out
      // The thin-space macros, which are punctuation-named and so cannot go in
      // a table keyed by letters.
      .replace(/\\[,!;:]/g, " ")
      // Escaped punctuation is the character itself. `\$` stays out of this: a
      // rule below strips `$` as a maths delimiter and would eat it.
      .replace(/\\([&%#_{}])/g, "$1")
      // These models write markdown headings into a maths trace. The asterisks
      // are formatting the page has no renderer for, so they come out as the
      // words they were wrapping; a lone `**` is left alone in case it is an
      // exponent the model actually wrote.
      .replace(/\*\*(.+?)\*\*/g, "$1")
      // Argument-taking macros, ahead of the table: `\pmod` is not `\pm`, and
      // a degree is a superscript circle rather than a composition operator.
      .replace(/\\pmod\{([^{}]*)\}/g, " (mod $1)")
      .replace(/\\pmod\s+(\w+)/g, " (mod $1)")
      .replace(/\\[bd]mod\b/g, " mod ")
      .replace(/\^\{?\\circ\}?/g, "°")
      .replace(/\^\{?\\prime\}?/g, "′")
      // Everything argument-free, in one pass. An unknown name is returned
      // untouched, which is this module's whole contract.
      .replace(/\\([A-Za-z]+)/g, (whole, name: string) => {
        if (name in SYMBOLS) return SYMBOLS[name];
        return FUNCTIONS.has(name) ? name : whole;
      })
      // Exponents and indices, once no macro can be hiding in one. Only runs of
      // digits: `x^{2n}` is an expression, and flattening it would change what
      // it says rather than how it looks. A negative exponent (`7^{-1}`) is still
      // only digits, so it is raised too.
      .replace(/\^\{(-?\d+)\}/g, (_, d: string) => raise(d, SUPERS))
      .replace(/\^(\d)/g, (_, d: string) => raise(d, SUPERS))
      .replace(/_\{(\d+)\}/g, (_, d: string) => raise(d, SUBS))
      .replace(/_(\d)/g, (_, d: string) => raise(d, SUBS))
      // Display maths is a block and gets its own line; MATH-500 runs the
      // sentence straight on from the closing delimiter ("...x(1 - x).\]Find
      // the values"), so dropping it outright welds two sentences together.
      // Inline maths is inside a sentence and takes no break.
      .replace(/\\[[\]]/g, "\n")
      .replace(/\\[()]/g, "")
      .replace(/ +([,.;:])/g, "$1")
      // `\angle BAD` carries a space that was doing the macro's job of ending
      // its own name; printed, it separates the symbol from what it modifies.
      .replace(/([∠△]) +(?=[A-Za-z(])/g, "$1")
      // `~` is LaTeX's non-breaking space, not a character the reader should see.
      .replace(/~/g, " ")
      .replace(/\$+/g, "")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .split("\n")
      .map((line) => line.trim())
      .join("\n")
      .trim()
  );
}

/** Percentage points, from a fraction. */
export const pct = (fraction: number, decimals = 0): string =>
  `${(fraction * 100).toFixed(decimals)}%`;
