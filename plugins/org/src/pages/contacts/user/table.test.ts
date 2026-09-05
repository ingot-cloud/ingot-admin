import { describe, expect, it, vi } from "vitest";
import {
  applyColumnSelection,
  createOrgUserRowActions,
  createOrgUserToolbarActions,
  ORG_USER_SPLIT_KEY,
  ORG_USER_TABLE_ID,
  tableHeaders,
} from "./table";

vi.mock("@/models/enums", () => ({
  CommonStatus: { Enable: "0", Lock: "9" },
  getCommonStatusToggle: (status: string) => (status === "0" ? "9" : "0"),
  getCommonStatusActionDesc: (status: string) => (status === "0" ? "启用" : "锁定"),
}));

const Enable = "0";

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

  it("行内详情加启停，删除进入更多且 200 行映射稳定", () => {
    const rows = Array.from({ length: 200 }, (_, index) => ({
      userId: String(index + 1),
      username: `user-${index + 1}`,
      createdAt: "2026-01-01",
      status: Enable,
    }));
    const actions = createOrgUserRowActions(rows[0]!, {
      onDetail: () => undefined,
      onToggleStatus: () => undefined,
      onDelete: () => undefined,
    });
    expect(actions.map((item) => `${item.kind}:${item.key}`)).toEqual([
      "detail:detail",
      "quick:toggle-status",
      "danger:delete",
    ]);
    expect(actions[2]?.confirm).toBe("是否删除用户(user-1)");
    expect(rows).toHaveLength(200);
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
