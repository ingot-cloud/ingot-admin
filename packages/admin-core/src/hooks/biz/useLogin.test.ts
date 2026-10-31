import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/runtime", () => ({
  getAdminRuntimeConfig: () => ({ login: { appId: "tenant-admin" } }),
}));

afterEach(() => {
  vi.unstubAllGlobals();
  sessionStorage.clear();
});

describe("login navigation", () => {
  it("切换组织强制显示表单，保留本站深链；并发导航仅执行一次", async () => {
    vi.resetModules();
    const assign = vi.fn();
    vi.stubGlobal("location", {
      pathname: "/org/members",
      search: "?tab=active",
      hash: "#detail",
      assign,
    });
    const { useLogin } = await import("./useLogin");
    await Promise.all([useLogin().go({ forceLogin: true }), useLogin().go({ forceLogin: true })]);
    expect(assign).toHaveBeenCalledTimes(1);
    expect(assign).toHaveBeenCalledWith("/login/?loggedOut=1");
    expect(sessionStorage.getItem("ingot.auth.tenant-admin.returnTo")).toBe(
      "/org/members?tab=active#detail",
    );
    expect(sessionStorage.getItem("ingot.auth.tenant-admin.explicitLogout")).toBe("1");
  });

  it("显式退出清理旧返回路径，普通401回登录保留路径", async () => {
    vi.resetModules();
    const assign = vi.fn();
    vi.stubGlobal("location", { pathname: "/org/members", search: "", hash: "", assign });
    sessionStorage.setItem("ingot.auth.tenant-admin.returnTo", "/old");
    const { useLogin } = await import("./useLogin");
    await useLogin().go({ rememberReturnTo: false });
    expect(sessionStorage.getItem("ingot.auth.tenant-admin.returnTo")).toBeNull();
    expect(assign).toHaveBeenCalledWith("/login/?loggedOut=1");
    vi.resetModules();
    const again = await import("./useLogin");
    await again.useLogin().go();
    expect(assign).toHaveBeenLastCalledWith("/login/");
    expect(sessionStorage.getItem("ingot.auth.tenant-admin.returnTo")).toBe("/org/members");
  });
});
