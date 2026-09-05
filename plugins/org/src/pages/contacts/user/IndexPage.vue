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
        <template #title>{{ userOps.currentDeptNode.name || "成员" }}</template>
        <template #summary>共 {{ userOps.pageInfo.value.total ?? 0 }} 人</template>
        <template #tools-start>
          <in-column-setting
            :headers="tableHeaders"
            :table-id="ORG_USER_TABLE_ID"
            @change="privateOnColumnChange"
          />
        </template>
        <template #tools-end>
          <in-table-actions variant="toolbar" :actions="toolbarActions" :row="toolbarRow" />
        </template>
        <template #avatar="{ item }">
          <div flex flex-row items-center gap-2>
            <el-image v-if="item.avatar" class="w-30px h-30px" :src="item.avatar" fit="cover" />
            <in-button link text @click="handleDetailUser(item)">
              {{ item.nickname }}
            </in-button>
          </div>
        </template>
        <template #status="{ item }">
          <common-status-tag :status="item.status" />
        </template>
        <template #actions="{ item }">
          <in-table-actions :actions="rowActionsOf(item)" :row="item" />
        </template>
      </in-table>
    </in-split-layout>
  </in-page-frame>

  <EditDrawer ref="EditDrawerRef" @success="userOps.fetchUserData()" />
</template>

<script lang="ts" setup>
import type { InTableAction } from "@ingot/admin-core";
import type { UserPageItemVO } from "@/models";
import LeftContent from "./components/LeftContent.vue";
import { useUserOps } from "./useUserOps";
import {
  applyColumnSelection,
  createOrgUserRowActions,
  createOrgUserToolbarActions,
  ORG_USER_SPLIT_KEY,
  ORG_USER_TABLE_ID,
  tableHeaders,
} from "./table";
import EditDrawer from "./components/EditDrawer.vue";

const EditDrawerRef = ref();
const userOps = useUserOps();
const selectedColumnProps = ref<string[]>([]);
const toolbarRow = { userId: "", username: "", createdAt: "" } satisfies UserPageItemVO;

const visibleHeaders = computed(() =>
  applyColumnSelection(tableHeaders, selectedColumnProps.value),
);

const handleCreateUser = (): void => {
  EditDrawerRef.value.show();
};

const handleDetailUser = (item: UserPageItemVO): void => {
  EditDrawerRef.value.show(item);
};

const toolbarActions = computed(() => createOrgUserToolbarActions(handleCreateUser));

const rowActionsOf = (item: UserPageItemVO): Array<InTableAction<UserPageItemVO>> =>
  createOrgUserRowActions(item, {
    onDetail: handleDetailUser,
    onToggleStatus: userOps.handleDisableUser,
    onDelete: userOps.handleDeleteUser,
  });

const privateOnColumnChange = (value: string[]): void => {
  selectedColumnProps.value = value;
};
</script>
