import type { TableColumnCtx } from "element-plus/lib/components/table/src/table-column/defaults";

export interface TableAPI {
  clearSelection(): void;
  toggleRowSelection(row: any, selected?: boolean): void;
}

export type TransformItem<In, Out> = (value: In) => Out;

export interface TableHeaderRecord<In = any, Out = any> extends Partial<TableColumnCtx<any>> {
  hide?: boolean;
  transform?: TransformItem<In, Out>;
}

export interface TablePage {
  current?: number;
  size?: number;
  total?: number;
}
