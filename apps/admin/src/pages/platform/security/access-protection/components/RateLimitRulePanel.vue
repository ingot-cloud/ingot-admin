<template>
  <div class="p-10px">
    <in-table
      :loading="loading"
      :data="tableData"
      :headers="rateLimitTableHeaders"
      row-key="id"
      @refresh="privateFetchData"
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
    <RateLimitRuleDrawer ref="drawerRef" :groups="groups" @success="privateFetchData" />
  </div>
</template>

<script setup lang="ts">
import type { GatewayEndpointGroup, GatewayRateLimitRule } from "@base/models";
import { useRateLimitDimensionEnum } from "@base/models/enums";
import { GetEndpointGroupsAPI, GetRateLimitRulesAPI } from "@base/api/platform/security/policy";
import { rateLimitTableHeaders } from "../table/rateLimitTable";
import RateLimitRuleDrawer from "./RateLimitRuleDrawer.vue";

const loading = ref(false);
const tableData = ref<Array<GatewayRateLimitRule>>([]);
const groups = ref<Array<GatewayEndpointGroup>>([]);
const drawerRef = ref<InstanceType<typeof RateLimitRuleDrawer>>();

const rateLimitDimensionEnum = useRateLimitDimensionEnum();

const privateFetchData = async (): Promise<void> => {
  loading.value = true;
  try {
    const [rulesResponse, groupsResponse] = await Promise.all([
      GetRateLimitRulesAPI(),
      GetEndpointGroupsAPI(),
    ]);
    tableData.value = rulesResponse.data;
    groups.value = groupsResponse.data;
  } finally {
    loading.value = false;
  }
};

const privateOnCreate = (): void => {
  drawerRef.value?.show();
};

const privateOnEdit = (item: GatewayRateLimitRule): void => {
  drawerRef.value?.show(item);
};

onMounted(() => {
  privateFetchData();
});

defineExpose({
  refresh: privateFetchData,
});
</script>
