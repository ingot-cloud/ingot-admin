import { filterParams, request, type RequestOptions } from "@ingot/admin-core";
import type { Page, R } from "@ingot/admin-core";
import {
  AuthorizationDomain,
  IAM_API_PREFIX,
  type AuthorizationAuditQuery,
  mapIamPage,
  toIamListParams,
  type AuditEntry,
  type DirectoryPolicyDraft,
  type DirectoryPolicyInput,
  type FieldPolicyDraft,
  type FieldPolicyInput,
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

/** 当前域由会话 Query 捕获，筛选条件不参与选择管理域。 */
export function SecurityAuditPageAPI(
  domain: string | undefined,
  page: Page,
  condition?: AuthorizationAuditQuery,
  options?: RequestOptions,
): Promise<R<Page<ResourceDetail<AuditEntry>>>> {
  let path: string;
  if (domain === AuthorizationDomain.PLATFORM) {
    path = "platform";
  } else if (domain === AuthorizationDomain.TENANT) {
    path = "tenant";
  } else {
    return Promise.reject(new Error("当前管理身份无效，请重新认证"));
  }
  const query: AuthorizationAuditQuery = {
    actorMemberId: condition?.actorMemberId,
    targetType: condition?.targetType,
    targetId: condition?.targetId,
    changeType: condition?.changeType,
    from: condition?.from,
    until: condition?.until,
  };
  filterParams(query);
  return request
    .get<IamPageResponse<ResourceDetail<AuditEntry>>>(
      `${IAM_API_PREFIX}/v1/${path}/authorization/audits`,
      toIamListParams(page, query),
      options,
    )
    .then(asPage);
}
