/**
 * Page 9's measured run, loaded from the notebook's committed `derived.json`.
 *
 * The boundary (notebooks/README.md): the notebook writes logs, the page reads
 * them. Nothing here recomputes a claim. `web/data/page-09-derived.json` is a
 * byte-for-byte copy of `notebooks/out/page_09/derived.json`, produced by
 * `page_09_outcome_vs_process.ipynb` from page 7's pile: 1,580 chains that the
 * model ended itself, graded step by step twice.
 *
 * This page had the sharpest defect in the deck. The old version invited the
 * reader to mark each step and then revealed what it called "the PRM's labels",
 * which were hand-written `ok` booleans in `lib/authored.ts`. Not merely
 * unchipped: attributed to a system that never ran. Every label the new page
 * reveals comes from one of two graders that did run, and the manifest records
 * which one produced which.
 *
 * Page 9's `derived.json` carries an explicit `claims` block, so the gates below
 * are read rather than recomputed, and a run that fails one is a load error here
 * rather than a conditional in the component.
 *
 * The blocking gates are the notebook's own five:
 *
 *   · `same_population_as_page_7` — the same hundred problems, so pages 6 to 9
 *     describe one population rather than four
 *   · `every_chain_ended_itself` — no chain was cut at our cap. A chain WE ended
 *     is our experiment, not the model's reasoning, and grading one would report
 *     our own cap as its error
 *   · `detection_measurable` / `localisation_has_a_population` — both beats have
 *     something to measure over
 *   · `specimens_complete` — all three roles filled with real traces. A missing
 *     role may NOT be filled with an authored one; that is the defect this page
 *     exists to remove, and silently falling back would reintroduce it
 *
 * Two claims came back FALSE on the shipped run, and both change what the page
 * says rather than whether it ships:
 *
 *   · `localisation_survives_segmentation` — false. Detection barely moves when
 *     the segmentation rule changes (0 points) because the checker splits on
 *     newlines itself, but localisation is a ratio of step POSITIONS and moves by
 *     up to 25. So beat two quotes its median with that spread attached, and
 *     `localisationSpreadPts` exists to make omitting it awkward.
 *   · `step_filter_helps_selection` — false. Filtering candidates by their
 *     working moved one problem in a hundred. The page reports the null.
 *
 * The consistency assertions are the cross-language check in miniature: the
 * specimen roles have to be what they claim (the lucky one right with a false
 * step, the broken one wrong with exactly one, the clean one right with none),
 * and the step counts have to sum to the labels the notebook tallied. A copy of
 * the wrong run into `web/data/` fails the build rather than drawing a plausible
 * wrong reveal.
 */
import rawDerived from "@data/page-09-derived.json";
import rawBestOfN from "@data/page-09-best-of-n.json";
import { pct, tidyMath } from "./traceText";

export { pct, tidyMath };

export class Page09DataError extends Error {}

/* --------------------------------------------------------------- raw shape */

type CheckLabel = "true" | "false" | "unknown";

interface RawStep {
  text: string;
  check: CheckLabel;
  claim: string | null;
  prm?: number;
  prm_label?: "true" | "false";
}

interface RawSpecimen {
  role: string;
  problem_id: string;
  level: number;
  question: string;
  ground_truth: string;
  extracted_answer: string | null;
  outcome_correct: boolean;
  steps: RawStep[];
  first_false: number | null;
  n_false: number;
  prm_scored: boolean;
  prm_labels_published: boolean;
}

interface RawDerived {
  claims: Record<string, boolean>;
  headline: {
    detection_checker: {
      n_right_chains: number;
      n_contaminated: number;
      rate: number;
      n_problems: number;
      n_problems_with_a_right_chain: number;
    };
    detection_prm: {
      rate: number;
      n_chains_scored: number;
      auc: number;
      threshold: number;
    } | null;
    localisation: {
      median_share_sound: number | null;
      segmentation_spread_pts: number | null;
      share_sound_on_subsample: { n_chains: number; low: number; high: number };
      n_localisable: number;
      n_wrong: number;
      n_problems: number;
      share_with_one_false_step: number | null;
    };
    selection: {
      n_problems: number;
      majority: number;
      majority_after_step_filter: number;
      delta_pts: number;
      n_problems_changed: number;
    } | null;
    step_labels: Record<CheckLabel, number>;
    n_chains: number;
  };
  localisation: { n_false_distribution: Record<string, number> };
  detection: {
    /**
     * The run's own independent unit. Chains repeat the same problem, so the
     * chain rate is clustered and the page must be able to quote the problem one.
     */
    problem_rate: number;
    unit_of_independence: string;
    /**
     * The denominator the base rate does not have. `n_right` counts every chain
     * that reached the right answer, including the ones where the checker had no
     * closed-form numeric claim to read and was silent BY CONSTRUCTION rather
     * than because the chain was sound.
     */
    n_right_reachable: number;
    reachable_rate: number;
    /** Chains carrying no closed-form numeric claim anywhere. The median chain is one. */
    n_chains_with_no_checkable_step: number;
    share_chains_with_no_checkable_step: number;
  };
  prm_reliability: {
    auc: number;
    threshold: number;
    threshold_source: string;
    /** [lowest, highest, count] of the cut-offs that fitted about as well. */
    threshold_plateau: [number, number, number];
    agreement: number;
    recall_on_false: number;
    specificity_on_true: number;
    n_steps_compared: number;
  } | null;
  prm_reported_on_page: boolean;
  filter_audit: { n_kept: number; n_dropped: number; kept_outcome_accuracy: number };
  specimens: Record<string, RawSpecimen>;
  missing_roles: string[];
  manifest: {
    timestamp_utc: string;
    chains: {
      generator: string;
      n: number;
      temperature: number | null;
      top_p: number | null;
      chain_budget: number;
      decoding: string;
      page_07_config_id?: string;
    };
    items: { n: number; filter: string };
    graders: {
      prm: {
        id: string;
        quantisation: string;
        reliability_vs_checker: { auc: number } | null;
      } | null;
    };
    step_segmentation: { min_step_chars: number };
  };
}

const raw = rawDerived as unknown as RawDerived;

/* -------------------------------------------------------------------- gates */

const BLOCKING = [
  "same_population_as_page_7",
  "every_chain_ended_itself",
  "detection_measurable",
  "localisation_has_a_population",
  "specimens_complete",
] as const;

for (const claim of BLOCKING) {
  if (raw.claims[claim] !== true) {
    throw new Page09DataError(
      `page-09-derived.json fails the notebook's blocking claim "${claim}". ` +
        `That run may not be translated to a page: see docs/page_9_refactor.md.`,
    );
  }
}

if (raw.missing_roles.length > 0) {
  throw new Page09DataError(
    `page-09-derived.json is missing specimen role(s): ${raw.missing_roles.join(", ")}. ` +
      `A missing role may not be filled with an authored trace.`,
  );
}

/* ------------------------------------------------------- consistency checks */

function specimen(role: string): RawSpecimen {
  const hit = raw.specimens[role];
  if (!hit) throw new Page09DataError(`page-09-derived.json bundles no "${role}" specimen`);
  if (hit.steps.length === 0) {
    throw new Page09DataError(`the "${role}" specimen has no steps to reveal`);
  }
  const counted = hit.steps.filter((s) => s.check === "false").length;
  if (counted !== hit.n_false) {
    throw new Page09DataError(
      `the "${role}" specimen says ${hit.n_false} false step(s) but carries ${counted}`,
    );
  }
  return hit;
}

const lucky = specimen("lucky");
const broken = specimen("broken");
const clean = specimen("clean");

// Each role has to be what the page says it is, because the page's whole argument
// is the contrast between them. A mislabelled role would teach the opposite lesson.
if (!lucky.outcome_correct || lucky.n_false === 0) {
  throw new Page09DataError(
    "the lucky specimen must reach the RIGHT answer and still contain a false step",
  );
}
if (broken.outcome_correct || broken.first_false === null) {
  throw new Page09DataError(
    "the broken specimen must reach the WRONG answer with a findable break",
  );
}
if (!clean.outcome_correct || clean.n_false !== 0) {
  throw new Page09DataError(
    "the clean specimen must reach the right answer with nothing proven false",
  );
}

// Every step the page reveals as false must carry the claim that was judged. The
// reveal points at the claim, not at the step: a step can open with two true lines
// and break on the third, and highlighting the step would point at the wrong words.
for (const sp of [lucky, broken, clean]) {
  for (const step of sp.steps) {
    if (step.check !== "unknown" && !step.claim) {
      throw new Page09DataError(
        `a judged step in the "${sp.role}" specimen carries no claim to point at`,
      );
    }
    // The page says the PRM never declines. A published specimen with a scoreless
    // step would make that sentence false, so it may not load.
    if (sp.prm_labels_published && (typeof step.prm !== "number" || !step.prm_label)) {
      throw new Page09DataError(
        `the "${sp.role}" specimen publishes PRM labels but a step is missing one`,
      );
    }
  }
}

const labels = raw.headline.step_labels;
const totalSteps = labels.true + labels.false + labels.unknown;
if (totalSteps <= 0) {
  throw new Page09DataError("page-09-derived.json tallies no steps at all");
}

const det = raw.headline.detection_checker;
if (det.n_contaminated > det.n_right_chains) {
  throw new Page09DataError("more contaminated chains than correct chains");
}
/* The reachable population is a subset of the right chains, and every chain the
   checker convicted is one it could read. A run that violated either would make
   the conditional rate on the page arithmetic nonsense rather than a tighter
   reading of the same finding. */
if (raw.detection.n_right_reachable > det.n_right_chains) {
  throw new Page09DataError("more readable right chains than right chains");
}
if (det.n_contaminated > raw.detection.n_right_reachable) {
  throw new Page09DataError("more contaminated chains than the checker could read");
}
if (raw.detection.n_chains_with_no_checkable_step > raw.headline.n_chains) {
  throw new Page09DataError("more unreadable chains than chains");
}

const loc = raw.headline.localisation;
if (loc.n_localisable > loc.n_wrong) {
  throw new Page09DataError("more localisable chains than wrong chains");
}
if (loc.median_share_sound === null) {
  throw new Page09DataError("no median share-sound, so beat two has nothing to state");
}

/**
 * How gradable the three published specimens are against the pile they came
 * from. This is the one figure on the page NOT taken from the notebook: it is
 * computed here from the specimens the notebook did publish, because the
 * comparison is a property of what the page chose to show rather than of the
 * run.
 *
 * It exists because the specimens are not typical and cannot be. Section 10
 * picks them BY ROLE ("a right answer with a false step in it"), and a role
 * like that can only be filled by a chain the checker could read, so the
 * selection guarantees the shown chains are more gradable than the pile. On
 * the shipped run the specimens are about half checkable and the pile is
 * 5.8%, and a reader who hand-grades three specimens and then meets the
 * population figure has no way to reconcile them unless the page says this.
 */
const specimenSteps = [lucky, broken, clean].flatMap((sp) => sp.steps);
if (specimenSteps.length === 0) {
  throw new Page09DataError("no specimen steps to measure the specimens' reach against");
}
const specimenReach = {
  stepsTotal: specimenSteps.length,
  stepsCheckable: specimenSteps.filter((s) => s.check !== "unknown").length,
  shareCheckable: specimenSteps.filter((s) => s.check !== "unknown").length / specimenSteps.length,
};

/* ------------------------------------------------------------------ exports */

export interface Step {
  text: string;
  /** What the arithmetic checker concluded. `unknown` means it declined to judge. */
  check: CheckLabel;
  /** The exact claim that was judged, which is what the reveal points at. */
  claim: string | null;
  /** The PRM's score, only when the run's PRM cleared its gate. */
  prm: number | null;
  /**
   * The PRM's verdict at the notebook's fitted threshold, published per step so
   * the page never re-derives it from the score. Unlike the checker, the PRM has
   * one on every step: it never declines.
   */
  prmVerdict: "true" | "false" | null;
}

export interface Specimen {
  role: string;
  question: string;
  groundTruth: string;
  answer: string | null;
  outcomeCorrect: boolean;
  steps: Step[];
  firstFalse: number | null;
  nFalse: number;
  /** The share of the chain that stands once process grading points at the break. */
  shareSound: number | null;
}

const asSpecimen = (r: RawSpecimen): Specimen => ({
  role: r.role,
  question: r.question,
  groundTruth: r.ground_truth,
  answer: r.extracted_answer,
  outcomeCorrect: r.outcome_correct,
  steps: r.steps.map((s) => ({
    text: s.text,
    check: s.check,
    claim: s.claim,
    prm: r.prm_labels_published && typeof s.prm === "number" ? s.prm : null,
    prmVerdict: r.prm_labels_published && s.prm_label ? s.prm_label : null,
  })),
  firstFalse: r.first_false,
  nFalse: r.n_false,
  shareSound:
    r.first_false !== null && r.steps.length > 0 ? r.first_false / r.steps.length : null,
});

const prm = raw.prm_reported_on_page ? raw.prm_reliability : null;

export const PAGE9 = {
  /** The run itself, for the provenance chip. */
  run: {
    model: raw.manifest.chains.generator,
    chains: raw.manifest.chains.n,
    items: raw.manifest.items.n,
    temperature: raw.manifest.chains.temperature,
    topP: raw.manifest.chains.top_p,
    chainCap: raw.manifest.chains.chain_budget,
    decoding: raw.manifest.chains.decoding,
    date: raw.manifest.timestamp_utc.slice(0, 10),
    minStepChars: raw.manifest.step_segmentation.min_step_chars,
  },

  /** The three specimens the reveal is built from. */
  lucky: asSpecimen(lucky),
  broken: asSpecimen(broken),
  clean: asSpecimen(clean),

  /**
   * How gradable those three are next to the pile. Derived here, not measured
   * by the notebook: see the note above `specimenReach`.
   */
  specimenReach,

  /** Beat one: how often outcome grading rewards a chain with a false step in it. */
  detection: {
    nRightChains: det.n_right_chains,
    nContaminated: det.n_contaminated,
    rate: det.rate,
    nProblems: det.n_problems,
    nProblemsWithARightChain: det.n_problems_with_a_right_chain,
    /**
     * The same count taken over problems rather than chains. The run names the
     * problem as its unit of independence, so the page quotes this beside the
     * chain rate rather than letting the chain rate stand as "the" rate.
     */
    problemRate: raw.detection.problem_rate,
    /**
     * What the checker could actually look at. 479 of the 747 right chains carry
     * no closed-form numeric claim anywhere, so the published rate divides by a
     * population it was silent on. Both belong on the page: the unconditional
     * rate for comparability with the PRM, which scores every chain, and this one
     * for what the instrument read.
     */
    nRightReachable: raw.detection.n_right_reachable,
    reachableRate: raw.detection.reachable_rate,
    /** Chains with nothing checkable in them at all, over the whole graded pile. */
    nChainsUnreadable: raw.detection.n_chains_with_no_checkable_step,
    shareChainsUnreadable: raw.detection.share_chains_with_no_checkable_step,
    /** The pile those two are taken over, so a page can print "N of M". */
    nChainsGraded: raw.headline.n_chains,
    /** The PRM's rate, present only when its measured reliability cleared the gate. */
    prm: raw.headline.detection_prm
      ? {
          rate: raw.headline.detection_prm.rate,
          auc: raw.headline.detection_prm.auc,
          nChains: raw.headline.detection_prm.n_chains_scored,
        }
      : null,
  },

  /** Beat two: how much of a wrong chain was sound before it broke. */
  localisation: {
    medianShareSound: loc.median_share_sound,
    /**
     * How far that median moves when the segmentation rule changes. The page must
     * quote this beside the median: on the shipped run it is 25 points, and the
     * notebook's `localisation_survives_segmentation` claim is false because of it.
     */
    spreadPts: loc.segmentation_spread_pts,
    /**
     * Where the four segmentations actually landed, on the subsample they were
     * run over. The spread alone reads as a band around the median, and it is
     * not one: none of the four re-cuts produced the median itself.
     */
    subsample: {
      nChains: loc.share_sound_on_subsample.n_chains,
      low: loc.share_sound_on_subsample.low,
      high: loc.share_sound_on_subsample.high,
    },
    survivesSegmentation: raw.claims.localisation_survives_segmentation === true,
    nLocalisable: loc.n_localisable,
    nWrong: loc.n_wrong,
    nProblems: loc.n_problems,
    shareWithOneFalseStep: loc.share_with_one_false_step,
    breaksPerChain: raw.localisation.n_false_distribution,
  },

  /** Beat three: the process-aware selector, which came back null. */
  selection: raw.headline.selection
    ? {
        nProblems: raw.headline.selection.n_problems,
        majority: raw.headline.selection.majority,
        filtered: raw.headline.selection.majority_after_step_filter,
        deltaPts: raw.headline.selection.delta_pts,
        nChanged: raw.headline.selection.n_problems_changed,
        helps: raw.claims.step_filter_helps_selection === true,
      }
    : null,

  /** What the two graders could and could not see, which is the page's honesty. */
  graders: {
    stepsTotal: totalSteps,
    stepsJudged: labels.true + labels.false,
    stepsFalse: labels.false,
    shareUnjudged: labels.unknown / totalSteps,
    prm: prm
      ? {
          id: raw.manifest.graders.prm?.id ?? "",
          quantisation: raw.manifest.graders.prm?.quantisation ?? "",
          auc: prm.auc,
          agreement: prm.agreement,
          recallOnFalse: prm.recall_on_false,
          specificityOnTrue: prm.specificity_on_true,
          nStepsCompared: prm.n_steps_compared,
          threshold: prm.threshold,
          thresholdSource: prm.threshold_source,
          /** How many cut-offs fitted about as well, and the range they span. */
          thresholdPlateauCount: prm.threshold_plateau[2],
          thresholdPlateauSpan: prm.threshold_plateau[1] - prm.threshold_plateau[0],
        }
      : null,
  },

  /** What the natural-ending filter selected away, for the caveat. */
  filter: {
    kept: raw.filter_audit.n_kept,
    dropped: raw.filter_audit.n_dropped,
    keptAccuracy: raw.filter_audit.kept_outcome_accuracy,
  },

  claims: raw.claims,
} as const;

/* ------------------------------------------------ best-of-N on the sweep's chains */

interface RawBreakGroup {
  chains: number;
  no_low_step: number;
  bins: number[];
  share_with_low_step: number;
  median_share_after: number;
  tokens_after: number;
}

interface RawBestOfN {
  temperature: number;
  n_problems: number;
  n_chains: number;
  prm_model: string;
  bars: { one_chain: number; vote: number; orm: number | null; prm: number };
  prm_rules_at_16: { weakest_step: number; last_step: number; product_of_steps: number };
  vote_ties_at_16: number;
  disagreements_at_16: { prm_only: number; prm_only_on_a_tied_vote: number; vote_only: number };
  prm_lead_at_16_by_temperature: Record<string, number>;
  breaks: {
    main_cut: number;
    by_cut: Record<string, { right: RawBreakGroup; wrong: RawBreakGroup }>;
  };
}

const bestOfN = rawBestOfN as unknown as RawBestOfN;

// Every chain lands in exactly one bar of the break figure, or the figure is
// drawing a different set of chains from the numbers beside it.
for (const [cut, groups] of Object.entries(bestOfN.breaks.by_cut)) {
  for (const [name, g] of Object.entries(groups)) {
    if (g.bins.length !== 10 || g.bins.reduce((a, b) => a + b, 0) + g.no_low_step !== g.chains) {
      throw new Page09DataError(`the break bins for the ${name} chains at cut ${cut} do not sum to the chains`);
    }
  }
}
if (!bestOfN.breaks.by_cut[String(bestOfN.breaks.main_cut)]) {
  throw new Page09DataError("page-09-best-of-n.json has no break counts at its own main cut");
}

/** Sections 3 and 4: every judge on the same chains, from the scored traces. */
export const BEST_OF_N = {
  temperature: bestOfN.temperature,
  nProblems: bestOfN.n_problems,
  nChains: bestOfN.n_chains,
  prmName: bestOfN.prm_model.split("/").pop()!,
  bars: bestOfN.bars,
  rules: bestOfN.prm_rules_at_16,
  disagreements: bestOfN.disagreements_at_16,
  leadByTemperature: Object.values(bestOfN.prm_lead_at_16_by_temperature),
  breaks: { mainCut: String(bestOfN.breaks.main_cut), byCut: bestOfN.breaks.by_cut },
} as const;
