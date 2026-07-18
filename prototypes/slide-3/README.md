# Page 3 prototype: "Match night" (the hinge)

A **standalone, dependency-free prototype** of slide 3 in the **4-slide arc**. This is the back half of
the old slide 2, promoted to its own page and fine-tuned. Slide 2 ended on a rule ("when the problem gets
big, turn the thinking up") and promised tonight would test it; this page runs that test on the World Cup
and lands the hinge: **some answers cannot be thought into existence.** The memorized/understood tiles
are **born here**, as the summary of what the reader just felt; slide 4 flips them and names the
machines. The AI cost words never appear on this page, even scare-quoted.

## How to open
Double-click `index.html` (or drag it into a browser). No server, no build, no network; it runs offline
from `file://`. Toggle light/dark with the ◑ button (it also follows your OS theme).

## The beats
1. **The forecast.** "The World Cup final is tonight. Who wins?" The fine-tune from the slide-issues
   discussion: the reader is handed an invented **form guide** (favorite: won every match, eleven goals,
   full squad fit, five days' rest; underdog: knocked out the champions, in-form keeper, comeback wins,
   four days' rest), so the forecast is visibly **reasoning over given facts**, not fandom and not
   memory. Either pick lands the same point: no fact of the matter exists yet; the answer had to be
   built, and more thinking sharpens it (never to certainty). **Thinking pays.**
2. **Breaking news.** The favorite's star striker is injured in the warm-up and out. The form guide
   visibly loses a line (struck through, warn-colored). Stick or switch, the reader just re-reasoned a
   brand-new fact into a rebuilt call. **Re-thinking pays again.**
3. **The pole thinking can't reach.** "Who won the 2010 World Cup final?" Popped: zero steps, and
   thinking harder would not have helped; that was a lookup, not a build. Nothing: an hour would not
   help; there is nothing to reason *from*. A fixed result is either in your head or nowhere. The shared
   agent line keeps the compute axis: hand an agent the form guide and thinking buys a sharper forecast;
   ask about a final it never saw and an hour buys nothing.
4. **The two shelves.** The tiles, born here: "I've seen this one" (memorized) vs "I can rebuild it"
   (understood), with the evening mapped onto them: the multiplication and tonight's final live on the
   rebuild shelf; the 2010 final marks the boundary, rebuildable by nobody, only rememberable.
5. **Teaser to slide 4.** "How does an answer get *in there* in the first place? That is a different
   machine, with its own name and its own price tag. Next slide."

## Why the World Cup survives (the fine-tune, per the slide-issues discussion)
- The stated objections were staleness (a four-year event), fandom dependence, and analogy cleanliness.
  The page answers all three **without changing domain**: the match is a **hypothetical** (no real teams,
  no real facts, no real result, "picture it" framing), so nothing dates; the **form guide supplies all
  the reasoning material**, so a reader who has never watched football has exactly as much to work with
  as a fan; and the three-beat structure (future / new fact / fixed past) is the cleanest available
  mapping of derivable vs estimable vs memory-or-nothing.
- The 2010 question deliberately splits the audience (some readers really do have it memorized); both
  branches teach the same lesson from opposite sides, which is why both follow-ups exist.
- `PAST_YEAR` is a one-line knob at the top of the script; any final far enough back that "I've got
  nothing" stays common works. The page never states the winner.

## Design notes
- **One axis only:** every beat asks "does more thinking help here?"; where knowledge *comes from* is
  named only as far as "in your head or nowhere" (the tiles), and the AI cost words are slide 4's.
  Acceptance check: grep this file for the two AI cost words; expect zero.
- **No benchmark numbers, no citations needed:** the page makes no accuracy or model-capability claims.
- **The acts bar** tracks real progress: The forecast → Breaking news → The hinge.
- Copy is em-dash-free (house preference).
- Reduced motion: no scrolling animation on reveals. Keyboard: all six choice buttons focusable;
  aria-live announcements at milestones.

## Flow paths to test by hand
1. Forecast pick (either) reveals the follow-up and the news flash; acts bar moves to "Breaking news".
2. Stick/switch reveals the follow-up, strikes the "full squad fit" line in the form guide, and reveals
   the 2010 question; acts bar moves to "The hinge".
3. Popped/nothing reveals the matching follow-up, the shared agent line, the tiles, the boundary idea
   card, and the teaser. Spot-check a few of the eight branch combos.
4. Reduced motion (OS setting): reveals appear without smooth scrolling.
5. Keyboard only: all six match-night buttons.
6. Theme toggle: the warn-colored news flash card and the struck form-guide line read correctly in both
   light and dark.

## Port path (when the scaffold exists)
- The three stages become a small authored config (prompts, options, follow-ups, form-guide lines) so
  copy stays separable from the reveal logic; `PAST_YEAR` moves there too.
- The form guide becomes a shared two-column component (slide 4's quote strip wants the same shape).
- The tiles component is shared with slide 4 (which renders the same two tiles as flippable buttons).
- Placeholder CSS tokens swap for the design-token layer.
