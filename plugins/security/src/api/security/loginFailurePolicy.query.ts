import { securityQueryContext } from "./context";
import { queryOptions } from "@tanstack/vue-query";
import { createResourceQueryKeys, silentQueryRequest } from "@ingot/admin-core";
import type { LoginFailureProtectionPolicyVO } from "@/models";
import {
  GetLoginFailurePoliciesAPI,
  GetLoginFailurePolicyByDimensionAPI,
} from "./loginFailurePolicy";

export const loginFailurePolicyQueryKeys = createResourceQueryKeys(
  "security",
  "login-failure-policy",
);

export function LoginFailurePolicyQueryOptions(dimension: string) {
  return queryOptions({
    queryKey: [...loginFailurePolicyQueryKeys.detail(dimension), securityQueryContext()],
    queryFn: ({ signal }): Promise<LoginFailureProtectionPolicyVO | null> =>
      GetLoginFailurePolicyByDimensionAPI(dimension, silentQueryRequest(signal)).then(
        ({ data }) => data ?? null,
      ),
  });
}

export function LoginFailurePolicyListQueryOptions() {
  return queryOptions({
    queryKey: [...loginFailurePolicyQueryKeys.lists(), securityQueryContext()],
    queryFn: ({ signal }): Promise<Array<LoginFailureProtectionPolicyVO>> =>
      GetLoginFailurePoliciesAPI(silentQueryRequest(signal)).then(({ data }) => data ?? []),
  });
}
