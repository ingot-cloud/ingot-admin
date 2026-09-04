import type { ApiError } from "@ingot/http-client";

export interface InQueryConfig {
  staleTime?: number;
  gcTime?: number;
  refetchOnWindowFocus?: boolean;
  refetchOnReconnect?: boolean;
}

export interface InQueryMeta {
  skipGlobalError?: boolean;
}

export interface InMutationMeta {
  skipGlobalError?: boolean;
}

export const DEFAULT_QUERY_STALE_TIME = 30_000;
export const REFERENCE_QUERY_STALE_TIME = 5 * 60_000;
export const REALTIME_QUERY_STALE_TIME = 0;
export const DEFAULT_QUERY_GC_TIME = 10 * 60_000;

export const isRetriableQueryError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") {
    return false;
  }
  const apiError = error as Partial<ApiError>;
  return apiError.kind === "network" || apiError.kind === "timeout" || apiError.retriable === true;
};
