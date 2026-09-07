<template>
  <div class="p-10px">
    <in-table
      :loading="rulesQuery.isFetching.value"
      :data="tableData"
      :headers="visibleHeaders"
      :table-id="RATE_LIMIT_TABLE_ID"
      density="compact"
      row-key="id"
    >
      <template #tools-start>
        <in-table-column-setting
          :headers="rateLimitTableHeaders"
          :table-id="RATE_LIMIT_TABLE_ID"
          @change="privateOnColumnChange"
        />
      </template>
      <template #tools-end>
        <in-table-actions variant="toolbar" :actions="toolbarActions" :row="toolbarRow" />
      </template>
      <template #code="{ item }">
        <in-copy-tag :text="item.code" />
      </template>
      <template #groupCode="{ item }">
        <span>{{ item.groupCode || "-" }}</span>
      </template>
      <template #dimension="{ item }">
        <in-tag-enum :value="item.dimension" :enumObj="rateLimitDimensionEnum" />
      </template>
      <template #enabled="{ item }">
        <el-tag :type="item.enabled ? 'success' : 'info'" size="small">
          {{ item.enabled ? "启用" : "停用" }}
        </el-tag>
      </template>
      <template #actions="{ item }">
        <in-table-actions :actions="rowActionsOf(item)" :row="item" />
      </template>
    </in-table>
    <RateLimitRuleDrawer ref="drawerRef" :groups="groups" @success="privateRefresh" />
  </div>
</template>

<script setup lang="ts">
import { applyColumnSelection, type InTableAction } from "@ingot/admin-core";
import type { GatewayRateLimitRule } from "@/models";
import { useRateLimitDimensionEnum } from "@/models/enums";
import {
  EndpointGroupListQueryOptions,
  RateLimitRuleListQueryOptions,
  rateLimitRuleQueryKeys,
} from "@/api/security/policy.query";
import {
  createRateLimitRowActions,
  createRateLimitToolbarActions,
  RATE_LIMIT_TABLE_ID,
  rateLimitTableHeaders,
} from "../table/rateLimitTable";
import RateLimitRuleDrawer from "./RateLimitRuleDrawer.vue";
import { useQuery, useQueryClient } from "@tanstack/vue-query";

const queryClient = useQueryClient();
const rulesQuery = useQuery(() => RateLimitRuleListQueryOptions());
const groupsQuery = useQuery(() => EndpointGroupListQueryOptions());
const tableData = computed(() => rulesQuery.data.value ?? []);
const groups = computed(() => groupsQuery.data.value ?? []);
const drawerRef = ref<InstanceType<typeof RateLimitRuleDrawer>>();
const selectedColumnProps = ref<string[]>([]);
const toolbarRow: GatewayRateLimitRule = {};

const visibleHeaders = computed(() =>
  applyColumnSelection(rateLimitTableHeaders, selectedColumnProps.value),
);

const rateLimitDimensionEnum = useRateLimitDimensionEnum();

const privateRefresh = (): void => {
  void queryClient.invalidateQueries({ queryKey: rateLimitRuleQueryKeys.lists() });
};

const privateOnCreate = (): void => {
  drawerRef.value?.show();
};

const privateOnEdit = (item: GatewayRateLimitRule): void => {
  drawerRef.value?.show(item);
};

const toolbarActions = computed(() => createRateLimitToolbarActions(privateOnCreate));

const rowActionsOf = (item: GatewayRateLimitRule): Array<InTableAction<GatewayRateLimitRule>> =>
  createRateLimitRowActions(item, {
    onDetail: privateOnEdit,
  });

const privateOnColumnChange = (value: string[]): void => {
  selectedColumnProps.value = value;
};

defineExpose({
  refresh: privateRefresh,
});
</script>
