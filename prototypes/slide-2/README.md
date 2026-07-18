# Page 2 prototype: "Instant answer vs reasoning"

A **standalone, dependency-free prototype** of slide 2, built from `notes_on_slides.md` (Notes › Slide 2).
This is the **reasoning trace's new home** (moved here from slide 1). The page runs on exactly one axis,
slide 1's System-1/System-2 seed: **does more thinking help here, or not?** It ends on the one question
thinking cannot crack, which is the hinge slide 3 opens on. The words **training** and **inference** (even
scare-quoted "trained") never appear on this page; naming them is slide 3's reveal.

## How to open
Double-click `index.html` (or drag it into a browser). No server, no build, no network; it runs offline from
`file://`. Toggle light/dark with the ◑ button (it also follows your OS theme).

## The beats
1. **Recap bridge.** One line ties back to the game: bigger problems meant more steps and more time; those
   steps are reasoning.
2. **The trace.** "For reference, here is a reasoning trace: how an agent works through 350 × 638." Play,
   pause, scrub, jump to end, or read as a document. The trace decomposes (35 × 638, then ×10), then
   double-checks itself via a different split (350 × 600 + 350 × 38). Finishing the trace reveals the rest of
   the page.
3. **Memorized vs understood.** Anchored by a one-line thought experiment instead of an interactive re-ask
   (the reader has already met 350 × 638 in the game and again in the trace; asking a third time was a
   duplicate): *asked again tomorrow, you wouldn't redo the steps; the answer would just pop, zero steps;
   that pop is memory, not reasoning.* Then the two tiles: "I've seen this one" (zero steps, only works on
   problems you've met) vs "I can rebuild it" (steps take time, works on any multiplication).
4. **Match night** (the reframed World Cup beat), three stages in one section:
   - **The forecast.** "Picture it: the World Cup final is tonight. Who wins?" (*The favorite / The
     underdog*). Either pick lands the same point: nothing to remember, the match hasn't happened; the
     answer had to be *reasoned*, and more thinking sharpens it. **Thinking pays.**
   - **Breaking news.** "The favorite's star striker just went off injured in the warm-up. Think again:
     who wins now?" (*Stick with my pick / Switch*). Either way, the reader just re-reasoned over a
     brand-new fact; the old call got rebuilt, not recalled. **Re-thinking pays again.**
   - **The pole thinking can't reach.** "Who won the 2010 World Cup final?" (*It popped into my head /
     I've got nothing*). Popped: zero steps, and thinking harder wouldn't have helped. Nothing: an hour of
     thinking won't summon it; there's nothing to reason *from*; a fixed result is either in your head or
     nowhere. Shared agent line, compute-axis only: give an agent tonight's matchup and the injury report
     and thinking time buys a sharper call; ask about a final it never saw and an hour of thinking buys
     nothing. **This is the hinge into slide 3.**
5. **Teaser to slide 3.** Two kinds of question: one where turning up thinking keeps paying, one where it
   buys nothing because the answer is either already in there or it isn't. "So how does an answer get *in
   there* in the first place? That's a different machine, with its own name and its own price tag."

## Design notes
- **One axis only:** every beat asks "does more thinking help?", never "where did the knowledge come from."
  The earlier draft's "you'd have to look it up" line is gone (it smuggled in retrieval, a third concept),
  and so is every use of "trained" (slide 3's word).
- **No third encounter with 350 × 638:** the earlier interactive re-ask ("Quick: what's 350 × 638?" with a
  stopwatch) was cut as a duplicate; the reader meets the problem in slide 1's game and in the trace, and
  the memorized/understood point now lands as a one-line thought experiment.
- **No benchmark numbers, no citations needed:** the page makes no accuracy or model-capability claims.
  Match night is a hypothetical (no real teams, no real result), and the 2010 question names a year but
  never states the winner, so nothing dates. `PAST_YEAR` is a one-line knob at the top of the match-night
  script block; any final far enough back that "I've got nothing" stays common works.
- **The trace is a labeled placeholder** (banner + chip): hand-authored, illustrative pacing. A shipping page
  should swap in a verbatim, provenance-logged run from a real agent. Arithmetic in the placeholder is
  verified: 638 × 35 = 22,330; ×10 = 223,300; check split 210,000 + 13,300 = 223,300.
- **The acts bar** tracks real progress: The trace → Match night → The hinge.
- Copy is em-dash-free (house preference).
- Reduced motion: the trace becomes a step-through ("Show next step ▸"), no scrolling animation. Keyboard:
  all controls focusable; aria-live announcements at milestones.

## Flow paths to test by hand
1. Play the trace end-to-end (or "Jump to end"); the memorized/understood beat and match night reveal
   together; acts bar moves to "Match night".
2. Match night stage picks lock after the first click (spot-check a few of the eight branch combos, e.g.
   favorite→stick→popped, underdog→switch→nothing): forecast pick reveals the news flash; stick/switch
   reveals the 2010 question and moves the acts bar to "The hinge"; popped/nothing reveals the shared agent
   line and the teaser.
3. Reduced motion (OS setting): step-through trace; no smooth scrolling on reveals.
4. Keyboard only: trace controls, scrub (arrow keys), all six match-night buttons.
5. Theme toggle: the warn-colored news flash card reads correctly in both light and dark.

## Port path (when the scaffold exists)
- Inlined `SEGMENTS` becomes a trace JSON from a real run (with provenance); the stream/scrub controls map to
  the shared trace-viewer component.
- If the scaffold carries slide-1 state forward, the thought-experiment line can cite the reader's actual
  round-3 time ("in the game this took you 2 m 10 s; tomorrow it would take zero steps").
- Match night's three stages become a small authored config (prompts, options, follow-ups) so copy stays
  separable from the reveal logic; `PAST_YEAR` moves there too.
- Placeholder CSS tokens swap for the design-token layer.
