<template>
  <in-filter-container>
    <template #header>
      <div flex flex-row justify-between>
        <in-with-label title="客户端ID">
          <el-input
            v-model="condition.clientId"
            clearable
            style="width: 180px"
            placeholder="请输入客户端ID"
          ></el-input>
        </in-with-label>
        <div>
          <in-button @click="resetFilter">重置</in-button>
          <in-button type="primary" :loading="loading" @in-click="fetchData">搜索</in-button>
        </div>
      </div>
    </template>
    <in-table
      stripe
      :loading="loading"
      :data="pageInfo.records"
      :headers="tableHeaders"
      :page="pageInfo"
      @handleSizeChange="fetchData"
      @handleCurrentChange="fetchData"
      @refresh="fetchData"
    >
      <template #toolbar>
        <in-button type="primary" @click="handleCreate()">添加客户端</in-button>
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
        <common-status-tag :status="item.status" />
      </template>
      <template #actions="{ item }">
        <in-button type="primary" text link @click="handleDetails(item)">
          <template #icon>
            <in-icon name="bx:detail" />
          </template>
          详情
        </in-button>
      </template>
    </in-table>
  </in-filter-container>
  <EditDrawer ref="EditDrawerRef" @success="invalidateList" />
</template>
<script lang="ts" setup>
import { tableHeaders } from "./table";
import type { OAuth2RegisteredClient } from "@/models";
import { useTokenAuthMethodEnum } from "@/models/enums";
import { ClientPageQueryOptions, clientQueryKeys } from "@/api/platform/dev/client.query";
import { useServerPaging } from "@ingot/admin-core";
import { useQueryClient } from "@tanstack/vue-query";
import EditDrawer from "./EditDrawer.vue";

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

const resetFilter = (): void => {
  resetSubmitted({ clientId: undefined } as OAuth2RegisteredClient);
};

const invalidateList = (): void => {
  void queryClient.invalidateQueries({ queryKey: clientQueryKeys.lists() });
};

const handleDetails = (item: OAuth2RegisteredClient): void => {
  EditDrawerRef.value?.show(item);
};
const handleCreate = () => {
  EditDrawerRef.value?.show();
};
</script>
