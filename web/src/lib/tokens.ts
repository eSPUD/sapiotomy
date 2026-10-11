/**
 * Design tokens — the SINGLE source of truth for the shared colour grammar.
 *
 * The app is set as a **manuscript**: espresso ink on warm cream paper, with
 * latte and kraft stock for panels and rules, and Anthropic's clay ("book
 * cloth") as the one accent. Source Serif 4 stays the only typeface. The
 * palette borrows from coffee (espresso, mocha, latte, crema) and from
 * Anthropic's brand neutrals (ivory, manilla, kraft) and accent (clay).
 *
 * The semantic keys keep the app's existing names so every component keeps
 * working:
 *   - compute  : the "thinking / interactive" hue      → Anthropic clay, roasted dark
 *   - wrong    : the "wrong / alarm" hue                → a deep plum (wine)
 *   - correct  : the "correct / accuracy" hue           → a moss green
 *
 * The three sit far apart on the wheel (clay ~16°, moss ~97°, plum ~316°), and
 * the accessibility rule pairs colour with a label/shape everywhere, so none
 * carries meaning by hue alone.
 *
 * Text uses the deep steps (AA on the paper ground and on the pale /15–/20
 * tints); fills use the same steps with paper text. Components reference these
 * via Tailwind classes, never raw hex (a unit test enforces "no raw hex in
 * components").
 */
export const tokens = {
  // Ground / structural (the page is cream manuscript paper)
  canvas: "#f5f0e8", // paper: warm ivory, a shade off Anthropic's ivory
  surface: "#ece4d6", // latte foam: panels and cards
  surfaceRaised: "#e7ddcc", // manilla: a raised panel on a panel
  grid: "#d6c9b4", // kraft hairline rules / gridlines
  quote: "#efe4cf", // crema stock for pull quotes (ink and ink-muted stay AA on it)
  ink: "#2b1d14", // espresso (14.4:1 on canvas)
  inkMuted: "#4f3e33", // mocha: muted text (9.0:1 on canvas; AA on colored tints too)
  inkFaint: "#6e5d53", // milky coffee: secondary chrome (5.5:1 on canvas, 5.0:1 on surface)

  // The semantic hues: deep enough that text passes AA on the canvas and on
  // the pale /15–/20 tinted pills (compute 5.0:1 on its own 20% tint).
  compute: "#863d1f", // roasted clay (6.9:1 on canvas)
  correct: "#3d5c2a", // moss (6.7:1 on canvas)
  wrong: "#6e2a5c", // plum (8.6:1 on canvas)

  // Brighter siblings for chart lines, which have to carry across a wide plot
  // rather than sit inside a word. Each still clears 4.5:1 on the paper ground
  // (compute 4.85, wrong 5.54, correct 5.11), so a readout may reuse the hue as
  // text and stay AA. Measured in tokens.test.ts.
  computeBright: "#a5512d",
  wrongBright: "#94427e",
  correctBright: "#46702f",

  // A four-step sequential ramp in clay, light to dark, for a magnitude (page
  // 3's model-size bins). One hue, lightness falling every step, and the light
  // end still clears 2:1 on the surface (2.27). Measured in tokens.test.ts.
  size1: "#c98a6a",
  size2: "#ad6844",
  size3: "#863d1f",
  size4: "#5a2712",
} as const;

/** The three semantic hues that carry meaning across every page. */
export const semanticHues = {
  compute: tokens.compute,
  correct: tokens.correct,
  wrong: tokens.wrong,
} as const;

export type TokenName = keyof typeof tokens;
