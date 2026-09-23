import type { InTableAction, TableHeaderRecord } from "@ingot/admin-core";
import {
  IamAction,
  objectActionAllowed,
  type ResourceDetail,
  type AccountRecord,
} from "@ingot/admin-common";

export const TABLE_ID = "platform-iam-accounts";
export type Row = ResourceDetail<AccountRecord>;

export const emptyAccountRow: Row = {
  record: { id: "", username: "" },
  fieldAccess: {},
  capabilities: {},
  version: "",
};

export const tableHeaders: Array<TableHeaderRecord> = [
  { label: "登录名", prop: "username", required: true, minWidth: 220, showOverflowTooltip: false },
  { label: "手机号", prop: "phone", minWidth: 140 },
  { label: "邮箱", prop: "email", minWidth: 180 },
  { label: "启用", prop: "enabled", width: 80 },
  { label: "锁定", prop: "locked", width: 80 },
  { label: "操作", width: "220", prop: "actions", fixed: "right" },
];

export function createToolbarActions(onCreate: () => void): Array<InTableAction<Row>> {
  return [
    {
      key: "create",
      label: "创建账号",
      kind: "quick",
      overflow: "never",
      priority: 50,
      permission: IamAction.PLATFORM_ACCOUNT_CREATE,
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
    onLock: (row: Row) => void;
    onUnlock: (row: Row) => void;
    onResetPassword: (row: Row) => void;
    onDelete: (row: Row) => void;
  },
): Array<InTableAction<Row>> {
  const read = objectActionAllowed(row.capabilities, IamAction.PLATFORM_ACCOUNT_READ);
  const enable = objectActionAllowed(row.capabilities, IamAction.PLATFORM_ACCOUNT_ENABLE);
  const disable = objectActionAllowed(row.capabilities, IamAction.PLATFORM_ACCOUNT_DISABLE);
  const lock = objectActionAllowed(row.capabilities, IamAction.PLATFORM_ACCOUNT_LOCK);
  const unlock = objectActionAllowed(row.capabilities, IamAction.PLATFORM_ACCOUNT_UNLOCK);
  const reset = objectActionAllowed(row.capabilities, IamAction.PLATFORM_ACCOUNT_RESET_PASSWORD);
  const remove = objectActionAllowed(row.capabilities, IamAction.PLATFORM_ACCOUNT_DELETE);
  const actions: Array<InTableAction<Row>> = [
    {
      key: "detail",
      label: "详情",
      kind: "detail",
      permission: IamAction.PLATFORM_ACCOUNT_READ,
      disabled: !read.allowed,
      disabledReason: read.message,
      onSelect: handlers.onDetail,
    },
  ];
  if (row.record.enabled === false) {
    actions.push({
      key: "enable",
      label: "启用",
      kind: "default",
      permission: IamAction.PLATFORM_ACCOUNT_ENABLE,
      disabled: !enable.allowed,
      disabledReason: enable.message,
      onSelect: handlers.onEnable,
    });
  }
  if (row.record.enabled === true) {
    actions.push({
      key: "disable",
      label: "停用",
      kind: "default",
      permission: IamAction.PLATFORM_ACCOUNT_DISABLE,
      disabled: !disable.allowed,
      disabledReason: disable.message,
      onSelect: handlers.onDisable,
    });
  }
  if (row.record.locked !== true) {
    actions.push({
      key: "lock",
      label: "锁定",
      kind: "default",
      permission: IamAction.PLATFORM_ACCOUNT_LOCK,
      disabled: !lock.allowed,
      disabledReason: lock.message,
      onSelect: handlers.onLock,
    });
  }
  if (row.record.locked === true) {
    actions.push({
      key: "unlock",
      label: "解锁",
      kind: "default",
      permission: IamAction.PLATFORM_ACCOUNT_UNLOCK,
      disabled: !unlock.allowed,
      disabledReason: unlock.message,
      onSelect: handlers.onUnlock,
    });
  }
  actions.push(
    {
      key: "reset-password",
      label: "重置密码",
      kind: "default",
      permission: IamAction.PLATFORM_ACCOUNT_RESET_PASSWORD,
      disabled: !reset.allowed,
      disabledReason: reset.message,
      onSelect: handlers.onResetPassword,
    },
    {
      key: "delete",
      label: "删除",
      kind: "danger",
      permission: IamAction.PLATFORM_ACCOUNT_DELETE,
      disabled: !remove.allowed,
      disabledReason: remove.message,
      onSelect: handlers.onDelete,
    },
  );
  return actions;
}
