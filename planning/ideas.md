# Ideas

**Status:** a holding pen. Nothing here is decided or scheduled. Each idea says what it is, what the deck already has that supports it, and what would have to be true before it goes on a page.
**Opened:** 2026-09-27, during the page 5 reviewer-response pass.

---

## 1. Chain of thought as an alternative to training-time scaling

**The idea.** Present a chain of thought (and, from page 5 on, the whole toolbox) as a second way to buy capability. Act 1 establishes the first way: train a bigger model, which is slow, expensive and paid once, up front (page 3, "Training-Time Scaling"). A chain of thought is the other way: keep the model and let it spend more tokens at answer time, which is fast to get and paid on every question. Framed like this, Act 2 stops being a list of techniques and becomes the answer to Act 1's problem, which is what reviewer 1 was asking for ("a slightly tighter narrative could help emphasize the central topic").

**What page 5 already measures.** Page 5 section 3 has the cleanest version of the trade the deck owns. Same family, same 100 MATH-500 level 4 and 5 problems, same grader, greedy:

| model | mode | solved | median tokens written |
| --- | --- | ---: | ---: |
| Qwen2.5-7B-Instruct | System 1 (non-reasoning) | 11% | 6 |
| Qwen2.5-1.5B-Instruct | System 2 (reasoning) | 22% | 561 |

The smaller model has under a quarter of the parameters (ratio 4.7 on nominal sizes) and solves twice as many problems, by writing roughly a hundred times as many tokens. Source: `web/data/page-05-derived.json`, `figure_3.cross` and `figure_3.models`.

**A back-of-envelope version of the trade (to verify before use).**
- *Answer time.* A forward pass costs about 2 × parameters FLOPs per generated token, ignoring the prompt and attention. The 1.5B writing 561 tokens spends about 1.7 × 10¹² FLOPs per problem; the 7B writing 6 tokens spends about 8.4 × 10¹⁰. The reasoning small model spends roughly **20×** more compute per question.
- *Training.* Training costs about 6 × parameters × training tokens. If both models saw the same pretraining data (the Qwen2.5 report describes pretraining on up to 18T tokens for the family; check whether the small sizes saw the full set), the 7B cost roughly **4.7×** more to train.
- So: a one-off ~4.7× saving at training time, paid back at ~20× per question at answer time. Whether that is a good trade depends on how many questions get asked, which is exactly the argument page 11 and the wrap-up can make.

**Where the deck already touches it.**
- Page 3 sets up training-time scaling and its costs (the Epoch training-time chart).
- Page 11 keeps Snell et al. 2024's law: parameters against test-time compute, the "4x / 14x" panels. That is the literature version of this same trade, measured properly.
- Page 5 section 4, now titled "The cost of a chain of thought", is where the token half of the trade is drawn.

**Where it could land.**
- Page 5 section 4's prose: name the trade once, in plain words, using the table above.
- Page 5's closing line or page 6's lede: "a chain has a length, and that length is compute you pay for" already points this way.
- Act 2's opening and page 11: return to it with Snell as the measured version.

**Guard rails (from the page 5 code notes and the reviewer plan).**
- No sentence may say the tokens *bought* the accuracy. The two prompts differ by more than the length of what they produce, so page 5 can report tokens as a cost, never quote them as a price for points. The trade has to be stated as a comparison of two setups, not as an exchange rate.
- Three model sizes are not a scaling law; do not draw a line through them.
- The cross-model comparison is the page's weakest result (18 problems one way, 7 the other, p = 0.043). The author dropped the on-page hedge on 2026-09-27; if the trade becomes a headline, the evidence has to carry the weight a headline puts on it.
- No page-number cross-references in reader-facing prose (reviewer plan, CP2); name the concept, not the page.
