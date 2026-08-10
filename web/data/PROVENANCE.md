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

Two schemas, because there are two kinds of file here and one guarantee does not cover both.

**Digitized and transcribed sources** go through `src/lib/data.ts`, which rejects any file
missing a `citation` (`{ ref, url, venue, preprint }`) or a `provenance` string. `data.test.ts`
asserts the rejection. That is every row in the first table below.

**The deck's own measurement runs** (`page-05-derived.json` through `page-09-derived.json`)
carry a `manifest` instead: run id, notebook path, notebook sha256, model ids, decoding
settings, item-set hash, grader, library versions and integrity counts. They are loaded by
`src/lib/page05.ts` and its siblings, not by `data.ts`, so the paragraph above does not apply
to them and they would fail its check. The equivalent guarantee is stronger and lives
elsewhere: `src/lib/notebookBundles.test.ts` asserts that the notebook shipped in each page's
download is the notebook named in the manifest, and that the `derived.json` inside the download
hashes identically to the one the page plots.

## Where the reader can re-derive it

Pages 5 to 9 each ship the run that produced their numbers, as a zip under
`web/public/notebooks/`, in a replay mode that needs no GPU.

Page 10 ships a bundle that is **not** a run: `page-10-search-arm.zip` is the search arm
written and packaged unrun, and the page's label promises the notebook rather than a result.
Its tree is hand-authored and its bars are Yao et al.'s, so nothing on the page rests on it.
Page 11 ships `page-11-training-vs-scale.zip`, which **is** a run: arm 0's gate-1 re-derivation
plus the easy-band, specialist and hard-band 1.5B arms it generated, 5,900 chains in
`traces.jsonl`.

`src/lib/notebookBundles.test.ts` checks the layout, replay mode and manifest of the page
5 to 8 and page 11 bundles. Pages 9 and 10 are not covered by it.

## The specimens on pages 18 and 19

`data/trace-specimens.json` is a third kind of file: not a digitized source, and not a run of
ours either, but three chains **copied** out of page 11's published `traces.jsonl`. It carries no
`citation` because there is nothing to cite, and no `manifest` because it measures nothing. Its
provenance is its `source` block plus a `line_sha256` per chain, and the guarantee is
`src/lib/specimens.test.ts`, which opens `page-11-training-vs-scale.zip` and asserts each chain is
byte-identical to the line it names. `src/lib/specimens.ts` additionally refuses to load a quote
that is not a verbatim substring of its trace, so a span edited for flow fails the build.

All three are `Qwen2.5-Math-1.5B-Instruct` under its model card's CoT system prompt, greedy, cap
2048, on pages 6 to 8's own hundred MATH-500 L4/5 items. They are specimens and never rates:
three chains out of 2,550, chosen for what they show. Both pages say so on themselves, and
neither derives a number from them. Why they were used instead of a fresh tool-use run is in
`docs/page_19_tool_use_probe.md` §3.

## Grader false negatives in `grade_answer`

Recorded here because `reasoning_from_scratch.ch03.grade_answer` grades every measured page in
the deck, and the rate is not zero.

A sweep of all 5,900 chains in page 11's bundle found **three** answers scored wrong that are
mathematically identical to the ground truth, every one a formatting miss:

| model | ground truth | model's answer | difference | where it lands |
|---|---|---|---|---|
| Math-1.5B | `\begin{pmatrix} 1/5 \\ -18/5 \end{pmatrix}` | `\begin{pmatrix} \frac{1}{5} \\ -\frac{18}{5}\end{pmatrix}` | `1/5` vs `\frac{1}{5}` | hard-band greedy |
| Math-1.5B | `(2,12) \cup (12,102)` | `(2, 12) \cup (12, 102)` | whitespace | hard-band greedy |
| 1.5B-Instruct | `12\pi` | `12 \pi` | whitespace | one sampled draw of 16 |

The first two land on `Qwen2.5-Math-1.5B-Instruct`, which is the model that answers in vectors
and intervals often enough to be graded on them, and both fall in its hard-band greedy set. The
effect: the specialist's hard-band greedy accuracy is **66%, not the 64%** its `derived.json`
records. Page 11 does not plot the specialist in any case.

The third arrived with the 2026-08 rebundle that sampled the 1.5B on the hard band. It is one
draw of the sixteen on a single item, so it moves a pooled figure by well under a point and no
greedy point at all. It is worth recording for what it says about the shape of the problem:
the misses are notation and whitespace, not a property of one model.

**The derived files are not being corrected.** They are a faithful record of what the grader
returned on the run, and rewriting them would break the bit-exact gate-1 reproduction pages 6, 7
and 8 are checked against. The correction lives here and in `src/lib/page11.ts`'s header.

## Known source conflicts to resolve against primary papers

- **Page 18 (faithfulness), misalignment-hint admission rates.** The two planning docs
  disagree: `InferenceTimeScaling_Explainable.md` says **20% / 29%** (Claude / R1);
  `InferenceTimeScaling_Survey.md` says **41% / 19%**. Resolve against the primary paper
  (Chen et al./Anthropic 2025, arXiv:2505.05410) before building, and record the resolved
  value here.

## Records

Each data file's `provenance` field carries its full source + extraction note (paper +
figure/table, verbatim vs. interpolated). Summary below.

**The Page column is what imports the file, checked by grep, not what the file was originally
commissioned for.** It was wrong for most of pages 5 to 19 until 2026-08: five files were
assigned to pages that never imported them, the deck's entire measured spine had no rows at
all, and four page numbers were left over from earlier drafts. To re-derive the column after a
change: `grep -rl "curves\.<key>" src/components/pages/` for the parsed curves, plus
`grep -rl "@data/<file>" src/lib/` for the derived runs.

### Rendered on a page

| File | Page | Extraction |
|---|---|---|
| page-05-derived.json | 5 | **The deck's own run.** Qwen2.5 checkpoints on 100 MATH-500 level 4+5 items, chain-of-thought suppressed vs allowed, McNemar on the paired grid. Carries a `manifest` (run id, notebook sha256, item-set hash, grader, decoding, library versions), not a `provenance` string; loaded by `src/lib/page05.ts`. Re-derivable from the page's own download |
| page-06-derived.json | 6 | **The deck's own run.** Token-budget sweep over the same 100 items and the wait-injection arm: per-item correctness by budget, truncation flags, length distributions. Manifest as above; loaded by `src/lib/page06.ts` |
| page-07-derived.json | 7 | **The deck's own run.** Sampled chains at two temperatures with per-problem answer tallies, plus the N sweep (N = 1, 2, 4, 8, 16) of accuracy, coverage and tie rate. Manifest as above; loaded by `src/lib/page07.ts` |
| page-08-derived.json | 8 | **The deck's own run.** Best-of-N against five judges, paired against the vote. Note `manifest.verifiers[4]`: the trained PRM was **rebuilt** on transformers' Qwen2 body plus the checkpoint's value head, because the checkpoint's own modelling code returns NaN under this transformers version, and its solve rate on these items is `null` / unmeasured. Loaded by `src/lib/page08.ts` |
| page-09-derived.json | 9 | **The deck's own run.** Step-level checking against a process reward model, detection rates, AUC and the selection null. `prm_reliability.threshold_source` records that the PRM's operating point was fitted against the checker's own labels. Loaded by `src/lib/page09.ts` |
| page-17-derived.json | 17 | **The deck's own runs, re-read.** Generates nothing: `page_17_when_reasoning_breaks.ipynb` re-aggregates pages 5 to 9 and asserts it reproduces page 6's fifteen accuracy cells exactly (`gates.B_page_6_reproduced.max_drift` is 0). Carries the budget-rung ledger, the affected-item counts, the specimen traces (which live nowhere else outside page 6's zip) and three controls. **Four `claims` are deliberately `false`**: they are the controls that cut the page's observation down, and the page prints all of them. Loaded by `src/lib/page17.ts` |
| tot-crosswords.json | 10 | Verbatim Table 3 word-success column (Yao et al. 2023, NeurIPS): 5x5 mini crosswords, GPT-4, 20 puzzles; IO 14%, CoT 15.6%, ToT without backtracking 20%, without pruning 41.5%, full ToT 60% |
| neural-degeneration.json | 10 | Verbatim Table 1 repetition rates (Holtzman et al. 2020, ICLR): GPT-2 Large, 5,000 WebText continuations, up to 200 tokens |
| rebase-pareto.json | 11 | Verbatim table values (Wu et al. 2024, Table 1, MATH500 accuracy vs inference FLOPs) |
| pythia-inference-scaling.json | 11 | **By-eye digitization** of Wu et al. 2024's GSM8K inference-scaling figure (Pythia 410M/2.8B/12B, weighted majority; 1.4B and 6.9B omitted for legibility), ±3pp / ~1.5x-on-FLOPs tolerance, replotted as accuracy (= 100 − plotted test error); the preserved claim: small models are compute-optimal at small budgets, saturate, then larger models take over |
| star-cqa.json | 12 | Verbatim Table 1 CommonsenseQA dev accuracies (Zelikman et al. 2022, NeurIPS): GPT-J direct 20.9%, GPT-J CoT 36.6%, LaMDA 137B CoT 55.6%, GPT-J finetuned 60.0%, STaR 68.8% |
| o1-scaling.json | 13, 15 | **Authored** log-linear redrawing (y = 21 + 29.5·log10 x, relative units) of the o1 announcement's two scaling figures, whose compute axes are **unlabeled** in the source; all named anchors verbatim from the announcement text/figure (AIME 12 / 74.4 / 83.3 / 93; Codeforces 808 / 1673 — the announcement's 1807 is the fine-tuned o1-ioi, not o1; GPQA 56.1 / 78.0 / expert 69.7) (OpenAI o1 blog, **not peer-reviewed**) |
| deepseek-r1-training.json | 14 | Verbatim endpoints (DeepSeek-R1 2025): AIME 2024 pass@1 15.6 → 71.0, cons@64 86.7; intermediate points interpolated |
| deepseek-r1-distill.json | 14 | Verbatim Table 4–5 values (DeepSeek-R1 2025): per-size AIME 2024 + MATH-500 for the six distills, teacher/o1-mini/QwQ/GPT-4o reference rows. The MATH-500 column is carried but **not rendered**: adding it reverses the 70B/32B ordering the page's figure turns on |
| arc-cost.json | 16 | Reported **estimates** (ARC Prize blog, **not peer-reviewed**) |
| deepseek-pricing.json | 16 | List prices per million tokens at R1's API launch (Jan 2025), DeepSeek API docs: R1 $0.55 in / $2.19 out against o1 $15 / $60, a ~27x reduction on both meters. Also carries `r1RlTrainUSD`, the reported one-time RL-stage cost the calculator uses as its retraining bill |
| compute-optimal.json | 16, 19 | Verbatim claims (Snell et al. 2024). Both pages state the scope the source gives them: the substitution holds on easy and medium problems |
| self-correction.json | 17 | Verbatim Table 3 values (Huang et al., ICLR 2024, arXiv:2310.01798): GPT-4/GSM8K 95.5→91.5→89.0 and GPT-3.5/CommonSenseQA 75.8→38.1→41.8 across intrinsic self-correction rounds; the page's pass slider is a separate authored three-state chain (labeled in-app, constants pinned in `act3.test.ts`) |
| faithfulness.json | 18 | Verbatim headline rates (Chen et al./Anthropic 2025, **PP**) |
| cot-obfuscation.json | 18 | Verbatim recall anchors 95%/60%→~0% (Baker et al./OpenAI 2025, **PP**); pressure/reward curve **shapes authored**, labeled in-app |
| coconut.json | 19 | Verbatim main-table accuracy + token counts (Hao et al. 2024, COLM 2025), **GPT-2-scale**, which the figure's own title now carries |
| epoch-run-cost.json | 3 | Verbatim per-run anchors ($78M GPT-4, $191M Gemini Ultra; Epoch AI estimates via AI Index 2024 ch.1, **not peer-reviewed**); points encode the **derived** cumulative bill of the daily-retrain hypothetical (y = 78x $M, labeled derived in-app) |
| epoch-compute-growth.json | 3 | Verbatim rates + FLOP anchors (Sevilla & Roldán 2024, Epoch AI, **not peer-reviewed**, CC BY): LMs ~5.0x/yr since mid-2020 (CI 3.1-7.3), frontier 4-5x/yr; GPT-3 3e23, GPT-4 2e25, Gemini Ultra 5e25 FLOP; points draw the trend across the cited window only; in-app chart is a **redrawing**, not Epoch's image |
| epoch-data-stock.json | 3 | Verbatim anchors (Villalobos et al. 2024, Epoch AI, arXiv:2211.04325, **conservatively flagged preprint**): effective stock of public human text ≈ **300T tokens**; if trends continue, fully utilized **between 2026 and 2032**; points encode only the two window-endpoint years against the stock, no depletion curve digitized |
| epoch-dataset-projection.json | 3 | Reproduces the historical projection in `dataset_size_hist` from epoch-research/data-stock: dataset sizes after 2010 converted words→tokens at 4/5, log10 regression on days since 2024-01-01 (Villalobos et al. 2024, Epoch AI) |
| chinchilla.json | 3 | Verbatim compute-optimal anchors (Hoffmann et al. 2022, NeurIPS): parameters and training tokens scale roughly equally, ~20 tokens per parameter |
| epoch-training-costs.json | 3 | Verbatim rate (Cottier et al. 2024, Epoch AI blog, **not peer-reviewed**); points encode the x2.4/yr multiplier only, no absolute dollars. Reaches page 3 through `src/lib/dailyTraining.ts` |

### Retained but rendered nowhere

Kept because deleting a sourced file loses the record, not because a page draws it. Each is
still schema-checked. If one of these acquires a consumer, move it up.

| File | Why it is still here |
|---|---|
| benchmark-scoreboard.json | The source record for page 15's non-o1 case numbers, which the page still prints: GPT-4o 12 on AIME, o3 25.2 vs Epoch AI's ~10 on FrontierMath, with each dot's own source and caveat. `scoreboard.test.ts` also cross-checks its GSM8K entries against `wei-cot-scaling.json`, so two files quoting one source cannot drift. Loaded by `src/lib/scoreboard.ts`, which draws nothing |
| wei-cot-scaling.json | Verbatim per-scale GSM8K solve rates for the PaLM family (Wei et al. 2022, NeurIPS): standard 8B 4.9 / 62B 9.6 / 540B 17.9, CoT 8B 4.1 / 62B 29.9 / 540B 56.9. Page 5 measures its own version of this result instead of digitizing one; the file survives as the cross-check above |
| budget-forcing.json | Verbatim endpoints (Muennighoff et al. 2025, **PP**). Page 19's "budgets that flex" step reprinted it and was cut in 2026-08 as a recap: page 6 measures budget forcing on the deck's own harness |
| coverage-scaling.json | Verbatim endpoints + log-linear fit (Brown et al. 2024). Page 16 cites the log-linear shape in prose and no longer plots the curve |
| o3-preview.json | Verbatim Dec-2024 o3 preview figures (AIME 96.7, GPQA 87.7, SWE-bench 48.9→71.7, Codeforces 2727), **OpenAI-scored, preview, not peer-reviewed** |
| chain-of-thought.json | Verbatim endpoints (Wei et al. 2022), GSM8K PaLM-540B; dropped from pages 2 and 3 in the Act-1 redesign |
| self-consistency.json | Verbatim endpoints (Wang et al. 2022) + interpolated shape. Page 7 measures its own |
| voting-plateau.json | Self-consistency plateau shape + closed-form coverage (Brown et al. 2024). Page 7 measures its own |
| prm-vs-orm.json | Verbatim (Lightman et al. 2023), MATH. Page 9 measures its own |
| tree-of-thoughts.json | Verbatim endpoints (Yao et al. 2023), Game of 24. Page 10 draws `tot-crosswords.json` instead |
| epoch-inference-prices.json | Verbatim rates (Epoch AI data insight, **not peer-reviewed**); the /40-per-yr multiplier only |
| query-energy.json | Verbatim per-answer figures (Epoch AI, **not peer-reviewed**) plus **derived** ladder rungs; run energy is an outside **estimate** (33-60 GWh) |


### Resolved conflict — Page 18 misalignment-hint faithfulness

The two planning docs disagree on the misalignment-hint sub-figures (Explainable: 20% / 29%;
Survey: 41% / 19%). **Decision:** pending direct verification against the primary paper
(arXiv:2505.05410), the app displays ONLY the well-agreed headline rates (Claude 25%, R1 39%)
and omits the conflicting sub-figures. This is stated in-app on Page 18. If/when the primary
paper is checked, add the resolved value here and restore the sub-figure.
