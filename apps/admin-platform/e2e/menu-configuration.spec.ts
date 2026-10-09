import { expect, test } from "@playwright/test";

/** 所有 API 使用夹具；检验真实组件交互，不写业务数据库。 */
test("菜单分组编辑、窄屏保存及应用向导草稿", async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  const actions = [
    "application:read",
    "application:create",
    "application:update",
    "menu:read",
    "menu:create",
    "menu:update",
    "resource:read",
    "action:read",
  ].map((action) => `iam-platform:${action}`);
  const detail = (record: object) => ({
    record,
    fieldAccess: {},
    capabilities: Object.fromEntries(actions.map((code) => [code, { allowed: true }])),
    version: "0",
  });
  const app = {
    id: "2",
    code: "orders",
    domain: "TENANT",
    name: "订单应用",
    sortOrder: 0,
    baseline: false,
    status: "ENABLED",
  };
  let menu = {
    id: "3",
    applicationId: "2",
    name: "订单详情",
    kind: "PAGE",
    path: "/orders",
    viewPath: "platform.iam.applications",
    routeName: "",
    accessMode: "OPEN",
    matchMode: "ANY",
    actionIds: [],
    sortOrder: 0,
    status: "ENABLED",
    hidden: true,
    isCache: true,
    props: true,
    routeParams: [
      { name: "a", remark: "订单编号" },
      { name: "b", remark: "业务类型" },
    ],
    resolvedPath: "/orders/:a/:b",
  };
  const requests: Array<[string, string]> = [];
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (!path.startsWith("/api/")) {
      await route.continue();
      return;
    }
    requests.push([route.request().method(), path]);
    let data: unknown;
    if (path.endsWith("/bootstrap"))
      data = {
        context: { domain: "PLATFORM", accountId: "1", memberId: "1", tenantId: null },
        profile: { memberId: "1", displayName: "验收用户" },
        applications: [{ id: "1", code: "iam-platform", name: "平台治理", sortOrder: 0 }],
        menus: [
          {
            id: "100",
            applicationId: "1",
            name: "平台",
            kind: "DIRECTORY",
            path: "/platform",
            viewPath: "layout.main",
            sortOrder: 0,
            children: [
              {
                id: "101",
                applicationId: "1",
                name: "应用目录",
                kind: "PAGE",
                path: "/iam/applications",
                viewPath: "platform.iam.applications",
                isCache: true,
                sortOrder: 0,
                children: [],
              },
              {
                id: menu.id,
                applicationId: "1",
                name: menu.name,
                kind: menu.kind,
                path: menu.resolvedPath,
                viewPath: menu.viewPath,
                hidden: menu.hidden,
                isCache: menu.isCache,
                props: menu.props,
                sortOrder: 1,
                children: [],
              },
            ],
          },
        ],
        actionCodes: actions,
        version: "1",
        expiresAt: "2099-01-01T00:00:00Z",
      };
    else if (path.endsWith("/applications"))
      data = { items: [detail(app)], total: 1, page: 1, pageSize: 20 };
    else if (path.endsWith("/menus") && route.request().method() === "GET")
      data = [{ ...detail(menu), children: [] }];
    else if (path.endsWith("/menus/3") && route.request().method() === "PUT") {
      menu = {
        ...menu,
        ...(route.request().postDataJSON() as { menu: Partial<typeof menu> }).menu,
      };
      data = { ...detail(menu), version: "1" };
    } else if (path.endsWith("/applications/2")) data = detail(app);
    else data = { items: [], total: 0, page: 1, pageSize: 20 };
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ code: "S0200", message: "ok", success: true, data }),
    });
  });
  await page.addInitScript(() => {
    document.addEventListener("DOMContentLoaded", () => {
      const style = document.createElement("style");
      style.textContent =
        ".tsqd-parent-container, #vue-devtools__anchor { display: none !important; }";
      document.head.append(style);
    });
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  const drawer = () => page.locator(".el-drawer:visible").last();
  await page.goto("/iam/applications");
  await page.getByText("订单应用", { exact: true }).click();
  await drawer().getByText("菜单", { exact: true }).click();
  await drawer().getByRole("button", { name: "详情", exact: true }).click();
  await drawer().getByText("高级配置", { exact: true }).click();
  await expect(drawer()).toContainText("/orders/:a/:b");
  await expect(drawer()).toContainText("订单编号");
  await drawer().getByRole("button", { name: "编辑当前分组" }).click();
  await expect(page.getByPlaceholder("留空使用菜单 ID 生成稳定名称")).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("menu-wide.png") });
  await page.getByPlaceholder("留空使用菜单 ID 生成稳定名称").fill("draft");
  await drawer().getByRole("button", { name: "取消", exact: true }).click();
  await expect(page.locator(".el-message-box:visible")).toContainText(
    "退出后，修改的内容不会被保存",
  );
  await page
    .locator(".el-message-box:visible")
    .getByRole("button", { name: "确定", exact: true })
    .click();
  await expect(drawer()).toContainText("业务类型");
  await page.setViewportSize({ width: 390, height: 844 });
  await drawer().getByRole("button", { name: "编辑当前分组" }).click();
  await expect(page.getByPlaceholder("留空使用菜单 ID 生成稳定名称")).toBeVisible();
  const size = await drawer().evaluate((el) => ({ width: el.clientWidth, scroll: el.scrollWidth }));
  expect(size.scroll).toBe(size.width);
  await page.screenshot({ path: testInfo.outputPath("menu-narrow.png") });
  // 改变 Bootstrap 的路由配置，验证缓存失效不会关闭当前详情抽屉。
  const cacheField = drawer().locator(".el-form-item").filter({ hasText: "缓存页面" });
  await cacheField.locator(".el-switch").click();
  await expect(cacheField.getByRole("switch")).not.toBeChecked();
  await drawer().getByRole("button", { name: "保存", exact: true }).click();
  await expect(drawer()).toContainText("订单编号");
  await expect
    .poll(
      () =>
        requests.filter(([method, path]) => method === "GET" && path.endsWith("/bootstrap")).length,
    )
    .toBe(2);
  await page.setViewportSize({ width: 1440, height: 1000 });
  for (let i = 0; i < 2; i++) {
    const count = await page.locator(".el-drawer:visible").count();
    await drawer().locator(".el-drawer__close-btn").click();
    await expect(page.locator(".el-drawer:visible")).toHaveCount(count - 1);
  }
  await page.getByText("组织应用", { exact: true }).click();
  await page.getByRole("button", { name: "创建应用", exact: true }).click();
  await drawer().getByPlaceholder("如 contacts，创建后不可改").fill("shop");
  await drawer().getByPlaceholder("请输入应用名称").fill("演示应用");
  const next = async () => {
    await drawer().getByRole("button", { name: "下一步", exact: true }).click();
    // 框架 InButton 的公共 in-click 有 1200ms 防重复提交间隔。
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(1250);
  };
  await next();
  await next();
  await drawer().getByRole("button", { name: "创建菜单", exact: true }).click();
  await drawer().getByPlaceholder("如订单详情").fill("草稿详情");
  await drawer().getByPlaceholder("如 /orders，目录可空").fill("/draft-orders");
  await next();
  await drawer().getByText("按操作", { exact: true }).click();
  await page.locator(".el-select-dropdown:visible").getByText("开放", { exact: true }).click();
  await next();
  await drawer().getByRole("button", { name: "创建", exact: true }).click();
  await expect(drawer()).toContainText("草稿详情");
  expect(requests.filter(([method]) => method === "POST")).toEqual([]);
  await next();
  await expect(drawer()).toContainText("演示应用");
  await expect(drawer()).toContainText("/draft-orders");
});
