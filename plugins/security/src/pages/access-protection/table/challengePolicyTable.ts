import type { InTableAction, TableHeaderRecord } from "@ingot/admin-core";
import type { GatewayChallengePolicy } from "@/models";

export const CHALLENGE_POLICY_TABLE_ID = "security-access-challenge";

export const challengePolicyTableHeaders: Array<TableHeaderRecord> = [
  {
    label: "编码",
    prop: "code",
    minWidth: "140",
  },
  {
    label: "分组/路径",
    prop: "target",
    minWidth: "160",
  },
  {
    label: "触发",
    prop: "trigger",
    width: "120",
  },
  {
    label: "类型",
    prop: "challengeType",
    width: "100",
  },
  {
    label: "scope",
    prop: "scope",
    minWidth: "120",
  },
  {
    label: "TTL",
    prop: "passTokenTtlSec",
    width: "90",
  },
  {
    label: "剩余次数",
    prop: "passTokenRemaining",
    width: "100",
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

export function createChallengePolicyToolbarActions(
  onCreate: () => void,
): Array<InTableAction<GatewayChallengePolicy>> {
  return [
    {
      key: "create",
      label: "新建挑战策略",
      kind: "quick",
      icon: "ep:plus",
      overflow: "never",
      priority: 50,
      onSelect: () => onCreate(),
    },
  ];
}

export function createChallengePolicyRowActions(
  _row: GatewayChallengePolicy,
  handlers: {
    onDetail: (row: GatewayChallengePolicy) => void;
  },
): Array<InTableAction<GatewayChallengePolicy>> {
  return [
    {
      key: "detail",
      label: "编辑",
      kind: "detail",
      onSelect: handlers.onDetail,
    },
  ];
}
