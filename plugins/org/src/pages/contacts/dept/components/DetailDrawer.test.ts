import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "DetailDrawer.vue"),
  "utf8",
);

describe("org contacts dept DetailDrawer", () => {
  it("默认查看态，头像固定且不可编辑", () => {
    expect(source).toContain('title="部门详情"');
    expect(source).toContain('edit-label="编辑基本信息"');
    expect(source).toContain("<in-form");
    expect(source).toContain("in-detail-field");
    expect(source).toContain(':editing="editing"');
    expect(source).not.toContain("in-description-list");
    expect(source).not.toContain("dept-detail-body");
    expect(source).toContain("更多操作");
    expect(source).toContain('popper-class="in-dropdown"');
    expect(source).toContain('placement="bottom-end"');
    expect(source).not.toContain("divided");
    expect(source).toContain("useDetailEditSession");
    expect(source).toContain("v-model:editing");
    expect(source).toContain("deptDrawerHeaderAvatar");
    expect(source).toMatch(/import \{[\s\S]*\bMessage\b[\s\S]*\} from "@ingot\/admin-core"/);
    expect(source).toContain(':editable="false"');
    expect(source).not.toContain("v-model:avatar");
    expect(source).not.toContain("upload-dir");
    expect(source).not.toContain('label="头像"');
    const order = ["部门名称", "部门 ID", "上级部门", "部门主管", "状态"].map((label) =>
      source.indexOf(`label="${label}"`),
    );
    expect(order.every((index) => index >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });
});
