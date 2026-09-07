import type { InTableAction, TableHeaderRecord } from "@ingot/admin-core";
import type { DeptTreeNodeWithManagerVO } from "@/models";

export const ORG_DEPT_TABLE_ID = "org-contacts-dept";

const ROOT_DISABLED_REASON = "当前企业不可编辑";
const EMPTY_CELL = "-";

const isRootDept = (row: DeptTreeNodeWithManagerVO): boolean => Boolean(row.mainFlag);

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
    transform: (value) =>
      value === null || value === undefined || value === "" ? EMPTY_CELL : String(value),
  },
  {
    label: "状态",
    prop: "status",
    minWidth: "132",
  },
  {
    label: "操作",
    width: "240",
    prop: "actions",
    fixed: "right",
  },
];

export function collectSelectedDeptIds(
  rows: Array<DeptTreeNodeWithManagerVO>,
): Array<string> {
  return rows
    .filter((item) => item.id && !item.mainFlag)
    .map((item) => item.id)
    .filter((id): id is string => Boolean(id));
}

export function createOrgDeptToolbarActions(handlers: {
  onCreate: () => void;
  onBatchDelete: () => void;
  selectedCount: number;
}): Array<InTableAction<DeptTreeNodeWithManagerVO>> {
  const hasSelection = handlers.selectedCount > 0;
  return [
    {
      key: "batch-delete",
      label: "批量删除",
      kind: "danger",
      overflow: "never",
      priority: 20,
      disabled: !hasSelection,
      disabledReason: hasSelection ? undefined : "请先选择部门",
      confirm: hasSelection ? `是否删除已选的 ${handlers.selectedCount} 个部门` : undefined,
      onSelect: () => handlers.onBatchDelete(),
    },
    {
      key: "import",
      label: "批量导入/导出",
      kind: "primary",
      overflow: "auto",
      overflowGroup: "batch",
      priority: 40,
      onSelect: () => undefined,
    },
    {
      key: "create",
      label: "新建部门",
      kind: "quick",
      icon: "ep:plus",
      overflow: "never",
      priority: 50,
      onSelect: () => handlers.onCreate(),
    },
  ];
}

export function createOrgDeptRowActions(
  row: DeptTreeNodeWithManagerVO,
  handlers: {
    onDetail: (row: DeptTreeNodeWithManagerVO) => void;
    onAddChild: (row: DeptTreeNodeWithManagerVO) => void;
    onDelete: (row: DeptTreeNodeWithManagerVO) => void;
  },
): Array<InTableAction<DeptTreeNodeWithManagerVO>> {
  const root = isRootDept(row);
  const actions: Array<InTableAction<DeptTreeNodeWithManagerVO>> = [];
  if (!root) {
    actions.push({
      key: "detail",
      label: "详情",
      kind: "detail",
      onSelect: handlers.onDetail,
    });
  }
  actions.push(
    {
      key: "add-child",
      label: "添加子部门",
      kind: "quick",
      onSelect: handlers.onAddChild,
    },
    {
      key: "delete",
      label: "删除",
      kind: "danger",
      disabled: root,
      disabledReason: root ? ROOT_DISABLED_REASON : undefined,
      confirm: root ? undefined : `是否删除部门(${row.name})`,
      onSelect: handlers.onDelete,
    },
  );
  return actions;
}
