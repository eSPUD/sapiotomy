# Data Provenance — reviewer-facing audit trail

Every on-screen number in this explorable must trace to a primary source **and** a
digitization record. This file is that record. It is the code-of-conduct against the
"invented curve" failure mode (see `task_list.md`, Golden rule).

For every data file under `data/` (added milestone by milestone), record:

| Field | Meaning |
|---|---|
| **File** | the JSON asset, e.g. `data/self-consistency.json` |
| **Source** | paper + exact figure/table number |
| **Extraction method** | `WebPlotDigitizer on Fig. X` · `verbatim table value` · `derived` |
| **Raw points** | the extracted `(x, y)` values before any fitting |
| **Fit** | fitted-function form + parameters, if any |
| **Citation** | matches the `citation` field in the JSON |
| **Notes** | tolerance, preprint flag, source conflicts |

## Schema guarantee (enforced in code)

`src/lib/data.ts` rejects any data file missing a `citation` (`{ ref, url, venue, preprint }`)
or a `provenance` string. A unit test asserts this. No page ships a number without provenance.

## Known source conflicts to resolve against primary papers

- **Page 18 (faithfulness), misalignment-hint admission rates.** The two planning docs
  disagree: `InferenceTimeScaling_Explainable.md` says **20% / 29%** (Claude / R1);
  `InferenceTimeScaling_Survey.md` says **41% / 19%**. Resolve against the primary paper
  (Chen et al./Anthropic 2025, arXiv:2505.05410) before building, and record the resolved
  value here.

## Records

Each data file's `provenance` field carries its full source + extraction note (paper +
figure/table, verbatim vs. interpolated). Summary:

| File | Page | Extraction |
|---|---|---|
| epoch-run-cost.json | 3 | Verbatim per-run anchors ($78M GPT-4, $191M Gemini Ultra; Epoch AI estimates via AI Index 2024 ch.1, **not peer-reviewed**); points encode the **derived** cumulative bill of the daily-retrain hypothetical (y = 78x $M, labeled derived in-app) |
| epoch-compute-growth.json | 3 | Verbatim rates + FLOP anchors (Sevilla & Roldán 2024, Epoch AI, **not peer-reviewed**, CC BY): LMs ~5.0x/yr since mid-2020 (CI 3.1-7.3), frontier 4-5x/yr; GPT-3 3e23, GPT-4 2e25, Gemini Ultra 5e25 FLOP; points draw the trend across the cited window only; in-app chart is a **redrawing**, not Epoch's image |
| epoch-training-costs.json | 4 | Verbatim rate (Cottier et al. 2024, Epoch AI blog, **not peer-reviewed**); points encode the x2.4/yr multiplier only, no absolute dollars |
| epoch-inference-prices.json | 4 | Verbatim rates (Epoch AI data insight, **not peer-reviewed**); points encode the /40-per-yr multiplier only, no absolute prices |
| query-energy.json | 4 | Verbatim per-answer figures (Epoch AI, **not peer-reviewed**) + **derived** ladder rungs (labeled in-app); run energy is an outside **estimate** (33-60 GWh) |
| chain-of-thought.json | — (reserved) | Verbatim endpoints (Wei et al. 2022), GSM8K PaLM-540B; formerly Pages 2,3, retained for later pages after the Act-1 redesign |
| self-consistency.json | 6 | Verbatim endpoints (Wang et al. 2022) + interpolated shape |
| voting-plateau.json | 7 | Self-consistency plateau shape + closed-form coverage (Brown et al. 2024) |
| prm-vs-orm.json | 9 | Verbatim (Lightman et al. 2023), MATH |
| tree-of-thoughts.json | 10 | Verbatim endpoints (Yao et al. 2023), Game of 24 |
| coverage-scaling.json | 12 | Verbatim endpoints + log-linear fit (Brown et al. 2024) |
| compute-optimal.json | 13 | Verbatim claims (Snell et al. 2024) |
| budget-forcing.json | 14 | Verbatim endpoints (Muennighoff et al. 2025, **PP**) |
| deepseek-r1-training.json | 15 | Verbatim endpoints (DeepSeek-R1 2025) |
| arc-cost.json | 16 | Reported **estimates** (ARC Prize blog, **not peer-reviewed**) |
| overthinking.json | 17 | Authored inverse-U matching the 2025 literature (**PP**) |
| faithfulness.json | 18 | Verbatim headline rates (Chen et al./Anthropic 2025, **PP**) |
| illusion-of-thinking.json | 19 | Derived Hanoi token math (Shojaee/Lawsen 2025, **PP, both sides**) |

### Resolved conflict — Page 18 misalignment-hint faithfulness

The two planning docs disagree on the misalignment-hint sub-figures (Explainable: 20% / 29%;
Survey: 41% / 19%). **Decision:** pending direct verification against the primary paper
(arXiv:2505.05410), the app displays ONLY the well-agreed headline rates (Claude 25%, R1 39%)
and omits the conflicting sub-figures. This is stated in-app on Page 18. If/when the primary
paper is checked, add the resolved value here and restore the sub-figure.
