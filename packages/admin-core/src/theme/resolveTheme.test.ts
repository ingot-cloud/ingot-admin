import { describe, expect, it } from "vitest";
import { defineAdminTheme } from "./defineAdminTheme";
import { defaultAdminTheme } from "./defaultTheme";
import { resolveAdminTheme } from "./resolveTheme";
import { INGOT_ADMIN_THEME_API_VERSION } from "./types";

describe("resolveAdminTheme", () => {
  it("未配置时回退到默认主题完整浅深色 Token", () => {
    const resolved = resolveAdminTheme();
    expect(resolved.id).toBe(defaultAdminTheme.id);
    expect(resolved.name).toBe("默认主题");
    expect(resolved.tokens.light["--in-color-primary"]).toBe("var(--in-blue-500)");
    expect(resolved.tokens.dark["--in-color-primary"]).toBe("#3d7eff");
    expect(resolved.tokens.light["--in-app-bar-height"]).toBe("56px");
  });

  it("浅色覆盖不会复制到深色", () => {
    const theme = defineAdminTheme({
      id: "acme-brand",
      apiVersion: INGOT_ADMIN_THEME_API_VERSION,
      name: "品牌主题",
      tokens: {
        light: {
          "--in-color-primary": "#0f766e",
        },
      },
    });
    const resolved = resolveAdminTheme(theme);
    expect(resolved.tokens.light["--in-color-primary"]).toBe("#0f766e");
    expect(resolved.tokens.dark["--in-color-primary"]).toBe("#3d7eff");
  });

  it("缺少某模式覆盖时沿用该模式默认值", () => {
    const theme = defineAdminTheme({
      id: "acme-dark-only",
      apiVersion: INGOT_ADMIN_THEME_API_VERSION,
      name: "深色覆盖",
      tokens: {
        dark: {
          "--in-color-primary": "#5eead4",
        },
      },
    });
    const resolved = resolveAdminTheme(theme);
    expect(resolved.tokens.light["--in-color-primary"]).toBe("var(--in-blue-500)");
    expect(resolved.tokens.dark["--in-color-primary"]).toBe("#5eead4");
    expect(resolved.tokens.light["--in-radius-control"]).toBe("6px");
    expect(resolved.tokens.dark["--in-radius-control"]).toBe("6px");
  });

  it("非法标识在解析时抛出中文错误", () => {
    expect(() =>
      resolveAdminTheme({
        id: "Acme Theme",
        apiVersion: INGOT_ADMIN_THEME_API_VERSION,
        name: "非法",
      }),
    ).toThrow("主题 “Acme Theme” 的标识必须使用小写 kebab-case");
  });

  it("协议版本不兼容时抛出包含主题标识的中文错误", () => {
    expect(() =>
      resolveAdminTheme({
        id: "acme-legacy",
        apiVersion: 2 as unknown as typeof INGOT_ADMIN_THEME_API_VERSION,
        name: "旧协议",
      }),
    ).toThrow("主题 “acme-legacy” 的协议版本不兼容");
  });

  it("未知 Token 键会拒绝", () => {
    expect(() =>
      resolveAdminTheme({
        id: "acme-unknown",
        apiVersion: INGOT_ADMIN_THEME_API_VERSION,
        name: "未知变量",
        tokens: {
          light: {
            "--in-not-a-token": "#fff",
          } as never,
        },
      }),
    ).toThrow("主题 “acme-unknown” 包含未知 Token “--in-not-a-token”");
  });
});
