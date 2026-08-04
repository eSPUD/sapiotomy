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
reader who doubts a figure downloads one file and re-runs it. Notebooks are linked from the pages
they back.

## The boundary

The notebook writes logs; the page reads them. **No inference runs at demonstration time** — the
`NEXT_PUBLIC_LIVE_INFERENCE` / `LiveDemo` path is not used by these pages.

Two tiers of artifact, applied uniformly so page 7's much larger sweep does not force a retrofit:

- **bundled with the page** — `derived.json` (the aggregates actually plotted), `manifest.json`,
  and the specific traces a figure displays;
- **published as a download** — the complete `traces.jsonl`, linked beside the notebook.

The page ships what it draws and links what it drew it from.

## Contents

| Notebook | Page | Status |
|---|---|---|
| `page_05_how_to_reason.ipynb` | 5 — How to Reason | step 1 complete, awaiting a real run and step-3 approval |

## Running one

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
jupyter lab
```

Each notebook has a `RUN_MODE` variable at the top:

- **`QUICK`** — a reduced grid on the smallest model, finishing on a laptop CPU in minutes. It
  produces a legible, correctly-shaped figure, because most readers will never run `FULL`. The
  numbers are a shape check, not an estimate.
- **`FULL`** — the grid the page ships, on a 16 GB GPU, in hours.

Runs are resumable: delete `out/<page>/traces.jsonl` to start over.

## Layout

```
notebooks/
  page_05_how_to_reason.ipynb
  data/          # datasets fetched on first run (gitignored)
  out/
    page_05/
      traces.jsonl     # one line per generation — download tier
      derived.json     # the aggregates the page plots — bundled tier
      manifest.json    # model revision, hashes, versions, seed, date
      figure_*.png     # reference renders; the page redraws these in the browser
```

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
