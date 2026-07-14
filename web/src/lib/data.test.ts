import { describe, expect, it } from "vitest";
import { DataValidationError, parseCurveData } from "./data";

const validCitation = {
  ref: "Wang et al. 2022",
  url: "https://arxiv.org/abs/2203.11171",
  venue: "ICLR 2023",
  preprint: false,
};

const valid = {
  points: [
    { x: 1, y: 17.9 },
    { x: 40, y: 74.4 },
  ],
  citation: validCitation,
  provenance: "Verbatim table value from Wang et al. 2022, Table 1 (GSM8K).",
};

describe("data loader schema (citation + provenance required)", () => {
  it("accepts a valid curve", () => {
    const parsed = parseCurveData(valid);
    expect(parsed.points).toHaveLength(2);
    expect(parsed.citation.ref).toBe("Wang et al. 2022");
    expect(parsed.provenance).toContain("Table 1");
  });

  it("rejects a file missing citation", () => {
    const { citation: _omit, ...noCitation } = valid;
    expect(() => parseCurveData(noCitation)).toThrow(DataValidationError);
  });

  it("rejects a file missing provenance", () => {
    const { provenance: _omit, ...noProvenance } = valid;
    expect(() => parseCurveData(noProvenance)).toThrow(DataValidationError);
  });

  it("rejects a citation missing the preprint flag", () => {
    const bad = { ...valid, citation: { ref: "x", url: "y", venue: "z" } };
    expect(() => parseCurveData(bad)).toThrow(DataValidationError);
  });

  it("rejects empty or malformed points", () => {
    expect(() => parseCurveData({ ...valid, points: [] })).toThrow(DataValidationError);
    expect(() => parseCurveData({ ...valid, points: [{ x: 1 }] })).toThrow(DataValidationError);
  });
});
