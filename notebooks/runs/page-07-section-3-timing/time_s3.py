"""Section 3's two arms, timed end to end on this GPU: one greedy chain per problem
(T = 0, one at a time, as the notebook makes it) and 16 chains per problem at T = 0.3
(batches of 8, as the notebook makes the pile), on all 100 problems. Chains go to a
scratch traces file only; the notebook and the published traces are never written."""
import json, os, sys, time, platform
from datetime import datetime, timezone
# notebooks/, two folders up from this file (notebooks/runs/page-07-section-3-timing/)
NB = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, NB); os.chdir(NB)
from page_07_topup import load_notebook_code, fill, assert_same_run

now = lambda: datetime.now(timezone.utc).isoformat(timespec="seconds")
t_all = time.time()
ns = {"__name__": "page_07_notebook"}
t = time.time(); load_notebook_code(ns, with_model=True); load_s = time.time() - t
run_id = json.load(open(os.path.join(NB, "out/page_07/manifest.json")))["run_id"]
assert_same_run(ns, run_id)
scratch = os.path.join(OUT, "traces_scratch.jsonl")
assert not os.path.exists(scratch), "scratch traces already exist; start clean"
store = ns["harness"].TraceStore(scratch, run_id, ("model_id", "config_id", "problem_id", "sample_index"))
items, cap = ns["items"], ns["CHAIN_CAP"]
arms = []
for name, temp, k in (("greedy, 1 chain, T = 0", 0.0, 1), ("majority voting, 16 chains, T = 0.3", 0.3, 16)):
    import torch; torch.cuda.synchronize()
    tally = dict(made=0, toks=0, total=len(items) * k, t0=time.time())
    started = now(); t = time.time()
    fill(store, ns, ns["config_id"](temp, cap), cap, temp, k, items, budget_total=None,
         made_by="section 3 timing (scratch)", tally=tally)
    torch.cuda.synchronize(); secs = time.time() - t
    arms.append(dict(arm=name, temperature=temp, chains_per_problem=k, problems=len(items),
                     chains=tally["made"], tokens=tally["toks"], seconds=round(secs, 1),
                     minutes=round(secs / 60, 2), tokens_per_second=round(tally["toks"] / secs, 1),
                     started_utc=started, finished_utc=now()))
    print(f"== {name}: {tally['made']} chains, {tally['toks']:,} tokens, {secs/60:.2f} min", flush=True)
json.dump(dict(gpu=torch.cuda.get_device_name(0), host=platform.node(), model=ns["PRIMARY"],
               model_load_seconds=round(load_s, 1), arms=arms,
               total_wall_seconds=round(time.time() - t_all, 1)),
          open(os.path.join(OUT, "timing.json"), "w"), indent=2)
print("wrote", os.path.join(OUT, "timing.json"), flush=True)
