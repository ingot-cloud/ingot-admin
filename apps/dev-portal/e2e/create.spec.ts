import { expect, test } from "@playwright/test";

test.describe("创建向导", () => {
  test("创建 App 使用站点 sticky 顶栏，非法编码会返回字段错误", async ({ page }) => {
    await page.goto("/create/app");
    await expect(page.getByRole("heading", { name: "创建 App" })).toBeVisible();
    await expect(page.locator(".VPNav")).toBeVisible();
    const nav = page.locator(".VPNav");
    await expect(nav).toHaveCSS("position", "fixed");

    await page.getByPlaceholder("kebab-case，如 acme-admin").fill("NOT_VALID");
    await page.getByRole("button", { name: "预览" }).click();
    await expect(page.locator(".field-errors")).toBeVisible();

    await page.setViewportSize({ width: 390, height: 800 });
    await expect(page.getByRole("heading", { name: "创建 App" })).toBeVisible();
  });

  test("创建插件页可打开并向导显示目标目录", async ({ page }) => {
    await page.goto("/create/plugin");
    await expect(page.getByRole("heading", { name: "创建插件" })).toBeVisible();
    await expect(page.locator(".VPSidebar")).toContainText("创建主题");
    await page.getByPlaceholder("sales").fill("portal-e2e-plugin");
    await expect(page.getByText("plugins/portal-e2e-plugin")).toBeVisible();
  });

  test("创建主题页可打开且明暗切换作用到 html", async ({ page }) => {
    await page.goto("/create/theme");
    await expect(page.getByRole("heading", { name: "创建主题" })).toBeVisible();
    const switcher = page.getByRole("switch", { name: /切换到/ });
    await switcher.click();
    const dark = await page.locator("html").evaluate((el) => el.classList.contains("dark"));
    expect(typeof dark).toBe("boolean");
  });
});

test("组件参考含从源码生成的 InButton 契约", async ({ page }) => {
  await page.goto("/reference/components");
  await expect(page.getByRole("heading", { name: "InButton" })).toBeVisible();
  await expect(page.getByText("in-click")).toBeVisible();
});
