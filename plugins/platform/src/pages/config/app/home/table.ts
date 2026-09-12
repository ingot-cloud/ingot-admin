import type { InPickerOption, InTableAction, TableHeaderRecord } from "@ingot/admin-core";
import type { PlatformApp } from "@/models";
import {
  AppTypeEnum,
  CommonStatus,
  getCommonStatusActionDesc,
  getCommonStatusToggle,
} from "@/models/enums";

export const APP_HOME_TABLE_ID = "platform-config-app-home";

export const appTypeFilterOptions: Array<InPickerOption> = [
  { value: "", label: "全部" },
  { value: AppTypeEnum.Platform, label: "平台" },
  { value: AppTypeEnum.Tenant, label: "租户" },
];

export const appStatusFilterOptions: Array<InPickerOption> = [
  { value: "", label: "全部" },
  { value: CommonStatus.Enable, label: "正常" },
  { value: CommonStatus.Lock, label: "锁定" },
];

export const tableHeaders: Array<TableHeaderRecord> = [
  {
    label: "应用名称",
    prop: "name",
    required: true,
  },
  {
    label: "应用编码",
    prop: "code",
    width: "180",
  },
  {
    label: "类型",
    prop: "appType",
    width: "100",
  },
  {
    label: "默认访问",
    prop: "defaultAccessMode",
    width: "110",
  },
  {
    label: "排序",
    prop: "sort",
    width: "80",
    hide: true,
  },
  {
    label: "状态",
    prop: "status",
    width: "80",
  },
  {
    label: "应用描述",
    prop: "intro",
    minWidth: "180",
    transform: (v: unknown) => (v ? String(v) : "-"),
  },
  {
    label: "操作",
    width: "140",
    prop: "actions",
    fixed: "right",
  },
];

export function createAppHomeToolbarActions(
  onCreate: () => void,
): Array<InTableAction<PlatformApp>> {
  return [
    {
      key: "create",
      label: "添加应用",
      kind: "quick",
      icon: "ep:plus",
      overflow: "never",
      priority: 50,
      onSelect: () => onCreate(),
    },
  ];
}

export function createAppHomeRowActions(
  row: PlatformApp,
  handlers: {
    onDetail: (row: PlatformApp) => void;
    onToggleStatus: (row: PlatformApp) => void;
    onRemove: (row: PlatformApp) => void;
  },
): Array<InTableAction<PlatformApp>> {
  const canToggle = Boolean(
    row.id && (row.status === CommonStatus.Enable || row.status === CommonStatus.Lock),
  );
  const next =
    canToggle && row.status ? getCommonStatusToggle(row.status as CommonStatus) : undefined;
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
      kind: "default",
      disabled: !canToggle,
      disabledReason: canToggle ? undefined : "缺少应用状态，无法切换",
      confirm: canToggle ? `是否${actionDesc}应用(${row.name})` : undefined,
      onSelect: handlers.onToggleStatus,
    },
    {
      key: "remove",
      label: "删除",
      kind: "danger",
      confirm: `是否删除应用(${row.name})?`,
      onSelect: handlers.onRemove,
    },
  ];
}
