import type { InTableAction, TableHeaderRecord } from "@ingot/admin-core";
import type { SysSocialDetails } from "@/models";
import {
  getCommonStatusActionDesc,
  getCommonStatusToggle,
  useSocialTypeEnumsEnum,
} from "@/models/enums";

export const SOCIAL_TABLE_ID = "platform-develop-social";

export const tableHeaders: Array<TableHeaderRecord> = [
  {
    label: "序号",
    type: "index",
    width: "80",
  },
  {
    label: "App ID",
    prop: "appId",
  },
  {
    label: "App Secret",
    prop: "appSecret",
  },
  {
    label: "社交名称",
    prop: "name",
    required: true,
  },
  {
    label: "类型",
    prop: "type",
    transform: (value: unknown) => useSocialTypeEnumsEnum().getTagText(String(value)).text,
  },
  {
    label: "重定向地址",
    prop: "redirectUrl",
    transform: (value: unknown) => (value ? String(value) : "无"),
  },
  {
    label: "状态",
    prop: "status",
    minWidth: "132",
  },
  {
    label: "创建时间",
    prop: "createdAt",
    hide: true,
  },
  {
    label: "创建时间",
    prop: "updatedAt",
    hide: true,
  },
  {
    label: "操作",
    width: "140",
    prop: "actions",
    fixed: "right",
  },
];

export function createSocialToolbarActions(
  onCreate: () => void,
): Array<InTableAction<SysSocialDetails>> {
  return [
    {
      key: "create",
      label: "添加配置",
      kind: "quick",
      icon: "ep:plus",
      overflow: "never",
      priority: 50,
      onSelect: () => onCreate(),
    },
  ];
}

export function createSocialRowActions(
  row: SysSocialDetails,
  handlers: {
    onEdit: (row: SysSocialDetails) => void;
    onToggleStatus: (row: SysSocialDetails) => void;
    onRemove: (row: SysSocialDetails) => void;
  },
): Array<InTableAction<SysSocialDetails>> {
  const canToggle = Boolean(row.id && row.status);
  const next = row.status ? getCommonStatusToggle(row.status) : undefined;
  const actionDesc = next ? getCommonStatusActionDesc(next) : "切换状态";
  return [
    {
      key: "edit",
      label: "编辑",
      kind: "detail",
      onSelect: handlers.onEdit,
    },
    {
      key: "toggle-status",
      label: actionDesc,
      kind: "default",
      disabled: !canToggle,
      disabledReason: canToggle ? undefined : "缺少社交状态，无法切换",
      confirm: canToggle ? `是否${actionDesc}社交信息(${row.name})` : undefined,
      onSelect: handlers.onToggleStatus,
    },
    {
      key: "remove",
      label: "删除",
      kind: "danger",
      confirm: `是否删除社交信息(${row.name})`,
      onSelect: handlers.onRemove,
    },
  ];
}
