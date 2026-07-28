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

  test("Page 10: the dial changes what the model writes", async ({ page }) => {
    await page.goto("/p/10");
    const bill = page.getByRole("status", { name: /the compute bill/i });
    // Keeping one line alive is greedy: the likeliest line, and it cannot rhyme.
    await expect(page.getByText(/✗ no rhyme/)).toBeVisible();
    await expect(page.getByText(/so I got up and paced/)).toBeVisible();
    await expect(bill).toContainText("12");
    // Keeping two finds the rhyme, and the counter is a real measurement.
    const dial = page.getByRole("slider", { name: /lines kept alive/i });
    await dial.fill("2");
    await expect(page.getByText(/✓ it rhymes/)).toBeVisible();
    await expect(page.getByText(/so I turned on the light/)).toBeVisible();
    await expect(bill).toContainText("19");
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
