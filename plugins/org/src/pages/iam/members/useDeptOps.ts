import { applyColumnSelection } from "@ingot/admin-core";
import { TenantDepartmentTreeAPI } from "@/api/iam/directory";
import { TABLE_ID, tableHeaders, type DeptRow } from "./deptTable";
import { collectExpandableDeptIds, filterDeptTree, nestRootDepartmentChildren, toDeptRow } from "./deptTree";

export const useDeptOps = () => {
  const deptTree = ref<DeptRow[]>([]);
  const fetching = ref(false);
  const searchName = ref("");
  const expandRowKeys = ref<string[]>([]);
  const selectedColumnProps = ref<string[]>([]);

  const visibleTree = computed(() => filterDeptTree(deptTree.value, searchName.value));
  const visibleHeaders = computed(() =>
    applyColumnSelection(tableHeaders, selectedColumnProps.value),
  );

  const loadDepts = async (): Promise<void> => {
    fetching.value = true;
    try {
      const response = await TenantDepartmentTreeAPI();
      deptTree.value = nestRootDepartmentChildren((response.data ?? []).map(toDeptRow));
    } finally {
      fetching.value = false;
    }
  };

  watch(searchName, (keyword) => {
    if (keyword.trim()) {
      expandRowKeys.value = collectExpandableDeptIds(visibleTree.value);
    }
  });

  watch(
    deptTree,
    (tree) => {
      if (searchName.value.trim()) {
        expandRowKeys.value = collectExpandableDeptIds(visibleTree.value);
        return;
      }
      const rootId = tree[0]?.id;
      if (rootId && expandRowKeys.value.length === 0) {
        expandRowKeys.value = [rootId];
      }
    },
    { immediate: true },
  );

  return {
    TABLE_ID,
    fetching,
    searchName,
    expandRowKeys,
    selectedColumnProps,
    deptTree,
    visibleTree,
    visibleHeaders,
    loadDepts,
  };
};
