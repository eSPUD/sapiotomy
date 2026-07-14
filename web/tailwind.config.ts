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
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
