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

/**
 * 生成不可变、可序列化的 Query Key 参数快照。
 * 不修改入参，剥离空值与敏感字段，避免把 reactive proxy 放入 Key。
 */
export function snapshotQueryParams<T>(input: T, omitKeys: string[] = []): unknown {
  const omit = new Set(omitKeys.map((key) => key.toLowerCase()));
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
        return;
      }
      result[key] = walk(item);
    });
    return result;
  };
  return walk(input);
}
