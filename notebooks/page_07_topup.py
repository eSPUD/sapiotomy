"""Page 7's section 4 top-up: the chains the fixed-budget figure needs that the run lacks.

Section 4 compares N chains sharing one total budget B (B/N tokens each) at three budgets,
2048, 4096 and 8192, against the same N chains each allowed to finish. The published run
already holds the 2048 budget (and the pile at a 2048-token cap). This script adds only what
is missing, under the SAME run id, to the same `traces.jsonl`, so nothing the page already
plots is regenerated or changed:

    budget 4096   1 chain at 4096, 4 at 1024, 16 at 256      all new
    budget 8192   1 chain at 8192, 4 at 2048, 16 at 512      the 2048s are the pile; 12 of the
                                                              16 at 512 are new
    each chain allowed to finish   16 chains at 8192          all new (and covers 8192's N = 1)

and every one of those caps is filled to 16 chains per problem, so each budget point is
the mean over the same number of draws (see `plan`).

The 16 chains at 8192 were first made for an allowed-to-finish line (12 of 1600 looped to
the ceiling). That line is now the pile itself, ruled 2026-10-11 so section 4 quotes the same
16-chain number as section 3; the 8192 chains remain the 8192 budget's N = 1 point.

It runs the notebook's own code for everything it shares with the notebook (the knobs, the
problem draw, the model load, the sampler, the answer key), read out of
`page_07_frequency_voting.ipynb` by content, so the new chains are made exactly the way the
old ones were. What is new here is the plan and one rule: a group that is already partly on
disk (the 512-token configuration holds 4 chains and now needs 16) is completed with only its
missing slots, as a sub-batch with its own recorded seed. The notebook as published would
regenerate the whole group and overwrite the 4 chains the 2048 budget's N = 4 point is
built from.

    cd notebooks
    python page_07_topup.py --dry-run                 # what is missing, and nothing else
    python page_07_topup.py --limit 1 --traces /tmp/scratch_traces.jsonl   # smoke test
    python page_07_topup.py                           # the top-up, resumable

Resumable: every chain is appended as it is made, and a restart skips what is on disk.
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
NOTEBOOK = HERE / "page_07_frequency_voting.ipynb"

BUDGETS = (2048, 4096, 8192)
SPLIT_N = (1, 4, 16)
UNCAPPED_CAP = 8192        # first made for allowed-to-finish; now the 8192 budget's N = 1 cap
UNCAPPED_N = 16


def notebook_cell(cells, marker):
    """The one code cell whose source contains `marker`."""
    hits = [c for c in cells if c["cell_type"] == "code" and marker in "".join(c["source"])]
    assert len(hits) == 1, f"{len(hits)} notebook cells contain {marker!r}; expected exactly one"
    return "".join(hits[0]["source"])


def load_notebook_code(ns, with_model):
    """Execute the notebook's shared cells into `ns`, as a FULL run would."""
    cells = json.loads(NOTEBOOK.read_text(encoding="utf-8"))["cells"]
    knobs = notebook_cell(cells, 'RUN_MODE = "REPLAY"')
    assert knobs.count('RUN_MODE = "REPLAY"') == 1
    steps = [
        knobs.replace('RUN_MODE = "REPLAY"', 'RUN_MODE = "FULL"'),
        notebook_cell(cells, "import harness"),
        notebook_cell(cells, "load_math500_test(local_path"),
        notebook_cell(cells, "def vote_key"),
        notebook_cell(cells, "def config_id"),
    ]
    if with_model:
        steps += [notebook_cell(cells, "def prompt_ids_for"), notebook_cell(cells, "def sample_group")]
    for src in steps:
        exec(compile(src, str(NOTEBOOK), "exec"), ns)


def plan(t_best):
    """{cap: chains needed}. Every cap a budget point uses gets the full 16 chains, not
    just the N its point needs: the notebook scores a point at N as the mean over random
    N-subsets of every chain on disk, so a cap that some other line had already filled to
    16 (the pile at 2048, the allowed-to-finish line at 8192) was steadier than one made
    for its point alone. Filling every cap to 16 gives all four lines equal precision.
    (Ruled 2026-10-11: average over everything available, and top up to match.)"""
    need = {b // n: max(n, UNCAPPED_N) for b in BUDGETS for n in SPLIT_N}
    need[UNCAPPED_CAP] = max(need.get(UNCAPPED_CAP, 0), UNCAPPED_N)
    return dict(sorted(need.items()))


def budget_of(cap):
    """The budget a configuration was generated for, for the record. 8192 is shared by the
    8192 budget's N = 1 and the allowed-to-finish line, so it records none."""
    if cap == UNCAPPED_CAP:
        return None
    hits = [b for b in BUDGETS for n in SPLIT_N if b // n == cap]
    return max(hits)


def missing_slots(store, ns, cid, pid, k):
    return [s for s in range(k) if store.get(ns["PRIMARY"], cid, pid, s) is None]


def assert_same_run(ns, run_id):
    """The run id names the model, items, cap, pile, top-p, dtype and device. Recompute it
    the notebook's way: if it differs, this machine would be adding chains to a run it is
    not part of."""
    mine = (f"full-{ns['DATASET']}-n{len(ns['items'])}-{ns['ITEM_SET_HASH'][:8]}"
            f"-cap{ns['CHAIN_CAP']}-pool{ns['POOL_N']}-p{ns['TOP_P']}"
            f"-{str(ns['DTYPE']).rsplit('.', 1)[-1]}-{ns['device'].type}")
    assert mine == run_id, f"this machine makes run {mine}, not the published {run_id}"


def fill(store, ns, cid, cap, temperature, k, rows, *, budget_total, made_by, tally=None):
    """Make every missing chain of `cid` up to k per problem, appending each as it is made.

    A whole missing group is made exactly as the notebook makes one. A group already partly
    on disk is completed with only its missing tail, as a sub-batch with its own recorded
    seed; the chains already there are never touched. `tally` is a running dict of
    made / tokens / truncated / total that the caller prints progress from.
    """
    GROUP = ns["GROUP"]
    tally = tally if tally is not None else dict(made=0, toks=0, total=0, t0=time.time())
    made = n_trunc = 0
    for row in rows:
        pid = row["unique_id"]
        for start in range(0, k, GROUP):
            size = min(GROUP, k - start)
            slots = [s for s in range(start, start + size)
                     if store.get(ns["PRIMARY"], cid, pid, s) is None]
            if not slots:
                continue
            g_index = start // GROUP
            if len(slots) == size:
                seed_key, first = g_index, start
            else:
                assert slots == list(range(slots[0], start + size)), \
                    f"{cid} {pid}: missing slots {slots} are not the tail of their group"
                first = slots[0]
                seed_key = f"{g_index}+{first}"
            seed = ns["group_seed"](pid, cid, seed_key)
            chains = ns["sample_group"](row["problem"], cap, temperature, len(slots), seed,
                                        ns["model"], ns["tokenizer"])
            for j, g in enumerate(chains):
                s = first + j
                extracted = ns["extract_final_candidate"](g["trace"])
                store.append({
                    "model_id": ns["PRIMARY"], "config_id": cid,
                    "problem_id": pid, "sample_index": s,
                    "group_index": g_index, "batch_seed": seed, "batch_size": len(slots),
                    "batch_seed_key": str(seed_key),
                    "level": int(row["level"]), "subject": row["subject"],
                    "question": row["problem"], "ground_truth": row["answer"],
                    "temperature": temperature,
                    "top_p": ns["TOP_P"] if temperature > 0 else None,
                    "chain_budget": cap, "budget_total": budget_total,
                    "trace": g["trace"], "tokens": g["tokens"],
                    "cut_index": g["cut_index"], "answer_start": g["answer_start"],
                    "truncated": g["truncated"], "forced": g["forced"],
                    "forced_suffix": g["forced_suffix"],
                    "answer_closed": g["answer_closed"],
                    "extracted_answer": extracted,
                    "vote_key": ns["vote_key"](g["trace"]),
                    "correct": bool(ns["grade_answer"](extracted, row["answer"])),
                    "own_tokens": g["own_tokens"], "answer_tokens": g["answer_tokens"],
                    "tokens_generated": g["tokens_generated"],
                    "replicated_from": None,
                    "made_by": made_by,
                })
                made += 1
                n_trunc += g["truncated"]
                tally["made"] += 1
                tally["toks"] += g["tokens_generated"]
        el = time.time() - tally["t0"]
        rate = tally["toks"] / el if el else 0.0
        left = tally["total"] - tally["made"]
        eta = left * (tally["toks"] / max(tally["made"], 1)) / max(rate, 1e-9)
        print(f"[{time.strftime('%H:%M:%S')}] {cid:<20} {pid:<38} {tally['made']:>5}/{tally['total']}"
              f"  {rate:6.0f} tok/s  eta {eta / 3600:4.1f} h", flush=True)
    if made:
        print(f"== {cid}: {made} chains made, {n_trunc} reached the {cap}-token ceiling", flush=True)
    return dict(made=made, truncated=n_trunc)


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--traces", default=None, help="traces.jsonl to read and append to "
                    "(default: out/page_07/traces.jsonl)")
    ap.add_argument("--limit", type=int, default=None, help="only the first N problems")
    ap.add_argument("--dry-run", action="store_true", help="report what is missing; load nothing")
    args = ap.parse_args()

    os.chdir(HERE)                     # the notebook's paths are relative to its folder
    sys.path.insert(0, str(HERE))
    ns = {"__name__": "page_07_notebook"}
    load_notebook_code(ns, with_model=not args.dry_run)

    manifest = json.loads((HERE / "out/page_07/manifest.json").read_text())
    run_id = manifest["run_id"]
    t_best = manifest["decoding"]["pile_temperature"]
    assert manifest["items"]["item_set_sha256"] == ns["ITEM_SET_HASH"], \
        "the notebook draws a different item set from the published run"
    if not args.dry_run:
        assert_same_run(ns, run_id)

    harness = ns["harness"]
    traces = Path(args.traces) if args.traces else ns["TRACES_PATH"]
    store = harness.TraceStore(traces, run_id, ("model_id", "config_id", "problem_id", "sample_index"))
    rows = ns["items"][: args.limit] if args.limit else ns["items"]
    need = plan(t_best)

    print(f"run {run_id}\ntraces {traces}\n{len(rows)} problems at T={t_best}")
    total_missing = 0
    for cap, k in need.items():
        cid = ns["config_id"](t_best, cap)
        miss = sum(len(missing_slots(store, ns, cid, r["unique_id"], k)) for r in rows)
        total_missing += miss
        print(f"  {cid:<14} {k:>2} chains each   {miss:>5} missing")
    print(f"  {total_missing} chains to generate")
    if args.dry_run or not total_missing:
        return

    tally = dict(made=0, toks=0, total=total_missing, t0=time.time())
    for cap, k in need.items():
        fill(store, ns, ns["config_id"](t_best, cap), cap, t_best, k, rows,
             budget_total=budget_of(cap), made_by="page_07_topup.py", tally=tally)
    print(f"done: {tally['made']} chains, {tally['toks']:,} tokens, "
          f"{(time.time() - tally['t0']) / 3600:.2f} h", flush=True)


if __name__ == "__main__":
    main()
