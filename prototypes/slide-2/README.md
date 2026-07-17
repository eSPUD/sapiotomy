# Page 2 prototype: "Instant answer vs reasoning"

A **standalone, dependency-free prototype** of slide 2, built from `notes_on_slides.md` (Notes › Slide 2).
This is the **reasoning trace's new home** (moved here from slide 1), and the page where the deck plants the
distinction slide 3 will name: knowing an answer because you **memorized it** ("trained on it") versus being
able to **reason your way there** because you've mastered the concept.

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
3. **The re-ask twist.** "Quick: what's 350 × 638?" with a stopwatch (clock arms when you click into the
   box). The reader has seen this exact problem before, one slide ago, and the answer is also sitting in the
   trace above. Fast answer (under 12 s): *you didn't reason it, you'd already "trained" on it; blurting
   worked.* Slow-but-right: *memory fades, but you could rebuild it, because you've mastered the concept.*
   Wrong: *now you've been told twice; notice how next time it will just pop.*
4. **Memorized vs understood.** The distinction, near-verbatim from the notes, plus two tiles: "I've seen
   this one" (zero steps, only works on problems you've met) vs "I can rebuild it" (steps take time, works on
   any multiplication).
5. **The World Cup beat.** "Who won the last World Cup final?" with *I know it / No idea*. Knowing = memory
   again. Not knowing = the kicker: **you can't reason your way to a match result**; there's no concept that
   derives it, you have to find a source and reason with what it says. Then the agent tie-in from the notes:
   if the match happened after its training, no amount of thinking alone produces the winner; it has to reach
   for a source. But 350 × 638 it can always rebuild.
6. **Teaser to slide 3.** "These two ways of knowing have names in the world of AI." The terms (inference vs
   training) are deliberately NOT used on this page; naming them is slide 3's job.

## Design notes
- **No benchmark numbers, no citations needed:** the page makes no accuracy or model-capability claims. The
  World Cup question never states who won (the reader supplies their own memory), so nothing dates.
- **The trace is a labeled placeholder** (banner + chip): hand-authored, illustrative pacing. A shipping page
  should swap in a verbatim, provenance-logged run from a real agent. Arithmetic in the placeholder is
  verified: 638 × 35 = 22,330; ×10 = 223,300; check split 210,000 + 13,300 = 223,300.
- **The 12 s fast/slow threshold** is a tuning knob (top of the re-ask script block), not a claim; both
  branches are written to be true regardless.
- Copy is em-dash-free (house preference).
- Reduced motion: the trace becomes a step-through ("Show next step ▸"), the stopwatch updates at 1 Hz, no
  scrolling animation. Keyboard: Enter submits; all controls focusable; aria-live announcements at milestones.

## Flow paths to test by hand
1. Play the trace end-to-end; the re-ask appears when it finishes (or after "Jump to end").
2. Re-ask fast path (answer within 12 s, e.g. type 223300 straight away, or copy it from the trace).
3. Re-ask slow path (wait past 12 s, then answer 223300).
4. Re-ask wrong path (e.g. 223000).
5. World Cup: both choices; the shared agent line appears with either.
6. Reduced motion (OS setting): step-through trace; 1 Hz stopwatch.
7. Keyboard only: trace controls, scrub (arrow keys), input (Enter), choice buttons.

## Port path (when the scaffold exists)
- Inlined `SEGMENTS` becomes a trace JSON from a real run (with provenance); the stream/scrub controls map to
  the shared trace-viewer component.
- The re-ask reuses slide 1's timed-input pattern; if the scaffold carries slide-1 state forward, the copy can
  cite the reader's actual round-3 time ("four minutes ago this took you 2 m 10 s; just now it took 3 s").
- Placeholder CSS tokens swap for the design-token layer.
