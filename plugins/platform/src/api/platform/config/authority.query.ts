import { queryOptions } from "@tanstack/vue-query";
import { toValue, type MaybeRefOrGetter } from "vue";
import {
  createResourceQueryKeys,
  silentQueryRequest,
  snapshotQueryParams,
} from "@ingot/admin-core";
import type { PermissionTreeNode, PlatformPermission } from "@/models";
import { GetAuthorityTreeAPI } from "./authority";

const resourceKeys = createResourceQueryKeys("platform", "permission");

export const platformPermissionQueryKeys = {
  ...resourceKeys,
  trees: () => [...resourceKeys.all, "tree"] as const,
  tree: (params: unknown) => [...resourceKeys.all, "tree", params] as const,
};

export function PlatformAuthorityTreeQueryOptions(
  filter?: MaybeRefOrGetter<PlatformPermission | undefined>,
) {
  const value = toValue(filter);
  return queryOptions({
    queryKey: platformPermissionQueryKeys.tree(snapshotQueryParams(value)),
    queryFn: ({ signal }): Promise<Array<PermissionTreeNode>> =>
      GetAuthorityTreeAPI({ ...value }, silentQueryRequest(signal)).then(({ data }) => data ?? []),
  });
}
