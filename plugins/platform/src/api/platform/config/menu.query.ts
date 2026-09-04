import { queryOptions } from "@tanstack/vue-query";
import { toValue, type MaybeRefOrGetter } from "vue";
import {
  createResourceQueryKeys,
  silentQueryRequest,
  snapshotQueryParams,
} from "@ingot/admin-core";
import type { MenuTreeNode, PlatformMenu } from "@/models";
import { GetMenuTreeAPI } from "./menu";

const resourceKeys = createResourceQueryKeys("platform", "menu");

export const platformMenuQueryKeys = {
  ...resourceKeys,
  trees: () => [...resourceKeys.all, "tree"] as const,
  tree: (params: unknown) => [...resourceKeys.all, "tree", params] as const,
};

export function PlatformMenuTreeQueryOptions(filter?: MaybeRefOrGetter<PlatformMenu | undefined>) {
  const value = toValue(filter);
  return queryOptions({
    queryKey: platformMenuQueryKeys.tree(snapshotQueryParams(value)),
    queryFn: ({ signal }): Promise<Array<MenuTreeNode>> =>
      GetMenuTreeAPI({ ...value }, silentQueryRequest(signal)).then(({ data }) => data ?? []),
  });
}
