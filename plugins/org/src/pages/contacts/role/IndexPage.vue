<template>
  <in-page-frame mode="contained" surface="workspace">
    <template #header>
      <in-page-header description="按角色查看和绑定成员。" />
    </template>

    <in-split-layout left-collapsible :persistence-key="ORG_ROLE_SPLIT_KEY">
      <template #left>
        <LeftContent @node-click="ops.handleTreeNodeClick" />
      </template>

      <div class="default-role-bg-container" v-if="!ops.currentNode.name">
        <img class="default-role-bg" :src="'/resource/images/role_default_bg.jpg'" alt="" />
      </div>

      <in-table
        v-else
        :loading="ops.loading.value"
        :data="ops.pageInfo.value.records"
        :headers="visibleHeaders"
        :page="ops.pageInfo.value"
        :table-id="ORG_ROLE_TABLE_ID"
        density="compact"
        @handleSizeChange="ops.fetchUserData"
        @handleCurrentChange="ops.fetchUserData"
      >
        <template #title>
          <span>{{ ops.currentNode.name }}</span>
          <span class="in-table__count">共 {{ ops.pageInfo.value.total ?? 0 }} 人</span>
        </template>
        <template #tools-start>
          <in-table-column-setting
            :headers="tableHeaders"
            :table-id="ORG_ROLE_TABLE_ID"
            @change="privateOnColumnChange"
          />
        </template>
        <template #tools-end>
          <in-table-actions variant="toolbar" :actions="toolbarActions" :row="toolbarRow" />
        </template>
        <template #avatar="{ item }">
          <in-avatar :src="item.avatar" :name="item.nickname" />
        </template>
        <template #actions="{ item }">
          <in-table-actions :actions="rowActionsOf(item)" :row="item" />
        </template>
      </in-table>
    </in-split-layout>
  </in-page-frame>

  <AddMemberDialog ref="AddMemberDialogRef" @success="ops.fetchUserData" />
</template>

<script lang="ts" setup>
import { applyColumnSelection, type InTableAction } from "@ingot/admin-core";
import LeftContent from "./components/LeftContent.vue";
import { useOps } from "./useOps";
import {
  createOrgRoleRowActions,
  createOrgRoleToolbarActions,
  ORG_ROLE_SPLIT_KEY,
  ORG_ROLE_TABLE_ID,
  tableHeaders,
} from "./table";
import AddMemberDialog from "./components/AddMemberDialog.vue";
import { BindUserAPI } from "@/api/org/role";
import { orgUserQueryKeys } from "@/api/org/user.query";
import { useQueryClient } from "@tanstack/vue-query";
import type { UserPageItemVO } from "@/models";

const AddMemberDialogRef = ref();
const ops = useOps();
const queryClient = useQueryClient();
const selectedColumnProps = ref<string[]>([]);
const toolbarRow = { userId: "", username: "", createdAt: "" } satisfies UserPageItemVO;

const visibleHeaders = computed(() =>
  applyColumnSelection(tableHeaders, selectedColumnProps.value),
);

const privateAddMember = () => {
  AddMemberDialogRef.value.show(ops.currentNode);
};

const privateHandleDelete = (item: UserPageItemVO) => {
  BindUserAPI({
    id: ops.currentNode.id,
    unassignIds: [item.userId],
  }).then(() => {
    void queryClient.invalidateQueries({ queryKey: orgUserQueryKeys.lists() });
  });
};

const toolbarActions = computed(() => createOrgRoleToolbarActions(privateAddMember));

const rowActionsOf = (item: UserPageItemVO): Array<InTableAction<UserPageItemVO>> =>
  createOrgRoleRowActions(item, ops.currentNode.name ?? "", {
    onDelete: privateHandleDelete,
  });

const privateOnColumnChange = (value: string[]): void => {
  selectedColumnProps.value = value;
};
</script>

<style scoped lang="postcss">
.default-role-bg-container {
  display: flex;
  align-items: center;
  justify-content: center;
  & .default-role-bg {
    width: 80%;
    height: auto;
  }
}
</style>
