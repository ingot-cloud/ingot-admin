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
  _row: GatewayRateLimitRule,
  handlers: {
    onDetail: (row: GatewayRateLimitRule) => void;
  },
): Array<InTableAction<GatewayRateLimitRule>> {
  return [
    {
      key: "detail",
      label: "编辑",
      kind: "detail",
      onSelect: handlers.onDetail,
    },
  ];
}
