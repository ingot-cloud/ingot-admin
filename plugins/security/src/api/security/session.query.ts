import { queryOptions } from "@tanstack/vue-query";
import { toValue, type MaybeRefOrGetter } from "vue";
import {
  createResourceQueryKeys,
  REALTIME_QUERY_STALE_TIME,
  silentQueryRequest,
  snapshotQueryParams,
  type ServerPagingQueryInput,
} from "@ingot/admin-core";
import type { Page, PlatformSessionQueryDTO, PlatformSessionVO } from "@/models";
import { GetSessionAPI, SessionPageAPI } from "./session";

const resourceKeys = createResourceQueryKeys("security", "session");

export const sessionQueryKeys = {
  ...resourceKeys,
};

export const hasSessionQueryConstraint = (condition: PlatformSessionQueryDTO): boolean =>
  Boolean(condition.clientId || condition.userId);

export function SessionPageQueryOptions(
  input: MaybeRefOrGetter<ServerPagingQueryInput<PlatformSessionQueryDTO>>,
) {
  const value = toValue(input);
  return queryOptions({
    queryKey: sessionQueryKeys.list(
      snapshotQueryParams({
        current: value.current,
        size: value.size,
        condition: value.condition,
      }),
    ),
    staleTime: REALTIME_QUERY_STALE_TIME,
    queryFn: ({ signal }): Promise<Page<PlatformSessionVO>> =>
      SessionPageAPI(
        { current: value.current, size: value.size },
        { ...value.condition },
        silentQueryRequest(signal),
      ).then(({ data }) => data),
  });
}

export function SessionDetailQueryOptions(sid: MaybeRefOrGetter<string>) {
  const id = toValue(sid);
  return queryOptions({
    queryKey: sessionQueryKeys.detail(id),
    enabled: Boolean(id),
    staleTime: REALTIME_QUERY_STALE_TIME,
    queryFn: ({ signal }): Promise<PlatformSessionVO | null> =>
      GetSessionAPI(id, silentQueryRequest(signal)).then(({ data }) => data),
  });
}
