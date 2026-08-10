import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * Pages 11-14: Act 2's keystone and Act 3's opening three.
 *
 * This file once carried two interaction tests written against an older
 * numbering, where 13 was the coverage-versus-samples page and 14 was the
 * allocator. Both moved (11 owns the allocator, 13 and 14 are the frontier
 * reasoners), so both tests looked for controls that exist on no page and
 * failed on every run. The axe sweep below was always correct and is what
 * this file is for.
 */
test.describe("Act 2 keystone & Act 3 opening (pages 11-14)", () => {
  for (const n of [11, 12, 13, 14]) {
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
