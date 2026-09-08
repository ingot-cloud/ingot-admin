<template>
  <in-page-frame mode="contained" surface="workspace">
    <template #header>
      <in-page-header description="查询、创建和维护平台组织。" />
    </template>

    <in-split-layout>
      <in-table
        :loading="paging.fetching.value"
        :data="paging.pageInfo.value.records"
        :page="paging.pageInfo.value"
        :headers="visibleHeaders"
        :table-id="TENANT_TABLE_ID"
        density="compact"
        @handleSizeChange="paging.fetchData"
        @handleCurrentChange="paging.fetchData"
      >
        <template #tools-start>
          <el-input
            v-model="paging.condition.name"
            class="w-200px!"
            clearable
            placeholder="搜索组织名"
            :prefix-icon="Search"
            @keyup.enter="refreshData"
            @clear="refreshData"
          />
          <in-table-column-setting
            :headers="tableHeaders"
            :table-id="TENANT_TABLE_ID"
            @change="privateOnColumnChange"
          />
        </template>
        <template #tools-end>
          <in-table-actions variant="toolbar" :actions="toolbarActions" :row="toolbarRow" />
        </template>
        <template #name="{ item }">
          <div flex flex-row items-center gap-2>
            <el-image v-if="item.avatar" class="w-30px h-30px" :src="item.avatar" fit="cover" />
            <in-button text link @click="handleEdit(item)">
              {{ item.name }}
            </in-button>
          </div>
        </template>
        <template #code="{ item }">
          <in-copy-tag :text="item.code" />
        </template>
        <template #orgType="{ item }">
          <in-tag :value="orgTypeEnums.getTagText(item.orgType)" />
        </template>
        <template #endAt="{ item }">
          <div v-if="item.endAt">
            <el-tag>{{ item.endAt }}</el-tag>
          </div>
          <el-tag v-else>无限期</el-tag>
        </template>
        <template #status="{ item }">
          <in-common-status-tag :status="item.status" />
        </template>
        <template #actions="{ item }">
          <in-table-actions :actions="rowActionsOf(item)" :row="item" />
        </template>
      </in-table>
    </in-split-layout>
  </in-page-frame>

  <EditDrawer ref="EditDrawerRef" @success="refreshData" />
  <CreateDrawer ref="CreateDrawerRef" @success="refreshData" />
</template>

<script lang="ts" setup>
import { applyColumnSelection, type InTableAction } from "@ingot/admin-core";
import type { SysTenant } from "@/models";
import { Search } from "@element-plus/icons-vue";
import { useOrgTypeEnums } from "@/models/enums";
import EditDrawer from "./components/EditDrawer.vue";
import CreateDrawer from "./components/CreateDrawer.vue";
import {
  createTenantRowActions,
  createTenantToolbarActions,
  tableHeaders,
  TENANT_TABLE_ID,
} from "./table";
import { useOps } from "./useOps";

const orgTypeEnums = useOrgTypeEnums();
const CreateDrawerRef = ref();
const EditDrawerRef = ref();
const { paging, refreshData, handleToggleStatus } = useOps();
const selectedColumnProps = ref<string[]>([]);
const toolbarRow: SysTenant = {};

const visibleHeaders = computed(() =>
  applyColumnSelection(tableHeaders, selectedColumnProps.value),
);

const handleCreate = (): void => {
  CreateDrawerRef.value?.show();
};

const handleEdit = (params: SysTenant): void => {
  EditDrawerRef.value?.show(params);
};

const toolbarActions = computed(() => createTenantToolbarActions(handleCreate));

const rowActionsOf = (item: SysTenant): Array<InTableAction<SysTenant>> =>
  createTenantRowActions(item, {
    onDetail: handleEdit,
    onToggleStatus: handleToggleStatus,
  });

const privateOnColumnChange = (value: string[]): void => {
  selectedColumnProps.value = value;
};
</script>
