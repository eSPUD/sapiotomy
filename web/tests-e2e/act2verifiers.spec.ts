import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("Act 2 verifiers (pages 8–10)", () => {
  test("Page 8: a reliable verifier beats the vote; corrupting it does not", async ({ page }) => {
    await page.goto("/p/8");
    // Default 100% reliability: verifier lands $0.05, majority lands the trap.
    await expect(page.getByText(/✓ picks \$0\.05/)).toBeVisible();
    await expect(page.getByText(/✗ picks \$0\.10/)).toBeVisible();
    // Corrupt the verifier — now both selectors fall for the trap.
    const rel = page.getByRole("slider", { name: /verifier reliability/i });
    await rel.focus();
    await rel.press("Home");
    await expect(page.getByText(/✗ picks \$0\.10/)).toHaveCount(2);
  });

  test("Page 9: grading the steps flags the lucky solution the outcome view passes", async ({
    page,
  }) => {
    await page.goto("/p/9");
    // Outcome view (default) passes the fake-cancellation solution.
    await expect(page.getByText(/Outcome grader: pass/i)).toBeVisible();
    // Switch to process view and grade every step, then reveal.
    await page.getByRole("button", { name: /process view/i }).click();
    for (const i of [1, 2, 3]) {
      await page.getByRole("button", { name: `Mark step ${i} sound` }).click();
    }
    await page.getByRole("button", { name: /reveal the prm/i }).click();
    await expect(page.getByText("step broken")).toBeVisible();
  });

  test("Page 10: switching strategy re-runs the search", async ({ page }) => {
    await page.goto("/p/10");
    const bill = page.getByRole("status", { name: /the compute bill/i });
    // Greedy (default) commits to the trap and strands, having scored 11 thoughts.
    await expect(page.getByText(/✗ stranded/)).toBeVisible();
    await expect(bill).toContainText("11");
    // MCTS sorts all sixteen, and the counter is a real measurement, not a prop.
    await page.getByRole("combobox", { name: /search strategy/i }).selectOption("mcts");
    await expect(page.getByText(/all sixteen words placed/i)).toBeVisible();
    await expect(bill).toContainText("21");
    // Breadth-first refuses to prune and pays the most.
    await page.getByRole("combobox", { name: /search strategy/i }).selectOption("bfs");
    await expect(bill).toContainText("31");
  });

  for (const n of [8, 9, 10]) {
    test(`Page ${n} has no serious/critical accessibility violations`, async ({ page }) => {
      await page.goto(`/p/${n}`);
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
      const serious = results.violations.filter(
        (v) => v.impact === "serious" || v.impact === "critical",
      );
      expect(serious).toEqual([]);
    });
  }
});
