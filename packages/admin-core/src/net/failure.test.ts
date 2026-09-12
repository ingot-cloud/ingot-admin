import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@ingot/http-client";
import { StatusCode } from "./status-code";

const logoutAndReload = vi.fn();
const warning = vi.fn();
const confirmWarning = vi.fn(() => Promise.resolve());

vi.mock("@/utils/security", () => ({
  logoutAndReload: (...args: unknown[]) => logoutAndReload(...args),
}));

vi.mock("@/stores/modules/auth", () => ({
  refreshSessionPermissions: vi.fn(() => Promise.resolve()),
}));

vi.mock("@/utils/message", () => ({
  Message: { warning: (...args: unknown[]) => warning(...args) },
  Confirm: { warning: (...args: unknown[]) => confirmWarning(...args) },
}));

vi.mock("@ingot/shared", () => ({
  parseChallengeRequired: (status?: number) => (status === 412 ? { vcType: "slide" } : null),
}));

const {
  handleAdminBusinessFailure,
  handleAdminHttpError,
  handleAdminUnauthorized,
  isAdminUnauthorized,
  shouldBypassAdminError,
} = await import("./failure");

describe("admin failure hooks", () => {
  beforeEach(() => {
    logoutAndReload.mockReset();
    warning.mockReset();
    confirmWarning.mockReset();
    confirmWarning.mockResolvedValue(undefined);
  });

  it("识别未授权业务码与 HTTP 401", () => {
    expect(isAdminUnauthorized(new ApiError({ kind: "business", message: "x", code: StatusCode.UNAUTHORIZED }))).toBe(
      true,
    );
    expect(isAdminUnauthorized(new ApiError({ kind: "http", message: "x", status: 401 }))).toBe(true);
    expect(isAdminUnauthorized(new ApiError({ kind: "business", message: "x", code: StatusCode.TokenInvalid }))).toBe(
      true,
    );
    expect(isAdminUnauthorized(new ApiError({ kind: "business", message: "x", code: StatusCode.OK }))).toBe(false);
    expect(isAdminUnauthorized(new ApiError({ kind: "http", message: "x", status: 500 }))).toBe(false);
  });

  it("412 挑战错误应旁路", () => {
    expect(shouldBypassAdminError({ response: { status: 412 } } as never)).toBe(true);
    expect(shouldBypassAdminError({ response: { status: 500 } } as never)).toBe(false);
  });

  it("未授权时退出登录，refreshTokenAndRetry 时跳过", () => {
    handleAdminUnauthorized(new ApiError({ kind: "business", message: "x", code: StatusCode.UNAUTHORIZED }));
    expect(logoutAndReload).toHaveBeenCalledWith(true);

    logoutAndReload.mockReset();
    handleAdminUnauthorized(new ApiError({ kind: "http", message: "unauthorized", status: 401 }));
    expect(logoutAndReload).toHaveBeenCalledWith(true);

    logoutAndReload.mockReset();
    handleAdminUnauthorized(
      new ApiError({
        kind: "business",
        message: "x",
        code: StatusCode.UNAUTHORIZED,
        config: { refreshTokenAndRetry: true },
      }),
    );
    expect(logoutAndReload).not.toHaveBeenCalled();
  });

  it("签退弹出确认框", () => {
    handleAdminBusinessFailure(
      new ApiError({ kind: "business", message: "sign out", code: StatusCode.TokenSignBack }),
    );
    expect(confirmWarning).toHaveBeenCalled();
    expect(warning).not.toHaveBeenCalled();
  });

  it("普通业务失败提示一次", () => {
    handleAdminBusinessFailure(new ApiError({ kind: "business", message: "非法操作", code: "S0002" }));
    expect(warning).toHaveBeenCalledWith("非法操作", { showClose: true });
  });

  it("403 明确无权限时提示且不登出", () => {
    handleAdminHttpError(
      new ApiError({ kind: "http", message: "无权限", status: 403, code: StatusCode.FORBIDDEN }),
    );
    expect(warning).toHaveBeenCalledWith("无权限", { showClose: true });
    expect(logoutAndReload).not.toHaveBeenCalled();
  });

  it("503 授权快照不可用时提示重试且不登出", () => {
    handleAdminHttpError(
      new ApiError({
        kind: "http",
        message: "unavailable",
        status: 503,
        code: StatusCode.AuthorizationSnapshotUnavailable,
      }),
    );
    expect(warning).toHaveBeenCalledWith("授权服务暂时不可用，请稍后重试", { showClose: true });
    expect(logoutAndReload).not.toHaveBeenCalled();
  });

  it("非授权类 502 仍按坏响应退出登录", () => {
    handleAdminHttpError(
      new ApiError({
        kind: "http",
        message: "bad",
        status: 502,
        cause: { code: "ERR_BAD_RESPONSE", response: { data: "<html>error</html>" } },
      }),
    );
    expect(logoutAndReload).toHaveBeenCalledWith(true);
  });
});
