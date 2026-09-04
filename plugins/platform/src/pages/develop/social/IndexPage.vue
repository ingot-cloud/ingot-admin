<template>
  <in-filter-container>
    <template #header>
      <in-filter-item>
        <in-with-label title="社交名称">
          <el-input
            v-model="condition.name"
            class="item"
            clearable
            style="width: 200px"
            placeholder="请输入社交名称"
          ></el-input>
        </in-with-label>
        <template #rightActions>
          <in-button @click="resetFilter">重置</in-button>
          <in-button type="primary" @in-click="fetchData" :loading="loading">搜索</in-button>
        </template>
      </in-filter-item>
    </template>
    <in-table
      :loading="loading"
      :data="pageInfo.records"
      :page="pageInfo"
      :headers="tableHeaders"
      @handleSizeChange="fetchData"
      @handleCurrentChange="fetchData"
      @refresh="fetchData"
    >
      <template #toolbar>
        <in-button type="primary" @click="handleCreate">添加配置</in-button>
      </template>
      <template #status="{ item }">
        <common-status-tag :status="item.status"></common-status-tag>
      </template>
      <template #actions="{ item }">
        <in-button type="primary" text link @click="handleEdit(item)">
          <template #icon>
            <i-ep:edit />
          </template>
          编辑
        </in-button>
        <common-status-button text link :status="item.status" @click="privateOnStatusChange(item)" />
        <in-button type="danger" text link @click="privateOnRemove(item)">
          <template #icon>
            <i-ep:delete />
          </template>
          删除
        </in-button>
      </template>
    </in-table>
  </in-filter-container>

  <EditDialog ref="editDialog" @success="invalidateList" />
</template>
<script lang="ts" setup>
import type { SysSocialDetails } from "@/models";
import type { CommonStatus } from "@/models/enums";
import {
  getCommonStatusActionDesc,
  getCommonStatusToggle,
} from "@/models/enums";
import { tableHeaders } from "./table";
import EditDialog from "./components/EditDialog.vue";
import type { API as EditDialogAPI } from "./components/EditDialog.vue";
import { UpdateSocialAPI, RemoveSocialAPI } from "@/api/platform/dev/social";
import { SocialPageQueryOptions, socialQueryKeys } from "@/api/platform/dev/social.query";
import {
  invalidateQueriesByKeys,
  silentQueryRequest,
  useServerPaging,
} from "@ingot/admin-core";
import { useMutation, useQueryClient } from "@tanstack/vue-query";

const queryClient = useQueryClient();
const { condition, pageInfo, fetching, fetchData, resetSubmitted } = useServerPaging<
  SysSocialDetails,
  SysSocialDetails
>({
  queryOptions: SocialPageQueryOptions,
});
const loading = fetching;
const message = useMessage();
const confirm = useMessageConfirm();
const editDialog = ref<EditDialogAPI>();

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

const resetFilter = (): void => {
  resetSubmitted({ name: undefined } as SysSocialDetails);
};

const handleCreate = (): void => {
  editDialog.value?.show();
};

const handleEdit = (params: SysSocialDetails): void => {
  editDialog.value?.show(params);
};

const privateOnStatusChange = (item: SysSocialDetails): void => {
  const next = getCommonStatusToggle(item.status as CommonStatus);
  confirm.warning(`是否${getCommonStatusActionDesc(next)}社交信息(${item.name})`).then(() => {
    statusMutation.mutateAsync({ id: item.id!, status: next }).then(() => {
      message.success("操作成功");
    });
  });
};

const privateOnRemove = (item: SysSocialDetails): void => {
  confirm.warning(`是否删除社交信息(${item.name})`).then(() => {
    removeMutation.mutateAsync(item.id!).then(() => {
      message.success("删除成功");
    });
  });
};
</script>
