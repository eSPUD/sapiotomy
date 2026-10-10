#!/usr/bin/env python3
"""Read a page 6 traces.jsonl in the terminal, without opening the JSON.

    python view_traces.py                         # summary: problems solved per model and budget
    python view_traces.py problems                # every problem, with a verdict grid
    python view_traces.py show 3                  # problem 3: its chain at every budget, every model
    python view_traces.py show 3 --model 3B --budget 512
    python view_traces.py show algebra/2253       # a problem by (part of) its id

Options that work everywhere:
    --file PATH     a traces.jsonl (default: out/page_06/traces.jsonl)
    --run RUN_ID    which run in the file (default: the one with the most records)
    --no-color      plain text, for saving to a file

Long output reads best through a pager:  python view_traces.py show 3 | less -R

A chain that hit its budget is shown up to the cut and marked "out of tokens". Records
from the published run also carry a forced "Final answer" written after the cap; that
part is not shown, because the notebook no longer counts it.
"""
import argparse
import json
import shutil
import sys
import textwrap
from collections import Counter, defaultdict
from pathlib import Path

USE_COLOR = sys.stdout.isatty()
WIDTH = min(shutil.get_terminal_size((110, 24)).columns, 120)


def paint(text, code):
    return f"\033[{code}m{text}\033[0m" if USE_COLOR else text


def green(t): return paint(t, "32")
def red(t): return paint(t, "31")
def dim(t): return paint(t, "2")
def bold(t): return paint(t, "1")
def yellow(t): return paint(t, "33")


def short(model_id):
    return model_id.split("/")[-1].replace("Qwen2.5-", "").replace("-Instruct", "")


def own_text(r):
    """What the model itself wrote: up to the cut if anything was appended after it."""
    if r.get("forced") and r.get("cut_index") is not None:
        return "".join(r["tokens"][: r["cut_index"]])
    return r["trace"]


def verdict(r):
    """Correct under 'the model just stops': a cut-off chain needs a boxed answer of its own.

    New runs store this grade directly. Published records were graded on their forced
    answer, so for those the stored grade only stands when the chain finished on its own;
    a cut-off one counts as wrong unless it had already written \\boxed{...}."""
    if not r.get("forced"):
        return bool(r["correct"])
    return "\\boxed{" in own_text(r) and None   # None = needs the notebook's grader to decide


def load(path, run_id):
    rows = [json.loads(line) for line in open(path, encoding="utf-8") if line.strip()]
    if not rows:
        sys.exit(f"{path} is empty")
    runs = Counter(r["run_id"] for r in rows)
    run_id = run_id or runs.most_common(1)[0][0]
    if run_id not in runs:
        sys.exit(f"no run {run_id!r} in {path}. Runs present:\n  " + "\n  ".join(runs))
    rows = [r for r in rows if r["run_id"] == run_id]
    budget_rows = [r for r in rows if r.get("budget") is not None and r.get("arm") is None
                   and r["model_id"] != "soft"]
    problems = list(dict.fromkeys(r["problem_id"] for r in budget_rows))   # file order
    return run_id, runs, budget_rows, problems


def mark(r):
    v = verdict(r)
    if v is None:
        return yellow("?")
    if r["truncated"]:
        return green("✓") if v else red("✂")
    return green("✓") if v else red("✗")


def cmd_summary(args):
    run_id, runs, rows, problems = load(args.file, args.run)
    models = list(dict.fromkeys(r["model_id"] for r in rows))
    budgets = sorted({r["budget"] for r in rows})
    print(bold(f"run {run_id}") + dim(f"   ({len(problems)} problems, {len(rows)} chains)"))
    if len(runs) > 1:
        print(dim(f"other runs in this file: {', '.join(k for k in runs if k != run_id)}"))
    print()
    cell = 14
    print(f"{'':<14}" + "".join(f"{b:>{cell}}" for b in budgets))
    for m in models:
        solved, cut = [], []
        for b in budgets:
            rs = [r for r in rows if r["model_id"] == m and r["budget"] == b]
            solved.append(f"{sum(verdict(r) is True for r in rs)}/{len(rs)}")
            cut.append(f"{sum(r['truncated'] for r in rs)} cut")
        print(f"{short(m):<14}" + "".join(f"{s:>{cell}}" for s in solved) + dim("   solved"))
        print(f"{'':<14}" + "".join(dim(f"{c:>{cell}}") for c in cut) + dim("   cut off by the budget"))
    if any(verdict(r) is None for r in rows):
        print(yellow("\n? = cut off after writing a \\boxed{} answer; the notebook's grader decides those"))


def cmd_problems(args):
    run_id, _, rows, problems = load(args.file, args.run)
    models = list(dict.fromkeys(r["model_id"] for r in rows))
    budgets = sorted({r["budget"] for r in rows})
    by = {(r["model_id"], r["budget"], r["problem_id"]): r for r in rows}
    print(bold(f"run {run_id}"))
    print(dim("✓ correct   ✗ finished but wrong   ✂ cut off by the budget, no answer"))
    print(dim(f"each model's columns are the budgets in order: {', '.join(map(str, budgets))} tokens\n"))
    head = "  ".join(f"{short(m):^{len(budgets) * 2}}" for m in models)
    print(f"{'#':>3}  {'problem':<38}{'lvl':>4}  {head}")
    for i, pid in enumerate(problems, 1):
        level = next(r["level"] for r in rows if r["problem_id"] == pid)
        grid = "  ".join(" ".join(mark(by[(m, b, pid)]) if (m, b, pid) in by else dim("·") for b in budgets)
                         .ljust(len(budgets) * 2) for m in models)
        print(f"{i:>3}  {pid.replace('test/', '').replace('.json', ''):<38}{level:>4}  {grid}")


def find_problem(key, problems):
    if key.isdigit() and 1 <= int(key) <= len(problems):
        return problems[int(key) - 1]
    hits = [p for p in problems if key in p]
    if len(hits) == 1:
        return hits[0]
    sys.exit(f"{len(hits)} problems match {key!r}" + (": " + ", ".join(hits[:8]) if hits else
             f"; use a number from 1 to {len(problems)} or part of an id (see: view_traces.py problems)"))


def wrap(text, indent="    "):
    out = []
    for para in text.split("\n"):
        out += textwrap.wrap(para, WIDTH - len(indent), replace_whitespace=False) or [""]
    return "\n".join(indent + line for line in out)


def cmd_show(args):
    run_id, _, rows, problems = load(args.file, args.run)
    pid = find_problem(args.problem, problems)
    picked = [r for r in rows if r["problem_id"] == pid
              and (not args.model or args.model.lower() in r["model_id"].lower())
              and (not args.budget or r["budget"] == args.budget)]
    if not picked:
        sys.exit("nothing matches that model and budget for this problem")
    first = picked[0]
    print(bold(f"{pid}") + dim(f"   level {first['level']}, {first['subject']}   run {run_id}"))
    print(wrap(first["question"], "  "))
    print(f"  reference answer: {bold(first['ground_truth'])}")
    for r in sorted(picked, key=lambda r: (r["model_id"], r["budget"])):
        v = verdict(r)
        status = "cut off by the budget" if r["truncated"] else "finished"
        grade = yellow("? (boxed before the cut)") if v is None else (green("correct") if v else red("wrong"))
        answer = r.get("extracted_answer") if not r.get("forced") else None
        reused = dim(f"   (same chain as at {r['carried_from']})") if r.get("carried_from") else ""
        print("\n" + "─" * WIDTH)
        print(bold(f"{short(r['model_id'])} at {r['budget']} tokens") +
              f"   wrote {r['own_tokens']}, {status}   {grade}" +
              (f"   answer: {answer!r}" if answer else "") + reused)
        print("─" * WIDTH)
        print(wrap(own_text(r)))
        if r["truncated"]:
            print(red("    ✂ out of tokens"))


def main():
    global USE_COLOR
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--file", default=str(Path(__file__).resolve().parent / "out/page_06/traces.jsonl"))
    p.add_argument("--run", default=None)
    p.add_argument("--no-color", action="store_true")
    sub = p.add_subparsers(dest="cmd")
    sub.add_parser("summary", help="problems solved per model and budget (the default)")
    sub.add_parser("problems", help="every problem, with a verdict grid")
    s = sub.add_parser("show", help="one problem's chains")
    s.add_argument("problem", help="a number from the problems list, or part of a problem id")
    s.add_argument("--model", help="e.g. 3B or 1.5B")
    s.add_argument("--budget", type=int, help="e.g. 512")
    args = p.parse_args()
    if args.no_color:
        USE_COLOR = False
    {"summary": cmd_summary, None: cmd_summary, "problems": cmd_problems, "show": cmd_show}[args.cmd](args)


if __name__ == "__main__":
    try:
        main()
    except BrokenPipeError:      # piping into `head` or quitting `less` early
        pass
