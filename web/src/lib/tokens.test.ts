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

  it("the bright chart hues stay AA against the paper ground", () => {
    // Chart lines are drawn in these, and the readouts beside them reuse the
    // same hue as text, so 4.5:1 is the bar to hold, not the 3:1 graphics floor.
    for (const hue of [tokens.computeBright, tokens.wrongBright, tokens.correctBright]) {
      expect(hue).toMatch(HEX);
      expect(contrast(hue, tokens.canvas)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("each bright hue is brighter than the ink-weight one it stands in for", () => {
    expect(relativeLuminance(tokens.computeBright)).toBeGreaterThan(
      relativeLuminance(tokens.compute),
    );
    expect(relativeLuminance(tokens.wrongBright)).toBeGreaterThan(relativeLuminance(tokens.wrong));
    expect(relativeLuminance(tokens.correctBright)).toBeGreaterThan(
      relativeLuminance(tokens.correct),
    );
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
