import type { InTableAction, TableHeaderRecord } from "@ingot/admin-core";
import {
  IamAction,
  type GroupEffectiveMemberRecord,
  type GroupRecord,
  type ResourceDetail,
} from "@ingot/admin-common";

export const GROUP_SPLIT_KEY = "org-iam-groups";
export const GROUP_MEMBER_TABLE_ID = "org-iam-group-members";
export type GroupRow = ResourceDetail<GroupRecord>;
export type GroupMemberRow = GroupEffectiveMemberRecord;

export const tableHeaders: Array<TableHeaderRecord> = [
  { label: "姓名", prop: "displayName", required: true, minWidth: "200" },
  { label: "账号状态", prop: "status", minWidth: "120" },
  { label: "手机号", prop: "phone", minWidth: "140" },
  { label: "部门", prop: "departments", minWidth: "160" },
  { label: "来源", prop: "membership", minWidth: "180" },
  { label: "操作", width: "100", prop: "actions", fixed: "right" },
];

export function createMemberToolbarActions(
  onAdd: () => void,
  canUpdate: boolean,
  updateMessage?: string,
): Array<InTableAction<GroupMemberRow>> {
  return [
    {
      key: "add",
      label: "添加成员",
      kind: "quick",
      overflow: "never",
      priority: 50,
      permission: IamAction.TENANT_GROUP_UPDATE,
      disabled: !canUpdate,
      disabledReason: updateMessage,
      onSelect: () => onAdd(),
    },
  ];
}
