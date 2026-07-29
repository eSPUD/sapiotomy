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
   * Optional per-point annotations, keyed by the point's x as a string, e.g.
   * which system held a record in a given year. Values are strings, so they stay
   * out of `params`, which callers treat as numbers and do arithmetic on.
   */
  labels?: Record<string, string>;
  /** How the points were obtained (figure/table + extraction method). */
  provenance: string;
}

export class DataValidationError extends Error {}

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

  if (!Array.isArray(obj.points) || obj.points.length === 0) {
    throw new DataValidationError(`${where}: 'points' must be a non-empty array`);
  }
  const points: DataPoint[] = obj.points.map((p, i) => {
    if (typeof p !== "object" || p === null) {
      throw new DataValidationError(`${where}: points[${i}] is not an object`);
    }
    const pt = p as Record<string, unknown>;
    if (!isFiniteNumber(pt.x) || !isFiniteNumber(pt.y)) {
      throw new DataValidationError(`${where}: points[${i}] needs finite x,y`);
    }
    return { x: pt.x, y: pt.y };
  });

  const citation = validateCitation(obj.citation, where);

  if (typeof obj.provenance !== "string" || obj.provenance.length === 0) {
    throw new DataValidationError(`${where}: 'provenance' string is required`);
  }

  const result: CurveData = { points, citation, provenance: obj.provenance };
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
