/**
 * The benchmark scoreboard (page 15): published headline scores for the
 * benchmarks used to justify reasoning claims, one timeline per benchmark.
 *
 * The CurveData schema (lib/data.ts) holds one anonymous x/y series; a
 * scoreboard point additionally has to say WHICH model, WHOSE report, and
 * WHAT the asterisk is — the caveat is part of the datum here, not garnish.
 * So this file is the scoreboard's own validated loader, under the same
 * golden rule: every benchmark carries a citation and a provenance string,
 * every score carries a source, and a malformed file fails the build and the
 * tests, never ships silently.
 *
 * Since the page-15 revision this loader draws nothing. It is kept as the
 * audit trail, not as UI: page 15 still renders GPT-4o's 12 on AIME and o3's
 * 25.2-vs-10 on FrontierMath, and data/benchmark-scoreboard.json is the record
 * of where those came from. scoreboard.test.ts is the part that earns its
 * keep, cross-checking the GSM8K entries against wei-cot-scaling.json so two
 * files quoting one source cannot drift. Do not delete either as dead code.
 */
import benchmarkScoreboardRaw from "@data/benchmark-scoreboard.json";
import { DataValidationError, validateCitation, type Citation } from "./data";

export interface ScoreEntry {
  /** Calendar year; fractional part ≈ month/12 of the report. */
  x: number;
  /** Score in the benchmark's own unit (usually %, Elo for Codeforces). */
  y: number;
  model: string;
  /** Whose report the number is verbatim from. */
  source: string;
  /** The asterisk: compute settings, subset switches, disputes. */
  note?: string;
}

export interface RefLine {
  y: number;
  label: string;
}

export interface Lifespan {
  introduced: number;
  /** When the bar was passed; null while the benchmark still stands. */
  fell: number | null;
  bar: string;
}

export interface Benchmark {
  key: string;
  name: string;
  ask: string;
  status: string;
  unit: string;
  unitShort: string;
  yDomain: [number, number];
  refLines: RefLine[];
  lifespan: Lifespan | null;
  entries: ScoreEntry[];
  citation: Citation;
  provenance: string;
}

export interface Scoreboard {
  xDomain: [number, number];
  benchmarks: Benchmark[];
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function requireString(v: unknown, where: string): string {
  if (typeof v !== "string" || v.length === 0) {
    throw new DataValidationError(`${where}: required non-empty string`);
  }
  return v;
}

function requirePair(v: unknown, where: string): [number, number] {
  if (!Array.isArray(v) || v.length !== 2 || !isFiniteNumber(v[0]) || !isFiniteNumber(v[1])) {
    throw new DataValidationError(`${where}: must be [number, number]`);
  }
  return [v[0], v[1]];
}

export function parseScoreboard(raw: unknown, where = "scoreboard"): Scoreboard {
  if (typeof raw !== "object" || raw === null) {
    throw new DataValidationError(`${where}: not an object`);
  }
  const obj = raw as Record<string, unknown>;
  const xDomain = requirePair(obj.xDomain, `${where}.xDomain`);

  if (!Array.isArray(obj.benchmarks) || obj.benchmarks.length === 0) {
    throw new DataValidationError(`${where}: 'benchmarks' must be a non-empty array`);
  }

  const benchmarks: Benchmark[] = obj.benchmarks.map((b, i) => {
    const at = `${where}.benchmarks[${i}]`;
    if (typeof b !== "object" || b === null) {
      throw new DataValidationError(`${at}: not an object`);
    }
    const bench = b as Record<string, unknown>;

    if (!Array.isArray(bench.entries) || bench.entries.length === 0) {
      throw new DataValidationError(`${at}: 'entries' must be a non-empty array`);
    }
    const entries: ScoreEntry[] = bench.entries.map((e, j) => {
      const ej = `${at}.entries[${j}]`;
      if (typeof e !== "object" || e === null) {
        throw new DataValidationError(`${ej}: not an object`);
      }
      const ent = e as Record<string, unknown>;
      if (!isFiniteNumber(ent.x) || !isFiniteNumber(ent.y)) {
        throw new DataValidationError(`${ej}: needs finite x,y`);
      }
      const entry: ScoreEntry = {
        x: ent.x,
        y: ent.y,
        model: requireString(ent.model, `${ej}.model`),
        source: requireString(ent.source, `${ej}.source`),
      };
      if (ent.note !== undefined) entry.note = requireString(ent.note, `${ej}.note`);
      return entry;
    });
    for (let j = 1; j < entries.length; j++) {
      if (entries[j].x < entries[j - 1].x) {
        throw new DataValidationError(`${at}: entries must be sorted by date`);
      }
    }

    const refLines: RefLine[] = (Array.isArray(bench.refLines) ? bench.refLines : []).map(
      (r, j) => {
        const rj = r as Record<string, unknown>;
        if (typeof r !== "object" || r === null || !isFiniteNumber(rj.y)) {
          throw new DataValidationError(`${at}.refLines[${j}]: needs finite y`);
        }
        return { y: rj.y, label: requireString(rj.label, `${at}.refLines[${j}].label`) };
      },
    );

    let lifespan: Lifespan | null = null;
    if (bench.lifespan !== null && bench.lifespan !== undefined) {
      const ls = bench.lifespan as Record<string, unknown>;
      if (typeof bench.lifespan !== "object" || !isFiniteNumber(ls.introduced)) {
        throw new DataValidationError(`${at}.lifespan: needs finite 'introduced'`);
      }
      if (ls.fell !== null && !isFiniteNumber(ls.fell)) {
        throw new DataValidationError(`${at}.lifespan: 'fell' must be a number or null`);
      }
      lifespan = {
        introduced: ls.introduced,
        fell: ls.fell === null ? null : (ls.fell as number),
        bar: requireString(ls.bar, `${at}.lifespan.bar`),
      };
      if (lifespan.fell !== null && lifespan.fell < lifespan.introduced) {
        throw new DataValidationError(`${at}.lifespan: fell before introduced`);
      }
    }

    return {
      key: requireString(bench.key, `${at}.key`),
      name: requireString(bench.name, `${at}.name`),
      ask: requireString(bench.ask, `${at}.ask`),
      status: requireString(bench.status, `${at}.status`),
      unit: requireString(bench.unit, `${at}.unit`),
      unitShort: requireString(bench.unitShort, `${at}.unitShort`),
      yDomain: requirePair(bench.yDomain, `${at}.yDomain`),
      refLines,
      lifespan,
      entries,
      citation: validateCitation(bench.citation, at),
      provenance: requireString(bench.provenance, `${at}.provenance`),
    };
  });

  return { xDomain, benchmarks };
}

export const SCOREBOARD: Scoreboard = parseScoreboard(
  benchmarkScoreboardRaw,
  "benchmark-scoreboard.json",
);

/**
 * The frontier staircase: the running best-so-far, i.e. the subsequence of
 * entries that set a new record when they appeared. This is the line the
 * headlines trace; the dots below it are the scores the headlines skip.
 */
export function frontierOf(entries: ScoreEntry[]): ScoreEntry[] {
  const out: ScoreEntry[] = [];
  let best = -Infinity;
  for (const e of entries) {
    if (e.y > best) {
      best = e.y;
      out.push(e);
    }
  }
  return out;
}
