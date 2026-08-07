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
import { describe, expect, it } from "vitest";

const PAGES = [
  { n: 5, slug: "page-05-how-to-reason", notebook: "page_05_how_to_reason.ipynb", declared: "0.8 MB" },
  { n: 6, slug: "page-06-thinking-longer", notebook: "page_06_thinking_longer.ipynb", declared: "2.0 MB" },
  { n: 7, slug: "page-07-frequency-voting", notebook: "page_07_frequency_voting.ipynb", declared: "3.1 MB" },
] as const;

const zipPath = (slug: string) => `public/notebooks/${slug}.zip`;
const entries = (slug: string) =>
  execFileSync("unzip", ["-Z1", zipPath(slug)], { encoding: "utf8" }).trim().split("\n");
const member = (slug: string, name: string) =>
  execFileSync("unzip", ["-p", zipPath(slug), name], { maxBuffer: 1 << 28 });

describe.each(PAGES)("page $n's notebook bundle", ({ n, slug, notebook, declared }) => {
  const pad = String(n).padStart(2, "0");

  it("exists, and the size on the page is the size on disk", () => {
    const mb = statSync(zipPath(slug)).size / 1e6;
    // The label is what a reader decides to click on, so a stale one is a small
    // lie in the one place the page asks for trust.
    expect(`${mb.toFixed(1)} MB`).toBe(declared);
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
  it("carries the same derived.json the page plots", () => {
    const sha = (b: Buffer | Uint8Array) => createHash("sha256").update(b).digest("hex");
    expect(sha(member(slug, `${slug}/out/page_${pad}/derived.json`))).toBe(
      sha(readFileSync(`data/page-${pad}-derived.json`)),
    );
  });
});
