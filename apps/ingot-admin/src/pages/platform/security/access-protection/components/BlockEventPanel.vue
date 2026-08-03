<template>
  <div class="p-10px">
    <in-table
      :loading="loading"
      :data="tableData"
      :headers="blockEventTableHeaders"
      row-key="id"
      @refresh="privateFetchData"
    >
      <template #title>
        <div class="title-wrap">
          <span>封禁审计</span>
        </div>
      </template>
      <template #subtitle>
        <div class="subtitle-tip">历史兼容数据，新事件请查看 security_event。</div>
      </template>
      <template #keyType="{ item }">
        <in-tag-enum v-if="item.keyType" :value="item.keyType" :enumObj="ipListKeyTypeEnum" />
        <span v-else>-</span>
      </template>
      <template #keyValue="{ item }">
        <in-copy-tag v-if="item.keyValue" :text="item.keyValue" />
        <span v-else>-</span>
      </template>
      <template #source="{ item }">
        <in-tag-enum v-if="item.source" :value="item.source" :enumObj="ipListSourceEnum" />
        <span v-else>-</span>
      </template>
    </in-table>
  </div>
</template>

<script setup lang="ts">
import type { GatewayBlacklistEvent } from "@/models";
import { useIpListKeyTypeEnum, useIpListSourceEnum } from "@/models/enums";
import { GetBlockEventsAPI } from "@/api/platform/security/policy";
import { blockEventTableHeaders } from "../table/blockEventTable";

const loading = ref(false);
const tableData = ref<Array<GatewayBlacklistEvent>>([]);

const ipListKeyTypeEnum = useIpListKeyTypeEnum();
const ipListSourceEnum = useIpListSourceEnum();

const privateFetchData = async (): Promise<void> => {
  loading.value = true;
  try {
    const response = await GetBlockEventsAPI();
    tableData.value = response.data;
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  privateFetchData();
});

defineExpose({
  refresh: privateFetchData,
});
</script>

<style lang="postcss" scoped>
.subtitle-tip {
  @apply text-13px text-[var(--in-text-color-secondary)];
}
</style>
