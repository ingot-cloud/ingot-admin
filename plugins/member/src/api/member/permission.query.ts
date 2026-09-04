import { queryOptions } from "@tanstack/vue-query";
import { toValue, type MaybeRefOrGetter } from "vue";
import {
  createResourceQueryKeys,
  silentQueryRequest,
  snapshotQueryParams,
} from "@ingot/admin-core";
import type { MemberPermission, MemberPermissionTreeNodeVO } from "@/models";
import { GetAuthorityTreeAPI } from "./permission";

export const memberPermissionQueryKeys = createResourceQueryKeys("member", "permission");

export function MemberPermissionTreeQueryOptions(
  condition: MaybeRefOrGetter<MemberPermission | undefined>,
) {
  const value = toValue(condition);
  return queryOptions({
    queryKey: memberPermissionQueryKeys.list(snapshotQueryParams(value)),
    queryFn: ({ signal }): Promise<Array<MemberPermissionTreeNodeVO>> =>
      GetAuthorityTreeAPI({ ...value }, silentQueryRequest(signal)).then(({ data }) => data ?? []),
  });
}
