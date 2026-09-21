import { describe, expect, it } from "vitest";
import { SelectionPurpose } from "../../models/iam/constants";
import { createIamListLoader, createIamOptionLoader } from "./option-loader";

describe("createIamOptionLoader", () => {
  it("把远程分页 query 和 purpose 传给列表接口", async () => {
    const calls: unknown[] = [];
    const loader = createIamOptionLoader(async (page, condition) => {
      calls.push({ page, condition });
      return { data: { current: page.current, size: page.size, total: 1, records: [{ id: "1" }] } };
    }, SelectionPurpose.ASSIGN_RECIPIENT);

    await expect(loader({ current: 2, size: 20, query: "张" })).resolves.toEqual({
      current: 2,
      size: 20,
      total: 1,
      records: [{ id: "1" }],
    });
    expect(calls).toEqual([
      {
        page: { current: 2, size: 20 },
        condition: { purpose: SelectionPurpose.ASSIGN_RECIPIENT, keyword: "张" },
      },
    ]);
  });
});

describe("createIamListLoader", () => {
  it("按名称远程分页，不伪造 purpose", async () => {
    const calls: unknown[] = [];
    const loader = createIamListLoader(async (page, condition) => {
      calls.push({ page, condition });
      return { data: { current: page.current, size: page.size, total: 1, records: [{ id: "a1" }] } };
    });

    await expect(loader({ current: 1, query: "套餐" })).resolves.toEqual({
      current: 1,
      size: 20,
      total: 1,
      records: [{ id: "a1" }],
    });
    expect(calls).toEqual([
      {
        page: { current: 1, size: 20 },
        condition: { name: "套餐" },
      },
    ]);
  });
});
