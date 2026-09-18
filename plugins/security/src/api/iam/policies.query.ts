import { createIamPageQueryOptions } from "@ingot/admin-common";
import { createResourceQueryKeys } from "@ingot/admin-core";
import { SecurityAuditPageAPI } from "./policies";

export const securityAuditQueryKeys = createResourceQueryKeys("iam-security", "audit");

export const SecurityAuditPageQueryOptions = createIamPageQueryOptions(
  securityAuditQueryKeys,
  SecurityAuditPageAPI,
);
