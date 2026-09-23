# Act 1 redesign

**Problem.** Act 1 (slides 1 to 4) is about 30% of the deck, and its core subject is training, not inference-time scaling. The term does not appear until slide 5, which goes straight into raw CoT. The act also teaches "reasoning" as the subject, when inference-time scaling is broader: spending more compute and time at answer time to get a better answer.

## Slide 1. Think Fast, Think Slow

**1. Introduce inference-time scaling in the opener of slide 1?** Yes. Name it in one lean sentence and give System 1 vs System 2 as the way in. *Why:* the reader should know the subject from the first line. System 1 vs System 2 is a building block, not history. Its lesson (the same mind, given more time, gets an answer it could not recognize) is inference-time scaling in miniature.

- Current: "Your mind runs two systems. System 1 is fast, automatic, effortless. System 2 is slow, deliberate, effortful. One operation, multiplication, flips you between them."
- New opener (implemented, then reverted by the author): "Inference-time scaling, put simply, is about giving a large language model (LLM) more time, and thus more compute, when it answers. To help build intuition for this, we can start by looking at how we, as people, think." The lede is now the original, minus its last sentence: "Your mind runs two systems. System 1 is fast, automatic, and effortless. System 2 is slow, deliberate, and effortful." (Kahneman cite on the first sentence.)
- The two-systems paragraph ("The human mind runs two systems...") was moved into section 1, then cut by the author: section 1 opens straight on the panels.

**2. Rewrite section 3, "The difference."** Current: "Same operation, two different machines. System 1 recognizes the answer; System 2 builds it. One arrives whole, instant, effortless, automatic. The other comes line by line, slow, deliberate, and you feel every step. Recognizing an answer and constructing one are not the same act." Reads as AI. Replace with: "A good rule of thumb for telling the two systems apart is familiarity. System 1 recognizes or reacts as things happen, by reflex. System 2 spends more time, and brain power, to solve a problem you cannot recognize instantly. Even though System 2 is slower, it often leads to a better answer, one with fewer errors." *Why here:* the reader feels both systems in the widget first, then gets the definition.

**3. Sort it note.** "Correct drops lock in green; wrong ones flash red and bounce back." becomes "Correct drops are green, and wrong drops show up as red."

**4. Closing note.** "Keep the distinction. The next page asks a question that looks like recognition and is not, and watches a machine answer it on reflex." becomes "Remember the difference between the two systems. Some answers depend on what you have already learned. Others depend on how long you are willing to think." *Why:* hints at training vs inference-time scaling without naming either.

**5. Section 1 panels.** Cut both captions ("Automatic · Effortless · Recognition, not work" and "Deliberate · Sequential · You feel every step"). System 1 reveal line "The answer was already there. You didn't compute it; you recognized it." becomes "The answer comes instantly because it's familiar. No computing necessary." System 2 reveal line "You built it, line by line. That building is System 2." becomes "Not instant. You have to build it step by step." Later (author): both reveal lines cut; section 1 opens with "Let's take the example of multiplication to illustrate the two systems." and ends below the panels with "3 × 4 is familiar, so System 1 recognizes the answer instantly. 17 × 24 is not, so System 2 has to build it step by step, and that takes time. For a typical person, it takes far longer than the 4 seconds shown here." System 2 has four steps: "24 = 20 + 4" first, then the three computing steps; one "Calculate" button runs both panels in lockstep.

## Slide 2. Thinking in Reality

Premise stays: knowledge gaps and bias are why inference-time scaling works. Changes are to delivery only.

**1. Lede.** "What does it take for an LLM to be useful (helpful, harmless and honest) in the real world? What are the pitfalls of System 1 thinking in the real world?" becomes "What happens when an LLM answers with System 1 thinking in the real world? A single question about the World Cup shows at least two ways it can go wrong." Drop the Askell (HHH) citation: the lede's `<Cite>` and the bottom References note beside section 3 (its only entry), and `askell` from `REF`.

**2. Section 1 prose.** Current: "A model learns everything it knows before a fixed training cutoff, and the answer it gives depends on when it was trained. This creates a perpetual knowledge gap after the model is trained, as new data is created by the world." and "Based on the knowledge cutoff date, the model gives an answer without thinking it through. System 1 thinking leads to an incorrect response." Replace with:
- "A model only knows what was in its training data, and it can only be trained on data that existed before its **training data cutoff**. Even events occurring before that cutoff can be missing if the data did not cover them. Together these create a perpetual **knowledge gap**, one that widens as the world creates new data."
- "In the example above, the model answered from what it learned, without thinking it through. System 1 thinking led it to an incorrect answer."
- *Why:* a late cutoff is necessary, not sufficient; the gap is about what is in the data, not only time.
- Term: "training data cutoff" everywhere on the page, including the slider label (now "training cutoff:").

**3. Section 1 cutoff slider.** Keep month granularity. Today the range is Jan 2017 to Dec 2026 (120 positions, default Jan 2025) and the answer changes only at Jul 2026, so everything left of the default is dead, the one change is unmarked, and the range runs past today.
- **Reverted after implementation (too clunky):** the range, final tick and gap shading below were built, then rolled back to the original Jan 2017 to Dec 2026 slider. Kept: the "training data cutoff" label and the "✓ within cutoff" badge.
- Shorten the range to about Jan 2024 through today (Sep 2026).
- Mark the 2026 final on the track with a labelled tick.
- Shade the knowledge gap: fill from the cutoff to "today" in the wrong hue, with the 2026 final inside it. Dragging past the final uncovers it and the answer flips to correct.
- Relabel the "✓ current" badge to "✓ within cutoff": a late cutoff does not guarantee the model knows (section 1 prose).
- Not doing: a 2023 women's-final tick (would spoil section 2's reveal); preset model buttons (loses the moving timeline).

**4. Section 2 prose.**
- "Every answer above quietly counted only the men's tournament. That is a **knowledge bias**, and it is not the knowledge gap." becomes "Every answer above silently counted only the men's tournament. We call this a **knowledge bias**, and it is different from the knowledge gap." ("We call this": knowledge bias is the page's own label, not an established term.)
- The ~120-word paragraph ("The 2023 win happened before the cutoff, so the model held the fact the whole time...") becomes two paragraphs:
  - "The women's 2023 win happened before the cutoff and was widely covered. The model almost certainly had it in its data, but it left it out anyway. When handed an ambiguous question, it went with the reading its training data covered most, and never told you there was a choice. This is what separates the knowledge bias from the knowledge gap. The gap is about what the model never saw, whereas the bias is about what it saw but never thought to count."
  - "The same bias shows up in ordinary sentences. Given a sentence that could refer to either of two people, a model goes with the stereotyped reading instead of flagging that the sentence is ambiguous." [WinoBias cite stays here]
  - *Why:* "almost certainly had it" stays consistent with section 1 (pre-cutoff facts can be missing); the model never considered the women's title, so no "assumed" or "picked".
- Back pocket: the WinoBias physician example ("The physician hired the secretary because she was overwhelmed") as a possible visual.

**5. Section 3.** ~290 words that explain the fix three times (opener previews the comic, comic shows it, the paragraph after re-reads it). Target ~170, with the comic carrying it.
- Opening paragraph ("Both misses share a shape: the model answered immediately (System 1 thinking). It never reread the question, and it never weighed what it might not know. A System 2 pass does both before committing to anything.") becomes "Both of these failures stem from System 1 thinking, answering immediately. Here is what a System 2 pass does instead."
- System 2 comic: keep the lookup and the "Three." answer. The pass rereads the question (fixes the bias), notices its limits (spots the gap), and looks it up (closes the gap); all three are time spent at answer time, so all three are inference-time scaling. Panel 2: "my training was sealed in early 2025" becomes "my training data ends in early 2025".
- The prose must say which step supplied 2026: thinking recognized the gap and decided to look; the lookup supplied the fact. Pull-quote answer, in substance: "Thinking alone can't fill a knowledge gap, but it can recognize one and go look it up." Supersedes the reviewer plan's "name retrieval once and say why it is out of scope".
- Tool use appears nowhere else in the deck: introduce it here in one sentence, not as a lever the deck returns to.
- Resolved by the approved paragraph after the comic (no extra copy): it answers both pull quotes, introduces the lookup, and names it as what supplied 2026.
- Knock-on for slide 3: its premise ("the obvious way to supply it is to train the model again") becomes the contrast "retrain to add the fact, or look it up at answer time", with retraining as the expensive route.
- Paragraph after the comic ("Look at what each step bought. Step 1 settles the bias outright...", ~80 words) becomes "In the first panel, rereading the question fixes the **bias** on its own, with no new information. The **knowledge gap** is different. The 2026 final was after its cutoff, so rereading won't help. Instead, the next two panels spot the gap and then fix it with a lookup."
- Closing box ("Nothing about the model changed between the reflex and the trace. Same weights, same training data, same cutoff. ... what it buys, how to buy more of it, and where buying more stops helping.") becomes "The model itself never changed between the two answers. It had the same training data and the same cutoff. The only difference is that it spent more time, and more compute, before answering. That is inference-time scaling. Why not just retrain the model on newer data instead?" *Why:* echoes slide 1's definition word for word, names the term, and hands off to slide 3's retrain-or-look-up question.

**6. Second pass: comic panels cut to one line each** (`SPAIN_SYSTEM2_TRACE`): "It says FIFA World Cups, not men's. Both teams count." / "My training data ends in early 2025. A newer final could be missing." / "Name the tournaments I'm counting, and check a current source." / "Men's: 2010 and 2026. Women's: 2023." Titles unchanged.

**7. Second pass: repetition in section 2.** Section 2's opener becomes only the bold hook "The question never said men's." (the ideal answer card and comic panel 1 already say Spain fields both teams). Cut "This is what separates the knowledge bias from the knowledge gap." from the bias paragraph (the line above and the sentence after already make the distinction).

## Slide 3. Training-Time Scaling

Keep the structure and both interactives. Frame: answers slide 2's closing question ("Why not just retrain the model on newer data instead?") by letting the interactives deliver the verdict (predict, then observe). Retraining only moves the cutoff; it cannot promise coverage (the gap's second cause) and it sharpens the bias.

**1. Lede.** "A missing fact needs new knowledge, and the obvious way to supply it is to train the model again. The bill says no, then the data says no. And even if both said yes, it would do nothing about the bias." becomes "Retraining on newer data moves the training data cutoff forward, as long as there is enough data to train on. Would that close the knowledge gap? Would it fix the knowledge bias?" ("As long as there is enough data" sets up the second interactive.) The page's closing must then state the verdict plainly.

**2. Section 1 challenges.** Section a (the bill compounds) stays as is.
- Cut c ("It cannot be aimed": "There is no retraining for one missing fact. You buy the whole distribution to obtain a single result."). Fold its point into a's chart caption as a final sentence: "For one missing fact, like the 2026 final, that bill is not economically feasible." *Why:* a standalone c only restated a's cost with no new evidence.
- b ("It always lags"): "A training run takes weeks, so the cutoff moves forward but never reaches *now*. Retraining resets the clock. It does not stop it." becomes "A training run takes weeks, so by the time a model is finished, its cutoff is already behind. The gap shrinks, but it never closes."
- d ("The data runs out") becomes c. Section 1 has three challenges: a. The bill compounds, b. It always lags, c. The data runs out.
- c ("The data runs out"), opening paragraph ("Suppose money were no object. It still fails. A bigger model only pays off if it also reads more, in step... So the ceiling was never money...") becomes "Suppose money were no object. Frontier models keep getting bigger, and bigger models need more text. Researchers who trained hundreds of models at different sizes found a **scaling law**: about 20 tokens of text for every **parameter**, the numbers inside a model that training adjusts. [Chinchilla cite; Hoffmann et al. trained 400+ models] There is only so much text, roughly 300 trillion tokens of quality writing, and no budget buys tokens that do not exist." (Keep the numbers bound to `cp.tokensPerParam` and the stock value.) Describes what the law is, not who found it; the ratio is a need, not a cap.
- c chart caption ("So when does the field actually reach the ceiling? Epoch project the largest training set forward from its own trend, about ×N a year. Drag the year.") becomes "Epoch projects that the largest training sets grow about ×N a year. Drag the year to see when that line meets the stock of text that exists."
- Cut from c: the "trend projection only · Epoch also run a compute-based projection, which is not drawn here" footnote, and "inside the window below" in the readout.

**3. Section 2, knowledge bias.**
- Paragraph ("Page 2's model held the 2023 title the whole time and dropped it anyway, so the miss was never about what it had read — more reading cannot answer it. And because a model settles on whatever its corpus says most, more text from the same world only sharpens that default rather than loosening it.") becomes "In the World Cup problem, the model almost certainly had the women's 2023 title in its data and left it out anyway. More data would not have helped. Even worse, a model is trained to predict the most likely next word, which means it goes with whatever its training data covers most. Retraining on more text, where the men's tournament still gets more coverage, **strengthens that bad habit**." Removes the page reference, the em dash, and "corpus"; matches slide 2's "almost certainly".
- Cut the "Why bias happens" margin note and its WinoBias reference (jargon, repeats slide 2, re-cites slide 2's source). Its one new idea (predict the most likely next word) is now in the paragraph. Fixes the white space: the row was as tall as the note.

**4. Closing box.** "Training-time scaling buys more facts, later, at compounding cost, and it cannot touch a bias that was never about missing facts. Every wall here limits what a model can be given before the question arrives, which leaves only what it does after it." becomes "Training-time scaling buys more knowledge, narrowing the knowledge gap, but at a compounding cost. It can also make the knowledge bias worse. The problem is that retraining spends its compute before anyone asks. Thinking it through spends compute at answer time, on the question actually asked." *Why:* answers the lede's two questions, and frames before/after as where the compute is spent, echoing slide 1's definition.

**5. Second pass: repetition around the charts.**
- Cut the "every quality token humans have written ≈300T tokens" card (the prose and the chart's "300T stock" line already carry it). Its citation (Villalobos et al.) moves onto the prose sentence stating 300T; its token gloss moves to the first use: "about 20 **tokens** (pieces of text, roughly a word each) for every **parameter**, the numbers inside a model that training adjusts."

- Section a: cut the tag "derived from the two Epoch trends"; opening line becomes "What would it cost to retrain a model every day for a year?"; caption cut to "Frontier training runs grow about ×2.4 more expensive each year, and one GPT-4-class run costs an estimated $78M. For one missing fact, like the 2026 final, that bill is not economically feasible." (Sevilla & Roldán reference dropped with the 5x sentence; references now 1 to 5.)
- Section c: cut the tag "cited stock, derived demand"; readout becomes "By 2028, the largest training set reaches ≈199T tokens, 66% of the stock. The trend crosses the stock in Jun 2028. Epoch estimates the stock will be fully used between 2026 and 2032." (numbers stay live); cut the window meter and "The band is the cited window, not a burn rate; nothing here depletes."

## Slide 4. Reasoning: Diverse Pathfinding

Keep the page (overrides the reviewer plan's D1 cut): "one problem, many paths" is the intuition voting, best-of-N and search build on. The problem is that it never connects reasoning to inference-time scaling, and its roads/tolls/cultures layer reads as jargon and history.

**Focus.** Less on *what* the methods are, more on the point that one problem can be reasoned through by several methods, and each has trade-offs. Cultural names stay as short labels (memorable, searchable, and they carry the idea that people taught differently reason differently); the origin descriptions and the Sanskrit come out.

**1. Lede.** "Working a problem out instead of looking it up has a name: reasoning. And here is the surprise: it is never one fixed procedure. Page 1 gave you ... three cultures worked it three different ways ... Pick one below, walk it to the end, then try another and compare what they cost." becomes "Working a problem out, instead of recognizing the answer, has a name: reasoning. Reasoning is what inference-time scaling spends its extra time and compute on. If you've ever compared answers with a classmate, you know there is rarely only one way to reason through a problem." ("Recognizing", not "looking it up": slide 2 made lookup part of the fix.)
- Section 1 heading "1. Pick a road and walk it" becomes "1. Three ways to work out 350 × 638".
- The instruction moves to the section 1 margin as a Try it note: "Pick a method, work it through, then try another."

**2. Section 1 walkthrough.**
- Method names (`name` in `lib/authored.ts`): keep "Standard long multiplication" and "Japanese line multiplication"; "Indian Vedic (Urdhva-Tiryagbhyam)" becomes "Vedic multiplication".
- Drop the origin line beside the method dropdown (`meta.origin`).
- "The limit of this road:" becomes "Trade-off:". Keep the three trade-off texts as they are: each method costs work of a different kind, and each has its own way to go wrong (the seed for why sampling several paths helps).
- Drop the heading tag "one problem · three methods · authored walkthroughs": the walkthroughs are self-checking arithmetic, nothing to disclose.
- Not doing: a per-method step count. The counter reads 3, 5, 5 and does not reflect the real difference in work.

**3. Section 2, "Three roads, three tolls".**
- Takeaway box ("Three journeys, one destination: 223,300. The road changes; the answer does not, and each road pays its own toll. Reasoning is inherently diverse pathfinding from prior knowledge.") becomes "All three methods of reasoning through the problem land on the correct answer. Some take more work than others, and each has its own common mistakes. Trying more than one costs more effort, but it gives you a way to catch those mistakes." *Why:* seeds compute cost, step-level mistakes, and trying several paths, without naming later slides.
- The takeaway is plain text under the cards, not a shaded box: the deck's shaded box marks the page's closing, and page 4 had two in a row.
- Heading "2. Three roads, three tolls" becomes "2. The methods and their trade-offs".
- Cards keep name and trade-off, drop the origin description.
- Cut the note "There are many different ways to do multiplication. We showcase only three here." (section 1's heading already says "Three ways").

**4. Section 3.** Cut the "3. Where this leaves us" heading. The page ends on one shaded closing box (wording pending) that hands off to chain of thought and seeds trying more than one way.

**5. Follow-ups after the first pass (applied).** Drop the walkthrough's trade-off line (the cards already show it); cut section 2's tag line; cards "limit:" becomes "Trade-off:"; narration "walk the road" becomes "work it through"; Vedic trade-off "The fastest road" becomes "The fastest method"; the walkthrough panel stays shaded but loses its teal bar, so the closing box is the only barred box.

## Back pocket

- "What it buys, how to buy more of it, and where buying more stops helping" (cut from slide 2's closing): reword without the tricolon for the slide 5 lede, where inference-time scaling becomes the reader's lever.
