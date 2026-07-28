import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Page19 } from "./Page19";

const stat = (name: RegExp) => screen.getByRole("status", { name });

describe("Page 19 (the frontier) component", () => {
  it("shows Coconut's planning gain and math give-back, verbatim from the data file", () => {
    render(<Page19 />);
    for (const v of ["77.5%", "97.0%", "42.9%", "34.1%"]) {
      expect(screen.getByText(v)).toBeInTheDocument();
    }
    // ...and reads the trade in both directions, not as a pure win.
    expect(screen.getByText(/not uniformly better reasoning/i)).toBeInTheDocument();
  });

  it("flags the monitorability tension with page 17", () => {
    render(<Page19 />);
    const callout = screen.getByText(/there is nothing to read, faithful or not/i).closest("div")!;
    expect(callout.textContent).toMatch(/page 17/i);
    expect(callout.textContent).toMatch(/preprint-stage/i);
  });

  it("opens the panel on classic CoT: readable and ten times the direct-answer bill", () => {
    render(<Page19 />);
    expect(stat(/suite accuracy/)).toHaveTextContent("47.0%");
    expect(stat(/compute bill/)).toHaveTextContent("10.0×");
    expect(stat(/latency/)).toHaveTextContent("10.0×");
    expect(stat(/monitorability/)).toHaveTextContent("90");
  });

  it("switching the medium to latent collapses the bill and the transcript", () => {
    render(<Page19 />);
    fireEvent.click(screen.getByRole("button", { name: "in latent space" }));
    expect(stat(/compute bill/)).toHaveTextContent("2.0×");
    expect(stat(/monitorability/)).toHaveTextContent("20");
  });

  it("samples raise the bill but not the latency", () => {
    render(<Page19 />);
    fireEvent.change(screen.getByRole("slider", { name: /samples/i }), { target: { value: "8" } });
    expect(stat(/compute bill/)).toHaveTextContent("80.0×");
    expect(stat(/latency/)).toHaveTextContent("10.0×");
  });

  it("an adaptive budget cuts the bill at unchanged accuracy", () => {
    render(<Page19 />);
    fireEvent.click(screen.getByRole("switch", { name: /adaptive budget/i }));
    expect(stat(/suite accuracy/)).toHaveTextContent("47.0%");
    expect(stat(/compute bill/)).toHaveTextContent("6.0×");
  });

  it("the Latent frontier preset composes the whole stack", () => {
    render(<Page19 />);
    fireEvent.click(screen.getByRole("button", { name: "Latent frontier" }));
    expect(stat(/suite accuracy/)).toHaveTextContent("68.0%");
    expect(stat(/compute bill/)).toHaveTextContent("36.0×");
    expect(stat(/monitorability/)).toHaveTextContent("10");
  });

  it("hides the thought-dependent controls when there are no thoughts", () => {
    render(<Page19 />);
    expect(screen.getByRole("switch", { name: /tree search/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("switch", { name: /chain of thought/i }));
    expect(screen.queryByRole("switch", { name: /tree search/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "in latent space" })).not.toBeInTheDocument();
  });

  it("keeps every reference note to a bare cite, as pages 3-8 do", () => {
    render(<Page19 />);
    const notes = screen.getAllByText("References").map((k) => k.closest("aside")!);
    expect(notes.length).toBe(3);
    for (const note of notes) {
      expect(note.textContent).not.toMatch(/arXiv|ICLR|COLM|NeurIPS|EMNLP|Table/);
    }
  });

  it("discloses that the capstone panel is a composite, not a live model", () => {
    render(<Page19 />);
    expect(screen.getAllByText(/illustrative composite/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/not a live model/i).length).toBeGreaterThan(0);
  });
});
