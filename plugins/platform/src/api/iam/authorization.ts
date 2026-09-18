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

export function PlatformDiagnoseAPI(
  params: DiagnoseInput,
  options?: RequestOptions,
): Promise<R<Decision>> {
  filterParams(params);
  return request.post<Decision>(`${IAM_API_PREFIX}/v1/platform/authorization/diagnose`, params, options);
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
  params: unknown,
  options?: RequestOptions,
): Promise<R<Preview>> {
  return request.post<Preview>(`${rolePath("platform")}/${id}/preview`, params, options);
}

export function PlatformRoleCreateAPI(
  params: unknown,
  options?: RequestOptions,
): Promise<R<CreatedResource>> {
  return request.post<CreatedResource>(rolePath("platform"), params, options);
}
