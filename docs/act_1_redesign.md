# Act 1 redesign: decision record

**Branch:** `act-1-redesign` (on `dev/camera-ready`). Everything below is implemented and pushed unless marked **Open**.
**Why this work:** both VISxAI reviewers said the explainer is slow to reach its point (Reviewer 1: "an interactive history lesson", "may not be getting to the point"; Reviewer 2: "too long", "lack of clear emphasis", "Claudesque language"). Act 1 (slides 1 to 4, about 30% of the deck) centred on training, not inference-time scaling, and taught "reasoning" without tying it to spending compute at answer time.
**Rules applied throughout:** no em dashes (each Act 1 page now has a test for it); no page or act numbers in copy; citations beside the claim; plain sentences over aphorisms; cut anything said twice.

IDs (S1.1, S2.3...) are for the summary table.

---

## Slide 1. Think Fast, Think Slow

**S1.1 Opening kept as the original, one sentence dropped, one added.** "Your mind runs two systems. System 1 is fast, automatic, and effortless. System 2 is slow, deliberate, and effortful. Each is important in its own way, and neither can replace the other." Cut: "One operation, multiplication, flips you between them."
*Why:* mentor's call; the home page already defines inference-time scaling. The added sentence sets up training and answer-time compute as partners. (An opener naming inference-time scaling was built and then reverted; see R.1.)

**S1.2 Section 1 retitled and framed.** "Meet the two systems" becomes "Meet your two systems"; new intro line "Let's take the example of multiplication to illustrate the two systems."; new closing line under the figure: "3 × 4 is familiar, so **System 1** recognizes the answer instantly. 17 × 24 is not, so **System 2** has to build it step by step, and that takes time. For a typical person, it takes far longer than the 3.2 seconds shown here." (The examples and the time follow the figure.)
*Why:* "your" matches the opening; the closing line replaces two in-panel captions and says plainly that the animation is faster than a person.

**S1.3 One Calculate button runs both systems in lockstep.** Replaces "It's obvious" and "Work it out / Next step". Both stopwatches start together; one step per 0.8 s beat; step 1 lands in both panels on the same beat; each answer lands with its last step (System 1 at 0.8 s, System 2 at 3.2 s). Rows are reserved so the figure never changes height.
*Why:* a side-by-side race makes the speed difference something the reader sees, not reads.

**S1.4 System 2 gains a planning step.** "24 = 20 + 4" before "17 × 20 = 340", "17 × 4 = 68", "340 + 68 = 408".
*Why:* author's call; shows System 2 deciding how to solve before computing. Slide 5 skips this step when it quotes slide 1's results.

**S1.5 Three examples, replay then shuffle, reset.** 3 × 4 / 17 × 24, 5 × 6 / 23 × 14, 2 × 8 / 36 × 12. Calculate first runs the example on screen (at load and after Reset), then later presses draw a different one at random. Icon-only Reset (crimson, left); Calculate (teal, right). Try it note: "Press Calculate again for a new example, or the arrow to replay the same one."
*Why:* readers cannot memorise one answer; Reset lets them rewatch. Crimson and teal are the deck's own System 2 and System 1 hues.

**S1.6 In-panel captions and reveal lines cut.** Gone: "Automatic · Effortless · Recognition, not work", "Deliberate · Sequential · You feel every step", and the reveal lines under each answer.
*Why:* triplet captions read as AI-written; the closing line (S1.2) carries the idea once.

**S1.7 Section 3 definition rewritten.** "Same operation, two different machines... Recognizing an answer and constructing one are not the same act." becomes "System 1 recognizes or reacts as things happen, by reflex. System 2 spends more time to solve a problem you cannot recognize instantly. System 2 scales its effort with the problem, spending more time on harder ones to get them right."
*Why:* the reader feels both systems first, then gets a plain definition; "spends more time" is inference-time scaling in human terms, and "scales its effort with the problem... to get them right" says the extra time buys a better answer.

**S1.8 Sort it note.** "Correct drops lock in green; wrong ones flash red and bounce back." becomes "Correct drops are green, and wrong drops show up as red." *Why:* makes the direction more explicit: says plainly what green and red mean.

**S1.9 Closing note.** "Keep the distinction. The next page asks a question that looks like recognition and is not, and watches a machine answer it on reflex." becomes "Sometimes it is worth waiting for a more reliable answer than a quick one. People switch to System 2 when a problem is long or unfamiliar, and it is usually worth the wait."
*Why:* ends the page on the payoff of System 2 (a slower answer can be the better one) and when people reach for it, which is the idea inference-time scaling builds on; drops the page reference. Accurate to the page's source: people switch to System 2 for hard problems rather than living in it (Kahneman's System 1 runs most of the time).

---

## Slide 2. Thinking in Reality

Premise kept: knowledge gaps and bias are why inference-time scaling works. Delivery only.

**S2.1 Lede.** "What does it take for an LLM to be useful (helpful, harmless and honest) in the real world? What are the pitfalls of System 1 thinking in the real world?" becomes "What happens when an LLM answers with System 1 thinking in the real world? A single question about the World Cup shows at least two ways it can go wrong." The citation for "helpful, harmless and honest" (Askell et al. 2021) is removed.
*Why:* the old lede asked two open questions and the reader did not learn the page's point until section 3; the new one asks one question and answers it. The page never returned to "helpful, harmless and honest", so its citation pointed at nothing.

**S2.2 Knowledge gap paragraph.** Now: "A model only knows what was in its training data, and it can only be trained on data that existed before the **model training data cutoff**. Even events occurring before that cutoff can be missing if the data did not cover them. Together these create a perpetual **knowledge gap**, one that widens as the world creates new data every day." The follow-on paragraph ("In the example above, the model answered from what it learned, without thinking it through. System 1 thinking led it to an incorrect answer.") is cut; the pull quote follows the knowledge gap paragraph directly.
*Why:* the old text said the answer depends only on when a model was trained; a fact can also be missing because the data never covered it.

**S2.3 "Model training data cutoff" everywhere; the widget becomes a chat.** Slider label, Try it note, the knowledge gap paragraph and screen-reader labels say "model training data cutoff"; the status pill ("✗ one short" / "✓ current") is removed; the highlighted count carries the answer. The slider keeps its original design but its range is narrowed from Jan 2017 to Dec 2026 down to Jan 2026 to Dec 2026, opening at Jan 2026, with every month (Jan to Dec) marked under the track, each with its year stacked beneath it. The widget now reads as an LLM chat: the question sits on the right beside a person icon, the reply on the left beside a model (sparkle) icon, both as plain text with no bubbles or text labels (the icons carry "User" and "Model" as accessible names), and the cutoff slider sits below the conversation. Matching words share a highlight across the two turns: "Spain" with "Spain" in green, "How many" with the count ("once", "twice") in teal, and "FIFA World Cups" with "FIFA World Cup" in grey. The most important pair, "How many" and the count, is joined by a dashed teal line drawn between the two words (hidden on narrow screens where the reply wraps and the line would cross its text). Both turns are set in true monospace (`font-code`) (see R.2 for the redesign that was reverted).
*Why:* one term; and the pill is removed because the chat already shows the answer and the highlight marks the part that changes, so a verdict pill beside it was a third signal for the same thing. The narrower range leaves twelve positions around the one boundary that matters (the July 2026 final), instead of 120 positions with eight years that change nothing, and a range that short can label every month, so the reader sees where July is. A chat layout makes the widget look like something the reader has used, so it reads as a conversation with a model, with the control that changes the model underneath, and the paired highlights show which part of the reply answers which part of the question (the count answers "How many"; "FIFA World Cup" is where the men's-only reading hides, which section 2 picks up). The line singles out the count because it is what section 1 is about: the question asks how many, and the reply's count is what the cutoff changes. Monospace marks the turns as literal model input and output rather than prose; it uses `font-code`, the deck's one licensed exception to its all-serif rule, which the config reserves for code listings, so this extends that exception to machine I/O.

**S2.4 Bias section.** Opener is just "The question never said men's." (plain, not bold). Then: "Every answer above counted only the men's tournament. We call this a **knowledge bias**, a different problem from the knowledge gap." Then: "The women's 2023 win came before the cutoff and was widely covered, so the model almost certainly knew it. Given an ambiguous question, it went with the reading its data covered most and never said there was a choice. With a knowledge gap, the fact is missing. With a knowledge bias, the fact is there, but the model overlooks it." Then, with the WinoBias citation: "The same happens in ordinary sentences: when a sentence could refer to either of two people, models pick the stereotyped reading instead of flagging the ambiguity."
*Why:* 162 words become 111; the gains are in clarity and accuracy as much as length:
- **One statement of the difference.** The old text said it twice ("it is not the knowledge gap", then a colon definition). Now it is one plain pair the reader carries into section 3: with a knowledge gap, the fact is missing; with a knowledge bias, the fact is there, but the model overlooks it. Section 3 then fixes each in turn (rereading fixes the bias, a lookup fixes the gap).
- **Accurate about the model.** "Held the fact the whole time" became "almost certainly had it in its data", matching S2.2 (a fact can be missing even before the cutoff). "Resolved the ambiguity... never mentioned that it had chosen" implied a deliberate choice; the model never considered the women's title, so the text says it "went with the reading its training data covered most".
- **Shows the bias is general.** The pronoun example has its own paragraph, in plain words ("stereotyped", not "stereotype-consistent"), so the reader sees the same failure outside sports.
- **Honest label and plainer prose.** "We call this a knowledge bias" because the term is the page's own, not an established one; "quietly", "Nothing was missing from its memory." and the colon definition are gone.

**S2.5 Section 3, heading, opener and paragraph after the comic.** Heading "3. Thinking it through" becomes "3. Taking time to answer" (points at time spent at answer time, which the closing makes the point of the page). Opener: "Both of these failures stem from System 1 thinking, answering immediately. Here is what a System 2 pass does instead." After the comic: "In the first panel, rereading the question fixes the **bias** on its own, with no new information. The **knowledge gap** is different. The 2026 final was after its cutoff, so rereading won't help. Instead, the next two panels spot the gap and then fix it with a lookup."
*Why:* the fix was explained before the reader reached it: the old opener spelled out what the comic then showed, and the paragraph after the comic explained it again. Now the opener only introduces the comic, the comic carries the fix, and the paragraph after it points at the panels.

**S2.6 The comic keeps its lookup; panels cut to one line.** "It says FIFA World Cups, not men's. Both teams count." / "My training data ends in early 2026. A newer final could be missing." / "Name the tournaments I'm counting, and check a current source." / "Men's: 2010 and 2026. Women's: 2023." Panel 4's title "Count what the question actually asked" becomes "Now draft the final response"; the other titles and "Three." are unchanged.
*Why:* rereading, noticing a limit and looking something up are all compute spent at answer time, so all are inference-time scaling; the prose now names the lookup as what supplied 2026. Tool use is introduced here only, not as a lever the deck returns to. Each panel is cut to one line because the panel titles already name each step: the full sentences made the comic the largest block of text on the page (about 110 words, now about 45), and a comic strip should be scanned, not read.

**S2.7 Closing box.** "Nothing about the model changed... where buying more stops helping." becomes "The model itself never changed between the two answers. It had the same training data and the same cutoff. The only difference is that it spent more time to reason and reference. Why not just retrain the model on newer data instead?"
*Why:* shows, on a real example, that the only change was time spent at answer time, reasoning and looking things up (the comic's two moves), then hands off to slide 3's question. It no longer names the term ("That is inference-time scaling." was cut). The cut line "where buying more stops helping" is saved for slide 5 (Back pocket).

**S2.8 Unused trace wording.** The unrendered `SPAIN_WORLD_CUPS.thinking` trace now says "My training data ends in early 2026". *Why:* consistency with S2.3.

**S2.9 Pull quote colour.** The two pull quotes ("Are knowledge gaps addressable by System 2 thinking?", "Are knowledge biases addressable by System 2 thinking?") change from a warm cream background with a teal left rule to a centred question on a light tint of the teal they are set in, with no left rule.
*Why:* the cream was the only warm colour on a cool grey page and clashed with it; the teal tint matches the quote's own text and the chat's teal highlights above it. Centred with no rule, the questions read as a pause posed to the reader rather than as an aside, and the left rule is kept for the page's closing box.

**S2.10 Ideal answer set as a chat reply.** The ideal answer card drops its green outline, its "✓ all 3 titles" pill and its quotation marks, and is set like section 1's chat reply: the model icon, monospace text, and the same paired highlights ("Spain", "three" with the count, "FIFA World Cups"). The small label "the ideal answer" stays.
*Why:* the reader compares this answer with the model's reply in section 1, so it should look like the same kind of thing; matching highlights let them see that "three" answers the same "How many" that "once" did.

---

## Slide 3. Training-Time Scaling

Structure and both interactives kept. The page answers slide 2's closing question and lets the charts deliver the verdict.

**S3.0 Lede cut to its first sentence.** "A missing fact needs new knowledge, and the obvious way to supply it is to **train the model again**." The rest ("The bill says no, then the data says no. And even if both said yes, it would do nothing about the bias.") is cut.
*Why:* the first sentence sets up the page; the cut sentences previewed the sections' verdicts, and "it would do nothing about the bias" contradicted the page's own finding that retraining makes the bias worse.

**S3.0b Section 1 opener.** New line under "1. Challenges in addressing knowledge gaps": "Retraining runs into three problems: what it costs, how long it takes, and how much text there is to train on."
*Why:* with the lede cut to one sentence (S3.0), the section needs to say what is coming; the line maps sub-sections a (cost), b (time) and c (data) in order.

**S3.0c Sub-section titles.** "a. The bill compounds", "b. It always lags", "c. The data runs out" become "a. Rising cost", "b. Always behind", "c. Not enough text".
*Why:* plainer, and each names one part of the section's opener (what it costs, how long it takes, how much text there is); "compounds" and "lags" asked the reader to supply the meaning.

**S3.1 Section a, text above the chart.** The question, the cost facts and the verdict move out of the chart frame into one paragraph under the heading: "What would it cost to retrain a model every day for a year? Frontier training runs grow about ×2.4 more expensive each year, and one GPT-4-class run costs an estimated $78M. [1,2] Drag the slider to run the plan forward. For a few missing facts, that bill is not economically feasible." The chart's y-axis label "cumulative bill ($ billions)" becomes "cumulative cost of training ($ billions)", and the x-axis "months of keeping it up" becomes "time (months)". The legend shortens from "the same GPT-4 model, daily · flat $78M a run" and "the newest frontier model, daily · e.g. Gemini Ultra at $191M · its price climbs" to "same model" and "newest model" (the paragraph above and the cards below carry the prices). The area between the two lines is shaded in a light tint of the newest model's red, so the extra spend of chasing the newest model reads as a shape that widens over time (the removed "Chasing the frontier costs $X more" readout, drawn instead of written). At the point where the newest model has cost more than a full year of the same model (about month 8.6), a dashed vertical line marks that month (always shown, whatever the slider position), labelled "newest > 1 year of same model", and the chart to its right takes a faint red tint (the removed "Month N" callout, drawn instead of written). The empty-state readout "Nothing spent yet. Drag the slider to run the plan forward." the running readout "Chasing the frontier costs $X more so far, and the gap widens every month." and the red callout "Month N: chasing the frontier has already outspent a whole year at the flat rate." are cut (the two cards already show both totals; screen readers still hear the crossing announced), and the tag "derived from the two Epoch trends" is cut. The Sevilla & Roldán reference goes with its sentence (five references now).
*Why:* the chart already shows every dollar figure the old caption listed, and the frame now holds only the chart and its live readout, as in section c (S3.8). The last sentence absorbs the cut section "It cannot be aimed". The tag was first kept, then cut by the author: the citations beside the numbers name Epoch as the source.

**S3.2 Prior section c, "It cannot be aimed", was cut, and "The data runs out" moved from d to c.** *Why:* prior section c restated section a's cost with no new evidence.

**S3.3 Section b.** "...Retraining resets the clock. It does not stop it." becomes "A training run takes weeks, so by the time a model is finished, its cutoff is already behind. The gap shrinks, but it never closes." *Why:* plain statement instead of a slogan.

**S3.4 Section c, the data.** All of section c's text is one paragraph above the chart (the frame holds only the chart): "Suppose money were no object. Bigger models need more text: a **scaling law**, measured across hundreds of models, calls for about 20 **tokens** (pieces of text, roughly a word each) for every **parameter** (a number training adjusts). [3] Only about 300 trillion tokens of quality writing exist, and no budget buys tokens that do not exist. [4] Epoch projects the largest training sets growing about ×2.4 a year, likely between ×1.8 and ×3.1 (the shading). [5] The largest training set in Sep 2026: ≈63T tokens, 21% of all quality text. At this pace it runs out around mid-2028 (Epoch's range: 2026 to 2032). [4]" The month and figures are live with the marker. In the chart, the 300T stock line is a cap: labelled at its left end "Total quality tokens that exist = 300T tokens", with the area above it tinted. The year marker is fixed (the reader cannot move it) on the current month, Sep 2026, and labelled "Today"; the legend adds a shaded swatch for the band, "likely range (×1.8 to ×3.1 a year)"; the drag instruction and its Try it note are removed, and the readout gives today's value, interpolated from Epoch's yearly points.
*Why:* one place to read; the cap makes "no budget buys tokens that do not exist" visible; opening on today's month shows where the trend stands now. Says what the scaling law is rather than who found it; "calls for" a ratio, not a cap; tokens defined at first use. The caption's last sentence explains the shaded band (Epoch's 90% range), which the shorter readout no longer quotes; without it the shading is unlabelled.

**S3.5 Section c cuts.** The ≈300T stock card, the window meter, "The band is the cited window, not a burn rate; nothing here depletes.", the tag "cited stock, derived demand", and the "compute-based projection" footnote. The 300T citation moves onto its sentence.
*Why:* the section showed one point, that text runs out around 2028, four times:
- in the prose ("roughly 300 trillion tokens of quality writing");
- on a separate ≈300T card;
- on the chart's "300T stock" line, where the trend crosses it;
- on a second meter under the chart ("fully utilized 2026 to 2032 · median 2028").

The band note ("not a burn rate; nothing here depletes") only existed to explain that meter, so it went with it. The tag "cited stock, derived demand" repeated what the citations already say, and the footnote described a compute-based projection the page never draws. Now the chart and one readout carry the point once, which is less for the reader to scan. Nothing is lost: the 300T citation moves onto the sentence that states it, "tokens" is defined where it is first used (S3.4), and the source's 2026 to 2032 window stays as one sentence in the readout.

**S3.6 Bias section.** Now: "In the World Cup problem, the model almost certainly had the women's 2023 title in its data and left it out anyway. More data would not have helped. Even worse, a model is trained to predict the most likely next word, which means it goes with whatever its training data covers most. Retraining on more text, where the men's tournament still gets more coverage, **strengthens that bad habit**." The "Why bias happens" margin note and its repeat WinoBias citation are cut.
*Why:* removes a page reference ("Page 2's model"), an em dash, and jargon ("corpus", "next token"). The margin note's one new idea, that a model predicts the most likely next word, now sits in the paragraph itself, so the reader gets it in one place instead of reading across to the side. The rest of the note repeated slide 2, and its height left a large white gap under the paragraph.

**S3.7 Closing box.** Now: "Training-time scaling buys more knowledge, narrowing the knowledge gap, but at a compounding cost. It can also make the knowledge bias worse. The problem is that retraining spends its compute before anyone asks. Thinking it through spends compute at answer time, on the question actually asked."
*Why:* states the page's verdict (retraining narrows the gap at a compounding cost and can worsen the bias) and the training-versus-answer-time contrast in compute terms.

**S3.8 Section c layout.** The paragraph "Suppose money were no object..." moves out of its shaded box and sits under the heading as plain section text; the outer box is removed, so only the chart (caption, chart, readout) keeps its frame. Wording and citations unchanged. Later, the chart's caption ("Epoch projects... The shading is the likely range...") and its live readout ("By 2028, the largest training set reaches...") also moved out of the frame: the caption now sits as text above the chart and the readout as text below it, so the frame holds only the chart.
*Why:* the paragraph and the chart were a box inside a box, so the section's argument read as part of the figure. Prose now sits in the section and only the figure is framed, matching section b and the deck's rule that figures keep their frames and text does not.

**S3.9 Adjacent citations share one marker.** Where two works support one claim, they now print as one comma-separated marker ("1,2") instead of two markers run together ("12"). Applies deck-wide: page 3's cost sentence and page 15's overthinking claim.
*Why:* side by side, the two numbers read as "12", a reference that does not exist.

---

## Slide 4. Reasoning: Diverse Pathfinding

**S4.0 Keep the page** (overrides the reviewer plan's recommendation to cut it). *Why:* "one problem, many ways to reason" is the intuition voting, best-of-N and search build on. The focus moves from *what* the methods are to *several methods, each with trade-offs*.

**S4.1 Lede.** "Working a problem out instead of looking it up has a name: reasoning. And here is the surprise..." becomes "Working a problem out, instead of recognizing the answer, has a name: reasoning. Reasoning is what inference-time scaling spends its extra time and compute on. If you've ever compared answers with a classmate, you know there is rarely only one way to reason through a problem."
*Why:* ties reasoning to inference-time scaling; "recognizing", not "looking it up", since slide 2 made lookup part of the fix.

**S4.2 Section 1.** Heading "Pick a road and walk it" becomes "Three ways to work out 350 × 638" (tag line cut); Try it note "Pick a method, work it through, then try another."; "Indian Vedic (Urdhva-Tiryagbhyam)" becomes "Vedic multiplication"; origin descriptions cut; narration "walk the road" becomes "work it through"; the walkthrough panel loses its teal bar.
*Why:* cultural names stay as short, searchable labels; the origin lore and road metaphor read as history and jargon.

**S4.3 Section 2.** Heading "Three roads, three tolls" becomes "The methods and their trade-offs" (tag line cut); cards show name and "Trade-off:" only (was "limit:"; "The fastest road" becomes "The fastest method"); the walkthrough's duplicate trade-off line is cut; "We showcase only three here" cut. Takeaway, as plain text: "All three methods of reasoning through the problem land on the correct answer. Some take more work than others, and each has its own common mistakes. Trying more than one costs more effort, but it gives you a way to catch those mistakes."
*Why:* seeds compute cost, step-level mistakes and trying several paths without naming later slides; the shaded box is kept for the page's closing only.

**S4.4 Section 3 heading "Where this leaves us" cut.** The closing box stays as is. **Open:** its wording (O.1).

---

## Tried and reverted

**R.1 Slide 1 opener naming inference-time scaling** ("Inference-time scaling, put simply, is about giving a large language model (LLM) more time, and thus more compute, when it answers..."). Built, then reverted at the mentor's advice (S1.1).

**R.2 Slide 2 slider redesign** (Jan 2024 to "today" range, a 2026-final tick, a shaded knowledge gap). Built, then reverted: too clunky.

**R.3 Slide 1 two-systems paragraph** ("The human mind runs two systems. The first is quick..."). Moved into section 1, then cut.

**R.4 Slide 3 lede** ("Retraining on newer data moves the training data cutoff forward, as long as there is enough data to train on. Would that close the knowledge gap? Would it fix the knowledge bias?"). Built, then reverted: the original lede is catchier.

---

## Open

- **O.1 Slide 4 closing box.** Still the old text (roads, "Act 1", "Act 2"), and it does not sum up the page. The rewrite should sum up that one problem can be reasoned through in more than one way. Wording depends on O.11:
  - *If slide 4 stays in place* (hands off to chain of thought): "The same problem can be worked out in more than one way, and each way takes a different amount of effort. A language model can reason too, by writing out its steps before it answers."
  - *If slide 4 moves between slides 6 and 7* (hands off to voting): "Every method reached the same answer, but each could slip at a different step. So instead of making one attempt longer, a model can make several attempts and compare where they land." "Compare where they land" is what voting does.
- **O.2 Slide 1 link to the subject.** With R.1 reverted, slide 1 never mentions a model or inference-time scaling. Proposed compromise: keep the mentor's opening; end the closing note (S1.9) with "A language model can be given the same choice."
- **O.3 "LLM" undefined on slide 2.** Slide 1 no longer introduces it. Proposed: "What happens when a large language model (LLM) answers..."
- **O.4 `pages.ts` page summaries for slides 1 to 4** no longer match the pages (for example "Three cultures, three roads"; "cannot be aimed at one fact").
- **O.5 Where the deck first names inference-time scaling.** With R.1 reverted and "That is inference-time scaling." cut from slide 2's closing (S2.7), slides 1 to 3 build the idea without the term; it first appears in slide 4's opening. *Why it matters:* both reviewers said the deck is slow to reach its point, the home page's definition is skipped by anyone arriving through the chapter bar, and slide 2's closing is where the reader has just watched the idea happen. *Options:* O.2 on slide 1, restore the sentence in slide 2's closing, or keep slide 4 as the first mention.
- **O.6 Slide 2 section 2 opener.** Replace "**The question never said men's.**" with: "Suppose the model had been trained after the 2026 final. It would answer "two", counting the men's titles in 2010 and 2026, and the knowledge gap would be closed. The answer would still be wrong." Then the ideal answer card and "Every answer above silently counted only the men's tournament..." as now. *Why:* the current opener delivers a punchline with no setup, which is confusing: section 1 ended on the cutoff, and the reader has not been told anything else is wrong. The new opener closes the gap first, then shows the answer is still wrong, so the bias arrives as a second, separate failure. It does not depend on the reader having used the slider.
- **O.7 Pronoun interactive on slide 2.** Replace the paragraph "The same bias shows up in ordinary sentences..." with a small widget: the sentence "The physician hired the secretary because [he / she] was overwhelmed with clients.", a he/she toggle, and for each pronoun the reading models tend to pick (WinoBias, cited beside the widget). It closes on the right answer: "Grammatically, either person could be meant. The right answer is to flag the ambiguity." Shrink the bias paragraph around it so the page gets shorter, not longer. *Why:* the bias is currently told, not shown; the widget shows it is general, not sports trivia, and sets up section 3's "Read the question again". *Sensitivity:* gender stereotypes are sensitive, so there is no quiz of the reader and no claim about what readers pick; it reports a published finding about models, in the study's own terms. Fallback if still too sensitive: the same widget on a non-gender ambiguity, framed as an illustration rather than a cited finding.
- **O.8 Slide 4 Try it note into section 1.** Under "1. Three ways to work out 350 × 638", add the opening line "Pick one of the three methods below and work it through, then try another." and remove the margin Try it note ("Pick a method, work it through, then try another."). The Vedic reference stays in the margin. *Why:* the instruction belongs where the reader starts the widget, not off to the side; it gives section 1 an opening line, as slide 1 has ("Let's take the example of multiplication..."); the margin keeps only the reference.
- **O.9 Slide 2 comic, panel 4 is redundant.** *Resolved by the author:* panel 4 is retitled "Now draft the final response" (S2.6), so it no longer repeats panel 1, and the strip keeps four panels. The merge into three panels is no longer proposed.
- **O.10 Slide 2: ask-the-model card instead of the slider.** The card shows the question "How many FIFA World Cups has Spain won?", a label "Training data through Jan 2025" and an **Ask** button. Ask gives "Spain has won the FIFA World Cup once, in 2010." with the "one short" badge. A second button, **Retrain on data through Aug 2026**, updates the label and re-asks at once (no second Ask), giving "Spain has won the FIFA World Cup twice, in 2010 and 2026." with the "within cutoff" badge. Small print marks the replies as example responses. *Why:* the slider has 120 positions and one boundary that changes anything, so it barely works as an interactive; two deliberate clicks each show a result. "Retrain" is the option the page's closing asks about and slide 3 prices. The reader closes the gap themselves, so section 2's "still wrong" lands harder. *Pairs with O.6:* if adopted, the opener becomes "Retraining closed the knowledge gap. The answer is still wrong." *Supersedes* the earlier slider options (predict-then-reveal, several facts, two-model toggle). *Keep honest:* the replies are authored, not a live model call, and the card says so; the cutoff months stay visible on the label.
- **O.11 Move slide 4 between slides 6 and 7.** *Proposal:* slide 4 (different ways to reason) moves to sit after slide 6 (thinking longer) and before slide 7 (voting); Act 1 becomes slides 1 to 3. *Why:* the toolbox has a natural order: one chain of reasoning, a longer chain, then several chains. Slide 3 ends on "Thinking it through spends compute at answer time", and the next thing the reader needs is how a model does that (chain of thought, then thinking longer). Slide 6's finding is that making one chain longer stops paying, which is exactly when slide 4's lesson is needed: there is more than one way to reason, and trying several catches mistakes. That hands straight into voting, best-of-N and search. It also shortens Act 1 and brings the first inference-time scaling interactive one slide sooner, the reviewer plan's own target. *Costs:* a short hand-worked example among pages built on measured model runs (its opening would be rewritten as the bridge from "longer stopped helping"); renumbering (chapter order, chapter bar, keyboard navigation, the slide 16 quiz's source pages, any copy that names page numbers); new handoffs on slide 3, slide 6 and the moved page. Decide before O.1.
- **O.12 Slide 3, section b: training-time chart (placeholder, must be sourced).** An empty figure titled "Training time of popular LLMs, 2022 to 2026" now sits under "b. Always behind", with axes (release year 2022 to 2026, training time) and the note "Placeholder: scatterplot of 12 to 20 models, one dot per model, from cited sources". *Planned form:* a scatterplot of 12 to 20 popular models, one dot per model, placed by release year and training time, each dot labelled with its model. *Before it ships:* every plotted value must come from a cited source (model card, paper or lab post), with the citation beside the chart; no value without a source. *Why:* section b claims "a training run takes weeks"; a chart of real training times would show it instead of asserting it.

## Not doing

- Slide 3: a per-fact cost claim via fine-tuning (accurate only with a new term and citation; the "not economically feasible" line does the job).
- Slide 4: a per-method step count (3, 5, 5 does not reflect the real work); cutting the cultural names.
- Slide 1: splitting "17 × 20" into smaller steps.
- Em dashes in the site header and tab title, and the stale Playwright end-to-end test: left alone by the author's call.

## Back pocket

- "What it buys, how to buy more of it, and where buying more stops helping" (from slide 2's old closing): reword for the slide 5 lede.
