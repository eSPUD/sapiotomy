import { expect, test } from "@playwright/test";

test.describe("full journey", () => {
  test("traverses all 16 pages 1 → 16 (the 15 story pages and the glossary) via the next links", async ({ page }) => {
    await page.goto("/p/1");
    for (let n = 2; n <= 16; n++) {
      const link = page.getByRole("link", { name: `Page ${n} →` });
      await link.scrollIntoViewIfNeeded();
      await link.click();
      await expect(page).toHaveURL(new RegExp(`/p/${n}$`));
    }
  });

  test("page 16, the glossary, is the end of the deck: no next link", async ({ page }) => {
    await page.goto("/p/16");
    await expect(page.getByRole("link", { name: /^Page 17 →/ })).toHaveCount(0);
    await expect(page.getByRole("link", { name: /^← Page 15/ })).toBeVisible();
  });

  test("the cut pages are gone, not merely unlinked", async ({ page }) => {
    // 15, 16, 18 and 19 were removed on 2026-08-10, and 13 and 14 were merged
    // on 2026-11-04, so the deck now ends at the glossary, 16. So 17, 18 and 19
    // must 404: a stale route left behind would still be reachable by typed URL
    // and would render a page the deck no longer numbers.
    for (const n of [17, 18, 19]) {
      const res = await page.goto(`/p/${n}`);
      expect(res?.status()).toBe(404);
    }
  });
});
