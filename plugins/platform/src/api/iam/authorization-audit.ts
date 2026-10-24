import { filterParams, request, type R, type RequestOptions, createResourceQueryKeys } from "@ingot/admin-core";
import {
  IAM_API_PREFIX,
  createIamCursorQueryOptions,
  type AuditCursorPage,
  type AuthorizationAuditQuery,
  type IamCursorParams,
} from "@ingot/admin-common";

const PATH = `${IAM_API_PREFIX}/v1/platform/authorization/audits`;

export function AuthorizationAuditCursorAPI(
  params: IamCursorParams,
  condition?: AuthorizationAuditQuery,
  options?: RequestOptions,
): Promise<R<AuditCursorPage>> {
  const query: Record<string, string | number> = { limit: params.limit };
  const fields: Record<string, string | undefined> = {
    cursor: params.cursor,
    actorMemberId: condition?.actorMemberId,
    targetType: condition?.targetType,
    targetId: condition?.targetId,
    changeType: condition?.changeType,
    from: condition?.from,
    until: condition?.until,
  };
  for (const [key, value] of Object.entries(fields)) {
    if (value) query[key] = value;
  }
  filterParams(query);
  return request.get<AuditCursorPage>(PATH, query, options);
}

export const AuthorizationAuditPageQueryOptions = createIamCursorQueryOptions(
  createResourceQueryKeys("iam-platform", "audit"),
  AuthorizationAuditCursorAPI,
);
