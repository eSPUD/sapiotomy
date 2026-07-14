import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { semanticHues, tokens } from "./tokens";

const HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

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
