import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { LiveDemo } from "./LiveDemo";

describe("LiveDemo (flag OFF by default)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("renders nothing when live inference is disabled (MVP unchanged)", () => {
    // NEXT_PUBLIC_LIVE_INFERENCE unset -> disabled
    const { container } = render(<LiveDemo prompt="x" fallbackTrace={["a", "b"]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the panel (with fallback trace) when enabled but no WebGPU", () => {
    vi.stubEnv("NEXT_PUBLIC_LIVE_INFERENCE", "1");
    const { getByText } = render(<LiveDemo prompt="x" fallbackTrace={["step-A", "step-B"]} />);
    // No WebGPU in jsdom → precomputed mode shows the fallback trace.
    expect(getByText("step-A")).toBeInTheDocument();
    expect(getByText(/pre-computed trace/i)).toBeInTheDocument();
  });
});
