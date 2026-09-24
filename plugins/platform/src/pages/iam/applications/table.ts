import type { InTableAction, TableHeaderRecord } from "@ingot/admin-core";
import {
  IamAction,
  objectActionAllowed,
  ConfigurationStatus,
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

export const resourceHeaders: Array<TableHeaderRecord> = [
  { label: "名称", prop: "name", required: true },
  { label: "编码", prop: "code", hide: true },
  { label: "范围", prop: "scope" },
  { label: "操作", width: "200", prop: "actions", fixed: "right" },
];

export const actionHeaders: Array<TableHeaderRecord> = [
  { label: "名称", prop: "name", required: true, minWidth: 140 },
  { label: "操作码", prop: "code", minWidth: 320 },
  { label: "状态", prop: "status", width: "100" },
  { label: "操作", width: "180", prop: "actions", fixed: "right" },
];

export const menuHeaders: Array<TableHeaderRecord> = [
  { label: "名称", prop: "name", required: true },
  { label: "路径", prop: "path", hide: true },
  { label: "操作", width: "140", prop: "actions", fixed: "right" },
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
  handlers: {
    onDetail: (row: Row) => void;
    onEnable: (row: Row) => void;
    onDisable: (row: Row) => void;
    onDelete: (row: Row) => void;
  },
): Array<InTableAction<Row>> {
  const detail = objectActionAllowed(row.capabilities, IamAction.PLATFORM_APPLICATION_READ);
  const status = objectActionAllowed(row.capabilities, IamAction.PLATFORM_APPLICATION_STATUS);
  const remove = objectActionAllowed(row.capabilities, IamAction.PLATFORM_APPLICATION_DELETE);
  const actions: Array<InTableAction<Row>> = [
    {
      key: "detail",
      label: "详情",
      kind: "detail",
      permission: IamAction.PLATFORM_APPLICATION_READ,
      disabled: !detail.allowed,
      disabledReason: detail.message,
      onSelect: handlers.onDetail,
    },
  ];
  if (row.record.status !== ConfigurationStatus.ENABLED) {
    actions.push({
      key: "enable",
      label: "启用",
      kind: "default",
      permission: IamAction.PLATFORM_APPLICATION_STATUS,
      disabled: !status.allowed,
      disabledReason: status.message,
      onSelect: handlers.onEnable,
    });
  }
  if (row.record.status === ConfigurationStatus.ENABLED) {
    actions.push({
      key: "disable",
      label: "停用",
      kind: "default",
      permission: IamAction.PLATFORM_APPLICATION_STATUS,
      disabled: !status.allowed,
      disabledReason: status.message,
      onSelect: handlers.onDisable,
    });
  }
  actions.push({
    key: "delete",
    label: "删除",
    kind: "danger",
    permission: IamAction.PLATFORM_APPLICATION_DELETE,
    disabled: !remove.allowed,
    disabledReason: remove.message,
    onSelect: handlers.onDelete,
  });
  return actions;
}
