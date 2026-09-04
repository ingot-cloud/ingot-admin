import { request, type RequestOptions } from "@ingot/admin-core";
import type { R, Page, SysSocialDetails } from "@/models";
import { filterParams } from "@ingot/admin-core";

const PATH = "/api/pms/v1/platform/dev/social";

export function SocialPageAPI(
  page: Page,
  condition?: SysSocialDetails,
  options?: RequestOptions,
): Promise<R<Page<SysSocialDetails>>> {
  if (condition) {
    filterParams(condition);
  }
  return request.get<Page<SysSocialDetails>>(
    `${PATH}/page`,
    {
      ...page,
      ...condition,
    },
    options,
  );
}

export function CreateSocialAPI(
  params: SysSocialDetails,
  options?: RequestOptions,
): Promise<R<void>> {
  filterParams(params);
  return request.post<void>(`${PATH}`, params, options);
}

export function UpdateSocialAPI(
  params: SysSocialDetails,
  options?: RequestOptions,
): Promise<R<void>> {
  filterParams(params);
  return request.put<void>(`${PATH}`, params, options);
}

export function RemoveSocialAPI(id: string, options?: RequestOptions): Promise<R<void>> {
  return request.delete<void>(`${PATH}/${id}`, null, options);
}
