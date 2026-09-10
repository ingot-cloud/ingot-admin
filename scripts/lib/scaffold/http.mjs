import { randomBytes } from "node:crypto";
import { API_BASE, BODY_LIMIT_BYTES, SESSION_HEADER } from "./constants.mjs";
import { createScaffold, listCatalog, previewScaffold } from "./engine.mjs";
import { ScaffoldError, toErrorPayload } from "./errors.mjs";
import { getPublicSchema } from "./schema.mjs";

const allowedHost = (host, port) => {
  const value = String(host ?? "").toLowerCase();
  return value === `127.0.0.1:${port}` || value === `localhost:${port}`;
};

const allowedOrigin = (origin, port) => {
  if (!origin) {
    return false;
  }
  try {
    const url = new URL(origin);
    return (url.hostname === "127.0.0.1" || url.hostname === "localhost") && url.port === String(port);
  } catch {
    return false;
  }
};

const readBody = (req, limit) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      size += buffer.length;
      if (size > limit) {
        reject(new ScaffoldError("请求体过大", { code: "PAYLOAD_TOO_LARGE", status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(buffer);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });

const send = (res, status, payload) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(payload));
};

const guard = (req, res, port) => {
  if (!allowedHost(req.headers.host, port)) {
    send(res, 403, toErrorPayload(new ScaffoldError("仅允许本机访问", { code: "LOCAL_ACCESS_REQUIRED", status: 403 })));
    return false;
  }
  if (req.method !== "GET" && !allowedOrigin(req.headers.origin, port)) {
    send(res, 403, toErrorPayload(new ScaffoldError("Origin 不匹配", { code: "LOCAL_ACCESS_REQUIRED", status: 403 })));
    return false;
  }
  return true;
};

/**
 * @param {{ rootDir: string, port: number, sessionToken: string }} options
 */
export const createPortalApiHandler = ({ rootDir, port, sessionToken }) => {
  const requireToken = (req, res) => {
    const token = String(req.headers[SESSION_HEADER] ?? "");
    if (token !== sessionToken) {
      send(res, 403, toErrorPayload(new ScaffoldError("会话无效，请刷新页面", { code: "INVALID_SESSION", status: 403 })));
      return false;
    }
    return true;
  };

  return async (req, res, next) => {
    const url = req.url?.split("?")[0] ?? "";
    if (!url.startsWith(API_BASE)) {
      next();
      return;
    }
    const route = url.slice(API_BASE.length) || "/";
    if (!guard(req, res, port)) {
      return;
    }
    try {
      if (req.method === "GET" && route === "/capabilities") {
        send(res, 200, {
          ok: true,
          data: { mode: "local", canWrite: true, configVersion: 1, sessionToken },
        });
        return;
      }
      if (req.method === "GET" && route === "/schema") {
        send(res, 200, { ok: true, data: getPublicSchema() });
        return;
      }
      if (req.method === "GET" && route === "/catalog") {
        send(res, 200, { ok: true, data: listCatalog(rootDir) });
        return;
      }
      if (req.method === "POST" && (route === "/preview" || route === "/create")) {
        if (!requireToken(req, res)) {
          return;
        }
        const contentType = String(req.headers["content-type"] ?? "");
        if (!contentType.includes("application/json")) {
          send(
            res,
            415,
            toErrorPayload(new ScaffoldError("仅接受 application/json", { code: "UNSUPPORTED_MEDIA_TYPE", status: 415 })),
          );
          return;
        }
        const rawText = await readBody(req, BODY_LIMIT_BYTES);
        let body;
        try {
          body = rawText ? JSON.parse(rawText) : {};
        } catch {
          send(res, 400, toErrorPayload(new ScaffoldError("JSON 无效", { code: "INVALID_JSON" })));
          return;
        }
        if (route === "/preview") {
          const preview = previewScaffold(body, rootDir);
          send(res, 200, {
            ok: true,
            data: {
              kind: preview.kind,
              targetDir: preview.targetDir,
              packageName: preview.packageName,
              fingerprint: preview.fingerprint,
              files: preview.files,
              diagnostics: preview.diagnostics,
              nextSteps: preview.nextSteps,
            },
          });
          return;
        }
        const result = await createScaffold(body.request, String(body.fingerprint ?? ""), rootDir);
        send(res, 201, { ok: true, data: result });
        return;
      }
      next();
    } catch (error) {
      const payload = toErrorPayload(error);
      const status = error instanceof ScaffoldError ? error.status : 500;
      send(res, status, payload);
    }
  };
};

export const createDevPortalApi = ({ rootDir, port }) => {
  const sessionToken = randomBytes(24).toString("hex");
  const handler = createPortalApiHandler({ rootDir, port, sessionToken });
  return {
    name: "ingot-dev-portal-api",
    configureServer(server) {
      server.middlewares.use(handler);
    },
  };
};
