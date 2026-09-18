import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";

const IamBootstrapAPI = vi.fn();
const IamCapabilitiesAPI = vi.fn();

vi.mock("@/api/common/iam", () => ({
  IamBootstrapAPI: (...args: unknown[]) => IamBootstrapAPI(...args),
  IamCapabilitiesAPI: (...args: unknown[]) => IamCapabilitiesAPI(...args),
}));

vi.mock("@/api/common/auth", () => ({
  LogoutAPI: vi.fn(() => Promise.resolve()),
}));

const runtimeState = vi.hoisted(() => ({ expectedDomain: "PLATFORM" as "PLATFORM" | "TENANT" }));

vi.mock("@/runtime", () => ({
  getAdminRuntimeConfig: () => ({
    staticMenus: [],
    login: { expectedDomain: runtimeState.expectedDomain },
  }),
}));

vi.mock("@/router/helper/menus", () => ({
  mergeMenuTrees: (_staticMenus: unknown, remote: unknown) => remote,
}));

vi.mock("@/router/helper/route", () => ({
  generateMenus: () => [],
  transformMenu: () => [],
  cacheRoutes: [],
}));

vi.mock("@/router/routes", () => ({ default: [] }));

vi.mock("@/query/client", () => ({
  clearAdminQueryCache: vi.fn(),
}));

const {
  DomainMismatchError,
  ensureSessionBootstrap,
  publishIdentityInvalidated,
  refreshSessionPermissions,
  resetSessionBootstrap,
  usePermissions,
  useUserInfoStore,
} = await import("./auth");

const bootstrapData = {
  context: {
    domain: "PLATFORM",
    accountId: "acc-1",
    memberId: "member-1",
    tenantId: null,
  },
  profile: {
    memberId: "member-1",
    displayName: "平台成员",
  },
  applications: [],
  menus: [
    {
      id: "m1",
      applicationId: "app-1",
      name: "租户",
      kind: "PAGE",
      path: "/platform/tenants",
      viewPath: "platform.iam.tenants",
      sortOrder: 1,
      children: [],
    },
  ],
  actionCodes: ["iam-platform:tenant:read"],
  version: "10",
  expiresAt: "2026-09-11T01:22:29Z",
};

describe("session bootstrap", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    runtimeState.expectedDomain = "PLATFORM";
    resetSessionBootstrap();
    usePermissions().clear();
    useUserInfoStore().clear();
    IamBootstrapAPI.mockReset();
    IamCapabilitiesAPI.mockReset();
  });

  it("一次拉取 bootstrap，不从菜单刮权限码，不以角色名放行", async () => {
    IamBootstrapAPI.mockResolvedValue({ data: bootstrapData });

    await ensureSessionBootstrap();
    await ensureSessionBootstrap();

    expect(IamBootstrapAPI).toHaveBeenCalledTimes(1);
    expect(usePermissions().permissions).toEqual(["iam-platform:tenant:read"]);
    expect(usePermissions().version).toBe("10");
    expect(useUserInfoStore().userInfo.memberId).toBe("member-1");
    expect(useUserInfoStore().getIsSystemAdmin).toBe(false);
    expect(useUserInfoStore().getUserInfoWhetherExist).toBe(true);
  });

  it("刷新能力时 version 变化才再拉 bootstrap，失败不清空已有权限", async () => {
    IamBootstrapAPI.mockResolvedValue({ data: bootstrapData });
    await ensureSessionBootstrap();

    IamCapabilitiesAPI.mockResolvedValue({
      data: {
        actionCodes: ["iam-platform:tenant:read", "iam-platform:tenant:create"],
        version: "11",
        expiresAt: "2026-09-11T01:23:29Z",
      },
    });
    IamBootstrapAPI.mockResolvedValue({
      data: {
        ...bootstrapData,
        actionCodes: ["iam-platform:tenant:read", "iam-platform:tenant:create"],
        version: "11",
      },
    });
    await refreshSessionPermissions({ refreshMenusIfVersionChanged: true });
    expect(usePermissions().permissions).toEqual([
      "iam-platform:tenant:read",
      "iam-platform:tenant:create",
    ]);
    expect(usePermissions().version).toBe("11");
    expect(IamBootstrapAPI).toHaveBeenCalledTimes(2);

    IamCapabilitiesAPI.mockRejectedValue(new Error("unavailable"));
    await expect(refreshSessionPermissions()).rejects.toThrow("unavailable");
    expect(usePermissions().permissions).toEqual([
      "iam-platform:tenant:read",
      "iam-platform:tenant:create",
    ]);
  });

  it("bootstrap 域与宿主 expectedDomain 不一致时停止装配", async () => {
    runtimeState.expectedDomain = "TENANT";
    IamBootstrapAPI.mockResolvedValue({ data: bootstrapData });

    await expect(ensureSessionBootstrap()).rejects.toBeInstanceOf(DomainMismatchError);
    expect(useUserInfoStore().getUserInfoWhetherExist).toBe(false);
    expect(usePermissions().permissions).toEqual([]);
  });

  it("publishIdentityInvalidated 通知同源标签页", () => {
    const posted: unknown[] = [];
    class MockChannel {
      postMessage(data: unknown) {
        posted.push(data);
      }
      close() {
        return undefined;
      }
    }
    vi.stubGlobal("BroadcastChannel", MockChannel);
    publishIdentityInvalidated();
    expect(posted).toEqual([{ type: "invalidated" }]);
    vi.unstubAllGlobals();
  });
});
