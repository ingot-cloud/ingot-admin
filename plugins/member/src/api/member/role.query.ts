import { queryOptions } from "@tanstack/vue-query";
import { toValue, type MaybeRefOrGetter } from "vue";
import {
  createResourceQueryKeys,
  silentQueryRequest,
  snapshotQueryParams,
} from "@ingot/admin-core";
import type { MemberRole, MemberRoleTreeNodeVO, PermissionTreeNode } from "@/models";
import { GetBindAuthoritiesAPI, RoleListAPI } from "./role";

const resourceKeys = createResourceQueryKeys("member", "role");

export const memberRoleQueryKeys = {
  ...resourceKeys,
  permissions: (id: string) => [...resourceKeys.detail(id), "permissions"] as const,
};

export function MemberRoleTreeQueryOptions(condition: MaybeRefOrGetter<MemberRole | undefined>) {
  const value = toValue(condition);
  return queryOptions({
    queryKey: memberRoleQueryKeys.list(snapshotQueryParams(value)),
    queryFn: ({ signal }): Promise<Array<MemberRoleTreeNodeVO>> =>
      RoleListAPI({ ...value }, silentQueryRequest(signal)).then(({ data }) => data ?? []),
  });
}

export function MemberRoleBindAuthoritiesQueryOptions(id: MaybeRefOrGetter<string>) {
  const value = toValue(id);
  return queryOptions({
    queryKey: memberRoleQueryKeys.permissions(value),
    enabled: Boolean(value),
    queryFn: ({ signal }): Promise<Array<PermissionTreeNode>> =>
      GetBindAuthoritiesAPI(value, silentQueryRequest(signal)).then(({ data }) => data ?? []),
  });
}
