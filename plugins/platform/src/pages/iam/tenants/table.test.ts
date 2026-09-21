import { describe, expect, it, vi } from "vitest";
import { createTenantRowActions, createTenantToolbarActions, TENANT_TABLE_ID, type TenantRow } from "./table";

vi.mock("@ingot/admin-common", () => ({
  IamAction: {
    PLATFORM_TENANT_CREATE: "iam-platform:tenant:create",
    PLATFORM_TENANT_READ: "iam-platform:tenant:read",
  },
  objectActionAllowed: (
    capabilities: Record<string, { allowed?: boolean; message?: string }> | undefined,
    actionCode: string,
  ) => {
    const item = capabilities?.[actionCode];
    if (!item) {
      return { allowed: true };
    }
    return {
      allowed: item.allowed === true,
      message: item.message,
    };
  },
}));

const row = (capabilities: TenantRow["capabilities"] = {}): TenantRow => ({
  record: { id: "t1", name: "测试组织", ownerMemberId: "1000032", status: "ENABLED" },
  fieldAccess: {},
  capabilities,
  version: "1",
});

describe("platform iam tenants table", () => {
  it("提供稳定 tableId 与创建入口", () => {
    expect(TENANT_TABLE_ID).toBe("platform-iam-tenants");
    expect(createTenantToolbarActions(() => undefined)[0]?.permission).toBe("iam-platform:tenant:create");
  });

  it("列表未返回对象能力时不禁用详情，由会话 ACTION 决定是否展示", () => {
    const action = createTenantRowActions(row(), { onDetail: () => undefined })[0];
    expect(action?.permission).toBe("iam-platform:tenant:read");
    expect(action?.disabled).toBe(false);
  });

  it("对象明确拒绝时禁用并展示原因", () => {
    const action = createTenantRowActions(
      row({ "iam-platform:tenant:read": { allowed: false, message: "超出数据范围" } }),
      { onDetail: () => undefined },
    )[0];
    expect(action?.disabled).toBe(true);
    expect(action?.disabledReason).toBe("超出数据范围");
  });
});
