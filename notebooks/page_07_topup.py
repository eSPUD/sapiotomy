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

"Allowed to finish" still needs a ceiling, because a chain that falls into a loop never stops.
8192 is four times the pile's cap; in the pile only 1.2% of chains reached 2048. The run
prints how many reach 8192.

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
UNCAPPED_CAP = 8192        # the ceiling for "allowed to finish"
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
    """{config_id-ready (cap): chains needed}, the most any budget or line asks of a cap."""
    need = {}
    for b in BUDGETS:
        for n in SPLIT_N:
            cap = b // n
            need[cap] = max(need.get(cap, 0), n)
    need[UNCAPPED_CAP] = max(need.get(UNCAPPED_CAP, 0), UNCAPPED_N)
    # The pile already holds 16 at 2048; asking for 4 there is a no-op, kept for the record.
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
        # The run id names the model, items, cap, pile, top-p, dtype and device. Recompute it
        # the notebook's way: if it differs, this machine would be adding chains to a run it
        # is not part of.
        mine = (f"full-{ns['DATASET']}-n{len(ns['items'])}-{ns['ITEM_SET_HASH'][:8]}"
                f"-cap{ns['CHAIN_CAP']}-pool{ns['POOL_N']}-p{ns['TOP_P']}"
                f"-{str(ns['DTYPE']).rsplit('.', 1)[-1]}-{ns['device'].type}")
        assert mine == run_id, f"this machine makes run {mine}, not the published {run_id}"

    harness = ns["harness"]
    traces = Path(args.traces) if args.traces else ns["TRACES_PATH"]
    store = harness.TraceStore(traces, run_id, ("model_id", "config_id", "problem_id", "sample_index"))
    rows = ns["items"][: args.limit] if args.limit else ns["items"]
    need = plan(t_best)
    GROUP = ns["GROUP"]

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

    made, toks, t0 = 0, 0, time.time()
    for cap, k in need.items():
        cid = ns["config_id"](t_best, cap)
        n_trunc = n_cfg = 0
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
                    # A whole group, made exactly as the notebook makes one.
                    seed_key, first = g_index, start
                else:
                    # Completing a group already partly on disk: only its missing tail, with
                    # its own seed. The chains already there are never touched.
                    assert slots == list(range(slots[0], start + size)), \
                        f"{cid} {pid}: missing slots {slots} are not the tail of their group"
                    first = slots[0]
                    seed_key = f"{g_index}+{first}"
                seed = ns["group_seed"](pid, cid, seed_key)
                chains = ns["sample_group"](row["problem"], cap, t_best, len(slots), seed,
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
                        "temperature": t_best, "top_p": ns["TOP_P"],
                        "chain_budget": cap, "budget_total": budget_of(cap),
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
                        "made_by": "page_07_topup.py",
                    })
                    made += 1
                    n_cfg += 1
                    n_trunc += g["truncated"]
                    toks += g["tokens_generated"]
            el = time.time() - t0
            rate = toks / el if el else 0.0
            eta = (total_missing - made) * (toks / max(made, 1)) / max(rate, 1e-9)
            print(f"[{time.strftime('%H:%M:%S')}] {cid:<14} {pid:<38} {made:>5}/{total_missing}"
                  f"  {rate:6.0f} tok/s  eta {eta / 3600:4.1f} h", flush=True)
        if n_cfg:
            print(f"== {cid}: {n_cfg} chains made, {n_trunc} reached the {cap}-token ceiling", flush=True)
    print(f"done: {made} chains, {toks:,} tokens, {(time.time() - t0) / 3600:.2f} h", flush=True)


if __name__ == "__main__":
    main()
