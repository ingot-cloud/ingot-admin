import { describe, expect, it } from "vitest";
import { resolveDeptNames } from "./deptNames";

describe("resolveDeptNames", () => {
  it("按树解析部门名称，找不到则回退 id", () => {
    const names = resolveDeptNames(["2", "9"], [
      {
        id: "1",
        name: "英格特云",
        children: [{ id: "2", name: "产品部" }],
      },
    ]);
    expect(names).toEqual(["产品部", "9"]);
  });
});
