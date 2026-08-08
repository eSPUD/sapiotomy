# Page 2 — Thinking in Reality

**Why this page has its own file.** It is the weakest page in the deck by a clear margin: four of
five dimensions grade it `fair`, more than any other page including page 8. Its lede reads as
outline notes rather than prose, it drops the deck's first unexpanded jargon on a reader who has
just met a human thought experiment, roughly a quarter of its prose is cuttable, and its central
widget rested on a fact the code itself flagged `!! PLACEHOLDER FACT !!` with instructions to verify
before shipping.

It is also *structurally* one of the best pages in the deck, which is what makes the surface finish
frustrating. Its internal chaining is excellent — each step's `PullQuote` raises exactly the
question the next step answers — and its closing quote is the deck's thesis statement: *"spent
effort before answering… what it buys, how to buy more of it, and where buying more stops
helping."* The gap-versus-bias distinction it draws is real and page 3 picks it up faithfully in
its two-section structure.

None of the work below is structural. It is one copy pass and one deletion.

---

## 1. The placeholder fact — resolved, and the cleanup is done

> **Cleared 2026-08-08.** The `!! PLACEHOLDER FACT !!` block and the verify-before-shipping note in
> the `wins` comment are gone from `authored.ts`; the comment now records the verification and the
> irony instead. There were no chip or footer flags to remove: that part of the block described a
> plan that was never built, and page 2's only chip is the widget's own `✓ current` / `✗ one short`
> readout. Nothing else in this file has been actioned; §2 onward are still open.


`web/src/lib/authored.ts:92-104` carries this, in the codebase, today:

> `!! PLACEHOLDER FACT !!` The trap needs Spain to have actually **WON** the 2026 final (their 2nd
> title, after the real 2010 win). This was authored by a tool whose own training ALSO ends before
> the final — the page's failure mode, live. **Before shipping: verify the 2026 result.**

The page's entire central widget depends on it: `SPAIN_WORLD_CUPS.wins = [2010, 2026]`,
`trueCount: 2`, and a machine reply that counts one and is wrong by omission. If Spain lost, the
page teaches its lesson with a false premise and the chip reading "✓ current" is itself incorrect.

**I verified it. Spain won**, beating Argentina 1–0 after extra time in the 2026 final, Ferran
Torres scoring in the 106th minute — their second title, after 2010.

So `wins`, `trueCount` and `latestYear` are all correct and **the page ships as-is**. The remaining
work is cleanup, not correction:

- Delete the `!! PLACEHOLDER FACT !!` block at `authored.ts:97-103` and the
  verify-before-shipping note in the `wins` comment at `112-113`.
- Remove the chip and footer flags that exist only to mark the fact as unconfirmed.
- Keep the `machine` reply as the authored System-1 blurt it is; that part was always deliberate,
  and the header's note that the placeholder was written by a tool with the same knowledge gap is
  a good joke worth preserving somewhere less load-bearing than a shipping blocker.

There is a nice irony worth noting internally: the fact was authored by a model whose training ended
before the final, and verifying it required exactly the external lookup the page argues a model
cannot do for itself. That is the page's own thesis demonstrated on the page's own source code.

## 2. The lede is placeholder-grade

`Page2.tsx:196-199`:

> What does it take for an LLM to be useful (helpful, harmless and honest) in the real world? What
> are the pitfalls of System 1 thinking in the real world?

Two stacked rhetorical questions, "in the real world" twice, and the abbreviation **LLM** dropped
unexpanded — the deck's first mention that a machine is the subject at all, arriving on a reader
whom page 1 never told machines were coming. The HHH triple is never explained; its only payoff is
a "Further reading" note at the bottom of the page (`298-311`).

Every other lede in the deck is a crafted handoff. This one reads as a surviving outline bullet.

**Fix.** Rewrite as a bridge from page 1, stating the page's actual shape. `pages.ts:51` already has
the wording: *"One question, answered on reflex, fails twice."* Something like:

> Ask a language model a simple fact question and it answers on reflex — page 1's System 1, in a
> machine. Watch that reflex fail two different ways.

Then fold the helpful/harmless/honest framing into the Askell margin note, where its citation
already lives.

## 3. The widget arrives before its own vocabulary

The `CutoffWidget`, labelled *"training cutoff:"*, renders at `Page2.tsx:207-212`. The paragraph
that defines the term — *"A model learns everything it knows before a fixed training cutoff"* —
sits **below** it at `214-219`. The reader meets a slider whose label is undefined, and pays for it
for three paragraphs.

**Fix.** One setup sentence above the widget: *"This model's memory was sealed on a date — you pick
the date."* Then the definition paragraph can stay where it is, as the payoff rather than the
prerequisite.

## 4. Prose: roughly 25% is cuttable

The highest ratio in the deck (pages 5 and 7 sit at 10–12%).

- **`221-224` re-narrates the widget's own verdict:** *"Based on the knowledge cutoff date, the
  model gives an answer without thinking it through. System 1 thinking leads to an incorrect
  response."* The widget's chip already renders "✗ one short," and the paragraph above already
  defined the cutoff and the gap. Cut the second sentence entirely; fold the first into the
  knowledge-gap paragraph. The `PullQuote` at `226` lands harder immediately after that definition.
- **`249-250` says the same thing twice in adjacent sentences:** *"the model held the fact the whole
  time and left it out anyway. Nothing was missing from its memory."* Drop the second.
- **"System 1 thinking leads to an incorrect response"** is the voice of an older draft. Page 1
  taught the vocabulary; page 2 should use it, not re-announce it.

## 5. The closing pull quote skips over page 3

`Page2.tsx:291-296` promises *"That effort is the subject of the rest of this story."* But the next
page is about retraining, not effort — the effort thread does not resume until page 4. The handoff
is a page early.

**Fix.** Half a sentence acknowledging the detour: the gap still wants new facts, so first see what
retraining buys, then come back to effort. Page 3's own lede already receives this correctly
(*"A missing fact needs new knowledge, and the obvious way to supply it is to train the model
again"*), so the seam only needs page 2 to point where page 3 actually goes.

---

## Related: page 1 hands off to nothing

Not a page 2 defect, but it compounds every problem above. `Page1.tsx:216-221` ends on *"Recognizing
an answer and constructing one are not the same act"* and goes straight to `PageNav`. No
THEREFORE/BUT beat, no hint that a machine is about to enter the story. It is the only seam in the
deck with no hook at all, which is why page 2's cold open on "an LLM" has to carry the entire
transition by itself.

**Fix.** One closing sentence on page 1 turning the distinction into page 2's question — something
like *"A machine that answers instantly is running which of the two, and what does that cost it?"*
Fixing page 1's close and page 2's lede together is one commit and it repairs the deck's worst seam.

---

## Suggested order

1. §1 — delete the placeholder warnings. The fact is confirmed; the code should stop hedging.
2. §2 plus the page 1 close, in one commit. The deck's worst seam, fixed from both sides.
3. §3, §4, §5 — one copy pass, roughly a quarter of the page's words.
