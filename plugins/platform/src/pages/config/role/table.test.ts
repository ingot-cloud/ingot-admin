import { describe, expect, it, vi } from "vitest";
import {
  createRoleRowActions,
  createRoleToolbarActions,
  ROLE_TABLE_ID,
  tableHeaders,
} from "./table";

vi.mock("@/models/enums", () => ({
  RoleTypeEnums: { ROLE: "0", GROUP: "1" },
}));

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
    expect(createRoleRowActions(rows[199]!, handlers).map((item) => item.key)).toEqual([
      "edit",
      "add-child",
    ]);
    expect(rows).toHaveLength(200);
  });

  it("角色行可配置数据范围，角色组不展示", () => {
    const roleActions = createRoleRowActions(
      { id: "1", name: "角色", type: "0" },
      { ...handlers, onDataRules: () => undefined },
    );
    expect(roleActions.map((item) => item.key)).toEqual(["edit", "add-child", "data-rules"]);
    const groupActions = createRoleRowActions(
      { id: "2", name: "分组", type: "1" },
      { ...handlers, onDataRules: () => undefined },
    );
    expect(groupActions.map((item) => item.key)).toEqual(["edit", "add-child"]);
  });
});
