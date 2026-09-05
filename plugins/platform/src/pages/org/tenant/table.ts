import type { InTableAction, TableHeaderRecord } from "@ingot/admin-core";
import type { SysTenant } from "@/models";
import { getCommonStatusActionDesc, getCommonStatusToggle } from "@/models/enums";

export const TENANT_TABLE_ID = "platform-org-tenant";

export const tableHeaders: Array<TableHeaderRecord> = [
  {
    label: "名称",
    prop: "name",
    required: true,
  },
  {
    label: "编码",
    prop: "code",
  },
  {
    label: "logo",
    prop: "avatar",
    hide: true,
  },
  {
    label: "组织类型",
    prop: "orgType",
  },
  {
    label: "状态",
    prop: "status",
  },
  {
    label: "到期时间",
    prop: "endAt",
  },
  {
    label: "创建时间",
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

export function createTenantToolbarActions(onCreate: () => void): Array<InTableAction<SysTenant>> {
  return [
    {
      key: "create",
      label: "添加组织",
      kind: "quick",
      overflow: "never",
      priority: 50,
      onSelect: () => onCreate(),
    },
  ];
}

export function createTenantRowActions(
  row: SysTenant,
  handlers: {
    onDetail: (row: SysTenant) => void;
    onToggleStatus: (row: SysTenant) => void;
  },
): Array<InTableAction<SysTenant>> {
  const canToggle = Boolean(row.id && row.status);
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
      disabledReason: canToggle ? undefined : "缺少组织状态，无法切换",
      confirm: canToggle ? `是否${actionDesc}组织(${row.name})` : undefined,
      onSelect: handlers.onToggleStatus,
    },
  ];
}
