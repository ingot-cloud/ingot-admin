import type { InTableAction, TableHeaderRecord } from "@ingot/admin-core";
import {
  IamAction,
  objectActionAllowed,
  type ResourceDetail,
  type ApplicationRecord,
} from "@ingot/admin-common";

export const TABLE_ID = "platform-iam-applications";
export type Row = ResourceDetail<ApplicationRecord>;

export const tableHeaders: Array<TableHeaderRecord> = [
  { label: "名称", prop: "name", required: true },
  { label: "编码", prop: "code" },
  { label: "状态", prop: "status" },
  { label: "操作", width: "160", prop: "actions", fixed: "right" },
];

export function createToolbarActions(onCreate: () => void): Array<InTableAction<Row>> {
  return [
    {
      key: "create",
      label: "创建应用",
      kind: "quick",
      overflow: "never",
      priority: 50,
      permission: IamAction.PLATFORM_APPLICATION_CREATE,
      onSelect: () => onCreate(),
    },
  ];
}

export function createRowActions(
  row: Row,
  handlers: { onDetail: (row: Row) => void; onDelete: (row: Row) => void },
): Array<InTableAction<Row>> {
  const detail = objectActionAllowed(row.capabilities, IamAction.PLATFORM_APPLICATION_READ);
  const remove = objectActionAllowed(row.capabilities, IamAction.PLATFORM_APPLICATION_DELETE);
  return [
    {
      key: "detail",
      label: "详情",
      kind: "detail",
      permission: IamAction.PLATFORM_APPLICATION_READ,
      disabled: !detail.allowed,
      disabledReason: detail.message,
      onSelect: handlers.onDetail,
    },
    {
      key: "delete",
      label: "删除",
      kind: "danger",
      permission: IamAction.PLATFORM_APPLICATION_DELETE,
      disabled: !remove.allowed,
      disabledReason: remove.message,
      onSelect: handlers.onDelete,
    },
  ];
}
