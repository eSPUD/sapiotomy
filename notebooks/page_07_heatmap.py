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


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--out-dir", default=str(HERE.parent / "out" / "page_07"),
                    help="the run's folder: results.json, manifest.json and traces.jsonl")
    ap.add_argument("--dest", default=str(WEB_DATA))
    a = ap.parse_args()
    build(a.out_dir, a.dest)
