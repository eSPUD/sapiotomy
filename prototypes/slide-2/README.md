# Page 2 prototype: "The machine's two speeds"

A **standalone, dependency-free prototype** of slide 2, rebuilt for the **4-slide arc** (game, machine's
two speeds, match night, two machines). Slide 1's teaser asked *"what if something answered instantly, no
matter how big the problem gets?"*; this page is that something. It stays on exactly one axis, slide 1's
System-1/System-2 seed: **instant vs thinking, now on the machine's side.** The back half of the old
slide 2 (memorized vs understood, match night) moved to slide 3; the AI cost words never appear here
(naming them is slide 4's reveal), and neither does any explanation of *why* the blurt works (that is
slide 3's territory).

## How to open
Double-click `index.html` (or drag it into a browser). No server, no build, no network; it runs offline
from `file://`. Toggle light/dark with the ◑ button (it also follows your OS theme).

## The beats
1. **The blurt ladder.** The same problems as the game, plus one size the game never reached, answered by
   an agent in **instant mode** (first thing that pops, no working out). 2 + 2 → right. 17 × 24 → right.
   350 × 638 → right, instantly, where the reader needed minutes; the machine's fast gear is superhuman.
2. **The prediction.** Before the last rung, a POE beat: 4502 × 6398, does the blurt hold? (It holds /
   It cracks.)
3. **The crack.** The blurt answers **28,793,796**, instantly, with the same confidence as the right
   answers. It is wrong: the true product is **28,803,796**, a miss of exactly 10,000, within four
   hundredths of a percent. The point is not that it missed; it is that *nothing on the surface changed*.
   A pop is a guess wearing certainty's clothes, and it does not know when it is wrong.
4. **Let it think.** The reasoning trace (the machinery from the old slide 2), now on the **same problem
   the blurt missed**. The trace opens with the very same wrong pop, refuses to trust it, decomposes,
   hits the mismatch, re-checks by a different split, and lands the right answer. Play, pause, scrub,
   jump to end, or read as a document. This stages the meeting-notes observation directly: the agent
   blurts first, then reasons its way back.
5. **Honesty aside.** In day-to-day use a modern agent will just call a calculator tool
   (`print(4502 * 6398)`) for arithmetic; the multiplication is the demo because the reader can feel
   every step of it. Required by `notes_on_slides.md` (Scott's disclaimer note).
6. **Teaser to slide 3.** The rule so far: when the problem gets big, turn the thinking up. Does it
   always hold? "Next slide: match night."

## Design notes
- **The four instant answers reproduce a real informal test** (DeepSeek-V3, July 2026, from
  `notes_on_slides.md`): the first three are answered correctly with no reasoning, and 4502 × 6398 comes
  back 28,793,796, wrong by exactly 10,000. The ladder is honest about instant mode's real strength: it
  does NOT crack at 350 × 638 (a fast model gets that right); it cracks one size up. Chips label the
  test informal; **re-run and provenance-log both the blurts and a real trace before shipping.**
- **The trace is a labeled placeholder** (banner + chip): hand-authored, illustrative pacing. Arithmetic
  verified: 4502 × 6000 = 27,012,000; 4502 × 398 = 1,800,800 − 9,004 = 1,791,796; sum 28,803,796; check
  split 4500 × 6398 + 2 × 6398 = 28,791,000 + 12,796 = 28,803,796.
- **No accuracy percentages, no benchmark numbers** anywhere on the page (the old "15% likely right"
  figures stay cut, per `notes_on_slides.md`).
- **One axis only:** every beat asks "instant or thinking?", never "where did the knowledge come from"
  (slide 3) and never the AI cost words (slide 4). Acceptance check: grep this file for the two AI cost
  words; expect zero.
- **The acts bar** tracks real progress: Instant mode → The crack → Let it think.
- Copy is em-dash-free (house preference).
- Reduced motion: answers appear whole (no typing effect), the crack verdict lands without its dramatic
  pause, and the trace becomes a step-through ("Show next step ▸"). Keyboard: all controls focusable;
  aria-live announcements at milestones.

## Flow paths to test by hand
1. Ask through all three easy rungs; verify the ask button pauses between rungs and the notes advance.
2. After rung 3 the ask button disappears and the prediction card appears; either pick reveals the echo
   line, then rung 4 plays: answer types in, brief beat, verdict flips the row to warn styling; acts bar
   moves to "The crack"; the crack section and trace reveal.
3. Play the trace end-to-end (or "Jump to end"): final answer shows with the "blurt said 28,793,796"
   subline; the after-section (recap idea, honesty note, teaser) reveals; acts bar moves to "Let it
   think".
4. Reduced motion (OS setting): instant answers appear whole; step-through trace; no scrolling animation.
5. Keyboard only: ask button, both prediction options, trace controls, scrub (arrow keys).
6. Theme toggle: the warn-styled cracked row and warn idea card read correctly in both light and dark.

## Port path (when the scaffold exists)
- `ROUNDS` becomes an authored JSON of provenance-logged instant answers (model, date, params); the
  cracked row's true-product line renders from data, not hardcoded copy.
- Inlined `SEGMENTS` becomes a trace JSON from a real run (with provenance); the stream/scrub controls
  map to the shared trace-viewer component.
- If the scaffold carries slide-1 state forward, the rung sublines can cite the reader's actual game
  times ("this one cost you 2 m 10 s; the blurt did not slow down").
- Placeholder CSS tokens swap for the design-token layer.
