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
        ink: tokens.ink,
        "ink-muted": tokens.inkMuted,
        // The three semantic hues
        compute: tokens.compute,
        correct: tokens.correct,
        wrong: tokens.wrong,
      },
      fontFamily: {
        // Broadsheet: "the serif is the chrome" — Source Serif 4 for heading
        // AND body; numeric/mono contexts stay in the serif with tabular-nums.
        sans: ["var(--font-serif)", "Source Serif 4", "Georgia", "serif"],
        serif: ["var(--font-serif)", "Source Serif 4", "Georgia", "serif"],
        mono: ["var(--font-serif)", "Source Serif 4", "Georgia", "serif"],
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
