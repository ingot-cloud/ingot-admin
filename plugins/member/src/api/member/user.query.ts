import { queryOptions } from "@tanstack/vue-query";
import { toValue, type MaybeRefOrGetter } from "vue";
import {
  createPageQueryOptions,
  createResourceQueryKeys,
  silentQueryRequest,
} from "@ingot/admin-core";
import type { MemberUser, MemberUserDTO, MemberUserProfileVO } from "@/models";
import { UserPageAPI, UserProfileAPI } from "./user";

export const memberUserQueryKeys = createResourceQueryKeys("member", "user");

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
