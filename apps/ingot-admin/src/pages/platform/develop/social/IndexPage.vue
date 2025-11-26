<template>
  <in-filter-container>
    <template #header>
      <in-filter-item>
        <in-with-label title="社交名称">
          <el-input
            v-model="paging.condition.name"
            class="item"
            clearable
            style="width: 200px"
            placeholder="请输入社交名称"
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
      <template #toolbar>
        <in-button type="primary" @click="handleCreate"> 添加配置 </in-button>
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
        <common-status-button
          :status="item.status"
          text
          link
          @click="confirmStatus.exec(item.id, item.status, `社交信息(${item.name})`, '操作成功')"
        ></common-status-button>
        <in-button
          type="danger"
          text
          link
          @click="confirmDelete.exec(item.id, `是否删除社交信息(${item.clientId})`, '删除成功')"
        >
          <template #icon>
            <i-ep:delete />
          </template>
          删除
        </in-button>
      </template>
    </in-table>
  </in-filter-container>

  <EditDialog ref="editDialog" @success="refreshData" />
</template>
<script lang="ts" setup>
import type { SysSocialDetails } from "@/models";
import { tableHeaders } from "./table";
import EditDialog from "./components/EditDialog.vue";
import type { API as EditDialogAPI } from "./components/EditDialog.vue";
import type { TableAPI } from "@/components/table";
import { SocialPageAPI, UpdateSocialAPI, RemoveSocialAPI } from "@/api/platform/dev/social";

const editDialog = ref<EditDialogAPI>();
const tableRef = ref<TableAPI>();
const paging = usePaging(transformPageAPI(SocialPageAPI));
const confirmStatus = useConfirmStatus(transformUpdateAPI(UpdateSocialAPI), paging.exec);
const confirmDelete = useConfirmDelete(transformDeleteAPI(RemoveSocialAPI), paging.exec);

const refreshData = () => {
  paging.exec();
};

const handleCreate = (): void => {
  editDialog.value?.show();
};

const handleEdit = (params: SysSocialDetails): void => {
  editDialog.value?.show(params);
};

onMounted(() => {
  refreshData();
});
</script>
