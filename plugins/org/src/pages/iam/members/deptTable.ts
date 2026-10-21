import type { InTableAction, TableHeaderRecord } from "@ingot/admin-core";
import {
  IamAction,
  objectActionAllowed,
  type DepartmentRecord,
  type ResourceDetail,
} from "@ingot/admin-common";
import { isRootDepartment } from "./deptTree";

export const TABLE_ID = "org-iam-departments-v2";
export const EMPTY_CELL = "-";
export const SELECT_DEPTS_FIRST = "请先选择部门";
export const DEPT_NAME_COLUMN_LABEL = "部门名称";
export const DEPT_LIST_PATH = "/org/iam/departments";
export const DEPT_WORKBOOK_PATH = "/org/iam/departments/workbook";
export const DEPT_WORKBOOK_TITLE = "批量导入或导出部门";

export { formatSelectionColumnLabel } from "./selectionHeader";

export type DeptRow = ResourceDetail<DepartmentRecord> &
  DepartmentRecord & {
    children?: DeptRow[];
  };

export const tableHeaders: Array<TableHeaderRecord> = [
  { label: DEPT_NAME_COLUMN_LABEL, prop: "name", required: true },
  {
    label: "部门人数",
    prop: "memberCount",
    transform: (value: unknown) =>
      value === null || value === undefined || value === "" ? EMPTY_CELL : String(value),
  },
  { label: "负责人", prop: "leaderSummary", width: "220" },
  { label: "排序", prop: "sortOrder", hide: true },
  { label: "操作", width: "240", prop: "actions", fixed: "right" },
];

export function collectDeletableDepts(rows: DeptRow[]): DeptRow[] {
  return rows.filter((item) => item.id && !isRootDepartment(item) && !item.navigationOnly);
}

export function createToolbarActions(handlers: {
  onCreate: () => void;
  onImportExport: () => void;
  onBatchDelete: () => void;
  selectedCount: number;
  canImportExport?: boolean;
}): Array<InTableAction<DeptRow>> {
  const hasSelection = handlers.selectedCount > 0;
  const actions: Array<InTableAction<DeptRow>> = [
    {
      key: "batch-delete",
      label: "批量删除",
      kind: "danger",
      overflow: "never",
      priority: 20,
      permission: IamAction.TENANT_DEPARTMENT_DELETE,
      disabled: !hasSelection,
      disabledReason: hasSelection ? undefined : SELECT_DEPTS_FIRST,
      confirm: hasSelection
        ? `只能删除空部门。是否删除已选的 ${handlers.selectedCount} 个部门？`
        : undefined,
      onSelect: () => handlers.onBatchDelete(),
    },
  ];
  if (handlers.canImportExport !== false) {
    actions.push({
      key: "import",
      label: "批量导入/导出",
      kind: "primary",
      overflow: "never",
      priority: 40,
      onSelect: () => handlers.onImportExport(),
    });
  }
  actions.push({
    key: "create",
    label: "新建部门",
    kind: "quick",
    icon: "ep:plus",
    overflow: "never",
    priority: 50,
    permission: IamAction.TENANT_DEPARTMENT_CREATE,
    onSelect: () => handlers.onCreate(),
  });
  return actions;
}

export function createRowActions(
  row: DeptRow,
  handlers: {
    onDetail: (row: DeptRow) => void;
    onAddChild: (row: DeptRow) => void;
    onDelete: (row: DeptRow) => void;
  },
): Array<InTableAction<DeptRow>> {
  const detail = objectActionAllowed(row.capabilities, IamAction.TENANT_DEPARTMENT_READ);
  const create = objectActionAllowed(row.capabilities, IamAction.TENANT_DEPARTMENT_CREATE);
  const remove = objectActionAllowed(row.capabilities, IamAction.TENANT_DEPARTMENT_DELETE);
  const skeleton = row.navigationOnly;
  const root = isRootDepartment(row);
  const actions: Array<InTableAction<DeptRow>> = [];
  if (!root) {
    actions.push({
      key: "detail",
      label: "详情",
      kind: "detail",
      permission: IamAction.TENANT_DEPARTMENT_READ,
      disabled: skeleton || !detail.allowed,
      disabledReason: skeleton ? "导航骨架不可编辑" : detail.message,
      onSelect: handlers.onDetail,
    });
  }
  actions.push({
    key: "add-child",
    label: "添加子部门",
    kind: "quick",
    permission: IamAction.TENANT_DEPARTMENT_CREATE,
    disabled: !create.allowed,
    disabledReason: create.message,
    onSelect: handlers.onAddChild,
  });
  if (!root) {
    actions.push({
      key: "delete",
      label: "删除",
      kind: "danger",
      permission: IamAction.TENANT_DEPARTMENT_DELETE,
      disabled: skeleton || !remove.allowed,
      disabledReason: skeleton ? "导航骨架不可删除" : remove.message,
      confirm: skeleton ? undefined : `只能删除空部门。是否删除（${row.name}）？`,
      onSelect: handlers.onDelete,
    });
  }
  return actions;
}
