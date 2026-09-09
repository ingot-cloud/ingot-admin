import fs from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { IconifyJSON } from "@iconify/types";

export const ICONIFY_USED_ENDPOINT = "/__ingot/iconify-used";
export const DEFAULT_USED_FILE = "iconify-offline.used.json";

const PREFIX_RE = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const NAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_BODY_CHARS = 20_000;
const MAX_ICONS = 5_000;

export interface UsedIconRecord {
  body: string;
  width?: number;
  height?: number;
  left?: number;
  top?: number;
}

export type UsedIconFile = Record<
  string,
  {
    prefix: string;
    icons: Record<string, UsedIconRecord>;
  }
>;

export interface UsedIconPayload {
  prefix: string;
  name: string;
  body: string;
  width?: number;
  height?: number;
  left?: number;
  top?: number;
}

export const isValidIconifyName = (prefix: string, name: string): boolean =>
  PREFIX_RE.test(prefix) && NAME_RE.test(name);

const asFiniteNumber = (value: unknown): number | undefined => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }
  return value;
};

export const parseUsedIconPayload = (raw: unknown): UsedIconPayload | undefined => {
  if (raw === null || typeof raw !== "object") {
    return undefined;
  }
  const record = raw as Record<string, unknown>;
  const prefix = typeof record.prefix === "string" ? record.prefix : "";
  const name = typeof record.name === "string" ? record.name : "";
  const body = typeof record.body === "string" ? record.body : "";
  if (!isValidIconifyName(prefix, name) || body.length === 0 || body.length > MAX_BODY_CHARS) {
    return undefined;
  }
  const payload: UsedIconPayload = { prefix, name, body };
  const width = asFiniteNumber(record.width);
  const height = asFiniteNumber(record.height);
  const left = asFiniteNumber(record.left);
  const top = asFiniteNumber(record.top);
  if (width !== undefined) {
    payload.width = width;
  }
  if (height !== undefined) {
    payload.height = height;
  }
  if (left !== undefined) {
    payload.left = left;
  }
  if (top !== undefined) {
    payload.top = top;
  }
  return payload;
};

export const readUsedIconFile = (filePath: string): UsedIconFile => {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8")) as unknown;
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    const result: UsedIconFile = {};
    for (const [prefix, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (!PREFIX_RE.test(prefix) || value === null || typeof value !== "object") {
        continue;
      }
      const entry = value as { prefix?: unknown; icons?: unknown };
      const iconsIn = entry.icons;
      if (iconsIn === null || typeof iconsIn !== "object" || Array.isArray(iconsIn)) {
        continue;
      }
      const icons: Record<string, UsedIconRecord> = {};
      for (const [iconName, iconValue] of Object.entries(iconsIn as Record<string, unknown>)) {
        if (!NAME_RE.test(iconName) || iconValue === null || typeof iconValue !== "object") {
          continue;
        }
        const icon = iconValue as Record<string, unknown>;
        if (typeof icon.body !== "string" || icon.body.length === 0) {
          continue;
        }
        const next: UsedIconRecord = { body: icon.body };
        const width = asFiniteNumber(icon.width);
        const height = asFiniteNumber(icon.height);
        const left = asFiniteNumber(icon.left);
        const top = asFiniteNumber(icon.top);
        if (width !== undefined) {
          next.width = width;
        }
        if (height !== undefined) {
          next.height = height;
        }
        if (left !== undefined) {
          next.left = left;
        }
        if (top !== undefined) {
          next.top = top;
        }
        icons[iconName] = next;
      }
      result[prefix] = { prefix, icons };
    }
    return result;
  } catch {
    return {};
  }
};

export const upsertUsedIcon = (file: UsedIconFile, payload: UsedIconPayload): UsedIconFile => {
  const current = file[payload.prefix]?.icons ?? {};
  const existing = current[payload.name];
  const nextIcon: UsedIconRecord = { body: payload.body };
  if (payload.width !== undefined) {
    nextIcon.width = payload.width;
  }
  if (payload.height !== undefined) {
    nextIcon.height = payload.height;
  }
  if (payload.left !== undefined) {
    nextIcon.left = payload.left;
  }
  if (payload.top !== undefined) {
    nextIcon.top = payload.top;
  }
  if (
    existing &&
    existing.body === nextIcon.body &&
    existing.width === nextIcon.width &&
    existing.height === nextIcon.height &&
    existing.left === nextIcon.left &&
    existing.top === nextIcon.top
  ) {
    return file;
  }
  const iconCount = Object.values(file).reduce((sum, group) => sum + Object.keys(group.icons).length, 0);
  if (!existing && iconCount >= MAX_ICONS) {
    return file;
  }
  return {
    ...file,
    [payload.prefix]: {
      prefix: payload.prefix,
      icons: {
        ...current,
        [payload.name]: nextIcon,
      },
    },
  };
};

export const usedFileToCollections = (file: UsedIconFile): IconifyJSON[] => {
  const collections: IconifyJSON[] = [];
  for (const group of Object.values(file)) {
    if (Object.keys(group.icons).length === 0) {
      continue;
    }
    collections.push({
      prefix: group.prefix,
      icons: group.icons,
    });
  }
  return collections;
};

export const usedIconNames = (file: UsedIconFile): Set<string> => {
  const names = new Set<string>();
  for (const group of Object.values(file)) {
    for (const name of Object.keys(group.icons)) {
      names.add(`${group.prefix}:${name}`);
    }
  }
  return names;
};

export const writeUsedIconFile = (filePath: string, file: UsedIconFile): void => {
  fs.writeFileSync(filePath, `${JSON.stringify(file, null, 2)}\n`);
};

const readRequestBody = (req: IncomingMessage): Promise<string> =>
  new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on("data", (chunk: Buffer | string) => {
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      size += buf.length;
      if (size > MAX_BODY_CHARS * 2) {
        reject(new Error("payload too large"));
        return;
      }
      chunks.push(buf);
    });
    req.on("end", () => {
      resolve(Buffer.concat(chunks).toString("utf8"));
    });
    req.on("error", reject);
  });

const sendJson = (res: ServerResponse, status: number, body?: Record<string, unknown>): void => {
  res.statusCode = status;
  if (status === 204 || body === undefined) {
    res.end();
    return;
  }
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
};

export const createUsedIconWriter = (filePath: string, debounceMs = 400) => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let queued: UsedIconFile | undefined;

  const flush = (): void => {
    if (timer) {
      clearTimeout(timer);
      timer = undefined;
    }
    if (!queued) {
      return;
    }
    const next = queued;
    queued = undefined;
    writeUsedIconFile(filePath, next);
  };

  return {
    upsert: (payload: UsedIconPayload): boolean => {
      const current = queued ?? readUsedIconFile(filePath);
      const next = upsertUsedIcon(current, payload);
      if (next === current) {
        return false;
      }
      queued = next;
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(flush, debounceMs);
      return true;
    },
    flush,
  };
};

export const handleUsedIconRequest = async (
  req: IncomingMessage,
  res: ServerResponse,
  writer: ReturnType<typeof createUsedIconWriter>,
): Promise<void> => {
  let rawText: string;
  try {
    rawText = await readRequestBody(req);
  } catch {
    sendJson(res, 413, { ok: false });
    return;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText) as unknown;
  } catch {
    sendJson(res, 400, { ok: false });
    return;
  }
  const payload = parseUsedIconPayload(parsed);
  if (!payload) {
    sendJson(res, 400, { ok: false });
    return;
  }
  writer.upsert(payload);
  sendJson(res, 204);
};
