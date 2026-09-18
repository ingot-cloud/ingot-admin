import type { InTableAction, TableHeaderRecord } from "@ingot/admin-core";
import {
  IamAction,
  objectActionAllowed,
  type GroupRecord,
  type ResourceDetail,
} from "@ingot/admin-common";

export const GROUP_TABLE_ID = "platform-iam-personnel-groups";
export type GroupRow = ResourceDetail<GroupRecord>;

export const emptyGroupRow: GroupRow = {
  record: { id: "", name: "", selection: { members: [], departments: [] } },
  fieldAccess: {},
  capabilities: {},
  version: "",
};

export const groupHeaders: Array<TableHeaderRecord> = [
  { label: "名称", prop: "name", required: true },
  { label: "有效人数", prop: "visibleMemberCount" },
  { label: "操作", width: "180", prop: "actions", fixed: "right" },
];

export function createGroupToolbarActions(onCreate: () => void): Array<InTableAction<GroupRow>> {
  return [
    {
      key: "create",
      label: "创建组",
      kind: "quick",
      overflow: "never",
      priority: 50,
      permission: IamAction.PLATFORM_GROUP_CREATE,
      onSelect: () => onCreate(),
    },
  ];
}

export function createGroupRowActions(
  row: GroupRow,
  handlers: { onDetail: (row: GroupRow) => void; onDelete: (row: GroupRow) => void },
): Array<InTableAction<GroupRow>> {
  const detail = objectActionAllowed(row.capabilities, IamAction.PLATFORM_GROUP_READ);
  const remove = objectActionAllowed(row.capabilities, IamAction.PLATFORM_GROUP_DELETE);
  return [
    {
      key: "detail",
      label: "详情",
      kind: "detail",
      permission: IamAction.PLATFORM_GROUP_READ,
      disabled: !detail.allowed,
      disabledReason: detail.message,
      onSelect: handlers.onDetail,
    },
    {
      key: "delete",
      label: "删除",
      kind: "danger",
      permission: IamAction.PLATFORM_GROUP_DELETE,
      disabled: !remove.allowed,
      disabledReason: remove.message,
      onSelect: handlers.onDelete,
    },
  ];
}
