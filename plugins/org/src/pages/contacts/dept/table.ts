import type { InTableAction, TableHeaderRecord } from "@ingot/admin-core";
import type { DeptTreeNodeWithManagerVO } from "@/models";

export const ORG_DEPT_TABLE_ID = "org-contacts-dept";

const ROOT_DISABLED_REASON = "根部门不可操作";

export const tableHeaders: Array<TableHeaderRecord> = [
  {
    label: "部门名称",
    prop: "name",
    required: true,
  },
  {
    label: "主管",
    prop: "managerUsers",
  },
  {
    label: "部门人数",
    prop: "memberCount",
  },
  {
    label: "状态",
    prop: "status",
    minWidth: "132",
  },
  {
    label: "操作",
    width: "160",
    prop: "actions",
    fixed: "right",
  },
];

export function createOrgDeptToolbarActions(
  onCreate: () => void,
): Array<InTableAction<DeptTreeNodeWithManagerVO>> {
  return [
    {
      key: "create",
      label: "添加部门",
      kind: "quick",
      icon: "ep:plus",
      overflow: "never",
      priority: 50,
      onSelect: () => onCreate(),
    },
  ];
}

export function createOrgDeptRowActions(
  row: DeptTreeNodeWithManagerVO,
  handlers: {
    onEdit: (row: DeptTreeNodeWithManagerVO) => void;
    onAddChild: (row: DeptTreeNodeWithManagerVO) => void;
    onDelete: (row: DeptTreeNodeWithManagerVO) => void;
  },
): Array<InTableAction<DeptTreeNodeWithManagerVO>> {
  const isRoot = Boolean(row.mainFlag);
  return [
    {
      key: "edit",
      label: "编辑",
      kind: "detail",
      disabled: isRoot,
      disabledReason: isRoot ? ROOT_DISABLED_REASON : undefined,
      onSelect: handlers.onEdit,
    },
    {
      key: "add-child",
      label: "添加部门",
      kind: "quick",
      disabled: isRoot,
      disabledReason: isRoot ? ROOT_DISABLED_REASON : undefined,
      onSelect: handlers.onAddChild,
    },
    {
      key: "delete",
      label: "删除",
      kind: "danger",
      disabled: isRoot,
      disabledReason: isRoot ? ROOT_DISABLED_REASON : undefined,
      confirm: isRoot ? undefined : `是否删除部门(${row.name})`,
      onSelect: handlers.onDelete,
    },
  ];
}
