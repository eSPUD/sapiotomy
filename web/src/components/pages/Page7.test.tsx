import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Page7 } from "./Page7";

// The chamber computes synchronously; jsdom reports no reduced-motion
// preference, so chains stream in over time and assertions target the controls
// and the tally rather than a fully-streamed batch.

describe("Page 7 (frequency voting) component", () => {
  it("offers a Predict-Observe-Explain prompt", () => {
    render(<Page7 />);
    expect(screen.getByText(/what accuracy do you predict/i)).toBeInTheDocument();
  });

  it("leads with the vote analogy", () => {
    render(<Page7 />);
    expect(screen.getByText(/three pizza places/i)).toBeInTheDocument();
  });

  // The page must NOT gate on the prediction. An earlier build swapped the whole
  // document when "Lock it in" was pressed; the chamber and curve now render
  // from first paint and only the predict strip changes.
  it("renders the chamber and the curve WITHOUT any prediction", () => {
    render(<Page7 />);
    expect(screen.getByRole("slider", { name: /chains sampled/i })).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: /temperature/i })).toBeInTheDocument();
    expect(
      screen.getByRole("img", {
        name: /majority-vote accuracy versus number of sampled chains/i,
      }),
    ).toBeInTheDocument();
    // The prediction is still on offer, not yet made.
    expect(screen.getByRole("button", { name: /lock in prediction/i })).toBeInTheDocument();
  });

  it("committing a prediction keeps the chamber in place and only swaps the strip", () => {
    render(<Page7 />);
    const chamberBefore = screen.getByRole("slider", { name: /chains sampled/i });
    fireEvent.click(screen.getByRole("button", { name: /lock in prediction/i }));
    // Same controls and figure still mounted — no page-level swap.
    expect(screen.getByRole("slider", { name: /chains sampled/i })).toBe(chamberBefore);
    expect(screen.getByRole("slider", { name: /temperature/i })).toBeInTheDocument();
    expect(
      screen.getByRole("img", {
        name: /majority-vote accuracy versus number of sampled chains/i,
      }),
    ).toBeInTheDocument();
    // Only the strip changed: the prompt is replaced by the locked readout.
    expect(screen.getByText(/it is the dashed line on the curve/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /lock in prediction/i })).toBeNull();
  });

  it("collapses the vote to a single opinion at temperature zero", () => {
    render(<Page7 />);
    const temp = screen.getByRole("slider", { name: /temperature/i });
    fireEvent.change(temp, { target: { value: "0" } });
    expect(screen.getByText(/every chain is the same chain/i)).toBeInTheDocument();
  });
});
