import { queryOptions } from "@tanstack/vue-query";
import { createResourceQueryKeys, silentQueryRequest } from "@ingot/admin-core";
import type { LoginFailureProtectionPolicyVO } from "@/models";
import { GetLoginFailurePoliciesAPI } from "./loginFailurePolicy";

export const loginFailurePolicyQueryKeys = createResourceQueryKeys(
  "security",
  "login-failure-policy",
);

export function LoginFailurePolicyListQueryOptions() {
  return queryOptions({
    queryKey: loginFailurePolicyQueryKeys.lists(),
    queryFn: ({ signal }): Promise<Array<LoginFailureProtectionPolicyVO>> =>
      GetLoginFailurePoliciesAPI(silentQueryRequest(signal)).then(({ data }) => data ?? []),
  });
}
