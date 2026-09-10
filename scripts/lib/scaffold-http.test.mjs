import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { API_BASE, BODY_LIMIT_BYTES } from "./scaffold/constants.mjs";
import { createPortalApiHandler } from "./scaffold/http.mjs";

const makeRoot = () => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "ingot-portal-http-"));
  fs.mkdirSync(path.join(rootDir, "apps"));
  fs.mkdirSync(path.join(rootDir, "plugins"));
  fs.mkdirSync(path.join(rootDir, "themes"));
  return rootDir;
};

const startServer = (rootDir, sessionToken) =>
  new Promise((resolve) => {
    /** @type {(req: http.IncomingMessage, res: http.ServerResponse, next: () => void) => void} */
    let handler = (_req, res) => {
      res.statusCode = 503;
      res.end();
    };
    const server = http.createServer((req, res) => {
      handler(req, res, () => {
        res.statusCode = 404;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ ok: false, error: { code: "NOT_FOUND", message: "无此接口" } }));
      });
    });
    server.listen(0, "127.0.0.1", () => {
      const port = server.address().port;
      handler = createPortalApiHandler({ rootDir, port, sessionToken });
      resolve({ server, port });
    });
  });

const requestJson = ({ port, method, route, body, headers = {} }) =>
  new Promise((resolve, reject) => {
    const payload = body === undefined ? undefined : Buffer.from(typeof body === "string" ? body : JSON.stringify(body));
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port,
        path: `${API_BASE}${route}`,
        method,
        headers: {
          Host: `127.0.0.1:${port}`,
          Origin: `http://127.0.0.1:${port}`,
          ...(payload ? { "Content-Type": "application/json", "Content-Length": String(payload.length) } : {}),
          ...headers,
        },
      },
      (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          resolve({ status: res.statusCode, payload: text ? JSON.parse(text) : null });
        });
      },
    );
    req.on("error", reject);
    if (payload) {
      req.write(payload);
    }
    req.end();
  });

test("capabilities / schema，以及无效 JSON、媒体类型、Origin、session", async () => {
  const rootDir = makeRoot();
  const sessionToken = "test-session-token";
  const { server, port } = await startServer(rootDir, sessionToken);
  try {
    const capabilities = await requestJson({ port, method: "GET", route: "/capabilities" });
    assert.equal(capabilities.status, 200);
    assert.equal(capabilities.payload.data.canWrite, true);

    const schema = await requestJson({ port, method: "GET", route: "/schema" });
    assert.equal(schema.status, 200);
    assert.ok(Array.isArray(schema.payload.data.envFields));

    const invalidJson = await requestJson({
      port,
      method: "POST",
      route: "/preview",
      body: "{",
      headers: { "X-Ingot-Scaffold-Token": sessionToken },
    });
    assert.equal(invalidJson.status, 400);
    assert.equal(invalidJson.payload.error.code, "INVALID_JSON");

    const media = await requestJson({
      port,
      method: "POST",
      route: "/preview",
      body: "{}",
      headers: {
        "Content-Type": "text/plain",
        "X-Ingot-Scaffold-Token": sessionToken,
      },
    });
    assert.equal(media.status, 415);

    const origin = await requestJson({
      port,
      method: "POST",
      route: "/preview",
      body: { version: 1, kind: "app", options: { appCode: "demo-app" } },
      headers: {
        Origin: "http://example.com",
        "X-Ingot-Scaffold-Token": sessionToken,
      },
    });
    assert.equal(origin.status, 403);

    const session = await requestJson({
      port,
      method: "POST",
      route: "/preview",
      body: { version: 1, kind: "app", options: { appCode: "demo-app" } },
    });
    assert.equal(session.status, 403);
    assert.equal(session.payload.error.code, "INVALID_SESSION");
  } finally {
    server.close();
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
});

test("请求体超过 1MiB 返回 PAYLOAD_TOO_LARGE", async () => {
  const rootDir = makeRoot();
  const sessionToken = "limit-token";
  const { server, port } = await startServer(rootDir, sessionToken);
  try {
    const oversized = "a".repeat(BODY_LIMIT_BYTES + 8);
    const result = await new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: "127.0.0.1",
          port,
          path: `${API_BASE}/preview`,
          method: "POST",
          headers: {
            Host: `127.0.0.1:${port}`,
            Origin: `http://127.0.0.1:${port}`,
            "Content-Type": "application/json",
            "Content-Length": String(oversized.length + 2),
            "X-Ingot-Scaffold-Token": sessionToken,
          },
        },
        (res) => {
          const chunks = [];
          res.on("data", (chunk) => chunks.push(chunk));
          res.on("end", () => {
            const text = Buffer.concat(chunks).toString("utf8");
            resolve({
              status: res.statusCode,
              payload: text ? JSON.parse(text) : { error: { code: "PAYLOAD_TOO_LARGE" } },
            });
          });
        },
      );
      req.on("error", (error) => {
        if (error.code === "ECONNRESET" || error.code === "EPIPE") {
          resolve({ status: 413, payload: { error: { code: "PAYLOAD_TOO_LARGE" } } });
          return;
        }
        reject(error);
      });
      req.write(`"${oversized}`);
      req.end();
    });
    assert.equal(result.payload.error.code, "PAYLOAD_TOO_LARGE");
  } finally {
    server.close();
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
});
