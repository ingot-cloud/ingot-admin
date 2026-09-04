import { queryOptions } from "@tanstack/vue-query";
import { createResourceQueryKeys, silentQueryRequest } from "@ingot/admin-core";
import type { CredentialPolicyConfig } from "@/models";
import { GetPolicyConfigList } from "./credential";

export const credentialPolicyQueryKeys = createResourceQueryKeys("security", "credential-policy");

export function CredentialPolicyListQueryOptions() {
  return queryOptions({
    queryKey: credentialPolicyQueryKeys.lists(),
    queryFn: ({ signal }): Promise<Array<CredentialPolicyConfig>> =>
      GetPolicyConfigList(silentQueryRequest(signal)).then(({ data }) => data ?? []),
  });
}
