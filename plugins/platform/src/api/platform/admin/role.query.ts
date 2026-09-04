import { queryOptions } from "@tanstack/vue-query";
import { toValue, type MaybeRefOrGetter } from "vue";
import {
  createResourceQueryKeys,
  queryAdminData,
  REFERENCE_QUERY_STALE_TIME,
  silentQueryRequest,
} from "@ingot/admin-core";
import type { RoleTreeNodeVO } from "@/models";
import { RoleTreeAPI } from "./role";

export const platformAdminRoleQueryKeys = createResourceQueryKeys("platform", "admin-role");

export function PlatformAdminRoleTreeQueryOptions(orgId: MaybeRefOrGetter<string>) {
  const id = toValue(orgId);
  return queryOptions({
    queryKey: platformAdminRoleQueryKeys.detail(id),
    staleTime: REFERENCE_QUERY_STALE_TIME,
    enabled: Boolean(id),
    queryFn: ({ signal }): Promise<Array<RoleTreeNodeVO>> =>
      RoleTreeAPI(id, silentQueryRequest(signal)).then(({ data }) => data ?? []),
  });
}

export const fetchPlatformAdminRoleTree = (orgId: string): Promise<Array<RoleTreeNodeVO>> =>
  queryAdminData(PlatformAdminRoleTreeQueryOptions(orgId));
