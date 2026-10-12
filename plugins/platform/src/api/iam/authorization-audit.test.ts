import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthorizationAuditPageAPI } from "./authorization-audit";
const { get } = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("@ingot/admin-core", async () => ({
  ...(await import("../../../../../packages/admin-core/src/utils/object")),
  request: { get },
  createResourceQueryKeys: () => ({}),
}));
vi.mock("@ingot/admin-common", async () => ({
  ...(await import("../../../../../packages/admin-common/src/models/iam/constants")),
  ...(await import("../../../../../packages/admin-common/src/models/iam/helpers")),
  createIamPageQueryOptions: () => ({}),
}));
beforeEach(() => {
  get.mockReset();
  get.mockResolvedValue({ data: { items: [], total: 0, page: 2, pageSize: 20 } });
});
describe("固定管理域授权审计 API", () => {
  it("固定所属域，丢弃伪造域及租户筛选，并透传分页与 AbortSignal", async () => {
    const signal = new AbortController().signal;
    const condition = { domain: "FORGED", tenantId: "999", actorMemberId: "101", targetId: "88" };
    const response = await AuthorizationAuditPageAPI({ current: 2, size: 20 }, condition, {
      signal,
    });
    expect(get).toHaveBeenCalledWith(
      "/api/iam/v1/platform/authorization/audits",
      { page: 2, pageSize: 20, actorMemberId: "101", targetId: "88" },
      { signal },
    );
    expect(response.data).toEqual({ current: 2, size: 20, total: 0, records: [] });
  });
});
