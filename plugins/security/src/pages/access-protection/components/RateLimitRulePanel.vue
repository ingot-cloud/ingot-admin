<template>
  <div class="p-10px">
    <in-table
      :loading="rulesQuery.isFetching.value"
      :data="tableData"
      :headers="rateLimitTableHeaders"
      row-key="id"
      @refresh="privateRefresh"
    >
      <template #toolbar>
        <in-button type="primary" @click="privateOnCreate">
          <template #icon>
            <i-ep:plus />
          </template>
          新建限流规则
        </in-button>
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
        <in-button type="primary" text link @click="privateOnEdit(item)">
          <template #icon>
            <i-ep:edit />
          </template>
          编辑
        </in-button>
      </template>
    </in-table>
    <RateLimitRuleDrawer ref="drawerRef" :groups="groups" @success="privateRefresh" />
  </div>
</template>

<script setup lang="ts">
import type { GatewayRateLimitRule } from "@/models";
import { useRateLimitDimensionEnum } from "@/models/enums";
import {
  EndpointGroupListQueryOptions,
  RateLimitRuleListQueryOptions,
  rateLimitRuleQueryKeys,
} from "@/api/security/policy.query";
import { rateLimitTableHeaders } from "../table/rateLimitTable";
import RateLimitRuleDrawer from "./RateLimitRuleDrawer.vue";
import { useQuery, useQueryClient } from "@tanstack/vue-query";

const queryClient = useQueryClient();
const rulesQuery = useQuery(() => RateLimitRuleListQueryOptions());
const groupsQuery = useQuery(() => EndpointGroupListQueryOptions());
const tableData = computed(() => rulesQuery.data.value ?? []);
const groups = computed(() => groupsQuery.data.value ?? []);
const drawerRef = ref<InstanceType<typeof RateLimitRuleDrawer>>();

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

defineExpose({
  refresh: privateRefresh,
});
</script>
