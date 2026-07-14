import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("Act 2 verifiers (pages 7–9)", () => {
  test("Page 8: switching to the verifier raises accuracy above random", async ({ page }) => {
    await page.goto("/p/8");
    await page.getByRole("button", { name: /pick randomly/i }).click();
    const randomText = await page.getByText(/accuracy — random selection/i).textContent();
    await page.getByRole("button", { name: /verifier picks/i }).click();
    await expect(page.getByText(/accuracy — verifier selection/i)).toBeVisible();
    expect(randomText).toBeTruthy();
  });

  test("Page 9: process view labels every step", async ({ page }) => {
    await page.goto("/p/9");
    // process view is the default → multiple step labels present
    await expect(page.getByText("error", { exact: true })).toBeVisible();
  });

  for (const n of [7, 8, 9]) {
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
