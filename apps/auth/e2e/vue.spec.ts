import { expect, test } from "@playwright/test";

test("serves the login application shell", async ({ page }) => {
  const response = await page.goto("/", { waitUntil: "domcontentloaded" });

  expect(response?.ok()).toBe(true);
  await expect(page).toHaveTitle("Ingot统一身份认证 - Ingot管理后台");
});
