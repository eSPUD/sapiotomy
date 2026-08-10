# Pages 1-14 — analysis

Three reviewers (Act 1, Act 2, Act 3 opening) worked independently. Every finding below was
re-opened against the cited artifact and labelled CONFIRMED or WEAKENED; items that did not
survive are in Refuted at the bottom. Cross-act duplicates are resolved into one finding.

## Verdict

The chain of levers in Act 2 is the strongest thing here: 5 names the chain, 6 makes length the
meter, 7 spends the budget many ways, 8 changes the selection rule, 9 changes what the judge
reads, 10 moves the judge inside the loop, 11 prices the whole shelf against parameters, and no
page drifts. Where the deck slips is at the joints and in the strength of its claims: Act 1's
pivot rests on a dichotomy page 2's own figure has already broken (retrieval is demonstrated and
then never named again), three pages make claims their own data contradicts (7 against 6, 10
against its own engine, 13 against its own interactive), and two figures present unmeasured or
recomposed quantities in the grammar of measurement (page 8's zero-solve dot, page 13's
waterfall). Page 12 opens Act 3 with no interaction at all and a bolded question it never
answers, which is the single most visible defect to a workshop reviewer reading straight through.
The deck's reviewer-facing audit trail, `PROVENANCE.md`, is wrong or absent for most of pages
5-14, which matters more than usual at a venue whose whole guardrail is traceability. Act 2 is
also more honest than the spine it is written against: it delivers a ceiling and a bill on every
lever before Act 3 claims to, so Act 3's "BUT" reads as continuation rather than reversal.

## Findings

Ordered by severity, then by how load-bearing the page is.

### Blocking

**F1 · page 12 · blocking · high · CONFIRMED** — The page has zero reader-driven interaction, and
the bolded question in its lede is never answered because the control that would answer it is
switched off. The lede asks "What happens when you take the answer key away?"
([Page12.tsx:436](web/src/components/pages/Page12.tsx:436)); `StarLoop` implements the full
key-off state ([Page12.tsx:275-289](web/src/components/pages/Page12.tsx:275)) but the page
hard-wires `<StarLoop filter />` ([Page12.tsx:458](web/src/components/pages/Page12.tsx:458)), and
[Page12.test.tsx:33-39](web/src/components/pages/Page12.test.tsx:33) pins the absence of any
toggle. I grepped the whole file for `onClick`, `onChange`, `type="range"` and `recordInteraction`:
zero hits. The only motion is an unprompted `requestAnimationFrame` loop (`:213-269`).
*A reader who arrives at Act 3's opening page after seven hands-on pages reads the bold question,
works the diagram, the listing and the bars, reaches PageNav, and concludes either that the deck
forgot to answer it or that this page is a slide, and stops looking for controls on later pages.
That is wrong because the second half of the page's assigned concept ("for exactly as long as an
external check filters what it studies", [pages.ts:61](web/src/lib/pages.ts:61)) is exactly what
the dead control demonstrates, and because `SUBMISSION.md:28` and `:34` both claim otherwise.*
Fix: restore the affordance, or answer the question in copy and stop promising it.

**F2 · page 13 · blocking · high · CONFIRMED** — The two-axis surface is the deck's invention and
the disclosure does not say so. `data/o1-scaling.json`'s own provenance records two *separate*
published charts with *unlabeled* relative compute axes; `twoAxisAccuracy`
([frontier.ts:12-22](web/src/lib/frontier.ts:12)) fuses them into `y = intercept + slope*(testExp
- (maxTrainExp - trainExp))`, i.e. one shared law in which train-time compute is a pure horizontal
shift with an identical slope. That joint structure is the page's thesis ("One law, two knobs",
[Page13.tsx:569](web/src/components/pages/Page13.tsx:569)) and appears in no source. The fidelity
note ([Page13.tsx:662-668](web/src/components/pages/Page13.tsx:662)) discloses exactly two
authored things: the ×1-to-×100 span and the +29.5 slope.
*A reader who reads the "authored redrawing · anchors verbatim" badge and then the fidelity note
concludes the shape of the family is OpenAI's finding and only the axis units are the deck's,
which is wrong because the far stronger authored claim, that the two axes obey one law at all, is
not disclosed anywhere.*
Fix: name the joint surface itself as authored, not just its span and slope.

**F3 · page 13 · blocking · high · CONFIRMED** — The waterfall composes three parallel
measurements into an additive stack. Rows print `+8.9` for voting and `+9.7` for re-ranking, each
starting where the previous ended ([Page13.tsx:436-473](web/src/components/pages/Page13.tsx:436)).
`o1-scaling.json`'s provenance reports the three as alternatives for the same model: 74.4 pass@1,
83.3 with consensus among 64 samples, 93 re-ranking 1000 samples with a learned scorer.
*A reader who reads "+ page 8's re-ranker · a learned judge picks from 1000 chains · +9.7 · = 93%"
concludes o1 reaches 93% by running a re-ranker on top of the 64-way consensus, which is wrong
because re-ranking 1000 samples is an alternative to cons@64, not a layer on it, and the +8.9 and
+9.7 increments exist nowhere in the source.*
Fix: draw the three as parallel readings, not as a stack. **This is a prerequisite for page 15**,
whose first courtroom case teaches that the 74.4-vs-93 gap is a coordinate change.

**F4 · page 8 · blocking · high · CONFIRMED** — An unmeasured value is plotted at zero on a
measured axis and then captioned as a measurement. `page-08-derived.json`'s
`manifest.verifiers[4]` carries `solves_these_items: null`, `solves_source: "unmeasured"`;
`page08.ts` keeps it `null`; [Page8.tsx:504](web/src/components/pages/Page8.tsx:504) does
`x(j.solves ?? 0)`, placing it at 0% on the axis "what the judge solves on its own (%)"; the
figcaption ([Page8.tsx:750-752](web/src/components/pages/Page8.tsx:750)) hardens this into "which
cannot solve a single one of these problems".
*A reader reads a plotted point at zero on a measured axis and concludes the deck measured a 0%,
which is wrong because the run says nothing was measured. This is the only judge above the vote
line, so the page's whole "solving is not judging" thesis rests on it.*
Fix: draw it off-axis or as not-applicable and reword the caption to what the run supports (no
generative head).

**F5 · pages 2-3 · blocking (for the argument) / major (as a page defect) · high · CONFIRMED** —
The Act 1 → Act 2 pivot rests on a false dichotomy that page 2's own figure already broke. Page
2's System 2 comic draws "memory ✗ / source ✓" and a fetched document
([System2Comic.tsx:87-122](web/src/components/pages/System2Comic.tsx:87)) and panel 4 counts
2010, 2023 **and 2026** as an accomplished "Three."; the trace's own step 3 says "check a current
source before committing" ([authored.ts:214-217](web/src/lib/authored.ts:214)). Page 3 then opens
"the obvious way to supply it is to train the model again" and closes "which leaves **only** what
it does after it" ([Page3.tsx:561-566](web/src/components/pages/Page3.tsx:561)). I grepped the
whole of `web/src`: "retriev", "web search" and "look it up" appear nowhere in rendered copy; the
only hit is a non-rendered `constraintLabel` string ([authored.ts:126](web/src/lib/authored.ts:126)).
*A reader who just watched panel 3 fetch a document reads "only" and knows it is false, so the
pivot into Act 2 reads as the deck steering past the obvious answer. Compounding it: page 2's
prose correctly says thinking cannot conjure a missing fact ([Page2.tsx:283-290](web/src/components/pages/Page2.tsx:283))
while the figure beside it shows the gap being closed, and the figure is what a reader remembers.*
Fix: name retrieval once and say why it is out of scope, and make the comic stop closing the gap
the prose says thinking cannot close. **This is the deck's most important structural finding: the
spine's THEREFORE is not earned by Act 1's own evidence, because no lever in Act 2 gets Spain's
count right and no page says so.**

### Major

**F6 · page 13 · major · high · CONFIRMED** — "They do not substitute" is contradicted by the
page's own law and its own Try-it note. Under `twoAxisAccuracy` the two exponents enter as a sum,
so they substitute exactly. I ran the numbers: train ×1 / thinking ×100 gives 21.0, and train ×100
/ thinking ×1 gives 21.0. The Try-it note tells the reader to do the first half
([Page13.tsx:672-677](web/src/components/pages/Page13.tsx:672)) and the copy says "the two dials
pay the same +29.5 per decade, but they do not substitute" (`:654-661`).
*A reader who follows the instruction, then tries the mirror setting, observes perfect
substitution and concludes they have misread the chart.*
Fix: say what is actually true of the parametrization, or change the parametrization.

**F7 · page 7 · major · high · CONFIRMED** — Page 7 asserts the opposite of what page 6 measured
on the same checkpoint and the same 100 items. [Page7.tsx:763-765](web/src/components/pages/Page7.tsx:763):
"page 6's chain stops on its own and even when given more tokens, will refuse to continue." Page
6's wait-injection run has the 3B continuing: mean tokens 693.0 → 1251.8 across three injections
(`page-06-derived.json` `figure_wait.curves[0].points`, verified directly).
*A reader who read page 6 two pages earlier meets a flat contradiction and cannot tell which page
to believe.* The claim page 7 needs is that continuing does not *help*, which is what page 6
measured.

**F8 · page 10 · major · high · CONFIRMED** — The page calls the model's own likelihood "a
verifier" three times, and its own engine says the opposite.
[Page10.tsx:415-420](web/src/components/pages/Page10.tsx:415) ("a verifier scores unfinished lines
while they are being written"), `:631`, `:670`; against
[thoughtSearch.ts:16-21](web/src/lib/thoughtSearch.ts:16): "`score` is what the SEARCHER sees: the
model's own confidence ... **It never verifies anything** ... That blindness is the whole point."
*A reader who learned on page 8 that a verifier is a second model trained to judge concludes page
10 demonstrates one inside the search loop. There is none, and the page's own punchline (the rhyme
the likelihood passed over) requires there not to be one.*
Fix: call it the model's own confidence in those three places.

**F9 · page 11 · major · high · CONFIRMED** — "Thinking amplifies competence; **only parameters
create it**" ([Page11.tsx:991](web/src/components/pages/Page11.tsx:991)) carries no hedge and is
refuted by the next page, which describes itself as "the first knob that lifts the curve without
buying a single parameter" ([Page12.tsx:618-622](web/src/components/pages/Page12.tsx:618)).
*A reader who takes the bolded sentence as the act's conclusion turns the page and is told the
opposite, with no signal that the first sentence was provisional.*
Fix: hedge that sentence the way the handoff block already hedges its twin (see Refuted R5).

**F10 · page 9 · major · high · CONFIRMED** — The page calls unjudged steps *sound* two inches
from a margin note saying it must not. [Page9.tsx:563](web/src/components/pages/Page9.tsx:563)
("including the 3 that **were sound**") and `:571` ("the 3 line(s) before the break **stand**")
against the margin note at `:598-602` ("Nothing underlined means nothing computable, not nothing
wrong"). Steps 0 and 1 of both specimens carry `check: "unknown"`, and across the run 17,680 of
18,772 steps are unknown against 1,016 true, so this is the normal case.
*A reader is told that lines the checker never read were sound, which is precisely the inference
the page exists to forbid.*

**F11 · page 9 · major · high · CONFIRMED** — The PRM's 19.5% rests on a threshold fitted against
the checker's own labels and the page never says so. `page-09-derived.json`
`prm_reliability.threshold_source`: "fitted on the checker's labels ... the one with the highest
specificity", with a `threshold_plateau` of seven near-equivalent cut-offs spanning a quarter of
the score range. The page presents 19.5% beside the checker's 0.67% as a second instrument
([Page9.tsx:661-667](web/src/components/pages/Page9.tsx:661)).
*A reader treats the two bars as two independent estimates of the same quantity, which is wrong
because one was calibrated against the other.* Page 7 discloses exactly this species of caveat
about its own fitted temperature; page 9 does not.

**F12 · page 8 · major · medium · CONFIRMED** — The headline instrument was re-implemented and the
page does not say so. `manifest.verifiers[4].loaded_as`: "rebuilt on transformers' Qwen2 body plus
the checkpoint's value head; the checkpoint's own modelling code returns NaN under this
transformers version." Every headline number on the page (43% → 60%, 21 fixed / 4 broken,
p = 0.0009) comes from that reconstruction; the page discloses the model id and the final-token
read and nothing else.
*A reader concludes the published Skywork PRM was run as published.*

**F13 · page 6 · major · high · CONFIRMED** — The bolded payload sentence subtracts across two
populations and prints a wrong count. [Page6.tsx:1502-1509](web/src/components/pages/Page6.tsx:1502)
renders `neverFlipCount - censoredCount` = 51 − 6 = **45**. I checked the run directly: 51 items
are never solved, 6 are truncated at the top budget, and only **5** of those 6 are among the
never-solved (`test/algebra/2391.json` is truncated but is solved at 1024). The correct count is 46.
*A reader who counts the red squares left of the line at the top budget finds 46 and the sentence
says 45.*
Fix: compute the intersection, not the difference of two totals.

**F14 · page 14 · major · medium-high · CONFIRMED** — The lede attributes R1-Zero's property to
R1. [Page14.tsx:863-872](web/src/components/pages/Page14.tsx:863): "In January 2025 DeepSeek
published all of it ... trained with **no worked examples at all**", on a page titled
DeepSeek-R1. Only R1-Zero had no SFT warm-up; section 1 opens correctly on R1-Zero
([Page14.tsx:885-887](web/src/components/pages/Page14.tsx:885)), and the correction ("the released
R1 adds a small cold start of curated traces") arrives ~700 words later at `:1129-1131`, never
joined to the lede.
*A reader takes away the page's most quotable claim and it is false for the model in the title.*

**F15 · page 14 · major · high · CONFIRMED** — The closing block attaches "level with o1-0912" to
the wrong number. [Page14.tsx:1171-1176](web/src/components/pages/Page14.tsx:1171): "71.0% on
AIME, level with o1-0912". The page states it correctly earlier ("Add page 7's majority vote
across 64 samples and it reaches 86.7%, level with OpenAI-o1-0912",
[Page14.tsx:1024-1029](web/src/components/pages/Page14.tsx:1024)).
*A reader concludes R1-Zero's single-chain pass@1 matched o1-0912, which is wrong because the
match required 64 samples and a majority vote, roughly 64× the answer-time compute. This is the
sentence the reader carries into page 15.*

**F16 · page 14 · major · high · CONFIRMED** — The divergence argument rests on two authored
shapes and the footer discloses one. Only the endpoints 15.6 and 71.0 of the accuracy series are
real; the length series has no intermediate data at all and is a straight line
([Page14.tsx:398](web/src/components/pages/Page14.tsx:398)). The footer
([Page14.tsx:1183-1190](web/src/components/pages/Page14.tsx:1183)) discloses only the accuracy
interpolation.
*A reader who scrubs, watches the green curve bend while the blue one keeps going, and reads
"Length is not a schedule anyone set" concludes DeepSeek measured that divergence. The underlying
claim is defensible (the paper's Fig 3 shows near-linear length growth) but the on-screen
provenance does not cover the series the argument leans on hardest.*

**F17 · page 13 · major · medium-high · CONFIRMED** — "Confirmed frame only" badges three station
labels that were not confirmed. The badge ([Page13.tsx:498-500](web/src/components/pages/Page13.tsx:498))
and figcaption (`:543`, "The shape is the whole of what was confirmed") sit above sub-labels
making specific mechanism claims: "generate ×k — k sampled chains explore instead" (`:521-525`)
and "reinforce — this updates the current model, so gains compound" (`:533-537`).
*A reader who trusts the badge concludes OpenAI stated o1's training samples k chains per problem
and reinforces in place. Those are inferences from the phrase "reinforcement learning", and they
are the class of unconfirmed specifics the page cut its rumored recipe to avoid.*

**F18 · page 13 · major · medium · CONFIRMED (partly opinion)** — The page's one predict-observe-
explain moment is narrated four times before the reader can act: in prose before the chart
(`:593-599`), as static staircase labels on it (`:345-366`), in the fine print under it
(`:603-607`), and in the closing line (`:654-661`). Only then does the margin note say "drag"
(`:672-677`).
*A reader reaches the sliders holding the conclusion and drags to confirm, not to discover, which
is the decoration failure mode this venue penalizes.* Page 14 has a "setup before, meaning after"
guard pinned in test; page 13 has none. Opinion component: which of the four to cut.

**F19 · page 11 · major · high · CONFIRMED** — The Pythia ownership bands assert a crossing the
digitization cannot resolve. `ownershipBands`
([Page11.tsx:450-480](web/src/components/pages/Page11.tsx:450)) emits hard band boundaries and a
"12B leads" label from points the page itself calls read by eye at ±3 points (`:1084-1086`;
`PROVENANCE.md:54` adds ~1.5× on FLOPs). At the 2.8B/12B handover the two series are ~0.6
accuracy points apart.
*A reader reads a dashed rule and a shaded band as a measured compute-optimality crossing; it sits
inside the stated digitization error by a factor of five.*

**F20 · page 3 · major · high · CONFIRMED** — Half the page's assigned concept gets one paragraph,
no figure and no interaction. [Page3.tsx:558-570](web/src/components/pages/Page3.tsx:558) is the
entire treatment of "none of it touches the bias", against two charts, two sliders, four sub-heads
and a meter for the other half.
*A reader who arrives holding page 2's question ("Are knowledge biases addressable by System 2
thinking?") gets assertion with nothing to manipulate and no evidence, on the one claim
[pages.ts:52](web/src/lib/pages.ts:52) names as a co-equal half of the page.*

**F21 · page 3 · major · medium-high · CONFIRMED** — The frontier curve's legend names a $191M
model for a curve that starts at $78M. [Page3.tsx:300-303](web/src/components/pages/Page3.tsx:300)
labels the secondary series "e.g. Gemini Ultra at $191M"; `frontierCumulativeUSDM`
([dailyTraining.ts:24-28](web/src/lib/dailyTraining.ts:24)) starts from `RUN_COST_USDM` = 78.
*A reader who compares the two curves at month 0 sees them coincide and cannot reconcile that with
a legend naming a model costing 2.4× more.*

**F22 · page 3 · major · medium · CONFIRMED** — Wall (d), data exhaustion, does not bear on the
plan walls (a)-(c) describe. [Page3.tsx:406-417](web/src/components/pages/Page3.tsx:406) argues
from Chinchilla that a **bigger** model only pays off if it also **reads more**, therefore the
~300T stock is the ceiling. Closing a knowledge gap needs no bigger model; the page itself prices
the retrain-the-same-model arm at a flat $78M.
*A reader who follows section 1 as a list concludes "we can't retrain daily because we will run
out of text", which is wrong: (d) is a wall against continued capability scaling, not against
refreshing facts, and the page never supplies the missing premise.*

**F23 · page 2 · major · high · CONFIRMED** — The cutoff slider has ~120 positions and 2 reachable
outputs. `CUTOFF_MIN` = Jan 2017, `CUTOFF_MAX` = Dec 2026
([Page2.tsx:51-52](web/src/components/pages/Page2.tsx:51)); `DEFAULT_READING_FINALS` supplies only
the men's finals (2010, 2026), and 2010 precedes the range, so `known` is 1 everywhere before Jul
2026 and 2 after. `SPAIN_MACHINE_REPLIES[0]` is unreachable.
*A reader who drags the handle across nine years of track sees the reply, the badge and the gap
count frozen, and concludes either that the control is broken or that training date is not what
drives the answer, which is the opposite of the page's thesis.*

**F24 · page 2 · major · high · CONFIRMED** — The model's replies are authored and presented as a
model's output with no label. [Page2.tsx:116-132](web/src/components/pages/Page2.tsx:116) renders
a card headed "the model answers"; `authored.ts:109-113` states these are "an authored EXAMPLE of
the ideal System-1 blurt", and the provenance labels that exist for exactly this purpose
(`machine.label` "a small open model", `cutoffLabel`, `constraintLabel`) are referenced nowhere in
`Page2.tsx` (verified by grep).
*A reader concludes they are watching a real language model's output change as its cutoff moves.
There is no model; it is a three-element string array.* Pages 3 and 4 both carry their
derived/authored labels, so page 2 is the outlier.

**F25 · page 2 · major · medium-high · CONFIRMED** — See F5; the comic closes the gap the prose
says thinking cannot close. Kept as a page-2 defect distinct from the argument-level finding.

**F26 · page 1 · major · high · CONFIRMED** — The System 2 stopwatch measures click latency and
sits beside a hard-coded "instant". [Page1.tsx:170-172](web/src/components/pages/Page1.tsx:170)
renders a live `role="timer"` from `s2Ms`, started on the first "Work it out" press and stopped on
the last "Next step" press (`:70-84`); [Page1.tsx:124-126](web/src/components/pages/Page1.tsx:124)
puts the literal string "instant" in the visually identical chip on the System 1 panel.
*A reader who clicks fast reads "0.4 s" beside "instant" and concludes System 2 is barely slower;
a reader who dawdles reads "12.0 s" and concludes the page measured their thinking. Neither is
true: they never computed 17 × 24, and the two chips are not commensurable quantities in the same
slot.*

**F27 · page 4 · major · high · CONFIRMED** — The step counter contradicts the page's own claims
about which road is fastest. `maxStepOf` ([Page4.tsx:69-73](web/src/components/pages/Page4.tsx:69))
gives standard 4, lines 6, vedic 6, rendered as "step N of M" at `:496-498`, while `authored.ts`
calls standard "slow: every digit pair gets touched" and Vedic "the fastest road". `StandardPanel`
hides digit-level work behind three finished partial products; `VedicPanel` exposes every
cross-product and carry.
*A reader who does exactly what the lede tells them ("walk it to the end, then try another and
compare what they cost") reads 4 of 4 for standard and 6 of 6 for Vedic and concludes the school
algorithm is the cheapest road, the opposite of the limitation text. This is the only quantitative
comparison the page offers.*

**F28 · page 4 · major · high · CONFIRMED** — "Three roads, three tolls" never shows a toll. Step
2 ([Page4.tsx:518-551](web/src/components/pages/Page4.tsx:518)) renders three cards of name,
origin and a prose limit. No count, no time, no operation tally, no chart, under a heading whose
sub-label is "what each method is good at, and what it costs" and above a callout saying "each
road pays its own toll".
*A reader who accepts the invitation to compare costs finds nothing to compare.* The data exists
(3 partial products vs 5 diagonals vs 5 columns with stacked carries) and none is surfaced.

**F29 · page 4 · major · medium-high · CONFIRMED** — "The road changes; the answer does not" is
the premise Act 2 inverts. [Page4.tsx:545-549](web/src/components/pages/Page4.tsx:545) bolds
"Three journeys, one destination" and stipulates "Reasoning is inherently diverse pathfinding from
prior knowledge". Pages 7 and 8 are built on different attempts reaching *different* answers.
*A reader who internalises page 4 arrives at page 7 expecting sampled paths to converge, and page
7's premise reads as a contradiction of Act 1 rather than a development of it.* The real
difference (deterministic human algorithms vs stochastic samples from one model) is drawn nowhere
in Act 1. Cause is on page 4; the collision surfaces at 6|7.

**F30 · pages 13 and 14 · major · high · CONFIRMED** — Two Playwright specs target these pages
with content from the obsolete numbering.
[tests-e2e/act2search.spec.ts:4-20](web/tests-e2e/act2search.spec.ts:4) is titled "Act 2 search &
scaling (pages 11-14)", contradicting [pages.ts:46](web/src/lib/pages.ts:46), and looks for
`img[name=/coverage versus samples/i]` and `switch[name=/x-axis scale/i]` on /p/13 and
`slider[name=/budget on easy/i]` and `button[name=/compute-optimal policy/i]` on /p/14. I grepped
both page files: zero hits for all four selectors.
*A reviewer or CI run that executes the E2E suite gets two failures on pages that are fine.* The
axe loop in the same file is correct and should survive the fix.

**F31 · deck-wide · major · high · CONFIRMED** — `PROVENANCE.md` is wrong or absent for most of
pages 5-14, and it is the file `SUBMISSION.md:40` points reviewers at. Verified directly:
- Five files are assigned to pages that do not import them: `wei-cot-scaling.json` → 5,
  `self-consistency.json` → 6, `voting-plateau.json` → 7, `prm-vs-orm.json` → 9,
  `tree-of-thoughts.json` → 10. `grep -rl "curves.<name>" src/components/pages/` returns nothing
  for all five.
- No rows exist for `page-05-derived.json` through `page-09-derived.json`, the entire measured
  spine of Act 2 and the deck's strongest contribution. (They carry a `manifest` with run id and
  notebook/harness SHAs instead of a `provenance` string, so the "schema guarantee" at
  `PROVENANCE.md:19-22` does not literally hold for them either.)
- No rows for `tot-crosswords.json` or `neural-degeneration.json`, the only two data files page 10
  draws; nor for `star-cqa.json` (page 12's headline result), `chinchilla.json`,
  `epoch-dataset-projection.json`, or `deepseek-pricing.json`.
- Stale page attributions elsewhere: `epoch-training-costs.json` / `epoch-inference-prices.json` /
  `query-energy.json` → "4" (they drive page 3), `o3-preview.json` → 13 (unused there),
  `compute-optimal.json` → "11, 13" (rendered by 16 and 19).
*A reviewer who does what the file invites finds the record for five pages pointing at files those
pages do not use, and nothing at all for the deck's own measurement runs.*

**F32 · deck-wide · major · high · CONFIRMED** — `SUBMISSION.md` and the deck disagree in ways
that a reviewer reading the submission first will notice. Line 13 says "Twenty pages"; line 35
maps the collapse debate to P19, which was cut page 20's content; line 39 claims "Every on-screen
number traces to a cited primary source", which is false for pages 5-9 where every number is the
deck's own measurement (the claim *understates* the contribution); line 43's "±1.0 percentage
point" data-fidelity tolerance is false for page 11, whose section 3 is ±3 points by eye and whose
section 1 has no digitizable source at all ([allocator.ts:19](web/src/lib/allocator.ts:19)); line
53 lists page 6 among the live-inference pages, and page 6 runs no inference.
*A reviewer who reads it first and then opens the deck finds an artifact whose own claims about
itself do not hold.* Report the mismatch; do not treat the doc as the spec.

**F33 · page 14 · major · high · CONFIRMED — for the planned R1-distill pass** — Adding the
MATH-500 column breaks two shipped claims and one pinned assertion. `deepseek-r1-distill.json`
already carries it unused (`math1p5` 83.9 … `math70` 94.5, teacher 97.3). Verified consequences:
(1) the kink reverses — on AIME Llama-70B (70.0) sits left of Qwen-32B (72.6) and the page sells
that as its surprise ([Page14.tsx:211](web/src/components/pages/Page14.tsx:211), pinned at
[Page14.test.tsx:229](web/src/components/pages/Page14.test.tsx:229)), but on MATH-500 the order
flips (94.5 vs 94.3); (2) the band collapses — ~11 points across a 65× parameter range against a
97.3 teacher, so "the dots march right through the closed rules as size grows" does not exist on
that axis; (3) the closed-model rules cannot be drawn — there is no `gpt4oMath` or `o1miniMath` in
the file, so the section's payoff claim disappears.
Direction: the reversal is a *better* page if the page owns it (it is page 15's thesis arriving
early, from measurement). Rank the measured 1.5B-distill run on the deck's own 100-item MATH-500
harness (item-set hash `9ab2b579`, proposed in `finishing_touches/finishing_touches.md`) above
adding the published column: it is the only thing in 12-14 that would meet the standard pages 5-9
set.

### Minor

**F34 · page 1 · minor · high · WEAKENED** — The concept's causal variable is enacted but never
named. [pages.ts:50](web/src/lib/pages.ts:50) assigns "the size of the problem sets the thinking
time"; the page does contrast 3 × 4 against 17 × 24 with one step against three, so the mapping is
demonstrated, but the word "size" and any size→time relation appear nowhere in copy, and step 3
([Page1.tsx:216-221](web/src/components/pages/Page1.tsx:216)) frames the lesson entirely as
recognize-vs-build.
*A reader asked afterwards "what sets how long you think?" answers "whether you recognize it",
not "how big the problem is", so the variable page 6's token budget and page 11's difficulty bands
both spend is never introduced by name.*

**F35 · page 1 · minor · high · CONFIRMED** — Neither System is operated by the reader. Both
panels are reveals ([Page1.tsx:131-148](web/src/components/pages/Page1.tsx:131), `:175-184`); the
arithmetic is done for the reader. The sort game exercises *classification* of System 1/2, not the
felt cost of running System 2.
*A reader who taps through both panels experiences two reveal buttons, not two speeds, on a page
whose concept is "feel your own".*

**F36 · page 1 · minor · high · CONFIRMED** — System 1's panel labels recognition as "Step #1"
([Page1.tsx:133-138](web/src/components/pages/Page1.tsx:133)) directly above "You didn't compute
it; you recognized it".
*A reader reading top-to-bottom sees recognition presented as a one-step computation and concludes
System 1 is a shorter System 2, which is the distinction the page exists to break.* The comment at
`:129-130` shows this was a vertical-rhythm decision.

**F37 · pages 1-4 · minor · high · CONFIRMED** — No prediction anywhere in Act 1. No `PredictBar`,
`Quiz` or guess input on any of the four pages (verified by grep), against `SUBMISSION.md:31`
("Most pages ask the reader to predict before revealing data").
*Predict-observe-explain has no expectation-violation moment anywhere in the act that exists to
build intuition.* The sort game's red flash is feedback, not elicited prediction.

**F38 · page 2 · minor · high · CONFIRMED** — The deck never marks System 1 / System 2 as an
analogy when applied to a model. [Page2.tsx:222-225](web/src/components/pages/Page2.tsx:222): "the
model gives an answer without thinking it through. System 1 thinking leads to an incorrect
response." Grep for "metaphor" / "analogy" / "analogous" across `web/src` returns zero.
*A first-year undergraduate with no ML background concludes language models literally possess
Kahneman's two systems.* One clause would discharge it.

**F39 · page 2 · minor · high · CONFIRMED, agreeing with `finishing_touches/page_2_concerns.md` §§2-4**
— The lede is two stacked rhetorical questions with **LLM** unexpanded and HHH cited but never
explained ([Page2.tsx:196-200](web/src/components/pages/Page2.tsx:196)); the widget arrives before
the paragraph defining "training cutoff" (`:208-220`); and the prose re-narrates the widget's own
badge (`:222-225`, `:250-252`). Neither "LLM" nor "model" is defined anywhere in Act 1. Page 1's
closing hook was added since that document, so half the seam is fixed and this half is not.

**F40 · page 2 · minor · high · WEAKENED** — Two green ✓ badges assert different totals on one
screen: "✓ current" when `gap <= 0` ([Page2.tsx:121-129](web/src/components/pages/Page2.tsx:121))
and "✓ all 3 titles" on the ideal answer (`:150-152`). The reviewer read this as self-contradiction;
it is not — the page resolves it one paragraph later ("Every answer above quietly counted only the
men's tournament") and that resolution is the page's best predict-observe-explain beat. The
surviving defect is narrower: both badges use the same green + ✓ affordance to encode two
different properties (currency vs completeness), so the setup risks reading as "correct" before
the reveal lands.

**F41 · page 2 · minor · high · CONFIRMED** — The closing pull quote hands off to page 4, not page
3: "That effort is the subject of the rest of this story"
([Page2.tsx:292-297](web/src/components/pages/Page2.tsx:292)) with a retraining page next. Page 3's
lede receives the seam correctly from its own side, so the mismatch is one-sided.

**F42 · pages 2-3 · minor · high · CONFIRMED** — The bias, which `pages.ts` names as half of page
2's concept, has zero interaction: `DEFAULT_READING_FINALS` contains only men's finals, so no
slider position ever displays the women's record.

**F43 · page 3 · minor · medium · WEAKENED** — The $45.5B headline is a deliberately absurd
hypothetical. The reviewer claimed it is unlabeled; it is not — the chart title says "retraining
the same GPT-4-class model daily", the marker reads "Drag through the first year of keeping the
plan up", and the sub-head is "The bill compounds". The surviving defect is the *generalization*:
the closing pull quote ([Page3.tsx:561-566](web/src/components/pages/Page3.tsx:561)) converts the
365-runs-a-year hypothetical into "Training-time scaling buys more facts, later, at compounding
cost", which the figure does not support at that strength.

**F44 · page 3 · minor · medium · CONFIRMED** — An empirical claim carries no citation and the
nearest one does not support it. [Page3.tsx:564-568](web/src/components/pages/Page3.tsx:564): "a
model settles on whatever its corpus says most, more text from the same world only **sharpens that
default**". No `Cite` is attached; the adjacent Zhao et al. 2018 reference is a WinoBias
benchmark + debiasing paper cited for *why* bias happens.
*A reader concludes there is published evidence that more training data makes bias worse.*

**F45 · page 3 · minor · medium · CONFIRMED** — Walls (b) and (c) are uncited assertions and (c)
ignores fine-tuning. "A training run takes weeks" ([Page3.tsx:385-389](web/src/components/pages/Page3.tsx:385))
carries no source; "There is no retraining for one missing fact. You buy the whole distribution to
obtain a single result" (`:391-395`) is stated absolutely, though targeted fine-tuning and model
editing exist.
*A reader who knows about fine-tuning concludes the page is arguing in bad faith, which costs it
credibility for wall (a), the load-bearing one.* "Buy the whole distribution" is also unglossed
jargon for the stated audience.

**F46 · page 3 · minor · high · CONFIRMED** — Em dash in rendered copy at
[Page3.tsx:539](web/src/components/pages/Page3.tsx:539) (`&mdash;`), the only one in pages 1-4.
Page 2's suite asserts the rule; page 3's does not. See F53.

**F47 · page 3 · minor · medium · CONFIRMED** — The projection readout and the crossing date read
as contradictory: at the 2028 marker the page prints both "By 2028 the trend points at ≈199T
tokens … That is 66% of the stock" and "the median crosses the stock in Jun 2028"
([Page3.tsx:462-484](web/src/components/pages/Page3.tsx:462)). Internally consistent only if
"2028" means 1 Jan 2028, which the page never says. `Page3.test.tsx:153-165` documents it as
intentional; the reader-facing wording still fails.

**F48 · page 3 · minor · high · CONFIRMED** — `TODAY_YEAR = 2026.5` is hard-coded
([Page3.tsx:120-121](web/src/components/pages/Page3.tsx:120)) as the marker on the data-window
meter and will silently misplace itself a year after deployment. Also: the comment at `:322` says
"$17.9B" where the computed month-12 difference is $17.1B.

**F49 · page 3 · minor · medium · CONFIRMED** — "Compute per frontier run grows about 5x a year"
([Page3.tsx:373-374](web/src/components/pages/Page3.tsx:373)) attributes the language-model figure
(~5.0×/yr) to the frontier, for which the source records 4-5×/yr. The same figcaption then derives
the ×2.4 bill from it via "Cheaper hardware absorbs part of that", a causal bridge that is the
deck's own and is in neither source.

**F50 · page 4 · minor · high · CONFIRMED** — The footnote calls back to something page 1 does not
show. [Page4.tsx:575](web/src/components/pages/Page4.tsx:575): "the destination 223,300 is page
1's **round 3**". Page 1 imports `SYSTEMS`, not `GAME_ROUNDS`
([Page1.tsx:8](web/src/components/pages/Page1.tsx:8)), and shows only 3 × 4 and 17 × 24;
`GAME_ROUNDS[2]` (350 × 638) appears nowhere on it. Root cause: the ceiling round was cut from
page 1 and `authored.ts:48-54` still documents a three-size `SYSTEMS` that has two entries.

**F51 · page 4 · minor · medium · CONFIRMED** — "Three cultures" overstates the provenance of at
least one method. Body copy says "three cultures worked it three different ways"
([Page4.tsx:428](web/src/components/pages/Page4.tsx:428), `:558-560`) while the hedges that would
qualify it (line multiplication "commonly taught as a Japanese technique"; Tirtha 1965 for the
Vedic sutra) sit in the footnote and margin note.
*A reader concludes all three are historically attested traditional algorithms.*

**F52 · pages 5-11 · minor · high · CONFIRMED** — Accessibility announcement stops at page 6.
`aria-live` count by page: 5→1, 6→1, 7→0, 8→0, 9→0, 10→0, 11→0. Pages 9, 10 and 11 carry the three
largest state changes in the act (the grader reveal, the search replay, the two knobs); only page
10's bill card and page 11's verdict box use `role="status"`.
*A screen-reader user presses "Reveal what the graders found" on page 9 and the entire trace block
is replaced with nothing announced.*

**F53 · deck-wide · minor · high · CONFIRMED** — The em-dash rule is enforced by test on pages 5-9,
13 and 14 and broken in rendered copy on pages 3 and 12 (page 12: `:92`, `:95`, `:486`, `:580`).
Pages 15-19 break it heavily; see the companion file.
*A reader crossing 11 → 12 sees the punctuation style change mid-act.*

**F54 · page 5 · minor · high · CONFIRMED** — The Limits margin note prints the run's raw condition
key and a bare adjective: "6% of the **bare** traces hit the token cap, which biases the headline
**conservative**" ([Page5.tsx:981-984](web/src/components/pages/Page5.tsx:981)).
*A reader who has met exactly two names on this page ("reasoning" / "non-reasoning", enforced
everywhere else per the file's own rule at `:114-116`) reads "bare" and concludes there is a third
arm, and "biases the headline conservative" gives no direction.*

**F55 · page 5 · minor · medium · CONFIRMED** — The Kojima citation is attached to a string Kojima
did not publish: "appending *Explain step by step.*"
([Page5.tsx:626-629](web/src/components/pages/Page5.tsx:626)) comes from the deck's own manifest;
the paper's trigger is "Let's think step by step."
*A reader who follows the marker finds a different phrase and concludes the deck quotes loosely.*

**F56 · page 5 · minor · medium · CONFIRMED** — Step 4's boldest sentence rests on the page's
weakest result: "The working is worth more than 4.7 times the parameters · p = 0.043, 18 problems
one way and 7 the other" ([Page5.tsx:961-969](web/src/components/pages/Page5.tsx:961)), against
the suppression headline's p = 1.7e-08.
*A reader takes it as a reliable finding when two problems moving would unresolve it.* The p-value
is shown; the sentence carries no hedge.

**F57 · page 5 · minor · medium · opinion · CONFIRMED as opinion** — No predict-observe-explain
moment. The gag switch is a reveal: the paragraph above it already says what will happen
([Page5.tsx:825-832](web/src/components/pages/Page5.tsx:825)). The interaction is not decoration
(the discordant counts are genuinely withheld) but the reader's expectation is never put at risk.

**F58 · page 6 · minor · high · CONFIRMED** — The legend entry "still running at 2048, so its
length is a floor (6)" ([Page6.tsx:1465-1468](web/src/components/pages/Page6.tsx:1465)) draws the
never-solved swatch, but `LengthStrip` colours gutter squares by `everSolved`, so the named gutter
contains one `fill-compute` square (the algebra item solved at 1024).
*A reader matching swatch to gutter finds a colour the legend does not name.* Same root cause as
F13.

**F59 · page 6 · minor · medium · CONFIRMED** — `medianLengthNever` includes the 5 censored chains
whose `tokens_at_max` is a lower bound, and the page quotes it as a measured length ("a median of
677 tokens for the ones that never come right",
[Page6.tsx:1502-1505](web/src/components/pages/Page6.tsx:1502)). Excluding them gives 655.
[page06.ts:652-656](web/src/lib/page06.ts:652) promises the opposite ("the page never averages
them in with the measured ones").

**F60 · page 6 · minor · medium · CONFIRMED** — The reliability inset compares a measurement with
a tautology: "Held to the same 512 by `max_new_tokens`, it overran on none"
([Page6.tsx:1357-1362](web/src/components/pages/Page6.tsx:1357)). A hard cap of 512 cannot produce
an overrun of 512, and the two arms were measured at different caps (2048 vs 512).
*A reader concludes the cap is empirically more reliable than the request.*

**F61 · page 6 · minor · medium · CONFIRMED** — Step 4 states an unresolved null as a mechanism.
None of the three checkpoints' wait-injection crossings resolves (3B p = 1.0, 1.5B p = 0.804, 7B
p = 0.549), yet [Page6.tsx:1596-1604](web/src/components/pages/Page6.tsx:1596) concludes "It
**redistributes rather than adds** … the model was not holding back."
*A reader takes a three-way null as a demonstrated account of what the model was doing.*

**F62 · page 6 · minor · low · CONFIRMED** — "Roughly double the tokens" is wrong for one of three
checkpoints: 3B 1.8×, 1.5B 2.2×, 7B 1.55×.

**F63 · page 6 · minor · medium · CONFIRMED** — Figure 2's slab annotation "past here, doubling
stops paying" ([Page6.tsx:406-410](web/src/components/pages/Page6.tsx:406)) is keyed to the 3B's
last gain but reads as a statement about the figure; inside that slab the 7B rises 59 → 60.

**F64 · page 7 · major · medium · CONFIRMED (structural; flagged under the wording-only
constraint)** — On the one page whose subject is what happens as you add voters, the reader cannot
add a voter. The only control is a disclosure that opens a tally row
([Page7.tsx:146-186](web/src/components/pages/Page7.tsx:146), `:565`); N, temperature and the
counting rule are fixed and all three charts are static.
*A reader who wants to test "does the vote still beat one chain at N = 4?" has no control and must
read a static line.* Thinnest interaction in 5-11 and the weakest against criterion 4.

**F65 · page 7 · minor · medium · CONFIRMED** — The temperature claim is denied by the data two
lines above it. [Page7.tsx:706-710](web/src/components/pages/Page7.tsx:706): "past T = 0.3 each
chain gets worse faster than the vote recovers it", while `figure_2.diversity` gives plurality
accuracy 0.4667 at both T = 0.3 and T = 0.6. The same tie means the stated selection rule
("picked by which value voted best on 30 items", `:807-811`) does not determine T = 0.3.

**F66 · page 7 · minor · low · CONFIRMED** — "there is no cheaper way to buy it"
([Page7.tsx:763](web/src/components/pages/Page7.tsx:763)) is an unbounded claim from a two-arm
experiment (capped-split vs uncapped).

**F67 · page 8 · minor · high · WEAKENED** — Figure 3's x-axis mixes provenances with no note.
Verified against the manifest: **three** judges' `solves` are page 6's greedy accuracies (0.43,
0.22, 0.60), one is measured in this run under sampling (0.64), one is unmeasured (F4). The
reviewer said four; the count is three.
*A reader compares six x-positions as if they were one measurement made one way.*

**F68 · page 8 · minor · medium · CONFIRMED** — "One chain" has two values on the same page: the
lede and figure 2's baseline use 43% (`paired.baseline_accuracy`) while `CurvePanel`'s flat "one
chain" line sits at 45.6% (`figure_1.lines`).
*A reader may read the 3-point gap as the effect of something.*

**F69 · page 8 · minor · medium · CONFIRMED** — "the heuristic scorer from **the source we build
on**" ([Page8.tsx:701](web/src/components/pages/Page8.tsx:701)) is never named or cited on the
page, yet it owns a row of the main evidence figure and two sentences of the figcaption.

**F70 · page 8 · minor · medium · CONFIRMED** — Two of the five judges are stronger solvers than
the writer they judge (0.60 and 0.64 against the 3B's 0.43). The run records this per verifier and
carries a dedicated gate (`best_of_n_beats_counting_without_a_stronger_generator: false`); the
page mentions none of it.
*A reader takes "the biggest judge did not help" as evidence about judging, when the judges'
relationship to the generator was never held fixed.*

**F71 · page 8 · minor · medium · CONFIRMED** — Figure 3's caption asserts and withdraws in the
same paragraph: bold "Being good at the problems is not being good at judging them", then "the
bars overlap, no pair of judges here is resolved"
([Page8.tsx:746-760](web/src/components/pages/Page8.tsx:746)). The bold claim's sharpest support
is the one point that was not measured (F4).

**F72 · page 9 · major · high · WEAKENED** — The headline detection rate is drawn in the unit the
run itself calls the wrong one. `detection` records `base_rate` 0.0067 (5 of 747 right chains),
`problem_rate` 0.0513 (4 of 78 problems), and `unit_of_independence: "the problem; the chain rate
is clustered within problems"`; the page draws 0.67%
([Page9.tsx:658](web/src/components/pages/Page9.tsx:658)). The reviewer called it an eightfold
understatement presented as the rate; the page does hedge it as "a floor, not a rate". The
corrected form: the hedge names *sample size* ("with only 5 chains it undercounts") and not
*clustering*, so a reader is warned about precision and not about the unit, and the run's own
stated independent unit is never shown.

**F73 · page 9 · minor · high · CONFIRMED** — The localisation point estimate lies outside its own
stated band. [Page9.tsx:672-682](web/src/components/pages/Page9.tsx:672) reports a 36.7% median
share sound over 44 chains "moved by up to 25 points" by re-segmentation, but
`segmentation_sensitivity` ran on a 400-chain subsample (8-9 localisable chains) whose four
segmentations give 0.50 / 0.50 / 0.605 / 0.75 — nothing below 50%.
*A reader treats 37% as the centre of a ±25 band; re-segmenting never produced it.*

**F74 · page 9 · minor · medium · CONFIRMED** — All three specimens are unrepresentative of the
bar the page draws: in Lucky, Broken and Clean the PRM scores every step ≥ 0.94, i.e. flags
nothing, while step 3's figure says it flags 19.5%.
*A reader who works all three chains concludes the PRM never disagrees, then meets a 19.5% bar
with no bridge.*

**F75 · page 9 · minor · low · CONFIRMED** — `trace.firstFalse ?? 0` is an **index** used as a
**count** of sound steps ([Page9.tsx:563](web/src/components/pages/Page9.tsx:563)). It coincides
for these specimens; any chain whose first false step is at index 0 renders "including the 0 that
were sound".

**F76 · page 10 · minor · medium · CONFIRMED** — Act 2's re-derivability guarantee stops at page
10. Pages 5-9 each carry a notebook download and `web/public/notebooks/` holds five zips; page 10
has none, has no measured data of its own (the 29-word tree and its probabilities are hand-authored,
[Page10.tsx:662-665](web/src/components/pages/Page10.tsx:662)), and
`notebooks/page_10_search_arm.ipynb` exists but is neither packaged nor linked. Page 11 is in the
same position (`page_11_training_vs_scale.ipynb`, arm 0 run and gate-passed per
`finishing_touches/page_11_concerns.md`).
*A reader trained by five consecutive pages to download and re-derive arrives at the act's search
and keystone pages with nothing to check.*

**F77 · page 10 · minor · medium · CONFIRMED** — "It is also **the more expensive half**"
([Page10.tsx:712-713](web/src/components/pages/Page10.tsx:712)) about backtracking vs pruning:
nothing on the page prices either, and `tot-crosswords.json` carries word-success percentages only.

**F78 · page 10 · minor · medium · CONFIRMED** — "The two middle bars are the ones that matter"
([Page10.tsx:684](web/src/components/pages/Page10.tsx:684)) sits above a five-bar list whose
middle-by-position bars are chain-of-thought and no-backtracking, while the prose afterwards is
about bars 3 and 4.

**F79 · page 10 · minor · medium · CONFIRMED** — The page concedes only that breadth-first cannot
be run on a real model ([Page10.tsx:679-682](web/src/components/pages/Page10.tsx:679)). The deck's
own search-arm notebook says depth-first and MCTS also do not survive contact with a real
reasoning tree, and that of the five only beam does.
*A reader leaves believing depth-first search over thoughts and MCTS over thoughts are practical
levers.*

**F80 · page 11 · minor · high · CONFIRMED** — The first ownership band claims compute-optimality
where only one series has data. `seriesAt` returns `null` outside a series' x-range, so between
x = 1.5 and x = 8 the 2.8B and 12B are undefined and `leaderAt` declares the 410M leader by
default; `bands[0]` then paints "410M leads" out to x = 1, and the last band runs to x = 4096 past
the 12B's last point at 3000.

**F81 · page 11 · minor · medium · CONFIRMED** — "three real models (Pythia 410M, 2.8B, and 12B)
stand in for the game's **1×, 2× and 4×**"
([Page11.tsx:1066-1070](web/src/components/pages/Page11.tsx:1066)). The real ratios are 1× / 6.8× /
29× and the game's family is 1/2/4/14.
*A reader who trusts the stated correspondence carries the game's 14× dot into the measured chart,
where nothing corresponds to it.*

**F82 · page 11 · minor · medium · CONFIRMED** — The Shojaee "collapse" result is stated without
hedge ("past a complexity threshold even models trained to think collapse no matter the budget",
[Page11.tsx:1039-1041](web/src/components/pages/Page11.tsx:1039)) from a 2025 preprint, in a deck
that cut the page that was to debate it.
*A reader takes a heavily contested claim as settled and the deck no longer contains the
counterweight it planned.* Residue of the page-20 cut landing on page 11.

**F83 · page 11 · minor · high · CONFIRMED, agreeing with `finishing_touches/page_11_concerns.md` §4**
— FLOPs denominates the entire page and is never glossed for a reader with no ML background; first
use is the lede ([Page11.tsx:862](web/src/components/pages/Page11.tsx:862)), then every axis label
and scoreboard cell.

**F84 · page 11 · minor · medium · CONFIRMED** — The difficulty control changes which problem
population the reader faces, not how they allocate; the act's "allocate by difficulty" lever
appears only as prose in the 4× panel caption
([Page11.tsx:1015-1018](web/src/components/pages/Page11.tsx:1015)).
*A reader who presses easy/medium/hard concludes that guessing difficulty first is what the knobs
do; the knobs never allocate.* This is the spine's weakest-served lever: every other one gets a
page and a control.

**F85 · page 11 · minor · medium · CONFIRMED, agreeing with `finishing_touches/page_11_concerns.md` §2**
— Section 1 is the act's only authored centerpiece, arriving straight after five measured pages.
The chart's own caption ("illustrative", `:888-894`) does more work than the "Simulated" footer
four sections below, so the disclosure is adequate where it counts and the problem is positional.

**F86 · page 12 · minor · high · CONFIRMED** — `star-cqa.json` is page 12's only source and has no
row in `PROVENANCE.md`; the JSON's own provenance field is complete and correct. Folded into F31.

**F87 · page 12 · minor · medium · CONFIRMED** — The handoff promises a bill page 13 does not
deliver: "the frontier, where one lab turns both kinds of spending at once and **bills you for
each**" ([Page12.tsx:624-629](web/src/components/pages/Page12.tsx:624)), pinned in test. Page 13's
only currency is accuracy points; the dollar bill is page 16's job.

**F88 · page 12 · minor · high · CONFIRMED** — The page's source docstring contradicts its own
test. [Page12.tsx:41-43](web/src/components/pages/Page12.tsx:41) states "this is the last page of
Act 2"; [Page12.test.tsx:179-182](web/src/components/pages/Page12.test.tsx:179) asserts "sits in
Act 3: page 12 opens the act, it does not close Act 2". Comment-level, but it is the artifact a
future editor will read.

**F89 · page 12 · minor · medium · opinion · CONFIRMED as opinion** — The page's only
violated-expectation candidate (a 6B model beating a 137B one) is disclosed in the section header,
in the bar notes and again in the figcaption
([Page12.tsx:577-588](web/src/components/pages/Page12.tsx:577)) with nothing asked of the reader
first.

**F90 · page 12 · minor · high · CONFIRMED (informational)** —
`notebooks/page_12_gate_specialist.ipynb` states its gate "exists to be answered before
`docs/page_12_refactor.md` is written"; `RUN_MODE` defaults to `"PLAN"` and there is no
`data/page-12-derived.json`. Page 12 is the only Act-2/3 boundary page whose content was decided
without its own measurement, which is why F1 has nothing to be interactive about.

**F91 · page 13 · minor · high · CONFIRMED** — The o1 dot is called "verbatim" and its x position
is authored. [Page13.tsx:159](web/src/components/pages/Page13.tsx:159) computes x by inverting the
authored law (≈ ×65); the fidelity note says "the dashed GPT-4o line and the o1 dot are verbatim"
(`:666-667`). Only the dot's y (74.4%) is published.

**F92 · page 13 · minor · medium · CONFIRMED** — Section 2 asserts as fact what section 4 says
nobody can know. `:585-588` states without hedge that "×100 thinking is one answer whose private
chain is allowed to run a hundred times as long, not a hundred sampled answers"; `:381-383` then
says "nothing visible from outside tells the two apart". The page's own header comment admits it
(`:104-105`); no on-screen word does.

**F93 · page 13 · minor · medium · CONFIRMED** — The ×1 curve's left end is a clamp artifact
(`floor = 1` in `twoAxisAccuracy`) presented as data: the run enters the plot at 1% and runs flat
for part of a decade.
*A reader reads it as "no amount of thinking helps an untrained model below some threshold", a
claim neither the page nor the source makes.*

**F94 · page 13 · minor · low · CONFIRMED** — "The missing RL's share" renders a `BigNumber` with
`prefix="+"` and no suffix (`:645-651`); the chart bracket says "the missing RL: +29.5".
*A reader may read it as a percentage share rather than accuracy points.*

**F95 · page 13 · minor · medium · CONFIRMED** — "one instant answer from a strong LLM (GPT-4o)"
([Page13.tsx:438-439](web/src/components/pages/Page13.tsx:438)) contradicts page 5, which
established that a 2026 instruct model writes a chain unasked. What the label means is "no
RL-trained long private chain".

**F96 · page 13 · minor · high · CONFIRMED** —
[starListing.tsx:3-9](web/src/lib/starListing.tsx:3) instructs "never fork this column" because
"page 13's diff is only honest if the left-hand side is exactly what the reader ran on page 12".
Page 13 no longer imports it. A future editor will preserve a constraint whose purpose is gone.

**F97 · page 14 · minor · high · CONFIRMED** — The page's most memorable reveal fires at an
invented threshold. `AHA_STEP = 5000` ([Page14.tsx:144-147](web/src/components/pages/Page14.tsx:144))
drives the dashed rule and the skeleton's stage change; the paper gives a behaviour at "an
intermediate version", not a step. Disclosed twice, which keeps it minor, but the single most
memorable interaction in 12-14 is the least evidenced element in them.

**F98 · page 14 · minor · high · CONFIRMED** — "within seven points of the 671B teacher"
([Page14.tsx:210](web/src/components/pages/Page14.tsx:210)) is arithmetically false: Qwen-32B 72.6
against teacher 79.8 is 7.2. The chart draws the teacher line precisely so this is checkable.

**F99 · page 14 · minor · medium-high · CONFIRMED** — "the best open reasoning model that existed
the week before" ([Page14.tsx:209](web/src/components/pages/Page14.tsx:209)) is unnamed, undrawn
and mistimed: the model is QwQ-32B-Preview at 50.0, present in the data file as `qwqAime` but
neither named in copy nor drawn as a rule, and it shipped roughly two months before R1, not a week.

**F100 · page 14 · minor-to-major · medium · CONFIRMED** — The dot plot's payoff sentence credits
the wrong mechanism: "a model you can download beats a closed frontier product **by thinking
longer at answer time**" ([Page14.tsx:1164-1169](web/src/components/pages/Page14.tsx:1164)). The
figure is a pass@1 table with no controlled thinking budget on either side, and the section's own
thesis two paragraphs above is that the *training* knob transferred.

**F101 · page 14 · minor · high · CONFIRMED (fact) / medium (defect)** — GPT-4o appears at 12% on
page 13 and 9.3% on page 14, both correctly sourced (OpenAI's own report vs DeepSeek's
measurement). Page 15 uses exactly this pair as a teaching case, so the discrepancy is planted.
*The defect, if any, is that neither page gives the reader a reason to hold the contradiction for
a page instead of discarding it and losing confidence in every other number.*

**F102 · page 14 · minor · medium · CONFIRMED** — "Page 12's recipe with a far stronger teacher"
([Page14.tsx:1127-1129](web/src/components/pages/Page14.tsx:1127)) drops the axis page 12's concept
turns on: STaR is a model becoming its *own* teacher; distillation is one model teaching a
different one.

**F103 · page 14 · minor · medium · CONFIRMED** — The dot plot's row targets are mouse-only:
`onClick` on a `<g aria-hidden="true">` inside a `role="img"` frame
([Page14.tsx:766](web/src/components/pages/Page14.tsx:766)). The chip row below is the accessible
path, so it is not an axe violation, but the header comment sells row-clicking as a feature.

**F104 · page 14 · minor · medium · CONFIRMED** — "fits on a phone"
([Page14.tsx:206](web/src/components/pages/Page14.tsx:206)) traces to nothing in
`deepseek-r1-distill.json` or the paper, and a 1.5B model at bf16 is ~3 GB, so the claim needs an
unstated quantization assumption.

**F105 · page 14 · minor · medium · opinion · CONFIRMED as opinion, disagreeing with a prior pass**
— `finishing_touches/finishing_touches.md` records page 14's Simulated/Cited footer as an
inconsistency against page 13's inline-only provenance and `docs/page_14_scaling_frame.md:258-261`
proposes dropping it. Given F16 and F2, page 14's footer is the *correct* pattern and page 13 is
the page with the disclosure gap. If uniformity is wanted, unify upward.

**F106 · page 12 · minor · high · CONFIRMED** — The page-5 measured callback page 12 was specced
to open on (`docs/page_12_citations_reorder.md:229-247`) was never built; `Page12.tsx` contains no
reference to page 5. Prior review already recorded the unmet dependency; the consequence is
visible on the shipped page as a missing frame.

## Act seams

**4|5 — holds structurally, leaks the plural.** Page 5's header comment names page 4's question
explicitly and answers it, and page 4 introduces no Act 2 jargon (enforced at
`Page4.test.tsx:26-29`), so the reader crosses without a vocabulary cliff. Two leaks. First, page
4 closes on **two** questions ("can we guide a machine down **different** roads?" and "why can't
it **chart its own road**?", [Page4.tsx:557-564](web/src/components/pages/Page4.tsx:557)); page 5
picks up only "can a machine be walked down **a** road", so the diversity question — page 4's
entire thesis — is dropped and is not answered until page 7, which never claims the inheritance.
The second question is orphaned for eight pages until STaR. Ironically page 5 *does* answer it (a
2026 instruct model charts its own road unasked) and does not say so. Second, the convergence
premise inverts across the act boundary (F29): page 4 concludes different roads reach the same
answer, and pages 7-8 are built on different attempts reaching different answers. Page 5 does not
sit on that fault line, so the collision surfaces at 6|7 and the fix belongs on page 4.

**11|12 — the content handoff is the best-built seam in the deck; the act turn does not happen.**
Page 11 closes on two named loose ends (the hard boundary, and the waste of discarding chains that
survived the check) and page 12 answers both with one move; the waste framing makes STaR feel
inevitable rather than announced. Two problems. First, F9: the unhedged "only parameters create
it" earlier on page 11 has to be retracted by page 12 rather than answered by it. (The handoff
block's twin sentence *is* hedged with "so far" and is fine — see Refuted R5.) Second, page 12
turns a second THEREFORE, not a BUT. That follows from the act definitions the deck itself states
([pages.ts:9-16](web/src/lib/pages.ts:9)) and is not a renumbering argument, but the reader gets no
signal that a boundary was crossed except a badge, and `Page12.test.tsx:172-174` forbids the page
from naming Act 3 at all. Deeper: Act 2 already delivers a ceiling on every lever (p6's 51% never
reached; p7's 23% thrown away and the fitted temperature; p8's free method tying the expensive one
at p = 0.45; p9's explicit selection null; p10's cost; p11's hard mode), so by page 12 the reader
has been shown two outright nulls and six ceilings. Act 3's "BUT" therefore reads as continuation,
not reversal. That is a more honest deck than its spine, and worth naming rather than fixing.

## Load-bearing strengths

Only what a decision depends on.

- **The measured spine of pages 5-9 is the submission's actual contribution.** Every headline
  number the reviewers spot-checked traced exactly: page 5's McNemar arithmetic and paired grid,
  page 6's curves, knee, truncation rates and inset overshoot, page 7's +12 / p = 0.0075 and the
  coverage 78 / vote 55 / thrown-away 23 triple, page 8's 21/4 at p = 0.0009 and the best-solver-
  ranked-last-as-judge result, page 9's rates, AUC and the 1-in-100 selection null. `SUBMISSION.md`
  currently *understates* this (F32). Whatever else changes, do not let a compression pass touch
  these runs.
- **Page 13 section 4's four open questions and its handoff**
  ([Page13.tsx:379-396](web/src/components/pages/Page13.tsx:379), `:779-784`) are the strongest
  structural device in 12-14: each is answerable only by an open model, page 14 answers all four,
  and the pairing is pinned on both sides. This is also page 13's real novelty claim; it is in no
  source paper. Do not let any fix for F2/F3/F17 touch either end.
- **Page 14's aha beat is the one landed predict-observe-explain moment in 12-14**: the reader is
  told "nothing in the reward mentions length"
  ([Page14.tsx:994-997](web/src/components/pages/Page14.tsx:994)) and then watches length climb
  anyway. It survives F97 (the invented threshold) only because the threshold is disclosed twice.
- **Page 11's allocator game is winnable as advertised** (medium crossed at 8 units against the
  14× model's 14; hard unreachable for 1× and 2×), so the Try-it note's two instructions both
  land. The section is authored, and its own caption says so where it counts.

## Refuted

- **R1 — "Page 3's $45.5B cost wall is an unlabeled hypothetical."** Partly refuted, kept as F43.
  The chart title says "retraining the same GPT-4-class model daily", the marker label reads "Drag
  through the first year of keeping the plan up", and the sub-head is "The bill compounds". The
  daily-retrain premise is on screen. Only the closing generalization overreaches.
- **R2 — "Page 2 contradicts itself with two green ✓ badges."** Refuted as a contradiction, kept as
  F40. Section 2 resolves it one paragraph later, and that resolution is the page's designed beat.
  The surviving defect is the shared green/✓ affordance encoding two different properties.
- **R3 — "Page 1 never makes its assigned concept."** Refuted as stated, kept as F34. The page does
  enact size→time (3 × 4 in one step against 17 × 24 in three); what is missing is naming it.
- **R4 — "Page 8's figure 3 mixes four page-6 values with two others."** Refuted on the count, kept
  as F67. The manifest shows three page-6 values, one measured in this run, one unmeasured.
- **R5 — "Page 11's handoff sentence 'the only way to change the weights is buying parameters' is
  refuted by Act 3."** Refuted. The sentence reads "**so far** the only way to change the weights
  is buying parameters" ([Page11.tsx:1141-1147](web/src/components/pages/Page11.tsx:1141)). "So
  far" is a narrative hedge scoped to the deck's own progress, and page 12 overturning it is the
  seam working as designed. The unhedged twin at `:991` is the real defect and is kept as F9. Do
  not touch the handoff sentence.
- **R6 — "Page 12 is badged Act 3 but written as Act 2's closer, and a reader concludes the badge
  is a rendering bug."** Weakened to F88 (a stale source comment) plus F87. The closing copy
  contrasts Act 2's spending with this page's, which is legitimate for an act opener, and
  `Page12.test.tsx:179-182` explicitly asserts the page sits in Act 3. The only reader-facing
  oddity is "Next comes the frontier" under a badge reading "Frontier & Caveats", which is
  defensible since 13-14 are the frontier labs.
- **R7 — "Page 11's claim that on hard problems no re-draw holds a right answer is refuted by page
  7's measured 78% coverage."** Weakened, not kept as a separate finding. Page 11's "hard" is its
  own authored difficulty tier ([allocator.ts:19](web/src/lib/allocator.ts:19), "No published
  per-difficulty curve fixes these exact numbers"), not page 7's MATH L4/L5 item set, so the two
  are not commensurable. `finishing_touches/page_11_concerns.md` §1 raises it and the wording is
  worth softening, but the deck is not denying its own measurement.
- **R8 — "`COMPUTER_SCRIPT` is dead data still under test."** Confirmed as a fact
  ([authored.ts:42-46](web/src/lib/authored.ts:42), consumed only by `act1.test.ts`) but it has no
  reader-facing failure, so it is not a finding. Noted here so it is not raised again.

## Coverage

**Read in full:** `pages.ts`; `Page1.tsx` through `Page14.tsx` and their `.test.tsx` siblings;
`SystemSort.tsx`, `System2Comic.tsx`, `Cite.tsx`, `PageNav.tsx`; `authored.ts`, `dailyTraining.ts`,
`curves.ts`, `frontier.ts`, `starListing.tsx`, `thoughtSearch.ts`, `allocator.ts`, `data.ts`;
`lib/page05.ts` and targeted sections of `page06.ts`, `page08.ts`, `page09.ts`;
`web/data/PROVENANCE.md`; `SUBMISSION.md`; `tests-e2e/act2search.spec.ts`, `act3.spec.ts`.

**Data verified numerically against the pages' rendered expressions:** `page-05-derived.json`
through `page-09-derived.json`, `tot-crosswords.json`, `rebase-pareto.json`,
`pythia-inference-scaling.json`, `neural-degeneration.json`, `star-cqa.json`, `o1-scaling.json`,
`deepseek-r1-training.json`, `deepseek-r1-distill.json`, `epoch-*.json`, `chinchilla.json`.

**Re-checked by the verifier directly** (not taken on the reviewers' word): F1, F2, F3, F4, F5,
F6, F7, F8, F9, F13, F14, F15, F16, F17, F21, F22, F23, F24, F27, F28, F30, F31, F33, F43, F46,
F50, F59, F67, F72, and every item in Refuted.

**Not verified:**
- **Rendered appearance.** No dev server, no browser, no Playwright run. Every layout, contrast,
  overlap, responsive and reduced-motion judgement is read off source. Where a finding depends on
  two elements *looking* alike (F26's two timer chips, F40's two badges, F58's legend swatch),
  the code fact is high confidence and the presentation claim is medium. F30 rests on static
  selector greps, not an observed test failure.
- **Primary papers.** Every number was checked against `web/data/*.json` and their `provenance`
  strings, i.e. against the deck's own record. F3, F14 and F15 rest on the deck's provenance
  contradicting the deck's copy, which is sufficient for those three. A factual proofread against
  arXiv:2203.14465, 2501.12948, 2502.06807, the o1 announcement and Zhao et al. 2018 remains open
  on the deck's own checklist (`SUBMISSION.md:74`).
- **The 2026 World Cup result** underpinning page 2's entire widget. `authored.ts:96-104` and
  `finishing_touches/page_2_concerns.md:40-41` record an external verification (Spain 1-0
  Argentina a.e.t., Torres 106'). We did not re-verify it and have no independent source. If it is
  wrong, page 2 and everything downstream fails.
- **Test-suite execution for pages 5-11.** Agent B read test names and greps but did not run
  `Page5-Page11.test.tsx`; it checked specifically that nothing pins F13's "45" and found nothing.
  Pages 12-14 tests and `frontier.test.ts` were run green (62/62).
- **Notebook execution.** No notebook was run. F90 rests on the absence of
  `data/page-12-derived.json` and on the notebooks' own markdown.
- **Page 11's live experiment.** Per the brief, only reasoning and citation problems are flagged
  there; no figure was treated as placeholder data.
