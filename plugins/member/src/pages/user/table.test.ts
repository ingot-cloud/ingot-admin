import { describe, expect, it } from "vitest";
import {
  MEMBER_USER_TABLE_ID,
  createMemberUserRowActions,
  createMemberUserToolbarActions,
  tableHeaders,
} from "./table";

const handlers = {
  onDetail: () => undefined,
  onToggleEnabled: () => undefined,
  onLock: () => undefined,
  onResetPassword: () => undefined,
};

describe("member user table contract", () => {
  it("提供稳定 tableId，用户和状态列为必选", () => {
    expect(MEMBER_USER_TABLE_ID).toBe("member-user");
    expect(tableHeaders.find((item) => item.prop === "avatar")?.required).toBe(true);
    expect(tableHeaders.find((item) => item.prop === "status")?.required).toBe(true);
  });

  it("工具栏添加用户始终直出", () => {
    const actions = createMemberUserToolbarActions(() => undefined);
    expect(actions.map((item) => `${item.kind}:${item.key}`)).toEqual(["quick:create"]);
    expect(actions[0]?.overflow).toBe("never");
  });

  it("行内只展示详情，其余进入更多且 200 行映射稳定", () => {
    const rows = Array.from({ length: 200 }, (_, index) => ({
      id: String(index + 1),
      username: `user-${index + 1}`,
      nickname: `用户${index + 1}`,
      enabled: false,
      locked: false,
    }));
    const actions = createMemberUserRowActions(rows[0]!, handlers);
    expect(actions.map((item) => item.key)).toEqual([
      "detail",
      "toggle-enabled",
      "lock",
      "reset-password",
    ]);
    expect(actions[1]?.label).toBe("恢复账号");
    expect(rows).toHaveLength(200);
  });
});
