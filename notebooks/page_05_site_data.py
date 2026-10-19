"""Page 5's website data: `derived.json`, built from the two runs' traces.

The few-shot run (`page_5_few_shot.ipynb`: base Qwen2.5 1.5B, 3B, 7B, zero-shot and
five-shot CoT) and the instruct run (`page_5_instruct_reasoning.ipynb`: Qwen2.5 1.5B, 3B,
7B Instruct, CoT and Direct) each saved one reply per line to `traces/page_5/`. This script
computes nothing the notebooks did not: the same tallies, on the 495 problems both runs
share (the instruct run also answered the five example problems, which are left out). It
chooses section 1's three test problems and lays it all out the way
`web/src/lib/page05.ts` reads it. Section 1 carries every base model's zero-shot and
few-shot reply to the three test problems, for figure 1's Play.

    python page_05_site_data.py                                      # out/page_05/derived.json
    cp out/page_05/derived.json ../web/data/page-05-derived.json     # promote it to the page

`derived.json` records the sha256 of both trace files, of the worked solutions and of this
script, so the page's data names exactly what it was built from.
"""

import argparse
import hashlib
import json
import statistics
from pathlib import Path

HERE = Path(__file__).resolve()
NOTEBOOKS = HERE.parent

FEW_SHOT_TRACES = NOTEBOOKS / "traces" / "page_5" / "few_shot.jsonl"
INSTRUCT_TRACES = NOTEBOOKS / "traces" / "page_5" / "instruct_reasoning.jsonl"
SOLUTIONS = NOTEBOOKS / "page_5_few_shot_solutions.json"
MATH500 = NOTEBOOKS / "data" / "math500_test.json"     # HuggingFaceH4/MATH-500, test split, same order

SOLUTIONS_SHA256 = "f41c196505cc241a78f372f60123f99a0c6b56f92880ecb5d338bab8b987bfa8"
# The five example problems in prompt order: the first of each level after shuffling
# MATH-500 with seed 42, as the few-shot notebook chooses and asserts them.
EXAMPLE_IDS = ["test/precalculus/697.json", "test/algebra/101.json", "test/geometry/178.json",
               "test/number_theory/769.json", "test/number_theory/612.json"]
# Section 1: the first test problem in MATH-500 order at each of these levels, skipping
# problems with an [asy] diagram.
SECTION_1_LEVELS = (1, 3, 5)
SECTION_1_IDS = ["test/intermediate_algebra/134.json", "test/algebra/2584.json",
                 "test/intermediate_algebra/1994.json"]

SIZES = ["1.5B", "3B", "7B"]
BASE = {s: f"Qwen/Qwen2.5-{s}" for s in SIZES}
INSTRUCT = {s: f"Qwen2.5-{s}-Instruct" for s in SIZES}       # the instruct run stores short names
SHORT_REPLY = 40     # a Direct reply this short gave only the answer, as in the instruct notebook


def sha256(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def read_jsonl(path):
    with Path(path).open(encoding="utf-8") as f:
        return [json.loads(line) for line in f if line.strip()]


def index(records, key):
    """One record per key, asserting there are no duplicates."""
    out = {}
    for r in records:
        k = key(r)
        assert k not in out, f"duplicate record {k}"
        out[k] = r
    return out


def tally(rs, correct, tokens, truncated, unboxed, level, extra=None):
    """The notebooks' summary for one model and arm: accuracy overall and by level, median
    reply tokens, truncated and unboxed replies."""
    by_level = {}
    for lvl in range(1, 6):
        lr = [r for r in rs if level(r) == lvl]
        n_correct = sum(bool(correct(r)) for r in lr)
        by_level[str(lvl)] = {"n": len(lr), "correct": n_correct,
                              "accuracy": n_correct / len(lr) if lr else None,
                              "median_tokens": statistics.median(tokens(r) for r in lr) if lr else None}
    n_correct = sum(bool(correct(r)) for r in rs)
    out = {"n": len(rs), "correct": n_correct, "accuracy": n_correct / len(rs),
           "median_tokens": statistics.median(tokens(r) for r in rs),
           "truncated": sum(bool(truncated(r)) for r in rs),
           "unboxed": sum(bool(unboxed(r)) for r in rs),
           "by_level": by_level}
    out.update(extra(rs) if extra else {})
    return out


def paired(a, b, ids, label_a, label_b):
    """On the same problems: how many both solve, neither solves, and each solves alone."""
    ca = [bool(a(u)) for u in ids]
    cb = [bool(b(u)) for u in ids]
    return {"a": label_a, "b": label_b, "n": len(ids),
            "both": sum(x and y for x, y in zip(ca, cb)),
            "neither": sum(not x and not y for x, y in zip(ca, cb)),
            "a_only": sum(x and not y for x, y in zip(ca, cb)),
            "b_only": sum(y and not x for x, y in zip(ca, cb))}


def build(out_path):
    math500 = json.loads(MATH500.read_text(encoding="utf-8"))
    rows = {r["unique_id"]: r for r in math500}
    assert len(rows) == 500

    solutions_text = SOLUTIONS.read_text(encoding="utf-8")
    assert sha256(SOLUTIONS) == SOLUTIONS_SHA256, "the worked solutions are not the approved text"
    solutions = json.loads(solutions_text)
    assert list(solutions) == EXAMPLE_IDS, "the worked solutions are not in prompt order"

    test_ids = [r["unique_id"] for r in math500 if r["unique_id"] not in EXAMPLE_IDS]
    assert len(test_ids) == 495

    # The few-shot run: every base model and arm on exactly the 495 test problems.
    few = index(read_jsonl(FEW_SHOT_TRACES), lambda r: (r["model"], r["arm"], r["unique_id"]))
    for s in SIZES:
        for arm in ("zero_shot", "few_shot"):
            got = {u for (m, a, u) in few if m == BASE[s] and a == arm}
            assert got == set(test_ids), f"few-shot run: {BASE[s]} {arm} does not cover the 495 problems"
    assert len(few) == len(SIZES) * 2 * 495, "few-shot run: records beyond the expected models and arms"

    # The instruct run: every instruct model and mode on all 500; the 495 are used.
    inst = index(read_jsonl(INSTRUCT_TRACES), lambda r: (r["model"], r["mode"], r["unique_id"]))
    for s in SIZES:
        for mode in ("CoT", "Direct"):
            got = {u for (m, md, u) in inst if m == INSTRUCT[s] and md == mode}
            assert got == set(rows), f"instruct run: {INSTRUCT[s]} {mode} does not cover the 500 problems"
    assert len(inst) == len(SIZES) * 2 * 500, "instruct run: records beyond the expected models and modes"

    # Both runs saw MATH-500's own answer and level for every problem.
    for (m, a, u), r in few.items():
        assert (r["gold"], r["level"]) == (rows[u]["answer"], rows[u]["level"]), f"few-shot run: {u} differs from MATH-500"
    for (m, md, u), r in inst.items():
        assert (r["ground_truth"], r["difficulty_level"]) == (rows[u]["answer"], rows[u]["level"]), \
            f"instruct run: {u} differs from MATH-500"

    def few_tally(s, arm):
        return tally([few[(BASE[s], arm, u)] for u in test_ids],
                     correct=lambda r: r["correct"], tokens=lambda r: r["tokens"],
                     truncated=lambda r: r["truncated"], unboxed=lambda r: not r["boxed"],
                     level=lambda r: r["level"],
                     extra=lambda rs: {"wrote_code": sum(r["wrote_code"] for r in rs)})

    def inst_tally(s, mode):
        def short(rs):
            k = sum(r["generated_tokens_count"] <= SHORT_REPLY for r in rs)
            return {"short_replies": k, "short_share": k / len(rs)}
        return tally([inst[(INSTRUCT[s], mode, u)] for u in test_ids],
                     correct=lambda r: r["is_correct"], tokens=lambda r: r["generated_tokens_count"],
                     truncated=lambda r: r["truncated"],
                     unboxed=lambda r: "\\boxed{" not in r["raw_generated_response"],
                     level=lambda r: r["difficulty_level"], extra=short)

    models = []
    for s in SIZES:
        models.append({"size": s, "model_id": BASE[s], "label": f"Qwen2.5-{s}", "kind": "base",
                       "arms": {"zero_shot": few_tally(s, "zero_shot"), "few_shot": few_tally(s, "few_shot")}})
    for s in SIZES:
        models.append({"size": s, "model_id": f"Qwen/{INSTRUCT[s]}", "label": INSTRUCT[s], "kind": "instruct",
                       "arms": {"CoT": inst_tally(s, "CoT"), "Direct": inst_tally(s, "Direct")}})
    arm = {(m["kind"], m["size"], a): t for m in models for a, t in m["arms"].items()}

    fc = lambda s, a: (lambda u: few[(BASE[s], a, u)]["correct"])
    ic = lambda s, md: (lambda u: inst[(INSTRUCT[s], md, u)]["is_correct"])
    pairs = {
        "few_vs_zero": [dict(size=s, **paired(fc(s, "few_shot"), fc(s, "zero_shot"), test_ids,
                                              "base few-shot CoT", "base zero-shot")) for s in SIZES],
        "instruct_cot_vs_base_few": [dict(size=s, **paired(ic(s, "CoT"), fc(s, "few_shot"), test_ids,
                                                           "instruct CoT", "base few-shot CoT")) for s in SIZES],
        "cot_vs_direct": [dict(size=s, **paired(ic(s, "CoT"), ic(s, "Direct"), test_ids,
                                                "instruct CoT", "instruct Direct")) for s in SIZES],
    }

    # Section 1's three test problems, by the rule above.
    chosen = [next(u for u in test_ids if rows[u]["level"] == lvl and "[asy]" not in rows[u]["problem"])
              for lvl in SECTION_1_LEVELS]
    assert chosen == SECTION_1_IDS, f"section 1's rule now picks {chosen}"
    problem = lambda u: {"unique_id": u, "level": rows[u]["level"], "subject": rows[u]["subject"],
                         "problem": rows[u]["problem"], "answer": rows[u]["answer"]}
    # Figure 1's Play: every base model's two replies to each of the three, so the
    # reader picks the size and nothing is chosen for the page.
    reply = lambda r: {k: r[k] for k in ("reply", "extracted", "correct", "tokens", "truncated", "boxed",
                                         "wrote_code")}
    test_problem = lambda u: dict(problem(u), replies={
        s: {arm: reply(few[(BASE[s], arm, u)]) for arm in ("zero_shot", "few_shot")} for s in SIZES})

    # Section 4: each instruct model reasoning and answering directly; and the smallest model
    # reasoning against the largest answering directly.
    small, large = SIZES[0], SIZES[-1]
    section_4 = {
        "models": [{"size": s, "label": INSTRUCT[s],
                    "cot_accuracy": arm[("instruct", s, "CoT")]["accuracy"],
                    "direct_accuracy": arm[("instruct", s, "Direct")]["accuracy"],
                    "direct_short_share": arm[("instruct", s, "Direct")]["short_share"]} for s in SIZES],
        "cross": dict(**paired(ic(small, "CoT"), ic(large, "Direct"), test_ids,
                               f"{INSTRUCT[small]} CoT", f"{INSTRUCT[large]} Direct")),
    }

    derived = {
        "provenance": {
            "runs": {
                "few_shot": {"notebook": "page_5_few_shot.ipynb", "traces": FEW_SHOT_TRACES.name,
                             "traces_sha256": sha256(FEW_SHOT_TRACES), "records": len(few),
                             "models": [BASE[s] for s in SIZES], "arms": ["zero_shot", "few_shot"],
                             "batch_size": "64, halved for a batch that ran out of memory",
                             "stop": "a new Problem:"},
                "instruct": {"notebook": "page_5_instruct_reasoning.ipynb", "ran_as_commit": "2f7bba7",
                             "traces": INSTRUCT_TRACES.name, "traces_sha256": sha256(INSTRUCT_TRACES),
                             "records": len(inst), "models": [f"Qwen/{INSTRUCT[s]}" for s in SIZES],
                             "modes": ["CoT", "Direct"], "batch_size": 128,
                             "system_prompt": "Qwen's default"},
            },
            "solutions_sha256": SOLUTIONS_SHA256,
            "decoding": {"strategy": "greedy", "dtype": "bf16", "max_new_tokens": 1024,
                         "repetition_penalty": 1.0, "hardware": "Colab A100"},
            "grader": "the first \\boxed{} in a reply, compared with math_verify; a reply with no box is wrong",
            "problems": {"source": "MATH-500", "n": len(test_ids),
                         "excluded": "the five example problems"},
            "builder": HERE.name, "builder_sha256": sha256(HERE),
        },
        "section_1": {
            "examples": [dict(problem(u), solution=solutions[u]) for u in EXAMPLE_IDS],
            "test_problems": [test_problem(u) for u in SECTION_1_IDS],
        },
        "models": models,
        "paired": pairs,
        "section_4": section_4,
    }
    out_path = Path(out_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(derived, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    print(f"{'model':24} {'arm':10} {'acc':>6} {'med tok':>8} {'trunc':>6} {'unboxed':>8}")
    for m in models:
        for a, t in m["arms"].items():
            print(f"{m['label']:24} {a:10} {100 * t['accuracy']:5.1f}% {t['median_tokens']:8} "
                  f"{t['truncated']:6} {t['unboxed']:8}")
    for name, ps in pairs.items():
        print(name, "  ".join(f"{p['size']} {p['a_only']}/{p['b_only']}" for p in ps))
    c = section_4["cross"]
    print(f"cross: {c['a']} only {c['a_only']}, {c['b']} only {c['b_only']}")
    print(f"{out_path}   {out_path.stat().st_size / 1024:,.0f} KB")
    return derived


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--out", default=str(NOTEBOOKS / "out" / "page_05" / "derived.json"),
                    help="where to write derived.json")
    build(ap.parse_args().out)
