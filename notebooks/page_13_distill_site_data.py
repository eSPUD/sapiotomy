"""Build web/data/page-13-distill.json from the distillation notebook's saved outputs.

The notebook (page_13_distill_1p5b_to_0p5b.ipynb) ran on Colab and kept its results on
Google Drive; every number the page plots is also in the notebook's own outputs, so this
script reads them from there:

  - the five models' readings, from the results table;
  - the rows each student was fine-tuned on, from the traces cell;
  - the test size and its standard error, from the results cell's closing line.

Usage: python3 page_13_distill_site_data.py <notebook.ipynb> <out.json>
"""
import hashlib
import html
import json
import re
import sys

ROWS = {
    "0.5B student, before": "none",
    "0.5B student from untrained 1.5B": "base15",
    "0.5B student from GRPO 1.5B": "grpo15",
    "1.5B teacher, untrained": "teacher_before",
    "1.5B teacher, GRPO": "teacher_after",
}


def find_cell(cells, needle):
    hits = [c for c in cells if c["cell_type"] == "code" and needle in "".join(c["source"])]
    assert len(hits) == 1, f"expected one code cell containing {needle!r}, found {len(hits)}"
    return hits[0]


def stream(cell):
    return "".join("".join(o.get("text", "")) for o in cell.get("outputs", []) if o.get("output_type") == "stream")


def table_rows(markup):
    """The table's body as {row label: [cell, ...]}, tags stripped."""
    rows = {}
    for tr in re.findall(r"<tr>(.*?)</tr>", markup, re.S):
        cells = [html.unescape(c).strip() for c in re.findall(r"<t[hd][^>]*>(.*?)</t[hd]>", tr, re.S)]
        if cells and cells[0] in ROWS:
            rows[cells[0]] = cells[1:]
    return rows


def main(nb_path, out_path):
    raw = open(nb_path, "rb").read()
    cells = json.loads(raw)["cells"]

    results = find_cell(cells, "MODELS = [  # tag, label, size, colour")
    markup = next("".join(o["data"]["text/html"]) for o in results["outputs"] if "text/html" in o.get("data", {}))
    assert "majority of 32" in markup and "any of 32 right" in markup, "results table has changed shape"
    rows = table_rows(markup)
    assert set(rows) == set(ROWS), f"expected the five models, got {sorted(rows)}"

    def reading(cells_):
        one, maj, any_k, length = cells_
        return {
            "pass1": round(float(one.rstrip("%")) / 100, 4),
            "maj32": round(float(maj.rstrip("%")) / 100, 4),
            "any32": round(float(any_k.rstrip("%")) / 100, 4),
            "mean_len": int(length),
        }

    read = {ROWS[label]: reading(c) for label, c in rows.items()}

    traces = stream(find_cell(cells, "def write_traces(name):"))
    kept = dict(re.findall(r"(untrained|trained) teacher: .*?\| (\d+) rows kept", traces))
    assert set(kept) == {"untrained", "trained"}, f"rows kept not found: {kept}"

    se_points, n_eval = re.search(r"about ([\d.]+)% at n=(\d+)\)", stream(results)).groups()
    n_eval = int(n_eval)

    out = {
        "source": {"notebook": "page_13_distill_1p5b_to_0p5b.ipynb", "sha256": hashlib.sha256(raw).hexdigest()},
        "student": "Qwen/Qwen2.5-0.5B-Instruct",
        "teacher": "Qwen/Qwen2.5-1.5B-Instruct",
        "dataset": "GSM8K",
        "n_eval": n_eval,
        "se_points": float(se_points),
        "teacher_before": read["teacher_before"],
        "teacher_after": read["teacher_after"],
        "arms": {
            "none": {**read["none"], "rows": 0},
            "base15": {**read["base15"], "rows": int(kept["untrained"])},
            "grpo15": {**read["grpo15"], "rows": int(kept["trained"])},
        },
    }
    json.dump(out, open(out_path, "w"), indent=1)
    print(f"wrote {out_path}: n={n_eval}, rows {kept}")


if __name__ == "__main__":
    main(*sys.argv[1:3])
