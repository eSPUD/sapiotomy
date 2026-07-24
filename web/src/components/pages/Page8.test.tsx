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
    expect(screen.getByRole("slider", { name: /verifier reliability/i })).toBeInTheDocument();
  });

  it("a fully reliable verifier picks the correct answer the crowd misses", () => {
    render(<Page8 />);
    // Default is 100% reliability: the verifier lands $0.05, the vote lands $0.10.
    expect(screen.getByText(/✓ picks \$0\.05/)).toBeInTheDocument();
    expect(screen.getByText(/✗ picks \$0\.10/)).toBeInTheDocument();
  });

  it("corrupting the verifier makes it pick the popular wrong answer too", () => {
    render(<Page8 />);
    fireEvent.change(screen.getByRole("slider", { name: /verifier reliability/i }), {
      target: { value: "0" },
    });
    // Both panels now land on the trap.
    expect(screen.getAllByText(/✗ picks \$0\.10/).length).toBe(2);
  });
});
