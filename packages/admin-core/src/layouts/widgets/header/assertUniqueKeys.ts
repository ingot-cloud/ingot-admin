export const assertUniqueKeys = (keys: string[], scope: string): void => {
  const seen = new Set<string>();
  for (const key of keys) {
    if (!key) {
      throw new Error(`${scope}缺少稳定 key`);
    }
    if (seen.has(key)) {
      throw new Error(`${scope}存在重复的 key: ${key}`);
    }
    seen.add(key);
  }
};
