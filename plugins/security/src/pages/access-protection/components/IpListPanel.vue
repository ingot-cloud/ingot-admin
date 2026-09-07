<template>
  <div class="ip-list-panel">
    <in-table
      :loading="ipQuery.isFetching.value"
      :data="filteredData"
      :headers="visibleHeaders"
      :table-id="IP_LIST_TABLE_ID"
      density="compact"
      row-key="id"
    >
      <template #tools-start>
        <in-picker v-model="listTypeFilter" label="名单类型" :options="listTypeFilterOptions" />
        <in-picker v-model="keyTypeFilter" label="Key 类型" :options="keyTypeFilterOptions" />
        <in-picker v-model="enabledFilter" label="状态" :options="enabledFilterOptions" />
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
import {
  applyColumnSelection,
  resolveBooleanPickerFilter,
  toBooleanPickerValue,
  withAllPickerOption,
  type InTableAction,
} from "@ingot/admin-core";
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

const listTypeFilterOptions = computed(() => withAllPickerOption(ipListTypeEnum.getOptions()));
const keyTypeFilterOptions = computed(() => withAllPickerOption(ipListKeyTypeEnum.getOptions()));
const enabledFilterOptions = computed(() =>
  withAllPickerOption([
    { label: "启用", value: true },
    { label: "停用", value: false },
  ]),
);

const listTypeFilter = computed({
  get: (): string => filter.listType ?? "",
  set: (value: string | number | boolean | null) => {
    filter.listType = typeof value === "string" && value !== "" ? value : undefined;
  },
});
const keyTypeFilter = computed({
  get: (): string => filter.keyType ?? "",
  set: (value: string | number | boolean | null) => {
    filter.keyType = typeof value === "string" && value !== "" ? value : undefined;
  },
});
const enabledFilter = computed({
  get: (): string | boolean => toBooleanPickerValue(filter.enabled),
  set: (value: string | number | boolean | null) => {
    filter.enabled = resolveBooleanPickerFilter(value);
  },
});

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
}
</style>
