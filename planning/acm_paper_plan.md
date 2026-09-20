# Plan: the 8+2 page arXiv paper on *The Story of Inference-Time Scaling*

Written 2026-09-20; third revision the same day, now carrying the authors' section briefs.
Status: **plan, awaiting approval.** Nothing here is drafted prose.

**Scope.** A descriptive paper on the explainable, posted to arXiv only. No user study, no
venue, no reviewers. Eight body pages plus two of references, self-imposed. ACM look via
`\documentclass[sigconf,nonacm]{acmart}`. At the reference paper's density (Wang et al.,
*Transformer Explainer*, CHI 2026: about 770 words per two-column page with figures) the body
is about **5,900 words and five figures**.

---

## 1. Section map

| § | Section | Pages | Words | Brief status |
|---|---|---|---|---|
| 0 | Abstract | 0.2 | 150 | set by authors |
| 1 | Introduction | 1 | 750 | set by authors |
| 2 | Background | 1.2 | 850 | set by authors, plus one block diagram |
| 3 | The landscape at the time of writing | 1 | 750 | pending: authors running deep research on related work |
| 4 | The explainable in brief | 1.2 | 900 | pending |
| 5 | Design challenges and how we solved them | 2.3 | 1,700 | set by authors: four challenges now, one or two more later |
| 6 | Future work | 0.5 | 350 | pending |
| 7 | Conclusion | 0.3 | 200 | set by authors |
| | References | 2 | | literature review (63), `CREDITS.md` anchors (13), landscape search |

Audience no longer has its own section; the authors' briefs put it in the abstract, the
introduction and the conclusion, and it is stated once in full in §4.

---

## 2. What each section focuses on

### §0 Abstract

Four sentences, in this order.

1. Inference-time scaling at a glance: spend more compute at answer time, on longer chains,
   more chains, or a search over chains, and accuracy on hard problems rises.
2. What existing resources fail to show: static pages retell curves measured on other
   people's models; build-from-scratch books teach the training loop, not the levers; short
   interactives cover one lever and cannot be checked.
3. What we built to bridge them: a sixteen-page interactive explainable with a live
   visualization on every page, every measured figure reproducible from the notebook shipped
   beside it.
4. The closing line, as the authors wrote it: *This story enables learners to interact with the
   machinery of reasoning in real time, with the opportunity to dive deeper into how it works
   with reproducible notebooks centred on the Qwen2.5-Instruct series.*

Ceiling 150 words. No numbers.

### §1 Introduction

Four movements, one paragraph each, then contributions.

1. **Why inference-time scaling matters now.** It has made smaller models competitive with
   larger non-reasoning models, and once the behaviour is trained into the weights it lifts
   capability again, producing the current generation of reasoning models (name only models
   the deck already cites: o1, o3, DeepSeek-R1 and its distillations).
2. **Why it is hard to understand.** There is no single mechanism: some systems search
   (Monte Carlo tree search over steps), some sample many chains and let a judge or verifier
   pick, some vote, some use plain chain of thought, and the frontier models train the
   behaviour in. Each is "inference-time scaling", so a learner meets five different things
   under one name.
3. **Why it is worth understanding anyway.** Spending compute on reasoning produces large
   gains precisely on the hard, multi-step problems where a reflex answer fails. This is the
   sentence that motivates the whole deck.
4. **Why learning tools for reasoning are hard to make, and what we did.** Barriers: the
   literature's numbers do not compare across models and benchmarks; a live model cannot run
   where a web page is served; visualizations for a high-school-mathematics reader must be
   readable without axes-as-jargon; and some folk remedies (append "wait") do not survive a
   measurement. Then the gap we fill and the contributions, as a short paragraph rather than
   a numbered list: the explainable, its measured instrument, its reproducible notebooks, and
   the design lessons in §5.

### §2 Background

Written in the deck's own vocabulary for the deck's own reader.

- **System 1 against System 2.** Blurting the answer works for one-digit addition and fails
  for long division of two- or three-digit numbers, where a scratchpad and steps become a
  requirement. A model answering on reflex is System 1; a chain of thought is the scratchpad.
- **Inference-time scaling is many scratchpads.** Not one scratchpad but several: run many,
  take the most popular answer (voting); or score each against a criterion and take the best
  (best-of-N with a judge or verifier); or grade every step rather than the final answer
  (process supervision); or branch, prune and backtrack across partial scratchpads (search).
  Then the last step: train the scratchpad habit into the weights so the model does it
  unprompted (STaR, RL as in R1 and o1).
- **The block diagram.** Seven or eight blocks closing the section: question, reflex answer,
  one chain of thought, many chains, vote, judge, search, trained-in. Drawn in the deck's
  colour grammar so the paper's figure and the deck's pages read as one system. This is
  Figure 2.

No benchmark numbers, no model leaderboards, at most one verbatim quote per source.

### §3 The landscape at the time of writing

Pending the authors' deep-research pass. Placeholder structure so the search has somewhere
to land: books and courses (Raschka's *Build a Reasoning Model (From Scratch)* first),
interactive explainers of adjacent topics, static explanations of reasoning, primary papers
with demos. One comparison table (Figure 3) on the axes: interactive or not, measured or
retold, reproducible or not, audience assumed. Closing sentence positions the explainable as
the only entry that is all three.

### §4 The explainable in brief

Pending. Expected content: the three acts in three paragraphs with their page ranges; the
anatomy of one page (control, spotlighted number, provenance line, notebook download,
transition); the wrap-up ladder and concept check; implementation in one paragraph. Figure 1
(teaser) lives here.

### §5 Design challenges and how we solved them

The heart of the paper. Each challenge: bold title, the problem as it was met, the solution
or the lesson. The authors have set four; one or two more will be chosen later.

**C1. Appending "wait" does not make a model think longer.** The extension half of budget
forcing (drop the end-of-turn token, append `Wait`, continue, repeat *k* times) produced
little or no accuracy change on the deck's instrument. Not overcome, but learned from. The
authors' hypothesis: appending "wait" does not tell the model how to reason further. The
paper should also state what the notebook itself records as the structural reason, because
it is the deck's own finding: these instruct checkpoints have no thinking block, so the
injection lands after a finished answer rather than inside a deliberation, which is not the
setting s1 measured. Sources: `notebooks/page_06_thinking_longer.ipynb` §11,
`notebooks/RUNBOOK_page6_power.md`, `docs/page_6_refactor.md` §7.

**C2. Visualizations for a high-school reader.** How to make interactive charts that are
readable and intuitive for a reader with high-school mathematics and statistics. Solutions
the deck settled on, each with the page that shows it: one live control per page placed
first; one spotlighted number; charts that build intuition rather than restate values
(shaded ownership bands, bold only where a curve wins, arrows for movement); predict before
reveal so the reader commits a guess; a single colour and chart grammar across all sixteen
pages; the log axis introduced by toggling it on a curve the reader has already seen become
straight (page 12). Sources: `SUBMISSION.md` rationale table, `docs/page_7_refactor.md`,
`docs/page_11_refactor_spec.md`, `docs/page_13_abstraction_polish.md`.

**C3. The literature would not unify.** Consolidating the published results was not enough:
too many models, too many benchmarks, too many ways of spending compute. A three-dimensional
problem with too much data to put on one axis. Solution: one local model set, Qwen2.5-Instruct
at 1.5B, 3B and 7B, against two common benchmarks, GSM8K and MATH-500, so that every lever is
measured on the same items with the same grader and the deck can show, among other things, a
small model reasoning beating a large model blurting. Sources: `notebooks/handoff.md`,
`notebooks/experiment_1_which_checkpoints_blurt.ipynb` through `experiment_4`, the page
manifests in `web/data/page-0*-derived.json`.

**C4. No live model where the page is served.** Vercel has no GPU and strict time limits, so
the reasoning the deck wants to show could not run in the page. Solution: a notebook-first
pipeline anyone can run on local hardware, with three modes in every notebook: REPLAY (no
GPU, re-derives the figures from the committed logs in minutes), QUICK (twenty items on an
8 GB GPU), and FULL (the published run). Without REPLAY a multi-model ablation is an overnight
run for the reader. Sources: `notebooks/README.md`,
`notebooks/RUNBOOK_page6_power.md`, `web/docs/LIVE_INFERENCE.md`.

**Candidates for the fifth and sixth**, from the repository's review history, for the authors
to pick from later: the wrap-up that cannot drift from its pages (page 16 reads its numbers
from the modules that measured them); the closed-recipe problem (o1's recipe drawn in the
same grammar as R1's open one, and cut); the scope cut from twenty-one pages to sixteen.

Figure 4 (the instrument pipeline, notebook to derived file to page to download) and Figure 5
(page 15's specimen flip beside page 16's ladder) sit in this section.

### §6 Future work

Pending. Likely entries from the repository: live inference on by default when a model
small enough exists; a second instrument family; the cut pages restored when measurable;
closing the page-2 loop at the end.

### §7 Conclusion

As the authors wrote it, tightened at drafting: the paper showcases an explainable for
readers with a high-school mathematics background that walks the machinery of inference-time
scaling one step at a time, from System 1 against System 2, to a single chain of thought, to
majority voting over many parallel chains, to tree-of-thought search, and finally to the
reasoning being trained into the weights to make models like DeepSeek-R1 and o1.

---

## 3. Facts in the briefs to pin against the repository before drafting

The paper's numbers get checked against the deck's provenance, so these need settling first.

| Brief says | Repository records | Action |
|---|---|---|
| "Math-400" | Every notebook and manifest names MATH-500, with level-3, level-4-and-5, and level-5 subsets at *n* = 100 | Write MATH-500 and name the subset used |
| "little-to-no difference" from "wait" on both benchmarks | Page 6 §11 measured it on MATH-500 level 4 and 5; the published run showed −2.0 points for the 1.5B, +2.8 on the items that received all three injections, and the POWER runbook re-ran the arm on the whole pool because *n* = 100 could not support the claim | Quote the POWER run's final numbers, not the *n* = 100 ones; check whether GSM8K was in that arm at all |
| "Qwen2.5:1.5B reasoning trumps Qwen2.5:7B with blurting, every time" | Experiment 4 tests Math-1.5B against 7B-Instruct both suppressed and reasoning, and its own notes call the reasoning comparison "the honest number"; page 5's live claim is that suppressing reasoning costs 40 to 70 points | Take the figure from experiment 4's `tables.md` and state which comparison it is; "every time" must be a count from the table |
| "quick/full run settings" | Every notebook defines REPLAY, QUICK and FULL; page 6 alone adds POWER for its Wait arm over the whole pool, and page 14 names its small mode SMOKE | Write REPLAY, QUICK, FULL |
| Model set 1.5B, 3B, 7B | Also Qwen2-1.5B and the math-tuned variants in the ablations; the deck's pages use 3B as the instrument and the 1.5B family on page 15 | Say which models the pages use and which the ablations use |

---

## 4. Figures (five)

| Fig | Content | Section |
|---|---|---|
| 1 | Teaser: three-act map, one page's anatomy | §4 |
| 2 | The reasoning block diagram: reflex, one chain, many chains, vote, judge, search, trained-in | §2 |
| 3 | Landscape table | §3 |
| 4 | Instrument pipeline with hash checks as gates | §5 |
| 5 | Page 15 specimen flip beside page 16 ladder | §5 |

Capture rules: `npm run build` then `next start`, never while `next dev` runs; Playwright from
`web/` at 2x; PDF or PNG in the source tree; no em dashes in captions or prose.

---

## 5. Workflow

1. **Scaffold** `paper/` with acmart, `latexmk`, a `texcount` per-section budget script, and
   `references.bib` seeded from the literature review and `CREDITS.md`. Must build on a clean
   TeX Live with no shell-escape.
2. **Pin the facts** in §3 of this plan against the notebooks and exported tables.
3. **Landscape search** lands from the authors' deep-research pass into
   `literature_review/reasoning_explainers_landscape.md`.
4. **Skeleton**: every section as bullets naming their source files. Approve before prose.
5. **Figures first**; the five captions should summarise the paper on their own.
6. **Draft order**: §5, §2, §4, §1, §3, §6, §7, abstract last. One section per session, each
   closing with its word count against its ceiling.
7. **Cut pass** to 5,900 words, then **fact pass** against `PROVENANCE.md` and the manifests.
8. **arXiv checklist**: cs.HC primary with cs.LG or cs.AI cross-list; endorsement checked
   early; licence; live URL and repository in the comments field; VISxAI 2026 acceptance as a
   title-page footnote; a short note on how models were used.
