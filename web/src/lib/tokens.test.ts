import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { semanticHues, tokens } from "./tokens";

const HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

/** WCAG relative luminance of a #rrggbb colour. */
function relativeLuminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lin = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** WCAG contrast ratio between two colours. */
function contrast(a: string, b: string): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe("design tokens", () => {
  it("defines the three semantic hues as valid hex", () => {
    expect(semanticHues.compute).toMatch(HEX);
    expect(semanticHues.correct).toMatch(HEX);
    expect(semanticHues.wrong).toMatch(HEX);
  });

  it("the three hues are distinct", () => {
    const set = new Set([semanticHues.compute, semanticHues.correct, semanticHues.wrong]);
    expect(set.size).toBe(3);
  });

  it("exposes canvas + ink structural tokens", () => {
    expect(tokens.canvas).toMatch(HEX);
    expect(tokens.ink).toMatch(HEX);
  });

  it("uses the style guide's colours for the neutrals and the three accents", () => {
    expect(tokens.ink).toBe("#141413"); // Slate Dark
    expect(tokens.canvas).toBe("#faf9f5"); // Ivory Light
    expect(tokens.surface).toBe("#f0eee6"); // Ivory Medium
    expect(tokens.grid).toBe("#cccbc8"); // Cloud
    expect(tokens.compute).toBe("#d97757"); // Clay
    expect(tokens.correct).toBe("#788c5d"); // Cactus
    expect(tokens.wrong).toBe("#6a9bcc"); // Sky
    expect(tokens.computeBright).toBe("#c6613f"); // Clay deep
  });

  it("each accent's ink step is AA text on canvas, Ivory Medium, Oat and its own pale tint", () => {
    const tint = (hex: string, t: number) =>
      "#" +
      [1, 3, 5]
        .map((i) =>
          Math.round(parseInt(hex.slice(i, i + 2), 16) * t + parseInt(tokens.canvas.slice(i, i + 2), 16) * (1 - t))
            .toString(16)
            .padStart(2, "0"),
        )
        .join("");
    const pairs = [
      [tokens.computeInk, tokens.compute],
      [tokens.correctInk, tokens.correct],
      [tokens.wrongInk, tokens.wrong],
    ] as const;
    for (const [ink, fill] of pairs) {
      expect(ink).toMatch(HEX);
      for (const ground of [tokens.canvas, tokens.surface, tokens.surfaceRaised, tint(fill, 0.2)]) {
        expect(contrast(ink, ground)).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it("Slate Dark text stays AA on every accent fill", () => {
    for (const fill of [tokens.compute, tokens.correct, tokens.wrong]) {
      expect(contrast(tokens.ink, fill)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("the chart line steps clear the 3:1 graphics floor on canvas and Ivory Medium", () => {
    for (const hue of [tokens.computeBright, tokens.wrongBright, tokens.correctBright]) {
      expect(hue).toMatch(HEX);
      expect(contrast(hue, tokens.canvas)).toBeGreaterThanOrEqual(3);
      expect(contrast(hue, tokens.surface)).toBeGreaterThanOrEqual(3);
    }
  });

  it("the size ramp reads light to dark and its light end clears the surface", () => {
    const ramp = [tokens.size1, tokens.size2, tokens.size3, tokens.size4];
    for (const hue of ramp) expect(hue).toMatch(HEX);
    const lum = ramp.map(relativeLuminance);
    for (let i = 1; i < lum.length; i++) expect(lum[i]).toBeLessThan(lum[i - 1]);
    expect(contrast(tokens.size1, tokens.surface)).toBeGreaterThanOrEqual(2);
  });

  // Crimson sits beside Clay in page 5's stacked bars, so it must differ from Clay in
  // lightness, not only in hue, and carry ivory text where Clay carries Slate.
  it("crimson is told apart from Clay by lightness, carries ivory text, and its ink step is AA", () => {
    for (const hex of [tokens.crimson, tokens.crimsonInk]) expect(hex).toMatch(HEX);
    expect(contrast(tokens.crimson, tokens.compute)).toBeGreaterThanOrEqual(2);
    expect(contrast(tokens.crimson, tokens.wrong)).toBeGreaterThanOrEqual(2);
    expect(contrast(tokens.canvas, tokens.crimson)).toBeGreaterThanOrEqual(4.5);
    for (const ground of [tokens.canvas, tokens.surface, tokens.surfaceRaised]) {
      expect(contrast(tokens.crimsonInk, ground)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("each line step sits between its fill and its ink step", () => {
    const pairs = [
      [tokens.compute, tokens.computeBright, tokens.computeInk],
      [tokens.correct, tokens.correctBright, tokens.correctInk],
      [tokens.wrong, tokens.wrongBright, tokens.wrongInk],
    ] as const;
    for (const [fill, line, ink] of pairs) {
      expect(relativeLuminance(line)).toBeLessThan(relativeLuminance(fill));
      expect(relativeLuminance(line)).toBeGreaterThan(relativeLuminance(ink));
    }
  });
});

// "no raw hex in components" lint: components must reference tokens (via Tailwind
// classes), never inline hex colours. tokens.ts is the ONLY place hex may live.
function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...walk(full));
    } else if (/\.(tsx|css)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

describe("no raw hex in components (token discipline)", () => {
  it("no .tsx/.css under src/app or src/components contains a raw hex colour", () => {
    const roots = [join(process.cwd(), "src", "app"), join(process.cwd(), "src", "components")];
    const offenders: string[] = [];
    const rawHex = /#[0-9a-fA-F]{3,8}\b/g;
    for (const root of roots) {
      for (const file of walk(root)) {
        const text = readFileSync(file, "utf8");
        if (rawHex.test(text)) offenders.push(file);
      }
    }
    expect(offenders).toEqual([]);
  });
});
