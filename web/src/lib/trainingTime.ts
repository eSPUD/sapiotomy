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
  /** A shorter name for the chart, where the full one would crowd its neighbours. */
  label?: string;
  /** The row's Model field in Epoch's database. */
  epochModel: string;
  organization: string;
  /** Short developer name for the detail line, e.g. "Google". */
  developer: string;
  /** Epoch's Publication date, ISO yyyy-mm-dd. */
  released: string;
  /** Epoch's Training time (hours); for a row with none, its chip-hours over its chip count. */
  epochHours: number;
  /** Epoch's Training chip-hours and Hardware quantity, present only when epochHours comes from them. */
  epochChipHours?: number;
  epochChips?: number;
  /** epochHours / 24, rounded to 0.1 day. */
  days: number;
  basis: TrainingTimeBasis;
  /** Epoch's Parameters field (total parameters), or null where Epoch leaves it blank. */
  epochParams: number | null;
  /** False where the developer never published a size (Epoch's figure, if any, is a rumor). */
  sizeDisclosed: boolean;
  /** One short plain sentence on how the number is known, summarizing epochNote. */
  how: string;
  /** Where the developer stated it (reported, derived) or Epoch's database (estimate). */
  source: { label: string; url: string };
  epochConfidence: string;
  /** Epoch's Training time notes, whitespace collapsed. */
  epochNote: string;
}

export interface TrainingTimeModelPoint extends TrainingTimeModel {
  /** Release date as a fractional year, the chart's x. */
  x: number;
}

const BASES: readonly TrainingTimeBasis[] = ["reported", "derived", "estimate"];

/** Model-size bins, smallest first, each with its upper bound in parameters. */
export const SIZE_BINS = [
  { label: "under 10B", below: 1e10 },
  { label: "10B to 100B", below: 1e11 },
  { label: "100B to 500B", below: 5e11 },
  { label: "500B and up", below: Infinity },
] as const;

/** A model's size bin (0 smallest to 3 largest), or null when its size was never disclosed. */
export function sizeBin(m: Pick<TrainingTimeModel, "epochParams" | "sizeDisclosed">): number | null {
  if (!m.sizeDisclosed || m.epochParams === null) return null;
  return SIZE_BINS.findIndex((b) => m.epochParams! < b.below);
}

/** "175B", "1.6T", "355M". */
export function fmtParams(p: number): string {
  if (p >= 1e12) return `${(p / 1e12).toFixed(1).replace(/\.0$/, "")}T`;
  if (p >= 1e11) return `${Math.round(p / 1e9)}B`;
  if (p >= 1e9) return `${(p / 1e9).toFixed(1).replace(/\.0$/, "")}B`;
  return `${Math.round(p / 1e6)}M`;
}

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
    if (!m.developer || !m.how || !m.source?.label || !/^https:\/\//.test(m.source?.url ?? "")) {
      throw new DataValidationError(`${where}: ${m.name} needs developer, how and a source link`);
    }
    if (m.basis === "estimate" && !/estimate/i.test(m.how)) {
      throw new DataValidationError(`${where}: ${m.name} is an estimate, and its 'how' line must say so`);
    }
    if (m.sizeDisclosed && !(typeof m.epochParams === "number" && m.epochParams > 0)) {
      throw new DataValidationError(`${where}: ${m.name} has a disclosed size but no parameter count`);
    }
    if (!BASES.includes(m.basis)) {
      throw new DataValidationError(`${where}: models[${i}] has unknown basis '${m.basis}'`);
    }
    if (
      (m.epochChipHours !== undefined || m.epochChips !== undefined) &&
      !(m.epochChipHours! / m.epochChips! === m.epochHours)
    ) {
      throw new DataValidationError(`${where}: ${m.name} hours are not Epoch's chip-hours / chips`);
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
