import type { Config } from "tailwindcss";
import { tokens } from "./src/lib/tokens";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: tokens.canvas,
        surface: tokens.surface,
        "surface-raised": tokens.surfaceRaised,
        grid: tokens.grid,
        quote: tokens.quote,
        "compute-bright": tokens.computeBright,
        "wrong-bright": tokens.wrongBright,
        "correct-bright": tokens.correctBright,
        // Sequential cyan ramp for a magnitude, light (1) to dark (4).
        "size-1": tokens.size1,
        "size-2": tokens.size2,
        "size-3": tokens.size3,
        "size-4": tokens.size4,
        ink: tokens.ink,
        "ink-muted": tokens.inkMuted,
        "ink-faint": tokens.inkFaint,
        // The three semantic hues (fills, marks, borders) and their text steps
        compute: tokens.compute,
        correct: tokens.correct,
        wrong: tokens.wrong,
        "compute-ink": tokens.computeInk,
        "correct-ink": tokens.correctInk,
        "wrong-ink": tokens.wrongInk,
        // A fourth hue, dark, for a comparison's baseline (page 5); see tokens.ts.
        crimson: tokens.crimson,
        "crimson-ink": tokens.crimsonInk,
      },
      fontFamily: {
        // Broadsheet: "the serif is the chrome" — Source Serif 4 for heading
        // AND body; numeric/mono contexts stay in the serif with tabular-nums.
        sans: ["var(--font-serif)", "Source Serif 4", "Georgia", "serif"],
        serif: ["var(--font-serif)", "Source Serif 4", "Georgia", "serif"],
        mono: ["var(--font-serif)", "Source Serif 4", "Georgia", "serif"],
        // The one licensed exception to the broadsheet rule: actual code
        // listings (a newspaper sets code samples in mono too). Use font-code
        // for pseudocode/diff listings only, never for numerals or labels.
        code: ["var(--font-eyebrow)", "IBM Plex Mono", "ui-monospace", "Menlo", "monospace"],
        // Style guide: headings in an editorial serif (Lora), and eyebrows /
        // metadata in an uppercase mono (IBM Plex Mono, for Anthropic Mono).
        heading: ["var(--font-heading)", "Lora", "Georgia", "serif"],
        eyebrow: ["var(--font-eyebrow)", "IBM Plex Mono", "ui-monospace", "Menlo", "monospace"],
      },
      borderRadius: {
        // Broadsheet print-crisp radii (--radius-sm/md/lg = 1/2/4px)
        none: "0",
        sm: "1px",
        DEFAULT: "2px",
        md: "2px",
        lg: "4px",
        xl: "4px",
        "2xl": "4px",
        full: "9999px",
      },
      boxShadow: {
        sm: "0 1px 2px color-mix(in srgb, #2d2b2b 14%, transparent)",
        DEFAULT: "0 3px 10px color-mix(in srgb, #2d2b2b 16%, transparent)",
        md: "0 3px 10px color-mix(in srgb, #2d2b2b 16%, transparent)",
        lg: "0 12px 32px color-mix(in srgb, #2d2b2b 22%, transparent)",
      },
    },
  },
  plugins: [],
};

export default config;
