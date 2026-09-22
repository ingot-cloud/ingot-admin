import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "ResourceEditDrawer.vue"),
  "utf8",
);

describe("platform iam application ResourceEditDrawer", () => {
  it("字段能力用列表展示，添加字段在标题右侧，移除用危险色", () => {
    expect(source).toContain("field-cap__group");
    expect(source).toContain("字段键");
    expect(source).toContain("展示名");
    expect(source).toContain("可见性");
    expect(source).toContain("操作能力");
    expect(source).toContain("添加字段");
    expect(source.indexOf("字段能力")).toBeLessThan(source.indexOf("添加字段"));
    expect(source).toContain('type="danger"');
    expect(source).toContain("privateRemoveField");
    expect(source).toContain("暂未声明字段");
    expect(source).toContain("field-cap__action");
    expect(source.indexOf("field-cap__body")).toBeLessThan(source.indexOf("field-cap__action"));
    expect(source).toContain('layout="pinned"');
    expect(source).toContain("overflow-y: auto");
    expect(source).not.toContain("is-pair");
  });
});
