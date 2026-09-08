import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { defaultDarkTokens, defaultLightTokens } from "./defaultTokens";
import { IN_THEME_TOKEN_NAMES } from "./tokens";

const stylesDir = resolve(dirname(fileURLToPath(import.meta.url)), "../styles");
const DECLARATION = /(--[a-z0-9-]+)\s*:\s*([^;]+);/gi;

const extractBlock = (css: string, selector: string): string => {
  const idx = css.indexOf(selector);
  const brace = css.indexOf("{", idx);
  let depth = 0;
  for (let i = brace; i < css.length; i += 1) {
    if (css[i] === "{") {
      depth += 1;
    } else if (css[i] === "}") {
      depth -= 1;
      if (depth === 0) {
        return css.slice(brace + 1, i);
      }
    }
  }
  throw new Error(`未找到 ${selector}`);
};

const parseDeclarations = (css: string): Map<string, string> => {
  const map = new Map<string, string>();
  for (const match of css.matchAll(DECLARATION)) {
    map.set(match[1], match[2]?.trim() ?? "");
  }
  return map;
};

describe("default theme tokens", () => {
  const lightCss = parseDeclarations(
    extractBlock(readFileSync(resolve(stylesDir, "tokens.css"), "utf8"), ":root"),
  );
  const darkCss = parseDeclarations(
    extractBlock(readFileSync(resolve(stylesDir, "dark/tokens.css"), "utf8"), "html.dark"),
  );

  it("公开 Token 名与浅色 CSS 声明一致", () => {
    expect([...IN_THEME_TOKEN_NAMES]).toEqual([...lightCss.keys()]);
  });

  it("默认浅色 Token 与 tokens.css :root 一致", () => {
    for (const name of IN_THEME_TOKEN_NAMES) {
      expect(defaultLightTokens[name]).toBe(lightCss.get(name));
    }
  });

  it("默认深色以浅色为基线再合并暗色覆盖", () => {
    for (const name of IN_THEME_TOKEN_NAMES) {
      const expected = darkCss.get(name) ?? lightCss.get(name);
      expect(defaultDarkTokens[name]).toBe(expected);
    }
  });
});
