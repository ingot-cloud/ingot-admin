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
const roleDrawerSource = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "components/RoleDrawer.vue"),
  "utf8",
);

describe("org contacts role IndexPage", () => {
  it("使用可折叠 Split List 与字段设置", () => {
    expect(source).toContain('mode="contained"');
    expect(source).toContain('surface="workspace"');
    expect(source).toContain("left-collapsible");
    expect(source).toContain("ORG_ROLE_SPLIT_KEY");
    expect(source).toContain('description="按角色查看和绑定成员。"');
    expect(source).not.toContain('title="角色"');
    expect(source).toContain("in-table-column-setting");
    expect(source).toContain("applyColumnSelection");
    expect(source).toContain("in-table-actions");
    expect(source).toContain('density="compact"');
    expect(source).toContain("in-avatar");
    expect(source).toContain(':src="item.avatar"');
    expect(source).toContain(':name="item.nickname"');
    expect(source).toContain("in-table__count");
    expect(source).toContain("共 {{ ops.pageInfo.value.total ?? 0 }} 人");
    expect(source).not.toContain("#summary");
    expect(source).not.toContain("@refresh");
    expect(source).not.toContain("hide-setting");
    expect(source).not.toContain("ContactsTabs");
    expect(source).not.toContain("#171a1d");
    expect(source).not.toContain("useMessageConfirm");
    expect(source).not.toContain("confirm.warning");
  });

  it("左树向页面发出 kebab-case 选择事件", () => {
    expect(leftSource).toContain('"node-click"');
    expect(source).toContain("@node-click");
    expect(source).not.toContain("@onNodeClick");
    expect(leftSource).toContain("more-trigger");
    expect(leftSource).toContain("数据范围");
    expect(leftSource).toContain("DataRuleDrawer");
    expect(roleDrawerSource).toContain("filterDept");
    expect(roleDrawerSource).not.toContain("scopeType");
    expect(roleDrawerSource).not.toContain("scopes");
  });
});
