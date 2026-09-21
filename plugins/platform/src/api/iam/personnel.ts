import { filterParams, request, type RequestOptions } from "@ingot/admin-core";
import type { Page, R } from "@ingot/admin-core";
import {
  IAM_API_PREFIX,
  mapIamPage,
  toIamListParams,
  type CreatedResource,
  type GroupDraft,
  type GroupRecord,
  type GroupUpdateInput,
  type IamListQuery,
  type IamPageResponse,
  type MemberCreateInput,
  type MemberProfileInput,
  type MemberRecord,
  type MemberStatusInput,
  type Preview,
  type ReferenceImpactPreview,
  type ResourceDetail,
  type VersionInput,
} from "@ingot/admin-common";

const MEMBER_PATH = `${IAM_API_PREFIX}/v1/platform/members`;
const GROUP_PATH = `${IAM_API_PREFIX}/v1/platform/groups`;

const asPage = <T>(res: R<IamPageResponse<T>>): R<Page<T>> => ({
  ...res,
  data: mapIamPage(res.data),
});

export function PlatformMemberPageAPI(
  page: Page,
  condition?: IamListQuery,
  options?: RequestOptions,
): Promise<R<Page<ResourceDetail<MemberRecord>>>> {
  if (condition) {
    filterParams(condition);
  }
  return request
    .get<IamPageResponse<ResourceDetail<MemberRecord>>>(
      MEMBER_PATH,
      toIamListParams(page, condition),
      options,
    )
    .then(asPage);
}

export function PlatformMemberDetailAPI(
  id: string,
  options?: RequestOptions,
): Promise<R<ResourceDetail<MemberRecord>>> {
  return request.get<ResourceDetail<MemberRecord>>(`${MEMBER_PATH}/${id}`, undefined, options);
}

export function PlatformMemberCreateAPI(
  params: MemberCreateInput,
  options?: RequestOptions,
): Promise<R<CreatedResource>> {
  filterParams(params);
  return request.post<CreatedResource>(MEMBER_PATH, params, options);
}

export function PlatformMemberUpdateAPI(
  id: string,
  params: MemberProfileInput,
  options?: RequestOptions,
): Promise<R<ResourceDetail<MemberRecord>>> {
  filterParams(params);
  return request.patch<ResourceDetail<MemberRecord>>(`${MEMBER_PATH}/${id}`, params, options);
}

export function PlatformMemberStatusAPI(
  id: string,
  params: MemberStatusInput,
  options?: RequestOptions,
): Promise<R<CreatedResource>> {
  filterParams(params);
  return request.patch<CreatedResource>(`${MEMBER_PATH}/${id}/status`, params, options);
}

export function PlatformMemberRemoveAPI(
  id: string,
  params: VersionInput,
  options?: RequestOptions,
): Promise<R<CreatedResource>> {
  filterParams(params);
  return request.post<CreatedResource>(`${MEMBER_PATH}/${id}/remove`, params, options);
}

export function PlatformGroupPageAPI(
  page: Page,
  condition?: IamListQuery,
  options?: RequestOptions,
): Promise<R<Page<ResourceDetail<GroupRecord>>>> {
  if (condition) {
    filterParams(condition);
  }
  return request
    .get<IamPageResponse<ResourceDetail<GroupRecord>>>(
      GROUP_PATH,
      toIamListParams(page, condition),
      options,
    )
    .then(asPage);
}

export function PlatformGroupCreateAPI(
  params: GroupDraft,
  options?: RequestOptions,
): Promise<R<CreatedResource>> {
  filterParams(params);
  return request.post<CreatedResource>(GROUP_PATH, params, options);
}

export function PlatformGroupDetailAPI(
  id: string,
  options?: RequestOptions,
): Promise<R<ResourceDetail<GroupRecord>>> {
  return request.get<ResourceDetail<GroupRecord>>(`${GROUP_PATH}/${id}`, undefined, options);
}

export function PlatformGroupUpdateAPI(
  id: string,
  params: GroupUpdateInput,
  options?: RequestOptions,
): Promise<R<ResourceDetail<GroupRecord>>> {
  filterParams(params);
  return request.put<ResourceDetail<GroupRecord>>(`${GROUP_PATH}/${id}`, params, options);
}

export function PlatformGroupDeleteAPI(
  id: string,
  options?: RequestOptions,
): Promise<R<CreatedResource>> {
  return request.delete<CreatedResource>(`${GROUP_PATH}/${id}`, null, options);
}

export function PlatformGroupPreviewAPI(
  id: string,
  params: GroupUpdateInput,
  options?: RequestOptions,
): Promise<R<Preview<ReferenceImpactPreview>>> {
  filterParams(params);
  return request.post<Preview<ReferenceImpactPreview>>(`${GROUP_PATH}/${id}/preview`, params, options);
}
