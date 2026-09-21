# Plan: the 8+2 page arXiv paper on *The Story of Inference-Time Scaling*

Written 2026-09-20. **Fourth revision, 2026-09-20: restructured against the GAN Lab skeleton.**
Status: **plan, awaiting approval.** Nothing here is drafted prose.

**Scope.** A descriptive paper on the explainable, posted to arXiv only. No user study, no
venue, no reviewers. Eight body pages plus two of references, self-imposed. ACM look via
`\documentclass[sigconf,nonacm]{acmart}`. At about 770 words per two-column page with figures,
the body is about **5,900 words and five figures**.

---

## 0. Why the structure changed in this revision

The third revision followed *Transformer Explainer* (CHI 2026). That paper is a fine **density**
reference and a poor **structural** one: it is 21 pages and organized around two user studies
(145 participants, then 90). Following its shape builds a skeleton with a hole where our
evaluation is not.

The new skeleton follows **GAN Lab** (Kahng, Thorat, Chau, Viégas & Wattenberg, IEEE VAST 2018 /
TVCG 25(1), arXiv:1809.01587), with two moves borrowed from **Diffusion Explainer** v1
(arXiv:2305.03509). Why GAN Lab: it is the only paper in this lineage that is *simultaneously*
full-paper length and carries **no evaluation section**, which is our exact situation — and it
cleared IEEE VAST, the most evaluation-demanding venue of the family, on that basis. Its body is
~7,650 words over 10 sections with 44 references, close to an 8+2 budget.

**What substitutes for a user study in this genre**, all four parts of which we now adopt:

1. **A C→G traceability chain.** Challenges carry labels, goals carry labels, each goal cites the
   challenge it answers and forward-references the section implementing it, and the
   implementation sections cite back. This is the load-bearing rhetorical device of the genre:
   the reader audits a causal chain instead of a p-value.
2. **Usage scenarios** occupying the evaluation slot — two narrative personas, one novice and one
   advanced, **each named after what the reader discovers, not what they click**.
3. **"Informed Design through Iterations"** — design history as evidence. GAN Lab's is 336 words:
   how long it took, what the early design got wrong, what pilot readers said, with a before/after
   figure. Transformer Explainer kept this section even after acquiring two real studies.
4. **Deployment as evidence** — availability, open source, and an architectural scalability
   argument. Where reach numbers exist, this genre promotes them into the abstract.

From Diffusion Explainer: **goals derived from a literature review rather than a formative
study** ("By reviewing literature [36, 47], we established four design goals"), which is the
established low-cost way to earn labeled goals; and the evidence that the evaluation slot is
genuinely swappable — its v1→v3 diff changed only "§5 Usage Scenarios" to "§5 Human Evaluation",
leaving everything around it untouched.

One amendment to GAN Lab: **it has no Conclusion.** We add one. An arXiv preprint has no page
limit forcing the cut, and it costs ~150 words.

---

## 1. Section map

| § | Section | Words | % | Status |
|---|---|---|---|---|
| 0 | Abstract | 150 | — | drafted; revise last line per §2 |
| 1 | Introduction | 650 | 11 | **drafted**, trim 100 |
| 2 | Background: reasoning, chain of thought, and the levers | 550 | 9 | **drafted**, trim 300 |
| 3 | Related work | 500 | 8 | **ready to write** — sources in `paper/related_works_final_report.md` |
| 4 | Design challenges (C1–C5) | 450 | 8 | restructure: labels in, solutions out |
| 5 | Design goals (G1–G6) | 350 | 6 | **new** — derived from literature |
| 6 | The explainable: what the reader sees | 1,100 | 19 | expand from old §4 |
| 7 | The instrument: what the reader can check | 900 | 15 | expand from old §5.3–5.4 |
| 8 | Usage scenarios | 750 | 13 | **new** |
| 9 | Informed design through iterations | 250 | 4 | **new** |
| 10 | Limitations and future work | 300 | 5 | expand old §6 |
| 11 | Conclusion | 150 | 3 | **drafted** |
| | **Body total** | **5,950** | | |
| | References (2 pages) | — | | review (63), `CREDITS.md` (13), landscape search |

**The proportion correction this revision makes.** The third revision spent 1,700 words on
challenges-and-solutions and 900 on the artifact. The genre inverts that: GAN Lab spends 45% of
its body on what the artifact is and does (§6 + §7), 13% on challenges and goals together, and
16% on usage scenarios. Sections 6, 7 and 8 here total 2,750 words, 46% — the artifact, not the
problems we met, is the paper.

---

## 2. What each section does

### §0 Abstract — 150 words

Unchanged in content from revision three, with one addition. Four sentences: what
inference-time scaling is; what existing resources fail to show; what we built; the authors'
closing line about learners interacting with the machinery of reasoning in real time.

**Add, if the numbers exist by drafting time:** a reach figure. This genre treats deployment
reach as a first-class result and puts it in the abstract — Diffusion Explainer v3, "over 10,300
users from 124 countries"; Transformer Explainer, "over 490,000 users across more than 200
countries". If we have no numbers, say nothing; do not substitute a claim about potential.

### §1 Introduction — 650 words

Drafted. Keep the four movements (why it matters now; why it is hard to understand; why it is
worth understanding anyway; why learning tools for it are hard to make). Two changes:

- **Trim ~100 words.** The fourth movement currently previews all four barriers in prose; §4 now
  carries them as labeled challenges, so the introduction only needs to name that they exist.
- **End on an explicit contribution list**, as every paper in this lineage does. Four items: the
  explainable itself with a live control on every page; the single measured instrument; the
  notebook shipped with every measured page; the design lessons. Follow with the availability
  line — live URL and repository — which in this genre always closes the introduction.

### §2 Background — 550 words

Drafted, currently ~850. Trim to 550: the two speeds, then the levers as many scratchpads, then
Figure 2. The lever inventory can lose a sentence per lever now that §6 describes the pages that
teach them. No benchmark numbers here; they belong to §6 and §7.

### §3 Related work — 500 words

**Source: `paper/related_works_final_report.md`.** *(Note: the third revision's workflow expected
this at `literature_review/reasoning_explainers_landscape.md`. It is in `paper/`.)*

Three thematic run-in paragraphs, ending in a gap claim — Diffusion Explainer's shape, which is
the most economical in the family at 238–336 words:

- **Build-it-yourself books and courses.** Raschka's *Build a Reasoning Model (From Scratch)*
  first and at length. Stanford CS329A, the NeurIPS 2025 tutorial. These teach the training loop
  to a reader who can already run the code.
- **Interactive explainers of adjacent topics.** Transformer Explainer, CNN Explainer, Diffusion
  Explainer, GAN Lab, the PAIR explorables. These explain a model's internals; none covers how
  much computation to spend on a problem.
- **Static explanations of reasoning, and the tools that inspect it.** Weng, Grootendorst,
  Raschka's posts, the Hugging Face search-and-learn post; and the reasoning-trace systems
  (ReasonGraph, ReTrace, Landscape of Thoughts). The first group retells measurements made
  elsewhere; the second renders a trace that already exists.

**Gap claim, stated positively.** Not "nobody has done this" — the related-works report is
explicit that bare absence claims do not survive scrutiny. State what each family is *about*, and
name the axis none of them plots: accuracy as a function of compute spent, on one instrument,
re-derivable by the reader.

**Figure 3, the landscape table.** Columns: interactive · measured on one instrument ·
reproducible by download · audience assumed. Rows from the report's quick-glance table.

**Raschka is credited here as a source, not compared as a rival** — see §4 of this plan.

### §4 Design challenges — 450 words, labeled C1–C5

Short statements only. The *solutions* move to §6 and §7, where the genre puts them. Each
challenge gets two or three sentences and a label that §5 and §6–7 cite back to.

- **C1. The literature's numbers do not compare.** Each paper measures its lever on its own
  model, items and grader, so the levers cannot be put on one axis.
- **C2. No live model can run where the page is served.** Vercel has no GPU and holds a request
  to tens of seconds; one 2,048-token chain from a 3B model exceeds that on CPU, and page 7 needs
  sixteen per problem for a hundred problems.
- **C3. The reader's mathematics stops at algebra.** The literature's charts assume log axes,
  confidence intervals and pass@k as vocabulary.
- **C4. A technique we set out to teach did not replicate.** The extension half of budget forcing
  produced no gain on our instrument. We had to decide what to put on the page.
- **C5. A summary page can drift from the pages it summarizes.** Sixteen pages of measured
  numbers, and a wrap-up that restates them, is a consistency problem waiting to happen.

Sources as in revision three: `notebooks/page_06_thinking_longer.ipynb` §11,
`notebooks/RUNBOOK_page6_power.md`, `docs/page_6_refactor.md` §7, `SUBMISSION.md`,
`notebooks/handoff.md`, `web/docs/LIVE_INFERENCE.md`.

### §5 Design goals — 350 words, labeled G1–G6

**New section, and the structural keystone.** Open with the Diffusion Explainer move, stated
plainly because it is true of us:

> By reviewing the literature on explorable explanations, multimedia learning and reproducible
> research, we established six design goals.

Each goal: one bold sentence, then one or two sentences citing the challenge it answers and
forward-referencing the section that implements it.

- **G1. One live control per page, placed first.** The first act on any page is to move something
  and see a consequence. [Victor 2011; Case 2014] (C3 → §6)
- **G2. One spotlighted number, and nothing that does not serve it.** [Mayer 2009, signaling and
  coherence] (C3 → §6)
- **G3. The reader commits a prediction before the reveal.** Predict-Observe-Explain; the direct
  empirical warrant is that predicting-then-explaining improved data recall over passive viewing,
  and worked better in a chart than in text. [Kim, Reinecke & Hullman 2017; White & Gunstone 1992]
  (C3 → §6, pages 7, 13, 15)
- **G4. One colour grammar and one chart grammar across all sixteen pages.** The cost of reading a
  new chart falls with every page. [Sweller 1988] (C3 → §6)
- **G5. Every measured claim on one instrument.** One model, one item set, one decoding
  configuration, one grader. (C1 → §7)
- **G6. Every measured figure re-derivable by the reader without a GPU.** (C2 → §7)

**Optional Table 1: the C→G→section map.** One small table, five challenge rows against six goal
columns, with the implementing section in each cell. Cheap, and it is the genre's signature
device made legible at a glance. Recommended if space allows after the cut pass.

**On G3's citation.** The related-works report's §10 found that the broad claim "interactive
explorables teach better than static prose" does not survive the best-powered direct test of it
(Zhao et al. 2025, 605 participants, preregistered, no significant difference against the same
content as a static PDF). **Do not argue the medium anywhere in this paper.** Argue the
mechanisms — prediction elicitation and retrieval practice — which have solid direct support. A
reviewer who knows that literature will respect the distinction and punish its absence.

### §6 The explainable: what the reader sees — 1,100 words

GAN Lab splits its artifact block in two, §6 for what you see and §7 for what you do, which is
the right move when interaction is the contribution. Ours splits differently and for the same
reason: **§6 is the reading experience, §7 is the checking experience.**

- **The three acts**, one paragraph each with page ranges, from revision three's §4.
- **The anatomy of a page** — control first, one spotlighted number, provenance line, notebook
  download, closing transition. Cite G1 and G2 here.
- **The chart grammar**, absorbing revision three's §5.2: intuition over restated values (shaded
  ownership bands, bold only on the winning curve, arrows for movement); the log axis earned by
  toggling it on a curve the reader already knows (page 12); one grammar throughout. Cite G4.
- **Predict before reveal**, with the page-7 example: a reader who has predicted that voting
  always helps, then watches identical chains vote to no effect, remembers why diversity matters.
  Cite G3.
- **The wrap-up that cannot drift** — page 16 loads no data file of its own and refuses to build
  its ladder if two runs disagree about how many problems they measured. Cite G5, answers C5.

Figure 1 (teaser: three-act map above, one page's anatomy below) lives here.

### §7 The instrument: what the reader can check — 900 words

Absorbs revision three's §5.3 and §5.4, reframed from "challenges we met" to "what the artifact
guarantees".

- **One instrument.** Qwen2.5-Instruct at 1.5B, 3B and 7B; the 3B as the pages' instrument on 100
  MATH-500 level-4 and level-5 problems, pinned by an item-set hash every manifest records; the
  1.5B and 7B where a claim needs a second checkpoint. The four ablation notebooks that chose it.
  Cite G5, answers C1.
- **What one instrument buys**, kept from revision three because it is the paper's best evidence:
  suppressing the chain costs the 3B 36 points, 40 fixed against 4 broken; a 1.5B allowed to
  reason beats a 7B forbidden to, 22% to 11; sixteen chains voted reach 56% where one greedy
  chain reaches 43, with the right answer in the pile for 78 of 100; a trained PRM picking
  best-of-16 reaches 60% where the model judging itself reaches 51, below the vote it was meant
  to improve on; filtering by step soundness moves the vote one point.
- **The notebook-first pipeline** and the three run modes — REPLAY, QUICK, FULL — with the point
  that REPLAY needs no GPU and takes about two minutes. Cite G6, answers C2.
- **Provenance discipline.** Three kinds of number, named on the page that draws it: transcribed
  or digitized from a cited source, measured by us, authored for teaching. The manifest chain and
  the tests that assert it.
- **Credit where the instrument came from.** The grading functions are Raschka's ch03, used
  unchanged, and the notebook-first methodology derives from that book. State it here in one
  sentence. It strengthens the provenance argument rather than weakening it: the grading standard
  is demonstrably not ours to bend.
- **Implementation and deployment** in one short paragraph, ending the section as this genre
  always does: web-based, open source, no runtime network calls, no API keys, no per-user cost,
  works offline. Cite G6.

Figure 4 (the instrument pipeline, specification to notebook to derived file to page to download,
hash checks drawn as gates) lives here.

### §8 Usage scenarios — 750 words

**New.** Two narrative walkthroughs, each named after what the reader *discovers*. One novice,
one advanced, per GAN Lab §8 and Diffusion Explainer v1 §5.

- **8.1 A newcomer discovers that more attempts help only when the attempts differ.** First-year
  undergraduate, no ML background. Feels their own two speeds on page 1, watches the chain removed
  on page 5, caps it on page 6 and sees accuracy climb then flatten, then on page 7 predicts that
  voting always helps — and watches sixteen identical chains vote to no effect. Follows to page 8
  and finds the answer was in the pile for 78 of 100 problems all along, and that the judge is the
  bottleneck. Ends with what they can now say that they could not before.
- **8.2 A sceptical reader re-derives a page's headline number on a laptop.** A reader who does
  not believe best-of-16 takes 43% to 60%. Downloads page 8's bundle, runs the notebook in REPLAY
  with no GPU, re-derives the figure in about two minutes, checks the manifest's run id and
  item-set hash against the page, and finds the notebook in the download is the notebook the
  manifest names. Then goes further: changes the judge and watches the number move.

Figure 5 (page 15's specimen flip beside page 16's ladder) sits here, in 8.1.

### §9 Informed design through iterations — 250 words

**New.** GAN Lab's §9 is the model: design history as evidence, anchored to a before/after.
Open by naming the span of development, then two or three lessons.

Candidates, all from the repository's own review history:

- **Twenty-one pages cut to sixteen**, in two passes (2026-07-30, then 2026-08-10), and what the
  cuts cost — the deck no longer teaches how to read a benchmark score, and no longer returns at
  the end to the question asked on page 2. Stating the cost is the point.
- **Page 11's central chart was half-width and unreadable**, found in review, now full-width. This
  is the cleanest before/after and the best candidate for the figure if one is added.
- **The closed recipe drawn in the open recipe's grammar, and cut** — o1 rendered in R1's visual
  language implied a parity the sources do not support.
- **Authored figures retired in favour of measured ones** on page 15, once its own run existed.

### §10 Limitations and future work — 300 words

Revision three's §6, expanded slightly and split into two movements.

**Limitations.** One model family, so the closing ladder's ordering is a fact about
Qwen2.5-Instruct. Accuracy across Acts 2 and 3 is discounted by benchmark contamination, and the
deck says so on pages 15 and 16. No user study; the design goals are derived from literature, not
from formative work with the target audience. Five pages cut.

**Future work.** A second instrument family on the same items. Live inference on by default when
a model small enough exists. The cut pages restored when measurable rather than retold. Closing
the page-2 loop. A moderated read-through with first-year undergraduates — which, given §5's note
on the evidence, should be framed as measuring *these* mechanisms rather than interactivity in
general.

### §11 Conclusion — 150 words

Drafted. Keep as written, tightened.

---

## 3. Facts in the briefs to pin against the repository before drafting

Unchanged from revision three. These need settling before prose.

| Brief says | Repository records | Action |
|---|---|---|
| "Math-400" | Every notebook and manifest names MATH-500, with level-3, level-4-and-5, and level-5 subsets at *n* = 100 | Write MATH-500 and name the subset used |
| "little-to-no difference" from "wait" on both benchmarks | Page 6 §11 measured it on MATH-500 level 4 and 5; the published run showed −2.0 points for the 1.5B, +2.8 on the items that received all three injections, and the POWER runbook re-ran the arm on the whole pool because *n* = 100 could not support the claim | Quote the POWER run's final numbers, not the *n* = 100 ones; check whether GSM8K was in that arm at all |
| "Qwen2.5:1.5B reasoning trumps Qwen2.5:7B with blurting, every time" | Experiment 4 tests Math-1.5B against 7B-Instruct both suppressed and reasoning, and its own notes call the reasoning comparison "the honest number"; page 5's live claim is that suppressing reasoning costs 40 to 70 points | Take the figure from experiment 4's `tables.md` and state which comparison it is; "every time" must be a count from the table |
| "quick/full run settings" | Every notebook defines REPLAY, QUICK and FULL; page 6 alone adds POWER for its Wait arm, and page 14 names its small mode SMOKE | Write REPLAY, QUICK, FULL |
| Model set 1.5B, 3B, 7B | Also Qwen2-1.5B and the math-tuned variants in the ablations | Say which models the pages use and which the ablations use |

**Added this revision:**

| Item | Action |
|---|---|
| Raschka book citation | Verify edition and year — the related-works report has it as Manning, June 2026, 440pp, ISBN 9781633434677 |
| `web/CREDITS.md` omits Raschka | Fix before the paper asserts provenance discipline; his ch03 grader runs in the pipeline |
| Reach numbers for the abstract | Decide whether any exist by drafting time; if not, say nothing |
| GAN Lab, Diffusion Explainer, CNN Explainer citations | Add to `references.bib` — now cited in §3 as well as being the structural models |

---

## 4. Figures (five, unchanged in content; two move sections)

| Fig | Content | Section |
|---|---|---|
| 1 | Teaser: three-act map, one page's anatomy | §6 |
| 2 | The reasoning block diagram: reflex, one chain, many chains, vote, judge, search, trained-in | §2 |
| 3 | Landscape table | §3 |
| 4 | Instrument pipeline with hash checks as gates | §7 |
| 5 | Page 15 specimen flip beside page 16 ladder | §8.1 |

Optional Table 1: the C→G→section map, in §5.
Optional sixth figure: page 11's half-width/full-width before-and-after, in §9.

Capture rules unchanged: `npm run build` then `next start`, never while `next dev` runs;
Playwright from `web/` at 2x; PDF or PNG in the source tree; no em dashes in captions or prose.

---

## 5. Workflow

1. **Scaffold** `paper/` with acmart, `latexmk`, a `texcount` per-section budget script, and
   `references.bib` seeded from the literature review, `CREDITS.md`, and the landscape report.
   Must build on a clean TeX Live with no shell-escape.
2. **Pin the facts** in §3 of this plan against the notebooks and exported tables.
3. ~~Landscape search~~ **done** — `paper/related_works_final_report.md`.
4. **Skeleton**: every section as bullets naming their source files. Approve before prose.
5. **Fix the C→G chain first.** Write §4 and §5 before anything else; the rest of the paper cites
   them, and they are the substitute for an evaluation. If the chain does not hold together, the
   paper does not either.
6. **Figures first**; the five captions should summarise the paper on their own.
7. **Draft order**: §4, §5, §7, §6, §8, §2, §1, §3, §9, §10, §11, abstract last. One section per
   session, each closing with its word count against its ceiling.
8. **Cut pass** to 5,900 words, then **fact pass** against `PROVENANCE.md` and the manifests.
9. **arXiv checklist**: cs.HC primary with cs.LG or cs.AI cross-list; endorsement checked early;
   licence; live URL and repository in the comments field; VISxAI 2026 acceptance as a title-page
   footnote; a short note on how models were used.
