# Page 14 reframe — the R1 story, told as inference-time scaling

Four copy changes plus one figure label, reviewed before implementation. No
new sections, no new interactives, no content cut. Theme of the round: page
14 is a well-built R1 page that never tells the reader why an
inference-time-scaling deck needs it.

## Revision note: main moved before implementation

Two merges landed on main after this plan was approved (`d5fb691`, page 13's
lede and section 4; `340bbf1`, the page 12 to 13 seam). Both change what page
14 has to do. Three consequences, applied below:

1. **Page 13 now ends with four open questions** ("The questions o1 cannot
   answer") and a handoff promising page 14 answers them: the algorithm in
   full, a readable chain, a training curve showing where the extra thinking
   comes from, and the distills. That is a stronger setup than any framing
   sentence this plan could have added to page 14, and it makes item 1's
   original copy wrong: page 14's intro must now **answer**, not re-state the
   setup that page 13 already built. Item 1 is rewritten below.
2. **The old page 13 lede is gone and was right to go.** It read "Everything
   so far bolted reasoning on from outside", which this plan's diagnosis
   quoted approvingly. Page 13's header comment now records why that was
   wrong: page 12 already trains reasoning in, so the phrasing made the seam
   read as a skipped page. The diagnosis section below stands, but its
   evidence should be read as "page 13 does its deck-framing work", not as an
   endorsement of that particular sentence.
3. **A review constraint now governs page callbacks.** Page 13's header
   records: "Deliberately absent: any back-reference chain through Act 2's
   pages (review: 'lets not cite everything like page 6, page 7…')". This
   plan proposed exactly such a chain plus a test enforcing it. **The
   structural test is cancelled** (see Test updates) and callbacks are held to
   two, each doing argumentative work: page 7 at GRPO, page 10 at the aha.
   Decorative page references are not to be added anywhere on page 14.

## Diagnosis

Page 13 is not the problem, and should not be touched beyond a seam check.
Its intro already states the internalization thesis in its first two
sentences ("Everything so far bolted reasoning on from outside ... o1 trained
it in"), section 2 is titled "One law, two knobs" and extends page 11 by
name, section 3 is "Stack the toolbox, or turn the knobs?", and the waterfall
rows are literally labelled "+ page 7's voting" and "+ page 8's re-ranker".
Page 13 wears its Act 2 callbacks as figure furniture, where the eye lands.

Page 14 does not. Section 1 (GRPO) makes no Act 2 callback at all. The aha
skeleton is page 10's backtracking with the search harness deleted and the
page never says "page 10". The one page-7 reference sits in a stat blurb
about cons@64, not in the GRPO section where it is structural. The only
deck-level sentence is section 3's "page 11's law, compressed into weights",
which is good and stays. Everything else reads as R1 internals.

That asymmetry, not the amount of R1 content, is what makes the pair feel
like two lab profiles instead of two beats of one argument.

## Division of labour between 13 and 14

Stated here because it constrains every edit below.

- **Page 13 owns "internalized."** Act 2 spent test-time compute from the
  outside; o1 trained it in. Page 13 already says this and prices the
  exchange between the two knobs.
- **Page 14 owns "observable and portable."** Page 13 is structurally barred
  from showing the machinery and says so (the rumor badge in section 1, the
  whole hidden-chain ledger in section 4). Page 14 is that same claim with
  the lid off: GRPO is the machinery of the exchange, the training curve is
  the exchange happening in public, distillation is it packaged and shipped.

Consequence: page 14's intro must **not** open on the internalization thesis.
That is page 13's opening move, and repeating it makes 14 read as a weaker
echo with more algorithm in it.

## 1. Intro — answer page 13's questions, do not restate them

*Rewritten after `d5fb691`. See the revision note.*

Keep "where does the backtracking come from?" It is the page's best line. The
problem is that nothing around it tells the reader that backtracking is the
model allocating its own test-time compute, so the hook reads as an emergence
question rather than a scaling one.

Replacement, verbatim:

> Page 13 closed with four questions about what sits behind the thinking
> dial, and no way to answer any of them from outside. In January 2025
> DeepSeek published all of it: the algorithm, the weights, the training
> curve, and the chain itself, visible token by token, trained with no worked
> examples at all. So the questions become answerable, and the first thing
> the answers show is a model that taught itself to spend test-time compute
> nobody told it to spend. Where does the backtracking come from?

Four sentences, same as the current paragraph, same hook, same citation
placement.

**Do not promise "answered in order."** Page 13's four questions do not map
one-to-one onto page 14's three sections, and a promise the page cannot keep
literally is worse than no promise. The true mapping, which the section-level
edits below deliver without announcing it:

| Page 13 asks | Page 14 answers |
| --- | --- |
| 1. What are you buying when you turn the thinking dial? | §2: one chain allowed to run longer, not chains voted behind an API |
| 2. Are the thinking tokens doing the work, or describing it? | §2: the aha loop is load-bearing structure, not narration |
| 3. What does the model do with ten times the thinking? | §2: it re-derives, via the loops the skeleton draws |
| 4. Does the law need frontier scale? | §3: no, the distills carry it to 1.5B |

Section 1 (GRPO) answers the handoff's separate promise, "the algorithm in
full", rather than one of the four questions.

## 2. Section 1 — the GRPO bridge, the one genuinely missing sentence

Line 2 of the pseudocode ("sample G answers from the current policy") is page
7's parallel sampling, moved across the train/test line. The page never says
so, and it is the strongest latent bridge on the page.

New paragraph, to sit **immediately below the pseudocode block and above the
PPO/critic paragraph** (lineage before cost):

> Line 2 should look familiar. Page 7 sampled many chains and picked among
> them at answer time, then threw every sample away once the vote was
> counted. GRPO runs the same sampling during training and keeps what the
> winners did in the weights. That is page 13's exchange seen from the
> inside: sampling paid for once, at training time, instead of on every
> question.

**Honesty constraint, deliberate.** Do not write the tempting stronger
version ("so tomorrow's single sample looks like today's best-of-four").
GRPO is a policy gradient with a group baseline, not best-of-N distillation,
and page 12 already made the sample-filter-train move. Given that page 13
badges its own recipe as rumor, the claim here stays at "same sampling, moved
across the line", which is true and still does the work.

## 3. Section 2 — name the right axis as page 11's

The section is already the most inference-time-scaling chart in the deck and
the copy nearly says it ("buys itself more thinking time"; the chart
annotates "no term in the reward mentions length"). One clause finishes it.
This is a small edit, not a rewrite.

Current sentences 3 and 4 of the section's opening paragraph become:

> Length is not a schedule anyone set: longer, re-checking traces win more
> reward, so the model buys itself more thinking time. Read the right axis as
> page 11's x axis, test-time compute, with nobody's hand on the dial: the
> model finds the scaling law by itself and walks up it. And it is one chain
> allowed to run longer, not many chains sampled and voted on behind an API,
> which is the distinction page 13 could only assert. The skeleton below
> shows what the extra tokens are made of.

The third sentence is added after `d5fb691`: it is the direct answer to page
13's first open question, and it is the one answer no closed model could have
supplied. It also sharpens item 2's bridge by contrast, since GRPO's group
sampling happens at training time while the thinking dial here moves a single
chain.

## 4. The aha skeleton — give the interrupt a reason

Reviewed at the rendered page. The skeleton draws the *consequence* and omits
the *trigger*: the interrupt node fires for no stated reason, so it reads as
the trace hiccupping rather than the model judging its own work. Page 10's
machinery is branch, **score**, backtrack. The figure has the branch and the
backtrack and no score, which is the same gap as the missing page-10 callback,
so both are fixed together here.

The evaluation is the emergent behaviour. The loop is only what the
evaluation causes.

### The framing constraint: doubt, not error

The interrupt must be labelled as **double-checking**, never as *finding a
mistake*. Two reasons, and the second is load-bearing:

1. **Not faithful.** In R1's traces the interrupt is a doubt, a decision to
   re-evaluate. The model does not locate an error and name it.
2. **"Found a mistake" contradicts page 9.** Nothing in this recipe ever
   scored a step. Section 1's reward on this very page is
   `rᵢ ← 1 if answerᵢ is right, else 0`, outcome only. No process signal
   exists anywhere, so the model cannot have been told which step was bad.

The doubt framing is also the better story, and it pays off page 9 two pages
late: pure outcome reward grew a step-level habit that nobody supervised. The
model learned to suspect itself because re-checking lands more right answers,
and right answers are all the reward pays.

### Prose (`STAGE_NOTE.aha`), the minimum fix

Replacement, verbatim. Keeps the existing final sentence word for word
because the test pins it:

> Four steps in, the trace stops, doubts what it has just written, and goes
> back to its own first line to derive it again. Nothing scored those steps:
> the reward only sees the final answer, so nobody told the model that its
> last step was shaky. It learned to suspect itself anyway, because
> re-checking lands more right answers and right answers are all the reward
> pays. Page 10's branch, score, backtrack, with the harness deleted and the
> scoring moved inside the chain. The extra tokens on the right axis are
> these loops.

Five sentences against the current three. That is dense for a figure caption,
but it is the caption that carries the section's whole claim, and one of the
five is a fragment.

### Figure (optional, recommended): mark the suspect step

Puts the "why" in the figure instead of only under it, matching page 13's
habit of labelling callbacks in the furniture. Geometry allows it: the
interrupt node ends at x=320 in a 560 viewBox.

Mark the fourth block of the first pass, the step the trace is about to doubt.

**Hue constraint, load-bearing.** Do **not** render it with `fill-wrong` or
`stroke-wrong`. The wrong hue asserts a located error, which is exactly the
claim the section must avoid, and it would undo the framing constraint above.
It needs an uncertainty treatment, not a wrongness one.

- **Implement:** keep the neutral `fill-grid` fill, add a dashed outline in
  the compute hue. That hue already means "this is where the thinking goes"
  on this page (the length curve, the markers), so it reads as attention
  rather than error.
- **Rejected alternative:** a back-glance arrow from the interrupt node to
  the block. It crowds the loop curve, which already owns the space below.
- **Decision rule:** implement, screenshot, and if the marked block stops
  reading as an ordinary step, drop it and let the prose carry the trigger
  alone. Do not reflow the skeleton geometry for it.

**Dropped from the earlier draft of this item:** the loop arrow does *not*
gain a second label reading "page 10's backtrack, no harness". Two added
labels crowd the figure, and marking the suspect step is the better use of
the real estate. The page 10 callback lives in prose only. "back to line 1"
stays as is, and the node keeps the word "interrupt", which is structurally
right.

## 5. Page 13 — seam check only, no edit expected

Verify page 13's closing handoff still agrees with page 14's new opening. It
currently reads "A closed lab proved the two-axis law and kept the recipe.
Within four months an open lab published one: weights, training curve,
visible chain and all", which already matches "priced the exchange, then hid
the machinery". Expected outcome: no change. If it needs one, it is one
clause, not a rewrite.

## Non-goals for this round

- **Do not touch the group-baseline interactive.** It is the page's one
  hands-on mechanism and the deck's bar is intuition-building.
- **Do not touch the distill dot plot or its "reasoning transfers as data"
  thesis.** Section 3's bridge line already works; it only lands harder
  because the intro now sets up the frame it pays off.
- **Do not cut R1 detail to make room.** Every change above is additive copy
  or a relabel. Total added prose is roughly one paragraph plus two clauses.
- **Do not add a fifth section.**

## Known-adjacent, deliberately deferred

Both are real and both are separate rounds. Pull either into this one only on
request.

- **The Simulated/Cited footer.** Page 14 still carries one; page 13 dropped
  it under the newer-pages rule (provenance inline via h2 badges and
  captions). Page 14's provenance is already stated inline under the skeleton,
  so the footer is largely duplicative.
- **The em-dash sweep.** Page 14 has 38 em dashes in visible copy and page 13
  has 60; no branch in the repo currently has the sweep or the banning test,
  despite the style notes describing both as done. All copy proposed above is
  written em-dash free so it survives the sweep whenever it lands.

## Test updates (Page14.test.tsx)

Existing assertions that must keep passing unchanged:

- `/The extra tokens on the right axis are these loops/` — preserved verbatim
  as the last sentence of `STAGE_NOTE.aha`.
- Every GRPO pseudocode and dial assertion — the bridge is a new sibling
  paragraph, it does not alter the listing or the chart.
- Every distill-picker and dot-plot assertion.

New assertions:

- Intro pins the exchange framing ("priced the exchange between training
  compute and thinking time") and keeps the backtracking hook.
- Section 1 names page 7 and the train/test move.
- Section 2 names page 11's axis as test-time compute.
- The aha stage names the trigger as doubt ("doubts what it has just
  written") and states the absent step-level signal ("nothing scored those
  steps"); assert both are absent at the early and mid stages, since they
  live in `STAGE_NOTE.aha` only.
- The aha stage names page 10's branch, score, backtrack.
- **Guard assertion:** the aha stage does not claim a located error. Assert
  no match for /found (a )?(mistake|error)|wrong step|caught (a|its) (mistake|error)/
  in the rendered stage note. This is the framing constraint above, pinned so
  a later tightening pass cannot quietly reintroduce it.
- Intro references page 13's four questions; section 2 answers the first of
  them ("one chain allowed to run longer").

**Cancelled after `d5fb691`:** the structural test asserting page 14
references pages 7, 9, 10, 11 and 12. Page 13's header records the review
instruction "lets not cite everything like page 6, page 7…", and a test
demanding five page numbers appear would institutionalise exactly the pattern
the author rejected. The two callbacks that remain (page 7 at GRPO, page 10
at the aha) are pinned individually because each carries an argument, not
because a count is owed.
