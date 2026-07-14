/**
 * Validated curve registry. Every pre-computed data file is imported here and
 * run through the schema validator AT LOAD TIME, so a file missing a citation
 * or provenance — or a malformed point — fails the build and the tests, never
 * ships silently. This is the runtime half of the data-fidelity guardrail.
 */
import { parseCurveData, type CurveData } from "./data";
import selfConsistencyRaw from "@data/self-consistency.json";
import chainOfThoughtRaw from "@data/chain-of-thought.json";

export const curves: Record<string, CurveData> = {
  selfConsistency: parseCurveData(selfConsistencyRaw, "self-consistency.json"),
  chainOfThought: parseCurveData(chainOfThoughtRaw, "chain-of-thought.json"),
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
