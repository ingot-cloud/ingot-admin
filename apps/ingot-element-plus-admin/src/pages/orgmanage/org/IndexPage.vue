<template>
  <in-filter-container>
    <template #header>
      <in-filter-item>
        <in-with-label title="组织名称">
          <el-input
            v-model="paging.condition.name"
            class="item"
            clearable
            style="width: 200px"
            placeholder="请输入组织名称"
          ></el-input>
        </in-with-label>
        <template #rightActions>
          <in-button @click="paging.condition.name = undefined"> 重置 </in-button>
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
      <template #title> 组织管理 </template>
      <template #toolbar>
        <in-button type="primary" @click="handleCreate"> 添加组织 </in-button>
      </template>
      <template #name="{ item }">
        <div flex flex-row items-center gap-2>
          <el-image v-if="item.avatar" class="w-30px h-30px" :src="item.avatar" fit="cover" />
          <in-button text link @click="handleEdit(item)">
            {{ item.name }}
          </in-button>
        </div>
      </template>
      <template #code="{ item }">
        <in-copy-tag :text="item.code" />
      </template>
      <template #startAt="{ item }">
        <div v-if="item.startAt">
          <el-tag>{{ item.startAt }} - {{ item.endAt }}</el-tag>
        </div>
        <el-tag v-else>无限期</el-tag>
      </template>
      <template #status="{ item }">
        <common-status-tag :status="item.status"></common-status-tag>
      </template>
      <template #actions="{ item }">
        <in-button type="primary" text link @click="handleEdit(item)">
          <template #icon>
            <i-mdi:card-account-details-outline />
          </template>
          详情
        </in-button>
        <common-status-button
          :status="item.status"
          text
          link
          @click="confirmStatus.exec(item.id, item.status, `组织(${item.name})`, '操作成功')"
        />
      </template>
    </in-table>
  </in-filter-container>

  <EditDrawer ref="EditDrawerRef" @success="refreshData" />
  <CreateDrawer ref="CreateDrawerRef" @success="refreshData" />
</template>
<script lang="ts" setup>
import type { SysTenant } from "@/models";
import { tableHeaders } from "./table";
import EditDrawer from "./components/EditDrawer.vue";
import { useTenantStore } from "@/stores/modules/tenant";
import CreateDrawer from "./components/CreateDrawer.vue";

const CreateDrawerRef = ref();
const EditDrawerRef = ref();

const tenantStore = useTenantStore();
const paging = usePaging(transformPageAPI(tenantStore.fetchTenantPage));
const confirmStatus = useConfirmStatus(tenantStore.updateTenant, paging.exec);

const refreshData = () => {
  paging.exec();
};

const handleCreate = (): void => {
  CreateDrawerRef.value?.show();
};

const handleEdit = (params: SysTenant): void => {
  EditDrawerRef.value?.show(params);
};

onMounted(() => {
  refreshData();
});
</script>
