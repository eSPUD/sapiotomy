"""Static acceptance check for page 6's notebook, per RUN_MODE.

The problem this solves. POWER is the first mode that replays one arm and
generates the other, so cells that used to be gated on `RUN_MODE != "REPLAY"`
had to be split between two flags. Get one wrong and the failure is a NameError
in the manifest cell, three hours into an unattended overnight run, after every
generation has been made and none of it has been written to `derived.json`.

There is no GPU and no `torch` on the machine that edits this notebook, so the
notebook cannot simply be executed to find that out. Instead this walks each
cell's AST, simulates top-level execution under a given mode by descending only
into the branch a known flag actually takes, and reports any name read before
anything bound it. That is a narrow check and it does not prove the run works;
it proves the specific class of failure that a mode split causes is absent.

Usage:
    python notebooks/verify_power_mode.py            # all three modes
    python notebooks/verify_power_mode.py POWER      # one of them
"""
from __future__ import annotations

import ast
import builtins
import json
import sys
from pathlib import Path

NB = Path(__file__).resolve().parent / "page_06_thinking_longer.ipynb"

MODES = ("REPLAY", "QUICK", "FULL", "POWER")

# Flags whose value this checker knows, so it can pick the branch that runs.
def flags_for(mode: str) -> dict[str, object]:
    return {
        "RUN_MODE": mode,
        "GENERATES_BUDGETS": mode in ("QUICK", "FULL"),
        "GENERATES_WAITS": mode in ("QUICK", "FULL", "POWER"),
        "REPLAYS_BUDGETS": mode not in ("QUICK", "FULL"),
    }


# Names the notebook gets from its imports and from IPython, which the walk below
# would otherwise flag. Kept explicit rather than inferred: a typo in a real name
# should surface, and a silent "assume anything unknown is an import" would hide it.
AMBIENT = {
    "json", "random", "re", "textwrap", "datetime", "timezone", "Path", "Counter",
    "requests", "torch", "np", "numpy", "plt", "matplotlib", "mpl", "harness",
    "mean", "median", "stdev", "math", "os", "sys", "time", "hashlib", "itertools",
    "collections", "defaultdict", "dataclass", "field", "Optional", "Any",
    "load_math500_test", "extract_final_candidate", "grade_answer", "get_device",
    "AutoModelForCausalLM", "AutoTokenizer", "display", "Markdown", "HTML",
    "tqdm", "warnings", "copy", "deepcopy", "product", "chain", "islice",
}


def truthiness(node: ast.expr, env: dict[str, object]):
    """Evaluate a gate expression if this checker knows enough to; else None."""
    try:
        if isinstance(node, ast.Name) and node.id in env:
            return bool(env[node.id])
        if isinstance(node, ast.Compare) and len(node.ops) == 1:
            left, op, right = node.left, node.ops[0], node.comparators[0]
            if isinstance(left, ast.Name) and left.id in env:
                lv = env[left.id]
                if isinstance(op, (ast.Eq, ast.NotEq)) and isinstance(right, ast.Constant):
                    same = lv == right.value
                    return same if isinstance(op, ast.Eq) else not same
                if isinstance(op, (ast.In, ast.NotIn)) and isinstance(right, (ast.Tuple, ast.List)):
                    vals = [e.value for e in right.elts if isinstance(e, ast.Constant)]
                    if len(vals) == len(right.elts):
                        inside = lv in vals
                        return inside if isinstance(op, ast.In) else not inside
        if isinstance(node, ast.UnaryOp) and isinstance(node.op, ast.Not):
            inner = truthiness(node.operand, env)
            return None if inner is None else not inner
        if isinstance(node, ast.BoolOp):
            vals = [truthiness(v, env) for v in node.values]
            if any(v is None for v in vals):
                return None
            return all(vals) if isinstance(node.op, ast.And) else any(vals)
    except Exception:
        return None
    return None


def arg_names(a: ast.arguments) -> set[str]:
    names = {x.arg for x in list(a.posonlyargs) + list(a.args) + list(a.kwonlyargs)}
    if a.vararg:
        names.add(a.vararg.arg)
    if a.kwarg:
        names.add(a.kwarg.arg)
    return names


def bound_by(node: ast.AST) -> set[str]:
    """Every name this statement binds, INCLUDING the parameters of any function
    or lambda nested inside it.

    The parameters matter because `loads_in` is deliberately blunt and reports a
    lambda's own argument as a free read. Without this, a sort key like
    `key=lambda kv: kv[0]` is reported as an unbound `kv` in every mode, and a
    checker that cries wolf on the published run is a checker nobody reads.
    """
    out: set[str] = set()
    for n in ast.walk(node):
        if isinstance(n, ast.Name) and isinstance(n.ctx, ast.Store):
            out.add(n.id)
        elif isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef)):
            out.add(n.name)
            out |= arg_names(n.args)
        elif isinstance(n, ast.ClassDef):
            out.add(n.name)
        elif isinstance(n, ast.Lambda):
            out |= arg_names(n.args)
        elif isinstance(n, (ast.Import, ast.ImportFrom)):
            for a in n.names:
                out.add(a.asname or a.name.split(".")[0])
        elif isinstance(n, ast.ExceptHandler) and n.name:
            out.add(n.name)
    return out


def loads_in(node: ast.AST, env: dict[str, object] | None = None) -> set[str]:
    """Names read, skipping the untaken side of a ternary whose test is knowable.

    The manifest cell is full of `X if RUN_MODE != "REPLAY" else None`, and in
    REPLAY that never evaluates X. Reporting it would bury the one mode where the
    guard is TRUE and the name really is missing, which is the whole bug this
    file exists to catch.
    """
    out: set[str] = set()
    for n in ast.walk(node):
        if isinstance(n, ast.Name) and isinstance(n.ctx, ast.Load):
            out.add(n.id)
    if env:
        for n in ast.walk(node):
            if isinstance(n, ast.IfExp):
                taken = truthiness(n.test, env)
                if taken is True:
                    out -= loads_in(n.orelse) - loads_in(n.body) - loads_in(n.test)
                elif taken is False:
                    out -= loads_in(n.body) - loads_in(n.orelse) - loads_in(n.test)
    return out


class Walker:
    """Simulates top-level execution, taking only the branch a known flag takes."""

    def __init__(self, mode: str):
        self.env = dict(flags_for(mode))
        self.bound: set[str] = set(AMBIENT) | set(dir(builtins)) | set(self.env)
        self.deferred: list[tuple[int, str, set[str]]] = []   # function bodies
        self.problems: list[str] = []
        self.mode = mode

    def run_cell(self, index: int, src: str) -> None:
        try:
            tree = ast.parse(src)
        except SyntaxError as e:
            self.problems.append(f"cell {index}: SYNTAX ERROR line {e.lineno}: {e.msg}")
            return
        self.block(tree.body, index)

    def block(self, body: list[ast.stmt], index: int) -> None:
        for st in body:
            if isinstance(st, ast.If):
                taken = truthiness(st.test, self.env)
                if taken is True:
                    self.block(st.body, index)
                    continue
                if taken is False:
                    self.block(st.orelse, index)
                    continue
                # Unknown gate: both branches may run, so anything either binds is
                # treated as possibly bound. Conservative in the safe direction.
                self.check_loads(st.test, index)
                for b in (st.body, st.orelse):
                    self.block(b, index)
                continue
            if isinstance(st, (ast.FunctionDef, ast.AsyncFunctionDef)):
                # A body runs when it is CALLED, so its names are checked against
                # the environment at the end rather than against this point in it.
                mod = ast.Module(body=st.body, type_ignores=[])
                local = bound_by(mod) | arg_names(st.args)
                self.deferred.append((index, st.name, loads_in(mod, self.env) - local))
                self.bound.add(st.name)
                continue
            self.check_loads(st, index)
            self.bound |= bound_by(st)

    def check_loads(self, node: ast.AST, index: int) -> None:
        # Comprehension and lambda targets are their own scope; treat any Store
        # anywhere in the statement as satisfying a Load in it.
        local = bound_by(node)
        for name in sorted(loads_in(node, self.env) - self.bound - local):
            self.problems.append(
                f"cell {index}: reads {name!r} before anything in the {self.mode} path binds it")

    def finish(self) -> None:
        for index, fname, names in self.deferred:
            for name in sorted(names - self.bound):
                self.problems.append(
                    f"cell {index}: {fname}() calls {name!r}, which the {self.mode} path never binds")


def main() -> int:
    nb = json.loads(NB.read_text(encoding="utf-8"))
    code = [(i, "".join(c["source"])) for i, c in enumerate(nb["cells"])
            if c["cell_type"] == "code"]
    print(f"{NB.name}: {len(code)} code cells\n")

    wanted = sys.argv[1:] or list(MODES)
    failed = False

    # Without this, checking an UNPATCHED notebook reports "POWER: clean": every
    # gate still reads `RUN_MODE != "REPLAY"`, which is true for POWER, so every
    # cell runs and every name is bound. A vacuous pass is worse than a failure.
    src_all = "\n".join(s for _, s in code)
    for flag in ('"POWER"', "GENERATES_BUDGETS", "GENERATES_WAITS", "wait_items"):
        if flag not in src_all:
            print(f"this notebook has no {flag}; run patch_power_mode.py first.")
            return 1
    for mode in wanted:
        w = Walker(mode)
        for i, src in code:
            w.run_cell(i, src)
        w.finish()
        if w.problems:
            failed = True
            print(f"{mode}: {len(w.problems)} problem(s)")
            for p in w.problems:
                print(f"   {p}")
        else:
            print(f"{mode}: clean")
        print()

    if failed:
        print("FAILED. Fix these before starting an unattended run: every one of them is a")
        print("NameError that will not surface until the cell it is in actually executes.")
        return 1
    print("All modes clean. This proves no name is read before it is bound; it does not")
    print("prove the run produces the right numbers.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
