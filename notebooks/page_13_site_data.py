"""Build web/data/page-13-two-axis.json from the two-axis notebook's saved outputs.

The notebook (page_13_two_axis_grpo.ipynb) ran on Colab and kept its results on Google
Drive; every number the page plots is also printed in the notebook's own outputs, so
this script reads them from there:

  - the run settings, from the knobs cell's summary line and the 1.5B preset;
  - the difficulty filter and the 80 training-log rows, from the training cell;
  - every checkpoint's evaluation (pass@1 over 32 chains, majority of k, the chain cut
    at each token budget, mean length), from the evaluation cell's printed lines;
  - any-of-32-right per checkpoint, from the evaluation table.

Usage: python3 page_13_site_data.py <notebook.ipynb> <out.json>
"""
import hashlib
import json
import re
import sys


def stream(cell):
    return "".join("".join(o.get("text", "")) for o in cell.get("outputs", []) if o.get("output_type") == "stream")


def find_cell(cells, needle):
    hits = [c for c in cells if c["cell_type"] == "code" and needle in "".join(c["source"])]
    assert len(hits) == 1, f"expected one code cell containing {needle!r}, found {len(hits)}"
    return hits[0]


def main(nb_path, out_path):
    raw = open(nb_path, "rb").read()
    cells = json.loads(raw)["cells"]

    # --- settings ---
    knobs = find_cell(cells, "MODEL_PRESETS = {")
    src = "".join(knobs["source"])
    preset = re.search(r'"1\.5B":\s*dict\((.*?)\),\s*\n', src, re.S).group(1)
    lr = float(re.search(r"\blr=([0-9.e-]+)", preset).group(1))
    summary = stream(knobs)
    m = re.search(
        r"1\.5B \| (\S+) \| lora=(\w+) \| (\d+) prompts x (\d+) samples/step \| (\d+) steps, "
        r"ckpts \[([\d, ]+)\] \| eval n=(\d+) k=(\d+)",
        summary,
    )
    assert m, "knobs summary line not found"
    gpu, lora, prompts, chains, steps, ckpts, n_eval, k = m.groups()
    assert lora == "False", "the page describes a full fine-tune"

    # --- filter, training log, time ---
    train = stream(find_cell(cells, "    run_train(cfg)\n"))
    kept, screened = map(int, re.search(r"kept (\d+)/(\d+)", train).groups())
    rows = re.findall(
        r"\{'completions/mean_length': '([\d.]+)', 'rewards/reward_correct/mean': '([\d.]+)'", train
    )
    assert len(rows) == int(steps) // 5, f"expected one log row per 5 steps, got {len(rows)}"
    train_log = [{"step": 5 * (i + 1), "reward": float(r), "length": float(l)} for i, (l, r) in enumerate(rows)]
    minutes = float(re.search(r"1\.5B: ([\d.]+) min", train).group(1))

    # --- evaluation ---
    ev_cell = find_cell(cells, "run_eval(cfg, materialize(cfg, step)")
    ev = stream(ev_cell)
    temp = float(re.search(r"--temperature ([\d.]+)", ev).group(1))
    max_tokens = int(re.search(r"--max_tokens (\d+)", ev).group(1))
    top_p = float(re.search(r"top_p=([\d.]+)", "".join(find_cell(cells, "%%writefile eval_ckpt.py")["source"])).group(1))

    blocks = re.findall(r"^(\{\"tag\": .*\})\nmaj@k (\{.*\})\nseq@budget (\{.*\})$", ev, re.M)
    assert [json.loads(b[0])["tag"] for b in blocks] == [f"step{s}" for s in ckpts.split(", ")]

    table = next(
        "".join(o["data"]["text/plain"]) for o in ev_cell["outputs"] if "text/plain" in o.get("data", {})
    )
    pass_k = {}
    for line in table.splitlines():
        parts = line.split()
        if parts and parts[0].isdigit() and len(parts) >= 6:
            pass_k[int(parts[0])] = float(parts[5])  # step, pass@1, ±SE, maj@1, maj@k, pass@k

    as_dict = lambda s: {int(a): float(b) for a, b in re.findall(r"(\d+): ([\d.]+)", s)}
    checkpoints = []
    for head, maj, seq in blocks:
        h = json.loads(head)
        step = int(h["tag"][4:])
        assert h["n"] == int(n_eval)
        checkpoints.append({
            "step": step,
            "pass1": round(h["mean_acc"], 6),
            "pass1_se": round(h["mean_acc_se"], 6),
            "mean_len": round(h["mean_len"], 2),
            "frac_truncated": round(h["frac_truncated"], 6),
            "maj": {str(kk): round(v, 6) for kk, v in as_dict(maj).items()},
            "budget": {str(b): round(v, 6) for b, v in as_dict(seq).items()},
            "pass_at_k_max": pass_k[step],
        })

    out = {
        "source": {"notebook": "page_13_two_axis_grpo.ipynb", "sha256": hashlib.sha256(raw).hexdigest()},
        "run": {
            "model": "Qwen/Qwen2.5-1.5B-Instruct",
            "dataset": "GSM8K",
            "gpu": gpu,
            "full_finetune": True,
            "rl_steps": int(steps),
            "prompts_per_step": int(prompts),
            "chains_per_prompt": int(chains),
            "learning_rate": lr,
            "filter_kept": kept,
            "filter_screened": screened,
            "train_minutes": minutes,
            "n_eval": int(n_eval),
            "k": int(k),
            "temperature": temp,
            "top_p": top_p,
            "max_tokens": max_tokens,
        },
        "checkpoints": checkpoints,
        "train_log": train_log,
    }
    json.dump(out, open(out_path, "w"), indent=1)
    print(f"wrote {out_path}: {len(checkpoints)} checkpoints, {len(train_log)} log rows")


if __name__ == "__main__":
    main(*sys.argv[1:3])
