import type { InternalAxiosRequestConfig } from "axios";
import { defineRequestInterceptor, InterceptorOrder } from "@ingot/http-client";
import { CSRF_HEADER } from "./types";

const CSRF_STORAGE_KEY = "ingot.auth.csrfToken";
const CSRF_TX_STORAGE_KEY = "ingot.auth.csrfTransactionId";

let csrfToken: string | undefined;
let csrfTransactionId: string | undefined;

const readStored = (key: string): string | undefined => {
  if (typeof sessionStorage === "undefined") {
    return undefined;
  }
  try {
    return sessionStorage.getItem(key) ?? undefined;
  } catch {
    return undefined;
  }
};

const writeStored = (key: string, value: string | undefined): void => {
  if (typeof sessionStorage === "undefined") {
    return;
  }
  try {
    if (value) {
      sessionStorage.setItem(key, value);
    } else {
      sessionStorage.removeItem(key);
    }
  } catch {
    // ignore quota / private mode
  }
};

export const rememberCsrfToken = (token: string): void => {
  csrfToken = token;
  csrfTransactionId = undefined;
  writeStored(CSRF_STORAGE_KEY, token);
  writeStored(CSRF_TX_STORAGE_KEY, undefined);
};

export const bindCsrfToTransaction = (transactionId: string): void => {
  csrfTransactionId = transactionId;
  writeStored(CSRF_TX_STORAGE_KEY, transactionId);
};

export const currentCsrfToken = (): string | undefined => {
  if (!csrfToken) {
    csrfToken = readStored(CSRF_STORAGE_KEY);
  }
  return csrfToken;
};

export const currentCsrfTransactionId = (): string | undefined => {
  if (!csrfTransactionId) {
    csrfTransactionId = readStored(CSRF_TX_STORAGE_KEY);
  }
  return csrfTransactionId;
};

export const csrfMatchesTransaction = (transactionId: string): boolean =>
  Boolean(transactionId) && Boolean(currentCsrfToken()) && currentCsrfTransactionId() === transactionId;

export const clearCsrfToken = (): void => {
  csrfToken = undefined;
  csrfTransactionId = undefined;
  writeStored(CSRF_STORAGE_KEY, undefined);
  writeStored(CSRF_TX_STORAGE_KEY, undefined);
};

export const createCsrfRequestInterceptor = () =>
  defineRequestInterceptor({
    name: "bff-csrf",
    order: InterceptorOrder.request.header + 1,
    resolved(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
      const url = config.url ?? "";
      const method = (config.method ?? "get").toLowerCase();
      if (url.includes("/bff/auth/csrf") || method === "get" || method === "head") {
        return config;
      }
      if (currentCsrfToken()) {
        config.headers = config.headers ?? {};
        config.headers[CSRF_HEADER] = currentCsrfToken();
      }
      return config;
    },
  });
