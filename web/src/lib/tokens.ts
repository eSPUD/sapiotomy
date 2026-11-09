/**
 * Design tokens — the SINGLE source of truth for the shared colour grammar.
 *
 * The app follows **Anthropic's style guide**:
 *   - Neutrals: Slate Dark #141413 text on Ivory Light #faf9f5, Ivory Medium
 *     #f0eee6 for secondary surfaces, Cloud #cccbc8 for borders and dividers,
 *     Oat #e3dacc and Manilla #f5e3c7 for raised panels and pull quotes.
 *   - Accents: Clay #d97757 (deep #c6613f) is the signature and the interactive
 *     hue, Cactus #788c5d is "correct", Sky #6a9bcc is "wrong" (and the guide's
 *     data-visualisation accent; orange against blue is the colour-blind-safe
 *     pair).
 *
 * The one documented departure: the guide's accents are light (Clay 2.96:1,
 * Sky 2.78:1, Cactus 3.49:1 on ivory), too pale for text. So each accent has two
 * roles:
 *   - the guide colour itself (`compute`, `correct`, `wrong`) for fills, marks,
 *     borders and swatches, always with Slate Dark text on top (5.0 to 6.3:1);
 *   - an `-ink` step of the same hue for text, AA on ivory, Ivory Medium, Oat
 *     and the accent's own pale tints.
 * Muted text likewise stays a darker slate than the guide's Cloud greys, which
 * are kept for borders. Components reference these via Tailwind classes, never
 * raw hex (a unit test enforces "no raw hex in components").
 */
export const tokens = {
  // Neutrals
  canvas: "#faf9f5", // Ivory Light: the page
  surface: "#f0eee6", // Ivory Medium: secondary surfaces, panels, cards
  surfaceRaised: "#e3dacc", // Oat: a raised panel on a panel
  grid: "#cccbc8", // Cloud: borders, hairline rules, gridlines
  quote: "#f5e3c7", // Manilla: pull-quote stock (ink and ink-muted stay AA on it)
  ink: "#141413", // Slate Dark: text (17.5:1 on canvas)
  inkMuted: "#3d3d3a", // slate: muted text (10.3:1 on canvas; AA on tints and Oat)
  inkFaint: "#63625b", // secondary chrome (5.8:1 on canvas, 5.3:1 on Ivory Medium)

  // The semantic hues: the guide's accents, for fills, marks and borders.
  compute: "#d97757", // Clay
  correct: "#788c5d", // Cactus
  wrong: "#6a9bcc", // Sky

  // Their text steps: AA on canvas, Ivory Medium, Oat and their own 20% tints.
  computeInk: "#97401f", // 6.5:1 on canvas
  correctInk: "#4f6136", // 6.4:1 on canvas
  wrongInk: "#2f5d8a", // 6.5:1 on canvas

  // Line steps for chart strokes that have to carry across a wide plot: deeper
  // than the fills, at least 3:1 (the graphics floor) on canvas and Ivory Medium.
  // Measured in tokens.test.ts.
  computeBright: "#c6613f", // Clay deep, from the guide
  wrongBright: "#4f7fae",
  correctBright: "#66794d",

  // Crimson: a fourth hue, outside the style guide, for the baseline of a comparison
  // whose other arms are Sky and Clay (page 5: the problem alone, and the final answer
  // only). Deliberately DARK: a red as light as Clay would blur into it for
  // colour-blind readers, so it is told apart by lightness. Ivory text goes on it, not
  // Slate. Measured in tokens.test.ts.
  crimson: "#a83a3a",
  crimsonInk: "#8e2f2f",

  // A four-step sequential ramp in Clay, light to dark, for a magnitude (page
  // 3's model-size bins). One hue, lightness falling every step, the light end
  // clearing 2:1 on the surface. Measured in tokens.test.ts.
  size1: "#dc8a68",
  size2: "#d97757",
  size3: "#b5532f",
  size4: "#7a3418",
} as const;

/** The three semantic hues that carry meaning across every page. */
export const semanticHues = {
  compute: tokens.compute,
  correct: tokens.correct,
  wrong: tokens.wrong,
} as const;

export type TokenName = keyof typeof tokens;
