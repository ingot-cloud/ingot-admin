import { filterParams, request, type RequestOptions } from "@ingot/admin-core";
import type { R } from "@ingot/admin-core";
import {
  IAM_API_PREFIX,
  type FieldPolicyDraft,
  type FieldPolicyInput,
  type ResourceDetail,
} from "@ingot/admin-common";

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
