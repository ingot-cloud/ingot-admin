import { describe, expect, it } from "vitest";
import {
  collectSelectedDeptIds,
  createOrgDeptRowActions,
  createOrgDeptToolbarActions,
  ORG_DEPT_TABLE_ID,
  tableHeaders,
} from "./table";

const handlers = {
  onDetail: () => undefined,
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
    expect(tableHeaders.some((item) => item.type === "selection")).toBe(false);
    expect(tableHeaders.some((item) => item.prop === "actions")).toBe(true);
    expect(tableHeaders.find((item) => item.prop === "memberCount")?.transform?.(null)).toBe("-");
    expect(tableHeaders.find((item) => item.prop === "memberCount")?.transform?.("12")).toBe("12");
  });

  it("工具栏批量删除、导入与新建部门分层", () => {
    const empty = createOrgDeptToolbarActions({
      onCreate: () => undefined,
      onBatchDelete: () => undefined,
      selectedCount: 0,
    });
    expect(empty.map((item) => `${item.kind}:${item.key}`)).toEqual([
      "danger:batch-delete",
      "primary:import",
      "quick:create",
    ]);
    expect(empty[0]?.disabled).toBe(true);
    expect(empty[0]?.disabledReason).toBe("请先选择部门");
    expect(empty[2]?.overflow).toBe("never");
    expect(empty[2]?.icon).toBe("ep:plus");
    expect(empty[2]?.label).toBe("新建部门");

    const selected = createOrgDeptToolbarActions({
      onCreate: () => undefined,
      onBatchDelete: () => undefined,
      selectedCount: 2,
    });
    expect(selected[0]?.disabled).toBe(false);
    expect(selected[0]?.confirm).toBe("是否删除已选的 2 个部门");
    expect(
      collectSelectedDeptIds([
        row({ id: "root", mainFlag: true }),
        row({ id: "a", name: "产品" }),
        row({ id: undefined, name: "空" }),
      ]),
    ).toEqual(["a"]);
  });

  it("企业根节点无详情、可添加子部门，删除进更多；200 行映射稳定", () => {
    const rows = Array.from({ length: 200 }, (_, index) =>
      row({
        id: String(index + 1),
        name: `部门-${index + 1}`,
        mainFlag: index === 0,
      }),
    );
    const root = createOrgDeptRowActions(rows[0]!, handlers);
    expect(root.map((item) => `${item.kind}:${item.key}`)).toEqual([
      "quick:add-child",
      "danger:delete",
    ]);
    expect(root[0]?.label).toBe("添加子部门");
    expect(root[0]?.disabled).toBeFalsy();
    expect(root[1]?.disabled).toBe(true);
    expect(root[1]?.disabledReason).toBe("当前企业不可编辑");
    expect(root[1]?.confirm).toBeUndefined();

    const child = createOrgDeptRowActions(rows[1]!, handlers);
    expect(child.map((item) => `${item.kind}:${item.key}`)).toEqual([
      "detail:detail",
      "quick:add-child",
      "danger:delete",
    ]);
    expect(child.every((item) => item.disabled)).toBe(false);
    expect(child[2]?.confirm).toBe("是否删除部门(部门-2)");
    expect(rows).toHaveLength(200);
  });
});
