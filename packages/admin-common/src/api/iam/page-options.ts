import { queryOptions } from "@tanstack/vue-query";
import { toValue, type MaybeRefOrGetter } from "vue";
import {
  createPageQueryOptions,
  silentQueryRequest,
  snapshotQueryParams,
  usePermissions,
  type CursorPagingQueryInput,
  type FetchPageAPIWithOptions,
  type Page,
  type R,
  type RequestOptions,
  type ResourceQueryKeys,
  type ServerPagingQueryInput,
} from "@ingot/admin-core";

/** IAM 游标列表请求参数：`limit` 为每页条数，`cursor` 为上一页返回的 `nextCursor`。 */
export interface IamCursorParams {
  limit: number;
  cursor?: string;
}

export type FetchIamCursorAPI<P, C> = (
  params: IamCursorParams,
  condition?: C,
  options?: RequestOptions,
) => Promise<R<P>>;

/**
 * IAM 列表 Query：Key 含身份 epoch，避免切域后回填旧数据。
 */
export function createIamPageQueryOptions<T, C extends object>(
  keys: ResourceQueryKeys,
  fetchPage: FetchPageAPIWithOptions<T, C>,
  extra?: { staleTime?: number },
) {
  return (input: MaybeRefOrGetter<ServerPagingQueryInput<C>>) => {
    const permissions = usePermissions();
    const value = toValue(input);
    return queryOptions({
      queryKey: keys.list(
        snapshotQueryParams({
          contextEpoch: permissions.contextEpoch,
          domain: permissions.domain,
          tenantId: permissions.tenantId,
          memberId: permissions.memberId,
          current: value.current,
          size: value.size,
          condition: value.condition,
        }),
      ),
      staleTime: extra?.staleTime,
      enabled: !permissions.unavailable,
      queryFn: ({ signal }): Promise<Page<T>> =>
        fetchPage(
          { current: value.current, size: value.size },
          { ...value.condition },
          silentQueryRequest(signal),
        ).then(({ data }) => data),
    });
  };
}

/**
 * IAM 游标列表 Query：Key 含身份 epoch 与当前游标，配合 `useCursorPaging`。
 */
export function createIamCursorQueryOptions<P, C extends object>(
  keys: ResourceQueryKeys,
  fetchPage: FetchIamCursorAPI<P, C>,
  extra?: { staleTime?: number },
) {
  return (input: MaybeRefOrGetter<CursorPagingQueryInput<C>>) => {
    const permissions = usePermissions();
    const value = toValue(input);
    return queryOptions({
      queryKey: keys.list(
        snapshotQueryParams({
          contextEpoch: permissions.contextEpoch,
          domain: permissions.domain,
          tenantId: permissions.tenantId,
          memberId: permissions.memberId,
          cursor: value.cursor,
          size: value.size,
          condition: value.condition,
        }),
      ),
      staleTime: extra?.staleTime,
      enabled: !permissions.unavailable,
      queryFn: ({ signal }): Promise<P> =>
        fetchPage(
          { limit: value.size, cursor: value.cursor },
          { ...value.condition },
          silentQueryRequest(signal),
        ).then(({ data }) => data),
    });
  };
}

export { createPageQueryOptions };
