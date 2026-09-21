<template>
  <in-page-frame mode="contained" surface="workspace">
    <template #header>
      <in-page-header description="套餐绑定应用清单。修改套餐不会自动改变既有租户开通。" />
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
            placeholder="搜索套餐名"
            :prefix-icon="Search"
            @keyup.enter="refreshData"
            @clear="refreshData"
          />
          <in-picker v-model="statusFilter" label="状态" :options="statusOptions" />
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
        <template #status="{ item }">
          <biz-iam-status-tag :status="item.record.status" />
        </template>
        <template #actions="{ item }">
          <in-table-actions :actions="rowActionsOf(item)" :row="item" />
        </template>
      </in-table>
    </in-split-layout>
  </in-page-frame>

  <CreateDrawer ref="createRef" @success="refreshData" />
  <DetailDrawer ref="detailRef" @success="refreshData" />
</template>

<script lang="ts" setup>
import { Search } from "@element-plus/icons-vue";
import {
  applyColumnSelection,
  resolveStringPickerFilter,
  toStringPickerValue,
  useCapabilities,
  withAllPickerOption,
  type InTableAction,
  type InTableFeedback,
} from "@ingot/admin-core";
import {
  BizIamStatusTag,
  ConfigurationStatus,
  useConfigurationStatusEnum,
} from "@ingot/admin-common";
import CreateDrawer from "./components/CreateDrawer.vue";
import DetailDrawer from "./components/DetailDrawer.vue";
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
const createRef = ref<{ show: () => void }>();
const detailRef = ref<{ show: (row: Row) => void }>();
const statusEnum = useConfigurationStatusEnum();
const statusOptions = computed(() => withAllPickerOption(statusEnum.getOptions()));
const statusFilter = computed({
  get: () => toStringPickerValue(paging.condition.status),
  set: (value: string | number | boolean | null) => {
    paging.condition.status = resolveStringPickerFilter(value);
    refreshData();
  },
});
const toolbarRow = {
  record: { id: "", name: "", applicationIds: [], status: ConfigurationStatus.ENABLED },
  fieldAccess: {},
  capabilities: {},
  version: "",
} satisfies Row;

const visibleHeaders = computed(() => applyColumnSelection(tableHeaders, selectedColumnProps.value));
const tableFeedback = computed<InTableFeedback>(() => (unavailable.value ? "error" : "empty"));
const handleDetail = (item: Row): void => {
  detailRef.value?.show(item);
};
const handleCreate = (): void => {
  createRef.value?.show();
};
const toolbarActions = computed(() => createToolbarActions(handleCreate));
const rowActionsOf = (item: Row): Array<InTableAction<Row>> =>
  createRowActions(item, { onDetail: handleDetail });
const privateOnColumnChange = (value: string[]): void => {
  selectedColumnProps.value = value;
};
const rowKeyOf = (row: Row): string => row.record.id;
</script>
