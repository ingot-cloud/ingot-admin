import { queryOptions } from "@tanstack/vue-query";
import { createResourceQueryKeys, silentQueryRequest } from "@ingot/admin-core";
import type { SessionConcurrencyPolicy } from "@/models";
import { GetConcurrencyPoliciesAPI } from "./concurrencyPolicy";

export const concurrencyPolicyQueryKeys = createResourceQueryKeys("security", "concurrency-policy");

export function ConcurrencyPolicyListQueryOptions() {
  return queryOptions({
    queryKey: concurrencyPolicyQueryKeys.lists(),
    staleTime: 0,
    queryFn: ({ signal }): Promise<Array<SessionConcurrencyPolicy>> =>
      GetConcurrencyPoliciesAPI(silentQueryRequest(signal)).then(({ data }) => data ?? []),
  });
}
