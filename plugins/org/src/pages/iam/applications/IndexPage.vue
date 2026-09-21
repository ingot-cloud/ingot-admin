<template>
  <in-page-frame mode="contained" surface="workspace">
    <template #header>
      <in-page-header description="查看开通应用并配置可用人群。人群不等于业务授权。" />
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
        <template #name="{ item }">
          <biz-iam-record-link
            :action="IamAction.TENANT_APPLICATION_READ"
            :capabilities="item.capabilities"
            @click="handleDetail(item)"
          >
            {{ item.record.applicationName || item.record.applicationId }}
          </biz-iam-record-link>
        </template>
        <template #status="{ item }">{{ item.record.status }}</template>
        <template #actions="{ item }">
          <in-table-actions :actions="rowActionsOf(item)" :row="item" />
        </template>
      </in-table>
    </in-split-layout>
  </in-page-frame>

  <ApplicationDetailDrawer ref="detailRef" />
</template>

<script lang="ts" setup>
import { Search } from "@element-plus/icons-vue";
import {
  applyColumnSelection,
  useCapabilities,
  type InTableAction,
  type InTableFeedback,
} from "@ingot/admin-core";
import { BizIamRecordLink, IamAction } from "@ingot/admin-common";
import ApplicationDetailDrawer from "./components/ApplicationDetailDrawer.vue";
import { createRowActions, tableHeaders, TABLE_ID, type Row } from "./table";
import { useOps } from "./useOps";

const { paging, refreshData } = useOps();
const { unavailable } = useCapabilities();
const selectedColumnProps = ref<string[]>([]);
const detailRef = ref<{ show: (row: Row) => void }>();

const visibleHeaders = computed(() => applyColumnSelection(tableHeaders, selectedColumnProps.value));
const tableFeedback = computed<InTableFeedback>(() => (unavailable.value ? "error" : "empty"));
const handleDetail = (item: Row): void => {
  detailRef.value?.show(item);
};
const rowActionsOf = (item: Row): Array<InTableAction<Row>> =>
  createRowActions(item, { onDetail: handleDetail });
const privateOnColumnChange = (value: string[]): void => {
  selectedColumnProps.value = value;
};
const rowKeyOf = (row: Row): string => row.record.id;
</script>
