# Page 13 polish — abstraction over retelling, round three

Four changes, reviewed before implementation. Theme of the round: the page
still had two pockets of literature retelling (the four-sentence fidelity
note, the medal-and-percentile ablation story) and one margin note that broke
the pages 2/3 pattern and ended on a sentence that parsed as nonsense.

## 1. Fidelity note → two sentences

Keep it — it is the disclosure that the chart's slope and axis are authored,
the same integrity protocol as page 3's "derived from the two Epoch trends"
and page 11's "authored illustrative curves" — but halve it; the h2 badge
("authored redrawing · anchors verbatim") already carries part of the load.

Replacement, verbatim:

> OpenAI published both charts with the compute axis unlabeled — a log scale
> in undisclosed, relative units — so the ×1–×100 span and the
> +29.5-per-decade slope are this redrawing's; the dashed GPT-4o line and the
> o1 dot are verbatim. The slope is the claim; the absolute compute is a
> secret.

The final sentence survives on purpose: it is itself an abstraction (labs
publish shapes, not units), and the test suite pins it.

## 2. Ablation → one paragraph, in the deck's own vocabulary

The medals, percentiles, and the 74.4% → 96.7% pair go — that was the
paper's story, not an abstraction, and benchmark numbers have a home on page
15 (The Scoreboard). The lesson gets restated with parts the reader already
owns: o1-ioi is Act 2's toolbox bolted on by hand at the frontier; o3 is the
two knobs turned further; the knobs won.

Replacement, verbatim (one paragraph, keeps the single verbatim quote as the
citation anchor):

> OpenAI ran the ablation itself: take o1 and bolt on hand-engineered,
> contest-specific strategies — Act 2's move, done by hand at the frontier —
> or just turn the two knobs further. The knob-turning branch, an early o3,
> beat the hand-built specialist on its own contest, no tricks attached.
> Their conclusion, verbatim: scaling "general-purpose reinforcement
> learning, rather than relying on domain-specific techniques, offers a
> robust path toward state-of-the-art AI."

Consequences: reference 3 (o3 preview via ARC Prize) leaves the page —
the ablation is all El-Kishky — so REF renumbers to
{ announce: 1, competitive: 2, systemCard: 3 } and `curves.o3Preview` (`Q`)
is no longer read by the page. frontier.test.ts keeps pinning the o3 data
file (already reworded as data-file pins); Page13.test.tsx drops the
96.7-appears-once assertion in favour of no-benchmark-numbers-at-all.

## 3. Section 3 retitled as the question both halves answer

"One recipe, no domain tricks" read as an appendix because section 3's title
("The toolbox becomes a second storey") only described the waterfall. The
two halves actually form one argument once the title asks the question:

- **New h2: "3. Stack the toolbox, or turn the knobs?"**
- First half (the waterfall, unchanged): stacking still pays — +8.9 voting,
  +9.7 re-ranking on top of the learned chain.
- Second half (the h3 "One recipe, no domain tricks" + the paragraph above):
  the verdict — stacking pays once, turning the knobs compounds.
- The waterfall's intro sentence gains a clause framing it as the first
  answer; the h3 keeps its badge (El-Kishky et al. 2025 · IOI 2024).

No fifth section: a one-paragraph numbered section would be thinner than
anything in the deck, and the contrast is the insight.

## 4. "Try it" note → pages 2/3 grammar; kill the nonsense sentence

House pattern (page 2, verbatim): a margin "Try it" is ONE imperative
sentence — "Slide the training cutoff to move the model's memory back and
forth in time." No second interpretive paragraph. Page 13's current note is
an instruction plus a two-sentence lecture ending in "neither knob can spend
the other's decades", which does not parse.

What that sentence was trying to say: per decade the knobs pay the same
+29.5, but they do not substitute — thinking moves you along your curve and
can never lift you to the next one, so maxing thinking on an untrained run
only reaches where the trained run starts.

Fix in two moves:

- **The note becomes instruction-only** (one sentence, page-2 shape):

  > Drag training to ×1 and push thinking to ×100: all that thinking lands
  > exactly where the full run starts.

- **The interpretation moves into the card's closing paragraph**, replacing
  the vague "the knobs compound, they do not substitute" clause with the
  concrete image:

  > **Thinking slides you along the curve; only training lifts it.** The two
  > dials pay the same +29.5 per decade, but they do not substitute —
  > thinking walks your curve and never climbs to the next one, and the
  > climb is paid for in a currency page 3's wall does not price: chains the
  > model writes itself, not the finite stock of human text.

## Test updates

- Fidelity: keep the "slope is the claim" pin; drop the removed sentences.
- Ablation: assert the toolbox-vs-knobs paragraph and the verbatim quote;
  assert no 96.7 / 74.4 pair and no ARC Prize link on the page; preprint
  count drops 4 → 3.
- Section title: "Stack the toolbox, or turn the knobs?" replaces "The
  toolbox becomes a second storey" in the order test and heading assertions.
- Try it: assert the note is the single instruction sentence; assert the
  "walks your curve and never climbs" clause lives in the card.
