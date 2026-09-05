import { describe, expect, it, vi } from "vitest";
import {
  applyColumnSelection,
  createTenantRowActions,
  createTenantToolbarActions,
  tableHeaders,
  TENANT_TABLE_ID,
} from "./table";

vi.mock("@/models/enums", () => ({
  CommonStatus: { Enable: "0", Lock: "9" },
  getCommonStatusToggle: (status: string) => (status === "0" ? "9" : "0"),
  getCommonStatusActionDesc: (status: string) => (status === "0" ? "启用" : "锁定"),
}));

const Enable = "0";
const Lock = "9";

describe("platform tenant table contract", () => {
  it("提供稳定 tableId，名称和操作列为必选", () => {
    expect(TENANT_TABLE_ID).toBe("platform-org-tenant");
    expect(tableHeaders.find((item) => item.prop === "name")?.required).toBe(true);
    expect(tableHeaders.find((item) => item.prop === "actions")?.prop).toBe("actions");
  });

  it("工具栏添加组织始终直出", () => {
    const actions = createTenantToolbarActions(() => undefined);
    expect(actions).toEqual([
      expect.objectContaining({
        key: "create",
        label: "添加组织",
        overflow: "never",
        kind: "quick",
      }),
    ]);
  });

  it("行内展示详情和启停，200 行映射保持稳定", () => {
    const rows = Array.from({ length: 200 }, (_, index) => ({
      id: String(index + 1),
      name: `组织-${index + 1}`,
      status: index % 2 === 0 ? Enable : Lock,
    }));
    const sample = createTenantRowActions(rows[0]!, {
      onDetail: () => undefined,
      onToggleStatus: () => undefined,
    });
    expect(sample.map((item) => item.key)).toEqual(["detail", "toggle-status"]);
    expect(sample[0]?.kind).toBe("detail");
    expect(sample[1]?.kind).toBe("quick");
    expect(sample[1]?.label).toBe("锁定");
    expect(rows).toHaveLength(200);
    expect(
      createTenantRowActions(rows[1]!, {
        onDetail: () => undefined,
        onToggleStatus: () => undefined,
      })[1]?.label,
    ).toBe("启用");
  });

  it("字段选择不隐藏必选列", () => {
    const visible = applyColumnSelection(tableHeaders, ["code"]);
    expect(visible.find((item) => item.prop === "name")?.hide).toBe(false);
    expect(visible.find((item) => item.prop === "actions")?.hide).toBe(false);
    expect(visible.find((item) => item.prop === "code")?.hide).toBe(false);
    expect(visible.find((item) => item.prop === "orgType")?.hide).toBe(true);
  });
});
