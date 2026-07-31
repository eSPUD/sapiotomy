import { expect, test } from "@playwright/test";

test.describe("full journey", () => {
  test("traverses all 19 pages 1 → 19 via the next links", async ({ page }) => {
    await page.goto("/p/1");
    for (let n = 2; n <= 19; n++) {
      const link = page.getByRole("link", { name: `Page ${n} →` });
      await link.scrollIntoViewIfNeeded();
      await link.click();
      await expect(page).toHaveURL(new RegExp(`/p/${n}$`));
    }
  });

  test("page 19 is the end of the deck: no next link", async ({ page }) => {
    await page.goto("/p/19");
    await expect(page.getByRole("link", { name: /^Page 20 →/ })).toHaveCount(0);
    await expect(page.getByRole("link", { name: /^← Page 18/ })).toBeVisible();
  });
});
