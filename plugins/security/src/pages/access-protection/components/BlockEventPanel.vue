<template>
  <div class="p-10px">
    <in-table
      :loading="eventQuery.isFetching.value"
      :data="tableData"
      :headers="blockEventTableHeaders"
      row-key="id"
      @refresh="privateRefresh"
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
import { useIpListKeyTypeEnum, useIpListSourceEnum } from "@/models/enums";
import { BlockEventListQueryOptions, blockEventQueryKeys } from "@/api/security/policy.query";
import { blockEventTableHeaders } from "../table/blockEventTable";
import { useQuery, useQueryClient } from "@tanstack/vue-query";

const queryClient = useQueryClient();
const eventQuery = useQuery(() => BlockEventListQueryOptions());
const tableData = computed(() => eventQuery.data.value ?? []);

const ipListKeyTypeEnum = useIpListKeyTypeEnum();
const ipListSourceEnum = useIpListSourceEnum();

const privateRefresh = (): void => {
  void queryClient.invalidateQueries({ queryKey: blockEventQueryKeys.lists() });
};

defineExpose({
  refresh: privateRefresh,
});
</script>

<style lang="postcss" scoped>
.subtitle-tip {
  @apply text-13px text-[var(--in-text-color-secondary)];
}
</style>
