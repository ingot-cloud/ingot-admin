import { beforeEach, describe, expect, it, vi } from "vitest";
import { createHttpClient } from "@ingot/http-client";
import type { InternalAxiosRequestConfig } from "axios";
import {
  currentSessionContext,
  rememberSessionContext,
  clearSessionContext,
  BFF_CONTEXT_HEADER,
  type SessionMe,
} from "@ingot/auth-core";
import HeaderInterceptor from "../net/interceptor/request/header";
import IdentityInterceptor, { captureRequestIdentity } from "../net/interceptor/request/identity";

const mocks = vi.hoisted(() => ({
  epoch: 0,
  get: vi.fn(),
  begin: vi.fn(),
  pause: vi.fn(),
  auth: { loggingOut: false, switchingIdentity: false },
}));
vi.mock("../net", () => ({ Http: { get: mocks.get } }));
vi.mock("../runtime", () => ({
  getAdminRuntimeConfig: () => ({
    login: { entry: "tenant", appId: "tenant-admin", expectedDomain: "TENANT" },
  }),
  getAdminRouter: () => ({ replace: vi.fn(), hasRoute: () => false }),
}));
vi.mock("../stores/modules/auth", () => ({
  usePermissions: () => ({ contextEpoch: mocks.epoch }),
  useAuthStore: () => mocks.auth,
  useUserInfoStore: () => ({ getIsInitPwd: false }),
  pauseIdentityContext: mocks.pause,
  beginIdentitySwitch: (...args: unknown[]) => mocks.begin(...args),
  ensureSessionBootstrap: vi.fn(),
}));
vi.mock("../stores/modules/app", () => ({
  useAppStore: () => ({ app: { login: { fingerprintEnabled: false } } }),
}));
vi.mock("../stores/modules/router", () => ({
  useRouterStore: () => ({ installDynamicRoutes: vi.fn(), getMenus: [] }),
}));
vi.mock("../utils/message", () => ({ Message: { warning: vi.fn() } }));
vi.mock("../hooks/biz/useLogin", () => ({ useLogin: () => ({ go: vi.fn() }) }));
import { adoptBrowserSession, confirmBrowserSession } from "./browserContext";
import { bindOrganizationChannel } from "./organizations";

const a: SessionMe = {
  appId: "tenant-admin",
  domain: "TENANT",
  clientId: "client",
  userId: 1,
  tenantId: "42",
  contextVersion: "organization-a",
};
const b: SessionMe = { ...a, tenantId: "43", contextVersion: "organization-b" };
const client = (
  adapter = vi.fn(async (config: InternalAxiosRequestConfig) => ({
    config,
    headers: {},
    status: 200,
    statusText: "OK",
    data: { code: "S0200", data: {} },
  })),
) => ({
  adapter,
  http: createHttpClient({
    adapter,
    hooks: { onRequestCreated: captureRequestIdentity },
    interceptors: { request: [HeaderInterceptor, IdentityInterceptor] },
  }),
});

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  rememberSessionContext(a);
  mocks.epoch = 0;
  mocks.auth.loggingOut = false;
  mocks.auth.switchingIdentity = false;
  mocks.pause.mockImplementation(() => {
    expect(currentSessionContext()).toBe("organization-a");
    mocks.epoch++;
    mocks.auth.switchingIdentity = true;
  });
});

describe("实际me与宿主身份接纳", () => {
  it("漏广播后的焦点重验先隔离旧界面，只查询一次me，bootstrap期间不能提交旧表单", async () => {
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
    mocks.get.mockResolvedValue({ code: "S0200", data: b });
    let finish!: () => void;
    mocks.begin.mockImplementation(async () => {
      await new Promise<void>((resolve) => {
        finish = resolve;
      });
      mocks.auth.switchingIdentity = false;
    });
    bindOrganizationChannel();
    window.dispatchEvent(new Event("focus"));
    await vi.waitFor(() => expect(mocks.begin).toHaveBeenCalledOnce());
    expect(mocks.pause).toHaveBeenCalledOnce();
    expect(currentSessionContext()).toBe(b.contextVersion);
    expect(mocks.get).toHaveBeenCalledOnce();
    const { http, adapter } = client();
    await expect(http.post("/api/iam/groups", { name: "form-from-a" })).rejects.toMatchObject({
      cancelled: true,
    });
    expect(adapter).not.toHaveBeenCalled();
    finish();
    await vi.waitFor(() => expect(mocks.auth.switchingIdentity).toBe(false));
    await http.post("/api/iam/groups", { name: "new-form-in-b" });
    expect(adapter).toHaveBeenCalledOnce();
    expect(adapter.mock.calls[0]?.[0].headers[BFF_CONTEXT_HEADER]).toBe(b.contextVersion);
  });

  it("创建时暂停的请求即使Axios运行前恢复也不会自动发送，内部标记不能放行写操作", async () => {
    mocks.auth.switchingIdentity = true;
    const { http, adapter } = client();
    const pending = http.post(
      "/api/iam/groups",
      { name: "old-form" },
      { __ingotIdentityBootstrap: true },
    );
    mocks.auth.switchingIdentity = false;
    await expect(pending).rejects.toMatchObject({ cancelled: true });
    expect(adapter).not.toHaveBeenCalled();
  });

  it("暂停期间只允许内部只读bootstrap，不放行普通业务读写", async () => {
    mocks.auth.switchingIdentity = true;
    const { http, adapter } = client();
    await expect(http.get("/api/iam/v1/me/profile")).rejects.toMatchObject({ cancelled: true });
    await http.get("/api/iam/v1/me/bootstrap", undefined, { __ingotIdentityBootstrap: true });
    expect(adapter).toHaveBeenCalledOnce();
    expect(adapter.mock.calls[0]?.[0].headers[BFF_CONTEXT_HEADER]).toBe(a.contextVersion);
  });

  it("相同版本及初次接纳不清理，错误域或缺少版本不覆盖旧身份", () => {
    adoptBrowserSession(a);
    expect(mocks.pause).not.toHaveBeenCalled();
    expect(() => adoptBrowserSession({ ...b, domain: "PLATFORM" })).toThrow();
    expect(() => adoptBrowserSession({ ...b, contextVersion: undefined })).toThrow();
    expect(currentSessionContext()).toBe(a.contextVersion);
    clearSessionContext();
    adoptBrowserSession(b);
    expect(mocks.pause).not.toHaveBeenCalled();
    expect(currentSessionContext()).toBe(b.contextVersion);
  });

  it("me失败不接纳新版本也不清理旧数据", async () => {
    mocks.get.mockRejectedValueOnce(new Error("dependency unavailable"));
    await expect(confirmBrowserSession()).rejects.toThrow("dependency unavailable");
    expect(currentSessionContext()).toBe(a.contextVersion);
    expect(mocks.pause).not.toHaveBeenCalled();
  });
});
