import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "IndexPage.vue"),
  "utf8",
);
const leftSource = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "components/LeftContent.vue"),
  "utf8",
);

describe("org contacts user IndexPage", () => {
  it("使用可折叠 Split List 与字段设置", () => {
    expect(source).toContain('mode="contained"');
    expect(source).toContain('surface="workspace"');
    expect(source).toContain("left-collapsible");
    expect(source).toContain("ORG_USER_SPLIT_KEY");
    expect(source).toContain("in-column-setting");
    expect(source).toContain("in-table-actions");
    expect(source).toContain('density="compact"');
    expect(source).not.toContain("@refresh");
    expect(source).not.toContain("ContactsTabs");
    expect(source).not.toContain("in-biz-tabs-header");
  });

  it("左树向页面发出 kebab-case 选择事件", () => {
    expect(leftSource).toContain('"node-click"');
    expect(source).toContain("@node-click");
  });
});
