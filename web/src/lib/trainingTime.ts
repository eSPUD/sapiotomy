/**
 * Page 3, section b: how long popular LLMs took to train, one row per model,
 * every value copied from Epoch AI's "Data on AI Models" (Training time field).
 *
 * The file goes through the shared curve validator (citation + provenance +
 * finite points), and this loader adds the per-model rows the scatter labels
 * need. It refuses a file whose points and rows disagree, so a hand edit to one
 * cannot drift from the other.
 */
import { DataValidationError, parseCurveData, type CurveData } from "./data";
import raw from "@data/epoch-training-time.json";

/** How the duration is known. "reported" and "derived" rest on the developer's
 *  own figures; "estimate" is Epoch's estimate or a third-party figure it records. */
export type TrainingTimeBasis = "reported" | "derived" | "estimate";

export interface TrainingTimeModel {
  /** Name as the page prints it. */
  name: string;
  /** The row's Model field in Epoch's database. */
  epochModel: string;
  organization: string;
  /** Epoch's Publication date, ISO yyyy-mm-dd. */
  released: string;
  /** Epoch's Training time (hours). */
  epochHours: number;
  /** epochHours / 24, rounded to 0.1 day. */
  days: number;
  basis: TrainingTimeBasis;
  epochConfidence: string;
  /** Epoch's Training time notes, whitespace collapsed. */
  epochNote: string;
}

export interface TrainingTimeModelPoint extends TrainingTimeModel {
  /** Release date as a fractional year, the chart's x. */
  x: number;
}

const BASES: readonly TrainingTimeBasis[] = ["reported", "derived", "estimate"];

/** An ISO date as a fractional year, e.g. 2023-03-15 -> 2023.2. */
export function fractionalYear(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  const start = Date.UTC(y, 0, 1);
  const days = (Date.UTC(y + 1, 0, 1) - start) / 86_400_000;
  return y + (Date.UTC(y, m - 1, d) - start) / 86_400_000 / days;
}

/** Validate the per-model rows against the file's points. Exported for tests. */
export function parseModels(value: unknown, curve: CurveData): TrainingTimeModelPoint[] {
  const where = "epoch-training-time.json";
  if (!Array.isArray(value) || value.length !== curve.points.length) {
    throw new DataValidationError(`${where}: 'models' must match 'points' one to one`);
  }
  return value.map((m: TrainingTimeModel, i) => {
    if (!m.name || !m.epochModel || !/^\d{4}-\d{2}-\d{2}$/.test(m.released)) {
      throw new DataValidationError(`${where}: models[${i}] needs name, epochModel, released`);
    }
    if (!BASES.includes(m.basis)) {
      throw new DataValidationError(`${where}: models[${i}] has unknown basis '${m.basis}'`);
    }
    if (Math.abs(m.days - Math.round((m.epochHours / 24) * 10) / 10) > 1e-9) {
      throw new DataValidationError(`${where}: ${m.name} days is not Epoch's hours / 24`);
    }
    const x = fractionalYear(m.released);
    const p = curve.points[i];
    if (Math.abs(p.x - x) > 1e-3 || p.y !== m.days) {
      throw new DataValidationError(`${where}: points[${i}] does not match ${m.name}`);
    }
    return { ...m, x };
  });
}

export const trainingTimeCurve = parseCurveData(raw, "epoch-training-time.json");
export const trainingTimeModels = parseModels(
  (raw as { models?: unknown }).models,
  trainingTimeCurve,
);
