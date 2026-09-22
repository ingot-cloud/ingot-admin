import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "ActionListDialog.vue"),
  "utf8",
);

describe("platform iam application ActionListDialog", () => {
  it("按资源分页加载操作并用可复制标签展示操作码", () => {
    expect(source).toContain('width="920px"');
    expect(source).toContain("搜索操作名");
    expect(source).toContain("resourceId: resource.value.record.id");
    expect(source).toContain("IAM_DEFAULT_PAGE_SIZE");
    expect(source).toContain('<in-copy-tag :text="asAction(item).record.code" />');
    expect(source).toContain("context.current.record.id, true");
    expect(source).not.toContain("size: 200");
  });
});
