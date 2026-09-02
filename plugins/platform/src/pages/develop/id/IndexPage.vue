<template>
  <in-filter-container>
    <template #header>
      <in-filter-item>
        <in-with-label title="业务标签">
          <el-input
            v-model="paging.condition.bizTag"
            class="item"
            clearable
            style="width: 200px"
            placeholder="请输入业务标签"
          ></el-input>
        </in-with-label>
        <template #rightActions>
          <in-button @click="paging.condition.bizTag = undefined"> 重置 </in-button>
          <in-button type="primary" @in-click="refreshData" :loading="paging.loading.value">
            搜索
          </in-button>
        </template>
      </in-filter-item>
    </template>
    <in-table
      :loading="paging.loading.value"
      :data="paging.pageInfo.records"
      :page="paging.pageInfo"
      ref="tableRef"
      :headers="tableHeaders"
      @handleSizeChange="paging.exec"
      @handleCurrentChange="paging.exec"
      @refresh="refreshData"
    >
      <template #toolbar>
        <in-button type="primary" @click="handleCreate"> 添加业务ID </in-button>
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

  <EditDrawer ref="EditDrawerRef" @success="refreshData" />
</template>
<script lang="ts" setup>
import type { BizLeafAlloc } from "@/models";
import { tableHeaders } from "./table";
import EditDrawer from "./components/EditDrawer.vue";
import { IdPageAPI } from "@/api/platform/dev/id";

const EditDrawerRef = ref();
const paging = usePaging(transformPageAPI(IdPageAPI));

const refreshData = () => {
  paging.exec();
};

const handleCreate = (): void => {
  EditDrawerRef.value?.show();
};

const handleEdit = (params: BizLeafAlloc): void => {
  EditDrawerRef.value?.show(params);
};

onMounted(() => {
  refreshData();
});
</script>
