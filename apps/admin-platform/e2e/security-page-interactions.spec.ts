import { expect, test, type Page } from "@playwright/test";
const BASE = "/api/security/platform/security";
const credentialPath = `${BASE}/credential/policy-config`;
const loginPath = `${BASE}/access/login-failure-policies`;
const lockoutPath = `${BASE}/account/lockout-policies`;
const concurrencyPath = `${BASE}/session/concurrency-policies`;
const gatewayPath = `${BASE}/policy`;
const readCodes = [
  "credential-policy",
  "lockout-policy",
  "security-policy",
  "login-failure-policy",
  "session",
  "session-policy",
].map((r) => `iam-platform:${r}:read`);
const writeCodes = [
  "credential-policy:update",
  "credential-policy:create",
  "lockout-policy:update",
  "security-policy:create",
  "security-policy:update",
  "security-policy:delete",
  "login-failure-policy:update",
  "session-policy:update",
].map((r) => `iam-platform:${r}`);
const menus = [
  ["凭证策略", "/security/credential-policies", "security.credential.policies"],
  ["账号保护", "/security/account-protection", "security.account.protection"],
  ["访问防护", "/security/access-protection", "security.access.protection"],
  ["会话管理", "/security/sessions", "security.sessions"],
];
async function fixture(page: Page, readonly = false) {
  const reads: string[] = [],
    writes: Array<{ path: string; data: Record<string, unknown> }> = [],
    errors: string[] = [],
    warnings: string[] = [];
  let failNextWrite = false;
  const loginThresholds: Record<string, number> = { IP: 5, DEVICE: 7, CLIENT: 9, ACCOUNT_IP: 11 };
  const stored = new Map<string, Record<string, unknown>>();
  const deletedPaths = new Set<string>();
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "warning" && message.text().includes("[Vue warn]"))
      warnings.push(message.text().split("\n")[0]!);
  });
  const codes = [...readCodes, ...(readonly ? [] : writeCodes)];
  const context = { domain: "PLATFORM", accountId: "1", memberId: "101", tenantId: null };
  const credentials = [
    {
      id: "1",
      policyType: "1",
      enabled: true,
      policyConfig: {
        minLength: "6",
        maxLength: "32",
        specialChars: "!@#$",
        forbiddenPatterns: ["123456"],
        requireDigit: true,
      },
    },
    {
      id: "2",
      policyType: "2",
      enabled: true,
      policyConfig: { checkCount: "5", enabled: true, keepRecentCount: 5 },
    },
    {
      id: "3",
      policyType: "3",
      enabled: true,
      policyConfig: {
        maxDays: 90,
        warningDaysBefore: "7",
        graceLoginCount: "3",
        forceChangeAfterReset: true,
      },
    },
    {
      id: "4",
      policyType: "4",
      enabled: true,
      policyConfig: {
        generation: "FIXED",
        fixedPassword: "Private-test-secret",
        validHours: "24",
        oneTime: true,
        forceChangeOnFirstLogin: true,
      },
    },
  ];
  const groups = [
    {
      id: 1,
      code: "auth",
      name: "登录接口",
      patternList: [{ path: "/auth/token/**", method: "POST" }],
      enabled: true,
      remark: "登录路径",
    },
  ];
  await page.route(
    (url) => url.pathname.startsWith("/api/"),
    async (route) => {
      const request = route.request();
      const path = new URL(request.url()).pathname;
      const write = request.method() !== "GET";
      if (write && path.startsWith(BASE)) {
        const data = request.postDataJSON() ?? {};
        writes.push({ path, data });
        if (failNextWrite) {
          failNextWrite = false;
          await route.fulfill({
            json: { success: false, code: "S0500", message: "测试保存失败", data: null },
          });
          return;
        }
        if (request.method() === "DELETE") {
          deletedPaths.add(path);
          await route.fulfill({
            json: { success: true, code: "S0200", message: "ok", data: null },
          });
          return;
        }
        stored.set(`${path}/${data.userType ?? data.dimension ?? "current"}`, data);
        if (path === credentialPath)
          Object.assign(
            credentials.find((r) => r.id === data.id)!,
            data,
          );
        await route.fulfill({ json: { success: true, code: "S0200", message: "ok", data } });
        return;
      }
      reads.push(path);
      let data: unknown = [];
      if (path.endsWith("/bootstrap"))
        data = {
          context,
          profile: { memberId: "101", displayName: "测试安全人员" },
          applications: [{ id: "2", code: "platform:security", name: "安全中心", sortOrder: 0 }],
          menus: [
            {
              id: "security",
              applicationId: "2",
              name: "安全中心",
              kind: "DIRECTORY",
              path: "/security",
              viewPath: "layout.main",
              children: menus.map(([name, path, key], i) => ({
                id: String(i),
                applicationId: "2",
                name,
                kind: "PAGE",
                path,
                viewPath: key,
                routeName: key,
                children: [],
              })),
            },
          ],
          actionCodes: codes,
          version: "1",
          expiresAt: "2099-01-01T00:00:00Z",
        };
      else if (path.endsWith("/capabilities"))
        data = { context, actionCodes: codes, version: "1", expiresAt: "2099-01-01T00:00:00Z" };
      else if (path === `${credentialPath}/list`) data = credentials;
      else if (path === lockoutPath || path.startsWith(`${lockoutPath}/`)) {
        const policy = (userType: string) => ({
          id: userType,
          userType,
          enabled: true,
          maxAttempts: 5,
          lockDurationMinutes: 30,
          attemptWindowMinutes: 15,
          hintAfterAttempts: 3,
          remark: "锁定策略",
          ...stored.get(`${lockoutPath}/${userType}`),
        });
        data = path === lockoutPath ? ["0", "1"].map(policy) : policy(path.split("/").at(-1)!);
      } else if (path.startsWith(`${loginPath}/`))
        data = {
          dimension: path.split("/").at(-1),
          enabled: true,
          maxAttempts: loginThresholds[path.split("/").at(-1)!],
          windowMinutes: 15,
          blockTtlSec: 300,
          blockKeyType: "IP",
          remark: "保护策略",
          ...stored.get(path),
        };
      else if (path === concurrencyPath)
        data = [
          {
            id: 1,
            scope: "GLOBAL",
            enabled: true,
            maxSessions: 0,
            overflow: "KICK_OLDEST",
            dimension: "USER_CLIENT",
            remark: "全局策略",
          },
          {
            id: 2,
            scope: "CLIENT",
            clientId: "console",
            enabled: true,
            maxSessions: 2,
            overflow: "REJECT",
            dimension: "USER_CLIENT",
          },
        ];
      else if (path === `${gatewayPath}/groups`) data = groups;
      else if (path === `${gatewayPath}/rules`)
        data = [
          {
            id: 1,
            code: "login-rate",
            groupCode: "auth",
            dimension: "IP",
            qps: 100,
            burst: 0,
            intervalSec: 1,
            controlBehavior: "FAST_FAIL",
            enabled: true,
            priority: 0,
          },
        ];
      else if (path === `${gatewayPath}/ip-list`)
        data = [
          {
            id: 1,
            listType: "B",
            keyType: "IP",
            keyValue: "192.0.2.10",
            reason: "频繁请求",
            source: "M",
            enabled: true,
          },
          {
            id: 2,
            listType: "W",
            keyType: "UA",
            keyValue: "Test-Agent",
            source: "A",
            enabled: true,
          },
        ];
      else if (path === `${gatewayPath}/challenges`)
        data = [
          {
            id: "1",
            code: "login-challenge",
            groupCode: "auth",
            trigger: "always",
            challengeType: "SLIDER",
            scope: "login",
            passTokenTtlSec: 300,
            passTokenRemaining: 3,
            enabled: true,
            priority: 0,
          },
          {
            id: "2",
            code: "limit-challenge",
            groupCode: "auth",
            trigger: "on_rate_limit",
            challengeType: "IMAGE",
            scope: "login",
            passTokenTtlSec: 300,
            passTokenRemaining: 1,
            enabled: true,
            priority: 0,
          },
        ];
      else if (path === `${gatewayPath}/violation-escalation`)
        data = {
          enabled: true,
          windowSec: 60,
          blockThreshold: 30,
          tempBlockTtlSec: 900,
          ...stored.get(`${path}/current`),
        };
      else if (path === `${BASE}/sessions/test-sid`)
        data = {
          sid: "test-sid",
          jti: "test-token",
          userId: "1",
          username: "测试账号",
          clientId: "console",
          userType: "0",
          ipAddress: "192.0.2.20",
          issuedAt: "2026-10-12T00:00:00Z",
          expiresAt: "2099-01-01T00:00:00Z",
          userAgent: "Long-device-".repeat(30),
        };
      else if (path.includes("/session"))
        data = {
          current: 1,
          size: 20,
          total: 1,
          records: [
            {
              sid: "test-sid",
              userId: "1",
              username: "测试账号",
              clientId: "console",
              userType: "0",
              ipAddress: "192.0.2.20",
            },
          ],
        };
      if (Array.isArray(data)) data = data.filter((row) => !deletedPaths.has(`${path}/${row.id}`));
      await route.fulfill({ json: { success: true, code: "S0200", message: "ok", data } });
    },
  );
  return {
    reads,
    writes,
    errors,
    warnings,
    failWrite: () => {
      failNextWrite = true;
    },
  };
}
const activePanel = (page: Page) => page.locator(".in-page-frame__body");
const drawer = (page: Page) => page.locator(".security-policy-drawer:visible");
const dimensionSelector = (page: Page) =>
  page.getByRole("radiogroup", { name: "防护维度", exact: true });
const selectDimension = (page: Page, label: string) =>
  dimensionSelector(page).getByText(label, { exact: true }).click();
async function checkFormContentBounds(page: Page) {
  await expect(page.locator(".in-form-content__inner:visible")).toHaveCount(1);
  await expect
    .poll(() =>
      page.locator(".in-form-content:visible").evaluateAll((containers) =>
        containers.flatMap((container) => {
          const inner = container.querySelector(".in-form-content__inner")!;
          const rect = container.getBoundingClientRect();
          const innerRect = inner.getBoundingClientRect();
          const style = getComputedStyle(container);
          const left = rect.left + Number.parseFloat(style.paddingLeft);
          const right = rect.right - Number.parseFloat(style.paddingRight);
          const maxWidth = Number.parseFloat(getComputedStyle(inner).maxWidth);
          const violations: string[] = [];
          if (Math.abs(innerRect.width - Math.min(maxWidth, right - left)) > 1)
            violations.push("正文宽度不符合 Token 或可用空间");
          if (Math.abs(innerRect.left - left - (right - innerRect.right)) > 1)
            violations.push("正文未在工作区居中");
          for (const node of inner.querySelectorAll(
            "button, .el-input, .el-input-number, .el-input-tag, .el-select, .el-textarea, .in-detail-field",
          )) {
            const bounds = node.getBoundingClientRect();
            if (
              bounds.width > 0 &&
              (bounds.left < innerRect.left - 1 || bounds.right > innerRect.right + 1)
            )
              violations.push(node.className);
          }
          return violations;
        }),
      ),
    )
    .toEqual([]);
}
async function checkCredentialBounds(page: Page) {
  await checkFormContentBounds(page);
  const overflow = await page.locator(".credential-policy-page").evaluate((container) => {
    const body = container.closest(".in-page-frame__body")!;
    const bodyRect = body.getBoundingClientRect();
    const rect = container.getBoundingClientRect();
    const style = getComputedStyle(container);
    const contentLeft = rect.left + Number.parseFloat(style.paddingLeft);
    const contentRight = rect.right - Number.parseFloat(style.paddingRight);
    const outside = (node: Element, left: number, right: number) => {
      const bounds = node.getBoundingClientRect();
      return bounds.width > 0 && (bounds.left < left - 1 || bounds.right > right + 1);
    };
    const violations = outside(container, bodyRect.left, bodyRect.right)
      ? ["credential-policy-page exceeds page body"]
      : [];
    for (const node of container.querySelectorAll(
      ".policy-tab-panel, .panel-toolbar button, .el-input, .el-input-number, .el-input-tag, .el-select, .in-detail-field",
    )) {
      if (outside(node, contentLeft, contentRight)) violations.push(node.className);
    }
    return violations;
  });
  expect(overflow).toEqual([]);
}
async function checkBounds(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const overflow = await page
    .locator(
      ".in-page-frame, .security-policy-drawer:visible, .security-policy-drawer:visible .el-drawer__body",
    )
    .evaluateAll((nodes) =>
      nodes.filter((node) => node.scrollWidth > node.clientWidth + 1).map((node) => node.className),
    );
  expect(overflow).toEqual([]);
}

test("凭证仅挂载激活表单，默认预览；取消回滚，失败保留草稿，保存刷新一次", async ({ page }) => {
  const f = await fixture(page);
  await page.goto("/security/credential-policies");
  await expect(page.getByText("最小长度", { exact: true })).toBeVisible();
  await expect(page.getByText("历史密码数量", { exact: true })).toHaveCount(0);
  await expect(activePanel(page).locator("input:visible")).toHaveCount(0);
  expect(f.reads.filter((p) => p === `${credentialPath}/list`)).toHaveLength(1);
  await page.getByRole("tab", { name: "密码历史", exact: true }).click();
  await page.getByRole("button", { name: "编辑", exact: true }).click();
  const count = page.getByPlaceholder("请输入保存的近期密码数量");
  await count.fill("9");
  await page.getByRole("button", { name: "取消", exact: true }).click();
  await expect(count).toHaveCount(0);
  await page.getByRole("button", { name: "编辑", exact: true }).click();
  await expect(count).toHaveValue("5");
  await count.fill("9");
  f.failWrite();
  await page.getByRole("button", { name: "保存", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "确定", exact: true }).click();
  await expect(page.getByText("测试保存失败", { exact: true })).toBeVisible();
  await expect(count).toHaveValue("9");
  await page.getByRole("button", { name: "保存", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "确定", exact: true }).click();
  await expect(count).toHaveCount(0);
  expect(f.writes.at(-1)?.data.policyConfig).toMatchObject({ checkCount: 9 });
  expect(f.reads.filter((p) => p === `${credentialPath}/list`)).toHaveLength(2);
  await page.getByRole("tab", { name: "初始密码", exact: true }).click();
  await expect(page.getByText("已设置", { exact: true })).toBeVisible();
  await expect(page.getByPlaceholder("请输入统一默认密码")).toHaveCount(0);
  expect(f.errors).toEqual([]);
});

test("凭证四个 Tab 的预览和编辑控件保留容器内边距，不被父容器裁切", async ({ page }, info) => {
  const f = await fixture(page);
  await page.goto("/security/credential-policies");
  await expect(page.getByText("最小长度", { exact: true })).toBeVisible();
  for (const width of [1920, 1308, 1024, 480]) {
    await page.setViewportSize({ width, height: 927 });
    for (const dark of [false, true]) {
      await page.evaluate((dark) => document.documentElement.classList.toggle("dark", dark), dark);
      for (const tab of ["密码强度", "密码历史", "密码过期", "初始密码"]) {
        await test.step(`${width}px / ${dark ? "dark" : "light"} / ${tab}`, async () => {
          await page.getByRole("tab", { name: tab, exact: true }).click();
          await expect(page.getByRole("button", { name: "编辑", exact: true })).toBeVisible();
          await checkCredentialBounds(page);
          await page.screenshot({
            path: info.outputPath(`${tab}-${width}-${dark ? "dark" : "light"}-preview.png`),
            animations: "disabled",
          });
          await page.getByRole("button", { name: "编辑", exact: true }).click();
          await expect(page.getByRole("button", { name: "保存", exact: true })).toBeVisible();
          await checkCredentialBounds(page);
          await page.screenshot({
            path: info.outputPath(`${tab}-${width}-${dark ? "dark" : "light"}-edit.png`),
            animations: "disabled",
          });
          await page.getByRole("button", { name: "取消", exact: true }).click();
        });
      }
    }
  }
  expect(f.writes).toHaveLength(0);
  expect(f.errors).toEqual([]);
});

test("历史数字字符串进入凭证编辑表单无 Vue warning，取消恢复且保存提交数字", async ({ page }) => {
  const f = await fixture(page);
  await page.goto("/security/credential-policies");
  await expect(page.getByText("最小长度", { exact: true })).toBeVisible();
  const cases = [
    {
      tab: "密码强度",
      fields: [
        { placeholder: "请输入最小长度", value: "6" },
        { placeholder: "请输入最大长度", value: "32" },
      ],
      expected: {
        minLength: 6,
        maxLength: 32,
        specialChars: "!@#$",
        forbiddenPatterns: ["123456"],
      },
    },
    {
      tab: "密码历史",
      fields: [{ placeholder: "请输入保存的近期密码数量", value: "5" }],
      expected: { checkCount: 5, enabled: true, keepRecentCount: 5 },
    },
    {
      tab: "密码过期",
      fields: [
        { placeholder: "请输入最大有效天数", value: "90" },
        { placeholder: "请输入到期前提醒天数", value: "7" },
        { placeholder: "请输入宽限登录次数", value: "3" },
      ],
      expected: {
        maxDays: 90,
        warningDaysBefore: 7,
        graceLoginCount: 3,
        forceChangeAfterReset: true,
      },
    },
    {
      tab: "初始密码",
      fields: [{ placeholder: "0 表示不限制", value: "24" }],
      expected: { generation: "FIXED", validHours: 24, fixedPassword: "Private-test-secret" },
    },
  ];
  for (const { tab, fields, expected } of cases) {
    await page.getByRole("tab", { name: tab, exact: true }).click();
    await page.getByRole("button", { name: "编辑", exact: true }).click();
    for (const { placeholder, value } of fields)
      await expect(page.getByPlaceholder(placeholder)).toHaveValue(value);
    expect(f.warnings).toEqual([]);
    await page.getByPlaceholder(fields[0]!.placeholder).fill("99");
    await page.getByRole("button", { name: "取消", exact: true }).click();
    await page.getByRole("button", { name: "编辑", exact: true }).click();
    for (const { placeholder, value } of fields)
      await expect(page.getByPlaceholder(placeholder)).toHaveValue(value);
    await page.getByRole("button", { name: "保存", exact: true }).click();
    await page.getByRole("dialog").getByRole("button", { name: "确定", exact: true }).click();
    await expect(activePanel(page).locator("input:visible")).toHaveCount(0);
    expect(f.writes.at(-1)?.data.policyConfig).toMatchObject(expected);
    expect(f.warnings).toEqual([]);
  }
  expect(f.errors).toEqual([]);
});

for (const scenario of [
  { name: "账号保护-B端", path: "/security/account-protection", tab: "B 端锁定策略" },
  { name: "账号保护-C端", path: "/security/account-protection", tab: "C 端锁定策略" },
  { name: "登录失败保护", path: "/security/access-protection", tab: "登录失败保护" },
  { name: "违规升级", path: "/security/access-protection", tab: "违规升级" },
]) {
  test(`${scenario.name}正文限宽居中，预览和编辑对齐`, async ({ page }, info) => {
    const f = await fixture(page);
    await page.goto(scenario.path);
    await page.getByRole("tab", { name: scenario.tab, exact: true }).click();
    await expect(page.getByRole("button", { name: "编辑", exact: true }).first()).toBeVisible();
    for (const width of [1920, 1308, 1024, 480]) {
      await page.setViewportSize({ width, height: 927 });
      for (const dark of [false, true]) {
        await page.evaluate(
          (dark) => document.documentElement.classList.toggle("dark", dark),
          dark,
        );
        await checkFormContentBounds(page);
        const preview = await page.locator(".in-form-content__inner:visible").boundingBox();
        await page.screenshot({
          path: info.outputPath(`${scenario.name}-${width}-${dark ? "dark" : "light"}-preview.png`),
          animations: "disabled",
        });
        await page.getByRole("button", { name: "编辑", exact: true }).first().click();
        await expect(activePanel(page).locator("input:visible").first()).toBeVisible();
        await checkFormContentBounds(page);
        const editor = await page.locator(".in-form-content__inner:visible").boundingBox();
        expect(editor?.x).toBeCloseTo(preview!.x, 0);
        expect(editor?.width).toBeCloseTo(preview!.width, 0);
        await page.screenshot({
          path: info.outputPath(`${scenario.name}-${width}-${dark ? "dark" : "light"}-edit.png`),
          animations: "disabled",
        });
        await page.getByRole("button", { name: "取消", exact: true }).click();
      }
    }
    expect(f.writes).toHaveLength(0);
    expect(f.errors).toEqual([]);
  });
}

test("正文跟随工作区居中，侧栏与主题覆盖生效；账号 Tab 与列表布局正常", async ({ page }) => {
  const f = await fixture(page);
  await page.setViewportSize({ width: 1920, height: 927 });
  await page.goto("/security/credential-policies");
  await expect(page.getByRole("button", { name: "编辑", exact: true })).toBeVisible();
  await checkFormContentBounds(page);
  const inner = page.locator(".in-form-content__inner:visible");
  expect((await inner.boundingBox())!.width).toBeCloseTo(840, 0);
  const before = (await inner.boundingBox())!.x;
  await page.getByRole("button", { name: "收起导航", exact: true }).click();
  await expect(page.getByRole("button", { name: "展开导航", exact: true })).toBeVisible();
  await expect.poll(async () => (await inner.boundingBox())!.x).toBeLessThan(before - 50);
  await checkFormContentBounds(page);
  await page.evaluate(() =>
    document.documentElement.style.setProperty("--in-form-content-max-width", "680px"),
  );
  await checkFormContentBounds(page);
  expect((await inner.boundingBox())!.width).toBeCloseTo(680, 0);
  await page.evaluate(() =>
    document.documentElement.style.setProperty("--in-form-content-max-width", "840px"),
  );
  await page.getByRole("button", { name: "展开导航", exact: true }).click();
  await page.setViewportSize({ width: 480, height: 927 });
  await page.goto("/security/account-protection");
  await page.getByRole("tab", { name: "C 端锁定策略", exact: true }).click();
  await page.getByRole("button", { name: "编辑", exact: true }).click();
  const memberRemark = page.locator(".lockout-column:visible").locator("textarea");
  await memberRemark.scrollIntoViewIfNeeded();
  await memberRemark.focus();
  await expect(memberRemark).toBeFocused();
  await expect(memberRemark).toBeInViewport();
  expect(await activePanel(page).evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
  await checkFormContentBounds(page);
  await page.getByRole("button", { name: "取消", exact: true }).click();
  await page.goto("/security/credential-policies");
  await page.getByRole("button", { name: "编辑", exact: true }).click();
  const lastCredentialInput = activePanel(page).locator("input:visible").last();
  await lastCredentialInput.scrollIntoViewIfNeeded();
  await lastCredentialInput.focus();
  await expect(lastCredentialInput).toBeFocused();
  await expect(lastCredentialInput).toBeInViewport();
  await checkFormContentBounds(page);
  await page.getByRole("button", { name: "取消", exact: true }).click();
  await page.setViewportSize({ width: 1920, height: 927 });
  await page.goto("/security/access-protection");
  await expect(page.getByText("登录接口", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "违规升级", exact: true }).click();
  await checkFormContentBounds(page);
  await page.getByRole("tab", { name: "API 路径分组", exact: true }).click();
  await expect(page.locator(".in-form-content:visible")).toHaveCount(0);
  expect(
    (await page.locator(".security-settings__tables .in-table:visible").boundingBox())!.width,
  ).toBeGreaterThan(840);
  expect(f.errors).toEqual([]);
});

test("访问防护五个列表仅保留默认留白，表头单行且枚举标签完整", async ({ page }, info) => {
  const f = await fixture(page);
  await page.goto("/security/access-protection");
  for (const width of [1920, 1183, 1024, 480]) {
    await page.setViewportSize({ width, height: 927 });
    for (const dark of [false, true]) {
      await page.evaluate((dark) => document.documentElement.classList.toggle("dark", dark), dark);
      for (const { tab, tags } of [
        { tab: "API 路径分组", tags: ["启用"] },
        { tab: "限流规则", tags: ["IP", "启用"] },
        { tab: "黑白名单", tags: ["黑名单", "白名单", "User-Agent", "手工", "自动"] },
        { tab: "挑战策略", tags: ["始终挑战", "限流后挑战", "滑块", "图形"] },
        { tab: "封禁审计", tags: [] },
      ]) {
        await page.getByRole("tab", { name: tab, exact: true }).click();
        const panel = page.locator(".security-access-list-panel:visible");
        await expect(panel.locator(".el-table__header-wrapper")).toBeVisible();
        await expect(panel.getByText("加载中", { exact: true })).toHaveCount(0);
        for (const tag of tags) await expect(panel.getByText(tag, { exact: true })).toBeVisible();
        await expect
          .poll(() =>
            panel.evaluate((node) => {
              const violations: string[] = [];
              const table = node.querySelector(".in-table")!;
              const style = getComputedStyle(table);
              const rect = node.getBoundingClientRect();
              const body = node.querySelector(".in-table__body")!.getBoundingClientRect();
              if (Math.abs(body.left - rect.left - Number.parseFloat(style.paddingLeft)) > 1)
                violations.push("列表重复左内边距");
              if (Math.abs(rect.right - body.right - Number.parseFloat(style.paddingRight)) > 1)
                violations.push("列表重复右内边距");
              for (const cell of node.querySelectorAll(".el-table__header-wrapper .cell")) {
                const range = document.createRange();
                range.selectNodeContents(cell);
                if (
                  range.getBoundingClientRect().height >
                  Number.parseFloat(getComputedStyle(cell).lineHeight) + 1
                )
                  violations.push(`表头换行:${cell.textContent}`);
              }
              for (const tag of node.querySelectorAll("td .in-tag, td .el-tag--small")) {
                const cell = tag.closest(".cell")!;
                const cellRect = cell.getBoundingClientRect();
                const tagRect = tag.getBoundingClientRect();
                const cellStyle = getComputedStyle(cell);
                if (
                  tagRect.left < cellRect.left + Number.parseFloat(cellStyle.paddingLeft) - 1 ||
                  tagRect.right > cellRect.right - Number.parseFloat(cellStyle.paddingRight) + 1
                )
                  violations.push(`标签裁切:${tag.textContent}`);
                const content = tag.querySelector(".in-tag__content");
                if (content && content.scrollWidth > content.clientWidth + 1)
                  violations.push(`标签省略:${tag.textContent}`);
              }
              return violations;
            }),
          )
          .toEqual([]);
        await checkBounds(page);
        await page.screenshot({
          path: info.outputPath(`${tab}-${width}-${dark ? "dark" : "light"}.png`),
          animations: "disabled",
        });
      }
    }
  }
  expect(f.errors).toEqual([]);
});

for (const scenario of [
  { tab: "API 路径分组", endpoint: "groups" },
  { tab: "限流规则", endpoint: "rules" },
  { tab: "黑白名单", endpoint: "ip-list" },
  { tab: "挑战策略", endpoint: "challenges" },
]) {
  test(`${scenario.tab}删除使用更多和一次确认，取消/失败保留，成功只刷新当前列表`, async ({
    page,
  }) => {
    const f = await fixture(page);
    await page.goto("/security/access-protection");
    await page.getByRole("tab", { name: scenario.tab, exact: true }).click();
    const panel = page.locator(".security-access-list-panel:visible");
    await panel.getByRole("button", { name: "详情", exact: true }).first().click();
    await expect(drawer(page).getByRole("button", { name: "删除", exact: true })).toHaveCount(0);
    await drawer(page).getByRole("button", { name: "关闭此对话框" }).click();
    const openDelete = async () => {
      await panel.getByRole("button", { name: "更多", exact: true }).first().click();
      await page.getByRole("menuitem", { name: "删除", exact: true }).click();
      await expect(page.getByRole("dialog")).toHaveCount(1);
    };
    await openDelete();
    await page.getByRole("dialog").getByRole("button", { name: "取消", exact: true }).click();
    expect(f.writes).toHaveLength(0);
    const rows = await panel.locator(".el-table__body-wrapper tr").count();
    const reads = f.reads.filter((path) => path === `${gatewayPath}/${scenario.endpoint}`).length;
    f.failWrite();
    await openDelete();
    await page.getByRole("dialog").getByRole("button", { name: "确定", exact: true }).click();
    await expect(page.getByText("测试保存失败", { exact: true })).toBeVisible();
    await expect(panel.locator(".el-table__body-wrapper tr")).toHaveCount(rows);
    expect(f.reads.filter((path) => path === `${gatewayPath}/${scenario.endpoint}`)).toHaveLength(
      reads,
    );
    await openDelete();
    await page.getByRole("dialog").getByRole("button", { name: "确定", exact: true }).click();
    await expect
      .poll(() => f.reads.filter((path) => path === `${gatewayPath}/${scenario.endpoint}`).length)
      .toBe(reads + 1);
    await expect(panel.getByText("加载中", { exact: true })).toHaveCount(0);
    await expect(panel.locator(".el-table__body-wrapper tr")).toHaveCount(rows - 1);
    expect(f.writes.at(-1)?.path).toBe(`${gatewayPath}/${scenario.endpoint}/1`);
    expect(f.errors).toEqual([]);
    expect(f.warnings).toEqual([]);
  });
}

test("访问防护只读角色无更多删除，封禁审计没有删除操作", async ({ page }) => {
  const f = await fixture(page, true);
  await page.goto("/security/access-protection");
  for (const tab of ["API 路径分组", "限流规则", "黑白名单", "挑战策略", "封禁审计"]) {
    await page.getByRole("tab", { name: tab, exact: true }).click();
    const panel = page.locator(".security-access-list-panel:visible");
    await expect(panel.locator(".el-table__header-wrapper")).toBeVisible();
    await expect(panel.getByRole("button", { name: "更多", exact: true })).toHaveCount(0);
    await expect(panel.getByRole("button", { name: "删除", exact: true })).toHaveCount(0);
  }
  expect(f.writes).toHaveLength(0);
  expect(f.errors).toEqual([]);
});

test("登录失败保护使用正文维度选择，四维度按需读取且不混用数据", async ({ page }) => {
  const f = await fixture(page);
  await page.goto("/security/access-protection");
  expect(f.reads.filter((path) => path.startsWith(loginPath))).toEqual([]);
  await page.getByRole("tab", { name: "登录失败保护", exact: true }).click();
  await expect(page.locator(".login-failure-panel .in-biz-tabs-header")).toHaveCount(0);
  await expect(dimensionSelector(page).getByRole("radio")).toHaveCount(4);
  await expect(page.getByText("各维度策略分别生效，可同时启用。", { exact: true })).toBeVisible();
  const dimensions = [
    { label: "IP", value: "IP", attempts: 5 },
    { label: "设备", value: "DEVICE", attempts: 7 },
    { label: "客户端", value: "CLIENT", attempts: 9 },
    { label: "账号 + IP", value: "ACCOUNT_IP", attempts: 11 },
  ];
  const expectedReads: string[] = [];
  for (const dimension of dimensions) {
    await selectDimension(page, dimension.label);
    await expect(
      page.locator(".login-failure-panel").getByText("加载中", { exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: `${dimension.label} 防护策略`, exact: true }),
    ).toBeVisible();
    await expect(
      page
        .locator(".login-failure-dimension-panel:visible")
        .getByRole("group", { name: "最大失败次数", exact: true }),
    ).toContainText(String(dimension.attempts));
    expectedReads.push(`${loginPath}/${dimension.value}`);
    expect(f.reads.filter((path) => path.startsWith(loginPath))).toEqual(expectedReads);
    await expect(page.locator(".login-failure-dimension-panel:visible input")).toHaveCount(0);
  }
  await selectDimension(page, "IP");
  await expect(page.getByRole("heading", { name: "IP 防护策略", exact: true })).toBeVisible();
  expect(f.reads.filter((path) => path.startsWith(loginPath))).toEqual(expectedReads);
  expect(f.errors).toEqual([]);
  expect(f.warnings).toEqual([]);
});

test("登录失败保护切换确认实际修改，取消保留草稿，放弃后恢复预览", async ({ page }) => {
  const f = await fixture(page);
  await page.goto("/security/access-protection");
  await page.getByRole("tab", { name: "登录失败保护", exact: true }).click();
  await page.getByRole("button", { name: "编辑", exact: true }).click();
  await selectDimension(page, "设备");
  await expect(page.getByRole("heading", { name: "设备 防护策略", exact: true })).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "编辑", exact: true }).click();
  await page.getByPlaceholder("请输入最大失败次数").fill("17");
  await selectDimension(page, "客户端");
  await expect(page.getByRole("dialog")).toContainText("修改的内容不会被保存");
  await page.getByRole("dialog").getByRole("button", { name: "取消", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    dimensionSelector(page).getByRole("radio", { name: "设备", exact: true }),
  ).toBeChecked();
  await expect(
    dimensionSelector(page).getByRole("radio", { name: "设备", exact: true }),
  ).toBeFocused();
  await dimensionSelector(page)
    .getByRole("radio", { name: "设备", exact: true })
    .press("ArrowLeft");
  await expect(page.getByRole("dialog")).toContainText("修改的内容不会被保存");
  await page.getByRole("dialog").getByRole("button", { name: "取消", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    dimensionSelector(page).getByRole("radio", { name: "设备", exact: true }),
  ).toBeChecked();
  await expect(page.getByPlaceholder("请输入最大失败次数")).toHaveValue("17");
  expect(f.reads.filter((path) => path.startsWith(loginPath))).toEqual([
    `${loginPath}/IP`,
    `${loginPath}/DEVICE`,
  ]);
  await selectDimension(page, "客户端");
  await page.getByRole("dialog").getByRole("button", { name: "确定", exact: true }).click();
  await expect(page.getByRole("heading", { name: "客户端 防护策略", exact: true })).toBeVisible();
  await selectDimension(page, "设备");
  await expect(page.getByRole("button", { name: "编辑", exact: true })).toBeVisible();
  await expect(
    page
      .locator(".login-failure-dimension-panel:visible")
      .getByRole("group", { name: "最大失败次数", exact: true }),
  ).toContainText("7");
  await page.getByRole("button", { name: "编辑", exact: true }).click();
  await page.getByPlaceholder("请输入最大失败次数").fill("19");
  await page.getByPlaceholder("请输入最大失败次数").fill("7");
  await selectDimension(page, "账号 + IP");
  await expect(
    page.getByRole("heading", { name: "账号 + IP 防护策略", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(f.writes).toHaveLength(0);
  expect(f.errors).toEqual([]);
  expect(f.warnings).toEqual([]);
});

test("登录失败保护保存确认和请求禁用维度，失败保留草稿并按展示名保存", async ({ page }) => {
  const f = await fixture(page);
  let releaseWrite!: () => void;
  const writeGate = new Promise<void>((resolve) => {
    releaseWrite = resolve;
  });
  await page.route(`**${loginPath}`, async (route) => {
    await writeGate;
    await route.fallback();
  });
  await page.goto("/security/access-protection");
  await page.getByRole("tab", { name: "登录失败保护", exact: true }).click();
  await selectDimension(page, "客户端");
  await expect(page.getByRole("heading", { name: "客户端 防护策略", exact: true })).toBeVisible();
  await expect(
    page.locator(".login-failure-panel").getByText("加载中", { exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "编辑", exact: true }).click();
  await page.getByPlaceholder("请输入最大失败次数").fill("19");
  await page.getByRole("button", { name: "保存", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("确认保存「客户端 防护策略」");
  for (const radio of await dimensionSelector(page).getByRole("radio").all())
    await expect(radio).toBeDisabled();
  await page.getByRole("dialog").getByRole("button", { name: "取消", exact: true }).click();
  await expect(
    dimensionSelector(page).getByRole("radio", { name: "客户端", exact: true }),
  ).toBeEnabled();
  expect(f.writes).toHaveLength(0);
  f.failWrite();
  await page.getByRole("button", { name: "保存", exact: true }).click();
  const pendingWrite = page.waitForRequest(
    (request) => new URL(request.url()).pathname === loginPath && request.method() === "PUT",
  );
  await page.getByRole("dialog").getByRole("button", { name: "确定", exact: true }).click();
  await pendingWrite;
  for (const radio of await dimensionSelector(page).getByRole("radio").all())
    await expect(radio).toBeDisabled();
  await expect(
    dimensionSelector(page).getByRole("radio", { name: "客户端", exact: true }),
  ).toBeChecked();
  releaseWrite();
  await expect(page.getByText("测试保存失败", { exact: true })).toBeVisible();
  await expect(page.getByPlaceholder("请输入最大失败次数")).toHaveValue("19");
  await expect(
    dimensionSelector(page).getByRole("radio", { name: "客户端", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "保存", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "确定", exact: true }).click();
  await expect(page.getByRole("button", { name: "编辑", exact: true })).toBeVisible();
  await expect(
    page
      .locator(".login-failure-dimension-panel:visible")
      .getByRole("group", { name: "最大失败次数", exact: true }),
  ).toContainText("19");
  expect(f.writes.at(-1)?.data).toMatchObject({ dimension: "CLIENT", maxAttempts: 19 });
  expect(f.reads.filter((path) => path.startsWith(loginPath))).toEqual([
    `${loginPath}/IP`,
    `${loginPath}/CLIENT`,
    `${loginPath}/CLIENT`,
  ]);
  expect(f.errors).toEqual([]);
  expect(f.warnings).toEqual([]);
});

test("登录失败保护维度选择宽窄屏明暗主题与正文对齐，只读可切换", async ({ page }, info) => {
  const f = await fixture(page, true);
  await page.goto("/security/access-protection");
  await page.getByRole("tab", { name: "登录失败保护", exact: true }).click();
  for (const width of [1920, 1308, 1024, 480]) {
    await page.setViewportSize({ width, height: 927 });
    for (const dark of [false, true]) {
      await page.evaluate(
        (value) => document.documentElement.classList.toggle("dark", value),
        dark,
      );
      for (const label of ["IP", "设备", "客户端", "账号 + IP"]) {
        await selectDimension(page, label);
        await expect(
          page.getByRole("heading", { name: `${label} 防护策略`, exact: true }),
        ).toBeVisible();
        await checkFormContentBounds(page);
        await checkBounds(page);
        await expect(page.getByRole("button", { name: "编辑", exact: true })).toHaveCount(0);
        await expect
          .poll(() =>
            dimensionSelector(page).evaluate((node) => {
              const inner = node.closest(".in-form-content__inner")!.getBoundingClientRect();
              const selector = node.getBoundingClientRect();
              const labels = [...node.querySelectorAll<HTMLElement>(".el-segmented__item-label")];
              return (
                selector.left >= inner.left - 1 &&
                selector.right <= inner.right + 1 &&
                labels.every((item) => item.scrollWidth <= item.clientWidth + 1)
              );
            }),
          )
          .toBe(true);
      }
      await page.screenshot({
        path: info.outputPath(`防护维度-${width}-${dark ? "dark" : "light"}.png`),
        animations: "disabled",
      });
    }
  }
  expect(f.writes).toHaveLength(0);
  expect(f.errors).toEqual([]);
  expect(f.warnings).toEqual([]);
});

test("访问防护逐个激活才查询，登录失败仅查询当前维度", async ({ page }) => {
  const f = await fixture(page);
  await page.goto("/security/access-protection");
  await expect(page.getByText("登录接口", { exact: true })).toBeVisible();
  expect(f.reads.filter((p) => p.startsWith(BASE))).toEqual([`${gatewayPath}/groups`]);
  await page.getByRole("tab", { name: "限流规则", exact: true }).click();
  await expect(page.getByText("login-rate", { exact: true })).toBeVisible();
  expect(f.reads.filter((p) => p === `${gatewayPath}/groups`)).toHaveLength(1);
  await page.getByRole("tab", { name: "登录失败保护", exact: true }).click();
  await expect(page.getByText("最大失败次数", { exact: true })).toBeVisible();
  expect(f.reads.filter((p) => p.startsWith(loginPath))).toEqual([`${loginPath}/IP`]);
  await selectDimension(page, "设备");
  await expect(page.getByText("需 BFF 传递 In-Ca-Sig", { exact: true })).toBeVisible();
  await expect(page.getByText("加载中", { exact: true }).filter({ visible: true })).toHaveCount(0);
  expect(f.reads.filter((p) => p.startsWith(loginPath))).toEqual([
    `${loginPath}/IP`,
    `${loginPath}/DEVICE`,
  ]);
  await page.getByRole("tab", { name: "违规升级", exact: true }).click();
  await page.getByRole("button", { name: "编辑", exact: true }).click();
  await expect(page.getByPlaceholder("请输入计数窗口秒数")).toBeVisible();
  await page.getByRole("button", { name: "取消", exact: true }).click();
  await expect(page.getByPlaceholder("请输入计数窗口秒数")).toHaveCount(0);
  expect(f.errors).toEqual([]);
});

test("账号两端首次激活才读取，切换保留独立草稿，取消仅恢复当前端", async ({ page }, info) => {
  const f = await fixture(page);
  await page.goto("/security/account-protection");
  const column = page.locator(".lockout-column:visible");
  await expect(page.getByRole("tab", { name: "B 端锁定策略", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.getByRole("button", { name: "编辑", exact: true })).toBeVisible();
  expect(f.reads.filter((path) => path.startsWith(lockoutPath))).toEqual([`${lockoutPath}/0`]);
  await expect(page.locator(".lockout-column")).toHaveCount(1);
  await expect(column.getByRole("group", { name: "永久锁定", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "编辑", exact: true }).click();
  await column.getByPlaceholder("请输入失败次数阈值").fill("9");
  await page.getByRole("tab", { name: "C 端锁定策略", exact: true }).click();
  await expect(column.locator("input")).toHaveCount(0);
  await expect(column.getByRole("group", { name: "永久锁定", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "编辑", exact: true })).toBeVisible();
  expect(f.reads.filter((path) => path.startsWith(lockoutPath))).toEqual([
    `${lockoutPath}/0`,
    `${lockoutPath}/1`,
  ]);
  await page.screenshot({ path: info.outputPath("account-C-preview.png"), animations: "disabled" });
  await page.getByRole("button", { name: "编辑", exact: true }).click();
  await column.getByPlaceholder("请输入失败次数阈值").fill("7");
  await page.getByRole("tab", { name: "B 端锁定策略", exact: true }).click();
  await expect(column.getByPlaceholder("请输入失败次数阈值")).toHaveValue("9");
  await page.screenshot({ path: info.outputPath("account-B-edit.png"), animations: "disabled" });
  await page.getByRole("button", { name: "取消", exact: true }).click();
  await expect(column.getByRole("group", { name: "失败次数阈值", exact: true })).toContainText("5");
  await page.getByRole("tab", { name: "C 端锁定策略", exact: true }).click();
  await expect(column.getByPlaceholder("请输入失败次数阈值")).toHaveValue("7");
  await page.getByRole("button", { name: "取消", exact: true }).click();
  await expect(column.getByRole("group", { name: "失败次数阈值", exact: true })).toContainText("5");
  expect(f.writes).toHaveLength(0);
  expect(f.errors).toEqual([]);
});

test("账号 Tab 独立编辑；安全策略与并发详情默认预览，新建进入编辑", async ({ page }) => {
  const f = await fixture(page);
  await page.goto("/security/account-protection");
  await expect(page.getByRole("button", { name: "编辑", exact: true })).toHaveCount(1);
  await expect(activePanel(page).locator("input:visible")).toHaveCount(0);
  await page.getByRole("button", { name: "编辑", exact: true }).first().click();
  await expect(page.getByPlaceholder("请输入失败次数阈值")).toHaveCount(1);
  await page.getByRole("button", { name: "取消", exact: true }).click();
  await page.goto("/security/access-protection");
  for (const tab of ["API 路径分组", "限流规则", "黑白名单", "挑战策略"]) {
    await page.getByRole("tab", { name: tab, exact: true }).click();
    await page.getByRole("button", { name: "详情", exact: true }).first().click();
    await expect(drawer(page).getByRole("button", { name: "编辑", exact: true })).toBeVisible();
    await expect(drawer(page).locator("input:visible")).toHaveCount(0);
    await drawer(page).getByRole("button", { name: "编辑", exact: true }).click();
    await expect(drawer(page).locator("input:visible").first()).toBeVisible();
    await drawer(page).getByRole("button", { name: "取消", exact: true }).click();
    await expect(drawer(page).locator("input:visible")).toHaveCount(0);
    await drawer(page).getByRole("button", { name: "关闭此对话框" }).click();
    await expect(drawer(page)).toHaveCount(0);
  }
  await page.getByRole("tab", { name: "API 路径分组", exact: true }).click();
  await page.getByRole("button", { name: "新建分组", exact: true }).click();
  await expect(drawer(page).getByRole("button", { name: "保存", exact: true })).toBeVisible();
  await drawer(page).getByRole("button", { name: "取消", exact: true }).click();
  await expect(drawer(page)).toHaveCount(0);
  await page.goto("/security/sessions");
  expect(f.reads.filter((p) => p === concurrencyPath)).toHaveLength(0);
  await page.getByRole("tab", { name: "并发策略", exact: true }).click();
  await page.getByRole("button", { name: "详情", exact: true }).first().click();
  await expect(drawer(page).getByText("不限制", { exact: true })).toBeVisible();
  await expect(drawer(page).getByRole("button", { name: "删除", exact: true })).toHaveCount(0);
  await drawer(page).getByRole("button", { name: "编辑", exact: true }).click();
  await expect(drawer(page).getByPlaceholder("请输入最大会话数")).toBeVisible();
  await drawer(page).getByRole("button", { name: "取消", exact: true }).click();
  await drawer(page).getByRole("button", { name: "关闭此对话框" }).click();
  expect(f.errors).toEqual([]);
});

test("四页只读权限，宽窄屏明暗主题不溢出；抽屉预览与编辑保持边界", async ({ page }, info) => {
  const f = await fixture(page, true);
  for (const [, path] of menus) {
    await page.goto(path!);
    if (path === "/security/sessions")
      await page.getByRole("tab", { name: "并发策略", exact: true }).click();
    await expect(page.getByText("加载中", { exact: true }).filter({ visible: true })).toHaveCount(
      0,
    );
    await expect(page.getByRole("button", { name: /^(编辑|保存|删除)$/ })).toHaveCount(0);
    for (const width of [1440, 480]) {
      await page.setViewportSize({ width, height: 900 });
      for (const dark of [false, true]) {
        await page.evaluate(
          (dark) => document.documentElement.classList.toggle("dark", dark),
          dark,
        );
        await checkBounds(page);
        await page.screenshot({
          path: info.outputPath(
            `${path!.split("/").at(-1)}-${width}-${dark ? "dark" : "light"}.png`,
          ),
          animations: "disabled",
        });
      }
    }
    if (["/security/access-protection", "/security/sessions"].includes(path!)) {
      await page.getByRole("button", { name: "详情", exact: true }).first().click();
      await expect(drawer(page).getByRole("button", { name: "编辑", exact: true })).toHaveCount(0);
      await expect(drawer(page).locator("input:visible")).toHaveCount(0);
      await checkBounds(page);
      await drawer(page).getByRole("button", { name: "关闭此对话框" }).click();
    }
  }
  expect(f.writes).toHaveLength(0);
  expect(f.errors).toEqual([]);
});

test("窄屏编辑、长路径回滚、关闭草稿确认和会话列表筛选均在容器内", async ({ page }, info) => {
  const f = await fixture(page);
  await page.setViewportSize({ width: 480, height: 900 });
  await page.goto("/security/credential-policies");
  for (const tab of ["密码强度", "密码历史", "密码过期", "初始密码"]) {
    await page.getByRole("tab", { name: tab, exact: true }).click();
    await page.getByRole("button", { name: "编辑", exact: true }).click();
    await checkBounds(page);
    await page.screenshot({ path: info.outputPath(`${tab}-edit-480.png`), animations: "disabled" });
    await page.getByRole("button", { name: "取消", exact: true }).click();
  }
  await page.goto("/security/account-protection");
  await page.getByRole("button", { name: "编辑", exact: true }).first().click();
  await checkBounds(page);
  await page.screenshot({ path: info.outputPath("lockout-edit-480.png"), animations: "disabled" });
  await page.getByRole("button", { name: "取消", exact: true }).click();
  await page.goto("/security/access-protection");
  for (const tab of ["API 路径分组", "限流规则", "黑白名单", "挑战策略"]) {
    await page.getByRole("tab", { name: tab, exact: true }).click();
    await page.getByRole("button", { name: "详情", exact: true }).first().click();
    await drawer(page).getByRole("button", { name: "编辑", exact: true }).click();
    await checkBounds(page);
    await page.screenshot({
      path: info.outputPath(`${tab}-drawer-edit-480.png`),
      animations: "disabled",
    });
    if (tab === "API 路径分组") {
      const path = drawer(page).getByPlaceholder("路径，如 /auth/token/**");
      await path.fill(`/long/${"segment/".repeat(20)}`);
      await checkBounds(page);
      await drawer(page).getByRole("button", { name: "关闭此对话框" }).click();
      const confirm = page.getByRole("dialog").filter({ hasText: "确定退出当前编辑？" });
      await expect(confirm).toBeVisible();
      await confirm.getByRole("button", { name: "取消", exact: true }).click();
      await expect(path).toHaveValue(`/long/${"segment/".repeat(20)}`);
      await drawer(page).getByRole("button", { name: "取消", exact: true }).click();
      await expect(drawer(page).getByText("/auth/token/**", { exact: true })).toBeVisible();
    } else {
      await drawer(page).getByRole("button", { name: "取消", exact: true }).click();
    }
    await drawer(page).getByRole("button", { name: "关闭此对话框" }).click();
  }
  await page.getByRole("tab", { name: "登录失败保护", exact: true }).click();
  await page.getByRole("button", { name: "编辑", exact: true }).click();
  await checkBounds(page);
  await page.getByRole("button", { name: "取消", exact: true }).click();
  await page.goto("/security/sessions");
  await page.getByPlaceholder("搜索用户 ID").fill("1");
  await page.getByPlaceholder("搜索用户 ID").press("Enter");
  await expect(page.getByText("加载中", { exact: true }).filter({ visible: true })).toHaveCount(0);
  await checkBounds(page);
  await page.getByRole("button", { name: "详情", exact: true }).click();
  await expect(drawer(page).getByText("test-token", { exact: true })).toBeVisible();
  await expect(drawer(page).getByText("192.0.2.20", { exact: true })).toBeVisible();
  await checkBounds(page);
  await page.screenshot({
    path: info.outputPath("session-detail-480.png"),
    animations: "disabled",
  });
  await drawer(page).getByRole("button", { name: "关闭此对话框" }).click();
  await page.getByRole("tab", { name: "并发策略", exact: true }).click();
  await page.getByRole("button", { name: "详情", exact: true }).nth(1).click();
  await drawer(page).getByRole("button", { name: "编辑", exact: true }).click();
  await checkBounds(page);
  await expect(drawer(page).getByPlaceholder("请输入 clientId")).toHaveValue("console");
  await drawer(page).getByRole("button", { name: "取消", exact: true }).click();
  expect(f.errors).toEqual([]);
});

test("账号与登录失败、违规升级保存使用当前策略，返回服务端预览且只刷新一次", async ({ page }) => {
  const f = await fixture(page);
  await page.goto("/security/account-protection");
  await page.getByRole("button", { name: "编辑", exact: true }).first().click();
  await page.getByPlaceholder("请输入失败次数阈值").fill("9");
  await page.getByRole("button", { name: "保存", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "确定", exact: true }).click();
  await expect(page.getByPlaceholder("请输入失败次数阈值")).toHaveCount(0);
  await expect(
    page
      .locator(".lockout-column")
      .first()
      .getByRole("group", { name: "失败次数阈值", exact: true }),
  ).toContainText("9");
  expect(f.writes.at(-1)?.data).toMatchObject({ userType: "0", maxAttempts: 9 });
  expect(f.reads.filter((p) => p === `${lockoutPath}/0`)).toHaveLength(2);
  await page.getByRole("tab", { name: "C 端锁定策略", exact: true }).click();
  await expect(
    page
      .locator(".lockout-column:visible")
      .getByRole("group", { name: "失败次数阈值", exact: true }),
  ).toContainText("5");
  await page.getByRole("button", { name: "编辑", exact: true }).click();
  await page.locator(".lockout-column:visible").getByPlaceholder("请输入失败次数阈值").fill("7");
  await page.getByRole("button", { name: "保存", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "确定", exact: true }).click();
  await expect(page.locator(".lockout-column:visible").locator("input")).toHaveCount(0);
  await expect(
    page
      .locator(".lockout-column:visible")
      .getByRole("group", { name: "失败次数阈值", exact: true }),
  ).toContainText("7");
  expect(f.writes.at(-1)?.data).toMatchObject({ userType: "1", maxAttempts: 7 });
  expect(f.reads.filter((p) => p === `${lockoutPath}/1`)).toHaveLength(2);
  expect(f.reads.filter((p) => p === `${lockoutPath}/0`)).toHaveLength(2);
  await page.getByRole("tab", { name: "B 端锁定策略", exact: true }).click();
  await expect(
    page
      .locator(".lockout-column:visible")
      .getByRole("group", { name: "失败次数阈值", exact: true }),
  ).toContainText("9");
  await page.goto("/security/access-protection");
  await page.getByRole("tab", { name: "登录失败保护", exact: true }).click();
  await page.getByRole("button", { name: "编辑", exact: true }).click();
  await page.getByPlaceholder("请输入最大失败次数").fill("9");
  await page.getByRole("button", { name: "保存", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "确定", exact: true }).click();
  await expect(page.getByPlaceholder("请输入最大失败次数")).toHaveCount(0);
  await expect(page.getByRole("group", { name: "最大失败次数", exact: true })).toContainText("9");
  expect(f.writes.at(-1)?.data).toMatchObject({ dimension: "IP", maxAttempts: 9 });
  expect(f.reads.filter((p) => p.startsWith(loginPath))).toEqual([
    `${loginPath}/IP`,
    `${loginPath}/IP`,
  ]);
  await page.getByRole("tab", { name: "违规升级", exact: true }).click();
  await page.getByRole("button", { name: "编辑", exact: true }).click();
  await page.getByPlaceholder("请输入计数窗口秒数").fill("91");
  await page.getByRole("button", { name: "保存", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "确定", exact: true }).click();
  await expect(page.getByPlaceholder("请输入计数窗口秒数")).toHaveCount(0);
  await expect(page.getByRole("group", { name: "计数窗口(秒)", exact: true })).toContainText("91");
  expect(f.writes.at(-1)?.data).toMatchObject({ windowSec: 91 });
  expect(f.reads.filter((p) => p === `${gatewayPath}/violation-escalation`)).toHaveLength(2);
  expect(f.errors).toEqual([]);
});
