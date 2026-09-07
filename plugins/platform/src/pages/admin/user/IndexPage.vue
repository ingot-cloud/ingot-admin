<template>
  <in-page-frame mode="contained" surface="workspace">
    <template #header>
      <in-page-header description="查询和管理平台管理员账号。" />
    </template>

    <in-split-layout>
      <template #top>
        <in-filter-item>
          <in-with-label title="姓名">
            <el-input
              v-model="ops.condition.nickname"
              class="w-200px"
              clearable
              placeholder="请输入姓名"
            />
          </in-with-label>
          <in-with-label title="手机号">
            <el-input
              v-model="ops.condition.phone"
              class="w-200px"
              clearable
              placeholder="请输入手机号"
            />
          </in-with-label>
          <template #rightActions>
            <in-button @click="ops.resetFilter">重置</in-button>
            <in-button type="primary" :loading="ops.loading.value" @click="() => ops.fetchUserData()">
              搜索
            </in-button>
          </template>
        </in-filter-item>
      </template>

      <in-table
        :loading="ops.loading.value"
        :data="ops.pageInfo.value.records"
        :headers="visibleHeaders"
        :page="ops.pageInfo.value"
        :table-id="ADMIN_USER_TABLE_ID"
        density="compact"
        @handleSizeChange="ops.fetchUserData"
        @handleCurrentChange="ops.fetchUserData"
      >
        <template #summary>共 {{ ops.pageInfo.value.total ?? 0 }} 人</template>
        <template #tools-start>
          <in-table-column-setting
            :headers="tableHeaders"
            :table-id="ADMIN_USER_TABLE_ID"
            @change="privateOnColumnChange"
          />
        </template>
        <template #tools-end>
          <in-table-actions variant="toolbar" :actions="toolbarActions" :row="toolbarRow" />
        </template>
        <template #avatar="{ item }">
          <in-button link text @click="handleDetailUser(item)">
            <in-avatar :src="item.avatar" :name="item.nickname" />
          </in-button>
        </template>
        <template #username="{ item }">
          <in-copy-tag :text="item.username" />
        </template>
        <template #status="{ item }">
          <in-account-status-tag :enabled="item.enabled" :locked="item.locked" />
        </template>
        <template #actions="{ item }">
          <in-table-actions :actions="rowActionsOf(item)" :row="item" />
        </template>
      </in-table>
    </in-split-layout>
  </in-page-frame>

  <CreateDrawer ref="CreateDrawerRef" @success="handleCreateSuccessEvt" />
  <EditDrawer ref="EditDrawerRef" @success="refreshList" />
  <ResetPwdDialog ref="ResetPwdDialogRef" />
  <LockAccountDialog
    ref="LockAccountDialogRef"
    :lock-api="LockAccountAPI"
    :unlock-api="UnlockAccountAPI"
    @success="refreshList"
  />
</template>

<script lang="ts" setup>
import { applyColumnSelection, type InTableAction } from "@ingot/admin-core";
import type { SysUser, ResetPwdVO } from "@/models";
import { useOps } from "./useOps";
import {
  ADMIN_USER_TABLE_ID,
  createAdminUserRowActions,
  createAdminUserToolbarActions,
  tableHeaders,
} from "./table";
import CreateDrawer from "./components/CreateDrawer.vue";
import EditDrawer from "./components/EditDrawer.vue";
import ResetPwdDialog from "./components/ResetPwdDialog.vue";
import LockAccountDialog from "./components/LockAccountDialog.vue";
import {
  UserResetPwdAPI,
  EnableAccountAPI,
  DisableAccountAPI,
  LockAccountAPI,
  UnlockAccountAPI,
} from "@/api/platform/admin/user";
import { platformAdminUserQueryKeys } from "@/api/platform/admin/user.query";
import { useQueryClient } from "@tanstack/vue-query";

const ops = useOps();
const queryClient = useQueryClient();
const message = useMessage();

const CreateDrawerRef = ref();
const EditDrawerRef = ref();
const ResetPwdDialogRef = ref();
const LockAccountDialogRef = ref<InstanceType<typeof LockAccountDialog>>();
const selectedColumnProps = ref<string[]>([]);
const toolbarRow: SysUser = {};

const visibleHeaders = computed(() =>
  applyColumnSelection(tableHeaders, selectedColumnProps.value),
);

const handleCreateUser = (): void => {
  CreateDrawerRef.value?.show();
};

const handleDetailUser = (params: SysUser): void => {
  EditDrawerRef.value.show(params);
};

const handleToggleEnabled = (params: SysUser): void => {
  if (!params.id || typeof params.enabled !== "boolean") {
    return;
  }
  const request = params.enabled ? DisableAccountAPI : EnableAccountAPI;
  void request(params.id).then(() => {
    message.success("操作成功");
    refreshList();
  });
};

const handleLockUser = (params: SysUser): void => {
  if (!params.id) {
    return;
  }
  LockAccountDialogRef.value?.show({ userId: params.id, locked: params.locked });
};

const handleResetPwdUser = (params: SysUser): void => {
  if (!params.id) {
    return;
  }
  UserResetPwdAPI(params.id).then((response) => {
    message.success("操作成功");
    ResetPwdDialogRef.value.show(response.data.random);
  });
};

const refreshList = (): void => {
  void queryClient.invalidateQueries({ queryKey: platformAdminUserQueryKeys.lists() });
};

const handleCreateSuccessEvt = (userVo: ResetPwdVO) => {
  refreshList();
  ResetPwdDialogRef.value.show(userVo.random);
};

const toolbarActions = computed(() => createAdminUserToolbarActions(handleCreateUser));

const rowActionsOf = (item: SysUser): Array<InTableAction<SysUser>> =>
  createAdminUserRowActions(item, {
    onDetail: handleDetailUser,
    onToggleEnabled: handleToggleEnabled,
    onLock: handleLockUser,
    onResetPassword: handleResetPwdUser,
  });

const privateOnColumnChange = (value: string[]): void => {
  selectedColumnProps.value = value;
};
</script>
