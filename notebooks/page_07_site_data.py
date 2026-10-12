"""Page 7's website data: `derived.json`, built from what the notebook saved.

The notebook computes every number, and the claims the page may make, and saves them to
`results.json` beside the run's `manifest.json` and `traces.jsonl`. This script computes
nothing the notebook did not. It chooses which problems' chains the page embeds (figure 1's
example, the problems the page shows beside it, and the widest tallies), writes the page's
procedure sentence, and lays it all out
the way `web/src/lib/page07.ts` reads it.

    python page_07_site_data.py                                      # out/page_07/derived.json
    cp out/page_07/derived.json ../web/data/page-07-derived.json     # promote it to the page

`derived.json` records the sha256 of the results file and of this script, so the page's
data names exactly what it was built from.
"""

import argparse
import hashlib
import json
from pathlib import Path

HERE = Path(__file__).resolve()

N_BUNDLED_PROBLEMS = 6
# Figure 1 lets the reader switch from the specimen to a vote that comes out wrong and a
# vote that ties. These are the problems it shows for those two, picked by hand from the
# pile for being short and easy to follow. Their outcomes are checked against
# results.json below, and again by web/src/lib/page07.ts, which names them too.
SHOWCASE = {
    "wrong": "test/algebra/224.json",   # 15 chains say 7; the one that says 8 is right
    "tie": "test/algebra/1837.json",    # 7 say 5, which is right, and 7 say 4
}
# Pages 5 and 6 reveal a chain token by token and need the per-token strings; this page
# opens a bar and shows prose, so `tokens` stays in traces.jsonl rather than putting
# megabytes of per-token quoting into the web bundle.
CHAIN_FIELDS = ("sample_index", "batch_seed", "group_index", "trace", "cut_index", "answer_start",
                "truncated", "forced", "extracted_answer", "vote_key", "correct", "own_tokens",
                "tokens_generated")
# The page may not be translated unless these hold. `splitting_a_fixed_budget_pays` is not
# among them and is not expected to be true on this band: false changes what beat 2's
# second panel says ("voting buys accuracy, and the budget has to come from somewhere").
BLOCKING = ("vote_beats_bare_cot", "coverage_exceeds_vote", "specimen_usable")


def sha256(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def load_pile(traces_path, run_id, model_id, config_id, wanted):
    """The pile's chains for the problems in `wanted`, read the way the notebook reads
    them: this run only, the last write per key winning, in sample order."""
    latest = {}
    with Path(traces_path).open(encoding="utf-8") as f:
        for r in (json.loads(line) for line in f if line.strip()):
            if (r["run_id"] == run_id and r["model_id"] == model_id
                    and r["config_id"] == config_id and r["problem_id"] in wanted):
                latest[(r["problem_id"], r["sample_index"])] = r
    pile = {}
    for (pid, _), r in sorted(latest.items(), key=lambda kv: kv[0][1]):
        pile.setdefault(pid, []).append(r)
    return pile


def build(out_dir):
    out_dir = Path(out_dir)
    results_path = out_dir / "results.json"
    R = json.loads(results_path.read_text(encoding="utf-8"))
    manifest = json.loads((out_dir / "manifest.json").read_text(encoding="utf-8"))
    assert manifest["run_id"] == R["run_id"], "results.json and manifest.json are from different runs"

    pile, rows, spec = R["pile"], R["pile_rows"], R["specimen"]
    specimen_id = spec["specimen_id"]
    for outcome, pid in SHOWCASE.items():
        row = rows[pid]
        got = "tie" if row["tie"] else "right" if row["plurality_correct"] else "wrong"
        assert got == outcome, f"{pid} is shown as a vote that comes out {outcome!r}, but it is {got!r}"
        assert row["any_correct"], f"{pid} is shown losing the right answer, but no chain has it"
    shown = [specimen_id, *SHOWCASE.values()]
    widest = sorted(rows, key=lambda p: -rows[p]["distinct_answers"])
    bundled_ids = shown + [p for p in widest if p not in shown][:N_BUNDLED_PROBLEMS - len(shown)]
    chains = load_pile(out_dir / "traces.jsonl", R["run_id"], R["primary_model"],
                       pile["config_id"], set(bundled_ids))

    def bundle_problem(pid):
        rs, row = chains[pid], rows[pid]
        # The chains read here must be the ones the notebook tallied.
        assert len(rs) == pile["n_chains"], f"{pid}: {len(rs)} chains in traces.jsonl, not {pile['n_chains']}"
        assert any(r["correct"] for r in rs) == row["any_correct"], f"{pid}: the traces disagree with results.json"
        return {
            "problem_id": pid, "level": rs[0]["level"], "subject": rs[0]["subject"],
            "question": rs[0]["question"], "ground_truth": rs[0]["ground_truth"],
            "config_id": pile["config_id"], "temperature": rs[0]["temperature"],
            "chain_cap": rs[0]["chain_budget"],
            "ranked": row["ranked"],
            **{k: row[k] for k in ("distinct_answers", "answer_entropy", "plurality_answer",
                                   "plurality_correct", "tie", "any_correct", "no_answer_rate")},
            "chains": [{k: r[k] for k in CHAIN_FIELDS} for r in rs],
        }

    derived = {
        "manifest": manifest,
        "source": {"results_sha256": sha256(results_path), "builder": HERE.name,
                   "builder_sha256": sha256(HERE)},
        # Read before any number.
        "claims": R["claims"],
        "procedure": (
            f"Sample N chains of one problem at temperature T with top-p {manifest['decoding']['top_p']}, "
            f"each capped at {pile['chain_cap']} tokens and forced to commit if it hits the cap; grade "
            f"with MATH-500's reference answer; keep the answer the most chains agree on, where "
            f"agreement is ch03 equivalence and a tie is not a vote. The N axis is drawn from one pile "
            f"of {pile['n_chains']} chains over {manifest['items']['n']} problems."),
        "figure_1": {**pile, **spec, "problems": [bundle_problem(pid) for pid in bundled_ids]},
        "figure_2": {
            "pile": R["pile_curves"],
            "split": R["split"],
            # Every shared budget, and the same chains allowed to finish (the pile).
            "split_budgets": R["split_budgets"],
            "uncapped": R["uncapped"],
            "splitting_pays": R["splitting_pays"],
            "best_split_n": R["best_split_n"],
            # `n_items` here is the diversity family's smaller item set, not the pile's.
            "diversity": R["diversity"],
            # Two contrasts, and the page quotes the second. `vs_one_sample` is the
            # self-consistency literature's baseline; `vs_bare_cot` is pages 5 and 6's.
            "gain": R["gain"],
        },
        "handoff": R["handoff"],
        "pool": {**pile,
                 "note": "this page's candidate pile; page 8 re-runs the same protocol on its own chains"},
    }
    path = out_dir / "derived.json"
    path.write_text(json.dumps(derived, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"bundling {len(bundled_ids)} problems at {pile['config_id']}:")
    for pid in bundled_ids:
        print(f"  {pid:<34} {rows[pid]['distinct_answers']:>2} distinct  vote "
              f"{'right' if rows[pid]['plurality_correct'] else 'wrong':<5}"
              f"{'   <- figure 1 specimen' if pid == specimen_id else ''}")
    kb = path.stat().st_size / 1024
    print(f"\n{path}   {kb:,.1f} KB" + ("   over 1 MB: lower N_BUNDLED_PROBLEMS" if kb > 1024 else ""))
    failed = [k for k in BLOCKING if not R["claims"][k]]
    print(f"\n{'TRANSLATABLE' if not failed else 'NOT TRANSLATABLE: ' + ', '.join(failed)}")
    return derived


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--out-dir", default=str(HERE.parent / "out" / "page_07"),
                    help="the run's folder: results.json, manifest.json and traces.jsonl")
    build(ap.parse_args().out_dir)
