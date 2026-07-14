import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("Act 3 (pages 14–19)", () => {
  test("Page 14: pressing Wait flips the answer to correct", async ({ page }) => {
    await page.goto("/p/14");
    await expect(page.getByText(/still wrong/i)).toBeVisible();
    const wait = page.getByRole("button", { name: "Wait" });
    await wait.click();
    await wait.click();
    await wait.click();
    await expect(page.getByText(/24 ✓ \(correct\)/i)).toBeVisible();
  });

  test("Page 19: verdict flips between scoring modes at high N", async ({ page }) => {
    await page.goto("/p/19");
    const disks = page.getByRole("slider", { name: /disks/i });
    await disks.focus();
    await disks.press("End"); // N = 12 → collapse under enumeration
    await expect(page.getByText("COLLAPSE", { exact: true })).toBeVisible();
    await page.getByRole("switch", { name: /scoring rule/i }).click();
    await expect(page.getByText("SOLVED", { exact: true })).toBeVisible();
  });

  test("preprint sources are visibly flagged", async ({ page }) => {
    for (const n of [14, 16, 17, 18, 19]) {
      await page.goto(`/p/${n}`);
      await expect(page.getByText("preprint", { exact: true }).first()).toBeVisible();
    }
  });

  for (const n of [14, 15, 16, 17, 18, 19]) {
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
