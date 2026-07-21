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
  await page.getByRole("group", { name: /the four names/i }).getByRole("button").first().click();
  await page.getByRole("button", { name: /run it/i }).click();
  await expect(page.getByText(/looks like a System 1 question/i)).toBeVisible({
    timeout: 20_000,
  });
}

/** Page 4's full arc: flip both tiles, vote, then vote again on the bills. */
async function revealPage4(page: Page) {
  await page.getByRole("button", { name: /seen this one/i }).click();
  await page.getByRole("button", { name: /work it out/i }).click();
  await page
    .getByRole("group", { name: /first vote/i })
    .getByRole("button", { name: /feed the factory/i })
    .click();
  await page
    .getByRole("group", { name: /second vote/i })
    .getByRole("button", { name: /buy more thinking/i })
    .click();
  await expect(page.getByText(/^the marginal dollar moved to thinking\.$/i)).toBeVisible();
}

test.describe("Act 1 (pages 1–5)", () => {
  test("traverses Act 1 in order", async ({ page }) => {
    await page.goto("/p/1");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Think Fast, Think Slow");
    for (let n = 2; n <= 5; n++) {
      await page.getByRole("link", { name: `Page ${n} →` }).click();
      await expect(page).toHaveURL(new RegExp(`/p/${n}$`));
    }
  });

  test("Page 2: the reader answers, the machine declines, the two systems land", async ({
    page,
  }) => {
    await page.goto("/p/2");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Two Systems");
    // The machine panel and its example-reply label are on screen from the start.
    await expect(page.getByText("example reply, authored · live model to follow")).toBeVisible();
    // Run is grayed until the reader takes their turn.
    await expect(page.getByRole("button", { name: /run it/i })).toBeDisabled();
    // The reader's turn: pick a name, get a verdict, lose the override button.
    await expect(page.getByRole("button", { name: /let the machine take it/i })).toBeVisible();
    await page.getByRole("group", { name: /the four names/i }).getByRole("button").first().click();
    await expect(page.getByRole("button", { name: /let the machine take it/i })).toBeHidden();
    // Run the example reply now that it is unlocked.
    await expect(page.getByRole("button", { name: /run it/i })).toBeEnabled();
    await page.getByRole("button", { name: /run it/i }).click();
    // The streamed reply owns the gap in its training data, then points to search.
    await expect(page.getByText(/not trained on that information/)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/quick Google search should lead you to the answer/)).toBeVisible({
      timeout: 20_000,
    });
    // ...and the two-systems analysis lands with the trap and the teaser.
    await expect(page.getByText("System 1 · the pop")).toBeVisible();
    await expect(page.getByText("System 2 · the steps")).toBeVisible();
    await expect(page.getByText(/guess wearing certainty's clothes/)).toBeVisible();
    await expect(page.getByText(/trained on data that includes that night/)).toBeVisible();
  });

  test("Page 3: the daily-retraining meter runs away, then the guess box hands off", async ({
    page,
  }) => {
    await page.goto("/p/3");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Daily Training?");
    // The spec's hard rule: no inference talk anywhere on this page.
    expect(await page.locator("article").innerText()).not.toMatch(/inference/i);
    // No drag-to-reveal: all three figures and both captions are on from paint.
    await expect(page.getByText(/training every day is simply not feasible/i)).toBeVisible();
    await expect(page.getByText(/assumed you kept retraining the same model/i)).toBeVisible();
    // Drag the year out with the keyboard: End jumps the slider to day 365.
    const slider = page.getByRole("slider", { name: /drag through the year/i });
    await slider.focus();
    await slider.press("End");
    // The main total and the combined figure's same-model tile both read $28.5B.
    await expect(page.getByText("$28.5B", { exact: true }).first()).toBeVisible();
    const months = page.getByRole("slider", { name: /drag through five years/i });
    await months.focus();
    await months.press("End");
    await expect(page.getByText("$2.6T", { exact: true })).toBeVisible();
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
    const slider = page.getByRole("slider", { name: /drag through the year/i });
    await slider.focus();
    await slider.press("End");
    await page.getByRole("button", { name: "Skip" }).click();
    await expectAxeClean(page);
  });

  test("Page 4: names hidden until the flip, then the bills land the verdict", async ({ page }) => {
    await page.goto("/p/4");
    // Neither AI word may appear before the tiles are flipped.
    expect(await page.locator("article").innerText()).not.toMatch(/training|inference/i);
    await page.getByRole("button", { name: /seen this one/i }).click();
    await page.getByRole("button", { name: /work it out/i }).click();
    await expect(page.getByText("Training", { exact: true })).toBeVisible();
    await expect(page.getByText("Inference", { exact: true })).toBeVisible();
    await page
      .getByRole("group", { name: /first vote/i })
      .getByRole("button", { name: /feed the factory/i })
      .click();
    await expect(page.getByText(/training burns like building the factory/i)).toBeVisible();
    // Climb all four rungs of the energy ladder.
    const climb = page.getByRole("button", { name: /climb a rung/i });
    for (let i = 0; i < 4; i++) {
      await climb.click();
    }
    await expect(page.getByRole("button", { name: /top of the ladder/i })).toBeDisabled();
    await page
      .getByRole("group", { name: /second vote/i })
      .getByRole("button", { name: /buy more thinking/i })
      .click();
    await expect(page.getByText(/^the marginal dollar moved to thinking\.$/i)).toBeVisible();
    // The three-row strip: three problems, two machines, one line each.
    await expect(page.getByText("thinking's job")).toBeVisible();
    await expect(page.getByText("only thinking arrives in time")).toBeVisible();
    await expect(page.getByText("only the factory puts it in there")).toBeVisible();
  });

  for (const n of [1, 2, 3, 4, 5]) {
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

  test("Page 4 post-reveal state has no serious/critical accessibility violations", async ({
    page,
  }) => {
    await page.goto("/p/4");
    await revealPage4(page);
    await expectAxeClean(page);
  });
});
