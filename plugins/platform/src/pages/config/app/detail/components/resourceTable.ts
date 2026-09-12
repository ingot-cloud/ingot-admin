import type { InTableAction, TableHeaderRecord } from "@ingot/admin-core";
import type { PlatformResource } from "@/models";
import { getCommonStatusActionDesc, getCommonStatusToggle } from "@/models/enums";

export const RESOURCE_TABLE_ID = "platform-config-app-detail-resource";

export const resourceTableHeaders: Array<TableHeaderRecord> = [
  {
    label: "资源编码",
    prop: "code",
    minWidth: "180",
    required: true,
  },
  {
    label: "名称",
    prop: "name",
    minWidth: "160",
  },
  {
    label: "状态",
    prop: "status",
    width: "100",
  },
  {
    label: "操作",
    width: "180",
    prop: "actions",
    fixed: "right",
  },
];

export function createResourceToolbarActions(
  onCreate: () => void,
): Array<InTableAction<PlatformResource>> {
  return [
    {
      key: "create",
      label: "添加资源",
      kind: "quick",
      overflow: "never",
      priority: 50,
      onSelect: () => onCreate(),
    },
  ];
}

export function createResourceRowActions(
  row: PlatformResource,
  handlers: {
    onDetail: (row: PlatformResource) => void;
    onToggleStatus: (row: PlatformResource) => void;
    onRemove: (row: PlatformResource) => void;
  },
): Array<InTableAction<PlatformResource>> {
  const next = row.status ? getCommonStatusToggle(row.status) : undefined;
  const actionDesc = next ? getCommonStatusActionDesc(next) : "切换状态";
  return [
    {
      key: "detail",
      label: "编辑",
      kind: "detail",
      onSelect: handlers.onDetail,
    },
    {
      key: "toggle-status",
      label: actionDesc,
      kind: "default",
      confirm: `是否${actionDesc}资源(${row.name})`,
      onSelect: handlers.onToggleStatus,
    },
    {
      key: "remove",
      label: "删除",
      kind: "danger",
      confirm: `是否删除资源(${row.name})？仍被权限或数据规则引用时无法删除。`,
      onSelect: handlers.onRemove,
    },
  ];
}
