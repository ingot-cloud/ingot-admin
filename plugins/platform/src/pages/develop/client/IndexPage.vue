<template>
  <in-page-frame mode="contained" surface="workspace">
    <template #header>
      <in-page-header description="管理 OAuth 客户端。" />
    </template>

    <in-split-layout>
      <template #top>
        <in-filter-item>
          <in-with-label title="客户端ID">
            <el-input
              v-model="condition.clientId"
              class="w-200px"
              clearable
              placeholder="请输入客户端ID"
            />
          </in-with-label>
          <template #rightActions>
            <in-button @click="resetFilter">重置</in-button>
            <in-button type="primary" :loading="loading" @in-click="() => fetchData()">搜索</in-button>
          </template>
        </in-filter-item>
      </template>

      <in-table
        :loading="loading"
        :data="pageInfo.records"
        :headers="visibleHeaders"
        :page="pageInfo"
        :table-id="CLIENT_TABLE_ID"
        density="compact"
        @handleSizeChange="fetchData"
        @handleCurrentChange="fetchData"
      >
        <template #summary>共 {{ pageInfo.total ?? 0 }} 个</template>
        <template #tools-start>
          <in-table-column-setting
            :headers="tableHeaders"
            :table-id="CLIENT_TABLE_ID"
            @change="privateOnColumnChange"
          />
        </template>
        <template #tools-end>
          <in-table-actions variant="toolbar" :actions="toolbarActions" :row="toolbarRow" />
        </template>
        <template #requireProofKey="{ item }">
          <el-tag :type="item.requireProofKey ? 'primary' : 'danger'">
            {{ item.requireProofKey ? "是" : "否" }}
          </el-tag>
        </template>
        <template #accessTokenTimeToLive="{ item }">
          <el-tag> {{ item.accessTokenTimeToLive }}秒 </el-tag>
        </template>
        <template #tokenAuthType="{ item }">
          <in-tag :value="tokenAuthMethodEnum.getTagText(item.tokenAuthType)" />
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

  <EditDrawer ref="EditDrawerRef" @success="invalidateList" />
</template>

<script setup lang="ts">
import { applyColumnSelection, type InTableAction, useServerPaging } from "@ingot/admin-core";
import type { OAuth2RegisteredClient } from "@/models";
import { useTokenAuthMethodEnum } from "@/models/enums";
import { ClientPageQueryOptions, clientQueryKeys } from "@/api/platform/dev/client.query";
import { useQueryClient } from "@tanstack/vue-query";
import EditDrawer from "./EditDrawer.vue";
import {
  CLIENT_TABLE_ID,
  createClientRowActions,
  createClientToolbarActions,
  tableHeaders,
} from "./table";

const queryClient = useQueryClient();
const tokenAuthMethodEnum = useTokenAuthMethodEnum();
const { condition, pageInfo, fetching, fetchData, resetSubmitted } = useServerPaging<
  OAuth2RegisteredClient,
  OAuth2RegisteredClient
>({
  queryOptions: ClientPageQueryOptions,
});
const loading = fetching;
const EditDrawerRef = ref();
const selectedColumnProps = ref<string[]>([]);
const toolbarRow: OAuth2RegisteredClient = {};

const visibleHeaders = computed(() =>
  applyColumnSelection(tableHeaders, selectedColumnProps.value),
);

const resetFilter = (): void => {
  resetSubmitted({ clientId: undefined } as OAuth2RegisteredClient);
};

const invalidateList = (): void => {
  void queryClient.invalidateQueries({ queryKey: clientQueryKeys.lists() });
};

const handleDetails = (item: OAuth2RegisteredClient): void => {
  EditDrawerRef.value?.show(item);
};

const handleCreate = (): void => {
  EditDrawerRef.value?.show();
};

const toolbarActions = computed(() => createClientToolbarActions(handleCreate));

const rowActionsOf = (item: OAuth2RegisteredClient): Array<InTableAction<OAuth2RegisteredClient>> =>
  createClientRowActions(item, {
    onDetail: handleDetails,
  });

const privateOnColumnChange = (value: string[]): void => {
  selectedColumnProps.value = value;
};
</script>
