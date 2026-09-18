import type { InTableAction, TableHeaderRecord } from "@ingot/admin-core";
import {
  IamAction,
  objectActionAllowed,
  type ResourceDetail,
  type TenantRecord,
} from "@ingot/admin-common";

export const TENANT_TABLE_ID = "platform-iam-tenants";

export type TenantRow = ResourceDetail<TenantRecord>;

export const tableHeaders: Array<TableHeaderRecord> = [
  { label: "名称", prop: "name", required: true },
  { label: "状态", prop: "status" },
  { label: "所有者", prop: "ownerMemberId" },
  { label: "操作", width: "160", prop: "actions", fixed: "right" },
];

export function createTenantToolbarActions(onCreate: () => void): Array<InTableAction<TenantRow>> {
  return [
    {
      key: "create",
      label: "创建组织",
      kind: "quick",
      overflow: "never",
      priority: 50,
      permission: IamAction.PLATFORM_TENANT_CREATE,
      onSelect: () => onCreate(),
    },
  ];
}

export function createTenantRowActions(
  row: TenantRow,
  handlers: {
    onDetail: (row: TenantRow) => void;
  },
): Array<InTableAction<TenantRow>> {
  const detail = objectActionAllowed(row.capabilities, IamAction.PLATFORM_TENANT_READ);
  return [
    {
      key: "detail",
      label: "详情",
      kind: "detail",
      permission: IamAction.PLATFORM_TENANT_READ,
      disabled: !detail.allowed,
      disabledReason: detail.message,
      onSelect: handlers.onDetail,
    },
  ];
}
