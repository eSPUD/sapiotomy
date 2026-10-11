"""Page 6's website data: `derived.json`, built from what the notebook saved.

The notebook computes every number and saves it to `results.json`, beside the run's
`manifest.json` and `traces.jsonl`. This script computes nothing the notebook did not. It
chooses what the page shows (the example problem for figure 1, the rescued and wrecked
chains for the Wait arm, which chains to embed), adds the closing panel's numbers, and lays
it all out the way `web/src/lib/page06.ts` reads it.

    python page_06_site_data.py                                      # out/page_06/derived.json
    cp out/page_06/derived.json ../web/data/page-06-derived.json     # promote it to the page

`derived.json` records the sha256 of the results file and of this script, so the page's
data names exactly what it was built from.
"""

import argparse
import hashlib
import json
from pathlib import Path

HERE = Path(__file__).resolve()

BUNDLED = 8           # figure 3 rows the page can open, spread from top to bottom
PAGE7_TOTAL = 2048    # the closing panel: the total page 7 splits into many short chains

RUN_FIELDS = ("budget", "trace", "tokens", "truncated", "extracted_answer", "correct",
              "own_tokens", "tokens_generated")
WAIT_FIELDS = ("waits", "trace", "tokens", "wait_spans", "truncated", "offered_a_stop",
               "extracted_answer", "correct", "own_tokens", "tokens_generated", "carried_from")


def sha256(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def load_records(traces_path, run_id, problem_ids, budgets, primary, wait_lead):
    """The chains the page embeds, read the way the notebook reads them: this run only,
    the last write per key winning. Returns (primary[pid][budget], wait[pid][k])."""
    order = {pid: i for i, pid in enumerate(problem_ids)}
    by_budget, by_wait = {}, {}
    with Path(traces_path).open(encoding="utf-8") as f:
        for r in (json.loads(line) for line in f if line.strip()):
            if r["run_id"] != run_id or r["problem_id"] not in order:
                continue
            if r.get("arm") == "wait":
                if r["model_id"] == wait_lead:
                    by_wait.setdefault(r["problem_id"], {})[r["waits"]] = r
            elif r["model_id"] == primary and r["budget"] in budgets:
                by_budget.setdefault(r["problem_id"], {})[r["budget"]] = r
    ordered = lambda d: dict(sorted(d.items(), key=lambda kv: order[kv[0]]))
    return ordered(by_budget), ordered(by_wait)


def first_correct(row, budgets):
    return next((b for b in budgets if row[b]["correct"]), None)


def figure_1_specimen(primary, budgets):
    """A problem that is wrong when cut off at a small budget and right at a larger one,
    preferring one that turns correct mid-grid and has a short chain."""
    top = budgets[-1]
    candidates = []
    for pid, row in primary.items():
        flip = first_correct(row, budgets)
        if flip is None or flip == budgets[0]:
            continue                                        # needs a visible "before"
        if not row[budgets[budgets.index(flip) - 1]]["truncated"]:
            continue                                        # the budget below must show a real cut
        distance_from_middle = abs(budgets.index(flip) - (len(budgets) - 1) / 2)
        candidates.append((distance_from_middle, len(row[top]["tokens"]), pid, flip))
    candidates.sort()
    if candidates:
        _, _, pid, flip = candidates[0]
        return pid, flip, False, len(candidates)
    pid = min(primary, key=lambda p: len(primary[p][top]["tokens"]))   # flagged; the page refuses it
    return pid, first_correct(primary[pid], budgets), True, 0


def wait_specimen(by_wait, waits, rescued):
    """The shortest chain the extra thinking rescued (or wrecked), so the page can show it whole."""
    best = None
    for pid, by_k in by_wait.items():
        v = [by_k[k]["correct"] for k in waits]
        hit = (not v[0] and any(v[1:])) if rescued else (v[0] and not all(v))
        size = by_k[waits[-1]]["own_tokens"]
        if hit and (best is None or size < best[0]):
            best = (size, pid)
    return best[1] if best else None


def build(out_dir):
    out_dir = Path(out_dir)
    results_path = out_dir / "results.json"
    R = json.loads(results_path.read_text(encoding="utf-8"))
    manifest = json.loads((out_dir / "manifest.json").read_text(encoding="utf-8"))
    assert manifest["run_id"] == R["run_id"], "results.json and manifest.json are from different runs"

    budgets, waits, pids = R["budgets"], R["waits"], R["problem_ids"]
    primary_id, wait = R["primary_model"], R["wait"]
    primary, by_wait = load_records(out_dir / "traces.jsonl", R["run_id"], pids, set(budgets),
                                    primary_id, wait and wait["lead_model"])
    strip = R["flip_strip"]

    # The chains read here must be the ones the notebook graded.
    assert list(primary) == pids, "traces.jsonl does not hold the primary model on every problem"
    for item in strip["items"]:
        got = [bool(primary[item["problem_id"]][b]["correct"]) for b in budgets]
        assert got == item["correct_by_budget"], f"{item['problem_id']}: the traces disagree with results.json"

    specimen_id, flip, is_fallback, n_candidates = figure_1_specimen(primary, budgets)
    spread = sorted({round(i * (len(strip["items"]) - 1) / (BUNDLED - 1)) for i in range(BUNDLED)})
    bundled_ids = [strip["items"][i]["problem_id"] for i in spread]
    if specimen_id not in bundled_ids:
        bundled_ids.insert(0, specimen_id)

    def bundle_row(pid):
        row, ref = primary[pid], primary[pid][budgets[-1]]
        return dict(problem_id=pid, level=ref["level"], subject=ref["subject"], question=ref["question"],
                    ground_truth=ref["ground_truth"], first_correct_budget=first_correct(row, budgets),
                    reference_tokens=ref["tokens"], reference_truncated=ref["truncated"],
                    by_budget=[{k: row[b][k] for k in RUN_FIELDS} for b in budgets])

    def wait_bundle_row(pid):
        by_k, ref = by_wait[pid], by_wait[pid][waits[-1]]
        return dict(problem_id=pid, level=ref["level"], subject=ref["subject"], question=ref["question"],
                    ground_truth=ref["ground_truth"],
                    first_correct_waits=next((k for k in waits if by_k[k]["correct"]), None),
                    by_waits=[{f: by_k[k][f] for f in WAIT_FIELDS} for k in waits])

    meta = {m["id"]: m for m in manifest["models"]}
    curve = lambda m, **extra: dict(model_id=m, label=meta[m]["label"], params=meta[m]["params"], **extra)

    figure_wait = None
    if wait:
        lead_points = wait["curves"][wait["lead_model"]]
        for k, pt in zip(waits, lead_points):
            n_correct = sum(by_wait[p][k]["correct"] for p in by_wait)
            assert n_correct == pt["n_correct"], f"Wait arm at k={k}: the traces disagree with results.json"
        fixed, broken = (wait_specimen(by_wait, waits, rescued) for rescued in (True, False))
        figure_wait = {
            "waits": waits, "word": wait["word"], "n_items": len(pids), "allowance": wait["allowance"],
            "curves": [curve(m, points=pts, paired=wait["paired"][m]) for m, pts in wait["curves"].items()],
            "specimen_fixed": fixed, "specimen_broken": broken,
            "specimen_is_fallback": {"fixed": fixed is None, "broken": broken is None},
            "rows": [wait_bundle_row(p) for p in (fixed, broken) if p],
            "integrity": wait["checks"],
        }

    # The closing panel: one chain of PAGE7_TOTAL tokens against the same total split into
    # chains of the smallest budget, which is the split page 7 measures.
    points = R["curves"][primary_id]["points"]
    top_pt = next(p for p in points if p["budget"] == PAGE7_TOTAL)
    handoff = dict(model_id=primary_id, max_budget=PAGE7_TOTAL, min_budget=budgets[0],
                   chains_at_min_budget=PAGE7_TOTAL // budgets[0],
                   accuracy_at_max=top_pt["accuracy"], accuracy_at_min=points[0]["accuracy"],
                   total_tokens_at_max=top_pt["total_tokens"], mean_tokens_at_max=top_pt["mean_tokens"],
                   never_flip_share=strip["never_flip_share"], never_flip_count=strip["never_flip_count"],
                   n_items=len(strip["items"]))

    derived = {
        "manifest": manifest,
        "source": {"results_sha256": sha256(results_path), "builder": HERE.name,
                   "builder_sha256": sha256(HERE)},
        "budgets": budgets,
        "procedure": (f"Cap generation at N tokens; a chain cut off before writing a boxed answer counts as "
                      f"wrong; grade with MATH-500's reference answer. Repeat for N in "
                      f"{{{', '.join(map(str, budgets))}}} over {len(pids)} problems from levels 4-5, "
                      f"greedy throughout."),
        "pilot": R["pilot"],
        "figure_1": {"specimen_id": specimen_id, "specimen_is_fallback": is_fallback,
                     "flip_budget": flip, "n_candidate_specimens": n_candidates,
                     "rows": [bundle_row(pid) for pid in bundled_ids]},
        "figure_2": {"curves": [curve(m, points=c["points"], **{k: v for k, v in c.items() if k != "points"})
                                for m, c in R["curves"].items()]},
        "figure_3": {**strip, "clickable_row_ids": bundled_ids},
        "figure_wait": figure_wait,
        "handoff": handoff,
    }
    path = out_dir / "derived.json"
    path.write_text(json.dumps(derived, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"figure 1 example: {specimen_id}, turns correct at {flip} tokens "
          f"({n_candidates} candidates{', FALLBACK' if is_fallback else ''})")
    if figure_wait:
        print(f"Wait arm examples: rescued {figure_wait['specimen_fixed']}, "
              f"wrecked {figure_wait['specimen_broken']}")
    print(f"{path}   {path.stat().st_size / 1024:,.0f} KB")
    return derived


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--out-dir", default=str(HERE.parent / "out" / "page_06"),
                    help="the run's folder: results.json, manifest.json and traces.jsonl")
    build(ap.parse_args().out_dir)
