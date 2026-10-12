# Notebooks

The empirical backing for the deck's data-bearing pages.

Every page whose figures rest on reasoning traces or measurement follows the notebook-first
pipeline in [`docs/page_6_refactor.md` §6](../docs/page_6_refactor.md), which is canonical:

| # | Step | Done when |
|---|---|---|
| 1 | Spec implemented as a notebook | the sweep runs end to end and writes logs |
| 2 | Notebook refined: hardware-agnostic, beginner-readable | it runs on a laptop CPU and on a 16 GB GPU without edits |
| 3 | Notebook approved | human + AI sign off on correctness and readability |
| 4 | Notebook translated to JS | the page renders from committed logs |
| 5 | Post-translation edits: formatting, balance | the page matches the spec's sections 2 and 4 |

**The notebook is not scaffolding.** It is the artifact that makes a page's claims checkable: a
reader who doubts a figure downloads the notebook and [`harness.py`](harness.py) beside it and
re-runs it. Notebooks are linked from the pages they back, and the download carries both files.

## The harness, and what stays in the notebook

[`harness.py`](harness.py) holds the plumbing every page repeats: model loading, token-string
reconstruction, the resume log, provenance hashes, small numerics. The split is
**claim-bearing versus plumbing**, and the test is *would a skeptical reader need to see this to
believe the figure?*

Staying in the notebook, always: prompt construction, item selection, the thinking constraint,
step segmentation, thresholds and gates, and every line of figure code. `harness.generate` gives
`enable_thinking` no default for exactly this reason — each notebook states that constraint at its
own call site, where a reader looks for it.

This is not a way to hide derivations; it is a way to stop them diverging. `incremental_token_strings`
previously existed in two copies: one had a fix the other lacked, and the other had a bug the first
did not, and the failure mode was silent corruption of the text that then gets graded. The harness
tests its own invariants (`harness.selftest`, called from each notebook after the tokenizer loads),
and every run records `harness.fingerprint()` in its manifest, so an artifact names the exact
plumbing that produced it.

## The boundary

The notebook writes logs; the page reads them. **No inference runs at demonstration time** — the
`NEXT_PUBLIC_LIVE_INFERENCE` / `LiveDemo` path is not used by these pages.

Two tiers of artifact, applied uniformly so page 7's much larger sweep does not force a retrofit:

- **bundled with the page** — `derived.json` (the aggregates actually plotted), `manifest.json`,
  and the specific traces a figure displays;
- **published as a download** — the complete `traces.jsonl`, linked beside the notebook.

The page ships what it draws and links what it drew it from.

**Pages 6 and 7 keep the website out of the notebook.** Their notebooks stop at `results.json`,
every number they compute, and a `manifest.json` written by `harness.write_manifest`.
`page_06_site_data.py` and `page_07_site_data.py` build `derived.json` from those: which chains to
embed, the examples the page shows, and the layout `web/src/lib/page0N.ts` reads. They compute
nothing the notebook did not, and `derived.json` records the sha256 of the results and of the
script it was built from. The other pages still write `derived.json` from the notebook.

## Contents

**The page notebooks.** Pages 5 to 7 share the three run modes below; page 8's modes are the
phases of its own experiment and are documented in its section 0.

| File | Page | Status |
|---|---|---|
| `harness.py` | shared | plumbing for every notebook; ships in each download |
| `page_05_how_to_reason.ipynb` | 5 — How to Reason | **translated (step 4).** Run complete and replayable; `derived.json` is committed to `web/data/page-05-derived.json`, and the notebook, `harness.py` and all 900 traces ship as `web/public/notebooks/page-05-how-to-reason.zip`, linked from the page |
| `page_06_thinking_longer.ipynb` | 6 — Thinking Longer | **translated (step 4), both arms run.** The cap sweep and the extension arm are complete: 2,720 records, three checkpoints, committed to `web/data/page-06-derived.json` and drawn on the page. Injecting `Wait` when the model tries to stop redistributes rather than adds, so `figure_wait` reports paired fixed and broken counts and churn rather than a net |
| `page_07_frequency_voting.ipynb` | 7 — Frequency Voting | **run complete (step 1 done).** 5,920 unique generations over 100 MATH-500 L4/5 items: one pile of 16 full-length chains at T=0.3, a greedy line, a diversity family at T=0.6/0.9/1.2 on 30 items, and a fixed budget split N ways. Voting beats bare CoT by 12 points (55% against 43%, McNemar p=0.0075); coverage is 78%, so the vote discards a correct answer on 23% of items. That pile is page 8's phase 0 bed |
| `page_08_best_of_n.ipynb` | 8 — Best-of-N and Verifiers | **translated (step 4).** Its own pool: 12,800 chains over the same 100 items at four temperatures, scored by five judges (64,000 judgements). Best-of-16 by a trained verifier takes 43% to 60%, 21 fixed against 4 broken, McNemar p=0.0009; against page 7's vote on identical candidates it is +4 at p=0.45, which is not a difference. `derived.json` is committed to `web/data/page-08-derived.json`, and the notebook, `harness.py`, all 12,800 traces and 70,960 scores ship as `web/public/notebooks/page-08-best-of-n.zip`. Its modes are the phases of one experiment rather than tiers of one run: `REPLAY` analyses, `SCORE` judges an existing pool, `GENERATE` makes one |
| `page_09_outcome_vs_process.ipynb` | 9 — Outcome vs Process Supervision | **translated (step 4).** `FULL` run complete and replayable. Reuses page 7's pile under one filter, chains the model ended itself, and grades all 1,580 of them twice: a deterministic arithmetic checker, and `Qwen2.5-Math-PRM-7B` admitted only after clearing a pre-registered gate against it (AUC 0.89). The checker proves a false step in 0.67% of chains that reached the right answer; the PRM calls one unsound in 19.5%. `derived.json` is committed to `web/data/page-09-derived.json`, and the notebook, `harness.py` and all 1,580 graded chains ship as `web/public/notebooks/page-09-outcome-vs-process.zip` |
| `page_11_training_vs_scale.ipynb` | 11 — The Keystone | **arm 0 complete (step 1, REPLAY run).** Generates nothing: re-derives the accuracy-against-measured-FLOPs family chart from pages 6/7/8's runs, and gate 1 reproduces every shipped number it re-aggregates bit-exactly (max drift 0.0 across page 6's 15 cells, page 7's hand-off and 10 pile points, page 8's paired rung). The picture is the spec's B1+B2: the 3B never reaches the 7B's greedy 60% for less — vote@16 is 55% at 6.1× the bill, the trained verifier ties at 9.2× — while coverage is 78%. Gate 2 (Math-1.5B smoke test) and arms A/B (the L1–3 band, the specialist) are implemented and await a GPU; branches are pre-registered in `docs/page_11_refactor_spec.md` §6 |
| `page_17_when_reasoning_breaks.ipynb` | 15 — When Reasoning Breaks (page 17 until the 2026-08-10 cut; the notebook and its `derived.json` keep the old number, which names the run and not the route) | **translated (step 4), `REPLAY` only.** Generates nothing and needs no GPU: it re-reads pages 5 to 9's published artifacts and emits `web/data/page-17-derived.json` in about a minute. Gate A checks the five runs are one population (and records that page 8 shares the problems but not the chains); gate B reproduces page 6's fifteen accuracy cells bit-exactly. It ships no zip of its own because it re-derives from the other pages' bundles. Four of its `claims` come back **false** on purpose: the three controls that stop the specimen being oversold, plus the easy-breaks-sooner claim the page's deleted authored figure used to make |
| `page_14_distill_dividend.ipynb` | 14 — DeepSeek-R1 | **authored, not yet run (step 1 awaits a GPU).** Puts `DeepSeek-R1-Distill-Qwen-1.5B` and `-7B` on pages 6 and 7's own hundred L4/5 items against `Qwen2.5-1.5B-Instruct` and `-7B-Instruct` under best-of-16: the distill at one chain with nothing selecting between chains, the instructs read as majority vote and as coverage, all of it plotted against tokens spent. Four modes rather than three — `PLAN` (the default: no GPU, no network), `SMOKE`, `FULL`, `REPLAY` — because there is nothing published to replay yet. Gates, thresholds and both branches of the page's payoff sentence are declared before the run, and the truncation gate blocks: the distills write long chains, and a capped arm would measure our budget rather than the model. The finding this answers is F33 in `docs/review/pages_1_through_14_analysis.md` |

**Page 6 carries two arms of one technique.** Budget forcing can cut a chain short or refuse to let
it end; the sweep does the first and section 12 does the second. They share the prompt, the items,
the decoding and the grader, and `k` = 0 of the second reproduced all 94 untruncated traces of
the first, so the two are one experiment. The second arm is the ablation s1 leaves
implicit: that paper's model is this family *after* reasoning fine-tuning, and ours is the family
without it.

Page 7 reads page 6's `out/page_06/` when it is on disk, to price its run and to confirm it drew
the same problems. Page 8 used page 7's `traces.jsonl` as the pool for its **phase 0 pilot**, which is
what made that pilot free, and then generated its own; it now depends on page 7 only for the
cross-check that both pages report the same vote on the same candidates. Each degrades to a
printed skip rather than an exception when the run above it is missing.

**Page 8's T=0.3 chains came back 98.8% byte-identical to page 7's** from the seed alone, the
residual being GPU non-determinism. That is the strongest reproducibility statement the deck
can make, and it is free: the two notebooks share a seed rule and a sampler, so agreeing was
the only thing they could do.

**Page 9 reuses page 7's pile, but its download does not need it.** It grades one configuration of
that pile, the chains where the cap never bound, and the `traces.jsonl` it ships beside its
notebook *is* that filtered pile. `REPLAY` falls back to it when `out/page_07/` is absent and
recomputes every step label from the trace text rather than reading the stored ones, so a reader
re-derives the page from one download instead of two. It accepts the file in `out/page_09/` or
flat beside the notebook, which is how the zip unpacks.

**Page 9's download is self-contained, and deliberately so.** It reuses page 7's pile, but the
`traces.jsonl` it ships beside its notebook *is* that pile after page 9's filter, so `REPLAY` falls
back to it when `out/page_07/` is absent and recomputes every label from the trace text rather than
reading the stored ones. It accepts that file either in `out/page_09/` or flat beside the notebook,
which is how the zip unpacks. A reader who downloads it can re-derive the page without first
downloading page 7.

Page 6's run is now the one on disk, so page 7's dependency on it is satisfied.

**The ablations** that chose page 5's instrument. One-off studies, not page artifacts, and they
do not carry run modes — they sweep a roster once and write paste-ready tables.

| File | What it settled |
|---|---|
| `experiment_1_which_checkpoints_blurt.ipynb` | 9 checkpoints, n=20: nothing blurts unprompted, all of them do when instructed |
| `experiment_2_suppression_cost_and_specialisation.ipynb` | matched general/math pairs: math-tuned models refuse the blurt instruction outright |
| `experiment_3_prompt_ladder_at_n100.ipynb` | 2,800 generations at a sample that resolves ~8 points; page 5's numbers come from here |
| `experiment_4_reasoning_baked_into_weights.ipynb` | the reasoning-model arm |

## Running one

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
jupyter lab
```

Each page notebook has a `RUN_MODE` variable at the top with **three tiers**. Reproducing the
*figures* and reproducing the *run* are separate choices, and the cheap one is the default.
(Page 8 is the exception: its three modes are `REPLAY`, `SCORE` and `GENERATE`, because its
expensive step is scoring candidates rather than making them. Page 14 is the other: it adds
`PLAN`, which generates nothing and touches neither the network nor the GPU, and defaults to it
because it has not been run yet and so has nothing to replay.)

| Mode | What it does | Hardware | Time |
|---|---|---|---|
| **`REPLAY`** | draws every figure from the published generations | **none** | ~1 min |
| `QUICK` | one 3B checkpoint on a reduced grid, on your own hardware | ~6 GB GPU | tens of minutes |
| `FULL` | the grid the page ships, three checkpoints | 16 GB+ GPU | hours |

**`REPLAY` is the default in the download, and the copy here is left at the mode that generated
the shipped run.** The manifest records the notebook's sha256, so "this file made these numbers"
is checkable rather than asserted, and flipping `RUN_MODE` in place would break it. The packaged
copy is that file with one string changed, which is what a reader who wants the figures and not
the afternoon should open.

- **`REPLAY`** loads no model and downloads no weights. It is not a shortcut past the evidence: it
  adopts the published run's `RUN_ID`, asserts the traces cover the item set the notebook draws,
  and then runs every gate, assertion and figure the generating run did — including, where a
  page carries one, the independent verification that recomputes the headline numbers from the
  trace file. What it
  cannot tell you is whether *your* hardware reproduces ours.
- **`QUICK`** is a genuine preview rather than a different experiment: the same checkpoint is
  primary in `QUICK` and `FULL`, on half the items. It wants a GPU. A 2026 instruction-tuned model
  writes hundreds of tokens on a hard problem whatever you ask of it, so the small caps that once
  made this a laptop-CPU job were measuring truncation rather than reasoning.
- **`FULL`** prints a warning before it starts and is the only mode that needs the whole roster.

`REPLAY` needs the published `traces.jsonl`. Set `TRACES_URL` in the knobs cell, or put the file
in `out/<page>/`. **`out/` is gitignored**, so a fresh clone has no traces until that URL is set —
this is the download tier described above, not an oversight.

Runs are resumable: delete `out/<page>/traces.jsonl` to start over.

## Layout

```
notebooks/
  harness.py
  page_06_site_data.py                 # results.json -> derived.json, for pages 6 and 7
  page_07_site_data.py
  page_05_how_to_reason.ipynb          # REPLAY / QUICK / FULL
  page_06_thinking_longer.ipynb        # REPLAY / QUICK / FULL
  page_07_frequency_voting.ipynb       # REPLAY / QUICK / FULL
  page_08_best_of_n.ipynb              # REPLAY / QUICK / FULL, and it generates nothing
  page_14_distill_dividend.ipynb       # PLAN / SMOKE / FULL / REPLAY, four arms
  experiment_*.ipynb                   # the ablations, no run modes
  data/          # datasets fetched on first run (gitignored)
  out/
    page_05/
      traces.jsonl     # one line per generation — download tier, and REPLAY's input
      derived.json     # the aggregates the page plots — bundled tier
      manifest.json    # model revision, hashes, versions, seed, date
      figure_*.png     # reference renders; the page redraws these in the browser
    page_06/
      …same four, plus results.json; derived.json comes from page_06_site_data.py
    page_07/
      …as page 6. Its traces.jsonl is also page 8's input
    page_08/
      traces.jsonl     # its own pool, written only in GENERATE
      scores.jsonl     # one verifier score per candidate, per tier
      derived.json, manifest.json, figure_*.png
    page_09/
      …same four, plus its traces carry per-step labels
    page_14/
      …same four, keyed by arm: two instruct piles and two distill sets
    experiment_3/
      …plus tables.md, paste-ready
```

Pages 5 to 8 share one trace-bank schema, so a record from any of them is readable by the same
code. What differs is the key: page 5 varies the **prompt** at unlimited length and keys by
`condition`; page 6 fixes the prompt and varies the **length**, keying by `budget`; page 7 varies
**how many chains and how hot**, keying by `config_id` and `sample_index`; page 8 keys the same way
and adds `scores.jsonl`, one row per (candidate, scorer). Everything
else — `problem_id`, `trace`, `tokens`, `truncated`, `extracted_answer`, `correct`,
`tokens_generated` — is common, and page 9 extends the same shape.

They also share an instrument, the same Qwen2.5 checkpoints over the same items, and that is what
lets each page check itself against the one before it. Page 5's two endpoints are the ends of the
segment page 6 sweeps, and page 6's handoff cell overlays them. Page 7's split axis runs at page
6's chain lengths, so its vote there should sit close to page 6's greedy curve, and
`web/src/lib/page07.test.ts` asserts it does. Page 8's vote must reproduce page 7's on the
same pile, and its section 13 asserts that. Those three cross-checks are where a
drifting reimplementation would otherwise hide.

**Page 9 reuses page 7's pile and then filters it, and the filter is the interesting part.** Page 6
caps generation and forces the model to commit, so a broken step in one of *its* chains is our
intervention rather than the model's error. Page 7's chains carry the same hazard wherever the cap
bound. Grading a truncated chain for bad reasoning would report our own experiment as the model
reasoning badly, so page 9 grades only the chains the model ended itself: `chain_provenance` records
`source: "page_07_pile"` at `chain_budget: 2048`, and the filter keeps the chains that finished
inside it. That is a real restriction rather than a free one, and the page says so in its Provenance
note: every figure on it is conditional on the easier population the filter leaves behind.

*(Corrected 2026-08-08. This paragraph used to claim page 9 "runs its own uncapped pass". It does
not, and never did: the artifact and the page footer both name page 7's pile, which is what line 84
above says too. The claim was a plan that the implementation replaced with the filter.)*

`out/` and `data/` are gitignored. Promoting a run to the page means copying its `derived.json`
(on pages 6 and 7, after running `page_0N_site_data.py`) and `manifest.json` into `web/data/` as part of step 4, which is also where the cross-language
agreement test lives: TypeScript recomputes the same aggregates from `traces.jsonl` and asserts
they match the notebook's `derived.json`. That test is where translation bugs would otherwise
hide.

## What the book supplies

The grading harness comes from Sebastian Raschka's
[reasoning-from-scratch](https://github.com/rasbt/reasoning-from-scratch) —
`load_math500_test`, `render_prompt`, `extract_final_candidate` and `grade_answer` from ch03, and
`get_device` from ch02. These are plain text-in, text-out functions with no model dependency, and
using them unchanged means **grading is not ours to defend**.

Everything model-specific is plain 🤗 `transformers`, so swapping checkpoints is cheap. The
experiments, the sweeps and every number on the pages are ours; the papers cited on the pages are
cited for the *techniques* they introduced, never for our measurements.
