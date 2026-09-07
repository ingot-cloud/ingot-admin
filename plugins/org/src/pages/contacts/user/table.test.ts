import { describe, expect, it } from "vitest";
import {
  accountStatusOptions,
  createOrgUserRowActions,
  createOrgUserToolbarActions,
  ORG_USER_SPLIT_KEY,
  ORG_USER_TABLE_ID,
  resolveOrgUserEnabledFilter,
  tableHeaders,
  toOrgUserEnabledPickerValue,
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
  it("账号状态筛选映射到 enabled 查询参数", () => {
    expect(accountStatusOptions.map((item) => item.label)).toEqual(["全部", "正常", "已暂停"]);
    expect(resolveOrgUserEnabledFilter("")).toBeUndefined();
    expect(resolveOrgUserEnabledFilter(true)).toBe(true);
    expect(resolveOrgUserEnabledFilter(false)).toBe(false);
    expect(toOrgUserEnabledPickerValue(undefined)).toBe("");
    expect(toOrgUserEnabledPickerValue(true)).toBe(true);
    expect(toOrgUserEnabledPickerValue(false)).toBe(false);
  });

  it("提供稳定 tableId 与双栏持久化键", () => {
    expect(ORG_USER_TABLE_ID).toBe("org-contacts-user");
    expect(ORG_USER_SPLIT_KEY).toBe("org-contacts-user");
    expect(tableHeaders.find((item) => item.prop === "avatar")?.required).toBe(true);
  });

  it("工具栏包含描边批量导入与带图标的添加成员", () => {
    const actions = createOrgUserToolbarActions(() => undefined);
    expect(actions.map((item) => `${item.kind}:${item.key}`)).toEqual([
      "primary:import",
      "quick:create",
    ]);
    expect(actions[0]?.overflowGroup).toBe("batch");
    expect(actions[1]?.overflow).toBe("never");
    expect(actions[1]?.icon).toBe("ep:plus");
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

  it("姓名、状态和操作列为字段设置必选", () => {
    expect(tableHeaders.find((item) => item.prop === "avatar")?.required).toBe(true);
    expect(tableHeaders.find((item) => item.prop === "status")?.required).toBe(true);
    expect(tableHeaders.find((item) => item.prop === "status")?.minWidth).toBe("132");
    expect(tableHeaders.some((item) => item.prop === "actions")).toBe(true);
  });
});
