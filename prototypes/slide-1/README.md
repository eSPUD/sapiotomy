# Page 1 prototype: "Think fast, think slow" (the front door)

A **standalone, dependency-free prototype** of slide 1, rebuilt as a **pure game**. There is **no LLM
anywhere on this page by design**; the reasoning trace moved to slide 2 (see `notes_on_slides.md`). The page
plants the System-1/System-2 seed with the reader's own clock: problem complexity raises time-to-complete.

## How to open
Double-click `index.html` (or drag it into a browser). No server, no build, no network; it runs offline from
`file://`. Toggle light/dark with the ◑ button (it also follows your OS theme).

## The game
1. **Round 1: 2 + 2.** Instant. The per-round clock starts when you click into the answer box.
2. **Round 2: 17 × 24.** In your head, no calculator.
3. **Pop-up after round 2:** "How did you think about it? Did 408 just pop into your head, or did you have to
   reason through it?" Then the bridge: "What about a harder problem: 350 × 638?"
4. **Round 3: 350 × 638.** Same rules, just bigger. An "I give up, show me" path records the elapsed time
   (the pause is the point).
5. **Results:** the three times as a single-series bar comparison, plus the one idea: **more steps, more
   time; the size of the problem sets the thinking time.** The closing teaser ("what if something answered
   instantly, no matter how big the problem gets?") hands off to slide 2's instant-answer problem.

Wrong answers are fine: the game records the time either way and shows the correct answers "for the record"
(it is the clock we're after, not the score). Answer parsing is tolerant (whitespace, commas, a leading `=`,
a trailing `.`).

## You vs the computer
A **"Who plays?"** switch sits above the game. **You** is the default. Picking **The computer** plays the
whole game for the reader: answers get typed in, the per-round clocks run, the pop-up gets answered, and the
same results view renders. Switching modes (or "Run it again") resets the game.

### ⚠️ Honesty note: computer mode is a scripted playthrough
The computer's play is a **hand-scripted simulation of a human player** with **illustrative pacing**
(2 + 2 in about a second, 17 × 24 in tens of seconds, 350 × 638 in minutes). The long rounds are
**time-compressed** on screen; a **≫ chip** shows whenever the displayed clock runs faster than real time,
so the final times never contradict the watched wall-clock. These times are **not measurements** and the
page never claims they are (the footer says "nothing here is a benchmark").

Open decision for the shipping page: keep a scripted simulation (optionally re-record it from a real
person's playthrough, provenance-logged), or have a model play. Whichever is chosen, the project's own
data-honesty rules apply: if the play is simulated, the shipping page should say so somewhere the reader can
find (a sources note is enough); a silently-simulated "computer" that readers could reasonably take for a
measurement is the kind of thing the deck itself teaches readers to distrust.

## Flow paths to test by hand
1. **You, all right:** 4 → 408 → pop-up choice → 223,300 → results with three bars.
2. **You, wrong answers:** each round shows the correct answer gently and the clock still records.
3. **Give up on round 3:** elapsed time recorded and labeled "(gave up)" in the results.
4. **Pop-up choices:** "It just popped in" vs "I reasoned through it" change the closing echo line.
5. **The computer:** watch all three rounds play with the ≫ fast-forward chip on rounds 2-3; pop-up
   auto-answers; results render with the "instant, then seconds, then minutes" line.
6. **Mode switching mid-game** (either direction): everything resets cleanly.
7. **Reduced motion (OS setting):** your stopwatch updates at 1 Hz; computer mode becomes a stepper
   (Next ▸ for rounds 1-2, the dialog's own button for round 3); no scrolling animation.
8. **Keyboard only:** inputs, Answer buttons (Enter submits), mode switch, pop-up (light focus trap),
   give-up link, Run it again.

## Port path (when the scaffold exists)
- The three rounds + pop-up + results become the page component; the mode switch is page-local state.
- Round timings stay client-measured (they are the reader's own); the computer script becomes a small
  authored JSON (times + typed answers) so copy/data stay separable, with the honesty note above resolved.
- Placeholder CSS tokens swap for the design-token layer; the results bars follow the dataviz rules already
  applied here (single series, one hue, direct labels, no legend).
- The stat/bar values render from recorded state, never hardcoded; answers (4, 408, 223,300) live in one
  config block (`ROUNDS`).

## Deliberate deviations / notes
- Copy is em-dash-free (house preference).
- No accuracy percentages appear anywhere (the old "15% likely right" figures were uncitable; cut per
  `notes_on_slides.md`).
- A fourth level (4502 × 6398) is floated in the notes; the `ROUNDS` config makes adding it trivial if the
  game wants a longer ramp later.
- The prototype banner is dev chrome and does not ship.
