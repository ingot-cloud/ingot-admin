import { expect, test as base, type Page } from "@playwright/test";

// 源码开发模式与生产预览都检查模块加载；API 业务错误不混入模块错误。
const test = base.extend<{ moduleErrors: string[] }>({
  moduleErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("response", (response) => {
        const url = new URL(response.url());
        if (
          response.status() >= 400 &&
          (url.pathname.startsWith("/@fs/") ||
            url.pathname.startsWith("/@id/") ||
            url.pathname.startsWith("/node_modules/.vite/"))
        ) {
          errors.push(`${response.status()} ${response.statusText()} ${url.pathname}`);
        }
      });
      page.on("console", (message) => {
        if (
          message.type() === "error" &&
          /Failed to (fetch dynamically imported module|load module script)/.test(message.text())
        )
          errors.push(message.text());
      });
      await use(errors);
      expect(errors).toEqual([]);
    },
    { auto: true },
  ],
});

type AuditState = "records" | "empty" | "error" | "denied";

/** 两域使用真实管理台和共享页面；所有 API 被测试夹具拦截。 */
const fixture = async (page: Page, domain: "PLATFORM" | "TENANT", canRead = true) => {
  const apiDomain = domain.toLowerCase();
  const actions = canRead ? [`iam-${apiDomain}:audit:read`] : [];
  const reads: URL[] = [];
  const context = {
    domain,
    accountId: "1",
    memberId: "101",
    tenantId: domain === "TENANT" ? "10" : null,
  };
  let state: AuditState = "records";
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    if (!url.pathname.startsWith("/api/")) {
      await route.continue();
      return;
    }
    reads.push(url);
    const audit = url.pathname.endsWith("/authorization/audits");
    if (audit && (state === "error" || state === "denied")) {
      await route.fulfill({
        status: state === "denied" ? 403 : 500,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          code: state === "denied" ? "ActionDenied" : "S0500",
          message: "测试错误",
        }),
      });
      return;
    }
    let data: unknown;
    if (url.pathname.endsWith("/bootstrap"))
      data = {
        context,
        profile: { memberId: "101", displayName: "页面测试" },
        applications: [{ id: "1", code: `iam-${apiDomain}`, name: "治理", sortOrder: 0 }],
        menus: [
          {
            id: "100",
            applicationId: "1",
            name: "安全与运维",
            kind: "DIRECTORY",
            path: "/security",
            viewPath: "layout.main",
            children: [
              {
                id: "101",
                applicationId: "1",
                name: "授权审计",
                kind: "PAGE",
                path: "/security/iam/authorization/audit",
                viewPath: "security.iam.authorization.audit",
                children: [],
              },
            ],
          },
        ],
        actionCodes: actions,
        version: "1",
        expiresAt: "2099-01-01T00:00:00Z",
      };
    else if (url.pathname.endsWith("/capabilities"))
      data = { context, actionCodes: actions, version: "1", expiresAt: "2099-01-01T00:00:00Z" };
    else if (audit)
      data = {
        items:
          state === "empty"
            ? []
            : [
                {
                  record: {
                    id: "1000604",
                    actor: { accountId: "1", memberId: "101" },
                    context,
                    target: { resource: "resource", id: "88" },
                    changeType: "UPDATE",
                    before: { NAME: "旧名称" },
                    after: { NAME: "新名称", FIELD_CAPABILITIES: '[{"name":"phone"}]' },
                    revisions: { resource: "2" },
                    assignmentId: "201",
                    delegationId: "301",
                    traceId: "audit-browser-trace",
                    timestamp: "2026-10-11T01:00:00Z",
                  },
                  fieldAccess: {},
                  capabilities: {},
                  version: "1000604",
                },
              ],
        total: state === "empty" ? 0 : 1,
        page: 1,
        pageSize: 20,
      };
    else data = { items: [], total: 0, page: 1, pageSize: 20 };
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, code: "S0200", message: "ok", data }),
    });
  });
  return {
    reads,
    changeState: (next: AuditState) => {
      state = next;
    },
  };
};
const domainOf = (name: string): "PLATFORM" | "TENANT" =>
  name === "tenant" ? "TENANT" : "PLATFORM";
const path = "/security/iam/authorization/audit";

test("当前域查询、筛选与安全详情在宽窄屏正常展示", async ({ page }, testInfo) => {
  const domain = domainOf(testInfo.project.name);
  const { reads } = await fixture(page, domain);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(path);
  await expect(
    page.getByText(domain === "PLATFORM" ? "平台授权审计" : "当前组织授权审计", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("涉及 名称、字段能力", { exact: true })).toBeVisible();
  await page.getByPlaceholder("精确查询操作者成员 ID").fill("101");
  await page.getByPlaceholder("精确查询操作者成员 ID").press("Enter");
  await expect
    .poll(() => reads.some((url) => url.searchParams.get("actorMemberId") === "101"))
    .toBe(true);
  await page.getByRole("button", { name: "筛选条件", exact: true }).click();
  await page.getByPlaceholder("精确查询对象 ID").fill("88");
  await page.getByPlaceholder("精确查询对象 ID").press("Enter");
  await expect
    .poll(() => reads.some((url) => url.searchParams.get("targetId") === "88"))
    .toBe(true);
  await page.keyboard.press("Escape");
  await page.screenshot({ path: testInfo.outputPath("audit-wide.png"), animations: "disabled" });
  await page.getByRole("button", { name: "修改", exact: true }).click();
  const drawer = page.locator(".el-drawer:visible");
  await expect(drawer).toContainText("audit-browser-trace");
  await expect(drawer).toContainText('[{"name":"phone"}]');
  await expect(drawer).toContainText("未记录");
  await expect(drawer.getByRole("button", { name: "保存", exact: true })).toHaveCount(0);
  await page.screenshot({
    path: testInfo.outputPath("audit-detail-wide.png"),
    animations: "disabled",
  });
  await page.setViewportSize({ width: 480, height: 900 });
  await expect(drawer).toBeVisible();
  await expect
    .poll(async () => (await drawer.boundingBox())?.width ?? Infinity)
    .toBeLessThanOrEqual(480);
  await page.screenshot({
    path: testInfo.outputPath("audit-detail-narrow.png"),
    animations: "disabled",
  });
  expect(
    reads
      .filter((url) => url.pathname.endsWith("/authorization/audits"))
      .every((url) => url.pathname.includes(`/v1/${domain.toLowerCase()}/`)),
  ).toBe(true);
});

test("无审计资格展示权限状态且不发请求", async ({ page }, testInfo) => {
  const { reads } = await fixture(page, domainOf(testInfo.project.name), false);
  await page.goto(path);
  await expect(page.getByText("没有查看当前域授权审计的权限", { exact: true })).toBeVisible();
  expect(reads.filter((url) => url.pathname.endsWith("/authorization/audits"))).toHaveLength(0);
});

test("请求错误、服务端拒绝与合法空结果分别展示", async ({ page }, testInfo) => {
  const { changeState } = await fixture(page, domainOf(testInfo.project.name));
  changeState("error");
  await page.goto(path);
  await expect(page.getByText("暂时无法加载授权审计", { exact: true })).toBeVisible();
  changeState("empty");
  await page.getByRole("button", { name: "重试", exact: true }).click();
  await expect(page.getByText("暂无数据", { exact: true })).toBeVisible();
  changeState("denied");
  await page.getByPlaceholder("精确查询操作者成员 ID").fill("101");
  await page.getByPlaceholder("精确查询操作者成员 ID").press("Enter");
  await expect(page.getByText("没有查看当前域授权审计的权限", { exact: true })).toBeVisible();
});
