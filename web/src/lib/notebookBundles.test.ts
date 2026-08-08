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
 * carries.
 */
const PAGES = [
  { n: 5, slug: "page-05-how-to-reason", notebook: "page_05_how_to_reason.ipynb",
    declared: "0.8 MB", extras: [], repoNotebookIsTheShippedOne: false },
  { n: 6, slug: "page-06-thinking-longer", notebook: "page_06_thinking_longer.ipynb",
    declared: "2.0 MB", extras: [], repoNotebookIsTheShippedOne: true },
  { n: 7, slug: "page-07-frequency-voting", notebook: "page_07_frequency_voting.ipynb",
    declared: "3.1 MB", extras: [], repoNotebookIsTheShippedOne: true },
  { n: 8, slug: "page-08-best-of-n", notebook: "page_08_best_of_n.ipynb",
    declared: null, extras: ["scores.jsonl", "judge_solves.jsonl"],
    repoNotebookIsTheShippedOne: false },
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

describe.each(PAGES)("page $n's notebook bundle", ({
  n, slug, notebook, declared, extras, repoNotebookIsTheShippedOne,
}) => {
  const pad = String(n).padStart(2, "0");

  it("exists, and the size on the page is the size on disk", () => {
    const mb = statSync(zipPath(slug)).size / 1e6;
    expect(mb).toBeGreaterThan(0);
    // The label is what a reader decides to click on, so a stale one is a small
    // lie in the one place the page asks for trust. Page 8 prints none.
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
        `${slug}/out/page_${pad}/derived.json`,
        `${slug}/out/page_${pad}/manifest.json`,
        `${slug}/out/page_${pad}/traces.jsonl`,
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
