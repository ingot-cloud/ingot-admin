<template>
  <in-page-frame mode="contained" surface="workspace">
    <template #header>
      <in-page-header description="维护应用、资源与操作目录。启用不等于业务授权。" />
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
            placeholder="搜索应用名"
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
        <template #code="{ item }">{{ item.record.code }}</template>
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
  Confirm,
  Message,
  useCapabilities,
  type InTableAction,
  type InTableFeedback,
} from "@ingot/admin-core";
import { AuthorizationDomain, BizIamStatusTag, ConfigurationStatus } from "@ingot/admin-common";
import { PlatformApplicationDeleteAPI } from "@/api/iam/catalog";
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
const toolbarRow = {
  record: {
    id: "",
    code: "",
    domain: AuthorizationDomain.PLATFORM,
    name: "",
    sortOrder: 0,
    baseline: false,
    status: ConfigurationStatus.ENABLED,
  },
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
const handleDelete = (item: Row): void => {
  Confirm.error(`是否删除应用（${item.record.name}）？`, { confirmButtonText: "删除" }).then(() => {
    PlatformApplicationDeleteAPI(item.record.id).then(() => {
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
