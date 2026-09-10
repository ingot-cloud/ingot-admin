/**
 * dotenv 序列化与解析。布尔写成 true/false，数字按十进制字符串存储。
 * 双引号转义保证回读后值不变，并避免 $VAR 被展开。
 */

const UNQUOTED_SAFE = /^[A-Za-z0-9_./:@%+=,-]+$/;

const unescapeDouble = (value) =>
  value.replace(/\\([nrt"'\\$])/g, (_, ch) => {
    if (ch === "n") {
      return "\n";
    }
    if (ch === "r") {
      return "\r";
    }
    if (ch === "t") {
      return "\t";
    }
    return ch;
  });

export const serializeEnvValue = (value) => {
  const text = String(value ?? "");
  if (text === "") {
    return '""';
  }
  if (UNQUOTED_SAFE.test(text) && !text.includes("#")) {
    return text;
  }
  return `"${text
    .replaceAll("\\", "\\\\")
    .replaceAll("\n", "\\n")
    .replaceAll("\r", "\\r")
    .replaceAll("\t", "\\t")
    .replaceAll('"', '\\"')
    .replaceAll("$", "\\$")}"`;
};

export const serializeEnvFile = (record) => {
  const lines = [];
  for (const [key, value] of Object.entries(record)) {
    if (value === undefined) {
      continue;
    }
    lines.push(`${key}=${serializeEnvValue(value)}`);
  }
  return `${lines.join("\n")}\n`;
};

export const parseEnvFile = (source) => {
  const result = {};
  const text = String(source ?? "").replace(/^\uFEFF/, "");
  let index = 0;
  while (index < text.length) {
    const nextBreak = text.indexOf("\n", index);
    let line = nextBreak === -1 ? text.slice(index) : text.slice(index, nextBreak);
    index = nextBreak === -1 ? text.length : nextBreak + 1;
    if (line.endsWith("\r")) {
      line = line.slice(0, -1);
    }
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const body = trimmed.startsWith("export ") ? trimmed.slice(7).trim() : trimmed;
    const eq = body.indexOf("=");
    if (eq <= 0) {
      continue;
    }
    const key = body.slice(0, eq).trim();
    let raw = body.slice(eq + 1);
    if (raw.startsWith("'")) {
      const end = raw.indexOf("'", 1);
      result[key] = end === -1 ? raw.slice(1) : raw.slice(1, end);
      continue;
    }
    if (raw.startsWith('"')) {
      let end = 1;
      let escaped = false;
      while (end < raw.length) {
        const ch = raw[end];
        if (escaped) {
          escaped = false;
        } else if (ch === "\\") {
          escaped = true;
        } else if (ch === '"') {
          break;
        }
        end += 1;
      }
      result[key] = unescapeDouble(raw.slice(1, end));
      continue;
    }
    const hash = raw.indexOf(" #");
    if (hash >= 0) {
      raw = raw.slice(0, hash);
    }
    result[key] = raw.trim();
  }
  return result;
};

/**
 * mode 覆盖公共值；省略键表示继承，空字符串表示显式清空。
 * @param {Record<string, string>} common
 * @param {Record<string, string>} overlay
 */
export const mergeEnvLayer = (common, overlay) => {
  const merged = { ...common };
  for (const [key, value] of Object.entries(overlay ?? {})) {
    if (value === undefined) {
      continue;
    }
    merged[key] = value;
  }
  return merged;
};

export const envFileName = (mode) => (mode ? `.env.${mode}` : ".env");
