import { describe, expect, it } from "vitest";
import { IamAction, MemberStatus } from "@ingot/admin-common";
import {
  collectActiveMembers,
  createRowActions,
  createToolbarActions,
  formatMemberDepartments,
  formatSelectionColumnLabel,
  MEMBER_AVATAR_SIZE,
  MEMBER_NAME_COLUMN_LABEL,
  MEMBER_BATCH_GROUP,
  SELECT_MEMBERS_FIRST,
  TABLE_ID,
  tableHeaders,
} from "./memberTable";

const row = {
  record: { id: "1", status: MemberStatus.ACTIVE, departments: [], displayName: "张三" },
  fieldAccess: {},
  capabilities: {
    [IamAction.TENANT_MEMBER_READ]: { allowed: true },
    [IamAction.TENANT_MEMBER_STATUS]: { allowed: true },
    [IamAction.TENANT_MEMBER_REMOVE]: { allowed: true },
  },
  version: "1",
};

describe("org iam members memberTable", () => {
  it("提供稳定 tableId 与默认显隐列", () => {
    expect(TABLE_ID).toBe("org-iam-members-v3");
    expect(MEMBER_AVATAR_SIZE).toBe(30);
    expect(tableHeaders.find((item) => item.prop === "displayName")?.label).toBe(
      MEMBER_NAME_COLUMN_LABEL,
    );
    expect(formatSelectionColumnLabel(MEMBER_NAME_COLUMN_LABEL, 0)).toBe(MEMBER_NAME_COLUMN_LABEL);
    expect(formatSelectionColumnLabel(MEMBER_NAME_COLUMN_LABEL, 2)).toBe("姓名 · 已选 2 条");
    expect(tableHeaders.find((item) => item.prop === "displayName")?.required).toBe(true);
    expect(tableHeaders.find((item) => item.prop === "status")?.label).toBe("账号状态");
    expect(tableHeaders.find((item) => item.prop === "phone")?.hide).toBeUndefined();
    expect(tableHeaders[0]).toMatchObject({ type: "selection", headerCheckbox: true });
    expect(tableHeaders.filter((item) => !item.hide).map((item) => item.prop)).toEqual([
      "selection",
      "displayName",
      "status",
      "phone",
      "departments",
      "loginPhone",
      "actions",
    ]);
    expect(tableHeaders.filter((item) => item.hide).map((item) => item.prop)).toEqual([
      "email",
      "joinedAt",
      "updatedAt",
    ]);
  });

  it("部门列主部门优先并用顿号拼接", () => {
    expect(
      formatMemberDepartments([
        { id: "2", name: "产品部", primary: false },
        { id: "1", name: "英歌特云", primary: true },
      ]),
    ).toBe("英歌特云、产品部");
    expect(formatMemberDepartments([])).toBe("-");
  });

  it("工具栏按飞书顺序：离职、调部门、导入导出可收纳，添加成员固定", () => {
    const empty = createToolbarActions({
      onCreate: () => undefined,
      onImportExport: () => undefined,
      onChangeDept: () => undefined,
      onResign: () => undefined,
      selectedCount: 0,
    });
    expect(empty.map((item) => `${item.kind}:${item.key}`)).toEqual([
      "danger:leave",
      "default:dept",
      "primary:import",
      "quick:create",
    ]);
    expect(empty.map((item) => item.overflow)).toEqual(["auto", "auto", "auto", "never"]);
    expect(
      empty
        .filter((item) => item.key !== "create")
        .every((item) => item.overflowGroup === MEMBER_BATCH_GROUP),
    ).toBe(true);
    expect(empty.find((item) => item.key === "leave")?.disabled).toBe(true);
    expect(empty.find((item) => item.key === "leave")?.disabledReason).toBe(SELECT_MEMBERS_FIRST);

    const selected = createToolbarActions({
      onCreate: () => undefined,
      onImportExport: () => undefined,
      onChangeDept: () => undefined,
      onResign: () => undefined,
      selectedCount: 2,
    });
    expect(selected.find((item) => item.key === "leave")?.disabled).toBe(false);
    expect(selected.find((item) => item.key === "leave")?.confirm).toContain("2 名成员");
  });

  it("批量离职只收集未移出成员", () => {
    expect(
      collectActiveMembers([
        row,
        {
          ...row,
          record: { ...row.record, id: "2", status: MemberStatus.REMOVED },
        },
      ]).map((item) => item.record.id),
    ).toEqual(["1"]);
  });

  it("在职成员可暂停和移出", () => {
    const actions = createRowActions(row, {
      onDetail: () => undefined,
      onSuspend: () => undefined,
      onRestore: () => undefined,
      onRemove: () => undefined,
    });
    expect(actions.map((item) => item.key)).toEqual(["detail", "suspend", "remove"]);
  });
});
