"""Page 7's temperature heat map: one cell per problem and temperature in the diversity family.

The notebook saves the diversity family only as one aggregate per temperature
(`results.json` -> `diversity`). This script re-tallies the same chains per problem with the
notebook's own vote (`vote_key`, `cluster` and `tally` below are copied from
page_07_frequency_voting.ipynb, cells 10 and 12), and refuses to write unless its rows
reproduce every aggregate the notebook saved. It computes nothing the notebook did not:
the cells are the rows the notebook averaged.

Each cell: how many of the problem's chains are right, and how the vote came out
(right, wrong, or tied).

Needs reasoning-from-scratch and sympy for the ch03 grader, as the notebook does:

    uv run --no-project --with sympy --with requests --with torch \\
        --with "reasoning-from-scratch>=0.2.0" \\
        python page_07_heatmap.py --out-dir out/page_07
    # -> ../web/data/page-07-heatmap.json
"""

import argparse
import hashlib
import json
import math
from collections import Counter
from pathlib import Path

from reasoning_from_scratch.ch03 import extract_final_candidate, grade_answer

HERE = Path(__file__).resolve()
WEB_DATA = HERE.parent.parent / "web" / "data" / "page-07-heatmap.json"
CAP = 2048  # the diversity family runs at the pile's cap


def sha256(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def mean(xs):
    xs = list(xs)
    return sum(xs) / max(len(xs), 1)


# ---- copied from the notebook, cell 12 -------------------------------------
NO_ANSWER = None


def vote_key(text):
    """What a chain contributes to the tally, or None if it contributed nothing."""
    cand = extract_final_candidate(text, fallback="number_only")
    return cand if cand and cand.strip() else NO_ANSWER


_EQ_CACHE = {}


def equivalent(a, b):
    if a == b:
        return True
    k = (a, b) if a <= b else (b, a)
    if k not in _EQ_CACHE:
        try:
            _EQ_CACHE[k] = bool(grade_answer(a, b)) or bool(grade_answer(b, a))
        except Exception:
            _EQ_CACHE[k] = False
    return _EQ_CACHE[k]


def cluster(keys):
    labels, order = [], []
    for k in keys:
        if k is NO_ANSWER:
            labels.append(NO_ANSWER)
            continue
        hit = next((lab for lab in order if equivalent(lab, k)), None)
        if hit is None:
            order.append(k)
            hit = k
        labels.append(hit)
    return labels, order


# ---- copied from the notebook, cell 14 (the fields the aggregates read) ----
def tally(records):
    gt = records[0]["ground_truth"]
    labels, _ = cluster([vote_key(r["trace"]) for r in records])
    counts = Counter([l for l in labels if l is not NO_ANSWER])
    ranked = counts.most_common()
    top = ranked[0][1] if ranked else 0
    winners = [a for a, c in ranked if c == top]
    tie = len(winners) > 1
    plurality = winners[0] if (winners and not tie) else None
    total = sum(counts.values())
    entropy = -sum((c / total) * math.log2(c / total) for c in counts.values()) if total else 0.0
    return dict(
        distinct_answers=len(counts),
        answer_entropy=entropy,
        tie=tie,
        plurality_correct=bool(plurality is not None and grade_answer(plurality, gt)),
        any_correct=any(r["correct"] for r in records),
        mean_chain_correct=mean([r["correct"] for r in records]),
    )


def read_traces(path, run_id, model_id):
    """The notebook's read: this run only, the last write per key winning, in sample order."""
    latest = {}
    with Path(path).open(encoding="utf-8") as f:
        for line in f:
            if line.strip():
                r = json.loads(line)
                if r["run_id"] == run_id and r["model_id"] == model_id:
                    latest[(r["config_id"], r["problem_id"], r["sample_index"])] = r
    by = {}
    for r in latest.values():
        by.setdefault(r["config_id"], {}).setdefault(r["problem_id"], []).append(r)
    for c in by.values():
        for rs in c.values():
            rs.sort(key=lambda r: r["sample_index"])
    return by


def build(out_dir, dest):
    out_dir = Path(out_dir)
    R = json.loads((out_dir / "results.json").read_text(encoding="utf-8"))
    manifest = json.loads((out_dir / "manifest.json").read_text(encoding="utf-8"))
    run_id, model = manifest["run_id"], manifest["primary_model"]
    div = R["diversity"]
    n_chains, n_items = div[0]["n_chains"], div[0]["n_items"]
    # The notebook's DIV_IDS: the first `n_items` problems, in the item order results.json keeps.
    ids = list(R["pile_rows"])[:n_items]
    by = read_traces(out_dir / "traces.jsonl", run_id, model)

    problems = [dict(problem_id=pid, cells=[]) for pid in ids]
    for d in div:
        cid = f"t{d['temperature']:.2f}-c{CAP}"
        rows = []
        for p in problems:
            rs = by[cid][p["problem_id"]][:n_chains]
            assert len(rs) == n_chains, f"{cid} {p['problem_id']}: {len(rs)} chains, not {n_chains}"
            row = tally(rs)
            rows.append(row)
            p.setdefault("level", rs[0]["level"])
            p.setdefault("subject", rs[0]["subject"])
            p["cells"].append(dict(
                temperature=d["temperature"],
                n_correct=sum(bool(r["correct"]) for r in rs),
                outcome="tie" if row["tie"] else "right" if row["plurality_correct"] else "wrong",
            ))
        # The rows must be the ones the notebook averaged, or the cells are a different run.
        mine = dict(
            plurality_accuracy=mean(r["plurality_correct"] for r in rows),
            single_chain_accuracy=mean(r["mean_chain_correct"] for r in rows),
            coverage=mean(r["any_correct"] for r in rows),
            tie_rate=mean(r["tie"] for r in rows),
            mean_distinct=mean(r["distinct_answers"] for r in rows),
            mean_entropy=mean(r["answer_entropy"] for r in rows),
        )
        for k, v in mine.items():
            assert math.isclose(v, d[k], abs_tol=1e-9), \
                f"T={d['temperature']}: {k} is {v} here but {d[k]} in results.json"
        print(f"T={d['temperature']:<4} vote {mine['plurality_accuracy']:.0%}  one chain "
              f"{mine['single_chain_accuracy']:.0%}  ties {mine['tie_rate']:.0%}  matches results.json")

    out = {
        "source": {"run_id": run_id, "results_sha256": sha256(out_dir / "results.json"),
                   "builder": HERE.name, "builder_sha256": sha256(HERE)},
        "n_chains": n_chains,
        "temperatures": [d["temperature"] for d in div],
        "problems": problems,
    }
    Path(dest).write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"\n{dest}  {len(problems)} problems x {len(div)} temperatures")


# ---- copied from the notebook (subsets_for, curve_point): a point at N is the mean over
# N_RESAMPLES random N-subsets of a problem's chains, seeded per problem, N and pool size.
SEED, N_AXIS, N_RESAMPLES = 123, (1, 2, 4, 8, 16), 64


def subsets_for(pid, n, repeats, size):
    import random
    import harness
    if n >= size:
        return [list(range(size))]
    rng = random.Random(harness.sha256_of([str(SEED), pid, str(n), str(size)])[:15])
    return [rng.sample(range(size), n) for _ in range(repeats)]


def curve(chains_by_pid):
    """One temperature's line: a point per N, each the mean over its problems."""
    out = []
    for n in N_AXIS:
        per = []
        for pid, rs in chains_by_pid.items():
            ts = [(tally([rs[i] for i in idx]), sum(rs[i]["tokens_generated"] for i in idx))
                  for idx in subsets_for(pid, n, N_RESAMPLES, len(rs))]
            per.append(dict(acc=mean(t["plurality_correct"] for t, _ in ts),
                            cov=mean(t["any_correct"] for t, _ in ts),
                            tie=mean(t["tie"] for t, _ in ts),
                            tok=mean(k for _, k in ts)))
        out.append(dict(n=n, accuracy=mean(x["acc"] for x in per), coverage=mean(x["cov"] for x in per),
                        tie_rate=mean(x["tie"] for x in per), mean_tokens=mean(x["tok"] for x in per)))
    return out


SWEEP_BUNDLE = HERE.parent / "runs" / "page-07-temperature-sweep.zip"


def build_sweep(bundle, dest):
    """The heat map from the temperature sweep (`page_07_temperature_sweep.py`): 16 chains at
    12 temperatures on 40 problems. Every cell is re-tallied here from the bundle's own chains
    with the vote copied above, and nothing is written unless each one, and each temperature's
    summary, matches the sweep's results.json."""
    import zipfile
    bundle = Path(bundle)
    with zipfile.ZipFile(bundle) as z:
        root = z.namelist()[0].split("/")[0]
        R = json.loads(z.read(f"{root}/results.json"))
        lines = z.read(f"{root}/traces.jsonl").decode("utf-8").splitlines()
    run_id, model, k = R["run_id"], R["model"], R["n_chains"]
    by = {}
    for line in lines:
        if line.strip():
            r = json.loads(line)
            if r["run_id"] == run_id and r["model_id"] == model:
                by.setdefault((r["config_id"], r["problem_id"]), {})[r["sample_index"]] = r

    problems, per_t = [], {t: [] for t in R["temperatures"]}
    for entry in R["heatmap"]:
        pid, cells = entry["problem_id"], []
        for t in R["temperatures"]:
            slots = by[(f"t{t:.2f}-c{R['chain_cap']}", pid)]
            rs = [slots[i] for i in range(k)]
            row = tally(rs)
            labels, _ = cluster([vote_key(r["trace"]) for r in rs])
            counts = Counter(l for l in labels if l is not NO_ANSWER).most_common()
            answer = counts[0][0] if counts and not row["tie"] else None
            cell = dict(temperature=t, n_correct=sum(bool(r["correct"]) for r in rs),
                        outcome="tie" if row["tie"] else "right" if row["plurality_correct"] else "wrong",
                        answer=answer)
            saved = entry["cells"][f"{t:.1f}"]
            assert (cell["n_correct"], cell["outcome"], answer) == (
                saved["correct_chains"], saved["outcome"], saved["plurality_answer"]), \
                f"{pid} T={t}: re-tallied {cell} but results.json says {saved}"
            cells.append(cell)
            per_t[t].append(row)
        problems.append(dict(problem_id=pid, level=entry["level"], subject=entry["subject"],
                             question=entry["question"], ground_truth=entry["ground_truth"],
                             cells=cells))
    for s in R["summary"]:
        rows = per_t[s["temperature"]]
        mine = dict(vote_accuracy=mean(r["plurality_correct"] for r in rows),
                    single_chain_accuracy=mean(r["mean_chain_correct"] for r in rows),
                    coverage=mean(r["any_correct"] for r in rows),
                    tie_rate=mean(r["tie"] for r in rows),
                    mean_distinct=mean(r["distinct_answers"] for r in rows))
        for key, v in mine.items():
            assert math.isclose(v, s[key], abs_tol=1e-9), \
                f"T={s['temperature']}: {key} is {v} here but {s[key]} in results.json"
        print(f"T={s['temperature']:<4} vote {mine['vote_accuracy']:.0%}  one chain "
              f"{mine['single_chain_accuracy']:.0%}  ties {mine['tie_rate']:.0%}  matches results.json")

    # Section 3's lines: every temperature at N = 1, 2, 4, 8, 16, the notebook's estimator.
    # At N = 16 a line is the full tally, so it must equal the summary saved above.
    curves = {}
    for t in R["temperatures"]:
        chains = {e["problem_id"]: [by[(f"t{t:.2f}-c{R['chain_cap']}", e["problem_id"])][i] for i in range(k)]
                  for e in R["heatmap"]}
        curves[f"{t:.1f}"] = curve(chains)
        s16 = next(x for x in R["summary"] if x["temperature"] == t)
        top = curves[f"{t:.1f}"][-1]
        for a, b in (("accuracy", "vote_accuracy"), ("coverage", "coverage"), ("tie_rate", "tie_rate")):
            assert math.isclose(top[a], s16[b], abs_tol=1e-9), f"T={t}: curve {a} {top[a]} != {s16[b]}"
        print(f"T={t:<4} line " + "  ".join(f"{p['n']}:{p['accuracy']:.0%}" for p in curves[f"{t:.1f}"]))

    out = {
        "source": {"kind": "temperature sweep", "run_id": run_id, "bundle": bundle.name,
                   "bundle_sha256": sha256(bundle), "builder": HERE.name,
                   "builder_sha256": sha256(HERE), "sample_seed": R["sample_seed"]},
        "n_chains": k,
        "chain_cap": R["chain_cap"],
        "temperatures": R["temperatures"],
        "best_temperature": R["best_temperature"],
        "summary": R["summary"],
        "control": R["control"],
        "n_axis": list(N_AXIS),
        "curves": curves,
        "problems": problems,
    }
    Path(dest).write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"\n{dest}  {len(problems)} problems x {len(R['temperatures'])} temperatures")


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--out-dir", default=str(HERE.parent / "out" / "page_07"),
                    help="the run's folder: results.json, manifest.json and traces.jsonl")
    ap.add_argument("--sweep", nargs="?", const=str(SWEEP_BUNDLE), default=None,
                    help="build from the temperature sweep's bundle instead (default path: "
                         "runs/page-07-temperature-sweep.zip)")
    ap.add_argument("--dest", default=str(WEB_DATA))
    a = ap.parse_args()
    if a.sweep:
        build_sweep(a.sweep, a.dest)
    else:
        build(a.out_dir, a.dest)
