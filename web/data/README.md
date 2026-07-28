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
