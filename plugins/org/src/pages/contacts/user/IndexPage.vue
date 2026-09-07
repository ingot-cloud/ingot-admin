<template>
  <in-page-frame mode="contained" surface="workspace">
    <template #header>
      <in-page-header description="按部门查看和组织成员，维护成员资料。" />
    </template>

    <in-split-layout left-collapsible :persistence-key="ORG_USER_SPLIT_KEY">
      <template #left>
        <LeftContent @node-click="userOps.handleTreeNodeClick" />
      </template>

      <in-table
        :loading="userOps.loading.value"
        :data="userOps.pageInfo.value.records"
        :headers="visibleHeaders"
        :page="userOps.pageInfo.value"
        :table-id="ORG_USER_TABLE_ID"
        density="compact"
        row-key="userId"
        @handleSizeChange="userOps.fetchUserData"
        @handleCurrentChange="userOps.fetchUserData"
      >
        <template #title>
          <span>{{ userOps.currentDeptNode.name || "成员" }}</span>
          <span class="in-table__count">共 {{ userOps.pageInfo.value.total ?? 0 }} 人</span>
        </template>
        <template #tools-start>
          <in-picker
            v-model="enabledFilter"
            label="账号状态"
            :options="accountStatusOptions"
          />
          <in-table-column-setting
            :headers="tableHeaders"
            :table-id="ORG_USER_TABLE_ID"
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
        <template #status="{ item }">
          <in-account-status-tag :enabled="item.enabled" :locked="item.locked" />
        </template>
        <template #actions="{ item }">
          <in-table-actions :actions="rowActionsOf(item)" :row="item" />
        </template>
      </in-table>
    </in-split-layout>
  </in-page-frame>

  <CreateDrawer ref="CreateDrawerRef" @success="userOps.fetchUserData()" />
  <DetailDrawer ref="DetailDrawerRef" @success="userOps.fetchUserData()" />
</template>

<script lang="ts" setup>
import { applyColumnSelection, type InTableAction } from "@ingot/admin-core";
import type { UserPageItemVO } from "@/models";
import LeftContent from "./components/LeftContent.vue";
import { useUserOps } from "./useUserOps";
import {
  accountStatusOptions,
  createOrgUserRowActions,
  createOrgUserToolbarActions,
  ORG_USER_SPLIT_KEY,
  ORG_USER_TABLE_ID,
  tableHeaders,
} from "./table";
import CreateDrawer from "./components/CreateDrawer.vue";
import DetailDrawer from "./components/DetailDrawer.vue";

const CreateDrawerRef = ref();
const DetailDrawerRef = ref();
const userOps = useUserOps();
const enabledFilter = userOps.enabledFilter;
const selectedColumnProps = ref<string[]>([]);
const toolbarRow = { userId: "", username: "", createdAt: "" } satisfies UserPageItemVO;

const visibleHeaders = computed(() =>
  applyColumnSelection(tableHeaders, selectedColumnProps.value),
);

const handleCreateUser = (): void => {
  CreateDrawerRef.value.show();
};

const handleDetailUser = (item: UserPageItemVO): void => {
  DetailDrawerRef.value.show(item);
};

const toolbarActions = computed(() => createOrgUserToolbarActions(handleCreateUser));

const rowActionsOf = (item: UserPageItemVO): Array<InTableAction<UserPageItemVO>> =>
  createOrgUserRowActions(item, {
    onDetail: handleDetailUser,
    onToggleEnabled: userOps.handleDisableUser,
    onDelete: userOps.handleDeleteUser,
  });

const privateOnColumnChange = (value: string[]): void => {
  selectedColumnProps.value = value;
};
</script>
