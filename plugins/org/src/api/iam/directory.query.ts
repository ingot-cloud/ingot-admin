import { createIamPageQueryOptions } from "@ingot/admin-common";
import { createResourceQueryKeys } from "@ingot/admin-core";
import {
  TenantApplicationPageAPI,
  TenantDepartmentPageAPI,
  TenantGroupEffectiveMembersAPI,
  TenantGroupSummaryPageAPI,
  TenantMemberPageAPI,
} from "./directory";

export const tenantMemberQueryKeys = createResourceQueryKeys("iam-tenant", "member");
export const tenantDepartmentQueryKeys = createResourceQueryKeys("iam-tenant", "department");
export const tenantGroupQueryKeys = createResourceQueryKeys("iam-tenant", "group-summary");
export const tenantGroupEffectiveMemberQueryKeys = createResourceQueryKeys(
  "iam-tenant",
  "group-effective-member",
);
export const tenantApplicationQueryKeys = createResourceQueryKeys("iam-tenant", "application");

export const TenantMemberPageQueryOptions = createIamPageQueryOptions(
  tenantMemberQueryKeys,
  TenantMemberPageAPI,
);
export const TenantDepartmentPageQueryOptions = createIamPageQueryOptions(
  tenantDepartmentQueryKeys,
  TenantDepartmentPageAPI,
);
export const TenantGroupSummaryPageQueryOptions = createIamPageQueryOptions(
  tenantGroupQueryKeys,
  TenantGroupSummaryPageAPI,
);
export const TenantGroupEffectiveMemberPageQueryOptions = createIamPageQueryOptions(
  tenantGroupEffectiveMemberQueryKeys,
  TenantGroupEffectiveMembersAPI,
);
export const TenantApplicationPageQueryOptions = createIamPageQueryOptions(
  tenantApplicationQueryKeys,
  TenantApplicationPageAPI,
);
