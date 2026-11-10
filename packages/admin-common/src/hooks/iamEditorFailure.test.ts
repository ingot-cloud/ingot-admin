// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@ingot/admin-core";
import { iamEditorFailure } from "./iamEditorFailure";

const { warning, refresh } = vi.hoisted(() => ({
  warning: vi.fn(),
  refresh: vi.fn(() => Promise.resolve()),
}));

vi.mock("@ingot/admin-core", async (original) => ({
  ...(await original<typeof import("@ingot/admin-core")>()),
  Message: { warning },
  refreshSessionPermissions: refresh,
}));

describe("IAM 编辑器提示", () => {
  beforeEach(() => vi.clearAllMocks());

  it("接管的请求只显示一次操作对象和业务原因", async () => {
    await iamEditorFailure(
      new ApiError({
        kind: "http",
        status: 400,
        code: "ObjectInUse",
        message: "下仍有子菜单",
        config: { feedback: "silent" },
      }),
      "无法删除菜单「成员管理」",
    );
    expect(warning).toHaveBeenCalledExactlyOnceWith("无法删除菜单「成员管理」，下仍有子菜单");
  });

  it("全局已经显示的授权错误只刷新权限", async () => {
    await iamEditorFailure(
      new ApiError({ kind: "http", status: 403, message: "无权更新组织角色", config: {} }),
    );
    expect(warning).not.toHaveBeenCalled();
    expect(refresh).toHaveBeenCalledExactlyOnceWith({ refreshMenusIfVersionChanged: true });
  });

  it("拦住只有错误码的消息", async () => {
    await iamEditorFailure(
      new ApiError({
        kind: "http",
        status: 404,
        code: "ObjectNotFound",
        message: "ObjectNotFound",
        config: { feedback: "silent" },
      }),
      "无法更新菜单「成员管理」",
    );
    expect(warning).toHaveBeenCalledExactlyOnceWith(
      "无法更新菜单「成员管理」，所选记录不存在或不可访问，请刷新后重试",
    );
  });
});
