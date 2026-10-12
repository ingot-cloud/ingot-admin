import { SecurityAction } from "@/models/securityActions";
import type { InTableAction, TableHeaderRecord } from "@ingot/admin-core";
import type { GatewayRateLimitRule } from "@/models";

export const RATE_LIMIT_TABLE_ID = "security-access-rate-limit";

export const rateLimitTableHeaders: Array<TableHeaderRecord> = [
  {
    label: "编码",
    prop: "code",
    minWidth: "140",
  },
  {
    label: "分组",
    prop: "groupCode",
    minWidth: "120",
  },
  {
    label: "限流维度",
    prop: "dimension",
    width: "100",
  },
  {
    label: "QPS",
    prop: "qps",
    width: "80",
  },
  {
    label: "突发",
    prop: "burst",
    width: "80",
  },
  {
    label: "优先级",
    prop: "priority",
    width: "90",
  },
  {
    label: "状态",
    prop: "enabled",
    width: "90",
  },
  {
    label: "操作",
    prop: "actions",
    width: "160",
    fixed: "right",
  },
];

export function createRateLimitToolbarActions(
  onCreate: () => void,
): Array<InTableAction<GatewayRateLimitRule>> {
  return [
    {
      key: "create",
      permission: SecurityAction.POLICY_CREATE,
      label: "新建限流规则",
      kind: "quick",
      icon: "ep:plus",
      overflow: "never",
      priority: 50,
      onSelect: () => onCreate(),
    },
  ];
}

export function createRateLimitRowActions(
  row: GatewayRateLimitRule,
  handlers: {
    onDetail: (row: GatewayRateLimitRule) => void;
    onDelete: (row: GatewayRateLimitRule) => void;
  },
): Array<InTableAction<GatewayRateLimitRule>> {
  return [
    {
      key: "detail",
      permission: SecurityAction.POLICY_READ,
      label: "详情",
      kind: "detail",
      onSelect: handlers.onDetail,
    },
    {
      key: "delete",
      permission: SecurityAction.POLICY_DELETE,
      label: "删除",
      kind: "danger",
      overflow: "always",
      disabled: !row.id,
      disabledReason: row.id ? undefined : "缺少记录 ID",
      confirm: `是否删除限流规则(${row.code || row.id})`,
      onSelect: handlers.onDelete,
    },
  ];
}
