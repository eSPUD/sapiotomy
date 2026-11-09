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
    // Page 5 has no slider, so the probe is its chain stepper: the step counter
    // only moves once React has attached the click handler.
    await page.waitForLoadState("networkidle");
    await expect(async () => {
      await page.getByRole("button", { name: /Next ▸/ }).click();
      await expect(page.getByText(/step [1-9]/)).toBeVisible({ timeout: 500 });
    }).toPass({ timeout: 10_000 });
    await page.keyboard.press("ArrowRight");
    await expect(page).toHaveURL(/\/p\/6$/);
    await page.keyboard.press("ArrowLeft");
    await expect(page).toHaveURL(/\/p\/5$/);
  });

  test("arrow keys do not hijack a focused slider", async ({ page }) => {
    await page.goto("/p/6"); // has the token-budget slider
    const slider = page.getByRole("slider").first();
    await slider.focus();
    await page.keyboard.press("ArrowLeft");
    // Still on page 6 — the slider consumed the arrow, no page change.
    await expect(page).toHaveURL(/\/p\/6$/);
  });

  test("navigation between two stub routes works", async ({ page }) => {
    await page.goto("/p/1");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Think Fast, Think Slow");
    await page.getByRole("navigation", { name: "Page navigation" }).getByRole("link", { name: "2. Thinking in Reality →" }).click();
    await expect(page).toHaveURL(/\/p\/2$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Thinking in Reality");
  });
});
