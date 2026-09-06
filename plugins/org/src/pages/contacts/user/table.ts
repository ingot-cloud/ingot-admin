import type { InPickerOption, InTableAction, TableHeaderRecord } from "@ingot/admin-core";
import type { UserPageItemVO } from "@/models";

export const ORG_USER_TABLE_ID = "org-contacts-user";
export const ORG_USER_SPLIT_KEY = "org-contacts-user";

export const accountStatusOptions: Array<InPickerOption> = [
  { value: "", label: "全部" },
  { value: true, label: "正常" },
  { value: false, label: "已暂停" },
];

export const resolveOrgUserEnabledFilter = (
  value: string | number | boolean | null,
): boolean | undefined => (typeof value === "boolean" ? value : undefined);

export const toOrgUserEnabledPickerValue = (enabled: boolean | undefined): string | boolean =>
  enabled ?? "";

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
    minWidth: "132",
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
    width: "140",
    prop: "actions",
    fixed: "right",
  },
];

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
    onToggleEnabled: (row: UserPageItemVO) => void;
    onDelete: (row: UserPageItemVO) => void;
  },
): Array<InTableAction<UserPageItemVO>> {
  const canToggle = Boolean(row.userId && typeof row.enabled === "boolean");
  const actionDesc = row.enabled ? "暂停账号" : "恢复账号";
  return [
    {
      key: "detail",
      label: "详情",
      kind: "detail",
      onSelect: handlers.onDetail,
    },
    {
      key: "toggle-enabled",
      label: actionDesc,
      kind: "default",
      disabled: !canToggle,
      disabledReason: canToggle ? undefined : "缺少账号可用状态，无法切换",
      confirm: canToggle ? `是否${actionDesc}(${row.username})` : undefined,
      onSelect: handlers.onToggleEnabled,
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
