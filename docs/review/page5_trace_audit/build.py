"""Build page5-trace-audit.html: all 100 page 5 problems, System 1 against System 2.

Reads traces.jsonl from the page 5 notebook download and writes a single,
self-contained HTML file (data embedded) that opens in any browser.

    python docs/review/page5_trace_audit/build.py

By default it reads the traces straight out of web/public/notebooks/page-05-how-to-reason.zip;
pass --traces path/to/traces.jsonl to use an extracted copy instead.

Grading is the run's own, with one exception flagged on the page: a
whitespace-insensitive re-grade of intermediate algebra 1981, where the run's
grader rejected "(2, 12) \\cup (12, 102)" against "(2,12) \\cup (12,102)".
The four "where System 2 went wrong" notes are hand-written and live in
template.html (FOUR_NOTES).
"""
import argparse
import collections
import io
import json
import zipfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[2]
ZIP = REPO / "web/public/notebooks/page-05-how-to-reason.zip"
ZIP_MEMBER = "page-05-how-to-reason/out/page_05/traces.jsonl"
FIX_GRADER = {"test/intermediate_algebra/1981.json"}
CONDITIONS = ["forced_blurt", "bare", "zero_shot_cot"]  # System 1, System 2, step-by-step prompt


def read_traces(path):
    if path:
        return [json.loads(l) for l in open(path) if l.strip()]
    with zipfile.ZipFile(ZIP) as z, z.open(ZIP_MEMBER) as f:
        return [json.loads(l) for l in io.TextIOWrapper(f) if l.strip()]


def short(model_id):
    return model_id.split("/")[-1].replace("Qwen2.5-", "").replace("-Instruct", "")


def loop_split(t):
    """If a trace ends in a verbatim loop, return (text through the first cycle, cycle, extra repeats)."""
    n = len(t)
    for p in range(4, 700):
        if n < 4 * p:
            break
        j = n - p - 1
        while j >= 0 and t[j] == t[j + p]:
            j -= 1
        start = j + 1
        span = n - start
        if span >= 3 * p and span >= 400:
            return t[: start + p], t[start : start + p], span // p - 1
    return None


def regraded(pid, cond, r):
    return (pid in FIX_GRADER and cond != "forced_blurt" and not r["correct"]
            and (r["extracted_answer"] or "").replace(" ", "") == r["ground_truth"].replace(" ", ""))


def build(rows):
    by = collections.defaultdict(dict)
    for r in rows:
        by[r["problem_id"]][(short(r["model_id"]), r["condition"])] = r
    items = []
    for pid in sorted(by):
        d = by[pid]
        b = d[("3B", "bare")]
        it = {"id": pid, "level": b["level"], "subject": b["subject"], "question": b["question"],
              "truth": b["ground_truth"], "cond": {}, "others": {}}
        for c in CONDITIONS:
            r = d[("3B", c)]
            e = {"answer": r["extracted_answer"], "correct": bool(r["correct"]),
                 "regraded": regraded(pid, c, r), "tokens": r["tokens_generated"],
                 "capped": r["truncated"], "boxed": r["boxed"], "trace": r["trace"]}
            ls = loop_split(r["trace"]) if r["truncated"] else None
            if ls:
                e["trace"], e["loop"] = ls[0], {"unit": ls[1], "more": ls[2]}
            it["cond"][c] = e
        for m in ["1.5B", "7B"]:
            it["others"][m] = {c: {"answer": d[(m, c)]["extracted_answer"],
                                   "correct": bool(d[(m, c)]["correct"]) or regraded(pid, c, d[(m, c)]),
                                   "capped": d[(m, c)]["truncated"]} for c in CONDITIONS}
        items.append(it)
    return items


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--traces", help="path to traces.jsonl (default: read from the page 5 zip)")
    ap.add_argument("--out", default=str(HERE / "page5-trace-audit.html"))
    a = ap.parse_args()
    items = build(read_traces(a.traces))
    data = json.dumps(items).replace("</", "<\\/")
    html = (HERE / "template.html").read_text().replace("__DATA__", data)
    Path(a.out).write_text(html)
    print(f"wrote {a.out} ({len(html) / 1e6:.2f} MB, {len(items)} problems)")


if __name__ == "__main__":
    main()
