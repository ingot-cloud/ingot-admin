import type { TableHeaderRecord } from "./types";

const CONTROL_COLUMN_TYPES = new Set(["selection", "index", "expand"]);

const isSelectionColumn = (item: TableHeaderRecord): boolean => item.type === "selection";

const isContentColumn = (item: TableHeaderRecord): boolean =>
  !CONTROL_COLUMN_TYPES.has(item.type ?? "default");

/** 多选列并入的第一列业务列；没有可并入的列时为空。 */
export const selectionLeadColumn = (
  headers: Array<TableHeaderRecord>,
): TableHeaderRecord | undefined => {
  if (!headers.some(isSelectionColumn)) {
    return undefined;
  }
  return (
    headers.find(isContentColumn) ?? headers.find((item) => !isSelectionColumn(item))
  );
};

/** 去掉独立多选列，并把勾选固定到第一列业务列上。 */
export const columnsWithSelectionMerged = (
  headers: Array<TableHeaderRecord>,
): Array<TableHeaderRecord> => {
  const lead = selectionLeadColumn(headers);
  if (!lead) {
    return headers;
  }
  return headers
    .filter((item) => !isSelectionColumn(item))
    .map((item) => {
      if (item !== lead || (item.fixed != null && item.fixed !== false)) {
        return item;
      }
      return { ...item, fixed: "left" };
    });
};
