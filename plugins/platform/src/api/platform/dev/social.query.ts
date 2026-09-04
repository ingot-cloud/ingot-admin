import { createPageQueryOptions, createResourceQueryKeys } from "@ingot/admin-core";
import type { SysSocialDetails } from "@/models";
import { SocialPageAPI } from "./social";

export const socialQueryKeys = createResourceQueryKeys("platform", "social");

export const SocialPageQueryOptions = createPageQueryOptions<SysSocialDetails, SysSocialDetails>(
  socialQueryKeys,
  SocialPageAPI,
);
