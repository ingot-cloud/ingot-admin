import {
  createIamPageQueryOptions,
  type AuthorizationAuditQuery,
  type AuditEntry,
  type ResourceDetail,
} from "@ingot/admin-common";
import {
  createResourceQueryKeys,
  usePermissions,
  type Page,
  type RequestOptions,
  type ServerPagingQueryInput,
} from "@ingot/admin-core";
import type { MaybeRefOrGetter } from "vue";
import { SecurityAuditPageAPI } from "./policies";

export const securityAuditQueryKeys = createResourceQueryKeys("iam-security", "audit");

export const SecurityAuditPageQueryOptions = (
  input: MaybeRefOrGetter<ServerPagingQueryInput<AuthorizationAuditQuery>>,
) => {
  const domain = usePermissions().domain;
  return createIamPageQueryOptions<ResourceDetail<AuditEntry>, AuthorizationAuditQuery>(
    securityAuditQueryKeys,
    (page: Page, condition?: AuthorizationAuditQuery, options?: RequestOptions) =>
      SecurityAuditPageAPI(domain, page, condition, options),
  )(input);
};
