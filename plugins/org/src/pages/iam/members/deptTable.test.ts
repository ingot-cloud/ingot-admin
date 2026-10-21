import { describe, expect, it } from "vitest";
import { IamAction } from "@ingot/admin-common";
import {
  collectDeletableDepts,
  createRowActions,
  createToolbarActions,
  DEPT_LIST_PATH,
  DEPT_NAME_COLUMN_LABEL,
  DEPT_WORKBOOK_PATH,
  DEPT_WORKBOOK_TITLE,
  EMPTY_CELL,
  formatSelectionColumnLabel,
  SELECT_DEPTS_FIRST,
  TABLE_ID,
  tableHeaders,
} from "./deptTable";

const handlers = {
  onDetail: () => undefined,
  onAddChild: () => undefined,
  onDelete: () => undefined,
};

const row = {
  record: {
    id: "1",
    parentId: "root",
    name: "研发",
    sortOrder: 1,
    navigationOnly: false,
    memberCount: 3,
  },
  fieldAccess: {},
  capabilities: {
    [IamAction.TENANT_DEPARTMENT_READ]: { allowed: true },
    [IamAction.TENANT_DEPARTMENT_CREATE]: { allowed: true },
    [IamAction.TENANT_DEPARTMENT_DELETE]: { allowed: true },
  },
  version: "1",
  id: "1",
  parentId: "root",
  name: "研发",
  sortOrder: 1,
  navigationOnly: false,
  memberCount: 3,
};

describe("org iam members deptTable", () => {
  it("提供稳定 tableId，人数缺失显示短横", () => {
    expect(TABLE_ID).toBe("org-iam-departments-v2");
    expect(DEPT_LIST_PATH).toBe("/org/iam/departments");
    expect(DEPT_WORKBOOK_PATH).toBe("/org/iam/departments/workbook");
    expect(DEPT_WORKBOOK_TITLE).toBe("批量导入或导出部门");
    expect(tableHeaders.find((item) => item.prop === "name")?.label).toBe(DEPT_NAME_COLUMN_LABEL);
    expect(formatSelectionColumnLabel(DEPT_NAME_COLUMN_LABEL, 0)).toBe(DEPT_NAME_COLUMN_LABEL);
    expect(formatSelectionColumnLabel(DEPT_NAME_COLUMN_LABEL, 3)).toBe("部门名称 · 已选 3 条");
    expect(tableHeaders.find((item) => item.prop === "name")?.required).toBe(true);
    expect(tableHeaders.find((item) => item.prop === "sortOrder")?.hide).toBe(true);
    expect(tableHeaders.filter((item) => !item.hide).map((item) => item.prop)).toEqual([
      "name",
      "memberCount",
      "leaderSummary",
      "actions",
    ]);
    expect(tableHeaders.find((item) => item.prop === "memberCount")?.transform?.(null)).toBe(
      EMPTY_CELL,
    );
    expect(tableHeaders.find((item) => item.prop === "memberCount")?.transform?.(12)).toBe("12");
  });

  it("工具栏按飞书顺序固定展示删除、导入导出、新建", () => {
    const empty = createToolbarActions({
      onCreate: () => undefined,
      onImportExport: () => undefined,
      onBatchDelete: () => undefined,
      selectedCount: 0,
    });
    expect(empty.map((item) => `${item.kind}:${item.key}`)).toEqual([
      "danger:batch-delete",
      "primary:import",
      "quick:create",
    ]);
    expect(empty.every((item) => item.overflow === "never")).toBe(true);
    expect(empty.find((item) => item.key === "batch-delete")?.disabled).toBe(true);
    expect(empty.find((item) => item.key === "batch-delete")?.disabledReason).toBe(
      SELECT_DEPTS_FIRST,
    );

    const selected = createToolbarActions({
      onCreate: () => undefined,
      onImportExport: () => undefined,
      onBatchDelete: () => undefined,
      selectedCount: 3,
    });
    expect(selected.find((item) => item.key === "batch-delete")?.disabled).toBe(false);
    expect(selected.find((item) => item.key === "batch-delete")?.confirm).toContain("3 个部门");

    const hidden = createToolbarActions({
      onCreate: () => undefined,
      onImportExport: () => undefined,
      onBatchDelete: () => undefined,
      selectedCount: 0,
      canImportExport: false,
    });
    expect(hidden.map((item) => item.key)).toEqual(["batch-delete", "create"]);
  });

  it("批量删除排除主部门和导航骨架", () => {
    const root = {
      ...row,
      id: "root",
      parentId: undefined,
      record: { ...row.record, id: "root", parentId: undefined },
    };
    const skeleton = {
      ...row,
      id: "nav",
      navigationOnly: true,
      record: { ...row.record, id: "nav", navigationOnly: true },
    };
    expect(collectDeletableDepts([root, skeleton, row]).map((item) => item.id)).toEqual(["1"]);
  });

  it("导航骨架禁用详情和删除", () => {
    const actions = createRowActions(
      { ...row, navigationOnly: true, record: { ...row.record, navigationOnly: true } },
      handlers,
    );
    expect(actions.find((item) => item.key === "detail")?.disabled).toBe(true);
    expect(actions.find((item) => item.key === "delete")?.disabled).toBe(true);
  });

  it("主部门不提供详情和删除", () => {
    const actions = createRowActions(
      {
        ...row,
        id: "root",
        parentId: undefined,
        name: "测试组织",
        record: { ...row.record, id: "root", parentId: undefined, name: "测试组织" },
      },
      handlers,
    );
    expect(actions.map((item) => item.key)).toEqual(["add-child"]);
  });
});
