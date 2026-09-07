import { describe, expect, it } from "vitest";
import {
  createOrgRoleRowActions,
  createOrgRoleToolbarActions,
  ORG_ROLE_SPLIT_KEY,
  ORG_ROLE_TABLE_ID,
  tableHeaders,
} from "./table";

const row = (
  overrides: Partial<{
    userId: string;
    username: string;
    nickname: string;
    createdAt: string;
  }> = {},
) => ({
  userId: "1",
  username: "user-1",
  nickname: "张三",
  createdAt: "2026-01-01",
  ...overrides,
});

describe("org contacts role table contract", () => {
  it("提供稳定 tableId 与双栏持久化键", () => {
    expect(ORG_ROLE_TABLE_ID).toBe("org-contacts-role");
    expect(ORG_ROLE_SPLIT_KEY).toBe("org-contacts-role");
    expect(tableHeaders.find((item) => item.prop === "avatar")?.required).toBe(true);
  });

  it("工具栏添加成员始终直出", () => {
    const actions = createOrgRoleToolbarActions(() => undefined);
    expect(actions.map((item) => `${item.kind}:${item.key}`)).toEqual(["quick:create"]);
    expect(actions[0]?.overflow).toBe("never");
    expect(actions[0]?.label).toBe("添加成员");
  });

  it("行内删除需当前角色名，200 行映射稳定", () => {
    const rows = Array.from({ length: 200 }, (_, index) =>
      row({
        userId: String(index + 1),
        username: `user-${index + 1}`,
        nickname: `成员-${index + 1}`,
      }),
    );
    const actions = createOrgRoleRowActions(rows[0]!, "管理员", {
      onDelete: () => undefined,
    });
    expect(actions.map((item) => `${item.kind}:${item.key}`)).toEqual(["danger:delete"]);
    expect(actions[0]?.confirm).toBe("是否将成员(成员-1)移除角色(管理员)");
    expect(rows).toHaveLength(200);
  });
});
