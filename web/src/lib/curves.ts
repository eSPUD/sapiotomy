/**
 * Validated curve registry. Every pre-computed data file is imported here and
 * run through the schema validator AT LOAD TIME, so a file missing a citation
 * or provenance — or a malformed point — fails the build and the tests, never
 * ships silently. This is the runtime half of the data-fidelity guardrail.
 */
import { parseCurveData, type CurveData } from "./data";
import selfConsistencyRaw from "@data/self-consistency.json";
import chainOfThoughtRaw from "@data/chain-of-thought.json";
import votingPlateauRaw from "@data/voting-plateau.json";
import prmVsOrmRaw from "@data/prm-vs-orm.json";
import treeOfThoughtsRaw from "@data/tree-of-thoughts.json";
import coverageScalingRaw from "@data/coverage-scaling.json";
import computeOptimalRaw from "@data/compute-optimal.json";
import budgetForcingRaw from "@data/budget-forcing.json";
import deepseekTrainingRaw from "@data/deepseek-r1-training.json";
import arcCostRaw from "@data/arc-cost.json";
import overthinkingRaw from "@data/overthinking.json";
import faithfulnessRaw from "@data/faithfulness.json";
import illusionRaw from "@data/illusion-of-thinking.json";
import epochTrainingCostsRaw from "@data/epoch-training-costs.json";
import epochRunCostRaw from "@data/epoch-run-cost.json";
import epochComputeGrowthRaw from "@data/epoch-compute-growth.json";
import epochDataStockRaw from "@data/epoch-data-stock.json";
import chinchillaRaw from "@data/chinchilla.json";
import epochInferencePricesRaw from "@data/epoch-inference-prices.json";
import queryEnergyRaw from "@data/query-energy.json";

export const curves: Record<string, CurveData> = {
  selfConsistency: parseCurveData(selfConsistencyRaw, "self-consistency.json"),
  chainOfThought: parseCurveData(chainOfThoughtRaw, "chain-of-thought.json"),
  votingPlateau: parseCurveData(votingPlateauRaw, "voting-plateau.json"),
  prmVsOrm: parseCurveData(prmVsOrmRaw, "prm-vs-orm.json"),
  treeOfThoughts: parseCurveData(treeOfThoughtsRaw, "tree-of-thoughts.json"),
  coverageScaling: parseCurveData(coverageScalingRaw, "coverage-scaling.json"),
  computeOptimal: parseCurveData(computeOptimalRaw, "compute-optimal.json"),
  budgetForcing: parseCurveData(budgetForcingRaw, "budget-forcing.json"),
  deepseekTraining: parseCurveData(deepseekTrainingRaw, "deepseek-r1-training.json"),
  arcCost: parseCurveData(arcCostRaw, "arc-cost.json"),
  overthinking: parseCurveData(overthinkingRaw, "overthinking.json"),
  faithfulness: parseCurveData(faithfulnessRaw, "faithfulness.json"),
  illusion: parseCurveData(illusionRaw, "illusion-of-thinking.json"),
  epochTrainingCosts: parseCurveData(epochTrainingCostsRaw, "epoch-training-costs.json"),
  epochRunCost: parseCurveData(epochRunCostRaw, "epoch-run-cost.json"),
  epochComputeGrowth: parseCurveData(epochComputeGrowthRaw, "epoch-compute-growth.json"),
  epochDataStock: parseCurveData(epochDataStockRaw, "epoch-data-stock.json"),
  chinchilla: parseCurveData(chinchillaRaw, "chinchilla.json"),
  epochInferencePrices: parseCurveData(epochInferencePricesRaw, "epoch-inference-prices.json"),
  queryEnergy: parseCurveData(queryEnergyRaw, "query-energy.json"),
};

/** Linear interpolation of y at an arbitrary x along a curve's points. */
export function interpolate(curve: CurveData, x: number): number {
  const pts = curve.points;
  if (x <= pts[0].x) return pts[0].y;
  if (x >= pts[pts.length - 1].x) return pts[pts.length - 1].y;
  for (let i = 1; i < pts.length; i++) {
    if (x <= pts[i].x) {
      const a = pts[i - 1];
      const b = pts[i];
      const t = (x - a.x) / (b.x - a.x);
      return a.y + t * (b.y - a.y);
    }
  }
  return pts[pts.length - 1].y;
}
