import type { AxiosError } from "axios";
import { ApiError } from "@ingot/http-client";
import { parseChallengeRequired } from "@ingot/shared";
import { Message } from "@/utils/message";
import { StatusCode } from "@/net/status-code";

export const isAuthUnauthorized = (error: ApiError): boolean => error.code === StatusCode.TokenInvalid;

export const shouldBypassAuthError = (error: AxiosError): boolean =>
  Boolean(parseChallengeRequired(error.response?.status, error.response?.data));

export const handleAuthUnauthorized = (): Promise<void> => new Promise(() => {});

export const handleAuthBusinessFailure = (error: ApiError): void => {
  if (error.code === StatusCode.TokenSignBack) {
    return;
  }
  Message.warning(error.message, { showClose: true });
};

export const handleAuthHttpError = (error: ApiError): void => {
  Message.warning(error.message, { showClose: true });
};
