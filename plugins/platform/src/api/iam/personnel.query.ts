import { createIamPageQueryOptions } from "@ingot/admin-common";
import { createResourceQueryKeys } from "@ingot/admin-core";
import { PlatformGroupPageAPI, PlatformMemberPageAPI } from "./personnel";

export const platformMemberQueryKeys = createResourceQueryKeys("iam-platform", "member");
export const platformGroupQueryKeys = createResourceQueryKeys("iam-platform", "group");

export const PlatformMemberPageQueryOptions = createIamPageQueryOptions(
  platformMemberQueryKeys,
  PlatformMemberPageAPI,
);

export const PlatformGroupPageQueryOptions = createIamPageQueryOptions(
  platformGroupQueryKeys,
  PlatformGroupPageAPI,
);
