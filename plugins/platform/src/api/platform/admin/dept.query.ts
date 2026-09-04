import { queryOptions } from "@tanstack/vue-query";
import { toValue, type MaybeRefOrGetter } from "vue";
import {
  createResourceQueryKeys,
  queryAdminData,
  REFERENCE_QUERY_STALE_TIME,
  silentQueryRequest,
} from "@ingot/admin-core";
import type { DeptTreeNodeWithManagerVO } from "@/models";
import { DeptTreeAPI } from "./dept";

export const platformAdminDeptQueryKeys = createResourceQueryKeys("platform", "admin-dept");

export function PlatformAdminDeptTreeQueryOptions(orgId: MaybeRefOrGetter<string>) {
  const id = toValue(orgId);
  return queryOptions({
    queryKey: platformAdminDeptQueryKeys.detail(id),
    staleTime: REFERENCE_QUERY_STALE_TIME,
    enabled: Boolean(id),
    queryFn: ({ signal }): Promise<Array<DeptTreeNodeWithManagerVO>> =>
      DeptTreeAPI(id, silentQueryRequest(signal)).then(({ data }) => data ?? []),
  });
}

export const fetchPlatformAdminDeptTree = (orgId: string): Promise<Array<DeptTreeNodeWithManagerVO>> =>
  queryAdminData(PlatformAdminDeptTreeQueryOptions(orgId));
