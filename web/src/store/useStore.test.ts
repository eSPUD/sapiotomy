import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_LEVERS, useStore } from "./useStore";

describe("global store", () => {
  beforeEach(() => {
    useStore.setState({ levers: { ...DEFAULT_LEVERS }, interactions: {} });
  });

  it("updates a single lever without mutating the others", () => {
    useStore.getState().setLever("samples", 16);
    expect(useStore.getState().levers.samples).toBe(16);
    expect(useStore.getState().levers.cotEnabled).toBe(DEFAULT_LEVERS.cotEnabled);
  });

  it("resets levers to defaults", () => {
    useStore.getState().setLever("cotEnabled", true);
    useStore.getState().resetLevers();
    expect(useStore.getState().levers).toEqual(DEFAULT_LEVERS);
  });

  it("records interactions per page", () => {
    useStore.getState().recordInteraction(6);
    useStore.getState().recordInteraction(6);
    useStore.getState().recordInteraction(3);
    expect(useStore.getState().interactions).toEqual({ 6: 2, 3: 1 });
  });
});
