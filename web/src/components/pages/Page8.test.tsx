import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Page8 } from "./Page8";

describe("Page 8 (best-of-N and verifiers) component", () => {
  it("renders both selection panels over the same candidates", () => {
    render(<Page8 />);
    expect(screen.getByText("Majority vote")).toBeInTheDocument();
    expect(screen.getByText("Verifier best-of-N")).toBeInTheDocument();
  });

  it("offers the two dials the page's argument needs", () => {
    render(<Page8 />);
    expect(screen.getByRole("slider", { name: /candidates/i })).toBeInTheDocument();
    // Step 1's batch dial (exact name); step 2's chart has its own reliability dial.
    expect(screen.getByRole("slider", { name: "Verifier reliability" })).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: /crosses below voting/i })).toBeInTheDocument();
  });

  it("a fully reliable verifier picks the correct answer the crowd misses", () => {
    render(<Page8 />);
    // Default is 100% reliability: the verifier lands Day 47, the vote lands Day 24.
    expect(screen.getByText(/✓ picks Day 47/)).toBeInTheDocument();
    expect(screen.getByText(/✗ picks Day 24/)).toBeInTheDocument();
  });

  it("corrupting the verifier makes it pick the popular wrong answer too", () => {
    render(<Page8 />);
    fireEvent.change(screen.getByRole("slider", { name: "Verifier reliability" }), {
      target: { value: "0" },
    });
    // Both panels now land on the trap.
    expect(screen.getAllByText(/✗ picks Day 24/).length).toBe(2);
  });
});
