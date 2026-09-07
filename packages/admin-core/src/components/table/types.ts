import type { TableColumnCtx } from "element-plus";
import type { InTableCheckboxMode } from "./checkboxMode";

export type { InTableCheckboxMode, InTableCheckboxSpec, InTableRowPredicate } from "./checkboxMode";

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
  summary?: () => unknown;
  /** @deprecated 兼容期映射到 tools-start */
  toolbar?: () => unknown;
  "tools-start"?: () => unknown;
  "tools-end"?: () => unknown;
  empty?: () => unknown;
  error?: () => unknown;
  unauthorized?: () => unknown;
};

export type TransformItem<In, Out> = {
  bivarianceHack(value: In): Out;
}["bivarianceHack"];

export interface TableHeaderRecord<In = unknown, Out = unknown> extends Partial<TableColumnCtx> {
  hide?: boolean;
  required?: boolean;
  configurable?: boolean;
  transform?: TransformItem<In, Out>;
  /** selection 列表头勾选：on 显示、off 不显示、disabled 显示但禁用。布尔值映射 on/off；默认 off。 */
  headerCheckbox?: boolean | InTableCheckboxMode;
}

export interface TablePage {
  current?: number;
  size?: number;
  total?: number;
}
