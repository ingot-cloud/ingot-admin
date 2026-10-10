import {
  buildDepartmentTree,
  FieldVisibility,
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
import { applyColumnSelection, useCapabilities, useServerPaging } from "@ingot/admin-core";
import { TenantDepartmentPageAPI, TenantMemberContextAPI } from "@/api/iam/directory";
import { TenantMemberPageQueryOptions } from "@/api/iam/directory.query";
import { tableHeaders } from "./table";

export const useOps = () => {
  const { unavailable } = useCapabilities();
  const fields = useFieldContext(IamAction.TENANT_MEMBER_READ, TenantMemberContextAPI, ref(true));
  const paging = useServerPaging<
    ResourceDetail<MemberRecord>,
    IamListQuery & { departmentId?: string }
  >({
    queryOptions: TenantMemberPageQueryOptions,
    enabled: () => !unavailable.value && Boolean(fields.context.value),
  });
  const selectedColumnProps = ref<string[]>([]);
  const deptTree = ref<DepartmentTreeNode[]>([]);
  watch(fields.context, (value) => {
    const result = pruneFieldFilters(
      paging.condition,
      { phone: "phone", email: "email" },
      value?.fieldOperations,
      IamAction.TENANT_MEMBER_READ,
    );
    if (result.changed) {
      Object.assign(paging.condition, { phone: undefined, email: undefined }, result.condition);
      paging.search();
    }
  });
  const canFilter = (key: string): boolean =>
    isFieldFilterable(fields.context.value?.fieldOperations, IamAction.TENANT_MEMBER_READ, key);

  const visibleHeaders = computed(() =>
    applyColumnSelection(
      tableHeaders.filter(
        (header) =>
          header.prop !== "displayName" ||
          (fields.context.value?.fieldVisibility.displayName ?? FieldVisibility.HIDDEN) !==
            FieldVisibility.HIDDEN,
      ),
      selectedColumnProps.value,
    ),
  );

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
    canFilter,
    ...fields,
    deptTree,
    visibleHeaders,
    loadDepts,
    refreshData,
    privateOnDept,
    rowKeyOf,
  };
};
