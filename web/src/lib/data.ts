/**
 * Data loader + schema validation for the pre-computed published curves.
 *
 * GOLDEN RULE (task_list.md): lock every simulation to a cited data point before
 * building its UI. Every data file MUST carry a `citation` and a `provenance`
 * string; the loader rejects any file missing either. This is the code-level
 * guardrail against the "invented curve" failure mode.
 */
export interface Citation {
  /** Short reference, e.g. "Wang et al. 2022". */
  ref: string;
  /** Canonical URL (arXiv / DOI / blog). */
  url: string;
  /** Publication venue, e.g. "ICLR 2023" or "arXiv". */
  venue: string;
  /** True when the source is a preprint / non-peer-reviewed — flagged in-app. */
  preprint: boolean;
}

export interface DataPoint {
  x: number;
  y: number;
}

export interface CurveData {
  points: DataPoint[];
  /** Optional fitted-function description for smooth interpolation. */
  fit?: { kind: string; params: Record<string, number> };
  citation: Citation;
  /**
   * Optional uncertainty interval around `points`, e.g. the 5th/95th percentiles
   * of a projection. Kept beside the points rather than inside `params`, which
   * callers treat as numbers.
   */
  band?: { lower: DataPoint[]; upper: DataPoint[] };
  /**
   * Optional per-point annotations, keyed by the point's x as a string, e.g.
   * which system held a record in a given year. Values are strings, so they stay
   * out of `params`, which callers treat as numbers and do arithmetic on.
   */
  labels?: Record<string, string>;
  /** How the points were obtained (figure/table + extraction method). */
  provenance: string;
}

export class DataValidationError extends Error {}

/** Validate a non-empty array of finite {x,y} points. Shared by `points` and the
 *  optional band bounds so both reject the same malformed input. */
function parsePoints(value: unknown, where: string): DataPoint[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new DataValidationError(`${where} must be a non-empty array`);
  }
  return value.map((p, i) => {
    if (typeof p !== "object" || p === null) {
      throw new DataValidationError(`${where}[${i}] is not an object`);
    }
    const pt = p as Record<string, unknown>;
    if (!isFiniteNumber(pt.x) || !isFiniteNumber(pt.y)) {
      throw new DataValidationError(`${where}[${i}] needs finite x,y`);
    }
    return { x: pt.x, y: pt.y };
  });
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

export function validateCitation(c: unknown, where: string): Citation {
  if (typeof c !== "object" || c === null) {
    throw new DataValidationError(`${where}: missing 'citation'`);
  }
  const cit = c as Record<string, unknown>;
  if (typeof cit.ref !== "string" || cit.ref.length === 0) {
    throw new DataValidationError(`${where}: citation.ref is required`);
  }
  if (typeof cit.url !== "string" || cit.url.length === 0) {
    throw new DataValidationError(`${where}: citation.url is required`);
  }
  if (typeof cit.venue !== "string" || cit.venue.length === 0) {
    throw new DataValidationError(`${where}: citation.venue is required`);
  }
  if (typeof cit.preprint !== "boolean") {
    throw new DataValidationError(`${where}: citation.preprint (boolean) is required`);
  }
  return cit as unknown as Citation;
}

/**
 * Validate an untrusted object against the CurveData schema. Throws
 * DataValidationError on any missing/invalid field.
 */
export function parseCurveData(raw: unknown, where = "curve"): CurveData {
  if (typeof raw !== "object" || raw === null) {
    throw new DataValidationError(`${where}: not an object`);
  }
  const obj = raw as Record<string, unknown>;

  const points = parsePoints(obj.points, `${where}: 'points'`);

  const citation = validateCitation(obj.citation, where);

  if (typeof obj.provenance !== "string" || obj.provenance.length === 0) {
    throw new DataValidationError(`${where}: 'provenance' string is required`);
  }

  const result: CurveData = { points, citation, provenance: obj.provenance };
  if (obj.band !== undefined) {
    const band = obj.band as Record<string, unknown>;
    const lower = parsePoints(band.lower, `${where}: band.lower`);
    const upper = parsePoints(band.upper, `${where}: band.upper`);
    if (lower.length !== upper.length) {
      throw new DataValidationError(`${where}: band bounds must be the same length`);
    }
    for (let i = 0; i < lower.length; i++) {
      if (lower[i].x !== upper[i].x) {
        throw new DataValidationError(`${where}: band bounds must share their x values`);
      }
      if (lower[i].y > upper[i].y) {
        throw new DataValidationError(`${where}: band lower exceeds upper at x=${lower[i].x}`);
      }
    }
    result.band = { lower, upper };
  }
  if (obj.labels !== undefined) {
    const labels = obj.labels as Record<string, unknown>;
    if (typeof labels !== "object" || labels === null) {
      throw new DataValidationError(`${where}: 'labels' must be an object`);
    }
    for (const [k, v] of Object.entries(labels)) {
      if (typeof v !== "string") {
        throw new DataValidationError(`${where}: label '${k}' must be a string`);
      }
    }
    result.labels = labels as Record<string, string>;
  }
  if (obj.fit !== undefined) {
    const fit = obj.fit as Record<string, unknown>;
    if (typeof fit.kind !== "string" || typeof fit.params !== "object" || fit.params === null) {
      throw new DataValidationError(`${where}: 'fit' must have {kind, params}`);
    }
    result.fit = { kind: fit.kind, params: fit.params as Record<string, number> };
  }
  return result;
}
