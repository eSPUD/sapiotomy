# `data/` — pre-computed curves + provenance

Every quantitative anchor in the explorable lives here as a versioned JSON file,
locked to a cited primary source. This is the guardrail against the "invented
curve" failure mode (see `../../planning/task_list.md`, Golden rule).

## File shape (`CurveData`)

```jsonc
{
  "points": [{ "x": 1, "y": 56.5 }, ...],       // digitized data points
  "fit": { "kind": "...", "params": { ... } },   // optional fitted function
  "citation": {                                   // REQUIRED
    "ref": "Wang et al. 2022",
    "url": "https://arxiv.org/abs/2203.11171",
    "venue": "ICLR 2023",
    "preprint": false                             // true => flagged in-app
  },
  "provenance": "GSM8K, PaLM-540B. Endpoints verbatim from ..."  // REQUIRED
}
```

`src/lib/data.ts` validates every file; `src/lib/curves.ts` imports + parses them
at load time, so a missing `citation`/`provenance` fails the build and the tests.

## Adding a page's data

1. Digitize / transcribe the anchor from the primary paper. Record the figure/table
   and extraction method in [`PROVENANCE.md`](./PROVENANCE.md).
2. Write `data/<page>.json` with `citation` + `provenance`.
3. Register it in `src/lib/curves.ts`.
4. Add a **data-fidelity test** asserting the endpoints match the paper within
   ±1.0 pp (default tolerance).

## The other tier: our own runs

`page-0N-derived.json` is a different kind of file and does not follow the shape above. It has no
`citation`, because there is nothing to cite: it is a byte-for-byte copy of a notebook's
`out/page_0N/derived.json`, and every number in it is a measurement of ours. Its provenance is its
own `manifest` block — model revisions, tokenizer hashes, decoding, item-set hash, seed, versions,
integrity counts — and the run it came from ships as a download beside the page, so a reader who
doubts a figure re-derives it rather than taking the file's word for it. See
[`../../notebooks/README.md`](../../notebooks/README.md).

| File | Page | Run |
|---|---|---|
| `page-05-derived.json` | 5 | 900 generations: 3 prompt conditions × 3 Qwen2.5 checkpoints × 100 MATH-500 L4-5 items, greedy |
| `page-06-derived.json` | 6 | 1,500 records: 5 token budgets × 3 Qwen2.5 checkpoints × the same 100 items, greedy, forced at the cap |
| `page-09-derived.json` | 9 | 1,580 chains reused from page 7's pile (Qwen2.5-3B-Instruct, T=0.3, the same 100 items) and graded step by step twice: a deterministic arithmetic checker, and `Qwen2.5-Math-PRM-7B` admitted only after being measured against it (AUC 0.89). Only chains the model ended itself are graded |

These are validated by `src/lib/page0N.ts` at import time rather than by `data.ts`: the loader runs
the spec's claim gates before any number reaches a component, so a run that does not pass fails the
build instead of drawing a plausible wrong figure.

## Files

| File | Page | Anchor | Source |
|---|---|---|---|
| `epoch-training-costs.json` | 4 | run costs ×2.4/yr (CI ×2.0–×3.1); >$1B by 2027 | Cottier et al. 2024, Epoch AI (est.) |
| `epoch-inference-prices.json` | 4 | answer price ÷40/yr (GPQA bar); ÷9–÷900, median ÷50 | Epoch AI data insight (est.) |
| `query-energy.json` | 4 | 0.3 Wh/answer; ~50 GWh/run; 4-rung ladder (derived) | Epoch AI (est. + derived) |
| `chain-of-thought.json` | — (reserved) | GSM8K 17.9% → 56.9% (+39.0) | Wei et al. 2022 |
| `self-consistency.json` | 6 | GSM8K +17.9% (56.5% → 74.4%) | Wang et al. 2022 |
| `voting-plateau.json` | 7 | coverage rises, majority plateaus | Brown et al. 2024 (PP) |
| `prm-vs-orm.json` | 9 | MATH: PRM 78.2 / ORM 72.4 / maj 69.6 | Lightman et al. 2023 |
| `tree-of-thoughts.json` | 10 | Game of 24: b=1→45%, b=5→74% | Yao et al. 2023 |
| `coverage-scaling.json` | 12 | SWE-bench 15.9%→56% (250) | Brown et al. 2024 (PP) |
| `compute-optimal.json` | 13 | >4× vs BoN; beats 14× larger | Snell et al. 2024 |
| `budget-forcing.json` | 14 | AIME24 50%→57% | Muennighoff et al. 2025 (PP) |
| `deepseek-r1-training.json` | 15 | AIME 15.6%→71.0%; cons@64 86.7% | DeepSeek-R1 2025 |
| `o1-scaling.json` | 13 | AIME 12→74.4/83.3/93; two-axis log-linear (authored shape, unlabeled source axes) | OpenAI o1 blog (PP) |
| `o3-preview.json` | 13 | AIME 96.7; GPQA 87.7; SWE 48.9→71.7; CF 2727 | OpenAI o3 preview via ARC Prize (PP) |
| `arc-cost.json` | 16 | o3 75.7%→87.5%; est. $3K–$30K | ARC Prize blog (est.) |
| `overthinking.json` | 17 | inverse-U; easy peaks earlier | inverse-scaling lit. (PP) |
| `faithfulness.json` | 18 | admit 25% / 39% | Chen et al./Anthropic (PP) |
| `illusion-of-thinking.json` | 19 | Hanoi token wall; verdict flips | Shojaee/Lawsen 2025 (PP) |
| `coconut.json` | 19 (frontier) | ProsQA 77.5→97.0; GSM8K 42.9→34.1; tokens ÷3–÷10 | Hao et al. 2024 |

Authored (illustrative, non-paper) content for Pages 1-3 lives in
`src/lib/authored.ts` and is labelled as such in-app: the Page-1 game rounds and
scripted computer playthrough, the Page-2 instant blurts (an **informal real
test** of DeepSeek-V3, July 2026, recorded in `notes_on_slides.md`; re-run and
provenance-log before shipping) and the hand-authored placeholder trace, and
the Page-3 match-night config (a hypothetical: no real teams, facts, or
results, so nothing dates).
