import { filterParams, request, type RequestOptions } from "@ingot/admin-core";
import type { Page, R } from "@ingot/admin-core";
import {
  IAM_API_PREFIX,
  mapIamPage,
  toIamListParams,
  type AuditEntry,
  type DirectoryPolicyDraft,
  type DirectoryPolicyInput,
  type FieldPolicyDraft,
  type FieldPolicyInput,
  type IamListQuery,
  type IamPageResponse,
  type PolicyPreviewInput,
  type PolicyPreviewResult,
  type Preview,
  type ResourceDetail,
} from "@ingot/admin-common";

const asPage = <T>(res: R<IamPageResponse<T>>): R<Page<T>> => ({
  ...res,
  data: mapIamPage(res.data),
});

export function SecurityDirectoryPolicyAPI(
  options?: RequestOptions,
): Promise<R<ResourceDetail<DirectoryPolicyDraft>>> {
  return request.get<ResourceDetail<DirectoryPolicyDraft>>(
    `${IAM_API_PREFIX}/v1/tenant/policies/directory`,
    undefined,
    options,
  );
}

export function SecurityDirectoryPolicyUpdateAPI(
  params: DirectoryPolicyInput,
  options?: RequestOptions,
): Promise<R<ResourceDetail<DirectoryPolicyDraft>>> {
  filterParams(params);
  return request.put<ResourceDetail<DirectoryPolicyDraft>>(
    `${IAM_API_PREFIX}/v1/tenant/policies/directory`,
    params,
    options,
  );
}

export function SecurityFieldPolicyAPI(
  options?: RequestOptions,
): Promise<R<ResourceDetail<FieldPolicyDraft>>> {
  return request.get<ResourceDetail<FieldPolicyDraft>>(
    `${IAM_API_PREFIX}/v1/tenant/policies/fields`,
    undefined,
    options,
  );
}

export function SecurityFieldPolicyUpdateAPI(
  params: FieldPolicyInput,
  options?: RequestOptions,
): Promise<R<ResourceDetail<FieldPolicyDraft>>> {
  filterParams(params);
  return request.put<ResourceDetail<FieldPolicyDraft>>(
    `${IAM_API_PREFIX}/v1/tenant/policies/fields`,
    params,
    options,
  );
}

export function SecurityPolicyPreviewAPI(
  params: PolicyPreviewInput,
  options?: RequestOptions,
): Promise<R<Preview<PolicyPreviewResult>>> {
  filterParams(params);
  return request.post<Preview<PolicyPreviewResult>>(
    `${IAM_API_PREFIX}/v1/tenant/policies/preview`,
    params,
    options,
  );
}

export function SecurityAuditPageAPI(
  page: Page,
  condition?: IamListQuery & { domain?: string },
  options?: RequestOptions,
): Promise<R<Page<ResourceDetail<AuditEntry>>>> {
  if (condition) {
    filterParams(condition);
  }
  const domain = condition?.domain === "PLATFORM" ? "platform" : "tenant";
  const query = { ...condition };
  delete query.domain;
  return request
    .get<IamPageResponse<ResourceDetail<AuditEntry>>>(
      `${IAM_API_PREFIX}/v1/${domain}/authorization/audits`,
      toIamListParams(page, query),
      options,
    )
    .then(asPage);
}
