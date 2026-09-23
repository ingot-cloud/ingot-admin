import type { InTableAction, TableHeaderRecord } from "@ingot/admin-core";
import {
  IamAction,
  objectActionAllowed,
  type ResourceDetail,
  type RoleSummary,
} from "@ingot/admin-common";

export const TABLE_ID = "platform-iam-shared-roles";
export type Row = ResourceDetail<RoleSummary>;

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
      label: "发布共享角色",
      kind: "quick",
      overflow: "never",
      priority: 50,
      permission: IamAction.PLATFORM_SHARED_ROLE_CREATE,
      onSelect: () => onCreate(),
    },
  ];
}

export function createRowActions(
  row: Row,
  handlers: { onDetail: (row: Row) => void; onDelete: (row: Row) => void },
): Array<InTableAction<Row>> {
  const detail = objectActionAllowed(row.capabilities, IamAction.PLATFORM_SHARED_ROLE_READ);
  const remove = objectActionAllowed(row.capabilities, IamAction.PLATFORM_SHARED_ROLE_DELETE);
  return [
    {
      key: "detail",
      label: "详情",
      kind: "detail",
      permission: IamAction.PLATFORM_SHARED_ROLE_READ,
      disabled: !detail.allowed,
      disabledReason: detail.message,
      onSelect: handlers.onDetail,
    },
    {
      key: "delete",
      label: "删除",
      kind: "danger",
      permission: IamAction.PLATFORM_SHARED_ROLE_DELETE,
      disabled: !remove.allowed,
      disabledReason: remove.message,
      onSelect: handlers.onDelete,
    },
  ];
}
