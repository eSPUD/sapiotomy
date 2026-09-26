import { describe, expect, it } from "vitest";
import raw from "@data/epoch-training-time.json";
import { parseCurveData } from "./data";
import {
  fmtParams,
  fractionalYear,
  parseModels,
  sizeBin,
  trainingTimeCurve,
  trainingTimeModels,
} from "./trainingTime";

describe("section b's training times (Epoch AI)", () => {
  it("holds the author's twenty-six language models, 2019 to 2025, in release order", () => {
    expect(trainingTimeModels.map((m) => m.name)).toEqual([
      "RoBERTa", "Megatron-LM", "T5", "Meena", "GPT-3", "GShard", "Switch", "MT-NLG", "Gopher",
      "GLaM", "AlphaCode", "GPT-NeoX-20B", "BLOOM", "GLM-130B", "LLaMA-65B", "Falcon-40B", "GPT-4",
      "StarCoder", "Falcon-180B", "Amazon Titan", "Gemini 1.0 Ultra", "Mistral Large",
      "Nemotron-4 340B", "Llama 3.1-405B", "Grok 3", "EXAONE 4.0",
    ]);
    const xs = trainingTimeModels.map((m) => m.x);
    expect([...xs].sort((a, b) => a - b)).toEqual(xs);
  });

  it("every value is Epoch's Training time field over 24, and nothing else", () => {
    for (const m of trainingTimeModels) {
      expect(m.days).toBeCloseTo(m.epochHours / 24, 1);
      expect(m.epochModel.length).toBeGreaterThan(0);
    }
    expect(trainingTimeCurve.citation.url).toBe("https://epoch.ai/data/ai-models");
  });

  it("keeps Epoch's estimates marked as estimates", () => {
    const est = trainingTimeModels.filter((m) => m.basis === "estimate").map((m) => m.name);
    expect(est).toEqual([
      "Megatron-LM", "MT-NLG", "GPT-NeoX-20B", "GPT-4", "Falcon-180B", "Amazon Titan",
      "Gemini 1.0 Ultra", "Mistral Large", "Nemotron-4 340B", "Grok 3", "EXAONE 4.0",
    ]);
  });

  it("rejects a file whose points drift from its rows, or whose days are not Epoch's", () => {
    const palm = raw.models.findIndex((m) => m.name === "BLOOM");
    const drifted = structuredClone(raw);
    drifted.points[palm].y = 99;
    expect(() => parseModels(drifted.models, parseCurveData(drifted, "t"))).toThrow(/does not match BLOOM/);
    const edited = structuredClone(raw);
    edited.models[palm].days = 70;
    edited.points[palm].y = 70;
    expect(() => parseModels(edited.models, parseCurveData(edited, "t"))).toThrow(/not Epoch's hours/);
  });

  it("every estimate's detail line says it is an estimate", () => {
    for (const m of trainingTimeModels.filter((m) => m.basis === "estimate")) {
      expect(m.how).toMatch(/estimate/i);
      expect(m.source.url).toBe("https://epoch.ai/data/ai-models");
    }
    const bad = structuredClone(raw);
    bad.models[bad.models.findIndex((m) => m.name === "GPT-4")].how = "Reported by OpenAI.";
    expect(() => parseModels(bad.models, parseCurveData(bad, "t"))).toThrow(/must say so/);
  });

  it("accepts hours taken from Epoch's chip-hours over chips only when they divide exactly", () => {
    const ok = structuredClone(raw);
    const i = ok.models.findIndex((m) => m.name === "BLOOM");
    Object.assign(ok.models[i], { epochChipHours: ok.models[i].epochHours * 384, epochChips: 384 });
    expect(() => parseModels(ok.models, parseCurveData(ok, "t"))).not.toThrow();
    (ok.models[i] as { epochChips?: number }).epochChips = 1024;
    expect(() => parseModels(ok.models, parseCurveData(ok, "t"))).toThrow(/chip-hours \/ chips/);
  });

  it("colours by size only where the developer published one", () => {
    const undisclosed = trainingTimeModels.filter((m) => sizeBin(m) === null).map((m) => m.name);
    expect(undisclosed).toEqual(["GPT-4", "Gemini 1.0 Ultra", "Mistral Large", "Grok 3"]);
    const bin = (n: string) => sizeBin(trainingTimeModels.find((m) => m.name === n)!);
    expect([bin("RoBERTa"), bin("LLaMA-65B"), bin("GPT-3"), bin("Switch")]).toEqual([0, 1, 2, 3]);
    expect([fmtParams(174.6e9), fmtParams(15.5e9), fmtParams(1.571e12), fmtParams(355e6)]).toEqual([
      "175B", "15.5B", "1.6T", "355M",
    ]);
    const bad = structuredClone(raw);
    const i = bad.models.findIndex((m) => m.name === "BLOOM");
    (bad.models[i] as { epochParams: number | null }).epochParams = null;
    expect(() => parseModels(bad.models, parseCurveData(bad, "t"))).toThrow(/no parameter count/);
  });

  it("converts dates to fractional years", () => {
    expect(fractionalYear("2023-01-01")).toBe(2023);
    expect(fractionalYear("2024-07-02")).toBeCloseTo(2024 + 183 / 366, 6);
  });
});
