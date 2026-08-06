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

## Contents

**The page notebooks**, each with the three run modes below:

| File | Page | Status |
|---|---|---|
| `harness.py` | shared | plumbing for every notebook; ships in each download |
| `page_05_how_to_reason.ipynb` | 5 — How to Reason | **translated (step 4).** Run complete and replayable; `derived.json` is committed to `web/data/page-05-derived.json`, and the notebook, `harness.py` and all 900 traces ship as `web/public/notebooks/page-05-how-to-reason.zip`, linked from the page |
| `page_06_thinking_longer.ipynb` | 6 — Thinking Longer | built and verified; sweep in progress |
| `page_07_frequency_voting.ipynb` | 7 — Frequency Voting | **built, step 1.** No run yet. Two axes: one pile of N full-length chains, subsampled for the N axis, and one fixed budget split N ways. Consumes page 6's item set, spend and curve; produces page 8's candidate pile |
| `page_08_best_of_n.ipynb` | 8 — Best-of-N and Verifiers | **built, step 1.** No run yet. Generates nothing: it opens page 7's `traces.jsonl` and applies selectors |

Pages 7 and 8 are one chain of dependency: page 7 needs page 6's `out/page_06/` on disk for its
grid derivation and its temperature-0 cross-check, and page 8 needs page 7's `traces.jsonl` for
every number it reports. Each degrades to a printed skip rather than an exception when the run
above it is missing, except page 8, which has nothing to do without page 7 and says so.

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

| Mode | What it does | Hardware | Time |
|---|---|---|---|
| **`REPLAY`** *(default)* | draws every figure from the published generations | **none** | ~1 min |
| `QUICK` | one 3B checkpoint on a reduced grid, on your own hardware | ~6 GB GPU | tens of minutes |
| `FULL` | the grid the page ships, three checkpoints | 16 GB+ GPU | hours |

- **`REPLAY`** loads no model and downloads no weights. It is not a shortcut past the evidence: it
  adopts the published run's `RUN_ID`, asserts the traces cover the item set the notebook draws,
  and then runs every gate, assertion and figure the generating run did — including the
  independent verification that recomputes the headline numbers from the trace file. What it
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
  page_05_how_to_reason.ipynb          # REPLAY / QUICK / FULL
  page_06_thinking_longer.ipynb        # REPLAY / QUICK / FULL
  page_07_frequency_voting.ipynb       # REPLAY / QUICK / FULL
  page_08_best_of_n.ipynb              # REPLAY / QUICK / FULL, and it generates nothing
  experiment_*.ipynb                   # the ablations, no run modes
  data/          # datasets fetched on first run (gitignored)
  out/
    page_05/
      traces.jsonl     # one line per generation — download tier, and REPLAY's input
      derived.json     # the aggregates the page plots — bundled tier
      manifest.json    # model revision, hashes, versions, seed, date
      figure_*.png     # reference renders; the page redraws these in the browser
    page_06/
      …same four
    page_07/
      …same four. Its traces.jsonl is also page 8's input
    page_08/
      scores.jsonl     # one logprob per candidate — the only thing this page computes
      derived.json, manifest.json, figure_*.png
    experiment_3/
      …plus tables.md, paste-ready
```

Pages 5 to 8 share one trace-bank schema, so a record from any of them is readable by the same
code. What differs is the key: page 5 varies the **prompt** at unlimited length and keys by
`condition`; page 6 fixes the prompt and varies the **length**, keying by `budget`; page 7 varies
**how many chains and how hot**, keying by `config_id` and `sample_index`; page 8 adds no records
at all and writes scores keyed the same way. Everything
else — `problem_id`, `trace`, `tokens`, `truncated`, `extracted_answer`, `correct`,
`tokens_generated` — is common, and page 9 extends the same shape.

They also share an instrument, the same Qwen2.5 checkpoints over the same items, and that is what
lets each page check itself against the one before it. Page 5's two endpoints are the ends of the
segment page 6 sweeps, and page 6's handoff cell overlays them. Page 7's temperature-0 line *is*
page 6's budget curve, because N copies of one greedy chain of B/N tokens is one greedy chain of
B/N tokens, and its section 14 asserts the two agree. Page 8's majority rung must reproduce page
7's vote on the same pile, and its section 13 asserts that. Those three cross-checks are where a
drifting reimplementation would otherwise hide.

`out/` and `data/` are gitignored. Promoting a run to the page means copying its `derived.json`
and `manifest.json` into `web/data/` as part of step 4, which is also where the cross-language
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
