# Page 6, section 11 at full power: the runbook

Section 11 is the extension arm, the one that appends `Wait` and refuses to let the
model stop. This run does that arm, and only that arm, over the whole MATH-500
level 4+5 pool instead of the 100-item draw.

**Figures 1 to 3 are not regenerated.** Their sweep is three times the cost of this
arm and nothing we found is about them; POWER replays them from the published
traces byte for byte.

## Why it is being run

Two defects, one real and one structural.

**The injection allowance manufactured breakage.** Each injection buys
`WAIT_ALLOWANCE` tokens. A chain that used all of them without offering a stop was
force-answered exactly as the cap arm does, and the injection loop stopped there.
On the published run that bound on 51 of 300 items, and among those the arm scored
**4 broken against 0 fixed**. Truncating a model mid-revision can only cost it
marks, so the arm was biased against the intervention precisely where our own cap
bit. It barely touches the 3B, but it flips the 1.5B's sign: −2.0 points as
published, **+2.8** on the items that actually received all three injections.

**n=100 cannot support the claim the page makes.** The primary's 95% CI on the
paired delta is about ±7.7 points. The page reads as "no effect"; the data supports
"no effect larger than we could see." The whole pool takes the pooled interval to
roughly ±2.8.

Note what that does *not* buy: detecting a +5 point gain at 80% power needs 486
items per checkpoint, and the level 4+5 pool holds ~262. No run of this population
settles a small effect. The load-bearing claims should be the mechanism ones, which
are already significant at n=300 (the injection fires on 94% of occasions; the
model revises 49% of the time when wrong against 22% when right, p = 2e-06; and
when it revises from wrong it lands right 24% of the time, CI [16%, 34%]).

## Before starting

```bash
python notebooks/verify_power_mode.py        # no name is read before it is bound, per mode
python notebooks/check_wait_clean_subset.py  # the new statistics match the published traces
```

Both must pass. The first exists because this machine has no `torch`, so the
notebook cannot be executed to find a `NameError` that would otherwise surface
three hours in, after every generation is made and none of it written out.

Confirm the item pool is the size we think it is, since every estimate below scales
with it:

```bash
python -c "from reasoning_from_scratch.ch03 import load_math500; d=load_math500(); print(sum(1 for r in d if int(r['level']) in (4,5)), 'items at levels 4-5')"
```

`out/page_06/traces.jsonl` and `manifest.json` must be present, from the published
bundle at `web/public/notebooks/page-06-thinking-longer.zip`. POWER reads the
budget arm from them and asserts the GPU matches the one in the manifest
(`NVIDIA GeForce RTX 5080`), because two cards resuming each other stitches two
floating-point regimes into one curve.

## Starting it

```bash
cd notebooks && PAGE6_RUN_MODE=POWER jupyter nbconvert --to notebook --execute --ExecutePreprocessor.timeout=-1 --output out/page_06_POWER_run.ipynb page_06_thinking_longer.ipynb
```

The committed notebook still defaults to `REPLAY`; the mode comes from the
environment so an unattended run needs no edit to a version-controlled file, and
the executed copy with its outputs lands in `out/` rather than over the original.

## What it writes

- `out/page_06/traces_wait_power.jsonl` — new, and the only file it appends to.
  Its own file because the replay cell adopts the *most common* run id in
  `traces.jsonl`, and an arm over the whole pool would outnumber the published
  budget records and hijack it. **The published traces are not touched.**
- `out/page_06/derived.json` and `manifest.json` — rewritten at the end.

## If it dies

It resumes. The wait store keys on `(model_id, waits, problem_id)` under a run id
that names the item count, the injection count, the allowance, the dtype and the
device, so re-running the same command picks up where it stopped and regenerates
nothing. A run id that differs in any of those is a different experiment and will
not resume into the old one, by design.

## Expected cost

Measured from the published traces: the wait arm at n=100 across three checkpoints
generated 353,044 tokens. Scaling to ~262 items and widening the allowance from
512 to 1024 puts this near **1.1M tokens**. The published FULL run implies roughly
110 tok/s blended on this card, which gives about **3 hours**, but the 8-bit 7B is
the wildcard: bitsandbytes int8 commonly runs 2 to 4× slower per token than bf16
and it carries a third of the arm. Budget 3 to 5 hours and do not plan around the
optimistic end.

## Reading it afterwards

`derived.json` gains, per checkpoint and injection count:

- `figure_wait.n_items`, `item_set_sha256`, `allowance`, `budget_arm_n_items`
- `figure_wait.curves[].paired[].clean` — `{n, fixed, broken, p, excluded}`, the
  counts over items where the allowance never bound

and `figure_wait.integrity.allowance_bound_at_kmax`, the share of items where it
still bit. If that is small, the headline and the clean counts should agree and the
distinction stops mattering. If it is not, **the page should quote the clean
counts**, and say how many items were set aside and why.

The page will need edits either way: section 4 currently says "the same 100
problems" and its closing line says "rescues 20 problems and wrecks 26", which is
the contaminated aggregate.
