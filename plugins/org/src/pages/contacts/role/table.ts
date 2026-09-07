import type { InTableAction, TableHeaderRecord } from "@ingot/admin-core";
import type { UserPageItemVO } from "@/models";

export const ORG_ROLE_TABLE_ID = "org-contacts-role";
export const ORG_ROLE_SPLIT_KEY = "org-contacts-role";

export const tableHeaders: Array<TableHeaderRecord> = [
  {
    label: "名称",
    prop: "avatar",
    required: true,
  },
  {
    label: "手机号",
    prop: "phone",
  },
  {
    label: "email",
    prop: "email",
    transform: (v) => v || "-",
  },
  {
    label: "操作",
    width: "100",
    prop: "actions",
    fixed: "right",
  },
];

export function createOrgRoleToolbarActions(
  onCreate: () => void,
): Array<InTableAction<UserPageItemVO>> {
  return [
    {
      key: "create",
      label: "添加成员",
      kind: "quick",
      overflow: "never",
      priority: 50,
      onSelect: () => onCreate(),
    },
  ];
}

export function createOrgRoleRowActions(
  row: UserPageItemVO,
  roleName: string,
  handlers: {
    onDelete: (row: UserPageItemVO) => void;
  },
): Array<InTableAction<UserPageItemVO>> {
  return [
    {
      key: "delete",
      label: "删除",
      kind: "danger",
      confirm: `是否将成员(${row.nickname})移除角色(${roleName})`,
      onSelect: handlers.onDelete,
    },
  ];
}
