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

  it("leaves no raw macro in the specimen the page actually renders", () => {
    // The bug that prompted this file: the question rendered as
    // "14u \equiv 46 \pmod{100}~?" on the page.
    const shown = tidyMath(PAGE7.figure1.specimen.question);
    expect(shown).not.toMatch(/\\[a-zA-Z]+/);
    expect(shown).not.toContain("~");
  });
});
