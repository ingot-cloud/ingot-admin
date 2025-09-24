<template>
  <in-filter-container>
    <template #header>
      <ContactsTabs select-tab="部门" />
    </template>

    <in-table
      :data="deptTree"
      :headers="tableHeaders"
      ref="tableRef"
      :expandRowKeys="expandRowKeys"
      @refresh="fetchData"
    >
      <template #title>
        <div>{{ userInforStore.getCurrentOrg?.name }}</div>
      </template>
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
import ContactsTabs from "@/pages/org/contacts/components/ContactsTabs.vue";
import { tableHeaders } from "./table";
import type { DeptWithManagerVO } from "@/models";
import { useDeptStore } from "@/stores/modules/org/dept";
import { useUserInfoStore } from "@/stores/modules/auth";
import EditDrawer from "./components/EditDrawer.vue";

const loading = ref(false);
const userInforStore = useUserInfoStore();
const deptStore = useDeptStore();
const { deptTree } = storeToRefs(deptStore);
const expandRowKeys = ref<Array<string>>([]);

const EditDrawerRef = ref();

const fetchData = () => {
  loading.value = true;
  deptStore
    .fetchDeptTree()
    .then((data) => {
      loading.value = false;
      if (data && data.length > 0 && expandRowKeys.value.length === 0) {
        expandRowKeys.value = [data[0].id!];
      }
    })
    .catch(() => {
      loading.value = false;
    });
};

const confirmDelete = useConfirmDelete(deptStore.removeDept, fetchData);

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
