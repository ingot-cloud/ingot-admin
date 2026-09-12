import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { PermissionMatchModeEnum } from "@/models/enums";

const UserInfoAPI = vi.fn();
const UserMenuAPI = vi.fn();
const UserPermissionsAPI = vi.fn();

vi.mock("@/api/common/user", () => ({
  UserInfoAPI: (...args: unknown[]) => UserInfoAPI(...args),
  UserMenuAPI: (...args: unknown[]) => UserMenuAPI(...args),
  UserPermissionsAPI: (...args: unknown[]) => UserPermissionsAPI(...args),
}));

vi.mock("@/api/common/auth", () => ({
  LogoutAPI: vi.fn(() => Promise.resolve()),
}));

vi.mock("@/runtime", () => ({
  getAdminRuntimeConfig: () => ({ staticMenus: [] }),
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

const {
  ensureSessionBootstrap,
  refreshSessionPermissions,
  resetSessionBootstrap,
  usePermissions,
  useUserInfoStore,
} = await import("./auth");

describe("session bootstrap", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    resetSessionBootstrap();
    usePermissions().clear();
    useUserInfoStore().clear();
    UserInfoAPI.mockReset();
    UserMenuAPI.mockReset();
    UserPermissionsAPI.mockReset();
  });

  it("并行拉取资料、菜单与有效权限，不从菜单刮权限码", async () => {
    UserInfoAPI.mockResolvedValue({
      data: {
        user: { phone: "13800000000", nickname: "测试" },
        roles: ["role_user"],
        allows: [],
        mustChangePwd: false,
      },
    });
    UserMenuAPI.mockResolvedValue({
      data: [
        {
          name: "用户",
          path: "/contacts/user",
          menuType: "1",
          permissionIds: ["1"],
          permissionMatchMode: PermissionMatchModeEnum.Any,
        },
      ],
    });
    UserPermissionsAPI.mockResolvedValue({
      data: {
        permissions: ["contacts:user:query"],
        version: 10,
        generatedAt: "2026-09-11T01:22:00Z",
        expiresAt: "2026-09-11T01:22:29Z",
      },
    });

    await ensureSessionBootstrap();
    await ensureSessionBootstrap();

    expect(UserInfoAPI).toHaveBeenCalledTimes(1);
    expect(UserMenuAPI).toHaveBeenCalledTimes(1);
    expect(UserPermissionsAPI).toHaveBeenCalledTimes(1);
    expect(usePermissions().permissions).toEqual(["contacts:user:query"]);
    expect(usePermissions().version).toBe(10);
    expect(useUserInfoStore().userInfo.roles).toEqual(["role_user"]);
  });

  it("刷新权限时 version 变化才再拉菜单，失败不清空已有权限", async () => {
    UserInfoAPI.mockResolvedValue({
      data: {
        user: { phone: "13800000000", nickname: "测试" },
        roles: ["role_user"],
        allows: [],
        mustChangePwd: false,
      },
    });
    UserMenuAPI.mockResolvedValue({ data: [] });
    UserPermissionsAPI.mockResolvedValue({
      data: {
        permissions: ["contacts:user:query"],
        version: 10,
        generatedAt: "2026-09-11T01:22:00Z",
        expiresAt: "2026-09-11T01:22:29Z",
      },
    });
    await ensureSessionBootstrap();

    UserPermissionsAPI.mockResolvedValue({
      data: {
        permissions: ["contacts:user:query", "contacts:user:edit"],
        version: 11,
        generatedAt: "2026-09-11T01:23:00Z",
        expiresAt: "2026-09-11T01:23:29Z",
      },
    });
    UserMenuAPI.mockResolvedValue({ data: [] });
    await refreshSessionPermissions({ refreshMenusIfVersionChanged: true });
    expect(usePermissions().permissions).toEqual(["contacts:user:query", "contacts:user:edit"]);
    expect(usePermissions().version).toBe(11);
    expect(UserMenuAPI).toHaveBeenCalledTimes(2);

    UserPermissionsAPI.mockRejectedValue(new Error("unavailable"));
    await expect(refreshSessionPermissions()).rejects.toThrow("unavailable");
    expect(usePermissions().permissions).toEqual(["contacts:user:query", "contacts:user:edit"]);
  });
});
