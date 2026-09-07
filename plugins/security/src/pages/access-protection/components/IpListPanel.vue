<template>
  <div class="ip-list-panel">
    <in-filter-item class="ip-list-panel__filters">
      <in-with-label title="名单类型">
        <div class="filter-control">
          <in-select
            v-model="filter.listType"
            clearable
            :options="ipListTypeEnum.getOptions()"
            placeholder="全部"
          />
        </div>
      </in-with-label>
      <in-with-label title="Key 类型">
        <div class="filter-control">
          <in-select
            v-model="filter.keyType"
            clearable
            :options="ipListKeyTypeEnum.getOptions()"
            placeholder="全部"
          />
        </div>
      </in-with-label>
      <in-with-label title="状态">
        <div class="filter-control filter-control--status">
          <in-select
            v-model="filter.enabled"
            clearable
            :options="enabledOptions"
            placeholder="全部"
          />
        </div>
      </in-with-label>
      <template #rightActions>
        <in-button @click="privateOnResetFilter">重置</in-button>
      </template>
    </in-filter-item>

    <in-table
      :loading="ipQuery.isFetching.value"
      :data="filteredData"
      :headers="visibleHeaders"
      :table-id="IP_LIST_TABLE_ID"
      density="compact"
      row-key="id"
    >
      <template #tools-start>
        <in-table-column-setting
          :headers="ipListTableHeaders"
          :table-id="IP_LIST_TABLE_ID"
          @change="privateOnColumnChange"
        />
      </template>
      <template #tools-end>
        <in-table-actions variant="toolbar" :actions="toolbarActions" :row="toolbarRow" />
      </template>
      <template #listType="{ item }">
        <in-tag-enum :value="item.listType" :enumObj="ipListTypeEnum" />
      </template>
      <template #keyType="{ item }">
        <in-tag-enum :value="item.keyType" :enumObj="ipListKeyTypeEnum" />
      </template>
      <template #keyValue="{ item }">
        <in-copy-tag :text="item.keyValue" />
      </template>
      <template #source="{ item }">
        <in-tag-enum v-if="item.source" :value="item.source" :enumObj="ipListSourceEnum" />
        <span v-else>-</span>
      </template>
      <template #effectiveAt="{ item }">
        <span>{{ item.effectiveAt || "立即生效" }}</span>
      </template>
      <template #expiresAt="{ item }">
        <span>{{ item.expiresAt || "永久有效" }}</span>
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
    <IpListDrawer ref="drawerRef" @success="privateRefresh" />
  </div>
</template>

<script setup lang="ts">
import { applyColumnSelection, type InTableAction } from "@ingot/admin-core";
import type { GatewayIpList } from "@/models";
import {
  useIpListKeyTypeEnum,
  useIpListSourceEnum,
  useIpListTypeEnum,
} from "@/models/enums";
import { IpListQueryOptions, ipListQueryKeys } from "@/api/security/policy.query";
import {
  createIpListRowActions,
  createIpListToolbarActions,
  IP_LIST_TABLE_ID,
  ipListTableHeaders,
} from "../table/ipListTable";
import IpListDrawer from "./IpListDrawer.vue";
import { useQuery, useQueryClient } from "@tanstack/vue-query";

interface IpListFilter {
  listType?: string;
  keyType?: string;
  enabled?: boolean;
}

const queryClient = useQueryClient();
const ipQuery = useQuery(() => IpListQueryOptions());
const tableData = computed(() => ipQuery.data.value ?? []);
const filter = reactive<IpListFilter>({
  listType: undefined,
  keyType: undefined,
  enabled: undefined,
});
const drawerRef = ref<InstanceType<typeof IpListDrawer>>();
const selectedColumnProps = ref<string[]>([]);
const toolbarRow: GatewayIpList = {};

const visibleHeaders = computed(() =>
  applyColumnSelection(ipListTableHeaders, selectedColumnProps.value),
);

const ipListTypeEnum = useIpListTypeEnum();
const ipListKeyTypeEnum = useIpListKeyTypeEnum();
const ipListSourceEnum = useIpListSourceEnum();

const enabledOptions = [
  { label: "启用", value: true },
  { label: "停用", value: false },
];

const filteredData = computed(() =>
  tableData.value.filter((item) => {
    if (filter.listType && item.listType !== filter.listType) {
      return false;
    }
    if (filter.keyType && item.keyType !== filter.keyType) {
      return false;
    }
    if (filter.enabled !== undefined && item.enabled !== filter.enabled) {
      return false;
    }
    return true;
  }),
);

const privateRefresh = (): void => {
  void queryClient.invalidateQueries({ queryKey: ipListQueryKeys.lists() });
};

const privateOnResetFilter = (): void => {
  filter.listType = undefined;
  filter.keyType = undefined;
  filter.enabled = undefined;
};

const privateOnCreate = (): void => {
  drawerRef.value?.show();
};

const privateOnEdit = (item: GatewayIpList): void => {
  drawerRef.value?.show(item);
};

const toolbarActions = computed(() => createIpListToolbarActions(privateOnCreate));

const rowActionsOf = (item: GatewayIpList): Array<InTableAction<GatewayIpList>> =>
  createIpListRowActions(item, {
    onDetail: privateOnEdit,
  });

const privateOnColumnChange = (value: string[]): void => {
  selectedColumnProps.value = value;
};

defineExpose({
  refresh: privateRefresh,
});
</script>

<style lang="postcss" scoped>
.ip-list-panel {
  @apply flex flex-col;

  & .ip-list-panel__filters {
    @apply px-12px pt-10px pb-12px mb-4;
  }

  & .filter-control {
    @apply w-200px;
  }

  & .filter-control--status {
    @apply w-160px;
  }
}
</style>
