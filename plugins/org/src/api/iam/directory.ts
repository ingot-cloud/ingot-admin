import { filterParams, request, type RequestOptions } from "@ingot/admin-core";
import type { Page, R } from "@ingot/admin-core";
import {
  IAM_API_PREFIX,
  mapIamPage,
  toIamListParams,
  type ApplicationSummary,
  type CreatedResource,
  type DepartmentRecord,
  type GroupDraft,
  type GroupRecord,
  type IamListQuery,
  type IamPageResponse,
  type MemberCreateInput,
  type MemberDepartmentInput,
  type MemberProfileInput,
  type MemberRecord,
  type MemberStatusInput,
  type OwnerTransferInput,
  type Preview,
  type ResourceDetail,
  type TenantSettingsInput,
  type VersionInput,
} from "@ingot/admin-common";

const MEMBER_PATH = `${IAM_API_PREFIX}/v1/tenant/members`;
const DEPT_PATH = `${IAM_API_PREFIX}/v1/tenant/departments`;
const GROUP_PATH = `${IAM_API_PREFIX}/v1/tenant/groups`;
const SETTINGS_PATH = `${IAM_API_PREFIX}/v1/tenant/settings`;
const APP_PATH = `${IAM_API_PREFIX}/v1/tenant/applications`;
const DIR_MEMBER_PATH = `${IAM_API_PREFIX}/v1/directory/members`;
const DIR_DEPT_PATH = `${IAM_API_PREFIX}/v1/directory/departments`;

const asPage = <T>(res: R<IamPageResponse<T>>): R<Page<T>> => ({
  ...res,
  data: mapIamPage(res.data),
});

export function TenantMemberPageAPI(
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

export function TenantMemberDetailAPI(
  id: string,
  options?: RequestOptions,
): Promise<R<ResourceDetail<MemberRecord>>> {
  return request.get<ResourceDetail<MemberRecord>>(`${MEMBER_PATH}/${id}`, undefined, options);
}

export function TenantMemberCreateAPI(
  params: MemberCreateInput,
  options?: RequestOptions,
): Promise<R<CreatedResource>> {
  filterParams(params);
  return request.post<CreatedResource>(MEMBER_PATH, params, options);
}

export function TenantMemberUpdateAPI(
  id: string,
  params: MemberProfileInput,
  options?: RequestOptions,
): Promise<R<ResourceDetail<MemberRecord>>> {
  filterParams(params);
  return request.patch<ResourceDetail<MemberRecord>>(`${MEMBER_PATH}/${id}`, params, options);
}

export function TenantMemberDepartmentsAPI(
  id: string,
  params: MemberDepartmentInput,
  options?: RequestOptions,
): Promise<R<ResourceDetail<MemberRecord>>> {
  filterParams(params);
  return request.put<ResourceDetail<MemberRecord>>(`${MEMBER_PATH}/${id}/departments`, params, options);
}

export function TenantMemberStatusAPI(
  id: string,
  params: MemberStatusInput,
  options?: RequestOptions,
): Promise<R<CreatedResource>> {
  filterParams(params);
  return request.patch<CreatedResource>(`${MEMBER_PATH}/${id}/status`, params, options);
}

export function TenantMemberRemoveAPI(
  id: string,
  params: VersionInput,
  options?: RequestOptions,
): Promise<R<CreatedResource>> {
  filterParams(params);
  return request.post<CreatedResource>(`${MEMBER_PATH}/${id}/remove`, params, options);
}

export function TenantMemberExportCreateAPI(
  params: unknown,
  options?: RequestOptions,
): Promise<R<CreatedResource>> {
  return request.post<CreatedResource>(`${MEMBER_PATH}/export`, params, options);
}

export function TenantMemberExportDownloadAPI(
  id: string,
  options?: RequestOptions,
): Promise<R<unknown>> {
  return request.get<unknown>(`${MEMBER_PATH}/export/${id}`, undefined, options);
}

export function TenantDepartmentPageAPI(
  page: Page,
  condition?: IamListQuery,
  options?: RequestOptions,
): Promise<R<Page<ResourceDetail<DepartmentRecord>>>> {
  if (condition) {
    filterParams(condition);
  }
  return request
    .get<IamPageResponse<ResourceDetail<DepartmentRecord>>>(
      DEPT_PATH,
      toIamListParams(page, condition),
      options,
    )
    .then(asPage);
}

export function TenantDepartmentCreateAPI(
  params: { name: string; parentId?: string; sortOrder: number },
  options?: RequestOptions,
): Promise<R<CreatedResource>> {
  filterParams(params);
  return request.post<CreatedResource>(DEPT_PATH, params, options);
}

export function TenantDepartmentUpdateAPI(
  id: string,
  params: { expectedVersion: string; name: string; parentId?: string; sortOrder: number },
  options?: RequestOptions,
): Promise<R<ResourceDetail<DepartmentRecord>>> {
  filterParams(params);
  return request.put<ResourceDetail<DepartmentRecord>>(`${DEPT_PATH}/${id}`, params, options);
}

export function TenantDepartmentDeleteAPI(
  id: string,
  options?: RequestOptions,
): Promise<R<void>> {
  return request.delete<void>(`${DEPT_PATH}/${id}`, null, options);
}

export function TenantGroupPageAPI(
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

export function TenantGroupCreateAPI(
  params: GroupDraft,
  options?: RequestOptions,
): Promise<R<CreatedResource>> {
  filterParams(params);
  return request.post<CreatedResource>(GROUP_PATH, params, options);
}

export function TenantGroupPreviewAPI(
  id: string,
  params: GroupDraft,
  options?: RequestOptions,
): Promise<R<Preview>> {
  filterParams(params);
  return request.post<Preview>(`${GROUP_PATH}/${id}/preview`, params, options);
}

export function TenantSettingsAPI(options?: RequestOptions): Promise<R<ResourceDetail<{ name: string; avatar?: string; ownerMemberId?: string }>>> {
  return request.get(`${SETTINGS_PATH}`, undefined, options);
}

export function TenantSettingsUpdateAPI(
  params: TenantSettingsInput,
  options?: RequestOptions,
): Promise<R<ResourceDetail<{ name: string; avatar?: string }>>> {
  filterParams(params);
  return request.put(`${SETTINGS_PATH}`, params, options);
}

export function TenantOwnerTransferAPI(
  params: OwnerTransferInput,
  options?: RequestOptions,
): Promise<R<CreatedResource>> {
  filterParams(params);
  return request.post<CreatedResource>(`${SETTINGS_PATH}/owner-transfer`, params, options);
}

export function TenantApplicationPageAPI(
  page: Page,
  condition?: IamListQuery,
  options?: RequestOptions,
): Promise<R<Page<ResourceDetail<ApplicationSummary>>>> {
  if (condition) {
    filterParams(condition);
  }
  return request
    .get<IamPageResponse<ResourceDetail<ApplicationSummary>>>(
      APP_PATH,
      toIamListParams(page, condition),
      options,
    )
    .then(asPage);
}

export function DirectoryMemberPageAPI(
  page: Page,
  condition?: IamListQuery,
  options?: RequestOptions,
): Promise<R<Page<ResourceDetail<MemberRecord>>>> {
  if (condition) {
    filterParams(condition);
  }
  return request
    .get<IamPageResponse<ResourceDetail<MemberRecord>>>(
      DIR_MEMBER_PATH,
      toIamListParams(page, condition),
      options,
    )
    .then(asPage);
}

export function DirectoryDepartmentPageAPI(
  page: Page,
  condition?: IamListQuery,
  options?: RequestOptions,
): Promise<R<Page<ResourceDetail<DepartmentRecord>>>> {
  if (condition) {
    filterParams(condition);
  }
  return request
    .get<IamPageResponse<ResourceDetail<DepartmentRecord>>>(
      DIR_DEPT_PATH,
      toIamListParams(page, condition),
      options,
    )
    .then(asPage);
}
