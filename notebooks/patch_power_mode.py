"""Add RUN_MODE = "POWER" to page 6's notebook: the extension arm, at full power.

Why this exists as a script rather than as a hand-edit: the notebook is 127 KB of
JSON and every figure on page 6 replays through it, so an edit that silently
breaks REPLAY breaks the published page. Each replacement below asserts it
matched exactly once, and `verify_power_mode.py` then runs REPLAY end to end and
diffs `derived.json` against the committed one. A patch that changes what REPLAY
produces has failed, whatever else it did.

What POWER runs, and what it deliberately does not:

  · Section 11's wait arm ONLY, over the whole MATH-500 level 4+5 pool rather
    than the 100-item draw. The published 100 are the first 100 of the same
    seeded shuffle, so the larger set is a strict superset and the old figure is
    a nested subset of the new one.
  · Figures 1 to 3 are REPLAYED from the published traces, untouched. Their
    sweep is three times the cost of this arm and nothing we found is about
    them.

Two defects it fixes:

  1. The injection allowance manufactured breakage. Each injection bought 512
     tokens; a chain that used all 512 without offering a stop was force-answered
     exactly as the cap arm does, and the injection loop stopped. Across the
     published run that bound on 51 of 300 items, and among those the arm scored
     4 broken and 0 fixed. Truncating a model mid-revision can only cost it, so
     the arm was biased against the intervention exactly where the allowance
     bit. POWER widens the allowance and, separately, reports the paired counts
     over the subset where it never bound, so the headline no longer depends on
     the allowance being wide enough.
  2. n=100 gave a 95% CI of about +/- 7.7 points on the primary, which cannot
     support a claim about a small effect. The whole level 4+5 pool takes the
     pooled interval to roughly +/- 2.8.

Run it once; it is idempotent (it refuses to patch a notebook that already has
POWER in it).
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

NB = Path(__file__).resolve().parent / "page_06_thinking_longer.ipynb"


def cells(nb):
    return [c for c in nb["cells"] if c["cell_type"] == "code"]


def sub(nb, old: str, new: str, label: str) -> None:
    """Replace `old` with `new` in whichever code cell holds it, exactly once."""
    hits = [c for c in cells(nb) if old in "".join(c["source"])]
    if len(hits) != 1:
        raise SystemExit(
            f"[{label}] matched {len(hits)} cells, expected exactly 1. The notebook has "
            f"moved under this patch; re-read it before trusting anything here."
        )
    src = "".join(hits[0]["source"])
    if src.count(old) != 1:
        raise SystemExit(f"[{label}] matched {src.count(old)} times inside its cell, expected 1")
    hits[0]["source"] = (src.replace(old, new)).splitlines(keepends=True)
    print(f"  ok  {label}")


# --------------------------------------------------------------------------- 0
# The mode becomes settable from the environment so an unattended run is one
# command and no edit. The committed default stays REPLAY, so the repo's replay
# contract, and anyone who just opens the notebook, sees exactly what it saw.
MODE_OLD = '''RUN_MODE = "REPLAY"       # "REPLAY" (no GPU), "QUICK" (one 3B), "FULL" (three curves)'''
MODE_NEW = '''import os
# "REPLAY" (no GPU), "QUICK" (one 3B), "FULL" (three curves), "POWER" (section 11
# only, over the whole level 4+5 pool). Settable from the environment so an
# overnight run needs no edit to a file that is under version control:
#     PAGE6_RUN_MODE=POWER jupyter nbconvert --to notebook --execute ...
RUN_MODE = os.environ.get("PAGE6_RUN_MODE", "REPLAY")'''

# --------------------------------------------------------------------------- 1
KNOBS_OLD = '''    "FULL":   dict(models=CURVES_FULL, n_items=100, budgets=[128, 256, 512, 1024, 2048],
                   waits=[0, 1, 2, 3]),
}
CFG = PRESETS[RUN_MODE]
MODELS = CFG["models"]'''

KNOBS_NEW = '''    "FULL":   dict(models=CURVES_FULL, n_items=100, budgets=[128, 256, 512, 1024, 2048],
                   waits=[0, 1, 2, 3]),
    # Section 11 at full power, and nothing else. The wait arm runs over the WHOLE
    # level 4+5 pool with an allowance wide enough to stop binding; figures 1 to 3
    # are replayed from the published traces and not regenerated.
    #
    # Two things this fixes. At n=100 the primary's 95% CI on the paired delta is
    # about +/- 7.7 points, which cannot support a claim about a small effect; the
    # whole pool takes the pooled interval to roughly +/- 2.8. And the 512-token
    # allowance bound on 51 of 300 items in the published run, scoring 4 broken and
    # 0 fixed among them -- truncating a model mid-revision can only cost it, so
    # the arm was biased against the intervention exactly where the allowance bit.
    "POWER":  dict(models=CURVES_FULL, n_items=100, budgets=[128, 256, 512, 1024, 2048],
                   waits=[0, 1, 2, 3], n_wait_items=None, wait_allowance=1024),
}
CFG = PRESETS[RUN_MODE]
MODELS = CFG["models"]

# Which arms this mode GENERATES, as opposed to reads back. Spelled out because
# POWER is the first mode that does one of each, and "not REPLAY" stopped being a
# usable test for either the moment that was true.
GENERATES_BUDGETS = RUN_MODE in ("QUICK", "FULL")     # the sweep behind figures 1 to 3
GENERATES_WAITS = RUN_MODE in ("QUICK", "FULL", "POWER")   # section 11's arm
REPLAYS_BUDGETS = not GENERATES_BUDGETS'''

# --------------------------------------------------------------------------- 2
ALLOW_OLD = '''WAIT_ALLOWANCE = 512       # tokens each injection buys; k=0 gets MAX_BUDGET instead,
                           # because k=0 is the model left alone and must match the
                           # top of the sweep above rather than being capped again'''

ALLOW_NEW = '''WAIT_ALLOWANCE = CFG.get("wait_allowance", 512)
                           # tokens each injection buys; k=0 gets MAX_BUDGET instead,
                           # because k=0 is the model left alone and must match the
                           # top of the sweep above rather than being capped again.
                           #
                           # This is OUR cap, not the model's behaviour, and when it
                           # binds the record is force-answered and graded like any
                           # truncation -- which can only ever cost the intervention
                           # marks. Section 11 reports the paired counts twice, once
                           # over everything and once over the items where it never
                           # bound, so the headline does not rest on this number
                           # being generous enough.

# How many items the WAIT arm runs over. None means the whole band. The budget arm
# keeps its own `n_items`, and because both are prefixes of one seeded shuffle the
# smaller set is a strict subset of the larger.
N_WAIT_ITEMS = CFG.get("n_wait_items", CFG["n_items"])'''

# --------------------------------------------------------------------------- 3
ITEMS_OLD = '''ITEM_SET_HASH = harness.sha256_of(r["unique_id"] for r in items)'''

ITEMS_NEW = '''# The wait arm's set. `band` is one seeded shuffle and both arms take a prefix of
# it, so the budget arm's items are the first `len(items)` of these: the smaller
# figure is a nested subset of the larger rather than a different sample.
wait_items = band[: (len(band) if N_WAIT_ITEMS is None else N_WAIT_ITEMS)]
assert len(wait_items) >= len(items), \\
    f"the wait arm asks for {len(wait_items)} items and the budget arm for {len(items)}"
assert [r["unique_id"] for r in wait_items[: len(items)]] == [r["unique_id"] for r in items], \\
    "the two arms' item sets are not nested; one of them was drawn differently"

ITEM_SET_HASH = harness.sha256_of(r["unique_id"] for r in items)
WAIT_ITEM_SET_HASH = harness.sha256_of(r["unique_id"] for r in wait_items)
if len(wait_items) != len(items):
    print(f"wait arm: {len(wait_items)} of {len(band)} available   "
          f"sha256 {WAIT_ITEM_SET_HASH[:12]}   (the budget arm's {len(items)} are a subset)")'''

# --------------------------------------------------------------------------- 4
REPLAY_GATE_OLD = '''results, model_meta, SWEPT = {}, {}, []

if RUN_MODE == "REPLAY":'''
REPLAY_GATE_NEW = '''results, model_meta, SWEPT = {}, {}, []

# POWER replays this arm and generates the other, so the test is which arm rather
# than which mode.
if REPLAYS_BUDGETS:'''

WAITRAW_OLD = '''    # Section 11's arm keys on `waits` rather than on a budget and is read back whole.
    WAIT_RAW = [r for r in raw if r.get("arm") == "wait" and r["problem_id"] in want
                and r["model_id"] in roster and r["waits"] in set(WAITS)]'''
WAITRAW_NEW = '''    # Section 11's arm keys on `waits` rather than on a budget and is read back whole
    # -- unless this mode is regenerating it, in which case reading the old records
    # back would mix two injection allowances into one curve.
    WAIT_RAW = [] if GENERATES_WAITS else [
        r for r in raw if r.get("arm") == "wait" and r["problem_id"] in want
        and r["model_id"] in roster and r["waits"] in set(WAITS)]'''

REPLAY_ELSE_OLD = '''else:
    WAIT_RAW = []
    print(f"{RUN_MODE}: generations are made below")'''
REPLAY_ELSE_NEW = '''else:
    WAIT_RAW = []
    print(f"{RUN_MODE}: generations are made below")'''  # unchanged, kept for the assert

# ------------------------------------------------------- 5: budget-only gates
BUDGET_ONLY = [
    ('''if RUN_MODE != "REPLAY":
    demo = items[0]''', '''if GENERATES_BUDGETS:
    demo = items[0]''', "figure 1 demo"),
    ('''if RUN_MODE != "REPLAY":
    PILOT_N = min(30 if RUN_MODE == "FULL" else 10, len(items))''',
     '''if GENERATES_BUDGETS:
    PILOT_N = min(30 if RUN_MODE == "FULL" else 10, len(items))''', "pilot"),
    ('''if RUN_MODE != "REPLAY":
    _worst = len(items) * sum(BUDGETS)''', '''if GENERATES_BUDGETS:
    _worst = len(items) * sum(BUDGETS)''', "the budget sweep"),
    ('''if RUN_MODE != "REPLAY":
    SOFT_N = min(20, len(items))''', '''if GENERATES_BUDGETS:
    SOFT_N = min(20, len(items))''', "the soft-request arm"),
    ('''if RUN_MODE != "REPLAY":
    # The other curves, one resident at a time''',
     '''if GENERATES_BUDGETS:
    # The other curves, one resident at a time''', "the other two curves"),
]

# ------------------------------------------------ 6: run ids and the trace store
RUNID_OLD = '''if RUN_MODE != "REPLAY":
    # The run id keys the resume cache, so it names everything that changes the
    # numbers: without dtype and device, a CPU run and a later GPU run would merge
    # into one curve stitched from two numeric regimes.
    RUN_ID = (f"{RUN_MODE.lower()}-{DATASET}-n{len(items)}-{ITEM_SET_HASH[:8]}"
              f"-cap{MAX_BUDGET}-{str(DTYPE).rsplit('.', 1)[-1]}-{device.type}")


    # The run id says `cuda`, not which card. Greedy argmax is deterministic only up
    # to floating-point reduction order, and that order changes with the architecture,
    # so two GPUs appending under one run id would resume each other and stitch two
    # numeric regimes into one curve. The id cannot see that; this can.
    GPU_NAME = (torch.cuda.get_device_name(0) if device.type == "cuda" else device.type)
    if MANIFEST_PATH.exists() and TRACES_PATH.exists():
        _was = json.loads(MANIFEST_PATH.read_text()).get("versions", {}).get("gpu")
        assert _was in (None, GPU_NAME), (
            f"out/page_06 holds a run made on {_was!r} and this is {GPU_NAME!r}. Records "
            f"from two cards under one run id do not belong in one curve. Move the old "
            f"out/page_06 aside to start a fresh run here, or finish this one where it "
            f"started.")
    print(f"generating on {GPU_NAME}")'''

# GPU_NAME and the card check move OUT of the budget-only gate, in one span so the
# two halves cannot end up on opposite sides of it.
#
# Why it matters: POWER generates without sweeping budgets, and the manifest cell
# in the very last cell of the notebook reads `GPU_NAME if RUN_MODE != "REPLAY"`.
# Left inside the budget gate, POWER raises NameError there, after every
# generation has been made and none of it written out. The card check is not a
# budget-arm concern either: two GPUs resuming each other stitches two numeric
# regimes into one curve, which is as true of this arm as of the sweep.
RUNID_NEW = '''# The run id says `cuda`, not which card. Greedy argmax is deterministic only up
# to floating-point reduction order, and that order changes with the architecture,
# so two GPUs appending under one run id would resume each other and stitch two
# numeric regimes into one curve. The id cannot see that; this can. Every mode
# that generates anything checks it, POWER included, which is why this sits above
# the budget arm's gate rather than inside it.
if GENERATES_WAITS:
    GPU_NAME = (torch.cuda.get_device_name(0) if device.type == "cuda" else device.type)
    if MANIFEST_PATH.exists() and TRACES_PATH.exists():
        _was = json.loads(MANIFEST_PATH.read_text()).get("versions", {}).get("gpu")
        assert _was in (None, GPU_NAME), (
            f"out/page_06 holds a run made on {_was!r} and this is {GPU_NAME!r}. Records "
            f"from two cards under one run id do not belong in one curve. Move the old "
            f"out/page_06 aside to start a fresh run here, or finish this one where it "
            f"started.")
    print(f"generating on {GPU_NAME}")

if GENERATES_BUDGETS:
    # The run id keys the resume cache, so it names everything that changes the
    # numbers: without dtype and device, a CPU run and a later GPU run would merge
    # into one curve stitched from two numeric regimes.
    RUN_ID = (f"{RUN_MODE.lower()}-{DATASET}-n{len(items)}-{ITEM_SET_HASH[:8]}"
              f"-cap{MAX_BUDGET}-{str(DTYPE).rsplit('.', 1)[-1]}-{device.type}")'''

STORE_OLD = '''    STORE = harness.TraceStore(TRACES_PATH, RUN_ID, ("model_id", "budget", "problem_id"))
    STORE.report()
    DONE = STORE.done'''

STORE_NEW = '''    STORE = harness.TraceStore(TRACES_PATH, RUN_ID, ("model_id", "budget", "problem_id"))
    STORE.report()
    DONE = STORE.done'''  # unchanged

# The wait arm gets its own run id and its own file. Its own file, because the
# replay above adopts the MOST COMMON run id in traces.jsonl, and a wait arm over
# the whole pool would outnumber the published budget records and hijack it.
WAIT_STORE_ANCHOR = '''WAIT_RESULTS = {}

if RUN_MODE != "REPLAY":'''

WAIT_STORE_NEW = '''WAIT_RESULTS = {}

# Where this arm's records go. ONLY POWER diverges, and it diverges in both the
# run id and the file:
#
#   · its own RUN ID, because the injection allowance changes what a generation
#     is, and records made under two allowances must never merge into one curve;
#   · its own FILE, because the replay cell adopts the MOST COMMON run id in
#     traces.jsonl, and an arm over the whole pool would outnumber the published
#     budget records and hijack it.
#
# Every other mode keeps exactly what it had: the arm shares the sweep's run id
# and writes through the sweep's store. Giving them a separate id would strand
# their wait records where REPLAY does not look for them, and a separate store
# over traces.jsonl would key budget records on a `waits` field they do not have.
if GENERATES_WAITS:
    if RUN_MODE == "POWER":
        WAIT_RUN_ID = (f"power-wait-{DATASET}-n{len(wait_items)}"
                       f"-{WAIT_ITEM_SET_HASH[:8]}-k{max(WAITS)}-a{WAIT_ALLOWANCE}"
                       f"-cap{MAX_BUDGET}-{str(DTYPE).rsplit('.', 1)[-1]}-{device.type}")
        WAIT_TRACES_PATH = OUT_DIR / "traces_wait_power.jsonl"
    else:
        WAIT_RUN_ID, WAIT_TRACES_PATH = RUN_ID, TRACES_PATH
    print(f"wait arm -> {WAIT_TRACES_PATH.name}\\n  run id {WAIT_RUN_ID}")

if GENERATES_WAITS:'''

WAIT_DONE_OLD = '''    WAIT_DONE = {}
    if TRACES_PATH.exists():
        for _line in TRACES_PATH.open(encoding="utf-8"):
            if _line.strip():
                _r = json.loads(_line)
                if _r.get("run_id") == RUN_ID and _r.get("arm") == "wait":
                    WAIT_DONE[(_r["model_id"], _r["waits"], _r["problem_id"])] = _r'''

WAIT_DONE_NEW = '''    WAIT_DONE = {}
    if WAIT_TRACES_PATH.exists():
        for _line in WAIT_TRACES_PATH.open(encoding="utf-8"):
            if _line.strip():
                _r = json.loads(_line)
                if _r.get("run_id") == WAIT_RUN_ID and _r.get("arm") == "wait":
                    WAIT_DONE[(_r["model_id"], _r["waits"], _r["problem_id"])] = _r
    # POWER writes through its own store; every other mode writes through the
    # sweep's, exactly as before. A TraceStore over traces.jsonl keyed on `waits`
    # would raise on the budget records, which have no such field.
    WAIT_STORE = (harness.TraceStore(WAIT_TRACES_PATH, WAIT_RUN_ID,
                                     ("model_id", "waits", "problem_id"))
                  if RUN_MODE == "POWER" else STORE)
    if WAIT_DONE:
        print(f"resuming: {len(WAIT_DONE):,} wait records already on disk for this "
              f"configuration")'''

WAIT_APPEND_OLD = '''                rec = STORE.append(rec)'''
WAIT_APPEND_NEW = '''                rec = WAIT_STORE.append(rec)'''

WAIT_ROWS_OLD = '''    for _mid, _quant in [(m, q) for m, q in MODELS if m in results]:
        _mdl, _tok, _n, _t = load(_mid, _quant)
        WAIT_RESULTS[_mid] = run_wait_pass(_mid, _mdl, _tok, items)
        del _mdl
        free_memory()'''

WAIT_ROWS_NEW = '''    # In POWER the first checkpoint is already resident from the load cell, but the
    # budget sweep that used to drop it never ran, so every model is loaded here.
    for _mid, _quant in [(m, q) for m, q in MODELS]:
        _mdl, _tok, _n, _t = load(_mid, _quant)
        WAIT_RESULTS[_mid] = run_wait_pass(_mid, _mdl, _tok, wait_items)
        del _mdl
        free_memory()'''

WAIT_COST_OLD = '''    _mean_top = mean([r["own_tokens"] for r in results[PRIMARY][MAX_BUDGET]])
    _likely = len(items) * (_mean_top + max(WAITS) * WAIT_ALLOWANCE * 0.6)
    _worst = len(items) * (MAX_BUDGET + max(WAITS) * WAIT_ALLOWANCE)'''

WAIT_COST_NEW = '''    _mean_top = mean([r["own_tokens"] for r in results[PRIMARY][MAX_BUDGET]])
    _likely = len(wait_items) * (_mean_top + max(WAITS) * WAIT_ALLOWANCE * 0.6)
    _worst = len(wait_items) * (MAX_BUDGET + max(WAITS) * WAIT_ALLOWANCE)'''

WAIT_COST2_OLD = '''    print(f"k=0 alone costs about {len(items) * _mean_top:,.0f} tokens per model, the same "'''
WAIT_COST2_NEW = '''    print(f"k=0 alone costs about {len(wait_items) * _mean_top:,.0f} tokens per model, the same "'''

# ------------------------------------------ 7: the clean subset, and the gate
PAIRED_OLD = '''        WAIT_PAIRED[mid].append(dict(waits=k, fixed=n_fixed, broken=n_broken,
                                     p=p_value, n=len(pids),
                                     fixed_ids=fixed, broken_ids=broken))'''

PAIRED_NEW = '''        # The same counts over the items where OUR injection allowance never bound.
        # When it binds the record is force-answered and graded like any truncation,
        # which can only cost the intervention marks: in the published run that was
        # 4 broken and 0 fixed across 51 such items, a one-directional artefact of a
        # number we chose. Reported beside the headline rather than instead of it,
        # so a reader can see how much of the result is ours.
        clean = [p for p in pids
                 if not by_k[k][p]["forced"] and not base[p]["forced"]
                 and by_k[k][p].get("carried_from") is None]
        c_fixed, c_broken, c_p = harness.mcnemar(
            {q: by_k[k][q]["correct"] for q in clean},
            {q: base[q]["correct"] for q in clean})
        WAIT_PAIRED[mid].append(dict(waits=k, fixed=n_fixed, broken=n_broken,
                                     p=p_value, n=len(pids),
                                     fixed_ids=fixed, broken_ids=broken,
                                     clean=dict(n=len(clean), fixed=c_fixed,
                                                broken=c_broken, p=c_p,
                                                excluded=len(pids) - len(clean))))'''

CHECKS_OLD = '''    # How often there was a stop to suppress at all: a model that never offers one
    # cannot be extended, and its later k are carried rather than generated.'''

CHECKS_NEW = '''    # 5. how often OUR allowance bound. This is the one number in the arm that is a
    #    property of the harness rather than of the model, and it is one-directional:
    #    a chain truncated mid-revision is graded on a forced answer, which can only
    #    cost the intervention marks. Section 15 reports the paired counts with these
    #    items excluded as well as included.
    _kmax = max(WAITS)
    _bound = {mid: mean([r["forced"] for r in rs if r["waits"] == _kmax])
              for mid, rs in WAIT_RESULTS.items()}
    WAIT_CHECKS["allowance_bound_at_kmax"] = _bound
    print(f"5. our {WAIT_ALLOWANCE}-token allowance bound ... "
          + ", ".join(f"{m.split('/')[-1]}={v:.0%}" for m, v in _bound.items()))
    if max(_bound.values(), default=0) > 0.10:
        print(f"   Over 10% on some checkpoint. The headline reads the `clean` counts, so this")
        print(f"   is not a lie, but raise `wait_allowance` in the preset if you want it small.")

    # How often there was a stop to suppress at all: a model that never offers one
    # cannot be extended, and its later k are carried rather than generated.'''

# ------------------------------------------------------------ 8: derived.json
DERIVED_OLD = '''    "figure_wait": None if not WAIT_CURVES else {
        "waits": WAITS,
        "word": WAIT_WORD,'''

DERIVED_NEW = '''    "figure_wait": None if not WAIT_CURVES else {
        "waits": WAITS,
        "word": WAIT_WORD,
        # This arm's own item set and its own cap, which after POWER are no longer
        # the budget arm's. The page prints the count it actually measured.
        "n_items": len(wait_items),
        "item_set_sha256": WAIT_ITEM_SET_HASH,
        "allowance": WAIT_ALLOWANCE,
        "budget_arm_n_items": len(items),'''

MANIFEST_OLD = '''        "allowance": WAIT_ALLOWANCE,'''
MANIFEST_NEW = '''        "allowance": WAIT_ALLOWANCE,
        "n_items": len(wait_items),
        "item_set_sha256": WAIT_ITEM_SET_HASH,'''


def main() -> int:
    nb = json.loads(NB.read_text(encoding="utf-8"))
    if any('"POWER"' in "".join(c["source"]) for c in cells(nb)):
        print("notebook already carries POWER mode; nothing to do")
        return 0

    print("patching", NB.name)
    sub(nb, MODE_OLD, MODE_NEW, "RUN_MODE from the environment")
    sub(nb, KNOBS_OLD, KNOBS_NEW, "POWER preset and the arm flags")
    sub(nb, ALLOW_OLD, ALLOW_NEW, "wait allowance and item count from the preset")
    sub(nb, ITEMS_OLD, ITEMS_NEW, "the wait arm's item set")
    sub(nb, REPLAY_GATE_OLD, REPLAY_GATE_NEW, "budget replay gate")
    sub(nb, WAITRAW_OLD, WAITRAW_NEW, "do not read back an arm we are regenerating")
    for old, new, label in BUDGET_ONLY:
        sub(nb, old, new, label)
    sub(nb, RUNID_OLD, RUNID_NEW, "budget run id")
    sub(nb, WAIT_STORE_ANCHOR, WAIT_STORE_NEW, "wait run id and its own file")
    sub(nb, WAIT_DONE_OLD, WAIT_DONE_NEW, "wait resume map and store")
    sub(nb, WAIT_APPEND_OLD, WAIT_APPEND_NEW, "wait records go to the wait store")
    sub(nb, WAIT_ROWS_OLD, WAIT_ROWS_NEW, "wait arm runs over wait_items")
    sub(nb, WAIT_COST_OLD, WAIT_COST_NEW, "cost estimate over wait_items")
    sub(nb, WAIT_COST2_OLD, WAIT_COST2_NEW, "cost print over wait_items")
    sub(nb, PAIRED_OLD, PAIRED_NEW, "the clean-subset paired counts")
    sub(nb, CHECKS_OLD, CHECKS_NEW, "check 5, how often our allowance bound")
    sub(nb, DERIVED_OLD, DERIVED_NEW, "derived.json carries the arm's own n")
    sub(nb, MANIFEST_OLD, MANIFEST_NEW, "manifest carries the arm's own n")

    NB.write_text(json.dumps(nb, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"\nwrote {NB}")
    print("now run:  python notebooks/verify_power_mode.py")
    return 0


if __name__ == "__main__":
    sys.exit(main())
