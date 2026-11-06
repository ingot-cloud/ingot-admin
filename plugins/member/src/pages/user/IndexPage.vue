<template>
  <in-page-frame mode="contained" surface="workspace">
    <template #header>
      <in-page-header description="查询 App 用户、管理账号状态和角色。" />
    </template>

    <in-split-layout>
      <in-table
        :loading="ops.loading.value"
        :feedback="
          ops.failed.value
            ? 'error'
            : ops.submitted.value.nickname || ops.submitted.value.phone
              ? 'no-result'
              : undefined
        "
        :data="ops.pageInfo.value.records"
        :headers="visibleHeaders"
        :page="ops.pageInfo.value"
        :table-id="MEMBER_USER_TABLE_ID"
        density="compact"
        @handleSizeChange="ops.fetchUserData"
        @handleCurrentChange="ops.fetchUserData"
      >
        <template #tools-start>
          <el-input
            v-model="ops.condition.nickname"
            class="w-200px!"
            clearable
            placeholder="搜索姓名"
            :prefix-icon="Search"
            @keyup.enter="privateOnSearch"
            @clear="privateOnSearch"
          />
          <el-input
            v-model="ops.condition.phone"
            class="w-200px!"
            clearable
            placeholder="搜索手机号"
            :prefix-icon="Search"
            @keyup.enter="privateOnSearch"
            @clear="privateOnSearch"
          />
          <in-table-column-setting
            :headers="tableHeaders"
            :table-id="MEMBER_USER_TABLE_ID"
            @change="privateOnColumnChange"
          />
        </template>
        <template #tools-end>
          <in-table-actions variant="toolbar" :actions="toolbarActions" :row="toolbarRow" />
        </template>
        <template #avatar="{ item }">
          <in-button
            v-if="hasAction(MemberAction.USER_DETAIL)"
            link
            text
            @click="handleDetailUser(item)"
          >
            <in-avatar :src="item.avatar" :name="item.nickname || item.username" />
          </in-button>
          <in-avatar v-else :src="item.avatar" :name="item.nickname || item.username" />
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

  <CreateDrawer ref="CreateDrawerRef" @success="refreshList" />
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
import { applyColumnSelection, useCapabilities, type InTableAction } from "@ingot/admin-core";
import type { MemberUser } from "@/models";
import { MemberAction } from "@/models/actions";
import { Search } from "@element-plus/icons-vue";
import { useOps } from "./useOps";
import {
  MEMBER_USER_TABLE_ID,
  createMemberUserRowActions,
  createMemberUserToolbarActions,
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
} from "@/api/member/user";
import { memberUserQueryKeys } from "@/api/member/user.query";
import { useQueryClient } from "@tanstack/vue-query";

const ops = useOps();
const queryClient = useQueryClient();
const message = useMessage();
const { hasAction } = useCapabilities();

const CreateDrawerRef = ref<InstanceType<typeof CreateDrawer>>();
const EditDrawerRef = ref<InstanceType<typeof EditDrawer>>();
const ResetPwdDialogRef = ref<InstanceType<typeof ResetPwdDialog>>();
const LockAccountDialogRef = ref<InstanceType<typeof LockAccountDialog>>();
const selectedColumnProps = ref<string[]>([]);
const toolbarRow: MemberUser = {};

const visibleHeaders = computed(() =>
  applyColumnSelection(tableHeaders, selectedColumnProps.value),
);

const privateOnSearch = (): void => {
  ops.fetchUserData();
};

const handleCreateUser = (): void => {
  if (!hasAction(MemberAction.USER_CREATE)) return;
  CreateDrawerRef.value?.show();
};

const handleDetailUser = (params: MemberUser): void => {
  if (!hasAction(MemberAction.USER_DETAIL)) return;
  EditDrawerRef.value?.show(params);
};

const handleToggleEnabled = (params: MemberUser): void => {
  if (typeof params.enabled !== "boolean" || !params.id || !hasAction(params.enabled ? MemberAction.USER_DISABLE : MemberAction.USER_ENABLE)) {
    return;
  }
  const request = params.enabled ? DisableAccountAPI : EnableAccountAPI;
  void request(params.id)
    .then(() => {
      message.success("操作成功");
      refreshList();
    })
    .catch(() => undefined);
};

const handleLockUser = (params: MemberUser): void => {
  if (!params.id || !hasAction(params.locked ? MemberAction.USER_UNLOCK : MemberAction.USER_LOCK)) {
    return;
  }
  LockAccountDialogRef.value?.show({ userId: params.id, locked: params.locked });
};

const handleResetPwdUser = (params: MemberUser): void => {
  if (!hasAction(MemberAction.USER_RESET_PWD) || !params.id) {
    return;
  }
  void UserResetPwdAPI(params.id)
    .then((response) => {
      message.success("操作成功");
      if (response.data.random) ResetPwdDialogRef.value?.show(response.data.random);
    })
    .catch(() => undefined);
};

const refreshList = (): void => {
  void queryClient.invalidateQueries({ queryKey: memberUserQueryKeys.lists() });
};

const toolbarActions = computed(() => createMemberUserToolbarActions(handleCreateUser));

const rowActionsOf = (item: MemberUser): Array<InTableAction<MemberUser>> =>
  createMemberUserRowActions(item, {
    onDetail: handleDetailUser,
    onToggleEnabled: handleToggleEnabled,
    onLock: handleLockUser,
    onResetPassword: handleResetPwdUser,
  });

const privateOnColumnChange = (value: string[]): void => {
  selectedColumnProps.value = value;
};
</script>
