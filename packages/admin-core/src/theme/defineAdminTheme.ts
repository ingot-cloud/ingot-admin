import { INGOT_ADMIN_THEME_API_VERSION, type InAdminTheme } from "./types";

const THEME_ID_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

export const assertAdminThemeShape = (theme: InAdminTheme): void => {
  if (!THEME_ID_PATTERN.test(theme.id)) {
    throw new Error(`主题 “${theme.id}” 的标识必须使用小写 kebab-case`);
  }
  if (theme.apiVersion !== INGOT_ADMIN_THEME_API_VERSION) {
    throw new Error(`主题 “${theme.id}” 的协议版本不兼容`);
  }
  if (!theme.name.trim()) {
    throw new Error(`主题 “${theme.id}” 缺少名称`);
  }
};

export const defineAdminTheme = <T extends InAdminTheme>(theme: T): T => {
  assertAdminThemeShape(theme);
  return Object.freeze(theme);
};
