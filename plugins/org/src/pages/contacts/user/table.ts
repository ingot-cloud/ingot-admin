import type { InTableAction, TableHeaderRecord } from "@ingot/admin-core";
import type { UserPageItemVO } from "@/models";
import { getCommonStatusActionDesc, getCommonStatusToggle } from "@/models/enums";

export const ORG_USER_TABLE_ID = "org-contacts-user";
export const ORG_USER_SPLIT_KEY = "org-contacts-user";

export const tableHeaders: Array<TableHeaderRecord> = [
  {
    label: "姓名",
    prop: "avatar",
    required: true,
    minWidth: "200",
  },
  {
    label: "状态",
    prop: "status",
    width: "100",
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
    hide: true,
  },
  {
    label: "注册时间",
    prop: "createdAt",
    hide: true,
  },
  {
    label: "操作",
    width: "160",
    prop: "actions",
    fixed: "right",
  },
];

export function applyColumnSelection(
  headers: Array<TableHeaderRecord>,
  selected: string[],
): Array<TableHeaderRecord> {
  if (selected.length === 0) {
    return headers;
  }
  return headers.map((item) => {
    const locked =
      item.prop === "actions" ||
      item.type === "selection" ||
      item.required === true ||
      item.configurable === false;
    return {
      ...item,
      hide: locked ? false : !selected.includes(String(item.prop ?? "")),
    };
  });
}

export function createOrgUserToolbarActions(
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

export function createOrgUserRowActions(
  row: UserPageItemVO,
  handlers: {
    onDetail: (row: UserPageItemVO) => void;
    onToggleStatus: (row: UserPageItemVO) => void;
    onDelete: (row: UserPageItemVO) => void;
  },
): Array<InTableAction<UserPageItemVO>> {
  const canToggle = Boolean(row.userId && row.status);
  const next = row.status ? getCommonStatusToggle(row.status) : undefined;
  const actionDesc = next ? getCommonStatusActionDesc(next) : "切换状态";
  return [
    {
      key: "detail",
      label: "详情",
      kind: "detail",
      onSelect: handlers.onDetail,
    },
    {
      key: "toggle-status",
      label: actionDesc,
      kind: "quick",
      disabled: !canToggle,
      disabledReason: canToggle ? undefined : "缺少用户状态，无法切换",
      confirm: canToggle ? `是否${actionDesc}用户(${row.username})` : undefined,
      onSelect: handlers.onToggleStatus,
    },
    {
      key: "delete",
      label: "删除",
      kind: "danger",
      confirm: `是否删除用户(${row.username})`,
      onSelect: handlers.onDelete,
    },
  ];
}
