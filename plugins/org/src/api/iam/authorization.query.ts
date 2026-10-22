import { createIamPageQueryOptions } from "@ingot/admin-common";
import { createResourceQueryKeys } from "@ingot/admin-core";
import {
  TenantAssignmentPageAPI,
  TenantAuditPageAPI,
  TenantDelegationPageAPI,
  TenantRolePageAPI,
  TenantRoleSourcePageAPI,
  TenantRoleSubjectPageAPI,
} from "./authorization";

export const tenantRoleQueryKeys = createResourceQueryKeys("iam-tenant", "role");
export const tenantAssignmentQueryKeys = createResourceQueryKeys("iam-tenant", "assignment");
export const tenantDelegationQueryKeys = createResourceQueryKeys("iam-tenant", "delegation");
export const tenantAuditQueryKeys = createResourceQueryKeys("iam-tenant", "audit");

export const TenantRolePageQueryOptions = createIamPageQueryOptions(
  tenantRoleQueryKeys,
  TenantRolePageAPI,
);
export const TenantAssignmentPageQueryOptions = createIamPageQueryOptions(
  tenantAssignmentQueryKeys,
  TenantAssignmentPageAPI,
);
export const TenantDelegationPageQueryOptions = createIamPageQueryOptions(
  tenantDelegationQueryKeys,
  TenantDelegationPageAPI,
);
export const TenantAuditPageQueryOptions = createIamPageQueryOptions(
  tenantAuditQueryKeys,
  TenantAuditPageAPI,
);
export const TenantRoleSubjectPageQueryOptions = createIamPageQueryOptions(
  createResourceQueryKeys("iam-tenant", "role-subject"),
  TenantRoleSubjectPageAPI,
);
export const TenantRoleSourcePageQueryOptions = createIamPageQueryOptions(
  createResourceQueryKeys("iam-tenant", "role-source"),
  TenantRoleSourcePageAPI,
);
