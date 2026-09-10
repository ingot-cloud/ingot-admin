import {
  BUILTIN_ENV_FIELDS,
  COMPONENT_SIZES,
  CONFIG_VERSION,
  HEADER_BUILTIN_USER_MENU,
  HEADER_BUILTIN_UTILITIES,
  IN_THEME_TOKEN_NAMES,
  REQUIRED_ENV_KEYS,
  THEME_PARTS,
} from "./constants.mjs";
import { fail } from "./errors.mjs";
import {
  isCanonicalPrefix,
  isEnvKey,
  isJsIdentifier,
  isKebabCase,
  isModeName,
  isPort,
  isPositiveInt,
} from "./identifiers.mjs";

const tokenSet = new Set(IN_THEME_TOKEN_NAMES);
const utilitySet = new Set(HEADER_BUILTIN_UTILITIES);
const userMenuSet = new Set(HEADER_BUILTIN_USER_MENU);
const consumedEnvKeys = new Set(BUILTIN_ENV_FIELDS.filter((field) => field.consumed).map((f) => f.key));

const fieldError = (fields, path, message) => {
  fields[path] = message;
};

const assertNoRootDir = (raw) => {
  if (raw && typeof raw === "object" && "rootDir" in raw) {
    fail("VALIDATION_ERROR", "不允许指定 rootDir", { fields: { rootDir: "不允许指定仓库根路径" } });
  }
  if (raw?.options && typeof raw.options === "object" && "rootDir" in raw.options) {
    fail("VALIDATION_ERROR", "不允许指定 rootDir", {
      fields: { "options.rootDir": "不允许指定仓库根路径" },
    });
  }
};

const validateEnvMaps = (env, fields) => {
  if (!env || typeof env !== "object") {
    fieldError(fields, "options.env", "环境变量结构无效");
    return;
  }
  const common = env.common ?? {};
  const seen = new Set();
  for (const [key, value] of Object.entries(common)) {
    if (!isEnvKey(key)) {
      fieldError(fields, `options.env.common.${key}`, "环境变量名必须匹配 [A-Za-z_][A-Za-z0-9_]*");
    }
    if (seen.has(key)) {
      fieldError(fields, `options.env.common.${key}`, "环境变量键重复");
    }
    seen.add(key);
    if (typeof value !== "string") {
      fieldError(fields, `options.env.common.${key}`, "环境变量值必须是字符串");
    }
  }
  for (const key of REQUIRED_ENV_KEYS) {
    if (!(key in common) || common[key].trim() === "") {
      fieldError(fields, `options.env.common.${key}`, "该环境变量不能为空");
    }
  }
  if (common.VITE_APP_SETTINGS_COMPONENT_SIZE && !COMPONENT_SIZES.includes(common.VITE_APP_SETTINGS_COMPONENT_SIZE)) {
    fieldError(fields, "options.env.common.VITE_APP_SETTINGS_COMPONENT_SIZE", "组件尺寸必须是 default / small / large");
  }
  if (common.VITE_APP_NET_DEFAULT_TIMEOUT && !isPositiveInt(common.VITE_APP_NET_DEFAULT_TIMEOUT)) {
    fieldError(fields, "options.env.common.VITE_APP_NET_DEFAULT_TIMEOUT", "超时必须是正整数毫秒");
  }
  if (
    common.VITE_APP_COOKIE_DEFAULT_EXPIRE_TIME &&
    !isPositiveInt(common.VITE_APP_COOKIE_DEFAULT_EXPIRE_TIME)
  ) {
    fieldError(fields, "options.env.common.VITE_APP_COOKIE_DEFAULT_EXPIRE_TIME", "Cookie 过期时间必须是正整数秒");
  }

  const modes = env.modes ?? {};
  for (const [mode, values] of Object.entries(modes)) {
    if (!isModeName(mode)) {
      fieldError(fields, `options.env.modes.${mode}`, "mode 须为小写 kebab-case，且不能是 local");
      continue;
    }
    const overlay = values ?? {};
    const modeSeen = new Set();
    for (const [key, value] of Object.entries(overlay)) {
      if (!isEnvKey(key)) {
        fieldError(fields, `options.env.modes.${mode}.${key}`, "环境变量名不合法");
      }
      if (modeSeen.has(key)) {
        fieldError(fields, `options.env.modes.${mode}.${key}`, "环境变量键重复");
      }
      modeSeen.add(key);
      if (typeof value !== "string") {
        fieldError(fields, `options.env.modes.${mode}.${key}`, "环境变量值必须是字符串");
      }
      if (key === "VITE_APP_CODE" && value && value !== common.VITE_APP_CODE) {
        fieldError(fields, `options.env.modes.${mode}.${key}`, "各 mode 的应用编码必须与公共 CODE 一致");
      }
      if (REQUIRED_ENV_KEYS.includes(key) && value.trim() === "") {
        fieldError(fields, `options.env.modes.${mode}.${key}`, "该环境变量不能清空");
      }
    }
  }
};

const validateApp = (options, fields) => {
  if (!isKebabCase(options.appCode)) {
    fieldError(fields, "options.appCode", "App 编码须为 kebab-case，例如 acme-admin");
  }
  if (!isPort(options.dev?.port)) {
    fieldError(fields, "options.dev.port", "端口必须是 1–65535 的整数");
  }
  if (!options.dev?.host || typeof options.dev.host !== "string") {
    fieldError(fields, "options.dev.host", "Host 不能为空");
  }
  if (!options.build?.base || !String(options.build.base).startsWith("/")) {
    fieldError(fields, "options.build.base", "构建 base 必须以 / 开头");
  }
  validateEnvMaps(options.env, fields);
  if (options.env?.common?.VITE_APP_CODE && options.env.common.VITE_APP_CODE !== options.appCode) {
    fieldError(fields, "options.env.common.VITE_APP_CODE", "应用编码必须与目录编码一致");
  }
  if (!Array.isArray(options.plugins)) {
    fieldError(fields, "options.plugins", "插件清单无效");
  } else {
    const seen = new Set();
    options.plugins.forEach((plugin, index) => {
      if (!plugin.packageName) {
        fieldError(fields, `options.plugins.${index}.packageName`, "缺少包名");
      }
      if (!plugin.exportName || !isJsIdentifier(plugin.exportName)) {
        fieldError(fields, `options.plugins.${index}.exportName`, "导出名必须是合法 JS 标识符");
      }
      if (seen.has(plugin.packageName)) {
        fieldError(fields, `options.plugins.${index}.packageName`, "插件重复");
      }
      seen.add(plugin.packageName);
    });
  }
  if (options.theme?.kind === "workspace") {
    if (!options.theme.packageName) {
      fieldError(fields, "options.theme.packageName", "请选择仓库主题");
    }
    if (!options.theme.exportName || !isJsIdentifier(options.theme.exportName)) {
      fieldError(fields, "options.theme.exportName", "主题导出名必须是合法 JS 标识符");
    }
  } else if (options.theme?.kind !== "default") {
    fieldError(fields, "options.theme.kind", "主题类型必须是 default 或 workspace");
  }
  if (!Array.isArray(options.proxy)) {
    fieldError(fields, "options.proxy", "代理规则无效");
  } else {
    options.proxy.forEach((rule, index) => {
      if (!rule.prefix || !String(rule.prefix).startsWith("/")) {
        fieldError(fields, `options.proxy.${index}.prefix`, "代理前缀必须以 / 开头");
      }
      if (!rule.target) {
        fieldError(fields, `options.proxy.${index}.target`, "代理目标不能为空");
      }
    });
  }
  const usedFile = options.iconify?.usedFile ?? "";
  if (!usedFile || usedFile.includes("..") || usedFile.startsWith("/") || usedFile.includes("\\")) {
    fieldError(fields, "options.iconify.usedFile", "图标 used 文件必须位于生成 App 内");
  }
  for (const name of options.header?.builtinUtilities ?? []) {
    if (!utilitySet.has(name)) {
      fieldError(fields, "options.header.builtinUtilities", `未知内置顶栏小部件：${name}`);
    }
  }
  for (const name of options.header?.builtinUserMenu ?? []) {
    if (!userMenuSet.has(name)) {
      fieldError(fields, "options.header.builtinUserMenu", `未知内置用户菜单：${name}`);
    }
  }
};

const validatePlugin = (options, fields) => {
  if (!isKebabCase(options.directoryId)) {
    fieldError(fields, "options.directoryId", "插件目录须为 kebab-case");
  }
  if (!options.pluginId || !isKebabCase(options.pluginId)) {
    fieldError(fields, "options.pluginId", "插件 ID 须为合法 kebab-case");
  }
  if (options.pluginId === "ingot-admin-core") {
    fieldError(fields, "options.pluginId", "不能与核心插件 ID 冲突");
  }
  if (!isJsIdentifier(options.exportName)) {
    fieldError(fields, "options.exportName", "导出名必须是合法非保留 JS 标识符");
  }
  if (!isCanonicalPrefix(options.canonicalPrefix)) {
    fieldError(fields, "options.canonicalPrefix", "canonical prefix 须为点分小写，且不能是 common / layout");
  }
  if (typeof options.description !== "string") {
    fieldError(fields, "options.description", "说明必须是字符串");
  }
};

const validateTheme = (options, fields) => {
  if (!isKebabCase(options.id)) {
    fieldError(fields, "options.id", "主题 ID 须为 kebab-case");
  }
  if (options.id === "default") {
    fieldError(fields, "options.id", "不能与默认主题 ID 冲突");
  }
  if (!options.name?.trim()) {
    fieldError(fields, "options.name", "主题名称不能为空");
  }
  if (!isJsIdentifier(options.exportName)) {
    fieldError(fields, "options.exportName", "导出名必须是合法非保留 JS 标识符");
  }
  for (const mode of ["light", "dark"]) {
    const tokens = options.tokens?.[mode] ?? {};
    for (const [key, value] of Object.entries(tokens)) {
      if (!tokenSet.has(key)) {
        fieldError(fields, `options.tokens.${mode}.${key}`, `未知 Token：${key}`);
      }
      if (typeof value !== "string") {
        fieldError(fields, `options.tokens.${mode}.${key}`, "Token 值必须是字符串");
      }
    }
  }
  for (const part of options.parts ?? []) {
    if (!THEME_PARTS.includes(part)) {
      fieldError(fields, "options.parts", `未知部件：${part}`);
    }
  }
};

export const validateRequest = (request, raw) => {
  assertNoRootDir(raw);
  if (Number(request.version) !== CONFIG_VERSION) {
    fail("UNSUPPORTED_VERSION", "配置版本不受支持", { status: 400 });
  }
  if (!["app", "plugin", "theme"].includes(request.kind)) {
    fail("VALIDATION_ERROR", "未知生成类型", { fields: { kind: "kind 必须是 app、plugin 或 theme" } });
  }
  const fields = {};
  if (request.kind === "app") {
    validateApp(request.options, fields);
  } else if (request.kind === "plugin") {
    validatePlugin(request.options, fields);
  } else {
    validateTheme(request.options, fields);
  }
  if (Object.keys(fields).length > 0) {
    fail("VALIDATION_ERROR", "表单校验失败", { fields });
  }
};

export const consumedEnvKeySet = consumedEnvKeys;
