import type { TableColumnCtx } from "element-plus";

export interface TableAPI<Row = unknown> {
  clearSelection(): void;
  toggleRowSelection(row: Row, selected?: boolean): void;
}

export interface TableSlotScope<Row = unknown> {
  item: Row;
  index: number;
}

export type InTableSlots<Row = unknown> = {
  [name: string]: ((scope: TableSlotScope<Row>) => unknown) | undefined;
  title?: () => unknown;
  subtitle?: () => unknown;
  toolbar?: () => unknown;
};

export type TransformItem<In, Out> = {
  bivarianceHack(value: In): Out;
}["bivarianceHack"];

export interface TableHeaderRecord<In = unknown, Out = unknown> extends Partial<TableColumnCtx> {
  hide?: boolean;
  transform?: TransformItem<In, Out>;
}

export interface TablePage {
  current?: number;
  size?: number;
  total?: number;
}
