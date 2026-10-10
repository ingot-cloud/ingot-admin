import {
  buildDepartmentTree,
  useFieldContext,
  IamAction,
  isFieldFilterable,
  pruneFieldFilters,
  collectIamPageRecords,
  type DepartmentTreeNode,
  type IamListQuery,
  type MemberRecord,
  type ResourceDetail,
} from "@ingot/admin-common";
import { DirectoryDepartmentPageAPI, DirectoryContextAPI } from "@/api/iam/directory";
import { DirectoryMemberPageQueryOptions } from "@/api/iam/directory.query";
import { useCapabilities, useServerPaging } from "@ingot/admin-core";

export const useOps = () => {
  const { unavailable } = useCapabilities();
  const fields = useFieldContext(IamAction.TENANT_DIRECTORY_READ, DirectoryContextAPI, ref(true));
  const paging = useServerPaging<
    ResourceDetail<MemberRecord>,
    IamListQuery & { departmentId?: string }
  >({
    queryOptions: DirectoryMemberPageQueryOptions,
    enabled: () => !unavailable.value && Boolean(fields.context.value),
  });
  const deptTree = ref<DepartmentTreeNode[]>([]);
  watch(fields.context, (value) => {
    const result = pruneFieldFilters(
      paging.condition,
      { phone: "phone", email: "email" },
      value?.fieldOperations,
      IamAction.TENANT_DIRECTORY_READ,
    );
    if (result.changed) {
      Object.assign(paging.condition, { phone: undefined, email: undefined }, result.condition);
      paging.search();
    }
  });
  const canFilter = (key: string): boolean =>
    isFieldFilterable(fields.context.value?.fieldOperations, IamAction.TENANT_DIRECTORY_READ, key);

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

  return { paging, canFilter, ...fields, deptTree, loadDepts, refreshData, privateOnDept };
};
