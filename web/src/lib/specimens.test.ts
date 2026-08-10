/**
 * The specimens, checked against the bundle they claim to come from.
 *
 * `specimens.ts` proves the excerpt is a substring of the trace, which stops a
 * quote being edited for flow. It cannot prove the *trace* is real: a plausible
 * chain typed straight into `trace-specimens.json` would satisfy every check in
 * that module and every component test on both pages. So this file goes to the
 * published artifact and compares, the same way `notebookBundles.test.ts` goes
 * to the zips rather than trusting the link.
 *
 * It also guards the mark. The pages render `tidyMath(excerpt)`, and a
 * highlight that stops matching after tidying would not throw: `markExcerpt`
 * drops it and the card renders unmarked, losing the one line the specimen is
 * shown for. That failure is silent by design, so it is caught here instead.
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { SPECIMENS, SPECIMEN_SOURCE, markExcerpt, type Specimen } from "./specimens";
import { tidyMath } from "./traceText";

const WEB = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const ZIP = resolve(WEB, "public/notebooks/page-11-training-vs-scale.zip");
const MEMBER = "page-11-training-vs-scale/out/page_11/traces.jsonl";

const ALL: Specimen[] = Object.values(SPECIMENS);

/** The published traces, read once: 23 MB unpacked, so not per test. */
const lines = (() => {
  const out = execFileSync("unzip", ["-p", ZIP, MEMBER], { maxBuffer: 256 * 1024 * 1024 });
  const byHash = new Map<string, string>();
  for (const line of out.toString("utf8").split("\n")) {
    if (line.trim().length === 0) continue;
    byHash.set(createHash("sha256").update(line, "utf8").digest("hex"), line);
  }
  return byHash;
})();

describe("trace specimens", () => {
  it("bundles the three the pages spend", () => {
    expect(ALL.map((s) => s.role).sort()).toEqual([
      "contradicts_chain_geometry",
      "contradicts_chain_sum",
      "fabricated_tool",
    ]);
  });

  it.each(ALL)("$role is the line it names in the published bundle", (specimen) => {
    const line = lines.get(specimen.lineSha256);
    expect(line, `no line in ${MEMBER} hashes to ${specimen.lineSha256}`).toBeDefined();

    const record = JSON.parse(line!);
    expect(record.problem_id).toBe(specimen.problemId);
    expect(record.trace).toBe(specimen.trace);
    expect(record.ground_truth).toBe(specimen.groundTruth);
    expect(record.extracted_answer).toBe(specimen.answer);
    expect(record.correct).toBe(specimen.correct);
    expect(record.tokens_generated).toBe(specimen.tokensGenerated);
  });

  it.each(ALL)("$role came off the instrument the pages say it did", (specimen) => {
    const record = JSON.parse(lines.get(specimen.lineSha256)!);
    expect(record.model_id).toBe(SPECIMEN_SOURCE.modelId);
    expect(record.system_prompt).toBe(SPECIMEN_SOURCE.systemPrompt);
    expect(record.run_id).toBe(SPECIMEN_SOURCE.runId);
    expect(record.band).toBe("hard");
    // Greedy. A sampled chain is one draw of many and the cards do not say so.
    expect(record.temperature).toBe(0);
    expect(record.chain_budget).toBe(SPECIMEN_SOURCE.chainBudget);
    expect(specimen.level).toBeGreaterThanOrEqual(4);
  });

  it.each(ALL)("$role is a failure that ended itself", (specimen) => {
    expect(specimen.correct).toBe(false);
    expect(specimen.answer).not.toBe(specimen.groundTruth);
    const record = JSON.parse(lines.get(specimen.lineSha256)!);
    expect(record.truncated).toBe(false);
  });

  it.each(ALL)("$role keeps every mark through tidyMath", (specimen) => {
    const shown = tidyMath(specimen.excerpt);
    for (const h of specimen.highlights) {
      const tidied = tidyMath(h);
      expect(tidied.length).toBeGreaterThan(0);
      expect(
        shown.includes(tidied),
        `highlight ${JSON.stringify(h)} tidies to ${JSON.stringify(tidied)}, ` +
          `which is not in the tidied excerpt the page renders`,
      ).toBe(true);
    }
  });

  it.each(ALL)("$role renders with no raw LaTeX macro left in it", (specimen) => {
    // `tidyMath` returns an unrecognised macro untouched, which is its contract
    // and the right one: it never guesses at maths it does not know. The cost is
    // that an excerpt reaching one prints a literal backslash at the reader.
    // Choosing the span is the fix, so this is a check on the span, not on tidying.
    const shown = tidyMath(specimen.excerpt);
    const macros = [...shown.matchAll(/\\[A-Za-z]+/g)].map((m) => m[0]);
    expect(macros, `pick an excerpt that avoids ${macros.join(", ")}`).toEqual([]);
  });

  it.each(ALL)("$role reassembles to exactly what the page renders", (specimen) => {
    const runs = markExcerpt(specimen, tidyMath);
    expect(runs.map((r) => r.text).join("")).toBe(tidyMath(specimen.excerpt));
    expect(runs.some((r) => r.mark)).toBe(true);
  });

  it("marks the line page 19's beat is built on", () => {
    const runs = markExcerpt(SPECIMENS.fabricatedTool, tidyMath);
    const marked = runs.filter((r) => r.mark).map((r) => r.text);
    expect(marked).toEqual(["we use known results or computational tools to find"]);
    // The invented output has to be visible beside the sentence that promised it,
    // or the card shows a model asking for a tool and not a model faking one.
    expect(tidyMath(SPECIMENS.fabricatedTool.excerpt)).toContain("a = 0");
  });

  it.each([SPECIMENS.contradictsChainSum, SPECIMENS.contradictsChainGeometry])(
    "$role shows a value the chain computed and did not answer",
    (specimen) => {
      const shown = tidyMath(specimen.excerpt);
      for (const h of specimen.highlights) expect(shown).toContain(tidyMath(h));
      // The whole claim of these two cards: the value the chain worked out is
      // not the value it handed back. Compared as the reader sees them, and on
      // the right-hand side of the last `=` where the highlight is a working
      // line rather than a bare expression.
      const finalValue = (s: string) => {
        const tidied = tidyMath(s);
        const at = tidied.lastIndexOf("=");
        return (at === -1 ? tidied : tidied.slice(at + 1)).trim();
      };
      const answered = tidyMath(specimen.answer ?? "").trim();
      expect(answered.length).toBeGreaterThan(0);
      for (const h of specimen.highlights) {
        expect(
          finalValue(h),
          "the marked line and the boxed answer read the same, so this card shows no contradiction",
        ).not.toBe(answered);
      }
    },
  );
});
