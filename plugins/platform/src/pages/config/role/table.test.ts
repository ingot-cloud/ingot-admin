import { describe, expect, it } from "vitest";
import {
  createRoleRowActions,
  createRoleToolbarActions,
  ROLE_TABLE_ID,
  tableHeaders,
} from "./table";

const handlers = {
  onEdit: () => undefined,
  onAddChild: () => undefined,
};

describe("platform config role table contract", () => {
  it("提供稳定 tableId，名称列为必选", () => {
    expect(ROLE_TABLE_ID).toBe("platform-config-role");
    expect(tableHeaders.find((item) => item.prop === "name")?.required).toBe(true);
  });

  it("工具栏添加角色始终直出", () => {
    const actions = createRoleToolbarActions(() => undefined);
    expect(actions.map((item) => `${item.kind}:${item.key}`)).toEqual(["quick:create"]);
    expect(actions[0]?.overflow).toBe("never");
    expect(actions[0]?.icon).toBe("ep:plus");
  });

  it("行内展示编辑和添加子角色，200 行映射保持稳定", () => {
    const rows = Array.from({ length: 200 }, (_, index) => ({
      id: String(index + 1),
      name: `角色-${index + 1}`,
    }));
    const actions = createRoleRowActions(rows[0]!, handlers);
    expect(actions.map((item) => `${item.kind}:${item.key}`)).toEqual([
      "detail:edit",
      "quick:add-child",
    ]);
    expect(rows).toHaveLength(200);
    expect(createRoleRowActions(rows[199]!, handlers).map((item) => item.key)).toEqual([
      "edit",
      "add-child",
    ]);
  });
});
