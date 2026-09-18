import type { AxiosError } from "axios";
import { ApiError } from "@ingot/http-client";
import { parseChallengeRequired } from "@ingot/shared";
import {
  isBffTransactionExpired,
  restartLoginAtAdminStart,
  shouldRestartLoginAtAdminStart,
  TRANSACTION_EXPIRED_RESTART_DELAY_MS,
} from "@ingot/auth-core";
import { Message } from "@/utils/message";
import { StatusCode } from "@/net/status-code";

export const isAuthUnauthorized = (error: ApiError): boolean => error.code === StatusCode.TokenInvalid;

export const shouldBypassAuthError = (error: AxiosError): boolean =>
  Boolean(parseChallengeRequired(error.response?.status, error.response?.data));

export const handleAuthUnauthorized = (): Promise<void> => new Promise(() => {});

export const restartIfTransactionExpired = (error: unknown): boolean => {
  if (!shouldRestartLoginAtAdminStart(error)) {
    return false;
  }
  const message = isBffTransactionExpired(error)
    ? "登录已超时，正在重新进入"
    : "登录状态已失效，正在重新进入";
  return restartLoginAtAdminStart(import.meta.env.VITE_APP_ADMIN_START_URL, {
    onBeforeRedirect: () => {
      Message.warning(message, { showClose: true, duration: TRANSACTION_EXPIRED_RESTART_DELAY_MS });
    },
  });
};

export const handleAuthBusinessFailure = (error: ApiError): void => {
  if (error.code === StatusCode.TokenSignBack) {
    return;
  }
  if (restartIfTransactionExpired(error)) {
    return;
  }
  Message.warning(error.message, { showClose: true });
};

export const handleAuthHttpError = (error: ApiError): void => {
  if (restartIfTransactionExpired(error)) {
    return;
  }
  Message.warning(error.message, { showClose: true });
};
