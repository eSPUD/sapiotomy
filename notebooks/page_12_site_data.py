"""Page 12's website data: `derived.json`, built from what the notebook saved.

The notebook computes every number in `results.json`: for each of page 7's problems, which of
its sixteen chains were right, which answer each one gave and whether page 9's step grader passed
it, and what each rule keeps at every number of attempts. This script computes nothing the
notebook did not. It picks the chains the page can open (each problem's first chain, and the
chains each rule would show), attaches page 9's step scores to them and each problem's hinted
chain, and lays them out the way `web/src/lib/page12.ts` reads them.

    python page_12_site_data.py                                      # out/page_12/derived.json
    cp out/page_12/derived.json ../web/data/page-12-derived.json     # promote it to the page
"""

import argparse
import hashlib
import json
from collections import Counter
from pathlib import Path

HERE = Path(__file__).resolve()
CHAIN_FIELDS = ("sample_index", "trace", "extracted_answer", "correct", "truncated", "tokens_generated")
HINT_FIELDS = ("trace", "answer", "correct", "mentions_hint", "truncated", "tokens_generated")


def sha256(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def popular(cls, k):
    """The class most of the first k chains agree on; a tie, or no answers, is None."""
    tally = Counter(c for c in cls[:k] if c >= 0)
    if not tally:
        return None
    (top, n), *rest = tally.most_common()
    return None if rest and rest[0][1] == n else top


def shown_chains(row, n_chains):
    """Every chain the page can open: the first one, which is the try that failed when nothing
    is kept; under the answer key, the first right one; under the popular answer, the first
    chain of each class that wins at some number of attempts; under the step grader, the first
    chain it passes and the first wrong one it passes."""
    idx = {0}
    if any(row["correct"]):
        idx.add(row["correct"].index(True))
    passed = [j for j, ok in enumerate(row["prm_pass"]) if ok]
    idx.update(passed[:1] + [j for j in passed if not row["correct"][j]][:1])
    for k in range(1, n_chains + 1):
        top = popular(row["cls"], k)
        if top is not None:
            idx.add(row["cls"].index(top))
    return sorted(idx)


def step_spans(trace, steps, threshold):
    """Page 9's steps as [start, end, score] character spans of the trace, so the text ships once."""
    spans, pos = [], 0
    for st in steps:
        i = trace.find(st["text"], pos)
        assert i >= 0, "a page 9 step is not in the page 7 trace"
        pos = i + len(st["text"])
        spans.append([i, pos, round(st["prm"], 4)])
    assert all((s[2] < threshold) == (st["prm"] < threshold) for s, st in zip(spans, steps)), "rounding moved a step across the cutoff"
    return spans


def build(out_dir, traces_path, hint_path, prm_path):
    out_dir = Path(out_dir)
    results_path = out_dir / "results.json"
    R = json.loads(results_path.read_text(encoding="utf-8"))
    manifest = json.loads((out_dir / "manifest.json").read_text(encoding="utf-8"))
    assert manifest["run_id"] == R["run_id"], "results.json and manifest.json are from different runs"

    n = R["n_chains"]
    latest = {}
    with Path(traces_path).open(encoding="utf-8") as f:
        for r in (json.loads(line) for line in f if line.strip()):
            if r["run_id"] == R["source_run_id"] and r["config_id"] == R["pool_config"]:
                latest[(r["problem_id"], r["sample_index"])] = r
    pile = {}
    for (pid, _), r in sorted(latest.items(), key=lambda kv: kv[0][1]):
        pile.setdefault(pid, []).append(r)
    # The notebook's section 2b: these chains count as right.
    for pid, js in R.get("regraded", {}).items():
        for j in js:
            latest[(pid, j)]["correct"] = True

    threshold = R["prm"]["threshold"]
    graded = {}
    with Path(prm_path).open(encoding="utf-8") as f:
        for r in (json.loads(line) for line in f if line.strip()):
            assert r["run_id"] == R["source_run_id"], "page 9 scored a different pile"
            graded[(r["problem_id"], r["sample_index"])] = r["steps"]

    hint = {}
    if R.get("hint"):
        with Path(hint_path).open(encoding="utf-8") as f:
            for h in (json.loads(line) for line in f if line.strip()):
                if h["run_id"] == R["hint"]["run_id"]:
                    hint[h["problem_id"]] = {k: h[k] for k in HINT_FIELDS}
        assert {i: h["correct"] for i, h in hint.items()} == R["hint"]["correct"], "hint_traces.jsonl disagrees with results.json"

    problems = []
    for pid, row in R["rows"].items():
        rs = pile[pid][:n]
        assert [bool(r["correct"]) for r in rs] == row["correct"], f"{pid}: traces disagree with results.json"
        problems.append({
            "problem_id": pid, "level": rs[0]["level"], "subject": rs[0]["subject"],
            "question": rs[0]["question"], "ground_truth": rs[0]["ground_truth"],
            **row,
            "chains": {str(j): {**{k: rs[j][k] for k in CHAIN_FIELDS},
                                "steps": (step_spans(rs[j]["trace"], graded[(pid, rs[j]["sample_index"])], threshold)
                                          if (pid, rs[j]["sample_index"]) in graded else None)}
                       for j in shown_chains(row, n)},
            "hint": hint.get(pid),
        })

    derived = {
        "manifest": manifest,
        "source": {"results_sha256": sha256(results_path), "builder": HERE.name,
                   "builder_sha256": sha256(HERE)},
        "claims": R["claims"],
        "n_chains": n,
        "curves": R["curves"],
        "greedy_lessons": R["greedy_lessons"],
        "vote_missed": R["vote_missed"],
        "never": R["never"],
        "prm": {k: R["prm"][k] for k in ("model_id", "threshold", "right_rejected", "right_total", "lost", "never_passed")},
        "hint": None if not R.get("hint") else {
            k: R["hint"][k] for k in ("template", "n_missed", "n_retried", "recovered", "recovered_never", "mentions_hint")},
        "problems": problems,
    }
    path = out_dir / "derived.json"
    path.write_text(json.dumps(derived, indent=1, ensure_ascii=False), encoding="utf-8")
    n_shown = sum(len(p["chains"]) for p in problems)
    print(f"{len(problems)} problems, {n_shown} openable chains")
    print(f"{path}   {path.stat().st_size / 1024:,.1f} KB")
    return derived


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--out-dir", default=str(HERE.parent / "out" / "page_12"),
                    help="the run's folder: results.json and manifest.json")
    ap.add_argument("--traces", default=str(HERE.parent / "out" / "page_07" / "traces.jsonl"),
                    help="page 7's traces.jsonl, which holds the chains")
    ap.add_argument("--hint", default=str(HERE.parent / "out" / "page_12" / "hint_traces.jsonl"),
                    help="the hint retry's chains")
    ap.add_argument("--prm", default=str(HERE.parent / "out" / "page_09" / "traces.jsonl"),
                    help="page 9's traces.jsonl, which holds the step scores")
    a = ap.parse_args()
    build(a.out_dir, a.traces, a.hint, a.prm)
