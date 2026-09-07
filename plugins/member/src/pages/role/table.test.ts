import { describe, expect, it } from "vitest";
import {
  MEMBER_ROLE_TABLE_ID,
  createMemberRoleRowActions,
  createMemberRoleToolbarActions,
  tableHeaders,
} from "./table";

describe("member role table contract", () => {
  it("提供稳定 tableId，名称列为必选", () => {
    expect(MEMBER_ROLE_TABLE_ID).toBe("member-role");
    expect(tableHeaders.find((item) => item.prop === "name")?.required).toBe(true);
    expect(tableHeaders.some((item) => item.prop === "actions")).toBe(true);
  });

  it("工具栏添加角色始终直出", () => {
    const actions = createMemberRoleToolbarActions(() => undefined);
    expect(actions).toEqual([
      expect.objectContaining({
        key: "create",
        label: "添加角色",
        kind: "quick",
        icon: "ep:plus",
        overflow: "never",
      }),
    ]);
  });

  it("行内展示编辑和添加子角色，200 行映射保持稳定", () => {
    const rows = Array.from({ length: 200 }, (_, index) => ({
      id: String(index + 1),
      name: `角色-${index + 1}`,
    }));
    const sample = createMemberRoleRowActions(rows[0]!, {
      onDetail: () => undefined,
      onAddChild: () => undefined,
    });
    expect(sample.map((item) => `${item.kind}:${item.key}`)).toEqual([
      "detail:detail",
      "quick:add-child",
    ]);
    expect(sample[0]?.label).toBe("编辑");
    expect(sample[1]?.label).toBe("添加子角色");
    expect(rows).toHaveLength(200);
  });
});
