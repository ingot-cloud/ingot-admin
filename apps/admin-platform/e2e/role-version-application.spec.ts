import { expect, test } from "@playwright/test";

/** 使用接口夹具验证真实管理台页面；全部写请求只在测试进程处理。 */
test("版本信息独立编辑、历史回退应用及大量分配的暂停接续", async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  const actions = [
    "role:read",
    "role:status",
    "role:publish",
    "role:preview",
    "assignment:read",
    "assignment:upgrade",
  ].map((code) => `iam-platform:${code}`);
  const detail = (record: object) => ({
    record,
    version: "0",
    fieldAccess: {},
    capabilities: Object.fromEntries(actions.map((code) => [code, { allowed: true }])),
  });
  const fields = {
    "10": {
      visibility: { phone: "MASKED" },
      operations: { phone: { editable: true, filterable: false } },
    },
  };
  const revision = (id: string, number: string, name: string) => ({
    id,
    roleId: "24",
    revision: number,
    kind: "PLATFORM_CUSTOM",
    versionName: name,
    remark: "发布备注",
    metadataVersion: "0",
    grants: [],
    deltas: [],
    parameterDefinitions: [],
    resourceFieldPermissions: fields,
    publishedAt: "2026-10-10T01:00:00Z",
  });
  const versions = [revision("35", "3", "客服新版"), revision("34", "2", "日常查询")];
  let status: "BLOCKED" | "READY" | "PAUSED" = "BLOCKED";
  let version = 0;
  const unfinishedCounts = {
    BLOCKED: { PENDING: 204, BLOCKED: 1, SUCCEEDED: 0 },
    READY: { PENDING: 205, BLOCKED: 0, SUCCEEDED: 0 },
    PAUSED: { PENDING: 0, BLOCKED: 105, SUCCEEDED: 100 },
  };
  const task = () => ({
    id: "50",
    roleId: "24",
    targetRevisionId: "34",
    targetRevisionNumber: "2",
    targetVersionName: "日常查询",
    version: String(version),
    status,
    counts: {
      ...unfinishedCounts[status],
      EXCLUDED: 0,
      REVOKED: 0,
      EXPIRED: 0,
      ALREADY_TARGET: 0,
    },
    createdAt: "2026-10-10T01:00:00Z",
    updatedAt: "2026-10-10T01:00:00Z",
  });
  const writes: Array<{ path: string; body: Record<string, unknown> }> = [];
  const reads: Array<URL> = [];
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url()),
      path = url.pathname,
      method = route.request().method();
    if (!path.startsWith("/api/")) {
      await route.continue();
      return;
    }
    const body = method === "GET" ? undefined : route.request().postDataJSON();
    if (body) writes.push({ path, body });
    else reads.push(url);
    let data: unknown;
    if (path.endsWith("/bootstrap"))
      data = {
        context: { domain: "PLATFORM", accountId: "1", memberId: "1", tenantId: null },
        profile: { memberId: "1", displayName: "页面测试" },
        applications: [{ id: "1", code: "iam-platform", name: "平台治理", sortOrder: 0 }],
        menus: [
          {
            id: "100",
            applicationId: "1",
            name: "平台",
            kind: "DIRECTORY",
            path: "/platform",
            viewPath: "layout.main",
            children: [
              {
                id: "101",
                applicationId: "1",
                name: "角色授权",
                kind: "PAGE",
                path: "/iam/authorization",
                viewPath: "platform.iam.authorization",
                children: [],
              },
            ],
          },
        ],
        actionCodes: actions,
        version: "1",
        expiresAt: "2099-01-01T00:00:00Z",
      };
    else if (path.endsWith("/roles"))
      data = {
        items: [
          detail({
            id: "24",
            name: "客服权限",
            code: "support",
            kind: "PLATFORM_CUSTOM",
            status: "ENABLED",
          }),
        ],
        total: 1,
        page: 1,
        pageSize: 20,
      };
    else if (path.endsWith("/roles/24"))
      data = detail({
        id: "24",
        name: "客服权限",
        code: "support",
        kind: "PLATFORM_CUSTOM",
        status: "ENABLED",
      });
    else if (path.endsWith("/distribution"))
      data = [{ revisionId: "34", revision: "2", versionName: "日常查询", count: 205 }];
    else if (path.endsWith("/revisions"))
      data = {
        items: (url.searchParams.get("pageSize") === "1" ? versions.slice(0, 1) : versions).map(
          detail,
        ),
        total: 2,
        page: 1,
        pageSize: Number(url.searchParams.get("pageSize") || 20),
      };
    else if (/\/revisions\/\d+$/.test(path))
      data = detail(versions.find((v) => path.endsWith(v.id))!);
    else if (path.endsWith("/metadata")) {
      Object.assign(versions[1], body, { metadataVersion: "1" });
      data = { id: "34", version: "1" };
    } else if (path.endsWith("/grants")) data = { items: [] };
    else if (path.endsWith("/version-applications") && method === "POST") data = task();
    else if (path.endsWith("/preflight")) {
      status = "READY";
      version++;
      data = task();
    } else if (path.endsWith("/confirm")) {
      status = "PAUSED";
      version++;
      data = task();
    } else if (path.endsWith("/version-applications/50/items")) {
      const current = Number(url.searchParams.get("page") || 1),
        size = Number(url.searchParams.get("pageSize") || 20);
      data = {
        items: Array.from({ length: Math.min(size, 205 - (current - 1) * size) }, (_, index) => ({
          id: String(1000 + (current - 1) * size + index),
          assignmentId: String(2000 + (current - 1) * size + index),
          status: index === 0 && status === "BLOCKED" ? "BLOCKED" : "PENDING",
          original: {
            id: String(2000 + index),
            subjectName: `成员${index + 1}`,
            roleName: "客服权限",
            revisionNumber: "3",
            versionName: "客服新版",
            status: "ACTIVE",
            source: "MANUAL",
            assignment: {
              subject: { type: index % 2 ? "GROUP" : "MEMBER", id: String(index + 1) },
              roleRevisionRef: { kind: "PLATFORM_CUSTOM", id: "35" },
              scopeBindings: {},
              validFrom: "2026-10-10T01:00:00Z",
            },
          },
          configuredBindings: {},
          failureReason: index === 0 && status === "BLOCKED" ? "范围参数需要补齐" : undefined,
          preview: {
            id: String(2000 + index),
            before: [],
            after: [],
            allowed: status !== "BLOCKED",
            issues: [],
            beforeFieldPermissions: {},
            afterFieldPermissions: fields,
          },
        })),
        total: 205,
        page: current,
        pageSize: size,
      };
    } else if (path.endsWith("/version-applications/50")) data = task();
    else data = { items: [], total: 0, page: 1, pageSize: 20 };
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ code: "S0200", message: "ok", success: true, data }),
    });
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/iam/authorization");
  await page.getByRole("button", { name: "更多", exact: true }).click();
  await page.getByRole("menuitem", { name: "详情", exact: true }).click();
  const drawer = () => page.locator(".el-drawer:visible").last();
  await expect(drawer()).toContainText("最新发布版本");
  await expect(drawer()).toContainText("v3 · 客服新版");
  await drawer().getByText("版本历史", { exact: true }).click();
  await drawer().getByRole("button", { name: "编辑版本信息", exact: true }).last().click();
  await page.getByPlaceholder("未填写时显示 vN").fill("日常查询备注版");
  await page.getByPlaceholder("说明本次权限调整的用途").fill("只更新显示信息");
  await page
    .locator(".el-dialog:visible")
    .getByRole("button", { name: "保存", exact: true })
    .click();
  await expect
    .poll(() =>
      writes.some((w) => w.path.endsWith("/metadata") && w.body.expectedMetadataVersion === "0"),
    )
    .toBe(true);
  expect(writes.some((w) => w.path.endsWith("/revisions"))).toBe(false);
  await drawer().getByRole("button", { name: "应用此版本", exact: true }).last().click();
  await expect(drawer()).toContainText("确定集合");
  await drawer().getByRole("button", { name: "建立快照并配置范围" }).click();
  await expect(drawer()).toContainText("范围参数需要补齐");
  await expect(drawer()).toContainText("待处理 204");
  await expect(page.getByText("版本信息已更新", { exact: true })).toBeHidden();
  await page.screenshot({
    path: testInfo.outputPath("role-application-wide.png"),
    animations: "disabled",
  });
  await page.evaluate(() => document.documentElement.classList.add("dark"));
  await page.screenshot({
    path: testInfo.outputPath("role-application-dark.png"),
    animations: "disabled",
  });
  await page.setViewportSize({ width: 480, height: 900 });
  await drawer().getByRole("button", { name: "预览影响", exact: true }).click();
  await expect(drawer().getByRole("button", { name: "确认执行", exact: true })).toBeDisabled();
  await page.screenshot({
    path: testInfo.outputPath("role-application-narrow.png"),
    animations: "disabled",
  });
  await drawer().getByRole("button", { name: "上一步", exact: true }).click();
  await drawer().getByRole("button", { name: "重新预检未完成项" }).click();
  await drawer().getByRole("button", { name: "预览影响", exact: true }).click();
  await drawer().getByRole("button", { name: "确认执行", exact: true }).click();
  await page
    .locator(".el-message-box:visible")
    .getByRole("button", { name: "确认执行", exact: true })
    .click();
  await expect(drawer()).toContainText("执行已暂停，已提交批次保留");
  await expect(drawer()).not.toContainText("全部纳入的分配已完成");
  await drawer().getByRole("button", { name: "继续处理", exact: true }).click();
  await expect(drawer()).toContainText("重新预检未完成项");
  expect(writes.find((w) => w.path.endsWith("/version-applications"))?.body.targetRevisionId).toBe(
    "34",
  );
  expect(
    reads
      .filter((url) => url.pathname.endsWith("/version-applications/50/items"))
      .every((url) => Number(url.searchParams.get("pageSize")) <= 20),
  ).toBe(true);
  expect(writes.filter((w) => w.path.endsWith("/confirm"))).toHaveLength(1);
});
