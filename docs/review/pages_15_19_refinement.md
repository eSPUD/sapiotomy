# Pages 15-19 — refinement

Reviewer: pages 15-19 against the five criteria plus keep/cut/merge and loop closure.
Verifier: every finding below was re-opened against the cited artifact and labelled
CONFIRMED / WEAKENED. Refuted items sit at the bottom.

## Verdict

The caveat arc works: 16 prices the levers, 17 breaks them, 18 shows the trace cannot be
trusted on its own, and each is a real "BUT" the spine promised. The failures are structural
rather than conceptual: three of the four internal seams (16|17, 17|18, 18|19) hand nothing
forward, page 17 contradicts its own measured result with its own simulation, and two
cross-references point at the wrong pages with a test pinning one of them. Page 19 does not
close the loop; it ends on a three-bound survey that points outward, and nothing after page 2
ever returns to the question the reader was actually asked. Interaction thins out badly toward
the end: page 19's steps 2 and 3 are prose recaps of pages 11 and 6, which is the deck's own
"do not retell the literature" rule broken twice in a row on the final page. The stretch is
recoverable inside the submission window, but page 17 must not ship as drafted and page 19
needs an ending written, not just tightened.

## Page 19 — does it close the loop

**It does not. It ends on a forward-looking survey.** CONFIRMED.

The last content block ([Page19.tsx:433-442](web/src/components/pages/Page19.tsx:433)) names
three bounds (economics, verification, interpretability) and closes "The frontier above pushes
on all three at once." Every clause points at work not yet done. Nothing on the page references
page 1, page 2, System 1 / System 2, or page 1's own closing stake, "Recognizing an answer and
constructing one are not the same act" ([Page1.tsx:216-221](web/src/components/pages/Page1.tsx:216)).
I re-ran the check: no page after 2 returns to the World Cup question, and page 19's synthesis
box makes no claim about the reader's opening experience.

The debt is specific and unpaid. Page 1 hands forward a stake; page 2 leaves two open items (a
fact that moved after the cutoff, a question misread as the men's tournament); page 3 shows
retraining fixes neither cheaply and does not touch the bias at all
([pages.ts:52](web/src/lib/pages.ts:52)). Act 2 was opened to pay that debt. Page 19 never
settles it, and never tells the reader that inference-time compute settles half of it and
cannot settle the other half.

One aggravating detail the reviewer caught and I confirm: page 19's step 3 already contains the
missing half. "a chain can fetch facts it never memorized and test guesses against the world
instead of itself" ([Page19.tsx:231-234](web/src/components/pages/Page19.tsx:231)) is exactly
the answer to page 2's stale-record failure, and the page never connects the two.

**What closing it requires** (directions only):

1. Put page 2's actual question back in front of the reader on 19 and let the levers act on it,
   so the split answer lands by demonstration rather than assertion.
2. State the verdict on page 1's stake in the deck's earned terms, instead of naming three
   abstract bounds.
3. Re-aim the capstone's readouts at that stake rather than at the anonymous three-family suite
   ([reasoner.ts:49-53](web/src/lib/reasoner.ts:49)).
4. Give the reader something to carry out. `SUBMISSION.md` still advertises "Your Toolkit" (cut
   with page 21) and nothing replaced it.
5. The space comes from steps 2 and 3, which are recaps (19.2, 19.3).

## Keep / cut / merge

| Page | Call | Reason | What is lost |
|---|---|---|---|
| 15 | **Keep whole** | Section 1 is the strongest predict-observe-explain moment in Act 3, and section 2 is *contracted*, not optional: `pages.ts:64` assigns the window idea explicitly. | Nothing. The reviewer proposed shrinking section 2 as drift; I refuted that (see Refuted). The real defect is that no later page spends it, so connect it forward to 17's contamination caveat rather than cut it. |
| 16 | **Keep** | The spine's "bill". Page 15 defers ARC-AGI to it by name and pins the deferral ([Page15.test.tsx:139-144](web/src/components/pages/Page15.test.tsx:139)). Nothing else in the deck prices anything. | Nothing. Compression per `docs/page_16_simplification.md` is still unapplied, but that is tightening, not a cut. |
| 17 | **Keep** | The spine's "failure mode" and the only page where more compute makes things worse. | Nothing. But it is the only page with no test file and it currently contradicts itself (17.2); it must not ship as drafted. |
| 18 | **Keep** | The most novel content in Act 3 and the best single interaction in the stretch (the obfuscation dial, [Page18.tsx:369-428](web/src/components/pages/Page18.tsx:369)). | Nothing. |
| 19 | **Keep the page, cut step 2, merge step 3 into the ending** | Step 1 (latent) and step 4 (capstone) are the page's reason to exist. Step 2 restates page 11 with the same citation and the same two numbers. Step 3 is two prose paragraphs. | Cutting step 2 loses nothing: page 11 owns adaptive allocation, page 6 owns budget forcing. Cutting step 3 *outright* would lose the deck's only mention of agents and tool use, which `pages.ts:68` names, so merge it into the loop closure instead, where it becomes the answer to page 2's stale-fact half. |

No page in 15-19 should be merged into another. The two merges worth doing are inside pages.

## Per-page findings

### Page 15 — The Scoreboard

**15.1 · major · high · CONFIRMED** — Stale forward reference to cut pages.
[Page15.tsx:286](web/src/components/pages/Page15.tsx:286) reads "pages 16 to **20** will ask you
to judge fights that are fought in them."
*A reader who takes it at face value reads through to 19, hits "The End", and concludes the deck
is truncated or a page failed to load, which is wrong because the deck deliberately ends at 19
([pages.ts:23-26](web/src/lib/pages.ts:23)).*
Fix: retarget the range, and re-scope the promise (18 and 19 stage no fight to judge).

**15.2 · major · high · CONFIRMED** — "Both headlines are lifted from the cited reports" is not
what the page shows. Every headline is a template string the page composes
([Page15.tsx:137](web/src/components/pages/Page15.tsx:137), `:148`, `:173`, `:184`, `:208`,
`:219`) and each is badged `quote-true` ([Page15.tsx:336-338](web/src/components/pages/Page15.tsx:336)),
while the page footnote correctly scopes the claim to "every real number"
([Page15.tsx:640](web/src/components/pages/Page15.tsx:640)).
*A reader who trusts "lifted from the cited reports" believes six real headlines were published
in these words and could go looking for them, which is wrong because only the numbers are sourced.*
Fix: scope the body claim to the numbers, as the footnote already does.

**15.3 · minor · high · CONFIRMED** — `PROVENANCE.md:66` still maps `benchmark-scoreboard.json`
to page 15; the page states it no longer uses it
([Page15.tsx:47-49](web/src/components/pages/Page15.tsx:47)) and `src/lib/scoreboard.ts` is
imported by nothing outside its own test.
*A reviewer auditing provenance opens the file expecting page 15's numbers and finds a different
set; the real source is `o1-scaling.json`.*

**15.4 · minor · high · CONFIRMED** — Section 3 ([Page15.tsx:565-608](web/src/components/pages/Page15.tsx:565))
has no interaction; it is the section carrying the sentence the reader is meant to walk away with.

**15.5 · minor · medium · CONFIRMED** — The capability slider has no referent
([Page15.tsx:459](web/src/components/pages/Page15.tsx:459), "illustrative units", 0-12).
*A reader who asks "where are we today?" cannot answer, and the page's own honesty note tells
them not to try, so they drag to both ends and stop.*
Fix: give the axis an ordinal anchor that cannot rot.

**15.6 · minor · low · CONFIRMED as unverified** — Both sides of the GPT-4o case declare "AIME
2024, all 15 problems" ([Page15.tsx:174](web/src/components/pages/Page15.tsx:174), `:187`) and the
taught answer is "whose harness scored it, **and nothing else**". Neither the reviewer nor I
opened the R1 paper's eval appendix to confirm DeepSeek used the same 15-problem set.
*If it used AIME 2024 I+II, the deck's own worked example teaches the wrong lesson.*
Fix: verify against the primary paper before submission, or soften "and nothing else".

**15.7 · minor · high · CONFIRMED** — One em dash in rendered copy
([Page15.tsx:640](web/src/components/pages/Page15.tsx:640)) and no guard test; pages 5-9, 13, 14
each carry one.

**Load-bearing strength:** section 1's three quote-true pairs with per-case persisted receipts
([Page15.tsx:244-249](web/src/components/pages/Page15.tsx:244)). The FrontierMath case (all four
coordinates moving at once) is a genuine expectation violation. Do not weaken it in compression.

### Page 16 — The Bill Comes Due

**16.1 · major · high · CONFIRMED** — The distill option is priced with no dependence on the
accuracy target. `totalBills` returns `distill: distillUSD + smallPerSample * queries`
([frontier.ts:76-85](web/src/lib/frontier.ts:76)), and `cheapestStrategy`
([frontier.ts:93-102](web/src/lib/frontier.ts:93)) compares that against renting at *any* target.
*A reader who sets target 92% and volume 10M reads "cheapest here: distill once, then serve"
one screen after the page told them "92% sits past the verifier's ceiling (90%)"
([Page16.tsx:465](web/src/components/pages/Page16.tsx:465), `:482-487`), and concludes a fixed
$294k retraining run reliably buys 92% on hard queries. Nothing cited establishes that.*
Fix: gate the distill branch on the target, or state the "assume the retrain hits your target"
assumption on screen.

**16.2 · major · high · CONFIRMED** — No handoff. The last content before `PageNav` is a
provenance footnote ([Page16.tsx:570-575](web/src/components/pages/Page16.tsx:570)); page 15 by
contrast hands off explicitly and the handoff is pinned in test.
*A reader finishes the calculator with no live question and clicks into 17 cold, which is wrong
because 17's premise depends on inheriting "the invoice assumes the thinking works".*
Agrees with `docs/page_16_simplification.md:191-201`, unapplied.

**16.3 · major · medium · CONFIRMED** — Latency is promised as a currency
([Page16.tsx:243-244](web/src/components/pages/Page16.tsx:243)) but appears once in a trailing
clause ("every extra sample is also latency", `:542-543`), and page 19 prints the opposite for
the same lever: "parallel samples are free"
([Page19.tsx:395](web/src/components/pages/Page19.tsx:395)), pinned at
[Page19.test.tsx:41-45](web/src/components/pages/Page19.test.tsx:41). `reasoner.ts:102-107`
confirms N is deliberately absent from latency.
*A reader who plays both concludes the deck disagrees with itself, which is wrong because both
are true under serial vs parallel assumptions that neither page states.*
Fix: state the assumption on both pages, once.

**16.4 · minor · high · CONFIRMED** — The thesis is stated three times
([Page16.tsx:245-249](web/src/components/pages/Page16.tsx:245), `:387-388`, `:533-534`), so the
dial confirms rather than reveals. Agrees with `docs/page_16_simplification.md:25-39`, unapplied.

**16.5 · minor · high · CONFIRMED** — The margin note
([Page16.tsx:557-560](web/src/components/pages/Page16.tsx:557)) carries two imperatives plus the
interpretation, duplicating the live verdict banner (`:490-502`). House rule is one imperative.

**16.6 · minor · high · CONFIRMED** — Dead bindings `brown`
([Page16.tsx:161](web/src/components/pages/Page16.tsx:161)) and `nature` (`:163`), and a header
docstring (`:33-35`) describing a "badge row at the bottom" that exists on no page in 15-19.

**16.7 · minor · high · CONFIRMED** — 17 em dashes and 5 en dashes in rendered copy, no guard
test; one en dash is pinned verbatim at
[Page16.test.tsx:16](web/src/components/pages/Page16.test.tsx:16), so the fix touches the test.

**16.8 · minor · medium · CONFIRMED** — Every query is priced at 10,000 reasoning tokens for both
the frontier call and each small-model sample
([Page16.tsx:62](web/src/components/pages/Page16.tsx:62), `:169-170`), disclosed at `:546-548`.
*A reader concludes the small model is cheap only because of its per-token price, which is
incomplete.* The disclosure mostly covers it.

**Load-bearing strength:** the o3 ARC-AGI anchor and its honesty about which numbers are firm
([Page16.tsx:263-323](web/src/components/pages/Page16.tsx:263)). Page 15 defers to it by name.
Do not cut in compression.

### Page 17 — When Reasoning Breaks

**17.1 · blocking · high · CONFIRMED** — Step 2's simulation contradicts step 1's measured result.
Step 1 teaches, from verbatim Huang et al. Table 3, that unaided review with "no hints, no tools,
just re-reading" makes accuracy go **down**
([Page17.tsx:126-131](web/src/components/pages/Page17.tsx:126)). Step 2 is titled "Make it think
more" with a slider labelled "Extra revision passes" (`:170`, `:188`) and gives every unaided pass
a 45% chance of solving a still-unsolved problem
([frontier.ts:131-138](web/src/lib/frontier.ts:131), `solveProb: 0.45`), so unaided accuracy
climbs 38.3% to 62.1% over three passes.
*A reader who has just read "unaided self-correction only degrades" drags the slider to 3,
watches unaided accuracy gain 24 points, and concludes step 1 was overstated or the demo is
broken. It is neither: the demo silently models "more thinking" (which solves) while step 1
measured "re-read your own answer" (which does not).*
Fix: one sentence separating the two mechanisms, or stop calling the slider "revision passes".

**17.2 · major · high · CONFIRMED** — Wrong cross-reference.
[Page17.tsx:312-314](web/src/components/pages/Page17.tsx:312) says the mid-chain "wait, let me
re-check" that RL taught DeepSeek-R1 is "(page 16)". R1 is page 14
([pages.ts:63](web/src/lib/pages.ts:63)); 16 is the economics page.
*A reader who follows the pointer lands on a cost calculator and concludes they misunderstood the
claim or the deck's numbering.*

**17.3 · major · high · CONFIRMED** — There is no `Page17.test.tsx`. Every other page 1-19 has
one. The page's footnote claims "every number in the demo is pinned by the test suite"
([Page17.tsx:343-344](web/src/components/pages/Page17.tsx:343)) — true of the `frontier.ts`
constants via `act3.test.ts`, false of any rendered copy.
*This is the mechanism by which 17.2 survived: no test reads this page's text.*

**17.4 · major · high · CONFIRMED** — "Overthinking" is in the page's title and its assigned
concept ([pages.ts:66](web/src/lib/pages.ts:66)) but has no figure. `data/overthinking.json` and
`inverseU` ([frontier.ts:163-170](web/src/lib/frontier.ts:163)) both exist and are tested; I
grepped every page component and `curves.overthinking` and `inverseU` are imported by none.
Overthinking survives as two prose sentences
([Page17.tsx:260-267](web/src/components/pages/Page17.tsx:260)).
*A reader arrives expecting the third named failure mode, gets a cited assertion, and never meets
the finding that easy problems cross the overthinking threshold sooner than hard ones.*
Fix: build the easy-vs-hard threshold figure the data file was made for, or drop the word from
the title.

**17.5 · major · high · CONFIRMED** — No handoff to 18; the page ends on the contamination caveat
and a reference note ([Page17.tsx:316-332](web/src/components/pages/Page17.tsx:316)).

**17.6 · minor · high · CONFIRMED** — 20 em dashes and 1 en dash in rendered copy, no guard test.

**17.7 · minor · high · CONFIRMED** — The verifier copy attributes the whole ceiling gap to false
positives ([Page17.tsx:224-227](web/src/components/pages/Page17.tsx:224)), but the model scales
genuine repairs down by the same reliability
([frontier.ts:145-147](web/src/lib/frontier.ts:145): `fix = fixProb * reliability`).
*A reader concludes the entire gap is edits waved through, which is wrong because the model also
charges false negatives.*

**17.8 · minor · medium · CONFIRMED (placement, not claim)** — The AIME-2025 contamination caveat
([Page17.tsx:316-322](web/src/components/pages/Page17.tsx:316)) discounts every accuracy number in
Acts 2 and 3 and sits as the last muted paragraph of the last step. Placement is the finding; the
claim itself is sound and cited.

**17.9 · minor · high · CONFIRMED** — Step 3
([Page17.tsx:299-324](web/src/components/pages/Page17.tsx:299)) is prose only: three bolded
assertions and a caveat, no figure, no control.

### Page 18 — Can We Trust the Thoughts?

The strongest page in the assignment. Findings are small.

**18.1 · major · high · CONFIRMED** — No handoff to 19. The close
([Page18.tsx:442-459](web/src/components/pages/Page18.tsx:442)) lands on "Trust the trace the way
you trust a witness" and hands nothing forward; page 19 then builds its own bridge, with the
wrong page number (19.1).

**18.2 · minor · high · CONFIRMED** — Step 2
([Page18.tsx:302-345](web/src/components/pages/Page18.tsx:302)) is two static bars and is the
page's pivot ("so is the trace worthless? No"); the reader does nothing.

**18.3 · minor · high · CONFIRMED** — Dead `Citation` constants `KORBAK` and `TURPIN`
([Page18.tsx:53-64](web/src/components/pages/Page18.tsx:53)); the comment above them describes a
"bottom row" that does not exist, and the `Citation` type import exists only for them.

**18.4 · minor · medium · CONFIRMED** — The confession meter's "50 more runs" button
([Page18.tsx:257-262](web/src/components/pages/Page18.tsx:257)) walks a bar toward a number the
caption already prints (`:280-283`).
*A reader who clicks it four times learns that 25% is 25%.* The real payload is the per-run trace
flip; the meter is close to decoration by this venue's standard.

**18.5 · minor · medium · opinion · CONFIRMED as an opinion** — The page's sharpest epistemic point,
"We only know better because the clean run sits above"
([Page18.tsx:236-240](web/src/components/pages/Page18.tsx:236)), arrives as prose in a verdict box
rather than as something the reader discovers.

**18.6 · minor · medium · CONFIRMED** — The recall bars' visible labels say "hacks"
([Page18.tsx:321-322](web/src/components/pages/Page18.tsx:321), `:336-337`) while the "systemic
reward hacks" scope lives only in the aria-label (`:318`).
*A sighted reader concludes the monitor catches 95% of all misbehavior.*

**18.7 · minor · high · CONFIRMED** — Zero em dashes in rendered copy (all 11 hits are in
comments) and nothing pins it that way.

**Load-bearing strength:** the pressure dial
([Page18.tsx:369-428](web/src/components/pages/Page18.tsx:369)) is the deck's best expectation
violation in this stretch: the reader turns up a knob labelled "make the thoughts good" and
watches reward rise while the alarm goes silent. Protect it.

### Page 19 — The Frontier

**19.1 · major · high · CONFIRMED** — Wrong cross-reference, pinned by a test.
[Page19.tsx:171](web/src/components/pages/Page19.tsx:171) says "Page 17 asked whether the written
chain even tells the truth"; that is page 18 ([pages.ts:67](web/src/lib/pages.ts:67)). And
[Page19.test.tsx:17-21](web/src/components/pages/Page19.test.tsx:17) asserts `/page 17/i`, so the
suite enforces the error.

**19.2 · major · high · CONFIRMED** — Step 2 re-teaches pages 11 and 6, and its first sentence
contradicts page 11. [Page19.tsx:199-212](web/src/components/pages/Page19.tsx:199) opens "Act 2
spent the same budget on every question", while page 11's whole job is difficulty-aware allocation
([pages.ts:60](web/src/lib/pages.ts:60), and `pages.ts:14` calls its budget bands "the
adaptive-thinking payoff"). The step then reprints the same two Snell numbers already rendered on
11 and 16, and the s1 "Wait" result already built on page 6.
*A reader who did page 11 concludes either that they misremembered it or that the deck lost track
of its own argument.*

**19.3 · major · high · CONFIRMED** — Steps 2 and 3
([Page19.tsx:196-249](web/src/components/pages/Page19.tsx:196)) are prose plus one ASCII arrow
diagram. No figure, no control, no reader action, on the final page, for two of its three named
subjects. This is the house "do not retell the literature" rule broken twice consecutively.

**19.4 · major · high · CONFIRMED** — The concept's "what each costs in readability"
([pages.ts:68](web/src/lib/pages.ts:68)) is delivered for one of three directions. `monitorability`
is computed from `cot`, `latent` and `verifying` only
([reasoner.ts:106-110](web/src/lib/reasoner.ts:106)); `search` and `adaptive` do not move it, and
agents are not a lever at all.
*A reader who turns on tree search and an adaptive budget sees monitorability unchanged and
concludes those levers are free of interpretability cost.*

**19.5 · major · high · CONFIRMED** — Coconut's GPT-2 scale is disclosed only in the bottom
footnote ([Page19.tsx:446](web/src/components/pages/Page19.tsx:446)), below the capstone, while the
77.5→97.0 and 42.9→34.1 bars carry the argument at `:148-169`.
*A reader concludes latent reasoning beats written chains at the frontier by ~20 points on
planning.*
Fix: put the scale in the figure's own label.

**19.6 · major · high · CONFIRMED** — Snell's 14× is reproduced without its condition
([Page19.tsx:205-206](web/src/components/pages/Page19.tsx:205)). Page 16 states it correctly ("on
easy and medium problems", `Page16.tsx:531-532`) and page 11's concept states it as a limit
("except on the hardest problems").
*A reader who only reaches 19 concludes the substitution is general.*

**19.7 · major · high · CONFIRMED** — The page does not close the loop. See the Page 19 section
above.

**19.8 · minor · high · CONFIRMED** — "Adaptive budget" is a free lunch, uniquely among the deck's
levers: `reasoner.ts:99-107` multiplies cost by 0.6 and latency by 0.8 and touches accuracy
nowhere; `Page19.test.tsx:50-54` pins "cuts the bill at unchanged accuracy".
*A reader concludes adaptive allocation is strictly dominant, and has no reason ever to switch the
toggle off, so toggling teaches nothing.*

**19.9 · minor · high · CONFIRMED** — A verifier silently costs 10 points of monitorability
([reasoner.ts:106-110](web/src/lib/reasoner.ts:106)) with no on-page explanation.

**19.10 · minor · high · CONFIRMED** — Dead constant `REACT_CITATION`
([Page19.tsx:38-43](web/src/components/pages/Page19.tsx:38)); the `Citation` import exists only
for it.

**19.11 · minor · high · CONFIRMED** — 17 em dashes in rendered copy, no guard test.

**19.12 · minor · high · CONFIRMED** — An undated, uncited product claim on the deck's most
time-sensitive page: "Deployed models now ship exactly this dial, sold as *reasoning effort*"
([Page19.tsx:210-211](web/src/components/pages/Page19.tsx:210)).

**19.13 · minor · medium · CONFIRMED as unverified** — "Its RL-trained successors then matched
that *without* the scaffold" ([Page19.tsx:243-245](web/src/components/pages/Page19.tsx:243)). The
reviewer reports arXiv:2502.06807 shows the successor *exceeding* the hand-engineered pipeline,
which would be a stronger fact for the deck. Neither of us opened the paper.

**19.14 · minor · high · CONFIRMED** — The capstone's accuracy scale is entirely authored
([reasoner.ts:56-63](web/src/lib/reasoner.ts:56)), disclosed at
[Page19.tsx:417-420](web/src/components/pages/Page19.tsx:417), yet the panel prints "suite accuracy
68.0%" to one decimal (`:380`), which reads as measurement.

## Cross-cutting (15-19 as a set)

- **Seams.** Three of four internal handoffs are missing (16|17, 17|18, 18|19). Only 15|16 has
  one, and it is the one a test pins. CONFIRMED.
- **Em dashes.** Rendered-copy counts: 15 → 1, 16 → 17 (+5 en), 17 → 20 (+1 en), 18 → 0, 19 → 17.
  Pages 5-9, 13 and 14 each carry a guard test; none of 15-19 does. CONFIRMED (counts read from
  source with comment-only hits excluded; not verified against rendered DOM).
- **`SUBMISSION.md` is stale and the mismatch is a finding · major · high · CONFIRMED.** Line 13
  says "Twenty pages"; the design table (line 35) maps the collapse debate to P19, which was cut
  page 20's content and not the current page 19; the contribution paragraph advertises "a grand
  sandbox combining every lever" as a destination that now survives only as step 4 of page 19;
  the checklist (line 69) proposes a teaser of a "Page 19 verdict flip" that no longer exists.
  *A reviewer who reads it first and then opens the deck finds a 19-page artifact whose last page
  is not about what the submission says it is about.*
- **Orphaned surface shipped in the repo · minor · high · CONFIRMED.** `src/lib/sandbox.ts`,
  `src/lib/quiz.ts` (docstring: "Pre/post conceptual quiz for **Page 20**"),
  `src/components/Quiz.tsx` and `src/lib/scoreboard.ts` are imported by no page; `frontier.ts`
  still carries a Page-20 Tower of Hanoi block and `act3.test.ts` still runs a
  `describe("Page 20: Illusion of Thinking")`. All green, all dead.
- **`PROVENANCE.md` page mapping is stale for this act · minor · high · CONFIRMED.**
  `overthinking.json` → 17 (unused), `illusion-of-thinking.json` → 19 (unused; it was cut page
  20's), `benchmark-scoreboard.json` → 15 (unused), and `compute-optimal.json` is listed as
  "11, 13" though 16 and 19 both render it.

## 14|15 handoff

Clean, and the best-executed seam in this stretch. Page 14 closes on "every one of them arrived
as a benchmark score ... Whether you should is the next page"
([Page14.tsx:1171-1176](web/src/components/pages/Page14.tsx:1171)); page 15 opens on exactly that
inheritance ([Page15.tsx:286-292](web/src/components/pages/Page15.tsx:286)) and reuses page 13's
own o1 numbers from the same data file, so the two cannot drift.

Two defects sit on the page-15 side: the cut-page range in that same opening sentence (15.1), and
the promise "will ask you to judge fights that are fought in them", which 16 and 17 keep but 18
and 19 do not. The promise was written when page 20 (the Illusion-of-Thinking jury) still existed.

One dependency runs the other way and belongs to the orchestrator of pages 1-14: page 15's first
courtroom case is o1's 74.4-vs-93 on AIME. Page 13 currently presents those two numbers as points
on one additive waterfall. If page 13 is corrected to show them as three parallel measurements,
page 15's case gets stronger; if it is left alone, page 15 teaches that the gap is a coordinate
change while page 13 taught it was an accumulation.

## Refuted

- **"Page 15 section 2 (the benchmark window) is drift."** REFUTED. The reviewer argued the window
  simulation does not advance the therefore/but and proposed shrinking it. `pages.ts:64` assigns
  the window explicitly as the second half of page 15's concept: "a benchmark is an instrument
  with a window: born at the floor, dead at the ceiling, which is why the goalposts must keep
  moving." A page cannot drift by delivering its own contracted assignment. The surviving,
  weaker observation is real and kept above as a connection opportunity: no later page spends the
  idea. Do not cut section 2 on drift grounds.
- **"Page 17's Wang et al. citation is an underthinking paper cited inside an overthinking beat,
  and a reader chasing it loses trust."** WEAKENED to an opinion, not a finding. The page cites
  Wang for a specific measured quantity ("wrong answers burn ~225% more tokens amid ~4× more
  strategy switches", [Page17.tsx:338-341](web/src/components/pages/Page17.tsx:338)), which the
  paper does report, and the gloss ("the model isn't thinking deeper, it's thrashing") is faithful
  to it. Framing preference, no factual failure.
- **"Page 16's calculator disclosure of the 10,000-token assumption is inadequate."** WEAKENED.
  The assumption is disclosed in-page at `Page16.tsx:546-548`. Kept as 16.8 at minor with the
  disclosure noted, not as an earned-claim failure.

## Coverage

**Opened by the reviewer and re-opened by me during verification:** `pages.ts`; `Page15.tsx`
through `Page19.tsx`; `Page1.tsx` (for the loop check); `Page15/16/18/19.test.tsx`;
`src/lib/frontier.ts`, `reasoner.ts`, `benchmarkWindow.ts`, `quiz.ts`, `scoreboard.ts`;
`act3.test.ts`; `tests-e2e/act3.spec.ts`; `web/data/PROVENANCE.md` and the fit params of the data
files listed above; `SUBMISSION.md`; `docs/page_15_coordinates_revision.md`,
`docs/page_16_simplification.md`.

**Verified by direct re-check during the adversarial pass:** 15.1, 15.2, 15.3, 16.1, 16.2, 16.3,
17.1, 17.2, 17.3, 17.4, 17.5, 18.1, 19.1, 19.2, 19.4, 19.5, 19.6, 19.7, 19.8, 19.9, and every
cross-cutting item.

**Not verified:**
- **Rendered appearance.** No browser or Playwright run. Nothing about layout, label collision
  (e.g. `CostStrip`'s two o3 labels, `Page16.tsx:117-125`), responsive behaviour, or real axe
  results is asserted here. Em-dash counts are from source, not rendered DOM.
- **Primary papers.** Every numeric claim is checked against `web/data/*.json` and their
  `provenance` strings, i.e. against the deck's own record. 15.6 (whether DeepSeek's AIME 2024
  eval used the same 15-problem set) and 19.13 (matched vs exceeded at IOI) both need primary
  sources and are marked accordingly.
- **Pages 1-14** beyond the targeted checks needed for the 14|15 handoff and the loop question.
  Where a 15-19 problem has an earlier root cause, only two were established: 19.2's contradiction
  is page 11's content restated, and 19.6's missing condition is stated correctly on 11 and 16.
