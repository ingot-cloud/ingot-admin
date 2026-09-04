import { queryOptions } from "@tanstack/vue-query";
import { toValue, type MaybeRefOrGetter } from "vue";
import {
  createPageQueryOptions,
  createResourceQueryKeys,
  silentQueryRequest,
} from "@ingot/admin-core";
import type {
  OrgUserProfileVO,
  UserPageItemVO,
  UserPageItemWithBindRoleStatusVO,
  UserQueryDTO,
} from "@/models";
import { UserPageAPI, UserPageWithBindRoleStatusAPI, UserProfileAPI } from "./user";

export const orgUserQueryKeys = createResourceQueryKeys("org", "user");
export const orgUserRoleBindQueryKeys = createResourceQueryKeys("org", "user-role-bind");

export function OrgUserProfileQueryOptions(id: MaybeRefOrGetter<string>) {
  const value = toValue(id);
  return queryOptions({
    queryKey: orgUserQueryKeys.detail(value),
    enabled: Boolean(value),
    queryFn: ({ signal }): Promise<OrgUserProfileVO> =>
      UserProfileAPI(value, silentQueryRequest(signal)).then(({ data }) => data),
  });
}

export const OrgUserPageQueryOptions = createPageQueryOptions<UserPageItemVO, UserQueryDTO>(
  orgUserQueryKeys,
  UserPageAPI,
);

export const OrgUserRoleBindPageQueryOptions = createPageQueryOptions<
  UserPageItemWithBindRoleStatusVO,
  UserQueryDTO
>(orgUserRoleBindQueryKeys, UserPageWithBindRoleStatusAPI);
