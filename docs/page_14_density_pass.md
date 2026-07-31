# Page 14 density pass — low friction, high reward

Reviewed before implementation. Theme: page 14 is correct and too heavy. Every
section front-loads prose that either narrates a figure the reader is about to
see, or defers the payoff behind commentary. Nothing here changes what the page
claims; it changes how much the reader carries to get there.

## What this round must not do

- **Do not cut or hide the GRPO listing.** After main's 2026-07-30 merge, page
  13 prints no algorithm and its section 4 handoff explicitly promises page 14
  delivers "the algorithm in full". The listing is now the arc's only real
  algorithm and it is the payoff a reader turns the page for.
- **Do not add a toggle or a disclosure widget.** Page 13's header records the
  house rule: listings are static, pages 1-3 digestibility.
- **Do not lose the four things page 13 asks.** They are carried by the figures
  the reader drives, not by prose, and a previous round already cut a recap
  block for handing answers over.

---

# Section 1 — eleven blocks doing three jobs

The reader passes roughly 250 words of prose plus five lines of notation before
anything moves. The section is simultaneously delivering the promised
algorithm, bridging back to page 7, and teaching the group baseline.

## 1. Compress the commentary around the listing

The PPO paragraph spends four sentences to land one fact. Cut to one sentence,
and move it into the listing's caption so it reads as a note *on* the code
rather than a new block of body text:

> no critic network anywhere, which is what made RL at this scale affordable:
> PPO's baseline comes from a second network about as large as the policy.

The page 7 bridge stays as prose, because it carries a real idea, but loses its
last sentence. "That is page 13's exchange seen from the inside" is doing the
same work as the sentence before it.

Net: about 120 words out, nothing lost.

## 2. Fold the figure's setup into the figure

Three text blocks currently scaffold one chart:

| Block | Where it goes |
| --- | --- |
| `problem → 350 × 638 = ?` and the rule line | inside the chart frame, as its title |
| "Ask four times and the answers differ ... real slip" | delete; the slip labels under each dot already say it |
| "Sample 1 always answers 223,300. Drag the dial ..." | margin **Try it** note |

The Try-it move is also a house-rule fix in its own right: section 2 has a
margin note and section 1 has none, and page 2's grammar wants a single
imperative sentence in the margin with meaning left in the card.

Net: three blocks to zero.

## 3. The split — decide after 1 and 2, not before

What remains is lede, listing, bridge, figure, dial, reading. That may not need
a split at all. If it still reads long:

**Split at the figure, not at the listing.** Section 1 keeps lede plus listing;
a new section takes the interactive. Rationale: the interactive is the bigger
idea and deserves a headline, whereas giving the pseudocode its own numbered
section elevates the notation, which is precisely the thing that should feel
cheap and quickly passed.

**Deliberately rejected:** moving the listing below the interactive, which is
page 12's pattern ("directly under the interactive so the reader parses the
mechanism they just ran"). It is the single biggest friction cut available and
it is still the wrong call here, because page 13 now sends the reader looking
for the algorithm and burying it delays a promise the previous page just made.
Revisit only if the promise on page 13 changes.

---

# Section 2 — the prose narrates the chart before the reader sees it

Six sentences, about 110 words, all of it above the figure. Sentence 2 tells
the reader that accuracy climbs and flattens while length grows nine times,
which is exactly what the chart is about to show them. Two of the six were
added by me in an earlier round and are the worst offenders.

The rule this breaks: setup goes before a figure, meaning goes after it. All
the meaning is currently before.

## 4. Setup before, meaning after

**Above the chart, two sentences.** Pose the puzzle, do not describe the curves:

> Nothing in the recipe mentions reflection. Nothing in the reward mentions
> length. Watch both curves anyway.

**Below the chart, the meaning**, which is where the reader can check it against
what they are looking at:

> Length is not a schedule anyone set: longer, re-checking traces win more
> reward, so the model buys itself more thinking time.

**Move the one-chain point to the skeleton**, where a single unbroken trace is
on screen. It currently sits in the chart intro, three blocks before the figure
that demonstrates it.

## 5. Turn the page 11 link into axis furniture

"Read the right axis as page 11's x axis, test-time compute" is a whole
sentence spent relabelling an axis. Put it on the axis:

> avg response (tokens) · page 11's test-time compute

with the "nobody's hand on the dial" point as a short in-figure annotation next
to the existing "no term in the reward mentions length". This is the deck's own
preference, prose converted to figure furniture, and it removes the longest
sentence in the section.

---

# Section 3 — right abstraction, wrong emphasis

The numbers are already pushed to an abstraction and the dot plot is sound. Two
problems: the intro paragraph does five jobs in one breath, and the section
lands as an R1 achievement rather than as an inference-time-scaling event.

## 6. Compress the intro

One paragraph currently carries: the cold start, the scoreboard deferral, the
give-away, ~800K traces, six models, no-RL-no-reward-no-critic, the page 12
callback, the thesis, and "pick a size". Split it:

- **Two sentences of what happened**, in the body.
- **The mechanism details** (~800K traces, plain SFT, no reward) into the
  figcaption, where the other provenance already lives.
- **The cold start and 79.8%** compressed to a clause. It is scoreboard
  material and page 15 owns the scoreboard.

## 7. Say what it means for inference-time scaling

This is the substantive change, and it needs no new figure.

**The asymmetry the deck has been carrying since page 13.** Page 13's law has
two knobs, but they were never equally available. Thinking is something anyone
can pay for at answer time. Lifting the curve required frontier-scale RL, which
is to say it required being a frontier lab. Every page since has quietly
assumed that.

**Distillation collapses that asymmetry.** The behaviour the RL produced, the
loops and the self-doubt and the long chains, turns out to be transferable as
plain text. No RL, no reward, no 671B. The lifted curve can be copied into
something you run yourself. **The curve-lifting knob got cheap.**

That is the sentence section 3 should be built around, and it is an extension
of page 13's own law rather than a new frame, so the arc holds:

> **1 → 2 → 3 becomes: learn to spend it, watch it happen, then copy it.**

**A second thread worth one sentence, not more.** Page 3 said the stock of human
text is finite. Page 12 said the model writes its own curriculum. Section 3
completes it: one good reasoner manufactures the curriculum for everyone else,
so the traces are a new corpus that did not exist before. This lands as a
single line, because page 3's wall is not this page's subject.

**Placement, so the flow survives.** The existing trailing line "page 11's law,
compressed into weights" is already the right thought in the wrong position. It
should become the section's stated thesis up top, with the dot plot as its
evidence, rather than a closing aside after the reader has stopped looking for
one.

**Not to be done:** a new figure, a cost/economics argument (page 16 owns it),
or any claim that distillation removes the need for the original RL run. It
does not; someone still paid for it once. Say "once, and then everyone
inherited it" rather than "for free".

---

## Test updates

- Section 1: assert the Try-it margin note exists; assert the deleted setup
  paragraph is gone; keep every GRPO listing and dial assertion unchanged.
- Section 2: assert the two-sentence setup, and that the length-is-not-a-
  schedule reading sits after the chart. Keep the narration-question pins.
- Section 3: assert the curve-got-cheap thesis; assert the cold-start clause no
  longer carries a benchmark sentence.
- Existing guards stay: no em dash or en dash in rendered copy, no recap block,
  the aha trigger never a located mistake.

## Open question for the author

Item 3 (whether section 1 splits) is deliberately left open until items 1 and 2
are on screen, since the answer depends on what the section looks like once
about 200 words come out of it.
