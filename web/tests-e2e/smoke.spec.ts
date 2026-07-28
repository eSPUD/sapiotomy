import { expect, test } from "@playwright/test";

test.describe("M0 smoke", () => {
  test("app boots and shows the title", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "The Story of Inference-Time Scaling",
    );
  });

  test("masthead renders the title on a story page", async ({ page }) => {
    await page.goto("/p/5");
    const rail = page.getByRole("navigation", { name: "Story progress" });
    await expect(rail).toBeVisible();
    await expect(
      rail.getByRole("link", { name: "The Story of Inference-Time Scaling" }),
    ).toBeVisible();
  });

  test("app progress bar: prior pages filled, current page fills on scroll", async ({ page }) => {
    await page.setViewportSize({ width: 1000, height: 500 });
    await page.goto("/p/21");
    // 21 segments; the current page (21) is the last fill element.
    const fills = page.locator('nav[aria-label="Story progress"] div.bg-compute');
    await expect(fills).toHaveCount(21);
    // A prior page's segment (e.g. #1) is already full.
    const first = await fills.nth(0).evaluate((el) => (el as HTMLElement).getBoundingClientRect().width);
    const cell = await fills.nth(0).evaluateHandle((el) => el.parentElement!);
    const cellW = await cell.evaluate((el) => (el as HTMLElement).getBoundingClientRect().width);
    expect(first).toBeGreaterThan(cellW - 1); // segment 1 filled
    // The current page's segment grows as you scroll it.
    const last = fills.nth(20);
    const before = await last.evaluate((el) => (el as HTMLElement).getBoundingClientRect().width);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(250);
    const after = await last.evaluate((el) => (el as HTMLElement).getBoundingClientRect().width);
    expect(after).toBeGreaterThan(before);
  });

  test("progress bar segments are labelled links that navigate", async ({ page }) => {
    await page.goto("/p/5");
    const rail = page.getByRole("navigation", { name: "Story progress" });
    const segments = rail.getByRole("link", { name: /^Chapter \d+:/ });
    await expect(segments).toHaveCount(21);
    // Clicking a segment jumps to that page.
    await rail.getByRole("link", { name: /^Chapter 10:/ }).click();
    await expect(page).toHaveURL(/\/p\/10$/);
  });

  test("keyboard-shortcuts button explains navigation", async ({ page }) => {
    await page.goto("/p/5");
    await page.getByRole("button", { name: /keyboard shortcuts/i }).click();
    await expect(page.getByText("Keyboard navigation")).toBeVisible();
    await expect(page.getByText(/next page/i)).toBeVisible();
    await expect(page.getByText(/previous page/i)).toBeVisible();
  });

  test("arrow keys navigate between pages", async ({ page }) => {
    await page.goto("/p/5");
    // KeyboardNav attaches its keydown listener in a useEffect, so the listener
    // only exists once React has hydrated. page.goto() resolves before that, and
    // a keypress sent into the gap is silently dropped — the test then fails
    // with "expected /p/6, got /p/5" and looks like broken navigation. Wait for
    // hydration (any client handler being live implies it) before pressing.
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("slider").first()).toBeEnabled();
    await page.keyboard.press("ArrowRight");
    await expect(page).toHaveURL(/\/p\/6$/);
    await page.keyboard.press("ArrowLeft");
    await expect(page).toHaveURL(/\/p\/5$/);
  });

  test("arrow keys do not hijack a focused slider", async ({ page }) => {
    await page.goto("/p/6"); // has a Samples slider
    const slider = page.getByRole("slider").first();
    await slider.focus();
    await page.keyboard.press("ArrowLeft");
    // Still on page 6 — the slider consumed the arrow, no page change.
    await expect(page).toHaveURL(/\/p\/6$/);
  });

  test("navigation between two stub routes works", async ({ page }) => {
    await page.goto("/p/1");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Think Fast, Think Slow");
    await page.getByRole("link", { name: "Page 2 →" }).click();
    await expect(page).toHaveURL(/\/p\/2$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("System 1 Thinking Fails Often on Real-World Tasks");
  });
});
