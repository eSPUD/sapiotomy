import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Page6 } from "./Page6";

// In jsdom, Worker is undefined, so useSelfConsistency falls back to synchronous
// compute — the page is fully functional without a Web Worker (graceful
// degradation) and we can assert its behaviour deterministically.

describe("Page 6 (self-consistency) component", () => {
  it("shows a Predict-Observe-Explain prompt before revealing data", () => {
    render(<Page6 />);
    expect(screen.getByText(/what accuracy do you predict/i)).toBeInTheDocument();
  });

  it("reveals the simulation after the reader commits a prediction", async () => {
    render(<Page6 />);
    fireEvent.click(screen.getByRole("button", { name: /lock in prediction/i }));
    // The votes slider and the accuracy chart appear.
    expect(await screen.findByRole("slider", { name: /votes/i })).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: /majority-vote accuracy versus number of votes/i }),
    ).toBeInTheDocument();
  });
});
