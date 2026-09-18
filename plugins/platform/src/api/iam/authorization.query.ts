import { createIamPageQueryOptions } from "@ingot/admin-common";
import { createResourceQueryKeys } from "@ingot/admin-core";
import {
  PlatformAssignmentPageAPI,
  PlatformAuditPageAPI,
  PlatformDelegationPageAPI,
  PlatformRolePageAPI,
  PlatformSharedRolePageAPI,
} from "./authorization";

export const platformRoleQueryKeys = createResourceQueryKeys("iam-platform", "role");
export const platformSharedRoleQueryKeys = createResourceQueryKeys("iam-platform", "shared-role");
export const platformAssignmentQueryKeys = createResourceQueryKeys("iam-platform", "assignment");
export const platformDelegationQueryKeys = createResourceQueryKeys("iam-platform", "delegation");
export const platformAuditQueryKeys = createResourceQueryKeys("iam-platform", "audit");

export const PlatformRolePageQueryOptions = createIamPageQueryOptions(
  platformRoleQueryKeys,
  PlatformRolePageAPI,
);
export const PlatformSharedRolePageQueryOptions = createIamPageQueryOptions(
  platformSharedRoleQueryKeys,
  PlatformSharedRolePageAPI,
);
export const PlatformAssignmentPageQueryOptions = createIamPageQueryOptions(
  platformAssignmentQueryKeys,
  PlatformAssignmentPageAPI,
);
export const PlatformDelegationPageQueryOptions = createIamPageQueryOptions(
  platformDelegationQueryKeys,
  PlatformDelegationPageAPI,
);
export const PlatformAuditPageQueryOptions = createIamPageQueryOptions(
  platformAuditQueryKeys,
  PlatformAuditPageAPI,
);
