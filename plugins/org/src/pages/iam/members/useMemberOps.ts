import {
  FieldVisibility,
  useFieldContext,
  IamAction,
  isFieldFilterable,
  pruneFieldFilters,
  type DepartmentTreeNode,
  type IamListQuery,
  type MemberRecord,
  type ResourceDetail,
} from "@ingot/admin-common";
import { applyColumnSelection, useCapabilities, useServerPaging } from "@ingot/admin-core";
import { TenantDepartmentTreeAPI, TenantMemberContextAPI, TenantSettingsAPI } from "@/api/iam/directory";
import { TenantMemberPageQueryOptions } from "@/api/iam/directory.query";
import type { Ref } from "vue";
import { toMemberDeptNode } from "./deptTree";
import { tableHeaders } from "./memberTable";

const FIELD_HEADER_PROPS = new Set(["displayName", "phone", "email"]);

export const useMemberOps = (active: Ref<boolean>) => {
  const { unavailable, hasAction } = useCapabilities();
  const fields = useFieldContext(IamAction.TENANT_MEMBER_READ, TenantMemberContextAPI, active);
  const paging = useServerPaging<
    ResourceDetail<MemberRecord>,
    IamListQuery & { departmentId?: string }
  >({
    queryOptions: TenantMemberPageQueryOptions,
    enabled: () => active.value && !unavailable.value && Boolean(fields.context.value),
  });
  const selectedColumnProps = ref<string[]>([]);
  const deptTree = ref<DepartmentTreeNode[]>([]);
  const deptLoading = ref(false);
  const currentDept = ref<DepartmentTreeNode>();
  const tenantAvatar = ref<string>();

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

  const fieldHidden = (key: string): boolean =>
    fields.context.value?.fieldVisibility[key] === FieldVisibility.HIDDEN;

  const permissionHeaders = computed(() =>
    tableHeaders.filter(
      (header) => !header.prop || !FIELD_HEADER_PROPS.has(header.prop) || !fieldHidden(header.prop),
    ),
  );
  const visibleHeaders = computed(() =>
    applyColumnSelection(permissionHeaders.value, selectedColumnProps.value),
  );

  const loadTenantAvatar = async (): Promise<void> => {
    if (!hasAction(IamAction.TENANT_SETTINGS_READ)) {
      tenantAvatar.value = undefined;
      return;
    }
    try {
      const response = await TenantSettingsAPI();
      tenantAvatar.value = response.data.record.avatar;
    } catch {
      tenantAvatar.value = undefined;
    }
  };

  const loadDepts = async (): Promise<void> => {
    deptLoading.value = true;
    try {
      const [response] = await Promise.all([TenantDepartmentTreeAPI(), loadTenantAvatar()]);
      deptTree.value = (response.data ?? []).map(toMemberDeptNode);
    } finally {
      deptLoading.value = false;
    }
  };

  const refreshData = (): void => {
    paging.search();
  };

  const handleTreeNodeClick = (node: DepartmentTreeNode): void => {
    if (currentDept.value?.id === node.id && paging.condition.departmentId === node.id) {
      return;
    }
    currentDept.value = node;
    paging.condition.departmentId = node.id;
    refreshData();
  };

  const rowKeyOf = (row: ResourceDetail<MemberRecord>): string => row.record.id;

  return {
    paging,
    canFilter,
    ...fields,
    deptTree,
    deptLoading,
    currentDept,
    tenantAvatar,
    permissionHeaders,
    visibleHeaders,
    selectedColumnProps,
    loadDepts,
    refreshData,
    handleTreeNodeClick,
    rowKeyOf,
  };
};
