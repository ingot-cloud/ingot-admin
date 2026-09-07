<template>
  <div class="p-10px">
    <in-table
      :loading="groupQuery.isFetching.value"
      :data="tableData"
      :headers="visibleHeaders"
      :table-id="ENDPOINT_GROUP_TABLE_ID"
      density="compact"
      row-key="id"
    >
      <template #tools-start>
        <in-table-column-setting
          :headers="endpointGroupTableHeaders"
          :table-id="ENDPOINT_GROUP_TABLE_ID"
          @change="privateOnColumnChange"
        />
      </template>
      <template #tools-end>
        <in-table-actions variant="toolbar" :actions="toolbarActions" :row="toolbarRow" />
      </template>
      <template #code="{ item }">
        <in-copy-tag :text="item.code" />
      </template>
      <template #patternList="{ item }">
        <span>{{ item.patternList?.length ?? 0 }} 条路径规则</span>
      </template>
      <template #enabled="{ item }">
        <el-tag :type="item.enabled ? 'success' : 'info'" size="small">
          {{ item.enabled ? "启用" : "停用" }}
        </el-tag>
      </template>
      <template #remark="{ item }">
        <span>{{ item.remark || "-" }}</span>
      </template>
      <template #actions="{ item }">
        <in-table-actions :actions="rowActionsOf(item)" :row="item" />
      </template>
    </in-table>
    <EndpointGroupDrawer ref="drawerRef" @success="privateRefresh" />
  </div>
</template>

<script setup lang="ts">
import { applyColumnSelection, type InTableAction } from "@ingot/admin-core";
import type { GatewayEndpointGroup } from "@/models";
import { EndpointGroupListQueryOptions, endpointGroupQueryKeys } from "@/api/security/policy.query";
import {
  createEndpointGroupRowActions,
  createEndpointGroupToolbarActions,
  ENDPOINT_GROUP_TABLE_ID,
  endpointGroupTableHeaders,
} from "../table/endpointGroupTable";
import EndpointGroupDrawer from "./EndpointGroupDrawer.vue";
import { useQuery, useQueryClient } from "@tanstack/vue-query";

const queryClient = useQueryClient();
const groupQuery = useQuery(() => EndpointGroupListQueryOptions());
const tableData = computed(() => groupQuery.data.value ?? []);
const drawerRef = ref<InstanceType<typeof EndpointGroupDrawer>>();
const selectedColumnProps = ref<string[]>([]);
const toolbarRow: GatewayEndpointGroup = {};

const visibleHeaders = computed(() =>
  applyColumnSelection(endpointGroupTableHeaders, selectedColumnProps.value),
);

const privateRefresh = (): void => {
  void queryClient.invalidateQueries({ queryKey: endpointGroupQueryKeys.lists() });
};

const privateOnCreate = (): void => {
  drawerRef.value?.show();
};

const privateOnEdit = (item: GatewayEndpointGroup): void => {
  drawerRef.value?.show(item);
};

const toolbarActions = computed(() => createEndpointGroupToolbarActions(privateOnCreate));

const rowActionsOf = (item: GatewayEndpointGroup): Array<InTableAction<GatewayEndpointGroup>> =>
  createEndpointGroupRowActions(item, {
    onDetail: privateOnEdit,
  });

const privateOnColumnChange = (value: string[]): void => {
  selectedColumnProps.value = value;
};

defineExpose({
  refresh: privateRefresh,
});
</script>
