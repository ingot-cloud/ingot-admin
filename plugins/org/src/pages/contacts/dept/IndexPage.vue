<template>
  <in-page-frame mode="contained" surface="workspace">
    <template #header>
      <in-page-header />
    </template>

    <in-split-layout>
    <in-table
      :loading="deptQuery.isFetching.value"
      :data="deptTree"
      :headers="tableHeaders"
      ref="tableRef"
      :expandRowKeys="expandRowKeys"
      @refresh="privateRefresh"
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
        <in-button type="danger" text link v-if="!item.mainFlag" @click="handleRemove(item)">
          <template #icon>
            <i-ep:delete />
          </template>
          删除
        </in-button>
        <in-icon v-if="item.mainFlag" name="mingcute:department-line" />
      </template>
    </in-table>
    </in-split-layout>
  </in-page-frame>

  <EditDrawer ref="EditDrawerRef" :selectData="deptTree" @success="privateRefresh" />
</template>
<script lang="ts" setup>
import { tableHeaders } from "./table";
import type { DeptTreeNodeWithManagerVO } from "@/models";
import { RemoveDeptAPI } from "@/api/org/dept";
import { OrgDeptTreeQueryOptions, orgDeptQueryKeys } from "@/api/org/dept.query";
import { Confirm, Message, silentQueryRequest, useUserInfoStore } from "@ingot/admin-core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import EditDrawer from "./components/EditDrawer.vue";

const userInforStore = useUserInfoStore();
const queryClient = useQueryClient();
const deptQuery = useQuery(() => OrgDeptTreeQueryOptions());
const deptTree = computed(() => deptQuery.data.value ?? []);
const expandRowKeys = ref<Array<string>>([]);

watch(
  deptTree,
  (data) => {
    if (data.length > 0 && expandRowKeys.value.length === 0) {
      expandRowKeys.value = [data[0].id!];
    }
  },
  { immediate: true },
);

const EditDrawerRef = ref();

const removeMutation = useMutation({
  mutationFn: (id: string) => RemoveDeptAPI(id, silentQueryRequest()),
  onSuccess: () => {
    void queryClient.invalidateQueries({ queryKey: orgDeptQueryKeys.all });
  },
});

const privateRefresh = (): void => {
  void queryClient.invalidateQueries({ queryKey: orgDeptQueryKeys.all });
};

const handleRemove = (item: DeptTreeNodeWithManagerVO): void => {
  if (!item.id) {
    return;
  }
  Confirm.warning(`是否删除部门(${item.name})`).then(() => {
    removeMutation.mutateAsync(item.id!).then(() => {
      Message.success("删除成功");
    });
  });
};

const handleEdit = (data?: DeptTreeNodeWithManagerVO | string) => {
  EditDrawerRef.value.show(data || deptTree.value[0].id);
};
</script>
