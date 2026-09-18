import type { InTableAction, TableHeaderRecord } from "@ingot/admin-core";
import {
  IamAction,
  MemberStatus,
  objectActionAllowed,
  type ResourceDetail,
  type MemberRecord,
} from "@ingot/admin-common";

export const TABLE_ID = "platform-iam-personnel";
export type Row = ResourceDetail<MemberRecord>;

export const tableHeaders: Array<TableHeaderRecord> = [
  { label: "名称", prop: "displayName", required: true },
  { label: "状态", prop: "status" },
  { label: "操作", width: "160", prop: "actions", fixed: "right" },
];

export function createToolbarActions(onCreate: () => void): Array<InTableAction<Row>> {
  return [
    {
      key: "create",
      label: "添加成员",
      kind: "quick",
      overflow: "never",
      priority: 50,
      permission: IamAction.PLATFORM_MEMBER_CREATE,
      onSelect: () => onCreate(),
    },
  ];
}

export function createRowActions(
  row: Row,
  handlers: {
    onDetail: (row: Row) => void;
    onSuspend: (row: Row) => void;
    onRestore: (row: Row) => void;
    onRemove: (row: Row) => void;
  },
): Array<InTableAction<Row>> {
  const detail = objectActionAllowed(row.capabilities, IamAction.PLATFORM_MEMBER_READ);
  const status = objectActionAllowed(row.capabilities, IamAction.PLATFORM_MEMBER_STATUS);
  const remove = objectActionAllowed(row.capabilities, IamAction.PLATFORM_MEMBER_REMOVE);
  const actions: Array<InTableAction<Row>> = [
    {
      key: "detail",
      label: "详情",
      kind: "detail",
      permission: IamAction.PLATFORM_MEMBER_READ,
      disabled: !detail.allowed,
      disabledReason: detail.message,
      onSelect: handlers.onDetail,
    },
  ];
  if (row.record.status === MemberStatus.ACTIVE) {
    actions.push({
      key: "suspend",
      label: "暂停",
      kind: "default",
      permission: IamAction.PLATFORM_MEMBER_STATUS,
      disabled: !status.allowed,
      disabledReason: status.message,
      onSelect: handlers.onSuspend,
    });
  }
  if (row.record.status === MemberStatus.SUSPENDED) {
    actions.push({
      key: "restore",
      label: "恢复",
      kind: "default",
      permission: IamAction.PLATFORM_MEMBER_STATUS,
      disabled: !status.allowed,
      disabledReason: status.message,
      onSelect: handlers.onRestore,
    });
  }
  if (row.record.status !== MemberStatus.REMOVED) {
    actions.push({
      key: "remove",
      label: "移出",
      kind: "danger",
      permission: IamAction.PLATFORM_MEMBER_REMOVE,
      disabled: !remove.allowed,
      disabledReason: remove.message,
      onSelect: handlers.onRemove,
    });
  }
  return actions;
}
