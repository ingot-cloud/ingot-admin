import { AxiosHeaders } from "axios";
import type { AxiosError, AxiosRequestConfig } from "axios";
import type { R } from "@/models/net";
import { runGatewayChallenge } from "@ingot/shared";

type RetryFn = (config: AxiosRequestConfig) => Promise<R>;

let retryRequest: RetryFn | undefined;

export function bindChallengeRetry(retry: RetryFn): void {
  retryRequest = retry;
}

const toPlainHeaders = (existing?: AxiosRequestConfig["headers"]): Record<string, string> => {
  if (!existing) {
    return {};
  }
  const raw =
    existing instanceof AxiosHeaders
      ? existing.toJSON()
      : (existing as Record<string, unknown>);
  const result: Record<string, string> = {};
  Object.entries(raw).forEach(([key, value]) => {
    if (typeof value === "string" && value) {
      result[key] = value;
    }
  });
  return result;
};

const prepareRetryConfig = (
  config: AxiosRequestConfig,
  headers: Record<string, string>,
  retryCount: number,
): AxiosRequestConfig => {
  const next: AxiosRequestConfig = { ...config };
  next.__challengeRetryCount = retryCount;
  if (next.__cryptoPlainData !== undefined) {
    next.data = next.__cryptoPlainData;
  }
  if (next.__cryptoPlainParams !== undefined) {
    next.params = next.__cryptoPlainParams;
  }
  next.headers = {
    ...toPlainHeaders(next.headers),
    ...headers,
  };
  next.__cryptoCtx = undefined;
  next.__cryptoRetried = false;
  return next;
};

export async function tryHandleGatewayChallenge(error: AxiosError<R>): Promise<R | undefined> {
  const config = error.config;
  if (!config) {
    return undefined;
  }
  return runGatewayChallenge({
    status: error.response?.status,
    body: error.response?.data,
    url: config.url,
    skip: config.skipChallenge,
    retryCount: config.__challengeRetryCount,
    retry: (headers, nextCount) => {
      if (!retryRequest) {
        return Promise.reject(new Error("挑战重试未绑定"));
      }
      return retryRequest(prepareRetryConfig(config, headers, nextCount));
    },
  });
}
