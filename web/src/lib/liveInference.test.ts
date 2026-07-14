import { afterEach, describe, expect, it, vi } from "vitest";
import { chooseInferenceMode, detectWebGPU } from "./liveInference";

describe("live inference — capability detection & mode decision", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("detects WebGPU when navigator.gpu is present", () => {
    vi.stubGlobal("navigator", { gpu: {} });
    expect(detectWebGPU()).toBe(true);
  });

  it("reports no WebGPU when navigator.gpu is absent", () => {
    vi.stubGlobal("navigator", {});
    expect(detectWebGPU()).toBe(false);
  });

  it("chooses live only when enabled AND WebGPU is available", () => {
    expect(chooseInferenceMode(true, true)).toBe("live");
    expect(chooseInferenceMode(true, false)).toBe("precomputed");
    expect(chooseInferenceMode(false, true)).toBe("precomputed");
    expect(chooseInferenceMode(false, false)).toBe("precomputed");
  });
});
