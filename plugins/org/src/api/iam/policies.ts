import { filterParams, request, type RequestOptions } from "@ingot/admin-core";
import type { R } from "@ingot/admin-core";
import {
  IAM_API_PREFIX,
  type DirectoryPolicyDraft,
  type DirectoryPolicyInput,
  type FieldPolicyDraft,
  type FieldPolicyInput,
  type PolicyPreviewInput,
  type PolicyPreviewResult,
  type Preview,
  type ResourceDetail,
} from "@ingot/admin-common";

export function TenantDirectoryPolicyAPI(
  options?: RequestOptions,
): Promise<R<ResourceDetail<DirectoryPolicyDraft>>> {
  return request.get<ResourceDetail<DirectoryPolicyDraft>>(
    `${IAM_API_PREFIX}/v1/tenant/policies/directory`,
    undefined,
    options,
  );
}

export function TenantDirectoryPolicyUpdateAPI(
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

export function TenantFieldPolicyAPI(
  options?: RequestOptions,
): Promise<R<ResourceDetail<FieldPolicyDraft>>> {
  return request.get<ResourceDetail<FieldPolicyDraft>>(
    `${IAM_API_PREFIX}/v1/tenant/policies/fields`,
    undefined,
    options,
  );
}

export function TenantFieldPolicyUpdateAPI(
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

export function TenantPolicyPreviewAPI(
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
