import { filterParams, request, type RequestOptions } from "@ingot/admin-core";
import type { R } from "@ingot/admin-core";
import {
  IAM_API_PREFIX,
  type FieldPolicyDraft,
  type FieldPolicyInput,
  type FieldPolicyResource,
  type ResourceDetail,
} from "@ingot/admin-common";

export function TenantFieldPolicyResourceAPI(
  options?: RequestOptions,
): Promise<R<FieldPolicyResource[]>> {
  return request.get<FieldPolicyResource[]>(
    `${IAM_API_PREFIX}/v1/tenant/policies/field-resources`,
    undefined,
    options,
  );
}

export function TenantFieldPolicyAPI(
  resourceId: string,
  options?: RequestOptions,
): Promise<R<ResourceDetail<FieldPolicyDraft>>> {
  return request.get<ResourceDetail<FieldPolicyDraft>>(
    `${IAM_API_PREFIX}/v1/tenant/policies/fields/${resourceId}`,
    undefined,
    options,
  );
}

export function TenantFieldPolicyUpdateAPI(
  resourceId: string,
  params: FieldPolicyInput,
  options?: RequestOptions,
): Promise<R<ResourceDetail<FieldPolicyDraft>>> {
  filterParams(params);
  return request.put<ResourceDetail<FieldPolicyDraft>>(
    `${IAM_API_PREFIX}/v1/tenant/policies/fields/${resourceId}`,
    params,
    options,
  );
}
