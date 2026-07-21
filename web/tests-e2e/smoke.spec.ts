import { expect, test } from "@playwright/test";

test.describe("M0 smoke", () => {
  test("app boots and shows the title", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "The Story of Inference-Time Scaling",
    );
  });

  test("masthead renders the title on a story page", async ({ page }) => {
    await page.goto("/p/6");
    const rail = page.getByRole("navigation", { name: "Story progress" });
    await expect(rail).toBeVisible();
    await expect(
      rail.getByRole("link", { name: "The Story of Inference-Time Scaling" }),
    ).toBeVisible();
  });

  test("app progress bar: prior pages filled, current page fills on scroll", async ({ page }) => {
    await page.setViewportSize({ width: 1000, height: 500 });
    await page.goto("/p/20");
    // 20 segments; the current page (20) is the last fill element.
    const fills = page.locator('nav[aria-label="Story progress"] div.bg-compute');
    await expect(fills).toHaveCount(20);
    // A prior page's segment (e.g. #1) is already full.
    const first = await fills.nth(0).evaluate((el) => (el as HTMLElement).getBoundingClientRect().width);
    const cell = await fills.nth(0).evaluateHandle((el) => el.parentElement!);
    const cellW = await cell.evaluate((el) => (el as HTMLElement).getBoundingClientRect().width);
    expect(first).toBeGreaterThan(cellW - 1); // segment 1 filled
    // The current page's segment grows as you scroll it.
    const last = fills.nth(19);
    const before = await last.evaluate((el) => (el as HTMLElement).getBoundingClientRect().width);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(250);
    const after = await last.evaluate((el) => (el as HTMLElement).getBoundingClientRect().width);
    expect(after).toBeGreaterThan(before);
  });

  test("progress bar segments are labelled links that navigate", async ({ page }) => {
    await page.goto("/p/6");
    const rail = page.getByRole("navigation", { name: "Story progress" });
    const segments = rail.getByRole("link", { name: /^Chapter \d+:/ });
    await expect(segments).toHaveCount(20);
    // Clicking a segment jumps to that page.
    await rail.getByRole("link", { name: /^Chapter 10:/ }).click();
    await expect(page).toHaveURL(/\/p\/10$/);
  });

  test("navigation between two stub routes works", async ({ page }) => {
    await page.goto("/p/1");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Think Fast, Think Slow");
    await page.getByRole("link", { name: "Page 2 →" }).click();
    await expect(page).toHaveURL(/\/p\/2$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Two Systems");
  });
});
