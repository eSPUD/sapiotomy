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
| `chain-of-thought.json` | 2, 3 | GSM8K 17.9% → 56.9% (+39.0) | Wei et al. 2022 |
| `self-consistency.json` | 6 | GSM8K +17.9% (56.5% → 74.4%) | Wang et al. 2022 |
| `voting-plateau.json` | 7 | coverage rises, majority plateaus | Brown et al. 2024 (PP) |
| `prm-vs-orm.json` | 9 | MATH: PRM 78.2 / ORM 72.4 / maj 69.6 | Lightman et al. 2023 |
| `tree-of-thoughts.json` | 10 | Game of 24: b=1→45%, b=5→74% | Yao et al. 2023 |
| `coverage-scaling.json` | 12 | SWE-bench 15.9%→56% (250) | Brown et al. 2024 (PP) |
| `compute-optimal.json` | 13 | >4× vs BoN; beats 14× larger | Snell et al. 2024 |

Authored (illustrative, non-paper) content for Pages 1 and 4 lives in
`src/lib/authored.ts` and is labelled as such in-app.
