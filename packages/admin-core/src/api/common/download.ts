import { request, type RequestOptions } from "@/net";
import type { R } from "@/models";
import type { DownloadLink, DownloadTask, DownloadTaskPage } from "@/models/download";

const PATH = "/api/iam/v1/tenant/downloads";

export function DownloadTaskPageAPI(
  params: { page: number; pageSize: number },
  options?: RequestOptions,
): Promise<R<DownloadTaskPage>> {
  return request.get<DownloadTaskPage>(PATH, params, options);
}

export function DownloadTaskAPI(id: string, options?: RequestOptions): Promise<R<DownloadTask>> {
  return request.get<DownloadTask>(`${PATH}/${id}`, undefined, options);
}

export function DownloadLinkAPI(id: string): Promise<R<DownloadLink>> {
  return request.post<DownloadLink>(`${PATH}/${id}/link`);
}
