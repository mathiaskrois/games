import { test, expect } from "@playwright/test";

test("hub links every game, remembers language and fits phones", async ({ page }) => {
  await page.goto("/games/");
  await expect(page.getByRole("link", { name: /Ord/ })).toHaveAttribute("href", "ord/");
  await page.getByRole("button", { name: "DA", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Vælg et spil" })).toBeVisible();
  for (const slug of ["ord", "2048", "sudoku", "snake"]) {
    await page.locator('.game-card[data-game="' + slug + '"]').click();
    await expect(page).toHaveURL("/games/" + slug + "/");
    await expect(page.locator("html")).toHaveAttribute("lang", "da");
    await expect(page.getByRole("button", { name: "Sådan spiller du" })).toBeVisible();
    await expect(page.locator("h1")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole("link", { name: "← Alle spil" }).click();
    await expect(page.getByRole("heading", { name: "Vælg et spil" })).toBeVisible();
  }
});

test("legacy Ord redirects with saved state intact", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("krois-ord-v1", JSON.stringify({
    lang: "en", en: { answer: "APPLE", guesses: ["GRAPE"], entry: "AP" },
  })));
  await page.goto("/ord/");
  await expect(page).toHaveURL("/games/ord/");
  await expect(page.locator(".tile.correct")).toHaveCount(1);
  await expect(page.locator(".tile.filled")).toHaveCount(2);
});

test("2048 celebrates, saves the board, and supports undo", async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem("krois-games-2048-v1")) localStorage.setItem("krois-games-2048-v1", JSON.stringify({
      session: { board: [1024, 1024, ...Array(14).fill(0)], score: 0, won: false, moves: 0 },
    }));
  });
  await page.goto("/games/2048/");
  await page.getByRole("button", { name: "Left" }).click();
  await expect(page.getByRole("heading", { name: "You made 2048!" })).toBeVisible();
  await page.getByRole("button", { name: "Keep playing" }).click();
  await page.reload();
  await expect(page.locator('[data-value="2048"]')).toBeVisible();
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.locator('[data-value="1024"]')).toHaveCount(2);
});

test("Sudoku handles notes, hints, persistence, and completion", async ({ page }) => {
  await page.goto("/games/sudoku/");
  const selected = page.locator("#play-board .selected");
  await page.getByRole("button", { name: "Notes", exact: true }).click();
  await page.getByRole("button", { name: "1", exact: true }).click();
  await expect(selected.locator(".notes")).toContainText("1");
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(selected.locator(".notes")).toHaveCount(0);
  await page.getByRole("button", { name: "Hint", exact: true }).click();
  const digit = await selected.textContent();
  await page.reload();
  await expect(selected).toHaveText(digit!);
  const cells = page.locator("#play-board button");
  for (let i = 0; i < 36; i++) {
    const cell = cells.nth(i);
    if ((await cell.textContent())?.trim()) continue;
    await cell.click();
    await page.getByRole("button", { name: "Hint", exact: true }).click();
  }
  await expect(page.getByRole("heading", { name: "Beautifully solved!" })).toBeVisible();
  await page.getByRole("button", { name: "New puzzle", exact: true }).last().click();
  await expect(page.locator("#scoreboard")).toContainText("18/36");
});

test("Snake starts, pauses, persists, and can replay after a collision", async ({ page }) => {
  await page.goto("/games/snake/");
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await expect(page.locator("#scoreboard")).toContainText("1Score");
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await page.reload();
  await expect(page.getByRole("status")).toHaveText("Paused");
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Round over" })).toBeVisible();
  await page.getByRole("button", { name: "Play again" }).click();
  await expect(page.getByRole("button", { name: "Start", exact: true })).toBeVisible();
});

test("service worker opens each correct route offline", async ({ page, context, browserName }) => {
  test.skip(browserName === "webkit", "WebKit offline emulation blocks service worker navigation.");
  await page.goto("/games/");
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await context.setOffline(true);
  for (const [path, title] of [["", "Play a little."], ["ord/", "Ord."], ["2048/", "2048."], ["sudoku/", "Mini Sudoku."], ["snake/", "Snake."]]) {
    await page.goto("/games/" + path);
    await expect(page.getByRole("heading", { name: new RegExp(title.replaceAll(" ", " ?")), level: 1 })).toBeVisible();
  }
});
