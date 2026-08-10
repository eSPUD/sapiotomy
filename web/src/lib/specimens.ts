/**
 * Three measured chains, shared by pages 18 and 19.
 *
 * They are the deck's first use of the specialist arm page 11 measured and
 * deliberately does not plot (`page11.ts:19`). All three are
 * `Qwen2.5-Math-1.5B-Instruct` under its model card's CoT system prompt,
 * greedy, cap 2048, on pages 6 to 8's own hundred MATH-500 L4/5 items, lifted
 * verbatim out of `public/notebooks/page-11-training-vs-scale.zip`.
 *
 *   fabricated_tool (page 19)  the chain says it will use "known results or
 *       computational tools", has none, supplies the tool's output from its own
 *       weights, and answers wrong. Page 19's tool-use beat is this failure
 *       followed by the citation that names its fix.
 *   contradicts_chain_sum, contradicts_chain_geometry (page 18)  the boxed
 *       answer is not the value the chain just computed. Page 18's faithfulness
 *       thread, argued for once on our own traces instead of only on published
 *       ones.
 *
 * These are specimens, not measurements. Three chains out of 2,550, chosen for
 * what they show. No number on either page is derived from them, and the pages
 * are written so that none can be: there is nothing here to average.
 *
 * The invariant this module exists to enforce is that a page can only display
 * text the run produced. `excerpt` must be a substring of `trace` and every
 * `highlights` entry a substring of `excerpt`, checked at import time, so an
 * edited quote is a load error rather than a plausible-looking lie. What the
 * pages then render is `tidyMath(excerpt)`, the same display-only tidying every
 * other measured trace in the deck goes through; `specimens.test.ts` checks the
 * highlights survive it, since a mark that stops matching would otherwise
 * vanish silently.
 */
import raw from "@data/trace-specimens.json";

export class SpecimenDataError extends Error {}

/* ------------------------------------------------------------- raw shape */

interface RawSpecimen {
  role: string;
  page: number;
  problem_id: string;
  subject: string;
  level: number;
  question: string;
  ground_truth: string;
  extracted_answer: string | null;
  correct: boolean;
  tokens_generated: number;
  truncated: boolean;
  trace: string;
  excerpt: string;
  highlights: string[];
  line_sha256: string;
}

interface RawFile {
  source: {
    bundle: string;
    member: string;
    run_id: string;
    notebook: string;
    notebook_sha256: string;
    model_id: string;
    system_prompt: string;
    band: string;
    items: string;
    decoding: { temperature: number; top_p: number | null; chain_budget: number };
    grading: { extract: string; grade: string };
    line_sha256_rule: string;
    note: string;
  };
  specimens: Record<string, RawSpecimen>;
}

const RAW = raw as unknown as RawFile;

/* ----------------------------------------------------------- public shape */

export interface Specimen {
  role: string;
  /** the page that spends it, for the cross-reference in each page's header */
  page: number;
  /** MATH-500 id, printed on the card so the reader can find it in the bundle */
  problemId: string;
  subject: string;
  level: number;
  question: string;
  groundTruth: string;
  /** what the grader pulled out of the chain; null where it found nothing */
  answer: string | null;
  correct: boolean;
  tokensGenerated: number;
  /** the whole chain, as generated. The pages show `excerpt` and say so. */
  trace: string;
  /** the shown span, a verbatim substring of `trace` */
  excerpt: string;
  /** spans inside `excerpt` the page marks, each a verbatim substring of it */
  highlights: string[];
  /** sha256 of this chain's line in the published `traces.jsonl` */
  lineSha256: string;
}

function build(role: string): Specimen {
  const s = RAW.specimens[role];
  if (!s) throw new SpecimenDataError(`trace-specimens.json carries no "${role}" specimen`);

  // The whole point of the file: what a page prints has to be what the model
  // wrote. A quote edited for flow would sail past every component test.
  if (!s.trace.includes(s.excerpt)) {
    throw new SpecimenDataError(
      `the "${role}" specimen's excerpt is not a substring of its trace`,
    );
  }
  if (s.highlights.length === 0) {
    throw new SpecimenDataError(`the "${role}" specimen marks nothing in its excerpt`);
  }
  for (const h of s.highlights) {
    if (!s.excerpt.includes(h)) {
      throw new SpecimenDataError(
        `the "${role}" specimen highlights ${JSON.stringify(h)}, which is not in its excerpt`,
      );
    }
  }
  // A specimen of a failure that the grader scored correct would be arguing the
  // opposite of what its page says.
  if (s.correct) {
    throw new SpecimenDataError(`the "${role}" specimen is graded correct; all three are failures`);
  }
  // Truncation is our budget showing, not the model's reasoning. None of these
  // three hit the cap and a replacement that did would be a different claim.
  if (s.truncated) {
    throw new SpecimenDataError(`the "${role}" specimen hit the chain cap; it measures our budget`);
  }

  return {
    role: s.role,
    page: s.page,
    problemId: s.problem_id,
    subject: s.subject,
    level: s.level,
    question: s.question,
    groundTruth: s.ground_truth,
    answer: s.extracted_answer,
    correct: s.correct,
    tokensGenerated: s.tokens_generated,
    trace: s.trace,
    excerpt: s.excerpt,
    highlights: s.highlights,
    lineSha256: s.line_sha256,
  };
}

/** Where the chains came from, for the provenance line each page prints. */
export const SPECIMEN_SOURCE = {
  bundle: RAW.source.bundle,
  runId: RAW.source.run_id,
  notebook: RAW.source.notebook,
  modelId: RAW.source.model_id,
  modelLabel: RAW.source.model_id.split("/").pop() ?? RAW.source.model_id,
  systemPrompt: RAW.source.system_prompt,
  items: RAW.source.items,
  chainBudget: RAW.source.decoding.chain_budget,
  note: RAW.source.note,
} as const;

export const SPECIMENS = {
  /** page 19: reaches for a tool it does not have, then invents its output */
  fabricatedTool: build("fabricated_tool"),
  /** page 18: derives 2, boxes 1 */
  contradictsChainSum: build("contradicts_chain_sum"),
  /** page 18: derives 15R^2/4, boxes something else again */
  contradictsChainGeometry: build("contradicts_chain_geometry"),
} as const;

/**
 * Split an excerpt into runs, marking the highlighted ones. Both the excerpt
 * and each highlight go through `tidy` first, so the caller passes `tidyMath`
 * and the split happens on the text the reader actually sees. A highlight that
 * no longer matches after tidying is dropped rather than throwing, because the
 * page still reads correctly without the mark; `specimens.test.ts` is what
 * makes that case fail loudly.
 */
export function markExcerpt(
  specimen: Specimen,
  tidy: (s: string) => string,
): { text: string; mark: boolean }[] {
  const text = tidy(specimen.excerpt);
  const needles = specimen.highlights.map(tidy).filter((h) => h.length > 0 && text.includes(h));
  if (needles.length === 0) return [{ text, mark: false }];

  const out: { text: string; mark: boolean }[] = [];
  let rest = text;
  while (rest.length > 0) {
    // The earliest remaining highlight, so overlapping marks cannot reorder the text.
    let at = -1;
    let hit = "";
    for (const n of needles) {
      const i = rest.indexOf(n);
      if (i !== -1 && (at === -1 || i < at)) {
        at = i;
        hit = n;
      }
    }
    if (at === -1) {
      out.push({ text: rest, mark: false });
      break;
    }
    if (at > 0) out.push({ text: rest.slice(0, at), mark: false });
    out.push({ text: hit, mark: true });
    rest = rest.slice(at + hit.length);
  }
  return out;
}
