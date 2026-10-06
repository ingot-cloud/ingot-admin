import { filterParams, request, type RequestOptions } from "@ingot/admin-core";
import type { Page, R } from "@ingot/admin-core";
import {
  IAM_API_PREFIX,
  mapIamPage,
  toIamListParams,
  type CreatedResource,
  type AssignmentRecord,
  type GroupDraft,
  type GroupRecord,
  type GroupUpdateInput,
  type IamListQuery,
  type IamPageResponse,
  type MemberCreateInput,
  type PlatformMemberContext,
  type PlatformMemberEditInput,
  type PlatformMemberEditPreview,
  type MemberBoundRole,
  type AssignmentEffectiveStatus,
  type MemberRecord,
  type MemberRoleReplaceInput,
  type MemberRoleView,
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

export function PlatformMemberContextAPI(
  options?: RequestOptions,
): Promise<R<PlatformMemberContext>> {
  return request.get<PlatformMemberContext>(`${MEMBER_PATH}/context`, undefined, options);
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
  params: PlatformMemberEditInput,
  options?: RequestOptions,
): Promise<R<ResourceDetail<MemberRecord>>> {
  return request.patch<ResourceDetail<MemberRecord>>(`${MEMBER_PATH}/${id}`, params, options);
}

export function PlatformMemberEditPreviewAPI(
  id: string,
  params: PlatformMemberEditInput,
  options?: RequestOptions,
): Promise<R<Preview<PlatformMemberEditPreview>>> {
  return request.post<Preview<PlatformMemberEditPreview>>(
    `${MEMBER_PATH}/${id}/preview`,
    params,
    options,
  );
}

export function PlatformMemberBoundRolesAPI(
  id: string,
  page: Page,
  options?: RequestOptions,
): Promise<R<Page<MemberBoundRole>>> {
  return request
    .get<IamPageResponse<MemberBoundRole>>(
      `${MEMBER_PATH}/${id}/bound-roles`,
      toIamListParams(page),
      options,
    )
    .then(asPage);
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

export function PlatformMemberRolesAPI(
  id: string,
  options?: RequestOptions,
): Promise<R<MemberRoleView[]>> {
  return request.get<MemberRoleView[]>(`${MEMBER_PATH}/${id}/roles`, undefined, options);
}

export function PlatformMemberAssignmentsAPI(
  id: string,
  page: Page,
  options?: RequestOptions,
  condition?: { effectiveStatus?: AssignmentEffectiveStatus; directOnly?: boolean },
): Promise<R<Page<ResourceDetail<AssignmentRecord>>>> {
  return request
    .get<IamPageResponse<ResourceDetail<AssignmentRecord>>>(
      `${MEMBER_PATH}/${id}/assignments`,
      { ...toIamListParams(page), ...condition },
      options,
    )
    .then(asPage);
}

export function PlatformMemberRolesReplaceAPI(
  id: string,
  params: MemberRoleReplaceInput,
  options?: RequestOptions,
): Promise<R<MemberRoleView[]>> {
  return request.put<MemberRoleView[]>(`${MEMBER_PATH}/${id}/roles`, params, options);
}

export function PlatformMemberGroupsAPI(
  id: string,
  page: Page,
  options?: RequestOptions,
): Promise<R<Page<ResourceDetail<GroupRecord>>>> {
  return request
    .get<IamPageResponse<ResourceDetail<GroupRecord>>>(
      `${MEMBER_PATH}/${id}/groups`,
      toIamListParams(page),
      options,
    )
    .then(asPage);
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

export function PlatformGroupMembersAPI(
  page: Page,
  condition?: IamListQuery,
  options?: RequestOptions,
): Promise<R<Page<ResourceDetail<MemberRecord>>>> {
  return request
    .get<IamPageResponse<ResourceDetail<MemberRecord>>>(
      `${GROUP_PATH}/${condition?.groupId}/members`,
      toIamListParams(page, { name: condition?.name }),
      options,
    )
    .then(asPage);
}

export function PlatformGroupPreviewAPI(
  id: string,
  params: GroupUpdateInput,
  options?: RequestOptions,
): Promise<R<Preview<ReferenceImpactPreview>>> {
  filterParams(params);
  return request.post<Preview<ReferenceImpactPreview>>(
    `${GROUP_PATH}/${id}/preview`,
    params,
    options,
  );
}
