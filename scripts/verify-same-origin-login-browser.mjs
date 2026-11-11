/** Production-artifact browser regression with a controlled BFF fixture, not real-account acceptance. */
import assert from "node:assert/strict";
import { createServer } from "node:https";
import {
  generateKeyPairSync,
  privateDecrypt,
  createDecipheriv,
  randomBytes,
  constants,
} from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const root = fileURLToPath(new URL("..", import.meta.url));
const output = await mkdtemp(path.join(tmpdir(), "ingot-same-origin-browser-"));
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
    "subjectAltName=IP:127.0.0.1,DNS:platform.localhost,DNS:tenant.localhost",
  ],
  { stdio: "ignore" },
);
const { publicKey, privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const publicInfo = {
  kid: "browser-fixture",
  alg: "RSA-OAEP-256",
  active: true,
  publicKey: publicKey.export({ type: "spki", format: "der" }).toString("base64"),
};
const tls = { key: await readFile(keyFile), cert: await readFile(certFile) };
const fixtures = [];
const errors = [];
const lifecycleEvidence = [];
const opaque = () => randomBytes(16).toString("base64url");
const mime = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};
const expiry = () => new Date(Date.now() + 7_200_000).toISOString();
const parseCookies = (req) =>
  Object.fromEntries(
    (req.headers.cookie ?? "")
      .split(";")
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf("=");
        return [part.slice(0, index).trim(), part.slice(index + 1)];
      }),
  );
const finish = (res, data, status = 200, code = "S0200") => {
  res.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" });
  res.end(
    JSON.stringify({ code, message: code === "S0200" ? "" : "fixture business failure", data }),
  );
};
const cookie = (name, value, age = 7200) =>
  `${name}=${value}; Path=/; Max-Age=${age}; HttpOnly; Secure; SameSite=Lax`;
const decryptLogin = (req, body) => {
  assert.equal(req.headers["in-crypto-md"], "h1");
  assert.equal(typeof body.data, "string");
  assert.equal(body.password, undefined);
  const cek = privateDecrypt(
    { key: privateKey, padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: "sha256" },
    Buffer.from(req.headers["in-crypto-sk"], "base64"),
  );
  const all = Buffer.from(body.data, "base64");
  const decipher = createDecipheriv("aes-256-gcm", cek, all.subarray(0, 12));
  decipher.setAAD(
    Buffer.from(`h1|browser-fixture|${req.headers["in-crypto-no"]}|${req.headers["in-crypto-ts"]}`),
  );
  decipher.setAuthTag(all.subarray(-16));
  return JSON.parse(
    Buffer.concat([decipher.update(all.subarray(12, -16)), decipher.final()]).toString(),
  );
};
for (const entry of ["platform", "tenant"]) {
  const state = {
    entry,
    domain: entry === "platform" ? "PLATFORM" : "TENANT",
    requests: [],
    bindings: new Map(),
    transactions: new Map(),
    session: null,
    loseResponse: false,
    multi: false,
    rejectCookie: false,
    executions: 0,
    nonces: new Set(),
    challenge: false,
    mustChange: true,
    bootstrapDelayMs: 0,
    logoutDelayMs: 0,
  };
  state.sessionName = `__Host-IN_${entry.toUpperCase()}_SESSION`;
  state.bindingName = `__Host-IN_${entry.toUpperCase()}_BINDING`;
  const server = createServer(tls, async (req, res) => {
    try {
      const target = new URL(req.url, `https://${req.headers.host}`);
      const url = target.pathname;
      if (!url.startsWith("/api/")) {
        const relative = url.startsWith("/static/") ? url : "/index.html";
        const file = path.join(
          root,
          "apps",
          entry === "platform" ? "admin-platform" : "admin",
          "dist",
          relative,
        );
        try {
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
      state.requests.push({ path: url, method: req.method });
      const cookies = parseCookies(req);
      const binding = state.bindings.get(cookies[state.bindingName]);
      let body = "";
      for await (const chunk of req) body += chunk;
      body = body ? JSON.parse(body) : {};
      if (!["GET", "HEAD"].includes(req.method)) assert.equal(req.headers.origin, target.origin);
      if (url === "/api/vc/image")
        return finish(res, {
          repCode: "0000",
          repData: {
            originalImageBase64:
              "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aP34AAAAASUVORK5CYII=",
            jigsawImageBase64: "",
            token: "fixture-captcha",
            secretKey: "",
          },
        });
      if (url.endsWith("/crypto/public-keys")) return finish(res, [publicInfo]);
      if (url.endsWith("/csrf")) {
        const value = binding ?? { id: opaque(), csrf: opaque() };
        state.bindings.set(value.id, value);
        res.setHeader("Set-Cookie", cookie(state.bindingName, value.id));
        return finish(res, { csrfToken: value.csrf, expiresAt: expiry() });
      }
      if (url.endsWith("/me")) {
        if (!state.session || cookies[state.sessionName] !== state.session)
          return finish(res, null, 401, "S0401");
        return finish(res, {
          appId: `${entry}-admin`,
          domain: state.domain,
          tenantId: entry === "tenant" ? "42" : null,
          userId: 1,
          clientId: `in-bff-${entry}`,
        });
      }
      if (url.endsWith("/logout")) {
        assert.ok(binding, "logout requires binding");
        assert.equal(req.headers["x-csrf-token"], binding.csrf);
        const oldSession = cookies[state.sessionName];
        if (state.session === oldSession) state.session = null;
        state.bindings.delete(binding.id);
        if (state.logoutDelayMs)
          await new Promise((resolve) => setTimeout(resolve, state.logoutDelayMs));
        res.setHeader("Set-Cookie", [
          cookie(state.sessionName, "", 0),
          cookie(state.bindingName, "", 0),
        ]);
        finish(res);
        state.resolveLogout?.();
        return;
      }
      if (url.endsWith("/bootstrap")) {
        if (!state.session || cookies[state.sessionName] !== state.session)
          return finish(res, null, 401, "S0401");
        if (state.bootstrapDelayMs)
          await new Promise((resolve) => setTimeout(resolve, state.bootstrapDelayMs));
        if (state.mustChange) return finish(res, null, 403, "PasswordChangeRequired");
        return finish(res, {
          context: {
            domain: state.domain,
            accountId: "1",
            memberId: "101",
            tenantId: entry === "tenant" ? "42" : null,
          },
          profile: { memberId: "101", displayName: "测试人员" },
          applications: [{ id: "1", code: "fixture", name: "测试应用" }],
          menus: state.emptyMenus
            ? []
            : [
                {
                  id: "fixture-layout",
                  applicationId: "1",
                  name: "测试应用",
                  kind: "DIRECTORY",
                  path: "/fixture-shell",
                  viewPath: "layout.main",
                  children: [
                    {
                      id: "1",
                      applicationId: "1",
                      name: "测试入口",
                      kind: "PAGE",
                      path: "/fixture-home",
                      viewPath: "common.plugin.unavailable",
                      routeName: "FixtureHome",
                      children: [],
                    },
                  ],
                },
              ],
          actionCodes: [],
          version: "1",
          expiresAt: expiry(),
        });
      }
      if (url.endsWith("/me/password"))
        return finish(res, {
          context: {
            domain: state.domain,
            accountId: "1",
            memberId: "101",
            tenantId: entry === "tenant" ? "42" : null,
          },
          mustChangePassword: true,
        });
      assert.ok(binding, "transaction requires original binding");
      if (req.method === "POST") assert.equal(req.headers["x-csrf-token"], binding.csrf);
      if (url.endsWith("/transactions")) {
        const tx = {
          transactionId: opaque(),
          stage: "LOGIN",
          expiresAt: expiry(),
          binding: binding.id,
        };
        state.transactions.set(tx.transactionId, tx);
        return finish(res, {
          transactionId: tx.transactionId,
          stage: tx.stage,
          expiresAt: tx.expiresAt,
        });
      }
      let tx;
      if (url.endsWith("/login")) {
        if (state.challenge) {
          state.challenge = false;
          return finish(
            res,
            {
              vcType: "image",
              checkPath: "/vc/image/check",
              scope: "login-fixture",
              scopeParam: "X-VC-Scope",
              passTokenParam: "X-VC-Pass",
            },
            412,
            "CHALLENGE_REQUIRED",
          );
        }
        const nonce = req.headers["in-crypto-no"];
        if (state.nonces.has(nonce)) return finish(res, null, 400, "replay_nonce_dup");
        state.nonces.add(nonce);
        state.executions += 1;
        body = decryptLogin(req, body);
        assert.equal(body.password, "memory-only-test-password");
        tx = state.transactions.get(body.transactionId);
      } else if (url.endsWith("/select")) tx = state.transactions.get(body.transactionId);
      else tx = state.transactions.get(url.split("/transactions/")[1]?.split("/")[0]);
      assert.equal(tx?.binding, binding.id, "no rebind of authenticated results");
      if (req.method === "GET")
        return finish(
          res,
          tx.stage === "COMPLETED"
            ? {
                transactionId: tx.transactionId,
                stage: tx.stage,
                returnTo: "/",
                recoveryExpiresAt: expiry(),
                sessionEstablished: cookies[state.sessionName] === tx.session,
              }
            : {
                transactionId: tx.transactionId,
                stage: tx.stage,
                expiresAt: tx.expiresAt,
                allows: tx.allows,
              },
        );
      if (url.endsWith("/resume")) {
        assert.equal(tx.session, state.session);
        if (!state.rejectCookie) res.setHeader("Set-Cookie", cookie(state.sessionName, tx.session));
        return finish(res, {
          transactionId: tx.transactionId,
          stage: "COMPLETED",
          returnTo: "/",
          recoveryExpiresAt: expiry(),
        });
      }
      if (state.multi && url.endsWith("/login")) {
        tx.stage = "SELECT_TENANT";
        tx.allows = [
          { id: "42", name: "组织甲" },
          { id: "43", name: "组织乙" },
        ];
        return finish(res, {
          transactionId: tx.transactionId,
          stage: tx.stage,
          expiresAt: tx.expiresAt,
          allows: tx.allows,
        });
      }
      tx.stage = "COMPLETED";
      tx.session = opaque();
      state.session = tx.session;
      if (state.loseResponse) {
        state.loseResponse = false;
        res.destroy();
        return;
      }
      if (!state.rejectCookie) res.setHeader("Set-Cookie", cookie(state.sessionName, tx.session));
      return finish(res, {
        transactionId: tx.transactionId,
        stage: tx.stage,
        returnTo: "/",
        recoveryExpiresAt: expiry(),
      });
    } catch (error) {
      errors.push(error.message);
      if (!res.headersSent) finish(res, null, 500, "FIXTURE_VALIDATION_FAILED");
      else res.destroy();
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  fixtures.push({ ...state, state, server, port: server.address().port });
}
let browser;
try {
  browser = await chromium.launch({ channel: "chrome", headless: true });
  for (const mode of ["ip", "domains"]) {
    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    const pages = [];
    for (const fixture of fixtures) {
      const { state, entry, port } = fixture;
      state.session = null;
      state.requests = [];
      state.multi = entry === "tenant";
      state.mustChange = entry === "platform";
      state.executions = 0;
      state.bootstrapDelayMs = entry === "tenant" ? 500 : 0;
      const origin = `https://${mode === "ip" ? "127.0.0.1" : `${entry}.localhost`}:${port}`;
      const page = await context.newPage();
      pages.push(page);
      await page.addInitScript(() => localStorage.setItem("vueuse-color-scheme", "dark"));
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(`${origin}/login/`);
      await page.locator("#login-username").waitFor();
      assert.equal(
        await page.evaluate(() => document.documentElement.classList.contains("dark")),
        false,
      );
      assert.equal(
        state.requests.filter((request) => /transactions|csrf|bootstrap|captcha/.test(request.path))
          .length,
        0,
      );
      // Simulated long dwell proves no eager transaction creation; real suspend/resume remains target-environment acceptance.
      await page.clock.install();
      await page.clock.fastForward(3_600_001);
      await page.locator("#login-username").fill("test-operator");
      await page.locator("#login-password").fill("memory-only-test-password");
      if (entry === "tenant")
        await page.evaluate(() =>
          sessionStorage.setItem(
            "ingot.auth.tenant-admin.returnTo",
            "/fixture-home?tab=security#details",
          ),
        );
      if (entry === "platform") state.loseResponse = true;
      const attemptStart = state.requests.length;
      await page.getByRole("button", { name: "登录", exact: true }).click();
      if (state.multi) {
        await page.getByRole("heading", { name: "选择组织" }).waitFor();
        assert.equal(new URL(page.url()).pathname, "/login/");
        await page.getByRole("button", { name: "组织甲" }).click();
      }
      await page.waitForURL(
        (url) => url.pathname === (entry === "platform" ? "/init" : "/fixture-home"),
        { timeout: 15_000 },
      );
      if (entry === "tenant") assert.equal(new URL(page.url()).search, "?tab=security");
      await page.waitForFunction(
        (key) => sessionStorage.getItem(key) === null,
        `ingot.auth.${entry}-admin.transaction`,
      );
      if (entry === "tenant") {
        const completionRequests = state.requests
          .slice(attemptStart)
          .filter(
            ({ method, path: requestPath }) =>
              method === "GET" &&
              (requestPath.startsWith("/api/bff/auth/tenant/transactions/") ||
                requestPath === "/api/bff/auth/me" ||
                requestPath === "/api/iam/v1/me/bootstrap"),
          )
          .map(({ path: requestPath }) =>
            requestPath.replace(/\/transactions\/[^/]+$/, "/transactions/:id"),
          );
        assert.deepEqual(
          completionRequests,
          ["/api/bff/auth/tenant/transactions/:id", "/api/bff/auth/me", "/api/iam/v1/me/bootstrap"],
          "slow bootstrap must not remount login or repeat completed-transaction confirmation",
        );
      }
      state.bootstrapDelayMs = 0;
      assert.equal(state.executions, 1);
      if (entry === "platform")
        assert.equal(
          state.requests.filter((request) => request.path.endsWith("/resume")).length,
          1,
        );
      const cookies = await context.cookies(origin);
      assert.ok(
        cookies.some(
          (value) =>
            value.name === state.sessionName &&
            value.secure &&
            value.httpOnly &&
            value.sameSite === "Lax",
        ),
      );
      assert.equal(
        await page.evaluate(() => document.documentElement.hasAttribute("data-in-auth")),
        false,
      );
      assert.equal(
        await page.evaluate(() => document.documentElement.classList.contains("dark")),
        true,
      );
      assert.equal(
        state.requests.filter((request) => request.path.endsWith("/bootstrap")).length,
        1,
      );
      // Explicit exit intent must show form even when a valid old cookie still exists.
      await page.evaluate(
        (key) => sessionStorage.setItem(key, "1"),
        `ingot.auth.${entry}-admin.explicitLogout`,
      );
      await page.goto(`${origin}/login/`);
      await page.locator("#login-username").waitFor();
      await page.setViewportSize({ width: 360, height: 760 });
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        false,
      );
      await page.screenshot({ path: path.join(output, `${mode}-${entry}-login.png`) });
      for (const old of [
        "/auth/start?tx=old",
        "/auth/complete?ticket=old",
        "/oauth2/challenge?tx=old",
      ]) {
        await page.evaluate(
          (key) => sessionStorage.setItem(key, "1"),
          `ingot.auth.${entry}-admin.explicitLogout`,
        );
        await page.goto(origin + old);
        await page.locator("#login-username").waitFor();
        assert.equal(new URL(page.url()).pathname, "/login/");
        assert.equal(new URL(page.url()).search, "");
      }
    }
    if (mode === "ip") {
      const sent = await context.cookies(`https://127.0.0.1:${fixtures[0].port}`);
      assert.ok(sent.some((value) => value.name === "__Host-IN_PLATFORM_SESSION"));
      assert.ok(sent.some((value) => value.name === "__Host-IN_TENANT_SESSION"));
      const logoutOrigin = `https://127.0.0.1:${fixtures[0].port}`;
      const csrf = await pages[0].request.post(logoutOrigin + "/api/bff/auth/csrf", {
        headers: { Origin: logoutOrigin },
        data: {},
      });
      await pages[0].request.delete(logoutOrigin + "/api/bff/auth/logout", {
        headers: { Origin: logoutOrigin, "X-CSRF-TOKEN": (await csrf.json()).data.csrfToken },
      });
      assert.ok(
        (await context.cookies(`https://127.0.0.1:${fixtures[1].port}`)).some(
          (value) => value.name === "__Host-IN_TENANT_SESSION",
        ),
      );
    }
    await context.close();
  }
  const authRequests = (requests) =>
    requests.filter(({ path: url }) => /\/bff\/auth\/|\/me\/bootstrap$/.test(url));
  const summarize = (requests) =>
    authRequests(requests).map(
      ({ method, path: url }) => `${method} ${url.replace(/(\/transactions\/)[^/]+/, "$1:id")}`,
    );
  const fillLogin = async (page, state) => {
    await page.locator("#login-username").fill("test-operator");
    await page.locator("#login-password").fill("memory-only-test-password");
    await page.getByRole("button", { name: "登录", exact: true }).click();
    if (state.multi) await page.getByRole("button", { name: "组织甲" }).click();
    await page.waitForURL("**/fixture-home**");
    await page.locator(".in-user-dropdown").waitFor();
  };
  const showLoginViaMenu = async (page) => {
    await page.locator(".in-user-dropdown").click();
    await page.getByRole("menuitem", { name: "切换组织" }).click();
    await page.getByRole("button", { name: "确定", exact: true }).click();
    await page.locator("#login-username").waitFor();
    assert.equal(new URL(page.url()).search, "");
  };
  const clickLogout = async (page) => {
    await page.locator(".in-user-dropdown").click();
    await page.getByRole("menuitem", { name: "退出登录" }).click();
    await page.locator("#login-username").waitFor();
  };
  // Actual built-in menu actions and native BroadcastChannel, across both deployment modes.
  for (const mode of ["ip", "domains"]) {
    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    const active = [];
    for (const { state, entry, port } of fixtures) {
      Object.assign(state, {
        session: null,
        mustChange: false,
        emptyMenus: false,
        multi: entry === "tenant",
        challenge: false,
        rejectCookie: false,
        bootstrapDelayMs: 150,
        requests: [],
      });
      const origin = `https://${mode === "ip" ? "127.0.0.1" : `${entry}.localhost`}:${port}`;
      const page = await context.newPage();
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(origin + "/login/");
      await fillLogin(page, state);
      active.push({ page, state, origin });
    }
    for (const { page, state, origin } of active) {
      let start = state.requests.length;
      await page.goto(origin + "/login/");
      await page.waitForURL("**/fixture-home**");
      await page.locator(".in-user-dropdown").waitFor();
      assert.deepEqual(
        summarize(state.requests.slice(start)),
        ["GET /api/bff/auth/me", "GET /api/iam/v1/me/bootstrap"],
        "existing session enters once",
      );
      const tx = [...state.transactions.values()]
        .reverse()
        .find((value) => value.session === state.session);
      await page.evaluate(
        ({ app, id }) => sessionStorage.setItem(`ingot.auth.${app}.transaction`, id),
        { app: `${state.entry}-admin`, id: tx.transactionId },
      );
      start = state.requests.length;
      await page.goto(origin + "/login/");
      await page.waitForURL("**/fixture-home**");
      await page.locator(".in-user-dropdown").waitFor();
      const restored = summarize(state.requests.slice(start));
      assert.deepEqual(
        restored,
        [
          "POST /api/bff/auth/csrf",
          `GET /api/bff/auth/${state.entry}/transactions/:id`,
          "GET /api/bff/auth/me",
          "GET /api/iam/v1/me/bootstrap",
        ],
        "restore reuses its completed GET without a second query",
      );
      const peer = await context.newPage();
      peer.on("pageerror", (error) => errors.push(error.message));
      const peerRequests = [];
      peer.on("request", (request) => {
        const url = new URL(request.url());
        if (url.pathname.startsWith("/api/"))
          peerRequests.push({ method: request.method(), path: url.pathname });
      });
      await peer.goto(origin + "/fixture-home");
      await peer.locator(".in-user-dropdown").waitFor();
      start = state.requests.length;
      const oldCookie = (await context.cookies(origin)).find(
        ({ name }) => name === state.sessionName,
      )?.value;
      await showLoginViaMenu(page);
      assert.deepEqual(
        summarize(state.requests.slice(start)),
        [],
        "switch organization must show form without existing-cookie auto-entry",
      );
      assert.equal(
        (await context.cookies(origin)).find(({ name }) => name === state.sessionName)?.value,
        oldCookie,
      );
      const peerStart = peerRequests.length;
      const peerRefreshed = peer.waitForResponse((response) =>
        response.url().endsWith("/me/bootstrap"),
      );
      await fillLogin(page, state);
      await peerRefreshed;
      await peer.locator(".in-user-dropdown").waitFor();
      assert.deepEqual(
        summarize(peerRequests.slice(peerStart)),
        ["GET /api/iam/v1/me/bootstrap"],
        "native identity event rechecks peer once",
      );
      start = state.requests.length;
      await clickLogout(page);
      await peer.locator("#login-username").waitFor();
      const loginRouteSettled = (url) => url.pathname === "/login/" && url.search === "";
      await Promise.all([page.waitForURL(loginRouteSettled), peer.waitForURL(loginRouteSettled)]);
      const loggedOut = summarize(state.requests.slice(start));
      assert.deepEqual(
        loggedOut,
        ["POST /api/bff/auth/csrf", "DELETE /api/bff/auth/logout"],
        "one revoke, peer skips bootstrap and auto-login",
      );
      const backStart = state.requests.length;
      await page.goBack().catch((error) => {
        if (!error.message.includes("ERR_ABORTED")) throw error;
      });
      await page.locator("#login-username").waitFor();
      const afterBack = summarize(state.requests.slice(backStart));
      assert.deepEqual(
        afterBack,
        ["GET /api/iam/v1/me/bootstrap"],
        "back after logout rejects old identity once and returns to forced form",
      );
      const other = active.find((value) => value.state !== state);
      if (other.state.session) {
        assert.ok(
          (await context.cookies(other.origin)).some(
            ({ name }) => name === other.state.sessionName,
          ),
        );
        await other.page.locator(".in-user-dropdown").waitFor();
      }
      lifecycleEvidence.push({
        mode,
        entry: state.entry,
        restored,
        afterBack,
        peerIdentityRefresh: summarize(peerRequests.slice(peerStart)),
        loggedOut,
      });
      await peer.close();
    }
    await context.close();
  }
  // A late logout response must not clear cookies from an immediate fresh login.
  {
    const { state, port } = fixtures[0];
    Object.assign(state, {
      session: null,
      mustChange: false,
      multi: false,
      bootstrapDelayMs: 0,
      requests: [],
      logoutDelayMs: 2500,
    });
    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    const origin = `https://127.0.0.1:${port}`;
    await page.goto(origin + "/login/");
    await fillLogin(page, state);
    const finished = new Promise((resolve) => {
      state.resolveLogout = resolve;
    });
    const start = state.requests.length;
    await clickLogout(page);
    await fillLogin(page, state);
    const current = state.session;
    await finished;
    assert.equal(
      (await context.cookies(origin)).find(({ name }) => name === state.sessionName)?.value,
      current,
    );
    const bindingCookie = (await context.cookies(origin)).find(
      ({ name }) => name === state.bindingName,
    )?.value;
    assert.ok(state.bindings.has(bindingCookie));
    assert.equal((await page.request.get(origin + "/api/bff/auth/me")).status(), 200);
    assert.equal(
      state.requests.slice(start).filter(({ path: url }) => url.endsWith("/logout")).length,
      1,
    );
    state.logoutDelayMs = 0;
    state.resolveLogout = undefined;
    await context.close();
  }
  // Cookie rejection remains on the same form, without endless resume or credential replay.
  {
    const { state, port } = fixtures[0];
    state.session = null;
    state.rejectCookie = true;
    state.requests = [];
    state.executions = 0;
    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    const page = await context.newPage();
    const origin = `https://127.0.0.1:${port}`;
    await page.goto(origin + "/login/");
    await page.locator("#login-username").fill("test-operator");
    await page.locator("#login-password").fill("memory-only-test-password");
    await page.locator("#login-password").press("Enter");
    const toast = page.locator(".in-message.el-message--error").filter({ hasText: "Cookie" });
    await toast.waitFor();
    assert.equal(await page.locator(".auth-shell__panel").getByRole("alert").count(), 0);
    await page.getByRole("button", { name: "重新确认登录结果" }).waitFor();
    assert.equal(new URL(page.url()).pathname, "/login/");
    assert.equal(state.executions, 1);
    assert.equal(state.requests.filter((request) => request.path.endsWith("/resume")).length, 1);
    assert.equal(state.requests.filter((request) => request.path.endsWith("/bootstrap")).length, 0);
    await context.close();
    state.rejectCookie = false;
  }
  // Shared challenge appears only after 412 and supports keyboard cancellation without page navigation.
  {
    const { state, port } = fixtures[1];
    state.session = null;
    state.challenge = true;
    state.requests = [];
    state.executions = 0;
    const context = await browser.newContext({
      ignoreHTTPSErrors: true,
      viewport: { width: 360, height: 760 },
    });
    const page = await context.newPage();
    await page.goto(`https://127.0.0.1:${port}/login/`);
    await page.locator("#login-username").fill("test-operator");
    await page.locator("#login-password").fill("memory-only-test-password");
    await page.locator("#login-password").press("Enter");
    const close = page.getByRole("button", { name: "关闭安全验证" });
    await close.waitFor();
    await close.press("Enter");
    const toast = page.locator(".in-message.el-message--error").filter({ hasText: "已取消安全验证" });
    await toast.waitFor();
    assert.equal(await page.locator(".auth-shell__panel").getByRole("alert").count(), 0);
    assert.equal(state.executions, 0);
    assert.equal(new URL(page.url()).pathname, "/login/");
    assert.equal(await page.locator("#login-password").inputValue(), "memory-only-test-password");
    await context.close();
  }
  // An authenticated account without menus gets a stable access-empty screen, not repeated bootstrap/login.
  {
    const { state, port } = fixtures[0];
    state.session = null;
    state.mustChange = false;
    state.emptyMenus = true;
    state.requests = [];
    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`https://127.0.0.1:${port}/login/`);
    await page.locator("#login-username").fill("test-operator");
    await page.locator("#login-password").fill("memory-only-test-password");
    await page.locator("#login-password").press("Enter");
    await page.waitForURL("**/403", { timeout: 15_000 });
    assert.equal(state.requests.filter((request) => request.path.endsWith("/bootstrap")).length, 1);
    state.emptyMenus = false;
    await context.close();
  }
  assert.deepEqual(errors, []);
  const report = {
    status: "passed",
    scope: "production frontend + controlled BFF fixture",
    modes: ["HTTPS loopback IP dual-port", "HTTPS separate localhost hosts"],
    cases: [
      "no eager transaction/bootstrap/captcha",
      "simulated hour dwell",
      "HYBRID whole request decrypted",
      "multi-tenant same-page selection",
      "lost response / one resume",
      "forced-password gate",
      "normal dynamic routes and saved deep-link",
      "empty-menu stable access screen",
      "Secure HttpOnly cookies and IP cookie overlap",
      "app-local logout via actual UI / native cross-tab logout",
      "existing-session single entry",
      "completed transaction reload single confirmation",
      "organization switch forced form with existing cookie",
      "native identity event one peer bootstrap",
      "slow logout abort / immediate fresh login cookie preserved",
      "browser back after logout rejects old identity once",
      "explicit exit intent",
      "legacy local redirects",
      "360px layout",
      "theme scope restored",
      "blocked cookie bounded failure",
      "412 challenge keyboard cancellation",
    ],
    lifecycleEvidence,
    limits: [
      "fixture BFF is not real Auth/IAM",
      "self-signed test TLS ignores trust errors; customer CA/SAN trust still requires acceptance",
      "real-hour sleep and production rollback pending",
    ],
  };
  await writeFile(path.join(output, "result.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ ...report, artifacts: output }, null, 2));
} catch (error) {
  console.error(
    JSON.stringify(
      {
        error: error.message,
        fixtureErrors: errors,
        requests: fixtures.map(({ state }) => ({
          entry: state.entry,
          requests: state.requests.map((request) => ({
            ...request,
            path: request.path.replace(/(\/transactions\/)[^/]+/, "$1[redacted]"),
          })),
        })),
      },
      null,
      2,
    ),
  );
  if (browser)
    for (const context of browser.contexts())
      for (const page of context.pages()) {
        console.error(
          JSON.stringify({
            path: new URL(page.url()).pathname,
            message: await page.locator("[role=alert]").allTextContents(),
          }),
        );
        await page.screenshot({ path: path.join(output, "failure.png") }).catch(() => undefined);
      }
  throw error;
} finally {
  await browser?.close();
  await Promise.all(
    fixtures.map(
      ({ server }) =>
        new Promise((resolve) => {
          server.closeAllConnections();
          server.close(resolve);
        }),
    ),
  );
}
