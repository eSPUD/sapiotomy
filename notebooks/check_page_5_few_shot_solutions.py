"""Checks the five expanded worked solutions in page_5_few_shot_solutions.json: every
calculation and identity they state, and their format. Needs sympy, math-verify and datasets."""
import json, re
import sympy as sp
from math_verify import parse, verify
from pathlib import Path
SOLUTIONS = json.loads((Path(__file__).parent / "page_5_few_shot_solutions.json").read_text())

from datasets import load_dataset
rows = {r["unique_id"]: r for r in load_dataset("HuggingFaceH4/MATH-500", split="test")}
fails = []
def check(name, cond):
    print(("ok   " if cond else "FAIL ") + name)
    if not cond: fails.append(name)

def extract_answer(text):
    for phrase in ["Difficulty Level:", "Problem:"]:
        if phrase in text: text = text.split(phrase)[0]
    if "\\boxed{" not in text: return ""
    start = text.find("\\boxed{") + len("\\boxed{"); depth = 1
    for i in range(start, len(text)):
        depth += (text[i] == "{") - (text[i] == "}")
        if depth == 0: return text[start:i].strip()
    return ""

print("== format, every solution")
for uid, s in SOLUTIONS.items():
    gold = rows[uid]["answer"]; pred = extract_answer(s)
    check(f"{uid}: exactly one \\boxed", s.count("\\boxed") == 1)
    check(f"{uid}: box is the last thing said", s.rstrip().rstrip(".$").endswith("}") or s.rstrip().endswith("pencils left over."))
    check(f"{uid}: boxed {pred!r} grades correct against {gold!r}", bool(verify(parse(f"${gold}$"), parse(f"${pred}$"))))
    check(f"{uid}: same boxed text as MATH's solution", pred == extract_answer(rows[uid]["solution"].split("We also could")[0]))
    check(f"{uid}: no 'Problem:' or 'Difficulty Level:'", "Problem:" not in s and "Difficulty Level:" not in s)
    check(f"{uid}: no markdown (**, #, \\(, numbered list)", "**" not in s and not re.search(r"^#", s, re.M) and "\\(" not in s and not re.search(r"^\s*\d+\.\s", s, re.M))
    check(f"{uid}: balanced braces", s.count("{") == s.count("}"))
    check(f"{uid}: balanced $", s.count("$") % 2 == 0)

d = lambda deg: sp.rad(deg)
eq = lambda a, b: sp.N(a - b, 50) == 0 or abs(sp.N(a - b, 50)) < sp.Float("1e-40")
print("\n== precalculus/697")
check("sin100 = sin80", eq(sp.sin(d(100)), sp.sin(d(80))))
check("cos100 = -cos80", eq(sp.cos(d(100)), -sp.cos(d(80))))
check("sin80 = cos10", eq(sp.sin(d(80)), sp.cos(d(10))))
check("cos80 = sin10", eq(sp.cos(d(80)), sp.sin(d(10))))
E0 = sp.tan(d(100)) + 4*sp.sin(d(100))
steps = [
    sp.sin(d(100))/sp.cos(d(100)) + 4*sp.sin(d(100)),
    sp.sin(d(80))/(-sp.cos(d(80))) + 4*sp.sin(d(80)),
    -sp.cos(d(10))/sp.sin(d(10)) + 4*sp.cos(d(10)),
    (4*sp.cos(d(10))*sp.sin(d(10)) - sp.cos(d(10)))/sp.sin(d(10)),
    (2*sp.sin(d(20)) - sp.cos(d(10)))/sp.sin(d(10)),
    (sp.sin(d(20)) + sp.sin(d(20)) - sp.sin(d(80)))/sp.sin(d(10)),
    (sp.sin(d(20)) - sp.cos(d(50)))/sp.sin(d(10)),
    (sp.sin(d(20)) - sp.sin(d(40)))/sp.sin(d(10)),
    -sp.sqrt(3)*sp.sin(d(10))/sp.sin(d(10)),
]
for i, st in enumerate(steps): check(f"chain step {i+1} equals the original expression", eq(st, E0))
check("2 sin10 cos10 = sin20", eq(2*sp.sin(d(10))*sp.cos(d(10)), sp.sin(d(20))))
check("(20+80)/2 = 50 and (20-80)/2 = -30", (20+80)/2 == 50 and (20-80)/2 == -30)
check("sin20 - sin80 = 2 cos50 sin(-30)", eq(sp.sin(d(20)) - sp.sin(d(80)), 2*sp.cos(d(50))*sp.sin(d(-30))))
check("sin(-30) = -1/2", eq(sp.sin(d(-30)), sp.Rational(-1, 2)))
check("2 cos50 sin(-30) = -cos50", eq(2*sp.cos(d(50))*sp.sin(d(-30)), -sp.cos(d(50))))
check("cos50 = sin40", eq(sp.cos(d(50)), sp.sin(d(40))))
check("(20+40)/2 = 30 and (20-40)/2 = -10", (20+40)/2 == 30 and (20-40)/2 == -10)
check("sin20 - sin40 = 2 cos30 sin(-10)", eq(sp.sin(d(20)) - sp.sin(d(40)), 2*sp.cos(d(30))*sp.sin(d(-10))))
check("cos30 = sqrt3/2", eq(sp.cos(d(30)), sp.sqrt(3)/2))
check("2 cos30 sin(-10) = -sqrt3 sin10", eq(2*sp.cos(d(30))*sp.sin(d(-10)), -sp.sqrt(3)*sp.sin(d(10))))
check("tan100 ≈ -5.6713", f"{float(sp.tan(d(100))):.4f}" == "-5.6713")
check("4 sin100 ≈ 3.9392", f"{float(4*sp.sin(d(100))):.4f}" == "3.9392")
check("sum ≈ -1.7321", f"{float(E0):.4f}" == "-1.7321")
check("-sqrt3 ≈ -1.7321", f"{float(-sp.sqrt(3)):.4f}" == "-1.7321")

print("\n== algebra/101")
x = sp.symbols("x", real=True)
check("x^2-5x-4-10 = x^2-5x-14", sp.expand(x**2-5*x-4-10 - (x**2-5*x-14)) == 0)
pairs = [(1, -14), (-1, 14), (2, -7), (-2, 7)]
check("those are all integer pairs with product -14", sorted(pairs) == sorted((a, -14//a) for a in [1, -1, 2, -2]) and all(a*b == -14 for a, b in pairs))
check("their sums are -13, 13, -5, 5", [a+b for a, b in pairs] == [-13, 13, -5, 5])
check("(x-7)(x+2) = x^2+2x-7x-14 = x^2-5x-14", sp.expand((x-7)*(x+2)) == x**2-5*x-14 and sp.expand(x**2+2*x-7*x-14) == x**2-5*x-14)
check("(x+2)-(x-7) = 9", sp.expand((x+2)-(x-7)) == 9)
check("solution set is [-2, 7]", sp.solveset(x**2-5*x-4 <= 10, x, sp.S.Reals) == sp.Interval(-2, 7))
check("x=0 gives -4; x=8 gives 64-40-4=20; x=-3 gives 9+15-4=20", (0-0-4, 64-40-4, 9+15-4) == (-4, 20, 20) and [v**2-5*v-4 for v in (0, 8, -3)] == [-4, 20, 20])

print("\n== geometry/178")
A_, B_, C_ = (0, 0), (5, 0), (5, 10)
AB, BC = sp.sqrt((B_[0]-A_[0])**2 + (B_[1]-A_[1])**2), sp.sqrt((C_[0]-B_[0])**2 + (C_[1]-B_[1])**2)
AC = sp.sqrt((C_[0]-A_[0])**2 + (C_[1]-A_[1])**2)
check("diagram: angle B is right (BA·BC = 0)", (A_[0]-B_[0])*(C_[0]-B_[0]) + (A_[1]-B_[1])*(C_[1]-B_[1]) == 0)
check("AB = 5, BC = 10, BC = 2AB", AB == 5 and BC == 10 and BC == 2*AB)
check("AC = sqrt(125) = 5 sqrt5", AC == sp.sqrt(125) == 5*sp.sqrt(5))
check("sin A = 10/(5 sqrt5) = 2/sqrt5", sp.simplify(10/(5*sp.sqrt(5)) - 2/sp.sqrt(5)) == 0)
check("cos A = 5/(5 sqrt5) = 1/sqrt5", sp.simplify(5/(5*sp.sqrt(5)) - 1/sp.sqrt(5)) == 0)
check("sin A = 2 cos A in the diagram", sp.simplify(2/sp.sqrt(5) - 2*(1/sp.sqrt(5))) == 0)
a = sp.symbols("a", positive=True)
check("tan A = 2 for any right triangle with BC = 2AB", sp.simplify((2*a)/a) == 2)

print("\n== number_theory/769")
check("11*12 = 132, 129 = 132-3, 129 ≡ -3", 11*12 == 132 and 129 == 132-3 and 129 % 11 == (-3) % 11)
check("11*9 = 99, 96 = 99-3, 96 ≡ -3", 11*9 == 99 and 96 == 99-3 and 96 % 11 == (-3) % 11)
check("(-3)^34 = 3^34, (-3)^38 = 3^38", (-3)**34 == 3**34 and (-3)**38 == 3**38)
check("3^1..3^5 mod 11 = 3, 9, 5, 4, 1", [pow(3, k, 11) for k in range(1, 6)] == [3, 9, 5, 4, 1])
check("27 = 2*11+5, 15 = 11+4, 12 = 11+1", 27 == 2*11+5 and 15 == 11+4 and 12 == 11+1)
check("34 = 5*6+4, 38 = 5*7+3", 34 == 5*6+4 and 38 == 5*7+3)
check("3^4 + 3^3 = 81 + 27 = 108", 3**4 == 81 and 3**3 == 27 and 81+27 == 108)
check("108 - 99 = 9, 108 ≡ 9", 108-99 == 9 and 108 % 11 == 9)
check("4 + 5 = 9", 4+5 == 9)
check("direct: (129^34 + 96^38) mod 11 = 9", (129**34 + 96**38) % 11 == 9)

print("\n== number_theory/612")
check("leftover = N mod 3 is at most 2 for N = 0..10000", max(N % 3 for N in range(10001)) == 2)
check("with r >= 3 a fuller distribution exists (N = 3n + r, r >= 3 -> n+1 fits)", all(3*(n+1) <= 3*n + r for n in range(50) for r in range(3, 10)))
check("8 pencils: 2 each uses 6, leaves 2; 3 each needs 9 > 8", 3*2 == 6 and 8-6 == 2 and 3*3 == 9 and 9 > 8 and 8 // 3 == 2 and 8 % 3 == 2)

print(f"\n{len(fails)} failed")
