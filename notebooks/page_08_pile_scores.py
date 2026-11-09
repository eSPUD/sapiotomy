"""Page 8's verifier pass over page 7's chains: 16 chains on each of 40 problems at T = 0.3.

Page 8 sets one chain, majority voting and Best-of-N side by side, and all three have to read
the same chains. Page 7's temperature sweep already made them: 16 chains per problem on 40
randomly drawn problems, and T = 0.3 is the temperature its vote did best at. This script gives
each of those 640 chains one score from the trained
verifier, `Skywork/Skywork-o1-Open-PRM-Qwen-2.5-1.5B`, read at the final token, and records
how many tokens the verifier read to give it.

The scorer is page 8's own: `ValueHeadRM` and `reward_score` are read out of
`page_08_best_of_n.ipynb` by content and executed here, so these scores are made the way the
published ones were. `--check` re-scores a few chains from page 8's own pool and compares
them with the scores that notebook published.

    cd notebooks
    python page_08_pile_scores.py --dry-run          # what is missing, and nothing else
    python page_08_pile_scores.py --check 8          # re-score 8 published chains, compare
    python page_08_pile_scores.py                    # the pass, resumable

Writes `out/page_08_pile/scores.jsonl` (one row per chain) and `timing.json`. Resumable: a
restart skips what is on disk.
"""

import argparse
import json
import platform
import sys
import time
import zipfile
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

NOTEBOOK = HERE / "page_08_best_of_n.ipynb"
SWEEP_ZIP = HERE / "runs/page-07-temperature-sweep.zip"
SWEEP = "page-07-temperature-sweep/"
P8_ZIP = HERE.parent / "web/public/notebooks/page-08-best-of-n.zip"
OUT = HERE / "out/page_08_pile"

P7_RUN_ID = "full-math500_l45-n100-9ab2b579-cap2048-pool16-p0.95-bfloat16-cuda"
PILE_CONFIG = "t0.30-c2048"
N_CHAINS = 16
N_PROBLEMS = 40
VERIFIER = "Skywork/Skywork-o1-Open-PRM-Qwen-2.5-1.5B"
SCORE_ID = f"p08-pile-{P7_RUN_ID}"
KEYS = ("problem_id", "sample_index")


def now():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def read_jsonl_from(zip_path, member):
    with zipfile.ZipFile(zip_path) as z, z.open(member) as f:
        for line in f:
            if line.strip():
                yield json.loads(line)


def load_pile(traces):
    """The sweep's chains at T = 0.3 on its 40 problems, read the way page 7 reads them: this
    run only, the last write per key winning, in sample order."""
    with zipfile.ZipFile(SWEEP_ZIP) as z:
        wanted = {h["problem_id"] for h in json.loads(z.read(SWEEP + "results.json"))["heatmap"]}
    rows = (read_jsonl_from(SWEEP_ZIP, SWEEP + "traces.jsonl") if traces is None else
            (json.loads(l) for l in Path(traces).open(encoding="utf-8") if l.strip()))
    latest = {}
    for r in rows:
        if (r["run_id"] == P7_RUN_ID and r["config_id"] == PILE_CONFIG
                and r["problem_id"] in wanted):
            latest[(r["problem_id"], int(r["sample_index"]))] = r
    pile = {}
    for (pid, _), r in sorted(latest.items(), key=lambda kv: (kv[0][0], kv[0][1])):
        pile.setdefault(pid, []).append(r)
    assert len(pile) == N_PROBLEMS, f"{len(pile)} problems in the pile, not {N_PROBLEMS}"
    for pid, rs in pile.items():
        assert [int(r["sample_index"]) for r in rs] == list(range(N_CHAINS)), (
            f"{pid}: sample indices {[r['sample_index'] for r in rs]}, not 0 to {N_CHAINS - 1}")
    return pile


def load_scorer():
    """`ValueHeadRM` and `reward_score`, executed from page 8's notebook."""
    import torch
    import harness
    from reasoning_from_scratch.ch02 import get_device

    cells = json.loads(NOTEBOOK.read_text(encoding="utf-8"))["cells"]
    hits = [c for c in cells if c["cell_type"] == "code" and "class ValueHeadRM" in "".join(c["source"])]
    assert len(hits) == 1, f"{len(hits)} notebook cells define ValueHeadRM; expected exactly one"
    src = "".join(hits[0]["source"])
    start, end = src.index("RM_MAX_TOKENS ="), src.index("def free_vram_gb")
    ns = {"torch": torch, "harness": harness, "get_device": get_device, "Path": Path}
    exec(compile(src[start:end], str(NOTEBOOK), "exec"), ns)

    from transformers import AutoTokenizer
    model = ns["ValueHeadRM"](VERIFIER)
    tok = AutoTokenizer.from_pretrained(VERIFIER)

    def judge(question, solution):
        chat = tok.apply_chat_template(
            [{"role": "user", "content": question}, {"role": "assistant", "content": solution}],
            tokenize=False)
        n_read = len(tok(chat, add_special_tokens=False, truncation=True,
                         max_length=ns["RM_MAX_TOKENS"]).input_ids)
        return ns["reward_score"](model, tok, question, solution), n_read

    return judge, harness


def check(judge, k):
    """Re-score k chains page 8's notebook already scored, and compare."""
    member = "page-08-best-of-n/out/page_08/"
    published = {}
    for s in read_jsonl_from(P8_ZIP, member + "scores.jsonl"):
        if s["scorer"] == "skywork-prm" and s["config_id"] == PILE_CONFIG:
            published[(s["problem_id"], int(s["sample_index"]))] = float(s["score"])
    worst = 0.0
    n = 0
    for r in read_jsonl_from(P8_ZIP, member + "traces.jsonl"):
        key = (r["problem_id"], int(r["sample_index"]))
        if r["config_id"] != PILE_CONFIG or key not in published:
            continue
        score, _ = judge(r["question"], r["trace"])
        worst = max(worst, abs(score - published[key]))
        print(f"  {key[0]} #{key[1]}: published {published[key]:+.4f}, now {score:+.4f}")
        n += 1
        if n == k:
            break
    print(f"largest difference over {n} chains: {worst:.4f}")
    assert worst < 0.05, "the re-scored chains do not match what page 8 published"


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--traces", help="a traces.jsonl to read instead of the sweep's bundle")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--check", type=int, metavar="K",
                    help="re-score K chains page 8 published, compare, and stop")
    args = ap.parse_args()

    pile = load_pile(args.traces)
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / "scores.jsonl"
    done = set()
    if path.exists():
        for line in path.open(encoding="utf-8"):
            if line.strip():
                s = json.loads(line)
                if s["score_id"] == SCORE_ID:
                    done.add((s["problem_id"], s["sample_index"]))
    todo = [r for rs in pile.values() for r in rs
            if (r["problem_id"], int(r["sample_index"])) not in done]
    print(f"pile: {len(pile)} problems x {N_CHAINS} chains at {PILE_CONFIG}")
    print(f"scored: {len(done):,}   to score: {len(todo):,}   verifier: {VERIFIER}")
    if args.dry_run:
        return

    t0, started = time.time(), now()
    judge, harness = load_scorer()
    if args.check:
        check(judge, args.check)
        return

    with path.open("a", encoding="utf-8") as f:
        for r in harness.progress(todo, desc="verifier", unit="chain"):
            score, n_read = judge(r["question"], r["trace"])
            f.write(json.dumps(dict(
                score_id=SCORE_ID, source_run_id=P7_RUN_ID, config_id=PILE_CONFIG,
                problem_id=r["problem_id"], sample_index=int(r["sample_index"]),
                scorer="skywork-prm", model=VERIFIER, score=score,
                judge_tokens_read=n_read, chain_tokens_generated=int(r["tokens_generated"]),
            )) + "\n")
            f.flush()

    import torch
    (OUT / "timing.json").write_text(json.dumps(dict(
        started_utc=started, finished_utc=now(), wall_seconds=round(time.time() - t0, 1),
        chains_scored=len(todo), verifier=VERIFIER, harness=harness.fingerprint(),
        device=torch.cuda.get_device_name(0) if torch.cuda.is_available() else platform.processor(),
        torch=torch.__version__), indent=2))
    print(f"wrote {path}")


if __name__ == "__main__":
    main()
