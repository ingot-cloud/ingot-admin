import { queryOptions } from "@tanstack/vue-query";
import { toValue, type MaybeRefOrGetter } from "vue";
import {
  createPageQueryOptions,
  createResourceQueryKeys,
  silentQueryRequest,
} from "@ingot/admin-core";
import type { MemberUser, MemberUserDTO, MemberUserProfileVO } from "@/models";
import { GetUserRolesAPI, UserPageAPI, UserProfileAPI } from "./user";

const resourceKeys = createResourceQueryKeys("member", "user");
export const memberUserQueryKeys = {
  ...resourceKeys,
  roles: (id: string) => [...resourceKeys.detail(id), "roles"] as const,
};

export const MemberUserPageQueryOptions = createPageQueryOptions<MemberUser, MemberUserDTO>(
  memberUserQueryKeys,
  UserPageAPI,
);

export function MemberUserProfileQueryOptions(id: MaybeRefOrGetter<string>) {
  const value = toValue(id);
  return queryOptions({
    queryKey: memberUserQueryKeys.detail(value),
    enabled: Boolean(value),
    queryFn: ({ signal }): Promise<MemberUserProfileVO> =>
      UserProfileAPI(value, silentQueryRequest(signal)).then(({ data }) => data),
  });
}

export function MemberUserRolesQueryOptions(id: string) {
  return queryOptions({
    queryKey: memberUserQueryKeys.roles(id),
    queryFn: ({ signal }) =>
      GetUserRolesAPI(id, silentQueryRequest(signal)).then(({ data }) => data ?? []),
  });
}
