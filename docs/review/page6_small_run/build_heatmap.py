#!/usr/bin/env python3
"""A contender for page 6 figure 1: the SMALL run as a heat map, one cell per problem, budget and model.

    python docs/review/page6_small_run/build_heatmap.py
    python docs/review/page6_small_run/build_heatmap.py --traces notebooks/out/page_06_small/traces.jsonl

Writes fig1_heatmap.svg beside this file, and fig1_heatmap.png (2x) when Google Chrome is installed.

By default the run is read from page6_small_chains.html beside this file, which embeds every chain
of the CUDA SMALL run. --traces reads a traces.jsonl instead, and it must hold every model at every
budget: a partial run would draw empty panels.

A cell is solved (cyan), finished with a wrong answer (magenta), or cut off by the budget before
answering (a pale magenta tint and a scissor mark). The number in a coloured cell is how many
tokens the model wrote. Rows are ordered by the budget at which the larger model first solves them.
"""
import argparse
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
CHAINS_HTML = HERE / "page6_small_chains.html"

# The drawing lives beside the page 6 notebook, which draws the same figure from its own run.
sys.path.insert(0, str(HERE.parents[2] / "notebooks"))
from page_06_heatmap import from_chains_html, from_traces, png, state, svg  # noqa: E402


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--traces", type=Path, help="a complete SMALL-run traces.jsonl (default: the embedded run)")
    ap.add_argument("--max-budget", type=int, default=2048,
                    help="the largest budget drawn (default 2048: the SMALL run's 4,096 repeats it on every problem)")
    args = ap.parse_args()
    run = from_traces(args.traces) if args.traces else from_chains_html(CHAINS_HTML)
    dropped = [b for b in run["budgets"] if b > args.max_budget]
    run["budgets"] = [b for b in run["budgets"] if b <= args.max_budget]
    # Same outcome, and for a finished chain the same length (a cut chain's length is just its budget).
    seen = lambda c: (state(c), None if state(c) == "cut" else c["wrote"])
    for b in dropped:
        changed = [(p["id"], m) for p in run["problems"] for m in run["models"]
                   if seen(p["cells"][(m, b)]) != seen(p["cells"][(m, run["budgets"][-1])])]
        print(f"left out the {b:,} budget: " + (f"it differs from {run['budgets'][-1]:,} on {changed}" if changed
                                                 else f"identical to {run['budgets'][-1]:,} on every problem"))
    doc = svg(run)
    svg_path = HERE / "fig1_heatmap.svg"
    svg_path.write_text(doc, encoding="utf-8")
    w, h = map(int, re.search(r'width="(\d+)" height="(\d+)"', doc).groups())
    made = png(svg_path, HERE / "fig1_heatmap.png", w, h)
    print(f"wrote fig1_heatmap.svg{' and fig1_heatmap.png' if made else ''}  ({run['run_id']}, "
          f"{len(run['problems'])} problems × {len(run['budgets'])} budgets × {len(run['models'])} models)")


if __name__ == "__main__":
    main()
