/**
 * Pure, testable math for Page 3's daily-retraining hypotheticals. Every
 * constant comes off the validated curve registry (no free-floating numbers):
 * the $78M per-run anchor (Epoch AI via AI Index 2024) and the x2.4/year
 * training-cost trend (Cottier et al. 2024, Epoch AI). All outputs are in
 * $ MILLIONS and labeled DERIVED in-app.
 */
import { curves } from "./curves";

export const RUN_COST_USDM = curves.epochRunCost.fit!.params.usdMillionPerRun;
export const COST_GROWTH_PER_YEAR = curves.epochTrainingCosts.fit!.params.perYear;

/** Cumulative $M after `days` of retraining the SAME model once per day. */
export function sameModelCumulativeUSDM(days: number): number {
  return days * RUN_COST_USDM;
}

/**
 * Cumulative $M after `months` of one run per day where the per-run price
 * rides Epoch's x2.4/year training-cost trend (the dollar shadow of frontier
 * compute growing ~5x/year): continuous-compounding approximation of
 * sum(78 x 2.4^t) = 78 x 365 x (2.4^y - 1) / ln 2.4.
 */
export function frontierCumulativeUSDM(months: number): number {
  const years = months / 12;
  const g = Math.log(COST_GROWTH_PER_YEAR);
  return (RUN_COST_USDM * 365 * (Math.pow(COST_GROWTH_PER_YEAR, years) - 1)) / g;
}
