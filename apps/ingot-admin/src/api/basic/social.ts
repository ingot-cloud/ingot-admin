import request from "@/net";
import type { R, Page, SysSocialDetails } from "@/models";
import { filterParams } from "@/utils/object";

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
  return request.get<Page<SysSocialDetails>>("/api/pms/v1/admin/social/page", {
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
  return request.post<void>("/api/pms/v1/admin/social", params);
}

/**
 * 更新社交信息
 * @param params 参数
 * @returns
 */
export function UpdateSocialAPI(params: SysSocialDetails): Promise<R<void>> {
  filterParams(params);
  return request.put<void>("/api/pms/v1/admin/social", params);
}

/**
 * 删除社交信息
 * @param id id
 * @returns
 */
export function RemoveSocialAPI(id: string): Promise<R<void>> {
  return request.delete<void>(`/api/pms/v1/admin/social/${id}`);
}
