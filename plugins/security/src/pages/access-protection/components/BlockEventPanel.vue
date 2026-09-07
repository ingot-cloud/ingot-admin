<template>
  <div class="p-10px">
    <in-table
      :loading="eventQuery.isFetching.value"
      :data="tableData"
      :headers="visibleHeaders"
      :table-id="BLOCK_EVENT_TABLE_ID"
      density="compact"
      row-key="id"
    >
      <template #title>封禁审计</template>
      <template #subtitle>
        <div class="subtitle-tip">历史兼容数据，新事件请查看 security_event。</div>
      </template>
      <template #tools-start>
        <in-table-column-setting
          :headers="blockEventTableHeaders"
          :table-id="BLOCK_EVENT_TABLE_ID"
          @change="privateOnColumnChange"
        />
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
import { applyColumnSelection } from "@ingot/admin-core";
import { useIpListKeyTypeEnum, useIpListSourceEnum } from "@/models/enums";
import { BlockEventListQueryOptions, blockEventQueryKeys } from "@/api/security/policy.query";
import { BLOCK_EVENT_TABLE_ID, blockEventTableHeaders } from "../table/blockEventTable";
import { useQuery, useQueryClient } from "@tanstack/vue-query";

const queryClient = useQueryClient();
const eventQuery = useQuery(() => BlockEventListQueryOptions());
const tableData = computed(() => eventQuery.data.value ?? []);
const selectedColumnProps = ref<string[]>([]);

const visibleHeaders = computed(() =>
  applyColumnSelection(blockEventTableHeaders, selectedColumnProps.value),
);

const ipListKeyTypeEnum = useIpListKeyTypeEnum();
const ipListSourceEnum = useIpListSourceEnum();

const privateRefresh = (): void => {
  void queryClient.invalidateQueries({ queryKey: blockEventQueryKeys.lists() });
};

const privateOnColumnChange = (value: string[]): void => {
  selectedColumnProps.value = value;
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
