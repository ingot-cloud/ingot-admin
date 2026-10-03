import { filterParams, request, type RequestOptions } from "@ingot/admin-core";
import type { Page, R } from "@ingot/admin-core";
import {
  IAM_API_PREFIX,
  type AssignmentContext,
  type AuthorizationCandidatesApi,
  type AuthorizationRoleCandidateQuery,
  type AuthorizationRoleNode,
  mapIamPage,
  toIamListParams,
  type AssignmentRecord,
  type AuditEntry,
  type ConfigurationStatusInput,
  type CreatedResource,
  type Decision,
  type DelegationRecord,
  type DiagnoseInput,
  type IamListQuery,
  type RoleWorkspaceQuery,
  type IamPageResponse,
  type Preview,
  type ReferenceImpactPreview,
  type ResourceDetail,
  type RoleCreateInput,
  type RoleGrantList,
  type RolePreviewInput,
  type RolePublishInput,
  type RoleRevision,
  type RoleSummary,
  type RoleUpdateInput,
  type AssignmentBatchInput,
  type AssignmentPreviewResult,
  type AssignmentUpdateInput,
  type DelegationInput,
  type DelegationUpdateInput,
} from "@ingot/admin-common";

const rolePath = (domain: "platform" | "tenant") => `${IAM_API_PREFIX}/v1/${domain}/roles`;
const sharedPath = `${IAM_API_PREFIX}/v1/platform/shared-roles`;

const asPage = <T>(res: R<IamPageResponse<T>>): R<Page<T>> => ({
  ...res,
  data: mapIamPage(res.data),
});

export function PlatformRolePageAPI(
  page: Page,
  condition?: IamListQuery,
  options?: RequestOptions,
): Promise<R<Page<ResourceDetail<RoleSummary>>>> {
  if (condition) {
    filterParams(condition);
  }
  return request
    .get<IamPageResponse<ResourceDetail<RoleSummary>>>(
      rolePath("platform"),
      toIamListParams(page, condition),
      options,
    )
    .then(asPage);
}

export function PlatformSharedRolePageAPI(
  page: Page,
  condition?: IamListQuery,
  options?: RequestOptions,
): Promise<R<Page<ResourceDetail<RoleSummary>>>> {
  if (condition) {
    filterParams(condition);
  }
  return request
    .get<IamPageResponse<ResourceDetail<RoleSummary>>>(
      sharedPath,
      toIamListParams(page, condition),
      options,
    )
    .then(asPage);
}

export function PlatformAssignmentPageAPI(
  page: Page,
  condition?: IamListQuery,
  options?: RequestOptions,
): Promise<R<Page<ResourceDetail<AssignmentRecord>>>> {
  if (condition) {
    filterParams(condition);
  }
  return request
    .get<IamPageResponse<ResourceDetail<AssignmentRecord>>>(
      `${IAM_API_PREFIX}/v1/platform/assignments`,
      toIamListParams(page, condition),
      options,
    )
    .then(asPage);
}

export function PlatformAssignmentCreateAPI(
  params: AssignmentBatchInput,
  options?: RequestOptions,
): Promise<R<CreatedResource>> {
  return request.post<CreatedResource>(
    `${IAM_API_PREFIX}/v1/platform/assignments`,
    params,
    options,
  );
}

export function PlatformAssignmentPreviewAPI(
  params: AssignmentBatchInput,
  options?: RequestOptions,
): Promise<R<Preview<AssignmentPreviewResult>>> {
  return request.post<Preview<AssignmentPreviewResult>>(
    `${IAM_API_PREFIX}/v1/platform/assignments/preview`,
    params,
    options,
  );
}

export function PlatformAssignmentUpdateAPI(
  id: string,
  params: AssignmentUpdateInput,
  options?: RequestOptions,
): Promise<R<ResourceDetail<AssignmentRecord>>> {
  filterParams(params);
  return request.put<ResourceDetail<AssignmentRecord>>(
    `${IAM_API_PREFIX}/v1/platform/assignments/${id}`,
    params,
    options,
  );
}

export function PlatformAssignmentDeleteAPI(
  id: string,
  options?: RequestOptions,
): Promise<R<CreatedResource>> {
  return request.delete<CreatedResource>(
    `${IAM_API_PREFIX}/v1/platform/assignments/${id}`,
    null,
    options,
  );
}

export function PlatformDelegationPageAPI(
  page: Page,
  condition?: IamListQuery,
  options?: RequestOptions,
): Promise<R<Page<ResourceDetail<DelegationRecord>>>> {
  if (condition) {
    filterParams(condition);
  }
  return request
    .get<IamPageResponse<ResourceDetail<DelegationRecord>>>(
      `${IAM_API_PREFIX}/v1/platform/delegations`,
      toIamListParams(page, condition),
      options,
    )
    .then(asPage);
}

export function PlatformDelegationCreateAPI(
  params: DelegationInput,
  options?: RequestOptions,
): Promise<R<CreatedResource>> {
  return request.post<CreatedResource>(
    `${IAM_API_PREFIX}/v1/platform/delegations`,
    params,
    options,
  );
}

export function PlatformDelegationDetailAPI(
  id: string,
  options?: RequestOptions,
): Promise<R<ResourceDetail<DelegationRecord>>> {
  return request.get<ResourceDetail<DelegationRecord>>(
    `${IAM_API_PREFIX}/v1/platform/delegations/${id}`,
    undefined,
    options,
  );
}

export function PlatformDelegationUpdateAPI(
  id: string,
  params: DelegationUpdateInput,
  options?: RequestOptions,
): Promise<R<ResourceDetail<DelegationRecord>>> {
  filterParams(params);
  return request.put<ResourceDetail<DelegationRecord>>(
    `${IAM_API_PREFIX}/v1/platform/delegations/${id}`,
    params,
    options,
  );
}

export function PlatformDelegationDeleteAPI(
  id: string,
  options?: RequestOptions,
): Promise<R<CreatedResource>> {
  return request.delete<CreatedResource>(
    `${IAM_API_PREFIX}/v1/platform/delegations/${id}`,
    null,
    options,
  );
}

export function PlatformDelegationPreviewAPI(
  id: string,
  params: DelegationUpdateInput,
  options?: RequestOptions,
): Promise<R<Preview<ReferenceImpactPreview>>> {
  filterParams(params);
  return request.post<Preview<ReferenceImpactPreview>>(
    `${IAM_API_PREFIX}/v1/platform/delegations/${id}/preview`,
    params,
    options,
  );
}

export function PlatformDiagnoseAPI(
  params: DiagnoseInput,
  options?: RequestOptions,
): Promise<R<Decision>> {
  filterParams(params);
  return request.post<Decision>(
    `${IAM_API_PREFIX}/v1/platform/authorization/diagnose`,
    params,
    options,
  );
}

export function PlatformAuditPageAPI(
  page: Page,
  condition?: IamListQuery,
  options?: RequestOptions,
): Promise<R<Page<ResourceDetail<AuditEntry>>>> {
  if (condition) {
    filterParams(condition);
  }
  return request
    .get<IamPageResponse<ResourceDetail<AuditEntry>>>(
      `${IAM_API_PREFIX}/v1/platform/authorization/audits`,
      toIamListParams(page, condition),
      options,
    )
    .then(asPage);
}

export function PlatformRolePreviewAPI(
  id: string,
  params: RolePreviewInput,
  options?: RequestOptions,
): Promise<R<Preview>> {
  return request.post<Preview>(`${rolePath("platform")}/${id}/preview`, params, options);
}

export function PlatformRoleCreateAPI(
  params: RoleCreateInput,
  options?: RequestOptions,
): Promise<R<CreatedResource>> {
  return request.post<CreatedResource>(rolePath("platform"), params, options);
}

export function PlatformRoleDetailAPI(
  id: string,
  options?: RequestOptions,
): Promise<R<ResourceDetail<RoleSummary>>> {
  return request.get<ResourceDetail<RoleSummary>>(
    `${rolePath("platform")}/${id}`,
    undefined,
    options,
  );
}

export function PlatformRoleGrantsAPI(
  id: string,
  options?: RequestOptions,
): Promise<R<RoleGrantList>> {
  return request.get<RoleGrantList>(`${rolePath("platform")}/${id}/grants`, undefined, options);
}

export function PlatformRoleStatusAPI(
  id: string,
  params: ConfigurationStatusInput,
  options?: RequestOptions,
): Promise<R<CreatedResource>> {
  filterParams(params);
  return request.patch<CreatedResource>(`${rolePath("platform")}/${id}`, params, options);
}

export function PlatformRoleUpdateAPI(
  id: string,
  params: RoleUpdateInput,
  options?: RequestOptions,
): Promise<R<CreatedResource>> {
  filterParams(params);
  return request.patch<CreatedResource>(`${rolePath("platform")}/${id}`, params, options);
}

export function PlatformRoleDeleteAPI(
  id: string,
  options?: RequestOptions,
): Promise<R<CreatedResource>> {
  return request.delete<CreatedResource>(`${rolePath("platform")}/${id}`, null, options);
}

export function PlatformRoleRevisionPageAPI(
  id: string,
  page: Page,
  options?: RequestOptions,
): Promise<R<Page<ResourceDetail<RoleRevision>>>> {
  return request
    .get<IamPageResponse<ResourceDetail<RoleRevision>>>(
      `${rolePath("platform")}/${id}/revisions`,
      toIamListParams(page),
      options,
    )
    .then(asPage);
}

export function PlatformRolePublishAPI(
  id: string,
  params: RolePublishInput,
  options?: RequestOptions,
): Promise<R<CreatedResource>> {
  filterParams(params);
  return request.post<CreatedResource>(`${rolePath("platform")}/${id}/revisions`, params, options);
}

export function PlatformSharedRoleCreateAPI(
  params: RoleCreateInput,
  options?: RequestOptions,
): Promise<R<CreatedResource>> {
  return request.post<CreatedResource>(sharedPath, params, options);
}

export function PlatformSharedRoleDetailAPI(
  id: string,
  options?: RequestOptions,
): Promise<R<ResourceDetail<RoleSummary>>> {
  return request.get<ResourceDetail<RoleSummary>>(`${sharedPath}/${id}`, undefined, options);
}

export function PlatformSharedRoleGrantsAPI(
  id: string,
  options?: RequestOptions,
): Promise<R<RoleGrantList>> {
  return request.get<RoleGrantList>(`${sharedPath}/${id}/grants`, undefined, options);
}

export function PlatformSharedRoleStatusAPI(
  id: string,
  params: ConfigurationStatusInput,
  options?: RequestOptions,
): Promise<R<CreatedResource>> {
  filterParams(params);
  return request.patch<CreatedResource>(`${sharedPath}/${id}`, params, options);
}

export function PlatformSharedRoleUpdateAPI(
  id: string,
  params: RoleUpdateInput,
  options?: RequestOptions,
): Promise<R<CreatedResource>> {
  filterParams(params);
  return request.patch<CreatedResource>(`${sharedPath}/${id}`, params, options);
}

export function PlatformSharedRoleDeleteAPI(
  id: string,
  options?: RequestOptions,
): Promise<R<CreatedResource>> {
  return request.delete<CreatedResource>(`${sharedPath}/${id}`, null, options);
}

export function PlatformSharedRoleRevisionPageAPI(
  id: string,
  page: Page,
  options?: RequestOptions,
): Promise<R<Page<ResourceDetail<RoleRevision>>>> {
  return request
    .get<IamPageResponse<ResourceDetail<RoleRevision>>>(
      `${sharedPath}/${id}/revisions`,
      toIamListParams(page),
      options,
    )
    .then(asPage);
}

export function PlatformSharedRolePublishAPI(
  id: string,
  params: RolePublishInput,
  options?: RequestOptions,
): Promise<R<CreatedResource>> {
  filterParams(params);
  return request.post<CreatedResource>(`${sharedPath}/${id}/revisions`, params, options);
}

export function PlatformSharedRolePreviewAPI(
  id: string,
  params: RolePreviewInput,
  options?: RequestOptions,
): Promise<R<Preview>> {
  return request.post<Preview>(`${sharedPath}/${id}/preview`, params, options);
}

export const PlatformAssignmentContextAPI = (): Promise<R<AssignmentContext>> =>
  request.get<AssignmentContext>(`${IAM_API_PREFIX}/v1/platform/assignments/context`);
export const PlatformAssignmentDetailAPI = (
  id: string,
): Promise<R<ResourceDetail<AssignmentRecord>>> =>
  request.get<ResourceDetail<AssignmentRecord>>(`${IAM_API_PREFIX}/v1/platform/assignments/${id}`);
export const PlatformAssignmentUpdatePreviewAPI = (
  id: string,
  input: AssignmentUpdateInput,
): Promise<R<Preview<AssignmentPreviewResult>>> =>
  request.post<Preview<AssignmentPreviewResult>>(
    `${IAM_API_PREFIX}/v1/platform/assignments/${id}/preview`,
    input,
  );
export const PlatformAssignmentCandidatesAPI: AuthorizationCandidatesApi = (query) =>
  request.get(`${IAM_API_PREFIX}/v1/platform/assignments/candidates`, query);

export function PlatformAssignmentRoleCandidatesAPI(
  query: AuthorizationRoleCandidateQuery,
): Promise<R<IamPageResponse<AuthorizationRoleNode>>> {
  const params = { ...query };
  filterParams(params);
  return request.get<IamPageResponse<AuthorizationRoleNode>>(
    `${IAM_API_PREFIX}/v1/platform/assignments/role-candidates`,
    params,
  );
}
export const PlatformDelegationCandidatesAPI: AuthorizationCandidatesApi = (query) =>
  request.get(`${IAM_API_PREFIX}/v1/platform/delegations/candidates`, query);
export function PlatformDelegationRoleCandidatesAPI(
  query: AuthorizationRoleCandidateQuery,
): Promise<R<IamPageResponse<AuthorizationRoleNode>>> {
  const params = { ...query };
  filterParams(params);
  return request.get<IamPageResponse<AuthorizationRoleNode>>(
    `${IAM_API_PREFIX}/v1/platform/delegations/role-candidates`,
    params,
  );
}
export const PlatformDiagnoseCandidatesAPI: AuthorizationCandidatesApi = (query) =>
  request.get(`${IAM_API_PREFIX}/v1/platform/authorization/diagnose/candidates`, query);

export const PlatformDelegationCreatePreviewAPI = (
  input: DelegationInput,
): Promise<R<Preview<ReferenceImpactPreview>>> =>
  request.post<Preview<ReferenceImpactPreview>>(
    `${IAM_API_PREFIX}/v1/platform/delegations/preview`,
    input,
  );

/** 委派已选实体的真实关系分页，只返回当前候选边界内的内容。 */
export const PlatformDelegationSelectedCandidatesAPI: import("@ingot/admin-common").DelegationSelectedCandidatesApi =
  (id, query) =>
    request.get(`${IAM_API_PREFIX}/v1/platform/delegations/${id}/selected-candidates`, query);

/** 角色所有固定版本的有效接收主体，服务端完成可见性过滤及去重。 */
export const PlatformRoleSubjectsAPI = (
  id: string,
  kind: "members" | "groups",
  query: RoleWorkspaceQuery,
): Promise<R<import("@ingot/admin-common").RoleSubjectPage>> =>
  request.get(`${rolePath("platform")}/${id}/${kind}`, query);
export const PlatformRoleMemberSourcesAPI = (
  id: string,
  memberId: string,
  query: RoleWorkspaceQuery,
): Promise<R<IamPageResponse<ResourceDetail<AssignmentRecord>>>> =>
  request.get(`${rolePath("platform")}/${id}/members/${memberId}/assignments`, query);

export function PlatformRoleSubjectPageAPI(
  page: Page,
  condition?: RoleWorkspaceQuery,
  options?: RequestOptions,
): Promise<R<Page<import("@ingot/admin-common").RoleSubjectSummary>>> {
  const { roleId, subjectKind, ...query } = condition || {};
  return request
    .get<import("@ingot/admin-common").RoleSubjectPage>(
      `${rolePath("platform")}/${roleId}/${subjectKind}`,
      toIamListParams(page, query),
      options,
    )
    .then((response) => ({
      ...response,
      data: {
        ...mapIamPage(response.data),
        inheritedSourcesRestricted: response.data.inheritedSourcesRestricted,
      },
    }));
}
export function PlatformRoleSourcePageAPI(
  page: Page,
  condition?: RoleWorkspaceQuery,
  options?: RequestOptions,
): Promise<R<Page<ResourceDetail<AssignmentRecord>>>> {
  const { roleId, memberId, ...query } = condition || {};
  return request
    .get<IamPageResponse<ResourceDetail<AssignmentRecord>>>(
      `${rolePath("platform")}/${roleId}/members/${memberId}/assignments`,
      toIamListParams(page, query),
      options,
    )
    .then(asPage);
}
