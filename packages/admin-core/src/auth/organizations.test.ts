import { beforeEach, describe, expect, it, vi } from "vitest";
import { rememberSessionContext, ORGANIZATION_SYNC_KEY } from "@ingot/auth-core";
import type { SessionMe, OrganizationSyncEvent } from "@ingot/auth-core";

const mocks = vi.hoisted(() => ({
  begin: vi.fn(),
  bootstrap: vi.fn(),
  replace: vi.fn(),
  install: vi.fn(),
  me: vi.fn(),
  bump: vi.fn(),
  unavailable: vi.fn(),
  auth: { loggingOut: false, switchingIdentity: false },
  menus: [
    { path: "/members", viewPath: "org.iam.members" },
    { path: "/workbench", viewPath: "org.iam.workbench" },
  ],
}));
vi.mock("../net", () => ({ Http: {} }));
vi.mock("./browserContext", () => ({
  confirmBrowserSession: mocks.me,
  adoptBrowserSession: (identity: SessionMe) => rememberSessionContext(identity),
}));
vi.mock("../runtime", () => ({
  getAdminRuntimeConfig: () => ({ login: { entry: "tenant" } }),
  getAdminRouter: () => ({ replace: mocks.replace, hasRoute: () => false }),
}));
vi.mock("../stores/modules/auth", () => ({
  beginIdentitySwitch: (ready: () => Promise<void>) => mocks.begin(ready),
  ensureSessionBootstrap: mocks.bootstrap,
  useAuthStore: () => mocks.auth,
  usePermissions: () => ({ bumpContextEpoch: mocks.bump, markUnavailable: mocks.unavailable }),
  useUserInfoStore: () => ({ getIsInitPwd: false }),
}));
vi.mock("../stores/modules/router", () => ({
  useRouterStore: () => ({ installDynamicRoutes: mocks.install, getMenus: mocks.menus }),
}));
vi.mock("../utils/message", () => ({ Message: { warning: vi.fn() } }));
vi.mock("../hooks/biz/useLogin", () => ({ useLogin: () => ({ go: vi.fn() }) }));
const {
  organizationLandingPath,
  returnToCurrentOrganization,
  bindOrganizationChannel,
  pauseOrganizationSwitch,
  cancelOrganizationSwitch,
} = await import("./organizations");

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  mocks.auth.loggingOut = false;
  mocks.auth.switchingIdentity = false;
  mocks.replace.mockResolvedValue(undefined);
  mocks.bootstrap.mockResolvedValue(undefined);
  mocks.begin.mockImplementation(async (ready: () => Promise<void>) => {
    await ready();
    mocks.auth.switchingIdentity = false;
  });
});

describe("organization host", () => {
  it("无候选返回当前组织，不执行身份清理", async () => {
    await returnToCurrentOrganization(true);
    expect(mocks.bootstrap).toHaveBeenCalledOnce();
    expect(mocks.begin).not.toHaveBeenCalled();
    expect(mocks.replace).toHaveBeenCalledExactlyOnceWith("/workbench");
    expect(localStorage.getItem(ORGANIZATION_SYNC_KEY)).toBeNull();
  });
  it("来源失效只显示安全状态，不加载原组织业务", async () => {
    await returnToCurrentOrganization(false);
    expect(mocks.bootstrap).not.toHaveBeenCalled();
    expect(mocks.begin).not.toHaveBeenCalled();
    expect(mocks.replace).toHaveBeenCalledWith("/403");
    expect(mocks.unavailable).toHaveBeenCalledOnce();
  });
  it("bootstrap失败后返回当前组织复用身份重试，完成导航后解除暂停", async () => {
    rememberSessionContext({
      appId: "tenant-admin",
      domain: "TENANT",
      userId: 1,
      clientId: "client",
      contextVersion: "retry-context",
    });
    mocks.auth.switchingIdentity = true;
    await returnToCurrentOrganization(true);
    expect(mocks.begin).toHaveBeenCalledOnce();
    expect(mocks.bootstrap).not.toHaveBeenCalled();
    expect(mocks.replace).toHaveBeenCalledWith("/workbench");
    expect(mocks.auth.switchingIdentity).toBe(false);
  });
  it("按工作台、首个可访问菜单、空态选择落地页", () => {
    expect(organizationLandingPath(mocks.menus)).toBe("/workbench");
    expect(organizationLandingPath(mocks.menus.slice(0, 1))).toBe("/members");
    expect(organizationLandingPath([])).toBe("/403");
  });
  it("其他标签页已完成切换后，旧来源的创建响应不能再次冻结新身份", () => {
    rememberSessionContext({
      appId: "tenant-admin",
      domain: "TENANT",
      tenantId: "43",
      userId: 1,
      clientId: "client",
      contextVersion: "new-generation",
    });
    pauseOrganizationSwitch(
      {
        transactionId: "late-transaction",
        tenantId: "44",
        stage: "PREPARED",
        expiresAt: "2099-01-01T00:00:00Z",
      },
      "old-generation",
    );
    expect(mocks.auth.switchingIdentity).toBe(false);
    expect(mocks.bump).not.toHaveBeenCalled();
    expect(localStorage.getItem(ORGANIZATION_SYNC_KEY)).toBeNull();
  });
  it("竞争失败重验新 Cookie 后解除旧暂停线索并加载实际身份", async () => {
    const identity: SessionMe = {
      appId: "tenant-admin",
      domain: "TENANT",
      tenantId: "43",
      userId: 1,
      clientId: "client",
      contextVersion: "winning-generation",
    };
    rememberSessionContext({ ...identity, contextVersion: "old-generation" });
    localStorage.setItem(
      ORGANIZATION_SYNC_KEY,
      JSON.stringify({
        phase: "pending",
        transactionId: "losing-transaction",
        sourceVersion: "old-generation",
        source: "peer",
        expiresAt: "2099-01-01T00:00:00Z",
      }),
    );
    mocks.auth.switchingIdentity = true;
    mocks.me.mockImplementationOnce(async () => {
      rememberSessionContext(identity);
      return identity;
    });
    await cancelOrganizationSwitch();
    expect(JSON.parse(localStorage.getItem(ORGANIZATION_SYNC_KEY)!)).toMatchObject({
      phase: "completed",
      transactionId: "winning-generation",
    });
    expect(mocks.replace).toHaveBeenCalledWith("/workbench");
    expect(mocks.auth.switchingIdentity).toBe(false);
  });
  it("其他标签页提交期间暂停，完成事件去重并进入新组织工作台", async () => {
    let receive: ((event: MessageEvent<OrganizationSyncEvent>) => void) | undefined;
    class Channel {
      addEventListener(
        _name: string,
        listener: (event: MessageEvent<OrganizationSyncEvent>) => void,
      ) {
        receive = listener;
      }
      postMessage() {}
      close() {}
    }
    vi.stubGlobal("BroadcastChannel", Channel);
    const original: SessionMe = {
      appId: "tenant-admin",
      domain: "TENANT",
      tenantId: "42",
      userId: 1,
      clientId: "client",
      contextVersion: "original-version",
    };
    rememberSessionContext(original);
    const target = { ...original, tenantId: "43", contextVersion: "target-version" };
    mocks.me.mockImplementation(async () => {
      rememberSessionContext(target);
      return target;
    });
    bindOrganizationChannel();
    const event: OrganizationSyncEvent = {
      phase: "pending",
      transactionId: "target-version",
      sourceVersion: "original-version",
      expiresAt: "2099-01-01T00:00:00Z",
      source: "another-tab",
    };
    receive?.({ data: event } as MessageEvent<OrganizationSyncEvent>);
    expect(mocks.auth.switchingIdentity).toBe(true);
    expect(mocks.bump).toHaveBeenCalledOnce();
    const completed: OrganizationSyncEvent = { ...event, phase: "completed" };
    localStorage.setItem(ORGANIZATION_SYNC_KEY, JSON.stringify(completed));
    receive?.({ data: completed } as MessageEvent<OrganizationSyncEvent>);
    receive?.({ data: completed } as MessageEvent<OrganizationSyncEvent>);
    await vi.waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/workbench"));
    expect(mocks.begin).toHaveBeenCalledOnce();
    expect(mocks.me).toHaveBeenCalledOnce();
    mocks.auth.switchingIdentity = false;
    receive?.({
      data: { ...event, transactionId: "late-losing-transaction" },
    } as MessageEvent<OrganizationSyncEvent>);
    expect(mocks.auth.switchingIdentity).toBe(false);
    expect(mocks.bump).toHaveBeenCalledOnce();
    vi.unstubAllGlobals();
  });
});
