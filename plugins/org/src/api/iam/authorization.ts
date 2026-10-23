import { filterParams, request, type RequestOptions } from "@ingot/admin-core";
import type { Page, R } from "@ingot/admin-core";
import {
  IAM_API_PREFIX,
  mapIamPage,
  toIamListParams,
  type AuditEntry,
  type CurrentRoleProfileInput,
  type CreatedResource,
  type Decision,
  type DiagnoseInput,
  type IamListQuery,
  type IamPageResponse,
  type Preview,
  type ReferenceImpactPreview,
  type ResourceDetail,
  type CurrentRoleCreateInput,
  type CurrentRolePermissionInput,
  type TenantAssignmentRecord,
  type TenantAssignmentInput,
  type TenantDelegationRecord,
  type TenantDelegationInput,
  type CurrentRoleGrantList,
  type TenantDelegationMine,
  type TenantAssignmentOption,
  type TenantAssignmentOptionKind,
  type CurrentRoleCatalogAction,
  type RoleSubjectPage,
  type RoleSubjectSummary,
  type RoleWorkspaceQuery,
  type RoleSummary,
  type AssignmentPreviewResult,
  type AuthorizationCandidatesApi,
} from "@ingot/admin-common";

const asPage = <T>(res: R<IamPageResponse<T>>): R<Page<T>> => ({
  ...res,
  data: mapIamPage(res.data),
});

export function TenantRolePageAPI(
  page: Page,
  condition?: IamListQuery,
  options?: RequestOptions,
): Promise<R<Page<ResourceDetail<RoleSummary>>>> {
  if (condition) {
    filterParams(condition);
  }
  return request
    .get<IamPageResponse<ResourceDetail<RoleSummary>>>(
      `${IAM_API_PREFIX}/v1/tenant/roles`,
      toIamListParams(page, condition),
      options,
    )
    .then(asPage);
}

export function TenantRoleCreateAPI(
  params: CurrentRoleCreateInput,
  options?: RequestOptions,
): Promise<R<CreatedResource>> {
  return request.post<CreatedResource>(`${IAM_API_PREFIX}/v1/tenant/roles`, params, options);
}

export function TenantRoleDetailAPI(
  id: string,
  options?: RequestOptions,
): Promise<R<ResourceDetail<RoleSummary>>> {
  return request.get<ResourceDetail<RoleSummary>>(
    `${IAM_API_PREFIX}/v1/tenant/roles/${id}`,
    undefined,
    options,
  );
}

export function TenantRoleStatusAPI(
  id: string,
  params: CurrentRoleProfileInput,
  options?: RequestOptions,
): Promise<R<ResourceDetail<RoleSummary>>> {
  filterParams(params);
  return request.patch<ResourceDetail<RoleSummary>>(
    `${IAM_API_PREFIX}/v1/tenant/roles/${id}`,
    params,
    options,
  );
}

export function TenantRoleDeleteAPI(
  id: string,
  options?: RequestOptions,
): Promise<R<CreatedResource>> {
  return request.delete<CreatedResource>(`${IAM_API_PREFIX}/v1/tenant/roles/${id}`, null, options);
}

export function TenantRolePreviewAPI(
  id: string,
  params: CurrentRolePermissionInput,
  options?: RequestOptions,
): Promise<R<Preview>> {
  return request.post<Preview>(`${IAM_API_PREFIX}/v1/tenant/roles/${id}/preview`, params, options);
}

export function TenantAssignmentPageAPI(
  page: Page,
  condition?: IamListQuery,
  options?: RequestOptions,
): Promise<R<Page<ResourceDetail<TenantAssignmentRecord>>>> {
  if (condition) {
    filterParams(condition);
  }
  return request
    .get<IamPageResponse<ResourceDetail<TenantAssignmentRecord>>>(
      `${IAM_API_PREFIX}/v1/tenant/assignments`,
      toIamListParams(page, condition),
      options,
    )
    .then(asPage);
}

export function TenantAssignmentCreateAPI(
  params: { items: TenantAssignmentInput[] },
  options?: RequestOptions,
): Promise<R<CreatedResource>> {
  return request.post<CreatedResource>(`${IAM_API_PREFIX}/v1/tenant/assignments`, params, options);
}

export function TenantAssignmentScopeCandidatesAPI(query: {
  roleId: string;
  parameterKey: string;
  delegationGrantId?: string;
  keyword?: string;
  ids?: string[];
  page?: number;
  pageSize?: number;
  tree?: boolean;
  parentId?: string;
}): Promise<R<import("@ingot/admin-common").AuthorizationCandidatePage>> {
  return request.get(`${IAM_API_PREFIX}/v1/tenant/assignments/scope-candidates`, query);
}

export function TenantAssignmentPreviewAPI(
  params: { items: TenantAssignmentInput[] },
  options?: RequestOptions,
): Promise<R<Preview<AssignmentPreviewResult>>> {
  return request.post<Preview<AssignmentPreviewResult>>(
    `${IAM_API_PREFIX}/v1/tenant/assignments/preview`,
    params,
    options,
  );
}

export function TenantAssignmentUpdateAPI(
  id: string,
  params: { expectedVersion: string; assignment: TenantAssignmentInput },
  options?: RequestOptions,
): Promise<R<ResourceDetail<TenantAssignmentRecord>>> {
  filterParams(params);
  return request.put<ResourceDetail<TenantAssignmentRecord>>(
    `${IAM_API_PREFIX}/v1/tenant/assignments/${id}`,
    params,
    options,
  );
}

export function TenantAssignmentDeleteAPI(
  id: string,
  options?: RequestOptions,
): Promise<R<CreatedResource>> {
  return request.delete<CreatedResource>(
    `${IAM_API_PREFIX}/v1/tenant/assignments/${id}`,
    null,
    options,
  );
}

export function TenantDelegationPageAPI(
  page: Page,
  condition?: IamListQuery,
  options?: RequestOptions,
): Promise<R<Page<ResourceDetail<TenantDelegationRecord>>>> {
  if (condition) {
    filterParams(condition);
  }
  return request
    .get<IamPageResponse<ResourceDetail<TenantDelegationRecord>>>(
      `${IAM_API_PREFIX}/v1/tenant/delegations`,
      toIamListParams(page, condition),
      options,
    )
    .then(asPage);
}

export function TenantDelegationCreateAPI(
  params: TenantDelegationInput,
  options?: RequestOptions,
): Promise<R<CreatedResource>> {
  return request.post<CreatedResource>(`${IAM_API_PREFIX}/v1/tenant/delegations`, params, options);
}

export function TenantDelegationDetailAPI(
  id: string,
  options?: RequestOptions,
): Promise<R<ResourceDetail<TenantDelegationRecord>>> {
  return request.get<ResourceDetail<TenantDelegationRecord>>(
    `${IAM_API_PREFIX}/v1/tenant/delegations/${id}`,
    undefined,
    options,
  );
}

export function TenantDelegationUpdateAPI(
  id: string,
  params: { expectedVersion: string; delegation: TenantDelegationInput },
  options?: RequestOptions,
): Promise<R<ResourceDetail<TenantDelegationRecord>>> {
  filterParams(params);
  return request.put<ResourceDetail<TenantDelegationRecord>>(
    `${IAM_API_PREFIX}/v1/tenant/delegations/${id}`,
    params,
    options,
  );
}

export function TenantDelegationDeleteAPI(
  id: string,
  options?: RequestOptions,
): Promise<R<CreatedResource>> {
  return request.delete<CreatedResource>(
    `${IAM_API_PREFIX}/v1/tenant/delegations/${id}`,
    null,
    options,
  );
}

export function TenantDelegationPreviewAPI(
  id: string,
  params: { expectedVersion: string; delegation: TenantDelegationInput },
  options?: RequestOptions,
): Promise<R<Preview<ReferenceImpactPreview>>> {
  filterParams(params);
  return request.post<Preview<ReferenceImpactPreview>>(
    `${IAM_API_PREFIX}/v1/tenant/delegations/${id}/preview`,
    params,
    options,
  );
}

export function TenantDiagnoseAPI(
  params: DiagnoseInput,
  options?: RequestOptions,
): Promise<R<Decision>> {
  filterParams(params);
  return request.post<Decision>(
    `${IAM_API_PREFIX}/v1/tenant/authorization/diagnose`,
    params,
    options,
  );
}

export function TenantAuditPageAPI(
  page: Page,
  condition?: IamListQuery,
  options?: RequestOptions,
): Promise<R<Page<ResourceDetail<AuditEntry>>>> {
  if (condition) {
    filterParams(condition);
  }
  return request
    .get<IamPageResponse<ResourceDetail<AuditEntry>>>(
      `${IAM_API_PREFIX}/v1/tenant/authorization/audits`,
      toIamListParams(page, condition),
      options,
    )
    .then(asPage);
}

export function TenantDirectoryPolicyAPI(options?: RequestOptions): Promise<R<unknown>> {
  return request.get(`${IAM_API_PREFIX}/v1/tenant/policies/directory`, undefined, options);
}

export function TenantFieldPolicyAPI(options?: RequestOptions): Promise<R<unknown>> {
  return request.get(`${IAM_API_PREFIX}/v1/tenant/policies/fields`, undefined, options);
}

export function TenantPolicyPreviewAPI(
  params: unknown,
  options?: RequestOptions,
): Promise<R<Preview>> {
  return request.post<Preview>(`${IAM_API_PREFIX}/v1/tenant/policies/preview`, params, options);
}

export function TenantAssignmentOptionsAPI(query: {
  departmentId?: string;
  kind: TenantAssignmentOptionKind;
  delegationGrantId?: string;
  keyword?: string;
  ids?: string[];
  page?: number;
  pageSize?: number;
}): Promise<R<IamPageResponse<TenantAssignmentOption>>> {
  return request.get(`${IAM_API_PREFIX}/v1/tenant/assignments/options`, query);
}
export const TenantDiagnoseCandidatesAPI: AuthorizationCandidatesApi = (query) =>
  request.get(`${IAM_API_PREFIX}/v1/tenant/authorization/diagnose/candidates`, query);
export function TenantAssignmentRoleDefinitionAPI(
  id: string,
  delegationGrantId?: string,
): Promise<R<CurrentRoleGrantList>> {
  return request.get(`${IAM_API_PREFIX}/v1/tenant/assignments/roles/${id}`, { delegationGrantId });
}
export function TenantDelegationMineAPI(): Promise<R<TenantDelegationMine[]>> {
  return request.get(`${IAM_API_PREFIX}/v1/tenant/delegations/mine`);
}
/** 角色当前有效成员或用户组，服务端去重并展开可见组继承。 */
export function TenantRoleSubjectPageAPI(
  page: Page,
  condition?: RoleWorkspaceQuery,
  options?: RequestOptions,
): Promise<R<Page<RoleSubjectSummary> & { inheritedSourcesRestricted?: boolean }>> {
  const { roleId, subjectKind, ...query } = condition || {};
  return request
    .get<RoleSubjectPage>(
      `${IAM_API_PREFIX}/v1/tenant/roles/${roleId}/${subjectKind}`,
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

/** 一名成员持有该角色的直接分配和组继承来源。 */
export function TenantRoleSourcePageAPI(
  page: Page,
  condition?: RoleWorkspaceQuery,
  options?: RequestOptions,
): Promise<R<Page<ResourceDetail<TenantAssignmentRecord>>>> {
  const { roleId, memberId, ...query } = condition || {};
  return request
    .get<IamPageResponse<ResourceDetail<TenantAssignmentRecord>>>(
      `${IAM_API_PREFIX}/v1/tenant/roles/${roleId}/members/${memberId}/assignments`,
      toIamListParams(page, query),
      options,
    )
    .then(asPage);
}

export function TenantRoleGrantCatalogAPI(
  applicationId: string,
  keyword?: string,
): Promise<R<CurrentRoleCatalogAction[]>> {
  return request.get<CurrentRoleCatalogAction[]>(
    `${IAM_API_PREFIX}/v1/tenant/roles/grant-catalog`,
    { applicationId, keyword },
  );
}
export function TenantDelegationScopeCandidatesAPI(query: {
  resourceId: string;
  parameterKey: string;
  keyword?: string;
  ids?: string[];
  page?: number;
  pageSize?: number;
}): Promise<R<import("@ingot/admin-common").AuthorizationCandidatePage>> {
  return request.get(`${IAM_API_PREFIX}/v1/tenant/delegations/scope-candidates`, query);
}
