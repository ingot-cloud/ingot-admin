<template>
  <div class="p-10px">
    <in-table
      :loading="loading"
      :data="tableData"
      :headers="visibleHeaders"
      :table-id="RESOURCE_TABLE_ID"
      density="compact"
      row-key="id"
    >
      <template #tools-start>
        <in-table-column-setting
          :headers="resourceTableHeaders"
          :table-id="RESOURCE_TABLE_ID"
          @change="privateOnColumnChange"
        />
      </template>
      <template #tools-end>
        <in-table-actions variant="toolbar" :actions="toolbarActions" :row="toolbarRow" />
      </template>
      <template #code="{ item }">
        <in-copy-tag :text="item.code" />
      </template>
      <template #status="{ item }">
        <in-common-status-tag :status="item.status" />
      </template>
      <template #actions="{ item }">
        <in-table-actions :actions="rowActionsOf(item)" :row="item" />
      </template>
    </in-table>
  </div>
  <ResourceEditDrawer ref="resourceEditDrawerRef" :app-id="appId" @success="privateFetchData" />
</template>

<script setup lang="ts">
import { applyColumnSelection, invalidateQueriesByKeys, silentQueryRequest, type InTableAction } from "@ingot/admin-core";
import type { PlatformResource } from "@/models";
import { getCommonStatusToggle, type CommonStatus } from "@/models/enums";
import { RemoveAppResourceAPI, UpdateAppResourceAPI } from "@/api/platform/config/app.ts";
import { AppResourceListQueryOptions, appQueryKeys } from "@/api/platform/config/app.query";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import {
  RESOURCE_TABLE_ID,
  createResourceRowActions,
  createResourceToolbarActions,
  resourceTableHeaders,
} from "./resourceTable";
import ResourceEditDrawer from "./ResourceEditDrawer.vue";

const props = defineProps<{
  appId: string;
}>();

const queryClient = useQueryClient();
const message = useMessage();
const resourceQuery = useQuery(() => AppResourceListQueryOptions(() => props.appId));
const tableData = computed(() => resourceQuery.data.value ?? []);
const loading = computed(() => resourceQuery.isFetching.value);
const resourceEditDrawerRef = ref<InstanceType<typeof ResourceEditDrawer>>();
const selectedColumnProps = ref<string[]>([]);
const toolbarRow: PlatformResource = {};

const visibleHeaders = computed(() =>
  applyColumnSelection(resourceTableHeaders, selectedColumnProps.value),
);

const statusMutation = useMutation({
  mutationFn: (vars: { id: string; status: CommonStatus }) =>
    UpdateAppResourceAPI(props.appId, vars.id, { status: vars.status }, silentQueryRequest()),
  onSuccess: () => {
    void invalidateQueriesByKeys(queryClient, [appQueryKeys.resources(props.appId)]);
  },
});

const removeMutation = useMutation({
  mutationFn: (id: string) => RemoveAppResourceAPI(props.appId, id, silentQueryRequest()),
  onSuccess: () => {
    void invalidateQueriesByKeys(queryClient, [appQueryKeys.resources(props.appId)]);
  },
});

const privateFetchData = (): void => {
  void resourceQuery.refetch();
};

const privateOnCreate = (): void => {
  resourceEditDrawerRef.value?.show();
};

const privateOnEdit = (item: PlatformResource): void => {
  resourceEditDrawerRef.value?.show(item);
};

const privateOnStatusChange = (item: PlatformResource): void => {
  if (!item.id || !item.status) {
    return;
  }
  const next = getCommonStatusToggle(item.status);
  statusMutation.mutateAsync({ id: item.id, status: next }).then(() => {
    message.success("操作成功");
  });
};

const privateOnRemove = (item: PlatformResource): void => {
  removeMutation.mutateAsync(item.id!).then(() => {
    message.success("删除成功");
  });
};

const toolbarActions = computed(() => createResourceToolbarActions(privateOnCreate));

const rowActionsOf = (item: PlatformResource): Array<InTableAction<PlatformResource>> =>
  createResourceRowActions(item, {
    onDetail: privateOnEdit,
    onToggleStatus: privateOnStatusChange,
    onRemove: privateOnRemove,
  });

const privateOnColumnChange = (value: string[]): void => {
  selectedColumnProps.value = value;
};
</script>

<style lang="postcss" scoped>
:deep(.in-table) {
  @apply p-0;
}
</style>
