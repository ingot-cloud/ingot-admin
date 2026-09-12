<template>
  <div class="p-10px">
    <in-table
      :loading="loading"
      :data="treeData"
      :headers="visibleHeaders"
      :table-id="PERMISSION_TABLE_ID"
      density="compact"
      row-key="id"
      default-expand-all
    >
      <template #tools-start>
        <in-table-column-setting
          :headers="permissionTableHeaders"
          :table-id="PERMISSION_TABLE_ID"
          @change="privateOnColumnChange"
        />
      </template>
      <template #tools-end>
        <in-table-actions variant="toolbar" :actions="toolbarActions" :row="toolbarRow" />
      </template>
      <template #code="{ item }">
        <in-copy-tag :text="item.code" />
      </template>
      <template #nodeType="{ item }">
        <in-tag-enum :value="item.nodeType" :enumObj="nodeTypeEnum" />
      </template>
      <template #resourceId="{ item }">
        <span>{{ resourceNameOf(item.resourceId) }}</span>
      </template>
      <template #status="{ item }">
        <in-common-status-tag :status="item.status" />
      </template>
      <template #actions="{ item }">
        <in-table-actions :actions="rowActionsOf(item)" :row="item" />
      </template>
    </in-table>
  </div>
  <PermissionEditDrawer
    ref="permissionEditDrawerRef"
    :app-id="appId"
    :app-code="appCode"
    :select-data="treeData"
    @success="privateFetchData"
  />
</template>

<script setup lang="ts">
import {
  applyColumnSelection,
  invalidateQueriesByKeys,
  silentQueryRequest,
  type InTableAction,
} from "@ingot/admin-core";
import type { AppPermissionTreeNodeVO } from "@/models";
import {
  getCommonStatusToggle,
  usePermissionNodeTypeEnum,
  type CommonStatus,
} from "@/models/enums";
import { UpdateAppPermissionAPI } from "@/api/platform/config/app.ts";
import { AppPermissionTreeQueryOptions, AppResourceListQueryOptions, appQueryKeys } from "@/api/platform/config/app.query";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import {
  createPermissionRowActions,
  createPermissionToolbarActions,
  PERMISSION_TABLE_ID,
  permissionTableHeaders,
} from "./permissionTable";
import PermissionEditDrawer from "./PermissionEditDrawer.vue";

const props = defineProps<{
  appId: string;
  appCode?: string;
}>();

const nodeTypeEnum = usePermissionNodeTypeEnum();
const queryClient = useQueryClient();
const message = useMessage();

const permissionQuery = useQuery(() => AppPermissionTreeQueryOptions(() => props.appId));
const resourceQuery = useQuery(() => AppResourceListQueryOptions(() => props.appId));
const treeData = computed(() => permissionQuery.data.value ?? []);
const resourceNameOf = (resourceId?: string): string => {
  if (!resourceId) {
    return "-";
  }
  return resourceQuery.data.value?.find((item) => item.id === resourceId)?.name ?? resourceId;
};
const loading = computed(() => permissionQuery.isFetching.value);
const permissionEditDrawerRef = ref<InstanceType<typeof PermissionEditDrawer>>();
const selectedColumnProps = ref<string[]>([]);
const toolbarRow: AppPermissionTreeNodeVO = {};

const visibleHeaders = computed(() =>
  applyColumnSelection(permissionTableHeaders, selectedColumnProps.value),
);

const statusMutation = useMutation({
  mutationFn: (vars: { id: string; status: CommonStatus | string }) =>
    UpdateAppPermissionAPI(
      props.appId,
      vars.id,
      { status: vars.status as CommonStatus },
      silentQueryRequest(),
    ),
  onSuccess: () => {
    void invalidateQueriesByKeys(queryClient, [
      appQueryKeys.permissions(props.appId),
      appQueryKeys.detail(props.appId),
    ]);
  },
});

const privateFetchData = (): void => {
  void permissionQuery.refetch();
};

const privateOnCreate = (): void => {
  permissionEditDrawerRef.value?.show();
};

const privateOnAddChild = (item: AppPermissionTreeNodeVO): void => {
  permissionEditDrawerRef.value?.show(item.id);
};

const privateOnEdit = (item: AppPermissionTreeNodeVO): void => {
  permissionEditDrawerRef.value?.show(item);
};

const privateOnStatusChange = (item: AppPermissionTreeNodeVO): void => {
  const next = getCommonStatusToggle(item.status as CommonStatus);
  statusMutation.mutateAsync({ id: item.id!, status: next }).then(() => {
    message.success("操作成功");
  });
};

const toolbarActions = computed(() => createPermissionToolbarActions(privateOnCreate));

const rowActionsOf = (
  item: AppPermissionTreeNodeVO,
): Array<InTableAction<AppPermissionTreeNodeVO>> =>
  createPermissionRowActions(item, {
    onDetail: privateOnEdit,
    onAddChild: privateOnAddChild,
    onToggleStatus: privateOnStatusChange,
  });

const privateOnColumnChange = (value: string[]): void => {
  selectedColumnProps.value = value;
};

defineExpose({
  refresh: privateFetchData,
});
</script>

<style lang="postcss" scoped>
:deep(.in-table) {
  @apply p-0;
}
</style>
