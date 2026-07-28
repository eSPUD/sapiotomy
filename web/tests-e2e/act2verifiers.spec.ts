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

  test("Page 10: the replay steps through the search and prices it", async ({ page }) => {
    await page.goto("/p/10");
    const bill = page.getByRole("status", { name: /the compute bill/i });
    // Opens dark: nothing scored until the reader presses play or scrubs.
    await expect(bill).toContainText("0");
    await expect(page.getByText(/press play to watch it search/i)).toBeVisible();
    // Greedy to the end: 9 of 29, and the likeliest line cannot rhyme.
    await page.getByRole("button", { name: /skip to end/i }).click();
    await expect(bill).toContainText("9");
    await expect(page.getByText(/✗ no rhyme/)).toBeVisible();
    // Breadth-first pays the most for the same tree.
    await page.getByRole("button", { name: "Breadth-first" }).click();
    await expect(bill).toContainText("0");
    await page.getByRole("button", { name: /skip to end/i }).click();
    await expect(bill).toContainText("23");
    await expect(page.getByText(/✓ it rhymes/)).toBeVisible();
  });

  test("Page 10: the reader can write the line themselves", async ({ page }) => {
    await page.goto("/p/10");
    for (const w of ["got", "up", "and", "paced"]) {
      await page.getByRole("button", { name: new RegExp(`^${w}\\s`) }).click();
    }
    await expect(page.getByText(/does not rhyme with "night"/)).toBeVisible();
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
