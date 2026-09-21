import {
  buildDepartmentTree,
  collectIamPageRecords,
  type DepartmentTreeNode,
  type IamListQuery,
  type MemberRecord,
  type ResourceDetail,
} from "@ingot/admin-common";
import { DirectoryDepartmentPageAPI } from "@/api/iam/directory";
import { DirectoryMemberPageQueryOptions } from "@/api/iam/directory.query";
import { useCapabilities, useServerPaging } from "@ingot/admin-core";

export const useOps = () => {
  const { unavailable } = useCapabilities();
  const paging = useServerPaging<ResourceDetail<MemberRecord>, IamListQuery & { departmentId?: string }>({
    queryOptions: DirectoryMemberPageQueryOptions,
    enabled: () => !unavailable.value,
  });
  const deptTree = ref<DepartmentTreeNode[]>([]);

  const loadDepts = async (): Promise<void> => {
    const details = await collectIamPageRecords((page) => DirectoryDepartmentPageAPI(page));
    deptTree.value = buildDepartmentTree(details.map((item) => item.record));
  };

  const refreshData = (): void => {
    paging.search();
  };

  const privateOnDept = (node: { id?: string }): void => {
    paging.condition.departmentId = node.id;
    refreshData();
  };

  return { paging, deptTree, loadDepts, refreshData, privateOnDept };
};
