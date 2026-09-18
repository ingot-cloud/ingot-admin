import { createIamPageQueryOptions } from "@ingot/admin-common";
import { createResourceQueryKeys } from "@ingot/admin-core";
import { PlatformAccountPageAPI } from "./accounts";

export const platformAccountQueryKeys = createResourceQueryKeys("iam-platform", "account");

export const PlatformAccountPageQueryOptions = createIamPageQueryOptions(
  platformAccountQueryKeys,
  PlatformAccountPageAPI,
);
