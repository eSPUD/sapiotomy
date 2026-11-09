"""Page 8's measured figures, built from the temperature sweep's chains and the ORM's score of every one.

Reads `scored_orm_T{t}_L2048.json`, the sweep's chain files with each chain gaining `orm`, written
by `8_Best_of_N_ORM_dev.ipynb`. Writes `web/data/page-08-pile.json`.

    python page_08_pile_site_data.py --scored scored_responses --chains page_7_json_files \
        --math500 test.jsonl --page7 ../web/data/page-07-run.json

`--chains` is the sweep's own folder: every chain must match it, text and answer. The temperature is
the page 7 run's best temperature. The grader, the vote and the problem draw are that run's, and the
script refuses to write unless its vote, chain accuracy and ceiling are the numbers it published.

A chain with no answer cannot be kept. It sorts after every answered chain with its score blanked.
"""

import argparse
import hashlib
import json
import math
import random
from collections import Counter
from pathlib import Path

from math_verify import parse, verify

HERE = Path(__file__).resolve()
DEST = HERE.parent.parent / "web/data/page-08-pile.json"

WRITER = "Qwen/Qwen2.5-3B-Instruct"
VERIFIER = "Skywork/Skywork-o1-Open-PRM-Qwen-2.5-1.5B"
TEMPERATURES = [round(0.1 * i, 1) for i in range(12)]
CAP = 2048
N_PROBLEMS = 100
N_CHAINS = 16
N_CARDS = 4
SEED = 42

memo_g, memo_s = {}, {}


def grade(pred, gold):
    if pred == "":
        return False
    key = (pred, gold)
    if key not in memo_g:
        try:
            memo_g[key] = bool(verify(parse(f"${str(gold).strip()}$"), parse(f"${pred}$")))
        except Exception:
            memo_g[key] = pred.replace(" ", "").lower() == str(gold).strip().replace(" ", "").lower()
    return memo_g[key]


def same_answer(a, b):
    if a.replace(" ", "") == b.replace(" ", ""):
        return True
    if (a, b) not in memo_s:
        try:
            memo_s[(a, b)] = bool(verify(parse(f"${a}$"), parse(f"${b}$")))
        except Exception:
            memo_s[(a, b)] = False
    return memo_s[(a, b)]


def tally(chains, gold):
    """Each chain's group (None when it has no answer), the groups' first-seen answers, and whether
    each group is the right answer."""
    groups, labels = [], []
    for chain in chains:
        answer = chain["answer"]
        if answer == "":
            labels.append(None)
            continue
        for g, rep in enumerate(groups):
            if same_answer(rep, answer):
                labels.append(g)
                break
        else:
            groups.append(answer)
            labels.append(len(groups) - 1)
    return labels, groups, [grade(rep, gold) for rep in groups]


def vote_outcome(labels, right):
    top = Counter(l for l in labels if l is not None).most_common(2)
    if not top:
        return "wrong", None
    if len(top) == 2 and top[0][1] == top[1][1]:
        return "tie", None
    return ("right" if right[top[0][0]] else "wrong"), top[0][0]


def draw_problems(dataset):
    by_level = {}
    for i, row in enumerate(dataset):
        by_level.setdefault(row["level"], []).append(i)
    draw = random.Random(SEED)
    quota = {lv: round(len(ks) * N_PROBLEMS / len(dataset)) for lv, ks in by_level.items()}
    quota[max(quota, key=lambda lv: len(by_level[lv]))] += N_PROBLEMS - sum(quota.values())
    picked = sorted(i for lv, ks in by_level.items() for i in draw.sample(ks, quota[lv]))
    return [dataset[i] for i in picked]


def mcnemar(a, b):
    """Exact two-sided test over the problems where a and b disagree."""
    x = sum(1 for k in a if a[k] and not b[k])
    y = sum(1 for k in a if b[k] and not a[k])
    n = x + y
    if n == 0:
        return x, y, 1.0
    return x, y, min(1.0, 2 * sum(math.comb(n, i) for i in range(max(x, y), n + 1)) / 2 ** n)


def sha256(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def read_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def ranked_chains(chains, labels, right):
    """Answered chains by score, highest first (a tie goes to the earlier chain), then the rest."""
    out = []
    for i, chain in enumerate(chains):
        answered = labels[i] is not None
        out.append(dict(i=i, c=answered and right[labels[i]], score=chain["orm"] if answered else None))
    return sorted(out, key=lambda x: (x["score"] is None, -(x["score"] or 0), x["i"]))


def score_temperature(problems, chains_at):
    rows = []
    for p, chains in zip(problems, chains_at):
        labels, groups, right = tally(chains, p["answer"])
        vote, winner = vote_outcome(labels, right)
        ranked = ranked_chains(chains, labels, right)
        rows.append(dict(p=p, chains=chains, labels=labels, groups=groups, right=right, vote=vote,
                         winner=winner, ranked=ranked, n_correct=sum(x["c"] for x in ranked)))
    return rows


def build(a):
    problems = draw_problems([json.loads(l) for l in Path(a.math500).read_text(encoding="utf-8").splitlines() if l.strip()])
    ids = [p["unique_id"] for p in problems]
    page7 = read_json(a.page7)
    temperature = page7["best_temperature"] if a.temperature is None else a.temperature
    published = {s["temperature"]: s for s in page7["summary"]}

    files, by_t = {}, {}
    for t in TEMPERATURES:
        name = f"T{t:.1f}_L{CAP}.json"
        scored_path = Path(a.scored) / f"scored_orm_{name}"
        scored = {r["unique_id"]: r["chains"] for r in read_json(scored_path)}
        sweep = {r["unique_id"]: r["chains"] for r in read_json(Path(a.chains) / f"chains_{name}")}
        for pid in ids:
            assert len(scored[pid]) == N_CHAINS, f"{name} {pid}: {len(scored[pid])} chains"
            for c, s in zip(scored[pid], sweep[pid], strict=True):
                assert c["text"] == s["text"] and c["answer"] == s["answer"], f"{name} {pid}: a chain differs from the sweep's"
                assert 0 <= c["orm"] <= 1, f"{name} {pid}: score {c['orm']}"
        by_t[t] = [scored[pid] for pid in ids]
        files[scored_path.name] = sha256(scored_path)

    greedy_rows = score_temperature(problems, by_t[0.0])
    greedy = {r["p"]["unique_id"]: r["labels"][0] is not None and r["right"][r["labels"][0]] for r in greedy_rows}

    print(" T    one chain  avg chain  vote   best-of-16  ceiling  best-only  vote-only  p")
    for t in TEMPERATURES:
        rows = greedy_rows if t == 0.0 else score_temperature(problems, by_t[t])
        n = len(rows)
        vote = {r["p"]["unique_id"]: r["vote"] == "right" for r in rows}
        best = {r["p"]["unique_id"]: r["ranked"][0]["c"] for r in rows}
        avg = sum(r["n_correct"] for r in rows) / (n * N_CHAINS)
        ceil = sum(r["n_correct"] > 0 for r in rows) / n
        pub = published[t]
        assert math.isclose(sum(vote.values()) / n, pub["vote_accuracy"], abs_tol=1e-9), (t, "vote")
        assert math.isclose(avg, pub["single_chain_accuracy"], abs_tol=1e-9), (t, "chain average")
        assert math.isclose(ceil, pub["coverage"], abs_tol=1e-9), (t, "ceiling")
        x, y, p = mcnemar(best, vote)
        print(f"{t:.1f}  {sum(greedy.values()) / n:8.1%}  {avg:8.1%}  {sum(vote.values()) / n:5.1%}  "
              f"{sum(best.values()) / n:9.1%}  {ceil:6.1%}  {x:8d}  {y:8d}  {p:.3f}")

    rows = score_temperature(problems, by_t[temperature])
    n = len(rows)
    vote = {r["p"]["unique_id"]: r["vote"] == "right" for r in rows}
    best = {r["p"]["unique_id"]: r["ranked"][0]["c"] for r in rows}
    bars = dict(
        one_chain=sum(greedy.values()) / n,
        chain_average=sum(r["n_correct"] for r in rows) / (n * N_CHAINS),
        vote=sum(vote.values()) / n,
        best_of_n=sum(best.values()) / n,
        ceiling=sum(r["n_correct"] > 0 for r in rows) / n,
    )
    b_only, v_only, p = mcnemar(best, vote)
    bars["best_vs_vote"] = dict(best_only=b_only, vote_only=v_only, p=p)
    b_only, o_only, p = mcnemar(best, greedy)
    bars["best_vs_one"] = dict(best_only=b_only, one_only=o_only, p=p)
    v_only, o_only, p = mcnemar(vote, greedy)
    bars["vote_vs_one"] = dict(vote_only=v_only, one_only=o_only, p=p)

    public = [dict(
        id=r["p"]["unique_id"], level=int(r["p"]["level"]), n_correct=r["n_correct"], vote=r["vote"],
        greedy=greedy[r["p"]["unique_id"]],
        chains=[dict(i=x["i"], c=x["c"], s=None if x["score"] is None else round(x["score"], 4)) for x in r["ranked"]],
    ) for r in rows]
    public.sort(key=lambda r: (-r["n_correct"], r["id"]))

    misses = [r for r in rows if r["n_correct"] > 0 and not r["ranked"][0]["c"]]
    pool = sorted((r for r in misses if r["vote"] != "right"), key=lambda r: r["p"]["unique_id"])
    specimen = None
    if pool:
        spec = random.Random(SEED).choice(pool)
        answered = [x for x in spec["ranked"] if x["score"] is not None]
        top_right = next(x for x in answered if x["c"])
        shown = answered[:N_CARDS] if top_right in answered[:N_CARDS - 1] else answered[:N_CARDS - 1] + [top_right]
        specimen = dict(
            id=spec["p"]["unique_id"], question=spec["p"]["problem"], answer=spec["p"]["answer"], vote=spec["vote"],
            vote_answer=None if spec["winner"] is None else spec["groups"][spec["winner"]],
            n_correct=spec["n_correct"], right_rank=answered.index(top_right) + 1, pool_size=len(pool),
            cards=[dict(i=x["i"], c=x["c"], s=round(x["score"], 4), r=round(100 * x["score"]),
                        a=spec["chains"][x["i"]]["answer"], trace=spec["chains"][x["i"]]["text"]) for x in shown])

    out = dict(
        source=dict(scored_sha256=files, builder=HERE.name, builder_sha256=sha256(HERE), page_7_best_temperature=page7["best_temperature"],
                    specimen_rule="random.Random(seed).choice over the verifier's misses the vote also missed, sorted by id",
                    seed=SEED, stand_in=False),
        writer=WRITER, verifier=VERIFIER, benchmark="MATH-500", levels=sorted({r["level"] for r in public}),
        temperature=temperature, n_chains=N_CHAINS, bars=bars,
        misses=dict(n=len(misses), of=sum(r["n_correct"] > 0 for r in rows), ids=sorted(r["p"]["unique_id"] for r in misses)),
        specimen=specimen, rows=public)
    a.out.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")

    no_answer_top = sum(1 for r in rows for x in [max(range(N_CHAINS), key=lambda i: r["chains"][i]["orm"])] if r["labels"][x] is None)
    print(f"\nwrote {a.out} ({a.out.stat().st_size / 1e3:.0f} kB) at T = {temperature}")
    print(f"best vs vote {bars['best_vs_vote']}")
    print(f"best vs one {bars['best_vs_one']}  vote vs one {bars['vote_vs_one']}")
    print(f"misses {len(misses)} of {out['misses']['of']}; misses the vote also missed {len(pool)}; "
          f"problems whose top-scored chain had no answer {no_answer_top}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--scored", required=True, help="the folder holding scored_orm_T*_L2048.json")
    ap.add_argument("--chains", required=True, help="the sweep's folder holding chains_T*_L2048.json")
    ap.add_argument("--math500", required=True, help="MATH-500's test.jsonl")
    ap.add_argument("--page7", default=str(HERE.parent.parent / "web/data/page-07-run.json"))
    ap.add_argument("--temperature", type=float, default=None, help="defaults to the page 7 run's best")
    ap.add_argument("--out", type=Path, default=DEST)
    build(ap.parse_args())
