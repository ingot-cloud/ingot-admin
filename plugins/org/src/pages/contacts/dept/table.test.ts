import { describe, expect, it } from "vitest";
import {
  createOrgDeptRowActions,
  createOrgDeptToolbarActions,
  ORG_DEPT_TABLE_ID,
  tableHeaders,
} from "./table";

const handlers = {
  onEdit: () => undefined,
  onAddChild: () => undefined,
  onDelete: () => undefined,
};

const row = (overrides: { id?: string; name?: string; mainFlag?: boolean } = {}) => ({
  id: "1",
  name: "研发",
  ...overrides,
});

describe("org contacts dept table contract", () => {
  it("提供稳定 tableId，名称列为必选", () => {
    expect(ORG_DEPT_TABLE_ID).toBe("org-contacts-dept");
    expect(tableHeaders.find((item) => item.prop === "name")?.required).toBe(true);
    expect(tableHeaders.some((item) => item.prop === "actions")).toBe(true);
  });

  it("工具栏添加部门始终直出且带图标", () => {
    const actions = createOrgDeptToolbarActions(() => undefined);
    expect(actions.map((item) => `${item.kind}:${item.key}`)).toEqual(["quick:create"]);
    expect(actions[0]?.overflow).toBe("never");
    expect(actions[0]?.icon).toBe("ep:plus");
    expect(actions[0]?.label).toBe("添加部门");
  });

  it("行内编辑/添加/删除，根部门禁用且 200 行映射稳定", () => {
    const rows = Array.from({ length: 200 }, (_, index) =>
      row({
        id: String(index + 1),
        name: `部门-${index + 1}`,
        mainFlag: index === 0,
      }),
    );
    const root = createOrgDeptRowActions(rows[0]!, handlers);
    expect(root.map((item) => `${item.kind}:${item.key}`)).toEqual([
      "detail:edit",
      "quick:add-child",
      "danger:delete",
    ]);
    expect(root.every((item) => item.disabled)).toBe(true);
    expect(root[0]?.disabledReason).toBe("根部门不可操作");
    expect(root[2]?.confirm).toBeUndefined();

    const child = createOrgDeptRowActions(rows[1]!, handlers);
    expect(child.every((item) => item.disabled)).toBe(false);
    expect(child[2]?.confirm).toBe("是否删除部门(部门-2)");
    expect(rows).toHaveLength(200);
  });
});
