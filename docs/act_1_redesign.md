# Act 1 redesign

**Problem.** Act 1 (slides 1 to 4) is about 30% of the deck, and its core subject is training, not inference-time scaling. The term does not appear until slide 5, which goes straight into raw CoT. The act also teaches "reasoning" as the subject, when inference-time scaling is broader: spending more compute and time at answer time to get a better answer.

## Slide 1. Think Fast, Think Slow

**1. Introduce inference-time scaling in the opener of slide 1?** Yes. Name it in one lean sentence and give System 1 vs System 2 as the way in. *Why:* the reader should know the subject from the first line. System 1 vs System 2 is a building block, not history. Its lesson (the same mind, given more time, gets an answer it could not recognize) is inference-time scaling in miniature.

- Current: "Your mind runs two systems. System 1 is fast, automatic, effortless. System 2 is slow, deliberate, effortful. One operation, multiplication, flips you between them."
- New opener: "Inference-time scaling, put simply, is about giving a large language model (LLM) more time, and thus more compute, when it answers. To help build intuition for this, we can start by looking at how we, as people, think." (Introduces "LLM" here because slide 2 opens on it.)
- Then: "The human mind runs two systems. The first is quick and effortless. The second is slower and more deliberate. Here's what each one feels like." (Kahneman cite stays on the first sentence.)

**2. Rewrite section 3, "The difference."** Current: "Same operation, two different machines. System 1 recognizes the answer; System 2 builds it. One arrives whole, instant, effortless, automatic. The other comes line by line, slow, deliberate, and you feel every step. Recognizing an answer and constructing one are not the same act." Reads as AI. Replace with: "A good rule of thumb for telling the two systems apart is familiarity. System 1 recognizes or reacts as things happen, by reflex. System 2 spends more time, and brain power, to solve a problem you cannot recognize instantly. Even though System 2 is slower, it often leads to a better answer, one with fewer errors." *Why here:* the reader feels both systems in the widget first, then gets the definition.

**3. Sort it note.** "Correct drops lock in green; wrong ones flash red and bounce back." becomes "Correct drops are green, and wrong drops show up as red."

**4. Closing note.** "Keep the distinction. The next page asks a question that looks like recognition and is not, and watches a machine answer it on reflex." becomes "Remember the difference between the two systems. Some answers depend on what you have already learned. Others depend on how long you are willing to think." *Why:* hints at training vs inference-time scaling without naming either.

**5. Section 1 panels.** Cut both captions ("Automatic · Effortless · Recognition, not work" and "Deliberate · Sequential · You feel every step"). System 1 reveal line "The answer was already there. You didn't compute it; you recognized it." becomes "The answer comes instantly because it's familiar. No computing necessary." System 2 reveal line "You built it, line by line. That building is System 2." becomes "Not instant. You have to build it step by step."

## Slide 2. Thinking in Reality

Premise stays: knowledge gaps and bias are why inference-time scaling works. Changes are to delivery only.

**1. Lede.** "What does it take for an LLM to be useful (helpful, harmless and honest) in the real world? What are the pitfalls of System 1 thinking in the real world?" becomes "What happens when an LLM answers with System 1 thinking in the real world? A single question about the World Cup shows at least two ways it can go wrong." Drop the Askell (HHH) citation: the lede's `<Cite>` and the bottom References note beside section 3 (its only entry), and `askell` from `REF`.

**2. Section 1 prose.** Current: "A model learns everything it knows before a fixed training cutoff, and the answer it gives depends on when it was trained. This creates a perpetual knowledge gap after the model is trained, as new data is created by the world." and "Based on the knowledge cutoff date, the model gives an answer without thinking it through. System 1 thinking leads to an incorrect response." Replace with:
- "A model only knows what was in its training data, and it can only be trained on data that existed before its **training data cutoff**. Even events occurring before that cutoff can be missing if the data did not cover them. Together these create a perpetual **knowledge gap**, one that widens as the world creates new data."
- "In the example above, the model answered from what it learned, without thinking it through. System 1 thinking led it to an incorrect answer."
- *Why:* a late cutoff is necessary, not sufficient; the gap is about what is in the data, not only time.
- Term: "training data cutoff" everywhere on the page, including the slider label (now "training cutoff:").

**3. Section 1 cutoff slider.** Keep month granularity. Today the range is Jan 2017 to Dec 2026 (120 positions, default Jan 2025) and the answer changes only at Jul 2026, so everything left of the default is dead, the one change is unmarked, and the range runs past today.
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
- Knock-on for slide 3: its premise ("the obvious way to supply it is to train the model again") becomes the contrast "retrain to add the fact, or look it up at answer time", with retraining as the expensive route.
- Paragraph after the comic ("Look at what each step bought. Step 1 settles the bias outright...", ~80 words) becomes "In the first panel, rereading the question fixes the **bias** on its own, with no new information. The **knowledge gap** is different. The 2026 final was after its cutoff, so rereading won't help. Instead, the next two panels spot the gap and then fix it with a lookup."
- Closing box ("Nothing about the model changed between the reflex and the trace. Same weights, same training data, same cutoff. ... what it buys, how to buy more of it, and where buying more stops helping.") becomes "The model itself never changed between the two answers. It had the same training data and the same cutoff. The only difference is that it spent more time, and more compute, before answering. That is inference-time scaling. Why not just retrain the model on newer data instead?" *Why:* echoes slide 1's definition word for word, names the term, and hands off to slide 3's retrain-or-look-up question.

## Slide 3. Training-Time Scaling

Keep the structure and both interactives. Frame: answers slide 2's closing question ("Why not just retrain the model on newer data instead?") by letting the interactives deliver the verdict (predict, then observe). Retraining only moves the cutoff; it cannot promise coverage (the gap's second cause) and it sharpens the bias.

**1. Lede.** "A missing fact needs new knowledge, and the obvious way to supply it is to train the model again. The bill says no, then the data says no. And even if both said yes, it would do nothing about the bias." becomes "Retraining on newer data moves the training data cutoff forward. Would that close the knowledge gap? Would it fix the knowledge bias?" The page's closing must then state the verdict plainly.

## Back pocket

- "What it buys, how to buy more of it, and where buying more stops helping" (cut from slide 2's closing): reword without the tricolon for the slide 5 lede, where inference-time scaling becomes the reader's lever.
