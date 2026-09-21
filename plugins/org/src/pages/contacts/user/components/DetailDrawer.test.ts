import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "DetailDrawer.vue"),
  "utf8",
);

describe("org contacts user DetailDrawer", () => {
  it("默认查看态并提供编辑与离开确认所需结构", () => {
    expect(source).toContain('title="成员详情"');
    expect(source).toContain('edit-label="编辑基本信息"');
    expect(source).toContain("<in-form");
    expect(source).toContain("in-detail-field");
    expect(source).toContain(':editing="editing"');
    expect(source).not.toContain("in-description-list");
    expect(source).not.toContain("member-detail-body");
    expect(source).toContain("更多操作");
    expect(source).toContain('popper-class="in-dropdown"');
    expect(source).toContain('placement="bottom-end"');
    expect(source).not.toContain("divided");
    expect(source).toContain("暂停账号");
    expect(source).toContain("useDetailEditSession");
    expect(source).toContain("v-model:editing");
    expect(source).toContain(':editable="editing"');
    expect(source).toContain('v-model:avatar="editForm.avatar"');
    expect(source).not.toContain('label="头像"');
    const order = ["姓名", "手机号", "email", "部门"].map((label) =>
      source.indexOf(`label="${label}"`),
    );
    expect(order.every((index) => index >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });
});
