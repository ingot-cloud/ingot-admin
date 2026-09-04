import { queryOptions } from "@tanstack/vue-query";
import {
  createResourceQueryKeys,
  queryAdminData,
  silentQueryRequest,
} from "@ingot/admin-core";
import type { DeptTreeNode, DeptTreeNodeWithManagerVO } from "@/models";
import { DeptSimpleTreeAPI, DeptTree2API, DeptTreeAPI } from "./dept";

const resourceKeys = createResourceQueryKeys("org", "dept");

export const orgDeptQueryKeys = {
  ...resourceKeys,
  trees: () => [...resourceKeys.all, "tree"] as const,
  tree2: () => [...resourceKeys.all, "tree2"] as const,
  simpleTrees: () => [...resourceKeys.all, "simple-tree"] as const,
};

export function OrgDeptTreeQueryOptions() {
  return queryOptions({
    queryKey: orgDeptQueryKeys.trees(),
    queryFn: ({ signal }): Promise<Array<DeptTreeNodeWithManagerVO>> =>
      DeptTreeAPI(silentQueryRequest(signal)).then(({ data }) => data ?? []),
  });
}

export function OrgDeptTree2QueryOptions() {
  return queryOptions({
    queryKey: orgDeptQueryKeys.tree2(),
    queryFn: ({ signal }): Promise<Array<DeptTreeNodeWithManagerVO>> =>
      DeptTree2API(silentQueryRequest(signal)).then(({ data }) => data ?? []),
  });
}

export function OrgDeptSimpleTreeQueryOptions() {
  return queryOptions({
    queryKey: orgDeptQueryKeys.simpleTrees(),
    queryFn: ({ signal }): Promise<Array<DeptTreeNode>> =>
      DeptSimpleTreeAPI(silentQueryRequest(signal)).then(({ data }) => data ?? []),
  });
}

export const fetchOrgDeptSimpleTree = (): Promise<Array<DeptTreeNode>> =>
  queryAdminData(OrgDeptSimpleTreeQueryOptions());
