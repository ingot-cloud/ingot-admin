import { queryOptions } from "@tanstack/vue-query";
import { createResourceQueryKeys, silentQueryRequest } from "@ingot/admin-core";
import type { PermissionTreeNode } from "@/models";
import { OrgAuthTreeAPI } from "./auth";

export const orgAuthQueryKeys = createResourceQueryKeys("org", "auth");

export function OrgAuthTreeQueryOptions() {
  return queryOptions({
    queryKey: orgAuthQueryKeys.lists(),
    queryFn: ({ signal }): Promise<Array<PermissionTreeNode>> =>
      OrgAuthTreeAPI(silentQueryRequest(signal)).then(({ data }) => data ?? []),
  });
}
