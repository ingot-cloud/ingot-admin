import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthorizationDomain, AuditChangeType } from "@ingot/admin-common";
import { SecurityAuditPageAPI } from "./policies";

const { get } = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("@ingot/admin-core", async () => ({
  ...(await import("../../../../../packages/admin-core/src/utils/object")),
  request: { get },
}));
// 仅替换组件 barrel，保留真实的参数映射和枚举。
vi.mock("@ingot/admin-common", async () => ({
  ...(await import("../../../../../packages/admin-common/src/models/iam/constants")),
  ...(await import("../../../../../packages/admin-common/src/models/iam/helpers")),
}));

beforeEach(() => {
  get.mockReset();
  get.mockResolvedValue({ data: { items: [], total: 0, page: 1, pageSize: 20 } });
});

describe("当前域授权审计接口", () => {
  it.each([
    [AuthorizationDomain.PLATFORM, "platform"],
    [AuthorizationDomain.TENANT, "tenant"],
  ])("按已捕获的 %s 身份选路并传递筛选", async (domain, path) => {
    const signal = new AbortController().signal;
    await SecurityAuditPageAPI(
      domain,
      { current: 2, size: 20 },
      {
        actorMemberId: "101",
        targetType: "resource",
        targetId: "88",
        changeType: AuditChangeType.UPDATE,
        from: "2026-10-11T01:00:00Z",
        until: "2026-10-11T02:00:00Z",
      },
      { signal },
    );
    expect(get).toHaveBeenCalledWith(
      `/api/iam/v1/${path}/authorization/audits`,
      {
        page: 2,
        pageSize: 20,
        actorMemberId: "101",
        targetType: "resource",
        targetId: "88",
        changeType: "UPDATE",
        from: "2026-10-11T01:00:00Z",
        until: "2026-10-11T02:00:00Z",
      },
      { signal },
    );
  });
  it("无效身份不默认进入租户域", async () => {
    await expect(SecurityAuditPageAPI(undefined, { current: 1, size: 20 })).rejects.toThrow(
      "管理身份无效",
    );
    expect(get).not.toHaveBeenCalled();
  });
  it("筛选中的伪造域或租户不参与请求", async () => {
    const condition = { domain: "TENANT", tenantId: "20", targetId: "88" };
    await SecurityAuditPageAPI(AuthorizationDomain.PLATFORM, { current: 1, size: 20 }, condition);
    expect(get).toHaveBeenCalledWith(
      "/api/iam/v1/platform/authorization/audits",
      { page: 1, pageSize: 20, targetId: "88" },
      undefined,
    );
  });
});
