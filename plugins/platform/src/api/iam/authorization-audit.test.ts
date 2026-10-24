import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthorizationAuditCursorAPI } from "./authorization-audit";
const { get } = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("@ingot/admin-core", async () => ({
  ...(await import("../../../../../packages/admin-core/src/utils/object")),
  request: { get },
  createResourceQueryKeys: () => ({}),
}));
vi.mock("@ingot/admin-common", async () => ({
  ...(await import("../../../../../packages/admin-common/src/models/iam/constants")),
  ...(await import("../../../../../packages/admin-common/src/models/iam/helpers")),
  createIamCursorQueryOptions: () => ({}),
}));
beforeEach(() => {
  get.mockReset();
  get.mockResolvedValue({ data: { items: [], hasMore: false, references: {} } });
});
describe("固定管理域授权审计 API", () => {
  it("固定所属域，丢弃伪造域及租户筛选，并透传游标与 AbortSignal", async () => {
    const signal = new AbortController().signal;
    const condition = { domain: "FORGED", tenantId: "999", actorMemberId: "101", targetId: "88" };
    const response = await AuthorizationAuditCursorAPI({ limit: 20, cursor: "cursor-2" }, condition, {
      signal,
    });
    expect(get).toHaveBeenCalledWith(
      "/api/iam/v1/platform/authorization/audits",
      { limit: 20, cursor: "cursor-2", actorMemberId: "101", targetId: "88" },
      { signal },
    );
    expect(response.data).toEqual({ items: [], hasMore: false, references: {} });
  });
});
