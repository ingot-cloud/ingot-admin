<template>
  <in-page-frame mode="contained" surface="workspace">
    <template #header>
      <in-page-header description="维护平台应用及其状态。" />
    </template>

    <in-split-layout>
      <in-table
        :loading="loading"
        :data="pageInfo.records"
        :page="pageInfo"
        :headers="visibleHeaders"
        :table-id="APP_HOME_TABLE_ID"
        density="compact"
        @handleSizeChange="fetchData"
        @handleCurrentChange="fetchData"
      >
        <template #tools-start>
          <el-input
            v-model="nameFilter"
            class="w-200px!"
            clearable
            placeholder="搜索应用名"
            :prefix-icon="Search"
            @keyup.enter="privateOnSearch"
            @clear="privateOnSearch"
          />
          <in-picker v-model="appTypeFilter" label="应用类型" :options="appTypeFilterOptions" />
          <in-picker v-model="statusFilter" label="状态" :options="appStatusFilterOptions" />
          <in-table-column-setting
            :headers="tableHeaders"
            :table-id="APP_HOME_TABLE_ID"
            @change="privateOnColumnChange"
          />
        </template>
        <template #tools-end>
          <in-table-actions variant="toolbar" :actions="toolbarActions" :row="toolbarRow" />
        </template>
        <template #name="{ item }">
          <div flex flex-row items-center gap-8px>
            <in-icon
              v-if="item.icon"
              :name="item.icon"
              class="w-[var(--in-menu-icon-size)] h-[var(--in-menu-icon-size)]"
            />
            <in-button text link type="primary" @click="privateOnDetail(item)">
              {{ item.name }}
            </in-button>
          </div>
        </template>
        <template #code="{ item }">
          <in-copy-tag :text="item.code" />
        </template>
        <template #appType="{ item }">
          <in-tag-enum :value="item.appType" :enumObj="appTypeEnum" />
        </template>
        <template #status="{ item }">
          <in-common-status-tag :status="item.status" />
        </template>
        <template #actions="{ item }">
          <in-table-actions :actions="rowActionsOf(item)" :row="item" />
        </template>
      </in-table>
    </in-split-layout>
  </in-page-frame>

  <CreateDrawer ref="createDrawerRef" @success="privateOnCreateSuccess" />
</template>

<script setup lang="ts">
import { applyColumnSelection, type InTableAction } from "@ingot/admin-core";
import type { PlatformApp } from "@/models";
import { getCommonStatusToggle, useAppTypeEnum, type CommonStatus } from "@/models/enums";
import { Search } from "@element-plus/icons-vue";
import { PatchAppStatusAPI, RemoveAppAPI } from "@/api/platform/config/app.ts";
import { appQueryKeys } from "@/api/platform/config/app.query";
import { useOps } from "./useOps";
import {
  APP_HOME_TABLE_ID,
  appStatusFilterOptions,
  appTypeFilterOptions,
  createAppHomeRowActions,
  createAppHomeToolbarActions,
  tableHeaders,
} from "./table";
import CreateDrawer from "./components/CreateDrawer.vue";
import {
  invalidateQueriesByKeys,
  isApiError,
  silentQueryRequest,
  StatusCode,
  useUserInfoStore,
} from "@ingot/admin-core";
import { useMutation, useQueryClient } from "@tanstack/vue-query";

const { getIsSystemAdmin } = storeToRefs(useUserInfoStore());
const { loading, appTypeFilter, statusFilter, nameFilter, pageInfo, fetchData, searchByName } =
  useOps();
const queryClient = useQueryClient();

const appTypeEnum = useAppTypeEnum();
const message = useMessage();
const confirm = useMessageConfirm();
const go = useGo();

const createDrawerRef = ref<InstanceType<typeof CreateDrawer>>();
const selectedColumnProps = ref<string[]>([]);
const toolbarRow: PlatformApp = {};

const visibleHeaders = computed(() =>
  applyColumnSelection(tableHeaders, selectedColumnProps.value),
);

const statusMutation = useMutation({
  mutationFn: (vars: { id: string; status: CommonStatus | string }) =>
    PatchAppStatusAPI(vars.id, vars.status, silentQueryRequest()),
  onSuccess: (_data, vars) => {
    void invalidateQueriesByKeys(queryClient, [appQueryKeys.lists(), appQueryKeys.detail(vars.id)]);
  },
});

const removeMutation = useMutation({
  mutationFn: (vars: { id: string; force?: boolean }) =>
    RemoveAppAPI(vars.id, vars.force, silentQueryRequest()),
  onSuccess: () => {
    void queryClient.invalidateQueries({ queryKey: appQueryKeys.all });
  },
});

const privateOnSearch = (): void => {
  searchByName();
};

const privateOnCreate = (): void => {
  createDrawerRef.value?.show();
};

const privateOnCreateSuccess = (appId?: string): void => {
  if (!appId) {
    return;
  }
  privateGoDetail(appId);
};

const privateOnDetail = (app: PlatformApp): void => {
  if (!app.id) {
    return;
  }
  privateGoDetail(app.id);
};

const privateGoDetail = (appId: string): void => {
  go({ path: `/platform/config/app/detail/${appId}` });
};

const privateOnStatusChange = (app: PlatformApp): void => {
  if (!app.id || !app.status) {
    return;
  }
  const next = getCommonStatusToggle(app.status as CommonStatus);
  statusMutation.mutateAsync({ id: app.id, status: next }).then(() => {
    message.success("操作成功");
  });
};

const privateOnRemove = (app: PlatformApp): void => {
  if (!app.id) {
    return;
  }
  removeMutation
    .mutateAsync({ id: app.id })
    .then(() => {
      message.success("操作成功");
    })
    .catch((error: unknown) => {
      if (
        getIsSystemAdmin.value &&
        isApiError(error) &&
        error.code === StatusCode.ILLEGAL_OPERATION
      ) {
        confirm
          .warning(`应用存在子菜单或子权限或已经授权给其他租户，是否强制删除应用(${app.name})?`)
          .then(() => {
            removeMutation.mutateAsync({ id: app.id!, force: true }).then(() => {
              message.success("操作成功");
            });
          });
      }
    });
};

const toolbarActions = computed(() => createAppHomeToolbarActions(privateOnCreate));

const rowActionsOf = (item: PlatformApp): Array<InTableAction<PlatformApp>> =>
  createAppHomeRowActions(item, {
    onDetail: privateOnDetail,
    onToggleStatus: privateOnStatusChange,
    onRemove: privateOnRemove,
  });

const privateOnColumnChange = (value: string[]): void => {
  selectedColumnProps.value = value;
};
</script>
