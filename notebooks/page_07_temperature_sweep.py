"""Page 7's temperature sweep: 16 chains at 12 temperatures on 40 of the 100 problems.

The data behind section 2's temperature heatmap: one cell per problem and temperature,
coloured by what the majority vote over its 16 chains returned (right, wrong, or a tie).
Then a control: the temperature whose vote solves the most of the 40 problems (ties to the
lower temperature, the notebook's rule) gets ONE fresh chain on all 100 problems, to set
against the greedy chain.

    cd notebooks
    python page_07_temperature_sweep.py --dry-run          # what is missing
    python page_07_temperature_sweep.py --smoke SCRATCH    # 1 problem, 2 temperatures, to SCRATCH
    python page_07_temperature_sweep.py                    # the sweep, the control, the bundle

Same run, same procedure, separate file. The chains are made under the published run id by
the notebook's own sampler (through `page_07_topup.fill`), but they are written to
`out/page_07/sweep_traces.jsonl`, never to `traces.jsonl`: that file ships in page 7's
notebook download, and fifteen thousand more chains would make it a hundred megabytes. The
sweep READS both files, so the temperatures the run already holds are reused rather than
remade: T = 0 and T = 0.3 in full, and T = 0.6 and 0.9 for the problems the diversity family
covered (8 chains each, completed to 16).

Everything it measures is written to `out/page_07_sweep/`: `results.json` (the heatmap's
cells, a summary per temperature, the best temperature and the control), `timing.json`
(wall clock for the whole run and every stage), and `page-07-temperature-sweep.zip`, which
carries those, every chain the heatmap and control are built from, and this module, so the
run can be read and re-derived elsewhere. Resumable: a restart skips what is on disk.
"""

import argparse
import json
import os
import platform
import random
import sys
import time
import zipfile
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from page_07_topup import assert_same_run, fill, load_notebook_code, notebook_cell  # noqa: E402

TEMPERATURES = [round(0.1 * i, 1) for i in range(13)]   # 0, 0.1, ..., 1.2 (the 40-problem run stopped at 1.1)
N_CHAINS = 16
N_PROBLEMS = 40
SAMPLE_SEED = "page-07-temperature-sweep"   # names the draw of 40 from the 100
CONTROL_SUFFIX = "-control"

OUT = HERE / "out/page_07_sweep"
SWEEP_TRACES = HERE / "out/page_07/sweep_traces.jsonl"
MAIN_TRACES = HERE / "out/page_07/traces.jsonl"
KEYS = ("model_id", "config_id", "problem_id", "sample_index")


def now():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


class Timer:
    """Wall clock for the whole run and for each named stage, written to timing.json."""

    def __init__(self):
        self.t0, self.started, self.stages = time.time(), now(), []

    def stage(self, name, **extra):
        return _Stage(self, name, extra)

    def dump(self, path, **extra):
        path.write_text(json.dumps(dict(
            started_utc=self.started, finished_utc=now(),
            wall_seconds=round(time.time() - self.t0, 1),
            wall_hours=round((time.time() - self.t0) / 3600, 3),
            stages=self.stages, **extra), indent=2))


class _Stage:
    def __init__(self, timer, name, extra):
        self.timer, self.name, self.extra = timer, name, extra

    def __enter__(self):
        self.t = time.time()
        self.info = dict(name=self.name, started_utc=now(), **self.extra)
        return self.info

    def __exit__(self, *exc):
        self.info["seconds"] = round(time.time() - self.t, 1)
        self.timer.stages.append(self.info)
        print(f"-- {self.name}: {self.info['seconds'] / 60:.1f} min", flush=True)


def open_store(ns, run_id, sweep_path):
    """Appends go to the sweep file only; the main file's chains are visible, read-only."""
    store = ns["harness"].TraceStore(sweep_path, run_id, KEYS)
    seen = 0
    with MAIN_TRACES.open(encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue
            r = json.loads(line)
            if r.get("run_id") == run_id:
                k = store._key(r)
                if k not in store.done:
                    store.done[k] = r
                    seen += 1
    print(f"sweep file {sweep_path}: {len(store.done) - seen} of its own; "
          f"{seen} read from {MAIN_TRACES.name}, never written")
    return store


def chains(store, ns, cid, pid, k):
    rs = [store.get(ns["PRIMARY"], cid, pid, s) for s in range(k)]
    assert all(r is not None for r in rs), f"{cid} {pid}: {sum(r is None for r in rs)} of {k} missing"
    return rs


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--dry-run", action="store_true", help="report what is missing; load nothing")
    ap.add_argument("--smoke", metavar="FILE", help="1 problem, 2 temperatures, appended to FILE")
    ap.add_argument("--problems", type=int, default=N_PROBLEMS,
                    help=f"how many of the 100 (default {N_PROBLEMS}, a seeded draw; 100 is all of them)")
    ap.add_argument("--no-control", action="store_true",
                    help="skip the control (it already covers all 100 problems)")
    args = ap.parse_args()

    timer = Timer()
    os.chdir(HERE)
    ns = {"__name__": "page_07_notebook"}
    with timer.stage("load the notebook's code and the model"):
        load_notebook_code(ns, with_model=not args.dry_run)
        cells = json.loads((HERE / "page_07_frequency_voting.ipynb").read_text())["cells"]
        exec(compile(notebook_cell(cells, "def tally"), "notebook", "exec"), ns)

    manifest = json.loads((HERE / "out/page_07/manifest.json").read_text())
    run_id, cap = manifest["run_id"], ns["CHAIN_CAP"]
    if not args.dry_run:
        assert_same_run(ns, run_id)

    items = ns["items"]
    n_problems = min(args.problems, len(items))
    if n_problems == len(items):
        sample = sorted(items, key=lambda r: r["unique_id"])     # all of them: no draw
    else:
        rng = random.Random(SAMPLE_SEED)
        sample = sorted(rng.sample(items, n_problems), key=lambda r: r["unique_id"])
    temps, sweep_path = TEMPERATURES, SWEEP_TRACES
    if args.smoke:
        sample, temps, sweep_path = sample[:1], [0.1, 0.6], Path(args.smoke)
    store = open_store(ns, run_id, sweep_path)
    cid = lambda t: ns["config_id"](t, cap)

    todo = {}
    for t in temps:
        if t == 0.0:
            continue   # greedy: the run's one real chain per problem, already on disk for all 100
        todo[t] = sum(1 for r in sample for s in range(N_CHAINS)
                      if store.get(ns["PRIMARY"], cid(t), r["unique_id"], s) is None)
    print(f"{len(sample)} problems (draw '{SAMPLE_SEED}'), {len(temps)} temperatures, "
          f"{N_CHAINS} chains, cap {cap}")
    for t, n in todo.items():
        print(f"  T={t:<4} {n:>5} missing")
    total = sum(todo.values())
    print(f"  {total} chains to generate, plus {len(items)} for the control")
    if args.dry_run:
        return

    # ---- the sweep
    tally = dict(made=0, toks=0, total=total, t0=time.time())
    for t, n in todo.items():
        with timer.stage(f"T={t}", missing=n) as info:
            got = fill(store, ns, cid(t), cap, t, N_CHAINS, sample, budget_total=None,
                       made_by="page_07_temperature_sweep.py", tally=tally)
            info.update(got)

    # ---- the heatmap's cells
    with timer.stage("tally the sweep"):
        cells_out, per_t = [], {}
        for r in sample:
            pid, row = r["unique_id"], {}
            for t in temps:
                rs = chains(store, ns, cid(t), pid, N_CHAINS)
                tl = ns["tally"](rs)
                row[f"{t:.1f}"] = dict(
                    outcome="tie" if tl["tie"] else "right" if tl["plurality_correct"] else "wrong",
                    plurality_answer=tl["plurality_answer"], plurality_votes=tl["plurality_votes"],
                    correct_chains=sum(x["correct"] for x in rs), distinct_answers=tl["distinct_answers"],
                    any_correct=tl["any_correct"], truncated=sum(x["truncated"] for x in rs),
                    mean_tokens=sum(x["own_tokens"] for x in rs) / len(rs))
                per_t.setdefault(t, []).append(tl)
            cells_out.append(dict(problem_id=pid, level=int(r["level"]), subject=r["subject"],
                                  question=r["problem"], ground_truth=r["answer"], cells=row))
        summary = []
        for t in temps:
            a = ns["aggregate"](per_t[t])
            summary.append(dict(temperature=t, n_problems=a["n_items"],
                                vote_accuracy=a["plurality_accuracy"], coverage=a["coverage"],
                                single_chain_accuracy=a["single_chain_accuracy"],
                                tie_rate=a["tie_rate"], mean_distinct=a["mean_distinct"],
                                truncated_rate=a["truncated_rate"]))
        best = max(summary, key=lambda s: (s["vote_accuracy"], -s["temperature"]))
        print("\n  T     vote  coverage  one chain  ties  distinct")
        for s in summary:
            print(f"  {s['temperature']:<5}{s['vote_accuracy']:>5.0%}{s['coverage']:>10.0%}"
                  f"{s['single_chain_accuracy']:>11.0%}{s['tie_rate']:>6.0%}{s['mean_distinct']:>10.1f}")
        print(f"\n-> best temperature by the vote: T={best['temperature']} "
              f"({best['vote_accuracy']:.0%} of {best['n_problems']})")

    # ---- the control: one fresh chain per problem, all 100, at the best temperature
    control = None
    if not args.smoke and not args.no_control:
        t_best = best["temperature"]
        ccid = cid(t_best) + CONTROL_SUFFIX
        with timer.stage(f"control at T={t_best}", problems=len(items)) as info:
            tally = dict(made=0, toks=0, total=len(items), t0=time.time())
            info.update(fill(store, ns, ccid, cap, t_best, 1, items, budget_total=None,
                             made_by="page_07_temperature_sweep.py (control)", tally=tally))
        ctl = {r["unique_id"]: chains(store, ns, ccid, r["unique_id"], 1)[0]["correct"] for r in items}
        greedy = {r["unique_id"]: chains(store, ns, cid(0.0), r["unique_id"], 1)[0]["correct"]
                  for r in items}
        fixed, broken, p = ns["harness"].mcnemar(ctl, greedy)
        control = dict(temperature=t_best, config_id=ccid, n_problems=len(items),
                       accuracy=sum(ctl.values()) / len(ctl),
                       greedy_accuracy=sum(greedy.values()) / len(greedy),
                       vs_greedy=dict(fixed=fixed, broken=broken, p=p))
        print(f"\ncontrol: one chain at T={t_best} solves {control['accuracy']:.0%} of "
              f"{len(items)}; one greedy chain {control['greedy_accuracy']:.0%} "
              f"(exact McNemar {fixed} fixed, {broken} broken, p={p:.4f})")

    # ---- write it down, and bundle it for elsewhere
    # The 40-problem draw keeps its folder; any other size gets its own, so a larger run
    # never overwrites the results the page was first built from.
    out = (Path(args.smoke).with_suffix(".out") if args.smoke
           else OUT if n_problems == N_PROBLEMS else OUT.with_name(f"page_07_sweep_{n_problems}"))
    out.mkdir(parents=True, exist_ok=True)
    results = dict(
        run_id=run_id, model=ns["PRIMARY"], chain_cap=cap, top_p=ns["TOP_P"],
        n_chains=N_CHAINS, temperatures=temps,
        sample_seed=SAMPLE_SEED if n_problems < len(items) else None,
        problems=[r["unique_id"] for r in sample], vote_rule=manifest["vote"],
        summary=summary, best_temperature=best["temperature"], heatmap=cells_out,
        control=control)
    (out / "results.json").write_text(json.dumps(results, indent=2, ensure_ascii=False))
    host = dict(host=platform.node(), python=platform.python_version(),
                gpu=str(ns["torch"].cuda.get_device_name(0)) if ns["torch"].cuda.is_available() else None)
    timer.dump(out / "timing.json", chains_generated=total + (len(items) if control else 0), **host)
    if not args.smoke:
        bundle(store, ns, out, sample, temps, cid, control)
    print(f"\nwrote {out}", flush=True)


def bundle(store, ns, out, sample, temps, cid, control):
    """One zip with everything the heatmap and the control are built from."""
    want = {(cid(t), r["unique_id"]) for t in temps for r in sample}
    if control:
        want |= {(control["config_id"], pid) for pid in (r["unique_id"] for r in ns["items"])}
    recs = [r for r in store.done.values() if (r["config_id"], r["problem_id"]) in want]
    recs.sort(key=lambda r: (r["config_id"], r["problem_id"], r["sample_index"]))
    root = "page-07-temperature-sweep" + ("" if len(sample) == N_PROBLEMS else f"-{len(sample)}")
    path = out / f"{root}.zip"
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        z.writestr(f"{root}/traces.jsonl", "".join(json.dumps(r, ensure_ascii=False) + "\n" for r in recs))
        for name in ("results.json", "timing.json"):
            z.write(out / name, f"{root}/{name}")
        for name in ("page_07_temperature_sweep.py", "page_07_topup.py"):
            z.write(HERE / name, f"{root}/{name}")
        z.writestr(f"{root}/README.md", README.format(n=len(recs)))
    print(f"bundle {path}  {path.stat().st_size / 1e6:.1f} MB, {len(recs):,} chains", flush=True)


README = """# Page 7: temperature sweep

16 chains at 12 temperatures (0, 0.1, ..., 1.1) on 40 of page 7's 100 MATH-500 problems
(levels 4 and 5), Qwen2.5-3B-Instruct, 2048-token cap, top-p 0.95. Then one fresh chain on
all 100 problems at the temperature whose vote solved the most of the 40.

- `results.json`: `heatmap` (one entry per problem, one cell per temperature, with the
  vote's outcome: right, wrong or tie), `summary` (one row per temperature), the
  `best_temperature`, and the `control` against one greedy chain.
- `timing.json`: wall clock for the whole run and for every stage.
- `traces.jsonl`: all {n:,} chains these are built from, one JSON record per line.
- `page_07_temperature_sweep.py`, `page_07_topup.py`: the code that made them. They run
  inside the repository's `notebooks/` folder, next to page 7's notebook.
"""


if __name__ == "__main__":
    main()
