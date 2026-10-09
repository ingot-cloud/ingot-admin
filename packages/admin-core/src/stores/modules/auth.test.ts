import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { ApiError } from "@ingot/http-client";
import { StatusCode } from "@/net/status-code";

const IamBootstrapAPI = vi.fn();
const IamCapabilitiesAPI = vi.fn();
const PasswordChangeStateAPI = vi.fn();
vi.mock("@/api/common/password", () => ({
  PasswordChangeStateAPI: (...args: unknown[]) => PasswordChangeStateAPI(...args),
}));

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
  requirePasswordChange,
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
    PasswordChangeStateAPI.mockReset();
  });

  it("身份失效后迟到的 bootstrap 不恢复旧页面和权限", async () => {
    let complete!: (value: { data: typeof bootstrapData }) => void;
    IamBootstrapAPI.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          complete = resolve;
        }),
    );
    const pending = ensureSessionBootstrap();
    usePermissions().bumpContextEpoch();
    resetSessionBootstrap();
    complete({ data: bootstrapData });
    await pending;
    expect(useUserInfoStore().getUserInfoWhetherExist).toBe(false);
    expect(usePermissions().permissions).toEqual([]);
    IamBootstrapAPI.mockResolvedValue({ data: bootstrapData });
    await ensureSessionBootstrap();
    expect(useUserInfoStore().getUserInfoWhetherExist).toBe(true);
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

  it("旧身份迟到的改密错误不清除新身份权限或触发改密门禁", async () => {
    let rejectOld!: (reason: unknown) => void;
    IamBootstrapAPI.mockImplementationOnce(
      () =>
        new Promise((_, reject) => {
          rejectOld = reject;
        }),
    );
    const old = ensureSessionBootstrap();
    usePermissions().bumpContextEpoch();
    resetSessionBootstrap();
    IamBootstrapAPI.mockResolvedValue({ data: bootstrapData });
    await ensureSessionBootstrap();
    rejectOld(
      new ApiError({
        kind: "http",
        status: 403,
        code: StatusCode.PasswordChangeRequired,
        message: "旧身份改密",
      }),
    );
    await old;
    expect(PasswordChangeStateAPI).not.toHaveBeenCalled();
    expect(useUserInfoStore().getIsInitPwd).toBe(false);
    expect(usePermissions().permissions).toEqual(bootstrapData.actionCodes);
    await ensureSessionBootstrap();
    expect(IamBootstrapAPI).toHaveBeenCalledTimes(2);
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

  it("必须改密时只取最小身份状态，不请求业务能力，清空旧权限及菜单", async () => {
    usePermissions().permissions = ["iam-platform:member:read"];
    IamBootstrapAPI.mockRejectedValue(
      new ApiError({
        kind: "http",
        message: "请先改密",
        status: 403,
        code: StatusCode.PasswordChangeRequired,
      }),
    );
    PasswordChangeStateAPI.mockResolvedValue({
      data: { context: bootstrapData.context, mustChangePassword: true },
    });
    await Promise.all([ensureSessionBootstrap(), ensureSessionBootstrap()]);
    expect(IamBootstrapAPI).toHaveBeenCalledTimes(1);
    expect(PasswordChangeStateAPI).toHaveBeenCalledTimes(1);
    expect(useUserInfoStore().getIsInitPwd).toBe(true);
    expect(useUserInfoStore().userInfo.user).toBeUndefined();
    expect(usePermissions().permissions).toEqual([]);
    expect(usePermissions().applications).toEqual([]);
    await refreshSessionPermissions({ refreshMenusIfVersionChanged: true });
    expect(IamCapabilitiesAPI).not.toHaveBeenCalled();
  });

  it("受限状态查询合并且迟到能力响应不能恢复业务权限", async () => {
    IamBootstrapAPI.mockResolvedValue({ data: bootstrapData });
    await ensureSessionBootstrap();
    let resolveCapabilities!: (value: unknown) => void;
    IamCapabilitiesAPI.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCapabilities = resolve;
        }),
    );
    const pending = refreshSessionPermissions();
    PasswordChangeStateAPI.mockResolvedValue({
      data: { context: bootstrapData.context, mustChangePassword: true },
    });
    await Promise.all([requirePasswordChange(), requirePasswordChange()]);
    resolveCapabilities({ data: { actionCodes: ["old-full"], version: "old" } });
    await pending;
    expect(usePermissions().permissions).toEqual([]);
    expect(useUserInfoStore().getIsInitPwd).toBe(true);
    expect(PasswordChangeStateAPI).toHaveBeenCalledOnce();
  });

  it("改密状态失败或域错误不能恢复旧业务权限", async () => {
    IamBootstrapAPI.mockRejectedValue(
      new ApiError({ kind: "http", message: "改密", code: StatusCode.PasswordChangeRequired }),
    );
    PasswordChangeStateAPI.mockRejectedValueOnce(new Error("offline"));
    usePermissions().permissions = ["old"];
    await expect(ensureSessionBootstrap()).rejects.toThrow("offline");
    expect(usePermissions().permissions).toEqual([]);
    PasswordChangeStateAPI.mockResolvedValue({
      data: { context: { ...bootstrapData.context, domain: "TENANT" }, mustChangePassword: true },
    });
    await expect(ensureSessionBootstrap()).rejects.toBeInstanceOf(DomainMismatchError);
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
