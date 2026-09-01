<template>
  <div class="p-10px">
    <in-table
      :loading="loading"
      :data="tableData"
      :headers="endpointGroupTableHeaders"
      row-key="id"
      @refresh="privateFetchData"
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
    <EndpointGroupDrawer ref="drawerRef" @success="privateFetchData" />
  </div>
</template>

<script setup lang="ts">
import type { GatewayEndpointGroup } from "@base/models";
import { GetEndpointGroupsAPI } from "@base/api/platform/security/policy";
import { endpointGroupTableHeaders } from "../table/endpointGroupTable";
import EndpointGroupDrawer from "./EndpointGroupDrawer.vue";

const loading = ref(false);
const tableData = ref<Array<GatewayEndpointGroup>>([]);
const drawerRef = ref<InstanceType<typeof EndpointGroupDrawer>>();

const privateFetchData = async (): Promise<void> => {
  loading.value = true;
  try {
    const response = await GetEndpointGroupsAPI();
    tableData.value = response.data;
  } finally {
    loading.value = false;
  }
};

const privateOnCreate = (): void => {
  drawerRef.value?.show();
};

const privateOnEdit = (item: GatewayEndpointGroup): void => {
  drawerRef.value?.show(item);
};

onMounted(() => {
  privateFetchData();
});

defineExpose({
  refresh: privateFetchData,
});
</script>
