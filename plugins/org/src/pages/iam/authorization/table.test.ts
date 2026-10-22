import { RoleKind } from "@ingot/admin-common";
import { describe, expect, it, vi } from "vitest";
import { createRoleRowActions, emptyRoleRow, SYSTEM_ROLE_TAG } from "./table";

const handlers = { onDetail: vi.fn(), onDelete: vi.fn() };

describe("tenant role row actions", () => {
  it("详情放进操作菜单，系统角色不能删除", () => {
    const shared = {
      ...emptyRoleRow,
      record: { ...emptyRoleRow.record, kind: RoleKind.SHARED, name: "组织管理员" },
    };
    const actions = createRoleRowActions(shared, handlers);
    expect(SYSTEM_ROLE_TAG).toEqual({ text: "系统角色", tag: "primary" });
    expect(actions.map((item) => item.key)).toEqual(["detail"]);
    expect(actions[0]?.kind).toBe("default");
  });

  it("组织自建角色可以删除", () => {
    const actions = createRoleRowActions(emptyRoleRow, handlers);
    expect(actions.map((item) => item.key)).toEqual(["detail", "delete"]);
  });
});
