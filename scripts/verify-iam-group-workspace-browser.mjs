import assert from "node:assert/strict";
import { chromium } from "@playwright/test";

const backend = process.env.IAM_FIXTURE_URL;
assert(backend, "请在隔离 IAM HTTP 夹具生命周期内设置 IAM_FIXTURE_URL");

const profiles = [
  {
    domain: "platform",
    actor: "platform",
    url: new URL("/platform/iam/personnel", process.env.IAM_GROUP_PLATFORM_URL),
    members: "/v1/platform/groups/5101/members",
    label: "Group Platform",
  },
  {
    domain: "tenant",
    actor: "owner-a",
    url: new URL("/org/iam/groups", process.env.IAM_GROUP_TENANT_URL),
    members: "/v1/tenant/groups/5103/effective-members",
    label: "Group Tenant",
  },
];

const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
    : {}),
});

try {
  for (const profile of profiles) {
    const page = await browser.newPage({ locale: "zh-CN" });
    page.setDefaultTimeout(15000);
    const reads = [];
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    try {
      await page.route("**/api/bff/auth/me", (route) =>
        route.fulfill({
          json: {
            code: "S0200",
            message: "",
            data: {
              appId: `${profile.domain}-admin`,
              domain: profile.domain.toUpperCase(),
              tenantId: profile.domain === "tenant" ? "10" : null,
              userId: 1,
              clientId: `${profile.domain}-admin`,
            },
          },
        }),
      );
      await page.route("**/api/iam/**", async (route) => {
        const url = new URL(route.request().url());
        const path = url.pathname.replace("/api/iam", "");
        const response = await route.fetch({
          url: backend + path + url.search,
          headers: { ...route.request().headers(), "X-Fixture-Actor": profile.actor },
        });
        const total =
          path === profile.members && response.ok()
            ? (await response.json()).data.total
            : undefined;
        reads.push({ path, view: url.searchParams.get("view"), status: response.status(), total });
        await route.fulfill({ response });
      });
      await page.goto(profile.url.href, { waitUntil: "domcontentloaded" });
      if (profile.domain === "platform") {
        await page.getByRole("tab", { name: "用户组", exact: true }).click();
      }
      const group = page.locator(".group-item").filter({
        has: page.getByText(profile.label, { exact: true }),
      });
      await group.click();
      if (!reads.some((read) => read.path === profile.members && read.status === 200)) {
        await page.waitForResponse(
          (response) => response.ok() && new URL(response.url()).pathname.endsWith(profile.members),
        );
      }
      const members = reads.findLast(
        (read) => read.path === profile.members && read.status === 200,
      );
      assert.ok(members?.total > 0, `${profile.domain} 测试组须包含有效成员`);
      await page.getByText(`共 ${members.total} 人`, { exact: true }).waitFor();

      assert(
        reads.some(
          (read) => read.path.endsWith("/groups") && read.view === "SUMMARY" && read.status === 200,
        ),
        `${profile.domain} 组摘要请求记录 ${JSON.stringify(reads)}`,
      );
      assert(!reads.some((read) => /\/groups\/\d+$/.test(read.path)), "首屏额外读取了完整组详情");
      assert.deepEqual(pageErrors, []);
      console.log(JSON.stringify({ domain: profile.domain, reads }));
    } finally {
      await page.close();
    }
  }
} finally {
  await browser.close();
}
