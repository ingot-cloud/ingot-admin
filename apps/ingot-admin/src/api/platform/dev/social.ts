import request from "@/net";
import type { R, Page, SysSocialDetails } from "@/models";
import { filterParams } from "@/utils/object";

const PATH = "/api/pms/v1/platform/dev/social";

/**
 * 获取分页信息
 * @returns
 */
export function SocialPageAPI(
  page: Page,
  condition?: SysSocialDetails,
): Promise<R<Page<SysSocialDetails>>> {
  if (condition) {
    filterParams(condition);
  }
  return request.get<Page<SysSocialDetails>>(`${PATH}/page`, {
    ...page,
    ...condition,
  });
}

/**
 * 创建社交信息
 * @param params 参数
 * @returns
 */
export function CreateSocialAPI(params: SysSocialDetails): Promise<R<void>> {
  filterParams(params);
  return request.post<void>(`${PATH}`, params);
}

/**
 * 更新社交信息
 * @param params 参数
 * @returns
 */
export function UpdateSocialAPI(params: SysSocialDetails): Promise<R<void>> {
  filterParams(params);
  return request.put<void>(`${PATH}`, params);
}

/**
 * 删除社交信息
 * @param id id
 * @returns
 */
export function RemoveSocialAPI(id: string): Promise<R<void>> {
  return request.delete<void>(`${PATH}/${id}`);
}
