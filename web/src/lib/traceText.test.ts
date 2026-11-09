import { describe, expect, it } from "vitest";
import { tidyMath } from "./traceText";
import { PAGE7 } from "./page07";

/**
 * `tidyMath` is display-only: it changes how a trace LOOKS and never what it
 * says. These cases are the ones MATH-500 actually produces, caught by reading
 * page 7's specimen on a rendered page rather than in a terminal.
 */
describe("tidyMath on the LaTeX MATH-500 really writes", () => {
  it("renders a congruence rather than leaking the macros", () => {
    expect(tidyMath("$14u \\equiv 46 \\pmod{100}~?$")).toBe("14u ≡ 46 (mod 100) ?");
  });

  it("does not let \\pmod be eaten by the \\pm rule", () => {
    // `\pm` is a prefix of `\pmod`; ordering the replacements wrongly gives "±od".
    expect(tidyMath("$x \\pmod{7}$")).not.toContain("±");
    expect(tidyMath("$a \\pm b$")).toBe("a ± b");
  });

  it("keeps the symbols the deck already relied on", () => {
    expect(tidyMath("$\\frac{1}{2}$")).toBe("1/2");
    expect(tidyMath("$\\sqrt{2}$")).toBe("√2");
    expect(tidyMath("$3 \\cdot 4 \\leq 12$")).toBe("3 · 4 ≤ 12");
  });

  it("leaves anything it does not know exactly as written", () => {
    expect(tidyMath("\\weirdmacro{x}")).toBe("\\weirdmacro{x}");
  });

  /**
   * A reader who has done calculus and met λ as a Lagrange multiplier still
   * cannot read "\lambda" off a screen, and the backslash is most of why: it
   * makes a plain constant look like an operator nobody was taught. The symbol
   * is what the model was handed, so rendering it is faithful; renaming the
   * variable would not be, and the trace beside it says `\lambda` 156 times.
   */
  it("renders the Greek a maths dataset actually writes", () => {
    expect(tidyMath("Let $\\lambda$ be a constant, $0 \\le \\lambda \\le 4$")).toBe(
      "Let λ be a constant, 0 ≤ λ ≤ 4",
    );
    expect(tidyMath("$\\alpha + \\beta = \\theta$")).toBe("α + β = θ");
    expect(tidyMath("$\\Delta$")).toBe("Δ");
  });

  // Prealgebra and geometry items are mostly these three, and 534 degrees in
  // page 6's bundled traces alone read as "^\circ" without them.
  it("renders angles and degrees", () => {
    expect(tidyMath("$\\angle BAD = 110^\\circ$")).toBe("∠BAD = 110°");
    expect(tidyMath("In $\\triangle AEF$")).toBe("In △AEF");
    expect(tidyMath("$10^{\\prime}$ by $8^{\\prime}$")).toBe("10′ by 8′");
  });

  it("sets a numeric exponent on the line it belongs on", () => {
    expect(tidyMath("$12t^4+26t^3-8t^2$")).toBe("12t⁴+26t³-8t²");
    expect(tidyMath("$x_1 + x_{12}$")).toBe("x₁ + x₁₂");
    expect(tidyMath("$7^{-1}$")).toBe("7⁻¹");
    // A subscript has no minus to raise: `x_{-1}` is left as written.
    expect(tidyMath("$x_{-1}$")).toBe("x_{-1}");
    // An exponent that is an expression stays written out: flattening it would
    // change what it says rather than how it looks.
    expect(tidyMath("$x^{2n}$")).toBe("x^{2n}");
  });

  it("keeps a named function upright and readable", () => {
    expect(tidyMath("$\\gcd(a,b)$ and $\\cos \\theta$")).toBe("gcd(a,b) and cos θ");
  });

  // A macro named after a letter can be the prefix of a longer one, which is
  // how `\pmod` once came out as "±od". The lookup is on the whole run of
  // letters, so there is no ordering to get wrong.
  it("never resolves a macro that is only the head of a longer one", () => {
    expect(tidyMath("$\\lambda$")).toBe("λ");
    expect(tidyMath("$\\Lambda$")).toBe("Λ");
    expect(tidyMath("$\\int$")).toBe("∫");
    expect(tidyMath("$\\infty$")).toBe("∞");
  });

  // MATH-500 runs the sentence straight on from a display block's closing
  // delimiter, so dropping the delimiter welds two sentences into one word.
  it("breaks the line after display maths rather than welding sentences", () => {
    expect(tidyMath("by\n\\[f(x) = \\lambda x(1 - x).\\]Find the values")).toBe(
      "by\n\nf(x) = λ x(1 - x).\nFind the values",
    );
  });

  it("leaves no raw macro in the specimen the page actually renders", () => {
    // The bug that prompted this file: the question rendered as
    // "14u \equiv 46 \pmod{100}~?" on the page.
    const shown = tidyMath(PAGE7.figure1.specimen.question);
    expect(shown).not.toMatch(/\\[a-zA-Z]+/);
    expect(shown).not.toContain("~");
  });
});
