import {
  filterParams,
  request,
  type Page,
  type R,
  type RequestOptions,
  createResourceQueryKeys,
} from "@ingot/admin-core";
import {
  IAM_API_PREFIX,
  mapIamPage,
  toIamListParams,
  createIamPageQueryOptions,
  type AuthorizationAuditQuery,
  type AuditEntry,
  type ResourceDetail,
  type IamPageResponse,
} from "@ingot/admin-common";
const PATH = `${IAM_API_PREFIX}/v1/tenant/authorization/audits`;
export function AuthorizationAuditPageAPI(
  page: Page,
  condition?: AuthorizationAuditQuery,
  options?: RequestOptions,
): Promise<R<Page<ResourceDetail<AuditEntry>>>> {
  const query = {
    actorMemberId: condition?.actorMemberId,
    targetType: condition?.targetType,
    targetId: condition?.targetId,
    changeType: condition?.changeType,
    from: condition?.from,
    until: condition?.until,
  };
  filterParams(query);
  return request
    .get<IamPageResponse<ResourceDetail<AuditEntry>>>(PATH, toIamListParams(page, query), options)
    .then((res) => ({ ...res, data: mapIamPage(res.data) }));
}
export const AuthorizationAuditPageQueryOptions = createIamPageQueryOptions(
  createResourceQueryKeys("iam-tenant", "audit"),
  AuthorizationAuditPageAPI,
);
