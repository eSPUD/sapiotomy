/**
 * Design tokens — the SINGLE source of truth for the shared colour grammar.
 *
 * The app wears **Anthropic's brand palette**: slate-dark text (#141413) on
 * ivory (#faf9f5), light-gray panels (#f0eee6, #e8e6dc), and the three brand
 * accents (orange #d97757, green #788c5d, blue #6a9bcc) for meaning. Source
 * Serif 4 stays the only typeface.
 *
 * The brand accents are light (orange 2.96:1, blue 2.78:1, green 3.49:1 on
 * ivory), too pale for text, so each semantic hue is a deeper step of its
 * accent, dark enough to pass AA:
 *   - compute  : the "thinking / interactive" hue      → brand orange, deepened
 *   - correct  : the "correct / accuracy" hue           → brand green, deepened
 *   - wrong    : the "wrong / alarm" hue                → brand blue, deepened
 *
 * Orange against blue is the colour-blind-safe pair, and the accessibility rule
 * pairs colour with a label/shape everywhere, so none carries meaning by hue
 * alone.
 *
 * Text uses the deep steps (AA on the ivory ground and on the pale /15–/20
 * tints); fills use the same steps with ivory text. Components reference these
 * via Tailwind classes, never raw hex (a unit test enforces "no raw hex in
 * components").
 */
export const tokens = {
  // Ground / structural (Anthropic's ivory and light grays)
  canvas: "#faf9f5", // brand light (ivory)
  surface: "#f0eee6", // panels and cards
  surfaceRaised: "#e8e6dc", // brand light gray: a raised panel on a panel
  grid: "#dad7cc", // hairline rules / gridlines
  quote: "#f5f0e6", // warm stock for pull quotes (ink and ink-muted stay AA on it)
  ink: "#141413", // brand dark (17.5:1 on canvas)
  inkMuted: "#3d3d3a", // slate: muted text (10.3:1 on canvas; AA on colored tints too)
  inkFaint: "#63625b", // secondary chrome (5.8:1 on canvas, 5.3:1 on surface)

  // The semantic hues: deep enough that text passes AA on the canvas and on
  // the pale /15–/20 tinted pills (compute 4.86:1 on its own 20% tint).
  compute: "#953f22", // brand orange, deepened (6.6:1 on canvas)
  correct: "#4f6136", // brand green, deepened (6.4:1 on canvas)
  wrong: "#2f5d8a", // brand blue, deepened (6.5:1 on canvas)

  // Brighter siblings for chart lines, which have to carry across a wide plot
  // rather than sit inside a word. Each still clears 4.5:1 on the ivory ground
  // (compute 4.66, wrong 4.78, correct 5.05), so a readout may reuse the hue as
  // text and stay AA. Measured in tokens.test.ts.
  computeBright: "#b4552f",
  wrongBright: "#3f72a6",
  correctBright: "#5d7240",

  // A four-step sequential ramp in the brand orange, light to dark, for a
  // magnitude (page 3's model-size bins). One hue, lightness falling every
  // step, and the light end still clears 2:1 on the surface (2.33). Measured in
  // tokens.test.ts.
  size1: "#d68b69",
  size2: "#c46a43",
  size3: "#953f22",
  size4: "#62260f",
} as const;

/** The three semantic hues that carry meaning across every page. */
export const semanticHues = {
  compute: tokens.compute,
  correct: tokens.correct,
  wrong: tokens.wrong,
} as const;

export type TokenName = keyof typeof tokens;
