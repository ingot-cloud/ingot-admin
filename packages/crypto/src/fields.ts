import { decryptGcm, encryptGcm } from "./aes-gcm";
import type { CryptoFields, CryptoFieldType } from "./types";

type FieldRecord = Record<string, unknown>;

/**
 * 标准化字段清单为 key -> 类型 的映射
 */
function normalizeFields(fields: CryptoFields): Map<string, CryptoFieldType> {
  const map = new Map<string, CryptoFieldType>();
  for (const item of fields) {
    if (typeof item === "string") {
      map.set(item, "string");
    } else {
      map.set(item.key, item.type ?? "string");
    }
  }
  return map;
}

/**
 * 加密前将值转换为字符串
 */
function valueToString(value: unknown, type: CryptoFieldType): string {
  if (value === null || value === undefined) {
    return "";
  }
  switch (type) {
    case "object":
    case "array":
      return JSON.stringify(value);
    case "boolean":
    case "number":
      return String(value);
    default:
      return typeof value === "string" ? value : String(value);
  }
}

/**
 * 解密后根据类型还原值
 */
function stringToValue(text: string, type: CryptoFieldType): unknown {
  if (text === "") {
    return text;
  }
  switch (type) {
    case "object":
    case "array":
      return JSON.parse(text);
    case "boolean":
      if (text === "true" || text === "1") return true;
      if (text === "false" || text === "0") return false;
      return Boolean(text);
    case "number": {
      const num = Number(text);
      return Number.isNaN(num) ? text : num;
    }
    default:
      return text;
  }
}

function isPlainObject(value: unknown): value is FieldRecord {
  return value !== null && typeof value === "object";
}

async function processDeep(
  target: unknown,
  fieldMap: Map<string, CryptoFieldType>,
  cek: Uint8Array,
  aad: Uint8Array,
  action: "encrypt" | "decrypt",
  visited: WeakSet<object>,
): Promise<void> {
  if (!isPlainObject(target)) {
    return;
  }
  if (visited.has(target)) {
    return;
  }
  visited.add(target);

  if (Array.isArray(target)) {
    for (const item of target) {
      await processDeep(item, fieldMap, cek, aad, action, visited);
    }
    return;
  }

  for (const key of Object.keys(target)) {
    const value = target[key];
    const fieldType = fieldMap.get(key);

    if (fieldType !== undefined) {
      if (value === null || value === undefined) {
        continue;
      }
      if (action === "encrypt") {
        const text = valueToString(value, fieldType);
        if (text !== "") {
          target[key] = await encryptGcm(text, cek, aad);
        }
      } else if (typeof value === "string" && value !== "") {
        const decrypted = await decryptGcm(value, cek, aad);
        target[key] = stringToValue(decrypted, fieldType);
      }
    } else if (isPlainObject(value)) {
      await processDeep(value, fieldMap, cek, aad, action, visited);
    }
  }
}

function clone<T>(data: T): T {
  return JSON.parse(JSON.stringify(data)) as T;
}

/**
 * 字段级加密：对清单内字段值用 CEK+AAD 各自加密（每字段独立 IV），返回新对象
 */
export async function encryptFields<T>(data: T, cek: Uint8Array, aad: Uint8Array, fields: CryptoFields): Promise<T> {
  const result = clone(data);
  await processDeep(result, normalizeFields(fields), cek, aad, "encrypt", new WeakSet());
  return result;
}

/**
 * 字段级解密：对清单内字段值用 CEK+AAD 解密并按类型还原，返回新对象
 */
export async function decryptFields<T>(data: T, cek: Uint8Array, aad: Uint8Array, fields: CryptoFields): Promise<T> {
  const result = clone(data);
  await processDeep(result, normalizeFields(fields), cek, aad, "decrypt", new WeakSet());
  return result;
}
