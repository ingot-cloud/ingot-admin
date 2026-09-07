import type { InTableAction, TableHeaderRecord } from "@ingot/admin-core";
import type { PlatformDict } from "@/models";
import { CommonStatus } from "@/models/enums";

export const DICT_TABLE_ID = "platform-config-dict";
export const DICT_SPLIT_KEY = "platform-config-dict";

export const tableHeaders: Array<TableHeaderRecord> = [
  {
    label: "字典值",
    prop: "value",
    minWidth: "120",
    transform: (v) => v ?? "-",
  },
  {
    label: "展示文本",
    prop: "label",
    minWidth: "140",
    transform: (v) => v ?? "-",
  },
  {
    label: "字典编码",
    prop: "code",
    minWidth: "180",
  },
  {
    label: "名称",
    prop: "name",
    minWidth: "160",
    required: true,
  },
  {
    label: "作用域",
    prop: "scopeType",
    width: "120",
  },
  {
    label: "排序",
    prop: "sort",
    width: "80",
    hide: true
  },
  {
    label: "标记",
    prop: "systemFlag",
    width: "120",
  },
  {
    label: "状态",
    prop: "status",
    minWidth: "132",
  },
  {
    label: "备注",
    prop: "remark",
    minWidth: "180",
    transform: (v) => v || "-",
    hide: true,
  },
  {
    label: "更新时间",
    prop: "updatedAt",
    width: "170",
    hide: true,
  },
  {
    label: "操作",
    width: "160",
    prop: "actions",
    fixed: "right",
  },
];

export function createDictToolbarActions(
  handlers: {
    onCreateType: () => void;
    onCreateItem: () => void;
  },
  options?: {
    typeDisabled?: boolean;
    typeDisabledReason?: string;
    itemDisabled?: boolean;
  },
): Array<InTableAction<PlatformDict>> {
  const typeDisabled = Boolean(options?.typeDisabled);
  const itemDisabled = Boolean(options?.itemDisabled);
  return [
    {
      key: "create-type",
      label: "新建字典类型",
      kind: "primary",
      icon: "ep:plus",
      overflow: "never",
      priority: 40,
      disabled: typeDisabled,
      disabledReason: typeDisabled ? options?.typeDisabledReason : undefined,
      onSelect: handlers.onCreateType,
    },
    {
      key: "create-item",
      label: "新建字典项",
      kind: "quick",
      icon: "ep:plus",
      overflow: "never",
      priority: 50,
      disabled: itemDisabled,
      disabledReason: itemDisabled ? "请先选择字典类型" : undefined,
      onSelect: handlers.onCreateItem,
    },
  ];
}

export function createDictItemRowActions(
  row: PlatformDict,
  handlers: {
    onDetail: (row: PlatformDict) => void;
    onToggleStatus: (row: PlatformDict) => void;
    onDelete: (row: PlatformDict) => void;
  },
): Array<InTableAction<PlatformDict>> {
  const canToggle = Boolean(row.id && row.status);
  const next = row.status === CommonStatus.Enable ? CommonStatus.Lock : CommonStatus.Enable;
  const action = next === CommonStatus.Enable ? "启用" : "禁用";
  const displayName = row.label || row.name;
  const isSystem = Boolean(row.systemFlag);
  return [
    {
      key: "detail",
      label: "编辑",
      kind: "detail",
      onSelect: handlers.onDetail,
    },
    {
      key: "toggle-status",
      label: action,
      kind: "default",
      disabled: !canToggle,
      disabledReason: canToggle ? undefined : "缺少字典状态，无法切换",
      confirm: canToggle ? `是否${action}字典(${displayName})` : undefined,
      onSelect: handlers.onToggleStatus,
    },
    {
      key: "delete",
      label: "删除",
      kind: "danger",
      disabled: isSystem,
      disabledReason: isSystem ? "内置字典不允许该操作" : undefined,
      confirm: isSystem ? undefined : `是否删除字典项(${displayName})`,
      onSelect: handlers.onDelete,
    },
  ];
}
