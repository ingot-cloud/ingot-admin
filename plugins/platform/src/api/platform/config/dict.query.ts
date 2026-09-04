import { queryOptions } from "@tanstack/vue-query";
import { toValue, type MaybeRefOrGetter } from "vue";
import {
  createPageQueryOptions,
  createResourceQueryKeys,
  silentQueryRequest,
  snapshotQueryParams,
} from "@ingot/admin-core";
import type { DictQueryDTO, DictTreeNodeVO, PlatformDict } from "@/models";
import { GetDictPageAPI, GetDictTreeAPI } from "./dict";

const resourceKeys = createResourceQueryKeys("platform", "dict");

export const dictQueryKeys = {
  ...resourceKeys,
  trees: () => [...resourceKeys.all, "tree"] as const,
  tree: (params: unknown) => [...resourceKeys.all, "tree", params] as const,
};

export const DictPageQueryOptions = createPageQueryOptions<PlatformDict, DictQueryDTO>(
  dictQueryKeys,
  GetDictPageAPI,
);

export function DictTreeQueryOptions(query: MaybeRefOrGetter<DictQueryDTO | undefined>) {
  const value = toValue(query);
  return queryOptions({
    queryKey: dictQueryKeys.tree(snapshotQueryParams(value)),
    queryFn: ({ signal }): Promise<Array<DictTreeNodeVO>> =>
      GetDictTreeAPI({ ...value }, silentQueryRequest(signal)).then(({ data }) => data),
  });
}
