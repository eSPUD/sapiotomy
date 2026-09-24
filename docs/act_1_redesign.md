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

**S1.7 Section 3 definition rewritten.** "Same operation, two different machines... Recognizing an answer and constructing one are not the same act." becomes "A good rule of thumb for telling the two systems apart is familiarity. System 1 recognizes or reacts as things happen, by reflex. System 2 spends more time, and brain power, to solve a problem you cannot recognize instantly. Even though System 2 is slower, it often leads to a better answer, one with fewer errors."
*Why:* the reader feels both systems first, then gets a plain definition; "more time, and brain power" is inference-time scaling in human terms.

**S1.8 Sort it note.** "Correct drops lock in green; wrong ones flash red and bounce back." becomes "Correct drops are green, and wrong drops show up as red." *Why:* plainer.

**S1.9 Closing note.** "Keep the distinction. The next page asks a question that looks like recognition and is not..." becomes "Remember the difference between the two systems. Some answers depend on what you have already learned. Others depend on how long you are willing to think."
*Why:* hints at training versus inference-time scaling without naming either; drops the page reference.

---

## Slide 2. Thinking in Reality

Premise kept: knowledge gaps and bias are why inference-time scaling works. Delivery only.

**S2.1 Lede.** "What does it take for an LLM to be useful (helpful, harmless and honest) in the real world? What are the pitfalls of System 1 thinking in the real world?" becomes "What happens when an LLM answers with System 1 thinking in the real world? A single question about the World Cup shows at least two ways it can go wrong." The citation for "helpful, harmless and honest" (Askell et al. 2021) is removed.
*Why:* the old lede asked two open questions and the reader did not learn the page's point until section 3; the new one asks one question and answers it. The page never returned to "helpful, harmless and honest", so its citation pointed at nothing.

**S2.2 Knowledge gap paragraph.** Now: "A model only knows what was in its training data, and it can only be trained on data that existed before its **training data cutoff**. Even events occurring before that cutoff can be missing if the data did not cover them. Together these create a perpetual **knowledge gap**, one that widens as the world creates new data." Then: "In the example above, the model answered from what it learned, without thinking it through. System 1 thinking led it to an incorrect answer."
*Why:* the old text said the answer depends only on when a model was trained; a fact can also be missing because the data never covered it.

**S2.3 "Training data cutoff" everywhere, badge relabelled.** Slider label, Try it note and screen-reader labels say "training data cutoff"; the "✓ current" badge reads "✓ within cutoff". The slider itself is the original (Jan 2017 to Dec 2026); see R.2.
*Why:* one term, and a late cutoff does not guarantee the model knows.

**S2.4 Bias section.** Opener is just "**The question never said men's.**" Then: "Every answer above silently counted only the men's tournament. We call this a **knowledge bias**, and it is different from the knowledge gap." Then: "The women's 2023 win happened before the cutoff and was widely covered. The model almost certainly had it in its data, but it left it out anyway. When handed an ambiguous question, it went with the reading its training data covered most, and never told you there was a choice. The gap is about what the model never saw, whereas the bias is about what it saw but never thought to count." Then, with the WinoBias citation: "The same bias shows up in ordinary sentences. Given a sentence that could refer to either of two people, a model goes with the stereotyped reading instead of flagging that the sentence is ambiguous."
*Why:* 162 words become 135, but the gains are mostly in clarity and accuracy:
- **One statement of the difference.** The old text said it twice ("it is not the knowledge gap", then a colon definition). Now it is one plain pair the reader carries into section 3: the gap is what the model never saw; the bias is what it saw but never thought to count. Section 3 then fixes each in turn (rereading fixes the bias, a lookup fixes the gap).
- **Accurate about the model.** "Held the fact the whole time" became "almost certainly had it in its data", matching S2.2 (a fact can be missing even before the cutoff). "Resolved the ambiguity... never mentioned that it had chosen" implied a deliberate choice; the model never considered the women's title, so the text says it "went with the reading its training data covered most".
- **Shows the bias is general.** The pronoun example has its own paragraph, in plain words ("stereotyped", not "stereotype-consistent"), so the reader sees the same failure outside sports.
- **Honest label and plainer prose.** "We call this a knowledge bias" because the term is the page's own, not an established one; "quietly", "Nothing was missing from its memory." and the colon definition are gone.

**S2.5 Section 3, opener and paragraph after the comic.** Opener: "Both of these failures stem from System 1 thinking, answering immediately. Here is what a System 2 pass does instead." After the comic: "In the first panel, rereading the question fixes the **bias** on its own, with no new information. The **knowledge gap** is different. The 2026 final was after its cutoff, so rereading won't help. Instead, the next two panels spot the gap and then fix it with a lookup."
*Why:* the section explained the fix three times; now the comic carries it and the paragraph points at its panels.

**S2.6 The comic keeps its lookup; panels cut to one line.** "It says FIFA World Cups, not men's. Both teams count." / "My training data ends in early 2025. A newer final could be missing." / "Name the tournaments I'm counting, and check a current source." / "Men's: 2010 and 2026. Women's: 2023." Titles and "Three." unchanged.
*Why:* rereading, noticing a limit and looking something up are all compute spent at answer time, so all are inference-time scaling; the prose now names the lookup as what supplied 2026. Tool use is introduced here only, not as a lever the deck returns to.

**S2.7 Closing box.** "Nothing about the model changed... where buying more stops helping." becomes "The model itself never changed between the two answers. It had the same training data and the same cutoff. The only difference is that it spent more time, and more compute, before answering. Why not just retrain the model on newer data instead?"
*Why:* shows, on a real example, that the only change was time and compute spent at answer time, then hands off to slide 3's question. It no longer names the term ("That is inference-time scaling." was cut). The cut line "where buying more stops helping" is saved for slide 5 (Back pocket).

**S2.8 Unused trace wording.** The unrendered `SPAIN_WORLD_CUPS.thinking` trace now says "My training data ends in early 2025". *Why:* consistency with S2.3.

---

## Slide 3. Training-Time Scaling

Structure and both interactives kept. The page answers slide 2's closing question and lets the charts deliver the verdict.

**S3.1 Section a, the bill.** Opening line becomes "What would it cost to retrain a model every day for a year?"; caption becomes "Frontier training runs grow about ×2.4 more expensive each year, and one GPT-4-class run costs an estimated $78M. For one missing fact, like the 2026 final, that bill is not economically feasible." The tag "derived from the two Epoch trends" stays beside the heading. The Sevilla & Roldán reference goes with its sentence (five references now).
*Why:* the chart and cards already show every dollar figure the old caption listed; the last sentence absorbs the cut section "It cannot be aimed". The tag stays because the curves are a derivation, not a published chart, and the reader should know that.

**S3.2 "It cannot be aimed" cut; "The data runs out" becomes c.** *Why:* it restated a's cost with no new evidence.

**S3.3 Section b.** "...Retraining resets the clock. It does not stop it." becomes "A training run takes weeks, so by the time a model is finished, its cutoff is already behind. The gap shrinks, but it never closes." *Why:* plain statement instead of a slogan.

**S3.4 Section c, the data.** Paragraph: "Suppose money were no object. Frontier models keep getting bigger, and bigger models need more text. Researchers who trained hundreds of models at different sizes found a **scaling law**: about 20 **tokens** (pieces of text, roughly a word each) for every **parameter**, the numbers inside a model that training adjusts. There is only so much text, roughly 300 trillion tokens of quality writing, and no budget buys tokens that do not exist." Caption: "Epoch projects that the largest training sets grow about ×2.4 a year. Drag the year to see when that line meets the stock of text that exists. The shading is the likely range: growth between about ×1.8 and ×3.1 a year." Readout: "By 2028, the largest training set reaches ≈199T tokens, 66% of the stock. The trend crosses the stock in Jun 2028. Epoch estimates the stock will be fully used between 2026 and 2032." (Numbers stay live.)
*Why:* says what the scaling law is rather than who found it; "calls for" a ratio, not a cap; tokens defined at first use. The caption's last sentence explains the shaded band (Epoch's 90% range), which the shorter readout no longer quotes; without it the shading is unlabelled.

**S3.5 Section c cuts.** The ≈300T stock card, the window meter, "The band is the cited window, not a burn rate; nothing here depletes.", the tag "cited stock, derived demand", and the "compute-based projection" footnote. The 300T citation moves onto its sentence.
*Why:* the same point (text runs out around 2028) was shown four times.

**S3.6 Bias section.** Now: "In the World Cup problem, the model almost certainly had the women's 2023 title in its data and left it out anyway. More data would not have helped. Even worse, a model is trained to predict the most likely next word, which means it goes with whatever its training data covers most. Retraining on more text, where the men's tournament still gets more coverage, **strengthens that bad habit**." The "Why bias happens" margin note and its repeat WinoBias citation are cut.
*Why:* removes a page reference ("Page 2's model"), an em dash, and jargon ("corpus", "next token"). The margin note's one new idea, that a model predicts the most likely next word, now sits in the paragraph itself, so the reader gets it in one place instead of reading across to the side. The rest of the note repeated slide 2, and its height left a large white gap under the paragraph.

**S3.7 Closing box.** Now: "Training-time scaling buys more knowledge, narrowing the knowledge gap, but at a compounding cost. It can also make the knowledge bias worse. The problem is that retraining spends its compute before anyone asks. Thinking it through spends compute at answer time, on the question actually asked."
*Why:* states the page's verdict (retraining narrows the gap at a compounding cost and can worsen the bias) and the training-versus-answer-time contrast in compute terms.

**S3.8 Section c layout.** The paragraph "Suppose money were no object..." moves out of its shaded box and sits under the heading as plain section text; the outer box is removed, so only the chart (caption, chart, readout) keeps its frame. Wording and citations unchanged.
*Why:* the paragraph and the chart were a box inside a box, so the section's argument read as part of the figure. Prose now sits in the section and only the figure is framed, matching section b and the deck's rule that figures keep their frames and text does not.

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

- **O.1 Slide 4 closing box.** Still the old text (roads, "Act 1", "Act 2"). Direction discussed: hand off to chain of thought and to trying more than one way.
- **O.2 Slide 1 link to the subject.** With R.1 reverted, slide 1 never mentions a model or inference-time scaling. Proposed compromise: keep the mentor's opening; end the closing note with "Language models can be given that second kind of time too, and that is what this story is about."
- **O.3 "LLM" undefined on slide 2.** Slide 1 no longer introduces it. Proposed: "What happens when a large language model (LLM) answers..."
- **O.4 `pages.ts` page summaries for slides 1 to 4** no longer match the pages (for example "Three cultures, three roads"; "cannot be aimed at one fact").
- **O.5 Where the deck first names inference-time scaling.** With R.1 reverted and "That is inference-time scaling." cut from slide 2's closing (S2.7), slides 1 to 3 build the idea without the term; it first appears in slide 4's opening. *Why it matters:* both reviewers said the deck is slow to reach its point, the home page's definition is skipped by anyone arriving through the chapter bar, and slide 2's closing is where the reader has just watched the idea happen. *Options:* O.2 on slide 1, restore the sentence in slide 2's closing, or keep slide 4 as the first mention.
- **O.6 Slide 2 section 2 opener.** Replace "**The question never said men's.**" with: "Suppose the model had been trained after the 2026 final. It would answer "two", counting the men's titles in 2010 and 2026, and the knowledge gap would be closed. The answer would still be wrong." Then the ideal answer card and "Every answer above silently counted only the men's tournament..." as now. *Why:* the current opener delivers a punchline with no setup, which is confusing: section 1 ended on the cutoff, and the reader has not been told anything else is wrong. The new opener closes the gap first, then shows the answer is still wrong, so the bias arrives as a second, separate failure. It does not depend on the reader having used the slider.
- **O.7 Pronoun interactive on slide 2.** Replace the paragraph "The same bias shows up in ordinary sentences..." with a small widget: the sentence "The physician hired the secretary because [he / she] was overwhelmed with clients.", a he/she toggle, and for each pronoun the reading models tend to pick (WinoBias, cited beside the widget). It closes on the right answer: "Grammatically, either person could be meant. The right answer is to flag the ambiguity." Shrink the bias paragraph around it so the page gets shorter, not longer. *Why:* the bias is currently told, not shown; the widget shows it is general, not sports trivia, and sets up section 3's "Read the question again". *Sensitivity:* gender stereotypes are sensitive, so there is no quiz of the reader and no claim about what readers pick; it reports a published finding about models, in the study's own terms. Fallback if still too sensitive: the same widget on a non-gender ambiguity, framed as an illustration rather than a cited finding.
- **O.8 Slide 4 Try it note into section 1.** Under "1. Three ways to work out 350 × 638", add the opening line "Pick one of the three methods below and work it through, then try another." and remove the margin Try it note ("Pick a method, work it through, then try another."). The Vedic reference stays in the margin. *Why:* the instruction belongs where the reader starts the widget, not off to the side; it gives section 1 an opening line, as slide 1 has ("Let's take the example of multiplication..."); the margin keeps only the reference.
- **O.9 Slide 2 comic, panel 4 is redundant.** Its title "Count what the question actually asked" repeats panel 1 ("Read the question again... Both teams count"); only its result is new. *Proposal:* merge panels 3 and 4 into a three-panel strip. Panel 3 becomes title "Look it up", text "A current source: men's 2010 and 2026, women's 2023.", answer "Three." (replacing "Do not answer from memory alone"). Its small illustration is redrawn and the strip goes three-wide. *Why:* each panel is one System 2 move (reread, notice the limit, look it up), with no restating, and the strip matches the prose below ("the next two panels spot the gap and then fix it with a lookup"). *Alternative:* keep four panels and retitle panel 4 "Answer with the full count"; no artwork changes, but the strip still spends a panel on stating the result.
- **O.10 Slide 2: ask-the-model card instead of the slider.** The card shows the question "How many FIFA World Cups has Spain won?", a label "Training data through Jan 2025" and an **Ask** button. Ask gives "Spain has won the FIFA World Cup once, in 2010." with the "one short" badge. A second button, **Retrain on data through Aug 2026**, updates the label and re-asks at once (no second Ask), giving "Spain has won the FIFA World Cup twice, in 2010 and 2026." with the "within cutoff" badge. Small print marks the replies as example responses. *Why:* the slider has 120 positions and one boundary that changes anything, so it barely works as an interactive; two deliberate clicks each show a result. "Retrain" is the option the page's closing asks about and slide 3 prices. The reader closes the gap themselves, so section 2's "still wrong" lands harder. *Pairs with O.6:* if adopted, the opener becomes "Retraining closed the knowledge gap. The answer is still wrong." *Supersedes* the earlier slider options (predict-then-reveal, several facts, two-model toggle). *Keep honest:* the replies are authored, not a live model call, and the card says so; the cutoff months stay visible on the label.

## Not doing

- Slide 3: a per-fact cost claim via fine-tuning (accurate only with a new term and citation; the "not economically feasible" line does the job).
- Slide 4: a per-method step count (3, 5, 5 does not reflect the real work); cutting the cultural names.
- Slide 1: splitting "17 × 20" into smaller steps.
- Em dashes in the site header and tab title, and the stale Playwright end-to-end test: left alone by the author's call.

## Back pocket

- "What it buys, how to buy more of it, and where buying more stops helping" (from slide 2's old closing): reword for the slide 5 lede.
