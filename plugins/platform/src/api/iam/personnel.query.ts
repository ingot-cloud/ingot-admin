import { createIamPageQueryOptions } from "@ingot/admin-common";
import { createResourceQueryKeys } from "@ingot/admin-core";
import { PlatformGroupMembersAPI, PlatformGroupPageAPI, PlatformMemberPageAPI } from "./personnel";

export const platformMemberQueryKeys = createResourceQueryKeys("iam-platform", "member");
export const platformGroupQueryKeys = createResourceQueryKeys("iam-platform", "group");
export const platformGroupMemberQueryKeys = createResourceQueryKeys("iam-platform", "group-member");

export const PlatformMemberPageQueryOptions = createIamPageQueryOptions(
  platformMemberQueryKeys,
  PlatformMemberPageAPI,
);

export const PlatformGroupPageQueryOptions = createIamPageQueryOptions(
  platformGroupQueryKeys,
  PlatformGroupPageAPI,
);

export const PlatformGroupMemberPageQueryOptions = createIamPageQueryOptions(
  platformGroupMemberQueryKeys,
  PlatformGroupMembersAPI,
);
