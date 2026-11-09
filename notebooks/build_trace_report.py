#!/usr/bin/env python3
"""Turn a page's run into one HTML page for reading every chain.

    python build_trace_report.py --page 9                      # page 9's shipped run -> out/page_09/trace_report.html
    python build_trace_report.py --page 6 --run-dir out/page_06_small
    python build_trace_report.py --page 8 --out ~/Desktop/page8.html
    python build_trace_report.py --all                         # every page with traces on disk or in a bundle

A run is read from --run-dir if given, else from out/page_NN/ when it holds a finished run (traces.jsonl
beside a manifest.json), else
straight out of the page's bundle in web/public/notebooks/. The output is a single self-contained
file (the data is embedded) that opens in any browser and can be sent as an attachment.

Every page shares one layout: an overview grid with a row per problem, then one problem at a time
with the prompt exactly as the model received it and every chain the run wrote for it. Few chains
sit side by side with their reasoning open; a pile of samples is a tally of its answers and a list
of chains, each opened on demand. Each page's adapter below decides how its chains group.

A chain cut off by its cap is shown up to the cut. Runs that appended a forced "Final answer"
after the cap (pages 7 and 11, and page 6's published run) have that answer shown separately
and marked as forced; tallies here count those chains as cut off, not as the forced answer.

Only the standard library is used. Maths is typeset with MathJax when the page is opened with an
internet connection; without one the LaTeX is shown as written.
"""
import argparse
import base64
import gzip
import io
import json
import re
import sys
import zipfile
from collections import Counter, defaultdict
from pathlib import Path

HERE = Path(__file__).resolve().parent
BUNDLES = HERE.parent / "web/public/notebooks"
TEMPLATE = HERE / "trace_report_template.html"

# page -> (title, bundle name). The run folder inside a bundle is out/page_NN/.
PAGES = {
    5: ("Chain of thought", "page-05-how-to-reason"),
    6: ("Thinking longer", "page-06-thinking-longer"),
    8: ("Best-of-N and verifiers", "page-08-best-of-n"),
    9: ("Outcome vs process supervision", "page-09-outcome-vs-process"),
    11: ("The keystone", "page-11-training-vs-scale"),
}

# ch03's render_prompt, used when a manifest does not record the template.
CH03_TEMPLATE = ("You are a helpful math assistant.\nAnswer the question and write the final result on a "
                 "new line as:\n\\boxed{ANSWER}\n\nQuestion:\n{question}\n\nAnswer:")
QWEN_SYSTEM = "You are Qwen, created by Alibaba Cloud. You are a helpful assistant."


# ---- reading a run ---------------------------------------------------------------------------

class Run:
    """A run folder, or the same folder inside a page's bundle."""

    def __init__(self, page, run_dir=None):
        nn = f"page_{page:02d}"
        self.zip = self.member = None
        if run_dir:
            self.dir = Path(run_dir).expanduser().resolve()
            if not (self.dir / "traces.jsonl").exists():
                sys.exit(f"no traces.jsonl in {self.dir}")
            self.where = str(self.dir)
            return
        local = HERE / "out" / nn
        if (local / "traces.jsonl").exists():
            if (local / "manifest.json").exists():
                self.dir, self.where = local, str(local)
                return
            print(f"  page {page}: {local} has traces but no manifest, so it is not a finished run; "
                  f"reading the bundle")
        bundle = BUNDLES / f"{PAGES[page][1]}.zip"
        if not bundle.exists():
            sys.exit(f"page {page}: no traces in {local} and no bundle at {bundle}")
        self.zip, self.dir = zipfile.ZipFile(bundle), local
        names = [n for n in self.zip.namelist() if n.endswith(f"out/{nn}/traces.jsonl")]
        if not names:
            sys.exit(f"page {page}: {bundle.name} holds no out/{nn}/traces.jsonl")
        self.member = names[0].rsplit("/", 1)[0]
        self.where = f"{bundle.name}:{self.member}"

    def has(self, name):
        if self.zip:
            return f"{self.member}/{name}" in self.zip.namelist()
        return (self.dir / name).exists()

    def _open(self, name):
        if self.zip:
            return io.TextIOWrapper(self.zip.open(f"{self.member}/{name}"), encoding="utf-8")
        return (self.dir / name).open(encoding="utf-8")

    def jsonl(self, name):
        if not self.has(name):
            return []
        with self._open(name) as f:
            return [json.loads(line) for line in f if line.strip()]

    def json(self, name):
        if not self.has(name):
            return {}
        with self._open(name) as f:
            return json.load(f)


# ---- shared pieces ---------------------------------------------------------------------------

def short(model_id):
    return model_id.split("/")[-1].replace("Qwen2.5-", "").replace("-Instruct", "")


def main_run(rows, manifest):
    """The run a manifest describes. Page 9's names its own grading run, not the run its chains
    came from, so a manifest id that matches no record falls back to the most common one."""
    ids = Counter(r["run_id"] for r in rows)
    run_id = manifest.get("run_id")
    if run_id not in ids:
        run_id = ids.most_common(1)[0][0]
    return run_id, [r for r in rows if r["run_id"] == run_id]


def own_text(r):
    """What the model wrote itself: a forced answer appended after the cap is not part of it."""
    if r.get("forced") and r.get("cut_index") is not None and r.get("tokens"):
        return "".join(r["tokens"][: r["cut_index"]])
    return r["trace"]


def char_offsets(tokens):
    """offsets[i] is where token i starts in "".join(tokens)."""
    out, n = [0], 0
    for t in tokens:
        n += len(t)
        out.append(n)
    return out


def chain(r, title, cap=None, same_as=None, **extra):
    """One chain as the page draws it. `kind`: ok, bad, or cut (stopped by its cap with no
    answer of its own; a forced answer does not count as one)."""
    cut, forced = bool(r.get("truncated")), bool(r.get("forced"))
    correct = bool(r.get("correct"))
    if forced:
        kind = "cut"
    elif cut:
        kind = "ok" if correct else "cut"     # a cut chain that had already boxed the answer
    else:
        kind = "ok" if correct else "bad"
    c = dict(title=title, kind=kind, cut=cut, trace=own_text(r),
             answer=(r.get("extracted_answer") or "") if not forced else "",
             wrote=r.get("own_tokens", r.get("tokens_generated")), cap=cap)
    if forced:
        c["forced"] = [r.get("extracted_answer") or "", correct]
    if same_as:
        c["same_as"] = same_as
    c.update({k: v for k, v in extra.items() if v is not None})
    return c


def tally(chains, key=lambda c: c["answer"]):
    """Answers the chains wrote, most common first; chains cut off without one are counted apart."""
    rows, cut = {}, 0
    for c in chains:
        if c["kind"] == "cut" or not c["answer"]:
            cut += 1
            continue
        k = key(c)
        row = rows.setdefault(k, dict(answer=c["answer"], n=0, correct=c["kind"] == "ok"))
        row["n"] += 1
    out = sorted(rows.values(), key=lambda x: -x["n"])
    return dict(rows=out, cut=cut, n=len(chains), right=sum(c["kind"] == "ok" for c in chains))


def vote_cell(t, href):
    """An overview cell for a pile: right/total, coloured by whether the most common answer is right."""
    rows = t["rows"]
    if not rows:
        kind = "cut"
    elif len(rows) > 1 and rows[0]["n"] == rows[1]["n"]:
        kind = "tie"
    else:
        kind = "ok" if rows[0]["correct"] else "bad"
    return dict(text=f"{t['right']}/{t['n']}", kind=kind, href=href)


def chip_cell(c, href):
    return dict(kind=c["kind"], href=href)


def problem_head(r, **extra):
    pid = r["problem_id"]
    return dict(id=pid, label=pid.replace("test/", "").replace(".json", ""), level=r.get("level"),
                subject=r.get("subject"), question=r["question"], reference=r["ground_truth"], **extra)


def user_message(manifest, question, template=None):
    t = template or manifest.get("prompt_template") or CH03_TEMPLATE
    return t.replace("{question}", question)


def chat_raw(system, user):
    s = f"<|im_start|>system\n{system}<|im_end|>\n" if system else ""
    return f"{s}<|im_start|>user\n{user}<|im_end|>\n<|im_start|>assistant\n"


def parse_config(cid):
    m = re.match(r"t([\d.]+)-c(\d+)", cid)
    return (float(m.group(1)), int(m.group(2))) if m else (None, None)


def facts(run_id, manifest, rows, models, extra=()):
    v = manifest.get("versions") or {}
    out = [["run", run_id], ["models", ", ".join(models)], ["problems", len({r["problem_id"] for r in rows})],
           ["chains", None]]
    out += list(extra)
    out += [["gpu", v.get("gpu")], ["made", manifest.get("timestamp_utc")]]
    return out


# ---- page adapters ---------------------------------------------------------------------------
# Each returns (meta, problems). A problem carries `cells` (one per meta["columns"]) for the
# overview, and `groups`, each a "side" (a few chains next to each other) or a "pile" (a tally
# and a list). Hrefs are local to the problem: "g2" is its third group, "g2c5" a chain in it.

def by_problem(rows):
    out = defaultdict(list)
    for r in rows:
        out[r["problem_id"]].append(r)
    return out


def page5(run):
    manifest = run.json("manifest.json")
    run_id, rows = main_run(run.jsonl("traces.jsonl"), manifest)
    models = list(dict.fromkeys(r["model_id"] for r in rows))
    conds = [c for c in ["forced_blurt", "bare", "zero_shot_cot"] if any(r["condition"] == c for r in rows)]
    names = {"forced_blurt": "System 1: answer only", "bare": "System 2: the plain prompt",
             "zero_shot_cot": "Asked to explain step by step"}
    cap = (manifest.get("decoding") or {}).get("max_new_tokens")
    problems = []
    for pid, rs in by_problem(rows).items():
        recs = {(r["condition"], r["model_id"]): r for r in rs}
        p = problem_head(rs[0], groups=[], cells=[])
        cells = {}
        for gi, cond in enumerate(conds):
            chains = []
            for m in models:
                r = recs.get((cond, m))
                if r is None:
                    continue
                c = chain(r, short(m), cap=r.get("max_new_tokens", cap))
                cells[(cond, m)] = chip_cell(c, f"g{gi}c{len(chains)}")
                chains.append(c)
            first = next(r for r in rs if r["condition"] == cond)
            p["groups"].append(dict(title=names.get(cond, cond), layout="side", chains=chains,
                                    prompt=dict(system=QWEN_SYSTEM, user=first["prompt"],
                                                raw=chat_raw(QWEN_SYSTEM, first["prompt"]))))
        p["cells"] = [cells.get((cond, m)) for cond in conds for m in models]
        problems.append(p)
    meta = dict(columns=[dict(group=names[c].split(":")[0], label=short(m)) for c in conds for m in models],
                facts=facts(run_id, manifest, rows, [short(m) for m in models],
                            [["decoding", (manifest.get("decoding") or {}).get("strategy")]]),
                intro="Each problem was given to each model three ways: told to give only the final answer, "
                      "with the plain prompt, and asked to explain step by step. Every chain the run wrote is below.")
    return meta, problems


def page6(run):
    manifest = run.json("manifest.json")
    run_id, rows = main_run(run.jsonl("traces.jsonl"), manifest)
    sweep = [r for r in rows if r.get("budget") is not None and r.get("arm") is None and r["model_id"] != "soft"]
    waits = [r for r in rows if r.get("arm") == "wait"]
    skipped = len(rows) - len(sweep) - len(waits)
    if skipped:
        print(f"  page 6: left out {skipped} records from arms the notebook no longer runs")
    models = list(dict.fromkeys(r["model_id"] for r in sweep + waits))
    budgets = sorted({r["budget"] for r in sweep})
    ks = sorted({r["waits"] for r in waits})
    chat = manifest.get("chat_template", "")
    system = QWEN_SYSTEM
    if "<|im_start|>system\n" in chat:
        system = chat.split("<|im_start|>system\n", 1)[1].split("<|im_end|>", 1)[0]
    word = (manifest.get("waits") or {}).get("word", "Wait")

    problems = []
    for pid, rs in by_problem(sweep + waits).items():
        p = problem_head(rs[0], groups=[], cells=[])
        user = user_message(manifest, rs[0]["question"])
        p["prompt"] = dict(system=system, user=user, raw=chat_raw(system, user))
        cells = {}
        recs = {(r.get("arm"), r["model_id"], r.get("budget"), r.get("waits")): r for r in rs}
        for b in budgets:
            gi, chains = len(p["groups"]), []
            for m in models:
                r = recs.get((None, m, b, None))
                if r is None:
                    continue
                cf = r.get("carried_from")
                c = chain(r, short(m), cap=b, same_as=f"same chain as at {cf} tokens" if cf else None)
                cells[("b", m, b)] = chip_cell(c, f"g{gi}c{len(chains)}")
                chains.append(c)
            if chains:
                p["groups"].append(dict(title=f"{b} tokens", sub="budget", layout="side", chains=chains))
        for k in ks:
            gi, chains = len(p["groups"]), []
            for m in models:
                r = recs.get(("wait", m, None, k))
                if r is None:
                    continue
                offs = char_offsets(r["tokens"]) if r.get("tokens") else None
                spans = [[offs[a], offs[b]] for a, b in r.get("wait_spans") or []] if offs else None
                cf = r.get("carried_from")
                same = None
                if cf is not None and cf != k:
                    same = f"same chain as with {cf} × {word}"
                c = chain(r, short(m), same_as=same, marks=spans or None,
                          note=None if r.get("offered_a_stop", True) else "never tried to stop")
                cells[("w", m, k)] = chip_cell(c, f"g{gi}c{len(chains)}")
                chains.append(c)
            if chains:
                title = "No extension" if k == 0 else f"“{word}” injected {k}×"
                p["groups"].append(dict(title=title, sub="each time the model tried to stop" if k else
                                        "the model stops when it likes", layout="side", chains=chains))
        p["cells"] = ([cells.get(("b", m, b)) for m in models for b in budgets]
                      + [cells.get(("w", m, k)) for m in models for k in ks])
        problems.append(p)
    columns = ([dict(group=short(m), label=str(b)) for m in models for b in budgets]
               + [dict(group=f"{short(m)} · {word}", label=f"{k}×") for m in models for k in ks])
    forced = any(r.get("forced") for r in sweep)
    meta = dict(columns=columns,
                facts=facts(run_id, manifest, sweep + waits, [short(m) for m in models],
                            [["budgets", ", ".join(map(str, budgets))],
                             ["decoding", (manifest.get("decoding") or {}).get("strategy")]]),
                intro="Each problem was given to each model at every token budget. A model that reaches its "
                      "budget stops there; a chain cut off before writing a boxed answer counts as wrong."
                      + (f" The extension arm injects “{word}” each time the model tries to end its turn."
                         if ks else ""),
                forced_note=forced)
    return meta, problems


def page7(run):
    manifest = run.json("manifest.json")
    run_id, rows = main_run(run.jsonl("traces.jsonl"), manifest)
    pile_cfg = (manifest.get("pile") or {}).get("config_id", "t0.30-c2048")
    total = (manifest.get("split") or {}).get("budget_total", 2048)
    seen, recs, copies = set(), [], Counter()
    for r in rows:
        if r.get("replicated_from") is not None:
            copies[(r["config_id"], r["problem_id"])] += 1
            continue
        key = (r["config_id"], r["problem_id"], r["sample_index"])
        if key not in seen:                   # a chain shared by two askings is recorded twice
            seen.add(key)
            recs.append(r)

    def order(cid):
        t, cap = parse_config(cid)
        if t == 0:
            return (0, 0, 0)
        if cid == pile_cfg:
            return (1, 0, 0)
        if cap < total:
            return (2, -cap, 0)
        return (3, t, 0)

    cfgs = sorted({r["config_id"] for r in recs}, key=order)

    def title(cid, n):
        t, cap = parse_config(cid)
        if t == 0:
            return "Greedy (T = 0)", "one chain; the run's other copies are identical"
        if cid == pile_cfg:
            return f"The pile: {n} chains at T = {t:g}", f"each may use {cap:,} tokens"
        if cap < total:
            return f"{total:,} tokens split {total // cap} ways", f"{n} chains of {cap} tokens at T = {t:g}"
        return f"T = {t:g}", f"{n} chains of up to {cap:,} tokens"

    problems = []
    groups_by_p = by_problem(recs)
    for pid, rs in groups_by_p.items():
        p = problem_head(rs[0], groups=[], cells=[])
        user = user_message(manifest, rs[0]["question"])
        p["prompt"] = dict(system=QWEN_SYSTEM, user=user, raw=chat_raw(QWEN_SYSTEM, user))
        cells = {}
        for cid in cfgs:
            cr = sorted((r for r in rs if r["config_id"] == cid), key=lambda r: r["sample_index"])
            if not cr:
                continue
            gi = len(p["groups"])
            t, cap = parse_config(cid)
            chains = [chain(r, f"#{r['sample_index']}", cap=cap, key=r.get("vote_key")) for r in cr]
            ttl, sub = title(cid, len(chains))
            if t == 0:
                if copies[(cid, pid)]:
                    chains[0]["note"] = f"recorded {copies[(cid, pid)] + len(chains)}× in the run, identical"
                p["groups"].append(dict(title=ttl, sub=sub, layout="side", chains=chains[:1]))
                cells[cid] = chip_cell(chains[0], f"g{gi}c0")
            else:
                tl = tally(chains, key=lambda c: c.get("key") or c["answer"])
                p["groups"].append(dict(title=ttl, sub=sub, layout="pile", chains=chains, tally=tl))
                cells[cid] = vote_cell(tl, f"g{gi}")
        p["cells"] = [cells.get(c) for c in cfgs]
        problems.append(p)

    def col(cid):
        t, cap = parse_config(cid)
        if t == 0:
            return dict(group="greedy", label="T=0")
        if cid == pile_cfg:
            return dict(group="pile", label=f"T={t:g}")
        if cap < total:
            return dict(group="split", label=f"{total // cap}×{cap}")
        return dict(group="temperature", label=f"T={t:g}")

    meta = dict(columns=[col(c) for c in cfgs],
                facts=facts(run_id, manifest, recs, [short(m["id"]) for m in manifest.get("models", [])]
                            or sorted({short(r["model_id"]) for r in recs}),
                            [["decoding", (manifest.get("decoding") or {}).get("strategy")]]),
                intro="One model, many samples of each problem. A pile's cell reads right/total; its colour "
                      "is whether the most common answer is right.",
                forced_note=any(r.get("forced") for r in recs))
    return meta, problems


def page8(run):
    manifest = run.json("manifest.json")
    rows = run.jsonl("traces.jsonl")
    run_id = (manifest.get("candidates") or {}).get("run_id") or Counter(r["run_id"] for r in rows).most_common(1)[0][0]
    rows = [r for r in rows if r["run_id"] == run_id]
    verifiers = manifest.get("verifiers") or []
    judges = [v["name"] for v in verifiers]
    scores = defaultdict(dict)
    for s in run.jsonl("scores.jsonl"):
        if s["run_id"].endswith(run_id):
            scores[(s["config_id"], s["problem_id"], s["sample_index"])][s["scorer"]] = s["score"]
            if s["scorer"] not in judges:
                judges.append(s["scorer"])
    solves = {s["problem_id"]: s for s in run.jsonl("judge_solves.jsonl") if s["run_id"].endswith(run_id)}
    solver = next((v["name"] for v in verifiers if solves and v["model"] == next(iter(solves.values()))["model_id"]),
                  None)
    main_cfg = (manifest.get("candidates") or {}).get("main_config")
    cfgs = sorted({r["config_id"] for r in rows}, key=lambda c: parse_config(c)[0])

    problems = []
    for pid, rs in by_problem(rows).items():
        p = problem_head(rs[0], groups=[], cells=[])
        user = user_message(manifest, rs[0]["question"])
        p["prompt"] = dict(system=QWEN_SYSTEM, user=user, raw=chat_raw(QWEN_SYSTEM, user))
        if pid in solves:
            s = solves[pid]
            p["notes"] = [dict(kind="ok" if s["correct"] else "bad", text=f"{short(s['model_id'])}, the {solver} "
                               f"judge, solving it itself: answered", answer=s.get("extracted_answer") or "nothing")]
        cells = {}
        for cid in cfgs:
            cr = sorted((r for r in rs if r["config_id"] == cid), key=lambda r: r["sample_index"])
            gi = len(p["groups"])
            t, cap = parse_config(cid)
            chains = [chain(r, f"#{r['sample_index']}", cap=cap, key=r.get("vote_key"),
                            scores=scores.get((cid, pid, r["sample_index"])) or None) for r in cr]
            tl = tally(chains, key=lambda c: c.get("key") or c["answer"])
            tops = []
            for j in judges:
                scored = [(c["scores"][j], -i, i) for i, c in enumerate(chains) if j in (c.get("scores") or {})]
                if scored:
                    i = max(scored)[2]     # ties go to the lowest sample index
                    tops.append(dict(judge=j, chain=i, kind=chains[i]["kind"]))
                    cells[(cid, j)] = chip_cell(chains[i], f"g{gi}c{i}")
            p["groups"].append(dict(title=f"{len(chains)} chains at T = {t:g}", sub=f"each may use {cap:,} tokens",
                                    layout="pile", chains=chains, tally=tl, tops=tops, sorts=judges))
            cells[cid] = vote_cell(tl, f"g{gi}")
        p["cells"] = [cells.get(c) for c in cfgs] + [cells.get((main_cfg, j)) for j in judges]
        problems.append(p)
    n_main = max((len(g["chains"]) for g in problems[0]["groups"]), default=0) if problems else 0
    columns = ([dict(group="pile", label=f"T={parse_config(c)[0]:g}") for c in cfgs]
               + [dict(group=f"top-scored of {n_main} at T={parse_config(main_cfg)[0]:g}" if main_cfg else "top-scored",
                       label=j) for j in judges])
    jprompt = next((v.get("prompt") for v in verifiers if v.get("prompt")), None)
    meta = dict(columns=columns,
                facts=facts(run_id, manifest, rows, [short((manifest.get("candidates") or {}).get("model_id", rows[0]["model_id"]))],
                            [["judges", ", ".join(f"{v['name']} ({short(v['model'])})" for v in verifiers)]]),
                intro="One model's piles at four temperatures, every chain scored by each judge. A pile's cell "
                      "reads right/total, coloured by whether the most common answer is right; a judge's cell "
                      "is the chain it scored highest.",
                judges={v["name"]: dict(model=v["model"], kind=v["kind"]) for v in verifiers},
                extras=[dict(title="What each yes/no judge was asked", text=jprompt)] if jprompt else [])
    return meta, problems


def page9(run):
    manifest = run.json("manifest.json")
    run_id, rows = main_run(run.jsonl("traces.jsonl"), manifest)
    chains_m = manifest.get("chains") or {}
    template = chains_m.get("prompt_template")
    prm = ((manifest.get("graders") or {}).get("prm") or {}).get("id", "PRM")
    problems = []
    for pid, rs in by_problem(rows).items():
        rs = sorted(rs, key=lambda r: r["sample_index"])
        p = problem_head(rs[0], groups=[], cells=[])
        user = user_message(manifest, rs[0]["question"], template)
        p["prompt"] = dict(system=QWEN_SYSTEM, user=user, raw=chat_raw(QWEN_SYSTEM, user))
        chains = []
        for r in rs:
            offs = char_offsets(r["tokens"]) if r.get("tokens") else None
            steps = None
            if offs:
                steps = [[offs[s["token_start"]], offs[s["token_end"]], s["check"],
                          None if s.get("prm") is None else round(s["prm"], 4), s.get("prm_label")]
                         for s in r["steps"]]
            ff, pf = r.get("first_false"), r.get("prm_first_false")
            chains.append(chain(r, f"#{r['sample_index']}", cap=r.get("chain_budget"), key=r.get("vote_key"),
                                steps=steps, flags=dict(checker=r.get("n_false", 0), checker_first=ff,
                                                        prm=r.get("prm_n_false", 0), prm_first=pf,
                                                        checkable=r.get("n_checkable", 0))))
        tl = tally(chains, key=lambda c: c.get("key") or c["answer"])
        p["groups"].append(dict(title=f"{len(chains)} chains the model ended itself", sub="T = 0.3, page 7's pile",
                                layout="pile", chains=chains, tally=tl, sorts=["checker", "prm"]))
        n_chk = sum(1 for c in chains if c["flags"]["checker"])
        n_prm_right = sum(1 for c in chains if c["flags"]["prm"] and c["kind"] == "ok")
        right = sum(c["kind"] == "ok" for c in chains)
        p["cells"] = [vote_cell(tl, "g0"),
                      dict(text=str(n_chk) if n_chk else "·", kind="bad" if n_chk else "none", href="g0"),
                      dict(text=f"{n_prm_right}/{right}" if right else "·", kind="warn" if n_prm_right else "none",
                           href="g0")]
        problems.append(p)
    meta = dict(columns=[dict(group="outcome", label="right"), dict(group="arithmetic checker", label="chains flagged"),
                         dict(group=short(prm), label="doubts a right chain")],
                facts=facts(run_id, manifest, rows, [short(chains_m.get("generator", rows[0]["model_id"]))],
                            [["step grader", prm]]),
                intro="Every chain page 7's pile ended itself, cut into steps. Each step carries the arithmetic "
                      "checker's verdict where it could check one, and the process reward model's score.",
                steps=True)
    return meta, problems


def page11(run):
    manifest = run.json("manifest.json")
    run_id, rows = main_run(run.jsonl("traces.jsonl"), manifest)
    models = list(dict.fromkeys(r["model_id"] for r in sorted(rows, key=lambda r: ("Math" in r["model_id"],
                                                                                    r["model_id"]))))
    bands = [b for b in ["easy", "hard"] if any(r["band"] == b for r in rows)]
    systems = {}
    for r in rows:
        systems.setdefault(r["model_id"], r.get("system_prompt"))
    problems = []
    for band in bands:
        for pid, rs in by_problem([r for r in rows if r["band"] == band]).items():
            p = problem_head(rs[0], band=band, groups=[], cells=[])
            user = user_message(manifest, rs[0]["question"])
            sys_rows = [[short(m), systems[m] or f"{QWEN_SYSTEM}  (the chat template's default)"] for m in models
                        if any(r["model_id"] == m for r in rs)]
            p["prompt"] = dict(system=sys_rows, user=user)
            cells, gi = {}, 0
            greedy = []
            for m in models:
                r = next((r for r in rs if r["model_id"] == m and r.get("temperature") == 0), None)
                if r:
                    c = chain(r, short(m), cap=r.get("chain_budget"))
                    cells[("g", m)] = chip_cell(c, f"g0c{len(greedy)}")
                    greedy.append(c)
            if greedy:
                p["groups"].append(dict(title="Greedy (T = 0)", sub="one chain per model", layout="side",
                                        chains=greedy))
                gi = 1
            for m in models:
                cr = sorted((r for r in rs if r["model_id"] == m and r.get("temperature") != 0),
                            key=lambda r: r["sample_index"])
                if not cr:
                    continue
                chains = [chain(r, f"#{r['sample_index']}", cap=r.get("chain_budget"), key=r.get("vote_key"))
                          for r in cr]
                tl = tally(chains, key=lambda c: c.get("key") or c["answer"])
                t = cr[0].get("temperature")
                p["groups"].append(dict(title=f"{short(m)}: {len(chains)} chains at T = {t:g}", layout="pile",
                                        chains=chains, tally=tl))
                cells[("p", m)] = vote_cell(tl, f"g{gi}")
                gi += 1
            p["cells"] = [cells.get(("g", m)) for m in models] + [cells.get(("p", m)) for m in models]
            problems.append(p)
    items = manifest.get("items") or {}
    band_fact = ", ".join(f"{b} L{min(items[b]['levels'])}–{max(items[b]['levels'])} ({items[b]['n']})"
                          for b in bands if b in items)
    meta = dict(columns=[dict(group="greedy", label=short(m)) for m in models]
                + [dict(group="pile at T=0.3", label=short(m)) for m in models],
                facts=facts(run_id, manifest, rows, [short(m) for m in models], [["bands", band_fact]]),
                intro="The general models and the maths specialist on an easy band and a hard band: one greedy "
                      "chain each, then a pile of samples. A pile's cell reads right/total, coloured by whether "
                      "the most common answer is right.",
                bands=True, forced_note=any(r.get("forced") for r in rows))
    return meta, problems


ADAPTERS = {5: page5, 6: page6, 7: page7, 8: page8, 9: page9, 11: page11}


# ---- writing the page ------------------------------------------------------------------------

def build(page, run_dir=None, out=None):
    run = Run(page, run_dir)
    meta, problems = ADAPTERS[page](run)
    if not problems:
        sys.exit(f"page {page}: no records to show in {run.where}")
    n = sum(len(g["chains"]) for p in problems for g in p["groups"])
    meta.update(page=page, title=PAGES[page][0], source=run.where)
    meta["facts"] = [[k, n if k == "chains" else v] for k, v in meta["facts"] if (n if k == "chains" else v) is not None]
    # Gzipped and base64'd: page 8's high-temperature chains alone are tens of MB as text, and
    # compress about fivefold. The page unpacks it with the browser's DecompressionStream.
    raw = json.dumps(dict(meta=meta, problems=problems), ensure_ascii=False, separators=(",", ":"))
    data = base64.b64encode(gzip.compress(raw.encode("utf-8"), 9, mtime=0)).decode("ascii")
    html = (TEMPLATE.read_text(encoding="utf-8").replace("__TITLE__", f"Page {page} Chains")
            .replace("__DATA__", data))
    out = Path(out).expanduser() if out else run.dir / "trace_report.html"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html, encoding="utf-8")
    print(f"page {page}: wrote {out}  ({len(problems)} problems, {n} chains, {out.stat().st_size / 1e6:.1f} MB)"
          f"  from {run.where}")


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--page", type=int, choices=sorted(PAGES), default=6)
    p.add_argument("--all", action="store_true", help="every page whose traces are on disk or in a bundle")
    p.add_argument("--run-dir", default=None, help="a run folder holding traces.jsonl (default: out/page_NN/, "
                                                   "else the page's bundle)")
    p.add_argument("--out", default=None, help="default: out/page_NN/trace_report.html, or <run-dir>/trace_report.html")
    args = p.parse_args()
    if args.all:
        if args.run_dir or args.out:
            sys.exit("--all takes no --run-dir or --out")
        for page in PAGES:
            build(page)
    else:
        build(args.page, args.run_dir, args.out)


if __name__ == "__main__":
    main()
