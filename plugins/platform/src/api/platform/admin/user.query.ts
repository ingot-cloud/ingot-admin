import { queryOptions } from "@tanstack/vue-query";
import { toValue, type MaybeRefOrGetter } from "vue";
import {
  createPageQueryOptions,
  createResourceQueryKeys,
  silentQueryRequest,
} from "@ingot/admin-core";
import type { AllOrgUserFilterDTO, SysUser, UserOrgInfoVO, UserProfileVO } from "@/models";
import { UserOrgInfoAPI, UserPageAPI, UserProfileAPI } from "./user";

const resourceKeys = createResourceQueryKeys("platform", "admin-user");

export const platformAdminUserQueryKeys = {
  ...resourceKeys,
  orgs: (id: string) => [...resourceKeys.detail(id), "orgs"] as const,
};

export const PlatformAdminUserPageQueryOptions = createPageQueryOptions<
  SysUser,
  AllOrgUserFilterDTO
>(platformAdminUserQueryKeys, UserPageAPI);

export function PlatformAdminUserProfileQueryOptions(id: MaybeRefOrGetter<string>) {
  const value = toValue(id);
  return queryOptions({
    queryKey: platformAdminUserQueryKeys.detail(value),
    enabled: Boolean(value),
    queryFn: ({ signal }): Promise<UserProfileVO> =>
      UserProfileAPI(value, silentQueryRequest(signal)).then(({ data }) => data),
  });
}

export function PlatformAdminUserOrgInfoQueryOptions(id: MaybeRefOrGetter<string>) {
  const value = toValue(id);
  return queryOptions({
    queryKey: platformAdminUserQueryKeys.orgs(value),
    enabled: Boolean(value),
    queryFn: ({ signal }): Promise<Array<UserOrgInfoVO>> =>
      UserOrgInfoAPI(value, silentQueryRequest(signal)).then(({ data }) => data ?? []),
  });
}
