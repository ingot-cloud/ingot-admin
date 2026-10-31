import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  me: vi.fn(),
  replace: vi.fn(),
  install: vi.fn(),
  begin: vi.fn(),
  notify: vi.fn(),
  entry: "platform" as "platform" | "tenant",
  loggingOut: false,
}));
vi.mock("@ingot/auth-core", async (original) => ({
  ...(await original<typeof import("@ingot/auth-core")>()),
  createAuthApi: () => ({ me: mocks.me }),
}));
vi.mock("../net", () => ({ Http: {} }));
vi.mock("../runtime", () => ({
  getAdminRuntimeConfig: () => ({
    login: {
      entry: mocks.entry,
      appId: `${mocks.entry}-admin`,
      expectedDomain: mocks.entry === "tenant" ? "TENANT" : "PLATFORM",
      title: "登录",
      desc: "",
      colorScheme: "light",
    },
    branding: { title: "test", copyright: "test" },
  }),
  getAdminRouter: () => ({ replace: mocks.replace, hasRoute: () => false }),
}));
vi.mock("../stores/modules/auth", () => ({
  bindIdentityChannel: vi.fn(),
  beginIdentitySwitch: (onReady?: () => Promise<void>) => mocks.begin(onReady),
  publishIdentityInvalidated: mocks.notify,
  useAuthStore: () => ({ loggingOut: mocks.loggingOut }),
  useUserInfoStore: () => ({ getIsInitPwd: false }),
  DomainMismatchError: class extends Error {},
}));
vi.mock("../stores/modules/router", () => ({
  useRouterStore: () => ({ installDynamicRoutes: mocks.install }),
}));
vi.mock("../utils/message", () => ({ Message: { warning: vi.fn() } }));
import { createSameOriginAuthSession } from "./session";

beforeEach(() => {
  mocks.entry = "platform";
  mocks.loggingOut = false;
  mocks.me.mockReset();
  mocks.replace.mockReset();
  mocks.begin.mockReset();
  mocks.install.mockClear();
  mocks.notify.mockClear();
  sessionStorage.clear();
  mocks.replace.mockResolvedValue(undefined);
  mocks.begin.mockImplementation(async (onReady?: () => Promise<void>) => {
    await onReady?.();
  });
});

describe("same-origin session entry", () => {
  it.each(["platform", "tenant"] as const)(
    "%s已有会话并发进入只读取一次me、装配和导航一次",
    async (entry) => {
      mocks.entry = entry;
      mocks.me.mockResolvedValue({
        data: { appId: `${entry}-admin`, domain: entry === "tenant" ? "TENANT" : "PLATFORM" },
      });
      const session = createSameOriginAuthSession();
      await Promise.all([session.onExistingSession(), session.onExistingSession()]);
      expect(mocks.me).toHaveBeenCalledOnce();
      expect(mocks.begin).toHaveBeenCalledOnce();
      expect(mocks.install).toHaveBeenCalledOnce();
      expect(mocks.replace).toHaveBeenCalledOnce();
      expect(mocks.notify).not.toHaveBeenCalled();
    },
  );

  it("同一完成结果重复回调只装配/广播/消费深链一次", async () => {
    let release!: () => void;
    mocks.begin.mockImplementation(async (onReady?: () => Promise<void>) => {
      await new Promise<void>((resolve) => {
        release = resolve;
      });
      await onReady?.();
    });
    sessionStorage.setItem("ingot.auth.platform-admin.returnTo", "/target?tab=x");
    const session = createSameOriginAuthSession();
    const result = {
      transactionId: "opaque-transaction",
      stage: "COMPLETED" as const,
      returnTo: "/",
      recoveryExpiresAt: "2099-01-01T00:00:00Z",
    };
    const identity = {
      appId: "platform-admin",
      domain: "PLATFORM" as const,
      userId: 1,
      clientId: "client",
      tenantId: null,
    };
    const pending = [
      session.onAuthenticated(result, identity),
      session.onAuthenticated(result, identity),
    ];
    release();
    await Promise.all(pending);
    expect(mocks.begin).toHaveBeenCalledOnce();
    expect(mocks.notify).toHaveBeenCalledOnce();
    expect(mocks.replace).toHaveBeenCalledExactlyOnceWith("/target?tab=x");
  });
});
