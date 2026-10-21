import { describe, expect, it } from "vitest";
import { isWorkbookFile } from "./workbookFile";

describe("department workbookFile", () => {
  it("只接受 xlsx 扩展名", () => {
    expect(isWorkbookFile(new File([], "departments.xlsx"))).toBe(true);
    expect(isWorkbookFile(new File([], "departments.XLSX"))).toBe(true);
    expect(isWorkbookFile(new File([], "departments.csv"))).toBe(false);
  });
});
