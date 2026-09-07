<template>
  <in-page-frame mode="contained" surface="workspace">
    <template #header>
      <in-page-header description="维护会员权限树。" />
    </template>

    <in-split-layout>
      <template #top>
        <in-filter-item>
          <in-with-label title="组织类型">
            <el-input
              v-model="filter.name"
              class="w-200px"
              clearable
              placeholder="请输入权限名称"
            />
          </in-with-label>
          <template #rightActions>
            <in-button @click="privateOnReset">重置</in-button>
            <in-button type="primary" :loading="treeQuery.isFetching.value" @in-click="refreshData">
              搜索
            </in-button>
          </template>
        </in-filter-item>
      </template>

      <in-table
        :loading="treeQuery.isFetching.value"
        :data="treeData"
        :headers="visibleHeaders"
        :table-id="MEMBER_PERMISSION_TABLE_ID"
        density="compact"
      >
        <template #tools-start>
          <in-table-column-setting
            :headers="tableHeaders"
            :table-id="MEMBER_PERMISSION_TABLE_ID"
            @change="privateOnColumnChange"
          />
        </template>
        <template #tools-end>
          <in-table-actions variant="toolbar" :actions="toolbarActions" :row="toolbarRow" />
        </template>
        <template #code="{ item }">
          <in-copy-tag :text="item.code" />
        </template>
        <template #status="{ item }">
          <in-common-status-tag :status="item.status" />
        </template>
        <template #type="{ item }">
          <in-tag :value="authorityTypeEnums.getTagText(item.type)" />
        </template>
        <template #actions="{ item }">
          <in-table-actions :actions="rowActionsOf(item)" :row="item" />
        </template>
      </in-table>
    </in-split-layout>
  </in-page-frame>

  <EditDrawer ref="EditDrawerRef" :select-data="treeData" @success="refreshData" />
</template>

<script lang="ts" setup>
import { applyColumnSelection, Message, silentQueryRequest, type InTableAction } from "@ingot/admin-core";
import type { MemberPermission, MemberPermissionTreeNodeVO } from "@/models";
import type { CommonStatus } from "@/models/enums";
import { useAuthorityTypeEnums, getCommonStatusToggle } from "@/models/enums";
import EditDrawer from "./EditDrawer.vue";
import { UpdateAuthorityAPI } from "@/api/member/permission";
import {
  MemberPermissionTreeQueryOptions,
  memberPermissionQueryKeys,
} from "@/api/member/permission.query";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import {
  MEMBER_PERMISSION_TABLE_ID,
  createMemberPermissionRowActions,
  createMemberPermissionToolbarActions,
  tableHeaders,
} from "./table";

const authorityTypeEnums = useAuthorityTypeEnums();
const EditDrawerRef = ref();
const queryClient = useQueryClient();

const filter = reactive<MemberPermission>({});
const submitted = ref<MemberPermission>({});
const treeQuery = useQuery(() => MemberPermissionTreeQueryOptions(() => submitted.value));
const treeData = computed(() => treeQuery.data.value ?? []);
const selectedColumnProps = ref<string[]>([]);
const toolbarRow: MemberPermission = {};

const visibleHeaders = computed(() =>
  applyColumnSelection(tableHeaders, selectedColumnProps.value),
);

const refreshData = (): void => {
  submitted.value = { ...filter };
  void queryClient.invalidateQueries({ queryKey: memberPermissionQueryKeys.lists() });
};

const privateOnReset = (): void => {
  filter.name = undefined;
  refreshData();
};

const statusMutation = useMutation({
  mutationFn: (params: MemberPermission) => UpdateAuthorityAPI(params, silentQueryRequest()),
  onSuccess: () => {
    void queryClient.invalidateQueries({ queryKey: memberPermissionQueryKeys.lists() });
  },
});

const handleToggleStatus = (item: MemberPermissionTreeNodeVO): void => {
  if (!item.id || !item.status) {
    return;
  }
  const next = getCommonStatusToggle(item.status as CommonStatus);
  statusMutation.mutateAsync({ id: item.id, status: next }).then(() => {
    Message.success("操作成功");
  });
};

const handleCreate = (): void => {
  EditDrawerRef.value?.show();
};

const handleEdit = (params: MemberPermission | string): void => {
  EditDrawerRef.value?.show(params);
};

const toolbarActions = computed(() => createMemberPermissionToolbarActions(handleCreate));

const rowActionsOf = (
  item: MemberPermissionTreeNodeVO,
): Array<InTableAction<MemberPermissionTreeNodeVO>> =>
  createMemberPermissionRowActions(item, {
    onDetail: handleEdit,
    onAddChild: (row) => handleEdit(row.id!),
    onToggleStatus: handleToggleStatus,
  });

const privateOnColumnChange = (value: string[]): void => {
  selectedColumnProps.value = value;
};

onMounted(() => {
  refreshData();
});
</script>
