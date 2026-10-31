/**
 * The notebook downloads, checked as artifacts rather than as links.
 *
 * The pipeline's whole claim is that a reader who doubts a figure downloads the
 * run and re-derives it. That claim is carried by a binary in `public/`, which
 * no other test touches, so it can rot silently: a bundle can be rebuilt with
 * the wrong layout, ship in the wrong run mode, or drift from the `derived.json`
 * the page actually plots, and every component test still passes.
 *
 * All three of those had happened to page 7 by the time this file was written.
 * Its bundle exploded six files into the reader's working directory instead of
 * unpacking into a folder; it put `traces.jsonl` at the root while the notebook
 * looks for `out/page_07/traces.jsonl`, so REPLAY asserted on a fresh download;
 * and it shipped at `RUN_MODE = "FULL"`, which would have sent a reader who
 * followed the page's own words ("it opens in a replay mode... on no GPU") into
 * a 5,920-chain sweep. Pages 5 and 6 were correct, which is what made the shape
 * of the fix obvious and the absence of this test expensive.
 *
 * Reads the zips through `unzip` rather than a parser dependency, and never
 * extracts `traces.jsonl`: it is 38 MB on page 7 and its presence is the claim,
 * not its contents.
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/** Resolved from this file, not from cwd: these paths are the point of the test. */
const WEB = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

/**
 * `declared` is the size the page prints beside the link, or null where the
 * page prints none. `extras` are run artifacts beyond the three every bundle
 * carries. `siteData` names the script that builds `derived.json` from the
 * notebook's `results.json`, on pages whose notebook stops at its results.
 */

const PAGES = [
  // Page 5 no longer links this bundle: since 2026-10-14 pages 5 and 16 offer the
  // author's single notebook, 5_CoT.ipynb. The bundle stays on disk because
  // notebooks/build_trace_report.py reads page 5's traces from it, so it is still
  // checked here, with no declared size (no page prints one).
  { n: 5, slug: "page-05-how-to-reason", notebook: "page_05_how_to_reason.ipynb",
    declared: null, extras: [], siteData: null, repoNotebookIsTheShippedOne: false },
  // Page 6's repo copy has moved ahead: it lets a chain stop at its cap with no forced
  // answer, and its grid runs to 4,096 tokens. The shipped bundle still carries the
  // run that produced the numbers the page plots, and re-bundling waits on the new
  // FULL run. Flip this back to true in the same commit that re-bundles; see
  // notebooks/RUNBOOK_page6_full.md.
  { n: 6, slug: "page-06-thinking-longer", notebook: "page_06_thinking_longer.ipynb",
    declared: "2.0 MB", extras: [], siteData: null, repoNotebookIsTheShippedOne: false },
  { n: 7, slug: "page-07-frequency-voting", notebook: "page_07_frequency_voting.ipynb",
    declared: "3.1 MB", extras: ["results.json"], siteData: "page_07_site_data.py",
    repoNotebookIsTheShippedOne: true },
  { n: 8, slug: "page-08-best-of-n", notebook: "page_08_best_of_n.ipynb",
    declared: "10.1 MB", extras: ["scores.jsonl", "judge_solves.jsonl"], siteData: null,
    repoNotebookIsTheShippedOne: false },
  // Page 9 was absent from this list until 2026-08-09, and it had drifted in the two
  // ways the list exists to catch: it unpacked flat instead of into a folder, and its
  // manifest named a notebook sha that existed in no obtainable copy. Both are fixed
  // by publishing in two stages (FULL computes the PRM scores, REPLAY re-derives every
  // aggregate from them and writes the artifacts), which is only possible now that
  // REPLAY can adopt this page's own scores instead of needing a GPU for them.
  { n: 9, slug: "page-09-outcome-vs-process", notebook: "page_09_outcome_vs_process.ipynb",
    declared: "1.6 MB", extras: [], siteData: null, repoNotebookIsTheShippedOne: true },
  { n: 11, slug: "page-11-training-vs-scale", notebook: "page_11_training_vs_scale.ipynb",
    declared: "2.8 MB", extras: [], siteData: null, repoNotebookIsTheShippedOne: true },
  // Page 12 generates no pile of its own: it replays page 7's chains, so those ship at
  // the path the notebook reads them from, out/page_07/traces.jsonl, and its own folder
  // holds the results and the hint retry's chains.
  { n: 12, slug: "page-12-star-harvest", notebook: "page_12_star_harvest.ipynb",
    declared: "3.1 MB", extras: ["results.json", "hint_traces.jsonl"],
    siteData: "page_12_site_data.py", repoNotebookIsTheShippedOne: true,
    traces: "out/page_07/traces.jsonl" },
] as const;

const NOTEBOOKS = resolve(WEB, "../notebooks");

/** Code cells only, joined. Outputs, execution counts and metadata are not the code. */
const codeCells = (ipynb: Buffer | string): string[] =>
  (JSON.parse(ipynb.toString()) as { cells: { cell_type: string; source: string[] }[] }).cells
    .filter((c) => c.cell_type === "code")
    .map((c) => c.source.join(""));

const zipPath = (slug: string) => resolve(WEB, `public/notebooks/${slug}.zip`);
const entries = (slug: string) =>
  execFileSync("unzip", ["-Z1", zipPath(slug)], { encoding: "utf8" }).trim().split("\n");
const member = (slug: string, name: string) =>
  execFileSync("unzip", ["-p", zipPath(slug), name], { maxBuffer: 1 << 28 });

describe.each(PAGES)("page $n's notebook bundle", (page) => {
  const { n, slug, notebook, declared, extras, siteData, repoNotebookIsTheShippedOne } = page;
  const pad = String(n).padStart(2, "0");

  it("exists, and the size on the page is the size on disk", () => {
    const mb = statSync(zipPath(slug)).size / 1e6;
    expect(mb).toBeGreaterThan(0);
    // The label is what a reader decides to click on, so a stale one is a small
    // lie in the one place the page asks for trust. Every page now prints one
    // via the shared NotebookDownload button.
    if (declared) expect(`${mb.toFixed(1)} MB`).toBe(declared);
  });

  // A bundle that unpacks into the current directory is a bundle that scatters
  // six files across whatever the reader happened to be standing in.
  it("unpacks into one folder named for the page", () => {
    const roots = new Set(entries(slug).map((e) => e.split("/")[0]));
    expect([...roots]).toEqual([slug]);
  });

  // The notebook resolves its inputs relative to its own directory, so the
  // layout is not cosmetic: REPLAY reads exactly `out/page_NN/traces.jsonl`.
  it("puts every file where the notebook looks for it", () => {
    const got = entries(slug).filter((e) => !e.endsWith("/"));
    expect(got.sort()).toEqual(
      [
        `${slug}/README.md`,
        `${slug}/harness.py`,
        `${slug}/${notebook}`,
        ...(siteData ? [`${slug}/${siteData}`] : []),
        `${slug}/out/page_${pad}/derived.json`,
        `${slug}/out/page_${pad}/manifest.json`,
        `${slug}/${"traces" in page ? page.traces : `out/page_${pad}/traces.jsonl`}`,
        ...extras.map((e) => `${slug}/out/page_${pad}/${e}`),
        `${slug}/requirements.txt`,
      ].sort(),
    );
  });

  // Every page promises a replay that needs no GPU. The shipped copy has to be
  // the one that delivers it.
  it("ships in REPLAY mode, which is what the page promises", () => {
    const nb = JSON.parse(member(slug, `${slug}/${notebook}`).toString("utf8"));
    const src: string = nb.cells
      .filter((c: { cell_type: string }) => c.cell_type === "code")
      .map((c: { source: string[] }) => c.source.join(""))
      .join("\n");
    const modes = [...src.matchAll(/^\s*RUN_MODE\s*=\s*"(\w+)"/gm)].map((m) => m[1]);
    expect(modes).toEqual(["REPLAY"]);
  });

  // The page plots `web/data/page-NN-derived.json`; the download has to carry
  // the file that produced it, or "re-derive this yourself" is not an offer.
  // Page 8 shipped a bundle 25 minutes older than its data for a while, which
  // disagreed with the page on figure 1's specimen and predated the paired
  // baseline entirely. This is the assertion that would have caught it.
  it("carries the same derived.json the page plots", () => {
    const sha = (b: Buffer | Uint8Array) => createHash("sha256").update(b).digest("hex");
    expect(sha(member(slug, `${slug}/out/page_${pad}/derived.json`))).toBe(
      sha(readFileSync(resolve(WEB, `data/page-${pad}-derived.json`))),
    );
  });

  // A page whose notebook stops at results.json ships the script that lays those
  // results out for the page, and derived.json names the exact pair it was built
  // from. Without this, "re-derive it yourself" would end one step short of the
  // file the page plots.
  it.runIf(siteData !== null)("builds its derived.json from the results it ships", () => {
    const sha = (b: Buffer | Uint8Array) => createHash("sha256").update(b).digest("hex");
    const derived = JSON.parse(member(slug, `${slug}/out/page_${pad}/derived.json`).toString());
    expect(derived.source.builder).toBe(siteData);
    expect(derived.source.results_sha256).toBe(
      sha(member(slug, `${slug}/out/page_${pad}/results.json`)),
    );
    expect(derived.source.builder_sha256).toBe(sha(member(slug, `${slug}/${siteData}`)));
  });

  // `notebooks/README.md`: "The manifest records the notebook's sha256, so 'this file
  // made these numbers' is checkable rather than asserted." Pages 6 and 7 shipped
  // manifests naming a notebook that existed in no obtainable copy, which made that
  // promise false for two of five downloads. This is the assertion behind the sentence.
  it("names the notebook it ships, in both copies of the manifest", () => {
    const sha = (b: Buffer | Uint8Array) => createHash("sha256").update(b).digest("hex");
    const shipped = sha(member(slug, `${slug}/${notebook}`));
    const bundled = JSON.parse(member(slug, `${slug}/out/page_${pad}/manifest.json`).toString());
    expect(bundled.notebook_sha256).toBe(shipped);
    const plotted = JSON.parse(
      readFileSync(resolve(WEB, `data/page-${pad}-derived.json`), "utf8"),
    );
    expect(plotted.manifest.notebook_sha256).toBe(shipped);
  });

  // A whole-file hash moves when a notebook is merely re-saved, so it cannot answer the
  // question a reader cares about: is the code in my download the code in the repo?
  // Page 7's bundle differed by a crash fix the repo already had, and no hash caught it.
  //
  // `repoNotebookIsTheShippedOne: false` records a page whose repo copy has moved AHEAD of
  // the run that produced the shipped numbers. Re-bundling it needs a re-run, so it is a
  // known debt rather than a failure; the assertion is two-way, so paying it down (or
  // letting a new page drift) fails here and forces the flag to be updated deliberately.
  it("ships the repo notebook's code, or declares that it does not", () => {
    const shipped = codeCells(member(slug, `${slug}/${notebook}`));
    const repo = codeCells(readFileSync(resolve(NOTEBOOKS, notebook)));
    expect(shipped.length === repo.length && shipped.every((c, i) => c === repo[i])).toBe(
      repoNotebookIsTheShippedOne,
    );
  });
});
