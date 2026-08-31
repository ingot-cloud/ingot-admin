import { expect, test } from "@playwright/test";

test("serves the admin application shell", async ({ page }) => {
  const response = await page.goto("/", { waitUntil: "domcontentloaded" });

  expect(response?.ok()).toBe(true);
  await expect(page).toHaveTitle("Ingot管理后台");
});
