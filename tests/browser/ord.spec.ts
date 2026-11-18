import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem("krois-ord-v1")) localStorage.setItem("krois-ord-v1", JSON.stringify({
      lang: "en", en: { answer: "APPLE", guesses: [], entry: "" }, da: { answer: "ÆBLER", guesses: [], entry: "" },
    }));
  });
});

test("English guesses, validation, reload, celebration, replay and stats", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.goto("/ord/");
  await expect(page.getByRole("button", { name: "A", exact: true })).toBeEnabled();
  await page.keyboard.type("zzzzz");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toContainText("isn’t in the dictionary");
  for (let i = 0; i < 5; i++) await page.keyboard.press("Backspace");
  await page.keyboard.type("grape");
  await page.keyboard.press("Enter");
  await expect(page.locator(".tile.reveal")).toHaveCount(5);
  await expect(page.getByRole("button", { name: "A", exact: true })).toBeEnabled();
  await page.reload();
  await expect(page.locator(".tile.present")).toHaveCount(2);
  await expect(page.locator(".tile.correct")).toHaveCount(1);
  await page.keyboard.type("apple");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Beautifully done." })).toBeVisible();
  await expect(page.getByRole("dialog")).toContainText("2 guesses");
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.getByRole("button", { name: "Your word story" }).click();
  await expect(page.locator(".stats-grid strong")).toHaveText(["1", "100", "1", "1"]);
  await page.getByRole("button", { name: "Back to my board" }).click();
  await page.getByRole("button", { name: "View result" }).click();
  await page.getByRole("button", { name: "Yes, a new word" }).click();
  await expect(page.locator(".tile.correct")).toHaveCount(0);
  await expect(page.locator("#attempt-label")).toHaveText("GUESS 1 OF 6");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  if (test.info().project.name === "iphone-webkit") {
    const keyboard = await page.locator("#keyboard").boundingBox();
    expect(keyboard!.y + keyboard!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  }
  expect(errors).toEqual([]);
});

test("Danish touch keyboard and independent language progress", async ({ page }) => {
  await page.goto("/ord/");
  await expect(page.getByRole("button", { name: "A", exact: true })).toBeEnabled();
  await page.keyboard.type("app");
  await page.getByRole("button", { name: "Dansk", exact: true }).click();
  await expect(page.getByRole("button", { name: "Æ", exact: true })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Ø", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Å", exact: true })).toBeVisible();
  for (const letter of "ÆBLER") await page.getByRole("button", { name: letter, exact: true }).click();
  await page.getByRole("button", { name: "Enter", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Smukt klaret." })).toBeVisible();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.getByRole("button", { name: "English", exact: true }).click();
  await expect(page.locator(".tile.filled")).toHaveCount(3);
  await expect(page.locator(".tile.correct")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("six failed guesses reveal the answer and allow replay", async ({ page }) => {
  await page.goto("/ord/");
  for (const word of ["CRANE", "GHOST", "MUSIC", "LIGHT", "WATER", "STONE"]) {
    await expect(page.getByRole("button", { name: "A", exact: true })).toBeEnabled();
    await page.keyboard.type(word);
    await page.keyboard.press("Enter");
  }
  await expect(page.getByRole("heading", { name: "A word for next time." })).toBeVisible();
  await expect(page.locator(".answer")).toHaveText("APPLE");
  await page.getByRole("button", { name: "Yes, a new word" }).click();
  await expect(page.getByRole("button", { name: "A", exact: true })).toBeEnabled();
});

test("help, reduced motion and reload do not double-count a win", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/ord/");
  await page.getByRole("button", { name: "How to play", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Repeated letters");
  await page.getByRole("button", { name: "Let’s play" }).click();
  await expect(page.getByRole("button", { name: "A", exact: true })).toBeEnabled();
  await page.keyboard.type("apple");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Beautifully done." })).toBeVisible();
  await expect(page.locator("#confetti i")).toHaveCount(0);
  await page.reload();
  await page.getByRole("button", { name: "Your word story" }).click();
  await expect(page.locator(".stats-grid strong")).toHaveText(["1", "100", "1", "1"]);
});

test("the game and both dictionaries work after an offline reload", async ({ page, context, browserName }) => {
  test.skip(browserName === "webkit", "WebKit offline emulation blocks service-worker navigation.");
  await page.goto("/ord/");
  await expect(page.getByRole("button", { name: "A", exact: true })).toBeEnabled();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise<void>(resolve => navigator.serviceWorker.addEventListener("controllerchange", () => resolve(), { once: true }));
    if (navigator.serviceWorker.controller?.scriptURL !== new URL("/ord/sw.js", location.origin).href) throw new Error("Wrong service-worker scope");
  });
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Ord." })).toBeVisible();
  await expect(page.getByRole("button", { name: "A", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Dansk", exact: true }).click();
  await expect(page.getByRole("button", { name: "Æ", exact: true })).toBeEnabled();
});

test("the complete keyboard fits short and tall phones", async ({ page, browserName }) => {
  for (const [width, height] of [[320, 568], [375, 667], [390, 844]]) {
    await page.setViewportSize({ width, height });
    await page.goto("/ord/");
    await expect(page.getByRole("button", { name: "A", exact: true })).toBeEnabled();
    const keyboard = await page.locator("#keyboard").boundingBox();
    expect(keyboard!.y + keyboard!.height).toBeLessThanOrEqual(height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (width === 390 && browserName === "webkit") await page.screenshot({ path: ".local/ord-mobile.png", fullPage: true });
  }
});
