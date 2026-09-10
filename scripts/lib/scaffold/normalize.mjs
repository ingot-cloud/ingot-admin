import {
  BUILTIN_ENV_FIELDS,
  COMPONENT_SIZES,
  DEFAULT_THEME,
  HEADER_BUILTIN_USER_MENU,
  HEADER_BUILTIN_UTILITIES,
  OFFICIAL_PLUGINS,
} from "./constants.mjs";
import { fail } from "./errors.mjs";
import { kebabToDot, toCamel, toKebab } from "./identifiers.mjs";
import { defaultAppOptions, defaultPluginOptions, defaultThemeOptions } from "./schema.mjs";

const isPlainObject = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);

const mergeDeep = (base, overlay) => {
  if (!isPlainObject(overlay)) {
    return structuredClone(base);
  }
  const result = structuredClone(base);
  for (const [key, value] of Object.entries(overlay)) {
    if (value === undefined) {
      continue;
    }
    if (isPlainObject(result[key]) && isPlainObject(value) && !Array.isArray(value)) {
      result[key] = mergeDeep(result[key], value);
    } else {
      result[key] = structuredClone(value);
    }
  }
  return result;
};

const stringifyEnvValue = (value) => {
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return String(value ?? "");
};

const normalizeEnvMap = (record) => {
  const result = {};
  if (!isPlainObject(record)) {
    return result;
  }
  for (const [key, value] of Object.entries(record)) {
    if (value === undefined) {
      continue;
    }
    result[key] = stringifyEnvValue(value);
  }
  return result;
};

export const deriveAppDefaults = (appCode, port) => {
  const code = toKebab(appCode);
  const safePort = Number(port) || 5800;
  return {
    title: code,
    storePrefix: `__${code.replace(/-/g, "_")}__`,
    callbackUri: `http://localhost:${safePort}`,
    copyright: `© 2018-{0} ${code}`,
  };
};

const assertSafeSegment = (value, field) => {
  const text = String(value ?? "");
  if (text.includes("/") || text.includes("\\") || text.includes("..")) {
    fail("VALIDATION_ERROR", "标识不能包含路径片段", { fields: { [field]: "拒绝路径逃逸" } });
  }
};

export const normalizeAppOptions = (input = {}) => {
  assertSafeSegment(input.appCode ?? "", "options.appCode");
  const appCode = toKebab(input.appCode ?? "");
  const port = Number(input.dev?.port ?? input.port ?? 5800) || 5800;
  const defaults = defaultAppOptions(appCode || "acme-admin", port);
  const merged = mergeDeep(defaults, {
    ...input,
    appCode: appCode || defaults.appCode,
    dev: {
      ...defaults.dev,
      ...(isPlainObject(input.dev) ? input.dev : {}),
      port,
      host: input.dev?.host ?? input.host ?? defaults.dev.host,
      enableDevTools: input.dev?.enableDevTools ?? true,
    },
  });

  merged.env = {
    common: normalizeEnvMap({ ...defaults.env.common, ...(input.env?.common ?? {}) }),
    modes: {},
  };
  const modes = isPlainObject(input.env?.modes) ? input.env.modes : defaults.env.modes;
  for (const [mode, values] of Object.entries(modes)) {
    merged.env.modes[mode] = normalizeEnvMap(values);
  }
  if (!merged.env.modes.development) {
    merged.env.modes.development = {};
  }
  if (!merged.env.modes.production) {
    merged.env.modes.production = {};
  }

  merged.env.common.VITE_APP_CODE = merged.appCode;
  if (!String(merged.env.common.VITE_APP_TITLE ?? "").trim()) {
    merged.env.common.VITE_APP_TITLE = merged.appCode;
  }
  merged.plugins = Array.isArray(input.plugins)
    ? input.plugins.map((plugin) => ({
        packageName: String(plugin.packageName ?? ""),
        exportName: String(plugin.exportName ?? ""),
      }))
    : defaults.plugins;
  if (Array.isArray(input.officialPluginIds) && !Array.isArray(input.plugins)) {
    merged.plugins = OFFICIAL_PLUGINS.filter((plugin) =>
      input.officialPluginIds.includes(plugin.id),
    ).map((plugin) => ({
      packageName: plugin.packageName,
      exportName: plugin.exportName,
    }));
  }
  merged.theme = input.theme?.kind === "workspace" ? { ...input.theme } : { kind: "default" };
  merged.withDemo = input.withDemo !== false && input.withLocalPlugin !== false;
  merged.header = {
    visibility: {
      brand: input.header?.visibility?.brand !== false,
      navigation: input.header?.visibility?.navigation !== false,
      search: input.header?.visibility?.search !== false,
      user: input.header?.visibility?.user !== false,
    },
    builtinUtilities: Array.isArray(input.header?.builtinUtilities)
      ? input.header.builtinUtilities.map(String)
      : [...HEADER_BUILTIN_UTILITIES],
    builtinUserMenu: Array.isArray(input.header?.builtinUserMenu)
      ? input.header.builtinUserMenu.map(String)
      : [...HEADER_BUILTIN_USER_MENU],
  };
  merged.proxy = Array.isArray(input.proxy) ? input.proxy : defaults.proxy;
  merged.iconify = {
    collections: Array.isArray(input.iconify?.collections)
      ? input.iconify.collections.map(String)
      : defaults.iconify.collections,
    extra: Array.isArray(input.iconify?.extra) ? input.iconify.extra.map(String) : [],
    scan: input.iconify?.scan !== false,
    usedFile: String(input.iconify?.usedFile ?? defaults.iconify.usedFile),
  };
  merged.extensions = {
    netInterceptors: Boolean(input.extensions?.netInterceptors),
    shellSlots: Boolean(input.extensions?.shellSlots),
    vite: Boolean(input.extensions?.vite),
  };
  merged.build = { base: String(input.build?.base ?? "/") || "/" };
  merged.branding = { logo: String(input.branding?.logo ?? "") };
  return merged;
};

export const normalizePluginOptions = (input = {}) => {
  assertSafeSegment(input.directoryId ?? "", "options.directoryId");
  const directoryId = toKebab(input.directoryId ?? "");
  const defaults = defaultPluginOptions(directoryId || "sales");
  return {
    directoryId: directoryId || defaults.directoryId,
    pluginId: String(input.pluginId ?? defaults.pluginId).trim() || defaults.pluginId,
    exportName: String(input.exportName ?? defaults.exportName).trim() || defaults.exportName,
    canonicalPrefix:
      String(input.canonicalPrefix ?? kebabToDot(directoryId || defaults.directoryId)).trim() ||
      defaults.canonicalPrefix,
    description: String(input.description ?? ""),
    withDemo: input.withDemo !== false,
    extensions: {
      layouts: Boolean(input.extensions?.layouts),
      components: Boolean(input.extensions?.components),
      directives: Boolean(input.extensions?.directives),
      stores: Boolean(input.extensions?.stores),
      install: Boolean(input.extensions?.install),
    },
  };
};

export const normalizeThemeOptions = (input = {}) => {
  assertSafeSegment(input.id ?? "", "options.id");
  const id = toKebab(input.id ?? "");
  const defaults = defaultThemeOptions(id || "horizon");
  const tokens = {
    light: isPlainObject(input.tokens?.light) ? { ...input.tokens.light } : {},
    dark: isPlainObject(input.tokens?.dark) ? { ...input.tokens.dark } : {},
  };
  return {
    id: id || defaults.id,
    name: String(input.name ?? defaults.name).trim() || defaults.name,
    exportName: String(input.exportName ?? defaults.exportName).trim() || defaults.exportName,
    tokens,
    shell: Boolean(input.shell),
    parts: Array.isArray(input.parts) ? [...new Set(input.parts.map(String))] : [],
  };
};

export const normalizeRequest = (raw) => {
  if (!raw || typeof raw !== "object") {
    return { version: 1, kind: "app", options: normalizeAppOptions({}) };
  }
  const version = Number(raw.version ?? 1);
  const kind = raw.kind ?? "app";
  if (kind === "plugin") {
    return { version, kind, options: normalizePluginOptions(raw.options ?? raw) };
  }
  if (kind === "theme") {
    return { version, kind, options: normalizeThemeOptions(raw.options ?? raw) };
  }
  return { version, kind: "app", options: normalizeAppOptions(raw.options ?? raw) };
};

export const derivedPluginNames = (options) => ({
  packageName: `@ingot/${options.directoryId}-plugin`,
  exportName: options.exportName || `${toCamel(options.directoryId)}Plugin`,
});

export const derivedThemeNames = (options) => ({
  packageName: `@ingot/theme-${options.id}`,
  exportName: options.exportName || `${toCamel(options.id)}Theme`,
});

export const envFieldKeys = () => BUILTIN_ENV_FIELDS.map((field) => field.key);

export const isBuiltinSize = (value) => COMPONENT_SIZES.includes(value);

export const defaultThemeSelection = () => ({ kind: DEFAULT_THEME.kind });
