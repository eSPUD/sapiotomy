import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";

// Deterministic reduced-motion path for any motion-aware component on the page.
const mm = (q: string) => ({
  matches: q.includes("prefers-reduced-motion"),
  media: q,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  onchange: null,
  dispatchEvent: () => false,
});
vi.stubGlobal("matchMedia", mm);

import { Page4 } from "./Page4";

function flipBoth() {
  fireEvent.click(screen.getByRole("button", { name: /seen this one/i }));
  fireEvent.click(screen.getByRole("button", { name: /rebuild it/i }));
}

function castVote(groupName: RegExp, buttonName: RegExp) {
  const group = screen.getByRole("group", { name: groupName });
  fireEvent.click(within(group).getByRole("button", { name: buttonName }));
}

describe("Page 4 (two machines) component", () => {
  it("contains neither AI word before the tiles are flipped, and never gates the exit", () => {
    const { container } = render(<Page4 />);
    expect(container.textContent).not.toMatch(/training|inference|trained/i);
    expect(screen.getByRole("link", { name: /page 5/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /page 3/i })).toBeInTheDocument();
  });

  it("flipping both tiles names the machines and reveals the objection card", () => {
    render(<Page4 />);
    // The two shelves from page 3, as flippable buttons.
    expect(screen.getByRole("button", { name: /memorized/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    flipBoth();
    expect(screen.getByText("Training")).toBeInTheDocument();
    expect(screen.getByText("Inference")).toBeInTheDocument();
    expect(screen.getByText(/fun fact: the human names came first/i)).toBeInTheDocument();
    expect(screen.getByText(/before the bills: an objection/i)).toBeInTheDocument();
    expect(
      screen.getByText(/you hold the budget\. which machine do you feed\?/i),
    ).toBeInTheDocument();
    // The bills stay hidden until the first vote.
    expect(screen.queryByText(/climb the scale/i)).not.toBeInTheDocument();
  });

  it("vote 1 reveals the bills: pipes, ladder, arrow panels, and three Epoch citations", () => {
    render(<Page4 />);
    flipBoth();
    castVote(/first vote/i, /feed the factory/i);
    expect(
      screen.getByText(/hold that vote\. before anyone spends real money/i),
    ).toBeInTheDocument();
    // The two pipes, numbers rendered from curves.queryEnergy.
    expect(screen.getByText(/training burns like building the factory/i)).toBeInTheDocument();
    expect(screen.getByText(/inference burns like the commute/i)).toBeInTheDocument();
    expect(screen.getByText("≈ 50 GWh, once")).toBeInTheDocument();
    expect(screen.getByText("≈ 0.3 Wh, per answer")).toBeInTheDocument();
    // The ladder is present but unclimbed.
    expect(screen.getByRole("button", { name: /climb a rung/i })).toBeEnabled();
    // The two measured rates, rendered from the curve fit params.
    expect(screen.getByText(/×2\.4 every year/)).toBeInTheDocument();
    expect(screen.getByText(/÷40 every year/)).toBeInTheDocument();
    const epochLinks = screen
      .getAllByRole("link")
      .filter((a) => (a.getAttribute("href") ?? "").includes("epoch.ai"));
    expect(epochLinks).toHaveLength(3);
    // Vote 2 is offered.
    expect(screen.getByRole("group", { name: /second vote/i })).toBeInTheDocument();
  });

  it("the ladder climbs four rungs, tops out, and descends again", () => {
    render(<Page4 />);
    flipBoth();
    castVote(/first vote/i, /buy more thinking/i);
    const descend = screen.getByRole("button", { name: /back down/i });
    expect(descend).toBeDisabled();
    const climb = screen.getByRole("button", { name: /climb a rung/i });
    fireEvent.click(climb);
    expect(screen.getByText("≈ 0.3 Wh")).toBeInTheDocument();
    fireEvent.click(climb);
    expect(screen.getByText("≈ 1.1 kWh")).toBeInTheDocument();
    fireEvent.click(climb);
    expect(screen.getByText("≈ 750 MWh")).toBeInTheDocument();
    fireEvent.click(climb);
    expect(screen.getByText("≈ 50 GWh")).toBeInTheDocument();
    const topped = screen.getByRole("button", { name: /top of the ladder/i });
    expect(topped).toBeDisabled();
    expect(descend).toBeEnabled();
    fireEvent.click(descend);
    expect(screen.getByRole("button", { name: /climb a rung/i })).toBeEnabled();
    expect(screen.queryByText("≈ 50 GWh")).not.toBeInTheDocument();
  });

  it("vote pair factory then think lands the switched-sides echo and the verdict", () => {
    render(<Page4 />);
    flipBoth();
    castVote(/first vote/i, /feed the factory/i);
    castVote(/second vote/i, /buy more thinking/i);
    expect(screen.getByText("You switched sides once you saw the bills.")).toBeInTheDocument();
    expect(
      screen.getByText(/^the marginal dollar moved to thinking\.$/i),
    ).toBeInTheDocument();
    // The three-row strip.
    expect(screen.getByText("4502 × 6398")).toBeInTheDocument();
    expect(screen.getByText("thinking's job")).toBeInTheDocument();
    expect(screen.getByText("only thinking arrives in time")).toBeInTheDocument();
    expect(screen.getByText("only the factory puts it in there")).toBeInTheDocument();
    // The catch and the teaser (both arc-true: the bill page comes later, not next).
    expect(
      screen.getByText(/now the catch, and it gets a whole page of its own/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/more problems per answer\? next page\./i)).toBeInTheDocument();
    // The sources-and-derivations disclosure carries the derived labels and disclaimers.
    expect(screen.getByText("Sources and derivations")).toBeInTheDocument();
    expect(screen.getByText(/ladder arithmetic \(derived\)/i)).toBeInTheDocument();
    expect(screen.getByText(/energy only 2 to 6%/i)).toBeInTheDocument();
    expect(screen.getByText(/the led comparison is theirs/i)).toBeInTheDocument();
    expect(screen.getByText(/stays an analogy/i)).toBeInTheDocument();
    expect(screen.getByText(/makes no gram claims/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^sources$/i })).toHaveAttribute("href", "#sources");
  });

  it("vote pair think then factory lands the defected echo", () => {
    render(<Page4 />);
    flipBoth();
    castVote(/first vote/i, /buy more thinking/i);
    castVote(/second vote/i, /feed the factory/i);
    expect(
      screen.getByText(
        "You defected to the factory at the last minute; the field went the other way.",
      ),
    ).toBeInTheDocument();
  });
});
