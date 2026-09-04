import { queryOptions } from "@tanstack/vue-query";
import { toValue, type MaybeRefOrGetter } from "vue";
import type { RequestOptions } from "@ingot/http-client";
import type { Page, R } from "@/models";
import type { ResourceQueryKeys } from "./keys";
import type { ServerPagingQueryInput } from "./paging";
import { silentQueryRequest } from "./request";
import { snapshotQueryParams } from "./snapshot";

export type FetchPageAPIWithOptions<T, C> = (
  page: Page,
  condition?: C,
  options?: RequestOptions,
) => Promise<R<Page<T>>>;

/**
 * 服务端分页 Query Options 工厂：Key 使用参数快照，queryFn 透传 silent AbortSignal。
 */
export function createPageQueryOptions<T, C extends object>(
  keys: ResourceQueryKeys,
  fetchPage: FetchPageAPIWithOptions<T, C>,
  extra?: { staleTime?: number },
) {
  return (input: MaybeRefOrGetter<ServerPagingQueryInput<C>>) => {
    const value = toValue(input);
    return queryOptions({
      queryKey: keys.list(
        snapshotQueryParams({
          current: value.current,
          size: value.size,
          condition: value.condition,
        }),
      ),
      staleTime: extra?.staleTime,
      queryFn: ({ signal }): Promise<Page<T>> =>
        fetchPage(
          { current: value.current, size: value.size },
          { ...value.condition },
          silentQueryRequest(signal),
        ).then(({ data }) => data),
    });
  };
}
