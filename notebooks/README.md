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

| File | Page | Status |
|---|---|---|
| `harness.py` | shared | plumbing for every notebook; ships in each download |
| `page_05_how_to_reason.ipynb` | 5 — How to Reason | step 1 complete, awaiting a real run and step-3 approval |
| `page_06_thinking_longer.ipynb` | 6 — Thinking Longer | step 1 complete, awaiting a real run and step-3 approval |

## Running one

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
jupyter lab
```

Each notebook has a `RUN_MODE` variable at the top:

- **`QUICK`** — a reduced grid on Qwen3-1.7B, which produces a legible, correctly-shaped figure
  because most readers will never run `FULL`. The numbers are a shape check, not an estimate.
  It wants a GPU and takes tens of minutes: a 2026 instruction-tuned model writes thousands of
  tokens on a hard problem whatever you ask of it, so the caps that used to make this a
  laptop-CPU job were measuring truncation rather than reasoning.
- **`FULL`** — the grid the page ships, Qwen3-4B on a 16 GB GPU, in hours.

Runs are resumable: delete `out/<page>/traces.jsonl` to start over.

## Layout

```
notebooks/
  page_05_how_to_reason.ipynb
  page_06_thinking_longer.ipynb
  data/          # datasets fetched on first run (gitignored)
  out/
    page_05/
      traces.jsonl     # one line per generation — download tier
      derived.json     # the aggregates the page plots — bundled tier
      manifest.json    # model revision, hashes, versions, seed, date
      figure_*.png     # reference renders; the page redraws these in the browser
    page_06/
      …same four
```

Pages 5 and 6 share one trace-bank schema, so a record from either is readable by the same code:
page 5 varies the **prompt** at unlimited length and keys its records by `rung`, page 6 fixes the
prompt and varies the **length**, keying by `budget`. Everything else — `problem_id`, `trace`,
`tokens`, `truncated`, `extracted_answer`, `correct`, `tokens_generated` — is common, and pages 7
through 9 extend the same shape.

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
