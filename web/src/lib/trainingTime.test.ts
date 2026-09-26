import { describe, expect, it } from "vitest";
import raw from "@data/epoch-training-time.json";
import { parseCurveData } from "./data";
import { fractionalYear, parseModels, trainingTimeCurve, trainingTimeModels } from "./trainingTime";

describe("section b's training times (Epoch AI)", () => {
  it("holds the author's thirteen models, in release order", () => {
    expect(trainingTimeModels.map((m) => m.name)).toEqual([
      "PaLM", "BLOOM", "GLM-130B", "LLaMA-65B", "GPT-4", "BloombergGPT", "Llama 2-70B",
      "Mistral Large", "Phi-3.5-MoE", "Phi-4", "Grok 3", "GPT-4.5", "GLM-4.6",
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
    expect(est).toEqual(["GPT-4", "Llama 2-70B", "Mistral Large", "Grok 3", "GPT-4.5", "GLM-4.6"]);
  });

  it("rejects a file whose points drift from its rows, or whose days are not Epoch's", () => {
    const drifted = structuredClone(raw);
    drifted.points[0].y = 99;
    expect(() => parseModels(drifted.models, parseCurveData(drifted, "t"))).toThrow(/does not match PaLM/);
    const edited = structuredClone(raw);
    edited.models[0].days = 70;
    edited.points[0].y = 70;
    expect(() => parseModels(edited.models, parseCurveData(edited, "t"))).toThrow(/not Epoch's hours/);
  });

  it("converts dates to fractional years", () => {
    expect(fractionalYear("2023-01-01")).toBe(2023);
    expect(fractionalYear("2024-07-02")).toBeCloseTo(2024 + 183 / 366, 6);
  });
});
