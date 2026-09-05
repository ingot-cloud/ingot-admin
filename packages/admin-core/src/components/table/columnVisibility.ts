import type { TableHeaderRecord } from "./types";

/** 容纳 InCommonStatusTag「已锁定」（约 72px）+ 单元格内边距，避免被表头字宽挤没。 */
export const IN_TABLE_STATUS_MIN_WIDTH = 132;

export const isTableHeaderLocked = (item: TableHeaderRecord): boolean => {
  if (item.required === true) {
    return true;
  }
  if (item.configurable === false) {
    return true;
  }
  if (item.type === "selection") {
    return true;
  }
  return item.prop === "actions";
};

export const withTableHeaderDefaults = (item: TableHeaderRecord): TableHeaderRecord => {
  const next: TableHeaderRecord = { ...item };
  if (item.type === "selection" && item.fixed === undefined) {
    next.fixed = "left";
  }
  if (item.prop === "actions" && item.fixed === undefined) {
    next.fixed = "right";
  }
  if (item.prop === "status") {
    const minWidth = Math.max(Number(item.minWidth ?? 0), IN_TABLE_STATUS_MIN_WIDTH);
    next.minWidth = minWidth;
    if (item.width != null && Number(item.width) < minWidth) {
      next.width = minWidth;
    }
  }
  return next;
};

export const visibleHeaderProps = (
  headers: TableHeaderRecord[],
  selected: string[],
): TableHeaderRecord[] => {
  const selectedSet = new Set(selected);
  return headers
    .filter((item) => {
      const prop = String(item.prop ?? "");
      if (isTableHeaderLocked(item)) {
        return true;
      }
      return selectedSet.has(prop);
    })
    .map(withTableHeaderDefaults);
};
