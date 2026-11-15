/** Production frontend + controlled HTTPS BFF; this is not real Auth/IAM acceptance. */
import assert from "node:assert/strict";
import { createServer } from "node:https";
import { randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const root = fileURLToPath(new URL("..", import.meta.url));
const output = await mkdtemp(path.join(tmpdir(), "ingot-organization-browser-"));
const keyFile = path.join(output, "tls.key"),
  certFile = path.join(output, "tls.crt");
execFileSync(
  "openssl",
  [
    "req",
    "-x509",
    "-newkey",
    "rsa:2048",
    "-nodes",
    "-keyout",
    keyFile,
    "-out",
    certFile,
    "-days",
    "1",
    "-subj",
    "/CN=127.0.0.1",
    "-addext",
    "subjectAltName=IP:127.0.0.1",
  ],
  { stdio: "ignore" },
);
const opaque = () => randomBytes(16).toString("base64url");
const SESSION = "__Host-IN_TENANT_SESSION",
  BINDING = "__Host-IN_TENANT_BINDING";
const state = {
  transactions: new Map(),
  session: opaque(),
  version: opaque(),
  tenant: "42",
  deadline: new Date(Date.now() + 7200000).toISOString(),
  others: true,
  accessible: true,
  unavailable: false,
  loseReply: false,
  requests: [],
  mutations: 0,
  executions: 0,
};
const errors = [],
  cases = [];
const mime = {
  ".js": "text/javascript",
  ".css": "text/css",
  ".html": "text/html",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
};
const cookies = (req) =>
  Object.fromEntries(
    (req.headers.cookie ?? "")
      .split(";")
      .filter(Boolean)
      .map((value) => {
        const index = value.indexOf("=");
        return [value.slice(0, index).trim(), value.slice(index + 1)];
      }),
  );
const cookie = (name, value) =>
  `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${Math.max(1, Math.floor((Date.parse(state.deadline) - Date.now()) / 1000))}`;
const finish = (res, data, status = 200, code = "S0200") => {
  res.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" });
  res.end(JSON.stringify({ code, message: status === 503 ? "认证服务暂不可用" : code, data }));
};
const server = createServer(
  { key: await readFile(keyFile), cert: await readFile(certFile) },
  async (req, res) => {
    try {
      const url = new URL(req.url, `https://${req.headers.host}`).pathname;
      if (!url.startsWith("/api/")) {
        const relative = url.startsWith("/static/") ? url : "/index.html";
        try {
          const file = path.join(root, "apps/admin/dist", relative);
          res.writeHead(200, {
            "Content-Type": mime[path.extname(file)] ?? "application/octet-stream",
            "Cache-Control": "no-store",
          });
          res.end(await readFile(file));
        } catch {
          res.writeHead(404);
          res.end();
        }
        return;
      }
      state.requests.push(url);
      const c = cookies(req);
      let body = "";
      for await (const chunk of req) body += chunk;
      body = body ? JSON.parse(body) : {};
      const authenticated = c[SESSION] === state.session;
      if (url.endsWith("/csrf")) {
        res.setHeader("Set-Cookie", cookie(BINDING, "fixture-binding"));
        return finish(res, { csrfToken: "fixture-csrf", expiresAt: state.deadline });
      }
      if (url.endsWith("/me")) {
        if (!authenticated) return finish(res, null, 401, "S0401");
        return finish(res, {
          appId: "tenant-admin",
          domain: "TENANT",
          tenantId: state.tenant,
          userId: 1,
          clientId: "in-bff-tenant",
          contextVersion: state.version,
          expiresAt: state.deadline,
        });
      }
      if (url.endsWith("/logout")) {
        state.session = opaque();
        res.setHeader("Set-Cookie", `${SESSION}=; Path=/; Max-Age=0; HttpOnly; Secure`);
        return finish(res, null);
      }
      const switchPath = "/api/bff/auth/tenant/switch-transactions";
      if (url.startsWith(switchPath + "/")) {
        const id = url.slice(switchPath.length + 1).split("/")[0];
        const tx = state.transactions.get(id);
        if (!tx || c[BINDING] !== "fixture-binding")
          return finish(res, null, 410, "BFF_TRANSACTION_EXPIRED");
        if (url.endsWith("/resume")) {
          if (tx.stage !== "COMPLETED" || tx.session !== state.session)
            return finish(res, null, 409, "BFF_RESULT_UNAVAILABLE");
          res.setHeader("Set-Cookie", cookie(SESSION, tx.session));
          return finish(res, tx);
        }
        if (req.method === "GET")
          return finish(res, { ...tx, sessionEstablished: c[SESSION] === tx.session });
        if (!authenticated) return finish(res, null, 401, "BFF_TOKEN_INVALID");
        assert.equal(req.headers["in-bff-context-version"], tx.sourceVersion);
        assert.equal(req.headers["x-csrf-token"], "fixture-csrf");
        if (state.session !== tx.sourceSession)
          return finish(res, null, 409, "BFF_CONTEXT_CHANGED");
        state.executions += 1;
        tx.stage = "COMPLETED";
        tx.session = opaque();
        tx.recoveryExpiresAt = new Date(Date.now() + 60000).toISOString();
        state.session = tx.session;
        state.tenant = tx.tenantId;
        state.version = tx.transactionId;
        state.accessible = true;
        if (state.loseReply) {
          state.loseReply = false;
          res.destroy();
          return;
        }
        res.setHeader("Set-Cookie", cookie(SESSION, tx.session));
        return finish(res, tx);
      }
      if (!authenticated) return finish(res, null, 401, "BFF_TOKEN_INVALID");
      if (req.headers["in-bff-context-version"] !== state.version)
        return finish(res, null, 409, "BFF_CONTEXT_CHANGED");
      if (url.endsWith("/organizations/query")) {
        if (state.unavailable) return finish(res, null, 503, "BFF_AUTH_UNAVAILABLE");
        assert.equal(req.headers["x-csrf-token"], "fixture-csrf");
        const others = state.others
          ? [
              {
                id: state.tenant === "42" ? "43" : "42",
                name: state.tenant === "42" ? "组织乙" : "组织甲",
              },
            ]
          : [];
        const filtered = others.filter((item) => item.name.includes(body.keyword ?? ""));
        return finish(res, {
          currentTenant: { id: state.tenant, name: state.tenant === "42" ? "组织甲" : "组织乙" },
          currentTenantAccessible: state.accessible,
          records: filtered,
          total: filtered.length,
          switchableTotal: others.length,
          page: 1,
          pageSize: 20,
        });
      }
      if (url === switchPath) {
        const tx = {
          transactionId: opaque(),
          tenantId: body.tenantId,
          stage: "PREPARED",
          expiresAt: state.deadline,
          sourceSession: state.session,
          sourceVersion: state.version,
        };
        state.transactions.set(tx.transactionId, tx);
        return finish(res, tx);
      }
      if (url.endsWith("/bootstrap") && !state.accessible)
        return finish(res, null, 401, "IdentityInvalid");
      if (url.endsWith("/bootstrap"))
        return finish(res, {
          context: {
            domain: "TENANT",
            accountId: "1",
            tenantId: state.tenant,
            memberId: `${state.tenant}01`,
          },
          profile: {
            memberId: `${state.tenant}01`,
            displayName: state.tenant === "42" ? "组织甲成员" : "组织乙成员",
          },
          applications: [{ id: "1", code: "fixture", name: "测试应用" }],
          menus: [
            {
              id: "layout",
              applicationId: "1",
              name: "测试应用",
              kind: "DIRECTORY",
              path: "/fixture-shell",
              viewPath: "layout.main",
              children: [
                {
                  id: "home",
                  applicationId: "1",
                  name: "测试入口",
                  kind: "PAGE",
                  path: "/fixture-home",
                  viewPath: "common.plugin.unavailable",
                  children: [],
                },
              ],
            },
          ],
          actionCodes: [],
          version: state.tenant,
          expiresAt: state.deadline,
        });
      if (url.endsWith("/capabilities"))
        return finish(res, { actionCodes: [], version: state.tenant, expiresAt: state.deadline });
      if (url.endsWith("/mutation")) {
        state.mutations += 1;
        return finish(res, null);
      }
      finish(res, null, 404, "NOT_FOUND");
    } catch (error) {
      errors.push(error.stack);
      finish(res, null, 500, "FIXTURE_ERROR");
    }
  },
);
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = `https://127.0.0.1:${server.address().port}`;
let browser;
const contexts = [];
const open = async () => {
  Object.assign(state, {
    session: opaque(),
    version: opaque(),
    tenant: "42",
    others: true,
    accessible: true,
    unavailable: false,
    loseReply: false,
    requests: [],
    mutations: 0,
    executions: 0,
  });
  state.transactions.clear();
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1280, height: 900 },
  });
  contexts.push(context);
  await context.addCookies([
    {
      name: SESSION,
      value: state.session,
      url: origin,
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
    },
  ]);
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(origin + "/fixture-home");
  await page.locator(".in-user-dropdown").waitFor();
  return { context, page };
};
const choosePage = async (page) => {
  await page.locator(".in-user-dropdown").click();
  await page.getByRole("menuitem", { name: "切换组织", exact: true }).click();
};
const switchToOther = async (page) => {
  await page.getByRole("button", { name: "组织乙", exact: true }).click();
  await page
    .locator(".el-message-box")
    .getByRole("button", { name: "切换组织", exact: true })
    .click();
  await page.waitForURL("**/fixture-home");
};
try {
  browser = await chromium.launch({ channel: "chrome", headless: true });
  {
    const { context, page } = await open();
    state.others = false;
    const previous = state.session;
    await choosePage(page);
    await page.getByText("当前没有其他可切换的组织，已返回当前组织", { exact: true }).waitFor();
    await page.waitForURL("**/fixture-home");
    assert.equal(state.session, previous);
    assert.equal(state.transactions.size, 0);
    assert.equal((await context.cookies(origin)).find((c) => c.name === SESSION).value, previous);
    cases.push("no alternatives: friendly notice, current organization, unchanged credentials");
    await context.close();
  }
  {
    const { context, page } = await open();
    const oldVersion = state.version,
      deadline = state.deadline;
    const peer = await context.newPage();
    peer.on("pageerror", (error) => errors.push(error.message));
    await peer.goto(origin + "/fixture-home");
    await peer.locator(".in-user-dropdown").waitFor();
    await choosePage(page);
    await page.getByPlaceholder("搜索组织名称").fill("missing");
    await page.getByPlaceholder("搜索组织名称").press("Enter");
    await page.getByText("未找到匹配的组织，请调整搜索条件").waitFor();
    assert.equal(new URL(page.url()).pathname, "/auth/organizations");
    assert.equal(state.transactions.size, 0);
    await page.getByPlaceholder("搜索组织名称").fill("");
    await page.getByPlaceholder("搜索组织名称").press("Enter");
    await page.getByRole("button", { name: "组织乙", exact: true }).waitFor();
    await page.screenshot({ path: path.join(output, "organization-picker.png") });
    await switchToOther(page);
    await peer.waitForURL("**/fixture-home");
    await peer.locator(".in-user-dropdown").click();
    await peer.getByText("组织乙成员", { exact: true }).waitFor();
    assert.equal(state.tenant, "43");
    assert.equal(state.deadline, deadline);
    assert.equal(state.transactions.size, 1);
    await peer.evaluate(
      ({ sourceVersion }) =>
        localStorage.setItem(
          "ingot.auth.tenant-admin.organization-switch",
          JSON.stringify({
            phase: "pending",
            transactionId: "late-losing-transaction",
            sourceVersion,
            expiresAt: "2099-01-01T00:00:00Z",
            source: "late-peer",
          }),
        ),
      { sourceVersion: oldVersion },
    );
    const fresh = await context.newPage();
    fresh.on("pageerror", (error) => errors.push(error.message));
    await fresh.goto(origin + "/fixture-home");
    await fresh.locator(".in-user-dropdown").click();
    await fresh.getByText("组织乙成员", { exact: true }).waitFor();
    const status = await peer.evaluate(
      async ({ version }) =>
        (
          await fetch("/api/iam/mutation", {
            method: "POST",
            headers: { "In-Bff-Context-Version": version, "Content-Type": "application/json" },
            body: "{}",
          })
        ).status,
      { version: oldVersion },
    );
    assert.equal(status, 409);
    assert.equal(state.mutations, 0);
    cases.push(
      "search empty remains selectable; direct switch synchronizes native peer; late old-source pending cannot block fresh page; old-version mutation rejected; deadline retained",
    );
    await context.close();
  }
  {
    const { context, page } = await open();
    state.accessible = false;
    await page.reload();
    await page.waitForURL("**/auth/organizations");
    await page.getByRole("button", { name: "组织乙", exact: true }).waitFor();
    await switchToOther(page);
    assert.equal(state.tenant, "43");
    cases.push(
      "invalid source membership recovers through account-only selector and switches to valid target",
    );
    await context.close();
  }
  {
    const { context, page } = await open();
    state.loseReply = true;
    await choosePage(page);
    await switchToOther(page);
    assert.equal(state.requests.filter((url) => url.endsWith("/resume")).length, 1);
    assert.equal(state.executions, 1, "network retries must not repeat issuance");
    assert.equal(state.transactions.size, 1);
    cases.push("lost commit response restores the same result once");
    await context.close();
  }
  {
    const { context, page } = await open();
    state.unavailable = true;
    const previous = state.session;
    await choosePage(page);
    await page.locator(".organization-error").waitFor();
    assert.equal(new URL(page.url()).pathname, "/auth/organizations");
    assert.equal(state.session, previous);
    assert.equal(state.transactions.size, 0);
    cases.push("503 stays on retryable selector without false empty result");
    await context.close();
  }
  {
    const { context, page } = await open();
    state.accessible = false;
    state.others = false;
    await choosePage(page);
    await page.waitForURL("**/403");
    await page.getByRole("button", { name: "切换组织", exact: true }).waitFor();
    assert.equal(state.transactions.size, 0);
    cases.push("invalid source with no alternatives enters stable access state");
    await context.close();
  }
  {
    const { context, page } = await open();
    await context.clearCookies();
    const start = state.requests.length;
    await page.goto(origin + "/auth/organizations");
    await page.locator("#login-username").waitFor();
    assert.equal(
      state.requests.slice(start).filter((url) => url.endsWith("/organizations/query")).length,
      0,
    );
    cases.push("missing session cannot load organization candidates");
    await context.close();
  }
  assert.deepEqual(errors, []);
  const report = {
    status: "passed",
    scope: "production tenant frontend + controlled HTTPS BFF",
    cases,
    output,
    limits: [
      "Not real Auth/IAM or production acceptance; strict JWT and Redis CAS have separate backend tests.",
    ],
  };
  await writeFile(path.join(output, "result.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  for (const context of contexts)
    for (const page of context.pages()) {
      await page.screenshot({ path: path.join(output, "failure.png") }).catch(() => {});
      await writeFile(path.join(output, "failure.html"), await page.content().catch(() => ""));
    }
  console.error(JSON.stringify({ output, errors, requests: state.requests }, null, 2));
  throw error;
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}
