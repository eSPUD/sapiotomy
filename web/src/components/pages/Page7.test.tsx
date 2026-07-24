import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Page7 } from "./Page7";

// The chamber computes synchronously; jsdom reports no reduced-motion
// preference, so chains stream in over time and assertions target the controls
// and the tally rather than a fully-streamed batch.

describe("Page 7 (frequency voting) component", () => {
  it("shows a Predict-Observe-Explain prompt before revealing data", () => {
    render(<Page7 />);
    expect(screen.getByText(/what accuracy do you predict/i)).toBeInTheDocument();
  });

  it("leads with the vote analogy", () => {
    render(<Page7 />);
    expect(screen.getByText(/three pizza places/i)).toBeInTheDocument();
  });

  it("reveals the chamber after the reader commits a prediction", async () => {
    render(<Page7 />);
    fireEvent.click(screen.getByRole("button", { name: /lock in prediction/i }));
    expect(await screen.findByRole("slider", { name: /chains sampled/i })).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: /temperature/i })).toBeInTheDocument();
    expect(
      screen.getByRole("img", {
        name: /majority-vote accuracy versus number of sampled chains/i,
      }),
    ).toBeInTheDocument();
  });

  it("collapses the vote to a single opinion at temperature zero", async () => {
    render(<Page7 />);
    fireEvent.click(screen.getByRole("button", { name: /lock in prediction/i }));
    const temp = await screen.findByRole("slider", { name: /temperature/i });
    fireEvent.change(temp, { target: { value: "0" } });
    expect(screen.getByText(/every chain is the same chain/i)).toBeInTheDocument();
  });
});
