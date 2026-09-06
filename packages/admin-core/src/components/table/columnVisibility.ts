import type { TableHeaderRecord } from "./types";

/** 容纳 InCommonStatusTag「已暂停」（约 72px）+ 单元格内边距，避免被表头字宽挤没。 */
export const IN_TABLE_STATUS_MIN_WIDTH = 132;

export type ColumnSettingPreference = {
  selected: string[];
  order: string[];
};

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

export const canReorderTableHeader = (item: TableHeaderRecord): boolean => {
  return item.type !== "selection" && item.prop !== "actions";
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

export const normalizeColumnSettingPreference = (
  raw: unknown,
  fallback: ColumnSettingPreference,
): ColumnSettingPreference => {
  if (Array.isArray(raw) && raw.every((item) => typeof item === "string")) {
    return { selected: raw, order: fallback.order };
  }
  if (!raw || typeof raw !== "object") {
    return fallback;
  }
  const value = raw as { selected?: unknown; order?: unknown };
  const selected = Array.isArray(value.selected)
    ? value.selected.filter((item): item is string => typeof item === "string")
    : fallback.selected;
  const order = Array.isArray(value.order)
    ? value.order.filter((item): item is string => typeof item === "string")
    : fallback.order;
  return { selected, order };
};

export const applyColumnSelection = (
  headers: Array<TableHeaderRecord>,
  selected: string[],
): Array<TableHeaderRecord> => {
  if (selected.length === 0) {
    return headers;
  }
  const selectedSet = new Set(selected);
  const originalIndex = new Map(
    headers.map((item, index) => [String(item.prop ?? ""), index]),
  );
  const pinLeft: Array<TableHeaderRecord> = [];
  const pinRight: Array<TableHeaderRecord> = [];
  const middle: Array<TableHeaderRecord> = [];
  for (const item of headers) {
    const next = {
      ...item,
      hide: isTableHeaderLocked(item) ? false : !selectedSet.has(String(item.prop ?? "")),
    };
    if (item.type === "selection") {
      pinLeft.push(next);
    } else if (item.prop === "actions") {
      pinRight.push(next);
    } else {
      middle.push(next);
    }
  }
  middle.sort((left, right) => {
    const leftProp = String(left.prop ?? "");
    const rightProp = String(right.prop ?? "");
    const leftSelected = selected.indexOf(leftProp);
    const rightSelected = selected.indexOf(rightProp);
    if (leftSelected === -1 && rightSelected === -1) {
      return (originalIndex.get(leftProp) ?? 0) - (originalIndex.get(rightProp) ?? 0);
    }
    if (leftSelected === -1) {
      return 1;
    }
    if (rightSelected === -1) {
      return -1;
    }
    return leftSelected - rightSelected;
  });
  return [...pinLeft, ...middle, ...pinRight];
};

export const visibleHeaderProps = (
  headers: TableHeaderRecord[],
  selected: string[],
): TableHeaderRecord[] => {
  const source = selected.length > 0 ? applyColumnSelection(headers, selected) : headers;
  const selectedSet = new Set(selected);
  return source
    .filter((item) => {
      const prop = String(item.prop ?? "");
      if (isTableHeaderLocked(item)) {
        return true;
      }
      if (selected.length === 0) {
        return !item.hide;
      }
      return selectedSet.has(prop);
    })
    .map(withTableHeaderDefaults);
};
