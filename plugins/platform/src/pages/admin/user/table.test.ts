import { describe, expect, it } from "vitest";
import {
  ADMIN_USER_TABLE_ID,
  createAdminUserRowActions,
  createAdminUserToolbarActions,
  tableHeaders,
} from "./table";

const handlers = {
  onDetail: () => undefined,
  onToggleEnabled: () => undefined,
  onLock: () => undefined,
  onResetPassword: () => undefined,
};

describe("platform admin user table contract", () => {
  it("提供稳定 tableId，用户和状态列为必选", () => {
    expect(ADMIN_USER_TABLE_ID).toBe("platform-admin-user");
    expect(tableHeaders.find((item) => item.prop === "avatar")?.required).toBe(true);
    expect(tableHeaders.find((item) => item.prop === "status")?.required).toBe(true);
  });

  it("工具栏添加用户始终直出", () => {
    const actions = createAdminUserToolbarActions(() => undefined);
    expect(actions.map((item) => `${item.kind}:${item.key}`)).toEqual(["quick:create"]);
    expect(actions[0]?.overflow).toBe("never");
    expect(actions[0]?.icon).toBe("ep:plus");
  });

  it("行内只展示详情，暂停锁定和重置进入更多且 200 行映射稳定", () => {
    const rows = Array.from({ length: 200 }, (_, index) => ({
      id: String(index + 1),
      username: `user-${index + 1}`,
      nickname: `用户${index + 1}`,
      enabled: true,
      locked: false,
    }));
    const actions = createAdminUserRowActions(rows[0]!, handlers);
    expect(actions.map((item) => `${item.kind}:${item.key}`)).toEqual([
      "detail:detail",
      "default:toggle-enabled",
      "default:lock",
      "danger:reset-password",
    ]);
    expect(actions[1]?.label).toBe("暂停账号");
    expect(actions[2]?.label).toBe("锁定");
    expect(rows).toHaveLength(200);
  });
});
