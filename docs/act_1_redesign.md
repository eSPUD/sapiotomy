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

**1. Lede.** "What does it take for an LLM to be useful (helpful, harmless and honest) in the real world? What are the pitfalls of System 1 thinking in the real world?" becomes "What happens when an LLM answers with System 1 thinking in the real world? A single question about the World Cup shows at least two ways it can go wrong." Askell (HHH) citation dropped; the page never returns to it (pending confirm).

**2. Section 1 cutoff slider.** Keep month granularity. Today the range is Jan 2017 to Dec 2026 (120 positions, default Jan 2025) and the answer changes only at Jul 2026, so everything left of the default is dead, the one change is unmarked, and the range runs past today.
- Shorten the range to about Jan 2024 through today (Sep 2026).
- Mark the 2026 final on the track with a labelled tick.
- Shade the knowledge gap: fill from the cutoff to "today" in the wrong hue, with the 2026 final inside it. Dragging past the final uncovers it and the answer flips to correct.
- Not doing: a 2023 women's-final tick (would spoil section 2's reveal); preset model buttons (loses the moving timeline).
