import { expect, test, type Page } from "@playwright/test";

const application = {
  id: "17",
  code: "platform:member",
  name: "App 用户管理",
  icon: "ep:iphone",
  sortOrder: 4,
};
const pages = [
  { key: "user", path: "users", name: "用户管理", icon: "ep:user" },
  { key: "role", path: "roles", name: "角色管理", icon: "ep:avatar" },
  { key: "permission", path: "permissions", name: "权限管理", icon: "ep:key" },
];
const reads = pages.map(({ key }) => `platform:member:${key}:query`);
const user = {
  id: "21",
  username: "app-user",
  nickname: "测试 App 用户",
  enabled: true,
  locked: false,
};
const builtIn = {
  id: "31",
  name: "基础用户",
  code: "role_member_user",
  builtIn: true,
  status: "0",
};
const reviewer = { id: "32", name: "审核员", code: "reviewer", builtIn: false, status: "0" };
const permission = { id: "41", name: "查看订单", code: "order:read", type: "1", status: "0" };

async function fixture(page: Page, actionCodes: string[]) {
  const context = { domain: "PLATFORM", accountId: "1", memberId: "1", tenantId: null };
  const capabilities = { context, actionCodes, version: "1", expiresAt: "2099-01-01T00:00:00Z" };
  const readRequests: string[] = [];
  const writes: string[][] = [];
  const permissionWrites: string[][] = [];
  let assigned = [reviewer.id];
  let boundPermissions = [permission.id];

  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    let data: unknown = null;
    if (path.endsWith("/bootstrap")) {
      data = {
        ...capabilities,
        profile: { memberId: "1", displayName: "平台管理员" },
        applications: [application],
        menus: [
          {
            id: "10",
            applicationId: application.id,
            name: application.name,
            kind: "DIRECTORY",
            path: "/member",
            viewPath: "layout.main",
            routeName: "member.root",
            icon: application.icon,
            children: pages
              .filter((item) => actionCodes.includes(`platform:member:${item.key}:query`))
              .map((item) => ({
                id: item.key,
                applicationId: application.id,
                name: item.name,
                kind: "PAGE",
                icon: item.icon,
                path: `/member/${item.path}`,
                viewPath: `member.${item.key}`,
                routeName: `member.${item.key}`,
                children: [],
              })),
          },
        ],
      };
    } else if (path.endsWith("/capabilities")) {
      data = capabilities;
    } else if (path.endsWith("/bff/auth/me")) {
      data = { ...context, userId: "1" };
    } else if (path.endsWith("/bff/auth/csrf")) {
      data = { csrfToken: "member-test-token" };
    } else if (path.endsWith("/user/page")) {
      data = { current: 1, size: 20, total: 1, records: [user] };
    } else if (path.endsWith("/user/detail/21")) {
      data = { ...user, phone: "13800138000" };
    } else if (path.endsWith("/user/21/roles")) {
      if (request.method() === "PUT") {
        assigned = request.postDataJSON().setIds;
        writes.push(assigned);
      } else {
        data = [builtIn, ...[reviewer].filter((role) => assigned.includes(role.id))];
      }
    } else if (path.endsWith("/role/tree")) {
      data = [builtIn, reviewer];
    } else if (path.endsWith("/role/32/permissions")) {
      if (request.method() === "PUT") {
        boundPermissions = request.postDataJSON().setIds;
        permissionWrites.push(boundPermissions);
      } else {
        data = [permission].filter(({ id }) => boundPermissions.includes(id));
      }
    } else if (path.endsWith("/permission/tree")) {
      data = [permission];
    }
    if (path.includes("/api/member/") && request.method() === "GET") readRequests.push(path);
    await route.fulfill({ json: { success: true, code: "S0200", message: "ok", data } });
  });
  return { readRequests, writes, permissionWrites };
}

test("独立应用三页支持深链和刷新，只读隐藏写操作", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.route("https://api.iconify.design/**", (route) => route.abort());
  await fixture(page, [...reads, "platform:member:user:detail"]);
  for (const item of pages) {
    await page.goto(`/member/${item.path}`);
    await expect(
      page.locator(".in-page-header").getByText(item.name, { exact: true }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.locator(".in-page-header").getByText(item.name, { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /^(添加|删除|编辑|锁定|暂停账号|重置密码)/ }),
    ).toHaveCount(0);
  }
  const entry = page
    .locator(".in-app-bar-nav")
    .getByRole("button", { name: application.name, exact: true });
  await expect(entry).toBeVisible();
  await expect(entry.locator(".in-application-icon svg")).toBeVisible();
  await page.setViewportSize({ width: 480, height: 900 });
  await page.evaluate(() => document.documentElement.classList.add("dark"));
  await expect(page.getByText("查看订单", { exact: true })).toBeVisible();
  await page.goto("/member/users");
  await page.getByRole("button", { name: "详情", exact: true }).click();
  await expect(page.getByText("App 用户详情", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "编辑", exact: true })).toHaveCount(0);
  expect(pageErrors).toEqual([]);
});

test("角色和权限操作列在桌面及窄屏完整显示", async ({ page }) => {
  await fixture(page, [
    ...reads,
    "platform:member:role:create",
    "platform:member:permission:create",
    "platform:member:permission:update",
  ]);
  const scenarios = [
    { path: "roles", row: "审核员", add: "添加子角色" },
    { path: "permissions", row: "查看订单", add: "添加子权限" },
  ];
  for (const scenario of scenarios) {
    await page.goto(`/member/${scenario.path}`);
    const row = page.getByRole("row").filter({ hasText: scenario.row });
    const detail = row.getByRole("button", { name: "详情", exact: true });
    const add = row.getByRole("button", { name: scenario.add, exact: true });
    for (const width of [1440, 480]) {
      await page.setViewportSize({ width, height: 900 });
      for (const action of [detail, add]) {
        await expect(action).toBeInViewport({ ratio: 1 });
        await expect
          .poll(() =>
            action.evaluate((button) => {
              const cell = button.closest("td")!.getBoundingClientRect();
              const text = document.createRange();
              text.selectNodeContents(button);
              const lines = Array.from(text.getClientRects());
              return {
                lines: lines.length,
                fitsCell: lines.every(
                  (line) =>
                    line.left >= cell.left &&
                    line.right <= cell.right &&
                    line.top >= cell.top &&
                    line.bottom <= cell.bottom,
                ),
              };
            }),
          )
          .toEqual({ lines: 1, fitsCell: true });
      }
      if (scenario.path === "permissions") {
        const more = row.getByRole("button", { name: "更多", exact: true });
        await expect(more).toBeInViewport({ ratio: 1 });
        await more.click();
        await expect(page.getByRole("menu").getByRole("menuitem", { name: "锁定" })).toBeVisible();
        await page.keyboard.press("Escape");
      }
    }
  }
});

test("角色绑定独立加载，支持清除并保留内置角色", async ({ page }) => {
  const { readRequests, writes } = await fixture(page, [
    reads[0]!,
    reads[1]!,
    "platform:member:user:detail",
    "platform:member:user:roles:query",
    "platform:member:user:roles:set",
  ]);
  await page.goto("/member/users");
  await expect(page.getByRole("menuitem", { name: "权限管理", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "详情", exact: true }).click();
  await expect(page.getByText("App 用户详情", { exact: true })).toBeVisible();
  expect(readRequests.some((path) => path.endsWith("/user/21/roles"))).toBe(false);
  await page.getByRole("tab", { name: "用户角色", exact: true }).click();
  await page.getByRole("button", { name: "配置用户角色", exact: true }).click();
  const dialog = page
    .getByRole("dialog")
    .filter({ has: page.getByPlaceholder("搜索角色名或编码") });
  await expect(dialog.getByRole("button", { name: "移除 基础用户" })).toHaveCount(0);
  await dialog.getByRole("button", { name: "移除 审核员" }).click();
  await dialog.getByRole("button", { name: "保存", exact: true }).click();
  await expect.poll(() => writes).toEqual([[]]);
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole("button", { name: "配置用户角色", exact: true })).toContainText(
    "基础用户",
  );
  await expect(page.getByRole("button", { name: "配置用户角色", exact: true })).not.toContainText(
    "审核员",
  );
});

test("角色详情通过独立绑定接口维护权限", async ({ page }) => {
  const { readRequests, permissionWrites } = await fixture(page, [
    reads[1]!,
    reads[2]!,
    "platform:member:role:permissions:query",
    "platform:member:role:permissions:set",
  ]);
  await page.goto("/member/roles");
  await page.getByRole("button", { name: "审核员", exact: true }).click();
  await expect(page.getByText("角色详情", { exact: true })).toBeVisible();
  expect(readRequests.some((path) => path.endsWith("/role/32/permissions"))).toBe(false);
  await page.getByRole("tab", { name: "角色权限", exact: true }).click();
  const field = page.getByRole("button", { name: "配置角色权限", exact: true });
  await expect(field).toContainText("查看订单");
  await field.click();
  const dialog = page
    .getByRole("dialog")
    .filter({ has: page.getByPlaceholder("搜索权限名称或编码") });
  await dialog.getByRole("button", { name: "移除 查看订单" }).click();
  await dialog.getByRole("button", { name: "保存", exact: true }).click();
  await expect.poll(() => permissionWrites).toEqual([[]]);
  await expect(field).not.toContainText("查看订单");
});
