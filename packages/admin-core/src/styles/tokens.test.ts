import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const stylesDir = dirname(fileURLToPath(import.meta.url));

const REQUIRED_TOKENS = [
  "--in-color-primary",
  "--in-text-color",
  "--in-text-color-secondary",
  "--in-text-color-placeholder",
  "--in-text-color-disabled",
  "--in-bg-color-canvas",
  "--in-bg-color-sidebar",
  "--in-bg-color-surface",
  "--in-bg-color-muted",
  "--in-bg-color-page",
  "--in-bg-color-mute",
  "--in-border-color",
  "--in-space-1",
  "--in-space-2",
  "--in-space-3",
  "--in-space-4",
  "--in-space-5",
  "--in-space-6",
  "--in-space-8",
  "--in-radius-control",
  "--in-radius-card",
  "--in-radius-card-lg",
  "--in-app-bar-height",
  "--in-sidebar-gutter",
  "--in-sidebar-panel-expanded",
  "--in-sidebar-panel-collapsed",
  "--in-menu-show",
  "--in-menu-hide",
  "--in-split-left-width",
  "--in-container-radius",
  "--in-container-bg",
  "--in-page-breadcrumb-height",
  "--in-page-header-min-height",
  "--in-control-height",
  "--in-control-height-small",
  "--in-menu-item-height",
  "--in-table-header-height",
  "--in-table-row-height",
  "--in-motion-duration",
] as const;

const REQUIRED_VALUES: Record<string, string> = {
  "--in-color-primary": "var(--in-blue-500)",
  "--in-blue-500": "#3370ff",
  "--in-text-color": "var(--in-gray-950)",
  "--in-gray-950": "#1f2329",
  "--in-text-color-secondary": "var(--in-gray-700)",
  "--in-gray-700": "#646a73",
  "--in-text-color-placeholder": "var(--in-gray-500)",
  "--in-gray-500": "#8f959e",
  "--in-text-color-disabled": "var(--in-gray-400)",
  "--in-gray-400": "#bbbfc4",
  "--in-bg-color-canvas": "var(--in-gray-100)",
  "--in-bg-color-sidebar": "var(--in-gray-100)",
  "--in-bg-color-surface": "var(--in-white)",
  "--in-bg-color-muted": "var(--in-gray-200)",
  "--in-gray-100": "#f5f5f5",
  "--in-bg-color-page": "var(--in-bg-color-canvas)",
  "--in-bg-color-mute": "var(--in-bg-color-muted)",
  "--in-bg-color": "var(--in-bg-color-surface)",
  "--in-border-color": "var(--in-gray-300)",
  "--in-gray-300": "#dee0e3",
  "--in-app-bar-height": "56px",
  "--in-app-bar-nav-max": "560px",
  "--in-app-bar-actions-max": "360px",
  "--in-app-bar-search-width": "240px",
  "--in-sidebar-gutter": "8px",
  "--in-sidebar-panel-expanded": "236px",
  "--in-sidebar-panel-collapsed": "52px",
  "--in-menu-show": "var(--in-sidebar-panel-expanded)",
  "--in-menu-hide": "var(--in-sidebar-panel-collapsed)",
  "--in-split-left-width": "260px",
  "--in-container-radius": "0px",
  "--in-container-bg": "var(--in-bg-color-surface)",
  "--in-page-breadcrumb-height": "46px",
  "--in-page-header-min-height": "80px",
  "--in-control-height": "32px",
  "--in-radius-control": "6px",
  "--in-motion-duration-sidebar": "300ms",
  "--in-motion-ease-sidebar": "cubic-bezier(0.25, 0.1, 0.05, 1)",
  "--in-menu-icon-size": "20px",
  "--in-menu-base-level-padding": "16px",
  "--in-menu-control-height": "44px",
  "--in-menu-footer-clearance": "18px",
  "--in-menu-divider-gap": "var(--in-space-2)",
  "--in-menu-text-color": "var(--in-text-color-secondary)",
  "--in-bg-color-menu-hover": "rgba(31, 35, 41, 0.06)",
};

const VAR_REF = /var\(\s*(--[a-z0-9-]+)/gi;
const DECLARATION = /(--[a-z0-9-]+)\s*:\s*([^;]+);/gi;

const parseDeclarations = (css: string): Map<string, string[]> => {
  const map = new Map<string, string[]>();
  for (const match of css.matchAll(DECLARATION)) {
    const name = match[1];
    const value = match[2]?.trim();
    if (!name || !value) {
      continue;
    }
    const list = map.get(name) ?? [];
    list.push(value);
    map.set(name, list);
  }
  return map;
};

const collectRefs = (value: string): string[] => {
  return [...value.matchAll(VAR_REF)].map((item) => item[1]).filter((item): item is string => !!item);
};

describe("design tokens", () => {
  const tokensCss = readFileSync(resolve(stylesDir, "tokens.css"), "utf8");
  const mappingCss = readFileSync(resolve(stylesDir, "el-mapping.css"), "utf8");
  const darkTokensCss = readFileSync(resolve(stylesDir, "dark/tokens.css"), "utf8");
  const darkMappingCss = readFileSync(resolve(stylesDir, "dark/el-css-vars.css"), "utf8");
  const tokens = parseDeclarations(tokensCss);
  const mapping = parseDeclarations(mappingCss);

  it("定义关键浅色语义与尺寸 Token", () => {
    for (const name of REQUIRED_TOKENS) {
      expect(tokens.has(name), `缺少 ${name}`).toBe(true);
    }
    for (const [name, expected] of Object.entries(REQUIRED_VALUES)) {
      expect(tokens.get(name)?.[0]).toBe(expected);
    }
  });

  it("间距采用 4px 基线", () => {
    expect(tokens.get("--in-space-1")?.[0]).toBe("4px");
    expect(tokens.get("--in-space-2")?.[0]).toBe("8px");
    expect(tokens.get("--in-space-8")?.[0]).toBe("32px");
  });

  it("Ingot Token 不反向依赖 Element Plus 变量", () => {
    for (const [name, values] of tokens) {
      for (const value of values) {
        const refs = collectRefs(value);
        expect(
          refs.filter((ref) => ref.startsWith("--el-")),
          `${name} 依赖了 Element Plus 变量`,
        ).toEqual([]);
      }
    }
  });

  it("Element Plus 变量从 Ingot Token 单向映射", () => {
    const primary = mapping.get("--el-color-primary")?.join(" ") ?? "";
    const text = mapping.get("--el-text-color-primary")?.join(" ") ?? "";
    expect(primary).toContain("var(--in-color-primary)");
    expect(text).toContain("var(--in-text-color)");
  });

  it("Token 引用不形成环", () => {
    const graph = new Map<string, string[]>();
    for (const [name, values] of [...tokens, ...mapping]) {
      graph.set(name, values.flatMap(collectRefs));
    }
    const visiting = new Set<string>();
    const visited = new Set<string>();
    const visit = (node: string, path: string[]) => {
      if (visiting.has(node)) {
        throw new Error(`循环引用: ${[...path, node].join(" -> ")}`);
      }
      if (visited.has(node)) {
        return;
      }
      visiting.add(node);
      for (const next of graph.get(node) ?? []) {
        visit(next, [...path, node]);
      }
      visiting.delete(node);
      visited.add(node);
    };
    expect(() => {
      for (const name of graph.keys()) {
        visit(name, []);
      }
    }).not.toThrow();
  });

  it("暗色主题覆盖同一语义 Token 集", () => {
    const dark = parseDeclarations(darkTokensCss);
    expect(dark.has("--in-color-primary")).toBe(true);
    expect(dark.has("--in-text-color")).toBe(true);
    expect(dark.has("--in-bg-color-canvas")).toBe(true);
    expect(dark.has("--in-bg-color-sidebar")).toBe(true);
    expect(dark.has("--in-bg-color-surface")).toBe(true);
    expect(dark.has("--in-bg-color-page")).toBe(true);
    expect(dark.has("--in-border-color")).toBe(true);
    expect(darkMappingCss).toContain("var(--in-color-primary)");
    expect(darkMappingCss).toContain("var(--in-bg-color)");
  });

  it("旧背景与侧栏宽度变量保留为别名", () => {
    expect(tokens.get("--in-bg-color")?.[0]).toBe("var(--in-bg-color-surface)");
    expect(tokens.get("--in-bg-color-page")?.[0]).toBe("var(--in-bg-color-canvas)");
    expect(tokens.get("--in-menu-show")?.[0]).toBe("var(--in-sidebar-panel-expanded)");
    expect(tokens.get("--in-menu-hide")?.[0]).toBe("var(--in-sidebar-panel-collapsed)");
  });
});
