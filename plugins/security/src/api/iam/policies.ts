import { filterParams, request, type RequestOptions } from "@ingot/admin-core";
import type { Page, R } from "@ingot/admin-core";
import {
  IAM_API_PREFIX,
  mapIamPage,
  toIamListParams,
  type AuditEntry,
  type IamListQuery,
  type IamPageResponse,
  type Preview,
  type ResourceDetail,
} from "@ingot/admin-common";

const asPage = <T>(res: R<IamPageResponse<T>>): R<Page<T>> => ({
  ...res,
  data: mapIamPage(res.data),
});

export function SecurityDirectoryPolicyAPI(options?: RequestOptions): Promise<R<unknown>> {
  return request.get(`${IAM_API_PREFIX}/v1/tenant/policies/directory`, undefined, options);
}

export function SecurityFieldPolicyAPI(options?: RequestOptions): Promise<R<unknown>> {
  return request.get(`${IAM_API_PREFIX}/v1/tenant/policies/fields`, undefined, options);
}

export function SecurityPolicyPreviewAPI(
  params: unknown,
  options?: RequestOptions,
): Promise<R<Preview>> {
  return request.post<Preview>(`${IAM_API_PREFIX}/v1/tenant/policies/preview`, params, options);
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
