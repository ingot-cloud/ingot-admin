import { Message } from "@/utils/message";
import {
  MutationCache,
  QueryCache,
  QueryClient,
  type VueQueryPluginOptions,
} from "@tanstack/vue-query";
import { isApiError } from "@ingot/http-client";
import "./register";
import {
  DEFAULT_QUERY_GC_TIME,
  DEFAULT_QUERY_STALE_TIME,
  isRetriableQueryError,
  type InQueryConfig,
} from "./types";

let adminQueryClient: QueryClient | undefined;

const notifyQueryError = (error: unknown): void => {
  if (isApiError(error) && error.cancelled) {
    return;
  }
  const message = error instanceof Error ? error.message : "请求失败";
  Message.warning(message, { showClose: true });
};

export function createAdminQueryClient(config?: InQueryConfig): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        if (query.meta?.skipGlobalError) {
          return;
        }
        notifyQueryError(error);
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        if (mutation.meta?.skipGlobalError) {
          return;
        }
        notifyQueryError(error);
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: config?.staleTime ?? DEFAULT_QUERY_STALE_TIME,
        gcTime: config?.gcTime ?? DEFAULT_QUERY_GC_TIME,
        refetchOnWindowFocus: config?.refetchOnWindowFocus ?? false,
        refetchOnReconnect: config?.refetchOnReconnect ?? true,
        retry: (failureCount, error) => failureCount < 1 && isRetriableQueryError(error),
      },
      mutations: {
        retry: false,
      },
    },
  });
}

export function bindAdminQueryClient(client: QueryClient): QueryClient {
  adminQueryClient = client;
  return client;
}

export function getAdminQueryClient(): QueryClient {
  if (!adminQueryClient) {
    throw new Error("管理台 QueryClient 尚未绑定，请先调用 bootstrapAdminApp");
  }
  return adminQueryClient;
}

/**
 * 命令式读取：走 QueryClient.query（fetchQuery 已废弃）。
 * 传入 `queryOptions()` / `XxxQueryOptions()` 的返回值。
 * 缓存仍新鲜时直接返回，过期或不存在时再请求。
 */
export function queryAdminData<T>(options: object): Promise<T> {
  return getAdminQueryClient().query(options as never) as Promise<T>;
}

export function resetAdminQueryClient(): void {
  if (adminQueryClient) {
    adminQueryClient.cancelQueries();
    adminQueryClient.clear();
  }
  adminQueryClient = undefined;
}

export function clearAdminQueryCache(): void {
  const client = adminQueryClient;
  if (!client) {
    return;
  }
  void client.cancelQueries();
  client.clear();
}

export const adminVueQueryPluginOptions = (queryClient: QueryClient): VueQueryPluginOptions => ({
  queryClient,
});
