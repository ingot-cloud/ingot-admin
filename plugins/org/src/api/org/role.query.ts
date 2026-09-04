import { queryOptions } from "@tanstack/vue-query";
import { toValue, type MaybeRefOrGetter } from "vue";
import {
  createResourceQueryKeys,
  REFERENCE_QUERY_STALE_TIME,
  silentQueryRequest,
  snapshotQueryParams,
} from "@ingot/admin-core";
import type { BizPermissionTreeNodeVO, Option, RoleTreeNodeVO, TenantRolePrivate } from "@/models";
import { GetBindAuthoritiesAPI, RoleOptionsAPI, RoleTreeAPI } from "./role";

const resourceKeys = createResourceQueryKeys("org", "role");

export const orgRoleQueryKeys = {
  ...resourceKeys,
  options: () => [...resourceKeys.all, "options"] as const,
  permissions: (id: string) => [...resourceKeys.detail(id), "permissions"] as const,
};

export function OrgRoleTreeQueryOptions(condition?: MaybeRefOrGetter<TenantRolePrivate | undefined>) {
  const value = toValue(condition);
  return queryOptions({
    queryKey: orgRoleQueryKeys.list(snapshotQueryParams(value)),
    queryFn: ({ signal }): Promise<Array<RoleTreeNodeVO>> =>
      RoleTreeAPI({ ...value }, silentQueryRequest(signal)).then(({ data }) => data ?? []),
  });
}

export function OrgRoleOptionsQueryOptions() {
  return queryOptions({
    queryKey: orgRoleQueryKeys.options(),
    staleTime: REFERENCE_QUERY_STALE_TIME,
    queryFn: ({ signal }): Promise<Array<Option<string>>> =>
      RoleOptionsAPI(silentQueryRequest(signal)).then(({ data }) => data ?? []),
  });
}

export function OrgRoleBindAuthoritiesQueryOptions(id: MaybeRefOrGetter<string>) {
  const value = toValue(id);
  return queryOptions({
    queryKey: orgRoleQueryKeys.permissions(value),
    enabled: Boolean(value),
    queryFn: ({ signal }): Promise<Array<BizPermissionTreeNodeVO>> =>
      GetBindAuthoritiesAPI(value, silentQueryRequest(signal)).then(({ data }) => data ?? []),
  });
}
