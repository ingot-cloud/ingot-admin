<template>
  <in-filter-container>
    <template #header>
      <in-filter-item>
        <in-with-label title="业务标签">
          <el-input
            v-model="condition.bizTag"
            class="item"
            clearable
            style="width: 200px"
            placeholder="请输入业务标签"
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
        <in-button type="primary" @click="handleCreate">添加业务ID</in-button>
      </template>
      <template #bizTag="{ item }">
        <in-copy-tag :text="item.bizTag" />
      </template>
      <template #actions="{ item }">
        <in-button type="primary" text link @click="handleEdit(item)">
          <template #icon>
            <i-ep:edit />
          </template>
          编辑
        </in-button>
      </template>
    </in-table>
  </in-filter-container>

  <EditDrawer ref="EditDrawerRef" @success="invalidateList" />
</template>
<script lang="ts" setup>
import type { BizLeafAlloc } from "@/models";
import { tableHeaders } from "./table";
import EditDrawer from "./components/EditDrawer.vue";
import { IdPageQueryOptions, idQueryKeys } from "@/api/platform/dev/id.query";
import { useServerPaging } from "@ingot/admin-core";
import { useQueryClient } from "@tanstack/vue-query";

const queryClient = useQueryClient();
const { condition, pageInfo, fetching, fetchData, resetSubmitted } = useServerPaging<
  BizLeafAlloc,
  BizLeafAlloc
>({
  queryOptions: IdPageQueryOptions,
});
const loading = fetching;
const EditDrawerRef = ref();

const resetFilter = (): void => {
  resetSubmitted({ bizTag: undefined } as BizLeafAlloc);
};

const invalidateList = (): void => {
  void queryClient.invalidateQueries({ queryKey: idQueryKeys.lists() });
};

const handleCreate = (): void => {
  EditDrawerRef.value?.show();
};

const handleEdit = (params: BizLeafAlloc): void => {
  EditDrawerRef.value?.show(params);
};
</script>
