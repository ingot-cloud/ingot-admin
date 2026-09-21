import type { InTableAction, TableHeaderRecord } from "@ingot/admin-core";
import {
  IamAction,
  objectActionAllowed,
  type EntitlementRecord,
  type ResourceDetail,
} from "@ingot/admin-common";

export const TABLE_ID = "org-iam-applications";
export type Row = ResourceDetail<EntitlementRecord>;

export const tableHeaders: Array<TableHeaderRecord> = [
  { label: "名称", prop: "name", required: true },
  { label: "状态", prop: "status" },
  { label: "操作", width: "160", prop: "actions", fixed: "right" },
];

export function createToolbarActions(_onCreate: () => void): Array<InTableAction<Row>> {
  return [];
}

export function createRowActions(
  row: Row,
  handlers: { onDetail: (row: Row) => void },
): Array<InTableAction<Row>> {
  const detail = objectActionAllowed(row.capabilities, IamAction.TENANT_APPLICATION_READ);
  return [
    {
      key: "detail",
      label: "详情",
      kind: "detail",
      permission: IamAction.TENANT_APPLICATION_READ,
      disabled: !detail.allowed,
      disabledReason: detail.message,
      onSelect: handlers.onDetail,
    },
  ];
}
