import { encryptCBC, decryptCBC } from "./aes/aes_cbc";
import { encryptGCM, decryptGCM } from "./aes/aes_gcm";

/**
 * 支持的字段类型
 */
export type AESFieldType = "string" | "number" | "boolean" | "object" | "array";

/**
 * 字段配置
 */
export interface AESFieldConfig {
  /** 字段名 */
  key: string;
  /** 解密后要转换的类型，默认 string */
  type?: AESFieldType;
}

/**
 * 字段配置映射表
 */
export type AESKeysConfig = Array<string | AESFieldConfig>;

export interface AESParams<T> {
  data: T;
  /**
   * 需要加密/解密的字段配置
   * 支持两种格式：
   * 1. 简单格式：['phone', 'email'] - 默认为 string 类型
   * 2. 配置格式：[{ key: 'phone', type: 'string' }, { key: 'isActive', type: 'boolean' }]
   * 3. 混合格式：['phone', { key: 'isActive', type: 'boolean' }]
   */
  keys: AESKeysConfig;
  encodeKey?: string;
  /**
   * 模式，默认CBC
   */
  mode?: "CBC" | "GCM"; // 默认CBC
  action?: "encrypt" | "decrypt"; // 默认encrypt
  /**
   * 是否递归处理嵌套对象，默认true
   */
  deep?: boolean;
}

/**
 * 标准化 keys 配置为统一的 Map 结构
 */
const normalizeKeysConfig = (keys: AESKeysConfig): Map<string, AESFieldType> => {
  const keyMap = new Map<string, AESFieldType>();

  for (const item of keys) {
    if (typeof item === "string") {
      // 简单格式：'phone' -> { key: 'phone', type: 'string' }
      keyMap.set(item, "string");
    } else {
      // 配置格式：{ key: 'phone', type: 'string' }
      keyMap.set(item.key, item.type || "string");
    }
  }

  return keyMap;
};

/**
 * 加密前转换值为字符串
 */
const valueToString = (value: any, type: AESFieldType): string => {
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
    case "string":
    default:
      return value;
  }
};

/**
 * 解密后根据类型转换值
 */
const stringToValue = (str: string, type: AESFieldType): any => {
  if (str === "" || str === null || str === undefined) {
    return str;
  }

  try {
    switch (type) {
      case "object":
      case "array":
        return JSON.parse(str);
      case "boolean":
        // 处理 'true'/'false' 字符串和 '1'/'0' 数字字符串
        if (str === "true" || str === "1") return true;
        if (str === "false" || str === "0") return false;
        return Boolean(str);
      case "number":
        const num = Number(str);
        return isNaN(num) ? str : num;
      case "string":
      default:
        return str;
    }
  } catch (error) {
    console.error(`Type conversion error for type "${type}":`, error);
    return str; // 转换失败时返回原字符串
  }
};

/**
 * 递归处理对象中的加密字段
 * @param obj 要处理的对象
 * @param keyMap 字段名与类型的映射表
 * @param encodeKey 加密密钥
 * @param mode 加密模式
 * @param action 操作类型
 * @param visited 已访问对象集合，用于处理循环引用
 */
const processObjectDeep = async (
  obj: any,
  keyMap: Map<string, AESFieldType>,
  encodeKey: string,
  mode: "CBC" | "GCM",
  action: "encrypt" | "decrypt",
  visited = new WeakSet(),
): Promise<void> => {
  // 处理 null、undefined 或基本类型
  if (obj === null || obj === undefined || typeof obj !== "object") {
    return;
  }

  // 防止循环引用
  if (visited.has(obj)) {
    return;
  }
  visited.add(obj);

  // 处理数组
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      await processObjectDeep(obj[i], keyMap, encodeKey, mode, action, visited);
    }
    return;
  }

  // 处理普通对象
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    const fieldType = keyMap.get(key);

    // 如果当前字段名在配置中
    if (fieldType !== undefined) {
      // 跳过 null 和 undefined
      if (value === null || value === undefined) {
        continue;
      }

      try {
        if (action === "encrypt") {
          // 加密：先转换为字符串，再加密
          const strValue = valueToString(value, fieldType);
          if (strValue !== "") {
            obj[key] =
              mode === "GCM"
                ? await encryptGCM(strValue, encodeKey)
                : encryptCBC(strValue, encodeKey);
          }
        } else {
          // 解密：先解密，再转换为指定类型
          if (typeof value === "string" && value !== "") {
            const decrypted =
              mode === "GCM" ? await decryptGCM(value, encodeKey) : decryptCBC(value, encodeKey);
            obj[key] = stringToValue(decrypted, fieldType);
          }
        }
      } catch (error) {
        console.error(`AES ${action} error for key "${key}" with type "${fieldType}":`, error);
        // 加密/解密失败时保持原值
      }
    }
    // 递归处理嵌套对象或数组
    else if (value !== null && typeof value === "object") {
      await processObjectDeep(value, keyMap, encodeKey, mode, action, visited);
    }
  }
};

/**
 * AES 加密处理
 */
export const AES = async <T>(params: AESParams<T>) => {
  params.action = params.action || "encrypt";
  params.mode = params.mode || "CBC";
  params.deep = params.deep !== undefined ? params.deep : true;

  if (!params.encodeKey) {
    throw new Error("encodeKey is required");
  }

  const { data, keys, mode, action, deep } = params;
  const encodeKey = params.encodeKey;
  const result = JSON.parse(JSON.stringify(data));

  // 标准化 keys 配置
  const keyMap = normalizeKeysConfig(keys);

  if (deep) {
    // 深度递归处理
    await processObjectDeep(result, keyMap, encodeKey, mode, action);
  } else {
    // 仅处理顶层字段（保持原有逻辑）
    for (const [key, fieldType] of keyMap.entries()) {
      try {
        const value = result[key];
        if (value === null || value === undefined) {
          continue;
        }

        if (action === "encrypt") {
          // 加密：先转换为字符串，再加密
          const strValue = valueToString(value, fieldType);
          if (strValue !== "") {
            result[key] =
              mode === "GCM"
                ? await encryptGCM(strValue, encodeKey)
                : encryptCBC(strValue, encodeKey);
          }
        } else {
          // 解密：先解密，再转换为指定类型
          if (typeof value === "string" && value !== "") {
            const decrypted =
              mode === "GCM" ? await decryptGCM(value, encodeKey) : decryptCBC(value, encodeKey);
            result[key] = stringToValue(decrypted, fieldType);
          }
        }
      } catch (error) {
        console.error(`AES ${action} error for key "${key}":`, error);
      }
    }
  }

  return result as T;
};
