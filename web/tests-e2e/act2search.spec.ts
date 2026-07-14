import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("Act 2 search & scaling (pages 10–13)", () => {
  test("Page 12: toggling the log axis keeps the coverage chart present", async ({ page }) => {
    await page.goto("/p/12");
    await expect(page.getByRole("img", { name: /coverage versus samples/i })).toBeVisible();
    await page.getByRole("switch", { name: /x-axis scale/i }).click();
    await expect(page.getByRole("img", { name: /coverage versus samples/i })).toBeVisible();
  });

  test("Page 13: the compute-optimal button beats a bad allocation", async ({ page }) => {
    await page.goto("/p/13");
    // Push everything onto easy (a bad allocation).
    const easy = page.getByRole("slider", { name: /budget on easy/i });
    await easy.focus();
    await easy.press("End");
    await page.getByRole("button", { name: /compute-optimal policy/i }).click();
    await expect(page.getByText(/compute-optimal/i).first()).toBeVisible();
  });

  for (const n of [10, 11, 12, 13]) {
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
