<template>
  <in-page-frame mode="contained" surface="workspace">
    <template #header>
      <in-page-header description="维护会员角色树。" />
    </template>

    <in-split-layout>
      <in-table
        :loading="roleQuery.isFetching.value"
        :feedback="roleQuery.isError.value ? 'error' : submitted.name ? 'no-result' : undefined"
        :data="roleTree"
        :headers="visibleHeaders"
        tree-column="name"
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
          <in-copy-tag v-if="item.code" :text="item.code" />
          <span v-else>-</span>
        </template>
        <template #builtIn="{ item }">
          <in-tag :value="{ text: item.builtIn ? '内置' : '自定义', tag: 'info' }" />
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

  <RoleDrawer ref="RoleDrawerRef" @success="refreshData" />
</template>

<script lang="ts" setup>
import { applyColumnSelection, useCapabilities, type InTableAction } from "@ingot/admin-core";
import type { MemberRole, MemberRoleTreeNodeVO } from "@/models";
import { MemberAction } from "@/models/actions";
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

const RoleDrawerRef = ref<InstanceType<typeof RoleDrawer>>();
const queryClient = useQueryClient();
const { hasAction } = useCapabilities();

const filter = reactive<MemberRole>({});
const submitted = ref<MemberRole>({});
const roleQuery = useQuery(() => ({
  ...MemberRoleTreeQueryOptions(() => submitted.value),
  enabled: hasAction(MemberAction.ROLE_QUERY),
}));
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
  if (hasAction(MemberAction.ROLE_CREATE)) RoleDrawerRef.value?.show();
};

const handleEdit = (params: MemberRoleTreeNodeVO, isAddChild: boolean = false): void => {
  if (hasAction(isAddChild ? MemberAction.ROLE_CREATE : MemberAction.ROLE_QUERY)) {
    RoleDrawerRef.value?.show(params, isAddChild);
  }
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
</script>
