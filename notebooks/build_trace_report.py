#!/usr/bin/env python3
"""Turn a page 6 run into one HTML page for reading every chain.

    python build_trace_report.py                                   # out/page_06_small/ -> trace_report.html
    python build_trace_report.py --run-dir out/page_06_rerun       # any run folder
    python build_trace_report.py --out ~/Desktop/page6_small.html

Reads <run-dir>/traces.jsonl and <run-dir>/manifest.json and writes a single, self-contained
file (the data is embedded) that opens in any browser and can be sent as an attachment.

For every problem it shows the prompt exactly as the model received it, then each budget
with the models side by side: the full reasoning trace, which can be hidden one at a time or
all at once, then the output (the answer, or where the budget cut the chain off).

Only the standard library is used. Maths is typeset with MathJax when the page is opened
with an internet connection; without one the LaTeX is shown as written.
"""
import argparse
import json
import sys
from collections import Counter
from pathlib import Path

HERE = Path(__file__).resolve().parent


def short(model_id):
    return model_id.split("/")[-1].replace("Qwen2.5-", "").replace("-Instruct", "")


def own_text(r):
    """What the model wrote itself (older runs appended a forced answer after the cap)."""
    if r.get("forced") and r.get("cut_index") is not None:
        return "".join(r["tokens"][: r["cut_index"]])
    return r["trace"]


def last_boxed_line(text):
    """The paragraph holding the final \\boxed{...}, which is the model's stated answer."""
    i = text.rfind("\\boxed{")
    if i < 0:
        return ""
    start = max(text.rfind("\n\n", 0, i), 0)
    end = text.find("\n\n", i)
    return text[start: end if end > 0 else len(text)].strip()


def last_lines(text, chars=280):
    """The end of a cut-off chain, starting at a line break so no formula is cut in half."""
    tail = text[-chars:]
    nl = tail.find("\n")
    return tail[nl + 1:] if 0 <= nl < len(tail) - 1 else tail


def build(run_dir):
    traces_path, manifest_path = run_dir / "traces.jsonl", run_dir / "manifest.json"
    if not traces_path.exists():
        sys.exit(f"no traces.jsonl in {run_dir}")
    rows = [json.loads(line) for line in traces_path.open(encoding="utf-8") if line.strip()]
    manifest = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
    run_id = manifest.get("run_id") or Counter(r["run_id"] for r in rows).most_common(1)[0][0]
    rows = [r for r in rows if r["run_id"] == run_id and r.get("budget") is not None
            and r.get("arm") is None and r["model_id"] != "soft"]
    if not rows:
        sys.exit(f"no budget-sweep records for run {run_id} in {traces_path}")

    models = list(dict.fromkeys(r["model_id"] for r in rows))
    budgets = sorted({r["budget"] for r in rows})
    problems = list(dict.fromkeys(r["problem_id"] for r in rows))      # the run's own order

    template = manifest.get("prompt_template", "{question}")
    chat = manifest.get("chat_template", "")
    sample_user = template.replace("{question}", "What is 2+2?")
    system = ""
    if "<|im_start|>system\n" in chat:
        system = chat.split("<|im_start|>system\n", 1)[1].split("<|im_end|>", 1)[0]

    out = []
    for pid in problems:
        recs = {(r["model_id"], r["budget"]): r for r in rows if r["problem_id"] == pid}
        first = next(iter(recs.values()))
        user = template.replace("{question}", first["question"])
        chains = []
        for b in budgets:
            for m in models:
                r = recs.get((m, b))
                if r is None:
                    continue
                text = own_text(r)
                chains.append(dict(
                    model=short(m), budget=b, cut=bool(r["truncated"]), correct=bool(r["correct"]),
                    answer=r.get("extracted_answer") or "", wrote=r["own_tokens"],
                    same_as=r.get("carried_from"), trace=text,
                    stated=last_boxed_line(text) if not r["truncated"] else "",
                    tail=last_lines(text) if r["truncated"] else ""))
        out.append(dict(id=pid, label=pid.replace("test/", "").replace(".json", ""),
                        level=first["level"], subject=first["subject"], question=first["question"],
                        reference=first["ground_truth"], system=system, user=user,
                        raw=chat.replace(sample_user, user) if chat else "", chains=chains))

    meta = dict(run_id=run_id, models=[short(m) for m in models], budgets=budgets,
                n_problems=len(problems), gpu=(manifest.get("versions") or {}).get("gpu"),
                timestamp=manifest.get("timestamp_utc"), decoding=(manifest.get("decoding") or {}).get("strategy"))
    return meta, out


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--run-dir", default=str(HERE / "out/page_06_small"))
    p.add_argument("--out", default=None, help="default: <run-dir>/trace_report.html")
    args = p.parse_args()
    run_dir = Path(args.run_dir).expanduser().resolve()
    meta, problems = build(run_dir)
    data = json.dumps(dict(meta=meta, problems=problems), ensure_ascii=False).replace("</", "<\\/")
    out = Path(args.out).expanduser() if args.out else run_dir / "trace_report.html"
    out.write_text(PAGE.replace("__DATA__", data), encoding="utf-8")
    n = sum(len(p["chains"]) for p in problems)
    print(f"wrote {out}  ({len(problems)} problems, {n} chains, {out.stat().st_size / 1e6:.1f} MB)")


PAGE = r"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Page 6 Chains</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:wght@400;500;600&family=Newsreader:opsz,wght@6..72,500;6..72,600&display=swap">
<script>window.MathJax={tex:{inlineMath:[["$","$"],["\\(","\\)"]],displayMath:[["$$","$$"],["\\[","\\]"]]},svg:{fontCache:"global"},startup:{typeset:false,pageReady(){return MathJax.startup.defaultPageReady().then(()=>window.typesetAll&&window.typesetAll());}}};</script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.2/es5/tex-svg.min.js" async></script>
<style>
:root{
  --ground:#f3f5f4; --panel:#fff; --ink:#1a1e1c; --muted:#5b6562; --rule:#d7dcd9; --soft:#edf0ee;
  --accent:#1f5f8b; --accent-bg:#e2edf5; --ok:#2b7a4b; --ok-bg:#e3f2e8; --bad:#a8322d; --bad-bg:#f8e5e3;
  --cut:#7a4d0f; --cut-bg:#f6ecd9;
  --serif:"Newsreader",Georgia,serif; --sans:"IBM Plex Sans",system-ui,sans-serif; --mono:"IBM Plex Mono",ui-monospace,Menlo,monospace;
}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){color-scheme:dark;
  --ground:#121614; --panel:#1a1f1c; --ink:#e5eae6; --muted:#9ba6a1; --rule:#2e3632; --soft:#202624;
  --accent:#7ab6e2; --accent-bg:#15293a; --ok:#6cc790; --ok-bg:#14301f; --bad:#f08a82; --bad-bg:#3a1b19;
  --cut:#e2b866; --cut-bg:#33281a;}}
*{box-sizing:border-box}
body{margin:0;background:var(--ground);color:var(--ink);font:15px/1.55 var(--sans);padding-inline:20px;padding-block:28px 64px}
.wrap{max-width:1180px;margin:0 auto;display:flex;flex-direction:column;gap:28px}
h1,h2,h3{font-family:var(--serif);font-weight:600;margin:0;line-height:1.2;text-wrap:balance}
h1{font-size:2rem} h2{font-size:1.4rem} h3{font-size:1.05rem}
p{margin:0}
.muted{color:var(--muted)} .mono{font-family:var(--mono);font-size:.88em}
.eyebrow{font:600 11px/1.4 var(--sans);letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.meta{display:flex;flex-wrap:wrap;gap:4px 18px;font:13px var(--mono);color:var(--muted)}
.meta b{color:var(--ink);font-weight:600}
.bar{position:sticky;top:0;z-index:5;background:var(--ground);padding-block:10px;border-bottom:1px solid var(--rule);display:flex;flex-wrap:wrap;gap:10px;align-items:center}
button{font:500 13px var(--sans);color:var(--ink);background:var(--panel);border:1px solid var(--rule);border-radius:6px;padding:6px 11px;cursor:pointer}
button:hover{border-color:var(--muted)}
button[aria-pressed="true"]{background:var(--ink);color:var(--ground);border-color:var(--ink)}
button:focus-visible,summary:focus-visible,a:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.legend{display:flex;gap:14px;flex-wrap:wrap;font-size:13px;color:var(--muted)}
.chip{display:inline-flex;align-items:center;justify-content:center;min-width:22px;height:22px;border-radius:4px;font:600 12px var(--sans)}
.chip.ok{background:var(--ok-bg);color:var(--ok)} .chip.bad{background:var(--bad-bg);color:var(--bad)} .chip.cut{background:var(--cut-bg);color:var(--cut)}
.overview{overflow-x:auto;background:var(--panel);border:1px solid var(--rule);border-radius:8px}
table{border-collapse:collapse;width:100%;font-size:13px}
th,td{padding:6px 8px;text-align:center;white-space:nowrap}
thead th{font:600 11px var(--sans);letter-spacing:.05em;text-transform:uppercase;color:var(--muted);border-bottom:1px solid var(--rule)}
tbody tr+tr td{border-top:1px solid var(--soft)}
td.p{text-align:left} td.p a{color:var(--ink);text-decoration:none;font:600 13px var(--mono)} td.p a:hover{text-decoration:underline}
th.group{border-left:1px solid var(--rule)} td.first{border-left:1px solid var(--rule)}
td a.chip{text-decoration:none}
.problem{display:flex;flex-direction:column;gap:16px;scroll-margin-top:64px}
.phead{display:flex;flex-wrap:wrap;align-items:baseline;gap:6px 14px}
.prompt{background:var(--panel);border:1px solid var(--rule);border-radius:8px;padding:14px 16px;display:flex;flex-direction:column;gap:10px}
.role{font:600 11px var(--sans);letter-spacing:.06em;text-transform:uppercase;color:var(--accent)}
.prose{white-space:pre-wrap;overflow-wrap:anywhere}
.budget{display:flex;flex-direction:column;gap:8px}
.budget h3{display:flex;gap:10px;align-items:baseline}
.pair{display:grid;grid-template-columns:repeat(var(--cols),minmax(0,1fr));gap:12px}
.chain{background:var(--panel);border:1px solid var(--rule);border-radius:8px;padding:12px 14px;display:flex;flex-direction:column;gap:10px;min-width:0;scroll-margin-top:64px}
.chain.target{outline:2px solid var(--accent)}
.chead{display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center}
.chead .model{font:600 14px var(--sans)}
.output{border-radius:6px;padding:9px 11px;display:flex;flex-direction:column;gap:4px}
.output.ok{background:var(--ok-bg)} .output.bad{background:var(--bad-bg)} .output.cut{background:var(--cut-bg)}
.output .k{font:600 11px var(--sans);letter-spacing:.06em;text-transform:uppercase}
.output.ok .k{color:var(--ok)} .output.bad .k{color:var(--bad)} .output.cut .k{color:var(--cut)}
.stated{font-size:14px;overflow-wrap:anywhere}
details.reason>summary{cursor:pointer;color:var(--accent);font-size:13px;list-style:none}
details.reason>summary::-webkit-details-marker{display:none}
details.reason>summary::before{content:"▸ ";font-family:var(--mono)}
details.reason[open]>summary::before{content:"▾ "}
.trace{margin-top:8px;max-height:520px;overflow:auto;background:var(--soft);border-radius:6px;padding:10px 12px;font-size:13.5px;line-height:1.6;white-space:pre-wrap;overflow-wrap:anywhere}
.trace.raw{font:12.5px/1.55 var(--mono)}
.cutmark{display:block;margin-top:8px;color:var(--cut);font:600 12px var(--sans)}
.nav{display:flex;flex-wrap:wrap;gap:6px}
.nav a{font:12px var(--mono);color:var(--muted);text-decoration:none;border:1px solid var(--rule);border-radius:999px;padding:3px 9px;background:var(--panel)}
.nav a:hover{color:var(--ink)}
hr{border:0;border-top:1px solid var(--rule);margin:8px 0}
@media (max-width:760px){.pair{grid-template-columns:1fr}}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
</style>
</head>
<body>
<div class="wrap">
  <header style="display:flex;flex-direction:column;gap:10px">
    <p class="eyebrow">Page 6 · Thinking longer · every chain</p>
    <h1>Page 6 chains</h1>
    <p class="muted" style="max-width:72ch">Each problem below was given to each model at every token budget. A model that reaches its budget simply stops, and a chain cut off before writing a boxed answer counts as wrong. For each chain: the reasoning trace (which can be hidden), then the output.</p>
    <div class="meta" id="meta"></div>
  </header>

  <div class="bar">
    <button type="button" id="hide-all" aria-pressed="false">Hide all reasoning</button>
    <button type="button" id="raw" aria-pressed="false">Show maths as raw LaTeX</button>
    <span class="legend"><span><span class="chip ok">✓</span> correct</span><span><span class="chip bad">✗</span> finished, wrong</span><span><span class="chip cut">✂</span> cut off by the budget</span></span>
  </div>

  <section style="display:flex;flex-direction:column;gap:10px">
    <h2>Overview</h2>
    <p class="muted">Select a mark to jump to that chain.</p>
    <div class="overview"><table id="overview"></table></div>
  </section>

  <main id="problems" style="display:flex;flex-direction:column;gap:40px"></main>
</div>

<script type="application/json" id="data">__DATA__</script>
<script>
const {meta, problems} = JSON.parse(document.getElementById("data").textContent);
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const kind = c => c.cut ? "cut" : c.correct ? "ok" : "bad";
const mark = c => c.cut ? "✂" : c.correct ? "✓" : "✗";
const anchor = (i, c) => `p${i + 1}-${c.model}-${c.budget}`.replace(/\./g, "_");

document.getElementById("meta").innerHTML = [
  ["run", meta.run_id], ["models", meta.models.join(", ")], ["budgets", meta.budgets.join(", ")],
  ["problems", meta.n_problems], ["decoding", meta.decoding], ["gpu", meta.gpu], ["made", meta.timestamp]
].filter(([, v]) => v != null).map(([k, v]) => `<span>${k} <b>${esc(v)}</b></span>`).join("");

// overview grid
const ov = document.getElementById("overview");
ov.innerHTML = `<thead><tr><th></th>${meta.models.map(m => `<th class="group" colspan="${meta.budgets.length}">${esc(m)}</th>`).join("")}</tr>
<tr><th style="text-align:left">problem</th>${meta.models.map(() => meta.budgets.map((b, j) => `<th class="${j === 0 ? "group" : ""}">${b}</th>`).join("")).join("")}</tr></thead>
<tbody>${problems.map((p, i) => `<tr><td class="p"><a href="#p${i + 1}">${i + 1}. ${esc(p.label)}</a></td>${
  meta.models.map(m => meta.budgets.map((b, j) => {
    const c = p.chains.find(x => x.model === m && x.budget === b);
    return `<td class="${j === 0 ? "first" : ""}">${c ? `<a class="chip ${kind(c)}" href="#${anchor(i, c)}" title="${esc(m)} at ${b} tokens">${mark(c)}</a>` : "·"}</td>`;
  }).join("")).join("")}</tr>`).join("")}</tbody>
<tfoot><tr><td class="p muted">solved</td>${meta.models.map(m => meta.budgets.map((b, j) =>
  `<td class="${j === 0 ? "first" : ""} muted">${problems.filter(p => (p.chains.find(x => x.model === m && x.budget === b) || {}).correct).length}</td>`).join("")).join("")}</tr></tfoot>`;

// problems
const main = document.getElementById("problems");
const nav = `<nav class="nav" aria-label="Problems">${problems.map((p, i) => `<a href="#p${i + 1}">${i + 1}</a>`).join("")}</nav>`;
main.innerHTML = problems.map((p, i) => `
<section class="problem" id="p${i + 1}">
  <div class="phead"><h2>${i + 1}. ${esc(p.label)}</h2><span class="eyebrow">level ${p.level} · ${esc(p.subject)}</span>
    <span class="eyebrow">reference answer <span class="mono" style="text-transform:none">${esc(p.reference)}</span></span></div>
  <div class="prompt">
    ${p.system ? `<div><p class="role">System message</p><p class="prose">${esc(p.system)}</p></div>` : ""}
    <div><p class="role">User message (the prompt)</p><div class="prose tex">${esc(p.user)}</div></div>
    ${p.raw ? `<details class="reason"><summary>Exactly as sent, with the chat markup</summary><pre class="trace raw">${esc(p.raw)}</pre></details>` : ""}
  </div>
  ${meta.budgets.map(b => {
    const cs = p.chains.filter(c => c.budget === b);
    return `<div class="budget"><h3>${b} tokens <span class="muted" style="font:13px var(--sans)">budget</span></h3>
      <div class="pair" style="--cols:${meta.models.length}">${cs.map(c => chainHTML(i, c)).join("")}</div></div>`;
  }).join("")}
  ${nav}
</section>`).join("<hr>");

function chainHTML(i, c) {
  const out = c.cut
    ? `<div class="output cut"><span class="k">✂ No answer: cut off at ${c.budget} tokens</span>
         <span class="muted" style="font-size:13px">Where it stopped:</span><span class="stated tex">${esc(c.tail)}</span></div>`
    : `<div class="output ${kind(c)}"><span class="k">${c.correct ? "✓ Correct" : "✗ Wrong"}: answered <span class="mono" style="text-transform:none">${esc(c.answer || "nothing")}</span></span>
         ${c.stated ? `<span class="stated tex">${esc(c.stated)}</span>` : ""}</div>`;
  return `<article class="chain" id="${anchor(i, c)}">
    <div class="chead"><span class="model">${esc(c.model)}</span><span class="chip ${kind(c)}">${mark(c)}</span>
      <span class="muted" style="font-size:13px">wrote ${c.wrote} of ${c.budget} tokens · ${c.cut ? "cut off" : "finished"}</span>
      ${c.same_as ? `<span class="muted" style="font-size:12px">(same chain as at ${c.same_as})</span>` : ""}</div>
    <details class="reason" open><summary>Reasoning trace</summary>
      <div class="trace tex">${esc(c.trace)}${c.cut ? `<span class="cutmark">✂ out of tokens</span>` : ""}</div></details>
    ${out}
  </article>`;
}

// controls
const hideBtn = document.getElementById("hide-all");
hideBtn.addEventListener("click", () => {
  const hide = hideBtn.getAttribute("aria-pressed") !== "true";
  hideBtn.setAttribute("aria-pressed", String(hide));
  hideBtn.textContent = hide ? "Show all reasoning" : "Hide all reasoning";
  document.querySelectorAll(".chain details.reason").forEach(d => { d.open = !hide; });
});
const rawBtn = document.getElementById("raw");
const texSources = new Map();
document.querySelectorAll(".tex").forEach(el => texSources.set(el, el.innerHTML));
rawBtn.addEventListener("click", () => {
  const raw = rawBtn.getAttribute("aria-pressed") !== "true";
  rawBtn.setAttribute("aria-pressed", String(raw));
  texSources.forEach((html, el) => { el.innerHTML = html; el.classList.toggle("raw", raw); });
  if (!raw) typesetAll();
});
window.typesetAll = function () {
  if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([...texSources.keys()]).catch(() => {});
};
const typesetAll = window.typesetAll;
// highlight the chain a link points at
function markTarget() {
  document.querySelectorAll(".chain.target").forEach(e => e.classList.remove("target"));
  const el = location.hash && document.getElementById(location.hash.slice(1));
  if (el && el.classList.contains("chain")) el.classList.add("target");
}
addEventListener("hashchange", markTarget); markTarget();
// MathJax loads asynchronously and typesets in its pageReady hook; if it was already
// ready before this script ran, typeset now.
if (window.MathJax && MathJax.typesetPromise) typesetAll();
</script>
</body>
</html>
"""

if __name__ == "__main__":
    main()
