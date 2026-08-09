"""Pin the clean-subset arithmetic POWER adds to section 11, against the published run.

The patch inserts one new statistical block into the notebook: the paired counts
recomputed over the items where OUR injection allowance never bound. That block
cannot be checked by executing the notebook here, because this machine has no
torch, and it cannot be checked by reading it, because it is the kind of filter
that is wrong in a way that still produces plausible numbers.

So it is reimplemented here against the published `traces.jsonl` and pinned to
values derived independently. If the notebook's version and this one ever
disagree, one of them has drifted.

What the numbers mean. Each injection buys `WAIT_ALLOWANCE` tokens. A chain that
uses all of them without offering a stop is force-answered exactly as the cap arm
does, and the injection loop stops. That is our harness, not the model, and it is
one-directional: truncating a model mid-revision can only cost it marks. On the
published run it bound on 51 of 300 items and scored 4 broken against 0 fixed
among them.

    python notebooks/check_wait_clean_subset.py
"""
from __future__ import annotations

import ast
import json
import math
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BUNDLE = ROOT / "web" / "public" / "notebooks" / "page-06-thinking-longer.zip"
HARNESS = "page-06-thinking-longer/harness.py"
TRACES = "page-06-thinking-longer/out/page_06/traces.jsonl"

MODELS = [
    "Qwen/Qwen2.5-1.5B-Instruct",
    "Qwen/Qwen2.5-3B-Instruct",
    "Qwen/Qwen2.5-7B-Instruct",
]

# Derived independently from the traces, before the notebook block was written.
# (model, all-n, all-fixed, all-broken, clean-n, clean-fixed, clean-broken)
EXPECTED = {
    "Qwen/Qwen2.5-1.5B-Instruct": (100, 7, 9, 71, 7, 5),
    "Qwen/Qwen2.5-3B-Instruct": (100, 9, 10, 83, 9, 10),
    "Qwen/Qwen2.5-7B-Instruct": (100, 4, 7, 95, 4, 7),
}
EXPECTED_POOLED_CLEAN = (249, 20, 22)     # n, fixed, broken
EXPECTED_BOUND_ONLY = (51, 0, 4)          # n, fixed, broken, where the allowance bit


def load_mcnemar(zf: zipfile.ZipFile):
    """`harness` imports torch at module scope; `mcnemar` itself is pure Python."""
    tree = ast.parse(zf.read(HARNESS).decode("utf-8"))
    fn = [n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == "mcnemar"]
    if not fn:
        raise SystemExit("harness.py no longer defines mcnemar()")
    ns: dict = {}
    exec(compile(ast.Module(body=fn, type_ignores=[]), "harness", "exec"),
         {"__builtins__": __builtins__, "math": math}, ns)
    return ns["mcnemar"]


def main() -> int:
    if not BUNDLE.exists():
        raise SystemExit(f"{BUNDLE} not found; it is what the page ships as its download")
    with zipfile.ZipFile(BUNDLE) as zf:
        mcnemar = load_mcnemar(zf)
        recs = [json.loads(l) for l in zf.read(TRACES).decode("utf-8").splitlines() if l.strip()]

    wait = [r for r in recs if r.get("arm") == "wait"]
    waits = sorted({r["waits"] for r in wait})
    k = waits[-1]
    pooled = {"n": 0, "fixed": 0, "broken": 0}
    bound = {"n": 0, "fixed": 0, "broken": 0}
    failures = []

    print(f"published wait arm: {len(wait):,} records, k = {waits}\n")
    for mid in MODELS:
        by_k: dict = {}
        for r in wait:
            if r["model_id"] == mid:
                by_k.setdefault(r["waits"], {})[r["problem_id"]] = r
        base = by_k[waits[0]]
        pids = sorted(set(base) & set(by_k[k]))

        n_fixed, n_broken, _ = mcnemar({q: by_k[k][q]["correct"] for q in pids},
                                       {q: base[q]["correct"] for q in pids})
        # The filter, exactly as the notebook applies it.
        clean = [p for p in pids
                 if not by_k[k][p]["forced"] and not base[p]["forced"]
                 and by_k[k][p].get("carried_from") is None]
        c_fixed, c_broken, _ = mcnemar({q: by_k[k][q]["correct"] for q in clean},
                                       {q: base[q]["correct"] for q in clean})
        # And its complement, which is where the artefact lives.
        rest = [p for p in pids if p not in set(clean)]
        r_fixed, r_broken, _ = mcnemar({q: by_k[k][q]["correct"] for q in rest},
                                       {q: base[q]["correct"] for q in rest})

        got = (len(pids), n_fixed, n_broken, len(clean), c_fixed, c_broken)
        ok = got == EXPECTED[mid]
        failures += [] if ok else [f"{mid}: got {got}, expected {EXPECTED[mid]}"]
        print(f"  {mid.split('-')[1]:<6} all n={len(pids):3d} fixed={n_fixed:2d} broken={n_broken:2d}"
              f"   clean n={len(clean):3d} fixed={c_fixed:2d} broken={c_broken:2d}"
              f"   excluded={len(rest):2d} (fixed={r_fixed}, broken={r_broken})"
              f"   {'ok' if ok else 'MISMATCH'}")
        for d, add in ((pooled, (len(clean), c_fixed, c_broken)), (bound, (len(rest), r_fixed, r_broken))):
            d["n"] += add[0]
            d["fixed"] += add[1]
            d["broken"] += add[2]

    delta = (pooled["fixed"] - pooled["broken"]) / pooled["n"] * 100
    se = math.sqrt(pooled["fixed"] + pooled["broken"]) / pooled["n"] * 100
    print(f"\n  POOLED CLEAN   n={pooled['n']} fixed={pooled['fixed']} broken={pooled['broken']}"
          f"   delta={delta:+.1f} pts   95% CI [{delta - 1.96 * se:+.1f}, {delta + 1.96 * se:+.1f}]")
    print(f"  WHERE IT BOUND n={bound['n']} fixed={bound['fixed']} broken={bound['broken']}"
          f"   <- one-directional: the allowance can only cost the intervention marks")

    for label, got, want in (("pooled clean", (pooled["n"], pooled["fixed"], pooled["broken"]),
                              EXPECTED_POOLED_CLEAN),
                             ("where it bound", (bound["n"], bound["fixed"], bound["broken"]),
                              EXPECTED_BOUND_ONLY)):
        if got != want:
            failures.append(f"{label}: got {got}, expected {want}")

    if failures:
        print("\nFAILED")
        for f in failures:
            print("  " + f)
        return 1
    print("\nok: the clean-subset arithmetic matches the independently derived values.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
