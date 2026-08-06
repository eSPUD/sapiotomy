"""Shared plumbing for the page notebooks.

What lives here, and what deliberately does not
-----------------------------------------------
Here: things identical across pages that are not themselves a claim — model
loading, token-string reconstruction, the resume log, provenance hashes, small
numerics. They have invariants rather than interpretations, and this file tests
its own (`selftest`).

Not here: anything a skeptical reader must SEE to believe a figure. Prompt
construction, item selection, the thinking constraint, thresholds and gates, and
all figure code stay in the notebook that publishes them.

Where a rule is shared but its settings are a claim, the rule lives here and the
setting has no default, so every call site states it in the notebook where a
reader looks: `generate` takes `enable_thinking`, `complete` takes `stop`, and
the step functions take `min_step_chars`. Segmentation moved here after five
notebooks had grown three variants of it between them, which is the same failure
`incremental_token_strings` was consolidated to stop.

This file ships in the same download as the notebooks. Each run records
`fingerprint()` in its manifest, so the artifact names the plumbing that made it.
"""

from __future__ import annotations

import hashlib
import json
import re
import subprocess
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import torch
from huggingface_hub import snapshot_download
from huggingface_hub.constants import HF_HUB_CACHE
from huggingface_hub.errors import LocalEntryNotFoundError
from huggingface_hub.utils import (
    are_progress_bars_disabled,
    disable_progress_bars,
    enable_progress_bars,
)
from tqdm.auto import tqdm
from transformers import AutoModelForCausalLM, AutoTokenizer

__version__ = "1.3"

_HERE = Path(__file__).resolve()


def fingerprint():
    """(version, sha256) of this file, for the manifest."""
    return {"version": __version__, "sha256": hashlib.sha256(_HERE.read_bytes()).hexdigest()}


# --------------------------------------------------------------------------
# numerics
# --------------------------------------------------------------------------

def mean(xs):
    xs = list(xs)
    return sum(xs) / max(len(xs), 1)


def median(xs):
    xs = sorted(xs)
    return xs[len(xs) // 2] if xs else 0


def wilson(k, n, z=1.96):
    """95% interval for a proportion. Wilson, not normal-approximation: these
    counts sit near 0 and 1, where the normal interval runs off the end of the
    scale and claims resolution that is not there."""
    if n == 0:
        return (0.0, 0.0)
    p = k / n
    d = 1 + z * z / n
    centre = (p + z * z / (2 * n)) / d
    half = z * ((p * (1 - p) / n + z * z / (4 * n * n)) ** 0.5) / d
    return (max(0.0, centre - half), min(1.0, centre + half))


# --------------------------------------------------------------------------
# hashing and provenance
# --------------------------------------------------------------------------

def sha256_of(strings):
    h = hashlib.sha256()
    for s in strings:
        h.update(s.encode("utf-8"))
        h.update(b"\x00")
    return h.hexdigest()


def file_sha256(path):
    path = Path(path)
    return hashlib.sha256(path.read_bytes()).hexdigest() if path.exists() else None


def git_sha():
    try:
        return subprocess.run(["git", "rev-parse", "HEAD"], capture_output=True,
                              text=True, check=True).stdout.strip()
    except Exception:
        return None


def repo_revision(model_id):
    """The exact weights a run used. None means the run is not pinned."""
    try:
        from huggingface_hub import model_info
        return model_info(model_id).sha
    except Exception as e:
        print(f"WARNING: could not resolve the repo revision for {model_id} ({e}). "
              f"The manifest will say null and the run is not pinned to specific "
              f"weights. Re-run this cell online.")
        return None


def tokenizer_fingerprint(tok):
    try:
        return hashlib.sha256(tok.backend_tokenizer.to_str().encode()).hexdigest()
    except Exception:
        return None


def kb(path):
    return Path(path).stat().st_size / 1024


# --------------------------------------------------------------------------
# fetching weights
# --------------------------------------------------------------------------

def repo_bytes(model_id):
    """(total bytes, file count) a snapshot download will put on disk, from the Hub's
    own file metadata. (None, None) if the Hub cannot be reached, in which case the
    bar below runs without a denominator rather than the fetch failing."""
    try:
        from huggingface_hub import model_info
        siblings = model_info(model_id, files_metadata=True).siblings
        return sum(s.size or 0 for s in siblings), len(siblings)
    except Exception:
        return None, None


def cached_bytes(model_id):
    """Bytes of this repo already on disk.

    Only the blob directory: those are the real files, the snapshot directory beside
    it is symlinks to them, and the rest of the tree is bookkeeping whose bytes are
    not part of what the Hub said it would send. A partial download's `.incomplete`
    blob is in there and counts, so a fetch resumed after an interruption starts its
    bar with the bytes it already has rather than at zero. An interrupted fetch can
    also leave an orphan blob that no revision claims, which is why the caller caps
    this against the size the Hub reports.
    """
    d = Path(HF_HUB_CACHE) / f"models--{model_id.replace('/', '--')}" / "blobs"
    if not d.exists():
        return 0
    return sum(p.stat().st_size for p in d.iterdir() if p.is_file() and not p.is_symlink())


def fetch(model_id):
    """Download a checkpoint behind one bar that reads downloaded against total.

    The Hub's own reporting is turned off for the duration, and that is not cosmetic.
    It draws *two* byte bars — network transfer, which Xet's deduplication makes so
    unpredictable that it ships with no denominator at all, and bytes reconstructed
    onto disk — and it updates them from the downloader's worker threads. In a
    notebook that is a fault: ipykernel hands every thread that writes to stdout its
    own ZMQ socket, and a multi-gigabyte fetch opens enough of them to exhaust the
    process's file descriptors, at which point the download dies with `Too many open
    files` partway through.

    So: one bar, updated from this thread only, against the total the Hub reports.
    Progress is read from the cache directory rather than from the downloader, which
    keeps this independent of how any hub version reports itself.
    """
    total, n_files = repo_bytes(model_id)
    have = cached_bytes(model_id)
    if total:
        print(f"      {total / 1e9:.2f} GB across {n_files} files"
              + (f", {have / 1e9:.2f} GB already on disk" if have else ""))

    bars_were_off = are_progress_bars_disabled()
    disable_progress_bars()
    # smoothing=0 asks tqdm for the average rate rather than the most recent one.
    # Xet reconstructs in bursts, so a poll either sees nothing arrive or sees tens of
    # megabytes land at once, and the instantaneous rate reads an order of magnitude
    # over the real one. The average is the number that predicts when this finishes.
    bar = tqdm(total=total, initial=have, unit="B", unit_scale=True, unit_divisor=1000,
               desc="      downloading", smoothing=0)
    # Never overshoot the denominator: tqdm drops it silently once n passes total, so
    # one blob left behind by an earlier revision would turn the bar back into the
    # bytes-only readout this function exists to replace.
    def on_disk():
        n = cached_bytes(model_id)
        return min(n, total) if total else n

    try:
        with ThreadPoolExecutor(max_workers=1) as pool:
            job = pool.submit(snapshot_download, model_id)
            while not job.done():
                time.sleep(0.4)
                bar.update(max(0, on_disk() - bar.n))
            local_path = job.result()          # re-raises whatever the download hit
        bar.update(max(0, (total or on_disk()) - bar.n))
    finally:
        bar.close()
        if not bars_were_off:
            enable_progress_bars()
    return local_path


# --------------------------------------------------------------------------
# model loading
# --------------------------------------------------------------------------

def pick_dtype(device):
    """bf16 on an accelerator keeps quantisation out of the numbers; fp32 on CPU,
    where bf16 is slow and patchily supported."""
    return torch.float32 if device.type == "cpu" else torch.bfloat16


def load_model(model_id, *, device, dtype, load_in_4bit=False, load_in_8bit=False,
               warmup_tokens=8):
    """Fetch, load, move, warm up — each stage timed and announced.

    One `from_pretrained` call would spend minutes downloading, minutes loading and
    seconds moving, all behind the same silent cell, so a long wait could not be
    attributed to anything. Four named stages make it attributable, and the fetch
    stage is the one worth watching: it is gigabytes and it is the only one that
    depends on the network.
    """
    stages = {}

    print(f"[1/4] fetch      {model_id}")
    t0 = time.time()
    try:
        # Ask the cache first: a hit means no network at all, and no progress bar for
        # a download that never happened.
        local_path = snapshot_download(model_id, local_files_only=True)
        note = f"already cached, {cached_bytes(model_id) / 1e9:.2f} GB on disk"
    except LocalEntryNotFoundError:
        before = cached_bytes(model_id)
        local_path = fetch(model_id)
        note = f"fetched {(cached_bytes(model_id) - before) / 1e9:.2f} GB"
    stages["fetch"] = time.time() - t0
    print(f"      {stages['fetch']:>6.1f}s  ({note})")

    print("[2/4] load       tokenizer and weights")
    t0 = time.time()
    tok = AutoTokenizer.from_pretrained(local_path)
    assert not (load_in_4bit and load_in_8bit), "pick one quantisation, not both"
    kwargs = {}
    if load_in_4bit or load_in_8bit:
        from transformers import BitsAndBytesConfig       # pip install bitsandbytes
        kwargs["quantization_config"] = (
            BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_compute_dtype=torch.bfloat16)
            if load_in_4bit else BitsAndBytesConfig(load_in_8bit=True))
        mdl = AutoModelForCausalLM.from_pretrained(local_path, **kwargs).eval()
    else:
        mdl = AutoModelForCausalLM.from_pretrained(local_path, dtype=dtype, **kwargs)
    stages["load"] = time.time() - t0
    print(f"      {stages['load']:>6.1f}s")

    # `dtype=` is the transformers >= 4.56 spelling (`torch_dtype` before). On an
    # older version the kwarg is swallowed into the config and the model loads fp32
    # without complaint, which OOMs a 16 GB card at 4B and would leave the manifest
    # asserting bf16 for a run that never used it. Check what we got.
    got = next(mdl.parameters()).dtype
    if not (load_in_4bit or load_in_8bit) and got != dtype:
        raise RuntimeError(
            f"asked for {dtype} but the weights loaded as {got}. Almost certainly a "
            f"transformers older than 4.56, where the kwarg is `torch_dtype`. Upgrade "
            f"rather than editing this, or the manifest will misreport the run.")

    print(f"[3/4] move       to {device}")
    t0 = time.time()
    if not (load_in_4bit or load_in_8bit):
        mdl = mdl.to(device)
    mdl = mdl.eval()
    stages["move"] = time.time() - t0
    print(f"      {stages['move']:>6.1f}s")

    # A short generation absorbs one-off kernel compilation and cache allocation
    # that would otherwise be charged to the first real item, and measures a
    # tokens-per-second figure on THIS machine.
    print(f"[4/4] warm up    {warmup_tokens} tokens")
    t0 = time.time()
    with torch.inference_mode():
        mdl.generate(**tok("Hello", return_tensors="pt").to(device),
                     max_new_tokens=warmup_tokens, do_sample=False,
                     pad_token_id=tok.pad_token_id if tok.pad_token_id is not None
                     else tok.eos_token_id)
    stages["warmup"] = time.time() - t0
    tok_per_s = warmup_tokens / max(stages["warmup"], 1e-6)
    print(f"      {stages['warmup']:>6.1f}s  ~{tok_per_s:.1f} tokens/s")

    n_params = sum(p.numel() for p in mdl.parameters())
    print(f"\nready: {model_id}  {n_params/1e9:.2f}B params  {got}  on {device}")

    return {"model": mdl, "tokenizer": tok, "path": local_path, "params": n_params,
            "dtype": got, "tok_per_s": tok_per_s, "stages": stages}


def free_memory():
    """Collect and release cached device memory between sweeps.

    Takes nothing on purpose. `del` on a function's own parameter frees nothing,
    because the caller still holds the reference — so the caller must `del` its
    model and then call this.
    """
    import gc
    gc.collect()
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
    mps = getattr(torch.backends, "mps", None)
    if mps is not None and mps.is_available():
        torch.mps.empty_cache()


# --------------------------------------------------------------------------
# tokens
# --------------------------------------------------------------------------

def end_of_turn_ids(tok):
    """Ids that mean "the model stopped", which are not content it wrote and must
    not be counted as generated tokens."""
    def _id_of(t):
        i = tok.convert_tokens_to_ids(t)
        return i if isinstance(i, int) and i >= 0 and tok.convert_ids_to_tokens(i) == t else None

    return {i for i in (tok.eos_token_id, _id_of("<|im_end|>"), _id_of("<|endoftext|>"))
            if i is not None}


def incremental_token_strings(ids, tok):
    '''One string per token, such that "".join(pieces) == tok.decode(ids).

    The tokenizer is byte-level, so one character (a square root, an approximately
    sign) can span two tokens. Decoding the growing prefix is not enough on its
    own: a prefix ending mid-character decodes with a trailing U+FFFD that the
    NEXT token resolves, so it is not a prefix of the next decode and slicing by
    length silently drops the character. That corrupts the text that then gets
    graded, so it is worth the care.

    A token that leaves a character incomplete emits nothing, and the character
    lands whole on the token that completes it. Pages animate these strings, so an
    empty piece is one frame with no visible change — honest, because that token
    produced no complete character.

    This is quadratic in decodes, which measures ~60ms on a 1024-token trace
    against many seconds of generation. Simplicity wins; the invariant is provable
    and `selftest` proves it.
    '''
    text = tok.decode(ids, skip_special_tokens=True)
    pieces, prev = [], ""
    for k in range(1, len(ids) + 1):
        cur = tok.decode(ids[:k], skip_special_tokens=True)
        if cur.endswith("�"):        # mid-character; wait for the next token
            pieces.append("")
            continue
        pieces.append(cur[len(prev):])
        prev = cur
    if pieces and prev != text:           # generation stopped mid-character
        pieces[-1] += text[len(prev):]
    assert "".join(pieces) == text, "token strings do not reconstruct the decoded text"
    assert len(pieces) == len(ids), "one piece per token"
    return pieces


@torch.inference_mode()
def complete(prompt_text, model, tok, *, stop, max_new_tokens, eos_ids=None):
    """One greedy completion of raw text, with no chat template applied.

    For base checkpoints, which have no end-of-turn behaviour to rely on: the model
    answers and then keeps writing, usually by inventing the next question. `stop`
    therefore decides where the answer ends, which makes it a claim rather than a
    convenience, so it has no default and the notebook names its stop strings at the
    call site. Generation halts at the first one rather than running to the cap and
    being trimmed afterwards, which would cost several times the compute.

    `truncated` means the cap bound: no stop string and no end-of-turn token.
    """
    eos_ids = end_of_turn_ids(tok) if eos_ids is None else eos_ids
    enc = tok(prompt_text, return_tensors="pt", add_special_tokens=False).to(model.device)

    out = model.generate(
        **enc, max_new_tokens=max_new_tokens,
        do_sample=False, temperature=None, top_p=None, top_k=None,
        stop_strings=list(stop), tokenizer=tok,
        pad_token_id=tok.pad_token_id if tok.pad_token_id is not None else tok.eos_token_id)

    new_ids = out[0][enc["input_ids"].shape[1]:].tolist()
    hit_cap = len(new_ids) >= max_new_tokens
    stopped_on_eos = bool(new_ids) and new_ids[-1] in eos_ids
    while new_ids and new_ids[-1] in eos_ids:
        new_ids.pop()

    text = tok.decode(new_ids, skip_special_tokens=True)
    pieces = incremental_token_strings(new_ids, tok)

    # The stop string is in the output, since generation halts just after emitting it.
    # Cut the text there and drop whole tokens past the cut, so the token strings still
    # join back to the text the page animates and grades.
    cut = min([i for i in (text.find(s) for s in stop) if i != -1], default=-1)
    stopped_on_stop = cut != -1
    if stopped_on_stop:
        keep, run = 0, 0
        for p in pieces:
            if run + len(p) > cut:
                break
            run += len(p)
            keep += 1
        pieces, text = pieces[:keep], "".join(pieces[:keep])

    return {"text": text,
            "tokens": pieces,
            "tokens_generated": len(pieces),
            "truncated": hit_cap and not stopped_on_stop and not stopped_on_eos,
            "stopped_on_eos": stopped_on_eos,
            "stopped_on_stop": stopped_on_stop,
            "thinking_leaked": "<think>" in text}


@torch.inference_mode()
def generate(prompt_text, model, tok, *, enable_thinking, max_new_tokens, eos_ids=None):
    """One greedy completion. `enable_thinking` has no default on purpose — it is a
    claim about the run, so the notebook states it at the call site."""
    eos_ids = end_of_turn_ids(tok) if eos_ids is None else eos_ids

    chat = tok.apply_chat_template(
        [{"role": "user", "content": prompt_text}],
        tokenize=False, add_generation_prompt=True, enable_thinking=enable_thinking)
    # add_special_tokens=False: the template already carries its special tokens as
    # text, and letting the tokenizer add more prepends a second start marker.
    enc = tok(chat, return_tensors="pt", add_special_tokens=False).to(model.device)

    # Qwen3 ships sampling defaults in generation_config, so do_sample=False alone
    # is not enough — the sampling parameters have to be cleared too, or the
    # manifest records a setup that was never configured.
    out = model.generate(
        **enc, max_new_tokens=max_new_tokens,
        do_sample=False, temperature=None, top_p=None, top_k=None,
        pad_token_id=tok.pad_token_id if tok.pad_token_id is not None else tok.eos_token_id)

    new_ids = out[0][enc["input_ids"].shape[1]:].tolist()

    # Decided BEFORE stripping, on the raw count: generate returns fewer than the
    # cap only if the model stopped on its own.
    truncated = len(new_ids) >= max_new_tokens
    stopped_on_eos = bool(new_ids) and new_ids[-1] in eos_ids
    while new_ids and new_ids[-1] in eos_ids:
        new_ids.pop()

    text = tok.decode(new_ids, skip_special_tokens=True)
    return {"text": text,
            "tokens": incremental_token_strings(new_ids, tok),
            "tokens_generated": len(new_ids),
            "truncated": truncated,
            "stopped_on_eos": stopped_on_eos,
            "thinking_leaked": "<think>" in text}


# --------------------------------------------------------------------------
# progress a notebook can survive
# --------------------------------------------------------------------------

def _bar():
    """(class, kwargs) for a progress bar that will not take the editor down.

    tqdm's defaults redraw up to ten times a second and leave every finished bar on
    screen. A terminal collapses those redraws in place; a notebook renderer retains
    each one as its own output event. A sweep of fifteen bars over a hundred items
    therefore becomes tens of thousands of retained strings and several gigabytes in
    the editor process while the kernel sits idle at two -- which looks exactly like a
    memory leak in the run and is not. It took VS Code down twice during page 6.

    So: the widget bar when ipywidgets is importable inside a kernel, one DOM node that
    updates in place. Otherwise a text bar that redraws at most every two seconds and
    removes itself when finished, which keeps a headless log readable too.
    """
    try:
        from IPython import get_ipython
        ip = get_ipython()
        in_kernel = ip is not None and "zmqshell" in type(ip).__module__.lower()
    except Exception:
        in_kernel = False

    if in_kernel:
        try:
            import ipywidgets                      # noqa: F401  -- presence is the test
            from tqdm.notebook import tqdm as widget_tqdm
            return widget_tqdm, {}
        except Exception:
            # In a kernel with no widgets: the dangerous case, so throttle hardest.
            return tqdm, {"mininterval": 2.0, "leave": False}

    import sys
    return tqdm, {"mininterval": 2.0, "leave": sys.stderr.isatty()}


def progress(iterable=None, *, desc="", unit="item", total=None):
    """Wrap an iterable in a bar chosen by `_bar`. Use this rather than tqdm directly:
    the defaults are the whole point."""
    cls, kw = _bar()
    return cls(iterable, desc=desc, unit=unit, total=total, **kw)


# --------------------------------------------------------------------------
# measurement
# --------------------------------------------------------------------------

def strip_empty_think(text):
    """Drop a `<think></think>` pair a model emitted with nothing between it. Qwen3
    under `/no_think` does this on every response, and counting it as content inflated
    every step count by one before it was caught."""
    return re.sub(r"^\s*<think>\s*</think>\s*", "", text.strip())


def step_spans(text, *, min_step_chars):
    """Character spans of the steps in a trace: blank-line paragraphs, then newlines,
    then sentences — whichever first divides it. Fragments shorter than
    `min_step_chars` that carry no digit and no `\boxed` merge backwards.

    `min_step_chars` has no default. Where a step ends is a claim, so the notebook
    states its threshold at the call site.

    This counts formatting, not reasoning: a display equation becomes its own step. It
    is a serviceable blurt detector and nothing more.
    """
    text = strip_empty_think(text)
    for pattern in (r"\n\s*\n", r"\n", r"(?<=[.!?])\s+"):
        spans, pos = [], 0
        for m in re.finditer(pattern, text):
            if m.start() > pos:
                spans.append((pos, m.start()))
            pos = m.end()
        if pos < len(text):
            spans.append((pos, len(text)))
        spans = [(a, b) for a, b in spans if text[a:b].strip()]
        if len(spans) > 1:
            break
    else:
        return text, ([(0, len(text))] if text.strip() else [])

    merged = []
    for k, (a, b) in enumerate(spans):
        piece = text[a:b].strip()
        mergeable = (len(piece) < min_step_chars and not re.search(r"\d", piece)
                     and k != len(spans) - 1 and "\\boxed" not in piece)
        if merged and mergeable:
            merged[-1] = (merged[-1][0], b)
        else:
            merged.append((a, b))
    return text, merged


def n_steps(text, *, min_step_chars):
    return len(step_spans(text, min_step_chars=min_step_chars)[1])


def segment_steps(text, tokens, *, min_step_chars):
    """Steps with contiguous token ranges covering every token, for a page that reveals
    a trace one token at a time. Relies on `"".join(tokens) == text`."""
    assert "".join(tokens) == text, "token strings do not reconstruct the trace"
    stripped, spans = step_spans(text, min_step_chars=min_step_chars)
    offset = len(text) - len(stripped) if text.endswith(stripped) else 0

    ends, run = [], 0
    for tok in tokens:
        run += len(tok)
        ends.append(run)

    def token_at(char_index):
        lo, hi = 0, len(ends)
        while lo < hi:
            mid = (lo + hi) // 2
            if ends[mid] <= char_index:
                lo = mid + 1
            else:
                hi = mid
        return lo

    steps = [{"text": stripped[a:b].strip(), "token_start": token_at(a + offset)}
             for a, b in spans]
    for j, st in enumerate(steps):
        st["token_end"] = steps[j + 1]["token_start"] if j + 1 < len(steps) else len(tokens)
    return steps


def tokens_to_answer(tokens, marker="\\boxed{"):
    """Tokens emitted before the answer marker opens; None if it never does."""
    run = ""
    for i, tok in enumerate(tokens):
        run += tok
        if marker in run:
            return i + 1
    return None


def mcnemar(a, b):
    """Exact two-sided test over the items where two conditions disagree.

    `a` and `b` map problem_id -> bool. Returns (a_only, b_only, p). Ties carry no
    information about a difference, so they are excluded rather than counted.
    """
    from math import comb
    both = set(a) & set(b)
    x = sum(1 for k in both if a[k] and not b[k])
    y = sum(1 for k in both if b[k] and not a[k])
    n = x + y
    if n == 0:
        return x, y, 1.0
    k = max(x, y)
    return x, y, min(1.0, 2 * sum(comb(n, i) for i in range(k, n + 1)) / 2 ** n)


def table(title, header, rows, note=None, collect=None):
    """Print a table and, if `collect` is a list, append the same table to it as
    markdown. Runs that emit a paste-ready tables.md and a readable notebook get both
    from one call instead of formatting twice."""
    md = [f"\n### {title}\n",
          "| " + " | ".join(header) + " |",
          "|" + "|".join("---" for _ in header) + "|"]
    md += ["| " + " | ".join(str(c) for c in r) + " |" for r in rows]
    if note:
        md.append(f"\n{note}")
    if collect is not None:
        collect.extend(md)

    widths = [max(len(str(r[i])) for r in [header] + rows) for i in range(len(header))]
    print(f"\n### {title}")
    print("  " + "  ".join(str(h).ljust(widths[i]) for i, h in enumerate(header)))
    for r in rows:
        print("  " + "  ".join(str(c).ljust(widths[i]) for i, c in enumerate(r)))
    if note:
        print(f"  {note}")
    return "\n".join(md)


# --------------------------------------------------------------------------
# datasets the book does not ship
# --------------------------------------------------------------------------

GSM8K_URL = ("https://raw.githubusercontent.com/openai/grade-school-math/"
             "master/grade_school_math/data/test.jsonl")


def load_gsm8k(path="data/gsm8k_test.jsonl"):
    """GSM8K's test split in the same shape ch03 gives MATH-500, so one loop serves
    both. The reference answer is the text after `####`; the `<<3*4=12>>` calculator
    annotations are stripped because they are not part of the demonstrated solution."""
    import requests
    path = Path(path)
    if not path.exists():
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(requests.get(GSM8K_URL, timeout=60).text, encoding="utf-8")
    rows = []
    for i, line in enumerate(path.read_text(encoding="utf-8").splitlines()):
        if not line.strip():
            continue
        r = json.loads(line)
        body, _, final = r["answer"].rpartition("####")
        rows.append({"unique_id": f"gsm8k/{i}", "problem": r["question"],
                     "answer": final.strip().replace(",", ""),
                     "solution": re.sub(r"<<.*?>>", "", body).strip(),
                     "level": 0, "subject": "grade school"})
    return rows


# --------------------------------------------------------------------------
# the resume log
# --------------------------------------------------------------------------

class TraceStore:
    """Append-only JSONL of generations, keyed for resume.

    `run_id` must name everything that changes what a generation IS — model, item
    set, decoding caps. Records under other run ids stay in the file as the record
    of what was run and are never replayed.
    """

    def __init__(self, path, run_id, key_fields):
        self.path = Path(path)
        self.run_id = run_id
        self.key_fields = tuple(key_fields)
        self.done = {}
        if self.path.exists():
            with self.path.open(encoding="utf-8") as f:
                for line in f:
                    if not line.strip():
                        continue
                    r = json.loads(line)
                    if r.get("run_id") == run_id:
                        self.done[self._key(r)] = r

    def _key(self, rec):
        return tuple(rec[f] for f in self.key_fields)

    def get(self, *key):
        return self.done.get(key)

    def append(self, rec):
        rec = {"run_id": self.run_id, **rec}
        with self.path.open("a", encoding="utf-8") as f:
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")
        self.done[self._key(rec)] = rec
        return rec

    def other_run_ids(self):
        if not self.path.exists():
            return set()
        with self.path.open(encoding="utf-8") as f:
            return {json.loads(l)["run_id"] for l in f if l.strip()} - {self.run_id}

    def report(self):
        print(f"run_id={self.run_id}\n        {len(self.done)} generations on disk "
              f"for this configuration")
        others = self.other_run_ids()
        if others:
            print(f"        {len(others)} other configuration(s) present and ignored: "
                  + ", ".join(sorted(others)))


# --------------------------------------------------------------------------
# self-test
# --------------------------------------------------------------------------

def selftest(tok, verbose=True):
    """Prove the invariants a notebook depends on, once, instead of per page."""
    probes = [
        r"The angle is $\frac{\pi}{2}$ radians.",
        "The answer is 45°, or π/4.",
        "Área = 5. Ratio ≈ 1.618",          # multi-token characters
        "∑ from i=1 to n. √2 · π",
        "こんにちは",
        "",
    ]
    checked = 0
    for s in probes:
        ids = tok(s, add_special_tokens=False).input_ids
        incremental_token_strings(ids, tok)                # asserts internally
        for cut in range(1, len(ids) + 1):                 # every truncation point
            incremental_token_strings(ids[:cut], tok)
            checked += 1

    assert wilson(0, 0) == (0.0, 0.0)
    lo, hi = wilson(1, 24)
    assert lo < 1 / 24 < hi and hi < 0.25, "wilson interval looks wrong"
    assert median([3, 1, 2]) == 2 and mean([1, 2]) == 1.5

    if verbose:
        print(f"harness {__version__} ({fingerprint()['sha256'][:12]}): "
              f"{checked} token reconstructions across split characters and every "
              f"truncation point, numerics OK")
    return True
