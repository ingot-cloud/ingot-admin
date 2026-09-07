<template>
  <in-page-frame mode="contained" surface="workspace">
    <template #header>
      <in-page-header description="维护业务 ID 号段。" />
    </template>

    <in-split-layout>
      <in-table
        :loading="loading"
        :data="pageInfo.records"
        :page="pageInfo"
        :headers="visibleHeaders"
        :table-id="ID_TABLE_ID"
        density="compact"
        @handleSizeChange="fetchData"
        @handleCurrentChange="fetchData"
      >
        <template #summary>共 {{ pageInfo.total ?? 0 }} 个</template>
        <template #tools-start>
          <el-input
            v-model="condition.bizTag"
            class="w-200px!"
            clearable
            placeholder="搜索业务标签"
            :prefix-icon="Search"
            @keyup.enter="privateOnSearch"
            @clear="privateOnSearch"
          />
          <in-table-column-setting
            :headers="tableHeaders"
            :table-id="ID_TABLE_ID"
            @change="privateOnColumnChange"
          />
        </template>
        <template #tools-end>
          <in-table-actions variant="toolbar" :actions="toolbarActions" :row="toolbarRow" />
        </template>
        <template #bizTag="{ item }">
          <in-copy-tag :text="item.bizTag" />
        </template>
        <template #actions="{ item }">
          <in-table-actions :actions="rowActionsOf(item)" :row="item" />
        </template>
      </in-table>
    </in-split-layout>
  </in-page-frame>

  <EditDrawer ref="EditDrawerRef" @success="invalidateList" />
</template>

<script setup lang="ts">
import { applyColumnSelection, type InTableAction, useServerPaging } from "@ingot/admin-core";
import type { BizLeafAlloc } from "@/models";
import { Search } from "@element-plus/icons-vue";
import { createIdRowActions, createIdToolbarActions, ID_TABLE_ID, tableHeaders } from "./table";
import EditDrawer from "./components/EditDrawer.vue";
import { IdPageQueryOptions, idQueryKeys } from "@/api/platform/dev/id.query";
import { useQueryClient } from "@tanstack/vue-query";

const queryClient = useQueryClient();
const { condition, pageInfo, fetching, fetchData } = useServerPaging<
  BizLeafAlloc,
  BizLeafAlloc
>({
  queryOptions: IdPageQueryOptions,
});
const loading = fetching;
const EditDrawerRef = ref();
const selectedColumnProps = ref<string[]>([]);
const toolbarRow: BizLeafAlloc = {};

const visibleHeaders = computed(() =>
  applyColumnSelection(tableHeaders, selectedColumnProps.value),
);

const privateOnSearch = (): void => {
  fetchData();
};

const invalidateList = (): void => {
  void queryClient.invalidateQueries({ queryKey: idQueryKeys.lists() });
};

const handleCreate = (): void => {
  EditDrawerRef.value?.show();
};

const handleEdit = (params: BizLeafAlloc): void => {
  EditDrawerRef.value?.show(params);
};

const toolbarActions = computed(() => createIdToolbarActions(handleCreate));

const rowActionsOf = (item: BizLeafAlloc): Array<InTableAction<BizLeafAlloc>> =>
  createIdRowActions(item, {
    onEdit: handleEdit,
  });

const privateOnColumnChange = (value: string[]): void => {
  selectedColumnProps.value = value;
};
</script>
