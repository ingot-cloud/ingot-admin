const SENSITIVE_KEY = /password|token|secret|phone|mobile|captcha|authorization/i;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const cloneValue = (value: unknown): unknown => {
  if (value === undefined || value === null) {
    return value;
  }
  if (typeof value === "object") {
    return JSON.parse(JSON.stringify(value)) as unknown;
  }
  return value;
};

const hashString = (value: string): string => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
};

const fingerprintSensitive = (parts: Array<[string, unknown]>): string => {
  const stable = [...parts]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}:${JSON.stringify(value)}`)
    .join("|");
  return hashString(stable);
};

/**
 * 生成不可变、可序列化的 Query Key 参数快照。
 * 不修改入参，剥离空值与敏感字段明文，避免把 reactive proxy 放入 Key。
 * 剥掉的敏感值写入 `_sensitive` 指纹，避免不同手机号落到同一缓存。
 */
export function snapshotQueryParams<T>(input: T, omitKeys: string[] = []): unknown {
  const omit = new Set(omitKeys.map((key) => key.toLowerCase()));
  const sensitiveParts: Array<[string, unknown]> = [];
  const walk = (value: unknown): unknown => {
    const raw = cloneValue(value);
    if (Array.isArray(raw)) {
      return raw.map((item) => walk(item));
    }
    if (!isPlainObject(raw)) {
      return raw;
    }
    const result: Record<string, unknown> = {};
    Object.entries(raw).forEach(([key, item]) => {
      if (item === undefined || item === null || item === "") {
        return;
      }
      if (omit.has(key.toLowerCase()) || SENSITIVE_KEY.test(key)) {
        sensitiveParts.push([key, cloneValue(item)]);
        return;
      }
      result[key] = walk(item);
    });
    return result;
  };
  const snapshot = walk(input);
  if (!isPlainObject(snapshot) || sensitiveParts.length === 0) {
    return snapshot;
  }
  return {
    ...snapshot,
    _sensitive: fingerprintSensitive(sensitiveParts),
  };
}
