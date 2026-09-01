import type { IncomingMessage, ServerResponse } from "node:http";
import { defineConfig, type Plugin } from "vite";
import vue from "@vitejs/plugin-vue";
import { OFFICIAL_PLUGINS, scaffoldApp } from "../../scripts/lib/scaffold-app.mjs";

const readJsonBody = (req: IncomingMessage): Promise<Record<string, unknown>> =>
  new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer | string) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw) as Record<string, unknown>);
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });

const sendJson = (res: ServerResponse, status: number, payload: unknown) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
};

const scaffoldPlugin = (): Plugin => ({
  name: "ingot-scaffold-api",
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      const url = req.url?.split("?")[0];
      if (req.method === "GET" && url === "/api/official-plugins") {
        sendJson(res, 200, { plugins: OFFICIAL_PLUGINS });
        return;
      }
      if (req.method === "POST" && url === "/api/scaffold") {
        try {
          const body = await readJsonBody(req);
          const result = scaffoldApp({
            appCode: String(body.appCode ?? ""),
            port: body.port as string | number | undefined,
            title: body.title as string | undefined,
            officialPluginIds: Array.isArray(body.officialPluginIds)
              ? body.officialPluginIds.map((id) => String(id))
              : [],
            withLocalPlugin: body.withLocalPlugin !== false,
          });
          sendJson(res, 200, { ok: true, ...result });
        } catch (error) {
          sendJson(res, 400, {
            ok: false,
            message: error instanceof Error ? error.message : String(error),
          });
        }
        return;
      }
      next();
    });
  },
});

export default defineConfig({
  plugins: [vue(), scaffoldPlugin()],
  server: {
    host: "127.0.0.1",
    port: 5801,
    strictPort: true,
  },
});
