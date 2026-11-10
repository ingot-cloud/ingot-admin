import { createIamPageQueryOptions } from "@ingot/admin-common";
import { createResourceQueryKeys } from "@ingot/admin-core";
import { PlatformGroupMembersAPI, PlatformGroupSummaryPageAPI, PlatformMemberPageAPI } from "./personnel";

export const platformMemberQueryKeys = createResourceQueryKeys("iam-platform", "member");
export const platformGroupQueryKeys = createResourceQueryKeys("iam-platform", "group-summary");
export const platformGroupMemberQueryKeys = createResourceQueryKeys("iam-platform", "group-member");

export const PlatformMemberPageQueryOptions = createIamPageQueryOptions(
  platformMemberQueryKeys,
  PlatformMemberPageAPI,
);

export const PlatformGroupSummaryPageQueryOptions = createIamPageQueryOptions(
  platformGroupQueryKeys,
  PlatformGroupSummaryPageAPI,
);

export const PlatformGroupMemberPageQueryOptions = createIamPageQueryOptions(
  platformGroupMemberQueryKeys,
  PlatformGroupMembersAPI,
);
