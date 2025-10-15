<template>
  <in-filter-container>
    <in-table
      :data="deptTree"
      :headers="tableHeaders"
      ref="tableRef"
      :expandRowKeys="expandRowKeys"
      @refresh="fetchData"
    >
      <template #title>
        <div>部门管理</div>
      </template>
      <template #subtitle> 预设组织默认部门，创建新组织时生效 </template>
      <template #toolbar>
        <in-button type="primary" @click="handleEdit()"> 添加部门 </in-button>
      </template>
      <template #name="{ item }">
        <in-button :disabled="item.mainFlag" link text @click="handleEdit(item)">
          {{ item.name }}
        </in-button>
      </template>
      <template #managerUsers="{ item }">
        <div flex flex-row gap-2 flex-wrap v-if="item.managerUsers && item.managerUsers.length > 0">
          <el-tag v-for="(it, index) in item.managerUsers" type="primary" :key="index">
            {{ it.nickname }}
          </el-tag>
        </div>
        <el-tag v-else type="info"> 暂无 </el-tag>
      </template>
      <template #status="{ item }">
        <common-status-tag :status="item.status" />
      </template>
      <template #actions="{ item }">
        <in-button v-if="!item.mainFlag" type="primary" text link @click="handleEdit(item.id)">
          <template #icon>
            <i-carbon:parent-child />
          </template>
          添加部门
        </in-button>
        <in-button v-if="!item.mainFlag" type="primary" text link @click="handleEdit(item)">
          <template #icon>
            <i-ep:edit />
          </template>
          编辑
        </in-button>
        <in-button
          type="danger"
          text
          link
          v-if="!item.mainFlag"
          @click="confirmDelete.exec(item.id, `是否删除部门(${item.name})`, '删除成功')"
        >
          <template #icon>
            <i-ep:delete />
          </template>
          删除
        </in-button>
        <in-icon v-if="item.mainFlag" name="mingcute:department-line" />
      </template>
    </in-table>
  </in-filter-container>

  <EditDrawer ref="EditDrawerRef" :selectData="deptTree" @success="fetchData" />
</template>
<script lang="ts" setup>
import { tableHeaders } from "./table";
import type { DeptWithManagerVO, DeptTreeNode } from "@/models";
import { DeptTreeAPI, RemoveDeptAPI } from "@/api/basic/dept";
import EditDrawer from "./components/EditDrawer.vue";

const loading = ref(false);
const deptTree = ref<Array<DeptTreeNode>>([]);
const expandRowKeys = ref<Array<string>>([]);

const EditDrawerRef = ref();

const fetchData = () => {
  loading.value = true;
  DeptTreeAPI()
    .then((response) => {
      const data = response.data;
      deptTree.value = data;
      loading.value = false;
      if (data && data.length > 0 && expandRowKeys.value.length === 0) {
        expandRowKeys.value = [data[0].id!];
      }
    })
    .catch(() => {
      loading.value = false;
    });
};

const removeAPI = (id: string) => {
  return new Promise<void>((resolve, reject) => {
    RemoveDeptAPI(id)
      .then(() => {
        resolve();
      })
      .catch(() => {
        reject();
      });
  });
};
const confirmDelete = useConfirmDelete(removeAPI, fetchData);

const handleEdit = (data?: DeptWithManagerVO | string) => {
  EditDrawerRef.value.show(data || deptTree.value[0].id);
};

onMounted(() => {
  fetchData();
});
</script>
<style scoped lang="postcss">
:deep(.in-filter-container-header) {
  padding: 0 !important;
}
</style>
