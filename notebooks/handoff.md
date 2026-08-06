# Handoff — page 5 ablations

Supersedes the 2026-08-04 handoff (page 5/6 notebook state), which is in git history and is now
stale in most particulars. This one covers the ablation programme that replaced it.

**Context in one paragraph.** Page 5 ("How to Reason") was meant to reproduce chain-of-thought:
bare prompt blurts, add the magic words, a chain appears. That premise failed on every
instruction-tuned checkpoint we tried, because a 2026 instruct model reasons on a maths question
unprompted. Three ablations later, the page's live claim is the *reverse* experiment — the model
reasons by default, and **suppressing** the reasoning costs 40 to 70 accuracy points. The
ablations exist to pick the instrument that shows that most clearly, and to size the effect at a
sample large enough to resolve it.

---

## 1. The most recent run — complete

`experiment_3_prompt_ladder_at_n100.ipynb`. **Finished: 2,800 records, all unique, 3h40m.**
Artifacts in `notebooks/out/experiment_3/` (`traces.jsonl`, `derived.json`, `tables.md`,
`figure_experiment_3.png`).

| | |
|---|---|
| script | `scratchpad/run_exp3.py` (execs the notebook's code cells in order) |
| output | `notebooks/out/experiment_3/` |
| target | **2,800 generations** = 4 models x 2 item sets x 4 conditions x 100 paired items |
| runtime | 3h40m as run; the 8-bit 7B was most of it |

**Roster.** `Qwen2-1.5B-Instruct`, `Qwen2.5-1.5B-Instruct`, `Qwen2.5-3B-Instruct` (all bf16), and
`Qwen2.5-7B-Instruct` at 8-bit. General/instruct only — no math-tuned models, which are the
subject of experiment 4 below.

**Item sets.** `gsm8k` (n=100) and `math500_l45` (MATH-500 levels 4-5, n=100). Same items for
every model, so every comparison is paired. `math500_l3` is available by adding it to
`DATASETS_USED`.

**Conditions.** `forced_blurt`, `bare`, `zero_shot_cot`, `few_shot` (k=2).

**One deliberate hole:** `Qwen2.5-7B` skips GSM8K (`skip_datasets=["gsm8k"]` on its roster entry).
It scored 90% bare there at n=20 and GSM8K ships no harder band, so that pass would have measured
a ceiling for 40 minutes.

### Check on it like this

```bash
ps -eo pid,cmd | grep "[.]venv/bin/python.*run_exp3"     # must be exactly ONE
python3 -c "
import json,collections
r=[json.loads(l) for l in open('out/experiment_3/traces.jsonl') if l.strip()]
k={(x['tag'],x['dataset'],x['condition'],x['problem_id']) for x in r}
print(len(r),'lines',len(k),'unique')      # these MUST be equal
print(collections.Counter(x['tag'] for x in r))"
```

---

## 2. What has been run

All under `notebooks/out/`. Every run is a `traces.jsonl` keyed by `run_id`, plus a
`derived.json`; experiment 3 also writes `tables.md`.

| run | notebook | records | what it settled |
|---|---|---|---|
| `page_05_selection` | `experiment_1_which_checkpoints_blurt.ipynb` | 1,080 | 9 checkpoints x 2 datasets x 3 conditions, n=20. Found that no model blurts on a bare prompt, and that **all of them do when told to** |
| `experiment_2` | `experiment_2_suppression_cost_and_specialisation.ipynb` | 1,440 | 9 checkpoints, matched general/math pairs, 4 conditions, n=20. Sized suppression and specialisation |
| `experiment_3` | `experiment_3_prompt_ladder_at_n100.ipynb` | 2,800 | the same effects at n=100. Suppression significant in 7/7 cells off the floor; asking significant only where the model has headroom |
| `page_05` | `page_05_how_to_reason.ipynb` | 344 | abandoned Qwen3 runs; kept as the record of why the original premise failed |

### Findings that are settled

- **No instruct model blurts unprompted.** 0 of 200 bare responses under 60 tokens; chain share
  100% in every cell, across Qwen2, Qwen2.5, Qwen2.5-Coder and Qwen3 (including `/no_think`).
- **All general models blurt when instructed**, and collapse: 100% compliance, median 6 tokens,
  **40 to 70 points** of accuracy lost. This is page 5's headline.
- **Math-tuned models refuse the instruction.** Qwen2-Math-1.5B, Qwen2.5-Math-1.5B and
  Qwen2.5-Math-7B all show **0% compliance** and no accuracy change. Qwen2-Math-7B is the lone
  exception. This is experiment 4's headline.
- **Elicitation is small and headroom-bound.** Median gain from asking for CoT: **+5 pts**. From
  showing an example: **+5 pts**. Against suppression's **+48**. The few-shot gain correlates
  **-0.79** with bare accuracy — prompting cannot move a model already near the ceiling.
- **"Explain step by step" decays with capability and difficulty, it does not simply die.** At
  n=100 it is worth **+23 pts (p=0.0003)** to Qwen2.5-1.5B on GSM8K, **+11 (p=0.019)** to the 3B,
  and **nothing** to the 3B or 7B on MATH L4-5. A claim that it "does nothing" is true of the
  cell it is quoted from and false of its neighbour — this was got wrong once and must not be
  repeated in a caption.
- **Band must be matched to model.** MATH L4-5 *floors* Qwen2-1.5B (bare 7%, blurt 6% — no ladder
  at all). MATH L3 is the right band for 1.5B models; L4-5 for 3B and up. GSM8K ceilings the 7B.

---

## 3. How to document an ablation

**Tables and figures are first-class output, not something derived afterwards in an ad-hoc
script.** `experiment_3_prompt_ladder_at_n100.ipynb` is the reference implementation: it prints each table and writes
all of them to `out/experiment_3/tables.md` in paste-ready markdown. Follow that pattern.

Four tables, in this order:

**Table 1 — the prompt ladder.** One row per (model, condition), per dataset.
`model | prompt | solved | 95% CI | tokens | steps | chain`

**Table 2 — what each prompt change is worth.** The important one. Paired contrasts with an
**exact McNemar test**, because at these sample sizes the eye cannot tell a finding from noise.
`model | dataset | change | delta | flips +/- | p | verdict`
Contrasts: suppression (blurt vs bare), asking (bare vs cot), showing (bare vs few-shot).

**Table 3 — format compliance.** `model | dataset | prompt | boxed | truncated | answered in <=40 tok`

**Table 4 — headroom.** `model | dataset | bare | room above bare | few-shot gain | suppression cost`

**Figure**: grouped bars, one panel per dataset, one colour per condition, 95% Wilson error bars.
A cell that was not run must leave a **gap**, never a zero bar — a reader takes a zero bar for a
score of nought.

Rules that apply to all of it: report *n* on every table; intervals are 95% Wilson; paired
comparisons use McNemar over discordant items only; a single-cell result at n<=20 is noise and
must not be reported as a finding (this was got wrong twice).

---

## 4. What experiment 3 should deliver

1. **The suppression effect at a resolvable n.** Expected 40-70 points with p well under 0.05.
   This is the number page 5 is built on.
2. **A defensible null on "explain step by step."** At n=100 the interval is tight enough to say
   the magic words stopped working, rather than shrug at noise. That is a finding in its own right
   for a page about chain of thought.
3. **The few-shot effect where headroom exists.** Expected large on the 1.5Bs at their right band,
   near zero for the 7B.
4. **Which model and band page 5 should use.** The candidate is Qwen2.5-1.5B, which at n=20 gave a
   monotone four-rung ladder on MATH L3: 0% -> 35% -> 55% -> 75%.
5. **Whether Qwen2.5-7B has headroom on MATH L4-5**, which has never been measured.

---

## 5. What comes next

### 5a. Backfill: Qwen2-7B on MATH L4-5

A standalone run, to be merged with experiment 3. `Qwen2-7B-Instruct` has never been measured on
levels 4-5, so the Qwen2 generation currently has no 7B point at the band where the 3B and 7B
comparisons live. Same conditions, same 100 items, same `RUN_ID` scheme; merge into experiment 3's
tables afterwards.

### 5b. Experiment 4 — the reasoning models

**Objective.** Show that when *how to reason* is baked into the weights, a small specialised model
outperforms a much larger general one. The comparison targets are `Qwen2.5-7B-Instruct` and
`Qwen2-7B-Instruct`, whose numbers come from experiment 3 and the 5a backfill.

**Roster**, four models across two generations:

| model | quant |
|---|---|
| `Qwen2-Math-1.5B-Instruct` | bf16 |
| `Qwen2.5-Math-1.5B-Instruct` | bf16 |
| `Qwen2-Math-7B-Instruct` | 8-bit |
| `Qwen2.5-Math-7B-Instruct` | 8-bit |

Four rather than two **so the generation that shows the message most clearly can be chosen from
data**. Experiment 2 already hints they differ: three of the four ignore a blurt instruction
outright while Qwen2-Math-7B complies with it fully.

**Item sets.** MATH-500 **levels 3, 4 and 5**, as three separate bands so the difficulty axis is
visible. Level 3 has only 105 problems, so **n=100 is the ceiling** and all bands should use it
for comparability. Levels 4-5 hold 262.

**Conditions.** Keep `forced_blurt` — it is the condition that produces experiment 2's best
result, that these models refuse to obey. `bare` and `few_shot` as the ladder.

**Known constraint:** all four Math checkpoints have a **4,096-token context**, prompt included,
against 32k for the general models. Clip the cap per model from `model.config`; the sweep in
experiment 3 already does this.

**The comparison to draw**, per generation:

```
Qwen2-Math-1.5B      vs  Qwen2-7B-Instruct     (4.7x smaller)
Qwen2.5-Math-1.5B    vs  Qwen2.5-7B-Instruct   (4.7x smaller)
```

scored twice — against the general model **suppressed** and against it **reasoning**. The second
is the honest number; at n=20 it ran +0 to +55 in the math model's favour. If a math model only
wins against a gagged opponent the claim is much weaker and the page must say so.

---

## 6. Environment and gotchas

- **venv is uv-managed**, not pip: `VIRTUAL_ENV=notebooks/.venv uv pip install <pkg>`.
  `notebooks/.venv/bin/python` has no `pip` module.
- transformers 5.14.1, torch 2.10+cu128, hub 1.26, bitsandbytes 0.50. **RTX 5080, 16 GB.**
  A 7B at bf16 is 15.24 GB and will not fit — use 8-bit. Quantisation is constant within a model,
  so it does not affect within-model prompt contrasts, only cross-model accuracy.
- `harness.py` is shared plumbing and ships with each notebook. `harness.complete` does raw
  completion with stop strings; `harness.generate` applies a chat template.

**Traps already hit, do not repeat:**

- **`TraceStore` has no write lock.** Two processes on the same `run_id` silently produce duplicate
  records and double-counted aggregates. This happened: four concurrent workers, 818 duplicates.
  **Always verify `len(lines) == len(unique keys)` before building any table.**
- **Verify a kill actually killed it.** `$!` from a backgrounded compound command is not
  necessarily the Python PID. Use `pkill -f <script>` then confirm with `ps -eo pid,cmd`.
- **Exemplars must match the answer format the stem asks for.** GSM8K reference solutions carry no
  `\boxed{}` while ch03's stem demands one; few-shot works by imitation, so that conflict flipped
  55% of one model's responses out of the required format. `experiment_3_prompt_ladder_at_n100.ipynb` appends
  `The final answer is $\boxed{...}$` to any exemplar lacking it, and asserts none slip through.
- **Unboxed answers score badly** — 74% correct when boxed, 29% when not, across 1,440 responses —
  because extraction falls back to the last number in the trace. Track the boxed rate.
- **Strip empty `<think></think>` blocks before counting steps.** Qwen3 under `/no_think` emits
  them and they inflated every step count by one.
- **Long unattended runs need a suspend inhibitor.** GNOME idles to suspend after 2 h regardless of
  GPU load: `nohup systemd-inhibit --what=idle:sleep --why="run" sleep 6h >/dev/null 2>&1 &`
- **The step rule counts formatting, not reasoning.** Splitting on sentences and paragraphs means
  a display equation is its own step, so "chain share" is really "more than one sentence". It is
  fine as a blurt detector and useless as a reasoning measure. Do not report it as the latter.
