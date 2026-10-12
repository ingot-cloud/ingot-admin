import { expect, test, type Page } from "@playwright/test";
const pages = [
  {
    domain: "PLATFORM",
    app: "1",
    name: "字典管理",
    path: "/platform/settings/dictionaries",
    key: "platform.settings.dictionaries",
    description: "按作用域维护字典类型与字典项。",
  },
  {
    domain: "PLATFORM",
    app: "2",
    name: "凭证策略",
    path: "/security/credential-policies",
    key: "security.credential.policies",
    description: "按类型维护凭证策略，各分组独立保存。",
  },
  {
    domain: "PLATFORM",
    app: "2",
    name: "账号保护",
    path: "/security/account-protection",
    key: "security.account.protection",
    description: "分别维护管理员与会员的登录失败锁定策略。",
  },
  {
    domain: "PLATFORM",
    app: "2",
    name: "访问防护",
    path: "/security/access-protection",
    key: "security.access.protection",
    description: "维护访问规则、限流与登录失败防护策略。",
  },
  {
    domain: "PLATFORM",
    app: "2",
    name: "会话管理",
    path: "/security/sessions",
    key: "security.sessions",
    description: "查询在线会话并配置并发策略。",
  },
  {
    domain: "PLATFORM",
    app: "1",
    name: "平台授权审计",
    path: "/platform/authorization-audit",
    key: "platform.iam.authorization.audit",
    description: "平台授权审计",
  },
  {
    domain: "TENANT",
    app: "1",
    name: "组织授权审计",
    path: "/org/authorization-audit",
    key: "org.iam.authorization.audit",
    description: "当前组织授权审计",
  },
  {
    domain: "TENANT",
    app: "1",
    name: "成员访问策略",
    path: "/org/member-policies",
    key: "org.iam.member.policies",
    description: "通讯录可见范围与字段权限。预览来自后端，浏览器不重做策略引擎。",
  },
];
const allReads = [
  "dictionary",
  "credential-policy",
  "lockout-policy",
  "security-policy",
  "login-failure-policy",
  "session",
  "session-policy",
  "audit",
].map((resource) => `iam-platform:${resource}:read`);
const tenantReads = ["audit", "directory-policy", "field-policy"].map(
  (resource) => `iam-tenant:${resource}:read`,
);
async function fixture(
  page: Page,
  domain: string,
  codes = domain === "PLATFORM" ? allReads : tenantReads,
) {
  const reads: string[] = [];
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const context = {
    domain,
    accountId: "1",
    memberId: "101",
    tenantId: domain === "TENANT" ? "10" : null,
  };
  const detail = (record: object) => ({ record, fieldAccess: {}, capabilities: {}, version: "1" });
  const applications =
    domain === "PLATFORM"
      ? [
          { id: "1", code: "iam-platform", name: "平台治理", sortOrder: 0 },
          { id: "2", code: "platform:security", name: "安全中心", sortOrder: 1 },
        ]
      : [{ id: "1", code: "iam-tenant", name: "组织治理", sortOrder: 0 }];
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    if (!path.startsWith("/api/")) return route.continue();
    reads.push(path);
    let data: unknown = { items: [], total: 0, page: 1, pageSize: 20 };
    if (path.endsWith("/bootstrap"))
      data = {
        context,
        profile: { memberId: "101", displayName: "普通只读人员" },
        applications,
        menus: applications.map((app) => ({
          id: `root-${app.id}`,
          applicationId: app.id,
          name: app.name,
          kind: "DIRECTORY",
          path: app.id === "2" ? "/security" : domain === "PLATFORM" ? "/platform" : "/org",
          viewPath: "layout.main",
          children: pages
            .filter((item) => item.domain === domain && item.app === app.id)
            .map((item, i) => ({
              id: `${app.id}-${i}`,
              applicationId: app.id,
              name: item.name,
              kind: "PAGE",
              path: item.path,
              viewPath: item.key,
              routeName: item.key,
              children: [],
            })),
        })),
        actionCodes: codes,
        version: "1",
        expiresAt: "2099-01-01T00:00:00Z",
      };
    else if (path.endsWith("/capabilities"))
      data = { context, actionCodes: codes, version: "1", expiresAt: "2099-01-01T00:00:00Z" };
    else if (path.endsWith("/policies/directory"))
      data = detail({ defaultRevisionId: "1", rules: [] });
    else if (path.endsWith("/policies/fields"))
      data = detail({ defaultRevisionId: "1", rules: [], operationRules: [] });
    else if (path.includes("/dictionaries"))
      data =
        url.searchParams.get("view") === "page"
          ? { current: 1, size: 20, total: 0, records: [] }
          : [];
    else if (path.includes("/login-failure-policies/"))
      data = {
        dimension: path.split("/").at(-1),
        enabled: true,
        maxAttempts: 5,
        windowMinutes: 15,
        blockTtlSec: 300,
        blockKeyType: "IP",
      };
    else if (path.includes("/security/")) data = [];
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, code: "S0200", message: "ok", data }),
    });
  });
  return { reads, errors };
}
const domainOf = (name: string) => (name === "tenant" ? "TENANT" : "PLATFORM");

test("八个新入口分别支持深链接、刷新、窄屏和主题，只读无写按钮", async ({ page }, info) => {
  const domain = domainOf(info.project.name);
  const { errors } = await fixture(page, domain);
  for (const item of pages.filter((item) => item.domain === domain)) {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(item.path);
    await expect(
      page.locator(".in-page-header").getByText(item.description, { exact: true }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.locator(".in-page-header").getByText(item.description, { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /^(保存|编辑|删除|强制刷新策略|新建字典类型|新建分组)$/ }),
    ).toHaveCount(0);
    await page.setViewportSize({ width: 480, height: 900 });
    await page.evaluate(() => document.documentElement.classList.add("dark"));
    await expect(
      page.locator(".in-page-header").getByText(item.description, { exact: true }),
    ).toBeVisible();
    await expect(page.getByText("加载中", { exact: true }).filter({ visible: true })).toHaveCount(
      0,
    );
    await page.screenshot({
      path: info.outputPath(`${item.key}-narrow-dark.png`),
      animations: "disabled",
    });
  }
  expect(errors).toEqual([]);
});

test("搜索定位新注册键", async ({ page }, info) => {
  const domain = domainOf(info.project.name);
  await fixture(page, domain);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(
    domain === "PLATFORM" ? "/platform/settings/dictionaries" : "/org/member-policies",
  );
  const search = page.getByRole("textbox", { name: "搜索功能导航", exact: true });
  await search.fill(domain === "PLATFORM" ? "字典管理" : "成员访问策略");
  const result = page.getByTestId("app-bar-search-results");
  await expect(result).toContainText(domain === "PLATFORM" ? "字典管理" : "成员访问策略");
  await search.press("Enter");
  await expect(page).toHaveURL(
    new RegExp(
      domain === "PLATFORM" ? "/platform/settings/dictionaries$" : "/org/member-policies$",
    ),
  );
});

test("平台专属：平台治理与安全中心可以切换", async ({ page }) => {
  await fixture(page, "PLATFORM");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/platform/settings/dictionaries");
  await page
    .getByTestId("app-bar-nav")
    .getByRole("button", { name: "安全中心", exact: true })
    .click();
  await expect(page).toHaveURL(/\/security\/credential-policies$/);
  await page
    .getByTestId("app-bar-nav")
    .getByRole("button", { name: "平台治理", exact: true })
    .click();
  await expect(page).toHaveURL(/\/platform\/settings\/dictionaries$/);
});

test("平台专属：单一安全读取权限仅展示并请求对应 Tab", async ({ page }) => {
  const { reads, errors } = await fixture(page, "PLATFORM", [
    "iam-platform:session-policy:read",
    "iam-platform:login-failure-policy:read",
  ]);
  await page.goto("/security/sessions");
  await expect(page.getByText("并发策略", { exact: true })).toBeVisible();
  await expect.poll(() => reads.some((path) => path.endsWith("/concurrency-policies"))).toBe(true);
  expect(reads.some((path) => path.endsWith("/sessions"))).toBe(false);
  await page.goto("/security/access-protection");
  await expect
    .poll(() => reads.some((path) => path.endsWith("/login-failure-policies/IP")))
    .toBe(true);
  expect(reads.some((path) => path.includes("/security/policy/"))).toBe(false);
  expect(errors).toEqual([]);
});

test("租户专属：字段读取资格独立开放 Tab，通讯录策略不请求", async ({ page }) => {
  const { reads, errors } = await fixture(page, "TENANT", ["iam-tenant:field-policy:read"]);
  await page.goto("/org/member-policies");
  await expect.poll(() => reads.some((path) => path.endsWith("/policies/fields"))).toBe(true);
  await expect(page.getByText("字段权限", { exact: true })).toBeVisible();
  await expect(page.getByText("通讯录可见范围", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "保存", exact: true })).toHaveCount(0);
  expect(reads.some((path) => path.endsWith("/policies/directory"))).toBe(false);
  expect(errors).toEqual([]);
});
