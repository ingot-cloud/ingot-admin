import { DownloadLinkAPI } from "@/api/common/download";
import type { DownloadLink, DownloadTask } from "@/models/download";
import { useServerPaging } from "@/query";
import { DownloadPageQueryOptions } from "./downloadQuery";

export function openDownloadLink(link: DownloadLink): void {
  const anchor = document.createElement("a");
  anchor.href = link.url;
  anchor.download = link.filename;
  anchor.rel = "noopener";
  anchor.click();
}

export const useOps = () => {
  const paging = useServerPaging<DownloadTask, Record<string, never>>({
    queryOptions: DownloadPageQueryOptions,
  });
  const linkingId = ref<string>();

  const download = async (task: DownloadTask): Promise<void> => {
    linkingId.value = task.id;
    try {
      openDownloadLink((await DownloadLinkAPI(task.id)).data);
    } catch {
      // 失败提示由请求层展示；文件可能刚好过期，刷新列表以显示最新状态。
      void paging.query.refetch();
    } finally {
      linkingId.value = undefined;
    }
  };

  return {
    loading: paging.loading,
    pageInfo: paging.pageInfo,
    fetchData: paging.fetchData,
    linkingId,
    download,
  };
};
