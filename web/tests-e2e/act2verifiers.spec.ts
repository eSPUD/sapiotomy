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

  test("Page 9: finding the break flags the lucky chain the outcome view passes", async ({
    page,
  }) => {
    await page.goto("/p/9");
    // Outcome view (default) passes the lucky chain on its answer alone.
    await expect(page.getByText(/Outcome grader: pass/i)).toBeVisible();
    // Switch to the process view and answer its one question, then reveal.
    await page.getByRole("button", { name: /process view/i }).click();
    // Any answer unlocks the reveal, and the checker's verdict does not depend on
    // it, so this does not hard-code which line the shipped run proves false.
    await page
      .getByRole("button", { name: /as the line that goes wrong$/ })
      .first()
      .click();
    await page.getByRole("button", { name: /reveal what the graders found/i }).click();
    await expect(page.getByText("checked: FALSE")).toBeVisible();
    // The checker's reach is stated as reach, never as a per-step verdict.
    await expect(page.getByText(/can't check/i)).toHaveCount(0);
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
