import type { InTableAction, TableHeaderRecord } from "@ingot/admin-core";
import { IamAction, type MemberRecord, type ResourceDetail } from "@ingot/admin-common";

export const GROUP_MEMBER_TABLE_ID = "platform-iam-personnel-group-members";
export const GROUP_SPLIT_KEY = "platform-iam-personnel-groups";
export type GroupMemberRow = ResourceDetail<MemberRecord>;

export const groupMemberHeaders: Array<TableHeaderRecord> = [
  { label: "名称", prop: "displayName", required: true, minWidth: "200" },
  { label: "手机号", prop: "phone", minWidth: "140" },
  { label: "登录账号", prop: "username", required: true, minWidth: "140" },
  { label: "状态", prop: "status" },
  { label: "操作", width: "120", prop: "actions", fixed: "right" },
];

export function createGroupMemberToolbarActions(
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
      permission: IamAction.PLATFORM_GROUP_UPDATE,
      disabled: !canUpdate,
      disabledReason: updateMessage,
      onSelect: () => onAdd(),
    },
  ];
}
