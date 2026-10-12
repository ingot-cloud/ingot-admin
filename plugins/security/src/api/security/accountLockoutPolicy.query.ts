import { securityQueryContext } from "./context";
import { queryOptions } from "@tanstack/vue-query";
import { createResourceQueryKeys, silentQueryRequest } from "@ingot/admin-core";
import type { AccountLockoutPolicy } from "@/models";
import {
  GetAccountLockoutPoliciesAPI,
  GetAccountLockoutPolicyByUserTypeAPI,
} from "./accountLockoutPolicy";

export const accountLockoutPolicyQueryKeys = createResourceQueryKeys(
  "security",
  "account-lockout-policy",
);

export function AccountLockoutPolicyQueryOptions(userType: string) {
  return queryOptions({
    queryKey: [...accountLockoutPolicyQueryKeys.detail(userType), securityQueryContext()],
    queryFn: ({ signal }): Promise<AccountLockoutPolicy | null> =>
      GetAccountLockoutPolicyByUserTypeAPI(userType, silentQueryRequest(signal)).then(
        ({ data }) => data ?? null,
      ),
  });
}

export function AccountLockoutPolicyListQueryOptions() {
  return queryOptions({
    queryKey: [...accountLockoutPolicyQueryKeys.lists(), securityQueryContext()],
    queryFn: ({ signal }): Promise<Array<AccountLockoutPolicy>> =>
      GetAccountLockoutPoliciesAPI(silentQueryRequest(signal)).then(({ data }) => data ?? []),
  });
}
