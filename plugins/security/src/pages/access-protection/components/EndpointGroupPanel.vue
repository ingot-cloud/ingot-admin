<template>
  <div class="p-10px">
    <in-table
      :loading="groupQuery.isFetching.value"
      :data="tableData"
      :headers="endpointGroupTableHeaders"
      row-key="id"
      @refresh="privateRefresh"
    >
      <template #toolbar>
        <in-button type="primary" @click="privateOnCreate">
          <template #icon>
            <i-ep:plus />
          </template>
          新建分组
        </in-button>
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
        <in-button type="primary" text link @click="privateOnEdit(item)">
          <template #icon>
            <i-ep:edit />
          </template>
          编辑
        </in-button>
      </template>
    </in-table>
    <EndpointGroupDrawer ref="drawerRef" @success="privateRefresh" />
  </div>
</template>

<script setup lang="ts">
import type { GatewayEndpointGroup } from "@/models";
import { EndpointGroupListQueryOptions, endpointGroupQueryKeys } from "@/api/security/policy.query";
import { endpointGroupTableHeaders } from "../table/endpointGroupTable";
import EndpointGroupDrawer from "./EndpointGroupDrawer.vue";
import { useQuery, useQueryClient } from "@tanstack/vue-query";

const queryClient = useQueryClient();
const groupQuery = useQuery(() => EndpointGroupListQueryOptions());
const tableData = computed(() => groupQuery.data.value ?? []);
const drawerRef = ref<InstanceType<typeof EndpointGroupDrawer>>();

const privateRefresh = (): void => {
  void queryClient.invalidateQueries({ queryKey: endpointGroupQueryKeys.lists() });
};

const privateOnCreate = (): void => {
  drawerRef.value?.show();
};

const privateOnEdit = (item: GatewayEndpointGroup): void => {
  drawerRef.value?.show(item);
};

defineExpose({
  refresh: privateRefresh,
});
</script>
