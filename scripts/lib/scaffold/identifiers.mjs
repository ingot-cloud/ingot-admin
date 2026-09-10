const JS_RESERVED = new Set([
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "debugger",
  "default",
  "delete",
  "do",
  "else",
  "enum",
  "export",
  "extends",
  "false",
  "finally",
  "for",
  "function",
  "if",
  "import",
  "in",
  "instanceof",
  "new",
  "null",
  "return",
  "super",
  "switch",
  "this",
  "throw",
  "true",
  "try",
  "typeof",
  "var",
  "void",
  "while",
  "with",
  "yield",
  "await",
  "let",
  "static",
  "implements",
  "interface",
  "package",
  "private",
  "protected",
  "public",
]);

export const RESERVED_CANONICAL_PREFIXES = new Set(["common", "layout"]);

export const toKebab = (value) =>
  String(value ?? "")
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-zA-Z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

export const toCamel = (kebab) => {
  const parts = String(kebab).split("-").filter(Boolean);
  return parts
    .map((part, index) => (index === 0 ? part : `${part[0].toUpperCase()}${part.slice(1)}`))
    .join("");
};

export const toPascal = (kebab) => {
  const camel = toCamel(kebab);
  return camel ? `${camel[0].toUpperCase()}${camel.slice(1)}` : "";
};

export const kebabToDot = (kebab) => String(kebab).replace(/-/g, ".");

export const isKebabCase = (value) => /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(String(value ?? ""));

export const isJsIdentifier = (value) => {
  const name = String(value ?? "");
  if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name)) {
    return false;
  }
  return !JS_RESERVED.has(name);
};

export const isEnvKey = (value) => /^[A-Za-z_][A-Za-z0-9_]*$/.test(String(value ?? ""));

export const isModeName = (value) => {
  const mode = String(value ?? "");
  if (mode === "local" || mode.includes("/") || mode.includes("\\") || mode.includes("..")) {
    return false;
  }
  return /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(mode);
};

export const isCanonicalPrefix = (value) => {
  const prefix = String(value ?? "");
  if (!/^[a-z][a-z0-9]*(?:\.[a-z][a-z0-9]*)*$/.test(prefix)) {
    return false;
  }
  const head = prefix.split(".")[0];
  return !RESERVED_CANONICAL_PREFIXES.has(head);
};

export const isPort = (value) => {
  const port = Number(value);
  return Number.isInteger(port) && port >= 1 && port <= 65535;
};

export const isPositiveInt = (value) => {
  const number = Number(value);
  return Number.isInteger(number) && number > 0;
};

export const quoteTs = (value) => JSON.stringify(String(value ?? ""));
