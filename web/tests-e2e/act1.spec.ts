import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

async function expectAxeClean(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  const serious = results.violations.filter(
    (v) => v.impact === "serious" || v.impact === "critical",
  );
  expect(serious, JSON.stringify(serious.map((v) => v.id))).toEqual([]);
}

/**
 * Drive page 2 end to end: answer the question as a reader, hand it to the
 * machine, run the reply (it streams at ~55ms/word), and wait for the
 * two-systems analysis to land.
 */
async function finishPage2(page: Page) {
  await page.getByRole("textbox", { name: /how many world cups/i }).fill("2");
  await page.getByRole("button", { name: /^answer$/i }).click();
  await page.getByRole("button", { name: /run it/i }).click();
  await expect(page.getByText(/same question, two paths/i)).toBeVisible({
    timeout: 20_000,
  });
}

test.describe("Act 1 (pages 1–4)", () => {
  test("traverses Act 1 in order", async ({ page }) => {
    await page.goto("/p/1");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Think Fast, Think Slow");
    for (let n = 2; n <= 4; n++) {
      await page.getByRole("link", { name: `Page ${n} →` }).click();
      await expect(page).toHaveURL(new RegExp(`/p/${n}$`));
    }
  });

  test("Page 2: the reader answers, the machine declines, the two systems land", async ({
    page,
  }) => {
    await page.goto("/p/2");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Thinking in Reality");
    // The machine panel and its example-reply label are on screen from the start.
    await expect(page.getByText("example reply, authored · live model to follow")).toBeVisible();
    // Run is grayed until the reader takes their turn.
    await expect(page.getByRole("button", { name: /run it/i })).toBeDisabled();
    // The reader's turn: type a count, answer, lose the pass button.
    await expect(page.getByRole("button", { name: /let the machine take it/i })).toBeVisible();
    await page.getByRole("textbox", { name: /how many world cups/i }).fill("2");
    await page.getByRole("button", { name: /^answer$/i }).click();
    await expect(page.getByRole("button", { name: /let the machine take it/i })).toBeHidden();
    // Run the example reply now that it is unlocked.
    await expect(page.getByRole("button", { name: /run it/i })).toBeEnabled();
    await page.getByRole("button", { name: /run it/i }).click();
    // The streamed blurt is the confident stale count off the 2010-only memory.
    await expect(page.getByText(/One\. Spain won it in 2010\./)).toBeVisible({ timeout: 20_000 });
    // ...and the two-systems analysis with the paths strip is on screen.
    await expect(page.getByText("System 1 · the pop")).toBeVisible();
    await expect(page.getByText("System 2 · the steps")).toBeVisible();
    await expect(page.getByText(/same question, two paths/i)).toBeVisible();
    await expect(page.getByText(/stops one short/i)).toBeVisible();
    await expect(page.getByText(/trained it on data that includes that final/)).toBeVisible();
  });

  test("Page 3: the combined-rates figure runs away, then the guess box hands off", async ({
    page,
  }) => {
    await page.goto("/p/3");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Training-Time Scaling");
    // The spec's hard rule: no inference talk anywhere on this page.
    expect(await page.locator("article").innerText()).not.toMatch(/inference/i);
    // No drag-to-reveal: both problems are on from paint, on one numbered spine.
    await expect(
      page.getByRole("heading", { level: 2, name: /1\. The bill compounds/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: /2\. The data runs out/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: /3\. So what is left\?/i }),
    ).toBeVisible();
    await expect(page.getByText("≈300T tokens")).toBeVisible();
    await expect(page.getByText("2026–2032", { exact: true })).toBeVisible();
    // The old one-year meter is gone (scaling-laws pivot).
    await expect(page.getByRole("slider", { name: /drag through the year/i })).toHaveCount(0);
    // Drag the year out with the keyboard: End jumps the slider to month 12.
    const months = page.getByRole("slider", { name: /drag through the first year/i });
    await months.focus();
    await months.press("End");
    await expect(page.getByText("$45.5B", { exact: true })).toBeVisible();
    // The optional guess box hands off to the next page.
    await page.getByRole("textbox", { name: /your guess/i }).fill("let it look things up");
    await page.getByRole("button", { name: /lock it in/i }).click();
    await expect(page.getByText(/Hold that thought\./)).toBeVisible();
    await expect(page.getByText(/The answer is one page away\./)).toBeVisible();
  });

  test("Page 3 post-drag state has no serious/critical accessibility violations", async ({
    page,
  }) => {
    await page.goto("/p/3");
    const months = page.getByRole("slider", { name: /drag through the first year/i });
    await months.focus();
    await months.press("End");
    await page.getByRole("button", { name: "Skip" }).click();
    await expectAxeClean(page);
  });

  test("Page 4: every road walks to the same 223,300", async ({ page }) => {
    await page.goto("/p/4");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Reasoning in Multiplication",
    );
    // Act 1's hard rule now covers its finale too: no Act 2 jargon.
    expect(await page.locator("article").innerText()).not.toMatch(/inference/i);
    // The meaning band and the open questions are on from first paint.
    await expect(page.getByText(/Three journeys, one destination/i)).toBeVisible();
    await expect(page.getByText(/chart its own road/i)).toBeVisible();
    // Walk each road with Next until it lands; every one arrives at 223,300.
    for (const method of ["standard", "lines", "vedic"]) {
      await page.getByLabel("Method").selectOption(method);
      const next = page.getByRole("button", { name: /next/i });
      for (let i = 0; i < 8 && !(await next.isDisabled()); i++) {
        await next.click();
      }
      await expect(next).toBeDisabled();
      await expect(page.getByText(/Same destination: 223,300\./).first()).toBeVisible();
    }
  });

  test("Page 1: sorting a question into the correct system locks it in", async ({ page }) => {
    await page.goto("/p/1");
    await page.getByRole("button", { name: "Recognize a friend's face" }).click();
    // Two "Place here" buttons appear; the first is the System 1 (fast) bin.
    await page.getByRole("button", { name: "Place here" }).first().click();
    await expect(page.getByText("1 / 6 sorted")).toBeVisible();
  });

  for (const n of [1, 2, 3, 4]) {
    test(`Page ${n} has no serious/critical accessibility violations`, async ({ page }) => {
      await page.goto(`/p/${n}`);
      await expectAxeClean(page);
    });
  }

  test("Page 2 post-reply state has no serious/critical accessibility violations", async ({
    page,
  }) => {
    await page.goto("/p/2");
    await finishPage2(page);
    await expectAxeClean(page);
  });
});
