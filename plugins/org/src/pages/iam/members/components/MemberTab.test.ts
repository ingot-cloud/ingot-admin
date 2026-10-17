import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "MemberTab.vue"),
  "utf8",
);
const leftSource = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "DeptTreePanel.vue"),
  "utf8",
);

describe("org iam members MemberTab", () => {
  it("使用可折叠 Split List 与字段设置", () => {
    expect(source).toContain("left-collapsible");
    expect(source).toContain("MEMBER_SPLIT_KEY");
    expect(source).toContain("in-table-column-setting");
    expect(source).toContain("in-picker");
    expect(source).toContain('label="账号状态"');
    expect(source.indexOf("in-picker")).toBeLessThan(source.indexOf("in-table-column-setting"));
    expect(source).toContain("in-avatar");
    expect(source).toContain("MEMBER_AVATAR_SIZE");
    expect(source).toContain("member-name");
    expect(source).toContain("in-table__count");
    expect(source).toContain("共 {{ memberOps.paging.pageInfo.value.total ?? 0 }} 人");
    expect(source).toContain("MemberCreateDrawer");
    expect(source).toContain("MemberDetailDrawer");
    expect(source).not.toContain("新增部门");
    expect(source).not.toContain("DepartmentEditDrawer");
    expect(source).toContain('defineProps<{ active?: boolean }>()');
    expect(source).toContain("#departments");
    expect(source).toContain("#loginPhone");
    expect(source).toContain("#joinedAt");
    expect(source).toContain("#updatedAt");
    expect(source).toContain("formatDateTime");
    expect(source).toContain("@selection-change");
    expect(source).toContain("selected-count");
    expect(source).toContain("MemberBatchDepartmentDrawer");
    expect(source).toContain("#displayName-header");
    expect(source).toContain("formatSelectionColumnLabel");
  });

  it("左树可搜索并默认选中根部门", () => {
    expect(leftSource).toContain('placeholder="搜索部门"');
    expect(leftSource).toContain(":default-expanded-keys=\"defaultExpandedKeys\"");
    expect(leftSource).toContain("isRootDepartment(item)");
    expect(leftSource).toContain('"node-click"');
    expect(source).toContain("@node-click");
  });

  it("根部门使用圆角矩形组织头像或首字，子部门使用组织图标", () => {
    expect(leftSource).toContain("isRootDepartment(item)");
    expect(leftSource).toContain("ROOT_DEPT_AVATAR_SIZE");
    expect(leftSource).toContain("departmentNameInitial(item.name)");
    expect(leftSource).toContain("border-radius: 2px");
    expect(leftSource).toContain('data-icon="OrganizationOutlined"');
    expect(leftSource).toContain("CHILD_DEPT_ICON_SIZE");
    expect(leftSource).toContain("DEPT_TREE_ROW_HEIGHT");
    expect(leftSource).toContain("DEPT_TREE_INDENT");
    expect(leftSource).not.toContain("padding-inline: var(--in-space-5)");
    expect(leftSource).toContain("padding-left: var(--in-space-2)");
    expect(leftSource).toContain("padding-right: var(--in-space-2)");
    expect(leftSource).toContain("'is-root'");
    expect(leftSource).toContain("dept-item.is-root");
    expect(source).toContain("padding: var(--in-space-5)");
    expect(source).not.toContain("in-bg-color-subtle");
    expect(leftSource).toContain("var(--in-container-bg)");
    expect(leftSource).toContain("rgb(240, 244, 255)");
    expect(leftSource).toContain("var(--in-color-primary)");
    expect(leftSource).not.toContain("新建部门");
    expect(source).toContain(":tenant-avatar");
  });
});
