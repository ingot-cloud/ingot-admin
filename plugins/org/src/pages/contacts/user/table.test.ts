import { describe, expect, it } from "vitest";
import {
  applyColumnSelection,
  createOrgUserRowActions,
  createOrgUserToolbarActions,
  ORG_USER_SPLIT_KEY,
  ORG_USER_TABLE_ID,
  tableHeaders,
} from "./table";

const handlers = {
  onDetail: () => undefined,
  onToggleEnabled: () => undefined,
  onDelete: () => undefined,
};

const row = (
  overrides: Partial<{ userId: string; username: string; enabled: boolean; locked: boolean }> = {},
) => ({
  userId: "1",
  username: "user-1",
  createdAt: "2026-01-01",
  enabled: true,
  locked: false,
  ...overrides,
});

describe("org contacts user table contract", () => {
  it("提供稳定 tableId 与双栏持久化键", () => {
    expect(ORG_USER_TABLE_ID).toBe("org-contacts-user");
    expect(ORG_USER_SPLIT_KEY).toBe("org-contacts-user");
    expect(tableHeaders.find((item) => item.prop === "avatar")?.required).toBe(true);
  });

  it("工具栏只直出现有添加成员操作", () => {
    const actions = createOrgUserToolbarActions(() => undefined);
    expect(actions.map((item) => item.label)).toEqual(["添加成员"]);
    expect(actions[0]?.overflow).toBe("never");
    expect(actions.some((item) => item.overflowGroup === "batch")).toBe(false);
  });

  it("行内只展示详情，暂停账号进入更多且 200 行映射稳定", () => {
    const rows = Array.from({ length: 200 }, (_, index) =>
      row({
        userId: String(index + 1),
        username: `user-${index + 1}`,
      }),
    );
    const actions = createOrgUserRowActions(rows[0]!, handlers);
    expect(actions.map((item) => `${item.kind}:${item.key}`)).toEqual([
      "detail:detail",
      "default:toggle-enabled",
      "danger:delete",
    ]);
    expect(actions[1]?.label).toBe("暂停账号");
    expect(actions[1]?.disabled).toBe(false);
    expect(actions[2]?.confirm).toBe("是否删除用户(user-1)");
    expect(rows).toHaveLength(200);
  });

  it("只根据 enabled 决定暂停或恢复，缺少标志时禁用", () => {
    const paused = createOrgUserRowActions(row({ enabled: false }), handlers);
    expect(paused[1]?.label).toBe("恢复账号");
    expect(paused[1]?.disabled).toBe(false);

    const lockedOnly = createOrgUserRowActions(row({ enabled: true, locked: true }), handlers);
    expect(lockedOnly[1]?.label).toBe("暂停账号");

    const missing = createOrgUserRowActions(
      { userId: "2", username: "user-2", createdAt: "2026-01-01" },
      handlers,
    );
    expect(missing[1]?.disabled).toBe(true);
    expect(missing[1]?.disabledReason).toBe("缺少账号可用状态，无法切换");
  });

  it("字段选择保留姓名和操作列", () => {
    const visible = applyColumnSelection(tableHeaders, ["phone"]);
    expect(visible.find((item) => item.prop === "avatar")?.hide).toBe(false);
    expect(visible.find((item) => item.prop === "actions")?.hide).toBe(false);
    expect(visible.find((item) => item.prop === "phone")?.hide).toBe(false);
    expect(visible.find((item) => item.prop === "email")?.hide).toBe(true);
    expect(tableHeaders.find((item) => item.prop === "status")?.minWidth).toBe("132");
    expect(tableHeaders.find((item) => item.prop === "status")?.required).toBe(true);
  });
});
