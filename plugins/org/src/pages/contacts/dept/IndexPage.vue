<template>
  <in-page-frame mode="contained" surface="workspace">
    <template #header>
      <in-page-header description="维护组织部门、主管和编制。" />
    </template>

    <in-split-layout>
      <in-table
        :loading="deptQuery.isFetching.value"
        :data="visibleTree"
        :headers="visibleHeaders"
        :table-id="ORG_DEPT_TABLE_ID"
        density="compact"
        tree-column="name"
        :checkbox="checkboxModeOf"
        :tree-expand="treeExpandOf"
        v-model:expand-row-keys="expandRowKeys"
        :feedback="searchName.trim() ? 'no-result' : 'none'"
        @selection-change="privateOnSelectionChange"
      >
        <template #tools-start>
          <el-input
            v-model="searchName"
            class="w-200px"
            clearable
            placeholder="搜索部门名"
            :prefix-icon="Search"
          />
          <in-table-column-setting
            :headers="tableHeaders"
            :table-id="ORG_DEPT_TABLE_ID"
            @change="privateOnColumnChange"
          />
        </template>
        <template #tools-end>
          <in-table-actions
            variant="toolbar"
            :actions="toolbarActions"
            :row="toolbarRow"
            :selected-count="selectedRows.length"
          />
        </template>
        <template #name="{ item }">
          <span
            class="dept-name"
            :class="{ 'is-link': !item.mainFlag }"
            @click="privateOnNameClick(item)"
          >
            {{ item.name }}
          </span>
        </template>
        <template #managerUsers="{ item }">
          {{ managerDisplay(item) }}
        </template>
        <template #status="{ item }">
          <in-common-status-tag v-if="item.status" :status="item.status" />
          <span v-else>-</span>
        </template>
        <template #actions="{ item }">
          <in-table-actions :actions="rowActionsOf(item)" :row="item" />
        </template>
      </in-table>
    </in-split-layout>
  </in-page-frame>

  <CreateDrawer ref="CreateDrawerRef" :select-data="deptTree" @success="privateRefresh" />
  <DetailDrawer ref="DetailDrawerRef" :select-data="deptTree" @success="privateRefresh" />
</template>

<script lang="ts" setup>
import {
  applyColumnSelection,
  Message,
  silentQueryRequest,
  type InTableAction,
  type InTableCheckboxMode,
} from "@ingot/admin-core";
import type { DeptTreeNodeWithManagerVO } from "@/models";
import { RemoveDeptAPI } from "@/api/org/dept";
import { OrgDeptTreeQueryOptions, orgDeptQueryKeys } from "@/api/org/dept.query";
import { Search } from "@element-plus/icons-vue";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import CreateDrawer from "./components/CreateDrawer.vue";
import DetailDrawer from "./components/DetailDrawer.vue";
import { collectExpandableDeptIds, filterDeptTree } from "./deptTree";
import {
  collectSelectedDeptIds,
  createOrgDeptRowActions,
  createOrgDeptToolbarActions,
  ORG_DEPT_TABLE_ID,
  tableHeaders,
} from "./table";

const queryClient = useQueryClient();
const deptQuery = useQuery(() => OrgDeptTreeQueryOptions());
const deptTree = computed(() => deptQuery.data.value ?? []);
const searchName = ref("");
const expandRowKeys = ref<Array<string>>([]);
const selectedColumnProps = ref<string[]>([]);
const selectedRows = ref<Array<DeptTreeNodeWithManagerVO>>([]);
const toolbarRow = {} satisfies DeptTreeNodeWithManagerVO;

const visibleTree = computed(() => filterDeptTree(deptTree.value, searchName.value));

watch(searchName, (keyword) => {
  const query = keyword.trim();
  if (query) {
    expandRowKeys.value = collectExpandableDeptIds(visibleTree.value);
    return;
  }
  const rootId = deptTree.value[0]?.id;
  expandRowKeys.value = rootId ? [rootId] : [];
});

watch(
  deptTree,
  (data) => {
    if (searchName.value.trim()) {
      expandRowKeys.value = collectExpandableDeptIds(visibleTree.value);
      return;
    }
    if (expandRowKeys.value.length === 0 && data[0]?.id) {
      expandRowKeys.value = [data[0].id];
    }
  },
  { immediate: true },
);

const CreateDrawerRef = ref();
const DetailDrawerRef = ref();

const visibleHeaders = computed(() =>
  applyColumnSelection(tableHeaders, selectedColumnProps.value),
);

const checkboxModeOf = (row: DeptTreeNodeWithManagerVO): InTableCheckboxMode =>
  row.mainFlag ? "off" : "on";

const treeExpandOf = (row: DeptTreeNodeWithManagerVO): boolean => !row.mainFlag;

const removeMutation = useMutation({
  mutationFn: (id: string) => RemoveDeptAPI(id, silentQueryRequest()),
  onSuccess: () => {
    void queryClient.invalidateQueries({ queryKey: orgDeptQueryKeys.all });
  },
});

const privateRefresh = (): void => {
  void queryClient.invalidateQueries({ queryKey: orgDeptQueryKeys.all });
};

const managerDisplay = (item: DeptTreeNodeWithManagerVO): string => {
  const names = (item.managerUsers ?? [])
    .map((user) => user.nickname?.trim())
    .filter((name): name is string => Boolean(name));
  return names.length > 0 ? names.join("、") : "-";
};

const handleRemove = (item: DeptTreeNodeWithManagerVO): void => {
  if (!item.id || item.mainFlag) {
    return;
  }
  removeMutation.mutateAsync(item.id).then(() => {
    Message.success("删除成功");
  });
};

const handleCreate = (parentId?: string): void => {
  const pid = parentId || deptTree.value[0]?.id;
  if (!pid) {
    return;
  }
  CreateDrawerRef.value.show(pid);
};

const handleDetail = (data: DeptTreeNodeWithManagerVO): void => {
  if (data.mainFlag) {
    return;
  }
  DetailDrawerRef.value.show(data);
};

const privateOnNameClick = (item: DeptTreeNodeWithManagerVO): void => {
  handleDetail(item);
};

const handleBatchDelete = (): void => {
  collectSelectedDeptIds(selectedRows.value);
};

const toolbarActions = computed(() =>
  createOrgDeptToolbarActions({
    onCreate: () => handleCreate(),
    onBatchDelete: handleBatchDelete,
    selectedCount: selectedRows.value.length,
  }),
);

const rowActionsOf = (
  item: DeptTreeNodeWithManagerVO,
): Array<InTableAction<DeptTreeNodeWithManagerVO>> =>
  createOrgDeptRowActions(item, {
    onDetail: handleDetail,
    onAddChild: (row) => handleCreate(row.id),
    onDelete: handleRemove,
  });

const privateOnSelectionChange = (rows: Array<DeptTreeNodeWithManagerVO>): void => {
  selectedRows.value = rows;
};

const privateOnColumnChange = (value: string[]): void => {
  selectedColumnProps.value = value;
};
</script>
<style lang="postcss" scoped>
.dept-name {
  min-width: 0;
}

.dept-name.is-link {
  cursor: pointer;
}
</style>
