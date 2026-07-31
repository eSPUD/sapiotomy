# Page 16 simplification pass — one idea, said once

Page 16 is correct and overbuilt. Rough rendered word counts of its neighbours:
page 15 ~810, page 17 ~890, **page 16 ~1,150**. It is the wordiest page in the
act, and the extra words are not extra ideas: the page states one thesis three
times, prints the same four dollar figures in two figures, and hangs seven
reactive surfaces off two sliders.

Nothing below changes a claim, a citation, or a line of `lib/frontier.ts`.

## What this round must not do

- **Do not cut the ARC-AGI anchor.** Page 15 defers to this page by name
  ([Page15.tsx:57](web/src/components/pages/Page15.tsx:57)) and pins the deferral
  in its own test. The o3 bill is page 16's reason to exist.
- **Do not cut or simplify the dial's arithmetic.** The rent/sample/distill
  comparison is the payoff and it is pinned in `act3.test.ts`. Every cut below is
  to the *presentation* around it.
- **Do not drop the authored-parameter disclosure.** The climb (+12 pts per 10×
  from 60%, ceiling 90%) is authored, not published. It gets shorter, not gone.
- **Do not add a section or a fourth figure.**

---

## The spine: say the thesis once

The page's one sentence is *each next point of accuracy costs exponentially
more, so past some point you stop buying thinking and buy a smaller model
instead*. It is currently stated three times:

| Where | Words |
| --- | --- |
| Intro lede, bolded | "coverage grows with the logarithm of the samples, so each next point costs exponentially more" |
| Step 2 figcaption, bolded | "Exponential spend, linear gains, hard ceiling" |
| Step 3 figcaption | "the log-linear tax compounds ~10× per 12 points" |

**Give it one home: step 2**, where Brown and Stroebl are cited and where it is
therefore *earned* rather than asserted. The intro poses it as a question, and
step 3 lets the reader discover it on the dials instead of being told again.

### 0. Em dash sweep (house rule, and it does real work here)

14 em dashes and 1 en dash in rendered copy. Beyond the standing ban, each one
here is a stacked clause that should be a full stop, so the sweep is itself a
compression pass. The en dash is `$2–5 plausible floor`, which must become
`$2 to $5` and which a pinned test currently matches verbatim (see Tests).

---

# Section 1 — two figures encoding the same four numbers

The three stat cards and the `CostStrip` both carry o3-low, o3-high and the
human anchor in dollars. Only *accuracy* is unique to the cards. So the page
spends a three-column grid to add two percentages to a figure that is already on
screen.

## 1. Fold the cards into the strip

Put accuracy on the strip's dot labels, and add the connecting arrow the strip
is currently missing:

```
o3 low  ● 75.7% · ~$20        ──172× the compute, +11.8 points──▶   ● 87.5% · ~$3,460
        [ humans: $2 to $5 floor · $17 measured ]
        estimated $ per task · log scale, $1 to $10,000
```

The strip stops being a decorative rule under the cards and becomes the
section's argument: the distance *is* the 172×, and the arrow shows the movement
(the deck's own preference over lines-with-dots). Update the `aria-label` to
carry both accuracies.

Net: one grid, three cards, ~45 words out. Nothing is lost.

## 2. Figcaption to one sentence

Current caption restates the two dollar figures the strip just showed, then
quotes ARC Prize's framing, then names diminishing returns. Keep only the last
move:

> The first 75.7% cost about $20 a task. The last 11.8 points cost 172× the
> compute. That is diminishing returns as an invoice.

The `$10k contest budget` / "quite expensive" quote moves into the ARC Prize
`RefItem`, where the citation already lives.

## 3. One provenance line, not two

The h2 badge already says "reported estimates · not peer-reviewed". The 60-word
fine-print paragraph below the caption says it a third time. Compress to:

> Firm: the sample counts and the 172×. Soft: every dollar here, since OpenAI
> never published o3 pricing and ARC Prize later revised these upward, toward
> ~$30,000 a high-compute task.

~60 words to ~30, and it reads as a fidelity note rather than a hedge.

---

# Section 2 — the right size is much smaller

This section carries one fact and 135 words. The two-bar chart stays: the
near-invisible R1 bar next to o1's full-width one is genuine intuition, not
number-regurgitation. Everything around it shrinks.

## 4. One sentence above, one below

**Above:** delete the second sentence ("The meter that step 1 ran on can drop by
an order of magnitude in a season") — the bars say it.

**Below the bars:** delete the input-price line entirely. It exists to say the
input gap is "the same ~27× gap", which is the definition of adding nothing.

**Figcaption:** this is the thesis's one home, so it stays, at three clauses:

> A price cut moves the bill *down*, not the curve's *shape*. Coverage still
> grows log-linearly, ten times the samples per fixed gain, and an imperfect
> verifier still caps what sampling can reach. **Exponential spend, linear
> gains, hard ceiling.**

Net: ~135 words to ~65, both citations kept in place beside the figure.

---

# Section 3 — two inputs, seven outputs

Two sliders currently drive: three stat cards, a conditional ceiling warning, a
verdict banner, a chart, a 135-word figcaption, and a 75-word fine print. The
reader cannot tell which of those they are supposed to read after a drag.

**Target: two sliders, three cards, one verdict, one chart, two short lines.**

## 5. Delete the ceiling warning block

It fires only when `cost.sample === null`, which is exactly when the "rent small"
card already reads *"no number of samples reaches 92%"*. Two blocks, one fact.
Move the *why* into the verdict body for that branch:

> the selector cannot tell the best sample from a plausible wrong one often
> enough, so resampling stops helping at any budget.

## 6. Cut the figcaption's regime lecture

The verdict banner already names the winner live and says why, in the reader's
own chosen configuration. The caption then re-explains both regimes in the
abstract. That is the page answering a question the dials exist to let the
reader answer.

- **Keep** the one thing the chart cannot show: *"Every extra sample is also
  latency: the meter runs in seconds as well as dollars."*
- **Move** Snell's 14× substitution result into the "rent small" card's sub-line,
  where it explains the number the reader is looking at, with `Cite` attached.
- **Delete** the rest, including the `crossover !== null` ternary — the chart
  already prints "pays off at 1.5M" on the crossover dot.

Net: ~135 words to ~20, and one branchy ternary out of the JSX.

## 7. Setup paragraph to three sentences

One 65-word sentence currently defines all three strategies inside itself. Break
it so each strategy is one clause the reader can hold:

> You serve a stream of hard queries. Three ways to hit your target accuracy on
> each: **rent** a frontier model, one call. **Sample** the cheap model N times
> and keep the best. Or **retrain**: pay one distillation bill, then serve from
> the cheap model forever.

## 8. Fine print to two lines

Keep the pricing assumption and the authored climb; drop the restatement of what
Brown and Stroebl contribute, which section 2 now owns.

## 9. Margin note back to one imperative

Current note is two sentences plus interpretation ("renting wins early, owning
wins late"), which the verdict banner already delivers live. House grammar is
one imperative sentence:

> Hold 72% and push the volume slider to the end.

---

# Page level

## 10. Delete the trailing provenance footnote

It is the third statement of the same disclosure, and newer pages carry no
Simulated/Cited footer at all: provenance goes inline via h2 badges, captions,
and the compressed fidelity notes above. ~45 words out.

## 11. Add the missing transition

Page 15 hands off with *"Next: the bill. Turn the page."* Page 16 hands off to
nothing at all — it ends on a footnote. Add the house closer (`border-l-4`,
italic final sentence naming the next page's subject):

> The invoice assumes the thinking works. *Next: what happens when a model
> spends more and comes out wrong.*

This is the one **addition** in the plan, and it is shorter than the footnote it
replaces.

## 12. Dead code

`BENDER`, `STROEBL`, the `Citation` import, and the unused `arc` / `brown` /
`nature` curve bindings are all declared and never read.

## 13. Header docstring, 35 lines to ~12

Steps 1 and 2 are each described at paragraph length above code that says the
same thing. Keep: the three-step shape, the "dollars are estimate-dependent"
warning, and the authored-parameters note (those are non-obvious). Cut the rest.

---

## Expected result

~1,150 rendered words to ~700, in line with pages 15 and 17. Removed: one stat
grid, one warning block, one footnote, ~40 lines of JSX. Added: one transition
block. No claim, citation, or computed number changes.

---

## Tests

`Page16.test.tsx` pins several strings this plan moves. Retarget, do not weaken:

| Assertion | Why it breaks | New target |
| --- | --- | --- |
| `/per task measured · \$2–5 plausible floor/` | card deleted; also contains the banned en dash | strip label, `$2 to $5` |
| `/sits past the verifier's ceiling \(90%\)/` | warning block deleted | verdict body, same branch |
| `/OpenAI never published o3 pricing/` | compressed | survives verbatim in item 3's line |
| `getByText("75.7%")` / `("87.5%")` | cards deleted | strip dot labels |

**Add** page 13's guard: no em dash or en dash in rendered copy.

**Add** a transition assertion, matching pages 12 and 15.

**Unchanged:** every dial/verdict assertion, since the arithmetic is untouched.
That is the regression check for this whole pass.

---

## Open questions for the author

1. **Does section 2 survive as its own numbered step?** After item 4 it is one
   sentence, two bars, one caption. It could instead become the opening beat of
   section 3, which would take the page from three steps to two. I have kept it
   separate because it is where the thesis lives and burying the thesis in a
   calculator's setup weakens it, but this is the biggest remaining cut on the
   table.
2. **Human anchor: strip label or surviving card?** Item 1 folds it into the
   strip. If the $17-measured / $2-to-$5-floor contrast is meant to land as its
   own beat, one card survives instead and only the two o3 cards go.
