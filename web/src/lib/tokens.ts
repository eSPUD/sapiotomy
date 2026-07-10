/**
 * Design tokens — the SINGLE source of truth for the shared colour grammar.
 *
 * The three semantic hues (Mayer signalling: used identically on every page):
 *   - compute  : the "compute / energy / thinking-budget" hue
 *   - correct  : the "correct / accuracy" hue
 *   - wrong    : the "wrong" hue
 *
 * Components must reference these tokens (via Tailwind classes generated from
 * this file), never raw hex. A unit test enforces "no raw hex in components".
 */
export const tokens = {
  // Canvas / structural
  canvas: "#0b0f19",
  surface: "#141a2a",
  surfaceRaised: "#1c2440",
  grid: "#243049",
  ink: "#e6eaf2",
  inkMuted: "#9aa4bf",

  // The three semantic hues
  compute: "#f5a623",
  correct: "#33d69f",
  wrong: "#ff5c72",
} as const;

/** The three semantic hues that carry meaning across every page. */
export const semanticHues = {
  compute: tokens.compute,
  correct: tokens.correct,
  wrong: tokens.wrong,
} as const;

export type TokenName = keyof typeof tokens;
