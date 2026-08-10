# Forward plan

Sources: `docs/review/pages_1_through_14_analysis.md` (F-numbers) and
`docs/review/pages_15_19_refinement.md` (page.number IDs). Effort: S ≤ 1h, M ≤ half a day,
L > half a day.

## Blocks the VISxAI submission

| # | Page | Change | Why here | Effort |
|---|---|---|---|---|
| 1 | 17 | Separate "think longer" from "re-read your own answer" so step 2 stops contradicting step 1's measured result; rename the slider or add the sentence that says what supplies the 45% | The only page in the deck where a simulation refutes the measurement printed above it. A reader who drags concludes the page is broken | S |
| 2 | 13 | Draw the 74.4 / 83.3 / 93 waterfall as three parallel readings, not an additive stack (F3) | Wrong at the strength stated, and page 15's first courtroom case cannot be coherent until it is fixed. Blocks item 12 | M |
| 3 | 8 | Stop plotting the trained verifier's unmeasured solve-rate at 0% and reword "cannot solve a single one of these problems" (F4) | An unmeasured value drawn on a measured axis, carrying the page's thesis, in the act that is the submission's contribution | S |
| 4 | 12 | Restore the answer-key-off control (`StarLoop` already implements it) so the lede's bolded question gets answered (F1) | Act 3 opens with zero interaction on an explorable; this is the first thing a workshop reviewer notices, and the fix is a prop | S |
| 5 | 13 | Name the joint two-axis surface itself as authored in the fidelity note, not just its span and slope (F2) | The page's central claim ("One law, two knobs") is in no source and the disclosure does not cover it. Cheap, and it is the deck's own guardrail | S |
| 6 | 13 | Fix "they do not substitute", which the page's own law and its own Try-it note contradict exactly (F6) | Self-refuting on the interaction the reader is instructed to perform | S |
| 7 | 7 | Replace "will refuse to continue" with "continuing does not buy anything" (F7) | Flat contradiction of page 6's measurement on the same checkpoint and item set, two pages apart | S |
| 8 | 10 | Call the searcher's signal the model's own confidence, not "a verifier", in all three places (F8) | The page's own engine docstring says the opposite, and the page's punchline requires there to be no verifier | S |
| 9 | 6 | Compute never-solved ∩ censored instead of subtracting totals: the sentence should read 46, not 45 (F13) | A wrong number in a bolded payload sentence that the reader can check by counting squares | S |
| 10 | 14 | Attach "no worked examples at all" to R1-Zero, not to R1, in the lede (F14) | The page's most quotable claim is false for the model in its title | S |
| 11 | 14 | Fix "71.0% on AIME, level with o1-0912" in the closing block; the match is cons@64 at 86.7% (F15) | The page states it correctly earlier and drops the qualifier in the sentence the reader carries to page 15 | S |
| 12 | 15 | Retarget "pages 16 to 20" and re-scope the "fights to judge" promise to what 16-19 actually stage (15.1) | Points at cut pages; a reader hits "The End" at 19 and concludes the deck failed to load | S |
| 13 | 19 | Fix "Page 17 asked whether the written chain even tells the truth" (it is 18) **and** the test that pins the error (19.1) | Wrong on the final page, and the suite currently enforces the mistake | S |
| 14 | 17 | Fix "DeepSeek-R1 (page 16)" → page 14 (17.2) | Same class as 13; survived because page 17 has no test file | S |
| 15 | 17 | Write `Page17.test.tsx` (17.3) | The only page 1-19 with no test; it is the mechanism by which items 1 and 14 survived. Do this after 1 and 14 so the tests pin the fixed text | M |
| 16 | 13, 14 | Delete or rewrite the two Playwright specs in `tests-e2e/act2search.spec.ts` that target selectors from the obsolete numbering; keep the axe loop (F30) | Two guaranteed CI failures on pages that are fine; a reviewer running the suite concludes 13 and 14 are broken | S |
| 17 | 2, 3 | Name retrieval once and say why it is out of scope, and stop the System 2 comic closing the gap the prose says thinking cannot close (F5, F25) | The deck's Act 1 → Act 2 pivot rests on "which leaves **only** what it does after", which page 2's own figure has already falsified. Largest structural defect in 1-14 | M |
| 18 | 19 | Cut step 2 and move step 3's tool-use beat into a closing that re-asks page 2's question and answers page 1's stake (19.2, 19.3, 19.7) | The final page currently re-teaches pages 11 and 6 in prose, contradicts page 11's premise in its first sentence, and ends on a survey. This is the ending, and it does not exist yet | L |
| 19 | 16 | Gate the distill branch on the accuracy target, or disclose "assume the retrain hits your target" (16.1) | The calculator returns "distill is cheapest" at targets the same page just declared unreachable | M |
| 20 | 16, 17, 18 | Add the three missing forward handoffs (16.2, 17.5, 18.1) | Three consecutive seams hand nothing forward; the reader clicks into 17, 18 and 19 cold | S |
| 21 | 15 | Scope "Both headlines are lifted from the cited reports" to the numbers, as the page's own footnote already does (15.2) | The headlines are template strings badged `quote-true`; the page contradicts itself about its own sourcing | S |
| 22 | deck | Rebuild `PROVENANCE.md`: five files assigned to pages that do not import them, no rows for `page-05..09-derived.json`, `star-cqa`, `tot-crosswords`, `neural-degeneration`, `chinchilla`, `epoch-dataset-projection`, `deepseek-pricing`; stale page columns on 13, 15, 17, 19 (F31) | `SUBMISSION.md` sends reviewers here to audit every number, and for most of 5-19 it sends them to the wrong file or to nothing | M |
| 23 | deck | Rewrite `SUBMISSION.md`: "Twenty pages", the collapse debate mapped to P19, the ±1.0pp fidelity claim (false for page 11), page 6 listed as live-inference, and "every number traces to a cited primary source" (which understates pages 5-9) (F32) | The submission document describes a different artifact than the one submitted | S |
| 24 | 9 | Replace "the N lines before the break were sound" with "not disproved" (F10) | The page's own margin note forbids exactly this inference, two inches away; 94% of steps are unjudged | S |
| 25 | 9 | Disclose that the PRM's 19.5% threshold was fitted against the checker's own labels (F11) | Presented beside the checker's rate as an independent instrument; page 7 discloses the identical caveat about its own fitted temperature | S |
| 26 | 8 | Say on the page that the trained verifier was rebuilt (the checkpoint's own modelling code returns NaN under this transformers version) (F12) | Every headline number on the page comes from that reconstruction and the page implies it ran as published | S |
| 27 | 11 | Hedge "Thinking amplifies competence; only parameters create it" (F9) | Page 12 describes itself as the knob that lifts the curve without buying a parameter. The handoff sentence's "so far" is fine; this one has no hedge | S |
| 28 | 2 | Label the model's replies as authored (the `machine.label` / `cutoffLabel` / `constraintLabel` strings already exist and are rendered nowhere) (F24) | Pages 3 and 4 carry their authored labels; page 2 presents a three-element string array as a live model | S |

## Camera-ready

| # | Page | Change | Why here | Effort |
|---|---|---|---|---|
| 29 | 2 | Give the cutoff slider more than two reachable states, or shorten its range to the transition it actually has (F23) | Nine years of track with one state change reads as a broken control, but it is a redesign, not a correction | M |
| 30 | 4 | Make the step counter stop contradicting "the fastest road" (F27) and surface an actual toll in "three roads, three tolls" (F28) | The page's only quantitative comparison inverts its own conclusion; the data to fix it is already there | M |
| 31 | 4 | One clause distinguishing "different methods, same answer" from "different attempts, different answers" (F29) | Page 4's convergence premise is the one Act 2 inverts; the collision surfaces at 6\|7 | S |
| 32 | 1 | Name the size→time relation the page already enacts, and stop the System 2 stopwatch reading as a measurement beside a hard-coded "instant" (F34, F26) | The concept's causal variable is demonstrated but never said, and the timer measures click latency | M |
| 33 | 17 | Build the easy-vs-hard overthinking threshold figure `overthinking.json` and `inverseU` were made for, or drop "Overthinking" from the title (17.4) | A named third of the page's concept survives as two prose sentences with the data file unused | M |
| 34 | 7 | Give the reader a control that adds a voter (F64) | The one page whose subject is what happens as N grows has no N control. Structural, and pages 5-9 are wording-only right now | L |
| 35 | 19 | Make monitorability respond to search and adaptive, or stop claiming the page prices readability for all three frontier directions (19.4) | The concept promises "what each costs in readability" and delivers it for one of three | M |
| 36 | 19 | Give the adaptive toggle a cost, or say why it has none (19.8) | Uniquely among the deck's levers it is strictly dominant, so toggling teaches nothing | S |
| 37 | 16, 19 | State the serial-vs-parallel latency assumption once, on both pages (16.3, 19.7) | "every extra sample is also latency" against "parallel samples are free", the second pinned in test | S |
| 38 | 19 | Put Coconut's GPT-2 scale in the figure label, not the page footer (19.5); restore Snell's easy/medium condition to the 14× claim (19.6) | Two overclaims on the final page, both one-line fixes | S |
| 39 | 3 | Give the bias half of the page a figure or a control (F20) | One paragraph for a co-equal half of the assigned concept, and the one place in Act 1 where a claim is purely told | L |
| 40 | 3 | Fix the frontier legend naming a $191M model for a curve starting at $78M (F21); separate wall (d) from the daily-retrain plan it does not bear on (F22) | Legend/curve mismatch is checkable at month 0; wall (d) argues about a different plan than (a)-(c) | M |
| 41 | 13 | Cut three of the four pre-statements of the staircase finding so the dials discover rather than confirm (F18) | Decoration risk on the page's only interaction; page 14 already has the "setup before, meaning after" guard | S |
| 42 | 13 | Stop "confirmed frame only" badging the unconfirmed `generate ×k` and `reinforce` sub-labels (F17); hedge section 2's one-chain-vs-many assertion that section 4 calls unknowable (F92) | The page's honesty protocol is stricter than its own figure | S |
| 43 | 14 | Add the measured R1-distill run on the deck's own 100-item MATH-500 harness (`9ab2b579`) rather than the published MATH-500 column; if the column is added anyway, the page must own the 32B/70B reversal and `Page14.test.tsx:229` must change (F33) | The only addition in 12-14 that would meet the standard pages 5-9 set. Adding the published column unchanged breaks two shipped claims and one pinned assertion | L |
| 44 | 14 | Fix "within seven points" (it is 7.2), name and draw QwQ-32B-Preview behind "the best open reasoning model that existed the week before", and stop crediting the distill win to answer-time thinking (F98, F99, F100) | Three checkable overclaims on one figure | S |
| 45 | 11 | Soften or widen the Pythia ownership bands: the 2.8B/12B crossing is ~0.6 points inside a ±3-point by-eye digitization (F19); stop painting "410M leads" where the other series have no data (F80) | A drawn crossing the source cannot resolve, on the act's payoff page | M |
| 46 | 11 | Gloss FLOPs at first use (F83); fix the 1×/2×/4× correspondence to Pythia's real 1×/6.8×/29× (F81) | Agreed with `finishing_touches/page_11_concerns.md` §4; both are one-clause fixes | S |
| 47 | 10, 11 | Package and link the search-arm and training-vs-scale notebooks (F76) | Pages 5-9 train the reader to download and re-derive; the act's last two pages have nothing to check | M |
| 48 | 15 | Give the capability slider a referent that cannot rot, or say plainly that only the floor→window→ceiling sequence matters (15.5); connect section 2 forward to 17's contamination caveat | Section 2 is contracted content (see Refuted in the 15-19 file) but nothing later spends it | M |
| 49 | 17 | Promote the AIME-2025 contamination caveat out of the last muted paragraph (17.8); fix the verifier copy that blames the ceiling gap entirely on false positives (17.7) | The caveat discounts every accuracy number in Acts 2 and 3 and is placed where it does least work | S |
| 50 | 18 | Make "we only know better because the clean run sits above" discoverable rather than told (18.5); give step 2 something to do (18.2); scope "hacks" to "systemic reward hacks" in visible copy (18.6) | The strongest page in 15-19; these are upgrades, not repairs | M |
| 51 | 5, 6, 9 | Page 5: map the raw `bare` condition key and the bare "conservative" to reader-facing words (F54), move or fix the Kojima phrase (F55), hedge the 4.7×-parameters callout (F56). Page 6: fix the legend swatch (F58), the censored-contaminated median (F59), the tautological inset (F60), the null-stated-as-mechanism (F61). Page 9: the localisation band (F73), the specimens that never disagree with the PRM (F74) | Wording-and-cosmetic tier on pages that are otherwise final; each is small and each is a claim slightly stronger than its evidence | M |
| 52 | 5-11 | Add `aria-live` to pages 7-11 (F52) | Pages 9, 10 and 11 carry the act's three largest state changes and announce none of them | M |
| 53 | deck | Add the em-dash guard test to pages 3, 12, 15, 16, 17, 18, 19 and clear the rendered-copy hits (F46, F53; 15.7, 16.7, 17.6, 19.11) | House rule enforced on 5-9, 13, 14 and broken on six other pages; page 18 is already clean and unpinned | M |
| 54 | deck | Delete the orphaned surface: `sandbox.ts`, `quiz.ts`, `Quiz.tsx`, `scoreboard.ts`, `frontier.ts`'s Page-20 Hanoi block, `act3.test.ts`'s Page-20 describe, `REACT_CITATION`, `KORBAK`/`TURPIN`, `Page16.tsx`'s `brown`/`nature`, and the stale docstrings on `Page12.tsx:41-43` and `starListing.tsx:3-9` | All green, all dead, all left over from the page-20/21 cut; a reviewer reading the repo sees content that does not ship | S |
| 55 | 1-4 | Add one predict-before-reveal beat to Act 1 (F37) | `SUBMISSION.md` claims most pages ask the reader to predict; Act 1 has none, and Act 1 is the intuition act | M |
| 56 | 2, 3 | Page 2: expand LLM at first use, move the cutoff definition above the widget, cut the re-narration of the widget's badge, retarget the closing pull quote at page 3 (F39, F41). Page 3: cite or hedge the corpus-sharpens-bias claim (F44) and walls (b)/(c) (F45), fix the 2028 wording (F47), unpin `TODAY_YEAR` (F48), attribute the 5×/yr figure correctly (F49) | Prior review raised most of the page-2 items and they are still open; all are single-clause | M |
| 57 | 4 | Fix the "page 1's round 3" footnote (page 1 shows no round 3) and the stale `SYSTEMS` docstring that caused it (F50); move the "three cultures" hedges to where the claim is made (F51) | Checkable by a reader who scrolls back | S |
| 58 | 12 | Answer or drop the "bills you for each" promise page 13 does not keep (F87); consider a predict beat before the 6B-vs-137B bars (F89) | Page 12 spends page 16's promise a page early | S |
| 59 | 19 | Round the capstone's "68.0%" so it stops reading as measurement (19.14); date or cite "Deployed models now ship exactly this dial" (19.12) | Two small honesty fixes on the deck's most time-sensitive page | S |

## Where the two analyses disagree

- **Where Act 3's "BUT" turns.** The 15-19 analysis reads Act 3 as delivering the spine's BUT
  (16 the bill, 17 the failure mode, 18 the trust failure). The 1-14 analysis finds no ceiling, no
  bill and no failure mode anywhere in 12-14, which are a second THEREFORE. **Pick the second
  reading**: the BUT turns at 16, not at 12. Consequence for the queue: do not try to make page 12
  turn an act; item 4 fixes its interaction, not its stance. And note in any framing text that Act
  2 already delivers a ceiling on every lever, so Act 3's turn is a deepening, not a reversal.
- **GPT-4o at 12% (page 13) vs 9.3% (page 14).** The 1-14 analysis suggests one signalling clause
  so a reader does not read it as a transcription error. The 15-19 analysis shows page 15 uses
  exactly that pair as a teaching case, which needs the discrepancy to arrive unexplained. **Pick
  the second**: leave both pages silent, and drop F101 from the queue.
- **Page 14's Simulated/Cited footer.** A prior pass (`finishing_touches/finishing_touches.md`,
  `docs/page_14_scaling_frame.md:258-261`) proposes deleting it for consistency with page 13. The
  1-14 analysis finds page 13 is the page with the disclosure gap (items 5 and 42). **Keep page
  14's footer and unify upward**; do not action the prior proposal.
