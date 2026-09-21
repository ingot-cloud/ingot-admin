import { filterParams, request, type RequestOptions } from "@ingot/admin-core";
import type { Page, R } from "@ingot/admin-core";
import {
  IAM_API_PREFIX,
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
  type IamPageResponse,
  type Preview,
  type ReferenceImpactPreview,
  type ResourceDetail,
  type RoleCreateInput,
  type RolePreviewInput,
  type RolePublishInput,
  type RoleRevision,
  type RoleSummary,
  type UpgradeInput,
  type UpgradePreview,
  type UpgradePreviewInput,
  type AssignmentBatchInput,
  type AssignmentPreviewResult,
  type AssignmentUpdateInput,
  type DelegationInput,
  type DelegationUpdateInput,
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
  params: RoleCreateInput,
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
  params: ConfigurationStatusInput,
  options?: RequestOptions,
): Promise<R<CreatedResource>> {
  filterParams(params);
  return request.patch<CreatedResource>(`${IAM_API_PREFIX}/v1/tenant/roles/${id}`, params, options);
}

export function TenantRoleDeleteAPI(
  id: string,
  options?: RequestOptions,
): Promise<R<CreatedResource>> {
  return request.delete<CreatedResource>(`${IAM_API_PREFIX}/v1/tenant/roles/${id}`, null, options);
}

export function TenantRoleRevisionPageAPI(
  id: string,
  page: Page,
  options?: RequestOptions,
): Promise<R<Page<ResourceDetail<RoleRevision>>>> {
  return request
    .get<IamPageResponse<ResourceDetail<RoleRevision>>>(
      `${IAM_API_PREFIX}/v1/tenant/roles/${id}/revisions`,
      toIamListParams(page),
      options,
    )
    .then(asPage);
}

export function TenantRolePublishAPI(
  id: string,
  params: RolePublishInput,
  options?: RequestOptions,
): Promise<R<CreatedResource>> {
  filterParams(params);
  return request.post<CreatedResource>(
    `${IAM_API_PREFIX}/v1/tenant/roles/${id}/revisions`,
    params,
    options,
  );
}

export function TenantRolePreviewAPI(
  id: string,
  params: RolePreviewInput,
  options?: RequestOptions,
): Promise<R<Preview>> {
  return request.post<Preview>(`${IAM_API_PREFIX}/v1/tenant/roles/${id}/preview`, params, options);
}

export function TenantRoleUpgradePreviewAPI(
  id: string,
  params: UpgradePreviewInput,
  options?: RequestOptions,
): Promise<R<Preview<UpgradePreview>>> {
  return request.post<Preview<UpgradePreview>>(
    `${IAM_API_PREFIX}/v1/tenant/roles/${id}/upgrade-preview`,
    params,
    options,
  );
}

export function TenantRoleUpgradeAPI(
  id: string,
  params: UpgradeInput,
  options?: RequestOptions,
): Promise<R<CreatedResource>> {
  filterParams(params);
  return request.post<CreatedResource>(`${IAM_API_PREFIX}/v1/tenant/roles/${id}/upgrade`, params, options);
}

export function TenantAssignmentPageAPI(
  page: Page,
  condition?: IamListQuery,
  options?: RequestOptions,
): Promise<R<Page<ResourceDetail<AssignmentRecord>>>> {
  if (condition) {
    filterParams(condition);
  }
  return request
    .get<IamPageResponse<ResourceDetail<AssignmentRecord>>>(
      `${IAM_API_PREFIX}/v1/tenant/assignments`,
      toIamListParams(page, condition),
      options,
    )
    .then(asPage);
}

export function TenantAssignmentCreateAPI(
  params: AssignmentBatchInput,
  options?: RequestOptions,
): Promise<R<CreatedResource>> {
  return request.post<CreatedResource>(`${IAM_API_PREFIX}/v1/tenant/assignments`, params, options);
}

export function TenantAssignmentPreviewAPI(
  params: AssignmentBatchInput,
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
  params: AssignmentUpdateInput,
  options?: RequestOptions,
): Promise<R<ResourceDetail<AssignmentRecord>>> {
  filterParams(params);
  return request.put<ResourceDetail<AssignmentRecord>>(
    `${IAM_API_PREFIX}/v1/tenant/assignments/${id}`,
    params,
    options,
  );
}

export function TenantAssignmentDeleteAPI(
  id: string,
  options?: RequestOptions,
): Promise<R<CreatedResource>> {
  return request.delete<CreatedResource>(`${IAM_API_PREFIX}/v1/tenant/assignments/${id}`, null, options);
}

export function TenantDelegationPageAPI(
  page: Page,
  condition?: IamListQuery,
  options?: RequestOptions,
): Promise<R<Page<ResourceDetail<DelegationRecord>>>> {
  if (condition) {
    filterParams(condition);
  }
  return request
    .get<IamPageResponse<ResourceDetail<DelegationRecord>>>(
      `${IAM_API_PREFIX}/v1/tenant/delegations`,
      toIamListParams(page, condition),
      options,
    )
    .then(asPage);
}

export function TenantDelegationCreateAPI(
  params: DelegationInput,
  options?: RequestOptions,
): Promise<R<CreatedResource>> {
  return request.post<CreatedResource>(`${IAM_API_PREFIX}/v1/tenant/delegations`, params, options);
}

export function TenantDelegationDetailAPI(
  id: string,
  options?: RequestOptions,
): Promise<R<ResourceDetail<DelegationRecord>>> {
  return request.get<ResourceDetail<DelegationRecord>>(
    `${IAM_API_PREFIX}/v1/tenant/delegations/${id}`,
    undefined,
    options,
  );
}

export function TenantDelegationUpdateAPI(
  id: string,
  params: DelegationUpdateInput,
  options?: RequestOptions,
): Promise<R<ResourceDetail<DelegationRecord>>> {
  filterParams(params);
  return request.put<ResourceDetail<DelegationRecord>>(
    `${IAM_API_PREFIX}/v1/tenant/delegations/${id}`,
    params,
    options,
  );
}

export function TenantDelegationDeleteAPI(
  id: string,
  options?: RequestOptions,
): Promise<R<CreatedResource>> {
  return request.delete<CreatedResource>(`${IAM_API_PREFIX}/v1/tenant/delegations/${id}`, null, options);
}

export function TenantDelegationPreviewAPI(
  id: string,
  params: DelegationUpdateInput,
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
  return request.post<Decision>(`${IAM_API_PREFIX}/v1/tenant/authorization/diagnose`, params, options);
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
