import type { InTableAction, TableHeaderRecord } from "@ingot/admin-core";
import type { BizLeafAlloc } from "@/models";

export const ID_TABLE_ID = "platform-develop-id";

export const tableHeaders: Array<TableHeaderRecord> = [
  {
    label: "业务标签",
    prop: "bizTag",
    required: true,
  },
  {
    label: "当前最大ID",
    prop: "maxId",
  },
  {
    label: "ID步长",
    prop: "step",
  },
  {
    label: "描述",
    prop: "description",
  },
  {
    label: "更新时间",
    prop: "updateTime",
  },
  {
    label: "操作",
    width: "140",
    prop: "actions",
    fixed: "right",
  },
];

export function createIdToolbarActions(onCreate: () => void): Array<InTableAction<BizLeafAlloc>> {
  return [
    {
      key: "create",
      label: "添加业务ID",
      kind: "quick",
      icon: "ep:plus",
      overflow: "never",
      priority: 50,
      onSelect: () => onCreate(),
    },
  ];
}

export function createIdRowActions(
  _row: BizLeafAlloc,
  handlers: {
    onEdit: (row: BizLeafAlloc) => void;
  },
): Array<InTableAction<BizLeafAlloc>> {
  return [
    {
      key: "edit",
      label: "编辑",
      kind: "detail",
      onSelect: handlers.onEdit,
    },
  ];
}
