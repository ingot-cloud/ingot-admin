import {
  buildDepartmentTree,
  collectIamPageRecords,
  type DepartmentTreeNode,
  type IamListQuery,
  type MemberRecord,
  type ResourceDetail,
} from "@ingot/admin-common";
import { applyColumnSelection, useCapabilities, useServerPaging } from "@ingot/admin-core";
import { TenantDepartmentPageAPI } from "@/api/iam/directory";
import { TenantMemberPageQueryOptions } from "@/api/iam/directory.query";
import { tableHeaders } from "./table";

export const useOps = () => {
  const { unavailable } = useCapabilities();
  const paging = useServerPaging<ResourceDetail<MemberRecord>, IamListQuery & { departmentId?: string }>(
    {
      queryOptions: TenantMemberPageQueryOptions,
      enabled: () => !unavailable.value,
    },
  );
  const selectedColumnProps = ref<string[]>([]);
  const deptTree = ref<DepartmentTreeNode[]>([]);
  const visibleHeaders = computed(() => applyColumnSelection(tableHeaders, selectedColumnProps.value));

  const loadDepts = async (): Promise<void> => {
    const details = await collectIamPageRecords((page) => TenantDepartmentPageAPI(page));
    deptTree.value = buildDepartmentTree(details.map((item) => item.record));
  };

  const refreshData = (): void => {
    paging.search();
  };

  const privateOnDept = (node: { id?: string }): void => {
    paging.condition.departmentId = node.id;
    refreshData();
  };

  const rowKeyOf = (row: ResourceDetail<MemberRecord>): string => row.record.id;

  return {
    paging,
    deptTree,
    visibleHeaders,
    loadDepts,
    refreshData,
    privateOnDept,
    rowKeyOf,
  };
};
