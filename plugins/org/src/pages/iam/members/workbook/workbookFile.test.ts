import { describe, expect, it } from "vitest";
import { isWorkbookFile } from "./workbookFile";

describe("workbookFile", () => {
  it("只接受 xlsx 扩展名", () => {
    expect(isWorkbookFile(new File([], "members.xlsx"))).toBe(true);
    expect(isWorkbookFile(new File([], "members.XLSX"))).toBe(true);
    expect(isWorkbookFile(new File([], "members.csv"))).toBe(false);
  });
});
