# Page 11 prototype — "The bill arrives"

A **standalone, dependency-free prototype** of page 11 for fine-tuning copy, data, visuals, and interactions **before** the mentor's scaffold lands. Built per [`../../pages/page-11-the-bill-arrives.md`](../../pages/page-11-the-bill-arrives.md) §9 ("prototype standalone… everything is portable; only the seams change").

## How to open
Double-click `index.html` (or drag it into a browser). No server, no build, no network — it runs offline from `file://`. Toggle light/dark with the ◑ button (it also follows your OS theme).

## What it is / isn't
- **Is:** the real narrative, the real (confirmed-landscape) numbers, the staged Predict→Reveal flow, the log-$ scatter with the era layers, tooltips, table view, a11y scaffolding, reduced-motion + light/dark.
- **Isn't:** the production component. Colors are **placeholder tokens** (CSS variables at the top of `index.html`), the chart is hand-rolled SVG (not D3), and the reveal/zoom-back are prototype stand-ins.

## The one idea (don't lose it in fine-tuning)
> More accuracy costs more, with **diminishing returns** — even as the whole price curve **collapses** over time. The absolute price falls; the *shape* of the trade does not.

The emotional arc is **inversion-shock, not sticker-shock**: the 2024 "thousands per task" is now history; today's best model is **$1.44**, and the *expensive* models are the *worse* ones. See [`../../planning/hybrid_explorable_currency_review.md`](../../planning/hybrid_explorable_currency_review.md).

## Data & provenance (all figures are **leads — verify at M1**)
Confirmed-landscape values, mid-2026. Sources: ARC Prize 2025 results/leaderboard (ARC-AGI-2) + OpenAI o3 announcement (Dec 2024, ARC-AGI-1). Blog/leaderboard — **not peer-reviewed**; "cost" mixes retail pricing and compute estimates.

**Current — ARC-AGI-2, 2026 (plotted):**

| System | Accuracy | $/task | Role |
|---|---|---|---|
| GPT-5.6 Luna (Max Reasoning) | 59.5% | $0.67 | family curve — low end |
| GPT-5.6 Terra (Max Reasoning) | 83.9% | $1.09 | family curve — mid |
| GPT-5.6 Sol (Max Reasoning) | 92.5% | $1.44 | **current SOTA** |
| Gemini 3.1 Pro (Preview) | 77.1% | $40 | legacy pricing (cost ≠ value) |
| Human panel | 100% | ~$17 *(estimate — verify)* | baseline |

**Cost-only context (no published ARC-AGI-2 score → not plotted, mentioned in copy):** GPT-5.4 ~$95/task, Claude Opus 4.6 ~$160/task.

**Historical — ARC-AGI-1, Dec 2024 (aged layer):** o3 low 75.7% @ ~$17–20; o3 high 87.5% @ 172× compute (est. $3K–$30K/task).

**ARC-AGI-3 (callout, not plotted — different scoring scale):** GPT-5.6 Sol 7.8% (SOTA), humans 100%.

## Open items (resolve during M1 digitization; log in `data/PROVENANCE.md`)
1. **Human $/task on ARC-AGI-2** — the prototype uses ~$17 as a placeholder; confirm the ARC Prize human-panel figure for ARC-AGI-2 specifically. *Never invent it.*
2. **Verify every 2026 figure against the live leaderboard** at build time; pin whether each "cost" is retail price or compute estimate.
3. **o3-high cost range** ($3K–$30K) — confirm the reported estimate band.
4. **ARC-AGI-3 unit** — confirm "7.8%" is a percentage vs. some other scale; keep it a callout regardless.
5. **Claude Fable 5 / other frontier** — only add if a clean, citable ARC-AGI-2 cost/accuracy point exists; the page must not depend on any single newest model.

## Port path (when the scaffold exists)
- Inlined `DATA` → `data/arc-agi-2-cost.json` + `data/arc-agi-1-cost-history.json` (loader schema: `points` + `citation` + `provenance`).
- Hand-rolled SVG → **D3 inside `<ChartFrame>`**; the `xPix/yPix` scale fns map 1:1 to D3 `scaleLog`/`scaleLinear`.
- Reveal stepper → the scaffold's staged-reveal primitive; the telescope frame → `<FieldDataFrame>`; the spotlight tile → `<BigNumber>`; predict → `<PredictBar>`; citation chip → `<CitationBadge preprint>`.
- Placeholder CSS tokens → the M0 design tokens; then **run the dataviz palette validator** (`--pairs all`, both modes) on the real hues before shipping.
- Acceptance tests: see the spec §10.
