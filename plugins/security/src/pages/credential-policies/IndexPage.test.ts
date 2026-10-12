import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "IndexPage.vue"),
  "utf8",
);

describe("security credential IndexPage", () => {
  it("使用 Settings 的 page 模式并通过 Query 首次取数", () => {
    expect(source).toContain('mode="page"');
    expect(source).toContain('surface="workspace"');
    expect(source).toContain("in-page-header");
    expect(source).toContain('description="按类型维护凭证策略，各分组独立保存。"');
    expect(source).toContain("in-biz-tabs-header");
    expect(source).toMatch(/<in-page-header[\s\S]*?\/>\s*<\/template>\s*<template #tabs>/);
    expect(source).toContain("visitedTabs");
    expect(source).not.toContain("onMounted");
    expect(source).toContain("in-form-content");
    expect(source).not.toContain("padding: 8px 12px 16px");
    expect(source).not.toContain("@refresh");
  });
});
