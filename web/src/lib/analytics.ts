/**
 * Engagement analytics for formative user testing (M8).
 *
 * The store records one interaction per genuine manipulation (not scrolling).
 * These pure helpers turn that raw record into the metrics the study needs:
 * per-page manipulation rate, the "did they touch this sim" flag, and the
 * completion signal — plus the 50%-manipulation change trigger from the plan.
 */
import { PAGES } from "./pages";

export interface EngagementReport {
  pagesManipulated: number;
  totalPages: number;
  manipulationRate: number; // fraction of pages the reader actually manipulated
  reachedEnd: boolean;
  /** Pages below the 50% manipulation threshold need their control redesigned. */
  underThresholdPages: number[];
}

/**
 * @param interactions per-page interaction counts (from the store)
 * @param cohortSize   number of test participants (for aggregate rates); default 1
 * @param perPageManipulators optional: how many participants manipulated each page
 */
export function engagementReport(
  interactions: Record<number, number>,
  perPageManipulators?: Record<number, number>,
  cohortSize = 1,
): EngagementReport {
  const totalPages = PAGES.length;
  const manipulated = PAGES.filter((p) => (interactions[p.n] ?? 0) > 0);

  // The plan's change trigger: any simulation manipulated by < 50% of the cohort
  // must be redesigned so its control is the first thing readers touch.
  const underThreshold = perPageManipulators
    ? PAGES.filter((p) => (perPageManipulators[p.n] ?? 0) / cohortSize < 0.5).map((p) => p.n)
    : [];

  return {
    pagesManipulated: manipulated.length,
    totalPages,
    manipulationRate: manipulated.length / totalPages,
    reachedEnd: (interactions[20] ?? 0) > 0,
    underThresholdPages: underThreshold,
  };
}

export interface LearningGain {
  pre: number;
  post: number;
  delta: number;
  improved: boolean;
}

export function learningGain(pre: number, post: number): LearningGain {
  return { pre, post, delta: post - pre, improved: post > pre };
}
