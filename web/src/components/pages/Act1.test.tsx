import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Page1 } from "./Page1";
import { Page3 } from "./Page3";
import { Page5 } from "./Page5";

describe("Page 1 component", () => {
  it("renders both mental-math problems and toggles the mode", () => {
    render(<Page1 />);
    expect(screen.getByText("2 + 2 = ?")).toBeInTheDocument();
    expect(screen.getByText("17 × 24 = ?")).toBeInTheDocument();
    // Two mode switches (one per card).
    expect(screen.getAllByRole("switch")).toHaveLength(2);
  });
});

describe("Page 3 component (POE → chain-of-thought)", () => {
  it("predicts first, then reveals the +39-point jump", () => {
    render(<Page3 />);
    expect(screen.getByText(/what accuracy do you predict/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /lock in prediction/i }));
    expect(screen.getByRole("switch", { name: /show your work/i })).toBeInTheDocument();
    expect(screen.getByText(/\+39\.0 points/i)).toBeInTheDocument();
  });
});

describe("Page 5 component (coverage)", () => {
  it("has an attempts slider that drives coverage", () => {
    render(<Page5 />);
    expect(screen.getByRole("slider", { name: /attempts/i })).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: /coverage.*versus number of attempts/i }),
    ).toBeInTheDocument();
  });
});
