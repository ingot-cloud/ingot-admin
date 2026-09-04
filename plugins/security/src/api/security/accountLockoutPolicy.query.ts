import { queryOptions } from "@tanstack/vue-query";
import { createResourceQueryKeys, silentQueryRequest } from "@ingot/admin-core";
import type { AccountLockoutPolicy } from "@/models";
import { GetAccountLockoutPoliciesAPI } from "./accountLockoutPolicy";

export const accountLockoutPolicyQueryKeys = createResourceQueryKeys(
  "security",
  "account-lockout-policy",
);

export function AccountLockoutPolicyListQueryOptions() {
  return queryOptions({
    queryKey: accountLockoutPolicyQueryKeys.lists(),
    queryFn: ({ signal }): Promise<Array<AccountLockoutPolicy>> =>
      GetAccountLockoutPoliciesAPI(silentQueryRequest(signal)).then(({ data }) => data ?? []),
  });
}
