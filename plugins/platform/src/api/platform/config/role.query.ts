import { queryOptions } from "@tanstack/vue-query";
import { toValue, type MaybeRefOrGetter } from "vue";
import {
  createResourceQueryKeys,
  silentQueryRequest,
  snapshotQueryParams,
} from "@ingot/admin-core";
import type { PermissionTreeNode, PlatformRole, RoleDataRuleVO, RoleTreeNodeVO } from "@/models";
import { GetBindAuthoritiesAPI, GetRoleDataRulesAPI, RoleListAPI } from "./role";

const resourceKeys = createResourceQueryKeys("platform", "role");

export const platformRoleQueryKeys = {
  ...resourceKeys,
  permissions: (id: string) => [...resourceKeys.detail(id), "permissions"] as const,
  dataRules: (id: string) => [...resourceKeys.detail(id), "data-rules"] as const,
};

export function PlatformRoleTreeQueryOptions(condition: MaybeRefOrGetter<PlatformRole | undefined>) {
  const value = toValue(condition);
  return queryOptions({
    queryKey: platformRoleQueryKeys.list(snapshotQueryParams(value)),
    queryFn: ({ signal }): Promise<Array<RoleTreeNodeVO>> =>
      RoleListAPI({ ...value }, silentQueryRequest(signal)).then(({ data }) => data ?? []),
  });
}

export function PlatformRoleBindAuthoritiesQueryOptions(id: MaybeRefOrGetter<string>) {
  const value = toValue(id);
  return queryOptions({
    queryKey: platformRoleQueryKeys.permissions(value),
    enabled: Boolean(value),
    queryFn: ({ signal }): Promise<Array<PermissionTreeNode>> =>
      GetBindAuthoritiesAPI(value, silentQueryRequest(signal)).then(({ data }) => data ?? []),
  });
}

export function PlatformRoleDataRulesQueryOptions(id: MaybeRefOrGetter<string>) {
  const value = toValue(id);
  return queryOptions({
    queryKey: platformRoleQueryKeys.dataRules(value),
    enabled: Boolean(value),
    queryFn: ({ signal }): Promise<Array<RoleDataRuleVO>> =>
      GetRoleDataRulesAPI(value, silentQueryRequest(signal)).then(({ data }) => data ?? []),
  });
}
