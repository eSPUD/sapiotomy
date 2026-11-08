"""Page 7's website data, built from the chains `page_7_frequency_voting_new.ipynb` saves.

The notebook saves `chains_T{temperature}_L{cap}.json`, 16 chains for each of the 100 problems at
each temperature. This script reads those files and nothing else of the run, scores them the way
the notebook does (same constants, same grader, same vote, same random subsets of the 16 chains),
and writes the one file the page reads, `web/data/page-07-run.json`:

    python page_7_site_data.py --chains Page7_Frequency_Voting --out ../web/data/page-07-run.json

`--chains` is the folder the notebook saves to (it holds the chains_T*_L2048.json files).

The grader is `math_verify`, which the notebook installs. Dataset: `datasets` if it is installed,
otherwise the Hugging Face cache of MATH-500 read directly.

What the page gets that the notebook does not write itself: coverage and tie rate at each N (the
same subsets the notebook draws for its vote), and the two problems figure 1 shows. Those two are
DRAWN, not picked: one at random from the problems whose vote is right at the best temperature, one
from those whose vote ties, `random.Random(SEED)` over the sorted pool. The pools and the rule are
written into the output, so a reader of the file can see what they were drawn from.
"""

import argparse
import glob
import hashlib
import json
import math
import random
import re
from collections import Counter
from itertools import combinations
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve()
NOTEBOOK = HERE.parent / "page_7_frequency_voting_new.ipynb"

# The sweep the page shows. The notebook's grid also runs a 1.2; the author dropped it, and its
# random stream comes after every temperature below, so cutting it changes none of these numbers.
TEMPERATURES = [round(0.1 * i, 1) for i in range(12)]


def notebook_constants():
    """The notebook's own settings, read from its source so this script cannot drift from them."""
    src = "".join(
        "".join(c["source"]) for c in json.loads(NOTEBOOK.read_text())["cells"] if c["cell_type"] == "code"
    )

    def grab(name, cast):
        m = re.search(rf"^{name}\s*=\s*([^\s#]+)", src, re.M)
        assert m, f"{name} not found in {NOTEBOOK.name}"
        return cast(m.group(1).strip("\"'"))

    assert "torch.bfloat16" in src, "the notebook no longer loads the model in bf16"
    return {
        "model": grab("MODEL", str), "n_problems": grab("N_PROBLEMS", int), "n_chains": grab("N_CHAINS", int),
        "top_p": grab("TOP_P", float), "seed": grab("SEED", int), "cap": grab("CAP", int),
        "n_draws": grab("N_DRAWS", int),
        "vote_sizes": json.loads(re.search(r"^VOTE_SIZES\s*=\s*(\[[^\]]*\])", src, re.M).group(1)),
    }


def load_math500():
    try:
        from datasets import load_dataset

        return list(load_dataset("HuggingFaceH4/MATH-500", split="test"))
    except ImportError:
        import pyarrow as pa

        hits = glob.glob(str(Path.home() / ".cache/huggingface/datasets/HuggingFaceH4___math-500/**/*.arrow"),
                         recursive=True)
        assert hits, "MATH-500 is not installed and not in the Hugging Face cache"
        with open(hits[0], "rb") as f:
            try:
                return pa.ipc.open_stream(f).read_all().to_pylist()
            except pa.ArrowInvalid:
                f.seek(0)
                return pa.ipc.open_file(f).read_all().to_pylist()


def draw_problems(dataset, k):
    """The notebook's step 2: the same share of each level as the 500, random within a level."""
    by_level = {}
    for i, row in enumerate(dataset):
        by_level.setdefault(row["level"], []).append(i)
    draw = random.Random(k["seed"])
    quota = {lv: round(len(ks) * k["n_problems"] / len(dataset)) for lv, ks in by_level.items()}
    quota[max(quota, key=lambda lv: len(by_level[lv]))] += k["n_problems"] - sum(quota.values())
    picked = sorted(i for lv, ks in by_level.items() for i in draw.sample(ks, quota[lv]))
    return [dataset[i] for i in picked], quota


# ------------------------------------------------------------ the notebook's step 3, verbatim logic

def make_scorer():
    from math_verify import parse, verify

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

    def tally(answers, gold):
        """Each chain's group (None when it has no answer), the groups' first-seen answers, and
        whether each group is the right answer."""
        groups, labels = [], []
        for answer in answers:
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

    return tally


def vote_outcome(labels, right):
    """'right', 'wrong' or 'tie'. A tie, and a vote with no answers at all, return nothing; the
    notebook scores both as wrong, and so does `accuracy` below."""
    top = Counter(l for l in labels if l is not None).most_common(2)
    if not top:
        return "wrong"
    if len(top) == 2 and top[0][1] == top[1][1]:
        return "tie"
    return "right" if right[top[0][0]] else "wrong"


def chain_sets(n, rng, k):
    """Which n of the 16 chains vote: every combination when there are at most N_DRAWS of them,
    otherwise N_DRAWS random ones."""
    if math.comb(k["n_chains"], n) <= k["n_draws"]:
        return [list(c) for c in combinations(range(k["n_chains"]), n)]
    return [sorted(rng.choice(k["n_chains"], n, replace=False).tolist()) for _ in range(k["n_draws"])]


def sha256(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def build(chains_dir, out_path):
    k = notebook_constants()
    dataset, quota = draw_problems(load_math500(), k)
    ids = [p["unique_id"] for p in dataset]
    levels = Counter(p["level"] for p in dataset)
    tally = make_scorer()
    cap = k["cap"]

    # ---------------------------------------------------------------- read the chains
    files, chains = {}, {}
    for t in TEMPERATURES:
        path = Path(chains_dir) / f"chains_T{t:.1f}_L{cap}.json"
        assert path.exists(), f"{path.name} is missing"
        by_id = {r["unique_id"]: r for r in json.loads(path.read_text())}
        missing = [i for i in ids if i not in by_id]
        assert not missing, f"{path.name} has no chains for {len(missing)} of the {len(ids)} problems"
        chains[t] = [by_id[i]["chains"] for i in ids]   # a file can hold more problems than the run uses
        assert all(len(c) == k["n_chains"] for c in chains[t]), f"{path.name}: not {k['n_chains']} chains each"
        assert all(c["tokens"] <= cap and c["truncated"] == (c["tokens"] >= cap)
                   for ch in chains[t] for c in ch), f"{path.name}: token counts and cap flags disagree"
        files[path.name] = sha256(path)
    assert all(len({c["text"] for c in ch}) == 1 for ch in chains[0.0]), "T = 0.0 chains are not identical copies"

    # ---------------------------------------------------------------- score every set of 16
    scored = {t: [tally([c["answer"] for c in ch], p["answer"]) for ch, p in zip(chains[t], dataset)]
              for t in TEMPERATURES}

    def summary_row(t):
        outcomes = [vote_outcome(l, r) for l, _, r in scored[t]]
        right = [sum(l is not None and r[l] for l in labels) for labels, _, r in scored[t]]
        toks = [c["tokens"] for ch in chains[t] for c in ch]
        return {
            "temperature": t, "n_problems": len(ids),
            "vote_accuracy": outcomes.count("right") / len(ids),
            "tie_rate": outcomes.count("tie") / len(ids),
            "single_chain_accuracy": float(np.mean([n / k["n_chains"] for n in right])),
            "coverage": sum(n > 0 for n in right) / len(ids),
            "mean_distinct": float(np.mean([len(g) for _, g, _ in scored[t]])),
            "mean_tokens": float(np.mean(toks)),
            "capped_rate": float(np.mean([c["truncated"] for ch in chains[t] for c in ch])),
        }

    summary = [summary_row(t) for t in TEMPERATURES]

    # The accuracy-against-N lines. The notebook's step 5 draws its subsets from one generator
    # walked in this order, so this walk reproduces its `temperature_sets.csv` exactly.
    rng = np.random.default_rng(k["seed"])
    curves = {}
    for t in TEMPERATURES:
        acc = {n: [] for n in k["vote_sizes"]}
        cov = {n: [] for n in k["vote_sizes"]}
        tie = {n: [] for n in k["vote_sizes"]}
        tok = {n: [] for n in k["vote_sizes"]}
        for ch, (labels, _, right) in zip(chains[t], scored[t]):
            for n in k["vote_sizes"]:
                for idx in chain_sets(n, rng, k):
                    sub = [labels[i] for i in idx]
                    o = vote_outcome(sub, right)
                    acc[n].append(o == "right")
                    tie[n].append(o == "tie")
                    cov[n].append(any(l is not None and right[l] for l in sub))
                    tok[n].append(sum(ch[i]["tokens"] for i in idx))
        curves[f"{t:.1f}"] = [
            {"n": n, "accuracy": float(np.mean(acc[n])), "coverage": float(np.mean(cov[n])),
             "tie_rate": float(np.mean(tie[n])), "mean_tokens": float(np.mean(tok[n]))}
            for n in k["vote_sizes"]
        ]

    # The sets the curves average at N = 1 and N = 16 are the chains and the whole 16: they must
    # say what the summary says.
    for row in summary:
        line = curves[f"{row['temperature']:.1f}"]
        assert math.isclose(line[0]["accuracy"], row["single_chain_accuracy"], abs_tol=1e-9)
        assert math.isclose(line[-1]["accuracy"], row["vote_accuracy"], abs_tol=1e-9)
        assert math.isclose(line[-1]["tie_rate"], row["tie_rate"], abs_tol=1e-9)
        assert math.isclose(line[-1]["coverage"], row["coverage"], abs_tol=1e-9)

    best = max(summary, key=lambda r: (r["vote_accuracy"], -r["temperature"]))   # a tie goes to the lower T
    bt = best["temperature"]

    # ---------------------------------------------------------------- figure 1's two problems
    outcomes = [vote_outcome(l, r) for l, _, r in scored[bt]]
    any_right = [any(l is not None and r[l] for l in labels) for labels, _, r in scored[bt]]
    pools = {
        "right": [i for i, o in enumerate(outcomes) if o == "right" and len(scored[bt][i][1]) >= 3],
        "tie": [i for i, o in enumerate(outcomes) if o == "tie" and any_right[i]],
    }
    draw = random.Random(k["seed"])
    picks = {}
    for outcome in ("right", "tie"):
        pool = sorted(pools[outcome], key=lambda i: ids[i])
        picks[outcome] = draw.choice(pool)

    def bundle(i, outcome):
        p, ch = dataset[i], chains[bt][i]
        labels, groups, right = scored[bt][i]
        votes = Counter(l for l in labels if l is not None)
        order = sorted(range(len(groups)), key=lambda g: (-votes[g], g))   # most votes, then first seen
        greedy = chains[0.0][i][0]
        glabels, _, gright = scored[0.0][i]
        return {
            "outcome": outcome, "pool_size": len(pools[outcome]),
            "problem": {
                "problem_id": p["unique_id"], "level": p["level"], "subject": p["subject"],
                "question": p["problem"], "ground_truth": p["answer"],
                "temperature": bt, "chain_cap": cap,
                "ranked": [{"answer": groups[g], "votes": votes[g], "correct": right[g]} for g in order],
                "distinct_answers": len(groups),
                "plurality_answer": groups[order[0]] if outcome == "right" else None,
                "plurality_correct": outcome == "right", "tie": outcome == "tie",
                "any_correct": any_right[i], "no_answer_rate": labels.count(None) / len(labels),
                "chains": [
                    {"sample_index": j, "trace": c["text"], "extracted_answer": c["answer"],
                     "vote_key": None if labels[j] is None else groups[labels[j]],
                     "correct": labels[j] is not None and right[labels[j]],
                     "own_tokens": c["tokens"], "truncated": c["truncated"]}
                    for j, c in enumerate(ch)
                ],
            },
            # The same problem's one greedy chain, for section 4's strip.
            "greedy": {"own_tokens": greedy["tokens"], "extracted_answer": greedy["answer"],
                       "correct": glabels[0] is not None and gright[glabels[0]],
                       "truncated": greedy["truncated"]},
        }

    top = curves[f"{bt:.1f}"][-1]
    out = {
        "source": {
            "notebook": NOTEBOOK.name, "builder": HERE.name, "builder_sha256": sha256(HERE),
            "chains_sha256": files,
            "model": k["model"], "precision": "bf16", "dataset": "HuggingFaceH4/MATH-500",
            "n_problems": len(ids), "levels": {str(lv): levels[lv] for lv in sorted(levels)},
            "quota": {str(lv): quota[lv] for lv in sorted(quota)},
            "n_chains": k["n_chains"], "chain_cap": cap, "top_p": k["top_p"], "seed": k["seed"],
            "n_draws": k["n_draws"],
        },
        "n_chains": k["n_chains"], "chain_cap": cap,
        "temperatures": TEMPERATURES, "best_temperature": bt,
        "n_axis": k["vote_sizes"],
        "summary": summary, "curves": curves,
        "handoff": {
            "n_chains": k["n_chains"], "temperature": bt, "n_items": len(ids),
            "single_chain_accuracy": best["single_chain_accuracy"],
            "plurality_accuracy": best["vote_accuracy"], "coverage": best["coverage"],
            "thrown_away": best["coverage"] - best["vote_accuracy"], "tie_rate": best["tie_rate"],
        },
        "showcase": {
            "temperature": bt, "seed": k["seed"],
            "rule": ("Both problems are drawn at random, random.Random(seed).choice over the pool "
                     "sorted by problem id, from the 100 problems at the best temperature. right: "
                     "the vote returns the right answer and there are at least 3 distinct answers. "
                     "tie: the vote ties and a chain has the right answer."),
            "picks": [bundle(picks["right"], "right"), bundle(picks["tie"], "tie")],
        },
    }
    assert math.isclose(out["handoff"]["plurality_accuracy"], top["accuracy"], abs_tol=1e-9)
    Path(out_path).write_text(json.dumps(out, indent=1, ensure_ascii=False), encoding="utf-8")

    print(f"{len(ids)} problems, levels {dict(sorted(levels.items()))}")
    for r in summary:
        print(f"  T={r['temperature']:.1f}  vote {r['vote_accuracy']:.0%}  one chain {r['single_chain_accuracy']:.1%}  "
              f"coverage {r['coverage']:.0%}  ties {r['tie_rate']:.0%}  distinct {r['mean_distinct']:.2f}  "
              f"tokens/chain {r['mean_tokens']:.0f}")
    print(f"best temperature {bt}; figure 1 drew {ids[picks['right']]} (of {len(pools['right'])}) "
          f"and {ids[picks['tie']]} (of {len(pools['tie'])})")
    print(f"{out_path}  {Path(out_path).stat().st_size / 1024:,.0f} KB")


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--chains", required=True, help="the folder holding chains_T*_L2048.json")
    ap.add_argument("--out", default=str(HERE.parent.parent / "web" / "data" / "page-07-run.json"))
    a = ap.parse_args()
    build(a.chains, a.out)
