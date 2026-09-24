# Act 1 revisions: summary for approval

Every edit made to Act 1 (slides 1 to 4) in response to the VISxAI reviews, why it is needed, and whether it is approved. Fill in the last column with **Yes** or **No**. Full wording for each edit is in [act_1_redesign.md](act_1_redesign.md) under the same ID.

## Edits

| ID | Edit | Why it's needed | Approved (Yes/No) |
|---|---|---|---|
| S1.1 | Slide 1 opens on the original two-systems line, adds "neither can replace the other", drops "One operation, multiplication..." | The home page already defines inference-time scaling; the new sentence sets up training and answer-time compute as partners | |
| S1.2 | Section 1 retitled "Meet your two systems", with an intro line and a closing line that names both systems and says a person takes far longer | Matches the opening; replaces two in-panel captions; honest that the animation is faster than a person | |
| S1.3 | One Calculate button runs both systems in lockstep; step 1 lands together; each answer lands with its last step; fixed height | A side-by-side race shows the speed difference instead of describing it | |
| S1.4 | System 2 gains a planning step ("24 = 20 + 4") | Shows System 2 deciding how to solve before computing | |
| S1.5 | Three examples; Calculate replays the shown one first and after Reset, then shuffles; crimson icon Reset on the left, Calculate on the right; Try it note | Readers cannot memorise one answer and can rewatch; colours reuse the System 1 and System 2 hues | |
| S1.6 | In-panel captions and reveal lines cut | Triplet captions read as machine-written; the closing line says it once | |
| S1.7 | Section 3 defines the systems by familiarity, in plain sentences | Feel first, then define; "more time, and brain power" is inference-time scaling in human terms | |
| S1.8 | Sort it note simplified | Plainer | |
| S1.9 | Closing note: "Some answers depend on what you have already learned. Others depend on how long you are willing to think." | Hints at training versus inference-time scaling; removes a page reference | |
| S2.1 | Lede reworded from two open questions ("What does it take for an LLM to be useful (helpful, harmless and honest) in the real world? What are the pitfalls of System 1 thinking in the real world?") to one question and its answer ("What happens when an LLM answers with System 1 thinking in the real world? A single question about the World Cup shows at least two ways it can go wrong."); the citation for "helpful, harmless and honest" (Askell et al. 2021) removed | The reader learns the page's point in the first line; the page never returned to "helpful, harmless and honest", so its citation pointed at nothing | |
| S2.2 | First paragraph expanded to show that the knowledge gap covers facts after the cutoff as well as facts the data never covered | The old text implied the cutoff date alone decides what a model knows | |
| S2.3 | "Training data cutoff" used throughout; badge reads "within cutoff" | One term; a late cutoff does not guarantee the model knows | |
| S2.4 | Bias section trimmed to the hook, a definition, the evidence, and the pronoun example (162 to 135 words) | States the gap-versus-bias difference once, as a plain pair the reader can carry into section 3: the gap is what the model never saw, the bias is what it saw but never thought to count. Stays accurate: "almost certainly had it" (not "held the fact the whole time"), and the model never considered the women's title, so nothing implies it chose. Moves the pronoun example into its own paragraph to show the bias is not just sports trivia | |
| S2.5 | Section 3 opener cut to two sentences; paragraph after the comic points at its panels | The fix was explained three times | |
| S2.6 | Comic keeps its lookup; each panel cut to one line | Rereading, noticing a limit and looking up are all compute spent at answer time | |
| S2.7 | Closing shows the model only spent more time and compute before answering, then asks "Why not just retrain the model on newer data instead?" | Makes the answer-time point on a real case and hands off to slide 3 | |
| S2.8 | Unused trace text says "training data ends" | Consistency with S2.3 | |
| S3.1 | Cost caption cut to two sentences; "derived from the two Epoch trends" kept beside the heading | The chart already shows the dollar figures; the curves are a derivation and the reader should know | |
| S3.2 | "It cannot be aimed" cut; "The data runs out" becomes c | It restated section a's cost with no new evidence | |
| S3.3 | "It always lags" rewritten plainly | A statement instead of a slogan | |
| S3.4 | Data paragraph says what the scaling law is and defines tokens at first use; caption and readout shortened; caption now explains the shading ("The shading is the likely range: growth between about ×1.8 and ×3.1 a year.") | Explains the idea instead of who found it; without the caption clause the shaded band is unlabelled once the readout stops quoting it | |
| S3.5 | Stock card, window meter, band note, data tag and footnote cut | The same point was shown four times | |
| S3.6 | Bias paragraph rewritten; "Why bias happens" margin note cut, its one idea moved into the paragraph | Removes a page reference, an em dash and jargon; the reader gets the idea in one place, not across to the side; removes a large white gap | |
| S3.7 | Closing: retraining spends compute before anyone asks; thinking spends it on the question actually asked | States the page's verdict and the training versus answer-time contrast | |
| S3.8 | Section c's paragraph ("Suppose money were no object...") moved out of its shaded box to sit as plain section text; the outer box removed, so only the chart keeps a frame | The paragraph and the chart were a box inside a box; the argument read as part of the figure. Prose now sits in the section and only the figure is framed, as in section b | |
| S4.0 | Slide 4 kept (the reviewer plan had proposed cutting it) | "One problem, many ways to reason" underpins voting, best-of-N and search | |
| S4.1 | Lede ties reasoning to inference-time scaling | Connects the page to the subject | |
| S4.2 | Section 1 retitled "Three ways to work out 350 × 638"; Try it note; origins and road wording cut; "Vedic multiplication" | Keeps short cultural names; drops lore that reads as history | |
| S4.3 | Section 2 retitled "The methods and their trade-offs"; cards show trade-offs only; takeaway as plain text | Seeds compute cost, step-level mistakes and trying several paths | |
| S4.4 | "Where this leaves us" heading cut; closing box unchanged for now | One shaded box, at the end | |

## Still open

| ID | Proposal | Why | Approved (Yes/No) |
|---|---|---|---|
| O.1 | Rewrite slide 4's closing box | Still uses roads and "Act 1 / Act 2" | |
| O.2 | End slide 1's closing note with "Language models can be given that second kind of time too, and that is what this story is about." | Slide 1 no longer mentions a model or the subject | |
| O.3 | Spell out "a large language model (LLM)" on slide 2 | Slide 1 no longer introduces the term | |
| O.4 | Update the slide 1 to 4 summaries in `pages.ts` | They describe the old pages | |
| O.5 | Name "inference-time scaling" before slide 4: either O.2 on slide 1, or restore "That is inference-time scaling." in slide 2's closing | Slides 1 to 3 now build the idea without naming it; the term first appears in slide 4's opening. Both reviewers said the deck is slow to reach its point, and readers who arrive through the chapter bar skip the home page definition | |
| O.6 | Replace slide 2's section 2 opener "The question never said men's." with: "Suppose the model had been trained after the 2026 final. It would answer "two", counting the men's titles in 2010 and 2026, and the knowledge gap would be closed. The answer would still be wrong." | The current opener delivers a punchline with no setup, which is confusing: the reader has not yet been told anything is wrong beyond the cutoff. The new opener closes the gap first, then shows the answer is still wrong | |
| O.7 | Replace slide 2's pronoun paragraph with a small interactive: "The physician hired the secretary because [he / she] was overwhelmed with clients." A he/she toggle shows which person models tend to pick (WinoBias, cited beside it), then states the right answer: grammatically either, so flag the ambiguity. No quiz of the reader | Turns the densest part of section 2 into something the reader can see; shows the bias is general, not sports trivia; sets up section 3's "Read the question again". Kept neutral: it reports a published finding about models and never tests the reader's own assumptions | |
| O.8 | Slide 4: move the Try it note into section 1 as its opening line, "Pick one of the three methods below and work it through, then try another.", and remove the margin note (the Vedic reference stays in the margin) | The instruction belongs where the reader starts the widget, not beside it; it gives section 1 an opening line like slide 1's, and leaves the margin for the reference only | |
| O.9 | Slide 2 comic: merge panels 3 and 4 into one, making a three-panel strip. Panel 3 becomes "Look it up": "A current source: men's 2010 and 2026, women's 2023." with the answer "Three." Alternative: keep four panels and retitle panel 4 "Answer with the full count" | Panel 4's title "Count what the question actually asked" repeats panel 1. Merged, each panel is one System 2 move (reread, notice the limit, look it up), matching the prose "the next two panels spot the gap and then fix it with a lookup". The alternative avoids redrawing a panel but still spends one on the result | |
| O.10 | Slide 2: replace the cutoff slider with an ask-the-model card. "How many FIFA World Cups has Spain won?", a label "Training data through Jan 2025" and an Ask button give "Spain has won the FIFA World Cup once, in 2010." (one short); a "Retrain on data through Aug 2026" button updates the label and re-asks at once: "...twice, in 2010 and 2026." (within cutoff). Marked as example responses. If adopted, O.6's opener becomes "Retraining closed the knowledge gap. The answer is still wrong." | The slider has 120 positions and one that matters, so it barely works as an interactive. Two deliberate clicks each show a result; "Retrain" sets up the page's closing question and slide 3; the reader closes the gap themselves, so section 2's "still wrong" lands harder | |

## Summary of the changes

**Slide 1.** The opening keeps its original hook, and the figure now makes the point visually: one Calculate button starts both systems together, System 1 finishes on the first beat, and System 2 works through four steps. Captions that read as machine-written are gone, and section 3 defines the two systems by familiarity after the reader has felt them.

**Slide 2.** The premise is unchanged. The prose is tighter and more accurate: a knowledge gap covers facts the data never covered, not only facts after the cutoff. The System 2 comic keeps its lookup, and the closing shows the only change was time and compute spent at answer time before handing off to slide 3.

**Slide 3.** The page takes up slide 2's closing question, whether to just retrain. Each chart keeps its interactive, but the repeated figures around them (a stock card, a second meter, long captions) are gone, and the bias section explains why retraining makes the bias worse in one paragraph.

**Slide 4.** Kept, and reframed from "three cultures" to "several ways to reason, each with trade-offs", which ties reasoning to spending compute at answer time.

**Tried and reverted:** an opening on slide 1 that named inference-time scaling, and a redesigned slider on slide 2 (see R.1 to R.3 in the decision record).
