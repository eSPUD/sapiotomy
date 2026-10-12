"""Page 8's measured figures, built from page 7's chains and the verifier's scores of them.

Reads two things and computes nothing they do not hold:

  - page 7's temperature sweep (`runs/page-07-temperature-sweep.zip`): its 16 chains on each
    of 40 problems at T = 0.3, its greedy chain, and `results.json`, whose per-problem vote
    this reuses rather than re-tallies;
  - `runs/page-08-pile/scores.jsonl`, written by `page_08_pile_scores.py` (to
    `out/page_08_pile/`) and copied there when the pass is promoted to the page.

Writes `web/data/page-08-pile.json` (what the measured figures draw) and one file per problem
under `web/data/page-08-chains/` (the chains' text, loaded when a reader opens one). Refuses
to write if its vote, chain accuracy or coverage differ from what page 7 published.

    cd notebooks
    python page_08_pile_site_data.py
"""

import argparse
import hashlib
import json
import math
import zipfile
from collections import Counter
from pathlib import Path

HERE = Path(__file__).resolve().parent
SWEEP_ZIP = HERE / "runs/page-07-temperature-sweep.zip"
SWEEP = "page-07-temperature-sweep/"
SCORES = HERE / "runs/page-08-pile/scores.jsonl"
WEB_DATA = HERE.parent / "web/data"
DEST = WEB_DATA / "page-08-pile.json"
CHAINS_DIR = WEB_DATA / "page-08-chains"

P7_RUN_ID = "full-math500_l45-n100-9ab2b579-cap2048-pool16-p0.95-bfloat16-cuda"
PILE_CONFIG = "t0.30-c2048"
GREEDY_CONFIG = "t0.00-c2048"
SCORE_ID = f"p08-pile-{P7_RUN_ID}"
VERIFIER = "Skywork/Skywork-o1-Open-PRM-Qwen-2.5-1.5B"
N_CHAINS = 16
N_CARDS = 4          # chain cards in figure 5


def sha256(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def sigmoid(x):
    """The verifier's score as a chance of being right, the way its model card reads it."""
    return 1 / (1 + math.exp(-x))


def mcnemar(a, b):
    """Exact two-sided test over the problems where a and b disagree (harness.mcnemar)."""
    x = sum(1 for k in a if a[k] and not b[k])
    y = sum(1 for k in a if b[k] and not a[k])
    n = x + y
    if n == 0:
        return x, y, 1.0
    return x, y, min(1.0, 2 * sum(math.comb(n, i) for i in range(max(x, y), n + 1)) / 2 ** n)


def read_page_7():
    """The sweep's chains at T = 0.3 and its greedy chain, page 7's way: this run only, the
    last write per key winning, in sample order. And its results.json."""
    latest = {}
    with zipfile.ZipFile(SWEEP_ZIP) as z:
        with z.open(SWEEP + "traces.jsonl") as f:
            for line in f:
                if line.strip():
                    r = json.loads(line)
                    if r["run_id"] == P7_RUN_ID and r["config_id"] in (PILE_CONFIG, GREEDY_CONFIG):
                        latest[(r["config_id"], r["problem_id"], int(r["sample_index"]))] = r
        results = json.loads(z.read(SWEEP + "results.json"))
    wanted = {h["problem_id"] for h in results["heatmap"]}
    latest = {k: r for k, r in latest.items() if k[1] in wanted}
    pile, greedy = {}, {}
    for (cid, pid, si), r in sorted(latest.items(), key=lambda kv: kv[0]):
        if cid == PILE_CONFIG:
            pile.setdefault(pid, []).append(r)
        elif si == 0:
            greedy[pid] = bool(r["correct"])
    return pile, greedy, results


def read_scores(path, score_id, scorer):
    got = {}
    with Path(path).open(encoding="utf-8") as f:
        for line in f:
            if line.strip():
                s = json.loads(line)
                if s["score_id"] == score_id and s["scorer"] == scorer:
                    got[(s["problem_id"], int(s["sample_index"]))] = s
    return got


def build(scores_path, score_id, scorer, stand_in):
    pile, greedy, R = read_page_7()
    T = f"{R['best_temperature']}"
    assert PILE_CONFIG == f"t{R['best_temperature']:.2f}-c{R['chain_cap']}", "the pile is not page 7's best temperature"
    rows_7 = {h["problem_id"]: h["cells"][T] for h in R["heatmap"]}
    hand = next(x for x in R["summary"] if x["temperature"] == R["best_temperature"])
    assert set(pile) == set(rows_7) == set(greedy), "page 7's chains, greedy chain and results disagree"
    scores = read_scores(scores_path, score_id, scorer)
    missing = [(p, int(r["sample_index"])) for p, rs in pile.items() for r in rs
               if (p, int(r["sample_index"])) not in scores]
    assert not missing, f"{len(missing)} of the pile's chains have no {scorer} score, e.g. {missing[:3]}"

    rows, chains_text = [], {}
    for pid, rs in pile.items():
        assert len(rs) == N_CHAINS, f"{pid}: {len(rs)} chains"
        p7 = rows_7[pid]
        n_correct = sum(bool(r["correct"]) for r in rs)
        assert n_correct == p7["correct_chains"], pid
        ranked = sorted(rs, key=lambda r: (-float(scores[(pid, int(r["sample_index"]))]["score"]),
                                           int(r["sample_index"])))
        chains = []
        for r in ranked:
            s = scores[(pid, int(r["sample_index"]))]
            chains.append(dict(
                i=int(r["sample_index"]), c=bool(r["correct"]),
                s=round(float(s["score"]), 4), r=round(100 * sigmoid(float(s["score"]))),
                a=r["extracted_answer"],
            ))
        rows.append(dict(
            id=pid, level=int(rs[0]["level"]), subject=rs[0]["subject"],
            question=rs[0]["question"], answer=rs[0]["ground_truth"],
            n_correct=n_correct,
            vote=p7["outcome"],
            vote_answer=None if p7["outcome"] == "tie" else p7["plurality_answer"],
            greedy=greedy[pid], chains=chains))
        chains_text[pid] = {str(int(r["sample_index"])): r["trace"] for r in rs}

    # Most chains right at the top; problem id breaks ties.
    rows.sort(key=lambda r: (-r["n_correct"], r["id"]))
    for k, row in enumerate(rows):
        row["file"] = f"{k:03d}"

    n = len(rows)
    vote = {r["id"]: r["vote"] == "right" for r in rows}
    best = {r["id"]: r["chains"][0]["c"] for r in rows}
    one = {r["id"]: r["greedy"] for r in rows}
    present = {r["id"]: r["n_correct"] > 0 for r in rows}
    bars = dict(
        one_chain=sum(one.values()) / n,
        chain_average=sum(r["n_correct"] for r in rows) / (n * N_CHAINS),
        vote=sum(vote.values()) / n,
        best_of_n=sum(best.values()) / n,
        ceiling=sum(present.values()) / n)
    assert abs(bars["vote"] - hand["vote_accuracy"]) < 1e-9, (bars["vote"], hand)
    assert abs(bars["chain_average"] - hand["single_chain_accuracy"]) < 1e-9, (bars, hand)
    assert abs(bars["ceiling"] - hand["coverage"]) < 1e-9, (bars, hand)
    b_only, v_only, p = mcnemar(best, vote)
    bars["best_vs_vote"] = dict(best_only=b_only, vote_only=v_only, p=p)
    b_only, o_only, p = mcnemar(best, one)
    bars["best_vs_one"] = dict(best_only=b_only, one_only=o_only, p=p)
    v_only, o_only, p = mcnemar(vote, one)
    bars["vote_vs_one"] = dict(vote_only=v_only, one_only=o_only, p=p)

    # The judge's misses: a right chain was in the pile, and the top-rated one is wrong.
    miss_ids = [r["id"] for r in rows if r["n_correct"] > 0 and not r["chains"][0]["c"]]
    misses = dict(n=len(miss_ids), of=sum(present.values()), ids=miss_ids)

    # Figure 5: one miss where the vote did not find the right answer either (a miss the
    # vote fixes makes figure 3's point again). The shortest question wins.
    pool = [r for r in rows if r["id"] in miss_ids and r["vote"] != "right"]
    assert pool, "no judge miss outside the vote's wins to draw"
    spec = min(pool, key=lambda r: (len(r["question"]), r["id"]))
    top_right = next(c for c in spec["chains"] if c["c"])
    cards = spec["chains"][:N_CARDS - 1]
    cards = cards + [top_right] if top_right not in cards else spec["chains"][:N_CARDS]
    specimen = dict(
        id=spec["id"], question=spec["question"], answer=spec["answer"],
        vote=spec["vote"], vote_answer=spec["vote_answer"], n_correct=spec["n_correct"],
        right_rank=spec["chains"].index(top_right) + 1,
        cards=[dict(c, trace=chains_text[spec["id"]][str(c["i"])]) for c in cards])

    out = dict(
        source=dict(
            page_7_run_id=P7_RUN_ID, page_7_bundle=SWEEP_ZIP.name, page_7_bundle_sha256=sha256(SWEEP_ZIP),
            scores=scores_path.name, scores_sha256=sha256(scores_path), score_id=score_id,
            builder=Path(__file__).name, builder_sha256=sha256(__file__), stand_in=stand_in),
        writer=R["model"], verifier=VERIFIER if not stand_in else scorer,
        benchmark="MATH-500", levels=[4, 5], temperature=R["best_temperature"],
        n_chains=N_CHAINS, bars=bars, misses=misses, specimen=specimen,
        rows=[{k: v for k, v in r.items() if k != "question"} | {"question": r["question"]} for r in rows])
    DEST.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")

    CHAINS_DIR.mkdir(exist_ok=True)
    for old in CHAINS_DIR.glob("*.json"):
        old.unlink()
    for r in rows:
        (CHAINS_DIR / f"{r['file']}.json").write_text(
            json.dumps(chains_text[r["id"]], ensure_ascii=False, separators=(",", ":")) + "\n",
            encoding="utf-8")

    print(f"wrote {DEST} ({DEST.stat().st_size / 1e3:.0f} kB) and {len(rows)} chain files")
    print(f"one chain {bars['one_chain']:.0%}  vote {bars['vote']:.0%}  best-of-{N_CHAINS} "
          f"{bars['best_of_n']:.0%}  ceiling {bars['ceiling']:.0%}")
    print(f"best vs vote: {bars['best_vs_vote']}")
    print(f"judge misses: {misses['n']} of {misses['of']}; specimen {spec['id']} "
          f"(right chain ranked {specimen['right_rank']})")
    if stand_in:
        print("STAND-IN: these are not the trained verifier's scores. Do not ship.")


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--scores", type=Path, default=SCORES)
    ap.add_argument("--score-id", default=SCORE_ID)
    ap.add_argument("--scorer", default="skywork-prm")
    args = ap.parse_args()
    build(args.scores, args.score_id, args.scorer, stand_in=args.scorer != "skywork-prm")


if __name__ == "__main__":
    main()
