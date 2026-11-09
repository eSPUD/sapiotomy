# Page 7, section 3: greedy decoding against majority voting, timed

Both arms of section 3, run end to end on an NVIDIA GeForce RTX 5080 (16 GB), Qwen2.5-3B-Instruct
in bf16, on all 100 of page 7's MATH-500 problems (levels 4 and 5), with the model already loaded
(loading took 2.7 s). Chains were made by the notebook's own sampler (through
`page_07_topup.fill`), from the published run's seeds.

| | greedy decoding: 1 chain, T = 0 | majority voting: 16 chains, T = 0.3 |
|---|---|---|
| chains | 100 | 1,600 |
| tokens | 69,320 | 993,116 |
| wall clock | **12.1 min** | **37.1 min** |
| tokens per second | 96 (one chain at a time) | 446 (batches of 8) |
| per problem, average | **7.3 s** | **22.3 s** |
| per problem, median | 6 s | 20 s |
| per problem, fastest / slowest | 2 s / 22 s | 5 s / 53 s |
| tokens per problem | 693 | 9,931 |

Majority voting writes 14.3x the tokens of greedy decoding but takes 3.1x the time: the 16
sampled chains run 8 at a time, while a greedy chain runs alone (its copies are identical, so
there is nothing to batch). Per-problem times are from `run.log`'s timestamps, to the second.

**Reproduction.** All 1,700 chains this run made are word for word the chains in page 7's
published `traces.jsonl` (same seeds, same scores: greedy 43/100, the 16-chain pile 747/1600
chains right). On this machine the published run regenerates exactly. The chains themselves are
not copied here; they are in the notebook download.

- `timing.json`: both arms, with chains, tokens, seconds, tokens per second, start and finish.
- `run.log`: the run's output, one timestamped line per problem.
- `time_s3.py`: the script. It runs from the repository's `notebooks/` folder, writes chains
  only to a scratch file, and never writes the notebook or the published traces.
