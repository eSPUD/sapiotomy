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
| epoch-data-stock.json | 3 | Verbatim anchors (Villalobos et al. 2024, Epoch AI, arXiv:2211.04325, **conservatively flagged preprint**): effective stock of public human text ≈ **300T tokens**; if trends continue, fully utilized **between 2026 and 2032**; points encode only the two window-endpoint years against the stock, no depletion curve digitized |
| wei-cot-scaling.json | 5 | Verbatim per-scale GSM8K solve rates for the PaLM family (Wei et al. 2022, NeurIPS, appendix per-scale table / Fig. 4): standard 8B 4.9, 62B 9.6, 540B 17.9; CoT 8B 4.1, 62B 29.9, 540B 56.9; points hold the CoT curve, fit.params both curves; in-app chart is a **redrawing** on a log-x axis, not the paper's image |
| epoch-training-costs.json | 4 | Verbatim rate (Cottier et al. 2024, Epoch AI blog, **not peer-reviewed**); points encode the x2.4/yr multiplier only, no absolute dollars |
| epoch-inference-prices.json | 4 | Verbatim rates (Epoch AI data insight, **not peer-reviewed**); points encode the /40-per-yr multiplier only, no absolute prices |
| query-energy.json | 4 | Verbatim per-answer figures (Epoch AI, **not peer-reviewed**) + **derived** ladder rungs (labeled in-app); run energy is an outside **estimate** (33-60 GWh) |
| chain-of-thought.json | — (reserved) | Verbatim endpoints (Wei et al. 2022), GSM8K PaLM-540B; formerly Pages 2,3, retained for later pages after the Act-1 redesign |
| self-consistency.json | 6 | Verbatim endpoints (Wang et al. 2022) + interpolated shape |
| voting-plateau.json | 7 | Self-consistency plateau shape + closed-form coverage (Brown et al. 2024) |
| prm-vs-orm.json | 9 | Verbatim (Lightman et al. 2023), MATH |
| tree-of-thoughts.json | 10 | Verbatim endpoints (Yao et al. 2023), Game of 24 |
| coverage-scaling.json | 12 | Verbatim endpoints + log-linear fit (Brown et al. 2024) |
| compute-optimal.json | 11, 13 | Verbatim claims (Snell et al. 2024) |
| rebase-pareto.json | 11 | Verbatim table values (Wu et al. 2024, Table 1, MATH500 accuracy vs inference FLOPs) |
| pythia-inference-scaling.json | 11 | **By-eye digitization** of Wu et al. 2024's GSM8K inference-scaling figure (Pythia 410M/2.8B/12B, weighted majority; 1.4B and 6.9B omitted for legibility), ±3pp / ~1.5x-on-FLOPs tolerance, replotted as accuracy (= 100 − plotted test error); the preserved claim: small models are compute-optimal at small budgets, saturate, then larger models take over |
| budget-forcing.json | 14 | Verbatim endpoints (Muennighoff et al. 2025, **PP**) |
| deepseek-r1-training.json | 14, 16 | Verbatim endpoints (DeepSeek-R1 2025): AIME 2024 pass@1 15.6 → 71.0, cons@64 86.7; intermediate points interpolated |
| deepseek-r1-distill.json | 14 | Verbatim Table 4–5 values (DeepSeek-R1 2025): per-size AIME 2024 + MATH-500 for the six distills, teacher/o1-mini/QwQ/GPT-4o reference rows |
| arc-cost.json | 16 | Reported **estimates** (ARC Prize blog, **not peer-reviewed**) |
| o1-scaling.json | 13 | **Authored** log-linear redrawing (y = 21 + 29.5·log10 x, relative units) of the o1 announcement's two scaling figures, whose compute axes are **unlabeled** in the source; all named anchors verbatim from the announcement text/figure (AIME 12 / 74.4 / 83.3 / 93; Codeforces 808 / 1807; GPQA 56.1 / 78.0 / expert 69.7) (OpenAI o1 blog, **not peer-reviewed**) |
| o3-preview.json | 13 | Verbatim Dec 2024 o3 preview announcement figures (AIME 96.7, GPQA 87.7, SWE-bench Verified 48.9→71.7, Codeforces 2727), **OpenAI-scored, preview**, documented in the ARC Prize o3 write-up (**not peer-reviewed**); live-contest re-measurement 2724 in arXiv:2502.06807 noted in provenance |
| self-correction.json | 17 | Verbatim Table 3 values (Huang et al., ICLR 2024, arXiv:2310.01798): GPT-4/GSM8K 95.5→91.5→89.0 and GPT-3.5/CommonSenseQA 75.8→38.1→41.8 across intrinsic self-correction rounds; the page's slider demo is a separate authored three-state chain (labeled in-app, constants pinned in `act3.test.ts`) |
| overthinking.json | 17 | Authored inverse-U matching the 2025 literature (**PP**) |
| faithfulness.json | 18 | Verbatim headline rates (Chen et al./Anthropic 2025, **PP**) |
| cot-obfuscation.json | 18 | Verbatim recall anchors 95%/60%→~0% (Baker et al./OpenAI 2025, **PP**); pressure/reward curve **shapes authored**, labeled in-app |
| illusion-of-thinking.json | 19 | Derived Hanoi token math (Shojaee/Lawsen 2025, **PP, both sides**) |
| benchmark-scoreboard.json | 15 (app route /p/15, The Scoreboard) | Verbatim headline scores per benchmark, each dot carrying its own source + caveat in the JSON: GSM8K (Wei et al. 2022 per-scale table — must agree with wei-cot-scaling.json, cross-checked in scoreboard.test.ts; GPT-4 TR 92.0; Claude 3 model card 95.0); MATH/MATH-500 (Hendrycks et al. 2021 ~5%; GPT-4 42.5; o1 96.4 / R1 97.3 from DeepSeek-AI 2025 Table 4, subset switch flagged in-app); AIME 2024 + GPQA Diamond (OpenAI "Learning to reason with LLMs" Sep 2024, **not peer-reviewed**: GPT-4o 12, o1 74/83/93, o1 77.3 vs 69.7 experts); Codeforces + SWE-bench Verified (DeepSeek-AI 2025 Table 4); o3 Dec-2024 figures (AIME 96.7, GPQA 87.7, Elo 2727, SWE 71.7, FrontierMath 25.2) are **announcement numbers, not peer-reviewed**; FrontierMath dispute (Glazer et al. 2024 <2%; Epoch AI independent ~10% on released o3, 180- vs 290-problem sets, funding disclosure — via TechCrunch 2025) shown as two dots with conditions. Validated by its own loader (src/lib/scoreboard.ts), same citation+provenance schema |
| coconut.json | 19 (frontier) | Verbatim main-table accuracy + token counts (Hao et al. 2024, COLM 2025), GPT-2-scale |

### Resolved conflict — Page 18 misalignment-hint faithfulness

The two planning docs disagree on the misalignment-hint sub-figures (Explainable: 20% / 29%;
Survey: 41% / 19%). **Decision:** pending direct verification against the primary paper
(arXiv:2505.05410), the app displays ONLY the well-agreed headline rates (Claude 25%, R1 39%)
and omits the conflicting sub-figures. This is stated in-app on Page 18. If/when the primary
paper is checked, add the resolved value here and restore the sub-figure.
