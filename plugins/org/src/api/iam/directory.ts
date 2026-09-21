import { filterParams, request, type RequestOptions } from "@ingot/admin-core";
import type { Page, R } from "@ingot/admin-core";
import {
  IAM_API_PREFIX,
  mapIamPage,
  toIamListParams,
  SelectionPurpose,
  type AccountLookupInput,
  type AccountRecord,
  type ActionRecord,
  type AudienceDraft,
  type AudienceUpdateInput,
  type CreatedResource,
  type DepartmentDraft,
  type DepartmentRecord,
  type DepartmentUpdateInput,
  type EntitlementRecord,
  type ExportTask,
  type GroupDraft,
  type GroupRecord,
  type GroupUpdateInput,
  type IamListQuery,
  type IamPageResponse,
  type MemberCreateInput,
  type MemberDepartmentInput,
  type MemberProfileInput,
  type MemberRecord,
  type MemberStatusInput,
  type OwnerTransferInput,
  type Preview,
  type ReferenceImpactPreview,
  type ResourceDetail,
  type TenantRecord,
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

const toPurposeParams = (
  page: Page,
  condition: IamListQuery | undefined,
  purpose: SelectionPurpose,
): Record<string, unknown> => {
  if (condition) {
    filterParams(condition);
  }
  return {
    ...toIamListParams(page, condition),
    purpose,
  };
};

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
  params: VersionInput,
  options?: RequestOptions,
): Promise<R<CreatedResource>> {
  filterParams(params);
  return request.post<CreatedResource>(`${MEMBER_PATH}/export`, params, options);
}

export function TenantMemberExportStatusAPI(
  id: string,
  options?: RequestOptions,
): Promise<R<ExportTask>> {
  return request.get<ExportTask>(`${MEMBER_PATH}/export/${id}/status`, undefined, options);
}

export function TenantMemberExportDownloadAPI(
  id: string,
  options?: RequestOptions,
): Promise<R<Page<ResourceDetail<MemberRecord>>>> {
  return request
    .get<IamPageResponse<ResourceDetail<MemberRecord>>>(
      `${MEMBER_PATH}/export/${id}`,
      undefined,
      options,
    )
    .then(asPage);
}

export function TenantAccountLookupAPI(
  params: AccountLookupInput,
  options?: RequestOptions,
): Promise<R<ResourceDetail<AccountRecord>>> {
  filterParams(params);
  return request.post<ResourceDetail<AccountRecord>>(
    `${IAM_API_PREFIX}/v1/platform/accounts/lookup`,
    params,
    options,
  );
}

export function TenantDepartmentPageAPI(
  page: Page,
  condition?: IamListQuery,
  options?: RequestOptions,
): Promise<R<Page<ResourceDetail<DepartmentRecord>>>> {
  return request
    .get<IamPageResponse<ResourceDetail<DepartmentRecord>>>(
      DEPT_PATH,
      toPurposeParams(page, condition, SelectionPurpose.MANAGED_DEPARTMENT),
      options,
    )
    .then(asPage);
}

export function TenantDepartmentCreateAPI(
  params: DepartmentDraft,
  options?: RequestOptions,
): Promise<R<CreatedResource>> {
  filterParams(params);
  return request.post<CreatedResource>(DEPT_PATH, params, options);
}

export function TenantDepartmentDetailAPI(
  id: string,
  options?: RequestOptions,
): Promise<R<ResourceDetail<DepartmentRecord>>> {
  return request.get<ResourceDetail<DepartmentRecord>>(`${DEPT_PATH}/${id}`, undefined, options);
}

export function TenantDepartmentUpdateAPI(
  id: string,
  params: DepartmentUpdateInput,
  options?: RequestOptions,
): Promise<R<ResourceDetail<DepartmentRecord>>> {
  filterParams(params);
  return request.put<ResourceDetail<DepartmentRecord>>(`${DEPT_PATH}/${id}`, params, options);
}

export function TenantDepartmentDeleteAPI(
  id: string,
  options?: RequestOptions,
): Promise<R<CreatedResource>> {
  return request.delete<CreatedResource>(`${DEPT_PATH}/${id}`, null, options);
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

export function TenantGroupDetailAPI(
  id: string,
  options?: RequestOptions,
): Promise<R<ResourceDetail<GroupRecord>>> {
  return request.get<ResourceDetail<GroupRecord>>(`${GROUP_PATH}/${id}`, undefined, options);
}

export function TenantGroupUpdateAPI(
  id: string,
  params: GroupUpdateInput,
  options?: RequestOptions,
): Promise<R<ResourceDetail<GroupRecord>>> {
  filterParams(params);
  return request.put<ResourceDetail<GroupRecord>>(`${GROUP_PATH}/${id}`, params, options);
}

export function TenantGroupDeleteAPI(
  id: string,
  options?: RequestOptions,
): Promise<R<CreatedResource>> {
  return request.delete<CreatedResource>(`${GROUP_PATH}/${id}`, null, options);
}

export function TenantGroupPreviewAPI(
  id: string,
  params: GroupUpdateInput,
  options?: RequestOptions,
): Promise<R<Preview<ReferenceImpactPreview>>> {
  filterParams(params);
  return request.post<Preview<ReferenceImpactPreview>>(`${GROUP_PATH}/${id}/preview`, params, options);
}

export function TenantSettingsAPI(options?: RequestOptions): Promise<R<ResourceDetail<TenantRecord>>> {
  return request.get(`${SETTINGS_PATH}`, undefined, options);
}

export function TenantSettingsUpdateAPI(
  params: TenantSettingsInput,
  options?: RequestOptions,
): Promise<R<ResourceDetail<TenantRecord>>> {
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
): Promise<R<Page<ResourceDetail<EntitlementRecord>>>> {
  if (condition) {
    filterParams(condition);
  }
  return request
    .get<IamPageResponse<ResourceDetail<EntitlementRecord>>>(
      APP_PATH,
      toIamListParams(page, condition),
      options,
    )
    .then(asPage);
}

export function TenantApplicationAudienceAPI(
  id: string,
  options?: RequestOptions,
): Promise<R<ResourceDetail<AudienceDraft>>> {
  return request.get<ResourceDetail<AudienceDraft>>(`${APP_PATH}/${id}/audience`, undefined, options);
}

export function TenantApplicationAudienceUpdateAPI(
  id: string,
  params: AudienceUpdateInput,
  options?: RequestOptions,
): Promise<R<ResourceDetail<AudienceDraft>>> {
  filterParams(params);
  return request.put<ResourceDetail<AudienceDraft>>(`${APP_PATH}/${id}/audience`, params, options);
}

export function TenantApplicationActionPageAPI(
  id: string,
  page: Page,
  options?: RequestOptions,
): Promise<R<Page<ResourceDetail<ActionRecord>>>> {
  return request
    .get<IamPageResponse<ResourceDetail<ActionRecord>>>(
      `${APP_PATH}/${id}/actions`,
      toIamListParams(page),
      options,
    )
    .then(asPage);
}

export function DirectoryMemberPageAPI(
  page: Page,
  condition?: IamListQuery,
  options?: RequestOptions,
): Promise<R<Page<ResourceDetail<MemberRecord>>>> {
  return request
    .get<IamPageResponse<ResourceDetail<MemberRecord>>>(
      DIR_MEMBER_PATH,
      toPurposeParams(page, condition, SelectionPurpose.DIRECTORY),
      options,
    )
    .then(asPage);
}

export function DirectoryMemberDetailAPI(
  id: string,
  options?: RequestOptions,
): Promise<R<ResourceDetail<MemberRecord>>> {
  return request.get<ResourceDetail<MemberRecord>>(`${DIR_MEMBER_PATH}/${id}`, undefined, options);
}

export function DirectoryDepartmentPageAPI(
  page: Page,
  condition?: IamListQuery,
  options?: RequestOptions,
): Promise<R<Page<ResourceDetail<DepartmentRecord>>>> {
  return request
    .get<IamPageResponse<ResourceDetail<DepartmentRecord>>>(
      DIR_DEPT_PATH,
      toPurposeParams(page, condition, SelectionPurpose.DIRECTORY),
      options,
    )
    .then(asPage);
}
