import { queryOptions } from "@tanstack/vue-query";
import { toValue, type MaybeRefOrGetter } from "vue";
import { DownloadTaskPageAPI } from "@/api/common/download";
import type { Page } from "@/models";
import { isDownloadTaskActive, type DownloadTask, type DownloadTaskPage } from "@/models/download";
import {
  createResourceQueryKeys,
  REALTIME_QUERY_STALE_TIME,
  silentQueryRequest,
  snapshotQueryParams,
  type ServerPagingQueryInput,
} from "@/query";
import { usePermissions } from "@/stores/modules/auth";

/** 存在排队或生成中的任务时，列表静默刷新的间隔。 */
export const DOWNLOAD_POLL_INTERVAL_MS = 3000;

export const downloadQueryKeys = createResourceQueryKeys("common", "download");

/** 下载记录按人隔离，切换身份或组织后不复用缓存。 */
function downloadQueryContext() {
  const state = usePermissions();
  return {
    contextEpoch: state.contextEpoch,
    domain: state.domain,
    memberId: state.memberId,
    tenantId: state.tenantId,
  };
}

export function toDownloadPage(
  result: DownloadTaskPage,
  current: number,
  size: number,
): Page<DownloadTask> {
  return {
    current,
    size,
    total: Number(result.total),
    records: result.items ?? [],
  };
}

export function hasActiveDownload(page?: Page<DownloadTask>): boolean {
  return Boolean(page?.records?.some((task) => isDownloadTaskActive(task.status)));
}

export function DownloadPageQueryOptions(
  input: MaybeRefOrGetter<ServerPagingQueryInput<Record<string, never>>>,
) {
  const value = toValue(input);
  return queryOptions<Page<DownloadTask>>({
    queryKey: downloadQueryKeys.list(
      snapshotQueryParams({
        ...downloadQueryContext(),
        current: value.current,
        size: value.size,
      }),
    ),
    staleTime: REALTIME_QUERY_STALE_TIME,
    refetchInterval: (query) =>
      hasActiveDownload(query.state.data) ? DOWNLOAD_POLL_INTERVAL_MS : false,
    queryFn: ({ signal }): Promise<Page<DownloadTask>> =>
      DownloadTaskPageAPI(
        { page: value.current, pageSize: value.size },
        silentQueryRequest(signal),
      ).then(({ data }) => toDownloadPage(data, value.current, value.size)),
  });
}
