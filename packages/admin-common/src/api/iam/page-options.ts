import { queryOptions } from "@tanstack/vue-query";
import { toValue, type MaybeRefOrGetter } from "vue";
import {
  createPageQueryOptions,
  silentQueryRequest,
  snapshotQueryParams,
  usePermissions,
  type FetchPageAPIWithOptions,
  type Page,
  type ResourceQueryKeys,
  type ServerPagingQueryInput,
} from "@ingot/admin-core";

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

export { createPageQueryOptions };
