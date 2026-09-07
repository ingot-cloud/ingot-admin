<template>
  <in-page-frame mode="contained" surface="workspace">
    <template #header>
      <in-page-header description="维护会员角色树。" />
    </template>

    <in-split-layout>
      <in-table
        :loading="roleQuery.isFetching.value"
        :data="roleTree"
        :headers="visibleHeaders"
        :expand-row-keys="roleTree.map((item) => item.id!)"
        :table-id="MEMBER_ROLE_TABLE_ID"
        density="compact"
      >
        <template #tools-start>
          <el-input
            v-model="filter.name"
            class="w-200px!"
            clearable
            placeholder="搜索角色名"
            :prefix-icon="Search"
            @keyup.enter="refreshData"
            @clear="refreshData"
          />
          <in-table-column-setting
            :headers="tableHeaders"
            :table-id="MEMBER_ROLE_TABLE_ID"
            @change="privateOnColumnChange"
          />
        </template>
        <template #tools-end>
          <in-table-actions variant="toolbar" :actions="toolbarActions" :row="toolbarRow" />
        </template>
        <template #name="{ item }">
          <in-button text link @click="handleEdit(item)">
            {{ item.name }}
          </in-button>
        </template>
        <template #code="{ item }">
          <el-tag>
            {{ item.code || "-" }}
          </el-tag>
        </template>
        <template #builtIn="{ item }">
          <el-tag :type="item.builtIn ? 'success' : 'info'">
            {{ item.builtIn ? "是" : "否" }}
          </el-tag>
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

  <RoleDrawer ref="RoleDrawerRef" :role-list="roleTree" @success="refreshData" />
</template>

<script lang="ts" setup>
import { applyColumnSelection, type InTableAction } from "@ingot/admin-core";
import type { MemberRole, MemberRoleTreeNodeVO } from "@/models";
import { Search } from "@element-plus/icons-vue";
import { MemberRoleTreeQueryOptions, memberRoleQueryKeys } from "@/api/member/role.query";
import RoleDrawer from "./components/RoleDrawer.vue";
import { useQuery, useQueryClient } from "@tanstack/vue-query";
import {
  MEMBER_ROLE_TABLE_ID,
  createMemberRoleRowActions,
  createMemberRoleToolbarActions,
  tableHeaders,
} from "./table";

const RoleDrawerRef = ref();
const queryClient = useQueryClient();

const filter = reactive<MemberRole>({});
const submitted = ref<MemberRole>({});
const roleQuery = useQuery(() => MemberRoleTreeQueryOptions(() => submitted.value));
const roleTree = computed(() => roleQuery.data.value ?? []);
const selectedColumnProps = ref<string[]>([]);
const toolbarRow: MemberRole = {};

const visibleHeaders = computed(() =>
  applyColumnSelection(tableHeaders, selectedColumnProps.value),
);

const refreshData = () => {
  submitted.value = { ...filter };
  void queryClient.invalidateQueries({ queryKey: memberRoleQueryKeys.lists() });
};

const handleCreate = (): void => {
  RoleDrawerRef.value.show();
};

const handleEdit = (params: MemberRoleTreeNodeVO, isAddChild: boolean = false): void => {
  RoleDrawerRef.value.show(params, isAddChild);
};

const toolbarActions = computed(() => createMemberRoleToolbarActions(handleCreate));

const rowActionsOf = (item: MemberRoleTreeNodeVO): Array<InTableAction<MemberRoleTreeNodeVO>> =>
  createMemberRoleRowActions(item, {
    onDetail: handleEdit,
    onAddChild: (row) => handleEdit(row, true),
  });

const privateOnColumnChange = (value: string[]): void => {
  selectedColumnProps.value = value;
};

onMounted(() => {
  refreshData();
});
</script>
