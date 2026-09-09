import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import type { IncomingMessage, ServerResponse } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import {
  createUsedIconWriter,
  handleUsedIconRequest,
  isValidIconifyName,
  parseUsedIconPayload,
  readUsedIconFile,
  upsertUsedIcon,
  usedFileToCollections,
  usedIconNames,
  writeUsedIconFile,
} from "./iconify-used";

const createdDirs: string[] = [];

afterEach(() => {
  while (createdDirs.length > 0) {
    const dir = createdDirs.pop();
    if (dir) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
});

describe("parseUsedIconPayload", () => {
  it("拒绝非法名字与空 body", () => {
    expect(parseUsedIconPayload({ prefix: "update", name: "modelValue", body: "<path/>" })).toBeUndefined();
    expect(parseUsedIconPayload({ prefix: "mynaui", name: "config", body: "" })).toBeUndefined();
    expect(parseUsedIconPayload(null)).toBeUndefined();
  });

  it("接受合法 prefix:name 与 SVG body", () => {
    expect(
      parseUsedIconPayload({
        prefix: "mynaui",
        name: "config",
        body: "<path d='M1' />",
        width: 24,
      }),
    ).toEqual({
      prefix: "mynaui",
      name: "config",
      body: "<path d='M1' />",
      width: 24,
    });
  });
});

describe("isValidIconifyName", () => {
  it("允许 iconify 前缀，拒绝 vue 事件名", () => {
    expect(isValidIconifyName("mynaui", "config")).toBe(true);
    expect(isValidIconifyName("update", "modelValue")).toBe(false);
  });
});

describe("used icon file", () => {
  it("空文件与缺失文件读成空对象", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ingot-used-"));
    createdDirs.push(dir);
    expect(readUsedIconFile(path.join(dir, "missing.json"))).toEqual({});
    const empty = path.join(dir, "empty.json");
    fs.writeFileSync(empty, "{}");
    expect(readUsedIconFile(empty)).toEqual({});
  });

  it("upsert 去重并转成 collections", () => {
    const payload = {
      prefix: "mynaui",
      name: "config",
      body: "<path d='M1' />",
      width: 24,
    };
    const once = upsertUsedIcon({}, payload);
    const twice = upsertUsedIcon(once, payload);
    expect(twice).toBe(once);
    expect(usedIconNames(once).has("mynaui:config")).toBe(true);
    expect(usedFileToCollections(once)).toEqual([
      {
        prefix: "mynaui",
        icons: { config: { body: "<path d='M1' />", width: 24 } },
      },
    ]);
  });

  it("写入后再读回", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ingot-used-"));
    createdDirs.push(dir);
    const filePath = path.join(dir, "iconify-offline.used.json");
    const data = upsertUsedIcon(
      {},
      { prefix: "mynaui", name: "config", body: "<path d='M1' />" },
    );
    writeUsedIconFile(filePath, data);
    expect(readUsedIconFile(filePath).mynaui?.icons.config?.body).toBe("<path d='M1' />");
  });
});

const createRequest = (body: unknown): IncomingMessage => {
  const payload = typeof body === "string" ? body : JSON.stringify(body);
  return Readable.from([payload]) as IncomingMessage;
};

const createResponse = (): { res: ServerResponse; statusCode: () => number; body: () => string } => {
  let statusCode = 0;
  let body = "";
  const res = {
    setHeader() {
      return undefined;
    },
    end(data?: string) {
      body = data ?? "";
    },
  } as unknown as ServerResponse;
  Object.defineProperty(res, "statusCode", {
    get: () => statusCode,
    set: (value: number) => {
      statusCode = value;
    },
  });
  return {
    res,
    statusCode: () => statusCode,
    body: () => body,
  };
};

describe("handleUsedIconRequest", () => {
  it("非法 payload 返回 400 且不写文件", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ingot-used-"));
    createdDirs.push(dir);
    const filePath = path.join(dir, "iconify-offline.used.json");
    const writer = createUsedIconWriter(filePath, 0);
    const invalid = createResponse();
    await handleUsedIconRequest(
      createRequest({ prefix: "update", name: "modelValue", body: "<path/>" }),
      invalid.res,
      writer,
    );
    expect(invalid.statusCode()).toBe(400);
    expect(fs.existsSync(filePath)).toBe(false);

    const malformed = createResponse();
    await handleUsedIconRequest(createRequest("not-json"), malformed.res, writer);
    expect(malformed.statusCode()).toBe(400);
  });

  it("合法 payload 返回 204 并写入 used.json", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ingot-used-"));
    createdDirs.push(dir);
    const filePath = path.join(dir, "iconify-offline.used.json");
    const writer = createUsedIconWriter(filePath, 0);
    const ok = createResponse();
    await handleUsedIconRequest(
      createRequest({ prefix: "mynaui", name: "config", body: "<path d='M1' />", width: 24 }),
      ok.res,
      writer,
    );
    expect(ok.statusCode()).toBe(204);
    expect(ok.body()).toBe("");
    writer.flush();
    expect(readUsedIconFile(filePath).mynaui?.icons.config?.body).toBe("<path d='M1' />");
  });
});
