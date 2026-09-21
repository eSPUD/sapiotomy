# Reviewer response: changes plan

**Status:** plan only. No code or prose has been changed. Every item here is a flag for review or a proposed change awaiting the author's decision.
**Opened:** 2026-09-20, from the two VISxAI reviews and a full read of all sixteen page components.
**Line numbers** refer to `web/src/components/pages/PageN.tsx` at commit `9905550` unless another file is named. They will drift as edits land; the quoted text is the anchor.

## What the reviewers said

Reviewer 1: comprehensive and accessible, but "sometimes feels more like an interactive history lesson than an explainer," "leans a bit historical," "may not be getting to the point," and "a slightly tighter narrative could help emphasize the central topic." Also: the nav bar does not highlight the active section and clicking between sections misbehaves.

Reviewer 2: "a bit too long and can feel at times slow," "difficult to grasp the core ideas," "lack of clear emphasis," partly caused by "Claudesque language." Recommends "significantly truncating to highlight the core ideas."

## How to read this document

Part 1 lists the common problems: patterns that recur across pages. Each has a definition, the evidence, and the rule a fix should follow. Part 2 goes page by page and flags every instance found, plus author-supplied replacement drafts where they exist. Part 3 is the proposed order of work. Part 4 lists the decisions only the author can make.

Word counts below are reader-facing prose only (headings, paragraphs, captions, margin notes, labels), not code or comments. They are approximate.

---

# Part 1. Common Problems

## CP1. Deck self-narration in opening lines

**Definition.** A page's lede retells what a previous page did, or narrates the deck's own arc, instead of stating the page's idea. The reader who arrives from the previous page has just read it; the reader who lands cold has no idea what "page 12's promise" was.

**Why the reviewers feel it as "historical."** Every page opens with a recap, so the reader is constantly reading the history of the deck rather than the subject.

**Evidence: all sixteen ledes.**

| Page | Opening line (verbatim start) | Verdict |
|---|---|---|
| 1 | "Your mind runs two systems." | Keep |
| 2 | "What does it take for an LLM to be useful (helpful, harmless and honest) in the real world?" | Rewrite (see P2) |
| 3 | "A missing fact needs new knowledge, and the obvious way to supply it is to train the model again." | Keep structure, de-tic |
| 4 | "Working a problem out instead of looking it up has a name: reasoning. And here is the surprise:" | Rewrite or cut page |
| 5 | "Act 1 ended on a question: can a machine be walked down a road?" (L590) | Rewrite; author draft supplied |
| 6 | "Page 5 gave the model a chain." (L1166) | Rewrite |
| 7 | "Page 6 made one chain longer, and ran out of road." (L564) | Rewrite |
| 8 | "Counting asks what is most common. Judging asks what is best." (L634) | Keep |
| 9 | "Two ways to grade a student: mark the final answer, or mark every line of the working." (L321) | Keep |
| 10 | "A model writes one word at a time..." (L340), followed at L352 by "Nothing here is a measurement of ours. Pages 5 to 9 each ship the run..." | Keep lede, cut the provenance paragraph |
| 11 | "A bigger model and more thinking are two ways to spend the same FLOPs." then "Act 2 built the answer-time kind. Matched bill for bill on the deck's own run" (L1042, 1045) | Keep first sentence, rewrite the rest |
| 12 | "A model writes its own reasoning, an answer key discards what's wrong, and the survivors become its next training set." (L435) | Keep |
| 13 | "By page 12, compute had split in two: the compute spent at answer time (pages 5 to 11: votes, judges, search) and the compute already sunk into the weights (page 12..." (L525) | Rewrite; author direction supplied |
| 14 | "Page 13 closed with four questions about what sits behind the thinking dial..." (L872) | Rewrite |
| 15 | "For fourteen pages the dial has mostly pointed one way... This page is the fine print." (L706) | Rewrite |
| 16 | "The past fifteen pages are a small but mighty snapshot of what inference-time scaling is under the hood." (L301) | Rewrite |

**Rule for the fix.** A lede states the page's idea in its first sentence, in the subject's terms, with no page number, no act number, and no "this page." If continuity is needed, name the concept ("a chain of thought has a length") not the page ("page 5 gave the model a chain").

## CP2. Prior-page references inside sections

**Definition.** Body paragraphs, figure captions, chart labels, and sub-labels that name another page instead of the concept. Examples the author called out: page 13's section 1 caption "Page 12's strip, redrawn" (L581) and section 2's opener "Page 11's law:" (L616).

**Why it matters.** A figure caption that says "page 12's strip, redrawn" teaches nothing to a reader who does not have page 12 in working memory. Naming the concept ("the self-training loop, with sampling and a reward added") teaches it again for free. The same applies to bar labels like "page 7's voting" (P13 L502) and "page 8's re-ranker" (P13 L508), which could say "majority vote" and "verifier re-ranking."

**Full inventory in rendered text** (comments and aria-labels excluded; aria-labels carrying page numbers are listed separately under CP2a):

- P3: L537 "Page 2's model held the 2023 title the whole time"
- P4: L425 "Page 1 gave you"; L560 "Which leaves Act 1's open questions"; L563 "Act 2 opens that toolbox."
- P5: L590 "Act 1 ended on a question"; L608 "Page 1 handed you"; L652 "every length on this page"; L1055 "Page 6 asks how much of that working it actually needed"
- P6: L1166 "Page 5 gave the model a chain"; L1188 "Every figure on this page carries its own copy of this dial"; L1345 "That is Act 1's slow deliberate System 2"; L1374 "Every length on this page"; L1639 "page 7 turns on the difference"; L1680 "Page 7 asks what N voters at X each are worth"; L934 (readout string) "is page 7's question"
- P7: L564 "Page 6 made one chain longer"; L616 "every chart on this page"; L710 "That is what pages 5 and 6 ran"; L898 "Page 8 re-runs this protocol, lands where this page landed"
- P8: L364 "page 7's rule is that a tie"; L509 (readout) "page 6 or this run"; L641 "page 7's vote"; L654 "Page 7 counted the chains"; L722 "page 7 counts a tie as no answer"; L763 "The majority-vote row is page 7's counting rule"; L813 "Grading the steps is the next page."; L882 "page 7's leftovers are still mostly leftovers"; L893 "Turn the page."
- P9: L639 (runtime string) "nothing you can click on this page"; L717 "page 12's filter"; L887 "Turn the page."
- P10: L352-354 "Nothing here is a measurement of ours. Pages 5 to 9 each ship the run their numbers come from. This page ships none."; L464 "Nothing on this page checks whether a line can still rhyme"; L790 "Everything on pages 5 to 10 spends the same thing"
- P11: L1045 "Act 2 built the answer-time kind. Matched bill for bill on the deck's own run"; L1085 "this deck's instrument: the hard band is pages 6 to 8's own 100 MATH-500"; L1168 "Even a trained verifier (page 8)"; L1288 "Section 2 allocated by prompt; this allocates by budget"; L1340 "Section 3 varied how much compute; this one varies how it is spent"; L1388-1393 "Act 3 stops selecting... Page 12 keeps the winning chains... Pages 13 and 14 reward only correct answers"
- P12: L98 (annotation) "section 1's answer key"; L472 "The same loop from section 1, in ten lines."; L601 "Page 9's outcome-versus-process trade"; L613-615 "All of Act 2 spends the... and page 11 priced that shelf"; L619 "This page is the other"; L628 "Page 13 picks it up from there."
- P13: L502 label "page 7's voting"; L508 label "page 8's re-ranker"; L525-526 "By page 12... pages 5 to 11... page 12"; L543 "Page 12 closed on a promise"; L564, 570, 576 sub-labels "page 12 took one greedy try", "page 12's filter", "page 12 fine-tuned the base"; L581 "Page 12's strip, redrawn"; L585 "page 14 prints an algorithm"; L593 "page 3's finite stock of human text"; L616 "Page 11's law:"; L629-631 "section 3 stacks it... same maths as section 3"; L709 "this deck's construction"; L728 "Act 2 did not become obsolete; it became the second storey"; L772 "Act 2's move done by hand"; L825 "Turn the page."
- P14: L204 (stage note) "Page 10's branch, score, backtrack"; L459 axis label "page 11's test-time compute"; L872 "Page 13 closed with four questions"; L919 "Page 7 sampled many chains"; L1031 "Add page 7's majority vote"; L1066 "the distinction page 13 could only assert"; L1110 "Page 13's two knobs were never equally available"; L1134 "page 12's recipe with a far stronger teacher"; L1172 "And page 3 said the stock of human text was finite"
- P15: L707 "This page is the fine print."; L777 "Step 1 was a revision you asked for"; L779 "page 6's accuracy"; L852 "page 7's coverage without page 8's selector"; L887 "page 8's whole pile"; L912 "page 8."; L922 kicker "page 8's judges"; L926 "Step 2 leaned on a judge, and page 8 sold one"; L970 "diversity page 8 was selling"; L1008 "Page 9 is why"; L1018 "(page 8)"; L1019 "Step 3 adds which judge"; L1024 "(page 14)"; L1037 "every repair on this page"; L1041 "every lever in this story"
- P16: L313 kicker "pages 5 to 11"; L317-319 "none of them could draw this. Now that all of them are behind you"; L189 rung labels "· page N"; L392 "this deck could not make it pay"; L401 "this deck never ran it"; L411 "this deck cannot tell you"; L424 "In the deck's order."

**CP2a. Page numbers in accessibility text.** P14 L412 (chart alt text) says "the axis is labelled as page 11's test-time compute." P15 L463 names "page 15's reliability dial." These follow the same rule.

**Rule for the fix.** Replace every page reference with the concept it stands for. "Page 7's voting" becomes "majority vote"; "page 8's judges" becomes "the five verifiers"; "Page 12's strip, redrawn" becomes "the self-training loop, with two stations changed." Section-to-section references inside a page ("section 2 allocated by prompt") are the same problem one level down; name the idea instead. Page 16's quiz may keep its per-question source page, since that is a study aid, but the rung labels on the ladder should name the lever, not the page. Delete every "Turn the page."

## CP3. The opening act takes too long to reach the subject

**Definition.** The first lever the reader can turn that is actually inference-time scaling is the token budget dial on page 6. Before that: two systems of thought (1), a model that fails on reflex (2), training-time economics (3), multiplication in three cultures (4), and chain of thought (5).

**Evidence.** Pages 1 to 4 total roughly 1,900 words of prose and six charts, none of which is a test-time lever. Page 3 alone carries six references and two Epoch-derived charts to make the case that retraining is expensive. Page 4 exists to seed "reasoning is diverse pathfinding" for pages 7 and 10, an idea that can be stated in one sentence where it is needed.

**Rule for the fix.** The reader should be turning a test-time knob by the third page. Candidate structure: page 1 (two speeds) stays; page 2 (reflex fails, thinking helps) stays and absorbs the one-sentence bridge; page 3 shrinks to the single point that retraining cannot fix reflex errors, with the economics charts either cut or made a margin figure; page 4 is cut (decision D1). Page 5 then opens the subject.

## CP4. Historical and chronological framing

**Definition.** Content organised by when and by whom, rather than by mechanism. This was a founding design choice (planning/InferenceTimeScaling_Explainable.md: "the narrative arc of the field is itself a ready-made story arc"), and both reviewers are pushing back on it.

**Where it actually lives.** This is narrower than the reviewers' phrasing suggests. Strict history is confined to:

- Page 3: every mechanism sentence arrives escorted by its Epoch or Chinchilla lineage; six references; the Gemini Ultra figure at L376-380 illustrates a point the GPT-4 figure already made.
- Page 11, sections 2 to 4 (L1218-1376): three consecutive summaries of published papers (Snell; Wu on GSM8K; Wu on MATH500), about 900 words and three figures, announced at L1227 with "The rest of this page is that record." Section 4 re-teaches page 10's lesson.
- Page 13: "the first commercial model" priority claim (L527); OpenAI's LRM definition quote that the page never uses again (L547-551); "This deck will not print a line of o1's pseudocode" (L584); the o1-ioi versus early-o3 ablation sub-section with its own heading, badge and card (L762-783, 92 words, no interaction); "Four months later an open lab answered" (L822).
- Page 14: "In January 2025, DeepSeek published all of it" (L872); "level with OpenAI-o1-0912" scoreboard colour (L1031); "Page 13's two knobs were never equally available... which meant being a frontier lab" (L1110-1116); the two-page benchmark retrospective in the handoff (L1178-1180).

**The partition worth knowing.** Pages that run on the deck's own instrument (Qwen2.5-3B, the same 100 MATH-500 problems): 5, 6, 7, 8, 9, 11 §1, 15, 16. Pages that do not: 3, 4, 10, 11 §§2-4, 12, 13, 14. The second list is almost exactly the set flagged as historical. The spine the reviewers want already exists in the first list.

**Rule for the fix.** Present each mechanism as a mechanism. Dates, lab names and priority claims move to the margin reference note or go. A page may say "o1 is an example of a model trained by reinforcement learning to reason at inference time" without narrating who did it first, when, or what they refused to publish.

## CP5. Claudesque language

**Definition.** Prose constructions that read as machine-written: rhetorical negation ("not X, it is Y"), aphoristic colon and semicolon sentences ("The slope is the claim; the absolute compute is a secret."), "that is the whole point / the whole case / the finding," fragment closers ("Not a strategy." "Hold that."), tricolons for cadence, narrator intrusions ("And here is the surprise:", "Then the part nobody promised us"), the article praising its own honesty, and cute-register flourishes ("small but mighty," "under the hood").

**What is already fixed.** Em dashes: zero in reader-facing prose on all sixteen pages except P3 L538 and five replay captions on P10 (L276, 277, 295, 297, 301). Page 11's test enforces the ban. The words "quietly," "candour," "honest," "earned" appear almost only in code comments (exception: P2 L245 "quietly"; P9 L719 "the honest answer is smaller than the story wants").

**Approximate deck-wide counts (reader-facing prose).**

| Construction | Count | Densest pages |
|---|---|---|
| Rhetorical negation "not X, it is Y" | ~120 | 3, 6, 11, 14, 16 (two takeaway titles) |
| Aphoristic colon / semicolon sentence | ~100+ | 13 (30 colons, 30 semicolons in ~1,050 words), 4, 6 |
| "the whole point / case / finding" | ~25 | 9, 10, 13 |
| Fragment or one-word closer | ~35 | 6, 15, 13 |
| Tricolon for cadence | ~40 | 1, 15, 16 |
| Narrator intrusion | ~10 | 4, 8, 9, 16 |

**Sentences that carry the deck's theses and are built on the tic** (these need rewriting, not deleting): P10 L765 "what search buys is not more thinking, it is the ability to take a thought back"; P11 L1180 "the bottleneck is not the thinking, it is the picking"; P12 L587 "The value was never the answers, it was training on the reasoning"; P16 L372 "Reasoning is worth having. It is not worth forcing."

**Target register.** The page 16 quiz bank (`web/src/lib/page16.ts` L533-690) was rewritten under a documented rule, "say it the way a person would," and is the cleanest prose in the deck. Section 2 of page 5's author draft below is another sample of the target: plain declaratives, one idea per sentence, no reveal-clauses.

**Rule for the fix.** State the claim directly. Where a negation contrasts two things, say the positive thing first and drop the negated half unless the reader would actually believe the wrong one. One colon per paragraph at most. No sentence that exists only to land a beat.

## CP6. Provenance and caveat ballast in the reading column

**Definition.** Run ledgers, notebook chips, tolerance notes, statistical-test explanations, and "measured, not simulated" reassurance placed in the main reading column, often above the figure they qualify.

**Evidence.** P5 run ledger L1012-1033 plus notes "One trace only," "How to read it," "Limits," two reference notes (~300 words of a 1,390-word page). P5 L902-907 and P7 L777-786 explain the McNemar test in near-identical words. P8 L871-876 "That contest is ours" (45 words of scholarly conduct). P9 L769-820 four stacked qualifications under a two-bar figure; L836-848 tells the reader the median on screen is "a direction, not a digit." P10 L352-359 provenance paragraph before the first interaction, restated at L711-713. P11 L1083-1090 caption ("gate 1," FLOPs formula); L1302-1325 a 227-word caption of which ~40 words are the finding. P13 L705-712 fidelity note. P14 L1079-1085 provenance caveat repeated at L1193-1198. P15 L803-810, L986-990. P16 L282 five download chips above the fold; L341-347 restates them.

**Rule for the fix.** Provenance goes in the notebook, the figure alt text, or a single collapsed footnote per page. Statistical tests get explained once in the deck, then referenced by name. A caption states the finding and at most one qualification.

## CP7. Findings told two or three times

**Evidence.** P5 flat floor: chart label L298, callout L971, close L977 ("the flat floor is the finding" twice). P6 step 4 null: L1587-1594, L1603-1605, L1608-1618; the close L1662-1683 re-reads three numbers already drawn. P7 legend taught in prose L701-711 before the chart. P12 STaR loop: prose L444-454, diagram L458, pseudocode L481-494, caption L483-493. P13 §2 close L694-704 restates the law the figure just showed. P16 L341-347 restates the download row.

**Rule for the fix.** The figure carries the finding. The prose under it says what to look at, once.

## CP8. Figure explanations that are not intuitive

**Evidence.** P5 §3 opener explains only the reasoning side ("Reasoning, it writes a median of 573 tokens... solves 43 of the 100") and withholds the non-reasoning side by design (comment L820-822); the reader cannot see the comparison in words. P5 §5 "Up is the share of the same 100 MATH-500 problems it solved" (L998-1002). P7 L701-711 three chart lines explained as three paragraphs. P11 L1302-1325 wash chart caption. P13 L626-628 the two dials defined by double negation ("one run given a hundred times the training compute, not a hundred runs").

**Rule for the fix.** Give both sides of every comparison in one sentence with the numbers side by side. Name axes in plain words ("how many tokens it wrote" across, "how many of the 100 it solved" up).

## CP9. Grammar, typography, layout

- P3 L433: "Epoch project the largest training set forward from its own trend" should be "Epoch projects" and the sentence should be rewritten.
- P3 L538: em dash inside section 2's first paragraph ("what it had read &mdash; more reading cannot answer it"), the only one in Act 1.
- P3 layout: section 2 is a heading plus one paragraph in the content column (L531-541); the "Why bias happens" margin note (L545-557) shares its grid row and is taller, so the closing box (L560-565) drops below the note, leaving white space under the paragraph. Grid is `lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start` at L275. Fix options: move the note beside a taller block, or put the closing box inside the section.
- P7 L885: the deck's only exclamation mark ("could not even break a tie!").
- P10 replay captions L276, 277, 295, 297, 301: em dashes in animation strings.
- P8 L828 "As you can see from the graph"; L835 "ironically."

## CP10. Stale or broken content found in passing

- **Contamination caveat is missing.** SUBMISSION.md and P15's own header comment (L76) say pages 15 and 16 state that benchmark contamination discounts every accuracy number in Acts 2 and 3. Neither page contains any such text. Either restore it (one sentence, page 16 takeaways) or correct SUBMISSION.md.
- **P12 asks a question it never answers.** L437 "What happens when you take the answer key away?" The `StarLoop` component implements the key-off state (L275-289) but is hard-wired `<StarLoop filter />` at L458, and the test pins the absence of a toggle. This is also the page's stated concept's second clause (pages.ts L61). See docs/act_1_refactor.md F1.
- **P1 never states half its concept.** pages.ts says "the size of the problem sets the thinking time." The stopwatch is on screen (L170-172) and the prose never mentions it.
- **Navigation.** Reviewer 1's nav complaint is fixed at commit 9905550 (current chapter highlighted, `aria-current="page"`, scroll-to-top on the active chip). The reviewed deployment predates it. Redeploy.

---

# Part 2. Page-by-page flags

Format per page: status, opening line, in-section references, Claudesque passages, figure clarity, cuts, author drafts.

## Page 1. Think Fast, Think Slow

**Status:** keep, small edits. ~200 words, 80% core.

- Opening line: fine.
- In-section refs: L226 closing bridge "The next page asks a question that looks like recognition and is not, and watches a machine answer it on reflex." Rewrite without "the next page" or cut; the JSX comment at L222 records why it exists (page 2 used to open cold), so page 2's new lede must absorb the bridge.
- Claudesque: L154 "You didn't compute it; you recognized it." L162 "Automatic · Effortless · Recognition, not work." L196 "Deliberate · Sequential · You feel every step." L218-219 four-adjective list answered by a three-adjective list. L220 "Recognizing an answer and constructing one are not the same act."
- Missing content: one sentence pointing at the stopwatch, so the concept's "size sets thinking time" half is on the page.

## Page 2. Thinking in Reality

**Status:** author says it looks good; reviewed regardless. Mostly fine. Three local edits would help.

- Opening line: "What does it take for an LLM to be useful (helpful, harmless and honest) in the real world?" cites Askell et al. 2021 (L197, L300-302) and never returns to helpful or harmless. Suggest a lede that states the page's count: one reflex answer, two different failures.
- Concept lands late: "Both misses share a shape" at L275, ~309 words in. Hoisting one line of it into the lede fixes the emphasis.
- Redundancy: L222-225 repeats L215-220 in weaker words. L254-258 (WinoBias generalisation) repeats what the widget just showed; page 3 L545-551 already carries a better version of the same note.
- Claudesque: L245 "quietly counted"; L246 "That is a knowledge bias, and it is not the knowledge gap."; L252 "Nothing was missing from its memory."; L254-255 colon-and-antithesis definition; L288-289 "a confident wrong answer into a flagged one, and a flagged one into a reason to go look"; L293 "Same weights, same training data, same cutoff."; L296-297 "what it buys, how to buy more of it, and where buying more stops helping" plus "the subject of the rest of this story."

## Page 3. Training-Time Scaling

**Status:** large rewrite for language; shrink for CP3. ~660 words, ~35% history.

- Opening line: structure is good (names the plan, both walls, the residual bias). De-tic: "The bill says no, then the data says no."
- In-section refs: L537 "Page 2's model held the 2023 title the whole time and dropped it anyway" (with the em dash at L538). Rewrite as "The model held the 2023 title the whole time and dropped it anyway."
- Grammar: L433 "Epoch project the largest training set forward from its own trend, about ×N a year. Drag the year." Rewrite the whole caption; suggested sense: "Epoch projects how fast the largest training sets grow, about N times a year. Drag the year to see when that line meets the stock of text that exists."
- Layout: white space between section 2's paragraph and the closing box (CP9).
- Claudesque, flagged for rewrite: L270-271 "The bill says no, then the data says no. And even if both said yes, it would do nothing about the bias."; L293 "Training price is not a fixed number"; L387 "Retraining resets the clock. It does not stop it."; L392-393 "There is no retraining for one missing fact. You buy the whole distribution to obtain a single result."; L409 "Suppose money were no object. It still fails."; L413-415 "So the ceiling was never money. It is how much there is worth reading, and no budget buys tokens that do not exist."; L433 "So when does the field actually reach the ceiling?"; L469-471 restates L415; L538-541 the bolded antithesis pair; L549-550 "a quieter reading"; L561-564 closing box (three-part list plus before/after antithesis); L175 "The band is the cited window, not a burn rate; nothing here depletes."
- Ordering: L406-416 detours through Chinchilla and a definition of "parameter" before the 300T stock card at L417-428. Put the number first, the reason second. Keep the parameter gloss (comment L407-408 records it as the deck's first load-bearing use).
- Cuts: L376-380 Gemini Ultra figure; L478-487 "inside the window below" forward reference and the undrawn compute-based projection aside.
- For CP3: decide whether the page keeps both charts or becomes one chart plus the bias section (decision D2).

## Page 4. Reasoning: Diverse Pathfinding

**Status:** on the chopping block (decision D1). ~420 words, lean, but it delays the subject.

**My recommendation: cut it as a page.** Reasoning:

- Its job is to seed "many roads, one answer" for majority voting (page 7) and search (page 10). Neither page references it. Page 7 does not use the word road or pathfinding anywhere. Page 7's pizza parable (L579-583) already teaches diverse-but-uncorrelated in ~95 words with no numbers. The seed can be one sentence there.
- Pages 1 to 3 already establish reflex versus deliberate thinking and that retraining cannot fix reflex errors. Page 5's author draft opens on "double-digit mathematics problems... you write it down, step by step on scratch paper," which does page 4's real work (a chain of thought is the written-down steps) in two sentences.
- The three-culture multiplication is exactly the kind of content a reviewer reads as "interactive history lesson" even though its history is its mechanism.
- Its prose has the densest tic count in Act 1: L424 "And here is the surprise:" (three tics in one clause), L546 "Three journeys, one destination: 223,300.", L547, L548, L559-560 tricolon, L563 "Act 2 opens that toolbox."

**Dependencies if cut:**

- Page 14 uses the 223,300 problem (350 × 638) as its GRPO reward example ("does the answer equal 223,300?"). It needs a one-line local statement of the problem, or a different example. `authored.ts` holds the shared data.
- pages.ts Act 1 range, the landing page contents column, the ProgressRail chip count, KeyboardNav's LAST, page16's per-question source pages, and every test pinning "16 pages" all move if pages are renumbered. The repo has precedent for leaving gaps (SUBMISSION.md records the 2026-08-10 cut). Recommend renumbering, since CP2 removes most page references anyway.
- The Vedic Mathematics reference and the three walkthroughs go with the page; nothing else imports them.

**Alternative if kept:** collapse to a half-page inside page 5's section 1 (one method walkthrough, not three), and drop the summary cards at L526-541 that repeat step 1's strings.

## Page 5. Chain of Thought: Reasoning Out Loud

**Status:** rewrite openers; flag sections 2 to 5. ~1,390 words, ~22% provenance.

**Opening line.** Current: L590 "Act 1 ended on a question: can a machine be walked down a road? A model you can download in 2026 walks it unasked, so the only way left to measure what the road is worth is to take it away." Author draft:

> Let's start diving into how reasoning works at its core, and what happens when you ask a reasoning model to blurt the answer (System 1) instead of letting it think (System 2).

**Section 1 paragraph.** Current: L608-618 "Page 1 handed you 17 × 24 and you did not recognise the answer, you built it..." Author draft:

> We've established that in double-digit mathematics problems, it is tough to simply blurt the answer. Instead, you write it down, step by step on scratch paper. A chain of thought is exactly that, the steps that you write onto that scratch paper. There is, however, an important difference. As we write down our steps, those steps are mostly a report of the thinking that we have done. You're "showing your work". For language models, these steps are not a report, they ARE the model's thoughts. The model must write down a step before moving on to the next. A common way to prompt a model to utilize chain of thought is by appending "Let's think, step by step" to your prompt.

Keep the Wei and Kojima citations attached to this paragraph.

**Section 2, flagged for review.** L648-652 "A model you can download in 2026 does this natively. Nothing has to ask it to: given a hard maths question and nothing else, Qwen2.5-3B-Instruct writes 231 tokens of chain before it answers." Also L654-660 the greedy-decoding methodology paragraph (70 words) standing between the reader and the stepper; L705 "Highlighted: the whole of the manipulation."; L706 "The prompt ends there. Nothing in it asks for working." Keep the token and greedy glosses (comment L636-644 asks for them) but move them beside the card as chips or a margin note.

**Section 3, flagged for review.** L824-829: "One trace proves nothing, so both prompts were run across 100 problems from the same difficulty band. Below is that comparison: the same model, reasoning against non-reasoning. Reasoning, it writes a median of 573 tokens of working and solves 43 of the 100. Each square below is one of those 100 problems; the switch is the same suffix you just read." Two problems: Claudesque, and one-sided. The data already carries the non-reasoning side (`CLOSE.blurt_median_tokens` = 5, blurt solved 7 of 100). Author's proposed shape:

> Reasoning: median of 573 tokens, 43 of 100 solved. Non-reasoning: median of 5 tokens, 7 of 100 solved.

Note: the JSX comment at L820-822 says the non-reasoning number was deliberately withheld "so the switch has something to deliver." The author's direction overrides this; record the override in the comment when the edit lands.

**Section 4, flagged for review.** L928-935: "Each bar below is one model's score, cut in two: on the left, what it still gets right with no reasoning; on the right, what the working adds. Bigger models are better at maths, so the bars get longer going down. Watch where the left piece ends instead." Also L970-977 "the flat floor is the finding" said twice; L982 "Three checkpoints are not a scaling law."

**Section 5, flagged for rewrite.** L997-1002: "Figures 1 and 2 are one checkpoint, the 3B. Here are all three, each plotted twice. Across is the median number of tokens the model wrote per problem, on a log scale because the two prompts sit two orders of magnitude apart. Up is the share of the same 100 MATH-500 problems it solved." Rewrite in plain axis language. Also L1041-1049 re-reads six plotted numbers; keep only "The tokens move with the prompt; the accuracy moves with the model" (or a plainer version).

**Other.** L1055-1056 close "Page 6 asks how much of that working it actually needed" (CP2). Provenance ledger L1012-1033 and the four margin notes (CP6). L806 "This is a specimen, not evidence."

## Page 6. Thinking Longer

**Status:** strongest teaching page; tone pass and de-duplication. ~1,420 words, 70% core.

- Opening line: L1166 "Page 5 gave the model a chain. A chain has a length, and that length is compute you pay for, one token at a time. So put the length on a dial and turn it." Drop the first sentence; the rest is a good lede.
- In-section refs: L1188-1189 "Every figure on this page carries its own copy of this dial, so nothing you do here moves anything below" (UI note; move to a tooltip); L1345-1346 "That is Act 1's slow deliberate System 2, priced in the only currency a model has"; L1639 "page 7 turns on the difference"; L1680-1681 "Page 7 asks what N voters at X each are worth."; readout string L934 "is page 7's question."
- Claudesque, flagged: L1341-1345 "the tinted line is ours, not its conclusion... the verdict does not slide, it flips... a threshold and not a gradient"; L1372 "A cap, not a request:"; L1392 "One problem is an anecdote."; L1436-1437 "Three heights, one shape, and the shape is the part that is not about any of these checkpoints."; L1523-1524 "did not run out of room, they ran out of ideas"; L1526 "The dial was never what was holding them back."; L1550 "Everything above takes room away. This does the opposite"; L1590 "Both crossings are thick and they cancel."; L1609 "It redistributes rather than adds."; L1615-1616 "a null and not a finding"; L1663 "The dial has a far end, and you have reached it."; L1666; L1672 "A different chain is another matter."; L1673-1674.
- Duplication: step 4 null stated three times (L1587-1594, L1603-1605, L1608-1618); close L1662-1683 re-reads numbers already drawn.
- Pacing: L1181-1190, 117 words before the reader touches the dial; move the forcing-procedure detail into the card label.

## Page 7. Frequency Voting

**Status:** restructure section 3; the diversity proof is buried. ~1,405 words.

- Opening line: L564 "Page 6 made one chain longer, and ran out of road. So..." Rewrite without the recap.
- In-section refs: L616 "every chart on this page"; L710 "That is what pages 5 and 6 ran, and it makes all 16 chains the same chain" (needed content: greedy makes every chain identical; say it without the page numbers); L898-899 "Page 8 re-runs this protocol, lands where this page landed, then changes one rule."
- Emphasis: the concept's second half (voting needs diverse paths) is asserted at L586-588 (~175 words in) and proved by the flat T=0 line at L790 (~800 words in), inside a 406-word figure card (L712-828) that also holds a slider readout, a band note, a McNemar explanation, and a temperature table. Split step 3 in two and promote the flat line.
- Legend-in-prose: L701-711, three chart lines explained as paragraphs before the chart (CP8).
- McNemar explained again: L766-787, near-identical to P5 L902-907 (CP6).
- Claudesque, flagged: L575 kicker "the idea, before the measurement"; L579-581 "You do not know whose taste to trust, so you do not pick a person: you hand out slips of paper"; L586-587 "Nobody had to be right on their own."; L613 "Here is one box."; L667-668 "Agreement concentrates; the rest is a scatter of near-misses"; L740-741 "One sampled chain is not a vote yet."; L790 "The flat line is the point."; L792 "Diversity is the whole mechanism."; L824 "Disagreement is necessary and not sufficient"; L842-843 "Read it as two lines, not two experiments"; L845; L856-858 "Dividing a budget does two things at once. One... and two... The shortening is the one that lands."; L863 "Splitting is not what fails, capping is."; L866-867 "The second one is the winner."; L878 "The pile knows more than the count."; L885 exclamation mark; L899 "stop counting, start judging."

## Page 8. Best-of-N and Verifiers

**Status:** shortest and most economical Act 2 page; local edits. ~920 words.

- Opening line: L634 good. Keep.
- In-section refs: L364, L509, L641 "Then the part nobody promised us: page 7's vote"; L654 "Page 7 counted the chains and kept the answer most of them agreed on"; L722 "page 7 counts a tie as no answer"; L763 "The majority-vote row is page 7's counting rule"; L813 "Grading the steps is the next page."; L882 "And page 7's leftovers are still mostly leftovers."; L893 "Turn the page."
- Claudesque, flagged: L641 narrator intrusion; L657-658 "so the rightmost dot is not counting in disguise" (pre-emptive rebuttal before the figure); L723 "Voting needs a crowd before it beats not voting."; L779/L873 "the source we build on"; L786-787 "A judge that grades presentation is worse than not choosing at all."; L828 "As you can see from the graph"; L835 "ironically"; L863 "Selection works."; L866 "Two routes to the same place, and one of them is free."; L871-876 "That contest is ours."; L891-892 "So the question is not how many candidates, nor even how good the judge is, but what the judge is reading."
- Structure: closing section L860-894 has four paragraphs where two would do; the confound paragraph inside L826-851 is the load-bearing part and should be promoted.

## Page 9. Outcome vs Process Supervision

**Status:** best-paced page; cut caveat density. ~1,600 words, ~28% caveat.

- Opening line: L321 good. Keep. L324-326 "Every maths teacher who said 'show your work'..." is removable.
- In-section refs: L639 runtime string "this page"; L717 "page 12's filter would fine-tune on it"; L887 "Turn the page."
- Claudesque, flagged: L351 "The unit is the step, not the word."; L616 "One line, named. That is the whole of what an outcome grader cannot tell you"; L625 "which is the whole difference between a fact and a score"; L706 "That is the case that needs no argument"; L715 "A right answer is not a right chain."; L719 "the honest answer is smaller than the story wants"; L730 "Nothing underlined means nothing computable, not nothing wrong."; L785 "A floor, not a rate."; L809 "An opinion, not a proof."; L859 "And it usually breaks once."; L868 "the whole case for grading steps"; L872 "Read the shape and not the digits."
- Caveat stacks: L769-820 four-entry list under the two-bar figure (~220 words; the page's own comment L41-47 records cutting a fifth for this reason); L836-848 "Read it as a direction, not a digit" under a number; L866-875 caption restates the finding in the counterfactual.

## Page 10. Searching Through Thoughts

**Status:** widget is excellent; prose around it is provenance. ~800 words, ~20% meta.

- Opening line: L340 good. But L352-359 immediately follows: "Nothing here is a measurement of ours. Pages 5 to 9 each ship the run their numbers come from. This page ships none." Collapse to one clause or move to the download label.
- In-section refs: L460 "Greedy is what you just did"; L464 "Nothing on this page checks whether a line can still rhyme"; L711-713 second provenance statement; L790-794 "Everything on pages 5 to 10 spends the same thing... Turn the page."
- Concept assembly: branch half at L346; full concept (plus the per-node cost) not until L460-468 and the bill counter at L664-674, ~250 words in, ~170 of them provenance.
- The hardware apology: L722-737, ~65 words on why the five strategies were not run head-to-head ("That is a limit of the hardware, not a verdict on the algorithms"). Cut to one clause.
- Claudesque, flagged: L344 "a chain: a single line, written forward, with no way back"; L371 "That is the whole rule."; L437 "The trap is not a toy."; L446 "That is what a chain of thought does."; L466 "the shape of the lit-up region is the strategy"; L695-696 "Being likeliest is not the same as being right."; L763-765 "That is the whole argument in two bars: what search buys is not more thinking, it is the ability to take a thought back."
- Typography: em dashes in replay captions L276, 277, 295, 297, 301.

## Page 11. The Keystone

**Status:** section 1 is the page; sections 2 to 4 are a literature review. ~1,600 words, ~35% history. Largest single cut in Act 2.

- Opening line: L1042 "A bigger model and more thinking are two ways to spend the same FLOPs." Keep. Then L1045-1046 "Act 2 built the answer-time kind. Matched bill for bill on the deck's own run, a 3B against a 7B" (CP1, CP2).
- In-section refs: L1085 caption "measured on this deck's instrument: the hard band is pages 6 to 8's own 100 MATH-500 level 4 to 5 problems, and the run reproduces their shipped numbers exactly before it draws anything new (gate 1)"; L1168 "(page 8)"; L1288 "Section 2 allocated by prompt; this allocates by budget."; L1340 "Section 3 varied how much compute; this one varies how it is spent."; L1388-1393 "Act 3 stops selecting... Page 12 keeps the winning chains... Pages 13 and 14 reward only correct answers."
- Emphasis: the selection wall, the page's own finding, first stated at L1189-1191 after ~460 words.
- History: L1227-1229 "That was one model family, on one date. The published record says the opposite is possible... The rest of this page is that record"; §2 Snell (L1218-1264); §3 Wu on GSM8K (L1274-1331) with a 227-word caption (L1302-1325) of which ~40 words are the finding; §4 Wu on MATH500 (L1331-1376), which re-teaches page 10's "better search" lesson. Proposed: cut §4 outright; reduce §2 to the one sentence that names compute-optimal allocation and its condition (small model with a foothold); reduce §3 to its figure with a two-sentence caption, or cut.
- Claudesque, flagged: L1180 "the bottleneck is not the thinking, it is the picking"; L1185 "The chains are not breaking; the reasoning is there. What fails is selection"; L1202 "Scaling the parameters, not the samples"; L1234 "Three numbers carry it."; L1254 "Hard mode is the other boundary:"; L1304-1325 six stacked hedges; L1384-1385 "Two loose ends are left. The selection wall:... And the waste:".

## Page 12. STaR and Self-Improvement

**Status:** best concept-to-first-word ratio in the deck; cut redundancy and the closing recap. ~620 words, ~25% meta.

- Opening line: L435 good. Keep. L437 "What happens when you take the answer key away?" is never answered (CP10).
- In-section refs: L98 annotation "section 1's answer key"; L472 "The same loop from section 1, in ten lines."; L601 "Page 9's outcome-versus-process trade, now deciding what the model becomes."; L607-618 two-item Act 2 recap naming page 11 and listing five levers in a parenthetical; L619 "This page is the other"; L625-628 "o1 and R1 keep this loop's shape... Page 13 picks it up from there."
- Redundancy: the loop is explained four times (prose L444-454, diagram L458, pseudocode L481-494, caption L483-493). Cut the prose paragraph to two sentences.
- Closing block L605-628: 160 words, a quarter of the page, in which the reader learns nothing new about STaR. The header comment L38-45 says it was added by review request; re-decide.
- History: disciplined. ExIt 2017 (L484-491) is load-bearing ("this is RL, and it predates LLMs"). Header comment L65 records "V-STaR/ReST lineage deliberately omitted, intuition over history." Keep that stance.
- Claudesque, flagged: L464-466 "Everything rests on the answer key:"; L485 "is not just similar to reinforcement learning: it is the same procedure"; L585-586 "is the page's point"; L587 "The value was never the answers, it was training on the reasoning."; L598 "isn't just kept, it's imitated"; L600 "That is not hypothetical:"; L616 "without buying a single parameter"; L602 verbless fragment.

## Page 13. Frontier Reasoners I: o1

**Status:** large rewrite. ~1,270 words, ~30% history, 17 page references, 30 colons and 30 semicolons.

**Reframe (author direction).** The page is about the two ways inference-time scaling can be used: (1) spend compute at answer time, by thinking longer or thinking better; (2) bake reasoning into the model weights, via STaR or other frameworks. o1 is presented as a good example of a model trained by reinforcement learning to reason better at inference time. State the caveat that the algorithm was never published, then give the high-level generate-k, reward, reinforce loop in figure 1, matter-of-factly. Reference concepts, never pages.

- Opening line: L525-530 "By page 12, compute had split in two: the compute spent at answer time (pages 5 to 11: votes, judges, search) and the compute already sunk into the weights (page 12: the reasoning trained in). o1 is the first commercial model to turn both dials, and it kept the recipe." Rewrite per the reframe; drop the priority claim.
- Section 1, current framing is historical: L543-551 "Page 12 closed on a promise: same shape, disguise dropped. OpenAI confirmed the frame... its own researchers later named the category: 'large reasoning models (LRMs)...'" (the LRM definition is never used again). L550 "The algorithm itself was never published" stays, as the caveat. Sub-labels L564, 570, 576 all start "page 12"; caption L581 "Page 12's strip, redrawn"; L584-586 "This deck will not print a line of o1's pseudocode, because nobody outside OpenAI can check one; page 14 prints an algorithm from the lab that published it." L593 "page 3's finite stock of human text."
- Section 2: L616 "Page 11's law: model size picks your curve; test-time compute slides you along it. o1's announcement charts are the same picture with the curve-picker swapped." State the law in its own words. L629-631 "section 3 stacks it... same maths as section 3." L626-628 double-negation dial definitions. L694-704 close restates the figure; L700-703 economics tail. L705-712 fidelity note (85 words) to a footnote. L709 "this deck's construction."
- Section 3: bar labels L502 "page 7's voting" and L508 "page 8's re-ranker" become "majority vote" and "verifier re-ranking." L728 "First answer: stack. Act 2 did not become obsolete; it became the second storey." L762-783 the o1-ioi / early-o3 ablation sub-section (heading, badge, card, 92 words, no interaction): cut, or one sentence.
- Section 4: the four open questions are motivation for page 14 and can stay, shortened. L815-819 close ("that is exactly what a closed lab keeps... It will sell you the curve; it will not show you the machine that makes it."). L822-825 handoff "Four months later an open lab answered... Turn the page."
- Claudesque, flagged: L543; L583 "The shape is the whole of what was confirmed."; L590 "legible by its absence: a human."; L636-638; L695-696 "Thinking slides you along the curve; only training lifts it."; L711 "The slope is the claim; the absolute compute is a secret."; L728; L754 "the last three are alternatives and not a ladder"; L757-758; L770 "Second answer: turn the knobs"; L781 "Stacking pays once; the knobs compound."; L817; L818.

## Page 14. Frontier Reasoners II: DeepSeek-R1

**Status:** best-argued Act 3 page; trim head and tail. ~1,110 words, ~18% history.

- Opening line: L872-877 "Page 13 closed with four questions about what sits behind the thinking dial, and no way to answer any of them from outside. In January 2025, DeepSeek published all of it... Where does the backtracking come from?" Rewrite without the recap and date; consider stating the emergence claim as a claim rather than a question, since the reader currently waits ~300 words for it (L1042).
- In-section refs: L204 stage note "Page 10's branch, score, backtrack, with the harness deleted" (otherwise the best teaching sentence in the set; keep, rename the concept); L459 axis label "page 11's test-time compute"; L412 alt text; L919 "Page 7 sampled many chains and picked among them at answer time"; L1031 "Add page 7's majority vote"; L1066-1067 "which is the distinction page 13 could only assert"; L1110 "Page 13's two knobs were never equally available"; L1134 "page 12's recipe with a far stronger teacher"; L1172 "And page 3 said the stock of human text was finite."
- History: L1031-1033 "level with OpenAI-o1-0912"; L1109-1116 frontier-lab economics paragraph (the header comment L13-16 already says the lede must not re-erect page 13's frame); L1170-1184 peroration plus two-page benchmark retrospective.
- Provenance duplicated: L1079-1085 and L1193-1198 say the same thing about the Table 3 trace.
- Claudesque, flagged: L962 "Learning lives where the group disagrees."; L1001-1002 "Nothing in the recipe mentions reflection. Nothing in the reward mentions length."; L1002 "Watch both curves anyway."; L1042 "Length is not a schedule anyone set:"; L1065-1066 "Count the traces: there is one, allowed to run longer. Not many chains sampled..."; L1070 "Notice what the loops rule out."; L1073-1077 "These tokens cannot be that... Re-derivation is not narration"; L1118 "Not free:"; L1120-1122 "The claim to check on the chart is not 'R1 is good'; it is that..."; L1174 "One good reasoner now writes the curriculum for everyone else."; L219 "bigger is not automatically better."

## Page 15. When Reasoning Breaks

**Status:** tightest page; strip cross-references and demote caveats. ~1,080 words, 14 page references (seven to page 8).

- Opening line: L706-707 "For fourteen pages the dial has mostly pointed one way: more samples, deeper search, longer chains, more accuracy. This page is the fine print." Rewrite; the thesis sentence at L707-710 is good and can lead.
- In-section refs: L777 "Step 1 was a revision you asked for"; L779 "page 6's accuracy"; L852 "page 7's coverage without page 8's selector"; L887; L912; L922 kicker "page 8's judges"; L926-928 "Step 2 leaned on a judge, and page 8 sold one: selection beats voting, up to the ceiling its reliability sets. That sentence quotes reliability as though it were a property of the judge. It is not."; L970 "diversity page 8 was selling"; L1008 "Page 9 is why"; L1018 "(page 8)"; L1019 "Step 3 adds which judge"; L1024 "(page 14)"; L1037 "every repair on this page"; L1041 "every lever in this story."
- Caveats to demote: L803-810 axis bound (72 words, also quiz q5 on page 16); L844-854 "Not a strategy."; L881-895 "Length alone is worth something." (a second finding parachuted into the overthinking section); L964-967; L986-990 hedge stack.
- Claudesque, flagged: L725 "No hints, no tools, just re-reading."; L752 "The reason is structural:"; L809 "The axis runs out before the model does."; L845 "Not a strategy."; L877-878 "and it is about capability rather than budgets"; L892 "thrashing, not depth."; L928 "It is not. It is a reading taken at a setting"; L961 "Turn the dial up."; L977-978; L980-981; L1024-1025 "not requested politely at inference time"; L1037-1038 "The verifier reads the chain, the reviser reads the chain, and the reader reads the chain"; L1041 "Hold that."
- Missing: the contamination caveat (CP10).

## Page 16. Wrap-Up

**Status:** takeaways are the strongest writing in the deck; fix the joints. ~805 words plus ~650 of quiz.

- Opening line: L301 "The past fifteen pages are a small but mighty snapshot of what inference-time scaling is under the hood." Cut; start at L304 without "Here is."
- Deck self-reference: L313 kicker "pages 5 to 11"; L317-319 "Each page measured its own lever against its own baseline, so none of them could draw this. Now that all of them are behind you"; L392 "this deck could not make it pay"; L401 "this deck never ran it"; L411 "this deck cannot tell you how it splits"; L424 "In the deck's order."; rung labels L189 "· page N" (name the lever).
- Provenance: L282 five download chips above the fold; L341-347 restates them ("re-derived without a GPU").
- Takeaways 5 and 6 (L398-412) retract themselves in their back halves; move the disclaimers to a caption.
- L417-428 quiz-mechanics paragraph: cut; the widget is self-evident.
- Claudesque, flagged: L306 "whether the mechanisms landed rather than whether the numbers stuck"; L372 "Reasoning is worth having. It is not worth forcing."; L390 and L405 negation titles; L395; L434-437 45-word three-clause peroration; L438 "That is where the field is, and where you now are."
- Quiz `why` texts (page16.ts): L562 "and that is exactly the gap answer-time compute was invented to fill"; L644 "That is the whole case for grading steps"; L688 "'Are you sure?' is not information."
- Missing: the contamination caveat (CP10).

---

# Part 3. Proposed order of work

Nothing below is started. Each phase is a separate review with the author before any edit.

1. **Structural decisions first** (Part 4). Page 4's fate and page 3's size change the numbering and Act 1's lede chain; settle them before touching prose.
2. **Opening lines, all pages** (CP1). One pass, sixteen ledes, each reviewed against the rule: idea first, no page numbers.
3. **In-section references** (CP2). Mechanical pass from the inventory above, including labels, sub-labels, kickers and alt text. Add a test that fails on `page \d` in rendered text outside page 16's quiz attribution, so the hazard cannot re-accrue (finishing_touches.md already calls stale cross-references "this repo's signature hazard").
4. **Page 13 reframe and page 11 §§2-4 cut** (CP4). The two largest content changes; each gets its own spec under docs/.
5. **Provenance and caveat demotion** (CP6, CP7). Per page, move ledgers and tolerance notes out of the reading column; delete second and third tellings.
6. **Sentence-level language pass** (CP5, CP9). Page by page, against the quiz-bank register. Page 3 and page 13 first, since the author has already flagged them.
7. **Repairs** (CP10): contamination caveat, page 12 toggle, page 1 stopwatch sentence, redeploy for the nav fix.
8. **Re-measure.** Word count per page after each phase. Working target: the deck near 8,000 words of prose with every interactive element intact.

# Part 4. Decisions for the author

- **D1. Page 4.** Cut as a page (recommended), or collapse into page 5 section 1. If cut: renumber or leave a gap; page 14 needs a local statement of the 223,300 problem.
- **D2. Page 3.** Keep both Epoch charts, keep one, or reduce to the bias section plus a one-paragraph cost argument. The subtitle "and the training-time loop behind it" on the masthead and in the citation metadata is the same question at deck level.
- **D3. Page 11 sections 2 to 4.** Cut §4; cut or compress §2 and §3. Decide whether the Snell "compute-optimal" name needs to survive anywhere.
- **D4. Page 13 ablation sub-section (L762-783).** Cut or one sentence.
- **D5. Page 12 closing recap (L605-628).** It was added by an earlier review request; keep, shorten, or cut.
- **D6. Page 5 section 3.** Author direction says show both sides of the comparison; the page comment says the non-reasoning number was withheld so the switch has something to reveal. Author direction wins unless reconsidered.
- **D7. Contamination caveat.** Restore on page 16, or amend SUBMISSION.md.
- **D8. Cross-reference test.** Add a rendered-text guard for page numbers, as page 11 already has for em dashes.
