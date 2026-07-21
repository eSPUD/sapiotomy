/**
 * Design tokens — the SINGLE source of truth for the shared colour grammar.
 *
 * This app adopts the **Broadsheet** design system (see the extracted design
 * system): newsprint set for the web — near-black Source Serif 4 on paper
 * white, with the process accents (cyan and magenta) used small and
 * deliberately like spot colour. Values below are taken from Broadsheet's
 * `styles.css` token sheet.
 *
 * The semantic keys keep the app's existing names so every component keeps
 * working, but their VALUES are now Broadsheet ramp steps:
 *   - compute  : the "thinking / interactive" hue      → process cyan (accent)
 *   - wrong    : the "wrong / alarm" hue                → process magenta (accent-2)
 *   - correct  : the "correct / accuracy" hue           → a deep press green*
 *
 * *Broadsheet is a two-accent (cyan+magenta) system; it offers no green. This
 *  explorable's pedagogy depends on a correct/incorrect signal, and the
 *  accessibility rule pairs colour with a label/shape everywhere, so we keep a
 *  single deep green in the same muted press register as the one documented
 *  exception. Everything else is straight Broadsheet.
 *
 * Text uses the 700 ramp steps (AA on the paper ground); fills use the same
 * steps with paper text. Components reference these via Tailwind classes, never
 * raw hex (a unit test enforces "no raw hex in components").
 */
export const tokens = {
  // Ground / structural (Broadsheet neutrals — the page is paper)
  canvas: "#f3f2f2", // --color-bg (paper)
  surface: "#eae9e9", // --color-surface
  surfaceRaised: "#eae7e7", // --color-neutral-200
  grid: "#d7d3d3", // --color-neutral-300 (hairline rules / gridlines)
  ink: "#201e1d", // --color-text (near-black)
  inkMuted: "#444141", // --color-neutral-800 (muted text; AA on colored tints too)

  // The semantic hues (700 ramp steps — AA text on the paper ground)
  // 800-step depth so text passes AA even on the pale /15–/20 tinted pills
  compute: "#004961", // --color-accent-800 (process cyan)
  correct: "#0f5129", // deep press green (documented exception; AA on tints)
  wrong: "#790e3d", // --color-accent-2-800 (process magenta)
} as const;

/** The three semantic hues that carry meaning across every page. */
export const semanticHues = {
  compute: tokens.compute,
  correct: tokens.correct,
  wrong: tokens.wrong,
} as const;

export type TokenName = keyof typeof tokens;
