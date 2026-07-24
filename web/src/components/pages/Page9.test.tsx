import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Page9 } from "./Page9";

describe("Page 9 (outcome vs process supervision) component", () => {
  it("opens on the outcome view, which passes the lucky solution", () => {
    render(<Page9 />);
    expect(screen.getByText(/Outcome grader: pass/i)).toBeInTheDocument();
  });

  it("makes the reader grade the steps before showing the PRM's labels", () => {
    render(<Page9 />);
    fireEvent.click(screen.getByRole("button", { name: /process view/i }));
    expect(screen.getByRole("button", { name: /mark every step first/i })).toBeDisabled();
  });

  it("reveals the flagged step once every step is marked", () => {
    render(<Page9 />);
    fireEvent.click(screen.getByRole("button", { name: /process view/i }));
    for (const i of [1, 2, 3]) {
      fireEvent.click(screen.getByRole("button", { name: `Mark step ${i} sound` }));
    }
    fireEvent.click(screen.getByRole("button", { name: /reveal the prm/i }));
    // The fake cancellation is flagged even though the answer was right.
    expect(screen.getByText("step broken")).toBeInTheDocument();
    expect(screen.getByText(/cannot be cancelled/i)).toBeInTheDocument();
  });

  it("keeps the domain caveat on screen", () => {
    render(<Page9 />);
    expect(screen.getByText(/no ground truth mid-stanza/i)).toBeInTheDocument();
  });
});
