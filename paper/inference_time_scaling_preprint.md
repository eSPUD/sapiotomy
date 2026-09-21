# The Story of Inference-Time Scaling: An Interactive, Reproducible Explainable of How Language Models Reason

**Shashank Bangalore Lakshman**, **Scott Lawrence Eiers**
Western Governors University

*Preprint. The explainable this paper describes was accepted to the 9th Workshop on Visualization for AI Explainability (VISxAI) at IEEE VIS 2026. Live at https://sapiotomy.vercel.app.*

> **Draft status, 2026-09-20, second structure.** Restructured against the GAN Lab skeleton per `planning/acm_paper_plan.md` revision four. Sections 1, 2, 6, 7, 10 and 11 carry prose drafted from the repository's own measurements and documents. Sections 3, 4, 5, 8 and 9 are newly drafted against the plan's briefs and want an author pass: section 3 from `paper/related_works_final_report.md`, sections 4 and 5 as the paper's C-to-G chain, section 8 as the two usage scenarios, section 9 as the design history. Bracketed notes mark numbers still to be pinned. Word counts per section are printed at the end.

---

## Abstract

Language models now reason before answering, spending compute when a question is asked rather than during training. How much that buys, and where it stops paying, is hard to learn: the techniques share a name but not a mechanism, and each is published on its own model and its own grader, so no two results compare. We present *The Story of Inference-Time Scaling*, the first interactive explainable that lets non-experts move the compute knobs and watch accuracy respond. Sixteen pages carry a reader with no machine-learning background from a blurted answer to the levers' own failure modes, one live control per page. Six of those pages are measured rather than retold: every lever runs on the same hundred competition problems with the same grader, and each ships the notebook that re-derives its figures on a laptop with no GPU. Implemented as a static web application with no inference at reading time, it runs in any browser without installation or specialized hardware.

*[Reach figure to be appended here if usage numbers exist by drafting time, following Diffusion Explainer and Transformer Explainer. If none exist, say nothing.]*

> **Two notes on this abstract, for the authors.**
> **The closing line was dropped.** The previous version ended on the author-written sentence about learners interacting with the machinery of reasoning in real time, with reproducible notebooks centred on Qwen2.5-Instruct. Both model abstracts close on deployment instead, so that slot is now the browser sentence. The line is worth restoring in the introduction or the conclusion rather than here.
> **The gap sentence no longer characterizes other people's resources.** The previous version said build-from-scratch books teach the training loop and not the levers, which is not true of Raschka's book, two of whose chapters are inference-time scaling and whose grader runs in our pipeline; and that short interactives cover one lever, which the landscape search could not substantiate. The gap is now stated as a property of the literature's incomparability, which is our own C1 and is defensible. Section 3 does the comparison properly, at length, and with credit.

---

## 1 Introduction

For most of the last decade, the way to make a language model better was to make it bigger and train it on more text. Inference-time scaling changed the accounting. A model that is allowed to reason before it answers, whether by writing out its steps, by writing several attempts and voting, or by searching among partial attempts, closes much of the gap to a model many times its size [Snell 2024; Wu 2024]. And once the reasoning behaviour is trained into the weights rather than prompted for, capability rises again: this is the recipe behind o1 and o3 [OpenAI 2024] and behind DeepSeek-R1 and the small models distilled from it [DeepSeek-AI 2025]. A 1.5-billion-parameter model that reasons now outscores a 7-billion-parameter model that does not, and the explainable this paper describes measures exactly that on its own pages.

The difficulty for a learner is that inference-time scaling is not one mechanism. It is a family that shares only its accounting. Some systems run a Monte Carlo search over reasoning steps, expanding and pruning a tree of partial solutions [Yao 2023]. Some sample many complete chains and let a judge or a trained verifier pick one [Cobbe 2021; Lightman 2023]. Some sample many and take the majority answer [Wang 2022]. Some use a single plain chain of thought [Wei 2022] and simply let it run longer [Muennighoff 2025]. The frontier models train the behaviour in with reinforcement learning against verifiable answers, so that the chain appears unasked [DeepSeek-AI 2025]. Each of these is "inference-time scaling" in the literature, and a reader who meets the term meets five different things under one name, measured on different models, different benchmarks and different budgets.

It is still worth understanding, because the gains are large where they matter. Spending compute on reasoning produces its biggest returns on hard, multi-step problems, precisely the ones a reflex answer gets wrong [Snell 2024; Brown 2024]. The same literature also shows where it stops paying: accuracy plateaus, the wrong answer can win a vote, more thinking can subtract, and verifiers are fallible [Chen 2024; Shojaee 2025; Gao 2025]. A learner who understands only the gains, or only the failures, has half the picture.

Building a learning tool for this family turned out to be constrained in five specific ways, which Section 4 states as design challenges and Section 5 answers as design goals. They concern the incomparability of published numbers, the absence of a GPU where a web page is served, the mathematics a first-year reader actually has, a technique that did not replicate when we measured it, and the risk that a summary page drifts from the pages it summarizes.

This paper describes *The Story of Inference-Time Scaling*, a sixteen-page interactive explainable that takes a reader with no machine-learning background from "a model can only blurt an answer" to the levers' own failure modes. We contribute: the explainable itself, with a live control on every page and one idea per page; a single measured instrument, on which pages 5 to 9 and 11 run their own experiments over the same hundred problems with the same grader, so that the levers can be compared on one axis for the first time; a notebook shipped beside every measured page that re-derives that page's figures on a laptop with no GPU; and the design history in Sections 8 and 9, including the decisions we got wrong first. The explainable is live at https://sapiotomy.vercel.app and the source, notebooks and run artifacts are open at [repository URL].

---

## 2 Background: reasoning, chain of thought, and the levers

**Two speeds.** Adding two one-digit numbers is a reflex. Long division of a three-digit number by a two-digit one is not: almost everyone reaches for a scratchpad and works it step by step, and the steps are the working, not a report of it. Kahneman's names for the two speeds are System 1 and System 2 [Kahneman 2011], and the explainable opens by letting the reader feel both on a puzzle whose size sets the thinking time.

A language model answering on reflex is System 1. Asked a question, it emits an answer in a handful of tokens, and on a hard problem that answer is usually wrong. The working is a chain of thought [Wei 2022]. For a person it is a scratchpad; for a model it is the output itself, so the tokens of the chain are the compute, and a budget on those tokens is the simplest lever there is.

**Many scratchpads.** Inference-time scaling is what follows once tokens are compute. One scratchpad can be made longer. Several scratchpads can be written independently and the most popular answer taken: this is majority voting, or self-consistency [Wang 2022], and it works only when the chains are actually different from one another. Several can be written and each scored against a criterion, with the best-scoring one kept: this is best-of-N with a judge, where the judge may be the model itself, a trained verifier of final answers [Cobbe 2021], or a verifier of every step [Lightman 2023]. Scratchpads can be grown a step at a time, with weak partial attempts pruned and promising ones extended: this is search over thoughts [Yao 2023], and it pays for every node it examines. Finally, the habit can be trained in, either by keeping only the rationales that reached the right answer and fine-tuning on them [Zelikman 2022], or by rewarding verifiable right answers until pausing and self-correcting emerge on their own [DeepSeek-AI 2025].

The explainable's three acts follow that order: the two speeds, the toolbox, and the frontier where the toolbox is baked into the weights. The literature review behind it asked three questions of the family, and the pages answer them one lever at a time: when does test-time compute help, how should it be allocated between longer chains and more chains, and where does it saturate [our review].

*Figure 2 goes here: a block diagram in seven or eight blocks. Question; reflex answer; one chain of thought; many chains; vote; judge; search; trained in. Drawn in the explainable's colour grammar so the paper's figure and the pages read as one system.*

---

## 3 Related work

*Drafted from `paper/related_works_final_report.md`. Wants an author pass for emphasis.*

**Build-it-yourself books and courses.** Raschka's *Build a Reasoning Model (From Scratch)* is the closest existing work to the content of this explainable, and this project builds on it directly: its chapter-three grading functions run unchanged in our measurement pipeline, and its notebook-first structure shaped ours [Raschka 2026]. Two of its eight chapters are inference-time scaling, covering best-of-N, majority voting and self-refinement, and every chapter ships a from-scratch PyTorch notebook. Stanford's CS329A opens with a lecture on test-time compute scaling, and a NeurIPS 2025 tutorial is devoted to the subject entirely [Chen 2025]. These teach a reader who can already run the code, and they teach by implementation: the reader builds each method rather than manipulating the tradeoff between them.

**Interactive explainers of adjacent topics.** Transformer Explainer runs a GPT-2 live in the browser and walks a reader from tokenization to output probabilities [Cho 2026]; CNN Explainer [Wang 2020], Diffusion Explainer [Lee 2023] and GAN Lab [Kahng 2019] do the same for their architectures, and the PAIR explorables do it for hidden-state interpretation. These set the bar for the form, and this paper follows GAN Lab's structure for that reason. Their subject is a model's internals: how one output is produced. None of them takes as its subject how much computation to spend on a problem.

**Static explanations of reasoning, and the tools that inspect it.** Weng's "Why We Think" and Grootendorst's "A Visual Guide to Reasoning LLMs" are survey-grade treatments of exactly this family, and Hugging Face's "Scaling test-time compute with open models" reproduces a compute-optimal recipe on open models with real measured curves [Weng 2025; Grootendorst 2025; Beeching 2024]. All three are static: the figures are images, and the reader moves nothing. Separately, a literature of reasoning-trace systems has grown quickly, among them ReasonGraph [Li 2025], ReTrace [Felder 2026] and Landscape of Thoughts [Zhou 2026]. These are interactive, but each renders a trace that already exists, for a practitioner analysing one run.

**The gap.** Each family is about something the others are not: the books are about building the methods, the explainers about model internals, the articles about summarising results, the trace tools about inspecting a single run. The axis none of them plots is the one this explainable is built on, accuracy as a function of compute spent, measured on one instrument and re-derivable by the reader who doubts it.

*Figure 3 goes here: one table, rows for each resource, columns for interactive, measured on one instrument, reproducible by download, and audience assumed.*

---

## 4 Design challenges

Five constraints shaped the explainable. Each is labelled here and answered by a design goal in Section 5.

**C1. The published numbers do not compare.** Each paper measures its lever on its own model, its own items, its own decoding configuration and its own grader. A self-consistency curve from one paper and a best-of-N curve from another cannot be drawn on the same axis without the comparison being a lie, and a reader has no way to see which numbers are commensurable. An explainable assembled from digitized curves would inherit that incoherence and hide it.

**C2. No live model can run where the page is served.** The explainable is served from Vercel, which has no GPU and holds a request to a few tens of seconds. A single 2,048-token chain from a 3B model takes longer than that on a CPU, and page 7 needs sixteen such chains per problem across a hundred problems. The reasoning the explainable exists to show cannot be generated at the moment a reader asks for it.

**C3. The reader's mathematics stops at algebra.** The audience is first- and second-year engineering undergraduates with high-school algebra and introductory statistics and no machine-learning background. The literature's charts assume log axes, confidence intervals and pass@k as vocabulary. Most of the figures that would state our findings most compactly are unreadable to the reader we are writing for.

**C4. A technique we set out to teach did not replicate.** Budget forcing has two halves [Muennighoff 2025]. The terminating half, which caps the chain and forces an answer, behaved as published on our instrument. The extension half, which refuses to let the model stop by dropping the end-of-turn token and appending the word `Wait`, produced no gain at any injection count. We had planned a page around it, and had to decide what to put there instead.

**C5. A summary page can drift from the pages it summarizes.** The explainable ends by putting every lever on one axis, which means restating numbers that sixteen earlier pages measured. Any re-run that moves a number upstream leaves the summary quietly wrong, and a wrap-up that contradicts its own deck is worse than no wrap-up.

---

## 5 Design goals

By reviewing the literature on explorable explanations, multimedia learning and reproducible research, we established six design goals. Each answers one or more of the challenges above and is implemented in the section named after it.

**G1. One live control per page, placed first.** Every page opens on the thing the reader can change, so that the first act on any page is to move something and watch a consequence rather than to read a definition [Victor 2011; Case 2014]. (C3; Section 6)

**G2. One spotlighted number, and nothing that does not serve it.** Each page states a single figure in large type, and material that does not support it is cut rather than kept for completeness, following the signaling and coherence principles [Mayer 2009]. (C3; Section 6)

**G3. The reader commits a prediction before the reveal.** On the pages where intuition is most often wrong, the reader guesses before the data appears. The warrant here is specific rather than general: eliciting a prediction and an explanation improved recall and comprehension of data over passive viewing, and did so more in a chart than in text [Kim 2017], which is the argument for putting the prompt inside the figure rather than in the prose around it. The pattern is Predict-Observe-Explain [White 1992]. (C3; Section 6, pages 7, 13 and 15)

**G4. One colour grammar and one chart grammar across all sixteen pages.** A reader who has learned to read one of our charts has learned to read the next one, so the cost of each new figure falls as the deck proceeds [Sweller 1988]. (C3; Section 6)

**G5. Every measured claim on one instrument.** One model family, one item set pinned by hash, one decoding configuration, one grader, for every page that measures. This is what lets the closing chart put every lever on one axis honestly, and what makes the wrap-up derivable rather than restated. (C1 and C5; Sections 6 and 7)

**G6. Every measured figure re-derivable by the reader without a GPU.** Each measured page ships the notebook and harness that produced it, and that notebook re-derives the page's figures from committed logs on a laptop in about two minutes. Reproducibility here is a reading affordance, not an appendix. (C2; Section 7)

*Optional Table 1 goes here: the challenge-to-goal-to-section map, five rows against six columns.*

**A note on what we do not claim.** We do not claim that an interactive explainable teaches better than static prose. The best-powered direct test of that comparison, a preregistered study of 605 participants, found an interactive tutorial did not significantly outperform the same content delivered as a static document [Zhao 2025]; both beat receiving no material. The goals above are therefore mechanism claims, not medium claims. Prediction elicitation and retrieval practice have direct empirical support [Kim 2017; Roediger 2006]; "interactivity" in general does not, and the field's own survey of interactive articles says as much [Hohman 2020].

---

## 6 The explainable: what the reader sees

The explainable is sixteen pages in three acts, read in order, each page built around one idea, one live control and one spotlighted number (G1, G2).

**Act 1, Building intuition (pages 1 to 4).** Page 1 is a game: the reader feels their own two speeds as the size of a puzzle sets the thinking time. Page 2 asks one question that a reflex answer fails twice, once because the fact moved after the training cutoff and once because the question was misread, and shows a System 2 pass catching the second outright and flagging the first. Page 3 prices the alternative: retraining a model daily hits a compounding bill and a finite stock of text, lags by weeks and cannot be aimed at one fact. Page 4 shows three cultures multiplying the same numbers by three different roads to one answer, and names reasoning as diverse pathfinding from prior knowledge.

**Act 2, The toolbox (pages 5 to 11).** These are the measured pages: pages 5 to 9 and 11 each ship the notebook of their own run, and page 10 ships the code of its search arm. Page 5 takes the chain of thought away and measures what it was worth: forced to answer immediately, Qwen2.5-3B-Instruct solves 7 of 100 hard competition problems, and allowed to write its working first it solves 43. Page 6 caps the chain at 128, 256, 512, 1,024 and 2,048 tokens and watches accuracy climb and flatten. Page 7 samples many chains and votes, and shows that voting over identical chains buys nothing. Page 8 lets a judge score every chain and pick one, and grades the judges. Page 9 grades every step instead of the final answer. Page 10 turns reasoning into a maze the reader searches, paying for every node. Page 11, the keystone, puts parameters and test-time compute on one bill and asks whether sampling and voting on a small model can out-buy a bigger one.

**Act 3, Frontier and caveats (pages 12 to 16).** Page 12 shows a model teaching itself by keeping only the rationales that reached the right answer [Zelikman 2022]. Page 13 shows o1's two-axis curve, accuracy climbing with reinforcement-learning compute and with thinking time, with the chain itself hidden. Page 14 shows the open answer, DeepSeek-R1's reward for verifiable right answers and the pausing and self-correcting that emerged from it, then the distillation of the behaviour into models from 1.5 to 70 billion parameters. Page 15 is where more compute subtracts: budget rungs that lose answers, verifiers that are fallible, and one problem answered right when cut off and wrong when allowed to finish. Page 16 closes with the only chart that puts every lever on one axis, withheld until each lever has been met, and a ten-question concept check that names the page each answer came from.

**The anatomy of a page.** Every page opens on its control (G1). The reader changes a value and the consequence appears; motion happens only in response to the reader, and reduced-motion preferences are honoured. One number is spotlighted and the rest of the page serves it (G2). A provenance line names the page's instrument and says which of three things each number is: transcribed or digitized from a cited source, measured by us, or authored for teaching. Pages 5 to 9 and 11 carry a download holding the notebook and the harness that produced their figures. Each page closes with a short transition naming the next.

**The chart grammar.** A line with dots restates a table, so the pages are built to carry intuition instead of values (G4). Shaded ownership bands show which technique wins where; bold is reserved for the curve that is currently winning; arrows carry movement. Page 11's family chart takes the full width of its card, because a half-width chart of the deck's central claim was found unreadable in review. The logarithmic axis is earned rather than assumed: page 12 lets the reader toggle it on a curve they have already seen and watch that curve become a straight line, so the axis arrives as a consequence rather than a definition.

**Predict before reveal.** On pages 7, 13 and 15 the reader commits a guess before the data appears (G3). The clearest case is page 7: a reader who has predicted that voting always helps, and then watches sixteen identical chains vote to no effect, has met the precondition for voting in the only way that sticks.

**The wrap-up cannot drift.** Page 16 loads no data file of its own (G5, answering C5). Every rung of its ladder is read back out of the module that measured it, and the page refuses to build the ladder if two runs stop agreeing about how many problems they measured. A re-run that moves a number on page 7 moves it on page 16.

*Figure 1 goes here: the three-act map across the top; below it the anatomy of one page with its control, spotlighted number, provenance line and download labelled.*

---

## 7 The instrument: what the reader can check

**One instrument.** Rather than digitize incommensurable curves, we measured (G5, answering C1). We chose one local model family, Qwen2.5-Instruct at 1.5, 3 and 7 billion parameters, and two common benchmarks, GSM8K and MATH-500, and ran every lever on the same items with the same greedy decoding, the same 2,048-token cap and the same grader. The pages use the 3B as their instrument on 100 MATH-500 level-4 and level-5 problems, pinned by an item-set hash that every manifest records; the 1.5B and 7B appear where a claim needs a second checkpoint. Four ablation notebooks chose that instrument: a screen of nine checkpoints across two datasets and three prompt conditions; a matched comparison of general models against their math-tuned counterparts; a prompt ladder at a sample size that could resolve effects of eight points rather than twenty-five; and a test of whether reasoning trained into the weights lets a small specialist beat a large generalist.

**What one instrument buys.** The measured pages can then say things a digitized page could not. Suppressing the chain of thought costs the 3B 36 points on the page's items, 40 problems fixed against 4 broken; across the family the cost is 40 to 70 points, significant in every cell off the floor. A 1.5B model allowed to reason beats a 7B model forbidden to reason, 22 percent to 11 on the same problems, 18 fixed against 7 broken [page 5]. Sixteen sampled chains voted reach 56 percent where one greedy chain reaches 43, and the right answer is in the pile for 78 of the 100 problems, so the gap between the vote and that coverage is what the judges on page 8 are measured against [pages 7 and 8]. A trained process reward model picking the best of sixteen reaches 60 percent; the model judging itself reaches 51, below the vote it was meant to improve on [page 8]. Filtering chains by step soundness moves the vote by one point [page 9].

**The null result the instrument found (C4).** Page 6's main sweep is budget forcing's terminating half, and it behaves as published, with accuracy climbing 7, 17, 35, 44 and 43 percent across budgets of 128 to 2,048 tokens. The extension half did not. Injecting `Wait` up to three times took the 3B from 43 percent to 41, 41 and 42; the 1.5B from 22 to 23, 17 and 20; the 7B from 60 to 59, 58 and 57. Chains grew from about 700 to about 1,250 tokens for no gain, and paired on the same items one injection fixed 7 problems and broke 9 [page 6, section 11. *Page 6's notebook carries a fourth mode that re-runs this arm over the whole level-4 and level-5 pool, and its runbook records that the published injection allowance had truncated 51 of 300 items mid-revision. Quote the POWER run's numbers here, not these.*]. Our reading is that appending `Wait` does not tell the model how to reason further, only that it has not finished. The notebook records a structural reason as well: these instruct checkpoints have no thinking block, so the injection lands after a finished answer rather than inside a deliberation, which is not the setting the original paper measured. The page shows the null result rather than hiding it, and page 15 is built so that a later slider separates thinking longer from re-reading an answer, and never contradicts the measurement above it.

**The notebook-first pipeline.** Each measured page begins as a specification, which is implemented as a notebook, refined until it runs unchanged on a laptop CPU and on a 16-gigabyte GPU, approved, and only then translated to the page's TypeScript, which renders from the committed logs (G6, answering C2). The notebook is not scaffolding. It is the artifact that makes the page's claims checkable, and the page links to it. A shared harness holds the plumbing every notebook repeats, model loading, token-string reconstruction, the resume log and the provenance hashes, and tests its own invariants at the top of every run; everything that carries a claim, prompt construction, item selection, the thinking constraint, step segmentation and every line of figure code, stays in the notebook where a sceptical reader looks for it.

Three run modes keep the pipeline usable, and every notebook carries the same three. REPLAY is the default: it loads no model, needs no GPU, reads the committed logs and re-derives every figure in about two minutes, which is what a reader who doubts a number runs first. QUICK loads the model and runs a small draw, twenty items and a reduced chain pool, on an 8-gigabyte GPU in about twenty minutes. FULL is the run the page publishes: a hundred items and the full chain pool on a 16-gigabyte GPU, about two hours batched for page 7's sixteen chains per problem. Without REPLAY, a reader who wanted to check a figure would face hours of GPU time; the four-model ablation behind page 5 was 2,800 generations and took three hours and forty minutes on a single consumer GPU.

**Provenance, and where the instrument came from.** Every on-screen number is transcribed from a cited source, measured by us, or authored for teaching, and the page says which. Each measured page carries a manifest recording the run id, notebook hash, item-set hash, decoding settings and grader, and the test suite asserts that the notebook in a download is the notebook its manifest names. The grading functions themselves are Raschka's, used unchanged from the book's third chapter [Raschka 2026], as is the notebook-first structure we adopted. This is deliberate: a grader we did not write is a grader we cannot tune toward our own headline.

**Implementation and deployment.** Next.js, TypeScript, D3 and Zustand, with client-side Monte Carlo in Web Workers for the authored simulations. There are no runtime network calls, no API keys and no per-user cost, so the explainable is free to serve, works offline and scales without a backend. Live in-browser inference on pages 3 and 14 exists behind a flag that is off by default and always falls back to the pre-computed trace. Unit tests assert data fidelity for every digitized curve, and end-to-end tests run accessibility checks on every page.

*Figure 4 goes here: the instrument pipeline, from specification to notebook to derived file to page to download, with the hash checks drawn as gates.*

---

## 8 Usage scenarios

*Newly drafted against the plan's briefs. Wants an author pass.*

### 8.1 A newcomer discovers that more attempts help only when the attempts differ

Maya is a first-year engineering undergraduate. She has used a chatbot and has no machine-learning background, and she arrives believing what most readers believe: that a bigger model is a better model, and that asking a model to try harder makes it do better.

Page 1 gives her a puzzle whose size sets her own thinking time, and she notices that she answers small instances instantly and reaches for scratch paper on large ones. Page 5 does the same thing to a model in front of her. She switches the chain of thought off and watches the score fall from 43 of 100 to 7, then switches it back on. The working, she sees, is not a report of the answer; it is where the answer is produced. Page 6 hands her a budget slider, and she drags it from 128 tokens to 2,048 and watches accuracy climb steeply and then flatten. Her first intuition, that more is better, survives this page.

Page 7 breaks it. Before any data appears, the page asks her to predict what happens when the model writes sixteen chains instead of one and takes the most popular answer (G3). She predicts a large gain. She then sets the sampling temperature to zero, so that all sixteen chains come out identical, and watches the vote deliver nothing at all: sixteen copies of one opinion are one opinion. Raising the temperature, the chains diverge and the vote climbs to 56 percent. The precondition for voting is diversity, and she has now met the case where it fails before she met the case where it works.

Page 8 turns her new intuition over once more. The right answer, the page shows her, was somewhere in the pile of sixteen for 78 of the 100 problems, while the vote captured only 56. The bottleneck is not generation but selection, and when she puts a judge in front of the pile and watches a trained verifier reach 60 percent while the model judging its own work reaches 51, below the vote it was meant to improve, she has the shape of the whole field: producing a right answer and recognising it are different problems, and the second is harder.

By page 16 Maya can say something she could not say two hours earlier. Not that reasoning helps, which she believed on arrival, but *when* it helps, *what it costs*, and *which of the levers stops paying first*, with every claim on one axis because every claim was measured on one instrument.

### 8.2 A sceptical reader re-derives a page's headline number on a laptop

Dev is a graduate student who works with language models and does not believe page 8. Best-of-sixteen taking 43 percent to 60 is a large claim, and the literature is full of selection results that do not survive a change of grader.

He does not have to take it on trust. The page carries a download beside its figure, and the download holds the notebook that produced it, the shared harness, all 12,800 chains and the judges' scores. He opens the notebook in REPLAY, its default mode. It loads no model and asks for no GPU. In about two minutes on his laptop it re-reads the committed logs, re-runs every aggregation and redraws the page's figure in front of him (G6).

Then he checks that the artifact is what it says it is. The manifest names a run id, an item-set hash, the decoding settings and the grader; the item-set hash matches the one every other measured page records, which is how he confirms that page 7's vote and page 8's best-of-N were computed over the same hundred problems rather than two convenient samples. He notices that the grading functions are not the authors' own but are imported unchanged from a published book, which removes the degree of freedom he was most suspicious of.

Satisfied that the number is real, he starts moving it. He swaps the judge for a weaker one and watches best-of-N fall below the majority vote, reproducing on his own machine the page's claim that a bad judge is worse than no judge. His scepticism has become an experiment, which is the outcome the pipeline exists to make cheap.

*Figure 5 goes here: page 15's specimen flip beside page 16's ladder.*

---

## 9 Informed design through iterations

*Newly drafted. Wants an author pass and a decision on the before-and-after figure.*

The explainable reached its current form over [span] of design and revision, and three of its lessons cost us pages.

**We cut a third of the deck, and the cuts had a price we state rather than hide.** The explainable was planned at twenty-one pages and shipped at sixteen, in two passes. The first removed two pages from the end; the second removed four from the middle of Act 3, which forced its one survivor to move and required a new closing page to be written the same day. The deck that resulted no longer teaches how to read a benchmark score, and no longer returns at the end to the question the reader was asked on page 2. Both are real losses, and page 16 says so instead of papering over them.

**A chart at half width made the deck's central claim unreadable.** Page 11 is the keystone, the page that puts parameters and test-time compute on one bill. Its family chart was originally laid out at half the card's width beside explanatory text, and review found that readers could not resolve the curves that carry the argument. It now takes the full width, and the text moved below it. The general lesson we took was that the page's most important figure should be sized by the difficulty of reading it, not by the symmetry of the layout.

**Drawing a closed system in an open system's visual grammar implied a parity we could not support.** An early version of page 13 rendered o1's training recipe in the same visual language page 14 uses for DeepSeek-R1's. Because the grammar was shared, the figure asserted a structural equivalence between a published recipe and an undisclosed one. We cut it. A shared grammar is a claim about the things it draws, which is precisely why G4 is a design goal and also why it has to be applied with care.

A fourth change is worth one sentence: page 15's authored illustrative curves were retired in favour of its own measured run as soon as that run existed, which is the rule the whole deck follows, that an authored figure is a placeholder for a measurement rather than a substitute for one.

*Optional Figure 6: page 11's half-width and full-width layouts side by side.*

---

## 10 Limitations and future work

**Limitations.** The explainable measures on one model family, so the ordering of its closing ladder is a fact about Qwen2.5-Instruct and not yet a fact about language models. Accuracy across Acts 2 and 3 is discounted by benchmark contamination, and the deck states this on pages 15 and 16 rather than in a footnote, though nothing here can say by how much any individual number is inflated. There is no user study: the design goals in Section 5 are derived from the literature rather than from formative work with the target audience, and the explainable has not yet been watched in use by the readers it was built for. Five pages were cut before submission, and the deck is weaker for two of them in the specific ways Section 9 records.

**Future work.** A second instrument family on the same items would show which parts of the closing ladder's ordering are general and which belong to Qwen. Live inference is built and flagged off; when a model small enough to answer inside a browser's budget exists, the reader will be able to bring their own problem to pages 3 and 14. The cut pages are worth restoring when they can be measured rather than retold, and closing the page-2 loop at the end of the deck is the next structural change. Finally, a moderated read-through with first-year undergraduates is the intended next step, and on the evidence discussed in Section 5 it should be designed to test the mechanisms this deck actually relies on, prediction and retrieval, rather than interactivity in general.

---

## 11 Conclusion

This paper describes an explainable, designed for readers with a high-school mathematics background, that guides them through the machinery of inference-time scaling one step at a time. It takes the reader from System 1 against System 2 thinking, to a single chain of thought, to majority voting over many parallel chains, to searching a tree of thoughts, and finally to the point where these reasoning methods are trained into the weights to produce models like DeepSeek-R1 and o1. Every page has a control to move, every measured figure has a notebook that re-derives it on a laptop, and the last page cannot contradict the ones before it because it reads its numbers out of the modules that measured them.

---

## References

*Keys used in the text. To be formatted in ACM style at typesetting. arXiv identifiers from the literature review; venue given where known.*

- **[Beeching 2024]** E. Beeching, L. Tunstall, S. Rush. Scaling Test-Time Compute with Open Models. Hugging Face blog, 2024.
- **[Brown 2024]** B. Brown et al. Large Language Monkeys: Scaling Inference Compute with Repeated Sampling. arXiv:2407.21787.
- **[Case 2014]** N. Case. Explorable Explanations. explorabl.es.
- **[Chen 2024]** L. Chen et al. Are More LLM Calls All You Need? Towards Scaling Laws of Compound Inference Systems. arXiv:2403.02419.
- **[Chen 2025]** Z. Chen, B. Chen, A. Mirhoseini. Scale Test-Time Compute on Modern Hardware. Tutorial, NeurIPS 2025.
- **[Cho 2026]** A. Cho, G. C. Kim, A. Karpekov, A. Helbling, Z. J. Wang, S. Lee, B. Hoover, D. H. Chau. Transformer Explainer: Learning LLM Transformers with Interactive Visual Explanation and Experimentation. CHI 2026. doi:10.1145/3772318.3791725.
- **[Cobbe 2021]** K. Cobbe et al. Training Verifiers to Solve Math Word Problems. arXiv:2110.14168.
- **[DeepSeek-AI 2025]** DeepSeek-AI. DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning. Nature, 2025. arXiv:2501.12948.
- **[Felder 2026]** L. Felder, J. Miller, M. Wallinger, S. Kobourov, C. Chen. ReTrace: Interactive Visualizations for Reasoning Traces of Large Reasoning Models. Computer Graphics Forum, 2026. arXiv:2511.11187.
- **[Gao 2025]** [Inverse Scaling in Test-Time Compute. arXiv:2507.14417. Verify author.]
- **[Grootendorst 2025]** M. Grootendorst. A Visual Guide to Reasoning LLMs. 2025.
- **[Hohman 2020]** F. Hohman, M. Conlen, J. Heer, D. H. Chau. Communicating with Interactive Articles. Distill, 2020.
- **[Kahng 2019]** M. Kahng, N. Thorat, D. H. Chau, F. Viégas, M. Wattenberg. GAN Lab: Understanding Complex Deep Generative Models using Interactive Visual Experimentation. IEEE TVCG 25(1), 2019. arXiv:1809.01587.
- **[Kahneman 2011]** D. Kahneman. Thinking, Fast and Slow. Farrar, Straus and Giroux.
- **[Kim 2017]** Y.-S. Kim, K. Reinecke, J. Hullman. Explaining the Gap: Visualizing One's Predictions Improves Recall and Comprehension of Data. CHI 2017. doi:10.1145/3025453.3025592.
- **[Lee 2023]** S. Lee et al. Diffusion Explainer: Visual Explanation for Text-to-image Stable Diffusion. arXiv:2305.03509.
- **[Li 2025]** Z. Li, E. Shareghi, N. Collier. ReasonGraph: Visualisation of Reasoning Methods. ACL 2025 System Demonstrations. arXiv:2503.03979.
- **[Lightman 2023]** H. Lightman et al. Let's Verify Step by Step. ICLR 2024. arXiv:2305.20050.
- **[Mayer 2009]** R. E. Mayer. Multimedia Learning, 2nd ed. Cambridge University Press.
- **[Muennighoff 2025]** N. Muennighoff et al. s1: Simple Test-Time Scaling. arXiv:2501.19393.
- **[OpenAI 2024]** OpenAI. Learning to Reason with LLMs (o1 system card and blog).
- **[Raschka 2026]** S. Raschka. Build a Reasoning Model (From Scratch). Manning, 2026. ISBN 9781633434677. Code: github.com/rasbt/reasoning-from-scratch.
- **[Roediger 2006]** H. L. Roediger, J. D. Karpicke. Test-Enhanced Learning: Taking Memory Tests Improves Long-Term Retention. Psychological Science 17(3).
- **[Shojaee 2025]** P. Shojaee et al. The Illusion of Thinking. arXiv:2506.06941.
- **[Snell 2024]** C. Snell, J. Lee, K. Xu, A. Kumar. Scaling LLM Test-Time Compute Optimally Can Be More Effective than Scaling Model Parameters. ICLR 2025. arXiv:2408.03314.
- **[Sweller 1988]** J. Sweller. Cognitive Load During Problem Solving. Cognitive Science 12(2).
- **[Victor 2011]** B. Victor. Explorable Explanations. worrydream.com.
- **[Wang 2020]** Z. J. Wang et al. CNN Explainer: Learning Convolutional Neural Networks with Interactive Visualization. IEEE VIS 2020 / TVCG 27(2). arXiv:2004.15004.
- **[Wang 2022]** X. Wang et al. Self-Consistency Improves Chain of Thought Reasoning in Language Models. ICLR 2023. arXiv:2203.11171.
- **[Wei 2022]** J. Wei et al. Chain-of-Thought Prompting Elicits Reasoning in Large Language Models. NeurIPS 2022. arXiv:2201.11903.
- **[Weng 2025]** L. Weng. Why We Think. lilianweng.github.io, 2025.
- **[White 1992]** R. White, R. Gunstone. Prediction-Observation-Explanation. In Probing Understanding. Falmer Press.
- **[Wu 2024]** Y. Wu et al. Inference Scaling Laws: An Empirical Analysis of Compute-Optimal Inference for Problem-Solving with LLMs. arXiv:2408.00724.
- **[Yao 2023]** S. Yao et al. Tree of Thoughts: Deliberate Problem Solving with Large Language Models. NeurIPS 2023. arXiv:2305.10601.
- **[Zelikman 2022]** E. Zelikman, Y. Wu, J. Mu, N. Goodman. STaR: Bootstrapping Reasoning with Reasoning. NeurIPS 2022. arXiv:2203.14465.
- **[Zhao 2025]** J. Zhao, A. Michal, N. Thain, H. Subramonyam. Thinking Like a Scientist: Can Interactive Simulations Foster Critical AI Literacy? arXiv:2507.21090.
- **[Zhou 2026]** Z. Zhou, Z. Zhu, X. Li, M. Galkin et al. Landscape of Thoughts. ICLR 2026. arXiv:2503.22165.
- **[our review]** S. Bangalore Lakshman, S. L. Eiers. Inference-Time Scaling for Large Language Models: A Systematic Literature Review. Unpublished, 2026. [Decide whether to cite or fold in.]
- **[page N]** Refers to the explainable's page N and the notebook it ships; manifests in the repository record run id, model, decoding, item-set hash and grader.

---

**Draft word counts**, 2026-09-20, drafted prose only, placeholders excluded:

Counted by script over drafted prose, with figure placeholders and bracketed citations excluded, so each is a slight undercount.

| § | Section | Target | Draft | Delta |
|---|---|---|---|---|
| 1 | Introduction | 650 | 558 | −92 |
| 2 | Background | 550 | 380 | **−170** |
| 3 | Related work | 500 | 386 | −114 |
| 4 | Design challenges | 450 | 366 | −84 |
| 5 | Design goals | 350 | 455 | +105 |
| 6 | What the reader sees | 1,100 | 817 | **−283** |
| 7 | What the reader can check | 900 | 993 | +93 |
| 8 | Usage scenarios | 750 | 737 | −13 |
| 9 | Informed design | 250 | 399 | +149 |
| 10 | Limitations and future work | 300 | 269 | −31 |
| 11 | Conclusion | 150 | 122 | −28 |
| | **Body total** | **5,950** | **5,482** | **−468** |

**There is room, not a deficit to cut.** The two sections most under target are the two that carry the artifact, section 2 and section 6, and section 6 is where the extra words should go: the three acts are currently one paragraph each and the page-by-page detail from the old section 4 was compressed to fit. Section 5 runs over because of the note on what we do not claim, which is worth its length. Section 9 runs over on its fourth lesson, which is the first thing to cut if the figures push the body past budget.
