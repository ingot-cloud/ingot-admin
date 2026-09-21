<template>
  <in-page-frame mode="contained" surface="workspace">
    <template #header>
      <in-page-header description="组引用影响授权。修改前预览，可选择成员和部门来源。" />
    </template>
    <in-split-layout>
      <in-table
        :loading="paging.fetching.value"
        :data="paging.pageInfo.value.records"
        :page="paging.pageInfo.value"
        :headers="visibleHeaders"
        :table-id="TABLE_ID"
        :feedback="tableFeedback"
        density="compact"
        :row-key="rowKeyOf"
        @handleSizeChange="paging.fetchData"
        @handleCurrentChange="paging.fetchData"
      >
        <template #tools-start>
          <el-input
            v-model="paging.condition.name"
            class="w-200px!"
            clearable
            placeholder="搜索组名"
            :prefix-icon="Search"
            @keyup.enter="refreshData"
            @clear="refreshData"
          />
          <in-table-column-setting
            :headers="tableHeaders"
            :table-id="TABLE_ID"
            @change="privateOnColumnChange"
          />
        </template>
        <template #tools-end>
          <in-table-actions variant="toolbar" :actions="toolbarActions" :row="toolbarRow" />
        </template>
        <template #name="{ item }">
          <in-button text link @click="handleDetail(item)">
            {{ item.record.name || item.record.id }}
          </in-button>
        </template>
        <template #visibleMemberCount="{ item }">
          {{ item.record.visibleMemberCount ?? "—" }}
        </template>
        <template #actions="{ item }">
          <in-table-actions :actions="rowActionsOf(item)" :row="item" />
        </template>
      </in-table>
    </in-split-layout>
  </in-page-frame>

  <biz-iam-group-edit-drawer
    ref="groupRef"
    allow-departments
    :load-members="loadMembers"
    :load-departments="loadDepartments"
    :create-api="TenantGroupCreateAPI"
    :get-api="TenantGroupDetailAPI"
    :update-api="TenantGroupUpdateAPI"
    :preview-api="TenantGroupPreviewAPI"
    @success="refreshData"
  />
</template>

<script lang="ts" setup>
import { Search } from "@element-plus/icons-vue";
import {
  applyColumnSelection,
  Confirm,
  Message,
  useCapabilities,
  type InTableAction,
  type InTableFeedback,
} from "@ingot/admin-core";
import {
  BizIamGroupEditDrawer,
  createIamOptionLoader,
  SelectionPurpose,
  toIamSelectRecords,
} from "@ingot/admin-common";
import {
  TenantDepartmentPageAPI,
  TenantGroupCreateAPI,
  TenantGroupDeleteAPI,
  TenantGroupDetailAPI,
  TenantGroupPreviewAPI,
  TenantGroupUpdateAPI,
  TenantMemberPageAPI,
} from "@/api/iam/directory";
import {
  createRowActions,
  createToolbarActions,
  tableHeaders,
  TABLE_ID,
  type Row,
} from "./table";
import { useOps } from "./useOps";

const { paging, refreshData } = useOps();
const { unavailable } = useCapabilities();
const selectedColumnProps = ref<string[]>([]);
const groupRef = ref<{ show: (row?: Row) => void }>();
const toolbarRow = {
  record: { id: "", name: "", selection: { members: [], departments: [] } },
  fieldAccess: {},
  capabilities: {},
  version: "",
} as Row;

const loadMembers = createIamOptionLoader(async (page, condition) => {
  const response = await TenantMemberPageAPI(page, condition);
  return { data: toIamSelectRecords(response.data) };
}, SelectionPurpose.DIRECTORY);

const loadDepartments = createIamOptionLoader(async (page, condition) => {
  const response = await TenantDepartmentPageAPI(page, condition);
  return { data: toIamSelectRecords(response.data) };
}, SelectionPurpose.DIRECTORY);

const visibleHeaders = computed(() => applyColumnSelection(tableHeaders, selectedColumnProps.value));
const tableFeedback = computed<InTableFeedback>(() => (unavailable.value ? "error" : "empty"));
const handleDetail = (item: Row): void => {
  groupRef.value?.show(item);
};
const handleCreate = (): void => {
  groupRef.value?.show();
};
const handleDelete = (item: Row): void => {
  Confirm.error(`被引用的组不能静默级联撤权。是否删除（${item.record.name}）？`, {
    confirmButtonText: "删除",
  }).then(() => {
    TenantGroupDeleteAPI(item.record.id).then(() => {
      Message.success("已删除");
      refreshData();
    });
  });
};
const toolbarActions = computed(() => createToolbarActions(handleCreate));
const rowActionsOf = (item: Row): Array<InTableAction<Row>> =>
  createRowActions(item, { onDetail: handleDetail, onDelete: handleDelete });
const privateOnColumnChange = (value: string[]): void => {
  selectedColumnProps.value = value;
};
const rowKeyOf = (row: Row): string => row.record.id;
</script>
