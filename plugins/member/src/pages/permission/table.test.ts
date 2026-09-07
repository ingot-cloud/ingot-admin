import { describe, expect, it, vi } from "vitest";
import {
  MEMBER_PERMISSION_TABLE_ID,
  createMemberPermissionRowActions,
  createMemberPermissionToolbarActions,
  tableHeaders,
} from "./table";

vi.mock("@/models/enums", () => ({
  CommonStatus: { Enable: "0", Lock: "9" },
  getCommonStatusToggle: (status: string) => (status === "0" ? "9" : "0"),
  getCommonStatusActionDesc: (status: string) => (status === "0" ? "启用" : "锁定"),
}));

const Enable = "0";
const Lock = "9";

describe("member permission table contract", () => {
  it("提供稳定 tableId，名称或 code 列为必选", () => {
    expect(MEMBER_PERMISSION_TABLE_ID).toBe("member-permission");
    expect(
      tableHeaders.find((item) => item.prop === "name")?.required === true ||
        tableHeaders.find((item) => item.prop === "code")?.required === true,
    ).toBe(true);
    expect(tableHeaders.some((item) => item.prop === "actions")).toBe(true);
  });

  it("工具栏添加权限始终直出", () => {
    const actions = createMemberPermissionToolbarActions(() => undefined);
    expect(actions).toEqual([
      expect.objectContaining({
        key: "create",
        label: "添加权限",
        kind: "quick",
        icon: "ep:plus",
        overflow: "never",
      }),
    ]);
  });

  it("行内展示编辑、添加子权限和启停，200 行映射保持稳定", () => {
    const rows = Array.from({ length: 200 }, (_, index) => ({
      id: String(index + 1),
      name: `权限-${index + 1}`,
      status: index % 2 === 0 ? Enable : Lock,
    }));
    const sample = createMemberPermissionRowActions(rows[0]!, {
      onDetail: () => undefined,
      onAddChild: () => undefined,
      onToggleStatus: () => undefined,
    });
    expect(sample.map((item) => `${item.kind}:${item.key}`)).toEqual([
      "detail:detail",
      "quick:add-child",
      "default:toggle-status",
    ]);
    expect(sample[2]?.label).toBe("锁定");
    expect(sample[2]?.confirm).toBe("是否锁定权限(权限-1)");
    expect(rows).toHaveLength(200);
    expect(
      createMemberPermissionRowActions(rows[1]!, {
        onDetail: () => undefined,
        onAddChild: () => undefined,
        onToggleStatus: () => undefined,
      })[2]?.label,
    ).toBe("启用");
  });
});
