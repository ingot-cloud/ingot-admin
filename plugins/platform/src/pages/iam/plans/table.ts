import type { InTableAction, TableHeaderRecord } from "@ingot/admin-core";
import {
  IamAction,
  objectActionAllowed,
  type ResourceDetail,
  type PlanRecord,
} from "@ingot/admin-common";

export const TABLE_ID = "platform-iam-plans";
export type Row = ResourceDetail<PlanRecord>;

export const tableHeaders: Array<TableHeaderRecord> = [
  { label: "名称", prop: "name", required: true },
  { label: "状态", prop: "status" },
  { label: "操作", width: "160", prop: "actions", fixed: "right" },
];

export function createToolbarActions(onCreate: () => void): Array<InTableAction<Row>> {
  return [
    {
      key: "create",
      label: "创建套餐",
      kind: "quick",
      overflow: "never",
      priority: 50,
      permission: IamAction.PLATFORM_PLAN_CREATE,
      onSelect: () => onCreate(),
    },
  ];
}

export function createRowActions(
  row: Row,
  handlers: { onDetail: (row: Row) => void },
): Array<InTableAction<Row>> {
  const detail = objectActionAllowed(row.capabilities, IamAction.PLATFORM_PLAN_READ);
  return [
    {
      key: "detail",
      label: "详情",
      kind: "detail",
      permission: IamAction.PLATFORM_PLAN_READ,
      disabled: !detail.allowed,
      disabledReason: detail.message,
      onSelect: handlers.onDetail,
    },
  ];
}
