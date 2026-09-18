import { filterParams, request, type RequestOptions } from "@ingot/admin-core";
import type { Page, R } from "@ingot/admin-core";
import {
  IAM_API_PREFIX,
  mapIamPage,
  toIamListParams,
  type AssignmentRecord,
  type AuditEntry,
  type CreatedResource,
  type Decision,
  type DelegationRecord,
  type DiagnoseInput,
  type IamListQuery,
  type IamPageResponse,
  type Preview,
  type ResourceDetail,
  type RoleSummary,
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
  params: unknown,
  options?: RequestOptions,
): Promise<R<CreatedResource>> {
  return request.post<CreatedResource>(`${IAM_API_PREFIX}/v1/tenant/roles`, params, options);
}

export function TenantRolePreviewAPI(
  id: string,
  params: unknown,
  options?: RequestOptions,
): Promise<R<Preview>> {
  return request.post<Preview>(`${IAM_API_PREFIX}/v1/tenant/roles/${id}/preview`, params, options);
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
