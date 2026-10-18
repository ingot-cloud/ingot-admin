import assert from "node:assert/strict";
import { createServer } from "vite";
import { chromium } from "@playwright/test";
import path from "node:path";
import { createIconifyOfflinePlugin } from "../packages/vite-config/dist/index.js";
const backend = process.env.IAM_FIXTURE_URL;
assert(backend, "请在隔离HTTP夹具生命周期内设置 IAM_FIXTURE_URL");
const server = await createServer({
  configFile: false,
  define: {
    __VUE_OPTIONS_API__: true,
    __VUE_PROD_DEVTOOLS__: false,
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
  },
  plugins: [
    createIconifyOfflinePlugin({
      rootDir: path.resolve("tests/tenant-live-browser"),
      scan: false,
      collections: ["ep"],
      scanDirs: [],
      packageDirs: [path.resolve("packages/admin-core")],
    }),
  ],
  root: path.resolve("tests/tenant-live-browser"),
  resolve: {
    alias: [
      {
        find: /^vue$/,
        replacement: path.resolve("packages/admin-common/node_modules/vue/dist/vue.esm-bundler.js"),
      },
      {
        find: /^vue-router$/,
        replacement: path.resolve("packages/admin-core/node_modules/vue-router/dist/vue-router.js"),
      },
      {
        find: /^pinia$/,
        replacement: path.resolve("packages/admin-common/node_modules/pinia/dist/pinia.js"),
      },
      {
        find: /^element-plus$/,
        replacement: path.resolve("packages/admin-common/node_modules/element-plus/es/index.mjs"),
      },
      {
        find: /^element-plus\//,
        replacement: path.resolve("packages/admin-common/node_modules/element-plus") + "/",
      },
      {
        find: /^@ingot\/admin-core$/,
        replacement: path.resolve("packages/admin-core/dist/index.js"),
      },
      {
        find: /^@ingot\/admin-common$/,
        replacement: path.resolve("packages/admin-common/dist/index.js"),
      },
    ],
  },
  server: {
    host: "127.0.0.1",
    port: 0,
    proxy: {
      "/api/iam": {
        target: backend,
        changeOrigin: false,
        rewrite: (value) => value.replace("/api/iam", ""),
      },
    },
  },
});
await server.listen();
const address = server.httpServer.address();
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
    : {}),
});
const contexts = [];
const api = async (actor, url, method = "GET", body) => {
  const response = await fetch(backend + url, {
    method,
    headers: { "X-Fixture-Actor": actor, "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await response.text();
  assert(response.ok, text);
  return JSON.parse(text);
};
const open = async (actor, params = "") => {
  const context = await browser.newContext({ extraHTTPHeaders: { "X-Fixture-Actor": actor } });
  contexts.push(context);
  const page = await context.newPage();
  page.on("pageerror", (error) => console.error(error));
  await page.goto(`http://127.0.0.1:${address.port}/?${params}`);
  await page.getByTestId("owner").waitFor();
  return page;
};
try {
  const platform = await open("platform", "shared=true");
  await platform.getByTestId("new-role").click();
  await platform.getByPlaceholder("请输入角色编码，创建后不可修改").fill("browser-shared");
  await platform.getByPlaceholder("请输入角色名称").fill("浏览器共享角色");
  await platform.getByText("当前权限", { exact: true }).click();
  await platform.getByRole("button", { name: "请选择已开通应用", exact: true }).click();
  await platform.getByRole("button", { name: "组织治理", exact: true }).click();
  await platform.getByRole("dialog").getByRole("button", { name: "确定", exact: true }).click();
  await platform.getByPlaceholder("搜索权限名称").fill("查看成员");
  await platform.getByPlaceholder("搜索权限名称").press("Enter");
  await platform
    .locator("label.el-checkbox")
    .filter({ hasText: /^成员\s*\/\s*查看成员$/ })
    .first()
    .click();
  await platform.getByRole("button", { name: "预览", exact: true }).click();
  await platform.getByRole("dialog").getByRole("button", { name: "创建角色", exact: true }).click();
  await platform.waitForFunction(
    () => document.querySelector('[data-testid="saved"]')?.textContent === "1",
  );
  const found = await api("platform", "/v1/platform/shared-roles?name=浏览器共享角色");
  const role = found.data.items[0].record.id;
  const memberAction = found.data.items[0];
  assert(memberAction);
  const grants = (await api("platform", `/v1/platform/shared-roles/${role}/grants`)).data;
  assert.equal(grants.definition.grants.length, 1);
  for (const [actor, recipient] of [
    ["owner-a", "102"],
    ["owner-b", "202"],
  ])
    await api(actor, "/v1/tenant/assignments", "POST", {
      items: [{ subject: { type: "MEMBER", id: recipient }, roleId: role, scopeBindings: {} }],
    });
  const owner = await open("owner-a", `role=${role}`);
  assert.equal(await owner.getByTestId("owner").textContent(), "组织拥有者");
  await owner.getByTestId("open-role").click();
  await owner.getByText("当前权限", { exact: true }).click();
  assert.equal(
    await owner.getByRole("button", { name: "保存权限，关联人员自动生效", exact: true }).count(),
    0,
  );
  assert.equal(await owner.getByRole("button", { name: /升级|发布|定制/ }).count(), 0);
  const memberA = await open("member-a"),
    memberB = await open("member-b");
  const action = grants.items[0].actionCode;
  assert((await memberA.getByTestId("actions").textContent()).includes(action));
  assert((await memberB.getByTestId("actions").textContent()).includes(action));
  const current = (await api("platform", `/v1/platform/shared-roles/${role}`)).data;
  await api("platform", `/v1/platform/shared-roles/${role}/grants`, "PUT", {
    expectedVersion: current.version,
    definition: { grants: [], parameterDefinitions: [] },
  });
  await memberA.getByTestId("refresh").click();
  await memberB.getByTestId("refresh").click();
  await memberA.waitForFunction(
    (code) => !document.querySelector('[data-testid="actions"]')?.textContent.includes(code),
    action,
  );
  await memberB.waitForFunction(
    (code) => !document.querySelector('[data-testid="actions"]')?.textContent.includes(code),
    action,
  );
  await owner.screenshot({ path: "/tmp/iam-tenant-live-owner.png", fullPage: true });
  console.log(
    "Browser: real current-role create/preview/save, tenant shared read-only, owner flag and two-tenant next-request revocation passed",
  );
} finally {
  for (const context of contexts) await context.close();
  await browser.close();
  await server.close();
}
