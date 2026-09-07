<template>
  <in-page-frame mode="contained" surface="workspace">
    <template #header>
      <in-page-header description="配置社交登录应用。" />
    </template>

    <in-split-layout>
      <in-table
        :loading="loading"
        :data="pageInfo.records"
        :page="pageInfo"
        :headers="visibleHeaders"
        :table-id="SOCIAL_TABLE_ID"
        density="compact"
        @handleSizeChange="fetchData"
        @handleCurrentChange="fetchData"
      >
        <template #summary>共 {{ pageInfo.total ?? 0 }} 个</template>
        <template #tools-start>
          <el-input
            v-model="condition.name"
            class="w-200px!"
            clearable
            placeholder="搜索社交名"
            :prefix-icon="Search"
            @keyup.enter="privateOnSearch"
            @clear="privateOnSearch"
          />
          <in-table-column-setting
            :headers="tableHeaders"
            :table-id="SOCIAL_TABLE_ID"
            @change="privateOnColumnChange"
          />
        </template>
        <template #tools-end>
          <in-table-actions variant="toolbar" :actions="toolbarActions" :row="toolbarRow" />
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

  <EditDialog ref="editDialog" @success="invalidateList" />
</template>

<script setup lang="ts">
import { applyColumnSelection, type InTableAction } from "@ingot/admin-core";
import type { SysSocialDetails } from "@/models";
import { Search } from "@element-plus/icons-vue";
import type { CommonStatus } from "@/models/enums";
import { getCommonStatusToggle } from "@/models/enums";
import {
  SOCIAL_TABLE_ID,
  createSocialRowActions,
  createSocialToolbarActions,
  tableHeaders,
} from "./table";
import EditDialog from "./components/EditDialog.vue";
import type { API as EditDialogAPI } from "./components/EditDialog.vue";
import { UpdateSocialAPI, RemoveSocialAPI } from "@/api/platform/dev/social";
import { SocialPageQueryOptions, socialQueryKeys } from "@/api/platform/dev/social.query";
import { invalidateQueriesByKeys, silentQueryRequest, useServerPaging } from "@ingot/admin-core";
import { useMutation, useQueryClient } from "@tanstack/vue-query";

const queryClient = useQueryClient();
const { condition, pageInfo, fetching, fetchData } = useServerPaging<
  SysSocialDetails,
  SysSocialDetails
>({
  queryOptions: SocialPageQueryOptions,
});
const loading = fetching;
const message = useMessage();
const editDialog = ref<EditDialogAPI>();
const selectedColumnProps = ref<string[]>([]);
const toolbarRow: SysSocialDetails = {};

const visibleHeaders = computed(() =>
  applyColumnSelection(tableHeaders, selectedColumnProps.value),
);

const invalidateList = (): void => {
  void queryClient.invalidateQueries({ queryKey: socialQueryKeys.lists() });
};

const statusMutation = useMutation({
  mutationFn: (vars: { id: string; status: CommonStatus }) =>
    UpdateSocialAPI({ id: vars.id, status: vars.status }, silentQueryRequest()),
  onSuccess: () => invalidateQueriesByKeys(queryClient, [socialQueryKeys.lists()]),
});

const removeMutation = useMutation({
  mutationFn: (id: string) => RemoveSocialAPI(id, silentQueryRequest()),
  onSuccess: () => invalidateQueriesByKeys(queryClient, [socialQueryKeys.lists()]),
});

const privateOnSearch = (): void => {
  fetchData();
};

const handleCreate = (): void => {
  editDialog.value?.show();
};

const handleEdit = (params: SysSocialDetails): void => {
  editDialog.value?.show(params);
};

const privateOnStatusChange = (item: SysSocialDetails): void => {
  if (!item.id || !item.status) {
    return;
  }
  const next = getCommonStatusToggle(item.status);
  statusMutation.mutateAsync({ id: item.id, status: next }).then(() => {
    message.success("操作成功");
  });
};

const privateOnRemove = (item: SysSocialDetails): void => {
  if (!item.id) {
    return;
  }
  removeMutation.mutateAsync(item.id).then(() => {
    message.success("删除成功");
  });
};

const toolbarActions = computed(() => createSocialToolbarActions(handleCreate));

const rowActionsOf = (item: SysSocialDetails): Array<InTableAction<SysSocialDetails>> =>
  createSocialRowActions(item, {
    onEdit: handleEdit,
    onToggleStatus: privateOnStatusChange,
    onRemove: privateOnRemove,
  });

const privateOnColumnChange = (value: string[]): void => {
  selectedColumnProps.value = value;
};
</script>
