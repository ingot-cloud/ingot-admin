import type { AxiosError } from "axios";
import { ApiError } from "@ingot/http-client";
import { parseChallengeRequired } from "@ingot/shared";
import { Message, Confirm } from "@/utils/message";
import { StatusCode } from "@/net/status-code";
import { logoutAndReload } from "@/utils/security";
import { isString } from "@/utils";

export { isAdminUnauthorized } from "./unauthorized";

export const shouldBypassAdminError = (error: AxiosError): boolean =>
  Boolean(parseChallengeRequired(error.response?.status, error.response?.data));

export const handleAdminUnauthorized = (error: ApiError): void => {
  if (error.config?.refreshTokenAndRetry) {
    return;
  }
  const path = window.location.pathname;
  if (path === "/auth/start" || path === "/auth/complete") {
    return;
  }
  logoutAndReload(true);
};

const isForbidden = (error: ApiError): boolean =>
  error.status === 403 ||
  error.code === StatusCode.FORBIDDEN ||
  error.code === StatusCode.DataScopeForbidden;

const isSnapshotUnavailable = (error: ApiError): boolean =>
  error.status === 503 || error.code === StatusCode.AuthorizationSnapshotUnavailable;

const schedulePermissionRefresh = (): void => {
  void import("@/stores/modules/auth").then(({ refreshSessionPermissions }) => {
    void refreshSessionPermissions();
  });
};

const handleAuthorizationFailure = (error: ApiError): boolean => {
  if (error.code === StatusCode.PasswordChangeRequired) {
    // 初始 bootstrap 由 store 处理；禁止进入通用 403 能力刷新，避免重复请求与递归。
    const url = error.config?.url ?? "";
    if (!url.endsWith("/me/bootstrap") && !url.endsWith("/me/password")) {
      void import("@/stores/modules/auth").then(async ({ requirePasswordChange }) => {
        await requirePasswordChange();
        if (window.location.pathname !== "/init") window.location.replace("/init");
      }).catch(() => logoutAndReload(true));
    }
    return true;
  }
  if (isSnapshotUnavailable(error)) {
    Message.warning("授权服务暂时不可用，请稍后重试", { showClose: true });
    void import("@/stores/modules/auth").then(({ usePermissions }) => {
      usePermissions().markUnavailable();
    });
    return true;
  }
  if (isForbidden(error)) {
    Message.warning(error.message, { showClose: true });
    schedulePermissionRefresh();
    return true;
  }
  return false;
};

export const handleAdminBusinessFailure = (error: ApiError): void => {
  if (error.code === StatusCode.TokenSignBack) {
    Confirm.warning("您已被签退，可以取消继续留在该页面，或者重新登录", {
      confirmButtonText: "重新登录",
      cancelButtonText: "取消",
    }).then(() => {
      logoutAndReload();
    });
    return;
  }
  if (handleAuthorizationFailure(error)) {
    return;
  }
  Message.warning(error.message, { showClose: true });
};

export const handleAdminHttpError = (error: ApiError): void => {
  if (handleAuthorizationFailure(error)) {
    return;
  }
  const axiosError = error.cause as AxiosError | undefined;
  if (axiosError?.code === "ERR_BAD_RESPONSE" && axiosError.response && isString(axiosError.response.data)) {
    logoutAndReload(true);
    return;
  }
  Message.warning(error.message, { showClose: true });
};
