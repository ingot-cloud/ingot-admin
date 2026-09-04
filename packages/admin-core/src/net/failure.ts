import type { AxiosError } from "axios";
import { ApiError } from "@ingot/http-client";
import { parseChallengeRequired } from "@ingot/shared";
import { Message, Confirm } from "@/utils/message";
import { StatusCode } from "@/net/status-code";
import { logoutAndReload } from "@/utils/security";
import { isString } from "@/utils";

export const isAdminUnauthorized = (error: ApiError): boolean =>
  error.code === StatusCode.UNAUTHORIZED || error.code === StatusCode.TokenInvalid;

export const shouldBypassAdminError = (error: AxiosError): boolean =>
  Boolean(parseChallengeRequired(error.response?.status, error.response?.data));

export const handleAdminUnauthorized = (error: ApiError): void => {
  if (error.config?.refreshTokenAndRetry) {
    return;
  }
  logoutAndReload(true);
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
  Message.warning(error.message, { showClose: true });
};

export const handleAdminHttpError = (error: ApiError): void => {
  const axiosError = error.cause as AxiosError | undefined;
  if (axiosError?.code === "ERR_BAD_RESPONSE" && axiosError.response && isString(axiosError.response.data)) {
    logoutAndReload(true);
    return;
  }
  Message.warning(error.message, { showClose: true });
};
