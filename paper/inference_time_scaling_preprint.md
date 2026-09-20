# The Story of Inference-Time Scaling: An Interactive, Reproducible Explainable of How Language Models Reason

**Shashank Bangalore Lakshman**, **Scott Lawrence Eiers**
Western Governors University

*Preprint. The explainable this paper describes was accepted to the 9th Workshop on Visualization for AI Explainability (VISxAI) at IEEE VIS 2026. Live at https://sapiotomy.vercel.app.*

> Draft status, 2026-09-20. Sections 1, 2, 5, 6 and 8 are drafted from the repository's own measurements and documents. Section 3 (landscape) waits on the authors' related-work search. Sections 4 and 7 are drafted so the paper reads end to end, but the authors have said more is coming for both. Bracketed notes in the text mark numbers still to be pinned. Word count of drafted prose is printed at the end.

---

## Abstract

Inference-time scaling is the practice of spending more compute when a model answers rather than when it is trained: letting it write a longer chain of reasoning, writing several chains and voting, or searching among partial chains and keeping the best. It has become the main way small models compete with large ones on hard problems, and it is the mechanism that the current generation of reasoning models trains into their weights. The resources that teach it fall into three kinds, and each leaves a gap. Static articles redraw curves measured on other people's models and cannot be checked. Build-it-from-scratch books teach the training loop, not the levers a reader can pull. Short interactives show one lever in isolation. We built a sixteen-page interactive explainable that bridges the three: every page carries a live visualization the reader manipulates, the pages that measure are measured on one instrument, and every measured figure ships with the notebook that re-derives it. This story enables learners to interact with the machinery of reasoning in real time, with the opportunity to dive deeper into how it works through reproducible notebooks centred on the Qwen2.5-Instruct series.

---

## 1 Introduction

For most of the last decade, the way to make a language model better was to make it bigger and train it on more text. Inference-time scaling changed the accounting. A model that is allowed to reason before it answers, whether by writing out its steps, by writing several attempts and voting, or by searching among partial attempts, closes much of the gap to a model many times its size [Snell 2024; Wu 2024]. And once the reasoning behaviour is trained into the weights rather than prompted for, capability rises again: this is the recipe behind o1 and o3 [OpenAI 2024] and behind DeepSeek-R1 and the small models distilled from it [DeepSeek-AI 2025]. A 1.5-billion-parameter model that reasons now outscores a 7-billion-parameter model that does not, and the explainable this paper describes measures exactly that on its own pages.

The difficulty for a learner is that inference-time scaling is not one mechanism. It is a family that shares only its accounting. Some systems run a Monte Carlo search over reasoning steps, expanding and pruning a tree of partial solutions [Yao 2023]. Some sample many complete chains and let a judge or a trained verifier pick one [Cobbe 2021; Lightman 2023]. Some sample many and take the majority answer [Wang 2022]. Some use a single plain chain of thought [Wei 2022] and simply let it run longer [Muennighoff 2025]. The frontier models train the behaviour in with reinforcement learning against verifiable answers, so that the chain appears unasked [DeepSeek-AI 2025]. Each of these is "inference-time scaling" in the literature, and a reader who meets the term meets five different things under one name, measured on different models, different benchmarks and different budgets.

It is still worth understanding, because the gains are large where they matter. Spending compute on reasoning produces its biggest returns on hard, multi-step problems, precisely the ones a reflex answer gets wrong [Snell 2024; Brown 2024]. The same literature also shows where it stops paying: accuracy plateaus, the wrong answer can win a vote, more thinking can subtract, and verifiers are fallible [Chen 2024; Shojaee 2025; Gao 2025]. A learner who understands only the gains, or only the failures, has half the picture.

Making a learning tool for this is hard for four reasons we met directly. First, the published numbers do not compare: each paper measures its lever on its own model, its own items and its own grader, so the levers cannot be put on one axis. Second, a live model cannot run where a web page is served; the hosting has no GPU and strict time limits. Third, the visualizations must be readable by a reader with high-school mathematics and statistics, which rules out most of the charts the literature draws. Fourth, some of the folklore does not survive measurement: appending "Wait" to make a model think longer, the extension half of budget forcing [Muennighoff 2025], did nothing on the instruct checkpoints we used.

This paper describes *The Story of Inference-Time Scaling*, a sixteen-page interactive explainable that takes a reader with no machine-learning background from "a model can only blurt an answer" to the levers' own failure modes. It contributes the explainable itself, with a live control on every page; a single measured instrument on which pages 5 to 9 and 11 run their own experiments over the same hundred problems with the same grader, and page 15 replays those runs; a notebook shipped with every one of those pages that re-derives its figures on a laptop; and the design lessons in Section 5, including the ones we did not overcome.

---

## 2 Background: reasoning, chain of thought, and the levers

**Two speeds.** Adding two one-digit numbers is a reflex. Long division of a three-digit number by a two-digit one is not: almost everyone reaches for a scratchpad and works it step by step, and the steps are the working, not a report of it. Kahneman's names for the two speeds are System 1 and System 2 [Kahneman 2011], and the explainable opens by letting the reader feel both on a puzzle whose size sets the thinking time.

A language model answering on reflex is System 1. Asked a question, it emits an answer in a handful of tokens, and on a hard problem that answer is usually wrong. Page 5 of the explainable measures this on Qwen2.5-3B-Instruct: forced to answer immediately, the model solves 7 of 100 hard competition problems; allowed to write its working first, it solves 43 [page 5]. The working is a chain of thought [Wei 2022]. For a person it is a scratchpad; for a model it is the output itself, so the tokens of the chain are the compute, and a budget on those tokens is the simplest lever there is [page 6].

**Many scratchpads.** Inference-time scaling is what follows once tokens are compute. One scratchpad can be made longer. Several scratchpads can be written independently and the most popular answer taken: this is majority voting, or self-consistency [Wang 2022], and it works only when the chains are actually different from one another. Several can be written and each scored against a criterion, with the best-scoring one kept: this is best-of-N with a judge, where the judge may be the model itself, a trained verifier of final answers [Cobbe 2021], or a verifier of every step [Lightman 2023]. Scratchpads can be grown a step at a time, with weak partial attempts pruned and promising ones extended: this is search over thoughts [Yao 2023], and it pays for every node it examines. Finally, the habit can be trained in. A model can generate rationales, keep only the ones that reached the right answer, and fine-tune on them [Zelikman 2022]; or it can be rewarded by reinforcement learning for verifiable right answers until pausing and self-correcting emerge on their own [DeepSeek-AI 2025]. The explainable's three acts follow this order: the two speeds, the toolbox, and the frontier where the toolbox is baked into the weights.

The literature review behind the explainable asked three questions of this family, and the pages answer them one lever at a time: when does test-time compute help, how should it be allocated between longer chains and more chains, and where does it saturate [our review].

*Figure 2 goes here: a block diagram in seven or eight blocks. Question; reflex answer; one chain of thought; many chains; vote; judge; search; trained in. Drawn in the explainable's colour grammar so the paper's figure and the pages read as one system.*

---

## 3 The landscape at the time of writing

*Pending the authors' related-work search. Planned structure below so the results have a place to land.*

Resources for a learner who wants to understand reasoning models fall into four kinds.

**Build-it-yourself books and courses.** Raschka's *Build a Reasoning Model (From Scratch)* walks a reader through constructing a reasoning model with code [Raschka 2025]. [Add others found.] These teach the training loop end to end and assume a reader who can run the code; they do not put the inference-time levers side by side, and the reader sees one model's numbers.

**Interactive explainers of adjacent topics.** Transformer Explainer [Cho 2026], CNN Explainer [Wang 2020], Diffusion Explainer [Lee 2023], TensorFlow Playground and the Distill articles set the bar for interactive explanation of a model's internals. None covers what happens after the model is trained.

**Static explanations of reasoning.** [Blog posts and lecture notes that redraw the self-consistency, best-of-N and compute-optimal curves; model-provider write-ups on o1 and R1. To be listed from the search.] These retell measurements made elsewhere. A reader cannot turn a knob and cannot check a number.

**Primary papers with demos or notebooks.** [To be listed.]

*Figure 3 goes here: one table, rows for each resource, columns for interactive, measured on one instrument, reproducible by download, and audience assumed.* The explainable is the only entry that is all three.

---

## 4 The explainable in brief

*Drafted from the page manifest and the design documents; the authors have said more is coming.*

The explainable is sixteen pages in three acts, read in order, each page built around one idea, one live control and one spotlighted number.

**Act 1, Building intuition (pages 1 to 4).** Page 1 is a game: the reader feels their own two speeds as the size of a puzzle sets the thinking time. Page 2 asks one question that a reflex answer fails twice, once because the fact moved after the training cutoff and once because the question was misread, and shows a System 2 pass catching the second outright and flagging the first. Page 3 prices the alternative: retraining a model daily hits a compounding bill and a finite stock of text, lags by weeks and cannot be aimed at one fact. Page 4 shows three cultures multiplying the same numbers by three different roads to one answer, and names reasoning as diverse pathfinding from prior knowledge.

**Act 2, The toolbox (pages 5 to 11).** These are the measured pages: pages 5 to 9 and 11 each ship the notebook of their own run, and page 10 ships the code of its search arm. Page 5 takes the chain of thought away and measures what it was worth. Page 6 caps the chain at 128, 256, 512, 1,024 and 2,048 tokens and watches accuracy climb and flatten. Page 7 samples many chains and votes, and shows that voting over identical chains buys nothing. Page 8 lets a judge score every chain and pick one, and grades the judges. Page 9 grades every step instead of the final answer. Page 10 turns reasoning into a maze the reader searches, paying for every node. Page 11, the keystone, puts parameters and test-time compute on one bill and asks whether sampling and voting on a small model can out-buy a bigger one.

**Act 3, Frontier and caveats (pages 12 to 16).** Page 12 shows a model teaching itself by keeping only the rationales that reached the right answer [Zelikman 2022]. Page 13 shows o1's two-axis curve, accuracy climbing with reinforcement-learning compute and with thinking time, with the chain itself hidden. Page 14 shows the open answer, DeepSeek-R1's reward for verifiable right answers and the pausing and self-correcting that emerged from it, then the distillation of the behaviour into models from 1.5 to 70 billion parameters. Page 15 is where more compute subtracts: budget rungs that lose answers, verifiers that are fallible, and one problem answered right when cut off and wrong when allowed to finish. Page 16 closes with the only chart that puts every lever on one axis, withheld until each lever has been met, and a ten-question concept check that names the page each answer came from.

**The anatomy of a page.** Every page opens on its control. The reader changes a value and the consequence appears; motion happens only in response to the reader. One number is spotlighted. A provenance line names the page's instrument and says which of three things each number is: transcribed or digitized from a cited source, measured by us, or authored for teaching. Pages 5 to 9 and 11 carry a download holding the notebook and the harness that produced their figures; page 15 re-reads those same runs and page 16 reads every number back out of the modules that measured it. Each page closes with a short transition naming the next.

**The wrap-up cannot drift.** Page 16 loads no data file of its own. Every rung of its ladder is read back out of the module that measured it, and the page refuses to build the ladder if two runs stop agreeing about how many problems they measured. A re-run that moves a number on page 7 moves it on page 16.

**Implementation.** Next.js, TypeScript, D3 and Zustand; client-side Monte Carlo in Web Workers for the authored simulations; no runtime network calls, no API keys and no per-user cost, so the explainable is free to serve and works offline. Live in-browser inference on pages 3 and 14 exists behind a flag that is off by default and always falls back to the pre-computed trace. Reduced-motion preferences are honoured. Unit tests assert data fidelity for every digitized curve and end-to-end tests run accessibility checks on every page.

*Figure 1 goes here: the three-act map across the top; below it the anatomy of one page with its control, spotlighted number, provenance line and download labelled.*

---

## 5 Design challenges and how we solved them

### 5.1 Appending "Wait" does not make a model think longer

Budget forcing has two halves [Muennighoff 2025]. The terminating half caps the chain and forces an answer; page 6's main sweep is that half, and it behaves as published, with accuracy on Qwen2.5-3B-Instruct climbing 7, 17, 35, 44 and 43 percent across budgets of 128 to 2,048 tokens. The extension half refuses to let the model stop: when it tries to end its turn, the end-of-turn token is dropped, the word `Wait` is appended, and generation continues. We expected the second half to buy accuracy the way the first half had.

It did not. Injecting `Wait` up to three times took the 3B from 43 percent to 41, 41 and 42; the 1.5B from 22 to 23, 17 and 20; the 7B from 60 to 59, 58 and 57. Chains grew from about 700 to about 1,250 tokens for no gain. Paired on the same items, one injection fixed 7 problems and broke 9 [page 6, section 11; page 6's notebook alone carries a fourth mode that re-runs this arm over the whole level-4 and level-5 pool, and its runbook says the published injection allowance had truncated 51 of 300 items mid-revision. Verify against that run before this paragraph is final].

This is a challenge we did not overcome. We learned from it. Our hypothesis is that appending "Wait" does not tell the model how to reason further; it only tells it that it has not finished. The notebook records a structural reason as well: these instruct checkpoints have no thinking block, so the injection lands after a finished answer rather than inside a deliberation, which is not the setting the original paper measured, where the word is inserted before the model commits. The page now shows the null result rather than hiding it, and page 15 builds on it: a later slider on that page separates "think longer" from "re-read your own answer" so that a simulation never contradicts the measurement above it.

### 5.2 Visualizations for a reader with high-school mathematics

The question we kept returning to was how to make interactive visualizations that are readable and intuitive for a reader whose mathematics stops at algebra and introductory statistics. The literature's charts assume log axes, confidence intervals and pass@k as vocabulary. Six rules emerged, each with a page that shows it.

*One control, placed first.* Every page opens on the thing the reader can change, so that the first act on any page is to move something and see a consequence, in the sense of Victor's explorable explanations and Case's "start on the ground" [Victor 2011; Case 2014].

*One spotlighted number.* Each page states one figure in large type and everything else serves it, following Mayer's signaling and coherence principles [Mayer 2009].

*Build intuition, do not restate values.* A line with dots restates a table. The pages use shaded ownership bands to show which technique wins where, bold only on the curve that is winning, and arrows for movement. Page 11's family chart takes the full width of its card, because a half-width chart of the central claim was found unreadable in review.

*Predict before reveal.* On pages 7, 13 and 15 the reader commits a guess before the data appears, the Predict-Observe-Explain pattern from constructivist teaching. A reader who has predicted that voting always helps, and then watches identical chains vote to no effect, remembers why diversity matters.

*Earn the log axis.* Page 12 introduces the logarithmic axis by letting the reader toggle it on a curve they have already seen, and watch the curve become a straight line. The axis is taught as a consequence, not a definition.

*One grammar.* One colour grammar and one chart grammar run across all sixteen pages, so that the cost of reading a new chart falls with every page, in line with cognitive load theory [Sweller 1988].

### 5.3 The literature would not unify

Our first plan was to consolidate the published results into the explainable: digitize the self-consistency curve, the best-of-N curve, the compute-optimal curve, and let the reader move along each. It was not enough. The results span too many models, too many benchmarks and too many ways of spending the compute, a three-dimensional problem in which no two papers share an axis. A curve digitized from one paper could not be placed next to a curve from another without the comparison being a lie, and the reader would have no way to know which numbers were comparable.

Instead of navigating that, we measured. We chose one local model family, Qwen2.5-Instruct at 1.5, 3 and 7 billion parameters, and two common benchmarks, GSM8K and MATH-500, and ran every lever on the same items with the same greedy decoding, the same 2,048-token cap and the same grader. The pages use the 3B as their instrument on 100 MATH-500 level-4 and level-5 problems, pinned by an item-set hash that every manifest records; the 1.5B and 7B appear where a claim needs a second checkpoint. Four ablation notebooks chose that instrument: a screen of nine checkpoints across two datasets and three prompt conditions; a matched comparison of general models against their math-tuned counterparts; a prompt ladder at a sample size that could resolve effects of eight points rather than twenty-five; and a test of whether reasoning trained into the weights lets a small specialist beat a large generalist.

The measured pages can then say things a digitized page could not. Suppressing the chain of thought costs the 3B 36 points on the page's items, 40 problems fixed against 4 broken; across the family the cost is 40 to 70 points, significant in every cell off the floor. A 1.5B model allowed to reason beats a 7B model forbidden to reason, 22 percent to 11 on the same problems, 18 fixed against 7 broken [page 5]. Sixteen sampled chains voted reach 56 percent where one greedy chain reaches 43, and the right answer is in the pile for 78 of the 100 problems, so the gap between the vote and that coverage is what the judges on page 8 are measured against [pages 7 and 8]. A trained process reward model picking the best of sixteen reaches 60 percent; the model judging itself reaches 51, below the vote it was meant to improve on [page 8]. Filtering chains by step soundness moves the vote by one point [page 9]. Every one of these is one instrument, one item set, one grader, and the reader who doubts any of them downloads the notebook.

### 5.4 No live model where the page is served

The reasoning we wanted to show could not run in the page. The explainable is served from Vercel, which has no GPU and holds a request to a few tens of seconds. A single 2,048-token chain from a 3B model takes longer than that on a CPU, and page 7 needs sixteen of them per problem for a hundred problems.

We adopted a notebook-first pipeline. Each measured page begins as a specification, which is implemented as a notebook, refined until it runs unchanged on a laptop CPU and on a 16-gigabyte GPU, approved, and only then translated to the page's TypeScript, which renders from the committed logs. The notebook is not scaffolding. It is the artifact that makes the page's claims checkable, and the page links to it. A shared harness holds the plumbing every notebook repeats, model loading, token-string reconstruction, the resume log and the provenance hashes, and tests its own invariants at the top of every run; everything that carries a claim, prompt construction, item selection, the thinking constraint, step segmentation and every line of figure code, stays in the notebook where a sceptical reader looks for it.

Three run modes keep the pipeline usable, and every notebook carries the same three. REPLAY is the default: it loads no model, needs no GPU, reads the committed logs and re-derives every figure in about two minutes, which is what a learner who doubts a number runs first. QUICK loads the model and runs a small draw, twenty items and a reduced chain pool, on an 8-gigabyte GPU in about twenty minutes, to check that the notebook still runs end to end. FULL is the run the page publishes: a hundred items and the full chain pool on a 16-gigabyte GPU, about two hours batched for page 7's sixteen chains per problem. Without REPLAY, a learner who wanted to check a figure would face hours of GPU time; the four-model ablation behind page 5 was 2,800 generations and took three hours and forty minutes on a single consumer GPU.

Live inference exists in the explainable, on pages 3 and 14, behind a flag that is off by default. It always falls back to the pre-computed trace, and page 6 runs no inference in the browser at all: its numbers are the run it ships.

### 5.5 [One or two more challenges, to be chosen]

*Candidates from the repository's review history: the wrap-up that cannot drift from its pages; the closed recipe drawn in the same grammar as the open one, and cut; the scope cut from twenty-one pages to sixteen.*

*Figure 4 goes here: the instrument pipeline, from specification to notebook to derived file to page to download, with the hash checks drawn as gates. Figure 5 goes here: page 15's specimen flip beside page 16's ladder.*

---

## 6 Future work

*Drafted from the repository's stated limitations; the authors have said more is coming.*

The explainable measures on one model family, so the ordering of its closing ladder is a fact about Qwen2.5-Instruct. A second family on the same items would show which parts of the ordering are general. Live inference is built and flagged off; when a model small enough to answer inside a browser's budget exists, the reader will be able to bring their own problem to page 3 and page 14. Five pages were cut before submission, among them a page that taught how to read a benchmark score and a page on whether the chain can be trusted; both are worth restoring when they can be measured rather than retold. The explainable no longer returns at the end to the question the reader was asked on page 2, and closes instead on two open items; closing that loop is the next structural change. And the explainable has not yet been watched in use by its audience; a moderated read-through with first-year undergraduates is the intended next step.

---

## 7 Conclusion

This paper showcases an explainable, designed for readers with a high-school mathematics background, that guides them through the machinery of inference-time scaling one step at a time. It takes the reader from System 1 against System 2 thinking, to a single chain of thought, to majority voting over many parallel chains, to searching a tree of thoughts, and finally to the point where these reasoning methods are trained into the weights to produce models like DeepSeek-R1 and o1. Every page has a control to move, every measured figure has a notebook that re-derives it, and the last page cannot contradict the ones before it.

---

## References

*Keys used in the text. To be formatted in ACM style at typesetting. arXiv identifiers from the literature review; venue given where known.*

- **[Brown 2024]** B. Brown et al. Large Language Monkeys: Scaling Inference Compute with Repeated Sampling. arXiv:2407.21787.
- **[Case 2014]** N. Case. Explorable Explanations. explorabl.es.
- **[Chen 2024]** L. Chen et al. Are More LLM Calls All You Need? Towards Scaling Laws of Compound Inference Systems. arXiv:2403.02419.
- **[Cho 2026]** A. Cho, G. C. Kim, A. Karpekov, A. Helbling, Z. J. Wang, S. Lee, B. Hoover, D. H. Chau. Transformer Explainer: Learning LLM Transformers with Interactive Visual Explanation and Experimentation. CHI 2026. doi:10.1145/3772318.3791725.
- **[Cobbe 2021]** K. Cobbe et al. Training Verifiers to Solve Math Word Problems. arXiv:2110.14168.
- **[DeepSeek-AI 2025]** DeepSeek-AI. DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning. Nature, 2025. arXiv:2501.12948.
- **[Gao 2025]** [Inverse scaling in test-time compute. arXiv:2507.14417. Verify author.]
- **[Kahneman 2011]** D. Kahneman. Thinking, Fast and Slow. Farrar, Straus and Giroux.
- **[Lee 2023]** S. Lee et al. Diffusion Explainer: Visual Explanation for Text-to-image Stable Diffusion. IEEE VIS 2023.
- **[Lightman 2023]** H. Lightman et al. Let's Verify Step by Step. ICLR 2024. arXiv:2305.20050.
- **[Mayer 2009]** R. E. Mayer. Multimedia Learning, 2nd ed. Cambridge University Press.
- **[Muennighoff 2025]** N. Muennighoff et al. s1: Simple Test-Time Scaling. arXiv:2501.19393.
- **[OpenAI 2024]** OpenAI. Learning to Reason with LLMs (o1 system card and blog).
- **[Raschka 2025]** S. Raschka. Build a Reasoning Model (From Scratch). Manning. [Verify edition and year.]
- **[Shojaee 2025]** P. Shojaee et al. The Illusion of Thinking. arXiv:2506.06941.
- **[Snell 2024]** C. Snell, J. Lee, K. Xu, A. Kumar. Scaling LLM Test-Time Compute Optimally Can Be More Effective than Scaling Model Parameters. ICLR 2025. arXiv:2408.03314.
- **[Sweller 1988]** J. Sweller. Cognitive Load During Problem Solving. Cognitive Science 12(2).
- **[Victor 2011]** B. Victor. Explorable Explanations. worrydream.com.
- **[Wang 2020]** Z. J. Wang et al. CNN Explainer: Learning Convolutional Neural Networks with Interactive Visualization. IEEE VIS 2020.
- **[Wang 2022]** X. Wang et al. Self-Consistency Improves Chain of Thought Reasoning in Language Models. ICLR 2023. arXiv:2203.11171.
- **[Wei 2022]** J. Wei et al. Chain-of-Thought Prompting Elicits Reasoning in Large Language Models. NeurIPS 2022. arXiv:2201.11903.
- **[Wu 2024]** Y. Wu et al. Inference Scaling Laws: An Empirical Analysis of Compute-Optimal Inference for Problem-Solving with LLMs. arXiv:2408.00724.
- **[Yao 2023]** S. Yao et al. Tree of Thoughts: Deliberate Problem Solving with Large Language Models. NeurIPS 2023. arXiv:2305.10601.
- **[Zelikman 2022]** E. Zelikman, Y. Wu, J. Mu, N. Goodman. STaR: Bootstrapping Reasoning with Reasoning. NeurIPS 2022. arXiv:2203.14465.
- **[our review]** S. Bangalore Lakshman, S. L. Eiers. Inference-Time Scaling for Large Language Models: A Systematic Literature Review. Unpublished, 2026. [Decide whether to cite or fold in.]
- **[page N]** Refers to the explainable's page N and the notebook it ships; manifests in the repository record run id, model, decoding, item-set hash and grader.

**Draft word count**, 2026-09-20: about 3,900 words of drafted prose, placeholders excluded, against the 5,900-word budget for eight body pages. Sections 3 and 5.5 are still to be written.
