import { describe, expect, it } from "vitest";
import { columnsWithSelectionMerged, selectionLeadColumn } from "./selectionColumn";
import type { TableHeaderRecord } from "./types";

const selection: TableHeaderRecord = { type: "selection", prop: "selection", width: "48" };

describe("selectionColumn", () => {
  it("把多选并入第一列业务列并固定在左侧", () => {
    const name: TableHeaderRecord = { prop: "displayName", label: "姓名", minWidth: "200" };
    const status: TableHeaderRecord = { prop: "status", label: "状态" };
    const headers = [selection, name, status];
    expect(selectionLeadColumn(headers)).toBe(name);
    expect(columnsWithSelectionMerged(headers).map((item) => item.prop)).toEqual([
      "displayName",
      "status",
    ]);
    expect(columnsWithSelectionMerged(headers)[0]?.fixed).toBe("left");
  });

  it("跳过序号和展开列，保留业务列已有的固定方向", () => {
    const name: TableHeaderRecord = { prop: "name", label: "名称", fixed: "right" };
    const headers: Array<TableHeaderRecord> = [
      selection,
      { type: "index", prop: "index", label: "序号" },
      { type: "expand", prop: "detail" },
      name,
    ];
    expect(selectionLeadColumn(headers)?.prop).toBe("name");
    const merged = columnsWithSelectionMerged(headers);
    expect(merged.map((item) => item.prop)).toEqual(["index", "detail", "name"]);
    expect(merged[2]?.fixed).toBe("right");
  });

  it("没有业务列时保持独立多选列", () => {
    expect(columnsWithSelectionMerged([selection])).toEqual([selection]);
  });

  it("没有多选列时不改表头", () => {
    const headers: Array<TableHeaderRecord> = [{ prop: "name", label: "名称", fixed: "left" }];
    expect(selectionLeadColumn(headers)).toBeUndefined();
    expect(columnsWithSelectionMerged(headers)).toBe(headers);
  });
});