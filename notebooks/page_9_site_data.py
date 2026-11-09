"""Page 9's data for sections 3 and 4, built from the scored traces `9_Best_of_N_PRM_dev.ipynb` saves.

    python page_9_site_data.py --scored Scored_Traces --chains page_7_json_files \
        --out ../web/data/page-09-best-of-n.json

`--scored` holds scored_T*_L2048.json. `--chains` holds the sweep's chains_T*_L2048.json, read for
greedy decoding (T 0.0) and for the sets of chains, which come off one generator in the sweep's order.

The temperature is the sweep's own best: where the vote of 16 is right most often, a tie going to the
lower temperature. Grader, vote and sets are the sweep's, so every bar sits on the same chains. An
`orm` block is added by hand once the ORM notebook has run; until then it is null and no bar is drawn.
"""

import argparse
import json
import math
import statistics as st
from collections import Counter
from functools import cache
from itertools import combinations
from pathlib import Path

import numpy as np
from datasets import load_dataset
from math_verify import parse, verify

TEMPERATURES = [round(0.1 * i, 1) for i in range(12)]
N_CHAINS, N_DRAWS, SEED, CAP = 16, 100, 42, 2048
SIZES = [1, 2, 4, 8, 16]
CUTS = [0.5, 0.75, 0.9]
MAIN_CUT = 0.75


@cache
def grade(pred, gold):
    gt = str(gold).strip()
    if pred == "":
        return False
    try:
        return bool(verify(parse(f"${gt}$"), parse(f"${pred}$")))
    except Exception:
        return pred.replace(" ", "").lower() == gt.replace(" ", "").lower()


@cache
def same_answer(a, b):
    if a.replace(" ", "") == b.replace(" ", ""):
        return True
    try:
        return bool(verify(parse(f"${a}$"), parse(f"${b}$")))
    except Exception:
        return False


def tally(chains, gold):
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
    return labels, [grade(rep, gold) for rep in groups]


def vote_outcome(labels, right):
    top = Counter(l for l in labels if l is not None).most_common(2)
    if not top:
        return "wrong"
    if len(top) == 2 and top[0][1] == top[1][1]:
        return "tie"
    return "right" if right[top[0][0]] else "wrong"


def chain_sets(n, rng):
    if math.comb(N_CHAINS, n) <= N_DRAWS:
        return [list(c) for c in combinations(range(N_CHAINS), n)]
    return [sorted(rng.choice(N_CHAINS, n, replace=False).tolist()) for _ in range(N_DRAWS)]


def read(path):
    return {r["unique_id"]: r["chains"] for r in json.loads(Path(path).read_text())}


RULES = {
    "weakest_step": min,
    "last_step": lambda s: s[-1],
    "product_of_steps": lambda s: sum(math.log(max(x, 1e-12)) for x in s),
}


def build(scored_dir, chains_dir, out):
    scored_dir = next(p.parent for p in Path(scored_dir).rglob(f"scored_T0.1_L{CAP}.json"))
    dataset = load_dataset("HuggingFaceH4/MATH-500", split="test")
    data = {}
    for t in TEMPERATURES:
        path = scored_dir / f"scored_T{t:.1f}_L{CAP}.json"
        data[t] = read(path) if path.exists() else read(Path(chains_dir) / f"chains_T{t:.1f}_L{CAP}.json")
    shared = set.intersection(*[set(d) for d in data.values()])
    assert len(shared) == 100, len(shared)
    problems = [row for row in dataset if row["unique_id"] in shared]

    rng = np.random.default_rng(SEED)
    vote, kept, one_chain, ties, won = {}, {}, {}, {}, {}
    for t in TEMPERATURES:
        has_scores = "prm" in next(iter(data[t].values()))[0]
        for n in SIZES:
            vote[t, n] = []
            for rule in RULES:
                kept[rule, t, n] = []
        one_chain[t], ties[t], won[t] = [], 0, Counter()
        for p in problems:
            chains = data[t][p["unique_id"]]
            labels, right = tally(chains, p["answer"])
            answered = np.array([l is not None for l in labels])
            correct = np.array([l is not None and right[l] for l in labels])
            one_chain[t].append(correct.mean())
            scores = {r: np.array([f(c["prm"]) for c in chains]) for r, f in RULES.items()} if has_scores else None
            for n in SIZES:
                for idx in chain_sets(n, rng):
                    outcome = vote_outcome([labels[i] for i in idx], right)
                    vote[t, n].append(outcome == "right")
                    if not has_scores:
                        continue
                    arr = np.array(idx)
                    candidates = arr[answered[arr]]
                    for rule, s in scores.items():
                        kept[rule, t, n].append(bool(candidates.size and correct[candidates[s[candidates].argmax()]]))
                    if n == N_CHAINS:
                        ties[t] += outcome == "tie"
                        prm_right = kept["weakest_step", t, n][-1]
                        if prm_right != (outcome == "right"):
                            won[t][("prm_only" if prm_right else "vote_only") + ("_tied_vote" if outcome == "tie" else "")] += 1

    best_t = max(TEMPERATURES, key=lambda t: (round(float(np.mean(vote[t, N_CHAINS])), 9), -t))
    print("best temperature", best_t, "ties at 16:", ties[best_t], "disagreements:", dict(won[best_t]))
    print("all temperatures, disagreements:", {t: dict(won[t]) for t in TEMPERATURES if won[t]})

    # Section 4: what follows the first low step, at the same temperature.
    rows = []
    for p in problems:
        chains = data[best_t][p["unique_id"]]
        labels, right = tally(chains, p["answer"])
        for c, l in zip(chains, labels):
            sizes = [len(s) for s in c["steps"]]
            for cut in CUTS:
                at = next((k for k, x in enumerate(c["prm"]) if x < cut), None)
                rows.append({"cut": cut, "right": bool(l is not None and right[l]), "tokens": c["tokens"],
                             "after": None if at is None else sum(sizes[at + 1 :]) / sum(sizes)})

    def group(cut, right):
        g = [r for r in rows if r["cut"] == cut and r["right"] == right]
        low = [r["after"] for r in g if r["after"] is not None]
        tokens = sum(r["tokens"] for r in g)
        return {
            "chains": len(g),
            "no_low_step": len(g) - len(low),
            "bins": np.histogram(low, bins=np.linspace(0, 1, 11))[0].tolist(),
            "share_with_low_step": len(low) / len(g),
            "median_share_after": st.median(low),
            "tokens_after": sum((r["after"] or 0) * r["tokens"] for r in g) / tokens,
        }

    out_data = {
        "note": "Built by notebooks/page_9_site_data.py from the PRM notebook's scored traces. Accuracy is on 100 "
                "MATH-500 problems, 16 chains each. one_chain is greedy decoding. A tied vote counts as wrong.",
        "temperature": best_t,
        "n_problems": len(problems),
        "n_chains": N_CHAINS,
        "prm_model": "Qwen/Qwen2.5-Math-PRM-7B",
        "bars": {
            "one_chain": float(np.mean(one_chain[0.0])),
            "vote": float(np.mean(vote[best_t, N_CHAINS])),
            "orm": None,
            "prm": float(np.mean(kept["weakest_step", best_t, N_CHAINS])),
        },
        "prm_rules_at_16": {r: float(np.mean(kept[r, best_t, N_CHAINS])) for r in RULES},
        "vote_ties_at_16": int(ties[best_t]),
        "disagreements_at_16": {
            "prm_only": won[best_t]["prm_only"] + won[best_t]["prm_only_tied_vote"],
            "prm_only_on_a_tied_vote": won[best_t]["prm_only_tied_vote"],
            "vote_only": won[best_t]["vote_only"],
        },
        "prm_lead_at_16_by_temperature": {
            f"{t:.1f}": float(np.mean(kept["weakest_step", t, N_CHAINS]) - np.mean(vote[t, N_CHAINS]))
            for t in TEMPERATURES if kept["weakest_step", t, N_CHAINS]
        },
        "by_n": [{"n": n, "vote": float(np.mean(vote[best_t, n])),
                  "prm": float(np.mean(kept["weakest_step", best_t, n]))} for n in SIZES],
        "breaks": {"main_cut": MAIN_CUT,
                   "by_cut": {f"{c}": {"right": group(c, True), "wrong": group(c, False)} for c in CUTS}},
    }
    Path(out).write_text(json.dumps(out_data, indent=1) + "\n")
    print(json.dumps(out_data["bars"]), json.dumps(out_data["prm_rules_at_16"]))
    print(json.dumps(out_data["by_n"]))
    m = out_data["breaks"]["by_cut"]["0.75"]
    print(json.dumps(m))


if __name__ == "__main__":
    a = argparse.ArgumentParser()
    a.add_argument("--scored", required=True)
    a.add_argument("--chains", required=True)
    a.add_argument("--out", required=True)
    args = a.parse_args()
    build(args.scored, args.chains, args.out)
