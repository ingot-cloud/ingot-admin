import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { ApiError } from "@ingot/http-client";
import { StatusCode } from "@/net/status-code";

const IamBootstrapAPI = vi.fn();
const IamCapabilitiesAPI = vi.fn();
const PasswordChangeStateAPI = vi.fn();
const LogoutAPI = vi.fn<(signal?: AbortSignal) => Promise<void>>(() => Promise.resolve());
vi.mock("@/api/common/password", () => ({
  PasswordChangeStateAPI: (...args: unknown[]) => PasswordChangeStateAPI(...args),
}));

vi.mock("@/api/common/iam", () => ({
  IamBootstrapAPI: (...args: unknown[]) => IamBootstrapAPI(...args),
  IamCapabilitiesAPI: (...args: unknown[]) => IamCapabilitiesAPI(...args),
}));

vi.mock("@/api/common/auth", () => ({
  LogoutAPI: (...args: unknown[]) => LogoutAPI(...args),
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
  beginIdentitySwitch,
  ensureSessionBootstrap,
  publishIdentityInvalidated,
  requirePasswordChange,
  refreshSessionPermissions,
  resetSessionBootstrap,
  usePermissions,
  useUserInfoStore,
  useAuthStore,
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
    LogoutAPI.mockReset().mockResolvedValue(undefined);
  });

  afterEach(() => {
    resetSessionBootstrap();
    vi.useRealTimers();
  });

  it("退出并发合并，未授权本地退出不再请求远端撤销", async () => {
    const auth = useAuthStore();
    const first = auth.logout(true);
    const second = auth.logout(true);
    await Promise.all([first, second]);
    expect(LogoutAPI).not.toHaveBeenCalled();
    expect(auth.loggingOut).toBe(true);
    expect(usePermissions().contextEpoch).toBe(1);
  });

  it("显式退出有界中止网络请求，重复调用不重复撤销", async () => {
    vi.useFakeTimers();
    LogoutAPI.mockImplementation(() => new Promise<void>(() => undefined));
    const auth = useAuthStore();
    const first = auth.logout();
    expect(auth.loggingOut).toBe(true);
    const second = auth.logout();
    await vi.advanceTimersByTimeAsync(1500);
    await Promise.all([first, second]);
    expect(LogoutAPI).toHaveBeenCalledOnce();
    const signal = LogoutAPI.mock.calls[0]?.[0];
    expect(signal).toBeInstanceOf(AbortSignal);
    expect((signal as AbortSignal).aborted).toBe(true);
  });

  it("身份重验直到路由准备完成才恢复业务页，退出可以终止重验", async () => {
    IamBootstrapAPI.mockResolvedValue({ data: bootstrapData });
    let ready!: () => void;
    const onReady = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          ready = resolve;
        }),
    );
    const pending = beginIdentitySwitch(onReady);
    await vi.waitFor(() => expect(onReady).toHaveBeenCalledOnce());
    expect(useAuthStore().isTransitioning).toBe(true);
    ready();
    await pending;
    expect(useAuthStore().isTransitioning).toBe(false);

    let bootstrap!: (value: { data: typeof bootstrapData }) => void;
    IamBootstrapAPI.mockImplementation(
      () =>
        new Promise((resolve) => {
          bootstrap = resolve;
        }),
    );
    const lateReady = vi.fn();
    const late = beginIdentitySwitch(lateReady);
    await useAuthStore().logout(true);
    bootstrap({ data: bootstrapData });
    await late;
    expect(lateReady).not.toHaveBeenCalled();
    expect(useAuthStore().isTransitioning).toBe(true);
    expect(useUserInfoStore().getUserInfoWhetherExist).toBe(false);
  });

  it.each(["PLATFORM", "TENANT"] as const)(
    "%s身份重验触发强制改密门禁后仍能完成一次路由跳转",
    async (domain) => {
      runtimeState.expectedDomain = domain;
      IamBootstrapAPI.mockRejectedValue(
        new ApiError({
          kind: "business",
          code: StatusCode.PasswordChangeRequired,
          message: "必须改密",
        }),
      );
      PasswordChangeStateAPI.mockResolvedValue({
        data: {
          context: {
            ...bootstrapData.context,
            domain,
            tenantId: domain === "TENANT" ? "42" : null,
          },
          mustChangePassword: true,
        },
      });
      const onReady = vi.fn(async () => {
        expect(useUserInfoStore().getIsInitPwd).toBe(true);
        expect(useAuthStore().isTransitioning).toBe(true);
      });
      await beginIdentitySwitch(onReady);
      expect(onReady).toHaveBeenCalledOnce();
      expect(useAuthStore().isTransitioning).toBe(false);
    },
  );

  it("旧身份的改密状态晚到时，不阻塞或清除新身份的在途改密检查", async () => {
    let oldState!: (value: unknown) => void;
    let newState!: (value: unknown) => void;
    PasswordChangeStateAPI.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          oldState = resolve;
        }),
    ).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          newState = resolve;
        }),
    );
    const old = requirePasswordChange();
    IamBootstrapAPI.mockRejectedValue(
      new ApiError({
        kind: "business",
        code: StatusCode.PasswordChangeRequired,
        message: "必须改密",
      }),
    );
    const ready = vi.fn(async () => undefined);
    const next = beginIdentitySwitch(ready);
    await vi.waitFor(() => expect(PasswordChangeStateAPI).toHaveBeenCalledTimes(2));
    oldState({ data: { context: bootstrapData.context, mustChangePassword: true } });
    await old;
    expect(useUserInfoStore().getIsInitPwd).toBe(false);
    const repeat = requirePasswordChange();
    expect(PasswordChangeStateAPI).toHaveBeenCalledTimes(2);
    newState({
      data: {
        context: { ...bootstrapData.context, memberId: "new-member" },
        mustChangePassword: true,
      },
    });
    await Promise.all([next, repeat]);
    expect(ready).toHaveBeenCalledOnce();
    expect(useUserInfoStore().userInfo.memberId).toBe("new-member");
    expect(useAuthStore().isTransitioning).toBe(false);
  });

  it("旧权限刷新结束不清除新身份正在进行的刷新", async () => {
    let oldCapabilities!: (value: unknown) => void;
    let newCapabilities!: (value: unknown) => void;
    IamCapabilitiesAPI.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          oldCapabilities = resolve;
        }),
    ).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          newCapabilities = resolve;
        }),
    );
    const old = refreshSessionPermissions();
    IamBootstrapAPI.mockResolvedValue({ data: bootstrapData });
    await beginIdentitySwitch();
    const current = refreshSessionPermissions();
    oldCapabilities({
      data: { actionCodes: ["old"], version: "old", expiresAt: bootstrapData.expiresAt },
    });
    await old;
    const repeat = refreshSessionPermissions();
    expect(IamCapabilitiesAPI).toHaveBeenCalledTimes(2);
    newCapabilities({
      data: { actionCodes: ["new"], version: "new", expiresAt: bootstrapData.expiresAt },
    });
    await Promise.all([current, repeat]);
    expect(usePermissions().version).toBe("new");
  });

  it("拥有者标记只接受租户服务器事实，两端都不按 expiresAt 轮询", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-14T08:00:00Z"));
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
    runtimeState.expectedDomain = "TENANT";
    const tenant = {
      ...bootstrapData,
      context: { ...bootstrapData.context, domain: "TENANT", tenantId: "10" },
      tenantOwner: true,
      expiresAt: "2026-10-14T08:00:30Z",
    };
    IamBootstrapAPI.mockResolvedValue({ data: tenant });
    IamCapabilitiesAPI.mockResolvedValue({
      data: {
        actionCodes: tenant.actionCodes,
        version: tenant.version,
        expiresAt: "2026-10-14T08:02:00Z",
      },
    });
    await ensureSessionBootstrap();
    expect(usePermissions().tenantOwner).toBe(true);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(IamCapabilitiesAPI).not.toHaveBeenCalled();
    usePermissions().clear();
    expect(usePermissions().tenantOwner).toBe(false);
    resetSessionBootstrap();
    runtimeState.expectedDomain = "PLATFORM";
    IamBootstrapAPI.mockResolvedValue({ data: { ...bootstrapData, tenantOwner: true } });
    await ensureSessionBootstrap();
    expect(usePermissions().tenantOwner).toBe(false);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(IamCapabilitiesAPI).not.toHaveBeenCalled();
  });

  it("仅在恢复可见且已过期时核对能力，503 禁用操作但不自动重试", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-14T08:00:00Z"));
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
    runtimeState.expectedDomain = "TENANT";
    IamBootstrapAPI.mockResolvedValue({
      data: {
        ...bootstrapData,
        context: { ...bootstrapData.context, domain: "TENANT", tenantId: "10" },
        expiresAt: "2026-10-14T08:00:30Z",
        tenantOwner: false,
      },
    });
    IamCapabilitiesAPI.mockResolvedValue({
      data: {
        actionCodes: bootstrapData.actionCodes,
        version: bootstrapData.version,
        expiresAt: "2026-10-14T08:01:30Z",
      },
    });
    await ensureSessionBootstrap();
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
    document.dispatchEvent(new Event("visibilitychange"));
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
    document.dispatchEvent(new Event("visibilitychange"));
    expect(IamCapabilitiesAPI).not.toHaveBeenCalled();
    vi.setSystemTime(new Date("2026-10-14T08:00:31Z"));
    window.dispatchEvent(new Event("focus"));
    await vi.advanceTimersByTimeAsync(0);
    expect(IamCapabilitiesAPI).toHaveBeenCalledTimes(1);
    IamCapabilitiesAPI.mockRejectedValue(new Error("503"));
    await expect(refreshSessionPermissions()).rejects.toThrow("503");
    expect(usePermissions().unavailable).toBe(true);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(IamCapabilitiesAPI).toHaveBeenCalledTimes(2);
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
      data: {
        context: bootstrapData.context,
        mustChangePassword: true,
      },
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
      data: {
        context: bootstrapData.context,
        mustChangePassword: true,
      },
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
    expect(posted).toEqual([{ type: "invalidated", source: expect.any(String) }]);
    vi.unstubAllGlobals();
  });
});
