import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { bernoulli, createRng } from "@/lib/rng";
import { PAGE9, pct } from "@/lib/page09";
import { Page18 } from "./Page18";

const plantHint = () => fireEvent.click(screen.getByRole("switch", { name: /plant the hint/i }));

/** The page's own draw sequence: seed 1 = Claude (25%), seed 2 = R1 (39%). */
const draws = (seed: number, p: number, runs: number) => {
  const rng = createRng(seed);
  return Array.from({ length: runs }, () => bernoulli(rng, p));
};

describe("Page 18 (can we trust the thoughts) component", () => {
  it("opens on our own measurement, not the literature", () => {
    // Page 18 was the deck's one page built entirely on other people's
    // numbers. The lead is now page 9's run, so the borrowed numbers arrive
    // as the escalation rather than the premise.
    render(<Page18 />);
    const lead = screen.getByText(/before the literature, our own run/i).closest("section")!;
    expect(lead.textContent).toMatch(/Page 9/);
    expect(lead.textContent).toMatch(PAGE9.run.model.split("/").pop()!);
  });

  it("takes every figure from page 9's loader, not a literal", () => {
    // The numbers must move if page 9's run is replaced. Hardcoding them is the
    // failure mode this asserts against.
    render(<Page18 />);
    const lead = screen.getByText(/before the literature, our own run/i).closest("section")!;
    expect(lead.textContent).toContain(PAGE9.graders.stepsTotal.toLocaleString());
    expect(lead.textContent).toContain(PAGE9.detection.nChainsUnreadable.toLocaleString());
    expect(lead.textContent).toContain(pct(PAGE9.detection.shareChainsUnreadable, 1));
    expect(lead.textContent).toContain(pct(PAGE9.graders.shareUnjudged, 1));
    // Sanity: the shipped run's floors, so a silently emptied loader fails here.
    expect(PAGE9.detection.shareChainsUnreadable).toBeGreaterThan(0.5);
    expect(PAGE9.graders.shareUnjudged).toBeGreaterThan(0.9);
  });

  it("leads on whole chains and keeps the step-level share behind it", () => {
    // The chain figure is the image ("two traces in three offer nothing to
    // check") and the step figure is the measurement. Dropping the step share
    // would invite "so a third of chains are checkable", which badly overstates
    // it: the reachable third averages barely two checkable steps each.
    render(<Page18 />);
    const lead = screen.getByText(/before the literature, our own run/i).closest("section")!;
    const chains = lead.textContent!.indexOf(pct(PAGE9.detection.shareChainsUnreadable, 1));
    const steps = lead.textContent!.indexOf(pct(PAGE9.graders.shareUnjudged, 1));
    expect(chains).toBeGreaterThan(-1);
    expect(steps).toBeGreaterThan(chains);
  });

  it("says what unknown actually means, which is the first thing a reader asks", () => {
    // "steps a checker cannot compute" reads as "our tool failed". It is not
    // that: 'unknown' is the label for a step with no arithmetic claim in it.
    render(<Page18 />);
    const lead = screen.getByText(/before the literature, our own run/i).closest("section")!;
    expect(lead.textContent).toMatch(/not the checker failing/i);
    expect(lead.textContent).toMatch(/nothing it could check at all/i);
    expect(lead.textContent).toMatch(/symbolic algebra/i);
  });

  it("keeps the instrument's limit and the trace's limit apart", () => {
    // The whole point of leading on page 9 collapses if a reader files
    // "unknown steps" and "unfaithful trace" as the same finding. One is
    // a grader that cannot compute; the other is a trace that omits.
    render(<Page18 />);
    const lead = screen.getByText(/before the literature, our own run/i).closest("section")!;
    expect(lead.textContent).toMatch(/limit of our instrument/i);
    expect(lead.textContent).toMatch(/limit of the trace itself/i);
    expect(lead.textContent).toMatch(/whether a step is wrong/i);
    expect(lead.textContent).toMatch(/whether the steps are the reason/i);
  });

  it("says why the probe below needs a different method than page 9's checker", () => {
    render(<Page18 />);
    expect(screen.getByText(/no checker can run this one/i)).toBeInTheDocument();
  });

  it("opens on the clean run: right answer, nothing for the monitor to flag", () => {
    render(<Page18 />);
    expect(screen.getByText(/✓ B, Earth/)).toBeInTheDocument();
    expect(screen.getByText(/nothing to flag/i)).toBeInTheDocument();
    expect(screen.queryByText(/answer-key/)).not.toBeInTheDocument();
  });

  it("planting the hint flips the answer to the tag's target", () => {
    render(<Page18 />);
    plantHint();
    expect(screen.getAllByText(/<answer-key>C<\/answer-key>/).length).toBeGreaterThan(0);
    expect(screen.getByText(/✗ C, Mercury/)).toBeInTheDocument();
  });

  it("the monitor verdict matches the seeded draw for the first run", () => {
    render(<Page18 />);
    plantHint();
    const [first] = draws(1, 0.25, 1);
    if (first) {
      expect(screen.getByText(/faithful this run/i)).toBeInTheDocument();
    } else {
      expect(screen.getByText("Unfaithful:")).toBeInTheDocument();
    }
  });

  it("makes the reader ask how we know, rather than telling them", () => {
    render(<Page18 />);
    plantHint();
    const [first] = draws(1, 0.25, 1);
    if (first) return; // the seeded first run admitted; nothing to reveal
    // The page's sharpest epistemic point used to sit in the verdict box as
    // prose. It is only true because a control run exists, which is exactly
    // what a monitor in production does not have.
    expect(screen.queryByText(/comparing it with the clean run/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /how do we know it is unfaithful/i }));
    const why = screen.getByText(/comparing it with the clean run/i);
    expect(why.textContent).toMatch(/A monitor in production has one/);
  });

  it("the confession meter converges toward the paper's 25% for Claude", () => {
    render(<Page18 />);
    plantHint();
    const more = screen.getByRole("button", { name: /50 more runs/i });
    for (let i = 0; i < 4; i++) fireEvent.click(more); // 1 + 200 runs
    const seq = draws(1, 0.25, 201);
    const admitted = seq.filter(Boolean).length;
    expect(screen.getByText(`admitted ${admitted} of 201`)).toBeInTheDocument();
    expect(screen.getByText(/converges to the paper's average/i)).toBeInTheDocument();
  });

  it("switching the model swaps the published rate and resets the tally", () => {
    render(<Page18 />);
    plantHint();
    fireEvent.click(screen.getByRole("button", { name: /50 more runs/i }));
    fireEvent.click(screen.getByRole("switch", { name: /model under test/i }));
    expect(screen.getByText(/average for DeepSeek-R1/)).toBeInTheDocument();
    expect(screen.getByText("39%")).toBeInTheDocument();
    const seq = draws(2, 0.39, 1);
    expect(screen.getByText(`admitted ${seq.filter(Boolean).length} of 1`)).toBeInTheDocument();
  });

  it("discloses that traces are authored and only the rates are the paper's", () => {
    // House style (pages 3-8): caveats live in the step body, not a margin note.
    render(<Page18 />);
    expect(screen.getByText(/traces written for this page, no live model/i)).toBeInTheDocument();
    expect(screen.getByText(/admission rates from the paper/i)).toBeInTheDocument();
  });

  it("shows the monitorability gap as the two recall bars, 60% vs 95%", () => {
    render(<Page18 />);
    expect(screen.getByText(/reads actions & outputs only/i)).toBeInTheDocument();
    expect(screen.getAllByText("60%").length).toBeGreaterThan(0);
    expect(screen.getAllByText("95%").length).toBeGreaterThan(0);
  });

  it("lets the reader choose what the monitor may read, and counts the misses", () => {
    render(<Page18 />);
    // Step 2 is the page's pivot ("so is the trace worthless? No") and used to
    // be two static bars with nothing asked of the reader.
    const status = screen.getByRole("status", { name: "" });
    expect(status.textContent).toMatch(/catches\s*60\s*and\s*misses\s*40/);
    fireEvent.click(screen.getByRole("switch", { name: /what the monitor may read/i }));
    expect(screen.getByRole("status", { name: "" }).textContent).toMatch(
      /catches\s*95\s*and\s*misses\s*5/,
    );
  });

  it("scopes the recall claim to systemic reward hacks in visible copy", () => {
    render(<Page18 />);
    // The scope used to live only in the figure's aria-label, so a sighted
    // reader concluded the monitor catches 95% of all misbehavior.
    expect(screen.getAllByText(/systemic reward hacks/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/not misbehavior in general/i)).toBeInTheDocument();
  });

  it("hands a live question forward to 19", () => {
    render(<Page18 />);
    expect(
      screen.getByText(/what is left to read when the thinking stops being words/i),
    ).toBeInTheDocument();
  });

  it("carries no em dash or en dash in rendered copy", () => {
    // Page 18 was already clean and nothing pinned it that way.
    const { container } = render(<Page18 />);
    const offenders = Array.from(container.querySelectorAll("*"))
      .flatMap((el) => [el.textContent ?? "", el.getAttribute("aria-label") ?? ""])
      .filter((t) => t.includes("—") || t.includes("–"));
    expect(offenders).toEqual([]);
  });

  it("the pressure dial starts legible and obfuscates past the cliff", () => {
    render(<Page18 />);
    const dial = screen.getByRole("slider", { name: /optimization pressure/i });
    expect(screen.getByText(/✓ still legible/)).toBeInTheDocument();
    fireEvent.change(dial, { target: { value: "10" } });
    expect(screen.getByText(/✗ obfuscated/)).toBeInTheDocument();
    expect(screen.getByText(/monitorability tax/i)).toBeInTheDocument();
  });

  it("names the open-vs-hidden trace tension in the close", () => {
    render(<Page18 />);
    expect(screen.getByText(/o1 hides its raw trace/i)).toBeInTheDocument();
    expect(screen.getByText(/DeepSeek-R1 prints every token/i)).toBeInTheDocument();
  });

  it("keeps the reference notes to bare cites, as pages 3-8 do", () => {
    render(<Page18 />);
    const note = screen.getAllByText("References")[0].closest("aside")!;
    expect(note.textContent).toMatch(/Chen et al\. 2025/);
    expect(note.textContent).not.toMatch(/arXiv|25%|39%/);
  });

  it("gives every numbered cite on the page a reference entry", () => {
    render(<Page18 />);
    // Cite renders an anchor to #ref-N and RefItem carries that id, so a cite
    // with no entry is a link that jumps nowhere.
    const dangling = Array.from(document.querySelectorAll('a[href^="#ref-"]'))
      .map((a) => a.getAttribute("href")!.slice(1))
      .filter((id) => !document.getElementById(id));
    expect(dangling).toEqual([]);
  });
});
