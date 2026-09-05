import type { TableHeaderRecord } from "./types";

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
  if (item.type === "selection" && item.fixed === undefined) {
    return { ...item, fixed: "left" };
  }
  if (item.prop === "actions" && item.fixed === undefined) {
    return { ...item, fixed: "right" };
  }
  return item;
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
