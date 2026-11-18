import { test, expect } from "@playwright/test";

test("theme defaults to dark, persists across all games, and respects a later change", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/games/");
  const toggle = page.getByRole("switch", { name: "Dark mode" });
  await expect(toggle).toBeChecked();
  await toggle.click();
  for (const path of ["ord", "2048", "sudoku", "snake"]) {
    await page.goto("/games/" + path + "/");
    await expect(toggle).not.toBeChecked();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  }
  await page.getByRole("button", { name: "DA", exact: true }).click();
  await page.getByRole("switch", { name: "Mørk tilstand" }).click();
  await page.reload();
  await expect(page.getByRole("switch")).toBeChecked();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});
