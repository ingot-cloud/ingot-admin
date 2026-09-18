import { createIamPageQueryOptions } from "@ingot/admin-common";
import { createResourceQueryKeys } from "@ingot/admin-core";
import {
  DirectoryMemberPageAPI,
  TenantApplicationPageAPI,
  TenantDepartmentPageAPI,
  TenantGroupPageAPI,
  TenantMemberPageAPI,
} from "./directory";

export const tenantMemberQueryKeys = createResourceQueryKeys("iam-tenant", "member");
export const tenantDepartmentQueryKeys = createResourceQueryKeys("iam-tenant", "department");
export const tenantGroupQueryKeys = createResourceQueryKeys("iam-tenant", "group");
export const tenantApplicationQueryKeys = createResourceQueryKeys("iam-tenant", "application");
export const directoryMemberQueryKeys = createResourceQueryKeys("iam-tenant", "directory-member");

export const TenantMemberPageQueryOptions = createIamPageQueryOptions(
  tenantMemberQueryKeys,
  TenantMemberPageAPI,
);
export const TenantDepartmentPageQueryOptions = createIamPageQueryOptions(
  tenantDepartmentQueryKeys,
  TenantDepartmentPageAPI,
);
export const TenantGroupPageQueryOptions = createIamPageQueryOptions(
  tenantGroupQueryKeys,
  TenantGroupPageAPI,
);
export const TenantApplicationPageQueryOptions = createIamPageQueryOptions(
  tenantApplicationQueryKeys,
  TenantApplicationPageAPI,
);
export const DirectoryMemberPageQueryOptions = createIamPageQueryOptions(
  directoryMemberQueryKeys,
  DirectoryMemberPageAPI,
);
