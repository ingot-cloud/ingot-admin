<template>
  <div class="p-10px">
    <in-table
      :loading="loading"
      :data="treeData"
      :headers="permissionTableHeaders"
      row-key="id"
      default-expand-all
      @refresh="privateFetchData"
    >
      <template #toolbar>
        <in-button type="primary" @click="privateOnCreate">添加权限</in-button>
      </template>
      <template #code="{ item }">
        <in-copy-tag :text="item.code" />
      </template>
      <template #nodeType="{ item }">
        <in-tag-enum :value="item.nodeType" :enumObj="nodeTypeEnum" />
      </template>
      <template #managed="{ item }">
        <el-tag v-if="item.managed" type="warning" size="small">托管</el-tag>
        <el-tag v-else-if="item.readOnly" type="info" size="small">只读</el-tag>
        <span v-else>-</span>
      </template>
      <template #status="{ item }">
        <in-common-status-tag :status="item.status" />
      </template>
      <template #actions="{ item }">
        <div flex flex-row items-center justify-center gap-8px>
          <in-button
            v-if="!item.readOnly && !item.managed"
            type="success"
            text
            link
            @click="privateOnAddChild(item.id)"
          >
            <template #icon>
              <i-carbon:parent-child />
            </template>
            添加子权限
          </in-button>
          <in-button v-if="!item.readOnly" type="primary" text link @click="privateOnEdit(item)">
            <template #icon>
              <i-ep:edit />
            </template>
            编辑
          </in-button>
          <common-status-button
            v-if="!item.readOnly && !item.managed"
            text
            link
            :status="item.status"
            @click="privateOnStatusChange(item)"
          />
        </div>
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
import type { AppPermissionTreeNodeVO } from "@/models";
import type { CommonStatus } from "@/models/enums";
import {
  getCommonStatusActionDesc,
  getCommonStatusToggle,
  usePermissionNodeTypeEnum,
} from "@/models/enums";
import { UpdateAppPermissionAPI } from "@/api/platform/config/app.ts";
import { AppPermissionTreeQueryOptions, appQueryKeys } from "@/api/platform/config/app.query";
import { invalidateQueriesByKeys, silentQueryRequest } from "@ingot/admin-core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { permissionTableHeaders } from "./permissionTable";
import PermissionEditDrawer from "./PermissionEditDrawer.vue";

const props = defineProps<{
  appId: string;
  appCode?: string;
}>();

const nodeTypeEnum = usePermissionNodeTypeEnum();
const queryClient = useQueryClient();
const message = useMessage();
const confirm = useMessageConfirm();

const permissionQuery = useQuery(() => AppPermissionTreeQueryOptions(() => props.appId));
const treeData = computed(() => permissionQuery.data.value ?? []);
const loading = computed(() => permissionQuery.isFetching.value);
const permissionEditDrawerRef = ref<InstanceType<typeof PermissionEditDrawer>>();

const statusMutation = useMutation({
  mutationFn: (vars: { id: string; status: CommonStatus | string }) =>
    UpdateAppPermissionAPI(props.appId, vars.id, { status: vars.status as CommonStatus }, silentQueryRequest()),
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

const privateOnAddChild = (pid: string): void => {
  permissionEditDrawerRef.value?.show(pid);
};

const privateOnEdit = (item: AppPermissionTreeNodeVO): void => {
  permissionEditDrawerRef.value?.show(item);
};

const privateOnStatusChange = (item: AppPermissionTreeNodeVO): void => {
  const next = getCommonStatusToggle(item.status as CommonStatus);
  confirm.warning(`是否${getCommonStatusActionDesc(next)}权限(${item.name})`).then(() => {
    statusMutation.mutateAsync({ id: item.id!, status: next }).then(() => {
      message.success("操作成功");
    });
  });
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
