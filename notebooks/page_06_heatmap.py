"""Page 6, figure 1: the heat map of every problem, budget and model.

One cell per problem, budget and model: solved (cyan), finished with a wrong answer
(magenta), or cut off by the budget before answering (a pale magenta tint and a scissor
mark). The number in a coloured cell is how many tokens the model wrote. Rows are ordered by
the budget at which the larger model first solves them.

Used by page_06_thinking_longer.ipynb (figure 1) and by
docs/review/page6_small_run/build_heatmap.py. Standard library only.

    run = from_records(results, models, budgets)          # what the notebook has in memory
    run = from_traces("out/page_06_small/traces.jsonl")   # or a run on disk
    open("fig1_heatmap.svg", "w").write(svg(run))
"""
import json
import re
import subprocess
import tempfile
from pathlib import Path
from xml.sax.saxutils import escape

# web/src/lib/tokens.ts
PAPER, SURFACE, GRID, INK, MUTED = "#f3f2f2", "#eae9e9", "#d7d3d3", "#201e1d", "#444141"
SOLVED, WRONG, WRONG_INK = "#00789c", "#c2185b", "#790e3d"   # computeBright, wrongBright, wrong
CUT_FILL = "#e6c9d4"                                         # wrongBright at 20% on the surface
FONT = "'Source Serif 4', Georgia, serif"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"


def short(model_id):
    return model_id.split("/")[-1].replace("Qwen2.5-", "").replace("-Instruct", "")


def from_chains_html(path):
    html = path.read_text(encoding="utf-8")
    m = re.search(r'<script type="application/json" id="data">(.*?)</script>', html, re.S)
    data = json.loads(m.group(1).replace("<\\/", "</"))
    meta = data["meta"]
    problems = [dict(id=p["id"], level=p["level"], subject=p["subject"],
                     cells={(c["model"], c["budget"]): dict(cut=c["cut"], correct=c["correct"], wrote=c["wrote"])
                            for c in p["chains"]})
                for p in data["problems"]]
    return dict(models=meta["models"], budgets=meta["budgets"], decoding=meta.get("decoding"),
                run_id=meta["run_id"], problems=problems)


def from_traces(path):
    rows = [json.loads(line) for line in path.open(encoding="utf-8") if line.strip()]
    rows = [r for r in rows if r.get("budget") is not None and r.get("arm") is None]
    models = list(dict.fromkeys(short(r["model_id"]) for r in rows))
    budgets = sorted({r["budget"] for r in rows})
    problems = {}
    for r in rows:
        p = problems.setdefault(r["problem_id"], dict(id=r["problem_id"], level=r["level"],
                                                      subject=r["subject"], cells={}))
        p["cells"][(short(r["model_id"]), r["budget"])] = dict(
            cut=r["truncated"], correct=r["correct"], wrote=r.get("own_tokens", r.get("tokens_generated")))
    missing = [(p["id"], m, b) for p in problems.values() for m in models for b in budgets
               if (m, b) not in p["cells"]]
    if missing:
        raise SystemExit(f"{path} is missing {len(missing)} cells (e.g. {missing[0]}); is the run finished?")
    return dict(models=models, budgets=budgets, decoding="greedy", run_id=rows[0]["run_id"],
                problems=list(problems.values()))


def state(c):
    if c["correct"]:
        return "solved"
    return "cut" if c["cut"] else "wrong"


def cell(x, y, w, h, kind, text):
    fill = {"solved": SOLVED, "wrong": WRONG, "cut": CUT_FILL}[kind]
    ink = WRONG_INK if kind == "cut" else PAPER
    s = f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="2" fill="{fill}"/>'
    if text:
        s += (f'<text x="{x + w / 2}" y="{y + h / 2 + 4.5}" font-size="{14 if kind == "cut" else 12.5}" '
              f'fill="{ink}" text-anchor="middle" font-weight="600" '
              f'style="font-variant-numeric:tabular-nums">{text}</text>')
    return s


def svg(run):
    models, budgets = run["models"], run["budgets"]
    models = sorted(models, key=lambda m: -float(re.sub(r"[^\d.]", "", m) or 0))     # larger model first
    lead = models[0]

    def first(p, m, pred):
        return next((i for i, b in enumerate(budgets) if pred(p["cells"][(m, b)])), len(budgets))

    problems = sorted(run["problems"], key=lambda p: (
        first(p, lead, lambda c: c["correct"]),
        *[first(p, m, lambda c: c["correct"]) for m in models[1:]],
        first(p, lead, lambda c: not c["cut"])))

    cw, ch, gap = 54, 28, 2
    pad, label_w, panel_gap = 24, 206, 28
    top = 150
    panel_w = len(budgets) * (cw + gap) - gap
    W = pad * 2 + label_w + len(models) * panel_w + (len(models) - 1) * panel_gap
    rows_h = len(problems) * (ch + gap) - gap
    H = top + 4 + rows_h + 30 + pad

    out = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" '
           f'font-family="{FONT}" role="img" aria-label="Which of {len(problems)} problems each model solves at each '
           f'token budget">',
           f'<rect width="{W}" height="{H}" fill="{PAPER}"/>',
           f'<rect x="0.5" y="0.5" width="{W - 1}" height="{H - 1}" rx="4" fill="{SURFACE}" stroke="{GRID}"/>']

    def t(x, y, s, size=13, fill=INK, anchor="start", weight=400):
        out.append(f'<text x="{x}" y="{y}" font-size="{size}" fill="{fill}" text-anchor="{anchor}" '
                   f'font-weight="{weight}">{escape(str(s))}</text>')   # e.g. "Counting & Probability"

    # Ledger: the run's vitals, inside the figure. The models are named on their panels.
    t(pad, pad + 10, f"{run['decoding'].capitalize()} decoding · MATH-500, levels 4 and 5 · {len(problems)} problems",
      size=12, fill=MUTED)

    # Legend: what a colour means, then what the number means.
    lx, ly = pad, pad + 36
    for kind, label in [("solved", "Solved"), ("wrong", "Answered, but wrong"),
                        ("cut", "Cut off: the budget ran out before it answered")]:
        out.append(cell(lx, ly - 11, 16, 14, kind, ""))
        t(lx + 22, ly, label)
        lx += 22 + len(label) * 6.5 + 26
    t(pad, ly + 22, "The number in a cell is how many tokens the model wrote.", fill=MUTED)

    x0 = pad + label_w
    for mi, m in enumerate(models):
        px = x0 + mi * (panel_w + panel_gap)
        t(px + panel_w / 2, top - 46, f"Qwen2.5-{m}-Instruct", size=16, anchor="middle", weight=600)
        t(px + panel_w / 2, top - 27, "Token budget: the most it may write", size=12, fill=MUTED, anchor="middle")
        for bi, b in enumerate(budgets):
            t(px + bi * (cw + gap) + cw / 2, top - 8, f"{b:,}", size=13, anchor="middle", weight=600)
        for ri, p in enumerate(problems):
            y = top + 4 + ri * (ch + gap)
            for bi, b in enumerate(budgets):
                c = p["cells"][(m, b)]
                k = state(c)
                out.append(cell(px + bi * (cw + gap), y, cw, ch, k, "✂" if k == "cut" else f"{c['wrote']:,}"))
        fy = top + 4 + rows_h + 22
        for bi, b in enumerate(budgets):
            n = sum(p["cells"][(m, b)]["correct"] for p in problems)
            t(px + bi * (cw + gap) + cw / 2, fy, f"{n}", size=14, anchor="middle", weight=600)

    t(x0 - 10, top - 8, "Problem", size=12, fill=MUTED, anchor="end")
    for ri, p in enumerate(problems):
        y = top + 4 + ri * (ch + gap) + ch / 2 + 4.5
        t(x0 - 10, y, f"{ri + 1}  {p['subject']} · level {p['level']}", anchor="end")
    t(x0 - 10, top + 4 + rows_h + 22, f"Problems solved, of {len(problems)}", fill=MUTED, anchor="end")
    out.append("</svg>")
    return "\n".join(out)


def png(svg_path, png_path, w, h):
    if not Path(CHROME).exists():
        return False
    page = (f'<!doctype html><meta charset="utf-8"><link rel="stylesheet" '
            f'href="https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&display=block">'
            f'<style>html,body{{margin:0;background:{PAPER}}}svg{{display:block}}</style>{svg_path.read_text()}')
    with tempfile.TemporaryDirectory() as d:
        wrapper = Path(d) / "fig.html"
        wrapper.write_text(page, encoding="utf-8")
        subprocess.run([CHROME, "--headless", "--disable-gpu", "--hide-scrollbars", f"--window-size={w},{h}",
                        "--force-device-scale-factor=2", "--virtual-time-budget=4000",
                        f"--screenshot={png_path}", wrapper.as_uri()],
                       check=True, capture_output=True)
    return True



def from_records(results, models, budgets, decoding="greedy", run_id=""):
    """The notebook's results[model_id][budget] (one record per problem) as a heat-map run."""
    problems = {}
    for m in models:
        for b in budgets:
            for r in results[m][b]:
                p = problems.setdefault(r["problem_id"], dict(id=r["problem_id"], level=r["level"],
                                                              subject=r["subject"], cells={}))
                p["cells"][(short(m), b)] = dict(cut=r["truncated"], correct=r["correct"], wrote=r["own_tokens"])
    return dict(models=[short(m) for m in models], budgets=list(budgets), decoding=decoding,
                run_id=run_id, problems=list(problems.values()))
