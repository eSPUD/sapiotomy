"""Lift pages 18 and 19's three trace specimens out of page 11's shipped bundle.

    python3 notebooks/extract_trace_specimens.py     # from the repo root

Writes `web/data/trace-specimens.json`. This is the only way that file should be
produced: hand-typing a chain into it would satisfy `src/lib/specimens.ts`, which
can only check a quote against the trace sitting beside it, and the deck would be
showing a model saying something no model said. `src/lib/specimens.test.ts` is the
backstop, and it opens this same zip.

Nothing here computes a claim. Every field is copied from the trace record, and
`line_sha256` pins the exact `traces.jsonl` line so the test can prove the copy is
faithful. Rerun it after re-bundling page 11, and commit the result.
"""
import hashlib, json, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
ZIP = "web/public/notebooks/page-11-training-vs-scale.zip"
MEMBER = "page-11-training-vs-scale/out/page_11/traces.jsonl"

# role -> (problem_id, excerpt start marker, excerpt end marker, highlights)
WANTED = {
    "fabricated_tool": (
        "test/intermediate_algebra/956.json",
        "To find \\(a, b, c, d, e, f\\)",
        "e = 0, \\quad f = 1\n\\]",
        ["we use known results or computational tools to find"],
    ),
    "contradicts_chain_sum": (
        "test/intermediate_algebra/102.json",
        "Notice that all terms except",
        "= 1 + 1 = 2.\n\\]",
        ["1 + 1 = 2"],
    ),
    # Starts at the substitution rather than at the setup above it: the setup
    # carries `\overline{GH}`, and `tidyMath` leaves an unknown macro exactly as
    # the model wrote it (that is its contract), so the card would print a raw
    # backslash. The computation is self-contained without it.
    "contradicts_chain_geometry": (
        "test/precalculus/1133.json",
        "Substituting this into the equation, we get:",
        "= \\frac{15R^2}{4}.\n\\]",
        ["\\frac{15R^2}{4}"],
    ),
}

PAGE_OF = {"fabricated_tool": 19, "contradicts_chain_sum": 18,
           "contradicts_chain_geometry": 18}

raw = subprocess.run(["unzip", "-p", ZIP, MEMBER], capture_output=True, check=True).stdout
manifest = json.loads(subprocess.run(
    ["unzip", "-p", ZIP, "page-11-training-vs-scale/out/page_11/manifest.json"],
    capture_output=True, check=True).stdout)

by_id = {}
for line in raw.split(b"\n"):
    if not line.strip():
        continue
    rec = json.loads(line)
    if (rec["model_id"].endswith("Math-1.5B-Instruct")
            and rec["config_id"].startswith("t0.00") and rec["band"] == "hard"):
        by_id[rec["problem_id"]] = (rec, hashlib.sha256(line).hexdigest())

specimens = {}
for role, (pid, start, end, highlights) in WANTED.items():
    rec, digest = by_id[pid]
    trace = rec["trace"]
    i = trace.index(start)
    j = trace.index(end, i) + len(end)
    excerpt = trace[i:j]
    for h in highlights:
        assert h in excerpt, f"{role}: highlight not in excerpt: {h!r}"
    specimens[role] = {
        "role": role,
        "page": PAGE_OF[role],
        "problem_id": rec["problem_id"],
        "subject": rec["subject"],
        "level": rec["level"],
        "question": rec["question"],
        "ground_truth": rec["ground_truth"],
        "extracted_answer": rec["extracted_answer"],
        "correct": rec["correct"],
        "tokens_generated": rec["tokens_generated"],
        "truncated": rec["truncated"],
        "trace": trace,
        "excerpt": excerpt,
        "highlights": highlights,
        "line_sha256": digest,
    }

out = {
    "source": {
        "bundle": ZIP,
        "member": MEMBER,
        "run_id": manifest["run_id"],
        "notebook": manifest["notebook"],
        "notebook_sha256": manifest["notebook_sha256"],
        "model_id": manifest["specialist"]["model"],
        "system_prompt": manifest["specialist"]["system_prompt"],
        "band": "hard",
        "items": "MATH-500 levels 4 and 5; pages 6 to 8's own 100 items",
        "decoding": {"temperature": 0.0, "top_p": None,
                     "chain_budget": manifest["decoding"]["chain_cap"]},
        "grading": manifest["grading"],
        "line_sha256_rule": "sha256 of the exact traces.jsonl line, no trailing newline",
        "note": ("Copied, not measured. These are three chains out of the 2,550 the "
                 "specialist wrote in page 11's run, chosen for what they show and not "
                 "for what they average. No number on either page is derived from them."),
    },
    "specimens": specimens,
}

dest = Path("web/data/trace-specimens.json")
dest.write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n")
print("wrote", dest, dest.stat().st_size, "bytes")
for role, s in specimens.items():
    print(f"  {role:<28} p{s['page']} {s['problem_id']:<38} gt={s['ground_truth']!r} got={s['extracted_answer']!r}")
