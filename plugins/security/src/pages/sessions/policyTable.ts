import type { InTableAction, TableHeaderRecord } from "@ingot/admin-core";
import type { SessionConcurrencyPolicy } from "@/models";
import { SessionConcurrencyScopeEnum } from "@/models/enums/sessionEnums";
import { SESSION_POLICY_UPDATE_PERMISSION } from "./constants";

export const SESSIONS_POLICY_TABLE_ID = "security-sessions-policy";

export const policyTableHeaders: Array<TableHeaderRecord> = [
  {
    label: "生效范围",
    prop: "scope",
    width: "120",
  },
  {
    label: "客户端",
    prop: "clientId",
    minWidth: "120",
  },
  {
    label: "用户类型",
    prop: "userType",
    width: "110",
  },
  {
    label: "最大会话数",
    prop: "maxSessions",
    width: "120",
  },
  {
    label: "超出处置",
    prop: "overflow",
    minWidth: "130",
  },
  {
    label: "管理用户单会话",
    prop: "adminForbidConcurrent",
    width: "130",
  },
  {
    label: "状态",
    prop: "enabled",
    width: "90",
  },
  {
    label: "备注",
    prop: "remark",
    minWidth: "160",
  },
  {
    label: "更新时间",
    prop: "updatedAt",
    minWidth: "170",
  },
  {
    label: "操作",
    prop: "actions",
    width: "160",
    fixed: "right",
  },
];

export function createConcurrencyPolicyToolbarActions(
  onCreate: () => void,
): Array<InTableAction<SessionConcurrencyPolicy>> {
  return [
    {
      key: "create",
      label: "新建策略",
      kind: "quick",
      icon: "ep:plus",
      overflow: "never",
      priority: 50,
      permission: SESSION_POLICY_UPDATE_PERMISSION,
      onSelect: () => onCreate(),
    },
  ];
}

export function createConcurrencyPolicyRowActions(
  row: SessionConcurrencyPolicy,
  handlers: {
    onDetail: (row: SessionConcurrencyPolicy) => void;
    onDelete: (row: SessionConcurrencyPolicy) => void;
  },
): Array<InTableAction<SessionConcurrencyPolicy>> {
  const isGlobal = row.scope === SessionConcurrencyScopeEnum.GLOBAL;
  return [
    {
      key: "detail",
      label: "编辑",
      kind: "detail",
      permission: SESSION_POLICY_UPDATE_PERMISSION,
      onSelect: handlers.onDetail,
    },
    {
      key: "delete",
      label: "删除",
      kind: "danger",
      permission: SESSION_POLICY_UPDATE_PERMISSION,
      disabled: isGlobal,
      disabledReason: isGlobal
        ? "全局兜底策略不可删除，可将最大会话数改为 0 以关闭限制"
        : undefined,
      onSelect: handlers.onDelete,
    },
  ];
}
