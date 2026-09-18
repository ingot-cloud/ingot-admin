import { createIamPageQueryOptions } from "@ingot/admin-common";
import { createResourceQueryKeys } from "@ingot/admin-core";
import { PlatformApplicationPageAPI, PlatformPlanPageAPI } from "./catalog";

export const platformApplicationQueryKeys = createResourceQueryKeys("iam-platform", "application");
export const platformPlanQueryKeys = createResourceQueryKeys("iam-platform", "plan");

export const PlatformApplicationPageQueryOptions = createIamPageQueryOptions(
  platformApplicationQueryKeys,
  PlatformApplicationPageAPI,
);

export const PlatformPlanPageQueryOptions = createIamPageQueryOptions(
  platformPlanQueryKeys,
  PlatformPlanPageAPI,
);
